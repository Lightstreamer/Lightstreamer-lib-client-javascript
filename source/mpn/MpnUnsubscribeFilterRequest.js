import Inheritance from "../../src-tool/Inheritance";
import MpnRequest from "./MpnRequest";
import CtrlRequest from '../utils/CtrlRequest';

    var MpnUnsubscribeFilterRequest = function(deviceId, filter) {
        this._callSuperConstructor(MpnUnsubscribeFilterRequest);
        this.type = CtrlRequest.MPN_UNSUB_FILTER;
        //assert filter == "ALL" || filter == "ACTIVE" || filter == "TRIGGERED"
        this.addParam('LS_op', 'deactivate');
        this.addParam('PN_deviceId', deviceId);
        if (filter != "ALL") {            
            this.addParam('PN_subscriptionStatus', filter);
        }
    };
    
    MpnUnsubscribeFilterRequest.prototype.toString = function() {
        return CtrlRequest.toString(this.query);
    };
    
    Inheritance(MpnUnsubscribeFilterRequest, MpnRequest);
    export default MpnUnsubscribeFilterRequest;

