import StandardHandler from "../cross-tab/StandardHandler";
import CallDefinition from "../cross-tab/CallDefinition";
import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
import Executor from "../../src-tool/Executor";

  var simple = CallDefinition.simple;
  var simpleWithSession = CallDefinition.session;
  //var simpleWithResponse = CallDefinition.simpleWithResponse;
  var simpleWithResponseAndTimeout = CallDefinition.simpleWithResponseAndTimeout;
  var sessionWithResponse = CallDefinition.sessionWithResponse;

  var methods = {
    onClientConfigurationChange: simple,
    callConnect: simpleWithSession,
    callDisconnect: simpleWithSession,
    pong: simpleWithResponseAndTimeout,
    subscribeTable: sessionWithResponse,
    unsubscribeTable: simpleWithSession,
    updateSubscriptionParams: simpleWithSession,
    forwardMessage: simpleWithSession,
    forwardLog: simple,
    clientDeath: simple,
    callDisconnectAndReconnect: simpleWithSession
  };
  
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);

  var NewEngineHandler = function (client) {
    this.client = client;
    this.sessionAlive = false;
    this.sessionPhase = -1;
    this.engineId = null;
    this.engineType = "local";
  };

  NewEngineHandler.methods = methods;

  NewEngineHandler.prototype = {

    setPushPageHandler: function(pushpageHandler) {
      this.target = pushpageHandler; //for direct communication
    },

    setEngineId: function(id) {
      sharingLogger.logInfo("New engine created", this.engineType, id);
      this.engineId = id;
    },

    getEngineId: function() {
      return this.engineId;
    },

    dispose: function() {
      this.client = null;
      //future calls will get an exception that will cause an onPushPageLost event in the PushPage collection if remote
    },

    setSessionPhase: function(ph) {
      this.sessionPhase = ph;
    },

    isSessionAlive: function() {
      return this.sessionAlive;
    },

//calls from pushpage handler

    onEngineConfigurationChange: function(objClass,prop,val) {
      var toSet = objClass == "ConnectionDetails" ? this.client._connection : (objClass == "ConnectionOptions" ? this.client._policy : this.client._configuration);
      toSet.simpleSetter(prop, val);
    },

    onSessionEnd: function(ph) {
      if (this.sessionAlive) {
        this.sessionEnd(ph);
      }
    },

    sessionEnd: function(ph) {
      this.sessionPhase = ph;
      this.sessionAlive = false;
      this.client.sessionEnd();
    },

    onSessionStart: function(ph) {
      this.sessionPhase = ph;
      this.sessionAlive = true;
      this.client.sessionStart();
    },

    /**
     * @param noHopeToAttachToAnotherEngine if true, the client must not try to attach to another engine
     */
    onEngineDeath: function(suiciding, noHopeToAttachToAnotherEngine) {
        sharingLogger.logInfo("Engine", this.engineId + " is dead");
        if (this.client) {
            this.sessionEnd(-1);
            this.client.engineMourningRoom(suiciding, noHopeToAttachToAnotherEngine);          
        }
    },

    checkDeath: function() {
      var that = this;
      this.pong()["then"](function() {
        //if didn't fail we're ok
      },function() {
        if (that.client) {
          that.onEngineDeath();
        }
      });
    },

    onEngineDying: function() {
      //there is the possibility that the engine is dead,
      //but also a resurrection is possible
      //so first check right now if the engine is still there
      this.checkDeath();
      //then check in 1 second
      Executor.addTimedTask(this.checkDeath,1000,this);
    },

    onServerError: function(flag,msg) {
      this.client.serverError(flag,msg)
    },

    onStatusChange: function(newStatus) {
      this.client.cacheEngineStatus(newStatus);
    },

    onSubscription: function(tableCode,keyPos,commandPos,numOfSubscribedItems,numOfSubscribedFields) {
      this.client.getTablesHandler().subscriptionEvent(tableCode,keyPos,commandPos,numOfSubscribedItems,numOfSubscribedFields);
    },

    onSubscriptionError: function(tableCode,code,msg) {
      this.client.getTablesHandler().errorEvent(tableCode,code,msg);
    },

    onUnsubscription: function(tableCode) {
      this.client.getTablesHandler().unsubscriptionEvent(tableCode);
    },

    onEndOfSnapshot: function(tableCode,item) {
      this.client.getTablesHandler().onEndOfSnapshotEvent(tableCode,item);
    },

    onUpdate: function(args,snap) {
      this.client.getTablesHandler().updatePage(args,snap);
    },

    onLostUpdates: function(tableCode,item,losts) {
      this.client.getTablesHandler().onLostUpdatesEvent(tableCode,item,losts);
    },

    onClearSnapshot: function(tableCode,item) {
      this.client.getTablesHandler().onClearSnapshotEvent(tableCode,item);
    },

    onMessageDiscarded: function(prog) {
      this.client.getMessageProxy().messageDiscarded(prog);
    },

    onMessageDenied: function(prog,_code,msg) {
      this.client.getMessageProxy().messageDenied(prog, _code, msg);
    },

    onMessageError: function(prog,_code,msg) {
      this.client.getMessageProxy().messageError(prog, _code, msg);
    },

    onMessageComplete: function(prog) {
      this.client.getMessageProxy().messageComplete(prog);
    },

    onMessageOnNetwork: function(prog) {
      this.client.getMessageProxy().messageOnNetwork(prog);
    },

    ping: function() {
      if(this.client === null) {
        throw "net";
      }
      return true;
    },

    onServerKeepalive: function() {
        this.client.onServerKeepalive();
    },
    
    onSubscriptionReconf: function(tableCode, frequency) {
        this.client.getTablesHandler().doSubscriptionReconf(tableCode, frequency);
    }

  };

  for (var i in methods) {
    NewEngineHandler.prototype[i] = StandardHandler.createCaller(i,methods[i])
  }

  export default NewEngineHandler;

