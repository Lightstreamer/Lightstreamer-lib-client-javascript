import Inheritance from "../../src-tool/Inheritance";
import MpnTutor from "./MpnTutor";

    /**
     * Tutor of MPN subscription requests.
     */
    var MpnSubscribeTutor = function(timeoutMs, ephemeralSubId, /*MpnSubscription*/ sub, mpnManager, tutorContext) {
        this._callSuperConstructor(MpnSubscribeTutor, [timeoutMs, tutorContext, mpnManager]);
        this.ephemeralSubId = ephemeralSubId;
        this.subscription = sub;
    };
    
    MpnSubscribeTutor.prototype = {
      
            doRecovery: function() {
                this.mpnManager.requestManager.sendSubscribeRequest(this.timeoutMs, this.ephemeralSubId, this.subscription);
            }
    };
    
    Inheritance(MpnSubscribeTutor,MpnTutor);
    export default MpnSubscribeTutor;

