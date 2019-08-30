import Inheritance from "../../src-tool/Inheritance";
import Tutor from "./Tutor";

  var ForceRebindTutor = function(_cause,session,_phase,connOptions) {
    
    this._callSuperConstructor(ForceRebindTutor,[connOptions]);
    
    this._cause = _cause;
    this._phase = _phase;
    this.session = session;
  };
  
  ForceRebindTutor.prototype = {

    verifySuccess: function() {
      //if push_pase is changed we've already received a loop so that our request is successful
      return !this.session.checkSessionPhase(this._phase);
    },
    
    doRecovery: function() {
      //let's try again
      this.session.forceRebind(this._cause);
    },
    
    getFixedTimeout: function() {
      return this.connOptions.forceBindTimeout;
    },
    
    notifyAborted: function() {
      //nothing to do
    }
    
  };
  
  Inheritance(ForceRebindTutor,Tutor);
  export default ForceRebindTutor;

