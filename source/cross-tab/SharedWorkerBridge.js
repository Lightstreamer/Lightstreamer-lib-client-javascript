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
import Constants from "../Constants";

   var MASTER = Constants.MASTER;
   var REMOTE="REMOTE";
   var INITIALIZATION ="INITIALIZATION";
   var REMOVE="REMOVE";
   var ALL="ALL";
   var FAILED="FAILED";
   var KILL = "KILL";

   var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);
   
   // LOG DI DETTAGLIO DEL DISPATCHING E DELL'ESECUZIONE:
   // SCOMMENTARE QUANTO SEGUE
   /*
   var att = Executor.addTimedTask;
   Executor.addTimedTask = function() {
	   if (this.externalLogger != sharingLogger) {
		   if (sharingLogger.isDebugLogEnabled()) {
			   this.externalLogger = sharingLogger;
		   }
	   }
	   att.apply(this, arguments);
   };
   */
   // AGGIUNGERE QUANTO SEGUE ALL'INTERNO DI Executor.js A TOP LEVEL
   /*
   {
       var psh = toBeExecuted.push;
       var srt = toBeExecuted.sort;
       var shf = toBeExecuted.shift;
       function printVal(val, action, logger) {
           for (var fld in val) {
               if (fld.toString() != "fun") {
                   action += (" " + fld.toString() + ":" + val[fld]);
               } else {
                   action += (" fun:" + (fld != null));
               }
           }
           logger.logDebug(action);
       }
       toBeExecuted.push = function() {
           printVal(arguments[0], "DISPATCHING", Executor.externalLogger);
           psh.apply(this, arguments);
           resetAt = now + RESET_TIME;
       }
       toBeExecuted.sort = function() {
           Executor.externalLogger.logDebug("RUNNING EXECUTOR AT " + now + " with " + toBeExecuted.length);
           srt.apply(this, arguments);
       }
       toBeExecuted.shift = function() {
           var val = shf.apply(this, arguments);
           printVal(val, "EXECUTING", Executor.externalLogger);
           return val;
       }
   }
   */

  /*implements CommunicationInterface*/
  function SharedWorkerBridge() {
    this._callSuperConstructor(SharedWorkerBridge);
    this.worker=null;
    this.senderId = null;
  }

  //the below string is the worker.js file 8pay attention to the constants if the file is regenerated
  SharedWorkerBridge.WORKER_CODE = 'var listeners={},nextId=0,MASTER="MASTER",REMOTE="REMOTE",INITIALIZATION="INITIALIZATION",REMOVE="REMOVE",ALL="ALL",FAILED="FAILED",KILL="KILL";onconnect=function(a){var b=a.ports[0];a=nextId++;listeners[MASTER]||(a=MASTER);listeners[a]=b;b.addEventListener("message",function(a){a=a.data;if(a.type==REMOVE)delete listeners[a.target];else if(a.type==KILL)terminate();else if(a.target===ALL)for(var c in listeners)listeners[c]!=b&&sendMessage(c,a,b);else sendMessage(a.target,a,b)});b.start();b.postMessage({type:INITIALIZATION,id:a});a!==MASTER&&listeners[MASTER].postMessage({type:REMOTE,id:a})};function sendMessage(a,b,d){(a=listeners[a])?a.postMessage(b):(b.type=FAILED,d.postMessage(b))}function terminate(){self.close();for(var a in listeners)listeners[a].close()};';
      
  SharedWorkerBridge.prototype = {

    isReady: function() {
      return this.senderId !== null;
    },

    getBridgeId: function() {
      return this.senderId;
    },

    start: function(workerId) {
      var sw = new SharedWorker(workerId);
      var promise = new Promise(function(resolve, reject) {
          sw.onerror = function() {
              sharingLogger.logInfo("Shared worker is broken");
              reject("SharedWorker broken");
          };
      });
      this.worker = sw.port;

      var that = this;
      this.worker.onmessage = function (event) {
        that.onMessageReceived(event.data);
      };

      this.worker.start();
      return promise;
    },

    dispose: function() {
      try {
        if (this.senderId == MASTER) {
          this.worker.postMessage({
            type: KILL
          });
        }
        this.worker.close();
      } catch(e) {
        //already dead?
      }
      this.worker = null;
    },

/* for testing of alternative messsage sequences, possible in some scenarios
    pending: [],
*/

    onMessageReceived: function(event) {

/* for testing of alternative messsage sequences, possible in some scenarios
		if (event.type == "onUpdate") {
			while (this.pending.length > 0) {
				var related = this.pending.shift();
				sharingLogger.logDebug("RESUMED TO " + this.pending.length);
				this.dispatchEvent("onMessage",[related]);
			}
		}
*/
        try {
            if (sharingLogger.isDebugLogEnabled()) {
                var line = "RECEIVED";
                for (var fld in event) {
                    line += (" " + fld.toString() + ":" + event[fld]);
                }
                sharingLogger.logDebug(line);
            }

            if (event.type == INITIALIZATION) {
                this.senderId = event.id;
                this.dispatchEvent("onReady");
            } else if (event.type == REMOTE) {
                this.dispatchEvent("onRemote",[event.id]);
            } else if  (event.type == FAILED) {
                this.dispatchEvent("onMessageFail",[event.target,event.messageId]);
            } else {

/* for testing of alternative messsage sequences, possible in some scenarios
			if (event.type == "RESPONSE" && event.messageId == "0_0" || this.pending.length > 0) {
				this.pending.push(event);
				sharingLogger.logDebug("DELAYED TO " + this.pending.length);
				return;
			}
*/
                this.dispatchEvent("onMessage",[event]);
            }
        } catch (e) {
            sharingLogger.logError("SharedWorker receiving error", e);
        }
    },

    removeTarget: function(id) {
      if (!id) {
        id = this.senderId;
      }
      try {
        this.worker.postMessage({
          type: REMOVE,
          target: id
        });
      } catch(e) {
        //just avoid exception is enough
      }
    },

    sendMessage: function(target,type,messageId,params) {
      if (!this.isReady()) {
        return false;
      }

      var sender = this.senderId;
      var message = {
          type: type,
          sender: sender,
          target: target,
          messageId: messageId,
          params: params
      };

      if (sharingLogger.isDebugLogEnabled()) {
        var line = "SENDING";
        for (var fld in message) {
            line += (" " + fld.toString() + ":" + message[fld]);
        }
        sharingLogger.logDebug(line);
      }

      try {
        this.worker.postMessage(message);
      } catch(e) {
        sharingLogger.logError("SharedWorker sending error", e);
        this.dispatchEvent("onMessageFail",[target,messageId]);
      }

      return true;
    }
  };

  Inheritance(SharedWorkerBridge,EventDispatcher);
  export default SharedWorkerBridge;


