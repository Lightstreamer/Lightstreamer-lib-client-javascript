
/*
ORGANIZE FOR LAZY LOADING OF FALLBACK CLASSES? 
*/


import LoggerManager from "../../src-log/LoggerManager";
import XSXHRConnection from "./XSXHRConnection";
import IEXSXHRConnection from "./IEXSXHRConnection";
import XHRStreamingConnection from "./XHRStreamingConnection";
import XHRConnection from "./XHRConnection";
import FakeNotifyConnection from "./FakeNotifyConnection";
import WebSocketConnection from "./WebSocketConnection";
import Constants from "../Constants";

    function retFalse() {
      return false;
    }  
    var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
    
    var ConnectionSelector = function(connList,blockXDomainRequest,blockCORS) {
      this.localList = connList;
      this.blockXDomainRequest = blockXDomainRequest;
      this.blockCORS = blockCORS;
      this.point = -1;
    };
    
    
    ConnectionSelector.disableWS = function() {
      WebSocketConnection.isAvailable = retFalse;
    };
    ConnectionSelector.disableXHRs = function() {
      XSXHRConnection.isAvailable = retFalse;
      IEXSXHRConnection.isAvailable = retFalse;
      XHRStreamingConnection.isAvailable = retFalse;
      XHRConnection.isAvailable = retFalse;
    };
    
    ConnectionSelector.STREAMING_LIST = [];
    var strList = [XSXHRConnection,IEXSXHRConnection,XHRStreamingConnection];
    for (var i=0; i < strList.length; i++) {
      if (strList[i].isStreamEnabled()) {
        ConnectionSelector.STREAMING_LIST.push(strList[i]);
      }
    }
    
    ConnectionSelector.CONTROL_LIST = [XSXHRConnection,IEXSXHRConnection,XHRConnection];  
    ConnectionSelector.POLL_LIST = [XSXHRConnection,IEXSXHRConnection,XHRConnection];
    
    ConnectionSelector.useRealCallbacks = function(_instance) {
      //check if the class that we're going to use uses fake callbacks (i.e. inherits from FakeNotifyConnection) or not
      //this is a bad trick, do not abuse it
      return _instance.constr.prototype.notifySender != FakeNotifyConnection.prototype.notifySender;
    };
    
    ConnectionSelector.isGood = function(serverToUse,toTest,isCrossSite,areCookiesRequired,isCrossProtocol,hasExtraHeaders,_list) {
      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("Verify connection class", getClassName(toTest));
      }
      if (!toTest.isAvailable(serverToUse)) {
        streamLogger.logDebug("This class is not available on the current environment");
        return false;
      }
      
      if (isCrossSite && !toTest.isCrossSite()) {
        streamLogger.logDebug("Cross-origin request is needed, this class is not able to make cross-origin requests");
        return false;
      }
      
      if (areCookiesRequired && !toTest.areCookiesGuaranteed()) {
        // WARNING!!! Cookie management also involves that requests on different transports
        // share the same cookies, so we cannot state that cookies are managed by taking
        // each transport separately;
        // for now we assume that xmlhttprequest is the master case and that other transports
        // support cookies only if we can share their cookies with those of xmlhttprequest
        streamLogger.logDebug("Cookies on request are required, this class can't guarantee that cookies will be actually sent");
        return false;
      }
      
      if (isCrossProtocol && !toTest.isCrossProtocol()) {
        streamLogger.logDebug("Cross-protocol request is needed, this class is not able to make cross-protocol requests");
        return false;
      }
      
      if (hasExtraHeaders && !toTest.canUseCustomHeaders()) {
        streamLogger.logDebug("Extra headers are given, this class is not able to send requests containing extra headers");
        return false;
      }
      
      if (_list && !inList(toTest,_list)) {
        streamLogger.logDebug("This class can't be used in the current context");
        return false;
      }

      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("Connection class is good", getClassName(toTest));
      }
      
      return true;

    };
    
    function inList(toTest,_list) {
      for (var i = 0; i < _list.length; i++) {
        if (_list[i] == toTest) {
          return true;
        }
      }
      return false;
    }
    
    ConnectionSelector.prototype = {
        
      /*public*/ hasNext: function() {
        return this.point < this.localList.length-1;
      },
    
      /*public*/ getNext: function(serverToUse,isCrossSite,areCookiesRequired,isCrossProtocol,hasExtraHeaders) {
        if (streamLogger.isDebugLogEnabled()) {
            streamLogger.logDebug("Searching for an appropriate connection class",
                    "serverToUse",serverToUse,
                    "isCrossSite",isCrossSite,
                    "areCookiesRequired",areCookiesRequired,
                    "isCrossProtocol",isCrossProtocol,
                    "hasExtraHeaders",hasExtraHeaders);
        }
        while (this.hasNext()) {
          this.point++;
          
          var toTest = this.localList[this.point];
          
          if ((this.blockCORS || this.blockXDomainRequest) && toTest === IEXSXHRConnection) {
            continue;
          }
          
          if (this.blockCORS && toTest === XSXHRConnection) {
            continue;
          }
          
          if (!this.isGood(serverToUse,toTest,isCrossSite,areCookiesRequired,isCrossProtocol,hasExtraHeaders)) {
            continue;
          }
          
          return toTest;
        }
        
        return null;

      },
      
      /*public*/ isGood: function(serverToUse,toTest,isCrossSite,areCookiesRequired,isCrossProtocol,hasExtraHeaders) {
        return ConnectionSelector.isGood(serverToUse,toTest,isCrossSite,areCookiesRequired,isCrossProtocol,hasExtraHeaders,this.localList);
      },
      
      /*public*/ _reset: function() {
        streamLogger.logDebug("Restart connection selector");
        this.point = -1;
      }
    };
    
    var nameFromToStringRegex = /^function\s?([^\s(]*)/;
    
    /**
     * Returns the class name of a constructor function.
     * <br>The name is set in *Connection class.
     */
    function getClassName(ctor) {
        return ctor.name;
    }
    
    export default ConnectionSelector;
    
  