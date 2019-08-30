import Inheritance from "../../src-tool/Inheritance";
import NewEngineHandler from "./NewEngineHandler";
import ChanneledHandler from "../cross-tab/ChanneledHandler";
import Constants from "../Constants";
import Executor from "../../src-tool/Executor";
import LoggerManager from "../../src-log/LoggerManager";

  var disposeName;
  for(var i in  {dispose:true}) {
    disposeName=i;
  }
  
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);

  var READY_TIMEOUT = 2000;

  var NewEngineHandlerRemote = function (client,bridge) {
    this._callSuperConstructor(NewEngineHandlerRemote,[client]);
    this.engineType = "remote";
    this.initChannel(bridge,Constants.MASTER);
    this.verifyBridge(bridge);
  };

  NewEngineHandlerRemote.prototype = {
    verifyBridge: function(bridge) {

      //if the worker is dead we get a new worker and thus become the master, that's bad
      //so we have to get back on searching
      var that = this;
      if (bridge.isReady()) {
        this.remoteReady(bridge);
      } else {
        bridge.addListener({
          "onReady": function () {
            that.remoteReady(bridge);
          }
        });
        //add a timeout to verify the  bridge is working
        Executor.addTimedTask(this.verifyRemoteReady, READY_TIMEOUT, this);
      }

    },

    verifyRemoteReady:function(bridge) {
      if (!bridge.isReady()) {
        READY_TIMEOUT*=2; //XXX rethink the increase logic of this timeout
        this.onEngineDeath();
      }
    },

    remoteReady:function(bridge) {
      if (bridge.getBridgeId() == Constants.MASTER) {
        sharingLogger.logInfo("Remote engine", this.engineId + " is a master but should be a slave: engine must die");
        /*
         * This type of error happens in (some) installations of Firefox 57+.
         * The scenario is roughly as follows.
         * Two pages with the same host name and protocol are open. The first page creates a shared worker.
         * The second page tries to connect to the shared worker (whose id is found on localStorage) but
         * the effect is the creation of a new shared worker. When the second client detects that it should be a slave
         * but it is a master, it commits suicide.
         * 
         * To avoid endless attempts, the client must ignore other engines.
         */
        Executor.addTimedTask(this.onEngineDeath, 0, this, [false/*suiciding*/, true/*noHopeToAttachToAnotherEngine*/]);
      }
    },

    dispose: function() {
      this._callSuperMethod(NewEngineHandlerRemote,disposeName);
      this.terminateChannel();
      //future calls will get an exception that will cause an onPushPageLost event in the PushPage collection if remote
    }
  };

  var methods = NewEngineHandler.methods;
  for (var i in methods) {
    NewEngineHandlerRemote.prototype[i] = ChanneledHandler.createCaller(i,methods[i])
  }

  Inheritance(NewEngineHandlerRemote,NewEngineHandler);
  Inheritance(NewEngineHandlerRemote,ChanneledHandler,true);
  export default NewEngineHandlerRemote;


