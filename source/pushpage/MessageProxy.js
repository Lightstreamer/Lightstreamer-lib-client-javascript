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
import List from "../../src-tool/List";
import Assertions from "../utils/Assertions";
  
  var MessageProxy = function(engineHandler) {
    this.lastMessageListener = -1;
    this.pendingMessageListeners = {};
    this.pendingMessages = {};
    this.pendingMessagesOnNetwork = {};
    this.pendingMLCount = 0;
    this.engineHandler = engineHandler;
    this.queuedMessages = new List();
  };
  
  MessageProxy.prototype = {
      
    /*public*/ switchEngineHandler: function(engineHandler) {
      this.engineHandler = engineHandler;
    },  
      
    /*public*/ getMessageListenerProxy: function(message,listener) {
      this.lastMessageListener++;
      this.pendingMessageListeners[this.lastMessageListener] = listener;
      this.pendingMessages[this.lastMessageListener] = message;
      this.pendingMessagesOnNetwork[this.lastMessageListener] = false;
      this.pendingMLCount++;
      return this.lastMessageListener;
      /*
      var proxy = {};
      proxy.pageNum = this.engineHandler.getPageNumber();
      proxy.prog = this.lastMessageListener;
      return proxy;
      */
    },
    
    /*private*/ getListener: function(listenerProg) {
      return this.pendingMessageListeners[listenerProg];      
    },
    
    /*private*/ getOriginalMessage: function(listenerProg) {
      return this.pendingMessages[listenerProg];      
    },
    
    /*private*/ wasSentOnNetwork: function(listenerProg) {
      return this.pendingMessagesOnNetwork[listenerProg];      
    },
    
    /*public*/ cleanMessageListeners: function() {
      // Chiamato quando si perde l'Engine, oppure quando avviene una disconnessione;
      // nel secondo caso, lo strato di comunicazione garantisce che non si
      // riceveranno altre chiamate dall'Engine legate alla sessione finita.
      // Quindi possiamo ripartire da uno stato vuoto senza rischio di sovrapposizioni.

      // clear the enqueueWhileDisconnected queue if anything is there (if a message 
      // with a listener is there we will fire the on abort (such is listener is
      // in the pendingMessageListeners collection)
      this.clearQueuedMessages();
      

      // dobbiamo chiamare i listeners nell'ordine giusto;
      // non vogliamo ciclare a vuoto su un array arbitrariamente lungo;
      // gli elementi interessati dovrebbero essere tutti verso la fine;
      
      var _elements = [];
      for (var i in this.pendingMessageListeners) {
        _elements.push(i);
      }
      
      _elements.sort(function(a, b) {  
        return a - b;  
      });
      
      for (var i = 0; i < _elements.length; i++) {
        this.messageAbort(_elements[i]);
      }
      
      /*
      var _elements = {};
      var prog = 0;
      for (var i = this.lastMessageListener; i >= 0; i--) {
        if (prog == this.pendingMLCount) {
          break;
        }
        if (this.pendingMessageListeners[i]) {
          _elements[prog] = i;
          prog++;
        }
      }
      for (var i = prog - 1; i >= 0; i--) {
        this.messageAbort(_elements[i]);
      }*/
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(this.pendingMLCount,0, "Unexpected pending messages");
    //>>excludeEnd("debugExclude");
      this.lastMessageListener = -1;
      this.pendingMessageListeners = {};
      this.pendingMessages = {};
      this.pendingMessagesOnNetwork = {};
      this.pendingMLCount = 0;
    },
    
    /*private*/ clean: function(listenerProg) {
      delete this.pendingMessageListeners[listenerProg];
      delete this.pendingMessages[listenerProg];
      delete this.pendingMessagesOnNetwork[listenerProg];
      this.pendingMLCount--;
    },
    
    /*public*/  messageOnNetwork: function(listenerProg) {
      var listener = this.getListener(listenerProg);
      if (listener) {
        this.pendingMessagesOnNetwork[listenerProg] = true;
      }
    },
    
//////////MESSAGE QUEUE
    enqueueMessage: function(msg,sequence,listener,timeout) {
      this.queuedMessages.add({msg:msg,sequence:sequence,listener:listener,timeout:timeout});
    },
    
    /*private*/ clearQueuedMessages: function() {
      var that = this;
      this.queuedMessages.forEach(function(el) {
        //abort: call it here or it will never be called as this message does not have a listener proxy
        that.fireEvent("onAbort",el.listener,[el.msg,false]);
      });
      this.queuedMessages.clean();
    },
    
    handleAllWaitingMessages: function() {
      var that = this;
      this.queuedMessages.forEach(function(el) {
        //var listenerProxy = this.getMessageListenerProxy(el.msg,el.listener);
        that.forwardMessage(el.msg,el.sequence,el.listener,el.timeout);
      });
      this.queuedMessages.clean();
    },
    
    forwardMessage: function(msg,sequence,listener,timeout) {
      var listenerProxy = null;
      if (listener) {
        // non possiamo passare un listener alla pagina Engine:
        // lo sostituiamo con un indice in un array locale
        listenerProxy = this.getMessageListenerProxy(msg,listener);
      }
      this.engineHandler.forwardMessage(msg,sequence,listenerProxy,timeout);
    },
    
//////////EVENTS DISPATCHING
    
    fireEvent: function(event,listener,params) {
      if (!listener || !listener[event]) {
        return;
      }
      Executor.addTimedTask(listener[event],0,listener,params);
    },
    
    /*public*/ messageComplete: function(listenerProg) {
      var listener = this.getListener(listenerProg);
      
      this.fireEvent("onProcessed",listener,[this.getOriginalMessage(listenerProg)]);
      
      this.clean(listenerProg);
     
    },
    
    /*public*/ messageError: function(listenerProg,_code,msg) {
      var listener = this.getListener(listenerProg);
      if (_code != 32 && _code != 33) {
          /* errors 32 and 33 must not be notified to the user
           * because they are due to late responses of the server */
          this.fireEvent("onError",listener,[this.getOriginalMessage(listenerProg)]);
      }
      
      this.clean(listenerProg);
    },
    
    /*public*/ messageDenied: function(listenerProg,_code,msg) {
      var listener = this.getListener(listenerProg);
      
      this.fireEvent("onDeny",listener,[this.getOriginalMessage(listenerProg),_code,msg]);
           
      this.clean(listenerProg);
    },
    
    /*public*/ messageDiscarded: function(listenerProg) {
      var listener = this.getListener(listenerProg);
      
      this.fireEvent("onDiscarded",listener,[this.getOriginalMessage(listenerProg)]);
      
      this.clean(listenerProg);
    },
    
    /*private*/ messageAbort: function(listenerProg) {
      var listener = this.getListener(listenerProg);
     
      this.fireEvent("onAbort",listener,[this.getOriginalMessage(listenerProg),this.wasSentOnNetwork(listenerProg)]);
      
      this.clean(listenerProg);
    }    
    
  };
  
  export default MessageProxy;
  
