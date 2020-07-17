import ServerConnection from "./ServerConnection";
import Inheritance from "../../src-tool/Inheritance";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import Executor from "../../src-tool/Executor";
import Environment from "../../src-tool/Environment";
import LoggerManager from "../../src-log/LoggerManager";
import Utils from "../Utils";
import ASSERT from "../../src-test/ASSERT";
import WSEncoder from "../encoders/WSEncoder";
import Constants from "../Constants";
import nodeUtils from 'node-utils';

  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);
  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);

  var NodeWS = null;
  if (Environment.isNodeJS()) {
    NodeWS = nodeUtils.NodeWS;
  }



  var JS_PROTOCOL = Constants.TLCP_VERSION + ".lightstreamer.com";

  function WebSocketConnection(wsSession) {
     this._callSuperConstructor(WebSocketConnection);

     this.objectId = Utils.nextObjectId();
     if (streamLogger.isDebugLogEnabled()) {
         streamLogger.logDebug("New WS connection oid=", this.objectId);
     }
     this.isOpen=false;
     this.exePhase=null;
     this.openPhase=null;
     this.openRequest=null;
     this.webSocketInstance = null;
     this.openEvent = false;
     this.openFailure = false;
     this.serverInUse = null;
     this.openEventFired = false;
     /*
      * When not null, the requests may omit the parameter LS_session because it is implicitly equal to this value.
      * This value is always equal to the LS_session parameter of the last sent bind_session request.
      */
     this.defaultSessionId = null;

     this.wsSession = wsSession;

     this.constr = WebSocketConnection;
     
     this.wsEncoder = new WSEncoder(this);
  }
  if (WebSocketConnection.name == null) {
      WebSocketConnection.name = "WebSocketConnection";
  }

  var disabled = false;
  var disabledFor = {};

  WebSocketConnection.disableClass = function(forAddress) {
    if (forAddress) {
      disabledFor[forAddress] = true;
    } else {
      disabled = true;
    }
  };
  WebSocketConnection.restoreClass = function(forAddress) {
    if (forAddress) {
      delete(disabledFor[forAddress]);
    } else {
      disabled = false;
      disabledFor = {};
    }
  };
  WebSocketConnection.isDisabledClass = function() {
    for (var i in disabledFor) {
      return true;
    }
    return disabled;
  };

  //this must become a factory that is able to give me the same websocket on different instances of WebSocketConnection (create/bind and control
  function getWebSocket(_url) {

    _url = _url.toLowerCase();
    if (_url.indexOf("http://") == 0) {
      _url = _url.replace("http://","ws://");
    } else {
      _url = _url.replace("https://","wss://");
    }

    if (NodeWS) {
      var cookie = "";
      var cookies = ServerConnection.getGlobalCookiesForNode(_url);
      /* Set header Cookie */
      cookies.forEach(function(cookie_i, i, array) {
          // BEGIN ported from cookie_send in xmlhttprequest-cookie
          if (cookie !== "")
              cookie += "; ";
          cookie += cookie_i['name'] + "=" + cookie_i['value'];
          // END ported from cookie_send in xmlhttprequest-cookie
      });

      var options = {};
      if (cookie.length > 0) {
          options.headers = { 'Cookie' : cookie };
      }
      return new NodeWS(_url,JS_PROTOCOL,options);
    } else if (typeof WebSocket != "undefined") {
      return new WebSocket(_url,JS_PROTOCOL);
    } else if (typeof MozWebSocket != "undefined") {
      return new MozWebSocket(_url,JS_PROTOCOL);
    }

    //due to the isAvailable method this should never happen
    WebSocketConnection.disableClass();
    return null;
  }

  ServerConnection.attachPublicStaticMethods(WebSocketConnection,{
    isAvailable: function(address) {
      if (disabled) {
        return false;
      } else if (address && disabledFor[address]) {
        return false;
      }

      var WSClass = null;
      if (typeof WebSocket != "undefined") {
        WSClass = WebSocket;
      } else if (typeof MozWebSocket != "undefined") {
        WSClass = MozWebSocket;
      }

      if (WSClass) {
        if (WSClass.prototype.CLOSED == 2) {
          //Safari is still using version "-00" of the draft
          return false;
        }
      }

      return (NodeWS || WSClass);
    },
    isCrossSite: true,
    isCrossProtocol: function() {
      return !Environment.isBrowser() || location.protocol != "https:";
    },
    areCookiesGuaranteed: function() {
        return true;
    },
    attachEngineId: false,
    isStreamEnabled: true,
    canUseCustomHeaders: false
  });

  WebSocketConnection.prototype = {

    toString: function() {
      return ["[","WebSocketConnection",this.isOpen,this.openPhase,this.exePhase,this.isReadyToSend(),"]"].join("|");
    },

    _close: function() {
      if (!this.webSocketInstance) {
        return; //wait please :)
      }

      streamLogger.logDebug("Closing WebSocket connection");

      //"disable callbacks"
      this.openPhase = null;

      if (this.webSocketInstance) {
        try {
          this.webSocketInstance.close(1000);
        } catch (__e) {
          //INVALID_ACCESS_ERR
            //An invalid code was specified.
          //SYNTAX_ERR
            //The reason string is too long or contains unpaired surrogates.
          streamLogger.logDebug("Error closing WebSocket connection",__e);
        }
      }

      this.off();

      return;
    },

    openSocket: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      if (this.isOpen) {
        streamLogger.logError("Unexpected openSocket call");
      } else if(disabled) {
        return false;
      }

      this.openFailure = false;

      this.serverInUse = request.getPath();
      this.openPhase = phase;

      try {
        this.webSocketInstance = getWebSocket(this.serverInUse);
      } catch(_e) {
        streamLogger.logDebug("Error opening WebSocket connection",_e);
        return false;
        //SECURITY_ERR
        //The port to which the connection is being attempted is being blocked.
      }

      if (sessionLogger.isDebugLogEnabled()) {        
          sessionLogger.debug("Status timeout in " + this.wsSession.getCurrentConnectTimeout() + " [currentConnectTimeoutWS]");
      }
      Executor.addTimedTask(this.openWSTimeout,this.wsSession.getCurrentConnectTimeout(),this,[this.openPhase]);


      var that = this;
      this.webSocketInstance.onmessage = function(evt) {
        that.onPartialResponse(evt,phase,responseCallback);
      };
      this.webSocketInstance.onerror = function() {
        that.onErrorResponse(phase,errorCallback);
      };
      this.webSocketInstance.onclose = function(closeEv) {
        that.onCloseResponse(closeEv, phase, connectionEndCallback,errorCallback);
      };
      this.webSocketInstance.onopen = function() {
        if (Environment.isNodeJS()) {
            /*
             * Add cookie definitions in the WebSocket handshake response to the cookie jar (maintained by the HTTP transport manager).
             *
             * Problem: HTTP and WebSocket transports are independent components not sharing the cookies.
             *
             * Solution: Use the cookie manager of the HTTP transport to holds also the cookies returned by
             * the WebSocket handshake response.
             */
            var headers = that.webSocketInstance.headers;
            if (headers['set-cookie']) {
                /*
                 * NOTE
                 * Notwithstanding  RFC 6265 section 3 forbids set-cookie header folding,
                 * faye-websocket folds multiple set-cookie headers into a single header separating the values by commas.
                 *
                 * The procedure parseSetCookieHeader recovers the cookie definitions from the collapsed header.
                 */
                var cookies = Utils.parseSetCookieHeader(headers['set-cookie']);
                ServerConnection.addGlobalCookiesForNode(request.getUrl(), cookies);
            }
        }
        that.onOpenEvent(phase);
      };

      return true;

    },

    openWSTimeout: function(ph) {
      if (ph == this.openPhase && this.webSocketInstance && !this.openEventFired) {
        try {
          sessionLogger.logDebug("Timeout event [currentConnectTimeoutWS]");
          this.wsSession.policyBean.increaseConnectTimeout();

          this.webSocketInstance.close(1000);
        } catch(_e) {
          streamLogger.logDebug("error on closing a timed out WS");
        }
      }
    },

    _load: function(request,phase) {
      if (this.isOpen) {
        streamLogger.logError("Unexpected WebSocket _load call");
        return null;
        //instances of WebSocketConnection are never _load twice
        //so this should not happen
      } else if(disabled) {
        return false;
      }

      this.openRequest=request;

      this.exePhase = phase;

      streamLogger.logDebug("Preparing to bind on WebSocket connection",request.getUrl());

      if (this.isReadyToSend()) {
        //on open event already fired
        this.sendFirstRequest(phase);

      } //else during the onOpen event we will send the cached request. If the onOpen is never fired we will have a timeout and a reconnect (that is the theoretical worst case as usually we have an open error event before the timeout goes off.

      return true;

    },

    isConnectedToServer: function(serverAddress) {
    //>>excludeStart("debugExclude", pragmas.debugExclude);
      if (!ASSERT.verifyOk(this.serverInUse)) {
        streamLogger.logError("Open path is disappeared");
        return false;
      }
    //>>excludeEnd("debugExclude");
      return this.serverInUse.indexOf(serverAddress)==0;
    },

    isReadyToSend: function() {
      return this.webSocketInstance != null && this.webSocketInstance.readyState == 1;  //OPEN = 1
    },

    _send: function(req,ph) {
      if (!this.isReadyToSend()) {
        return null;
      }

      if (ph) {
        //if a phase is specified, this is a bind request. In such case we have to update our internal phase
        //and to extend the request as sessionLoad does
        this.updatePhase(ph);
      }

      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("WebSocket transport sending oid=", this.objectId, req.getFile(), req.getData());
      }

      try {
        this.webSocketInstance.send(req.getFile() + "\r\n" + req.getData());
      } catch(_e) {
        streamLogger.logError("Error sending data over WebSocket",_e);
        //INVALID_STATE_ERR
          //The connection is not currently OPEN.
        //SYNTAX_ERR
          //The data is a string that has unpaired surrogates.
        return false;
      }

      return true;
    },

    sendFirstRequest: function(phase) {

      var res = this._send(this.openRequest,phase);
    //>>excludeStart("debugExclude", pragmas.debugExclude);
      if (!ASSERT.verifyOk(res !== null)) {
        streamLogger.logError("Unexpected send outcome while websocket is ready-to-send",phase);
      }
    //>>excludeEnd("debugExclude");
      if (res) {
        this.isOpen = true;
        this.wsSession.firstSentNotification(this.openPhase);
      }

    },

    /*public*/ updatePhase: function(ph) {
      this.exePhase = ph;
    },

