/*
 * Copyright (C) 2012 Lightstreamer Srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
  
