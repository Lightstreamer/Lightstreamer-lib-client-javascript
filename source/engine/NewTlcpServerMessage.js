/**
 * @since January 2018
 */
import Utils from "../Utils";
import Constants from "../Constants";

    var NewTlcpServerMessage = function(msg) {
        this.msg = msg;
        this.fields = msg.split(',');
        this.parse();
    };
    
    NewTlcpServerMessage.prototype = {
            
            getField: function(n) {
                if (n >= this.fields.length) {
                    throw new Error('Field ' + n + ' does not exist');
                }
                return this.fields[n];
            },
            
            getFieldUnquoted: function(n) {
                return Utils.unquote(this.getField(n));
            },
            
            getFieldAsInt: function(n) {
                var f = this.getField(n);
                var num = parseInt(f, 10);
                if (isNaN(num)) {
                    throw new Error('Not an integer field');
                }
                return num;
            },
            
            getFieldAsFloat: function(n) {
                var f = this.getField(n);
                var num = parseFloat(f); 
                if (isNaN(num)) {
                    throw new Error('Not a float field');
                }
                return num;
            },
            
            getRawMsg: function() {
                return this.msg;
            },
            
            toString: function() {
                return this.msg;
            },
            
            parse: function() {
                switch (this.getField(0)) {
                case "U":
                    // U,<subId>,<item>|<field1>|...|<fieldN>
                    // or U,<subId>,<item>,<field1>|^<number of unchanged fields>|...|<fieldN>
                    this.subId = this.getFieldAsInt(1);
                    this.itemId = this.getFieldAsInt(2);
                    this.updates = Utils.parseUpdates(this.msg);
                    break;
                case "PROBE":
                    // PROBE
                    break;
                case "REQOK":
                    if (this.msg !== "REQOK") {
                        // heartbeats and remote logs don't have reqId
                        // REQOK,<reqId>
                        this.reqId = this.getFieldAsInt(1);
                    }
                    break;
                case "REQERR":
                    // REQERR,<reqId>,<errorCode>,<errorMsg>
                    this.reqId = this.getFieldAsInt(1);
                    this.causeCode = this.getFieldAsInt(2);
                    this.causeMsg = this.getFieldUnquoted(3);
                    break;
                case "SUBOK":
                    // SUBOK,<subId>,<total items>,<total fields>
                    this.subId = this.getFieldAsInt(1);
                    this.numItems = this.getFieldAsInt(2);
                    this.numFields = this.getFieldAsInt(3);
                    break;
                case "SUBCMD":
                    // SUBCMD,<subId>,<total items>,<total fields>,<key field>,<command field>
                    this.subId = this.getFieldAsInt(1);
                    this.numItems = this.getFieldAsInt(2);
                    this.numFields = this.getFieldAsInt(3);
                    this.keyPos = this.getFieldAsInt(4);
                    this.cmdPos = this.getFieldAsInt(5);
                    break;
                case "CONF":
                    // CONF,<subId>,(unlimited|<frequency>),(filtered|unfiltered)
                    this.subId = this.getFieldAsInt(1);
                    var mode = this.getField(3);
                    if (mode !== "filtered" && mode !== "unfiltered") {
                        throw new Error("Unknown CONF mode");
                    }
                    var rawFrequency = this.getField(2);
                    if (rawFrequency === "unlimited") {
                        this.frequency = rawFrequency;
                    } else {
                        this.frequency = this.getFieldAsFloat(2);
                    }
                    break;
                case "UNSUB":
                    // UNSUB,<subId>
                    this.subId = this.getFieldAsInt(1);
                    break;
                case "CONOK":
                    // CONOK,<session id>,<request limit>,<keep alive>,<control link>
                    this.sessionId = this.getField(1);
                    this.requestLimitLength = this.getFieldAsInt(2);
                    this.keepaliveInterval = this.getFieldAsInt(3);
                    this.serverInstanceAddress = this.getField(4);
                    break;
                case "SERVNAME":
                    // SERVNAME,<name>
                    this.serverSocketName = this.getField(1);
                    break;
                case "CLIENTIP":
                    // CLIENTIP,<ip>
                    this.clientIp = this.getField(1);
                    break;
                case "CONS":
                    // CONS,(unmanaged|unlimited|<bandwidth>)
                    var rawBandWidth = this.getField(1);
                    if (rawBandWidth === "unlimited" || rawBandWidth === "unmanaged") {
                        this.realMaxBandwidth = rawBandWidth;
                    } else {
                        this.realMaxBandwidth = this.getFieldAsFloat(1);
                    }
                    break;
                case "CONERR":
                case "ERROR":
                case "END":
                    // CONERR,<code>,<message> or
                    // ERROR,<code>,<message> or
                    // END,<code>,<message>
                    this.causeCode = this.getFieldAsInt(1);
                    this.causeMsg = this.getFieldUnquoted(2);
                    break;
                case "WSOK":
                case "NOOP":
                    break;
                case "EOS":
                case "CS":
                    // EOS,<subId>,<item>
                    // CS,<subId>,<item>
                    this.subId = this.getFieldAsInt(1);
                    this.itemId = this.getFieldAsInt(2);
                    break;
                case "OV":
                    // OV,<subId>,<item>,<lost updates>
                    this.subId = this.getFieldAsInt(1);
                    this.itemId = this.getFieldAsInt(2);
                    this.lostUpdates = this.getFieldAsInt(3);
                    break;
                case "MSGDONE":
                    // MSGDONE,<sequence>,<prog>
                    this.sequence = this.getField(1);
                    if (this.sequence === '*') {
                        this.sequence = Constants._UNORDERED_MESSAGES;
                    }
                    this.prog = this.getFieldAsInt(2);
                    break;
                case "MSGFAIL":
                    // MSGFAIL,<sequence>,<prog>,<error-code>,<error-message>
                    this.sequence = this.getField(1);
                    if (this.sequence === '*') {
                        this.sequence = Constants._UNORDERED_MESSAGES;
                    }
                    this.prog = this.getFieldAsInt(2);
                    this.causeCode = this.getFieldAsInt(3);
                    this.causeMsg = this.getFieldUnquoted(4);
                    break;
                case "MPNREG":
                    // MPNREG,<device-id>,<mpn-adapter-name>
                    this.deviceId = this.getField(1);
                    this.adapterName = this.getField(2);
                    break;
                case "MPNOK":
                    // MPNOK,<subscription-id>,<pn-subscription-id>
                    this.subId = this.getField(1);
                    this.pnSubId = this.getField(2);
                    break;
                case "MPNDEL":
                    // MPNDEL,<subscription-id>
                    this.pnSubId = this.getField(1);
                    break;
                case "LOOP":
                    // LOOP,<delay>
                    this.loopMs = this.getFieldAsInt(1);
                    break;
                case "PROG":
                    // PROG,<number>
                    this.prog = this.getFieldAsInt(1);
                    break;
                case "SYNC":
                    // SYNC,<seconds-since-initial-header>
                    this.syncMs = 1000 * this.getFieldAsInt(1);
                    break;
                default:
                    throw new Error("Unknown message " + this.msg);
                }
            }
    };

    export default NewTlcpServerMessage;
