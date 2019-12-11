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

