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
  
