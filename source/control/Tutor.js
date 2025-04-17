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
import Executor from "../../src-tool/Executor";

  var MIN_TIMEOUT = 4000;
  
  var Tutor = function(connOptions,currentTimeout) {
    this.discarded = false;
    this.connOptions = connOptions;
    this.timeoutMs = this.getFixedTimeout ? this.getFixedTimeout() : (currentTimeout ? currentTimeout*2 : MIN_TIMEOUT);
  };
  
  Tutor.prototype = {

    /*public*/ notifySender: function(failed) {
      if (failed) {
        this.doRecovery();
      } else {
        var timeoutToUse = this.timeoutMs+Number(this.connOptions.pollingInterval);
        Executor.addTimedTask(this.onTimeout,timeoutToUse,this);
      }
    },
    
    /*private*/ onTimeout: function() {
      if (!(this.discarded || this.verifySuccess())) {
        this.doRecovery();
      } 
    },
    
    discard: function() {
        this.discarded = true;
    }
    
    /*abstract function verifySuccess()*/
    /*abstract function doRecovery()*/ 
    /*abstract function notifyAborted()*/ //called if the request will be willingly not sent
    /*abstract OPTIONAL function getFixedTimeout()*/ //if available the method is used to obtain the timeout value
  };
  
  export default Tutor;

