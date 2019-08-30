import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
    
    var log = LoggerManager.getLoggerProxy(Constants.MPN);

    var SubscriptionEventManager = function(subscription) {
        this.subscription = subscription;
    };
    
    SubscriptionEventManager.prototype = {
      
            /**
             * Called when the user requests a subscription.
             */
            onSubscribe: function(coalescing) {
                this.subscription.coalescing = coalescing;
                this.subscription.stateMachine.subscribe();
            },
            
            /**
             * Called when the user requests an unsubscription.
             */
            onUnsubscribe: function() {
                this.subscription.stateMachine.unsubscribe();
            },
            
            setSubscriptionId: function(subId) {
                this.subscription.PN_subscriptionId = subId;
            },
            
            /**
             * Called when MPNOK is received.
             */
            onSubscribeOK: function(subId) {
                this.setSubscriptionId(subId);
            },
            
            /**
             * Called when the MPN internal adapter sends a new status. 
             */
            onStatusChange: function(status, timestamp) {
                this.subscription.statusTimestamp = timestamp;
                switch (status) {
                case "ACTIVE":
                    this.subscription.stateMachine.activate();
                    break;
                case "TRIGGERED":
                    this.subscription.stateMachine.trigger();
                    break;
                default:
                    var msg = "Unknown status " + status + " (" + this.subscription.PN_subscriptionId + ")";
                    log.logError(msg);
                    throw new Error(msg);
                }
            },
            
            /**
             * Called when REQERR is received as subscription response.
             */
            onSubscribeError: function(code, message) {
                this.subscription.stateMachine.onSubscribeError(code, message);
            },
            
            /**
             * Called when REQERR is received as unsubscription response.
             */
            onUnsubscribeError: function(code, message) {
                this.subscription.stateMachine.onUnsubscribeError(code, message);
            },
            
            /**
             * Called when the MPN internal adapter publishes a new server subscription 
             * (i.e. not created by the user by means of a subscription request).
             */
            simulateSubscribe: function(startStatus, timestamp) {
                this.subscription.statusTimestamp = timestamp;
                if ("ACTIVE" == startStatus) {
                    this.subscription.stateMachine.onAddSubscribed();
                } else {
                    //assert "TRIGGERED" == startStatus;
                    this.subscription.stateMachine.onAddTriggered();
                }
            },
            
            /**
             * Called when the MPN internal adapter deletes an item.
             */
            simulateUnsubscribe: function() {
                this.subscription.stateMachine.onDelete();
            },
            
            /**
             * Called when an unsubscription cancels a subscription not already sent over the network.
             */
            cancelSubscription: function() {
                this.subscription.stateMachine.cancelSubscription();
            },
            
            /*
             * Internal setters
             */
            
            onChangeMode: function(_mode) {
                if (this.subscription.mode != _mode) {
                    this.subscription.mode = _mode;
                    this.onPropertyChange("mode");                    
                }
            },

            onChangeGroup: function(group) {
                if (this.subscription.items != group) {
                    this.subscription.items = group;
                    this.onPropertyChange("group");
                }
            },

            onChangeSchema: function(schema) {
                if (this.subscription.fields != schema) {
                    this.subscription.fields = schema;
                    this.onPropertyChange("schema");
                }
            },
            
            onChangeFormat: function(_format) {
                if (this.subscription.format != _format) {
                    this.subscription.format = _format;
                    this.onPropertyChange("notification_format");
                }
            },

            onChangeTrigger: function(trigger) {
                if (this.subscription.trigger != trigger) {
                    this.subscription.trigger = trigger;
                    this.onPropertyChange("trigger");                    
                }
            },

            onChangeAdapter: function(_adapter) {
                if (this.subscription.adapter != _adapter) {
                    this.subscription.adapter = _adapter;
                    this.onPropertyChange("adapter");                    
                }
            },
            
            onChangeRequestedBufferSize: function(size) {
                size = this.subscription._convertBufferSize(size);
                if (this.subscription.requestedBufferSize != size) {
                    this.subscription.requestedBufferSize = size;
                    this.onPropertyChange("requested_buffer_size");
                }
            },
            
            onChangeRequestedMaxFrequency: function(freq) {
                freq = this.subscription._convertFrequency(freq);
                if (this.subscription.requestedMaxFrequency != freq) {
                    this.subscription.requestedMaxFrequency = freq;
                    this.onPropertyChange("requested_max_frequency");
                }
            },

            onChangeTimestamp: function(ts) {
                if (this.subscription.statusTimestamp != ts) {
                    this.subscription.statusTimestamp = ts;
                    this.onPropertyChange("status_timestamp");                    
                }
            },
            
            onPropertyChange: function(prop) {
                this.subscription.dispatchEvent("onPropertyChanged", [prop]);
            }
    };
    
    export default SubscriptionEventManager;

