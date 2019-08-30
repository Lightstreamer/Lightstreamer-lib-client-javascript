import MpnTutorContext from "./MpnTutorContext";
import MpnRegisterTutor from "./MpnRegisterTutor";
import MpnRegisterRequest from "./MpnRegisterRequest";
import MpnSubscribeRequest from "./MpnSubscribeRequest";
import MpnSubscribeTutor from "./MpnSubscribeTutor";
import MpnUnsubscribeFilterRequest from "./MpnUnsubscribeFilterRequest";
import MpnUnsubscribeFilterTutor from "./MpnUnsubscribeFilterTutor";
import MpnUnsubscribeRequest from "./MpnUnsubscribeRequest";
import MpnUnsubscribeTutor from "./MpnUnsubscribeTutor";

    /**
     * API exposed to {@link MpnTutor}
     */
    var MpnRequestManager = function(mpnManager) {
        this.mpnManager = mpnManager;
        // the context shared by all the tutors belonging to the same session
        this.tutorContext = new MpnTutorContext();
    };
    
    MpnRequestManager.prototype = {
        
            /**
             * Dismisses the old context and creates a new one.
             */
            createTutorContext: function() {
                // dismiss the old context and create a new one
                this.tutorContext.dismissed = true;
                this.tutorContext = new MpnTutorContext();
            },
            
            /**
             * Sends a registration request.
             */
            sendRegisterRequest: function(timeoutMs) {
                var request = new MpnRegisterRequest(this.mpnManager.mpnDevice);
                var tutor = new MpnRegisterTutor(timeoutMs, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendRegisterForMpn(request, tutor);
                });
            },
            
            /**
             * Sends a subscription request.
             */
            sendSubscribeRequest: function(timeoutMs, ephemeralSubId, /*MpnSubscription*/ sub) {
                var request = new MpnSubscribeRequest(ephemeralSubId, this.mpnManager.mpnDevice.getDeviceId(), sub);
                var tutor = new MpnSubscribeTutor(timeoutMs, ephemeralSubId, sub, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendMpnSubscription(request, tutor);
                });
            },
            
            /**
             * Sends an unsubscription request.
             */
            sendUnsubscribeRequest: function(timeoutMs, /*MpnSubscription*/ sub) {
                var request = new MpnUnsubscribeRequest(this.mpnManager.mpnDevice.getDeviceId(), sub);
                var tutor = new MpnUnsubscribeTutor(timeoutMs, sub, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendMpnUnsubscription(request, tutor);
                });
            },
            
            /**
             * Sends a filtered unsubscription request.
             */
            sendUnsubscribeFilteredRequest: function(timeoutMs, /*MpnUnsubscribeFilter*/ unsubFilter) {
                var request = new MpnUnsubscribeFilterRequest(this.mpnManager.mpnDevice.getDeviceId(), unsubFilter.filter);
                var tutor = new MpnUnsubscribeFilterTutor(timeoutMs, unsubFilter, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendMpnFilteredUnsubscription(request, tutor);
                });
            },

            /**
             * Sends the requests on the waiting list.
             */
            sendWaitings: function() {
                /* send pending mpn subscriptions */
                this.mpnManager.subscribeManager.subscribeWaitings();
                /* send pending mpn unsubscriptions */
                this.mpnManager.unsubscribeManager.unsubscribeWaitings();
                this.mpnManager.unsubscribeFilterManager.unsubscribeWaitings();
            },
            
            /**
             * 
             * Fired when the message REQOK/REQERR is received as a response to a filtered unsubscription.
             */
            onUnsubscriptionFilterResponse: function(/*MpnUnsubscribeFilter*/ filter) {
                this.mpnManager.unsubscribeFilterManager.onUnsubscribeRepsone(filter);
            }
    };
    
    export default MpnRequestManager;

