import Inheritance from "../../src-tool/Inheritance";
import MpnRequest from "./MpnRequest";

    var MpnUnsubscribeFilterRequest = function(deviceId, filter) {
        this._callSuperConstructor(MpnUnsubscribeFilterRequest);
        //assert filter == "ALL" || filter == "ACTIVE" || filter == "TRIGGERED"
        this.addParam('LS_op', 'deactivate');
        this.addParam('PN_deviceId', deviceId);
        if (filter != "ALL") {            
            this.addParam('PN_subscriptionStatus', filter);
        }
    };
    
    Inheritance(MpnUnsubscribeFilterRequest, MpnRequest);
    export default MpnUnsubscribeFilterRequest;

