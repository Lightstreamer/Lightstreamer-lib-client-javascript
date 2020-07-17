import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import Helpers from "../../src-tool/Helpers";
import LoggerManager from "../../src-log/LoggerManager";
import Executor from "../../src-tool/Executor";
import MadTester from "./MadTester";
import Constants from "../Constants";
import ForceRebindTutor from "../control/ForceRebindTutor";
import ControlRequest from "../control/ControlRequest";
import RequestsHelper from "./RequestsHelper";
import ASSERT from "../../src-test/ASSERT";
import BrowserDetection from "../../src-tool/BrowserDetection";
import WebSocketConnection from "../net/WebSocketConnection";
import Assertions from "../utils/Assertions";
import RecoveryBean from "./RecoveryBean";
import RetryDelayCounter from "./RetryDelayCounter";
import Environment from "../../src-tool/Environment";
import Utils from "../Utils";
import ReverseHeartbeatTimer from "./ReverseHeartbeatTimer";
  
  var _OFF = 1;
  /**
   * Expecting create_session/recovery response
   * (next: CREATED)
   */
  var CREATING = 2;
  /**
   * Expecting LOOP after having received CONOK as create_session/recovery response
   * (previous: CREATING, next: FIRST_PAUSE)
   */
  var CREATED = 3;
  /**
   * Expecting the expiration of a small pause after create_session/recovery response 
   * and before sending bind_session 
   * (previous: CREATED, next: FIRST_BINDING)
   */
  var FIRST_PAUSE = 4;
  /**
   * Expecting bind_session response 
   * (previous: FIRST_PAUSE, next: RECEIVING)
   */
  var FIRST_BINDING = 5;
  var PAUSE = 6;
  /**
   * Expecting bind_session response (transport is polling)
   */
  var BINDING = 7;
  /**
   * Reading item updates
   * (previous: FIRST_BINDING)
   */
  var RECEIVING = 8;
  var STALLING = 9;
  var _STALLED = 10;
  /**
   * Expecting the expiration of a timeout after an error 
   * and before creating a new session or recovering the current
   * (next: CREATING)
   */
  var SLEEP = 11;
  
  
  var statusStrings = [];
  statusStrings[_OFF] = "OFF";
  statusStrings[CREATING] = "CREATING";
  statusStrings[CREATED] = "CREATED";
  statusStrings[FIRST_PAUSE] = "FIRST_PAUSE";
  statusStrings[FIRST_BINDING] = "FIRST_BINDING";
  statusStrings[PAUSE] = "PAUSE";
  statusStrings[BINDING] = "BINDING";
  statusStrings[RECEIVING] = "RECEIVING";
  statusStrings[STALLING] = "STALLING";
  statusStrings[_STALLED] = "STALLED";
  statusStrings[SLEEP] = "SLEEP";
  
  
  //close session "helpers"
  var CLOSED_ON_SERVER = true;
  var OPEN_ON_SERVER = false;
  var NO_RECOVERY_SCHEDULED = true;
  var RECOVERY_SCHEDULED = false;
  //var JUST_SLEEP = true; //not used
  
  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);
  var protocolLogger = LoggerManager.getLoggerProxy(Constants.PROTOCOL);
  
  var PERMISSION_TO_FAIL = 1; //called X in the session machine
  
  var Session = function(isPolling,forced,handler,handlerPhase,originalSession,skipCors,sessionRecovery,mpnManager) {
    this.objectId = Utils.nextObjectId();
    if (sessionLogger.isDebugLogEnabled()) {
        sessionLogger.logDebug("New session", "oid=" + this.objectId);
    }
    this.cbOk = Executor.packTask(this.onStreamResponse,this);
    this.cbErr = Executor.packTask(this.onStreamError,this);
    this.cbEnd = Executor.packTask(this.onStreamEnd,this);
    
    
    this.isPolling = isPolling;
    this.forced = forced;
    this.dataNotificationCount = 0;
    
    this.phase = _OFF;
    this.phaseCount = 0;
    this.push_phase =  Helpers.randomG(100) * 100;
    
    this.handler = handler;
    this.handlerPhase = handlerPhase;
    
    //extracted from handler
    this.slowing = handler.getSlowing();
    this.policyBean = handler.getPolicyBean();
    this.connectionBean = handler.getConnectionBean();
    this.evalQueue = null;
    this.controlHandler = handler.getControlConnectionHandler();
    this.engineId = handler.getEngineId();
    
    this.serverSentBW = 0;
    this.workedBefore = 0;
    this.lastKATO = 0;
    this.lastKATask = null;
    this.reconnectTimeout = null;
    this.sentTime = null;
    
    this.reset();
    
    /**
     * The flag is true when the data connection fell down and the next actions will be the creation
     * of a new session object and the recovery of the (logical) session.
     * 
     * preparingRecovery is a kind of clone of the flag recoveryBean.isRecovery() with the difference
     * that preparingRecovery is true in the session object experiencing a network error 
     * (where recoveryBean.isRecovery() is false) 
     * while recoveryBean.isRecovery() is true in the session object created for the recovery 
     * (where preparingRecovery is false).
     */
    this.preparingRecovery = false;
    /**
     * Recovery can be temporarily disabled when the client discovers that the server counter
     * (as expressed by PROG) is different from the client counter.
     * The current session is not invalidated but in case of error a new session will be created.
     */
    this.isRecoveryDisabled = false;
    
    /**
     * When true, the special create request must be emitted which handles CONERR,5
     */
    this.serverBusy = false;
    
    if (originalSession) {
      //inheriting a session
      this.bindCount = originalSession.bindCount;
      this.dataNotificationCount = originalSession.dataNotificationCount;
      sessionLogger.logDebug("Copying prog ", this.dataNotificationCount);
      
      this.sessionId = originalSession.sessionId;
      /**
       * Address of the server for the current session.
       * It can be the control-link (carried by CONOK message), 
       * or {@link ConnectionDetails#getServerAddress()} if the control-link is not set.
       * It can also be null before receiving the first CONOK message.
       */
      this.sessionServerAddress = originalSession.sessionServerAddress;
      this.push_phase = originalSession.push_phase;
      this.serverSentBW = originalSession.serverSentBW;
      
      /**
       * Copy of {@link ConnectionDetails#getServerAddress()}.
       */
      this.serverAddressCache =  originalSession.serverAddressCache;
      /**
       * Copy of {@link ConnectionOptions#isServerInstanceAddressIgnored()}.
       */
      this.ignoreServerAddressCache = originalSession.ignoreServerAddressCache;
      
      this.recoveryBean = new RecoveryBean(sessionRecovery, originalSession.recoveryBean);
      
    }  else {
        Assertions.assert(! sessionRecovery, "Recovery unexpected");
        this.recoveryBean = new RecoveryBean();
    } 
    
    this.mpnManager = mpnManager;
    this.reverseHeartbeatTimer = new ReverseHeartbeatTimer(this, this.policyBean);
    
    if (Environment.isBrowser()) {
        var that = this;
        this.onlineHandler = function(e) {
            var timeLeftMs = that.recoveryBean.timeLeftMs(that.policyBean.sessionRecoveryTimeout);
            if (timeLeftMs <= 0) {
                // close the current session and prepare to create a new one
                that.closeSession('recovery.timeout.elapsed', CLOSED_ON_SERVER, RECOVERY_SCHEDULED);
                //now is SLEEPing
            }
            that.launchTimeout("online.again", 0);
        };
        try {
            window.addEventListener('online', this.onlineHandler, false);
        } catch (e) {
            // online event not supported by the browser
        }
    }
  };
  
  //I need to expose these values to sub classes
  Session._OFF = _OFF;
  Session.CREATING = CREATING;
  Session.CREATED = CREATED;
  Session.FIRST_PAUSE = FIRST_PAUSE;
  Session.FIRST_BINDING = FIRST_BINDING;
  Session.BINDING = BINDING;
  Session.RECEIVING = RECEIVING;
  Session.STALLING = STALLING;
  Session._STALLED = _STALLED;
  Session.PAUSE = PAUSE;
  Session.SLEEP = SLEEP;
 
  Session.prototype = {

      /*private*/ reset: function() {
        if (sessionLogger.isDebugLogEnabled()) {            
            sessionLogger.logDebug("Resetting session oid=", this.objectId);
        }
        this.bindCount = 0;
        this.sessionServerAddress = null;
        this.sessionId = null;
        this.dataNotificationCount = 0;
        
        this.serverSentBW = 0;
        this.cachedRequiredBW = false; //this is set only if a changeBW request is received while in CREATING status (too late to send it via create_session, too early to issue a control)
        //note that when the session number is received the control handler is reset, so that put it there is not an option
        
        this.switchRequired = false;
        this.switchForced = false;
        this.switchCause = "";
        this.slowRequired = false;
        
        this.preparingRecovery = false;
      },
      
      /*public*/ resetConnectionList: function(skipCors) {
        //do nothing
      },
      
///////////////////////////////////phase handling
      
      /*private*/ changePhaseType: function(newType) {
        if (sessionLogger.isDebugLogEnabled()) {
            sessionLogger.logDebug("Session state change", this.objectId, statusStrings[this.phase], "->", statusStrings[newType]);
        }
        
        this.phase = newType;
        this.phaseCount++;
        var ph = this.phaseCount;
        
        this.handler.statusChanged(this.handlerPhase);
        
        return ph == this.phaseCount;
      },
      
      /*private*/ incPushPhase: function() {
        this.push_phase++; 
      },
      
      /*public*/ checkSessionPhase: function(ph) {
        return this.push_phase == ph;
      },
      
      /*public*/ getHighLevelStatus: function() {
        var ph = this.phase;
        
        if (ph == _OFF) {
          return Constants.DISCONNECTED;
          
        } else if (ph == SLEEP) {
          if (this.preparingRecovery) {
              return Constants.TRYING_RECOVERY;
          } else {
              return Constants.WILL_RETRY;
          }
          
        } else if (ph == CREATING) {
            if (this.recoveryBean.isRecovery()) {
                return Constants.TRYING_RECOVERY;
            } else {
                return Constants.CONNECTING;
            }
          
        } else if (ph == CREATED || ph == FIRST_PAUSE || ph == FIRST_BINDING) {
          return Constants.CONNECTED + this.getFirstConnectedStatus();
          
        } else if (ph == _STALLED) {
          return Constants.STALLED;
          
        /*} else if (ph == RECEIVING && (this.switchRequired || this.slowRequired)) {
          return Constants.CONNECTED + Constants.SENSE;
          
          this would avoid the SENSE->STREAMING->POLLING case but introduces the
          STREAMING->_STALLED->SENSE->POLLING one (problem is the client would be receiving data while in SENSE status)
          
          */
          
        } else { //BINDING RECEIVING STALLING PAUSE
          return Constants.CONNECTED + this.getConnectedHighLevelStatus();
        }        
      },
      
      /*public*/ isOpen: function() { 
        return this.phase != _OFF && this.phase != CREATING && this.phase != SLEEP;
      },
      
      /*public*/ isWaitingOKFromNet: function() {
        return this.phase == CREATING || this.phase == BINDING || this.phase == FIRST_BINDING;
      },
      
      /*public*/ isReceivingAnswer: function() { 
        return this.phase == CREATED ||  this.phase == RECEIVING ||  this.phase == STALLING ||  this.phase ==  _STALLED;
      },
      
      /*public*/ isRecovering: function() {
          return this.recoveryBean.isRecovery();
      },
      
      /*public*/ isStreamingSession: function() {
        return !this.isPolling;
      },
      
      /*public*/ getPushServerAddress: function() {
          // use the control-link address if available, otherwise use the address configured at startup 
          return this.sessionServerAddress == null ? this.serverAddressCache : this.sessionServerAddress;
      },
      
      /*public*/ getSessionId: function() {
        return this.sessionId;
      },
      
      /*public*/ getSessionHost: function() {
        return this.sessionServerAddress;
      },
      
      /*public*/ /*isSlowRequired: function() {
        return this.slowRequired;
      },*/

//////////////////////////////////external calls
      /*public*/ createSession: function(oldSessionId,reconnectionCause,serverBusy) {
        this.serverBusy = serverBusy;
        
        var openOnServer = this.phase != _OFF && this.phase != SLEEP ? OPEN_ON_SERVER : CLOSED_ON_SERVER;
        
        if (!MadTester.canMakeRequest()) {
          sessionLogger.logDebug("Mad timeouts? Avoid connection",this);
          this.closeSession("mad",openOnServer,NO_RECOVERY_SCHEDULED);
          return false;
        }
        
        if (openOnServer == OPEN_ON_SERVER) {
          sessionLogger.logDebug("Opening on server, send destroy",this);
          this.closeSession("new."+(reconnectionCause||""),OPEN_ON_SERVER,RECOVERY_SCHEDULED);
        }

        sessionLogger.logInfo("Opening new session",this);
        
        this.reset();
        
        this.prepareSlowing();
        
        //this.policyBean.simpleSetter('serverKeepaliveInterval',NaN);
        //this.policyBean.simpleSetter('serverPollingInterval',NaN);
        //this.policyBean.simpleSetter('serverSideBandwidth',NaN);
        this.connectionBean.simpleSetter("sessionId",null);
        this.connectionBean.simpleSetter("serverSocketName",null);
        this.connectionBean.simpleSetter("serverInstanceAddress",null);
        
        this.serverAddressCache =  this.connectionBean.serverAddress;
        this.ignoreServerAddressCache =  this.policyBean.serverInstanceAddressIgnored;
        
        
        this.incPushPhase();
        
        return true; 
      },
      
      /*public*/ bindSession: function(bindCause) {
        if (!MadTester.canMakeRequest()) {
          this.closeSession("madb",OPEN_ON_SERVER,NO_RECOVERY_SCHEDULED);
          return false;
        }
        
        this.bindCount++;
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        if (!ASSERT.verifyOk(this.phase == PAUSE || this.phase == FIRST_PAUSE || this.phase == _OFF)) {
          sessionLogger.logError("Unexpected phase during binding of session");
        }
      //>>excludeEnd("debugExclude");
        
        if (this.phase == _OFF) {
          //bind someonelse's session
          if (!this.changePhaseType(FIRST_PAUSE)) { 
            return false;
          }
          
          this.prepareSlowing();
          
        }
        
        // upon the new connection, the reverse heartbeat interval may have changed;
        // this causes a dynamic invocation of handleReverseHeartbeat, but it is not enough;
        // now we have to set "force" to true, because the interval is also being communicated
        // to the Server with the bind_session request;
        // moreover, if we switch from HTTP to WS or from WS to HTTP,
        // the reverse heartbeat behavior may change (though currently not)
        
        this.incPushPhase();

        if (this.isPolling) {
          sessionLogger.logDebug("Binding session",this);
        } else {
          sessionLogger.logInfo("Binding session",this);
        }

        return true; 
      },
      
      isActive: function() {
          return this.phase == CREATED 
              || this.phase == FIRST_BINDING 
              || this.phase == BINDING 
              || this.phase == RECEIVING 
              || this.phase == STALLING 
              || this.phase == _STALLED;
      },
      
      /*public*/ requestSwitch: function(newHPhase,switchCause,forced) {
        this.handlerPhase = newHPhase;
        
        if (this.switchRequired) {
          //switch already requested!
          return;
        }

        sessionLogger.logDebug("Switch requested",this);

        //in case we were waiting a slow-switch we have to override that command
        this.slowRequired = false;
        
        if (this.phase == CREATING || this.phase == SLEEP || this.phase == _OFF) { //Session Machine: during these statuses we do not have a session id
          /*
           * WARNING
           * I suppose that this condition does not happen because a session creation should never
           * superimpose another one, but I am not sure.
           */
          sessionLogger.logError("Unexpected creation of a session while another one is still creating");
          this.handler.createMachine(this.handlerPhase,switchCause,forced);
          
        } else if (this.phase == PAUSE || this.phase == FIRST_PAUSE) {
          this.handler.switchMachine(this.handlerPhase,switchCause,forced);
          
        } else  { //Session Machine: during these statuses a control to ask for an immediate loop is sent if switch or slow are requested
          // CREATED, FIRST_BINDING, BINDING, RECEIVING, STALLING, STALLED
          this.switchRequired = true;
          this.switchForced = forced;
          this.switchCause = switchCause;
          
          this.forceRebind(switchCause);
        } 

      },
      
      /*public*/ requestSlow: function(newHPhase) {
        
        this.handlerPhase = newHPhase;
        
        if (this.slowRequired) {
          //slow already requested
          return;
        }

      sessionLogger.logDebug("Slow requested",this);

      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        if (!ASSERT.verifyOk(this.phase != CREATING && this.phase != SLEEP && this.phase != _OFF)) {
          sessionLogger.logError("Unexpected phase during slow handling");
        }
      //>>excludeEnd("debugExclude");
 
        if (this.phase == PAUSE || this.phase == FIRST_PAUSE) {
          this.handler.slowMachine(this.handlerPhase);
          
        } else {
          this.slowRequired = true;
          this.forceRebind("slow");
        }
      },
      
      /*private*/ prepareSlowing: function() {
        if (this.phase == _OFF || this.phase == SLEEP) { 
          //otherwise we're binding someone else session 
          this.slowing.prepareForSync();
        }
        
        if (this.isPolling && this.forced) {
          // by convention, if polling is explicitly requested
          // we reset the estimate on the delay of the polling cycle
          this.slowing.resetSync();
        }
      },
      
      /*public*/ handleReverseHeartbeat: function(force) {
          this.reverseHeartbeatTimer.onChangeInterval();
      },
      
      /*public*/ closeSession: function(closeReason,alreadyClosedOnServer,noRecoveryScheduled) {
        sessionLogger.logInfo("Closing session",this,closeReason);
        if (this.phase != _OFF && this.phase != CREATING && this.phase != SLEEP) {
          this.handler.onObsoleteControlLink(this.getPushServerAddress());
          
          if (!alreadyClosedOnServer) {
            this.sendDestroySession(closeReason);
          }  
       
          this.handlerPhase = this.handler.onSessionClose(this.handlerPhase,noRecoveryScheduled);

          this.connectionBean.simpleSetter("sessionId",null);
          this.connectionBean.simpleSetter("serverSocketName",null);
          this.connectionBean.simpleSetter("serverInstanceAddress",null);

        } else {
            this.handlerPhase = this.handler.onSessionClose(this.handlerPhase,noRecoveryScheduled);
        }

        this.shutdown(!noRecoveryScheduled);
      },
      
      resetTimers: function() {
          this.policyBean.resetRetryDelay(this.policyBean.retryDelay);
          this.policyBean.resetConnectTimeout(this.policyBean.retryDelay);
      },
      
      /*public*/ shutdown: function(justSleep) {
        this.incPushPhase();
        this.reset();
        this.changePhaseType(justSleep?SLEEP:_OFF);
        if (this.phase == _OFF) {
            if (this.onlineHandler) {
                try {
                    window.removeEventListener('online', this.onlineHandler);
                } catch (e) {
                    // online event not supported by the browser
                }
            }
        }
        this.reverseHeartbeatTimer.onClose();
        sessionLogger.logDebug("Session shutdown",this);
      },
      
      /*private*/ doPause: function(serverSentPause) {
        if (!this.changePhaseType(this.phase == CREATED ? FIRST_PAUSE : PAUSE)) {
          return;
        }
        
        //I have to inc here or I can wrongly handle a onStreamEnd notification. -
        this.incPushPhase();
        
        var pauseToUse = serverSentPause;
        if (this.isPolling) {
          //chiusura di un blocco di dati arrivati in polling
          
          if (serverSentPause >= this.policyBean.pollingInterval) {
            // we're likely delaying because of the slowing algorithm
            // nothing to do
          } else {
            this.policyBean.simpleSetter("pollingInterval", serverSentPause);
          }
          
          pauseToUse = this.getRealPollingInterval();

        }
        
        if (this.phase != FIRST_PAUSE && pauseToUse && pauseToUse > 0) {
          sessionLogger.logDebug("Make pause before next bind");
          this.launchTimeout("pause", pauseToUse);
        } else {
          this.onTimeout("noPause", this.phaseCount);
        }
      },
      
/////////////////////////////////////////EVENTS
      
      /*private*/ onTimeout: function(timeoutType, ph,usedTimeout,coreCause) {
          /*
           * !!!!! WARNING !!!!!
           * Check that the signature of this method is coherent with the use of modifyTaskParam
           * in method timeoutForStalling()
           */
        if (ph != this.phaseCount) {
          return;
        }
        if (sessionLogger.isDebugLogEnabled()) {
            sessionLogger.logDebug("Timeout event", timeoutType, statusStrings[this.phase], 
                    "sid", this.sessionId,
                    "cause=", coreCause,
                    "preparingRecovery=", this.preparingRecovery);
        }

        //in case of sleep we lose information in the LS_cause
        var tCause = "timeout."+this.phase+"."+this.bindCount;
        if (this.phase == SLEEP && coreCause) {
          tCause = coreCause;
        }

        if (this.phase == CREATING) {
          var timeLeftMs = this.recoveryBean.timeLeftMs(this.policyBean.sessionRecoveryTimeout);
          if (this.recoveryBean.isRecovery() && timeLeftMs > 0) {
              /*
               * POINT OF RECOVERY (1/2):
               * a previous recovery request has received no response within the established timeout, 
               * so we send another request in loop.
               */
              if (sessionLogger.isDebugLogEnabled()) {
                  sessionLogger.logDebug("Start session recovery. Cause: no response timeLeft=", timeLeftMs);
              }
              this.policyBean.increaseConnectTimeout();
              this.handler.recoverSession(this.handlerPhase, tCause, this.forced);
              
          } else {	    
              sessionLogger.logDebug("Start new session. Cause: no response");
              var sleepCause = "create.timeout";
              //send to SLEEP
              this.closeSession(sleepCause,CLOSED_ON_SERVER,RECOVERY_SCHEDULED);
              
              this.policyBean.increaseConnectTimeout();
              this.launchTimeout("zeroDelay", 0, sleepCause);
          }

        } else if (this.phase == CREATED || this.phase == BINDING || this.phase == _STALLED || this.phase == SLEEP) {
          if (this.slowRequired || this.switchRequired) {
              sessionLogger.logDebug("Timeout: switch transport");
              this.handler.createMachine(this.handlerPhase,tCause+".switch",this.switchForced);
          } else if (!this.isPolling || this.forced) {
              if (this.preparingRecovery) {
                  /*
                   * POINT OF RECOVERY (2/2):
                   * 
                   * This point is reached 
                   * 1) after the method onErrorEvent has detected a socket failure,
                   *    set the phase to SLEEP and scheduled the onTimeout task; or
                   * 2) when the session is STALLED because the client doesn't receive any data from the server
                   *    (see method timeoutForReconnect)
                   */
                  sessionLogger.logDebug("Timeout: recover session");
                  this.handler.recoverSession(this.handlerPhase, tCause, this.forced);
                  
              } else {
                  sessionLogger.logDebug("Timeout: new session");
                  this.handler.retry(this.handlerPhase,tCause,this.forced,this.serverBusy);
              }
          } else {
              /*
               * Branch reserved for polling.
               * 
               * NOTE 
               * In the past, when an error occurred during polling, the new session was created not in polling
               * but in streaming (probably because polling was seen as sub-optimal transport).
               * With the introduction of the recovery, we are faced with 3 options:
               * 1) recovering the session in polling
               * 2) recovering the session in streaming
               * 3) creating a new session in streaming.
               * The second option is probably the best one, but, since the client falls-back rarely to polling,
               * in order to ease the implementation, I have decided to follow the third path.
               */
              sessionLogger.logDebug(this.preparingRecovery ? "Timeout: switch transport from polling (ignore recovery)" : "Timeout: switch transport from polling");
              this.handler.createMachine(this.handlerPhase,tCause,false);
          }

        } else if (this.phase == FIRST_BINDING) {
          this.workedBefore--;

          if (this.slowRequired || this.switchRequired) {
            this.handler.createMachine(this.handlerPhase,tCause+".switch",this.switchForced);
          } else if (this.workedBefore > 0 || this.forced) {
              this.handler.retry(this.handlerPhase,tCause,this.forced,this.serverBusy);
              //this.createSession(this.sessionId,tCause); //THIS is bad, because it forces us to reuse stuff
          } else if (this.createNewOnFirstBindTimeout()) {
            this.handler.createMachine(this.handlerPhase,tCause+".switch",this.switchForced);
          } else {
            this.onSessionGivesUp(this.handlerPhase,tCause);
          }

        } else if (this.phase == PAUSE) {
          if (this.isPolling) {
            this.slowing.testPollSync(usedTimeout);
          }
          this.bindSession("loop");

        } else if(this.phase == FIRST_PAUSE) {
          this.bindSession("loop1");

        } else if (this.phase == RECEIVING) {
          this.timeoutForStalled();

        } else if (this.phase == STALLING) {
          this.timeoutForReconnect();

        } else { //_OFF
          sessionLogger.logWarn("Unexpected timeout event while session is _OFF",this);
        }
      
      },
      
      /*protected*/ createNewOnFirstBindTimeout: function() {
        return this.isPolling;
      },
      
      /*private*/ shouldGiveUpTrying: function() {
        return this.forced || this.handler.shouldGiveUpTrying();
      },
      
      /*protected*/ onSessionGivesUp: function(ph,reason) {
        var mustClose = this.shouldGiveUpTrying();
        if (mustClose) {
          var openOnServer = this.phase != _OFF && this.phase != SLEEP ? OPEN_ON_SERVER : CLOSED_ON_SERVER;
          this.closeSession("giveup",openOnServer,NO_RECOVERY_SCHEDULED);
        }
        
        this.handler.onSessionGivesUp(ph,reason,mustClose);
      },
      
      formatArgs: function(obj) {
          var s = "";
          for (var p in obj) {
              s += p + "=" + obj[p] + " ";
          }
          return s;
      },
      
      /**
       * @param reason
       * @param closedOnServer true when receiving CONERR
       * @param fromWS
       * @param unableToOpen
       * @param noImplAvailable
       * @param possibleLoop
       * @param tryRecovery the flag is true when the method is called from onStreamError or from onStreamEnd
       * @param serverBusyError true when receiving CONERR,5
       * @param reconnectMaxDelay delay before reconnecting when the Remote Data Adapter or Metadata Adapter is disconnected (see LightstreamerClient.handleRemoteAdapterStatus)
       */
      /*protected*/ onErrorEvent: function(reason, args) {
        args = args || {};
        var closedOnServer = args.closedOnServer;
        var fromWS = args.fromWS;
        var unableToOpen = args.unableToOpen;
        var noImplAvailable = args.noImplAvailable;
        var possibleLoop = args.possibleLoop;
        var tryRecovery = args.tryRecovery;
        var serverBusyError = args.serverBusyError;
        var reconnectMaxDelay = args.reconnectMaxDelay;
        var timeLeftMs = this.recoveryBean.timeLeftMs(this.policyBean.sessionRecoveryTimeout);
        if (sessionLogger.isDebugLogEnabled()) {
            sessionLogger.logDebug("Error event", statusStrings[this.phase], "reason=" + reason, 
                    "sid=" + this.sessionId,
                    "timeLeft=" + timeLeftMs,
                    "isRecoveryDisabled=" + this.isRecoveryDisabled,
                    this.formatArgs(args));
        }
        var startRecovery = tryRecovery && timeLeftMs > 0;
        if (this.phase == RECEIVING || this.phase == _STALLED ||this.phase == STALLING ||this.phase == BINDING || this.phase == PAUSE) {
          if (startRecovery && ! this.isRecoveryDisabled) {
              /*
               * POINT OF RECOVERY (1/2):
               * the socket failure has happened while we were receiving data.
               * 
               * To recover the session after a socket failure, set the phase to SLEEP 
               * and schedule the onTimeout task (see launchTimeout below), 
               * where the recovery will be performed.
               */
              sessionLogger.logDebug("Start session recovery. Cause: socket failure while receiving");
              this.preparingRecovery = true;
              this.changePhaseType(SLEEP);
              this.launchTimeout("firstRetryMaxDelay", Helpers.randomG(this.policyBean.firstRetryMaxDelay), reason);
              
          } else {
              sessionLogger.logDebug("Start new session. Cause: socket failure while receiving");
              this.closeSession(reason,closedOnServer,RECOVERY_SCHEDULED);
              //now is SLEEPing
              if (possibleLoop) {
                  this.launchTimeout("currentRetryDelay", this.calculateRetryDelay(),reason);
              } else {
                  if (reconnectMaxDelay) {
                      // Remote Data Adapter is disconnected
                      this.launchTimeout("reconnectMaxDelay", Math.ceil(Math.random() * reconnectMaxDelay), reason);
                  } else {                      
                      this.launchTimeout("firstRetryMaxDelay", Helpers.randomG(this.policyBean.firstRetryMaxDelay),reason);
                      // this can still lead to tight loops if the session always fails just after
                      // being established for some persistent cause; but see task:
                      // https://organizza.5pmweb.com/?def=1&task=2473
                  }
              }
          }
          
        } else if (this.phase == CREATING || this.phase == CREATED || this.phase == FIRST_BINDING) {
          if (this.recoveryBean.isRecovery() && timeLeftMs > 0 && ! closedOnServer) {
              /*
               * POINT OF RECOVERY (2/2):
               * the socket failure has happened while we were trying to do a recovery.
               * 
               * When a recovery request fails we send another one in loop until a recovery succeeds or
               * the server replies with a sync error.
               */
              sessionLogger.logDebug("Start session recovery. Cause: socket failure while recovering");
              this.preparingRecovery = true;
              this.changePhaseType(SLEEP);              
              this.launchTimeout("currentRetryDelay", this.calculateRetryDelay(),reason);
              this.policyBean.increaseRetryDelay();
              
          } else if ((this.switchRequired && !this.forced) || BrowserDetection.isProbablyAndroidBrowser()) {
            sessionLogger.logDebug("Switching transport");
            //connection is broken but we already requested a change in session type, so move on
            this.handler.createMachine(this.handlerPhase,this.switchCause+".error",this.switchForced);

          } else {
              var cause = (closedOnServer ? "closed on server" /*i.e. CONERR*/ : "socket error");
              sessionLogger.logDebug("Start new session. Cause: ", cause);
              this.closeSession(reason,closedOnServer,RECOVERY_SCHEDULED);
              //now is SLEEPing

              if (serverBusyError) {
                  // Manage CONERR 5
                  this.launchTimeout("zeroDelay", 0, reason);
                  this.policyBean.increaseConnectTimeoutToMax();
              } else if (closedOnServer) {
                  // Manage other CONERRs
                  if (reconnectMaxDelay) {
                      /*
                       * If the client is trying to create a new session
                       * When it receives a CONERR because the Metadata adapter is down
                       * Then it creates a new session after reconnectMaxDelay
                       */
                      this.launchTimeout("reconnectMaxDelay", Math.ceil(Math.random() * reconnectMaxDelay), reason);
                  } else {
                      /*
                       * If the client is trying to create a new session
                       * When it receives a CONERR 
                       * Then it creates a new session immediately
                       */
                      this.launchTimeout("zeroDelay", 0, reason);
                  }
              } else if (this.recoveryBean.isRecovery() && timeLeftMs <= 0) {
                  /*
                   * If the client is trying to recovering the current session
                   * When it detects a connection error but it can't do a recovery because the sessionRecoveryTimeout is expired
                   * Then it creates a new session immediately
                   */
                  this.launchTimeout("zeroDelay", 0, reason);
              } else {
                  this.launchTimeout("currentRetryDelay", this.calculateRetryDelay(), reason);
                  this.policyBean.increaseRetryDelay();                  
              }
          }
          
          
          
          
        } else { //FIRST_PAUSE || _OFF || SLEEP
        /*
         * 23/05/2018
         * I think that it is logically possible that errors can occur during non-active phase, 
         * so I commented out the assertion.
         */
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
        //ASSERT.fail();
        //>>excludeEnd("debugExclude");
        //sessionLogger.logError("Unexpected error event while session is an non-active status",reason,this);
        }
                
      },
      
      /*private*/ onLoop: function(serverSentPause) {
        
        if (this.evalQueue && this.evalQueue.garbageCollection) {
          this.evalQueue.garbageCollection();
        }
        //phase check @ PushEvent level
        
        if (this.phase == RECEIVING || this.phase == STALLING || this.phase == _STALLED || this.phase == CREATED) {
          if (this.switchRequired) {
            this.handler.switchMachine(this.handlerPhase,this.switchCause,this.switchForced);
          } else if(this.slowRequired) {
            this.handler.slowMachine(this.handlerPhase);
          } else {
            this.doPause(serverSentPause);
          }
        } else {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected loop event while session is an non-active status",this);
        }
      },
      
      /*private*/ onEvent: function() {
        
        //phase check @ PushEvent level
        
        if (this.phase == CREATING) {
          if (!this.changePhaseType(CREATED)) { //inc phase count
            return;
          } 
          this.timeoutForExecution();
          
        } else if (this.phase == CREATED) {
          //stay created
          
        } else if (this.phase == BINDING || this.phase == FIRST_BINDING || this.phase == STALLING || this.phase == _STALLED || this.phase == RECEIVING) {
          if (!this.changePhaseType(RECEIVING)) { //inc phase count
            return;
          } 
          this.timeoutForStalling();

        } else { //FIRST_PAUSE PAUSE SLEEP _OFF 
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected push event while session is an non-active status",this);
        }
        
      },
      
////////////////////////////////////////////////////////actions
      
      /*private*/ createSent: function() {
        MadTester.incMadTest();
        this.sentTime = Helpers.getTimeStamp();
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        if (!ASSERT.verifyOk(this.phase == _OFF || this.phase == SLEEP)) {
          sessionLogger.logError("Unexpected phase after create request sent");
        }
      //>>excludeEnd("debugExclude");
        if (!this.changePhaseType(CREATING)) {
          return false;
        }
        
        this.launchTimeout("currentConnectTimeout", this.getCurrentConnectTimeout());//will be executed if create does not return, no need to specify the cause
        
        this.evalQueue = this.handler.getEvalQueue();
      },
      
      /*private*/ bindSent: function() {
        this.sentTime = Helpers.getTimeStamp();
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        if (!ASSERT.verifyOk(this.phase == PAUSE || this.phase == FIRST_PAUSE)) {
          sessionLogger.logError("Unexpected phase after bind request sent",this);
        }
      //>>excludeEnd("debugExclude");
        if (!this.changePhaseType(this.phase == PAUSE ? BINDING : FIRST_BINDING)) {
          return false;
        }
        
        this.serverBusy = false;
        
        this.launchTimeout("bindTimeout", this.getBindTimeout()); //will be executed if the bind does not return no need to specify the cause
        
        this.evalQueue = this.handler.getEvalQueue();
        this.onBindSent();
      },
      
      /*abstract*/ onBindSent: function() {},
      
      /*protected*/ launchTimeout: function(timeoutType, triggerAfter,timeoutCause) {
          /*
           * !!!!! WARNING !!!!!
           * Check that the signature of this method is coherent with the use of modifyTaskParam
           * in method timeoutForStalling()
           */
        if (sessionLogger.isDebugLogEnabled()) {        
            sessionLogger.logDebug("Status timeout in ", triggerAfter, timeoutType);
        }
        return Executor.addTimedTask(this.onTimeout,triggerAfter,this,[timeoutType,this.phaseCount,triggerAfter,timeoutCause]);
      },
      
      /*private*/ timeoutForStalling: function() {
        if (this.policyBean.keepaliveInterval > 0) {
          var now = Helpers.getTimeStamp();
          //avoid filling the Executor with timeouts
          if (now - this.lastKATO < 50 && this.lastKATask) {
            /*
             * !!!!! WARNING !!!!!
             * 1) lastKATask will execute method onTimeout()
             * 2) We want to modify the parameter phase, which is currently the second one 
             *    on the signature of onTimeout()
             * 3) Check that the signatures of onTimeout() and of launchTimeout() are coherent 
             *    with the index of modifyTaskParam
             */
            Executor.modifyTaskParam(this.lastKATask,1,this.phaseCount);
          } else {
            this.lastKATO = now;
            this.lastKATask = this.launchTimeout("keepaliveInterval", this.policyBean.keepaliveInterval); //we won't reconnect if this executes, so no need to add a cause
          }
        }
      },
      
      /*private*/ timeoutForStalled: function() {
        if (!this.changePhaseType(STALLING)) {
          return;
        }
        this.launchTimeout("stalledTimeout", this.policyBean.stalledTimeout); //we won't reconnect if this executes, so no need to add a cause
      },
      
      /*private*/ timeoutForReconnect: function() {
        if (!this.changePhaseType(_STALLED)) {
          return;
        }
        var timeLeftMs = this.recoveryBean.timeLeftMs(this.policyBean.sessionRecoveryTimeout);
        this.preparingRecovery = timeLeftMs > 0 && ! this.isRecoveryDisabled;
        this.launchTimeout("reconnectTimeout", this.policyBean.reconnectTimeout); //the onTimeout already knows the cause for this because we're STALLED
      },
      
      /*private*/ timeoutForExecution: function() {
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        if (!ASSERT.verifyValue(this.phase,CREATED)) {
          sessionLogger.logError("Unexpected phase during OK execution");
        }
      //>>excludeEnd("debugExclude");
        this.launchTimeout("stalledTimeout", this.policyBean.stalledTimeout);  //we won't reconnect if this executes, so no need to add a cause
      },
      
////////////////////////////////////////////////////////timeouts      
      
      /*private*/ getBindTimeout: function() {
        if (this.isPolling) {
          return this.getCurrentConnectTimeout() + this.policyBean.idleTimeout;
        } else {
          return this.workedBefore > 0 && this.reconnectTimeout != null ? this.reconnectTimeout : this.getCurrentConnectTimeout();
        }
      },
      
      /*private*/ getRealPollingInterval: function() {
        if (this.phase == FIRST_PAUSE) {
          return this.policyBean.pollingInterval;
          
        } else {
        
          var refInterval = this.policyBean.pollingInterval;
  
          if (this.sentTime) {
            var now = Helpers.getTimeStamp();
            var diff = now - this.sentTime;
            if (refInterval > diff) {
              refInterval -= diff;
              // compensiamo il tempo gia' trascorso durante la richiesta;
              // notare che poteva trattarsi di polling asincrono
            } else {
              refInterval = 0;
            }
          }
  
          /*if (! isNaN(this.policyBean.serverPollingInterval)) {
            if (this.policyBean.serverPollingInterval < refInterval) {
              // non possiamo attendere piu' di quanto il Server ci concede
              refInterval = this.policyBean.serverPollingInterval;
            }
          }*/
          return refInterval;
        }
      },
      
      /*private*/ calculateRetryDelay: function() {
        var spent = Helpers.getTimeStamp() - this.sentTime;
        var currentRetryDelay = this.getCurrentRetryDelay();
        return spent > currentRetryDelay ? 0 : currentRetryDelay - spent;
      },
      
      /*private*/ calculateReconnectTimeout: function() {
        if (!this.sentTime) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          sessionLogger.logError("Unexpected empty start time",this);
          this.reconnectTimeout = null;
        }
        
        
        //is the actual time we spent to send the request and receive the reponse (the roundtirp) 
        var spentTime = Helpers.getTimeStamp() - this.sentTime;
        
        //we add to our connectTimeout the spent roundtrip and we'll use that time as next connectCheckTimeout
        //ok, we wanna give enough time to the client to connect if necessary, but we should not exaggerate :)
        //[obviously if spentTime can't be > this.policyBean.connectTimeout after the first connection, 
        //but it may grow connection after connection if we give him too much time]
        var ct = this.getCurrentConnectTimeout();
        this.reconnectTimeout = (spentTime > ct ? ct : spentTime) + ct;
      },
      
      
      
