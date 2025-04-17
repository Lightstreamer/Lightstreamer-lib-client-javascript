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

  var notifySenderName;
  for(var i in  {notifySender:true}) {
    notifySenderName=i;
  }

  var SubscribeTutor = function(connOptions,tableNum,owner,effort,currentTimeout) {
    this._callSuperConstructor(SubscribeTutor,[connOptions,currentTimeout]);
    
    this.tableNum = tableNum;
    this.owner = owner;
    this.effort = effort;
    
  };

  SubscribeTutor.prototype = {
      verifySuccess: function () {
        return !this.owner.isWaitingSubscription(this.tableNum);
      },
      
      doRecovery: function () {
        this.owner.subscribeTable(this.tableNum,this.effort+1,this.timeoutMs);
      },

      notifySender: function(failed) {
        if (!failed) {
          this.owner.subscriptionSent(this.tableNum);
        }
        this._callSuperMethod(SubscribeTutor,notifySenderName,arguments);
      },
      
      notifyAborted: function() {
        // we don't have anything to do, it means that a
        //delete was queued before the add was sent
        //so the subscription should not exists anymore
      }
  };
  
  
  Inheritance(SubscribeTutor,Tutor);
  export default SubscribeTutor;
  
