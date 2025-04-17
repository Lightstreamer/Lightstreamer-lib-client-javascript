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
import Assertions from "./utils/Assertions";
import DeviceEventManager from "./mpn/DeviceEventManager";
import IllegalArgumentException from "../src-tool/IllegalArgumentException";

export default /*@__PURE__*/(function() {
	var log = LoggerManager.getLoggerProxy(Constants.MPN);

	/**
	 * Creates an object to be used to describe an MPN device that is going to be registered to the MPN Module of Lightstreamer Server.<BR>
     * During creation the MpnDevice tries to acquires any previously registered device token from localStorage.
     * It then saves the current device token on localStorage. Saving and retrieving the previous device token is used to handle automatically
     * the cases where the token changes. The MPN Module of Lightstreamer Server is able to move
     * MPN subscriptions associated with the previous token to the new one.
     *
     * @constructor
     * @param {String} token the device token
     * @param {String} appId the application identifier
     * @param {String} platform either "Google" for Google's Firebase Cloud Messaging (FCM) or "Apple" for Apple Push Notification Service (APNs)
     *
     * @throws IllegalArgumentException if <code>token</code> or <code>appId</code> is null or <code>platform</code> is not "Google" or "Apple".
     *
	 * @exports MpnDevice
	 *
	 * @class Class representing a device that supports Web Push Notifications.<BR>
	 * It contains device details and the listener needed to monitor its status.<BR>
	 * An MPN device is created from the application identifier, the platform and a device token (a.k.a. registration token) obtained from
	 * web push notifications APIs, and must be registered on the {@link LightstreamerClient} in order to successfully subscribe an MPN subscription.
	 * See {@link MpnSubscription}.<BR>
	 * After creation, an MpnDevice object is in "unknown" state. It must then be passed to the Lightstreamer Server with the
	 * {@link LightstreamerClient#registerForMpn} method, which enables the client to subscribe MPN subscriptions and sends the device details to the
	 * server's MPN Module, where it is assigned a permanent device ID and its state is switched to "registered".<BR>
	 * Upon registration on the server, active MPN subscriptions of the device are received and exposed with the {@link LightstreamerClient#getMpnSubscriptions}
	 * method.<BR>
	 * An MpnDevice's state may become "suspended" if errors occur during push notification delivery. In this case MPN subscriptions stop sending notifications
	 * and the device state is reset to "registered" at the first subsequent registration.
	 */
    var MpnDevice = function(deviceToken, appId, platform) {
        if (deviceToken == null) {
            throw new IllegalArgumentException("Please specify a valid device token");
        }
        if (appId == null) {
            throw new IllegalArgumentException("Please specify a valid application ID");
        }
        if (platform != 'Google' && platform != 'Apple') {
            throw new IllegalArgumentException("Please specify a valid platform: Google or Apple");
        }
        this.initDispatcher();
        this.deviceToken = deviceToken;
        this.appId = appId;
        this.platform = platform;
        this.deviceId = null;
        this.statusTimestamp = 0;
        try {
            this.prevDeviceToken = window.localStorage.getItem('com.lightstreamer.mpn.device_token');
            window.localStorage.setItem('com.lightstreamer.mpn.device_token', deviceToken);
        } catch(e) {
            this.prevDeviceToken = null;
            log.error("Local storage not available", e);
        }
        this.eventManager = new DeviceEventManager(this);
        this.stateMachine = new StateMachine(this);
    };

    MpnDevice.prototype = {

            /**
             * Adds a listener that will receive events from the MpnDevice
             * instance.
             * <BR>The same listener can be added to several different MpnDevice
             * instances.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
             *
             * @param {MpnDeviceListener} listener An object that will receive the events
             * as shown in the {@link MpnDeviceListener} interface.
             * <BR>Note that the given instance does not have to implement all of the
             * methods of the MpnDeviceListener interface. In fact it may also
             * implement none of the interface methods and still be considered a valid
             * listener. In the latter case it will obviously receive no events.
             */
            addListener: function(listener) {
                this._callSuperMethod(MpnDevice, "addListener", [listener]);
            },

            /**
             * Removes a listener from the MpnDevice instance so that it
             * will not receive events anymore.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
             *
             * @param {MpnDeviceListener} listener The listener to be removed.
             */
            removeListener: function(listener) {
                this._callSuperMethod(MpnDevice, "removeListener", [listener]);
            },

            /**
             * Returns an array containing the {@link MpnDeviceListener} instances that
             * were added to this client.
             *
             * @return {MpnDeviceListener[]} an Array containing the listeners that were added to this client.
             * Listeners added multiple times are included multiple times in the array.
             */
            getListeners: function() {
                return this._callSuperMethod(MpnDevice, "getListeners");
            },

            /**
             * The platform identifier of this MPN device. It equals <code>Google</code> or <code>Apple</code> and is used by the server as part of the device identification.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the MPN device platform.
             */
            getPlatform: function() {
                return this.platform;
            },

            /**
             * The application ID of this MPN device. It is used by the server as part of the device identification.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the MPN device application ID.
             */
            getApplicationId: function() {
                return this.appId;
            },

            /**
             * The device token of this MPN device. It is passed during creation and
             * is used by the server as part of the device identification.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the MPN device token.
             */
            getDeviceToken: function() {
                return this.deviceToken;
            },

            /**
             * The previous device token of this MPN device. It is obtained automatically from
             * localStorage during creation and is used by the server to restore MPN subscriptions associated with this previous token. May be null if
             * no MPN device has been registered yet on the application.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the previous MPN device token, or null if no MPN device has been registered yet.
             */
            getPreviousDeviceToken: function() {
                return this.prevDeviceToken;
            },

            /**
             * Checks whether the MPN device object is currently registered on the server or not.<BR>
             * This flag is switched to true by server sent registration events, and back to false in case of client disconnection or server sent suspension events.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {boolean} true if the MPN device object is currently registered on the server.
             *
             * @see #getStatus
             */
            isRegistered: function() {
                return this.stateMachine.state.isRegistered;
            },

            /**
             * Checks whether the MPN device object is currently suspended on the server or not.<BR>
             * An MPN device may be suspended if errors occur during push notification delivery.<BR>
             * This flag is switched to true by server sent suspension events, and back to false in case of client disconnection or server sent resume events.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {boolean} true if the MPN device object is currently suspended on the server.
             *
             * @see #getStatus
             */
            isSuspended: function() {
                return this.stateMachine.state.isSuspended;
            },

            /**
             * The status of the device.<BR>
             * The status can be:<ul>
             * <li><code>UNKNOWN</code>: when the MPN device object has just been created or deleted. In this status {@link MpnDevice#isRegistered} and {@link MpnDevice#isSuspended} are both false.</li>
             * <li><code>REGISTERED</code>: when the MPN device object has been successfully registered on the server. In this status {@link MpnDevice#isRegistered} is true and
             * {@link MpnDevice#isSuspended} is false.</li>
             * <li><code>SUSPENDED</code>: when a server error occurred while sending push notifications to this MPN device and consequently it has been suspended. In this status
             * {@link MpnDevice#isRegistered} and {@link MpnDevice#isSuspended} are both true.</li>
             * </ul>
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the status of the device.
             *
             * @see #isRegistered
             * @see #isSuspended
             */
            getStatus: function() {
                return this.stateMachine.state.status;
            },

            /**
             * The server-side timestamp of the device status.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {Number} The server-side timestamp of the device status.
             *
             * @see #getStatus
             */
            getStatusTimestamp: function() {
                return this.statusTimestamp;
            },

            /**
             * The server-side unique persistent ID of the device.<BR>
             * The ID is available only after the MPN device object has been successfully registered on the server. I.e. when its status is <code>REGISTERED</code> or
             * <code>SUSPENDED</code>.<BR>
             * Note: a device token change, if the previous device token was correctly stored on localStorage, does not cause the device ID to change: the
             * server moves previous MPN subscriptions from the previous token to the new one and the device ID remains unaltered.
             *
             * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
             *
             * @return {String} the MPN device ID.
             */
            getDeviceId: function() {
                return this.deviceId;
            }

    };

    function State(isRegistered, isSuspended, status) {
        this.isRegistered = isRegistered;
        this.isSuspended = isSuspended;
        this.status = status;
    }

    State.UNKNOWN = new State(false, false, "UNKNOWN");
    State.REGISTERED = new State(true, false, "REGISTERED");
    State.SUSPENDED = new State(true, true, "SUSPENDED");

    var StateMachine = function(device) {
    	this.device = device;
    	this.state = State.UNKNOWN;
    };

    StateMachine.prototype = {

    		activate: function(timestamp) {
    			var event = "activate";
    			this.device.statusTimestamp = timestamp;
    			switch (this.state) {

    			case State.UNKNOWN:
    				this.next(State.REGISTERED, event);
    				this.device.dispatchEvent("onRegistered");
    				break;

    			case State.SUSPENDED:
    				this.next(State.REGISTERED, event);
    				this.device.dispatchEvent("onResumed");
    				break;

    			case State.REGISTERED:
    			    // stay registered
    	            // two activations in a row can happen if the client creates a new session after a session error:
    	            // the first activation happens in the first session, while the second activation happens in
    	            // the second session
    			    break;

    			default:
    			    this.throwError(event);
    			}
            },

            suspend: function(timestamp) {
            	var event = "suspend";
    			this.device.statusTimestamp = timestamp;
    			switch (this.state) {

    			case State.UNKNOWN:
    				this.next(State.SUSPENDED, event);
    				this.device.dispatchEvent("onSuspended");
    				break;

    			case State.REGISTERED:
    				this.next(State.SUSPENDED, event);
    				this.device.dispatchEvent("onSuspended");
    				break;

    			case State.SUSPENDED:
    			    // stay suspended
    	            // two suspensions in a row can happen if the client creates a new session after a session error
    	            // the first suspension happens in the first session, while the second suspension happens in
    	            // the second session
    			    break;

    			default:
    			    this.throwError(event);
    			}
            },

            error: function(code, message) {
                var event = "error";
                switch (this.state) {

                case State.UNKNOWN:
                    this.next(State.UNKNOWN, event);
                    this.device.dispatchEvent("onRegistrationFailed", [code, message]);
                    break;

                default:
                    this.throwError("error (" + code + " - " + message + ")");
                }
            },

            onSessionClose: function() {
                this.next(State.UNKNOWN, "onSessionClose");
            },

            next: function(next, event) {
    			if (log.isDebugLogEnabled()) {
    				var from = this.state.status;
    				var to = next.status;
    				log.logDebug("MpnDevice state change", this.device.deviceId + " on '" + event + "': " + from + " -> " + to);
    			}
    			if (next != this.state) {
    				this.state = next;
    				this.device.dispatchEvent("onStatusChanged", [this.state.status, this.device.statusTimestamp]);
    			}
    		},

    		throwError: function(event) {
    		    var msg = "Unexpected event '" + event + "' in state " + this.state.status + " (" + this.device.deviceId + ")";
    		    log.logError(msg);
    		    throw new Error(msg);
    		}
    };

    MpnDevice.prototype["getPlatform"] = MpnDevice.prototype.getPlatform;
    MpnDevice.prototype["getApplicationId"] = MpnDevice.prototype.getApplicationId;
    MpnDevice.prototype["getDeviceToken"] = MpnDevice.prototype.getDeviceToken;
    MpnDevice.prototype["getPreviousDeviceToken"] = MpnDevice.prototype.getPreviousDeviceToken;
    MpnDevice.prototype["isRegistered"] = MpnDevice.prototype.isRegistered;
    MpnDevice.prototype["isSuspended"] = MpnDevice.prototype.isSuspended;
    MpnDevice.prototype["getStatus"] = MpnDevice.prototype.getStatus;
    MpnDevice.prototype["getStatusTimestamp"] = MpnDevice.prototype.getStatusTimestamp;
    MpnDevice.prototype["getDeviceId"] = MpnDevice.prototype.getDeviceId;
    MpnDevice.prototype["addListener"] = MpnDevice.prototype.addListener;
    MpnDevice.prototype["removeListener"] = MpnDevice.prototype.removeListener;
    MpnDevice.prototype["getListeners"] = MpnDevice.prototype.getListeners;

    Inheritance(MpnDevice,EventDispatcher);
    return MpnDevice;
})();
