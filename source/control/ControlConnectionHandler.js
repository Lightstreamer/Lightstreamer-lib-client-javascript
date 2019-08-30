
import ControlRequest from "./ControlRequest";
import ControlRequestBatch from "./ControlRequestBatch";
import LoggerManager from "../../src-log/LoggerManager";
import Request from "../net/Request";
import Executor from "../../src-tool/Executor";
import ConnectionSelector from "../net/ConnectionSelector";
import Constants from "../Constants";
import ASSERT from "../../src-test/ASSERT";
  
  var requestsLogger = LoggerManager.getLoggerProxy(Constants.REQUESTS);
  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  
  
  var _IDLE = 1;
  var _STANDBY = 2;
  var _WAITING = 3;
  
  var phNames = {};
  phNames[_IDLE] = "IDLE";
  phNames[_STANDBY] = "STAND BY";
  phNames[_WAITING] = "WAITING RESP";
  
  var SYNC_DEQUEUE = true;
  var ASYNC_DEQUEUE = false;
  var WAIT_CONN_DELAY = 200;
  var WAIT_RESP_DELAY = 4000;
  
  var REQ_EMPTY = 1;
  var SEND_LATER = 2;
  var NO_CONN = 3;
  var SENT_HTTP = 4;
  var SENT_WS = 5;
  
  var SECURITY_LIMIT = 1;
  
  
  function phToStr(ph) {
    return phNames[ph];
  }
  
  
  
 
  
  
  
  
  
  function firstRequestToRequest(queueToSend,srvAddr,cookieRequired,extraHeaders) {
    var firstRequest = queueToSend.firstRequest();
    if (!firstRequest) {
      return null;
    }
    var req = new Request(((firstRequest.retryingOrHost && firstRequest.retryingOrHost !== true) ? firstRequest.retryingOrHost : srvAddr)+Constants.LIGHTSTREAMER_PATH);
    req.setCookieFlag(cookieRequired);
    req.setExtraHeaders(extraHeaders);
    return req;
  }
  
  
  
  
  /**
   * accumula richieste di controllo
   * si basa sulla gestione dei thread JS, lanciando il lanciatore in una
   * setTimeout questo metodo dovrebbe fare in tempo a accumulare assieme
   * tutte le table ADDate durante il thread corrente
   */
  var ControlConnectionHandler = function(owner,policyBean,engId,skipCors) {
    this.corsDisabled = false;
    this.connectionList = null;
    this.conn = null;
    
    this.messageQueue = null; 
    this.controlQueue = null;
    this.logQueue = null;
    this.destroyQueue = null;
    this.hbQueue = null;
    this.mpnQueue = null;
    
    this.currentReverseHeartbeatInterval = 0;
    this.grantedReverseHeartbeatInterval = 0;
    // grantedReverseHeartbeatInterval was declared in a streaming bind_session,
    // so, it must be maintained as long as the streaming connection is active;
    // hence the invariant:
        // grantedReverseHeartbeatInterval == 0 || 0 != currentReverseHeartbeatInterval <= grantedReverseHeartbeatInterval
    
    this.requestLimit = 0; 

    this.statusPhase = 1;
    this.status = _IDLE;
    this.phase = 1; //this phase is incremented only by the reset method. It is used to check if between addRequest and addRequestExe a reset occurred

    this.typeFlag = 0; // handles turns (control-sendMessage-sendLog)
   
    this.lastBatch = null;

//>>excludeStart("debugExclude", pragmas.debugExclude);
    this.fakeSyncError = false;
//>>excludeEnd("debugExclude");
  
    
    
    this._owner = owner;
    this.policyBean = policyBean;
    this.engId = engId;
    
    this.wsConn = null;
    
    /**
     * Maps LS_reqId with the corresponding request listeners.
     * The listeners (called by EvalQueue) manage REQOK/REQERR responses according to the request types.
     */
    this.requestListenerMap = {};
  
    this.resetConnectionList(skipCors);
    this._reset();
  };
  
  ControlConnectionHandler.prototype = {
    
    /*public*/ toString: function() {
      return ["[","ControlConnectionHandler",phToStr(this.status),this.lastBatch,this.requestLimit,this.currentReverseHeartbeatInterval,"]"].join("|");
    },
    
    /*public*/ setRequestLimit: function(newLimit) {
      this.requestLimit = newLimit;
      requestsLogger.logDebug("Batch length limit changed",this);
    },
    
    /*public*/ startReverseHeartbeats: function(newInterval, force) {
      if (force) {
          this.currentReverseHeartbeatInterval = newInterval;
          this.grantedReverseHeartbeatInterval = newInterval;
          requestsLogger.logInfo("Start sending reverse heartbeat to the server",this);
      } else {
          if (this.grantedReverseHeartbeatInterval == 0 || newInterval < this.grantedReverseHeartbeatInterval) {
              this.currentReverseHeartbeatInterval = newInterval;
              requestsLogger.logInfo("Start sending reverse heartbeat to the server",this);
          } else {
              this.currentReverseHeartbeatInterval = this.grantedReverseHeartbeatInterval;
              requestsLogger.logInfo("Keep sending reverse heartbeat to the server",this);
          }
      }
      if (this.status == _IDLE) {
        this.sendReverseHeartbeat(this.statusPhase);
        // this may be redundant in many cases, for instance if we are sending a bind request,
        // but the case is rare and we don't want to complicate things with a check
      }
    },
    
    sendReverseHeartbeat: function(sc) {
      if (this.status != _IDLE || this.statusPhase != sc || this.currentReverseHeartbeatInterval == 0) {
        return;
      }
      
      requestsLogger.logDebug("Preparing reverse heartbeat",this);
      this.addRequest(null, "", ControlRequest.HEARTBEAT);
   
    },
    
    /*public*/ stopReverseHeartbeats: function(force) {
      if (force) {
          requestsLogger.logInfo("Stop sending reverse heartbeat to the server",this);
          this.currentReverseHeartbeatInterval = 0;
          this.grantedReverseHeartbeatInterval = 0;
          //do nothing, the next heartbeat will not be sent because of the 0 interval
      } else {
          if (this.grantedReverseHeartbeatInterval == 0) {
              requestsLogger.logInfo("Stop sending reverse heartbeat to the server",this);
              this.currentReverseHeartbeatInterval = 0;
              //do nothing, the next heartbeat will not be sent because of the 0 interval
          } else {
              requestsLogger.logInfo("Keep sending reverse heartbeat to the server",this);
              this.currentReverseHeartbeatInterval = this.grantedReverseHeartbeatInterval;
          }
      }
    },
    
    /*public*/ resetConnectionList: function(skipCors) {
      this.connectionList = new ConnectionSelector(ConnectionSelector.CONTROL_LIST,false,!this.policyBean.corsXHREnabled || skipCors);
      this.conn = null;
    },
    
    /*private*/ _close: function() {
      requestsLogger.logDebug("Close current connection if any and applicable");
      if (this.conn) {
        this.conn._close();
      }
    },
    
    /*private*/ changeStatus: function(newStatus, caller) {
      this.statusPhase++; //used to verify deque and sendHeartbeats calls
            
      if (newStatus == _IDLE && this.currentReverseHeartbeatInterval > 0) {
        Executor.addTimedTask(this.sendReverseHeartbeat,this.currentReverseHeartbeatInterval,this,[this.statusPhase]);
      }
      if (requestsLogger.isDebugLogEnabled()) {          
          requestsLogger.logDebug("ControlConnectionHandler state change '", caller + phNames[this.status] + " -> " + phNames[newStatus]);
      }
      this.status = newStatus;
    },

    /*public*/ _reset: function() {
      requestsLogger.logDebug("Reset Controls handler status",this);
      this.requestLimit = 0;
      
      this.messageQueue = new ControlRequestBatch(ControlRequest.MESSAGE); 
      this.controlQueue = new ControlRequestBatch(ControlRequest.ADD); //for ADD REMOVE CONSTRAIN and FORCE_REBIND
      this.hbQueue = new ControlRequestBatch(ControlRequest.HEARTBEAT); 
      this.mpnQueue = new ControlRequestBatch(ControlRequest.MPN);
      
      this.wsConn = null;
      
      this.currentReverseHeartbeatInterval = 0;
      this.grantedReverseHeartbeatInterval = 0;

      //log and destroy are not session bound
      if (!this.logQueue) {
        this.logQueue = new ControlRequestBatch(ControlRequest.LOG); 
      }
      if (!this.destroyQueue) {
        //destroy queue is declared of type ADD for simplicity
        this.destroyQueue = new ControlRequestBatch(ControlRequest.ADD);
      }
      
      this.reqQueues = [this.messageQueue,this.controlQueue,this.logQueue,this.destroyQueue,this.hbQueue,this.mpnQueue];
      
      //we should avoid blocking the pending request if it's a DESTROY or a LOG;
      //from a general point of view if a request is going to a non-session host
      //we let it go on.
      
      //addRequest->addRequestExe in the middle will be discarded (excluding destroy and log)       
      this.phase++; 
      
      //excluding destroy and log requests, requests active now are aborted
      var _type = this.lastBatch ? this.lastBatch.getBatchType() : null;
      
      if (_type !== null && _type !== ControlRequest.DESTROY && _type !== ControlRequest.LOG) {  

        //>>excludeStart("debugExclude", pragmas.debugExclude);            
        if (!ASSERT.verifyDiffValue(this.status,_IDLE)) {
          requestsLogger.logError("Batch handler unexpectedly idle; a batch was waiting");
        }
        //>>excludeEnd("debugExclude");         
        
        this._close();
        
        this.lastBatch = null;
        
        this.changeStatus(_IDLE, "_reset");
        
        //at this point we may have blocked DESTROY or LOG requets that will remain in the queue until a dequeue is called.
        //to avoid waiting for an external intervention (ie a new request in the queue) before dequeuing the survived requests
        //we call the dequeue here
        this.dequeue(ASYNC_DEQUEUE, "reset1"); //the status will immediately change to STANDBY


      } else if (_type === null) {
     
        //>>excludeStart("debugExclude", pragmas.debugExclude);            
        if (!ASSERT.verifyValue(this.status,_IDLE)) {
          requestsLogger.logError("Batch handler unexpectedly not idle; nothing ready to be sent was found");
        }
        
        //nothing to close
        //lastBatch is already null
        if (!ASSERT.verifyValue(this.lastBatch,null)) {
          requestsLogger.logError("Batch object not null");
        }
      //>>excludeEnd("debugExclude");  
        
        //there should not be nothing to dequeue, btw let's call dequeue anyway  
        this.dequeue(ASYNC_DEQUEUE,"reset2"); 
        
      } 
      //else we're dequeuing a DESTROY or LOG request so don't change the statusPhase NOR THE PHASE
     
 
      //NOTE:
      //phase affects all the addRequest that are still pending (and are not DESTROY or LOG)
      //statusPhase only affects the lastBatch
 
    },
    
    assignWS: function(wsConn) {
      
      if (wsConn) {
        requestsLogger.logDebug("Enabling control requests over WebSocket now",this);
      } else if (this.wsConn) {
        requestsLogger.logDebug("Disabling control requests over WebSocket now",this);
      }
      
      this.wsConn = wsConn;
    },
    
    /**
     * Notes:
     * 
     * - each batch has a type (see ControlRequest constants)
     * 
     * - there are 5 batches: 
     *      messageQueue (batchType = ControlRequest.MESSAGE)
     *      controlQueue (batchType = ControlRequest.ADD)
     *      hbQueue (batchType = ControlRequest.HEARTBEAT)
     *      logQueue (batchType = ControlRequest.LOG)
     *      destroyQueue (batchType = ControlRequest.ADD)
     *      
     * - each batch can contain requests of different types (see ControlRequest constants)
     * 
     * - checks in ControlRequestBatch.addRequestToBatch avoid that requests go in the wrong batch
     * 
     * - each request has a type (see ControlRequest constants)
     *  
     * - each request has a key (see ControlRequest.getKey)
     * 
     * - each request in a batch has a key which is composed of a letter and ControlRequest.getKey value
     *   (for example CHANGE_SUB_KEY+request.getKey()) (see ControlRequestBatch.addRequestToBatch)
     *   
     * @param num table index for add & delete, session number for destroy, null for everything else
     * @param request request query LS_table=...LS_sanpshot...
     * @param _type one of the request type constants (@see ControlRequest)
     * @param related request-related listener
     * @param flag that shows if this is the first time this request is sent for this session or not,
     *   (for add requests) or host to be forced for this request (for DESTROY)
     * @param listener managing REQOK/REQERR response
     */
    /*public*/ addRequest: function(num, request, _type, related, retryingOrHost, requestListener) {
        this.addRequestListener(request, requestListener);
        Executor.addTimedTask(this.addRequestExe,0,this,[this.phase, num, request, _type, related, retryingOrHost]);
    },
  
    /**
     * @public
     * Synchronous version of addRequest method. The request is immediately written into the available connection.
     */
    addSyncRequest: function(num, request, _type, related, retryingOrHost) {
        this.addRequestExe(this.phase, num, request, _type, related, retryingOrHost);
    },
  
    /*private*/ checkPhase: function(toCheck,_type) {
      if (_type == ControlRequest.DESTROY || _type == ControlRequest.LOG) {
        //LOG and DESTROY do not care about phase, must always go to the server
        return true;
      } else {
        return this.phase === toCheck;
      }
    },
    
    /*private*/ addToProperBatch: function(_type,controlRequestObj) {
      if (_type == ControlRequest.MESSAGE) {
        this.messageQueue.addRequestToBatch(controlRequestObj);
        
      } else if (_type == ControlRequest.LOG) {
        this.logQueue.addRequestToBatch(controlRequestObj);
        
      } else if (_type == ControlRequest.DESTROY) {
        this.destroyQueue.addRequestToBatch(controlRequestObj);
        
      } else if (_type == ControlRequest.HEARTBEAT) {  
        this.hbQueue.addRequestToBatch(controlRequestObj);
        
      } else if (_type == ControlRequest.MPN) {
          this.mpnQueue.addRequestToBatch(controlRequestObj);
          
      } else {
        //various control.js requests
        this.controlQueue.addRequestToBatch(controlRequestObj);
        
      }
    },
    
    /**
     * @param num table index for add & delete, session number for destroy, null for everything else
     * @param request request query LS_table=...LS_sanpshot...
     * @param _type one of the request type constants (@see ControlRequest)
     * @param related request-related listener
     * @param retryingOrHost flag that shows if this is the first time this request is sent for this session or not,
     *   (for add requests) or host to be forced for this request (for DESTROY)
     */
    /*private*/ addRequestExe: function(ph, num, request, _type, related, retryingOrHost) {
      if(!this.checkPhase(ph,_type)) {
        return;
      }
      
      requestsLogger.logInfo("New request to be sent",this,request);
     
      //retrying flag is only "needed" for ADD requests
      var controlRequestObj = new ControlRequest(request,related,_type,num,retryingOrHost);
      
      this.addToProperBatch(_type,controlRequestObj);

      if (this.status == _IDLE) {
        this.dequeue(SYNC_DEQUEUE,"add");
      } else {
        //we're already busy, we'll dequeue when we'll be back
        requestsLogger.logDebug("Still waiting previous batch",this);
      }
      
    },
    
    /*private*/ dequeue: function(sync,who) {
      if (sync === true) {
        requestsLogger.logDebug("Ready to dequeue",sync,this);
        this.dequeueControlRequests(this.statusPhase,who);
        
      } else {
        requestsLogger.logDebug("Waiting for dequeue",sync,this);
        var delay = sync === false ? 0 : sync;
        Executor.addTimedTask(this.dequeueControlRequests,delay,this,[this.statusPhase,"async."+who]);
      }      
    },
    
    /*private*/ dequeueControlRequests: function(ph,who) {
      
      if(ph != this.statusPhase) {
        return;
      }
      
      //just to avoid too-long loops
      var security = 0;
      while(security < SECURITY_LIMIT) {
        security++;
        
        this.changeStatus(_STANDBY, "dequeueControlRequests");
        
        requestsLogger.logDebug("starting dequeuing",who,this);
        
        var outcome = null;
        if (this.lastBatch != null) {
          requestsLogger.logDebug("Send previous batch");
          outcome = this.sendBatch(this.lastBatch);
        } else {
          requestsLogger.logDebug("Send new batch");
          outcome = this.selectAndSendBatch();
        }
        
        if (outcome == REQ_EMPTY) {
          requestsLogger.logInfo("Some requests don't need to be sent anymore, keep on dequeing");
          
          this.lastBatch = null;
          //this.dequeue(SYNC_DEQUEUE); 
          
          //we do not call SYNC_DEQUEUE, we let the loop to continue (that's quite the same!)
          
        } else if (outcome == SEND_LATER) {
          requestsLogger.logInfo("Delaying requests; waiting for a connection");
          //will try to send lastBatch
          this.dequeue(WAIT_CONN_DELAY,"later");
          return;
          
        } else if (outcome == NO_CONN) {
          requestsLogger.logWarn("Can't find a connection to send batch");
          
          //I have no way to open a connection;
          //this should never happen because, unless
          //we're sending a log line, we had a working
          //connection upon which the session id was received
          
          //so, no way to send the request, what should I do now??
          //notify the senders and hope...
          if (this.lastBatch) {
            this.lastBatch.notifySenders(true);
          }
          this.lastBatch = null;
          
          this.dequeue(ASYNC_DEQUEUE,"no");
          return;
          
        } else if (outcome == SENT_HTTP) {
          requestsLogger.logInfo("Request sent through HTTP connection");
          
          this.changeStatus(_WAITING, "dequeueControlRequests");
          if (this.lastBatch) {
              this.lastBatch.notifySenders();
          }
          
          //if still the same phase when this happen,
          //we send again the lastBatch
          this.dequeue(WAIT_RESP_DELAY,"http");
          return;
          
        } else if (outcome == SENT_WS) {
          requestsLogger.logInfo("Request sent through WebSocket, keep on dequeuing");
          
          this.changeStatus(_WAITING, "dequeueControlRequests");
          if (this.lastBatch) {
              this.lastBatch.notifySenders();
          }

          //we don't need a timeout, we're ready right now to handle a new request (plus we'll never have notification of responses on WebSocket as responses are handled by the stream connection listener)
          this.lastBatch = null;
          
          //we have to move in the _IDLE status as we're not waiting anything
          this.changeStatus(_IDLE, "dequeueControlRequests");
          
          //we will be back to the _STANDBY phase immediately if the loop goes on
          
          //this.dequeue(SYNC_DEQUEUE);
          
        } else {
          requestsLogger.logInfo("Request queue is now empty");
          
          this._close(); //I think that this call is useless
          //nothing to do now
          this.changeStatus(_IDLE, "dequeueControlRequests");
          return;
        }
      }
      
      //if SECURITY_LIMIT batches are handled in a single loop, then we pause for a moment
      this.dequeue(ASYNC_DEQUEUE,"limit");
    },
    
    /*private*/ selectAndSendBatch: function() {
      var c=0;
      while(c < this.reqQueues.length ) {
        
        //switch the flag to change turn
        this.typeFlag = this.typeFlag < this.reqQueues.length-1 ? this.typeFlag+1 : 0;
        
        if (this.reqQueues[this.typeFlag].getLength() > 0) {
          return this.sendBatch(this.reqQueues[this.typeFlag]);
        }
        c++;
      }
      return null;
    },
    
    /*private*/ sendBatch: function(queueToSend) {
      (function(){
          /* check that there is no duplicated message request */
          if (queueToSend.batchType == ControlRequest.MESSAGE) {
              for (var i = 0, ilen = queueToSend.queue.length; i < ilen; i++) {
                  var request = queueToSend.queue[i];
                  var seq = request["LS_sequence"];
                  var prog = request["LS_msg_prog"];
                  if (seq != null && prog != null) {
                      for (var j = i + 1, jlen = queueToSend.queue.length; j < jlen; j++) {
                          var currentReq = queueToSend.queue[j];
                          var currentSeq = currentReq["LS_sequence"];
                          var currentProg = currentReq["LS_msg_prog"];
                          if (seq == currentSeq && prog == currentProg) {
                              if (requestsLogger.isDebugLogEnabled()) {
                                  requestsLogger.logErrorExc(new Error("backtrace"),
                                          "Duplicated message",
                                          "seq=", seq, "prog=", prog, "ptr=", request === currentReq);
                              }
                              requestsLogger.logError("Duplicated message", "seq=", seq, "prog=", prog);
                          }
                      }
                  }
              }
          }
      }());
      
      var serverToUse = this._owner.getPushServerAddress();
      var mainRequest = firstRequestToRequest(queueToSend,serverToUse,this.policyBean.isCookieHandlingRequired(),this.policyBean.extractHttpExtraHeaders(false));

      //mainRequest is now like http://www.myserver.com/lightstreamer
      if (mainRequest == null) {
        requestsLogger.logDebug("Empty batch, exit");
        return REQ_EMPTY;
      }
      
      requestsLogger.logDebug("Ready to send batch, choosing connection");
      
      var sent = false;
      
//////////////////////////////WS CASE      
      
      if (this.wsConn) {
        requestsLogger.logDebug("WebSocket should be available, try to send through it");
        
        var controlRequest = this.customizeRequest(queueToSend,this.wsConn);
        if(controlRequest == null) {
          requestsLogger.logDebug("Empty request was generated, exit");
          return REQ_EMPTY;
        }
        
        mainRequest.setFile(controlRequest.getFile());
        mainRequest.setData(controlRequest.getData());
        
        sent = this.wsConn._send(mainRequest);
        
        if (sent === false) {
          this.wsConn = null;
        } else if (sent === null) {
          //with the early open of WebSocket this may happen
          return SEND_LATER;
   
        } else { //sent == true
          //we've done our job :)
          
          return SENT_WS;
        }
        
      } 
      
//////////////////////////////HTTP CASE      
      if (this.conn) {
        if (!this.connectionList.isGood(serverToUse,
              this.conn.constr,
              mainRequest.isCrossSite(),
              this.policyBean.isCookieHandlingRequired(),
              mainRequest.isCrossProtocol(),
              this.policyBean.hasHttpExtraHeaders(false))) {
          this.connectionList._reset();
          this.conn = null;
        }
      }
      
      
      
      var done = false;
      while ((this.conn || this.connectionList.hasNext()) && done === false) {
      
        if (!this.conn) {
          var classTU = this.connectionList.getNext(serverToUse,
              mainRequest.isCrossSite(),
              this.policyBean.isCookieHandlingRequired(),
              mainRequest.isCrossProtocol(),
              this.policyBean.hasHttpExtraHeaders(false));
          
          if (!classTU) {
          //>>excludeStart("debugExclude", pragmas.debugExclude);  
//            ASSERT.fail(); //no reason to be here, we have a session id so there should be at least one working connection
          //>>excludeEnd("debugExclude");  
            requestsLogger.logWarn("Unable to find a connection for control requests, will try again later",this.conn);
            
            //no solutions, exit
            this.connectionList._reset();
            
            return NO_CONN;
          }
          
          this.conn = new classTU("LS6__CONTROLFRAME");
          requestsLogger.logDebug("Connection for control batch chosen",this.conn);
        }      
        
        var controlRequest = this.customizeRequest(queueToSend,this.conn);
        if(controlRequest == null) {
          requestsLogger.logDebug("Empty request for HTTP was generated, exit");
          return REQ_EMPTY;
        }
        
        mainRequest.setFile(controlRequest.getFile());
        mainRequest.setData(controlRequest.getData());
        mainRequest.setMethod(controlRequest.getMethod());
        
        this.lastBatch.setPhase(this.statusPhase);
        this.conn._close();


//>>excludeStart("debugExclude", pragmas.debugExclude);
        if (this.fakeSyncError) {
          mainRequest._data = mainRequest._data.replace(/LS_session=.*&/g,"LS_session=FAKE&");
        }
//>>excludeEnd("debugExclude");



        sent = this.conn._load(mainRequest, this.lastBatch.getPhase(), Executor.packTask(this.onReadyForNextRequest,this), Executor.packTask(this.onErrorEvent,this));
        
        if (sent === false) {
          requestsLogger.logDebug("Connection failed, will try a different connection");
          this.conn = null;
          
        } else if (sent === null) {
          requestsLogger.logDebug("Connection temporarily unavailable, will try later");
          //wait and try again
          return SEND_LATER;
          
        } else { //sent === true
          //requests sent, notify the owners
          this.connectionList._reset();
          return SENT_HTTP;
        }
        
      }
      
//////////////////////////////???? CASE 
      
      if (sent === false) {
        //all my connections failed :(
        return NO_CONN;
      } else {
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        ASSERT.fail();
      //>>excludeEnd("debugExclude");
        requestsLogger.logError("Unexpected sending outcome");
      }
      
      return NO_CONN;
      
    },

    
    /**
     * Fill attribute lastBatch with requests from the same queue until the queue is empty or the request limit is reached.
     * @private
     */
    customizeRequest: function(queueToSend,connToUse) {
      var encoder = connToUse.getEncoder();
      
      //compose
      //run this once; if the while is performed more times we will not recalculate the overhead, if the request is too big 
      //the server will ignore it and the client will recompose with the new connection. It should be a very rare case,
      //especially now as the FormConnection is much more difficult to reach and is the only one with a different overhead calculation
      if (this.lastBatch == null) {      
        
        this.lastBatch = new LastBatch();
        this.lastBatch.setEncoder(encoder);
        this.lastBatch.fill(queueToSend,this.requestLimit,this._owner.getSessionId(),this.policyBean.isCookieHandlingRequired(),this.policyBean.extractHttpExtraHeaders(false));
        
      } else if (this.lastBatch.needsNewEncode(encoder)) {

        this.lastBatch.setEncoder(encoder);
        var overflow = this.lastBatch.refill(this.requestLimit,this._owner.getSessionId(),this.policyBean.isCookieHandlingRequired(),this.policyBean.extractHttpExtraHeaders(false));
        
        if (overflow) {
          var batchType = overflow.getBatchType();
          //TODO I NEED A TEST TO PASS FROM HERE!
          
          while(overflow.getLength() > 0) {
            this.addToProperBatch(batchType,overflow.shift());
          }
        }
        
        
      }
      
      if (this.lastBatch.isEmpty()) {
        this.lastBatch = null;
        return null;
      }
      return this.lastBatch.getRequest();
     
    },
    
    /**
     * HTTP case only
     */
    /*private*/ onReadyForNextRequest: function(_responseText,sentPhase) {
      if (!this.lastBatch || sentPhase !=  this.lastBatch.getPhase()) {
        //a reset occurred, we don't care about this response
        //flex client has a call to asynchDequeueControlRequests here
        return;
      }
      
      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("Control request got answer", sentPhase, _responseText);          
      }
      requestsLogger.logInfo("Control request got answer",sentPhase);
      this.changeStatus(_IDLE, "onReadyForNextRequest");

      var realType = this.lastBatch.firstRequest().getType();
      this.lastBatch = null;

      this._owner.enqueueControlResponse(_responseText);
      //check if there are other requests
      this.dequeue(ASYNC_DEQUEUE,"ready4next");
    },
    
    /**
     * HTTP case only
     */
    /*private*/ onErrorEvent: function(exc,sentPhase) {
      if (!this.lastBatch || sentPhase != this.lastBatch.getPhase()) {
        //a reset occurred, we don't care about this response 
        return;
      }
      requestsLogger.logInfo("Error from network",this,exc);
   
      //what should I do in this case? Should I resend the last request or is it better if I
      //wait for the owners to re-enqueue their requests?
      //I decided to go the safe way by not resending the same request. If important the client will ask
      //to send the request again
      
      this.changeStatus(_IDLE, "onErrorEvent");
      this.lastBatch = null;
      //check if there are other requests already in queue
      this.dequeue(ASYNC_DEQUEUE,"error"); 
    },
    
    /**
     * Associates the LS_reqId of the request with its listener.
     */
    addRequestListener: function(request, requestListener) {
        var reqId = request['LS_reqId'];
        if (reqId != null && requestListener != null) {
            this.requestListenerMap[reqId] = requestListener;
        }
    },
    
    /**
     * Gets and removes from the listener map the listener having the given LS_reqId.
     */
    getAndRemoveRequestListener: function(reqId) {
        var requestListener = this.requestListenerMap[reqId];
        delete this.requestListenerMap[reqId];
        return requestListener;
    }
    
  };
  
  
  var LastBatch = function() {
    this.batch = null;
    this.encoder = null;
    this.request = null; 
    this.phase = null;
  };
  
  LastBatch.prototype = {
      toString: function() {
        return this.batch ? this.batch.toString() : null;
      },
      
      getBatchType: function() {
        return this.batch ? this.batch.getBatchType() : null;
      },
      
      firstRequest: function() {
        return this.batch ? this.batch.firstRequest() : null;
      },
      
      getLength: function() {
        return this.batch ? this.batch.getLength() : 0;
      },
      
      shift: function() {
        return this.batch ? this.batch.shift() : null;
      },
      
      getRequest: function() {
        return this.request;
      },
      
      needsNewEncode: function(encoder) {
        return encoder != this.encoder;
      },
      
      setEncoder: function(encoder) {
        this.encoder = encoder;
      }, 
      
      fill: function(queue,lengthLimit,sessionId,cookieHandlingRequired,extraHeaders) {
        if (queue.getLength() <= 0) {
          return;
        }
        
        this.batch = new ControlRequestBatch(queue.getBatchType());
        this.request = this.encoder.initRequest(queue,cookieHandlingRequired,extraHeaders); //sets file and method, not server
        
        //NOTE we always queue the first request
        var requestData = "";
        var nextEncodedReq = this.encoder.encode(queue,sessionId,true);
        if (nextEncodedReq === null) {
          //nothing to send
          this.batch = null;
          this.request = null;
          return;
        }

        var expectedFinalLength = this.encoder.getFixedOverhead(this.request.getFile());
        var nextExpectedLength = this.encoder.getInvisibleOverhead(nextEncodedReq) + nextEncodedReq.length;
        
        if (lengthLimit > 0 && (nextExpectedLength+expectedFinalLength) > lengthLimit) {
          requestsLogger.logWarn("A single request size exceeds the <request_limit> configuration setting for the Server. Trying to send it anyway although it will be refused",requestData);
        }
        
        
        do {
          requestData+=nextEncodedReq;
          this.batch.addRequestToBatch(queue.shift());
          expectedFinalLength +=  nextExpectedLength; 
          
          if (queue.getLength() > 0) {
            nextEncodedReq = this.encoder.encode(queue,sessionId);
            if (nextEncodedReq) {
              nextExpectedLength = this.encoder.getInvisibleOverhead(nextEncodedReq) + nextEncodedReq.length;
            }
          }
        } while (nextEncodedReq && (lengthLimit == 0 || expectedFinalLength + nextExpectedLength < lengthLimit) && queue.getLength() > 0);
        
        this.request.setData(this.encoder.wrapUp(requestData));
        
      },
      
      refill: function(lengthLimit,sessionId,cookieHandlingRequired,extraHeaders) {
        var dismissing = this.batch;
        this.batch = null;
        this.fill(dismissing,lengthLimit,sessionId,cookieHandlingRequired,extraHeaders);
        if (dismissing.getLength() > 0) {
          return dismissing;
        }
        return null;
      },
      
      getPhase: function() {
        return this.phase;
      },
      
      setPhase: function(ph) {
        this.phase = ph;
      },
      
      isEmpty: function() {
        return this.getLength() <= 0;
      }, 
      
      notifySenders: function(failed) {
        var i = 0;
        var sentReq = null;
        while(sentReq = this.batch.getRequestObject(i)) {
          var bridge = sentReq.getBridge();
          if (bridge) {
            Executor.addTimedTask(bridge.notifySender,0,bridge,[failed]);
          }
          i++;
        }
      }
      
      
  };
  
  export default ControlConnectionHandler;


