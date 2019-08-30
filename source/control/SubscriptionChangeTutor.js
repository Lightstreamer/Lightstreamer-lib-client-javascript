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
  
