import LoggerManager from "../../src-log/LoggerManager";
import ControlRequest from "./ControlRequest";
import ASSERT from "../../src-test/ASSERT";
import Constants from "../Constants";
  
  var requestsLogger = LoggerManager.getLoggerProxy(Constants.REQUESTS);
  
  function ControlRequestBatch(_batchType) {
    this.queue = [];
    this.keys = {};
    
    this.batchType = _batchType;
    this.messageNextKey = 0;
  }
  
  var CONSTRAINT_KEY = "C";
  var FORCE_REBIND_KEY = "F";
  var CHANGE_SUB_KEY = "X";
  var REVERSE_HB_KEY = "H";
  var MPN_KEY = "M";
  
  //ported from FLEX client
  ControlRequestBatch.prototype = {
    
    /*public*/ toString: function() {
      return ["[","ControlRequestBatch",this.batchType,this.queue.length,"]"].join("|");
    },
      
    /*private*/ addRequestInternal: function(tKey,request) {
      this.keys[tKey] = request;
      this.queue.push(tKey);
      
      (function(that) {
          /* check that there is no duplicated message request */
          if (that.batchType == ControlRequest.MESSAGE) {
              var seq = request["LS_sequence"];
              var prog = request["LS_msg_prog"];
              if (seq != null && prog != null) {
                  for (var i = 0, len = that.queue.length - 1 /* exclude last request */; i < len; i++) {
                      var currentReq = that.queue[i];
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
      }(this));
    },
    
    /*private*/ addUniqueRequestInternal: function(tKey,request) {
        /*
         * If a request with the same key is already present, substitute the request whit the new one.
         * Otherwise add the request.
         */
        if (this.keys[tKey]) {
            this.keys[tKey] = request;            
        } else {
            this.addRequestInternal(tKey, request);
        }
      },
    
    addRequestToBatch:function(request,preventOverride) {
      
      var requestType = request.getType();
      
      
      if (requestType == ControlRequest.MESSAGE || requestType == ControlRequest.LOG || requestType == ControlRequest.HEARTBEAT) {
        if (this.batchType != requestType) {
        //>>excludeStart("debugExclude", pragmas.debugExclude);  
          ASSERT.fail();
        //>>excludeEnd("debugExclude");
          requestsLogger.logError("Unexpected request type was given to this batch",this);
          //should I send an exception?
          return false;
        }
      //>>excludeEnd("debugExclude");
        if (requestType == ControlRequest.HEARTBEAT) {
            /* there is at most one heartbeat request in the batch */
            this.addUniqueRequestInternal(REVERSE_HB_KEY, request);
        } else {
            //I should only add to queue, the sendMessages and log messages are always sent to the server
            this.addRequestInternal(this.messageNextKey++,request);
        }
        
        return true;
      }
      
      if ( ! (this.batchType == ControlRequest.ADD || this.batchType == ControlRequest.MPN)) {//for ADD REMOVE DESTROY CONSTRAIN or MPN
      //>>excludeStart("debugExclude", pragmas.debugExclude);  
        ASSERT.fail();
      //>>excludeEnd("debugExclude");
        requestsLogger.logError("Unexpected request type was given to this batch; expecting ADD REMOVE DESTROY CONSTRAIN or MPN",this);
        //should I send an exception?
        return false;
      }
      
      var tKey;
      switch(requestType) {
        case ControlRequest.CONSTRAINT: tKey = CONSTRAINT_KEY;
          break;
        case ControlRequest.FORCE_REBIND: tKey = FORCE_REBIND_KEY;
          break;
        case ControlRequest.CHANGE_SUB: tKey = CHANGE_SUB_KEY+request.getKey();
          break;
        case ControlRequest.MPN: tKey = MPN_KEY+request.getKey();
          break;
        default: tKey = request.getKey();
          break;
      }
      
      var queuedRequest = this.keys[tKey];
      requestsLogger.logDebug("Storing request",this,tKey,request);
      
      if (queuedRequest) {
        
        //there is already a request for this key, handle it
        
        if (requestType == ControlRequest.CONSTRAINT 
                || requestType == ControlRequest.FORCE_REBIND
                || requestType == ControlRequest.MPN) {
          //each constraint/force_rebind/mpn_register request override the previous one, just substitute the request in the queue.
          if (!preventOverride) {
            requestsLogger.logDebug("Substituting CONSTRAINT/FORCE_REBIND/MPN request");
            this.substituteRequest(tKey,request);
          }
          return;
          
        } else if (requestType == ControlRequest.REMOVE) {
          
          if (queuedRequest.retryingOrHost) {
            requestsLogger.logDebug("Replacing 'second' ADD request with a REMOVE request for the same subscription");
            //if the ADD request that's in the queue was already sent and this is a new 
            //effort for the same ADD we send anyway the REMOVE
            //request as the other ADD request could be just very slow and not lost
            if (!preventOverride) {
              this.substituteRequest(tKey,request);
            }
            //another possibility is to remove such add, since if an update for a removed table
            //arrives a new delete request is sent
            
          } else if (queuedRequest.getType() == ControlRequest.REMOVE)  {
            requestsLogger.logDebug("REMOVE request already stored, skipping");
            //both new and queued request are REMOVE requests for the same table, 
            //this shouldn't happen btw if it happens we don't have anything to do, 
            //we just leave the request that's already on the queue
            
          } else {
            requestsLogger.logDebug("ADD request for the involved subscription was not yet sent; there is no need to send the related REMOVE request or the original ADD one, removing both");
            //if the old request was an ADD (sent for the first time) and the new one is a REMOVE, 
            //we don't need to send anything to the server, just delete the ADD
            //request and return
            
          //>>excludeStart("debugExclude", pragmas.debugExclude);  
            if (!ASSERT.verifyNotOk(preventOverride)) {
              requestsLogger.logError("ADD after REMOVE?",this);
            }
          //>>excludeEnd("debugExclude");
            if (!preventOverride) {
              this.removeRequestByKey(tKey);
            }
            
          }
          return;
        
        } else if (requestType == ControlRequest.DESTROY) {
          //we've already queued the DESTORY request for this session. 
          //Since Destroy are indexed by session id there can be a very unlucky case where 
          //two sessions from two different servers have the same id. So check for this case, you'll never know...
          
          while (queuedRequest && request.retryingOrHost != queuedRequest.retryingOrHost) {
            requestsLogger.logDebug("Same session id on different servers, store two different DESTROY requests");
            tKey += "_";
            queuedRequest = this.keys[tKey];
          }
          
          if (queuedRequest) {
            requestsLogger.logDebug("Verified duplicated DESTROY request, skipping");
            return;
          }
         
        } else { //if (requestType == ControlRequest.ADD || requestType == ControlRequest.CHANGE_SUB)
          //can never happen that an ADD request substitutes a REMOVE request for 2 reasons:
          //  *if those requests are part of the same session than to remove and re-add a table
          //   change its key.
          //  *if those requests are not part of the same session than during session change
          //   all pending request are removed.
          //so, all cases should pass from the if (requestType == ControlRequest.REMOVE) case
          if (!preventOverride) {
              requestsLogger.logDebug("Duplicated ADD or CHANGE_SUB request, substitute the old one with the new one");
            //by the way, if something terribly wrong happened, we have to do something...
            //let's try substituting
            //(for the RECONF case is perfectly ok to pass from here)
            this.substituteRequest(tKey,request);
          }
          return; 
        }
      } 
      
      requestsLogger.logDebug("Storing confirmed");
      this.addRequestInternal(tKey,request);

    },
    
    getLength: function() {
      return this.queue.length;
    },
    
    /*private*/ substituteRequest : function(tKey,newRequest) {
      this.keys[tKey] = newRequest;
    },
    
    /*private*/ removeRequestByIndex: function(_index) {
      if (this.queue.length <= _index) {
        requestsLogger.logError("Trying to remove by index non-existent request");
        return null;
      }
      var tKey = this.queue[_index];
      this.queue.splice(_index, 1);
      
      var req = this.keys[tKey];
      delete this.keys[tKey];
      
      return req;
      
    },
    
    /*private*/ removeRequestByKey: function(tKey) {
      if (!this.keys[tKey]) {
        requestsLogger.logError("Trying to remove by key non-existent request");
        return null;
      }
      
      for (var i = 0; i < this.queue.length; i++) {
        if (this.queue[i] == tKey) {
          return this.removeRequestByIndex(i);
        }
      }
      
    },
    
    
    /*public*/ shift: function() {
      return this.removeRequestByIndex(0);
    },
    
    /*public*/ pop: function() {
      return this.removeRequestByIndex(this.queue.length-1);
    },
    
    /*public*/ last: function() {
      return this.getRequestObject(this.queue.length-1);
    },
    
    /*public*/ firstRequest: function() {
      return this.getRequestObject(0);
    },
    
    /*public*/ getRequestObject: function(num) {
      if (this.queue.length <= 0) {
        return null;
      }
      var tKey = this.queue[num];
      return this.keys[tKey];
    },
    
    /*public*/ getBatchType: function() {
      return this.batchType;
    }
    
  };
  
  export default ControlRequestBatch;
  
