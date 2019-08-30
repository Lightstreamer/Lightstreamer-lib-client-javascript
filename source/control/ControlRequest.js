//we may make this an extension of request?

import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
    
  var requestsLogger = LoggerManager.getLoggerProxy(Constants.REQUESTS);

  function ControlRequest(request,related,_type,relatedKey,retryingOrHost) {
    this.request = request;
    this.related = related;
    this.relatedKey = relatedKey;
    this._type = _type;
    this.retryingOrHost = retryingOrHost;
  }

  ControlRequest.ADD = 1;
  ControlRequest.REMOVE = 2;
  ControlRequest.CONSTRAINT = 3;
  ControlRequest.MESSAGE = 4;
  ControlRequest.LOG = 5;
  ControlRequest.DESTROY = 6;
  ControlRequest.FORCE_REBIND = 7;
  ControlRequest.HEARTBEAT = 8;  
  ControlRequest.CHANGE_SUB = 9;
  ControlRequest.MPN = 10;


  ControlRequest.prototype = {
    toString: function() {
      var req = (requestsLogger.isDebugLogEnabled() ? JSON.stringify(this.request) : this.request);
      return ["[","ControlRequest",this.relatedKey,this._type,this.retryingOrHost,req,"]"].join("|");
    },
    
    getBridge: function() {
      return this.related;
    },
    
    getKey: function() {
      return this.relatedKey;
    },
    
    getType: function() {
      return this._type;
    },
    
    getRequest: function() {
      return this.request;
    }
    
   
  };
  
  export default ControlRequest;
  
