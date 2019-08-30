import Inheritance from "../../src-tool/Inheritance";
import MpnTutor from "./MpnTutor";

    /**
     * Tutor of MPN registration requests.
     */
    var MpnRegisterTutor = function(timeoutMs, mpnManager, tutorContext) {
        this._callSuperConstructor(MpnRegisterTutor, [timeoutMs, tutorContext, mpnManager]);
    };

    MpnRegisterTutor.prototype = {
            
            doRecovery: function() {
                this.mpnManager.requestManager.sendRegisterRequest(this.timeoutMs);
            }
    };

    Inheritance(MpnRegisterTutor,MpnTutor);
    export default MpnRegisterTutor;
