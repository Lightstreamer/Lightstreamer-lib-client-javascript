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
import RequestsHelper from "./engine/RequestsHelper";
import IEXSXHRConnection from "./net/IEXSXHRConnection";
import ConnectionSelector from "./net/ConnectionSelector";
  
  RequestsHelper.getCreateSessionExtraPath = function() {
    return "dashboard/";
  };
  
  //remove the IEXSXHRConnection from the POLL_LIST in the dashboard case: 
  // * XDomainRequest (the class wrapped in IEXSXHRConnection) does not support the basic authentication
  // * Only create_session requests need the basic authentication support
  // * POLL_LIST is used for create_session requests
  // * POLL_LIST is not used for streaming bind_session requests or for control requests 
  //    (respectively STREAMING_LIST and CONTROL_LIST are used in such cases)
  for (var i=0; i<ConnectionSelector.POLL_LIST.length; i++) { //TODO I may want to separate the POLL_LIST and create CREATE_LIST in the future
    if (ConnectionSelector.POLL_LIST[i] === IEXSXHRConnection) {
      ConnectionSelector.POLL_LIST.splice(i,1);
      break;
    }
  }
  
  export default RequestsHelper;
  