///////////////////////////EVENTS

    /*
    readyState
         CONNECTING 0 The connection is not yet open.
         OPEN  1 The connection is open and ready to communicate.
         CLOSING 2 The connection is in the process of closing.
         CLOSED  3 The connection is closed or couldn't be opened.

    bufferedAmount
        unsigned long The number of bytes of data that have been queued using calls to send() but not yet transmitted to the network. This value does not reset to zero when the connection is closed; if you keep calling send(), this will continue to climb. Read only.

    */

    /*private*/ onPartialResponse: function(evt,phase,responseCallback) {
      if (this.openPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }

      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("WebSocket transport receiving oid=", this.objectId, evt.data);
      }

      //I had to move this flag here as it happened that a websocket received the onopen event and then anything else.
      //After a while the connection was broken and since this flag was already true the client did not disable the WS connection
      //and went on retrying the same connection. The loop of failures was broken when a WS did not break for long enough for the
      //stream-sense timeout to be executed

      this.openEvent = true;
      Executor.executeTask(responseCallback, [evt.data,this.exePhase]);
    },

    /*private*/ onErrorResponse: function(phase,errorCallback) {
      if (this.openPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }

      streamLogger.logError("Error on WebSocket connection oid=", this.objectId);


      this.openFailure |= !this.openEvent;
      Executor.executeTask(errorCallback, ["wsc.unknown",this.openPhase,true,this.openFailure,false]);
    },

    /*private*/ onOpenEvent: function(phase,req) {
      if (this.openPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }

      this.openEventFired = true;
      //this.openEvent = true;
      streamLogger.logDebug("WebSocket connection ready");

      if (this.openRequest) {
        //sessionLoad already called
        this.sendFirstRequest();
      }

    },

    /*private*/ onCloseResponse: function(closeEv,phase,connectionEndCallback,errorCallback) {
      if (this.openPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }

      var closeCode = closeEv ? closeEv.code : -1;

      streamLogger.logDebug("WebSocket connection close event received",closeCode,this.openEvent);

      if (closeCode == 1000 || closeCode == 1001) {
        //this is a good end, so it's supposed to happen for a good reason
        //the sad fact is that FX calls this when navigating away from a page so...
        //..let's delay the end check a little bit.
        Executor.modifyAllTaskParams(connectionEndCallback,[this.openPhase,true]);
        Executor.addPackedTimedTask(connectionEndCallback,300);
        this.off();

      } else if (closeCode == 1011) {
        //the server got an unexpected error;
        //we should retry, but in a reasonable time, in order to avoid loops;
        //the reconnection timeout could be a good compromise
        this.openFailure |= !this.openEvent;
        var ph = this.openPhase;
        this.off();
        Executor.executeTask(errorCallback, ["wsc.server",ph,true,this.openFailure,true]);

      } else {
        this.openFailure |= !this.openEvent;
        var ph = this.openPhase;
        this.off();
        Executor.executeTask(errorCallback, ["wsc."+closeCode,ph,true,this.openFailure,false]);
      }



      /*

      closeEv.code:

      0-999   Reserved and not used.

      1000 indicates a normal closure, meaning whatever purpose the connection was established for has been fulfilled.
      1001 indicates that an endpoint is "going away", such as a server going down, or a browser having navigated away from a page.
      1002 indicates that an endpoint is terminating the connection due to a protocol error.
      1003 indicates that an endpoint is terminating the connection because it has received a type of data it cannot accept (e.g. an endpoint that understands only text data MAY send this if it receives a binary message).
      1004 Reserved.  The specific meaning might be defined in the future.
      1005 is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint.  It is designated for use in applications expecting a status code to indicate that no status code was actually present.
      1006 is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint.  It is designated for use in applications expecting a status code to indicate that the connection was closed abnormally, e.g. without sending or receiving a Close control frame.
      1007 indicates that an endpoint is terminating the connection because it has received data within a message that was not  consistent with the type of the message (e.g., non-UTF-8 [RFC3629] data within a text message).
      1008 indicates that an endpoint is terminating the connection because it has received a message that violates its policy. is a generic status code that can be returned when there is no other more suitable status code (e.g. 1003 or 1009), or if there is a need to hide specific details about the policy.
      1009 indicates that an endpoint is terminating the connection because it has received a message which is too big for it to process.
      1010 indicates that an endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake.  The list of extensions which are needed SHOULD appear in the /reason/ part of the Close frame.   Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
      1011 indicates that a server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.
      1015 is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint.  It is designated for use in applications expecting a status code to indicate that the connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).

      1000-2999   Status codes in the range 1000-2999 are reserved for definition by  this protocol, its future revisions, and extensions specified in a  permanent and readily available public specification.
      3000-3999   Status codes in the range 3000-3999 are reserved for use by libraries, frameworks and application.  These status codes are registered directly with IANA.  The interpretation of these codes is undefined by this protocol.
      4000-4999   Status codes in the range 4000-4999 are reserved for private use and thus can't be registered.  Such codes can be used by prior agreements between WebSocket applications. The interpretation of these codes is undefined by this protocol.

      NOTE (20111214) on MDN 1004 is described as CLOSE_TOO_LARGE The endpoint is terminating the connection because a data frame was received that is too large.

      closeEv.reason
      closeEv.wasClean

      */

    },


/////////////////////////////////////EVENTS END

    /*private*/ off: function() {
      this.isOpen = false;
      this.openEventFired = false;
      this.openPhase = null;
      this.openRequest=null;
      this.openEvent = false;
      this.webSocketInstance = null;
      this.serverInUse = null;
    },

    /*public*/ getEncoder: function() {
      return this.wsEncoder;
    },
    
    /**
     * Sets the default session id of a WebSocket connection.
     * The default id is the id returned in the response of a bind_session.
     * It lasts until the end of streaming/polling.
     */
    /*public*/ setDefaultSessionId: function(defaultSessionId) {
        if (streamLogger.isDebugLogEnabled()) {
            streamLogger.logDebug("New sessionId", defaultSessionId + " on WS connection oid=" + this.objectId);
        }
        this.defaultSessionId = defaultSessionId;
    },
    
    /*public*/ getDefaultSessionId: function() {
        return this.defaultSessionId;
    }
  };


  Inheritance(WebSocketConnection, ServerConnection);
  export default WebSocketConnection;

