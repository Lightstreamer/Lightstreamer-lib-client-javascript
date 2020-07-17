import SendMessageBridge from "./SendMessageBridge";
import ControlRequest from "./ControlRequest";
import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
import Utils from "../Utils";
  
  var messagesLogger = LoggerManager.getLoggerProxy(Constants.MESSAGES);
  
  var SendMessageHandler = function(controlHandler,pushPagesHandler,connOptions,sessionHandler) {
    this.active = false;
    this.messagePhase = 0;
    this.sequences = {};
    
    this.unorderedMap = {};
    this.unorderedSeqNum = 0;
    
    this.controlHandler = controlHandler;
    this.pushPagesHandler = pushPagesHandler;
    
    this.connOptions = connOptions;
    this.sessionHandler = sessionHandler;
  };
  
  
  SendMessageHandler.prototype = {
    
    /*public*/ _close: function() {
      // Called when a disconnection occurs;
      // the communication layer guarantees that no further calls will be received
      // originated from the pushFrame linked to the finite session.
      // So we can start from an empty state without the risk of overlapping.
  
      this.active = false;
      // what do we do with messages that have not yet been answered?
      // no need to answer here because pushpages can do this by themselves;
      // indeed, it is not even permissible to make calls to pages based on a finished session
      this.sequences = {};
      
      this.unorderedSeqNum = 0;
      this.unorderedMap = {};
      
      this.messagePhase++;
      messagesLogger.logDebug("Closing message handler");
    },
    
    /*public*/ activate: function() {
      messagesLogger.logDebug("Activating message handler");
      if (! this.active) {
        for (var seq in this.sequences) {
          var seqData = this.sequences[seq];
          for (var num in seqData.messages) {
            var query = seqData.messages[num].query;
            if (query != null) {
              var bridge = new SendMessageBridge(this,this.connOptions,this.messagePhase,seqData,num);
              this.sessionHandler.sendMessage(num,query,bridge);
            }
          }
        }
        this.active = true;
      }
    },
    
    /**
     * 
     * <b>NB1</b> A fire-and-forget behavior is enacted when the user calls {@link LightstreamerClient#sendMessage(String)}
     * or {@link LightstreamerClient#sendMessage(String, String, int, com.lightstreamer.client.ClientMessageListener, boolean)}
     * having (1) "UNORDERED_MESSAGES" as a sequence and (2) no listener. 
     * In this scenario the server doesn't send acknowledgments (i.e. REQOK) and the client doesn't do retransmissions.
     * In a fire-and-forget message request both the parameters LS_ack and LS_outcome are set to false.
     * 
     * <p>
     * Flags set to true with respect to the presence of a listener and a ordered sequence.
     * 
     * <table border="1">
     * <tr>
     *  <th></th>
     *  <th>listener</th>
     *  <th>no listener</th>
     * </tr>
     * <tr>
     *  <th>sequence</th>
     *  <td>prog outcome ack</td>
     *  <td>prog ack</td>
     * </tr>
     * <tr>
     *  <th>no sequence</th>
     *  <td>prog outcome ack</td>
     *  <td>ack (only in HTTP)</td>
     * </tr>
     * </table>
     */
    _send: function(_message, sequence, listener, _timeout) {
      messagesLogger.logDebug("Preparing message request");

      var seqData = this.sequences[sequence];
      if (seqData == null) {
        seqData = {};
        seqData.messageNum = 0;
        seqData.messages = {};
        this.sequences[sequence] = seqData;
      }
  
      seqData.messageNum++;
    
      var query = {
          "LS_message": _message, //if necessary the encoder will encode it
          "LS_reqId": Utils.nextRequestId()
      };
      
      //we add the prog if
      //1 - we expect an outcome
      //2 - the sequence is not unordered
      
      var needsProg = false;
      
      if (listener) {
          // query["LS_outcome"]=""; (no needed: the default is true)
          needsProg=true;
      } else {
          query["LS_outcome"]= "false";
      }
            
      if (sequence != Constants._UNORDERED_MESSAGES) {
        query["LS_sequence"]=encodeURIComponent(sequence);
        needsProg=true;

        if (_timeout) {
          query["LS_max_wait"]=_timeout;
        }
      }
      
      if (needsProg) {
          // query["LS_ack"]=""; (no needed: the default is true)
          query["LS_msg_prog"]= sequence == Constants._UNORDERED_MESSAGES ? this.mapUnordered(seqData.messageNum) : seqData.messageNum;
      } else if (listener == null) {
          query["LS_ack"] = "false";
      }
      
      var msgData = {};
      msgData.query = query;
      msgData.listener = listener;
      seqData.messages[seqData.messageNum] = msgData;
      if (this.active) {
        messagesLogger.logInfo("Forward prepared message to control handler",query);
        var bridge = new SendMessageBridge(this,this.connOptions,this.messagePhase,seqData,seqData.messageNum,sequence,needsProg);
        this.sessionHandler.sendMessage(seqData.messageNum,query,bridge);
      }
    },
    
    /*public*/ mapUnordered: function(prog) {
      var realProg = ++this.unorderedSeqNum;
      this.unorderedMap[realProg] = prog;
      return realProg;
    },
    
    /*private*/ resolveUnorderedNum: function(prog) {
      return this.unorderedMap[prog] ? this.unorderedMap[prog] : prog;
    },
    
    /*private*/ removeFromUnorderedMap: function(prog) {
      //not optimized at all; should I keep a reverse map to be faster?
      for (var i in this.unorderedMap) {
        if (this.unorderedMap[i] == prog) {
          delete(this.unorderedMap[i]);
          return;
        }
      }
    },
    
    /*public*/ extractMappedUnordered: function(prog) {
    //not optimized at all; should I keep a reverse map to be faster?
      for (var i in this.unorderedMap) {
        if (this.unorderedMap[i] == prog) {
          return i;
        }
      }
    },
    
    /*public*/ checkMessagePhase: function(ph) {
      return ph == this.messagePhase;
    },
    
    //FROM SendMessageBridge that knows the actual num
    /*public*/ resend: function(num,bridge) {
      var query = bridge.seqData.messages[num].query;
      messagesLogger.logDebug("No ack was received for a message; forwarding it again to the control handler",query);
      this.sessionHandler.sendMessage(num,query,bridge); //resend the message!
    },

    //FROM net, needs num translation
    /*public*/ ack: function(sequence, num) {
      num = sequence == Constants._UNORDERED_MESSAGES ? this.resolveUnorderedNum(num) : num;
      messagesLogger.logInfo("Ack received for message",sequence,num);
      
      var seqData = this.sequences[sequence];
      if (seqData.messages[num]) {
        if (seqData.messages[num].query != null) {
          messagesLogger.logDebug("Ack received, stopping automatic retransmissions");
          seqData.messages[num].query = null;
        }
        if (seqData.messages[num].listener == null) {
          messagesLogger.logDebug("Ack received, no outcome expected, clean structures");
          this._clear(sequence, num);
        }
      } 
    },
    
    //FROM SendMessageBridge that knows the actual num
    /*public*/ noAckMessageSent: function(sequence, num) {
      messagesLogger.logDebug("Not waiting for ack, purging",sequence,num);
      this._clear(sequence, num);
    },
    
    /*private*/ _clear: function(sequence, num) {
      //this method is always called with the actual num
      messagesLogger.logDebug("Message handled, clean structures");
      var seqData = this.sequences[sequence];
      if (seqData && seqData.messages[num]) {
        delete (seqData.messages[num]);
        if (sequence == Constants._UNORDERED_MESSAGES) {
          this.removeFromUnorderedMap(num);
        }
      }
    },
    
    /*private*/ getListener: function(sequence,num) {
      var seqData = this.sequences[sequence];
      if (seqData && seqData.messages[num] && seqData.messages[num].listener) {
        return seqData.messages[num].listener;
      }
      return null;
    },
    
    //FROM SendMessageBridge that knows the actual num
    sentOnNetwork: function(sequence, num) {
      messagesLogger.logDebug("Message on the net notification",sequence, num);
      var listenerInfo = this.getListener(sequence, num);
      if(listenerInfo) {
        
        var ppHandler = this.pushPagesHandler.getPushPageHandler(listenerInfo.pageNum);
        if (ppHandler) {
          ppHandler.onMessageOnNetwork(listenerInfo.prog);
        }
              
      }
    }, 

    //FROM net, needs num translation
    /*public*/ _complete: function(sequence, num) {
      num = sequence == Constants._UNORDERED_MESSAGES ? this.resolveUnorderedNum(num) : num;
      messagesLogger.logInfo("OK outcome received",sequence, num);
      var listenerInfo = this.getListener(sequence, num);
      if(listenerInfo) {
      
        var ppHandler = this.pushPagesHandler.getPushPageHandler(listenerInfo.pageNum);
        if (ppHandler) {
          ppHandler.onMessageComplete(listenerInfo.prog);
        }
              
      }
      
      this._clear(sequence, num);
      
    },
    
    //FROM net, needs num translation
    /*public*/ notifyDiscarded: function(sequence,num) {
      num = sequence == Constants._UNORDERED_MESSAGES ? this.resolveUnorderedNum(num) : num;
      messagesLogger.logInfo("DISCARDED outcome received",sequence, num);
      
      var listenerInfo = this.getListener(sequence, num);
      
      if(listenerInfo) {
        var ppHandler = this.pushPagesHandler.getPushPageHandler(listenerInfo.pageNum);
        if (ppHandler) {
          ppHandler.onMessageDiscarded(listenerInfo.prog);
        }
      }
      
      this._clear(sequence, num);
    },
    
    //FROM net, needs num translation
    /*public*/ notifyDenied: function(sequence,_code,msg,num) {
      num = sequence == Constants._UNORDERED_MESSAGES ? this.resolveUnorderedNum(num) : num;
      messagesLogger.logInfo("DENIED outcome received",sequence, num);
      var listenerInfo = this.getListener(sequence, num);
      if(listenerInfo) {
        var ppHandler = this.pushPagesHandler.getPushPageHandler(listenerInfo.pageNum);
        if (ppHandler) {
          ppHandler.onMessageDenied(listenerInfo.prog,_code,msg);
        }
      }
      
      this._clear(sequence, num);
    },

    //FROM net, needs num translation
    /*public*/ notifyError: function(sequence,_code,msg,num) {
      num = sequence == Constants._UNORDERED_MESSAGES ? this.resolveUnorderedNum(num) : num;
      messagesLogger.logInfo("ERROR outcome received",sequence, num);
      var listenerInfo = this.getListener(sequence, num);
      if(listenerInfo) {
        
        var ppHandler = this.pushPagesHandler.getPushPageHandler(listenerInfo.pageNum);
        if (ppHandler) {
          ppHandler.onMessageError(listenerInfo.prog,_code,msg);
        }
              
        
      }
      
      this._clear(sequence, num);
    }
  
  };
  
  export default SendMessageHandler;

