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
import LoggerManager from "../src-log/LoggerManager";
import Constants from "./Constants";
import Inheritance from "../src-tool/Inheritance";
import EventDispatcher from "../src-tool/EventDispatcher";
import IllegalArgumentException from "../src-tool/IllegalArgumentException";
import IllegalStateException from "../src-tool/IllegalStateException";
import ValidationUtils from "./utils/ValidationUtils";
import Helpers from "../src-tool/Helpers";
import SubscriptionEventManager from "./mpn/SubscriptionEventManager";
import Subscription from "./Subscription";

export default /*@__PURE__*/(function() {
    var log = LoggerManager.getLoggerProxy(Constants.MPN);

    /**
     * Creates an object to be used to describe an MPN subscription that is going to be subscribed to through the MPN Module of Lightstreamer Server.<BR>
     * The object can be supplied to {@link LightstreamerClient#subscribeMpn} in order to bring the MPN subscription to "active" state.<BR>
     * Note that all of the methods used to describe the subscription to the server can only be called while the instance is in the "inactive" state.
     *
     * <p>
     * Alternatively you can create an MpnSubscription object by passing a single argument either of type
     * <ul>
     * <li> {@link Subscription}: the new object is initialized by copying subscription mode, items, fields 
     * and data adapter from the specified real-time subscription; or</li>
     * <li> {@link MpnSubscription}: the new object is initialized by copying all properties 
     * (including the subscription ID) from the specified MPN subscription. <b>The created MpnSubscription is a copy of 
     * the original MpnSubscription object and represents the same MPN subscription, since their subscription ID 
     * is the same. When the object is supplied to {@link LightstreamerClient#subscribeMpn} in order to bring it 
     * to "active" state, the MPN subscription is modified: any property changed in this MpnSubscription 
     * replaces the corresponding value of the MPN subscription on the server.</b></li>
     * </ul>
     * 
     * @constructor
     * @exports MpnSubscription
     * 
     * @param {String} subscriptionMode The subscription mode for the items, required by Lightstreamer Server. Permitted values are:<ul>
     * <li><code>MERGE</code></li>
     * <li><code>DISTINCT</code></li>
     * </ul>
     * @param {String[]} items An array of items to be subscribed to through Lightstreamer Server. It is also possible specify the "Item List" or
     * "Item Group" later through {@link MpnSubscription#setItems} and {@link MpnSubscription#setItemGroup}.
     * @param {String[]} fields An array of fields for the items to be subscribed to through Lightstreamer Server. It is also possible to specify the "Field List" or
     * "Field Schema" later through {@link MpnSubscription#setFields} and {@link MpnSubscription#setFieldSchema}.
     * @throws IllegalArgumentException If no or invalid subscription mode is passed.
     * @throws IllegalArgumentException If either the items or the fields array is left null.
     * @throws IllegalArgumentException If the specified "Item List" or "Field List" is not valid; see {@link MpnSubscription#setItems} and {@link MpnSubscription#setFields} for details.
     * 
     * @class Class representing a Web Push Notification subscription to be submitted to the MPN Module of a Lightstreamer Server.<BR>
     * It contains subscription details and the listener needed to monitor its status. Real-time data is routed via native push notifications.<BR>
     * In order to successfully subscribe an MPN subscription, first an MpnDevice must be created and registered on the LightstreamerClient with
     * {@link LightstreamerClient#registerForMpn}.<BR>
     * After creation, an MpnSubscription object is in the "inactive" state. When an MpnSubscription object is subscribed to on an LightstreamerClient
     * object, through the {@link LightstreamerClient#subscribeMpn} method, its state switches to "active". This means that the subscription request
     * is being sent to the Lightstreamer Server. Once the server accepted the request, it begins to send real-time events via native push notifications and
     * the MpnSubscription object switches to the "subscribed" state.<BR>
     * If a trigger expression is set, the MPN subscription does not send any push notifications until the expression evaluates to true. When this happens,
     * the MPN subscription switches to "triggered" state and a single push notification is sent. Once triggered, no other push notifications are sent.<BR>
     * When an MpnSubscription is subscribed on the server, it acquires a permanent subscription ID that the server later uses to identify the same
     * MPN subscription on subsequent sessions.<BR>
     * An MpnSubscription can be configured to use either an Item Group or an Item List to specify the items to be subscribed to, and using either a Field Schema
     * or Field List to specify the fields. The same rules that apply to {@link Subscription} apply to MpnSubscription.<BR>
     * An MpnSubscription object can also be provided by the client to represent a pre-existing MPN subscription on the server. In fact, differently than real-time
     * subscriptions, MPN subscriptions are persisted on the server's MPN Module database and survive the session they were created on.<BR>
     * MPN subscriptions are associated with the MPN device, and after the device has been registered the client retrieves pre-existing MPN subscriptions from the
     * server's database and exposes them with the {@link LightstreamerClient#getMpnSubscriptions} method.
     */
    var MpnSubscription = function() {
        this.initDispatcher();
        /* set attribute default values */
        this.mode = null;
        this.format = null;
        this.trigger = null;
        this.items = null;
        this.fields = null;
        this.adapter = null;
        this.PN_subscriptionId = null;
        this.statusTimestamp = 0;
        this.requestedBufferSize = -1;
        this.requestedMaxFrequency = -2;
        this.coalescing = false;
        /*
         * As a general rule, the subscription is wholly initialized when the
         * MpnManager sets the subscription fields with the values coming from the
         * subscription internal adapter.
         * <p>
         * For example suppose that a subscription is created as a copy of another active subscription.
         * It is reasonable that the copy starts in the state INACTIVE (*), but, since the original subscription
         * is already in state SUBSCRIBED, the updates coming from the internal adapter don't mark the field
         * status as modified. However this flag remembers that the copy is not fully initialized so
         * the status is set notwithstanding the internal adapter incoherent information.
         * <p>
         * (*) Starting as INACTIVE, when the state becomes SUBSCRIBED, we can fire the subscription triggers.
         */
        this.needsInitialization = true; // written by MpnManager
        this.eventManager = new SubscriptionEventManager(this);
        this.stateMachine = new StateMachine(this);

        var arg0 = arguments[0];
        if (typeof arg0 == 'string' || arg0 instanceof String) {
            this._init0(arg0, arguments[1], arguments[2]);

        } else if (arg0 instanceof MpnSubscription) {
            this._initFromMpnSubscription(arg0);

        } else if (arg0 instanceof Subscription) {
            this._initFromSubscription(arg0);

        } else {
            throw new Error("Wrong arguments for MpnSubscription constructor");
        }
    };

    MpnSubscription.prototype = {

            _init0: function(mode, items, fields) {
                /* construct object */
                mode = new String(mode).toUpperCase();
                if (mode != "MERGE" && mode != "DISTINCT") {
                    throw new IllegalArgumentException("Only MERGE and DISTINCT modes are allowed for MPN subscriptions");
                }
                this.mode = mode;
                if (items != null) {
                    if (fields == null) {
                        throw new IllegalArgumentException(ValidationUtils.NO_VALID_FIELDS);
                    }
                    if (Helpers.isArray(items)) {
                        this.setItems(items);
                    } else {
                        this.setItems([items]);
                    }
                    this.setFields(fields);
                } else if (fields != null) {
                    throw new IllegalArgumentException(ValidationUtils.YES_FIELDS_NO_ITEMS);
                }
            },

            _initFromSubscription: function(/*Subscription*/ copyFrom) {
                this.mode = copyFrom._mode;
                this.items = copyFrom.itemDescriptor.getComposedString();
                this.fields = copyFrom.fieldDescriptor.getComposedString();
                this.adapter = copyFrom.dataAdapter;
            },

            _initFromMpnSubscription: function(/*MpnSubscription*/ copyFrom) {
                this.mode = copyFrom.mode;
                this.items = copyFrom.items;
                this.fields = copyFrom.fields;
                this.format = copyFrom.format;
                this.trigger = copyFrom.trigger;
                this.adapter = copyFrom.adapter;
                this.PN_subscriptionId = copyFrom.PN_subscriptionId;
                this.requestedBufferSize = copyFrom.requestedBufferSize;
                this.requestedMaxFrequency = copyFrom.requestedMaxFrequency;
            },

            /**
             * Adds a listener that will receive events from the MpnSubscription
             * instance.
             * <BR>The same listener can be added to several different MpnSubscription
             * instances.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
             *
             * @param {MpnSubscriptionListener} listener An object that will receive the events
             * as shown in the {@link MpnSubscriptionListener} interface.
             * <BR>Note that the given instance does not have to implement all of the
             * methods of the MpnSubscriptionListener interface. In fact it may also
             * implement none of the interface methods and still be considered a valid
             * listener. In the latter case it will obviously receive no events.
             */
            addListener: function(listener) {
                this._callSuperMethod(MpnSubscription, "addListener", [listener]);
            },

            /**
             * Removes a listener from the MpnSubscription instance so that it
             * will not receive events anymore.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
             *
             * @param {MpnSubscriptionListener} listener The listener to be removed.
             */
            removeListener: function(listener) {
                this._callSuperMethod(MpnSubscription, "removeListener", [listener]);
            },

            /**
             * Returns an array containing the {@link MpnSubscriptionListener} instances that
             * were added to this client.
             *
             * @return {MpnSubscriptionListener[]} an Array containing the listeners that were added to this client.
             * Listeners added multiple times are included multiple times in the array.
             */
            getListeners: function() {
                return this._callSuperMethod(MpnSubscription, "getListeners");
            },

            /**
             * Returns the JSON structure to be used as the format of push notifications.<BR>
             * This JSON structure is sent by the server to the push notification service provider (FCM or APNs), hence it must follow
             * its specifications.<BR>
             *
             * @return {String} the JSON structure to be used as the format of push notifications.
             *
             * @see #setNotificationFormat
             */
            getNotificationFormat: function() {
                return this.format;
            },

            /**
             * Sets the JSON structure to be used as the format of push notifications.<BR>
             * This JSON structure is sent by the server to the push notification service provider (FCM or APNs), hence it must follow
             * its specifications.<BR>
             * The JSON structure may contain named arguments with the format <code>${field}</code>, or indexed arguments with the format <code>$[1]</code>. These arguments are
             * replaced by the server with the value of corresponding subscription fields before the push notification is sent.<BR>
             * For instance, if the subscription contains fields "stock_name" and "last_price", the notification format could be something like this:<ul>
             * <li><code>{ "notification" : { "body" : "Stock ${stock_name} is now valued ${last_price}" } }</code></li>
             * </ul>
             * Named arguments are available if the Metadata Adapter is a subclass of LiteralBasedProvider or provides equivalent functionality, otherwise only
             * indexed arguments may be used. In both cases common metadata rules apply: field names and indexes are checked against the Metadata Adapter, hence
             * they must be consistent with the schema and group specified.<BR>
             * A special server-managed argument may also be used:<ul>
             * <li><code>${LS_MPN_subscription_ID}</code>: the ID of the MPN subscription generating the push notification.
             * </ul>
             * The MpnBuilder object provides methods to build an appropriate JSON structure from its defining fields.<BR>
             * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
             * named arguments are always mapped to its corresponding indexed argument, even if originally the notification format used a named argument.<BR>
             * Note: the content of this property may be subject to length restrictions (See the "General Concepts" document for more information).
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>notification_format</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param {String} format the JSON structure to be used as the format of push notifications.
             * @throws IllegalStateException if the MpnSubscription is currently "active".
             *
             * @see FirebaseMpnBuilder
             * @see SafariMpnBuilder
             */
            setNotificationFormat: function(format) {
                this.throwErrorIfActive();
                this.format = format;
            },

            /**
             * Returns the boolean expression that is evaluated against each update and acts as a trigger to deliver the push notification.
             *
             * @return {boolean} the boolean expression that acts as a trigger to deliver the push notification.
             *
             * @see #setTriggerExpression
             */
            getTriggerExpression: function() {
                return this.trigger;
            },

            /**
             * Sets the boolean expression that will be evaluated against each update and will act as a trigger to deliver the push notification.<BR>
             * If a trigger expression is set, the MPN subscription does not send any push notifications until the expression evaluates to true. When this happens,
             * the MPN subscription "triggers" and a single push notification is sent. Once triggered, no other push notifications are sent. In other words, with a trigger
             * expression set, the MPN subscription sends *at most one* push notification.<BR>
             * The expression must be in Java syntax and can contain named arguments with the format <code>${field}</code>, or indexed arguments with the format <code>$[1]</code>.
             * The same rules that apply to {@link MpnSubscription#setNotificationFormat} apply also to the trigger expression. The expression is verified and evaluated on the server.<BR>
             * Named and indexed arguments are replaced by the server with the value of corresponding subscription fields before the expression is evaluated. They are
             * represented as String variables, and as such appropriate type conversion must be considered. E.g.<ul>
             * <li><code>Double.parseDouble(${last_price}) &gt; 500.0</code></li>
             * </ul>
             * Argument variables are named with the prefix <code>LS_MPN_field</code> followed by an index. Thus, variable names like <code>LS_MPN_field1</code> should be considered
             * reserved and their use avoided in the expression.<BR>
             * Consider potential impact on server performance when writing trigger expressions. Since Java code may use classes and methods of the JDK, a badly written
             * trigger may cause CPU hogging or memory exhaustion. For this reason, a server-side filter may be applied to refuse poorly written (or even
             * maliciously crafted) trigger expressions. See the "General Concepts" document for more information.<BR>
             * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
             * named arguments are always mapped to its corresponding indexed argument, even if originally the trigger expression used a named argument.<BR>
             * Note: the content of this property may be subject to length restrictions (See the "General Concepts" document for more information).
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>trigger</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param {boolean} expr the boolean expression that acts as a trigger to deliver the push notification.
             * @throws IllegalStateException if the MpnSubscription is currently "active".
             *
             * @see #isTriggered
             */
            setTriggerExpression: function(expr) {
                this.throwErrorIfActive();
                this.trigger = expr;
            },

            /**
             * Checks if the MpnSubscription is currently "active" or not.<BR>
             * Most of the MpnSubscription properties cannot be modified if an MpnSubscription is "active".<BR>
             * The status of an MpnSubscription is changed to "active" through the {@link LightstreamerClient#subscribeMpn} method and back to "inactive"
             * through the {@link LightstreamerClient#unsubscribeMpn} and {@link LightstreamerClient#unsubscribeMpnSubscriptions} ones.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {boolean}true if the MpnSubscription is currently "active", false otherwise.
             *
             * @see #getStatus
             * @see LightstreamerClient#subscribeMpn
             * @see LightstreamerClient#unsubscribeMpn
             * @see LightstreamerClient#unsubscribeMpnSubscriptions
             */
            isActive: function() {
                return this.stateMachine.state.isActive;
            },

            /**
             * Checks if the MpnSubscription is currently subscribed to through the server or not.<BR>
             * This flag is switched to true by server sent subscription events, and back to false in case of client disconnection,
             * {@link LightstreamerClient#unsubscribeMpn} or {@link LightstreamerClient#unsubscribeMpnSubscriptions} calls, and server sent
             * unsubscription events.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {boolean} true if the MpnSubscription has been successfully subscribed on the server, false otherwise.
             *
             * @see #getStatus
             * @see LightstreamerClient#unsubscribe
             * @see LightstreamerClient#unsubscribeMpnSubscriptions
             */
            isSubscribed: function() {
                return this.stateMachine.state.isSubscribed;
            },

            /**
             * Checks if the MpnSubscription is currently triggered or not.<BR>
             * This flag is switched to true when a trigger expression has been set and it evaluated to true at least once. For this to happen, the subscription
             * must already be in "active" and "subscribed" states. It is switched back to false if the subscription is modified with a
             * {@link LightstreamerClient#subscribeMpn} call on a copy of it, deleted with {@link LightstreamerClient#unsubscribeMpn} or
             * {@link LightstreamerClient#unsubscribeMpnSubscriptions} calls, and server sent subscription events.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {boolean} true if the MpnSubscription's trigger expression has been evaluated to true at least once, false otherwise.
             *
             * @see #getStatus
             * @see LightstreamerClient#subscribe
             * @see LightstreamerClient#unsubscribe
             * @see LightstreamerClient#unsubscribeMpnSubscriptions
             */
            isTriggered: function() {
                return this.stateMachine.state.isTriggered;
            },

            /**
             * The status of the subscription.<BR>
             * The status can be:<ul>
             * <li><code>UNKNOWN</code>: when the MPN subscription has just been created or deleted (i.e. unsubscribed). In this status {@link MpnSubscription#isActive}, {@link MpnSubscription#isSubscribed}
             * and {@link MpnSubscription#isTriggered} are all false.</li>
             * <li><code>ACTIVE</code>: when the MPN subscription has been submitted to the server, but no confirm has been received yet. In this status {@link MpnSubscription#isActive} is true,
             * {@link MpnSubscription#isSubscribed} and {@link MpnSubscription#isTriggered} are false.</li>
             * <li><code>SUBSCRIBED</code>: when the MPN subscription has been successfully subscribed on the server. If a trigger expression is set, it has not been
             * evaluated to true yet. In this status {@link MpnSubscription#isActive} and {@link MpnSubscription#isSubscribed} are true, {@link MpnSubscription#isTriggered} is false.</li>
             * <li><code>TRIGGERED</code>: when the MPN subscription has a trigger expression set, has been successfully subscribed on the server and
             * the trigger expression has been evaluated to true at least once. In this status {@link MpnSubscription#isActive}, {@link MpnSubscription#isSubscribed} and {@link MpnSubscription#isTriggered} are all true.</li>
             * </ul>
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the status of the subscription.
             *
             * @see #isActive
             * @see #isSubscribed
             * @see #isTriggered
             */
            getStatus: function() {
                return this.stateMachine.state.status;
            },

            /**
             * The server-side timestamp of the subscription status.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>status_timestamp</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @return {Number} The server-side timestamp of the subscription status, expressed as a Java time.
             *
             * @see #getStatus
             */
            getStatusTimestamp: function() {
                return this.statusTimestamp;
            },

            /**
             * Setter method that sets the "Item List" to be subscribed to through
             * Lightstreamer Server. <BR>
             * Any call to this method will override any "Item List" or "Item Group"
             * previously specified.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
             * instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>group</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param {String[]} items an array of items to be subscribed to through the server.
             * @throws IllegalArgumentException if any of the item names in the "Item List"
             * contains a space or is a number or is empty/null.
             * @throws IllegalStateException if the MpnSubscription is currently
             * "active".
             */
            setItems: function(items) {
                this.throwErrorIfActive();
                ValidationUtils.checkItemNames(items, "An item");
                this.items = items.join(' ');
            },

            /**
             * Inquiry method that can be used to read the "Item List" specified for this MpnSubscription.<BR>
             * Note that if the single-item-constructor was used, this method will return an array
             * of length 1 containing such item.<BR>
             * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
             * items are always expressed with an "Item Group"", even if originally the MPN subscription used an "Item List".
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the MpnSubscription has been initialized
             * with an "Item List".</p>

             * @return {String[]} the "Item List" to be subscribed to through the server.
             *
             * @throws IllegalStateException if the MpnSubscription was not initialized.
             */
            getItems: function() {
                if (this.items == null) {
                    throw new IllegalStateException(ValidationUtils.NO_GROUP_NOR_LIST);
                }
                return this.items.split(' ');
            },

            /**
             * Setter method that sets the "Item Group" to be subscribed to through
             * Lightstreamer Server. <BR>
             * Any call to this method will override any "Item List" or "Item Group"
             * previously specified.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
             * instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>group</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param {String} groupName A String to be expanded into an item list by the
             * Metadata Adapter.
             * @throws IllegalStateException if the MpnSubscription is currently
             * "active".
             */
            setItemGroup: function(group) {
                this.throwErrorIfActive();
                this.items = (group == null ? null : String(group));
            },

            /**
             * Inquiry method that can be used to read the item group specified for this MpnSubscription.<BR>
             * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
             * items are always expressed with an "Item Group"", even if originally the MPN subscription used an "Item List".
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the MpnSubscription has been initialized
             * using an "Item Group"</p>
             *
             * @return {String} the "Item Group" to be subscribed to through the server.
             *
             * @throws IllegalStateException if the MpnSubscription was not initialized.
             */
            getItemGroup: function() {
                if (this.items == null) {
                    throw new IllegalStateException(ValidationUtils.NO_GROUP_NOR_LIST);
                }
                return this.items;
            },

            /**
             * Setter method that sets the "Field List" to be subscribed to through
             * Lightstreamer Server. <BR>
             * Any call to this method will override any "Field List" or "Field Schema"
             * previously specified.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
             * instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>schema</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param {String[]} fields an array of fields to be subscribed to through the server.
             * @throws IllegalArgumentException if any of the field names in the list
             * contains a space or is empty/null.
             * @throws IllegalStateException if the MpnSubscription is currently
             * "active".
             */
            setFields: function(fields) {
                this.throwErrorIfActive();
                ValidationUtils.checkFieldNames(fields, "A field");
                this.fields = fields.join(' ');
            },

            /**
             * Inquiry method that can be used to read the "Field List" specified for this MpnSubscription.<BR>
             * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
             * fields are always expressed with a "Field Schema"", even if originally the MPN subscription used a "Field List".
             *
             * <p class="lifecycle"><b>Lifecycle:</b>  This method can only be called if the MpnSubscription has been initialized
             * using a "Field List".</p>
             *
             * @return {String[]} the "Field List" to be subscribed to through the server.
             *
             * @throws IllegalStateException if the MpnSubscription was not initialized.
             */
            getFields: function() {
                if (this.fields == null) {
                    throw new IllegalStateException(ValidationUtils.NO_SCHEMA_NOR_LIST);
                }
                return this.fields.split(' ');
            },

            /**
             * Setter method that sets the "Field Schema" to be subscribed to through
             * Lightstreamer Server. <BR>
             * Any call to this method will override any "Field List" or "Field Schema"
             * previously specified.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
             * instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>schema</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param {String} schemaName A String to be expanded into a field list by the
             * Metadata Adapter.
             *
             * @throws IllegalStateException if the MpnSubscription is currently
             * "active".
             */
            setFieldSchema: function(schema) {
                this.throwErrorIfActive();
                this.fields = (schema == null ? null : String(schema));
            },

            /**
             * Inquiry method that can be used to read the field schema specified for this MpnSubscription.<BR>
             * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
             * fields are always expressed with a "Field Schema"", even if originally the MPN subscription used a "Field List".
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the MpnSubscription has been initialized
             * using a "Field Schema"</p>
             *
             * @return {String} the "Field Schema" to be subscribed to through the server.

             * @throws IllegalStateException if the MpnSubscription was not initialized.
             */
            getFieldSchema: function() {
                if (this.fields == null) {
                    throw new IllegalStateException(ValidationUtils.NO_SCHEMA_NOR_LIST);
                }
                return this.fields;
            },

            /**
             * Setter method that sets the name of the Data Adapter
             * (within the Adapter Set used by the current session)
             * that supplies all the items for this MpnSubscription. <BR>
             * The Data Adapter name is configured on the server side through
             * the "name" attribute of the "data_provider" element, in the
             * "adapters.xml" file that defines the Adapter Set (a missing attribute
             * configures the "DEFAULT" name). <BR>
             * Note that if more than one Data Adapter is needed to supply all the
             * items in a set of items, then it is not possible to group all the
             * items of the set in a single MpnSubscription. Multiple MpnSubscriptions
             * have to be defined.
             *
             * <p class="default-value"><b>Default value:</b> The default Data Adapter for the Adapter Set,
             * configured as "DEFAULT" on the Server.</p>
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
             * instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>adapter</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param {String} dataAdapter the name of the Data Adapter. A null value
             * is equivalent to the "DEFAULT" name.
             * @throws IllegalStateException if the Subscription is currently
             * "active".
             *
             * @see ConnectionDetails#setAdapterSet
             */
            setDataAdapter: function(adapter) {
                this.throwErrorIfActive();
                this.adapter = adapter;
            },

            /**
             * Inquiry method that can be used to read the name of the Data Adapter specified for this
             * MpnSubscription through {@link MpnSubscription#setDataAdapter}.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the name of the Data Adapter; returns null if no name has been configured,
             * so that the "DEFAULT" Adapter Set is used.
             */
            getDataAdapter: function() {
                return this.adapter;
            },

            /**
             * Setter method that sets the length to be requested to Lightstreamer
             * Server for the internal queuing buffers for the items in the MpnSubscription.<BR>
             * A Queuing buffer is used by the Server to accumulate a burst
             * of updates for an item, so that they can all be sent to the client,
             * despite of bandwidth or frequency limits.<BR>
             * Note that the Server may pose an upper limit on the size of its internal buffers.
             *
             * <p class="default-value"><b>Default value:</b> null, meaning to lean on the Server default based on the subscription
             * mode. This means that the buffer size will be 1 for MERGE
             * subscriptions and "unlimited" for DISTINCT subscriptions. See
             * the "General Concepts" document for further details.</p>
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
             * instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>requested_buffer_size</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param size  An integer number, representing the length of the internal queuing buffers
             * to be used in the Server. If the string "unlimited" is supplied, then no buffer
             * size limit is requested (the check is case insensitive). It is also possible
             * to supply a null value to stick to the Server default (which currently
             * depends on the subscription mode).
             * @throws IllegalStateException if the MpnSubscription is currently
             * "active".
             * @throws IllegalArgumentException if the specified value is not
             * null nor "unlimited" nor a valid positive integer number.
             *
             * @see MpnSubscription#setRequestedMaxFrequency
             */
            setRequestedBufferSize: function(size) {
                this.throwErrorIfActive();
                var n = this._convertBufferSize(size);
                if (isNaN(n)) {
                    throw new IllegalArgumentException(ValidationUtils.MAX_BUF_EXC);
                }
                this.requestedBufferSize = n;
            },

            _convertBufferSize: function(size) {
                if (size == null) {
                    return -1;
                } else if (new String(size).toLowerCase() == "unlimited") {
                    return 0;
                } else {
                    var n = parseInt(size, 10);
                    return (n > 0 ? n : NaN);
                }
            },

            /**
             * Inquiry method that can be used to read the buffer size, configured though
             * {@link MpnSubscription#setRequestedBufferSize}, to be requested to the Server for
             * this MpnSubscription.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {Number|String} An integer number, representing the buffer size to be requested to the server,
             * or the string "unlimited", or null.
             */
            getRequestedBufferSize: function() {
                if (this.requestedBufferSize == -1) {
                    return null;
                } else if (this.requestedBufferSize == 0) {
                    return "unlimited";
                } else {
                    return String(this.requestedBufferSize);
                }
            },

            /**
             * Setter method that sets the maximum update frequency to be requested to
             * Lightstreamer Server for all the items in the MpnSubscription.<BR>
             * Note that frequency limits on the items can also be set on the
             * server side and this request can only be issued in order to further
             * reduce the frequency, not to rise it beyond these limits.
             *
             * <p class="edition-note"><B>Edition Note:</B> A further global frequency limit could also be imposed by the Server,
             * depending on Edition and License Type.
             * To know what features are enabled by your license, please see the License tab of the
             * Monitoring Dashboard (by default, available at /dashboard).</p>
             *
             * <p class="default-value"><b>Default value:</b> null, meaning to lean on the Server default based on the subscription
             * mode. This consists, for all modes, in not applying any frequency
             * limit to the subscription (the same as "unlimited"); see the "General Concepts"
             * document for further details.</p>
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
             * instance is in its "inactive" state.</p>
             *
             * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
             * with argument <code>requested_max_frequency</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
             *
             * @param freq  A decimal number, representing the maximum update frequency (expressed in updates
             * per second) for each item in the Subscription; for instance, with a setting
             * of 0.5, for each single item, no more than one update every 2 seconds
             * will be received. If the string "unlimited" is supplied, then no frequency
             * limit is requested. It is also possible to supply the null value to stick
             * to the Server default (which currently corresponds to "unlimited").
             * The check for the string constants is case insensitive.
             * @throws IllegalStateException if the MpnSubscription is currently
             * "active".
             * @throws IllegalArgumentException if the specified value is not
             * null nor the special "unlimited" value nor a valid positive number.
             */
            setRequestedMaxFrequency: function(freq) {
                this.throwErrorIfActive();
                var n = this._convertFrequency(freq);
                if (isNaN(n)) {
                    throw new IllegalArgumentException("The given value is not valid for this setting; use null, 'unlimited' or a positive number instead");
                }
                this.requestedMaxFrequency = n;
            },

            _convertFrequency: function(freq) {
                if (freq == null) {
                    return -2;

                } else {
                    var strFreq = String(freq).toLowerCase();
                    if (strFreq == "unlimited") {
                        return 0;

                    } else {
                        var n = parseFloat(freq);
                        return (n > 0 ? n : NaN);
                    }
                }
            },

            /**
             * Inquiry method that can be used to read the max frequency, configured
             * through {@link MpnSubscription#setRequestedMaxFrequency}, to be requested to the
             * Server for this MpnSubscription.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {Number|String} A decimal number, representing the max frequency to be requested to the server
             * (expressed in updates per second), or the string "unlimited", or null.
             */
            getRequestedMaxFrequency: function() {
                if (this.requestedMaxFrequency == -2) {
                    return null;
                } else if (this.requestedMaxFrequency == 0) {
                    return "unlimited";
                } else {
                    return String(this.requestedMaxFrequency);
                }
            },

            /**
             * Inquiry method that can be used to read the mode specified for this
             * MpnSubscription.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the MpnSubscription mode specified in the constructor.
             */
            getMode: function() {
                return this.mode;
            },

            /**
             * The server-side unique persistent ID of the MPN subscription.<BR>
             * The ID is available only after the MPN subscription has been successfully subscribed on the server. I.e. when its status is <code>SUBSCRIBED</code> or
             * <code>TRIGGERED</code>.<BR>
             * Note: more than one MpnSubscription may exists at any given time referring to the same MPN subscription, and thus with the same subscription ID.
             * For instace, copying an MpnSubscription with the copy initializer creates a second MpnSubscription instance with the same subscription ID. Also,
             * the <code>coalescing</code> flag of {@link LightstreamerClient#subscribeMpn} may cause the assignment of a pre-existing MPN subscription ID
             * to the new subscription.<BR>
             * Two MpnSubscription objects with the same subscription ID always represent the same server-side MPN subscription. It is the client's duty to keep the status
             * and properties of these objects up to date and aligned.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the MPN subscription ID.
             */
            getSubscriptionId: function() {
                return this.PN_subscriptionId;
            },

            /* Support methods */

            throwErrorIfActive: function() {
                if (this.stateMachine.state.isActive) {
                    throw new IllegalStateException(
                            "Cannot modify an active subscription, please unsubscribe before applying any change");
                }
            },

            throwErrorIfInactiveOrUnsubscribing: function() {
                if (this.stateMachine.state == State.INACTIVE || this.stateMachine.state == State.UNSUBSCRIBING) {
                    // this is the same behavior of removing a Subscription: the error is directed to the user
                    throw new IllegalStateException("MpnSubscription is not active");
                }
            }
    };

    function State(isActive, isSubscribed, isTriggered, status, internalName) {
        this.isActive = isActive;
        this.isSubscribed = isSubscribed;
        this.isTriggered = isTriggered;
        this.status = status;
        this.internalName = internalName;
    }

    State.INACTIVE = new State(false, false, false, "UNKNOWN", "INACTIVE");
    State.SUBSCRIBING = new State(true, false, false, "ACTIVE", "SUBSCRIBING");
    State.SUBSCRIBED = new State(true, true, false, "SUBSCRIBED", "SUBSCRIBED");
    State.TRIGGERED = new State(true, true, true, "TRIGGERED", "TRIGGERED");
    State.UNSUBSCRIBING = new State(true, false, false, "UNKNOWN", "UNSUBSCRIBING");

    var StateMachine = function(subscription) {
        this.subscription = subscription;
        this.state = State.INACTIVE;
    };

    StateMachine.prototype = {

            /**
             * User wants to subscribe.
             */
            subscribe: function() {
                var event = "subscribe";
                switch (this.state) {

                case State.INACTIVE:
                    this.next(State.SUBSCRIBING, event);
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * User wants to unsubscribe.
             */
            unsubscribe: function() {
                var event = "unsubscribe";
                switch (this.state) {

                case State.SUBSCRIBING:
                case State.SUBSCRIBED:
                case State.TRIGGERED:
                    this.next(State.UNSUBSCRIBING, event);
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * Called when an unsubscription cancels a subscription not already sent over the network.
             */
            cancelSubscription: function() {
                var event = "cancelSubscription";
                switch (this.state) {

                case State.UNSUBSCRIBING:
                    this.next(State.INACTIVE, event);
                    this.subscription.dispatchEvent("onUnsubscription");
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * MPN internal adapter sends ACTIVE.
             */
            activate: function() {
                var event = "activate";
                switch (this.state) {

                case State.SUBSCRIBING:
                case State.TRIGGERED:
                    this.next(State.SUBSCRIBED, event);
                    this.subscription.dispatchEvent("onSubscription");
                    break;

                case State.UNSUBSCRIBING:
                    this.next(State.UNSUBSCRIBING, event);
                    this.subscription.dispatchEvent("onSubscription");
                    break;

                case State.SUBSCRIBED:
                    // two activations in a row can happen if the client creates a new session after a session error:
                    // the first activation happens in the first session, while the second activation happens in
                    // the second session
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * MPN internal adapter sends TRIGGERED.
             */
            trigger: function() {
                var event = "trigger";
                switch (this.state) {
                case State.SUBSCRIBING:
                case State.SUBSCRIBED:
                    this.next(State.TRIGGERED, event);
                    this.subscription.dispatchEvent("onTriggered");
                    break;

                case State.UNSUBSCRIBING:
                    this.next(State.UNSUBSCRIBING, event);
                    this.subscription.dispatchEvent("onSubscription");
                    break;

                case State.TRIGGERED:
                    // two triggers in a row can happen if the client creates a new session after a session error
                    // the first trigger happens in the first session, while the second trigger happens in
                    // the second session
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * MPN internal adapter deletes the server subscription.
             */
            onDelete: function() {
                var event = "onDelete";
                switch (this.state) {
                case State.SUBSCRIBED:
                case State.TRIGGERED:
                case State.UNSUBSCRIBING:
                    this.subscription.dispatchEvent("onUnsubscription");
                    this.next(State.INACTIVE, event);
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * Subscription request receives REQERR.
             */
            onSubscribeError: function(code, message) {
                var event = "onREQERR";
                switch (this.state) {

                case State.SUBSCRIBING:
                case State.UNSUBSCRIBING:
                    this.subscription.dispatchEvent("onSubscriptionError", [code, message]);
                    this.next(State.INACTIVE, event);
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * Unsubscription request receives REQERR.
             */
            onUnsubscribeError: function(code, message) {
                var event = "onREQERR";
                switch (this.state) {

                case State.UNSUBSCRIBING:
                    this.subscription.dispatchEvent("onUnsubscriptionError", [code, message]);
                    this.next(State.INACTIVE, event);
                    break;

                default:
                    this.throwError(event);
                }
            },

            /**
             * MPN internal adapter publishes one new server subscription starting as subscribed.
             */
            onAddSubscribed: function() {
                if (this.state != State.INACTIVE) {
                    this.throwError("onAddAsSubscribed");
                }
                this.next(State.SUBSCRIBED, "onAddAsSubscribed");
                this.subscription.dispatchEvent("onSubscription");
            },

            /**
             * MPN internal adapter publishes one new server subscription starting as triggered.
             */
            onAddTriggered: function() {
                if (this.state != State.INACTIVE) {
                    this.throwError("onAddAsTriggered");
                }
                this.next(State.TRIGGERED, "onAddAsTriggered");
                this.subscription.dispatchEvent("onTriggered");
            },

            next: function(next, event) {
                if (log.isDebugLogEnabled()) {
                    var from = this.state.internalName;
                    var to = next.internalName;
                    log.logDebug("MpnSubscription state change", this.subscription.PN_subscriptionId + " on '" + event + "': " + from + " -> " + to);
                }
                var old = this.state;
                this.state = next;
                if (old.status != next.status) {
                    this.subscription.dispatchEvent("onStatusChanged", [this.state.status, this.subscription.statusTimestamp]);
                }
            },

            throwError: function(event) {
                var msg = "Unexpected event '" + event + "' in state " + this.state.internalName + " (" + this.subscription.PN_subscriptionId + ")";
                log.logError(msg);
                throw new Error(msg);
            }
    };

    MpnSubscription.prototype["getNotificationFormat"] = MpnSubscription.prototype.getNotificationFormat;
    MpnSubscription.prototype["setNotificationFormat"] = MpnSubscription.prototype.setNotificationFormat;
    MpnSubscription.prototype["getTriggerExpression"] = MpnSubscription.prototype.getTriggerExpression;
    MpnSubscription.prototype["setTriggerExpression"] = MpnSubscription.prototype.setTriggerExpression;
    MpnSubscription.prototype["isActive"] = MpnSubscription.prototype.isActive;
    MpnSubscription.prototype["isSubscribed"] = MpnSubscription.prototype.isSubscribed;
    MpnSubscription.prototype["isTriggered"] = MpnSubscription.prototype.isTriggered;
    MpnSubscription.prototype["getStatus"] = MpnSubscription.prototype.getStatus;
    MpnSubscription.prototype["getStatusTimestamp"] = MpnSubscription.prototype.getStatusTimestamp;
    MpnSubscription.prototype["setItems"] = MpnSubscription.prototype.setItems;
    MpnSubscription.prototype["getItems"] = MpnSubscription.prototype.getItems;
    MpnSubscription.prototype["setItemGroup"] = MpnSubscription.prototype.setItemGroup;
    MpnSubscription.prototype["getItemGroup"] = MpnSubscription.prototype.getItemGroup;
    MpnSubscription.prototype["setFields"] = MpnSubscription.prototype.setFields;
    MpnSubscription.prototype["getFields"] = MpnSubscription.prototype.getFields;
    MpnSubscription.prototype["setFieldSchema"] = MpnSubscription.prototype.setFieldSchema;
    MpnSubscription.prototype["getFieldSchema"] = MpnSubscription.prototype.getFieldSchema;
    MpnSubscription.prototype["setDataAdapter"] = MpnSubscription.prototype.setDataAdapter;
    MpnSubscription.prototype["getDataAdapter"] = MpnSubscription.prototype.getDataAdapter;
    MpnSubscription.prototype["setRequestedBufferSize"] = MpnSubscription.prototype.setRequestedBufferSize;
    MpnSubscription.prototype["getRequestedBufferSize"] = MpnSubscription.prototype.getRequestedBufferSize;
    MpnSubscription.prototype["setRequestedMaxFrequency"] = MpnSubscription.prototype.setRequestedMaxFrequency;
    MpnSubscription.prototype["getRequestedMaxFrequency"] = MpnSubscription.prototype.getRequestedMaxFrequency;
    MpnSubscription.prototype["getMode"] = MpnSubscription.prototype.getMode;
    MpnSubscription.prototype["getSubscriptionId"] = MpnSubscription.prototype.getSubscriptionId;
    MpnSubscription.prototype["addListener"] = MpnSubscription.prototype.addListener;
    MpnSubscription.prototype["removeListener"] = MpnSubscription.prototype.removeListener;
    MpnSubscription.prototype["getListeners"] = MpnSubscription.prototype.getListeners;

    Inheritance(MpnSubscription,EventDispatcher);
    return MpnSubscription;
})();