///////////////////////////////////////////////Callbacks
     
      /*private*/ onStreamResponse: function(_data,toCheckPhase) {
        if (EnvironmentStatus.isUnloaded() || !this.checkSessionPhase(toCheckPhase)) {  //must check the unloaded because may be called by the ajaxFrame thread
          //not from this phase, we don't care, this response is obsolete
          return;
        }
         
        if (_data === "") {
          //fake notification
          return;
        }
        
        if (_data == null) {
          //something went wrong
          //maybe the server went down? 
          //notify that something went wrong...
          MadTester.rollbackLastMadTest();
          this.onErrorEvent("nullresp");
          return;
        }
       
        this.evalQueue._enqueue(toCheckPhase,_data); //will fail if domain changes
      },
      
      /*private*/ onStreamError: function(reason,toCheckPhase,fromWS,unableToOpen,possibleLoop) {
        //must check the unloaded because may be called by the ajaxFrame thread
        //the call is usually in sync with the load call; that's not the case on Opera
        if (EnvironmentStatus.isUnloaded() || !this.checkSessionPhase(toCheckPhase)) { 
          return;
        }
        
        MadTester.rollbackLastMadTest();
        this.onErrorEvent("failure." + reason, {fromWS: fromWS, unableToOpen: unableToOpen, possibleLoop: possibleLoop, tryRecovery: true});
      },
      
      /*private*/ onStreamEnd: function(toCheckPhase,fromWS) {
          if (this.sessionRecovery && this.phase == SLEEP) {
              /*
               * The method is called because the recovery has failed due to a socket error and 
               * the socket has been closed.
               * But since we are expecting the expiration of the retryDelay to try again the recovery,
               * we don't generate an error event (see method onErrorEvent: POINT OF RECOVERY (2/2)).
               */
              return;
          }
        //in case of a good end the checkSessionPhase check will fail as we changed phase due to the loop [http cases]
        //in case of a good end the checkSessionPhase check will fail as we changed phase due to the fact that we're now in the off case [ws cases]
        
        if (this.checkSessionPhase(toCheckPhase)) {
          //avoid to count this connection as mad
          MadTester.rollbackLastMadTest();
          //try to open a new session
          this.onErrorEvent("wrongend",{fromWS: fromWS,tryRecovery: true});
        }
      
      },
      
      /*public*/ evaluationError: function() {
        this.onErrorEvent("eval");
      },
      

