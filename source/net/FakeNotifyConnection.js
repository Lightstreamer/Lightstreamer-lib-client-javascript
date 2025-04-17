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
import ServerConnection from "./ServerConnection";
import Inheritance from "../../src-tool/Inheritance";
import Executor from "../../src-tool/Executor";
  
  var FakeNotifyConnection = function() {
    this._callSuperConstructor(FakeNotifyConnection);
  };
  
  //this is an abstract class
  ServerConnection.attachPublicStaticMethods(FakeNotifyConnection,{
    isAvailable: false,
    isCrossSite: false,
    isCrossProtocol: false,
    areCookiesGuaranteed: false,
    attachEngineId: false,
    canUseCustomHeaders: false
  });
  
  FakeNotifyConnection.prototype = {
    
    _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      if (responseCallback) {
        Executor.addTimedTask(this.notifySender,1000,this,[responseCallback,phase]);
     }
      return true;
    },
    
    notifySender: function(responseCallback,phase) {
      //we don't have responses from the form requests (but we could...)
      //so we wait a moment and then send an empty response
      
      Executor.executeTask(responseCallback,["",phase]);
      
      
      //we could notify the handler now, in any case there is a traffic light on the formhandler
      //that will avoid "too-close" requests (the problem here is to not saturate the connection pool
    }
    
  };
  
  
  Inheritance(FakeNotifyConnection, ServerConnection);
  
  export default FakeNotifyConnection;
  
