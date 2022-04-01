import LoggerManager from "../../src-log/LoggerManager";
import Executor from "../../src-tool/Executor";
import Global from "../Global";
import ASSERT from "../../src-test/ASSERT";
import Constants from "../Constants";
import TlcpServerMessage from "./TlcpServerMessage";
import EncodingUtils from "./EncodingUtils";
  
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
        // U,<table>,<item>|<field1>|...|<fieldN>
        // or U,<table>,<item>,<field1>|^<number of unchanged fields>|...|<fieldN>
        var phase = null;
        var table = msg.getFieldAsInt(1);
        var item = msg.getFieldAsInt(2);
        var updates = this.parseUpdates(msg.getRawMsg());
        try {
            this.LS_u(phase, [table, item].concat(updates));
        } catch (e) {
            streamLogger.logError("Unexpected update", e);
        }
    },
    
    processSUBOK: function(msg) {
        // SUBOK,<table>,<total items>,<total fields>
        var phase = null;
        var table = msg.getFieldAsInt(1);
        var totalItems = msg.getFieldAsInt(2);
        var totalFields = msg.getFieldAsInt(3);
        this.LS_w(6, phase, table, totalItems, totalFields, -1, -1);
    },
    
    processSUBCMD: function(msg) {
        // SUBCMD,<table>,<total items>,<total fields>,<key field>,<command field>
        var phase = null;
        var table = msg.getFieldAsInt(1);
        var totalItems = msg.getFieldAsInt(2);
        var totalFields = msg.getFieldAsInt(3);
        var keyPos = msg.getFieldAsInt(4);
        var cmdPos = msg.getFieldAsInt(5);
        this.LS_w(6, phase, table, totalItems, totalFields, keyPos - 1, cmdPos - 1);
    },
    
    processUNSUB: function(msg) {
        // UNSUB,<table>
        var phase = null;
        var table = msg.getFieldAsInt(1);
        this.LS_w(8, phase, table);
    },
    
    processCONOK: function(msg) {
        // CONOK,<session id>,<request limit>,<keep alive>,<control link>
        var phase = null;
        var sessionId = msg.getField(1);
        var reqLimit = msg.getFieldAsInt(2);
        var keepAlive = msg.getFieldAsInt(3);
        var controlLink = msg.getField(4) == '*' ? null : msg.getField(4);
        this.LS_e(1, phase, sessionId, controlLink, keepAlive, reqLimit);
    },
    
    processSERVNAME: function(msg) {
        // SERVNAME,<name>
        var serverName = msg.getField(1);
        this.LS_svrname(serverName);
    },
    
    processCLIENTIP: function(msg) {
        // CLIENTIP,<ip>
        var clientIp = msg.getField(1);
        if (this.session != null) {
            this.session.onIPReceived(clientIp);
        }
    },
    
    processCONS: function(msg) {
        // CONS,(unmanaged|unlimited|<bandwidth>)
        var phase = null;
        var maxBandWidth;
        var rawBandWidth = msg.getField(1);
        if (rawBandWidth == "unlimited" || rawBandWidth == "unmanaged") {
            maxBandWidth = rawBandWidth;
        } else {
            maxBandWidth = msg.getFieldAsFloat(1);
        }
        this.LS_e(5, phase, maxBandWidth);
    },
    
    processLOOP: function(msg) {
        var phase = null;
        var loopMs = msg.getFieldAsInt(1);
        this.LS_e(2, phase, loopMs);
    },
    
    processCONERR: function(msg) {
        // CONERR,<error code>,<error message>
        var phase = null;
        var errorCode = msg.getFieldAsInt(1);
        var errorMsg = msg.getFieldUnquoted(2);
        this.LS_l(errorCode, phase, null, errorMsg);
    },
    
    processREQOK: function(msg) {
        if (msg.getRawMsg() == "REQOK") {
            // heartbeats and remote logs don't have reqId and don't need further handling
            return;
        }
        // REQOK,<reqId>
        var reqId = msg.getFieldAsInt(1);
        var requestListener = this.getRequestListener(reqId);
        if (requestListener != null) {
            requestListener.onREQOK(this);
        }
    },
    
    processREQERR: function(msg) {
        // REQERR,<reqId>,<errorCode>,<errorMsg>
        var phase = null;
        var reqId = msg.getFieldAsInt(1);
        var errorCode = msg.getFieldAsInt(2);
        var errorMsg = msg.getFieldUnquoted(3);
        var requestListener = this.getRequestListener(reqId);
        var listenerCallback = null;
        if (requestListener != null) {
            var that = this;
            listenerCallback = function() {                
                requestListener.onREQERR(that, phase, errorCode, errorMsg);
            };
        }
        if (this.session != null) {
            this.session.forwardREQERR(errorCode, errorMsg, listenerCallback);
        }
    },
    
    processERROR: function(msg) {
        // ERROR,<errorCode>,<errorMsg>
        var errorCode = msg.getFieldAsInt(1);
        var errorMsg = msg.getFieldUnquoted(2);
        if (this.session != null) {
            this.session.forwardERROR(errorCode, errorMsg);
        }
    },
    
    processEOS: function(msg) {
        // EOS,<table>,<item>
        var phase = null;
        var table = msg.getFieldAsInt(1);
        var item = msg.getFieldAsInt(2);
        this.LS_n(phase, [table, item]);
    },
    
    processCS: function(msg) {
        // CS,<table>,<item>
        var phase = null;
        var table = msg.getFieldAsInt(1);
        var item = msg.getFieldAsInt(2);
        this.LS_s(phase, [table, item]);
    },
    
    processMSGDONE: function(msg) {
        // MSGDONE,<sequence>,<prog>
        var sequence = msg.getField(1);
        if (sequence == '*') {
            sequence = Constants._UNORDERED_MESSAGES;
        }
        var prog = msg.getFieldAsInt(2);
        this.LS_w(5, prog, sequence, 0, 0);
    },
    
    processMSGFAIL: function(msg) {
        // MSGFAIL,<sequence>,<prog>,<error-code>,<error-message>
        var sequence = msg.getField(1);
        if (sequence == '*') {
            sequence = Constants._UNORDERED_MESSAGES;
        }
        var prog = msg.getFieldAsInt(2);
        var errCode = msg.getFieldAsInt(3);
        var errMsg = msg.getFieldUnquoted(4);
        this.LS_l(errCode, prog, "MSG" + sequence, errMsg);
    },
    
    processOV: function(msg) {
        // OV,<table>,<item>,<lost updates>
        var phase = null;
        var table = msg.getFieldAsInt(1);
        var item = msg.getFieldAsInt(2);
        var lost = msg.getFieldAsInt(3);
        this.LS_o(phase, [table, item, lost]);
    },
    
    processCONF: function(msg) {
        // CONF,<table>,(unlimited|<frequency>),(filtered|unfiltered)
        var phase = null;
        var table = msg.getFieldAsInt(1);
        var frequency;
        var rawFrequency = msg.getField(2);
        var mode = msg.getField(3);
        if (mode != "filtered" && mode != "unfiltered") {
            throw new Error("Unknown mode");
        }
        if (rawFrequency == "unlimited") {
            frequency = rawFrequency;
        } else {
            frequency = msg.getFieldAsFloat(2);
        }
        this.LS_w(9, phase, table, frequency);
    },
    
    processPROG: function(msg) {
        // PROG,<number>
        var phase = null
        var prog = msg.getFieldAsInt(1);
        this.LS_e(7, phase, prog, this.capturedMessages);
        /* */
        this.messageCaptureEnabled = true;
        this.capturedMessages = [];
    },
    
    processPROBE: function(msg) {
        // PROBE
        var phase = null;
        this.LS_u(phase, []);
    },
    
    processEND: function(msg) {
        // END,<cause>,<message>
        var phase = null;
        var cause = msg.getFieldAsInt(1);
        var message = msg.getFieldUnquoted(2);
        this.LS_e(4, phase, cause, message);
    },
    
    processSYNC: function(msg) {
        // SYNC,<secs>
        var phase = null;
        var secs = msg.getFieldAsInt(1);
        this.LS_s(phase, secs);
    },
    
    processMPNREG: function(msg) {
        // MPNREG,<device-id>,<mpn-adapter-name>
        var phase = null;
        var deviceId = msg.getField(1);
        var adapterName = msg.getField(2);
        this.LS_MPNREG(deviceId, adapterName);
    },
    
    processMPNOK: function(msg) {
        // MPNOK,<subscription-id>,<pn-subscription-id>
        var phase = null;
        var lsSubId = msg.getField(1);
        var pnSubId = msg.getField(2);
        this.LS_MPNOK(lsSubId, pnSubId);
    },
    
    processMPNDEL: function(msg) {
        // MPNDEL,<subscription-id>
        var phase = null;
        var pnSubId = msg.getField(1);
        this.LS_MPNDEL(pnSubId);
    },
    
    parseUpdates: function(message) {
        // U,<table>,<item>|<field1>|...|<fieldN>
        // or U,<table>,<item>,<field1>|^<number of unchanged fields>|...|<fieldN>
        /* parse table and item */
        var tableIndex = message.indexOf(',') + 1;
        ASSERT.verifyOk(tableIndex == 2); // tested by the caller
        var itemIndex = message.indexOf(',', tableIndex) + 1;
        if (itemIndex <= 0) {
            throw new Error("Missing subscription field");
        }
        var fieldsIndex = message.indexOf(',', itemIndex) + 1;
        if (fieldsIndex <= 0) {
            throw new Error("Missing item field");
        }
        ASSERT.verifyOk(message.substring(0, tableIndex) == "U,"); // tested by the caller
        var table = myParseInt(message.substring(tableIndex, itemIndex - 1), "Invalid subscription");
        var item = myParseInt(message.substring(itemIndex, fieldsIndex - 1), "Invalid item");

        /* parse fields */
        var unchangedMarker = {};
        unchangedMarker.length = -1;

        var values = [];
        var fieldStart = fieldsIndex - 1; // index of the separator introducing the next field
        ASSERT.verifyOk(message.charAt(fieldStart) == ','); // tested above
        while (fieldStart < message.length) {

            var fieldEnd = message.indexOf('|', fieldStart + 1);
            if (fieldEnd == -1) {
                fieldEnd = message.length;
            }
            /*
                 Decoding algorithm:
                     1) Set a pointer to the first field of the schema.
                     2) Look for the next pipe “|” from left to right and take the substring to it, or to the end of the line if no pipe is there.
                     3) Evaluate the substring:
                            A) If its value is empty, the pointed field should be left unchanged and the pointer moved to the next field.
                            B) Otherwise, if its value corresponds to a single “#” (UTF-8 code 0x23), the pointed field should be set to a null value and the pointer moved to the next field.
                            C) Otherwise, If its value corresponds to a single “$” (UTF-8 code 0x24), the pointed field should be set to an empty value (“”) and the pointer moved to the next field.
                            D) Otherwise, if its value begins with a caret “^” (UTF-8 code 0x5E):
                                    - take the substring following the caret and convert it to an integer number;
                                    - for the corresponding count, leave the fields unchanged and move the pointer forward;
                                    - e.g. if the value is “^3”, leave unchanged the pointed field and the following two fields, and move the pointer 3 fields forward;
                            E) Otherwise, the value is an actual content: decode any percent-encoding and set the pointed field to the decoded value, then move the pointer to the next field.
                               Note: “#”, “$” and “^” characters are percent-encoded if occurring at the beginning of an actual content.
                     4) Return to the second step, unless there are no more fields in the schema.
             */
            var value = message.substring(fieldStart + 1, fieldEnd);
            if (value == "") { // step A
                values.push(unchangedMarker);

            } else if (value.charAt(0) == '#') { // step B
                if (value.length != 1) {
                    throw new Error("Wrong field quoting");
                } // a # followed by other text should have been quoted
                values.push(null);

            } else if (value.charAt(0) == '$') { // step C
                if (value.length != 1) {
                    throw new Error("Wrong field quoting");
                } // a $ followed by other text should have been quoted
                values.push("");

            } else if (value.charAt(0) == '^') { // step D
                var count = myParseInt(value.substring(1), "Invalid field count");
                while (count-- > 0) {
                    values.push(unchangedMarker);
                }

            } else { // step E
                var unquoted = EncodingUtils.unquote(value);
                values.push(unquoted);
            }
            fieldStart = fieldEnd;
        }
        return values;
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
  
  function myParseInt(field, errorMsg) {
      var n = parseInt(field, 10);
      if (isNaN(n)) {
          throw new Error(errorMsg);
      }
      return n;
  }
  
  export default EvalQueue;
  