///////////////////////////////////////////////SlowingEvents
      
      //slowing calls this one
      onSlowRequested: function() {
        //if already slowing or switching I should not ask to slow again...
        if (this.switchRequired || this.slowRequired) {
          //this Session is already changing, we do not act
          return;
        }
            
        this.handler.onSlowRequired(this.handlerPhase);
      },
      
      //slowing calls this one
      /*public*/ onSynchOk: function() {
        
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Synch event received");
        }
        
        this.onEvent();
        
        if (this.phase == RECEIVING) {
          //with XHRStreamingConnection we've seen cases (eg: Chrome on Android 2.2 / Opera 10.64 on Kubuntu)
          //where the first part of the connection is sent as expected while its continuation is not sent at all (Opera)
          //or is sent in blocks (Chrome) so we wait for the sync method before remembering that the streaming actually works
          this.workedBefore = PERMISSION_TO_FAIL; 
        }
      
      },
      
///////////////////////////////////////////////PushEvents
      
      onServerSentBandwidth: function(maxBandwidth) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Available bandwidth event received",maxBandwidth);
        }
        this.serverSentBW = maxBandwidth;
        this.policyBean.simpleSetter("realMaxBandwidth", (maxBandwidth == "unmanaged" ? "unlimited" : maxBandwidth));
      },
      
      onError41: function() {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Error41 event received");
        }
        //this is a nasty android browser bug, that causes a POST to be lost and another one to be reissued 
        //under certain circumnstances (https is fundamental for the issue to appear).
        //seen on Android 

        //this is also a Sont-Bravia TV Opera bug, that causes frame-made requests to be reissued when the frame changes again
        //sometimes the correct answer reach the client, others the wrong one carrying error 41 does
        //seen on Opera on bravia TV  
        this.onErrorEvent("error41",{closedOnServer: true});
      },
      
      /*public*/ onKeepalive: function() {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Keepalive event received");
        }
        this.onEvent();
        /*
         * In order to notify the client listener about a probe message, the following classes must be traversed:
         * - PushEvents
         * - Session
         * - SessionHandler
         * - LightstreamerEngine
         * - PushPageCollectionHandler
         * - NewPushPageHandler
         * - NewEngineHandler
         * - LightstreamerClient
         */
        this.handler.onServerKeepalive();
      },
      
      onOKReceived: function(newSession,controlLink,requestLimitLength,keepaliveIntervalDefault) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("OK event received");
        }
       	
        var lastUsedAddress = this.getPushServerAddress();
        var addressToUse = lastUsedAddress;
        if (controlLink != null && !this.ignoreServerAddressCache) {
          controlLink = RequestsHelper.completeControlLink(addressToUse, controlLink);
          addressToUse = controlLink;
        }
        this.sessionServerAddress = addressToUse;
        
        if (lastUsedAddress != this.sessionServerAddress) {
          this.handler.onObsoleteControlLink(lastUsedAddress);
          this.handler.onNewControlLink(this.sessionServerAddress);
        }
        
        if (keepaliveIntervalDefault) {
          if (this.isPolling) {
            //on polling sessions the longest inactivity permitted is sent instead of the keepalive setting
            this.policyBean.simpleSetter("idleTimeout", keepaliveIntervalDefault);
          } else {
            //this.policyBean.simpleSetter('serverKeepaliveInterval', keepaliveIntervalDefault);
            this.policyBean.simpleSetter("keepaliveInterval", keepaliveIntervalDefault);
          }
        }
        
        if (this.phase == CREATING) {
          //New session!
            if (this.sessionId != null && this.sessionId != newSession) {
                // nothing can be trusted here
                sessionLogger.logInfo("Initializing session", newSession, this.sessionId);
                this.reset();
            }
          this.sessionId = newSession;
          
        } else {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          if (!ASSERT.verifyValue(this.sessionId,newSession)) {
            sessionLogger.logError("Unexpected session id received on bind OK");
          }
        //>>excludeEnd("debugExclude");
          this.calculateReconnectTimeout();
          
        }
        
        this.slowing.startSync(this.isPolling);
        
        // NB 
        // onEvent() changes the connection status, 
        // so the connection details/options must be set before notifying the user
        this.connectionBean.simpleSetter("sessionId",newSession);
        this.connectionBean.simpleSetter("serverInstanceAddress",this.sessionServerAddress);

        this.onEvent();
       
        if (this.phase == CREATED) {
            if (this.recoveryBean.isRecovery()) {
                /* 
                 * branch reserved for recovery responses 
                 * (i.e. bind_session requests with LS_recovery_from parameter)
                 */
                this.recoveryBean.restoreTimeLeft();
                
            } else {
                /* 
                 * branch reserved for create_session responses 
                 */
                this.handler.onSessionStart(requestLimitLength);
                                
                if (this.cachedRequiredBW) {
                    this.changeBandwidth();
                    this.cachedRequiredBW = false;
                }
            }
          
        } else {
            /* 
             * branch reserved for bind_session responses (recovery responses excluded) 
             */
            this.handler.onChangeRequestLimitLength(requestLimitLength);
            this.handler.onSessionBound();
            this.onSessionBound();
        }
      },
      
      onIPReceived: function(clientIp) {
          if (clientIp) {
              this.handler.onIPReceived(clientIp);
              this.connectionBean.simpleSetter("clientIp", clientIp);
          }
      },
      
      onSyncReceived: function(secs) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Sync event received");
        }
        
        this.slowing.syncCheck(secs);
        
        this.onEvent();
      },
        
      /*public*/ onLoopReceived: function(serverSentPause) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("Loop event received");
        }
      
        this.onLoop(serverSentPause);
      },
      
      /*public*/ onSyncError: function(cause) {
        this.onSessionError(cause);
      },
      
      /**
       * Manages CONERR errors.
       */
      forwardError: function(errorCode, errorMsg) {
          if (errorCode === this.policyBean.remoteAdapterStatusObserver.metadataErrorCode) {
              this.onMetadataAdapterError();
              return;
          }
          switch (errorCode) {
          
          case 20: // sync error
              this.onSyncError("syncerror");
              break;
              
          case 4: // recovery error
              this.onSyncError("recovery.error");
              break;
              
          case 5:
              if (Constants.handleError5) {
                  this.onServerBusy();
              } else {
                  this.onFatalError(errorCode, errorMsg);
              }
              break;
              
          case 40:
          case 41:
          case 48:
              // other errors which cause a new session creation
              this.onSessionError("error" + errorCode);
              break;
              
          default:
              this.onFatalError(errorCode, errorMsg);
          }
      },
      
      /**
       * Manages REQERR/ERROR errors.
       */
      forwardControlResponseError: function(errorCode, errorMsg, listenerCallback) {
          if (errorCode == 20) { // sync error
              this.onSyncError("syncerror");
          } else if (errorCode == 11) {
              // error 11 is managed as CONERR 21
              this.onFatalError(21, errorMsg);              
          } else if (listenerCallback != null && errorCode != 65 /*65 is a fatal error*/) {
              /*
               * since there is a listener (because it is a REQERR message), 
               * don't fall-back to fatal error case
               */
              try {
                  listenerCallback();
              } catch (e) {
                  this.handler.onFatalError(e);
              }
          } else {
              /*
               * fall-back case handles fatal errors, i.e. ERROR messages: 
               * close current session, don't create a new session, notify client listeners
               */
              this.onFatalError(errorCode, errorMsg);
          }
      },
      
      onMetadataAdapterError: function() {
          MadTester.rollbackLastMadTest();
          this.onErrorEvent("metadata.adapter.disconnected", {
              closedOnServer: true, 
              reconnectMaxDelay: this.policyBean.remoteAdapterStatusObserver.reconnectMaxDelay});
      },
      
      /**
       * Closes the current session and creates a new session. 
       */
      onSessionError: function(cause) {
          //we've to rollback a count on the mad create or there is a tiny risk that we'll get a false positive
          //on the mad timeouts algorithm
          MadTester.rollbackLastMadTest();
          this.onErrorEvent(cause,{closedOnServer: true});
      },
      
      disconnectAndReconnect: function() {
          MadTester.rollbackLastMadTest();
          this.onErrorEvent("remote.adapter.disconnected", {
              reconnectMaxDelay: this.policyBean.remoteAdapterStatusObserver.reconnectMaxDelay});
      },
      
      onServerBusy: function() {
          //we've to rollback a count on the mad create or there is a tiny risk that we'll get a false positive
          //on the mad timeouts algorithm
          MadTester.rollbackLastMadTest();
          
          this.serverBusy = true;
          this.onErrorEvent("server.busy",{closedOnServer: true,serverBusyError: true});
      },
      
      /**
       * Closes the current session, doesn't create a new session and notifies the client listeners.
       */
      onFatalError: function(errorCode, errorMsg) {
          this.onServerError(errorCode, errorMsg);
      },
      
      /*public*/ onEnd: function(message) {
        if (protocolLogger.isDebugLogEnabled()) {
          protocolLogger.logDebug("End event received",message);
        }
        this.closeSession("end",CLOSED_ON_SERVER,NO_RECOVERY_SCHEDULED);
      },
      
      onPROGCounterMismatch: function() {
          this.isRecoveryDisabled = true;
      },
      
      /*public*/ onUpdateReceived: function(args,snap) {
        this.onEvent();
        
        this.handler.onUpdateReceived(args,snap);
      },
      
      /*public*/ onEndOfSnapshotEvent: function(args) {
        this.onEvent();
        
        this.handler.onEndOfSnapshotEvent(args);
      },
      
      /*public*/ onClearSnapshotEvent: function(args) {
        this.onEvent();
        
        this.handler.onClearSnapshotEvent(args);
      },
      
      /*public*/ onLostUpdatesEvent: function(args) {
        this.onEvent();
        
        this.handler.onLostUpdatesEvent(args);
      },
      
      /*public*/ onMessageAck: function(sequence,num) {
        this.onEvent();
        
        this.handler.onMessageAck(sequence, num);
      },
      
      onMessageOk: function(sequence,num) {
        this.onEvent();
        
        this.handler.onMessageOk(sequence, num);
      },
      
      // <= 0 message rejected by the Metadata Adapter
      onMessageDeny: function(sequence,flag,msg,num) {
        this.onEvent();
        
        this.handler.onMessageDeny(sequence,flag,num,msg);
      },
      
      // 38 message has not arrived in time (and perhaps never come)
      /*public*/ onMessageDiscarded: function(sequence,num) {
        this.onEvent();
        
        this.handler.onMessageDiscarded(sequence,num);
      },
      
      /*public*/ onMessageError: function(sequence,flag,msg,num) {
         this.onEvent();
        
         this.handler.onMessageError(sequence,flag,num,msg);
      },
      
      /*public*/ onTableError: function(tableCode,flag,msg) {
        this.onEvent();
         
        this.handler.onTableError(tableCode,flag,msg);
      },
       
      /*public*/ onServerError: function(flag,msg) {
        this.onEnd(msg);
        
        this.handler.onServerError(flag,msg);
      },
      
      /*public*/ onUnsubscription: function(tableCode) {
        this.onEvent();
        
        this.handler.onUnsubscription(tableCode);
      },
      
      /*public*/ onSubscription: function(tableCode,numOfSubscribedItems,numOfSubscribedFields,keyPos,commandPos) {
        this.onEvent();
        
        this.handler.onSubscription(tableCode,numOfSubscribedItems,numOfSubscribedFields,keyPos,commandPos);
      },
      
      /*public*/ onSubscriptionReconf: function(tableCode,phase,frequency) {
        this.onEvent();
        
        this.handler.onSubscriptionReconf(tableCode,phase,frequency);
      },
           
      getDataNotificationProg: function() {
          return this.dataNotificationCount;
      },

      onDataNotification: function() {
          this.dataNotificationCount++;
      },
      
