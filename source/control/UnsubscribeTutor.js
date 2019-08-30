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
  
