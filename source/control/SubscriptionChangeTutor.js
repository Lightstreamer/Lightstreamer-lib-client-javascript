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
import Inheritance from "../../src-tool/Inheritance";
import Tutor from "./Tutor";
import Assertions from "../utils/Assertions";
  
  var SubscriptionChangeTutor = function(connOptions,tableNum,ph,owner,changingParams,effort,currentTimeout) {
    this._callSuperConstructor(SubscriptionChangeTutor,[connOptions,currentTimeout]);
    
    this.tableNum = tableNum;
    this.ph = ph;
    this.owner = owner;
    this.changingParams = changingParams;
    this.effort = effort;
    
  };
  
  SubscriptionChangeTutor.prototype = {
      verifySuccess: function () {
        return !this.owner.isWaitingSubscriptionReconfNotification(this.tableNum,this.ph);
      },
      
      doRecovery: function () {
        this.owner.sendUpdateSubscriptionParams(this.tableNum,this.ph,this.changingParams,this.effort+1,this.timeoutMs);
      },
      
      notifyAborted: function() {
        // possible if the subscription is closed?
      }
  };
  
  
  Inheritance(SubscriptionChangeTutor,Tutor);
  export default SubscriptionChangeTutor;
  
