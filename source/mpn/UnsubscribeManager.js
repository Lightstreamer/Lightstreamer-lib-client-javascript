import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
import MpnUtils from "./MpnUtils";
import Assertions from "../utils/Assertions";
    
    var log = LoggerManager.getLoggerProxy(Constants.MPN);

    /**
     * Manages the life cycle of the unsubscription requests.
     * <p>
     * An unsubscription can be in the following states:
     * <ul>
     * <li><b>waiting</b>: the unsubscription is waiting for the device to register. 
     * After that the unsubscription becomes pending and the corresponding request is sent.</li>
     * <li><b>pending</b>: the corresponding request has been sent but no response has been received yet.</li>
     * </ul>
     */
    var UnsubscribeManager = function(mpnManager) {
        this.mpnManager = mpnManager;
        /**
         * Maps the mpnSubId (i.e. the values of the second argument of the message MPNOK)
         * with the corresponding unsubscription objects.
         * <p>
         * The state of the contained objects is <b>pending</b>.
         */
        /*Map<String, MpnSubscription>*/ this.pendings = new MpnUtils.MyMap();
        /**
         * The state of the contained objects is <b>waiting</b>.
         */
        /*List<MpnSubscription>*/ this.waitings = new MpnUtils.MyList();
    };
    
    UnsubscribeManager.prototype = {
      
            /**
             * Resets the internal data structures to start a new registration.
             */
            reset: function() {
                this.pendings.clear();
                this.waitings.clear();
            },
            
            /**
             * Adds the unsubscription to the waiting list.
             */
            addWaiting: function(/*MpnSubscription*/ sub) {
                this.waitings.add(sub);
            },
            
            /**
             * Unsubscribes the objects on the waiting list, which are put in the pending list.
             */
            unsubscribeWaitings: function() {
                for (var i = 0, len = this.waitings.size(); i < len; i++) {
                    var sub = this.waitings.get(i);
                    this.unsubscribe(sub);
                }
                this.waitings.clear();
            },
            
            /**
             * Tries to unsubscribe the object, which is put in the pending list.
             */
            unsubscribe: function(/*MpnSubscription*/ sub) {
                var subId = sub.getSubscriptionId();
                Assertions.assert(subId != null);
                Assertions.assert(! this.pendings.containsKey(subId));
                this.pendings.put(subId, sub);
                this.mpnManager.requestManager.sendUnsubscribeRequest(0, sub);
            },
            
            /**
             * Fired when the message MPNDEL is received.
             * The unsubscription is removed from the pending list.
             */
            onUnsubscribeOK: function(subId) {
                this.pendings.remove(subId);
                // when the unsubscription is made using a filter, there is no pending unsubscription.
                // so subIb may not be in pendings.
            },
            
            /**
             * Fired when a REQERR is received as a response of an unsubscription request.
             */
            onUnsubscribeError: function(subId, code, message) {
                var /*MpnSubscription*/ sub = this.pendings.remove(subId);
                if (sub == null) {
                    log.warn("Discarded unexpected unsubscription error subId=" + subId);
                    return;
                }
                this.mpnManager.subscribeManager.onUnsubscribeError(subId, code, message);
            },
            
            /**
             * Fired when the current session is closed.
             * The pending unsubscriptions are marked as waiting so they will be sent when a new session
             * becomes available.
             * 
             * @param recovery if the flag is true, the closing is due to an automatic recovery.
             * Otherwise the closing is due to a disconnection made by the user
             * (see {@link LightstreamerClient#disconnect()}).
             */
            onSessionClose: function(recovery) {
                if (recovery) {
                    this.waitings.addAll(this.pendings.values());
                    this.pendings.clear();
                    
                } else {
                    this.waitings.clear();
                    this.pendings.clear();
                }
            }
    };
    
    export default UnsubscribeManager;

