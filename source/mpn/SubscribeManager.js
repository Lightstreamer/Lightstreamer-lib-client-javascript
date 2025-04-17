/*
 * Copyright (C) 2012 Lightstreamer Srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
import Utils from "../Utils";
import PendingSubscriptions from "./PendingSubscriptions";
import MpnUtils from "./MpnUtils";
import OnSubscriptionsUpdatedEventManager from "./OnSubscriptionsUpdatedEventManager";
    
    var log = LoggerManager.getLoggerProxy(Constants.MPN);

    /**
     * Manages the life cycle of the subscription requests.
     * 
     * <p>
     * <b>1 - SUBSCRIPTION STATES</b><br>
     * A subscription can be in the following states:
     * <ul>
     * <li><b>waiting</b>: the subscription is waiting for the device to register. 
     * After that the subscription becomes pending and the corresponding request is sent.</li>
     * <li><b>pending</b>: the corresponding request has been sent but no response has been received yet.</li>
     * <li><b>subscribed</b>: an object is subscribed when either a subscription request receives 
     * the message MPNOK or the MPN internal adapter publishes a new subscription.</li>
     * </ul>
     * 
     * <p>
     * <b>2 - USER AND SERVER SUBSCRIPTIONS</b><br>
     * An item can be subscribed in two ways: 
     * either when the user calls the method {@link LightstreamerClient#subscribe(MpnSubscription, boolean)}
     * or when the MPN internal adapter publishes a new subscription.
     * To distinguish the two cases, the subscriptions created in the first case are called <i>user subscriptions</i>,
     * while the others are called <i>server subscriptions</i>.
     * User and server subscriptions are stored in the <i>subscription list</i>.<br>
     * There is an important point to stress: since the MPN internal adapter publishes both the user and the server subscriptions,
     * in order to distinguish them, I make the following crucial assumption:
     * <i>when the user requests a new subscription, the message MPNOK is always sent before the MPN internal adapter
     * publishes the subscription</i>.<br>
     * From this assumption I draws the following rules:
     * <ol>
     * <li>MPNOK messages always refer to user subscriptions</li>
     * <li>a user subscription is added to the subscription list when the client receives the corresponding MPNOK message</li>
     * <li>published subscriptions which are not in the subscription list always refer to server subscriptions</li>
     * <li>a server subscription is added to the subscription list when the server sends the first update of the subscription</li>
     * </ol>
     */
    var SubscribeManager = function(mpnManager) {
        this.mpnManager = mpnManager;
        /**
         * Maps the ephemeralSubId (i.e. the values of the parameters LS_subId of the subscribe requests)
         * with the corresponding subscription requests.
         * <p>
         * The state of the contained subscriptions is <b>pending</b>.
         */
        this.pendings = new PendingSubscriptions();
        /**
         * The state of the contained objects is <b>waiting</b>.
         */
        /*List<MpnSubscription>*/ this.waitings = new MpnUtils.MyList();
        /**
         * Since the rules about the firing of the event {@code onSubscriptionsUpdated} are complex,
         * this dedicated object manages them.
         */
        this.onSubUpdEventManager = new OnSubscriptionsUpdatedEventManager(mpnManager);
        
    };
    
    SubscribeManager.prototype = {
            
            /**
             * Resets the internal data structures to start a new registration.
             */
            reset: function() {
                this.mpnManager.subscriptions.clear();
                this.pendings.clear();
                this.waitings.clear();
                this.onSubUpdEventManager.reset();
            },
      
            /**
             * Adds the subscription to the waiting list.
             */
            addWaiting: function(sub) {
                this.waitings.add(sub);
            },
            
            /**
             * Removes the subscription from the waiting list.
             * Returns true if the element was in the waiting list.
             */
            removeWaiting: function(/*MpnSubscription*/ sub) {
                return this.waitings.remove(sub);
            },
            
            /**
             * Subscribes the objects on the waiting list, which are put in the pending list.
             */
            subscribeWaitings: function() {
                for (var len = this.waitings.size(), i = 0; i < len; i++) {
                    var sub = this.waitings.get(i);
                    this.subscribe(sub);
                }
                this.waitings.clear();
            },
            
            /**
             * Returns the pending request corresponding to the specified subscription.
             */
            /*PendingRequest*/ getPendingRequest: function(/*MpnSubscription*/ sub) {
                return this.pendings.getPendingRequest(sub);
            },
            
            /**
             * Tries to subscribe the object, which is put in the pending list.
             */
            subscribe: function(sub) {
                var ephemeralSubId = Utils.nextSubscriptionId();
                this.pendings.put(ephemeralSubId, sub);
                this.mpnManager.requestManager.sendSubscribeRequest(0, ephemeralSubId, sub);
            },
            
            /**
             * Fired when the MPN internal adapter sends the end-of-snapshot message.
             */
            onEndOfSnapshot: function() {
                this.onSubUpdEventManager.onEndOfSnapshot();
            },
            
            /**
             * Fired when the user subscription fails.
             * The subscription is removed from the pending list and the method {@link MpnSubscriptionListener#onSubscriptionError}
             * is triggered.
             */
            onSubscribeError: function(subId, code, message) {
                var /*PendingRequest*/ req = this.pendings.remove(subId);
                if (req == null) {
                    log.warn("Discarded unexpected subscription error subId=" + subId);
                    return;
                }
                var /*MpnSubscription*/ sub = req.subscription;
                sub.eventManager.onSubscribeError(code, message);
                /* fire listeners waiting for the completion of the request */
                req.onComplete(false);
            },
            
            /**
             * Fired when the message MPNOK of an user subscription is received.
             * The user subscription is put in the subscription list and the method {@link MpnDeviceListener#onSubscriptionsUpdated} 
             * is triggered. 
             */
            onUserSubscribeOK: function(ephemeralSubId, mpnSubId) {
                /* remove from pending */
                var /*PendingRequest*/ req = this.pendings.remove(ephemeralSubId);
                if (req == null) {
                    log.warn("Discarded unexpected subscription: subId=" + ephemeralSubId);
                    return;
                }
                var /*MpnSubscription*/ sub = req.subscription;
                /* add to subscriptions */
                this.mpnManager.subscriptions.add(mpnSubId, sub);
                /* set subscription id */
                sub.eventManager.onSubscribeOK(mpnSubId);
                /* fire device listeners */
                this.onSubUpdEventManager.fireOnSubscriptionsUpdated("MPNOK");
                /* fire listeners waiting for the completion of the request */
                req.onComplete(true);
            },
            
            /**
             * Fired when the MPN internal adapter sends the first update of a server subscription.
             * The server subscription is put in the subscription list and the method {@link MpnDeviceListener#onSubscriptionsUpdated} 
             * is triggered. 
             */
            onServerSubscribeOK: function(subId, /*MpnSubscription*/ sub) {
                this.mpnManager.subscriptions.add(subId, sub);
                /* fire device listeners */
                this.onSubUpdEventManager.onSeverSubscriptionOK(subId);
            },
            
            /**
             * Fired when the MPN internal adapter publishes a subscription.
             */
            onAddedSubscription: function(subId) {
                if (this.mpnManager.subscriptions.isSubscribed(subId)) {
                    /*
                     * This is an user subscription. We can ignore the adding since
                     * the subscription is already in the subscription list.
                     */
                    
                } else {
                    /*
                     * This is a new server subscription.
                     */
                    this.onSubUpdEventManager.onNewServerSubscription(subId);
                }
            },
            
            /**
             * Fired when the message MPNDEL of a subscription is received.
             */
            onUnsubscribeOK: function(subId) {
                if (log.isDebugLogEnabled()) {
                    log.debug("MPNDEL subId=" + subId);
                }
                this.mpnManager.unsubscribeManager.onUnsubscribeOK(subId);
            },
            
            /**
             * Fired when the MPN internal adapter removes a subscription.
             * The subscription is removed from the subscription list, and the method
             * {@link MpnDeviceListener#onSubscriptionsUpdated} is triggered.
             */
            onDelete: function(subId) {
                var that = this;
                this.mpnManager.subscriptions.remove(subId, /*SubscriptionList.Visitor*/ {
                    onEmpty: function() {
                        log.warn("MpnSubscription not found subId=" + subId);
                    },
                    visit: function(/*MpnSubscription*/ sub) {
                        sub.eventManager.simulateUnsubscribe();
                    },
                    afterVisit: function() {
                        /* fire device listeners */
                        that.onSubUpdEventManager.fireOnSubscriptionsUpdated("DELETE");
                    }
                });
            },
            
            /**
             * Fired when an unsubscription request receives REQERR.
             * The subscription is removed from the subscription list, and the method
             * {@link MpnDeviceListener#onSubscriptionsUpdated} is triggered.
             */
            onUnsubscribeError: function(subId, code, message) {
                var that = this;
                this.mpnManager.subscriptions.remove(subId, /*SubscriptionList.Visitor*/ {
                    
                    onEmpty: function() {
                        log.warn("MPN subscription not found subId=" + subId);
                    },
                    
                    visit: function(/*MpnSubscription*/ sub) {
                        sub.eventManager.onUnsubscribeError(code, message);
                    },
                    
                    afterVisit: function() {
                        /* fire device listeners */
                        that.onSubUpdEventManager.fireOnSubscriptionsUpdated("REQERR");
                    }
                });
            },
            
            /**
             * Fired when the current session is closed.
             * The pending subscriptions are marked as waiting so they will be sent when a new session
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
                    this.mpnManager.subscriptions.clear();
                    /* fire the device listeners because there are no more subscriptions */
                    this.onSubUpdEventManager.fireOnSubscriptionsUpdated("Session close");
                }
                this.onSubUpdEventManager.reset();
            }
    };
    
    export default SubscribeManager;

