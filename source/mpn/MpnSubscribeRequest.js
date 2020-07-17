import Inheritance from "../../src-tool/Inheritance";
import MpnRequest from "./MpnRequest";
import CtrlRequest from '../utils/CtrlRequest';

    /**
     * An MPN subscription request.
     * <br>
     * If a PN_subscriptionId is present, the request is meant to modify the setting of the corresponding subscription.
     * <br>
     * If a PN_coalescing is present, the request is meant to modify the setting of the subscription having similar
     * setting (typically the same adapter and items). If there is no such subscription, a new one is created.
     */
    var MpnSubscribeRequest = function(subId, deviceId, /*MpnSubscription*/ sub) {
        this._callSuperConstructor(MpnSubscribeRequest);
        this.type = CtrlRequest.MPN_SUB;
        this.subscriptionId = subId;
        this.addParam('LS_subId', subId);
        this.addParam('LS_op', 'activate');
        this.addParam('LS_group', sub.items);
        this.addParam('LS_schema', sub.fields);
        this.addParam('LS_mode', sub.getMode());
        this.addParam('PN_deviceId', deviceId);
        if (sub.getDataAdapter() != null) {
            this.addParam('LS_data_adapter', sub.getDataAdapter());
        }
        if (sub.getSubscriptionId() != null) {
            // a request to the server to modify the subscription having the specified id
            this.addParam('PN_subscriptionId', sub.getSubscriptionId());
        }
        if (sub.getNotificationFormat() != null) {
            this.addParam('PN_notificationFormat', sub.getNotificationFormat());
        }
        if (sub.getTriggerExpression() != null) {
            this.addParam('PN_trigger', sub.getTriggerExpression());
        }
        if (sub.coalescing) {
            this.addParam('PN_coalescing', 'true');
        }
        if (sub.getRequestedBufferSize() != null) {
            this.addParam('LS_requested_buffer_size', sub.getRequestedBufferSize());
        }
        if (sub.getRequestedMaxFrequency() != null) {
            this.addParam('LS_requested_max_frequency', sub.getRequestedMaxFrequency());
        }
    };
    
    MpnSubscribeRequest.prototype.toString = function() {
        return CtrlRequest.toString(this.query);
    };
    
    Inheritance(MpnSubscribeRequest, MpnRequest);
    export default MpnSubscribeRequest;

