import Constants from "../Constants";
import Session from "./Session";
import SessionHTTP from "./SessionHTTP";
import Inheritance from "../../src-tool/Inheritance";
import WebSocketConnection from "../net/WebSocketConnection";
import ConnectionSelector from "../net/ConnectionSelector";
import RequestsHelper from "./RequestsHelper";
import Executor from "../../src-tool/Executor";
import LoggerManager from "../../src-log/LoggerManager";
import ASSERT from "../../src-test/ASSERT";
import Request from "../net/Request";
import Utils from "../Utils";
  
  var WS_OFF = 1;
  var WS_OPEN = 2;
  var WS_FAIL = 3;
  var WS_ALIVE = 4;
  var WS_INADEQUATE = 5;
  var WS_LIGHT_FAIL = 6;
  
  var names = {
      createSent: "createSent",
      onTimeout: "onTimeout",
      onLoop: "onLoop",
      onStreamError: "onStreamError",
      onStreamEnd: "onStreamEnd",
      onErrorEvent: "onErrorEvent",
      shutdown: "shutdown",
      onSessionGivesUp: "onSessionGivesUp",
      onSessionBound: "onSessionBound"
  };
  names = Utils.getReverse(names); 
    
  
  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);
  
  var RECOVERY_SCHEDULED = false;
  
  var SessionWS = function(isPolling,forced,handler,handlerPhase,originalSession,skipCors,sessionRecovery) {
    this._callSuperConstructor(SessionWS,arguments);
    
    this.wsConn = null;
    
    this.wsPhase = WS_OFF;
    this.openWSPhase = null;
    
    this.forceEarlyWSOff = false;
    
  };
  
  
  SessionWS.prototype = {
      toString: function() {
        return ["[","SessionWS","oid="+this.objectId,this.isPolling,this.forced,this.phase,this.phaseCount,this.push_phase,this.wsPhase,this.workedBefore,this.sessionId,this.dataNotificationCount,this.wsConn,this.switchRequired,this.slowRequired,"]"].join("|");
      },
      
      /*reset: function() {
        this._callSuperMethod(SessionWS,"reset");
      },*/
      
      changeWSPhase: function(newPhase) {
        this.wsPhase = newPhase;
      },
      
      getConnectedHighLevelStatus: function() {
        return this.isPolling?Constants.WS_POLLING:Constants.WS_STREAMING;
      },
      
      getFirstConnectedStatus: function() {
        return Constants.SENSE;
      },
      
      /*private*/ openWS: function() {
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        if (!ASSERT.verifyValue(this.wsPhase,WS_OFF)) {
          sessionLogger.logError("Unexpected ws phase while opening connection");
        }
      //>>excludeEnd("debugExclude");
        
        this.openWSPhase = this.push_phase;
        
        this.wsConn =  new WebSocketConnection(this);
        var _serverToUse = this.getPushServerAddress();
        var connRequest = new Request(_serverToUse+Constants.LIGHTSTREAMER_PATH);
        
        connRequest.setCookieFlag(this.policyBean.isCookieHandlingRequired()); 
        connRequest.setExtraHeaders(this.policyBean.extractHttpExtraHeaders(false));
        
        if (ConnectionSelector.isGood(_serverToUse,
            WebSocketConnection,
            connRequest.isCrossSite(),
            this.policyBean.isCookieHandlingRequired(),
            connRequest.isCrossProtocol(),
            this.policyBean.hasHttpExtraHeaders(false))) {
            sessionLogger.logDebug("Open WebSocket to server");
          
          if (this.wsConn.openSocket(connRequest,this.openWSPhase,this.cbOk,this.cbErr,this.cbEnd)) {
            this.controlHandler.assignWS(this.wsConn);
            this.changeWSPhase(WS_OPEN);
            return true;
          } 
        } 
        // (if this is an early open) calling this while the create has not returned yet 
        //would generate a new create
        //this.onSessionGivesUp(this.handlerPhase,"ws.notgood");
        this.changeWSPhase(WS_INADEQUATE);
        return false;
        
      },
      
      /*public*/ createSent: function() {
        this._callSuperMethod(SessionWS,names['createSent']);
        
        if (this.policyBean.earlyWSOpenEnabled && !this.forceEarlyWSOff) {
          this.openWS();
        } 
      },
      
      /*public*/ bindSessionExecution: function(ph,bindCause) {
        if (ph != this.phaseCount) {
          return;
        }
        
        this.forceEarlyWSOff = false;
       
        if(this.wsPhase == WS_OFF) {
          this.openWS();
        } else if (this.wsPhase == WS_OPEN) {
          //If we opened the ws to the loadbalancer but then we received a control link 
          //then we must close the current ws and open a new one
          if (!this.wsConn.isConnectedToServer(this.getPushServerAddress())) {
            sessionLogger.logWarn("A control link was received while earlyWSOpenEnabled is set to true, a WebSocket was wasted.");
            this.wsConn._close();
            this.changeWSPhase(WS_OFF);
            this.openWS();
          }
        }
        
        if (this.wsPhase == WS_LIGHT_FAIL) {
          this.onSessionGivesUp(this.handlerPhase,"ws.early.closed");
          return;
          
        } else if (this.wsPhase == WS_INADEQUATE) {
          this.onSessionGivesUp(this.handlerPhase,"ws.notgood");
          return;
          
        } else if (this.wsPhase == WS_FAIL) {
          //if we're here the create call was successful while the websocket open was not
          WebSocketConnection.disableClass(this.getPushServerAddress());
          this.onSessionGivesUp(this.handlerPhase,"ws.early.openfail");
          return;
        } 


        var connRequest = this.generateRequest(null,bindCause,false,false);
        var done = false;
        connRequest.setFile(RequestsHelper.getPushPath(false,this.isPolling,this.wsConn.getEncoder().getExt()));
        
        var firstSend = false;
        if (this.wsPhase == WS_OPEN) {
          done = this.wsConn.sessionLoad(connRequest,this.push_phase,this.cbOk,this.cbErr,this.cbEnd,this.engineId);
          firstSend = true;
          
        } else if (this.wsPhase == WS_ALIVE) {
          done = this.wsConn._send(connRequest,this.push_phase);
          
        } else {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected ws phase during binding",this);
        }
        
        
        if (done === null) {
          sessionLogger.logDebug("WebSockets currently unavailable, delaying connection");
          Executor.addTimedTask(this.bindSessionExecution,50,this,[ph,bindCause]);
        } else if (done === false) {
          sessionLogger.logWarn("Unexpected WebSocket failure");
          this.onSessionGivesUp(this.handlerPhase,"ws.false");
        } else if (!firstSend) { 
          sessionLogger.logDebug("Connection to server bound upon WebSocket");
          this.bindSent();
        } //else wsConnection will call the firstSentNotification
        
      },
      
      firstSentNotification: function(oPhase) {
        if (this.openWSPhase == oPhase) {
          sessionLogger.logDebug("Connection to server open upon WebSocket");
          this.bindSent();
          this.changeWSPhase(WS_ALIVE);
        }
      },
      
      /*private*/ onTimeout: function(timeoutType,ph,usedTimeout,coreCause,sessionRecovery) {
        if (ph != this.phaseCount) {
          return;
        }
      
        if (this.phase == Session.CREATING) {
          this.forceEarlyWSOff = true;
        }
        
        this._callSuperMethod(SessionWS,names['onTimeout'],[timeoutType,ph,usedTimeout,coreCause,sessionRecovery]);
      },
  
      onLoop: function(serverSentPause) {
        this._callSuperMethod(SessionWS,names['onLoop'],[serverSentPause]);
        
        if (this.wsConn) {
          //we consider ourselves paused, but still the websocket is open (polling case) or 
          //may be open (streaming case with early open)
          //I need to change its phase to handle events that may occur while we are "paused"
          this.wsConn.updatePhase(this.push_phase);
        }
      },

      /*private*/ onStreamError: function(reason,toCheckPhase,fromWS,unableToOpen,possibleLoop) {
        if (fromWS) {
          //in this case we check the openWSPhase that is semi-unrelated to the phase of the session,
          //we may open the websocket during all of the phases from OFF to FIRST_PAUSE and such
          //opening does not aff3ect the status of the session at all.
          //A positive note: when a websocket is opened but nothing is sent the only possible event it can
          //generate is an onStreamError          
          if (toCheckPhase == this.openWSPhase) {
            //once we've assessed that the open phase is correct we can forward the event
            //with the current phase.
            this._callSuperMethod(SessionWS,names['onStreamError'],[reason,this.push_phase,fromWS,unableToOpen,possibleLoop]);
          }
        } else {
          if (this.phase == Session.CREATING) {
            this.forceEarlyWSOff = true;
          }
          this._callSuperMethod(SessionWS,names['onStreamError'],arguments);
        }
      },
      
      /*private*/ onStreamEnd: function(toCheckPhase,fromWS) {
        if (fromWS) {
          if (toCheckPhase == this.openWSPhase) {
            
            if (this.phase == Session.OFF || this.phase == Session.CREATING || this.phase ==  Session.CREATED) {
              //this is the end of an early socket, consider it as an error event
              this.onErrorEvent("ws.early.end",{fromWS: true});
              
            } else {
            //>>excludeStart("debugExclude", pragmas.debugExclude);  
              if (!ASSERT.verifyDiffValue(this.phase,Session.FIRST_PAUSE)) {
                sessionLogger.logError("Unexpected phase for an clean end of a WS",this);
              }
            //>>excludeEnd("debugExclude"); 
              this._callSuperMethod(SessionWS,names['onStreamEnd'],[this.push_phase,fromWS]);
            }
            
          }
        } else {
          if (this.phase == Session.CREATING) {
            this.forceEarlyWSOff = true;
          }
          this._callSuperMethod(SessionWS,names['onStreamEnd'],arguments);
        }
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
        if (fromWS) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          if (!ASSERT.verifyDiffValue(this.wsPhase,WS_OFF)) {
            sessionLogger.logError("Unexpected connection error on a connection that was not yet open",this);
          }
        //>>excludeEnd("debugExclude"); 
          if (unableToOpen) {
            this.changeWSPhase(WS_FAIL);
          } else {
            this.changeWSPhase(WS_LIGHT_FAIL);
          }
          
          if (this.phase == Session.OFF || this.phase == Session.CREATING || this.phase ==  Session.CREATED) {
            //this is an error on a early open, we can't act now as we must wait for the loop from the create
            //otherwise we would waste the entire session
            //NOPPING!
            sessionLogger.logDebug("WebSocket was broken before it was used",this);
           
          } else if (this.phase == Session.FIRST_PAUSE) {
            //ws is now in control
            //so let's act now
            sessionLogger.logDebug("WebSocket was broken while we were waiting the first bind",this);
            
            if (unableToOpen) {
              WebSocketConnection.disableClass(this.getPushServerAddress());
            }

            //as the bind was not yet sent (otherwise we would be in the FIRST_BINDING phase) we can recover
            //binding via HTTP
            this.onSessionGivesUp(this.handlerPhase,"ws.error."+reason);
            
          } else if (this.isPolling && this.phase == Session.PAUSE) {
          //>>excludeStart("debugExclude", pragmas.debugExclude);  
            if (!ASSERT.verifyNotOk(unableToOpen)) {
              sessionLogger.logError("can't be unable-to-open since the connection is already open",this);
            }
          //>>excludeEnd("debugExclude");
            
            sessionLogger.logDebug("WebSocket was broken while we were waiting",this);
            this.closeSession(reason,closedOnServer,RECOVERY_SCHEDULED);
            this.onTimeout("zeroDelay",this.phaseCount,0,"ws.broken.wait");
                      
          } else {
            //classic case, we can use the default handling
            this._callSuperMethod(SessionWS,names['onErrorEvent'],arguments);
            
          }
          
        } else {
          if (this.phase == Session.CREATING) {
            this.forceEarlyWSOff = true;
          }
          this._callSuperMethod(SessionWS,names['onErrorEvent'],arguments);
        }
        
      },
   
      /*public*/ shutdown: function(justSleep) {
        this._callSuperMethod(SessionWS,names['shutdown'],[justSleep]);
        if (this.wsConn) {
          this.openWSPhase = null;
          this.wsConn._close();
          this.wsConn = null;
          
          this.controlHandler.assignWS(null);
        }
        this.changeWSPhase(WS_OFF);
      },
      
      /*protected*/ needsHourglassTrick: function() {
        return false;
      },
      
      /*protected*/ onSessionGivesUp: function(ph,reason) {
          /*
           * Since a bind_session request over WebSocket failed,
           * the WebSocket support is disabled.
           * When the client IP changes, the support will be enabled again.
           */
          WebSocketConnection.disableClass(this.getPushServerAddress());
          this._callSuperMethod(SessionWS,names['onSessionGivesUp'],[ph, reason]);
      },
      
      /**@override*/
      onSessionBound: function() {
          this._callSuperMethod(SessionWS,names['onSessionBound']);
          this.wsConn.setDefaultSessionId(this.sessionId);
      },
      
      /**@override*/
      forwardDestroyRequestToTransport: function(sessionId, request, type, related, retryingOrHost, requestListener) {
          this.controlHandler.addSyncRequest(sessionId, request, type, related, retryingOrHost, requestListener);
      }
  };
  
  
  Inheritance(SessionWS,SessionHTTP);
  export default SessionWS;

