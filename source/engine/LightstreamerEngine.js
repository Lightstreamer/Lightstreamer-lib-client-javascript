
import Global from "../Global";
import Constants from "../Constants";
import LoggerManager from "../../src-log/LoggerManager";
import Configuration from "../beans/Configuration";
import ConnectionDetails from "../beans/ConnectionDetails";
import ConnectionOptions from "../beans/ConnectionOptions";
import PushPageCollectionHandler from "./PushPageCollectionHandler";
import SessionHandler from "./SessionHandler";
import ControlRequest from "../control/ControlRequest";
import Executor from "../../src-tool/Executor";
import NewPushPageHandler from "./NewPushPageHandler";
import Helpers from "../../src-tool/Helpers";
  
  //THIS CLASS IMPLEMENTS BeanParent

  var idPivot = Helpers.randomG();
  
  var buildNum = Constants.BUILD;
  if (isNaN(buildNum)) {
    buildNum = 0;
  }
  
  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);
  
  var LightstreamerEngine = function(conf,options,details,sharing,engineHandler,dontDieFor,mpnManager) {

    this._configuration = new Configuration(conf);
    this._configuration.setBroadcaster(this,true);

    this._connection = new ConnectionDetails(details);
    this._connection.setBroadcaster(this,true);
    
    this._policy = new ConnectionOptions(options);
    this._policy.setBroadcaster(this,true);

    this.lastStatus = null;

    this.pushPages = new PushPageCollectionHandler(this,this._configuration,this._connection,this._policy);
    if (sharing && sharing.isPossible()) {
      this.sharedStatus = sharing.createSharedStatus(this,Executor.packTask(this.dispose,this),dontDieFor);
      var bridge = this.sharedStatus.getBridge();
      if (bridge != null) {
        this.channels = sharing.createChannelsManager(this, bridge);
        this.channels.addListener(this.pushPages);
      }
      this.id = this.sharedStatus.getId();
    } else {
      this.sharedStatus = null;
      do {
        this.id = "NS" + (idPivot++);
      } while(Global.hasGlobal(this.id,'lsEngine'));
    }

    Global.exportGlobal(this.id,'lsEngine',this);

    this.sessionHandler = new SessionHandler(
    		this,
    		this.pushPages,
    		mpnManager);

    this.bindLocalClient(engineHandler,Constants.MAIN_CLIENT);

    //restore the status now
    if (this._configuration.connectionRequested) {
      this.doConnect();
    }
   
  };
  
  LightstreamerEngine.prototype = {


    toString: function() {
      return "[LightstreamerEngine "+this.id+"]";
    },

    bindLocalClient: function(eHandler,name) {
      if (!name) {
        name = "LOCAL"+idPivot++;
      }

      var ppHandler = new NewPushPageHandler(this,name);
      ppHandler.setEngineHandler(eHandler);
      eHandler.setPushPageHandler(ppHandler);

      this.pushPages.onNewPushPage(name,ppHandler);
    },

    getEngineId: function() {
      return this.id;
    },

    /*public*/ isSessionOpen: function() {
      return this.sessionHandler.isSessionOpen();
    },
    
    /*public*/ isSessionOpenOrRecovering: function() {
        return this.sessionHandler.isSessionOpenOrRecovering();
    },

    getSharedStatus: function() {
      return this.sharedStatus;
    },

    getSessionPhase: function() {
      return this.pushPages.getSessionPhase();
    },

    onSessionEnd: function() {
      this.pushPages.onSessionEnd();
    },
    onSessionStart: function() {
      this.pushPages.onSessionStart();
    },

    dispose: function() {

      this.sessionHandler.closeSession(false,"suicide",true);
      this.sessionHandler.dispose();

      Global.cleanAllGlobals(this.id); //no one should be able to find me now

      if (this.sharedStatus) {
        this.sharedStatus.dispose();
      }

      this.pushPages.notifyEngineDeath(true);
      this.pushPages.dispose();

      if (this.channels) {
        this.channels.dispose();
      }

    },

    doDisconnect: function() {
      sessionLogger.logInfo("Dismissing current session and stopping automatic reconnections.");

      this._configuration.simpleSetter('connectionRequested',false);

      this.sessionHandler.closeSession(true,"api",true);
    },
    
    doDisconnectAndReconnect: function() {
        this._configuration.simpleSetter('connectionRequested',false);
        this.sessionHandler.disconnectAndReconnect();
    },
    
    doChangeTransport: function() {
        var ft = this._policy.forcedTransport;
        sessionLogger.logInfo("Transport change requested", ft);
        if (ft === null) {
            var fromAPI = true;
            var isTransportForced = false;
            var isComboForced = false;
            var isPolling = false;
            var isHTTP = false;
            this.sessionHandler.changeTransport(fromAPI, isTransportForced, isComboForced, isPolling, isHTTP);
        } else {
            var fromAPI = true;
            var isTransportForced = ft == Constants.WS_ALL || ft == Constants.HTTP_ALL;
            var isComboForced = !isTransportForced;
            var isPolling = ft == Constants.WS_POLLING || ft == Constants.HTTP_POLLING;
            var isHTTP = ft == Constants.HTTP_POLLING || ft == Constants.HTTP_STREAMING || ft == Constants.HTTP_ALL;
            this.sessionHandler.changeTransport(fromAPI, isTransportForced, isComboForced, isPolling, isHTTP);
        }
    },


    doConnect: function() {
      sessionLogger.logInfo("Opening a new session and starting automatic reconnections.");

      this._configuration.simpleSetter('connectionRequested',true);

      var ft = this._policy.forcedTransport;
      if (ft === null) {
        //fromAPI,isTransportForced,isComboForced,isPolling,isHTTP,_reason,avoidSwitch
        this.sessionHandler.createOrSwitchSession(true,false,false,false,false);

      } else {
        this.doConnectForced(ft);
      }
    },

    doConnectForced: function(ft) {
      var isPolling = ft == Constants.WS_POLLING || ft == Constants.HTTP_POLLING;
      var isHTTP = ft == Constants.HTTP_POLLING || ft == Constants.HTTP_STREAMING || ft == Constants.HTTP_ALL;
      var isTransportForced = ft == Constants.WS_ALL || ft == Constants.HTTP_ALL;
      var isComboForced = !isTransportForced;

      //fromAPI,isTransportForced,isComboForced,isPolling,isHTTP,_reason,avoidSwitch
      this.sessionHandler.createOrSwitchSession(true,isTransportForced,isComboForced,isPolling,isHTTP);
    },

    broadcastSetting: function(objClass,prop,val) {
      this.pushPages.forEachPushPage(function(pp) {
        pp.onEngineConfigurationChange(objClass,prop,val);
      });

      if (prop == "requestedMaxBandwidth") {
        //broadcast to the server too
        this.sessionHandler.changeBandwidth(val);
      } else if (prop == "forcedTransport") {

        if (this._configuration.connectionRequested) {
            this.doChangeTransport();
        }

      } else if (prop == "reverseHeartbeatInterval") {
        //change heartbeat handling
        this.sessionHandler.handleReverseHeartbeat(false);
      } else if (prop == "corsXHREnabled" || prop == "xDomainStreamingEnabled") {
        this.sessionHandler.connectionsEnableFlagsChanged();
      }

      return true;
    },

    onObsoleteControlLink: function(serverAddress) {
      if(this.sharedStatus) {
        this.sharedStatus.removeConnectionToServerFlag(serverAddress);
      }
    },

    onNewControlLink: function(serverAddress) {
      if(this.sharedStatus) {
        this.sharedStatus.addConnectionToServerFlag(serverAddress);
      }
    },

    getStatus: function() {
      return this.sessionHandler.getHighLevelStatus();
      // but the pushpage proxies will not need this remote call (they cache state as it changes)
    },

    notifyLSStatus: function() {
      var newStatus = this.getStatus();
      if (this.lastStatus == newStatus) {
        return;
      }

      var oldStatus = this.lastStatus;
      this.lastStatus = newStatus;

      this.pushPages.notifyNewStatus(newStatus,oldStatus);

      //NOTE: this is only called to do a favor to the test
      if (this.onStatusChange) {
        this.onStatusChange(newStatus);
      }

    },


    sendAMessage: function(msg, sequence, listener, delayTimeout) {
      // NOTE: in spite of what is documented,
      // the proxy on the pushpage will not pass a pointer to the listener,
      // but an object containing the necessary information
      var cs = this.getStatus();
      if (cs == Constants.DISCONNECTED || cs == Constants.WILL_RETRY) {
        return false;
        // but the return value is not sent back to the proxy;
        // the case is rare, because the state check has just been done on the proxy;
        // the message is not sent, but it is as if it was sent and not received,
        // which is consistent, since the session is closing;
        // in this case, it is the pushpage that notifies the listener
      }

      this.sessionHandler.sendAMessage(msg, sequence, listener, delayTimeout);

      return true;
    },

    sendLog: function(msg) {
      this.sessionHandler.sendLog(msg,buildNum);

      return true;
    },


    subscribe: function(pageId,body) {
      return this.pushPages.handleTable(pageId,body);
    },

    unsubscribe: function(tableNum) {
      this.pushPages.removeTable(tableNum);
    },

    updateSubscriptionParams: function(tableNum,changingParams) {
      this.pushPages.updateSubscriptionParams(tableNum,changingParams);
    },



    checkClientHealth: function() {
      this.pushPages.cleanThread();
    },
    
    onServerKeepalive: function() {
        this.pushPages.onServerKeepalive();
    },
    
    sendRegisterForMpn: function(mpnRegisterRequest, mpnRegisterTutor) {
        this.sessionHandler.sendRegisterForMpn(mpnRegisterRequest, mpnRegisterTutor);
    },
    
    sendMpnSubscription: function(mpnSubscribeRequest, mpnSubscribeTutor) {
        this.sessionHandler.sendMpnSubscription(mpnSubscribeRequest, mpnSubscribeTutor);
    },
    
    sendMpnUnsubscription: function(mpnUnsubscribeRequest, mpnUnsubscribeTutor) {
        this.sessionHandler.sendMpnUnsubscription(mpnUnsubscribeRequest, mpnUnsubscribeTutor);
    },
    
    sendMpnFilteredUnsubscription: function(mpnUnsubscribeFilterRequest, mpnUnsubscribeFilterTutor) {
        this.sessionHandler.sendMpnFilteredUnsubscription(mpnUnsubscribeFilterRequest, mpnUnsubscribeFilterTutor);
    },
    
    /**
     * A non-recoverable error causing the closing of the session.
     */
    onFatalError: function(error) {
        this.sessionHandler.onFatalError(error);
    }
    
  };
  
  
  export default LightstreamerEngine;
  

