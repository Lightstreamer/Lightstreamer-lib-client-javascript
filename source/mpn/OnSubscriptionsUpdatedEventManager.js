import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
import MpnUtils from "./MpnUtils";
    
    var logOnSubUpd = LoggerManager.getLoggerProxy(Constants.MPN);

    /**
     * Manager of {@link MpnDeviceListener#onSubscriptionsUpdated} event.
     * <p>
     * The event is fired when:
     * <ul>
     * <li>MPNOK message is received</li>
     * <li>the MPN internal adapter adds/deletes a subscription</li>
     * <li>the MPN internal adapter sends the end-of-snapshot message (*)</li>
     * <li>the session is closed</li>
     * </ul>
     * 
     * (*) When the end-of-snapshot arrives, the event onSubscriptionsUpdated is not fired immediately
     * but only when all the subscriptions in the snapshot have received the first update.
     * So the user can see the subscriptions in the snapshot all at once.
     * <p>
     * <b>State diagram of the manager:</b>
     * <div>
     * <img src="{@docRoot}/../docs/mpn/onSubscriptionsUpdated.png">
     * </div>
     */
    var OnSubscriptionsUpdatedEventManager = function(mpnManager) {
        this.mpnManager = mpnManager;
        this.state = INIT;
        /**
         * SubIds of the subscriptions in the snapshot sent by the MPN internal adapter SUBS-.
         */
        /*Set<String>*/ this.expectedSubIds = new MpnUtils.MySet();
    };
    
    OnSubscriptionsUpdatedEventManager.prototype = {
            
            reset: function() {
                this.next(INIT, "reset");
                this.expectedSubIds.clear();            
            },
            
            /**
             * Must be called when a server subscription is published by the MPN internal adapter.
             */
            onNewServerSubscription: function(subId) {
                if (logOnSubUpd.isDebugLogEnabled()) {
                    logOnSubUpd.debug("Server subscription added subId=" + subId);
                }
                switch (this.state) {
                case INIT:
                    this.expectedSubIds.add(subId);
                    this.next(NOT_EMPTY, "ADD");
                    break;
                    
                case NOT_EMPTY:
                    this.expectedSubIds.add(subId);
                    break;
                    
                case EOS:
                case DONE:
                    // ignore
                    break;
                    
                default:
                    this.throwError("onNewServerSubscription (subId=" + subId + ")");
                }
            },
            
            /**
             * Must be called when the MPN internal adapter sends the end-of-snapshot message.
             */
            onEndOfSnapshot: function() {
                switch (this.state) {
                case INIT:
                    this.fireOnSubscriptionsUpdated("empty EOS");
                    this.next(DONE, "EOS");
                    break;
                    
                case NOT_EMPTY:
                    if (this.expectedSubIds.isEmpty()) {
                        this.next(EOS, "EOS");
                        this.onEmpty();
                    } else {                    
                        this.next(EOS, "EOS");
                    }
                    break;
                    
                default:
                    this.throwError("onEndOfSnapshot");
                }
            },
      
            /**
             * Must be called when a server subscription is put in the subscription list
             * (i.e. when it receives the first update).
             * <br>
             * The method fires {@link MpnDeviceListener#onSubscriptionsUpdated} when:
             * <ol>
             * <li>ALL the subscriptions in the snapshot are in the subscription list, or</li>
             * <li>a subscription NOT in the snapshot is added to the subscription list</li>
             * </ol>
             */
            onSeverSubscriptionOK: function(subId) {
                if (logOnSubUpd.isDebugLogEnabled()) {
                    logOnSubUpd.debug("Server subscription subscribed subId=" + subId);
                }
                switch (this.state) {
                
                case NOT_EMPTY:
                    this.expectedSubIds.remove(subId);
                    break;
                    
                case EOS:
                    this.expectedSubIds.remove(subId);
                    if (this.expectedSubIds.isEmpty()) {
                        this.onEmpty();
                    } else {
                        // stay here
                    }
                    break;
                    
                case DONE:
                    this.fireOnSubscriptionsUpdated("UPD");
                    break;
                    
                default:
                    this.throwError("onSeverSubscriptionOK (subId=" + subId + ")");
                }
            },
            
            /**
             * Internal transition called when the snapshot set is empty.
             */
            onEmpty: function() {
                switch (this.state) {
                case EOS:
                    this.fireOnSubscriptionsUpdated("EOS");
                    this.next(DONE, "EMPTY");
                    break;
                    
                default:
                    this.throwError("onEmpty");
                }
            },
            
            /**
             * Fires {@link MpnDeviceListener#onSubscriptionsUpdated}.
             */
            fireOnSubscriptionsUpdated: function(event) {
                if (logOnSubUpd.isDebugLogEnabled()) {
                    logOnSubUpd.debug("onSubscriptionsUpdated (" + this.mpnManager.getDeviceId() + ") fired event=" + event);
                }
                if (this.mpnManager.mpnDevice != null) {
                    this.mpnManager.mpnDevice.eventManager.onSubscriptionsUpdated();
                }
            },
            
            next: function(next, event) {
                if (logOnSubUpd.isDebugLogEnabled()) {
                    logOnSubUpd.debug("OnSubscriptionsUpdated state change (" + this.mpnManager.getDeviceId() + ") on '" + event + "': " + this.state.name + " -> " + next.name);
                }
                this.state = next;
            },
            
            throwError: function(event) {
                var msg = "Unexpected event '" + event + "' in state " + this.state.name + " (" + this.mpnManager.getDeviceId() + ")";
                logOnSubUpd.logError(msg);
                throw new Error(msg);
            }
    };
    
    /**
     * States OnSubscriptionsUpdatedEventManager. 
     * See the diagram <img src="{@docRoot}/../docs/mpn/onSubscriptionsUpdated.png">
     */
    function State(name) {
        this.name = name;
    }
    /**
     * Initial state.
     */
    var INIT = new State("INIT");
    /**
     * Filling the snapshot set. 
     * End-of-snapshot has not yet arrived.
     */
    var NOT_EMPTY = new State("NOT_EMPTY");
    /**
     * Waiting for the first update of every subscription in the snapshot.
     * End-of-snapshot has arrived.
     */
    var EOS = new State("EOS");
    /**
     * All the subscriptions in the snapshot received an update
     * (or the snapshot was empty).
     */
    var DONE = new State("DONE");
    
    export default OnSubscriptionsUpdatedEventManager;

