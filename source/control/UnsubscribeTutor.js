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
  
  var UnsubscribeTutor = function(connOptions,tableNum,owner,effort,currentTimeout) {
    this._callSuperConstructor(UnsubscribeTutor,[connOptions,currentTimeout]);
    
    this.tableNum = tableNum;
    this.owner = owner;
    this.effort = effort;
    
  };

  UnsubscribeTutor.prototype = {
      verifySuccess: function () {
        return !this.owner.isWaitingUnsubscription(this.tableNum);
      },

      doRecovery: function () {
        this.owner.unsubscribeTable(this.tableNum,this.effort+1,this.timeoutMs);
      },
      
      notifyAborted: function() {
        //it means that a
        //sent was not actually sent
        this.owner.onUnsubscription(this.tableNum);
      }
  };
  
  
  Inheritance(UnsubscribeTutor,Tutor);
  export default UnsubscribeTutor;
  
