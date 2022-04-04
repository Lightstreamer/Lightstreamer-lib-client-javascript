import LoggerManager from "../../src-log/LoggerManager";
import Executor from "../../src-tool/Executor";
import Global from "../Global";
import Constants from "../Constants";
import TlcpServerMessage from "./NewTlcpServerMessage";
import Utils from "../Utils";
  
  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  
  var EvalQueue = function(engId) {
    this.engId = engId;
        
    this.equeue = [];

    this.hasFailed = false;
    this["lsc"] = {};
    this["lsc"]["LS_window"] = Global["_"+engId];
    this["lsc"]["window"] = this["lsc"]["LS_window"];
    this.LS_window = this['lsc']['LS_window'];
    this.LS_l = this.LS_window['LS_l'];
    this.LS_u = this.LS_window['LS_u'];
    this.LS_w = this.LS_window['LS_w'];
    this.LS_e = this.LS_window['LS_e'];
    this.LS_svrname = this.LS_window['LS_svrname'];
    this.LS_n = this.LS_window['LS_n'];
    this.LS_s = this.LS_window['LS_s'];
    this.LS_o = this.LS_window['LS_o'];
    this.LS_l = this.LS_window['LS_l'];
    this.LS_MPNREG = this.LS_window['LS_MPNREG'];
    this.LS_MPNOK = this.LS_window['LS_MPNOK'];
    this.LS_MPNDEL = this.LS_window['LS_MPNDEL'];
    this.dequeueAction = this.generateClosure(this["lsc"]);
    /*
     * If the server sends PROGs, the client captures messages between two consecutive PROGs
     * to ease debugging in case of mismatch between the server and the client counters.
     */
    this.messageCaptureEnabled = false;
    this.capturedMessages = [];
  };
  
  EvalQueue.prototype = {
    
    /*public*/ toString: function() {
      return "[EvalQueue|"+this.equeue.length+"]";
    },
    
    generateClosure: function() {
        var that = this;
        return function(jobToDo) {
            try {
                that.parseText(jobToDo);
                
            } catch (e) {
                that.LS_l(61, null, null, "Malformed message received");
            }
        };
    },
    
    /*public*/ _enqueue: function(_phase,_data) {
      if (!this.stillValid()) {
        //this EvalQueue is corrupted, exit
        return;
      }
      
      this.equeue.push({p:_phase,d:_data});
      
      if (streamLogger.isDebugLogEnabled()) {
        streamLogger.logDebug("Enqueuing received data");
      }
     
      //this.dequeueAll();
      Executor.addTimedTask(this.dequeueAll,0,this);
    },
    
    /*public*/ changeSession: function(newSession) {
      this.session = newSession;
    },
    
    /*
    * executes the eval with the received string
    * it is launched in a new thread in fear that
    * otherwise may cause the browser to not
    * reuse connections and maintain the ajax_frame context / thread
    * NOTE: it is now also used on XHR streaming responses.
    */
    /*private*/ dequeueAll: function() {
      
      if(streamLogger.isDebugLogEnabled()) {
        streamLogger.logDebug("Dequeuing received data",this.equeue.length);
      }
      
      
      while (this.equeue.length > 0) {
        var _el = this.equeue.shift();
        
        if (!this.session || !this.session.checkSessionPhase(_el.p)) {
          streamLogger.logWarn("Data can't be handled", _el.p, _el.d, this.session);
          continue;
        }
        
        
        try {
          this.dequeueAction(_el.d);
        } catch(_e) {
          this.hasFailed = true;
          this.equeue = []; //prevent continuation on a corrupted flow
        //>>excludeStart("debugExclude", pragmas.debugExclude);   
          console.log(_e);
        //>>excludeEnd("debugExclude");
          streamLogger.logError("Unexpected error occurred while executing server-sent commands!",_e,_el.d);
          this.session.evaluationError();
        }
        
      }
      
    },
    
    stillValid: function() {
      return !this.hasFailed;
    },
    
    dispose: function() {
      
    },
    
    parseText: function(text) {
        var phase = null;
        var lines = text.split('\r\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line == '') {
                continue;
            }
            try {
                var msg = new TlcpServerMessage(line);
                if (this.messageCaptureEnabled) {
                    this.capturedMessages.push(msg.getRawMsg());
                }
                switch (msg.getField(0)) {

                case "U":
                    this.processUpdate(msg);
                    break;

                case "REQOK":
                    this.processREQOK(msg);
                    break;

                case "SUBOK":
                    this.processSUBOK(msg);
                    break;

                case "SUBCMD":
                    this.processSUBCMD(msg);
                    break;

                case "UNSUB":
                    this.processUNSUB(msg);
                    break;

                case "CONOK":
                    this.processCONOK(msg);
                    break;

                case "SERVNAME":
                    this.processSERVNAME(msg);
                    break;

                case "CLIENTIP":
                    this.processCLIENTIP(msg);
                    break;

                case "CONS":
                    this.processCONS(msg);
                    break;

                case "LOOP":
                    this.processLOOP(msg);
                    break;

                case "PROG":
                    this.processPROG(msg);
                    break;

                case "CONERR":
                    this.processCONERR(msg);
                    break;

                case "REQERR":
                    this.processREQERR(msg);
                    break;

                case "ERROR":
                    this.processERROR(msg);
                    break;

                case "MSGDONE":
                    this.processMSGDONE(msg);
                    break;

                case "MSGFAIL":
                    this.processMSGFAIL(msg);
                    break;

                case "EOS":
                    this.processEOS(msg);
                    break;

                case "CS":
                    this.processCS(msg);
                    break;

                case "OV":
                    this.processOV(msg);
                    break;

                case "CONF":
                    this.processCONF(msg);
                    break;

                case "PROBE":
                    this.processPROBE(msg);
                    break;

                case "SYNC":
                    this.processSYNC(msg);
                    break;

                case "NOOP":
                    break;

                case "END":
                    this.processEND(msg);
                    break;
                    
                case "MPNREG":
                    this.processMPNREG(msg);
                    break;
                    
                case "MPNOK":
                    this.processMPNOK(msg);
                    break;
                    
                case "MPNDEL":
                    this.processMPNDEL(msg);
                    break;

                default:
                    throw new Error("Unknown message: " + line);
                }
                
            } catch (e) {
                streamLogger.logError("Malformed message: ", line, e);
                throw new Error("Malformed message: " + line);
            }
        }
    },
    
    processUpdate: function(msg) {
        try {
            this.LS_u(null, [msg.subId, msg.itemId].concat(msg.updates));
        } catch (e) {
            streamLogger.logError("Unexpected update", e);
        }
    },
    
    processSUBOK: function(msg) {
        this.LS_w(6, null, msg.subId, msg.numItems, msg.numFields, -1, -1);
    },
    
    processSUBCMD: function(msg) {
        this.LS_w(6, null, msg.subId, msg.numItems, msg.numFields, msg.keyPos - 1, msg.cmdPos - 1);
    },
    
    processUNSUB: function(msg) {
        this.LS_w(8, null, msg.subId);
    },
    
    processCONOK: function(msg) {
        var controlLink = msg.serverInstanceAddress == '*' ? null : msg.serverInstanceAddress;
        this.LS_e(1, null, msg.sessionId, controlLink, msg.keepaliveInterval, msg.requestLimitLength);
    },
    
    processSERVNAME: function(msg) {
        this.LS_svrname(msg.serverSocketName);
    },
    
    processCLIENTIP: function(msg) {
        if (this.session != null) {
            this.session.onIPReceived(msg.clientIp);
        }
    },
    
    processCONS: function(msg) {
        this.LS_e(5, null, msg.realMaxBandwidth);
    },
    
    processLOOP: function(msg) {
        this.LS_e(2, null, msg.loopMs);
    },
    
    processCONERR: function(msg) {
        this.LS_l(msg.causeCode, null, null, msg.causeMsg);
    },
    
    processREQOK: function(msg) {
        if (msg.getRawMsg() == "REQOK") {
            // heartbeats and remote logs don't have reqId and don't need further handling
            return;
        }
        var requestListener = this.getRequestListener(msg.reqId);
        if (requestListener != null) {
            requestListener.onREQOK(this);
        }
    },
    
    processREQERR: function(msg) {
        var requestListener = this.getRequestListener(msg.reqId);
        var listenerCallback = null;
        if (requestListener != null) {
            var that = this;
            listenerCallback = function() {                
                requestListener.onREQERR(that, null, msg.causeCode, msg.causeMsg);
            };
        }
        if (this.session != null) {
            this.session.forwardREQERR(msg.causeCode, msg.causeMsg, listenerCallback);
        }
    },
    
    processERROR: function(msg) {
        if (this.session != null) {
            this.session.forwardERROR(msg.causeCode, msg.causeMsg);
        }
    },
    
    processEOS: function(msg) {
        this.LS_n(null, [msg.subId, msg.itemId]);
    },
    
    processCS: function(msg) {
        this.LS_s(null, [msg.subId, msg.itemId]);
    },
    
    processMSGDONE: function(msg) {
        var prog = msg.getFieldAsInt(2);
        this.LS_w(5, msg.prog, msg.sequence, 0, 0);
    },
    
    processMSGFAIL: function(msg) {
        this.LS_l(msg.causeCode, msg.prog, "MSG" + msg.sequence, msg.causeMsg);
    },
    
    processOV: function(msg) {
        this.LS_o(null, [msg.subId, msg.itemId, msg.lostUpdates]);
    },
    
    processCONF: function(msg) {
        this.LS_w(9, null, msg.subId, msg.frequency);
    },
    
    processPROG: function(msg) {
        this.LS_e(7, null, msg.prog, this.capturedMessages);
        /* */
        this.messageCaptureEnabled = true;
        this.capturedMessages = [];
    },
    
    processPROBE: function(msg) {
        this.LS_u(null, []);
    },
    
    processEND: function(msg) {
        this.LS_e(4, null, msg.causeCode, msg.causeMsg);
    },
    
    processSYNC: function(msg) {
        // SYNC,<secs>
        var phase = null;
        var secs = msg.getFieldAsInt(1);
        this.LS_s(phase, secs);
    },
    
    processMPNREG: function(msg) {
        this.LS_MPNREG(msg.deviceId, msg.adapterName);
    },
    
    processMPNOK: function(msg) {
        this.LS_MPNOK(msg.subId, msg.pnSubId);
    },
    
    processMPNDEL: function(msg) {
        this.LS_MPNDEL(msg.pnSubId);
    },
    
    /**
     * Returns the handler of a request. A request handler has only two methods: onREQOK and onREQERR. 
     * <br>
     * Can be null. 
     */
    getRequestListener: function(reqId) {
        goodcase: 
        {
            if (this.session == null) {                
                break goodcase;
            }
            var requestListener = this.session.controlHandler.getAndRemoveRequestListener(reqId);
            if (requestListener == null) {                
                break goodcase;
            }
            return requestListener;
        }
        return null;
    }
    
  };
  
  export default EvalQueue;
  
