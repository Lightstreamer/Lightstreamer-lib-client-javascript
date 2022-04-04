import LoggerManager from "../../src-log/LoggerManager";
import Utils from "../Utils";
import Copyright from "../Copyright";
import Environment from "../../src-tool/Environment";
import ASSERT from "../../src-test/ASSERT";
import Constants from "../Constants";
  
  var protocolLogger = LoggerManager.getLoggerProxy(Constants.PROTOCOL);

  var SBU_PORTION = "STREAMING_IN_PROGRESS";
  var BIND_SESSION = "bind_session";
  var CREATE_SESSION = "create_session";
  
  var LSVersionParam = "LS_cid=" + Constants.LS_CID + "&";
  //                                   NOTE: the final & is not part of the CID
  
  var validMachinaName = new RegExp("^[a-z][a-z0-9\-]+$");
  var validHost = new RegExp("^((?:[a-z][a-z.0-9\-]+)\.(?:[a-z][a-z\-]+))(?![\\w.])");
  var validIP = new RegExp("^((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(?![\d])");
  var validIPv6 = new RegExp("^[a-f0-9:]+$");
  
   
  
  export default {
    
    /**
     * 
     * @param {String} serverAddress
     * @return {boolean} true if the address is valid, an error message otherwise (hint, check it with === true)
     * @private
     */
    /*public*/ verifyServerAddress: function(serverAddress) {
      serverAddress = serverAddress.toLowerCase();
      var endSch = serverAddress.indexOf("http://") == 0 ? 7 : (serverAddress.indexOf("https://") == 0 ? 8 : -1);
      if (endSch == -1) {
        return "The given server address has not a valid scheme";
      }
      
      var startPort = serverAddress.lastIndexOf(":");
      startPort = startPort > endSch ? startPort : serverAddress.length;
      
      
      var port = this.extractPort(serverAddress,serverAddress.indexOf("://"));
      if (port != null && isNaN(port.substring(1))) {
        return "The given server address has not a valid port";
      }
      
      
      var endHost = serverAddress.indexOf("/",endSch);
      endHost = endHost < startPort ? endHost : startPort;
      
      
      if (serverAddress.charAt(endSch) == "[") {
        //IPv6
        
        var endIp = serverAddress.lastIndexOf("]");
        var toTest = serverAddress.substring(endSch+1,endIp);
        
        if (!validIPv6.test(toTest)) {
          return "The given server address is not a valid IPv6";
        }
        
      } else {
        
        var toTest = serverAddress.substring(endSch,endHost) ;
        
        
        if (toTest.indexOf(".") > -1) {
          if (!validHost.test(toTest)) {
            if (!validIP.test(toTest)) {
              return "The given server address is not a valid URL";
            }
          }
        } else if (!validMachinaName.test(toTest)) {
          return "The given server address is not a valid machine name";
        }
      }
      
      return true;
    },
    
    /*private*/ readUrl: function(url) {
        var urlParts = {};
        var schemaEnd = url.indexOf("://");
        if (schemaEnd != -1) {
            urlParts.schema = url.substring(0, schemaEnd);
            url = url.substring(schemaEnd + 3);
        } else {
            urlParts.schema = null;
        }
        var pathStart = url.indexOf("/");
        if (pathStart != -1) {
            urlParts.path = url.substring(pathStart);
            url = url.substring(0, pathStart);
        } else {
            urlParts.path = null;
        }
        var portStart = this.extractPortStart(url);
        if (portStart != -1) {
            urlParts.port = url.substring(portStart);
            urlParts.host = url.substring(0, portStart - 1);
        } else {
            urlParts.port = null;
            urlParts.host = url;
        }
        return urlParts;
    },

    /*private*/ writeUrl: function(urlParts) {
        var url = urlParts.host;
        if (urlParts.schema != null) {
            url = urlParts.schema + "://" + url;
        }
        if (urlParts.port != null) {
            url += ":" + urlParts.port;
        }
        if (urlParts.path != null) {
            url += urlParts.path;
        }
        if (url.substring(url.length - 1) != "/") {
            url += "/";
        }
        return url;
    },

    /*private*/ extractPortStart: function(address) {
        var portStarts = address.indexOf(":");
        if (portStarts <= -1) {
            return -1;
        }
        if (address.indexOf("]") > -1) {
            portStarts = address.indexOf("]:");
            if (portStarts <= -1) {
                return -1;
            }
            return portStarts + 2;
        } else if (portStarts != address.lastIndexOf(":")) {
            return -1;
        } else {
            return portStarts + 1;
        }
    },
  
    /*public*/ completeControlLink: function(extractFrom, controlLink) { 
        var baseUrl = this.readUrl(extractFrom);
        var clUrl = this.readUrl(controlLink);
        var fullClUrl = {
            schema: clUrl.schema != null ? clUrl.schema : baseUrl.schema,
            host: clUrl.host,
            port: clUrl.port != null ? clUrl.port : baseUrl.port,
            path: clUrl.path
        };
        return this.writeUrl(fullClUrl);
    },
    
    /*public*/ getPushCommand: function(
            pushPhase, sessionId, policyBean, connectionBean, 
            isCreate, isPolling, oldSession, reconnectionCause, 
            delay, askCL, askDomain,
            serverBusy, reverseHeartbeatMaxIntervalMs) {
      
      var domainParam = askDomain && Environment.isBrowserDocument() && !Utils.hasDefaultDomain() ? "LS_domain=" + Utils.getDomain() + "&" : "";
      
      var LSContextParams = "LS_phase=" + pushPhase + "&" + domainParam + (reconnectionCause?"LS_cause="+reconnectionCause+"&":"");
    
      if (isCreate || isPolling) {
        //polling
        LSContextParams += "LS_polling=true&";
        
        var requestedPollingInterval = 0;
        var requestedIdleTimeout = 0;
        if (isPolling) {
           //real polling
          
          requestedPollingInterval = Number(policyBean.pollingInterval);
          // proponiamo il nostro polling interval,
          // anche se il server potra' costringerci ad un'attesa minore.
          // Da notare che noi stessi ci riserviamo poi di poter effettuare
          // un'attesa minore, se ne vale la pena; per esempio sul secondo polling
          if (delay != null && !isNaN(delay)) {
            // chiediamo al Server piu' tempo, per compensare la nostra lentezza
            requestedPollingInterval += delay;
          }
          
          requestedIdleTimeout = policyBean.idleTimeout;
          
        }
        
        if (!isNaN(requestedPollingInterval)) {
            LSContextParams += "LS_polling_millis=" + requestedPollingInterval + "&";
        }
        if (!isNaN(requestedIdleTimeout)) {
          LSContextParams += "LS_idle_millis=" + requestedIdleTimeout + "&";
        }
  
      } else {
        if (policyBean.keepaliveInterval > 0) {
          LSContextParams += "LS_keepalive_millis=" + policyBean.keepaliveInterval + "&";
        }
        if (!policyBean.slowingEnabled) {
          LSContextParams += "LS_send_sync=false&";
        }
        
        // NB don't use policyBean.reverseHeartbeatInterval. Use reverseHeartbeatMaxIntervalMs instead
        // in order for Session.reverseHeartbeatTimer and LS_inactivity_millis to be coherent
        if (reverseHeartbeatMaxIntervalMs > 0) {
          LSContextParams += "LS_inactivity_millis=" + reverseHeartbeatMaxIntervalMs + "&";
        }
          
        if (askCL) {
          LSContextParams += "LS_content_length=" + policyBean.contentLength + "&";
        }
      }
    
      if (!isCreate) {   
        // gestione della richiesta di aggancio a una sessione esistente;
        // bisogna usare l'indirizzo indicato nella sessione, se esiste
        
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        if (!ASSERT.verifyOk(sessionId)) {
          protocolLogger.logError("Unexpectedly missing session id");
        }
      //>>excludeEnd("debugExclude");
  
        var LS_SessionString = "LS_session=" + sessionId + "&";
        
        var res = LS_SessionString + LSContextParams;
        
        protocolLogger.logDebug("Bind request generated",res);
        
        // URL di attivazione Lightstreamer
        return res;
  
      } else {
        // inizio una nuova sessione.

        //ok I know bandwidth has nothing to do with user params, btw...it's just a variable name :)
        
        var LSUserParams = "";
        if (policyBean.requestedMaxBandwidth > 0) { // <=0 means unlimited
          LSUserParams += "LS_requested_max_bandwidth=" + policyBean.requestedMaxBandwidth + "&";
        } 
        
        if (connectionBean.adapterSet != null) {
          LSUserParams += "LS_adapter_set=" + encodeURIComponent(connectionBean.adapterSet) + "&";
        }
        if (connectionBean.user != null) {
          LSUserParams += "LS_user=" + encodeURIComponent(connectionBean.user) + "&";
        }
        
        var lsUrl = /*"LS_op2=create&" +*/ LSContextParams + LSVersionParam + LSUserParams;
        if (oldSession) {
          // esiste gia` una sessione aperta; la nuova sessione la sostituira`.
          // per evitare problemi di diritti sulle risorse, la richiesta viene
          // corredata dall'indicazione della vecchia sessione da 'rottamare'
          lsUrl += ("LS_old_session=" + oldSession + "&");
        }
        
        if (serverBusy) {
            lsUrl += "LS_ttl_millis=unlimited&";
        }
        
        protocolLogger.logDebug("Create request generated",lsUrl);
        
        //first log the request, then attach the password...
        if (connectionBean.password != null) {
          lsUrl += "LS_password=" + encodeURIComponent(connectionBean.password) + "&";
        }
        
        return lsUrl;
      }
    },
    
    /**
     * A recovery request is a special type of bind_session request with the additional LS_recovery_from parameter.
     */
    getRecoveryCommand: function(pushPhase, sessionId, policyBean, reconnectionCause, delay, askDomain, sessionRecoveryProg) {
        var domainParam = askDomain && Environment.isBrowserDocument() && !Utils.hasDefaultDomain() ? "LS_domain=" + Utils.getDomain() + "&" : "";
        
        var LSContextParams = "LS_phase=" + pushPhase + "&" + domainParam + (reconnectionCause?"LS_cause="+reconnectionCause+"&":"");
        
        LSContextParams += "LS_polling=true&";
        var requestedPollingInterval = 0;
        if (delay != null && !isNaN(delay)) {
            requestedPollingInterval += delay;
        }
        LSContextParams += "LS_polling_millis=" + requestedPollingInterval + "&";
        LSContextParams += "LS_idle_millis=0&"
            
        if (policyBean.requestedMaxBandwidth > 0) { // <=0 means unlimited
            LSContextParams += "LS_requested_max_bandwidth=" + policyBean.requestedMaxBandwidth + "&";
        }
        
        LSContextParams += "LS_session=" + sessionId + "&";
        
        LSContextParams += "LS_recovery_from=" + sessionRecoveryProg + "&";
        
        protocolLogger.logDebug("Recovery request generated", LSContextParams);
        
        return LSContextParams;
    },
    
    /*public*/ getDestroyParams: function(sessionId,reason) {
      var _data = {
          "LS_op": "destroy",
          "LS_session": sessionId,
          "LS_reqId": Utils.nextRequestId()
      };
      
      if (reason) {
        _data["LS_cause"]=reason;
      }
      
      protocolLogger.logDebug("Destroy request generated");
      
      return _data;
    },
    
    /*public*/ getForceRebindParams: function(rebindCause,_delay) {
      var _data = {
          "LS_op": "force_rebind",
          "LS_reqId": Utils.nextRequestId()
      };
      if (rebindCause) {
        _data["LS_cause"]=rebindCause;
      }
      
      if(_delay != null && !isNaN(_delay)) {
        _data["LS_polling_millis"]=_delay;
      }
      
      protocolLogger.logDebug("Force rebind request generated");
      
      return _data;
    },
    
    /*public*/ getLogRequestParams: function(pushPhase,msg,buildNum) {
      msg["LS_build"] = buildNum;
      msg["LS_phase"] = pushPhase;
      return msg; 
    },
    
    /*public*/ getConstraintParams: function(policyBean) {
      return {
        "LS_op": "constrain",
        "LS_requested_max_bandwidth": (policyBean.requestedMaxBandwidth > 0 ? policyBean.requestedMaxBandwidth : "unlimited"),
        "LS_reqId": Utils.nextRequestId()
      };
    },
    
    /*public*/ getPushPath: function(isCreate,isPolling,suffix) {
      var res;
      if (isPolling || (suffix != null && suffix.indexOf(".txt") == 0) || suffix == "") {
          if (isCreate) {
              res = this.getCreateSessionExtraPath() + CREATE_SESSION + suffix;
          } else {
              res = BIND_SESSION + suffix;
          }
          
      } else {
          if (isCreate) {
              res = this.getCreateSessionExtraPath() + SBU_PORTION;
          } else {
              res = SBU_PORTION;
          }
      }
      return res;
    },
    
    /**
     * The recovery request is a special type of bind_session.
     */
    getRecoveryPath: function(suffix) {
        return BIND_SESSION + suffix;
    },
    
    /*private*/ getCreateSessionExtraPath: function() {
      return "";
    },

    /*private*/ setCID: function(str) {
        // available for test clients using the source code
        LSVersionParam = str;
    },
    
    /*private*/ extractPort: function(extractFrom,protLoc) {
        var portStarts = extractFrom.indexOf(":",protLoc+1);
        if (portStarts <= -1) {
          return null;
        }
        
        if (extractFrom.indexOf("]") > -1) {
          portStarts = extractFrom.indexOf("]:");
          if (portStarts <= -1) {
            return null;
          }
          portStarts+=1;
          
        } else if (portStarts != extractFrom.lastIndexOf(":")) {
          return null;
        }
          
        
        var portEnds = extractFrom.indexOf("/",protLoc+3);
        
        return portEnds > -1 ? extractFrom.substring(portStarts,portEnds) : extractFrom.substring(portStarts);
         
      }
    
  };
  
  
  