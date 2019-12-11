import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
import Executor from "../../src-tool/Executor";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import Utils from "../Utils";
import ASSERT from "../../src-test/ASSERT";
import UnsubscribeTutor from "../control/UnsubscribeTutor";
import SubscribeTutor from "../control/SubscribeTutor";
import SubscriptionChangeTutor from "../control/SubscriptionChangeTutor";
  
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);

  var PushPageCollectionHandler = function(engine,configuration,details,options) {
    this.reqPhase = 1;
    this.engine = engine;
    this.configuration = configuration;
    this.details = details;
    this.options = options;
    this.sessionPhase = 0;
    this.sessionAlive = false;

    this.pushPages = {};
    this.clientsCount = 0;

    this.subscriptions = {};
    this.page2Tables = {};


    this.cleanTask = Executor.addRepetitiveTask(this.cleanThread,5000,this);

    EnvironmentStatus.addBeforeUnloadHandler(this);
    EnvironmentStatus.addUnloadHandler(this);
  };
  
  PushPageCollectionHandler.prototype = {
    
    /*public*/ toString: function() {
      return ["[","PushPageCollectionHandler","]"].join("|");
    },

    getSessionPhase: function() {
      return this.sessionPhase;
    },

    /*public*/ checkSessionPhase: function(pPhase) {
      return pPhase == this.sessionPhase;
    },


    checkConnectionPool: function(onlyMeCount) {
      var status = this.engine.getSharedStatus();
      if (status && status.getNumberOfConnectionsToServer(this.engine.sessionHandler.getPushServerAddress()) > onlyMeCount) {
        sharingLogger.logWarn("There is probably another web application connected to the same Lightstreamer Server within this browser instance. That could prevent the current application from connecting to the Server. Please close the other application to unblock the current one");
      }
    },


    /*private*/ cleanAll: function() {
      this.subscriptions = {};
      for (var i in this.page2Tables) {
        this.page2Tables[i] = {};
      }
    },

    forEachPushPage: function(callback) {
      for (var i in this.pushPages) {
        callback(this.pushPages[i],i);
      }
    },

    onNewPushPage: function(ppId,pp) {
      this.pushPages[ppId] = pp;
      this.page2Tables[ppId] = {};

      this.clientsCount++;
      this.configuration.simpleSetter('clientsCount',this.clientsCount);

      sharingLogger.logDebug("New client attached to engine",this);
      if (ppId !== Constants.MAIN_CLIENT) {

        this.details.forEachProperty(function(prop,value) {
          pp.onEngineConfigurationChange("ConnectionDetails",prop,value);
        });
        this.options.forEachProperty(function(prop,value) {
          pp.onEngineConfigurationChange("ConnectionOptions",prop,value);
        });
        this.configuration.forEachProperty(function(prop,value) {
          pp.onEngineConfigurationChange("Configuration",prop,value);
        });

        pp.onStatusChange(this.engine.getStatus());

        if (this.sessionAlive) {
          pp.onSessionStart(this.sessionPhase);
        } else {
          pp.onSessionEnd(this.sessionPhase);
        }

      }



    },

    onPushPageLost: function(ppId) {
      sharingLogger.logDebug("Dismissing client",this,ppId);
      if (this.pushPages[ppId]) {
        var relatedTables = this.page2Tables[ppId];
        for (var tableNum in relatedTables) {
          this.removeTable(tableNum);
        }

        this.pushPages[ppId].dispose();
        delete (this.pushPages[ppId]);
        delete this.page2Tables[ppId];

        this.clientsCount--;
        this.configuration.simpleSetter('clientsCount',this.clientsCount);
      }
    },



    getPushPageHandlerFromTableNumber: function(tableNum) {
      var sub = this.subscriptions[tableNum];
      if (!sub) {
        sharingLogger.logDebug("Can't find subscription anymore");
        return null;
      }
      return this.getPushPageHandler(sub.pageNum);
    },
    /*public*/ getPushPageHandler: function(pageNum) {
      if (!this.pushPages[pageNum]) {
        sharingLogger.logDebug("Can't find page anymore");
        return null;
      }

      return this.pushPages[pageNum];
    },





    notifyNewStatus: function(newStatus,oldStatus) {
      this.forEachPushPage(function(pp) {
        pp.onStatusChange(newStatus);
      });
      return true;
    },

    /*public*/ onSessionStart: function() {
      // I delete the accumulated deletes, so the pushpages after this refresh will be
      // forced to repeat their requests and the deletes
      this.cleanAll();
      this.sessionAlive = true;
      var phase = ++this.sessionPhase;
      this.forEachPushPage(function(pp) {
        pp.onSessionStart(phase);
      });

    },

    /*public*/ onSessionEnd: function() {
      // I delete the accumulated deletes, so the pushpages after this refresh will be
      // forced to repeat their requests and the deletes
      this.cleanAll();
      this.sessionAlive = false;
      var phase = ++this.sessionPhase;
      this.forEachPushPage(function(pp) {
        pp.onSessionEnd(phase);
      });

    },

    onSubscription: function(tableNum) {
      if (!this.subscriptions[tableNum]) {
        return;
      }
      this.subscriptions[tableNum].pendingSubscription = false;
    },
    onSubscriptionError: function(tableNum) {
      /*if (!this.subscriptions[tableNum]) {
        return;
      }
      delete this.subscriptions[tableNum];
      if (this.page2Tables[pageNum]) {
        delete this.page2Tables[pageNum][tableNum];
      }*/
      this.onUnsubscription(tableNum);
      //this.subscriptions[tableNum].pendingSubscription = false;
    },
    isWaitingSubscription: function(tableNum) {
      if (!this.subscriptions[tableNum]) {
        //on subscribe received
        return false;
      }
      return this.subscriptions[tableNum].pendingSubscription && !this.subscriptions[tableNum].pendingUnsubscription;
    },
    subscriptionSent: function(tableNum) {
      if (!this.subscriptions[tableNum]) {
        return;
      }
      this.subscriptions[tableNum].sentSubscription = true;
    },

    onSubscriptionEvent: function(tableNum) {
    },


    onUnsubscription: function(tableNum) {
      if (!this.subscriptions[tableNum]) {
        return;
      }
      var pageNum = this.subscriptions[tableNum].pageNum;
      delete this.subscriptions[tableNum];

      if (this.page2Tables[pageNum]) {
        delete this.page2Tables[pageNum][tableNum];
      }

    },
    isWaitingUnsubscription: function(tableNum) {
      if (!this.subscriptions[tableNum]) {
        //on unsubscribe received
        return false;
      }
      return this.subscriptions[tableNum].sentSubscription && this.subscriptions[tableNum].pendingUnsubscription;
    },


    isWaitingSubscriptionReconfNotification: function(tableNum,ph) {
      if (!this.subscriptions[tableNum]) {
        //on unsubscribe received
        return false;
      }
      return this.subscriptions[tableNum].pendingChange && this.subscriptions[tableNum].pendingChangePhase == ph;
    },
    onSubscriptionReconfEvent: function(tableNum,phase) {
      if (!this.subscriptions[tableNum]) {
        //on unsubscribe received
        return;
      }
      if (phase == this.subscriptions[tableNum].pendingChangePhase) {
        this.subscriptions[tableNum].pendingChange = false;
      }
    },


    /*public*/ handleTable: function(ppId,body) {
      //since this call is session-synched and since the pushPage passes subscriptions to us only if session is alive
      //then at this moment we must be connected (otherwise this call is discarded during phase check)

      var pageH = this.pushPages[ppId];
      if (!pageH || !this.engine.isSessionOpenOrRecovering()) {
        //should never happen as to arrive here the existence of the pushPageHandler is checked

        //>>excludeStart("debugExclude", pragmas.debugExclude);
        ASSERT.fail();
        //>>excludeEnd("debugExclude");
        sharingLogger.logError("Client or session unexpectedly disappeared while handling subscription",this,ppId);
        return;
      }

      var tableNum = Utils.nextSubscriptionId();

      this.page2Tables[ppId][tableNum] = true;

      //delete-request handling, it's not handled on a per-PushPage basis as
      //even if a pushpage disappears we have to send its remove requests
      var reqs = this.getControlParams(body,tableNum);
      this.subscriptions[tableNum] = new SubscriptionStatus(ppId,reqs.add,reqs.remove);

      sharingLogger.logDebug("Notify back to the client that the subscription was handled");

      this.subscribeTable(tableNum,1);
      return tableNum;
    },

    /*public*/ subscribeTable: function(tableNum,effort,currentTimeout) {
      if (!this.subscriptions[tableNum]) {
        return;
      }
      if (effort >= 3) {
        //if we're retrying we check cookies to see if it's possible that the connection is blocked due to
        //exhaustion of the pool
        this.checkConnectionPool(1);
      }

      this.subscriptions[tableNum].pendingSubscription = true;

      var tutor = new SubscribeTutor(this.options,tableNum,this,effort,currentTimeout);
      var addBody = this.subscriptions[tableNum].addBody;
      this.engine.sessionHandler.sendSubscription(tableNum,addBody,this,effort >= 2,tutor);

    },

    removeTable: function(tableNum) {
      if (!this.subscriptions[tableNum] || this.subscriptions[tableNum].pendingUnsubscription) {
        //already unsubscribed or already unsubscribing
        return;
      }

      this.unsubscribeTable(tableNum,1);
    },

    /*public*/ unsubscribeTable: function(tableNum,effort,currentTimeout) {
      if (!this.subscriptions[tableNum]) {
        return;
      }
      if (effort >= 3) {
        //if we're retrying we check cookies to see if it's possible that the connection is blocked due to
        //exhaustion of the pool
        this.checkConnectionPool(1);
      }

      this.subscriptions[tableNum].pendingUnsubscription = true;

      var tutor = new UnsubscribeTutor(this.options,tableNum,this,effort,currentTimeout);
      var deleteBody = this.subscriptions[tableNum].deleteBody;
      deleteBody['LS_reqId'] = Utils.nextRequestId();
      this.engine.sessionHandler.sendUnsubscription(tableNum,deleteBody,this,effort >= 2,tutor);

    },

    updateSubscriptionParams:function(tableNum,changingParams) {
      if (!this.subscriptions[tableNum]) {
        return;
      }

      var ph = ++this.subscriptions[tableNum].pendingChangePhase;

      this.sendUpdateSubscriptionParams(tableNum,ph,changingParams,1);
    },

    sendUpdateSubscriptionParams: function(tableNum,ph,changingParams,effort,currentTimeout) {
      if (!this.subscriptions[tableNum] || this.subscriptions[tableNum].pendingChangePhase != ph ) {
        return;
      }
      if (effort >= 3) {
        //if we're retrying we check cookies to see if it's possible that the connection is blocked due to
        //exhaustion of the pool
        this.checkConnectionPool(1);
      }

      this.subscriptions[tableNum].pendingChange = true;
      var rPhase = this.subscriptions[tableNum].pendingChangePhase;
      var reqParams = Utils.extendObj({
        "LS_subId": tableNum,
        "LS_op": "reconf",
        "LS_reqId": Utils.nextRequestId()
      },changingParams);

      var tutor = new SubscriptionChangeTutor(this.options,tableNum,rPhase,this,changingParams,effort,currentTimeout);
      this.engine.sessionHandler.sendSubscriptionChange(tableNum,reqParams,tutor);


    },




    /*public*/ notifyEngineIsDying: function() {
      this.forEachPushPage(function(pp) {
        pp.onEngineDying();
      });
    },

    /*public*/ notifyEngineDeath: function(suiciding) {
      var pps = this.pushPages;
      this.pushPages = {};
      for (var i in pps) {
        pps[i].onEngineDeath(suiciding);
      }
    },

    /*public*/ notifyServerError: function(flag,msg) {
      this.forEachPushPage(function(pp) {
        pp.onServerError(flag,msg);
      });
    },

    dispose: function() {
      Executor.stopRepetitiveTask(this.cleanTask);
      EnvironmentStatus.removeBeforeUnloadHandler(this);
      EnvironmentStatus.removeUnloadHandler(this);
    },

    unloadEvent: function() {
      this.notifyEngineDeath(false);
    },

    preUnloadEvent: function() {
      this.notifyEngineIsDying();
    },

    cleanThread: function() {
      var that = this;
      this.forEachPushPage(function(pp,id) {
        //this call on a dead page will result in a onPushPageLost call
        pp.ping()["then"](function(ok) {
          //if didn't fail we're ok
        },function() {
          that.onPushPageLost(id);
        });
      });
    },


    /**
     * Genera la querystring da utilizzare per la richiesta dei dati di push
     */
    /*public*/ getControlParams: function(_body,tableNum) {
      this.reqPhase++;

      var commonParams = {
        "LS_subId": tableNum
      };

      Utils.extendObj(_body,commonParams);

      return {
        add: Utils.extendObj(_body,{"LS_op":"add", "LS_reqId": Utils.nextRequestId()}),
        remove: Utils.extendObj(commonParams,{"LS_op": "delete", "LS_reqId": Utils.nextRequestId()})
      };

    },

    onServerKeepalive: function() {
        this.forEachPushPage(function(pp) {
            pp.onServerKeepalive();
        });
    }
  };

  function SubscriptionStatus(pageNum,addBody,deleteBody) {
    this.pendingSubscription = false;
    this.sentSubscription = false;
    this.pendingChange = false;
    this.pendingChangePhase = 0;
    this.pendingUnsubscription = false;
    this.deleteBody = deleteBody;
    this.addBody = addBody;
    this.pageNum = pageNum;
  }


  PushPageCollectionHandler.prototype["onPushPageLost"] = PushPageCollectionHandler.prototype.onPushPageLost;
  PushPageCollectionHandler.prototype["onNewPushPage"] = PushPageCollectionHandler.prototype.onNewPushPage;
  PushPageCollectionHandler.prototype["unloadEvent"] = PushPageCollectionHandler.prototype.unloadEvent;
  PushPageCollectionHandler.prototype["preUnloadEvent"] = PushPageCollectionHandler.prototype.preUnloadEvent;
  
  export default PushPageCollectionHandler;
  
