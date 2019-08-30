import Inheritance from "../../src-tool/Inheritance";
import MpnTutor from "./MpnTutor";

    /**
     * Tutor managing the deletion of the subscriptions satisfying the filter 
     * (see {@link LightstreamerClient#unsubscribeMpnSubscriptions(String)}).
     */
    var MpnUnsubscribeFilterTutor = function(timeoutMs, /*MpnUnsubscribeFilter*/ filter, mpnManager, tutorContext) {
        this._callSuperConstructor(MpnUnsubscribeFilterTutor, [timeoutMs, tutorContext, mpnManager]);
        this.filter = filter;
    };
    
    MpnUnsubscribeFilterTutor.prototype = {
            
            doRecovery: function() {
                this.mpnManager.requestManager.sendUnsubscribeFilteredRequest(this.timeoutMs, this.filter);
            },
            
            onResponse: function() {
                this._callSuperMethod(MpnUnsubscribeFilterTutor, "onResponse");
                this.mpnManager.requestManager.onUnsubscriptionFilterResponse(this.filter);
            }
    };
    
    Inheritance(MpnUnsubscribeFilterTutor,MpnTutor);
    export default MpnUnsubscribeFilterTutor;

