import Executor from "../../src-tool/Executor";
import Constants from "../Constants";
import Utils from "../Utils";
import SyncPromise from "../SyncPromise";

  var proxedId = 0;

  //special message types
  var RESPONSE = "RESPONSE";

  /**
   *
   * @param {CommunicationInterface} sender
   * @constructor
   */
  function CrossTabChannel(receiver,bridge,target) {
    this.receiver = receiver;
    this.target = target;

    this.id = proxedId++;
    this.buffer = [];
    this.ready = false;
    this.pendingRequests = {};
    this.nextMessageId = 0;

    if (bridge) {
      this.setBridge(bridge);
    }
  }



  CrossTabChannel.prototype = {

    setBridge: function(bridge) {
      this.bridge = bridge;
      bridge.addListener(this);
      if (bridge.isReady()) {
        this.onReady();
      }
    },

    dispose: function(preserveBridge) {
      if(this.bridge && !preserveBridge) {
        this.bridge.dispose();
      }
    },

    onListenStart: function() {
      if (this.bridge.isReady()) {
        this.onReady();
      }
    },

    onReady: function() {
      if (this.ready) {
        return;
      }

      this.ready = true;
      for (var i=0; i<this.buffer.length; i++) {
        var pending = this.buffer[i];

        var res = this.call(pending.method, pending.params,
            pending.expectResponse);

        if (pending.expectResponse) {
          pending.promised(res);
        }
      }

      this.buffer = [];
    },

    onMessage: function (message) {
      this._onMessage(message.sender,message.messageId,message.type,message.params);
    },
    _onMessage: function (sender,messageId,type,params) {

      if (type == RESPONSE) {
        //means the message is a response to a previous message somebody sent

        //messageId in this case is a local id (if it's not ours we can't have it)
        if (this.pendingRequests[messageId]) {
          //this.pendingRequests[messageId] is the resolve method of a Promise
          this.pendingRequests[messageId].ok(params[0]);
          delete(this.pendingRequests[messageId]);
        } //else we didn't care about the response or the message is for a different CrossTabChannel


      } else if (sender === this.target) {
        var resp = this.receiver[type].apply(this.receiver, params);

        if (typeof resp !== "undefined") {
          this.sendResponse(sender,messageId,resp);
        }

      } //else not for us
    },
    onMessageFail: function(target,messageId) {
      //messageId in this case is a local id (if it's not ours we can't have it)
      if (this.pendingRequests[messageId]) {
        //this.pendingRequests[messageId] is the resolve method of a Promise
        this.pendingRequests[messageId].no(Constants.PROMISE_FAILURE);
        delete(this.pendingRequests[messageId]);
      } //else we didn't care about the response or the message is for a different CrossTabChannel
    },


    sendResponse: function(sender,messageId,resp) {
      this.bridge.sendMessage(sender,RESPONSE,messageId,[resp]);
    },


    /**
     *
     * @param method
     * @param params
     * @return Promise
     */
    call: function(method,params,expectResponse,responseTimeout) {
      params = Utils.argumentsToArray(params);

      if (!this.ready) {
        var bufferized = {
          target: this.target,
          method: method,
          params: params,
          expectResponse: expectResponse,
          callTimeout: responseTimeout
        };

        this.buffer.push(bufferized);

        if (expectResponse) {
          return new /*SyncPromise*/Promise(function (resolve) {
            bufferized.promised = resolve;
          });
        }

      } else {
        var messageId = this.id+"_"+(this.nextMessageId++);
        this.bridge.sendMessage(this.target,method,messageId,params);

        if (expectResponse) {
          var that = this;
          var res = new /*SyncPromise*/Promise(function(resolve,reject) {
            that.pendingRequests[messageId] = {
              ok: resolve,
              no: reject
            };

            if (responseTimeout) {
              Executor.addTimedTask(function () {
                if (that.pendingRequests[messageId]) {
                  reject(Constants.PROMISE_TIMEOUT);
                }
              },responseTimeout);
            }

          });



          return res;
        }


      }
    }

  };

  CrossTabChannel.prototype["onReady"] = CrossTabChannel.prototype.onReady;
  CrossTabChannel.prototype["onMessageFail"] = CrossTabChannel.prototype.onMessageFail;
  CrossTabChannel.prototype["onMessage"] = CrossTabChannel.prototype.onMessage;
  CrossTabChannel.prototype["onListenStart"] = CrossTabChannel.prototype.onListenStart;




  export default CrossTabChannel;


