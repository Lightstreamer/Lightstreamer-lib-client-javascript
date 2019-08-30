import Executor from "../../src-tool/Executor";
import BrowserDetection from "../../src-tool/BrowserDetection";
import ASSERT from "../../src-test/ASSERT";
import LoggerManager from "../../src-log/LoggerManager";
import Helpers from "../../src-tool/Helpers";
import RequestsHelper from "./RequestsHelper";
import MadTester from "./MadTester";
import WebSocketConnection from "../net/WebSocketConnection";
import SessionHTTP from "./SessionHTTP";
import SessionWS from "./SessionWS";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import Global from "../Global";
import PushEvents from "./PushEvents";
import ControlRequest from "../control/ControlRequest";
import Constants from "../Constants";
import SlowingHandler from "./SlowingHandler";
import ControlConnectionHandler from "../control/ControlConnectionHandler";
import SendMessageHandler from "../control/SendMessageHandler";
import EvalQueue from "./EvalQueue";
import Utils from "../Utils";
import Assertions from "../utils/Assertions";
  
  var _OFF = 1;
  var STREAMING_WS = 2;
  var SWITCHING_STREAMING_WS = 3;
  var POLLING_WS = 4;
  var SWITCHING_POLLING_WS = 5;
  var STREAMING_HTTP = 6;
  var SWITCHING_STREAMING_HTTP = 7;
  var POLLING_HTTP = 8;
  var SWITCHING_POLLING_HTTP = 9;
  var END = 10;
  
  //frozen is used if a status can't change transport because the setForcedTransport simply specified WS or HTTP 
  var FROZEN = "_";
  var NOT_FROZEN = "";
  
  function toStr(_type){
    switch(_type) {
      case _OFF:
        return "No session";
      case STREAMING_WS:
        return "WS Streaming";
      case SWITCHING_STREAMING_WS:
        return "prepare WS Streaming";
      case POLLING_WS:
        return "WS Polling";
      case SWITCHING_POLLING_WS:
        return "prepare WS Polling";
      case STREAMING_HTTP:
        return "HTTP Streaming";
      case SWITCHING_STREAMING_HTTP:
        return "prepare HTTP Streaming";
      case POLLING_HTTP:
        return "HTTP Polling";
      case SWITCHING_POLLING_HTTP:
        return "prepare HTTP Polling";
      case END:
        return "Shutting down";
    }
  }
  
  var CREATE_FALLS = {};
  CREATE_FALLS[STREAMING_WS] = SWITCHING_STREAMING_HTTP;
  CREATE_FALLS[STREAMING_HTTP] = SWITCHING_POLLING_HTTP;
  CREATE_FALLS[POLLING_WS] = SWITCHING_STREAMING_WS;
  CREATE_FALLS[POLLING_HTTP] = SWITCHING_STREAMING_WS;
  
  CREATE_FALLS[FROZEN+STREAMING_WS] = SWITCHING_STREAMING_WS; 
  CREATE_FALLS[FROZEN+STREAMING_HTTP] = SWITCHING_POLLING_HTTP; 
  CREATE_FALLS[FROZEN+POLLING_WS] = SWITCHING_STREAMING_WS; 
  CREATE_FALLS[FROZEN+POLLING_HTTP] = SWITCHING_STREAMING_HTTP;
  
  //NOTE, Polling HTTP actually never gives up http://goo.gl/81k22
  var GIVEUP_FALLS = {};
  GIVEUP_FALLS[STREAMING_WS] = SWITCHING_STREAMING_HTTP;
  GIVEUP_FALLS[STREAMING_HTTP] = SWITCHING_POLLING_HTTP;
  GIVEUP_FALLS[POLLING_WS] = SWITCHING_STREAMING_WS;
  GIVEUP_FALLS[POLLING_HTTP] = SWITCHING_STREAMING_WS;
  
  GIVEUP_FALLS[FROZEN+STREAMING_WS] = SWITCHING_STREAMING_WS;
  GIVEUP_FALLS[FROZEN+STREAMING_HTTP] = SWITCHING_POLLING_HTTP;
  GIVEUP_FALLS[FROZEN+POLLING_WS] = SWITCHING_STREAMING_WS;
  GIVEUP_FALLS[FROZEN+POLLING_HTTP] = SWITCHING_POLLING_HTTP;
  
  var FROZEN_CHECK = {};
  FROZEN_CHECK[STREAMING_WS] = SWITCHING_STREAMING_WS;
  FROZEN_CHECK[STREAMING_HTTP] = SWITCHING_STREAMING_HTTP;
  FROZEN_CHECK[POLLING_WS] = SWITCHING_POLLING_WS;
  FROZEN_CHECK[POLLING_HTTP] = SWITCHING_POLLING_HTTP;
  
  
  
  var SLOW_FALLS = {};
  SLOW_FALLS[STREAMING_WS] = SWITCHING_POLLING_WS;
  SLOW_FALLS[STREAMING_HTTP] = SWITCHING_POLLING_HTTP;
  //a slow command can be issued while we're switching (while we wait for the loop command)
  SLOW_FALLS[SWITCHING_STREAMING_HTTP] = SWITCHING_POLLING_HTTP;
  SLOW_FALLS[SWITCHING_POLLING_HTTP] = SWITCHING_POLLING_HTTP;
  //it's still not possible during SWITCHING_STREAMING_WS (unless we manually ask to switch) 
  //and during SWITCHING_POLLING_WS (unless we manually ask to switch we only switch to polling ws because
  //of a slowing so that a second call is not possible because of the isSlowRequired check.) 
  
  var SWITCHING_STATUSES = {};
  SWITCHING_STATUSES[SWITCHING_STREAMING_WS] = true;
  SWITCHING_STATUSES[SWITCHING_POLLING_WS] = true;
  SWITCHING_STATUSES[SWITCHING_STREAMING_HTTP] = true;
  SWITCHING_STATUSES[SWITCHING_POLLING_HTTP] = true;
  
  var STREAMING_SESSION = false;
  var POLLING_SESSION = true;
  var WS_SESSION = false;
  var HTTP_SESSION = true;
  
  var AVOID_SWITCH = true;
  var NO_RECOVERY = true;
  var YES_RECOVERY = false;
  
  var protocolLogger = LoggerManager.getLoggerProxy(Constants.PROTOCOL);
  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);
  
  var objectIdCounter = 1;
  
  var SessionHandler = function(owner,ppHandler,mpnManager) {
    this.objectId = objectIdCounter++;
    if (sessionLogger.isDebugLogEnabled()) {
        sessionLogger.logDebug("New session handler oid=", this.objectId);
    }
    this.status = _OFF;
    this.statusPhase = 0;
    this.session = null;
    
    this.clientIP = null;
    
    this.frozen = NOT_FROZEN;
    
    this.owner = owner;
    
    this.pushPagesHandler = ppHandler;
    this.policyBean = owner._policy;
    this.connectionBean = owner._connection;
    this.engineId =  owner.getEngineId();
    
    this.slowing = new SlowingHandler(this.policyBean,this.engineId);
    this.pEvents = new PushEvents(this.engineId,ppHandler);
    
    EnvironmentStatus.addUnloadHandler(this);
    
    this.exportForceReload();
    
    this.disableXSXHRTime = null;
        
    this.controlHandler = new ControlConnectionHandler(this,owner._policy,this.engineId,false);
    this.sendMessageHandler = new SendMessageHandler(this.controlHandler,this.pushPagesHandler,this.policyBean);
    
    this.mpnManager = mpnManager;
    
    /**
     * Counts the bind_session requests following the corresponding create_session.
     */
    this.nBindAfterCreate = 0;
  };

  SessionHandler.prototype = {
    
      /*private*/ exportForceReload: function() {
        var that = this;
        
        Global.exportGlobal(this.engineId,"LS_forceReload",function() {
          if (that.session) {
            that.session.onErrorEvent("server.exit",{closedOnServer: true});
          }
        });
      },
      
      /*private*/ changeStatus: function(newStatus) {
        if (sessionLogger.isDebugLogEnabled()) {
            sessionLogger.logDebug("SessionManager state change:", toStr(this.status), "->", toStr(newStatus));
        }
        this.status = newStatus;
        this.statusPhase++;
      },
      
////////////////////////////////////////////////API CALLS
      

      /*public*/ closeSession: function(fromAPI,reason,noRecoveryScheduled) {
        if (this.status == _OFF || this.status == END) {
          return;
        }
        
        if (this.session) {
          this.session.closeSession(fromAPI?"api":reason,false,noRecoveryScheduled);
        }
      },
      
      disconnectAndReconnect: function() {
          if (this.status == _OFF || this.status == END) {
              return;
          }
          if (this.session) {
              this.session.disconnectAndReconnect();
          }
      },

      syncErrorOnControl: function() {
        if (this.status == _OFF || this.status == END) {
          return;
        }

        if (this.session) {
          this.session.onSyncError("control.syncerror");
        }
      },

      /*private*/ isAlive: function() {
        return this.status != _OFF && this.status != END;
      },
      
      changeTransport: function(fromAPI, isTransportForced, isComboForced, isPolling, isHTTP) {
          if (this.session != null && this.session.isActive()) {
              /*
               * the session is active: send a force_rebind
               */
              this.createOrSwitchSession(fromAPI, isTransportForced, isComboForced, isPolling, isHTTP);
          } else {
              /*
               * the session is not active (i.e. TRYING-RECOVERY or WILL-RETRY):
               * await that the client is connected and then bind the session with the new transport
               */
              var nextPH = isPolling ? (isHTTP ? SWITCHING_POLLING_HTTP : SWITCHING_POLLING_WS) : (isHTTP ? SWITCHING_STREAMING_HTTP : SWITCHING_STREAMING_WS);
              this.status = nextPH;
              this.session.switchRequired = true;
          }
      },
      
      retry: function(handlerPhase, retryCause, forced, serverBusy) {
          if (handlerPhase != this.statusPhase) {
              return;
          }
          
          var strOrPoll = this.status === STREAMING_WS || this.status === STREAMING_HTTP ? STREAMING_SESSION : POLLING_SESSION;
          var wsOrHttp = this.status === STREAMING_WS || this.status === POLLING_WS ? WS_SESSION : HTTP_SESSION;
          
          this.createSession(false,this.frozen,forced,strOrPoll,wsOrHttp,retryCause,serverBusy);
      },
      
      /*public*/ createOrSwitchSession: function(fromAPI,isTransportForced,isComboForced,isPolling,isHTTP,_reason,avoidSwitch) {
        
        if (!avoidSwitch && this.isAlive()) {
          this.switchSession(fromAPI,isTransportForced,isComboForced,isPolling,isHTTP,_reason);
        } else {
          this.createSession(fromAPI,isTransportForced,isComboForced,isPolling,isHTTP,_reason,false/*serverBusy*/);
        }
        
      },
      
      switchSession: function(fromAPI,isTransportForced,isComboForced,isPolling,isHTTP,_reason) {
          if (fromAPI) {
              MadTester.init();
          }
            
          this.disableCorsCheck();
            
          var reason = fromAPI?"api":_reason;
            
          this.frozen = isTransportForced ? FROZEN : NOT_FROZEN;
            
          var nextPH = isPolling ? (isHTTP ? SWITCHING_POLLING_HTTP : SWITCHING_POLLING_WS) : (isHTTP ? SWITCHING_STREAMING_HTTP : SWITCHING_STREAMING_WS);
          this.changeStatus(nextPH);
          this.startSwitchTimeout(reason);
          this.session.requestSwitch(this.statusPhase,reason,isComboForced);
      },
      
      createSession: function(fromAPI,isTransportForced,isComboForced,isPolling,isHTTP,_reason,serverBusy) {
          if (fromAPI) {
              MadTester.init();
          }

          this.disableCorsCheck();

          var reason = fromAPI?"api":_reason;

          this.frozen = isTransportForced ? FROZEN : NOT_FROZEN;

          //there is no session active or we want to start from scratch
          
          this.resetControlHandlers();
          
          var currSessionId = this.session ? this.session.getSessionId() : null;
          
          reason = "new."+reason;
          this.closeSession(false,reason,YES_RECOVERY);
          
          var nextPH = isPolling ? (isHTTP ? POLLING_HTTP : POLLING_WS) : (isHTTP ? STREAMING_HTTP : STREAMING_WS);
          this.changeStatus(nextPH);

          this.prepareNewSessionInstance(isPolling,isComboForced,isHTTP);
          
          this.session.createSession(currSessionId,reason,serverBusy);
      },
      
      /*private*/ prepareNewSessionInstance: function(isPolling,isForced,isHTTP,prevSession,sessionRecovery) {
        var skipCors = this.disableXSXHRTime !== null;
        var chosenClass = isHTTP ? SessionHTTP : SessionWS;
        if (sessionRecovery) {
            /*
             * Check added to avoid a bug in HTTP polling.
             * When a poll fails, we must not disable CORS
             * because the error can be recoverable.
             */
            skipCors = false;
        }
        this.session = new chosenClass(
        		isPolling,
        		isForced,
        		this,
        		this.statusPhase,
        		prevSession,
        		skipCors,
        		sessionRecovery,
        		this.mpnManager);
        if (prevSession) {
          prevSession.shutdown();//close it without killing the session, the new session is taking its place
        }
        this.slowing.changeSession(this.session);
        if (this.evalQueue) {
          this.evalQueue.changeSession(this.session);
        }
        this.pEvents.changeSession(this.session);
        
      },
      
      /*private*/ bindSession: function(isForced,isPolling,isHTTP,switchCause) {
        var nextPH = isPolling ? (isHTTP ? POLLING_HTTP : POLLING_WS) : (isHTTP ? STREAMING_HTTP : STREAMING_WS);
        this.changeStatus(nextPH);
        
        this.prepareNewSessionInstance(isPolling,isForced,isHTTP,this.session);
        
        this.session.bindSession(switchCause);       
      },
      
      /*public*/ recoverSession: function(ph,switchCause,forced) {
          sessionLogger.logDebug("Session recovery", switchCause);
          if (ph != this.statusPhase) {
              sessionLogger.logDebug("Session recovery: cancelled");
              return;
          }
          
          /* 
           * Since this is a recovery, we keep the same transport we had before the network error
           * (FROZEN_CHECK makes a transition from a transport to itself).
           */
          var switchType = FROZEN_CHECK[this.status] || this.status;
          var isPolling = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_STREAMING_HTTP ? STREAMING_SESSION : POLLING_SESSION;
          var isHTTP = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_POLLING_WS ? WS_SESSION : HTTP_SESSION;
          var nextPH = isPolling ? (isHTTP ? POLLING_HTTP : POLLING_WS) : (isHTTP ? STREAMING_HTTP : STREAMING_WS);
          this.changeStatus(nextPH);
          
		  this.prepareNewSessionInstance(isPolling,forced,isHTTP,this.session,true);
          this.session.recoverSession();
      },
      
      shouldGiveUpTrying: function() {
        //if is frozen (i.e. forced transport, not forced method) and the next connection is gonna try is the same 
        //as the last just tried.
        return this.frozen == FROZEN && FROZEN_CHECK[this.status] == GIVEUP_FALLS[this.frozen+this.status]; //switchType
      },
      
      //AKA request switch
      onSessionGivesUp: function(ph,reason,stop) {
        if (ph != this.statusPhase) {
          return;
        } else if (stop) {
          //we can't go on this way
          //but we don't want to go on in any other way
          //so stop everything and go home
          sessionLogger.logInfo("Can't initiate session, giving up, disabling automatic reconnections");
          
          this.changeStatus(_OFF);
          return;
        }
        
        var switchType = GIVEUP_FALLS[this.status] || this.status;
        if (switchType == SWITCHING_STREAMING_HTTP && BrowserDetection.isProbablyEdge()) {
            /*
             * HTTP streaming is broken in Edge. 
             * The browser notifies to the client only a piece of the bind_session response sent by the server
             * causing a timeout and a change of transport.
             * See https://organizza.5pmweb.com/?def=1&task=2742
             */
            switchType = SWITCHING_POLLING_HTTP;
        }
        
        sessionLogger.logInfo("Unable to establish session of the current type. Switching session type", toStr(this.status),toStr(switchType));
        
        if (switchType == _OFF || switchType == END) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected fallback type; switching because the current session type cannot be established");
          return;
        }
        
        this.changeStatus(switchType);
        
        this.startSwitchTimeout(reason);
        this.session.requestSwitch(this.statusPhase,reason,false);
        
      },
      
      onSlowRequired: function(ph) {
        if (ph != this.statusPhase) {
          return;
        }
        
        //redundant as session checks itself before calling the handler
        /*if (this.session.isSlowRequired()) {
          //nothing to do
          return;
        }*/
        
        var switchType = SLOW_FALLS[this.status];
        
        sessionLogger.logInfo("Slow session detected. Switching session type", toStr(this.status),toStr(switchType));
        
        if(!switchType) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected fallback type; switching because of a slow connection was detected", toStr(this.status), this.session);
          return;
        }
        this.changeStatus(switchType);
        
        this.startSwitchTimeout("slow");
        this.session.requestSlow(this.statusPhase);
        
      },
      
      createMachine: function(ph,switchCause,forced) {
        if (ph != this.statusPhase) {
          return;
        }
        
        var switchType = CREATE_FALLS[this.frozen+this.status] || this.status;
        sessionLogger.logInfo("Setting up new session type", toStr(this.status),toStr(switchType));
        
        if (switchType == _OFF || switchType == END) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected fallback type switching with new session");
          return;
        }
        
        var strOrPoll = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_STREAMING_HTTP ? STREAMING_SESSION : POLLING_SESSION;
        var wsOrHttp = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_POLLING_WS ? WS_SESSION : HTTP_SESSION;
         
        //if we enter the createMachine the status of the session is unknown, so we can't recover by switching so 
        //we ask to AVOID_SWITCH
        this.createOrSwitchSession(false,this.frozen==FROZEN,forced,strOrPoll,wsOrHttp,switchCause,AVOID_SWITCH);
        
      },
      
      switchMachine: function(ph,switchCause,forced) {
        if (ph != this.statusPhase) {
          return;
        }
        
        var switchType = this.status;
        sessionLogger.logInfo("Switching current session type", toStr(this.status));
        
        if (!SWITCHING_STATUSES[switchType]) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected fallback type switching with a force rebind");
          return;
        }
        
        var strOrPoll = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_STREAMING_HTTP ? STREAMING_SESSION : POLLING_SESSION;
        var wsOrHttp = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_POLLING_WS ? WS_SESSION : HTTP_SESSION;
         
        this.bindSession(forced,strOrPoll,wsOrHttp,switchCause);
        
      },
      
      slowMachine: function(ph) {
        sessionLogger.logInfo("Slow session switching");
        this.switchMachine(ph,"slow",false);      
      },
      
      switchTimeout: function(ph,reason) {
        if (ph != this.statusPhase) {
          return;
        }
        
        
        var switchType = this.status;
        
        sessionLogger.logInfo("Failed to switch session type. Starting new session", toStr(this.status));
        
        if (!SWITCHING_STATUSES[switchType]) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected fallback type switching because of a failed force rebind");
          return;
        }
        
        reason = "switch.timeout."+reason;
        
        var strOrPoll = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_STREAMING_HTTP ? STREAMING_SESSION : POLLING_SESSION;
        var wsOrHttp = switchType == SWITCHING_STREAMING_WS || switchType == SWITCHING_POLLING_WS ? WS_SESSION : HTTP_SESSION;
         
        this.createOrSwitchSession(false,this.frozen==FROZEN,false,strOrPoll,wsOrHttp,reason,AVOID_SWITCH);
        
      },
      
      startSwitchTimeout: function(reason) {
        var _timeout = this.policyBean.switchCheckTimeout + (this.slowing.getDelay()||0);
       
        Executor.addTimedTask(this.switchTimeout,_timeout,this,[this.statusPhase,reason]);
      },
      