///////////////////////////////////////////////CONTROL      
      
      /*private*/ forceRebind: function(rebindCause) {  
        sessionLogger.logInfo("Sending request to the server to force a rebind on the current connection",this);
        
        var _data = RequestsHelper.getForceRebindParams(rebindCause,this.slowing.getDelay());

        //this is used to retry force_bind requests in case they fail to reach the server
        var tutor = new ForceRebindTutor(rebindCause,this,this.push_phase,this.policyBean);
        
        var requestListener = {
                onREQOK: function(LS_window) {
                    // nothing to do: expecting LOOP
                },

                onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                    tutor.discard();
                    sessionLogger.logError("force_rebind request caused the error: " + errorCode + " " + errorMsg + " - The error will be silently ignored.");
                }
        };
        this.controlHandler.addRequest(this.sessionId, _data, ControlRequest.FORCE_REBIND, tutor, null, requestListener);
        
      },
      
      // NB: you should never call sendDestroySession directly, call closeSession instead 
      // (sendDestroySession does not make checks on the situation) 
      /*private*/ sendDestroySession: function(reason) { 
        sessionLogger.logInfo("Sending request to the server to destroy the current session",this);
    
        //we always destroy the last session: if we need to destroy a session 
        //is on a browser were we don't permit the buffering of a second session
        
        var _data = RequestsHelper.getDestroyParams(this.sessionId,reason);
        
        var requestListener = {
                onREQOK: function(LS_window) {
                    // nothing to do
                },

                onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                    sessionLogger.logError("destroy request caused the error: " + errorCode + " " + errorMsg + " - The error will be silently ignored.");
                }
        };
        this.forwardDestroyRequestToTransport(this.sessionId, _data, ControlRequest.DESTROY,null,this.getPushServerAddress(),requestListener);
      },
      
      changeBandwidth: function() {
        if (this.phase == _OFF || this.phase == SLEEP) {
          return;
        } else if (this.phase == CREATING) {
          //too late to send it via create_session
          //too early to send it via control
          this.cachedRequiredBW = true;
          return;
        } else if (this.serverSentBW == "unmanaged") {
          return;
        }
        var query = RequestsHelper.getConstraintParams(this.policyBean);
        
        var requestListener = {
                onREQOK: function(LS_window) {
                    // nothing to do: expecting CONS
                },

                onREQERR: function(LS_window, phase, errorCode, errorMsg) {
                    sessionLogger.logError("constrain request " + printObj(query) + " caused the error: ", errorCode, errorMsg);
                }
        };
        this.controlHandler.addRequest(null, query, ControlRequest.CONSTRAINT, null, null, requestListener);
      },
      
      onServerName: function(name) {
          this.connectionBean.simpleSetter("serverSocketName", name);
      },

      /**@protected*/onSessionBound: function() {
          this.resetTimers();
      },
      
      /**
       * @abstract
       * Forwards a destroy request to the transport.
       * <p>
       * <i>HTTP and WebSocket implementations must be different because, since the method is called 
       * when the session is closing, WebSocket can delivery the request synchronously 
       * while HTTP has to delivery the request asynchronously.</i> 
       */
      forwardDestroyRequestToTransport: function(sessionId, request, type, related, retryingOrHost, requestListener) {
          throw new Error("abstract method");
      },
      
      onMpnRegisterOK: function(deviceId, adapterName) {
    	  this.mpnManager.eventManager.onRegisterOK(deviceId, adapterName);
      },
      
      onMpnRegisterError: function(code, message) {
    	  this.mpnManager.eventManager.onRegisterError(code, message);
      },
      
      onMpnSubscribeOK: function(lsSubId, pnSubId) {
          this.mpnManager.eventManager.onSubscribeOK(lsSubId, pnSubId);
      },
      
      onMpnSubscribeError: function(subId, code, message) {
          this.mpnManager.eventManager.onSubscribeError(subId, code, message);
      },
      
      onMpnUnsubscribeOK: function(pnSubId) {
          this.mpnManager.eventManager.onUnsubscribeOK(pnSubId);
      },
      
      onMpnUnsubscribeError: function(subId, code, message) {
          this.mpnManager.eventManager.onUnsubscribeError(subId, code, message);
      },
      
      getCurrentConnectTimeout: function() {
          return this.policyBean.currentConnectTimeout;
      },
      
      getCurrentRetryDelay: function() {
          return this.policyBean.currentRetryDelay;
      }
  };
  
  function printObj(obj) {
      var s = "{";
      for (var p in obj) {
          s += p + "=" + obj[p] + " ";
      }
      s += "}";
      return s;
  }

  export default Session;
  



