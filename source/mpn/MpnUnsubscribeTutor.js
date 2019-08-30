import Inheritance from "../../src-tool/Inheritance";
import MpnTutor from "./MpnTutor";

    /**
     * Tutor of MPN unsubscription requests.
     */
    var MpnUnsubscribeTutor = function(timeoutMs, /*MpnSubscription*/ sub, mpnManager, tutorContext) {
        this._callSuperConstructor(MpnUnsubscribeTutor, [timeoutMs, tutorContext, mpnManager]);
        this.subscription = sub;
    };
    
    MpnUnsubscribeTutor.prototype = {
            
            doRecovery: function() {
                this.mpnManager.requestManager.sendUnsubscribeRequest(this.timeoutMs, this.subscription);
            }
    };
    
    Inheritance(MpnUnsubscribeTutor,MpnTutor);
    export default MpnUnsubscribeTutor;

