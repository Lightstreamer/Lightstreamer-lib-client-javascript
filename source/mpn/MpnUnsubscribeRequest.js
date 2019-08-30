import Inheritance from "../../src-tool/Inheritance";
import MpnRequest from "./MpnRequest";

    /**
     * An MPN request to delete a subscription.
     */
    var MpnUnsubscribeRequest = function(deviceId, /*MpnSubscription*/ sub) {
        this._callSuperConstructor(MpnUnsubscribeRequest);
        this.subscriptionId = sub.getSubscriptionId();
        this.addParam('LS_op', 'deactivate');
        this.addParam('PN_deviceId', deviceId);
        this.addParam('PN_subscriptionId', this.subscriptionId);
    };
    
    Inheritance(MpnUnsubscribeRequest, MpnRequest);
    export default MpnUnsubscribeRequest;


