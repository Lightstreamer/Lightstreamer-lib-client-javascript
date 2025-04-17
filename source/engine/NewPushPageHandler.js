/*
 * Copyright (C) 2012 Lightstreamer Srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import StandardHandler from "../cross-tab/StandardHandler";
import CallDefinition from "../cross-tab/CallDefinition";
import Executor from "../../src-tool/Executor";

  var simple = CallDefinition.simple;
  //var simpleWithResponse = CallDefinition.simpleWithResponse;
  var simpleWithResponseAndTimeout = CallDefinition.simpleWithResponseAndTimeout;

  var methods = {
    onEngineConfigurationChange: simple,
    onEngineDeath: simple,
    onStatusChange: simple,
    onSessionStart: simple,
    onSessionEnd: simple,
    onEngineDying: simple,
    onServerError: simple,
    onServerKeepalive: simple,
    ping: simpleWithResponseAndTimeout,
    onSubscription: simple,
    onUnsubscription: simple,
    onEndOfSnapshot: simple,
    onUpdate: simple,
    onLostUpdates: simple,
    onClearSnapshot: simple,
    onSubscriptionError: simple,
    onMessageDiscarded: simple,
    onMessageDenied: simple,
    onMessageError: simple,
    onMessageComplete: simple,
    onMessageOnNetwork: simple,
    onSubscriptionReconf: simple
  };


  function NewPushPageHandler(engine,id) {
    this.engine = engine;
    this.id = id;
  }

  NewPushPageHandler.methods = methods;

  NewPushPageHandler.prototype = {

    setEngineHandler: function(engineHandler) {
      this.target = engineHandler;
    },

//calls from engine handler

    onClientConfigurationChange: function(objClass,prop,val) {
      var toSet = objClass == "ConnectionDetails" ? this.engine._connection : (objClass == "ConnectionOptions" ? this.engine._policy : this.engine._configuration);
      toSet.simpleSetter(prop, val);
    },

    callConnect: function(sessionPhase) {
      if (sessionPhase != this.engine.getSessionPhase()) {
        return;
      }
      this.engine.doConnect();
    },

    callDisconnect: function(sessionPhase) {
      if (sessionPhase != this.engine.getSessionPhase()) {
        return;
      }
      this.engine.doDisconnect();
    },
    
    callDisconnectAndReconnect: function(sessionPhase) {
        if (sessionPhase != this.engine.getSessionPhase()) {
            return;
        }
        this.engine.doDisconnectAndReconnect();
    },

    pong: function() {
      if(this.engine === null) {
        throw "net";
      }
      return true;
    },

    clientDeath: function() {
      Executor.addTimedTask(this.engine.checkClientHealth,0,this.engine);
      Executor.addTimedTask(this.engine.checkClientHealth,1000,this.engine);
    },

    subscribeTable: function(sessionPhase,body) {
      if (sessionPhase != this.engine.getSessionPhase()) {
        return null;
      }

      return this.engine.subscribe(this.id,body);
    },

    unsubscribeTable: function(sessionPhase,tableNum) {
      if (sessionPhase != this.engine.getSessionPhase()) {
        return null;
      }

      return this.engine.unsubscribe(tableNum);
    },

    updateSubscriptionParams: function(sessionPhase,tableNum,changingParams) {
      if (sessionPhase != this.engine.getSessionPhase()) {
        return null;
      }

      return this.engine.updateSubscriptionParams(tableNum,changingParams);
    },

    forwardMessage: function(sessionPhase,msg,sequence,listenerProxy,timeout) {
      if (sessionPhase != this.engine.getSessionPhase()) {
        return null;
      }
      var listener = listenerProxy == null ? null : {
        prog: listenerProxy,
        pageNum: this.id
      };
      this.engine.sendAMessage(msg,sequence,listener,timeout);
    },

    forwardLog: function(msg) {
      this.engine.sendLog(msg);
    },

    dispose: function() {
      this.engine = null;
      //future calls will get an exception that will cause an onPushPageLost event in the PushPage collection if remote
    }
  };

  for (var i in methods) {
    NewPushPageHandler.prototype[i] = StandardHandler.createCaller(i,methods[i])
  }



  export default NewPushPageHandler;

