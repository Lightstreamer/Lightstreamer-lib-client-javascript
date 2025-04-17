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
import MpnSubscription from "../MpnSubscription";
import Subscription from "../Subscription";

    /**
     * Manages the subscription/unsubscription of the SUBS- adapter publishing info about the MPN items. 
     */
    var SUBS_Manager = function(mpnManager) {
        this.mpnManager = mpnManager;
    };
    
    SUBS_Manager.prototype = {
      
            /**
             * Subscribes to SUBS- adapter.
             */
            subscribeToSUBSAdapter: function(adapterName) {
                var that = this;
                /**
                 * Listener of the item SUBS- publishing the adding/removal of the MPN items on the server.
                 * SUBS- is a two-level command-mode item. The second level publishes the information
                 * of a single MPN item. 
                 */
                this.listener = {
                  
                        /**
                         * When dismissed, incoming messages are discarded.
                         */
                        dismissed: false,
                        
                        // preserve the name of the method as it is called by the dispatcher
                        "onItemUpdate": function(itemUpdate) {
                            if (this.dismissed) {
                                return;
                            }

                            try {
                                var command = itemUpdate.getValue("command");
                                switch (command) {
                                case "UPDATE":
                                    that.onUpdate(itemUpdate);
                                    break;
                                case "ADD":
                                    that.onAdd(itemUpdate);
                                    break;
                                case "DELETE":
                                    that.onDelete(itemUpdate);
                                    break;
                                }
                            } catch (e) {
                                that.mpnManager.onFatalError(e);
                            }
                        },
                        
                        // preserve the name of the method as it is called by the dispatcher
                        "onEndOfSnapshot": function(itemName, itemPos) {
                            if (this.dismissed) {
                                return;
                            }

                            try {
                                that.mpnManager.subscribeManager.onEndOfSnapshot();                                
                            } catch(e) {
                                that.mpnManager.onFatalError(e);
                            }
                        }
                };
                this.subscription = new Subscription(
                        "COMMAND", 
                        "SUBS-" + this.mpnManager.mpnDevice.deviceId, 
                        ["key", "command"]);
                this.subscription.setDataAdapter(this.mpnManager.mpnDevice.adapterName);
                this.subscription.setRequestedMaxFrequency("unfiltered");
                this.subscription.setCommandSecondLevelFields([
                        "status", "status_timestamp", "notification_format", "trigger", "group", 
                        "schema", "adapter", "mode", "requested_buffer_size", "requested_max_frequency"]);
                this.subscription.setCommandSecondLevelDataAdapter(this.mpnManager.mpnDevice.adapterName);
                this.subscription.addListener(this.listener);
                this.mpnManager.lsClient.subscribe(this.subscription);
            },
            
            /**
             * Unsubscribes from SUBS- adapter.
             */
            unsubscribeFromSUBSAdapter: function() {
                if (this.subscription != null) {
                    this.mpnManager.lsClient.unsubscribe(this.subscription);
                    this.subscription.removeListener(this.listener);
                    this.listener.dismissed = true;
                    this.subscription = null;
                    this.listener = null;
                }
            },
            
            /*
             * Subscription listener support methods
             */
    
            /**
             * Manages both the updating of an existing subscription and the adding of a new server subscription.
             * The adding is recognized by the fact that the subscription is not in the subscription list
             * kept by the MpnManager.
             */
            onUpdate: function(itemUpdate) {
                var that = this;
                var subId = this.getSubId(itemUpdate);
                this.mpnManager.subscriptions.forEachWithSubId(subId, /*SubscriptionList.Visitor*/ {
                    
                    onEmpty: function() {
                        that.doCreateNewSubscription(subId, itemUpdate);
                    },
                    
                    visit: function(/*MpnSubscription*/ sub) {
                        that.doUpdateExistingSubscription(sub, itemUpdate);
                    }
                });
            },
            
            /**
             * Updates the subscription.
             * When a subscription field is updated, the method {@link MpnSubscriptionListener#onPropertyChanged(String)} is triggered.
             */
            doUpdateExistingSubscription: function(/*MpnSubscription*/ sub, /*ItemUpdate*/ itemUpdate) {
                var needsInitialization = sub.needsInitialization;
                if (needsInitialization || itemUpdate.isValueChanged("mode")) {
                    var mode = itemUpdate.getValue("mode");
                    sub.eventManager.onChangeMode(mode);
                }
                if (needsInitialization || itemUpdate.isValueChanged("group")) {
                    var group = itemUpdate.getValue("group");
                    sub.eventManager.onChangeGroup(group);
                }
                if (needsInitialization || itemUpdate.isValueChanged("schema")) {
                    var schema = itemUpdate.getValue("schema");
                    sub.eventManager.onChangeSchema(schema);
                }
                if (needsInitialization || itemUpdate.isValueChanged("adapter")) {
                    var adapter = itemUpdate.getValue("adapter");
                    sub.eventManager.onChangeAdapter(adapter);
                }
                if (needsInitialization || itemUpdate.isValueChanged("notification_format")) {
                    var format = itemUpdate.getValue("notification_format");
                    sub.eventManager.onChangeFormat(format);
                }
                if (needsInitialization || itemUpdate.isValueChanged("trigger")) {
                    var trigger = itemUpdate.getValue("trigger");
                    sub.eventManager.onChangeTrigger(trigger);
                }
                if (needsInitialization || itemUpdate.isValueChanged("requested_buffer_size")) {
                    var size = itemUpdate.getValue("requested_buffer_size");
                    sub.eventManager.onChangeRequestedBufferSize(size);
                }
                if (needsInitialization || itemUpdate.isValueChanged("requested_max_frequency")) {
                    var freq = itemUpdate.getValue("requested_max_frequency");
                    sub.eventManager.onChangeRequestedMaxFrequency(freq);
                }
                if (needsInitialization || itemUpdate.isValueChanged("status_timestamp")) {
                    var ts = itemUpdate.getValue("status_timestamp");
                    var timestamp = (ts == null ? 0 : parseInt(ts, 10));
                    sub.eventManager.onChangeTimestamp(timestamp);
                }
                if (needsInitialization || itemUpdate.isValueChanged("status")) {
                    var next = itemUpdate.getValue("status");
                    var ts = itemUpdate.getValue("status_timestamp");
                    var timestamp = (ts == null ? 0 : parseInt(ts, 10));
                    sub.eventManager.onStatusChange(next, timestamp);
                }
                /* subscription is now initialized */
                if (needsInitialization) {                
                    sub.needsInitialization = false;
                }
            },
            
            /**
             * Adds a new server subscription.
             * The method {@link MpnSubscriptionListener#onPropertyChanged(String)} is triggered for each property. 
             */
            doCreateNewSubscription: function(subId, itemUpdate) {
                /* add new subscription */
                var mode = itemUpdate.getValue("mode");
                var group = itemUpdate.getValue("group");
                var schema = itemUpdate.getValue("schema");
                var adapter = itemUpdate.getValue("adapter");
                var format = itemUpdate.getValue("notification_format");
                var trigger = itemUpdate.getValue("trigger");
                var buffSize = itemUpdate.getValue("requested_buffer_size");
                var freq = itemUpdate.getValue("requested_max_frequency");
                var status = itemUpdate.getValue("status");
                var timestamp = parseInt(itemUpdate.getValue("status_timestamp"), 10);
                var sub = new MpnSubscription(mode);
                sub.eventManager.onChangeGroup(group);
                sub.eventManager.onChangeSchema(schema);
                sub.eventManager.onChangeAdapter(adapter);
                sub.eventManager.onChangeFormat(format);
                sub.eventManager.onChangeTrigger(trigger);
                sub.eventManager.onChangeRequestedBufferSize(buffSize);
                sub.eventManager.onChangeRequestedMaxFrequency(freq);
                sub.eventManager.setSubscriptionId(subId);
                sub.eventManager.simulateSubscribe(status, timestamp);
                sub.needsInitialization = false;
                this.mpnManager.subscribeManager.onServerSubscribeOK(subId, sub);
            },
            
            /**
             * Deletes a subscription.
             * The method {@link MpnSubscriptionListener#onUnsubscription} is triggered.
             */
            onDelete: function(/*ItemUpdate*/ itemUpdate) {
                var subId = this.getSubId(itemUpdate);
                this.mpnManager.subscribeManager.onDelete(subId);
            },
            
            /**
             * Manages the publishing of a subscription.
             */
            onAdd: function(/*ItemUpdate*/ itemUpdate) {
                var subId = this.getSubId(itemUpdate);
                this.mpnManager.subscribeManager.onAddedSubscription(subId);
            },
            
            /**
             * Returns the subscription id of an item.
             * The id is stored in the field {@code key} of the update and is coded as {@code SUB-<id>}.
             */
            getSubId: function(itemUpdate) {
                var key = itemUpdate.getValue("key");
                //assert key.startsWith("SUB-");
                return key.substring(4); // strip SUB- prefix
            }
    };
    
    export default SUBS_Manager;