////////////////////////////////////////////////////CONTROL
      
      /*private*/ resetControlHandlers: function() {
        //le richieste di controllo devono essere tutte riproposte.
        //Elimino quelle accumulate finora.
        this.controlHandler._reset();
        
        // riazzero lo stato delle sendMessage;
        // sulla nuova sessione dovranno ripartire da 0
        this.sendMessageHandler._close();
        
      },
      
      /*public*/ connectionsEnableFlagsChanged: function() {
        var skipCors = this.disableXSXHRTime !== null;
        if (this.session) {
          this.session.resetConnectionList(skipCors);
        }
        if (this.controlHandler) {
          this.controlHandler.resetConnectionList(skipCors);
        }
      },
      
      /*public*/ onCorsError: function(ph) {
        if (ph != this.statusPhase) {
          return;
        }
        /*
		 * 23/05/2018
		 * Never disable Cross-origin feature
		 */
        //this.disableXSXHRTime = Helpers.getTimeStamp();
        this.connectionsEnableFlagsChanged();
      },
      
      /*private*/ disableCorsCheck: function() {
        if (this.disableXSXHRTime === null) {
          return;
        }
        var diff = Helpers.getTimeStamp() - this.disableXSXHRTime;
        if (diff > 1000) {
          this.disableXSXHRTime = null;
          this.connectionsEnableFlagsChanged();
        }
      },
      
