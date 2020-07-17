import Inheritance from "../../src-tool/Inheritance";
import MpnRequest from "./MpnRequest";
import CtrlRequest from '../utils/CtrlRequest';

    /**
     * An MPN request to delete a subscription.
     */
    var MpnUnsubscribeRequest = function(deviceId, /*MpnSubscription*/ sub) {
        this._callSuperConstructor(MpnUnsubscribeRequest);
        this.type = CtrlRequest.MPN_UNSUB;
        this.subscriptionId = sub.getSubscriptionId();
        this.addParam('LS_op', 'deactivate');
        this.addParam('PN_deviceId', deviceId);
        this.addParam('PN_subscriptionId', this.subscriptionId);
    };
    
    MpnUnsubscribeRequest.prototype.toString = function() {
        return CtrlRequest.toString(this.query);
    };
    
    Inheritance(MpnUnsubscribeRequest, MpnRequest);
    export default MpnUnsubscribeRequest;


