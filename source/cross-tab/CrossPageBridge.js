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
import Executor from "../../src-tool/Executor";
import EventDispatcher from "../../src-tool/EventDispatcher";
import Inheritance from "../../src-tool/Inheritance";
import LoggerManager from "../../src-log/LoggerManager";
import Utils from "../Utils";
import Constants from "../Constants";

  //the old CrossPageProxy was initially developed when the library still manually used setTimeout (no Executor available then)
  //thus took extra steps to ensure that event were executed in order. Executor now takes care of executing stuff in order, thus we
  //don't have to care anymore: in terms of the old CrossPageProxy we always do the asynchEnqueuing

  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);

  var INITIALIZATION = "INITIALIZATION";
  var MASTER = Constants.MASTER;

  /*implements CommunicationInterface*/
  function CrossPageBridge() {
    this._callSuperConstructor(CrossPageBridge);
    this.connections = {};
    this.senderId = null;
    this.othersIds = 1;
  }

  CrossPageBridge.prototype = {

    isReady: function() {
      return this.senderId !== null;
    },

    start: function (masterObject) {
      this.ready = true;
      if (masterObject) {
        this.connections[MASTER] = masterObject;

        var that = this;
        Executor.addTimedTask(function() {
          // on many IE versions the call, if performed in the executor, 
          // succedes while at the same time throws an exception
          // removing the executor wrapping you only get the exception
          try {
            masterObject.connect(that);
          } catch(e) {
            if (e.number == -2147467260) {
              // harmless exception from IE
            } else {
              // no exceptions are expected here;
              // if anyone occurs, we must check the whole call chain
              // and understand how the exception can be propagated back
              sharingLogger.logError("Unexpected sharing error", e);
            }
          }
        },0)

      } else {
        this.senderId = MASTER;
        this.dispatchEvent("onReady");
      }

    },

    dispose: function() {
    },

    /**potentially from other window**/
    connect: function (remoteObj) {
      //change context before modifiyng local variables
      Executor.addTimedTask(this._connect, 0, this, [remoteObj]);
    },

    _connect: function (remoteObj) {
      var newId = this.othersIds++;
      this.connections[newId] = remoteObj;
      this.dispatchEvent("onRemote",[newId]);
      this.sendMessage(newId, INITIALIZATION, -1, [newId]);
    },

    removeTarget: function(target) {
      delete(this.connections[target]);
    },

    sendMessage: function (target, type, messageId, params) {
      if (!this.isReady()) {
        return false;
      }

      if (target == "ALL") {
        for (var i in this.connections) {
          this._sendOneMessage(i, type, messageId, params);
        }
      } else {
        this._sendOneMessage(target, type, messageId, params);
      }

      return true;
    },

    _sendOneMessage: function(target, type, messageId, params) {
      try {

        if (!this.connections[target] || !this.connections[target].onMessageReceived) {
          this.dispatchEvent("onMessageFail", [target, messageId]);
        } else {

          var that = this;
          Executor.addTimedTask(function() {
            try {
              // on many IE versions the call, if performed in the executor, 
              // succedes while at the same time throws an exception
              // removing the executor wrapping you only get the exception
              that.connections[target].onMessageReceived(target, that.senderId, type, messageId, params);
            } catch(e) {
              if (e.number == -2147467260) {
                // this is a harmless exception from IE
              } else {
                sharingLogger.logError("Unexpected dispatching error", e);
                that.dispatchEvent("onMessageFail", [target, messageId]);
              }
            }
          },0)

        }
      } catch(e) {
        this.dispatchEvent("onMessageFail", [target, messageId]);
      }

    },

    /**potentially from other window**/
    onMessageReceived: function (target, sender, type, messageId, params) {

      var event = {
        target: Utils.copyByValue(target),
        type: Utils.copyByValue(type),
        messageId: Utils.copyByValue(messageId),
        sender: Utils.copyByValue(sender)
      };
      if (params) {
        event.params = [];
        for (var i = 0; i < params.length; i++) {
          event.params[i] = Utils.copyByValue(params[i]);
        }
      }

      this._onMessageReceived(event);
    },

    _onMessageReceived: function (event) {
      try {
        if (event.type == INITIALIZATION) {
          this.senderId = event.params[0];
          this.dispatchEvent("onReady");
        } else {

          this.dispatchEvent("onMessage", [event]);
        }
      } catch(e) {
        if (e.number == -2147467260) {
          // this is a harmless exception from IE
        } else {
          sharingLogger.logError("Unexpected error on dispatching", e);
        }
      }

    }
  };

  Inheritance(CrossPageBridge,EventDispatcher,false,true);
  export default CrossPageBridge;