////////////////////////////////////////////////GETTERS
      
      isSessionOpen: function() {
        return !this.session ? null : this.session.isOpen();
      },
      
      isSessionOpenOrRecovering: function() {
        return !this.session ? null : this.session.isOpen() || this.session.isRecovering();
      },
      
      getHighLevelStatus: function() {
        return !this.session ? Constants.DISCONNECTED : this.session.getHighLevelStatus();
      },
      
      getSessionHost: function() {
        return !this.session ? null : this.session.getSessionHost();
      },
      
      /*public*/ getPushServerAddress: function() {
        return !this.session ? this.connectionBean.serverAddress : this.session.getPushServerAddress();
      },
      
      getSessionId: function() {
        return !this.session ? null : this.session.getSessionId();
      },
      
      /*public*/ getPolicyBean: function() {
        return this.policyBean;
      },
      
      /*public*/ getConnectionBean: function() {
        return this.connectionBean;
      },
      
      /*public*/ getSlowing: function() {
        return this.slowing;
      },
      
      /*public*/ getEvalQueue: function() {
        if (!this.evalQueue || !this.evalQueue.stillValid()) {
            this.evalQueue = new EvalQueue(this.engineId);
            this.evalQueue.changeSession(this.session);
        }
        return this.evalQueue;
      },
      
      /* public */ dispose: function() {
        if (this.evalQueue) {
          this.evalQueue.dispose();
        }
        EnvironmentStatus.removeUnloadHandler(this);
      },
      
      unloadEvent: function() {
        this.closeSession(false,"unload",NO_RECOVERY);
        this.changeStatus(END);
      },
      
      /*public*/ getControlConnectionHandler: function() {
        return this.controlHandler;
      },
      
      getEngineId: function() {
        return this.engineId;
      },
      
