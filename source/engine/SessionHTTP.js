import Constants from "../Constants";
import Inheritance from "../../src-tool/Inheritance";
import Session from "./Session";
import ConnectionSelector from "../net/ConnectionSelector";
import Hourglass from "../net/Hourglass";
import Request from "../net/Request";
import Utils from "../Utils";
import RequestsHelper from "./RequestsHelper";
import Executor from "../../src-tool/Executor";
import LoggerManager from "../../src-log/LoggerManager";
import BrowserDetection from "../../src-tool/BrowserDetection";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import IEXSXHRConnection from "../net/IEXSXHRConnection";
import XSXHRConnection from "../net/XSXHRConnection";
  
  var names = {
      createSession: "createSession",
      bindSession: "bindSession",
      shutdown: "shutdown",
      bindSent: "bindSent",
      onEvent: "onEvent",
      onErrorEvent: "onErrorEvent"
  };
  names = Utils.getReverse(names); 
  
  var MAYBE_ONLINE_TIMEOUT = 20000;
  var OFFLINE_CHECKS_PROTECTION = 1;
  var maybeOnline = 1;
  var maybePhase = 1;
  function resetMaybeOnline(mp) {
    if (mp && mp != maybePhase) {
      return;
    }
    maybePhase++;
    maybeOnline = OFFLINE_CHECKS_PROTECTION;
  }
  
  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);
  var protocolLogger = LoggerManager.getLoggerProxy(Constants.PROTOCOL);
  
  var SessionHTTP = function(isPolling,forced,handler,handlerPhase,originalSession,skipCors,sessionRecovery) {
    this._callSuperConstructor(SessionHTTP,arguments);
    
    this.createList = null;
    this.chosenConnection = null;
    
    this.connectionList = null;
    this.myGlass = null;
    
    this.activeConnection = null;
    
    this.resetConnectionList(skipCors);
  };
  
  SessionHTTP.prototype = {
      
      /*public*/ resetConnectionList: function(skipCors) {
        
        skipCors = skipCors || !this.policyBean.corsXHREnabled;
        
        this.createList = new ConnectionSelector(ConnectionSelector.POLL_LIST, false, skipCors);
        if (this.isPolling) {
          //this.connectionList = this.createList;
          this.connectionList = new ConnectionSelector(ConnectionSelector.POLL_LIST, false, skipCors);
        } else {
          this.connectionList = new ConnectionSelector(ConnectionSelector.STREAMING_LIST, !this.policyBean.xDomainStreamingEnabled, skipCors);
        }
        
        this.chosenConnection = null;
      },
      
      getConnectedHighLevelStatus: function() {
        return this.isPolling?Constants.HTTP_POLLING:Constants.HTTP_STREAMING;
      },
      
      getFirstConnectedStatus: function() {
        return this.isPolling?Constants.HTTP_POLLING:Constants.SENSE;
      },

      toString: function() {
        return ["[","SessionHTTP","oid="+this.objectId,this.isPolling,this.forced,this.phase,this.phaseCount,this.push_phase,this.workedBefore,this.sessionId,this.dataNotificationCount,this.switchRequired,this.slowRequired,"]"].join("|");
      },
      
      /*public*/ createSession: function(oldSessionId,reconnectionCause,serverBusy) {
        if (!this._callSuperMethod(SessionHTTP,names['createSession'],[oldSessionId,reconnectionCause,serverBusy])) {
          return false;
        }
      
        this.createSessionExecution(this.phaseCount,reconnectionCause,oldSessionId);
        return true;
      },
      
      /*protected*/ createSessionExecution: function(ph,reconnectionCause,oldSessionId) {
        if (ph != this.phaseCount) {
          return;
        }
        
        this.handler.disableCorsCheck();
        
        if (Utils.isOffline()) {
          if (maybeOnline <= 0) {
            sessionLogger.logDebug("Client is offline, delaying connection to server");
            Executor.addTimedTask(this.createSessionExecution,3000,this,[ph,oldSessionId,"offline"]); //overwrite reconnectionCause
            return;
          } else {
            maybeOnline--;
            if (maybeOnline == 0) {
              //avoid to lock on the offline flag, once in MAYBE_ONLINE_TIMEOUT seconds reset the flag
               Executor.addTimedTask(resetMaybeOnline,MAYBE_ONLINE_TIMEOUT,null,[maybePhase]);
            }
          }
        }
        var done = this.executeConnection(oldSessionId, this.createSessionExecution, reconnectionCause, false);
        
        if (done === null) {
          return;
          
        } else if (done) {
         this.createSent();
         
          
        } else if (done === false) {
          //WE GOT A PROBLEM!! And I don't have any solution!
          sessionLogger.logWarn("Unable to use available connections to connect to server");
          
          this.onErrorEvent("no_impl_available",{closedOnServer: true,noImplAvailable: true});
        }
        
       
      },
      
      /*public*/ bindSession: function(bindCause) {
        if (!this._callSuperMethod(SessionHTTP,names['bindSession'],[bindCause])) {
          return false;
        }
        
        if (this.activeConnection) {
          this.activeConnection._close();
        }
        
        this.fixSpin();
        
        this.bindSessionExecution(this.phaseCount,bindCause);
        return true;
      },
      
      /*private*/ fixSpin: function() {
        if (!EnvironmentStatus.isLoaded()) {
          //if a bind connection is opened before the onload event on Apple browsers and Android 
          //browsers the loading indicator will remain on. This trick should remove it...
          if ((this.policyBean.spinFixEnabled === null &&  (BrowserDetection.isProbablyAndroidBrowser() || BrowserDetection.isProbablyApple())) || this.policyBean.spinFixEnabled === true) {
            var ph = this.bindCount;          
            var that = this;
            EnvironmentStatus.addOnloadHandler(function() {
              Executor.addTimedTask(function() {
                //check bindCount to prevent multiple forceRebind
                //check that a connection is currently open otherwise the fix is useless
                if (ph == that.bindCount && that.phase == Session.RECEIVING) {
                  that.forceRebind("spinfix");
                }
              },that.policyBean.spinFixTimeout);
            });
          }
        }
      },
      
      
      /*protected*/ bindSessionExecution: function(ph,bindCause) {
        if (ph != this.phaseCount) {
          return;
        }
        
        if (!this.myGlass && !this.isPolling) {
          this.myGlass = new Hourglass();
        }
        
        var done = this.executeConnection(null,this.bindSessionExecution,bindCause,false);
        
        if (done === null) {
          return;
          
        } else if (done) {
          this.bindSent();
          
        } else if (done === false) {
          //done === false
          //WE GOT A PROBLEM!!
          if (!this.isPolling) {
            //we may have more luck in polling if the request is cross-site and we're on a browser that doesn't support
            //cross-site streaming: JSONP may save us
            this.onSessionGivesUp(this.handlerPhase,"streaming.unavailable");
            return;
          }
          
          //WE GOT A PROBLEM!! And I don't have any solution!
        }
        
      },
      
      /*public*/ recoverSession: function() {
          this.incPushPhase();
          var done = this.executeConnection(null, this.recoverSession, "network.error", true);
          
          if (done === null) {
              return;

          } else if (done) {
              /*
               * Start a timeout. If the server doesn't answer to the recovery request,
               * the recovery request is sent again.
               */
              this.createSent();

          } else if (done === false) {
              sessionLogger.logError("Unable to use available connections to connect to server");
              this.onErrorEvent("no_impl_available",{closedOnServer: true,noImplAvailable: true});
          }
      },
      
      shutdown: function(justSleep) {
        this._callSuperMethod(SessionHTTP,names['shutdown'],[justSleep]);
        if (this.activeConnection) {
          this.activeConnection._close();
        }
      },
      
      generateRequest: function(oldSession, reconnectionCause, askCL, sessionRecovery) {
        var isCreate = this.phase == Session._OFF || this.phase == Session.SLEEP;
        var _serverToUse = this.getPushServerAddress();
        
        var req = new Request(_serverToUse+Constants.LIGHTSTREAMER_PATH);
        
        req.setCookieFlag(this.policyBean.isCookieHandlingRequired());
        req.setExtraHeaders(this.policyBean.extractHttpExtraHeaders(isCreate));
        
        var askDomain = !req.isCrossProtocol() && !req.isCrossSite();
  
        var pushCommand;
        if (sessionRecovery) {
            pushCommand = RequestsHelper.getRecoveryCommand(this.push_phase, this.sessionId, this.policyBean, reconnectionCause, this.slowing.getDelay(), askDomain, this.dataNotificationCount);
        } else {            
            pushCommand = RequestsHelper.getPushCommand(
                    this.push_phase, this.sessionId, this.policyBean, this.connectionBean, 
                    isCreate, this.isPolling, oldSession, reconnectionCause, 
                    this.slowing.getDelay(), askCL, askDomain,
                    this.serverBusy, this.reverseHeartbeatTimer.getMaxIntervalMs());
        }
        req.setData(pushCommand);
        
//        protocolLogger.logDebug("Connection request generated",req);
        
        return req;
      },
      
      /*private*/ executeConnection: function(oldSession,retryMethod,reconnectionCause,sessionRecovery) {
        var isCreate = this.phase == Session._OFF || this.phase == Session.SLEEP;
        var frameUseGet = !isCreate;
        
        var connRequest = this.generateRequest(oldSession,reconnectionCause,true,sessionRecovery);
        var serverToUse = this.getPushServerAddress();
        
        this.controlHandler.assignWS(null); //just in case this is a switch
        
        if (this.chosenConnection && this.chosenConnection.constr == IEXSXHRConnection) {
          this.chosenConnection = null;
        }
        
        var connList = isCreate ? this.createList : this.connectionList;
        if (this.chosenConnection) {
          if (!connList.isGood(serverToUse,
              this.chosenConnection.constr,
              connRequest.isCrossSite(),
              this.policyBean.isCookieHandlingRequired(),
              connRequest.isCrossProtocol(),
              this.policyBean.hasHttpExtraHeaders(isCreate))) {
            connList._reset();
            this.chosenConnection=null;
          }
        }
        
        var done = false; //true OK / false NEVER with this connection class / null TRYLATER
        var targetName = (!this.isPolling ? "LS6__PUSHFRAME" : "LS6__POLLFRAME") + "_" + this.engineId;
        /*
         * The following loop tries a list of "connections" (i.e. transports) until
         * one of them succeeds to open the session.
         * 
         * "done == false" means that the chosenConnection was unable to open the session 
         * ==> loop again
         * 
         * "done == null"  means that the chosenConnection is trying to open the session 
         * ==> exit from loop and retry after a while with the same connection (see Executor.addTimedTask below)
         * 
         * "done == true" means that the chosenConnection was able to open the session
         * ==> set activeConnection and exit from loop
         * 
         */
        while ((this.chosenConnection || connList.hasNext()) && done === false) {
          
          if (!this.chosenConnection) {
            var classTU = connList.getNext(serverToUse,
                connRequest.isCrossSite(),
                this.policyBean.isCookieHandlingRequired(),
                connRequest.isCrossProtocol(),
                this.policyBean.hasHttpExtraHeaders(isCreate));
            
            if (!classTU) {
              //no solutions, exit
              connList._reset();
              return false;
            }
            
            this.chosenConnection = new classTU(targetName);
          }
          
          //I can't understand why after a while the constructor of this.chosenConnection become [native code], so I had to put a constr element inside the instances
          connRequest.setMethod(Request._POST);
          if (sessionRecovery) {
            connRequest.setFile(RequestsHelper.getRecoveryPath(this.chosenConnection.getEncoder().getExt()));
          } else {
            connRequest.setFile(RequestsHelper.getPushPath(isCreate,this.isPolling,this.chosenConnection.getEncoder().getExt()));
          }

          var pp = this.push_phase;
          
          done = this.chosenConnection.sessionLoad(connRequest,pp,this.cbOk,this.cbErr,this.cbEnd,this.engineId);
          
          if (done === null) {
            //try later...
            sessionLogger.logDebug("Connection currently unavailable, delaying connection");
            Executor.addTimedTask(retryMethod,50,this,[this.phaseCount,reconnectionCause,oldSession]);
            return null;
          } else if (done === false) {
            this.chosenConnection = null;
          } else { 
            //if (done === true)
            sessionLogger.logDebug("Connection open to the server");
            connList._reset();
            this.activeConnection = this.chosenConnection;
          }
          
        }
      
        return done;
      },
      
      
      /*protected*/ bindSent: function() {
        this._callSuperMethod(SessionHTTP,names['bindSent']);
        if (this.needsHourglassTrick()) {
          this.myGlass.prepare(this.activeConnection.constr);
        }
      },
      
      /**@override*/
      onBindSent: function() {
          this.reverseHeartbeatTimer.onBindSession(false);
      },
      
      /*private*/ needsHourglassTrick: function() {
        return !this.isPolling;
      },
      
      /*protected*/ onErrorEvent: function(reason, args) {
        args = args || {};
        var closedOnServer = args.closedOnServer;
        var fromWS = args.fromWS;
        var unableToOpen = args.unableToOpen;
        var noImplAvailable = args.noImplAvailable;
        var possibleLoop = args.possibleLoop;
        var tryRecovery = args.tryRecovery;
        var serverBusyError = args.serverBusyError;
        if (unableToOpen && (this.chosenConnection.constr == XSXHRConnection || this.chosenConnection.constr == IEXSXHRConnection) ) {
          /* 
           * Check added to prevent the following scenario:
           * - we are in polling when we got a connection error
           * - we want to do a recovery
           * - but connections of type CORS-XHR are disabled.
           * 
           * Since CORS-XHR was receiving data before the error, we want to use it for the recovery.
           */  
          if (! tryRecovery) {
              this.handler.onCorsError(this.handlerPhase);
          }
        }
        this._callSuperMethod(SessionHTTP,names['onErrorEvent'],arguments);
      },
      
      /*private*/ onEvent: function() {
        if (this.phase == Session.FIRST_BINDING) {
          resetMaybeOnline();
        }
        
        if (this.needsHourglassTrick() && (this.phase == Session.BINDING || this.phase == Session.FIRST_BINDING)) {
        //"if needed" check is inside, async is done inside)
          this.myGlass.stopHourGlass(); 
        }
        
        this._callSuperMethod(SessionHTTP,names['onEvent']);
      },
      
      /**@override*/
      forwardDestroyRequestToTransport: function(sessionId, request, type, related, retryingOrHost, requestListener) {
          this.controlHandler.addRequest(sessionId, request, type, related, retryingOrHost, requestListener);
      }
  };
    
  
  Inheritance(SessionHTTP,Session);
  export default SessionHTTP;
  
