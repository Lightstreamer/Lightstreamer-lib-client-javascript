/**
 * Manages the maximum real frequency of a subscription. 
 * In case of change, SubscriptionListener.onRealMaxFrequency is triggered.
 * If the subscription is a two-level command subscription, the notified frequency is the maximum real frequency
 * of the first-level and second-level subscriptions.
 * 
 * @since February 2018
 */

    
    /**
     * A frequency is a decimal number or the string "unlimited".
     */
    var Frequency = function(frequency) {
        this.frequency = frequency;
    }

    Frequency.prototype = {
            /**
             * Returns whether this frequency is greater than or equal to the given frequency. 
             */
            isGTE: function(otherFrequency) {
                if (this.frequency == "unlimited") {
                    return true;
                } else if (otherFrequency.frequency == "unlimited") {
                    return false;
                } else {
                    return this.frequency > otherFrequency.frequency;
                }
            },

            equals: function(otherFrequency) {
                return this.frequency == otherFrequency.frequency;
            }
    };

    /**
     * Manages a subscription which is neither a first-level nor a second-level subscription.
     */
    var FlatPushRealMaxFrequencyManager = function(subscription) {
        this.subscription = subscription;
    }

    FlatPushRealMaxFrequencyManager.prototype = {
            /**
             * Changes the maximum real frequency of a subscription
             * and notifies SubscriptionListener.onRealMaxFrequency if there is a change.
             */
            configure: function(frequency) {
                var oldRealMaxFrequency = this.subscription.realMaxFrequency;
                this.subscription.realMaxFrequency = new Frequency(frequency);
                if (!oldRealMaxFrequency.equals(this.subscription.realMaxFrequency)) {
                    this.subscription.dispatchEvent("onRealMaxFrequency", [this.subscription.realMaxFrequency.frequency]);
                }
            }
    };

    /**
     * Manages the first-level subscription of a two-level command subscription.
     */
    var FirstLevelMultiMetaPushRealMaxFrequencyManager = function(subscription) {
        this.subscription = subscription;
        this.multiMetaPushRealMaxFrequency = new Frequency(null);
    }

    FirstLevelMultiMetaPushRealMaxFrequencyManager.prototype = {
            /**
             * Changes the maximum real frequency of a subscription
             * and notifies SubscriptionListener.onRealMaxFrequency if there is a change.
             */
            configure: function(frequency) {
                this.subscription.realMaxFrequency = new Frequency(frequency);
                this.configureMultiMetaPushRealMaxFrequency();
            },

            /**
             * Calculates the maximum frequency among first-/second-level subscriptions 
             * and notifies SubscriptionListener.onRealMaxFrequency if there is a change.
             */
            configureMultiMetaPushRealMaxFrequency: function() {
                var maxFrequency = this.subscription.realMaxFrequency;
                this.subscription.subTables.forEachElement(function(secondLevelSubscription) {
                    if (secondLevelSubscription.realMaxFrequency.isGTE(maxFrequency)) {
                        maxFrequency = secondLevelSubscription.realMaxFrequency;
                    }
                });
                if (!maxFrequency.equals(this.multiMetaPushRealMaxFrequency)) {
                    this.multiMetaPushRealMaxFrequency = maxFrequency;
                    this.subscription.dispatchEvent("onRealMaxFrequency", [this.multiMetaPushRealMaxFrequency.frequency]);
                }
            },

            /**
             * Recalculates the maximum frequency when a second-level subscription is deleted
             * and notifies SubscriptionListener.onRealMaxFrequency if there is a change.
             */
            onDeleteSecondLevelSubscription: function() {
                this.configureMultiMetaPushRealMaxFrequency();
            }
    };

    /**
     * Manages a second-level subscription of a two-level command subscription.
     */
    var SecondLevelMultiMetaPushRealMaxFrequencyManager = function(subscription, firstLevelSubscription) {
        this.subscription = subscription;
        this.firstLevelSubscription = firstLevelSubscription;
    }

    SecondLevelMultiMetaPushRealMaxFrequencyManager.prototype = {
            /**
             * Changes the maximum real frequency of a subscription
             * and notifies SubscriptionListener.onRealMaxFrequency of the first-level subscription 
             * if there is a change.
             */
            configure: function(frequency) {
                this.subscription.realMaxFrequency = new Frequency(frequency);
                this.firstLevelSubscription.realMaxFrequencyManager.configureMultiMetaPushRealMaxFrequency();
            }
    };
    
    export default {
        Frequency: Frequency,
        FlatPushRealMaxFrequencyManager: FlatPushRealMaxFrequencyManager,
        FirstLevelMultiMetaPushRealMaxFrequencyManager: FirstLevelMultiMetaPushRealMaxFrequencyManager,
        SecondLevelMultiMetaPushRealMaxFrequencyManager: SecondLevelMultiMetaPushRealMaxFrequencyManager
    }