////////////////////////////////////////////////PUSH EVENTS 

      statusChanged: function(ph) {
        if (ph != this.statusPhase) {
          return;
        }
        
        this.owner.notifyLSStatus();
      },
      
      /*public*/ onSessionStart: function(requestLimitLength) {
        sessionLogger.logInfo("Session started",this.session);
        
        this.onChangeRequestLimitLength(requestLimitLength);
        
        this.sendMessageHandler.activate();
        
        this.owner.onSessionStart();
        
        this.handleReverseHeartbeat(false);
        
        this.nBindAfterCreate = 0;
      },
      
      onChangeRequestLimitLength: function(requestLimitLength) {
          if (requestLimitLength) {
              this.controlHandler.setRequestLimit(requestLimitLength);
          }
      },
      
      /*public*/ onSessionBound: function() {
          if (this.nBindAfterCreate == 0) {
              /*
               * The check is needed to distinguish a true change of session (i.e. a new session id)
               * from a change of transport preserving the session.
               * We are only interested in true change of session.
               */
              this.mpnManager.eventManager.onSessionStart();
          }
          this.nBindAfterCreate++;
      },
      
      /*public*/ onSessionClose: function(ph,noRecoveryScheduled) {
        if (ph != this.statusPhase) {
          return null;
        }
        
        sessionLogger.logDebug("Session closed",this.session);
        
        this.resetControlHandlers();
        this.owner.onSessionEnd();
        if(noRecoveryScheduled) {
          this.changeStatus(_OFF);
        } else {
          this.changeStatus(this.status);//so that the statusPhase changes
        }
        
        this.mpnManager.eventManager.onSessionClose(! noRecoveryScheduled);
        
        return this.statusPhase;
      },

      /*public*/ onUpdateReceived: function(args,snap) {
        // table number which this update is related to is in args[0]
        this.pushPagesHandler.onSubscriptionEvent(args[0]);
        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(args[0]);
        
        if (!ppHandler) {
          protocolLogger.logDebug("Discarding update for dismissed page",this);
          return;
        }
        
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received new update",args);
        }
        ppHandler.onUpdate(args,snap);
      },
      
      
      
      /*public*/ onLostUpdatesEvent: function(args) {
        this.pushPagesHandler.onSubscriptionEvent(args[0]);
        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(args[0]);
        if (!ppHandler) {
          //we used to call the deletes here, but when a page disappears its delete are 
          //automatically sent so we can just return
          protocolLogger.logDebug("Discarding lost updates notification for dismissed page",this);
          return;
        }
        
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received lost updates event",args);
        }
        
        
        //send the overflow to the page
        ppHandler.onLostUpdates(args[0],args[1],args[2]);
        
      },
      
      /*public*/ onEndOfSnapshotEvent: function(args) {
        this.pushPagesHandler.onSubscriptionEvent(args[0]);
        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(args[0]);
        if (!ppHandler) {
          //we used to call the deletes here, but when a page disappears its delete are 
          //automatically sent so we can just return
          protocolLogger.logDebug("Discarding end of snapshot notification for dismissed page",this);
          return;
        }
        
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received end of snapshot event",args);
        }
        
        ppHandler.onEndOfSnapshot(args[0],args[1]);
      },
      
      /*public*/ onClearSnapshotEvent: function(args) {
        this.pushPagesHandler.onSubscriptionEvent(args[0]);
        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(args[0]);
        if (!ppHandler) {
          //we used to call the deletes here, but when a page disappears its delete are 
          //automatically sent so we can just return
          protocolLogger.logDebug("Discarding snapshot clearing notification for dismissed page",this);
          return;
        }
        
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received snapshot clearing event",args);
        }
        
        ppHandler.onClearSnapshot(args[0],args[1]);
      },
      
      /*public*/ onServerError: function(flag,msg) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received server error event",flag,msg);
        }
        this.changeStatus(_OFF);
        this.pushPagesHandler.notifyServerError(flag,msg);
      },
      
      /*public*/ onTableError: function(tableCode,flag,msg) {

        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(tableCode);
        if (ppHandler) {
          if (protocolLogger.isDebugLogEnabled()) {
            protocolLogger.logDebug("Received subscription error event",tableCode,flag,msg);
          }
          ppHandler.onSubscriptionError(tableCode,flag,msg);
        } else {
          //we used to call the deletes here, but when a page disappears its delete are
          //automatically sent so we can just return
          protocolLogger.logDebug("Discarding subscription error notification for dismissed page",this);
        }

        this.pushPagesHandler.onSubscriptionError(tableCode);


    },
      
      /*public*/ onUnsubscription: function(tableCode) {
        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(tableCode);
        if (ppHandler) {
          if (protocolLogger.isDebugLogEnabled()) {
            protocolLogger.logDebug("Received unsubscription event",tableCode);
          }

          ppHandler.onUnsubscription(tableCode);
        } else {
          //we used to call the deletes here, but when a page disappears its delete are
          //automatically sent so we can just return
          protocolLogger.logDebug("Discarding unsubscription notification for dismissed page",this);
        }

        this.pushPagesHandler.onUnsubscription(tableCode);

      },
      
      /*public*/ onSubscriptionReconf: function(tableCode,ph,frequency) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received reconfiguration OK event",tableCode,ph,frequency);
        }
        
        this.pushPagesHandler.onSubscriptionReconfEvent(tableCode,ph);
        
        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(tableCode);
        if (ppHandler != null) {
            ppHandler.onSubscriptionReconf(tableCode, frequency);
        } else {
            protocolLogger.logWarn("Table of reconfiguration not found", tableCode);
        }
      },
      
      /*public*/ onSubscription: function(tableCode,numOfSubscribedItems,numOfSubscribedFields,keyPos,commandPos) {
        this.pushPagesHandler.onSubscription(tableCode);

        var ppHandler = this.pushPagesHandler.getPushPageHandlerFromTableNumber(tableCode);
        if (!ppHandler) {
          //we used to call the deletes here, but when a page disappears its delete are
          //automatically sent so we can just return
          protocolLogger.logDebug("Discarding subscription notification for dismissed page",this);
          return;
        }

        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received subscription event",tableCode,numOfSubscribedItems,numOfSubscribedFields,keyPos,commandPos);
        }

        ppHandler.onSubscription(tableCode,keyPos,commandPos,numOfSubscribedItems,numOfSubscribedFields);
      },
      
      /*public*/ onMessageAck: function(sequence,num) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received message ack",sequence,num);
        }
        
        this.sendMessageHandler.ack(sequence, num);
      },
      
      onMessageOk: function(sequence,num) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received message-ok notification",sequence,num);
        }
        
        this.sendMessageHandler._complete(sequence, num);
      },
      
      // <= 0 message rejected by the Metadata Adapter
      onMessageDeny: function(sequence,flag,msg,num) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received message-deny notification",sequence,num,flag,msg);
        }
        
        this.sendMessageHandler.notifyDenied(sequence,flag,num,msg);
      },
            
      // 38 message has not arrived in time (and perhaps never come)
      /*public*/ onMessageDiscarded: function(sequence,num) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received message-discarded notification",sequence,num);
        }
        
        this.sendMessageHandler.notifyDiscarded(sequence,num);
      },
      
      // 34 request deemed invalid by the Metadata Adapter
      // 35 unexpected error in message processing
      /*public*/ onMessageError: function(sequence,flag,msg,num) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Received message-error notification",sequence,num,flag,msg);
        }
        
         this.sendMessageHandler.notifyError(sequence,flag,num,msg);
      },
      
      onObsoleteControlLink: function(serverAddress) {
        // delete any links referring to the load balancer
        this.owner.onObsoleteControlLink(serverAddress);
      },
      
      onNewControlLink: function(serverAddress) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("New control link received",serverAddress);
        }
        this.owner.onNewControlLink(serverAddress);
      },

      onIPReceived: function(newIP) {
        if (this.clientIP && newIP != this.clientIP && WebSocketConnection.isDisabledClass()) {
          WebSocketConnection.restoreClass();
          this.createOrSwitchSession(false,this.frozen==FROZEN,false,false,false,"ip",false);
        }
        this.clientIP = newIP;
      },
      
      onServerKeepalive: function() {
          this.owner.onServerKeepalive();
      },
      
      
////////////////////////////////////////////////CONTROLS

      /*public*/ sendAMessage: function(msg, sequence, listener, delayTimeout) {
        this.sendMessageHandler._send(msg, sequence, listener, delayTimeout);
      },
      
      /*public*/ sendLog: function(msg,buildNum) {
        var query = RequestsHelper.getLogRequestParams(this.statusPhase,msg,buildNum);

        this.controlHandler.addRequest(null, query, ControlRequest.LOG, null);
      },
      
      /*public*/ changeBandwidth: function(newBw) {
        if (this.session) {
          this.session.changeBandwidth();
        }
      },
      
      /*public*/ sendSubscription: function(tableNum,addBody,ppHandler,retrying,tutor) {
        var requestListener = {
                onREQOK: function(LS_window) {
                    // nothing to do: expecting SUBOK
                },
                
                onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                    LS_window.LS_l(errorCode, phase, tableNum, errorMsg);
                }
        };
        this.controlHandler.addRequest(tableNum, addBody, ControlRequest.ADD, tutor, retrying, requestListener);
      },
      
      /*public*/ sendUnsubscription: function(tableNum,delBody,ppHandler,retrying,tutor) {
        this.controlHandler.addRequest(tableNum,delBody,ControlRequest.REMOVE, tutor, retrying);
      },
      
      /*public*/ sendSubscriptionChange: function(tableNum,changeBody,tutor) {
        this.controlHandler.addRequest(tableNum,changeBody,ControlRequest.CHANGE_SUB,tutor);
      },
      
      //not exactly part of this group, but close enough
      /*public*/ handleReverseHeartbeat: function(force) {
        if (this.session) {
          this.session.handleReverseHeartbeat(force);
        }
      },
      
      /**
       * Enqueues the response to a control request to the queue processing the message stream.
       */
      enqueueControlResponse: function (txtResponse) {
          var phase = (this.session == null ? null : this.session.push_phase);
          this.getEvalQueue()._enqueue(phase, txtResponse);
      },
      
      sendRegisterForMpn: function(mpnRegisterRequest, mpnRegisterTutor) {
          var that = this;
          var requestListener = {
                  onREQOK: function(LS_window) {
                	  mpnRegisterTutor.onResponse();
                  },
                  
                  onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                      mpnRegisterTutor.onResponse();
                	  if (that.session != null) {
                		  that.session.onMpnRegisterError(errorCode, errorMsg);
                	  }
                  }
          };
          var requestKey = mpnRegisterRequest.reqId;
          var retryOrHost = null;
          this.controlHandler.addRequest(
                  requestKey, 
                  mpnRegisterRequest.query, 
                  ControlRequest.MPN, 
                  mpnRegisterTutor, 
                  retryOrHost, 
                  requestListener);
      },
      
      sendMpnSubscription: function(mpnSubscribeRequest, mpnSubscribeTutor) {
          var that = this;
          var requestListener = {
                  onREQOK: function(LS_window) {
                      mpnSubscribeTutor.onResponse();
                  },
                  
                  onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                      mpnSubscribeTutor.onResponse();
                      if (that.session != null) {
                          that.session.onMpnSubscribeError(mpnSubscribeRequest.subscriptionId, errorCode, errorMsg);
                      }
                  }
          };
          var requestKey = mpnSubscribeRequest.reqId;
          var retryOrHost = null;
          this.controlHandler.addRequest(
                  requestKey, 
                  mpnSubscribeRequest.query, 
                  ControlRequest.MPN,
                  mpnSubscribeTutor, 
                  retryOrHost, 
                  requestListener);
      },
      
      sendMpnUnsubscription: function(mpnUnsubscribeRequest, mpnUnsubscribeTutor) {
          var that = this;
          var requestListener = {
                  onREQOK: function(LS_window) {
                      mpnUnsubscribeTutor.onResponse();
                  },
                  
                  onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                      mpnUnsubscribeTutor.onResponse();
                      if (that.session != null) {
                          that.session.onMpnUnsubscribeError(mpnUnsubscribeRequest.subscriptionId, errorCode, errorMsg);
                      }
                  }
          };
          var requestKey = mpnUnsubscribeRequest.reqId;
          var retryOrHost = null;
          this.controlHandler.addRequest(
                  requestKey, 
                  mpnUnsubscribeRequest.query, 
                  ControlRequest.MPN,
                  mpnUnsubscribeTutor, 
                  retryOrHost, 
                  requestListener);
      },
      
      sendMpnFilteredUnsubscription: function(mpnUnsubscribeFilterRequest, mpnUnsubscribeFilterTutor) {
          var that = this;
          var requestListener = {
                  onREQOK: function(LS_window) {
                      mpnUnsubscribeFilterTutor.onResponse();
                  },
                  
                  onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                      mpnUnsubscribeFilterTutor.onResponse();
                  }
          };
          var requestKey = mpnUnsubscribeFilterRequest.reqId;
          var retryOrHost = null;
          this.controlHandler.addRequest(
                  requestKey, 
                  mpnUnsubscribeFilterRequest.query, 
                  ControlRequest.MPN, 
                  mpnUnsubscribeFilterTutor, 
                  retryOrHost, 
                  requestListener);
      },
      
      /**
       * A non-recoverable error causing the closing of the session.
       */
      onFatalError: function(error) {
          sessionLogger.logError("Fatal error: ", error.stack || error);
          if (this.session) {
              this.session.onFatalError(61, "Internal error: " + error);
          }
      }
      
  };

  
  SessionHandler.prototype["unloadEvent"] = SessionHandler.prototype.unloadEvent;


  export default SessionHandler;


