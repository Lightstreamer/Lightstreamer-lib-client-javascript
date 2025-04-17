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
import IllegalArgumentException from "../../src-tool/IllegalArgumentException";
import Constants from "../Constants";
import Bean from "./Bean";
import Inheritance from "../../src-tool/Inheritance";
import Global from "../Global";
import Environment from "../../src-tool/Environment";
import Utils from "../Utils";
import RetryDelayCounter from "../engine/RetryDelayCounter";
import ConnectTimeoutCounter from "../engine/ConnectTimeoutCounter";

    /*
     * WARNING
     * 
     * Unlike Java client where ConnectionOptions has references to the classes RetryDelayCounter
     * and ConnectTimeoutCounter,
     * in Javascript client RetryDelayCounter and ConnectTimeoutCounter are mixed into ConnectionOptions 
     * because ConnectionOptions
     * must be serializable (see ConnectionOptions super constructor where the method Utils.copyByValue
     * is used) but RetryDelayCounter and ConnectTimeoutCounter are not serializable (they declares methods).
     * 
     * Making RetryDelayCounter and ConnectTimeoutCounter mixins, we avoid the serialization problem 
     * but we must assure that
     *   1) there is no name clash between properties and methods of ConnectionOptions and RetryDelayCounter
     *      and ConnectTimeoutCounter
     *   2) the property names of RetryDelayCounter and ConnectTimeoutCounter are listed 
     *      in the global variable varNames (see below) because they are used for the serialization.
     */
    
  var connConstants = {};
  connConstants[Constants.HTTP_STREAMING] = true;
  connConstants[Constants.WS_POLLING] = true;
  connConstants[Constants.HTTP_POLLING] = true;
  connConstants[Constants.WS_STREAMING] = true;
  connConstants[Constants.WS_ALL] = true;
  connConstants[Constants.HTTP_ALL] = true;

  var CONNECT_TIMEOUT_DEFAULT = 4000;
  var CONNECT_TIMEOUT_LIMIT = 14000;
  var CONNECT_TIMEOUT_INCREASE = 2000;
  var AUTO = "auto";


  var WRONG_FORCED_TRANSPORT = "The given value is not valid. Use one of: HTTP-STREAMING, HTTP-POLLING, WS-STREAMING, WS-POLLING, WS, HTTP or null";
  var IMPOSSIBLE_COOKIES = "cookieHandlingRequired is only supported on Browsers";
  
  
  var varNames = {
      contentLength: "contentLength",
      idleTimeout: "idleTimeout",
      keepaliveInterval: "keepaliveInterval",
      requestedMaxBandwidth: "requestedMaxBandwidth",
      realMaxBandwidth: "realMaxBandwidth",
      pollingInterval: "pollingInterval",
      reconnectTimeout: "reconnectTimeout",
      stalledTimeout: "stalledTimeout",
      retryDelay: "retryDelay",
      firstRetryMaxDelay: "firstRetryMaxDelay",
      slowingEnabled: "slowingEnabled",
      forcedTransport: "forcedTransport",
      serverInstanceAddressIgnored: "serverInstanceAddressIgnored",
      cookieHandlingRequired: "cookieHandlingRequired",
      reverseHeartbeatInterval: "reverseHeartbeatInterval",
      earlyWSOpenEnabled: "earlyWSOpenEnabled",
      sessionRecoveryTimeout: "sessionRecoveryTimeout",
      spinFixTimeout: "spinFixTimeout",
      spinFixEnabled: "spinFixEnabled",
      xDomainStreamingEnabled: "xDomainStreamingEnabled",
      corsXHREnabled: "corsXHREnabled",
      forceBindTimeout: "forceBindTimeout", 
      switchCheckTimeout: "switchCheckTimeout",
      httpExtraHeaders : "httpExtraHeaders",
      httpExtraHeadersOnSessionCreationOnly : "httpExtraHeadersOnSessionCreationOnly",
      remoteAdapterStatusObserver: "remoteAdapterStatusObserver",
      
      /* BEGIN RetryDelayCounter properties */
      currentRetryDelay: "currentRetryDelay",
      minRetryDelay: "minRetryDelay",
      maxRetryDelay: "maxRetryDelay",
      retryAttempt: "retryAttempt",
      /* END RetryDelayCounter properties */
      
      /* BEGIN ConnectTimeoutCounter properties */
      currentConnectTimeout: "currentConnectTimeout",
      minConnectTimeout: "minConnectTimeout",
      maxConnectTimeout: "maxConnectTimeout",
      connectAttempt: "connectAttempt"
      /* END ConnectTimeoutCounter properties */
  };
  varNames = Utils.getReverse(varNames); 
  
  
  /**
   * Used by LightstreamerClient to provide an extra connection properties data object.
   * @constructor
   *
   * @exports ConnectionOptions
   * @class Data object that contains the policy settings 
   * used to connect to a Lightstreamer Server.
   * <BR/>The class constructor, its prototype and any other properties should never
   * be used directly; the library will create ConnectionOptions instances when needed.
   * <BR>Note that all the settings are applied asynchronously; this means that if a
   * CPU consuming task is performed right after the call the effect of the setting 
   * will be delayed.
   * 
   * @see LightstreamerClient
   */
  var ConnectionOptions = function() {

    
    //PUBLIC
    /**
     * @private
     */
    this.contentLength = 4000000; //4 MB
    /**
     * @private
     */
    this.idleTimeout = 19000; // idle timeout
    /**
     * @private
     */
    this.keepaliveInterval = 0;  //The requested keepalive signals interval
    /**
     * @private
     */
    this.requestedMaxBandwidth = -1; //The max bandwidth requested from the client, saved as 0 means unlimited, also a negative value means unlimited but can only be sent by the server, not set via APIs
    /**
     * @private
     */
    this.pollingInterval = 0; //The requested polling interval
    /**
     * @private
     */
    this.reconnectTimeout = 3000;  // Timeout to enter the CONNECTING status (from STALLED)
    /**
     * @private
     */
    this.stalledTimeout = 2000;  // Timeout to enter the STALLED status (from STREAMING)
    /**
     * @private
     */
    this.retryDelay = 4000;
    this.initRetryDelay(this.retryDelay); // initialize RetryDelayCounter mixin
    this.initConnectTimeout(this.retryDelay); // initialize ConnectTimeoutCounter mixin
    /**
     * @private
     */
    this.firstRetryMaxDelay = 100; //time to wait when a connection breaks before connecting again
    /**
     * @private
     */
    this.slowingEnabled = false; // Use or not the slowing algorithm
    /**
     * @private
     */
    this.forcedTransport = null; //force a specific kind of connection
    /**
     * @private
     */
    this.serverInstanceAddressIgnored = false; //if true the control link will be ignored
    /**
     * @private
     */
    this.cookieHandlingRequired = false;
    /**
     * @private
     */
    this.reverseHeartbeatInterval = 0; //if > 0 is the interval between client sent heartbeats
    /**
     * @private
     */
    this.earlyWSOpenEnabled = false;
    /**
     * @private
     */
    this.spinFixTimeout = 5000;
    /**
     * @private
     */
    this.spinFixEnabled = null; //null -> default; true -> always; false -> never
    /**
     * @private
     */
    this.httpExtraHeaders = null;
    /**
     * @private
     */
    this.httpExtraHeadersOnSessionCreationOnly = false;
    /**
     * @private
     */
    this.sessionRecoveryTimeout = 15000;
    
    //PRIVATE 
    /**
     * @private
     */
    this.xDomainStreamingEnabled = true;
    /**
     * @private
     */
    this.corsXHREnabled = true;
    /**
     * @private
     */
    this.forceBindTimeout = 2000; //how long to wait before sending another force bind request (when the previous had no effect) 
    /**
     * @private
     */
    this.switchCheckTimeout = 4000; //how long to wait before creating a new session, instead of waiting for a loop command, when a force bind has been sent
    /**
     * @private
     */
    this.remoteAdapterStatusObserver = {};
    /**
     * @private
     */
    this.varNames = varNames;
    
    this._callSuperConstructor(ConnectionOptions,arguments); 
    /**
     * @private
     */
    this.constr = "ConnectionOptions";

    
  };
  
  ConnectionOptions.prototype = {
      
    ///////////////PUBLIC
      
    /** 
     * Setter method that sets the length in bytes to be used by the Server for the 
     * response body on a stream connection (a minimum length, however, is ensured 
     * by the server). After the content length exhaustion, the connection will be 
     * closed and a new bind connection will be automatically reopened.
     * <BR>NOTE that this setting only applies to the "HTTP-STREAMING" case (i.e. not to WebSockets).
     *  
     * <p class="default-value"><b>Default value:</b> A length decided by the library, to ensure
     * the best performance. It can be of a few MB or much higher, depending on the environment.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> The content length should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next streaming connection (either a bind
     * or a brand new session).</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "contentLength" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a negative, zero, decimal
     * or a not-number value is passed.
     * 
     * @param {Number} contentLength The length to be used by the Server for the 
     * response body on a HTTP stream connection.
     */
    setContentLength: function(contentLength) {
      this.heavySetter("contentLength",this.checkPositiveNumber(contentLength));
    },
    
    /**
     * Inquiry method that gets the length expressed in bytes to be used by the Server
     * for the response body on a HTTP stream connection.
     * 
     * @return {Number} the length to be used by the Server
     * for the response body on a HTTP stream connection
     */
    getContentLength: function() {
      return this.contentLength;
    },
    
    /**
     * Setter method that sets the maximum time the Server is allowed to wait
     * for any data to be sent in response to a polling request, if none has
     * accumulated at request time. Setting this time to a nonzero value and
     * the polling interval to zero leads to an "asynchronous polling"
     * behaviour, which, on low data rates, is very similar to the streaming
     * case. Setting this time to zero and the polling interval to a nonzero
     * value, on the other hand, leads to a classical "synchronous polling".
     * <BR>Note that the Server may, in some cases, delay the answer for more
     * than the supplied time, to protect itself against a high polling rate or
     * because of bandwidth restrictions. Also, the Server may impose an upper
     * limit on the wait time, in order to be able to check for client-side
     * connection drops.
     *
     * <p class="default-value"><b>Default value:</b> 19000 (19 seconds).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> The idle timeout should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next polling request.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "idleTimeout" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a negative or a decimal
     * or a not-number value is passed.
     *
     * @param {Number} idleTimeout The time (in milliseconds) the Server is
     * allowed to wait for data to send upon polling requests.
     * 
     * @see ConnectionOptions#setPollingInterval
     */
    setIdleTimeout: function(idleTimeout) {
      this.heavySetter("idleTimeout",this.checkPositiveNumber(idleTimeout,true));
    },
    
    /**  
     * Inquiry method that gets the maximum time the Server is allowed to wait
     * for any data to be sent in response to a polling request, if none has
     * accumulated at request time. The wait time used by the Server, however,
     * may be different, because of server side restrictions.
     *
     * @return {Number} The time (in milliseconds) the Server is allowed to wait for
     * data to send upon polling requests.
     *
     * @see ConnectionOptions#setIdleTimeout
     */
    getIdleTimeout: function() {
      return this.idleTimeout;
    },
    
    /**
     * Setter method that sets the interval between two keepalive packets
     * to be sent by Lightstreamer Server on a stream connection when
     * no actual data is being transmitted. The Server may, however, impose
     * a lower limit on the keepalive interval, in order to protect itself.
     * Also, the Server may impose an upper limit on the keepalive interval,
     * in order to be able to check for client-side connection drops.
     * If 0 is specified, the interval will be decided by the Server.
     * 
     * <p class="default-value"><b>Default value:</b> 0 (meaning that the Server
     * will send keepalive packets based on its own configuration).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> The keepalive interval should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next streaming connection (either a bind
     * or a brand new session).
     * <BR>Note that, after a connection,
     * the value may be changed to the one imposed by the Server.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "keepaliveInterval" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called or that received the setting from the
     * server
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a negative or a decimal
     * or a not-number value is passed.
     *
     * @param {Number} keepaliveInterval The time, expressed in milliseconds,
     * between two keepalive packets, or 0.
     */
    setKeepaliveInterval: function(keepaliveInterval) {
      this.heavySetter("keepaliveInterval",this.checkPositiveNumber(keepaliveInterval,true));
    },
    
    /**  
     * Inquiry method that gets the interval between two keepalive packets
     * sent by Lightstreamer Server on a stream connection when no actual data
     * is being transmitted.
     * <BR>If the value has just been set and a connection to Lightstreamer
     * Server has not been established yet, the returned value is the time that
     * is being requested to the Server. Afterwards, the returned value is the time
     * used by the Server, that may be different, because of Server side constraints.
     * If the returned value is 0, it means that the interval is to be decided
     * by the Server upon the next connection.
     *
     * @return {Number} The time, expressed in milliseconds, between two keepalive
     * packets sent by the Server, or 0.
     * 
     * @see ConnectionOptions#setKeepaliveInterval
     */
    getKeepaliveInterval: function() {
      /*if (! isNaN(this.serverKeepaliveInterval)) {
        return this.serverKeepaliveInterval;
      }*/ 
      return this.keepaliveInterval;
    },
    
    /**
     * Setter method that sets the maximum bandwidth expressed in kilobits/s that can be consumed for the data coming from 
     * Lightstreamer Server. A limit on bandwidth may already be posed by the Metadata Adapter, but the client can 
     * furtherly restrict this limit. The limit applies to the bytes received in each streaming or polling connection.
     *
     * <p class="edition-note"><B>Edition Note:</B> Bandwidth Control is
	 * an optional feature, available depending on Edition and License Type.
	 * To know what features are enabled by your license, please see the License tab of the
	 * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="default-value"><b>Default value:</b> "unlimited".</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> The bandwidth limit can be set and changed at any time. If a connection is currently active, the bandwidth 
     * limit for the connection is changed on the fly. Remember that the Server may apply a different limit.
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to 
     * {@link ClientListener#onPropertyChange} with argument "requestedMaxBandwidth" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called or that received the setting from the
     * server
END_NODE_JSDOC_EXCLUDE
     * .
     * <BR>
     * Moreover, upon any change or attempt to change the limit, the Server will notify the client
     * and such notification will be received through a call to 
     * {@link ClientListener#onPropertyChange} with argument "realMaxBandwidth" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called or that received the setting from the
     * server
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @param {Number} maxBandwidth A decimal number, which represents the maximum bandwidth requested for the streaming
     * or polling connection expressed in kbps (kilobits/sec). The string "unlimited" is also allowed, to mean that
     * the maximum bandwidth can be entirely decided on the Server side (the check is case insensitive).
     * 
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number value (excluding special values) is passed.
     * 
     * @see ConnectionOptions#getRealMaxBandwidth
     */
    setRequestedMaxBandwidth: function(maxBandwidth) {
      var maxBandwidthTmp = new String(maxBandwidth);
      if (maxBandwidthTmp.toLowerCase() == "unlimited") {
        maxBandwidth = 0;
      } else {
        maxBandwidth = this.checkPositiveNumber(maxBandwidth,false,true);
      }
      
      this.heavySetter("requestedMaxBandwidth",maxBandwidth);
    },
  
    /**
     * Inquiry method that gets the maximum bandwidth that can be consumed for the data coming from 
     * Lightstreamer Server, as requested for this session.
     * The maximum bandwidth limit really applied by the Server on the session is provided by
     * {@link ConnectionOptions#getRealMaxBandwidth}
     * 
     * @return {Number|String} A decimal number, which represents the maximum bandwidth requested for the streaming
     * or polling connection expressed in kbps (kilobits/sec), or the string "unlimited".
     * 
     * @see ConnectionOptions#setRequestedMaxBandwidth
     */
    getRequestedMaxBandwidth: function() {
      if (this.requestedMaxBandwidth <= 0) {
        return "unlimited";
      }
      return this.requestedMaxBandwidth;
    },
    
    /**
     * Inquiry method that gets the maximum bandwidth that can be consumed for the data coming from 
     * Lightstreamer Server. This is the actual maximum bandwidth, in contrast with the requested
     * maximum bandwidth, returned by {@link ConnectionOptions#getRequestedMaxBandwidth}. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * or because bandwidth management is not supported (in this case it is always "unlimited"),
     * but also because of number rounding.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>If a connection to Lightstreamer Server is not currently active, null is returned;
     * soon after the connection is established, the value becomes available, as notified
     * by a call to {@link ClientListener#onPropertyChange} with argument "realMaxBandwidth".</p>
     * 
     * @return {Number|String} A decimal number, which represents the maximum bandwidth applied by the Server for the
     * streaming or polling connection expressed in kbps (kilobits/sec), or the string "unlimited", or null.
     * 
     * @see ConnectionOptions#setRequestedMaxBandwidth
     */
    getRealMaxBandwidth: function() {
        return this.realMaxBandwidth;
    },
    
    /**
     * Setter method that sets the polling interval used for polling
     * connections. The client switches from the default streaming mode
     * to polling mode when the client network infrastructure does not allow
     * streaming. Also, polling mode can be forced
     * by calling {@link ConnectionOptions#setForcedTransport} with 
     * "WS-POLLING" or "HTTP-POLLING" as parameter.
     * <BR>The polling interval affects the rate at which polling requests
     * are issued. It is the time between the start of a polling request and
     * the start of the next request. However, if the polling interval expires
     * before the first polling request has returned, then the second polling
     * request is delayed. This may happen, for instance, when the Server
     * delays the answer because of the idle timeout setting.
     * In any case, the polling interval allows for setting an upper limit
     * on the polling frequency.
     * <BR>The Server does not impose a lower limit on the client polling
     * interval.
     * However, in some cases, it may protect itself against a high polling
     * rate by delaying its answer. Network limitations and configured
     * bandwidth limits may also lower the polling rate, despite of the
     * client polling interval.
     * <BR>The Server may, however, impose an upper limit on the polling
     * interval, in order to be able to promptly detect terminated polling
     * request sequences and discard related session information.
     * 
     * 
     * <p class="default-value"><b>Default value:</b> 0 (pure "asynchronous polling" is configured).
     * </p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>The polling interval should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next polling request. 
     * <BR>Note that, after each polling request, the value may be
     * changed to the one imposed by the Server.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "pollingInterval" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called or that received the setting from the
     * server.
END_NODE_JSDOC_EXCLUDE
     * </p>
     * 
     * @throws {IllegalArgumentException} if a negative or a decimal
     * or a not-number value is passed.
     *
     * @param {Number} pollingInterval The time (in milliseconds) between
     * subsequent polling requests. Zero is a legal value too, meaning that
     * the client will issue a new polling request as soon as
     * a previous one has returned.
     * 
     * @see ConnectionOptions#setIdleTimeout
     */
    setPollingInterval: function(pollingInterval) {
      this.heavySetter("pollingInterval",this.checkPositiveNumber(pollingInterval,true));
    },
    
    /**  
     * Inquiry method that gets the polling interval used for polling
     * connections.
     * <BR>If the value has just been set and a polling request to Lightstreamer
     * Server has not been performed yet, the returned value is the polling interval that is being requested
     * to the Server. Afterwards, the returned value is the the time between
     * subsequent polling requests that is really allowed by the Server, that may be
     * different, because of Server side constraints.
     *
     * @return {Number} The time (in milliseconds) between subsequent polling requests.
     * 
     * @see ConnectionOptions#setPollingInterval
     */
    getPollingInterval: function() {
      /*if (!isNaN(this.serverPollingInterval)) {
        return this.serverPollingInterval;
      }*/
      return this.pollingInterval;
    },
    
    /**
     * Setter method that sets the time the client, after entering "STALLED" status,
     * is allowed to keep waiting for a keepalive packet or any data on a stream connection,
     * before disconnecting and trying to reconnect to the Server.
     * The new connection may be either the opening of a new session or an attempt to recovery
     * the current session, depending on the kind of interruption.
     *
     * <p class="default-value"><b>Default value:</b> 3000 (3 seconds).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "reconnectTimeout" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number 
     * value is passed.
     *
     * @param {Number} reconnectTimeout The idle time (in milliseconds)
     * allowed in "STALLED" status before trying to reconnect to the
     * Server.
     *
     * @see ConnectionOptions#setStalledTimeout
     */
    setReconnectTimeout: function(reconnectTimeout) {
      this.heavySetter("reconnectTimeout",this.checkPositiveNumber(reconnectTimeout));
    },
    
    /**  
     * Inquiry method that gets the time the client, after entering "STALLED" status,
     * is allowed to keep waiting for a keepalive packet or any data on a stream connection,
     * before disconnecting and trying to reconnect to the Server.
     *
     * @return {Number} The idle time (in milliseconds) admitted in "STALLED"
     * status before trying to reconnect to the Server.
     *
     * @see ConnectionOptions#setReconnectTimeout
     */
    getReconnectTimeout: function() {
      return this.reconnectTimeout;
    },
    
    /**
     * Setter method that sets the extra time the client is allowed
     * to wait when an expected keepalive packet has not been received on
     * a stream connection (and no actual data has arrived), before entering
     * the "STALLED" status.
     *
     * <p class="default-value"><b>Default value:</b> 2000 (2 seconds).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "stalledTimeout" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number 
     * value is passed.
     *
     * @param {Number} stalledTimeout The idle time (in milliseconds)
     * allowed before entering the "STALLED" status.
     *
     * @see ConnectionOptions#setReconnectTimeout
     */
    setStalledTimeout: function(stalledTimeout) {
      this.heavySetter("stalledTimeout",this.checkPositiveNumber(stalledTimeout));
    },
  
    /**  
     * Inquiry method that gets the extra time the client can wait
     * when an expected keepalive packet has not been received on a stream
     * connection (and no actual data has arrived), before entering the
     * "STALLED" status.
     *
     * @return {Number} The idle time (in milliseconds) admitted before entering the
     * "STALLED" status.
     *
     * @see ConnectionOptions#setStalledTimeout
     */
    getStalledTimeout: function() {
      return this.stalledTimeout;
    },
    
    /**
     * Does nothing.
     * <p>
     * <b>The method is deprecated and it has no effect.
     * To act on connection timeouts use {@link ConnectionOptions#setRetryDelay}.</b>
     */
    setConnectTimeout: function(connectTimeout) {
        // ignore: see setRetryDelay
    },


    /**
     * Returns the same value as {@link ConnectionOptions#getRetryDelay}.
     * <p>
     * <b>The method is deprecated: use {@link ConnectionOptions#getRetryDelay} instead.</b>
     */
    getConnectTimeout: function() {
        return String(this.getRetryDelay());
    },


    /**
     * Does nothing.
     * <p>
     * <b>The method is deprecated and it has no effect.
     * To act on connection timeouts, only {@link ConnectionOptions#setRetryDelay} is available.</b>
     */
    setCurrentConnectTimeout: function(currentConnectTimeout) {
        // ignore: see setRetryDelay
    },


    /**
     * Inquiry method that gets the maximum time to wait for a response to a request.
     * 
     * <p>
     * This value corresponds to the retry delay, but, in case of multiple failed attempts
     * on unresponsive connections, it can be changed dynamically by the library to higher values.
     * When this happens, the current value cannot be altered, but by issuing
     * {@link LightstreamerClient#disconnect} and {@link LightstreamerClient#connect}
     * it will restart from the retry delay.
     *
     * @return {Number} The time (in milliseconds) allowed to wait before trying a new connection.
     * 
     * @see ConnectionOptions#setRetryDelay
     */
    getCurrentConnectTimeout: function() {
        return this.currentConnectTimeout;
    },

    
    /**
     * Setter method that sets 
     * <ol>
     * <li>the minimum time to wait before trying a new connection
     * to the Server in case the previous one failed for any reason; and</li>
     * <li>the maximum time to wait for a response to a request 
     * before dropping the connection and trying with a different approach.</li>
     * </ol>
     * 
     * <p>
     * Enforcing a delay between reconnections prevents strict loops of connection attempts when these attempts
     * always fail immediately because of some persisting issue.
     * This applies both to reconnections aimed at opening a new session and to reconnections
     * aimed at attempting a recovery of the current session.<BR>
     * Note that the delay is calculated from the moment the effort to create a connection
     * is made, not from the moment the failure is detected.
     * As a consequence, when a working connection is interrupted, this timeout is usually
     * already consumed and the new attempt can be immediate (except that
     * {@link ConnectionOptions#setFirstRetryMaxDelay} will apply in this case).
     * As another consequence, when a connection attempt gets no answer and times out,
     * the new attempt will be immediate.
     * 
     * <p>
     * As a timeout on unresponsive connections, it is applied in these cases:
     * <ul>
     * <li><i>Streaming</i>: Applied on any attempt to setup the streaming connection. If after the 
     * timeout no data has arrived on the stream connection, the client may automatically switch transport 
     * or may resort to a polling connection.</li>
     * <li>Polling and pre-flight requests</i>: Applied on every connection. If after the timeout 
     * no data has arrived on the polling connection, the entire connection process restarts from scratch.</li>
     * </ul>
     * 
     * <p>
     * <b>This setting imposes only a minimum delay. In order to avoid network congestion, the library may use a longer delay if the issue preventing the
     * establishment of a session persists.</b>
     *    
     * <p class="default-value"><b>Default value:</b> 4000 (4 seconds).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "retryDelay" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number 
     * value is passed.
     * 
     * @param {Number} retryDelay The time (in milliseconds)
     * to wait before trying a new connection.
     *
     * @see ConnectionOptions#setFirstRetryMaxDelay
     * @see ConnectionOptions#getCurrentConnectTimeout
     */
    setRetryDelay: function(retryDelay) {
        var n = this.checkPositiveNumber(retryDelay);
        this.heavySetter("retryDelay", n);
        this.resetRetryDelay(n);
        this.resetConnectTimeout(n);
    },
    
    /**  
     * Inquiry method that gets the minimum time to wait before trying a new connection
     * to the Server in case the previous one failed for any reason, which is also the maximum time to wait for a response to a request 
     * before dropping the connection and trying with a different approach.
     * Note that the delay is calculated from the moment the effort to create a connection
     * is made, not from the moment the failure is detected or the connection timeout expires.
     *
     * @return {Number} The time (in milliseconds) to wait before trying a new connection.
     *
     * @see ConnectionOptions#setRetryDelay
     */
    getRetryDelay: function() {
        return this.retryDelay;
    },
    
    
    /**
     * Setter method that sets the maximum time to wait before trying a new connection to the Server
     * in case the previous one is unexpectedly closed while correctly working.
     * The new connection may be either the opening of a new session or an attempt to recovery
     * the current session, depending on the kind of interruption.
     * <BR/>The actual delay is a randomized value between 0 and this value. 
     * This randomization might help avoid a load spike on the cluster due to simultaneous reconnections, should one of 
     * the active servers be stopped. Note that this delay is only applied before the first reconnection: should such 
     * reconnection fail, only the setting of {@link ConnectionOptions#setRetryDelay} will be applied.
     *    
     * <p class="default-value"><b>Default value:</b> 100 (0.1 seconds).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "firstRetryMaxDelay" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number 
     * value is passed.
     * 
     * @param {Number} firstRetryMaxDelay The max time (in milliseconds)
     * to wait before trying a new connection. 
     */
    setFirstRetryMaxDelay: function(firstRetryMaxDelay) {
      this.heavySetter("firstRetryMaxDelay",this.checkPositiveNumber(firstRetryMaxDelay));
    },
    
    /**  
     * Inquiry method that gets the maximum time to wait before trying a new connection to the Server
     * in case the previous one is unexpectedly closed while correctly working.
     *
     * @return {Number} The max time (in milliseconds)
     * to wait before trying a new connection.
     * 
     * @see ConnectionOptions#setFirstRetryMaxDelay
     */
    getFirstRetryMaxDelay: function() {
      return this.firstRetryMaxDelay;
    },
    
    /**
     * Setter method that turns on or off the slowing algorithm. This heuristic
     * algorithm tries to detect when the client CPU is not able to keep the pace
     * of the events sent by the Server on a streaming connection. In that case,
     * an automatic transition to polling is performed.
     * <BR/>In polling, the client handles all the data before issuing the
     * next poll, hence a slow client would just delay the polls, while the Server
     * accumulates and merges the events and ensures that no obsolete data is sent.
     * <BR/>Only in very slow clients, the next polling request may be so much
     * delayed that the Server disposes the session first, because of its protection
     * timeouts. In this case, a request for a fresh session will be reissued
     * by the client and this may happen in cycle.
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next streaming connection (either a bind
     * or a brand new session).</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "slowingEnabled" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if a not boolean value is given.
     *
     * @param {boolean} slowingEnabled true or false, to enable or disable
     * the heuristic algorithm that lowers the item update frequency. 
     */
    setSlowingEnabled: function(slowingEnabled) {
      this.heavySetter("slowingEnabled",this.checkBool(slowingEnabled));
    },
    
    /**  
     * Inquiry method that checks if the slowing algorithm is enabled or not.
     *
     * @return {boolean} Whether the slowing algorithm is enabled or not.
     *
     * @see ConnectionOptions#setSlowingEnabled
     */
    isSlowingEnabled: function() {
      return this.slowingEnabled;
    },
    
    /**
     * Setter method that can be used to disable/enable the 
     * Stream-Sense algorithm and to force the client to use a fixed transport or a
     * fixed combination of a transport and a connection type. When a combination is specified the
     * Stream-Sense algorithm is completely disabled.
     * <BR>The method can be used to switch between streaming and polling connection 
     * types and between HTTP and WebSocket transports.
     * <BR>In some cases, the requested status may not be reached, because of 
     * connection or environment problems. In that case the client will continuously
     * attempt to reach the configured status.
     * <BR>Note that if the Stream-Sense algorithm is disabled, the client may still
     * enter the "CONNECTED:STREAM-SENSING" status; however, in that case,
     * if it eventually finds out that streaming is not possible, no recovery will
     * be tried.
     * 
     * <p class="default-value"><b>Default value:</b> null (full Stream-Sense enabled).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while 
     * the client is connecting or connected it will instruct to switch connection 
     * type to match the given configuration.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "forcedTransport" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if the given value is not in the list
     * of the admitted ones.
     * 
     * @param {String} forcedTransport can be one of the following:
     * <BR>
     * <ul>
     *    <li>null: the Stream-Sense algorithm is enabled and
     *    the client will automatically connect using the most appropriate
     *    transport and connection type among those made possible by the
     *    browser/environment.</li>
     *    <li>"WS": the Stream-Sense algorithm is enabled as in the null case but
     *    the client will only use WebSocket based connections. If a connection
     *    over WebSocket is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"HTTP": the Stream-Sense algorithm is enabled as in the null case but
     *    the client will only use HTTP based connections. If a connection
     *    over HTTP is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"WS-STREAMING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Streaming over WebSocket. If 
     *    Streaming over WebSocket is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"HTTP-STREAMING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Streaming over HTTP. If 
     *    Streaming over HTTP is not possible because of the browser/environment
     *    the client will not connect at all.</li> 
     *    <li>"WS-POLLING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Polling over WebSocket. If 
     *    Polling over WebSocket is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"HTTP-POLLING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Polling over HTTP. If 
     *    Polling over HTTP is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *  </ul>
     */
    setForcedTransport: function(forcedTransport) {
      if (forcedTransport !== null && !connConstants[forcedTransport]) {
        throw new IllegalArgumentException(WRONG_FORCED_TRANSPORT);
      }
      
      this.heavySetter("forcedTransport",forcedTransport);
    },
    
    /**  
     * Inquiry method that gets the value of the forced transport (if any).
     *
     * @return {String} The forced transport or null
     *
     * @see ConnectionOptions#setForcedTransport
     */
    getForcedTransport: function() {
      return this.forcedTransport;
    },


    /**
     * Setter method that can be used to disable/enable the automatic handling of 
     * server instance address that may be returned by the Lightstreamer server 
     * during session creation.
     * <BR>In fact, when a Server cluster is in place, the Server address specified 
     * through {@link ConnectionDetails#setServerAddress} can identify various Server 
     * instances; in order to ensure that all requests related to a session are 
     * issued to the same Server instance, the Server can answer to the session 
     * opening request by providing an address which uniquely identifies its own 
     * instance.
     * <BR>Setting this value to true permits to ignore that address and to always connect
     * through the address supplied in setServerAddress. This may be needed in a test
     * environment, if the Server address specified is actually a local address
     * to a specific Server instance in the cluster.
     *
     * <p class="edition-note"><B>Edition Note:</B> Server Clustering is
	 * an optional feature, available depending on Edition and License Type.
	 * To know what features are enabled by your license, please see the License tab of the
	 * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while connected, 
     * it will be applied when the next session creation request is issued.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverInstanceAddressIgnored" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     *
     * @param {boolean} serverInstanceAddressIgnored true or false, to ignore
     * or not the server instance address sent by the server.
     * 
     * @see ConnectionDetails#setServerAddress
     */
    setServerInstanceAddressIgnored: function(serverInstanceAddressIgnored) {
      this.heavySetter("serverInstanceAddressIgnored",this.checkBool(serverInstanceAddressIgnored));
    },
    
    /**  
     * Inquiry method that checks if the client is going to ignore the server
     * instance address that will possibly be sent by the server.
     *
     * @return {boolean} Whether or not to ignore the server instance address sent by the 
     * server.
     * 
     * @see ConnectionOptions#setServerInstanceAddressIgnored
     */
    isServerInstanceAddressIgnored: function() {
      return this.serverInstanceAddressIgnored;
    },
    
    /**
     * Setter method that enables/disables the cookies-are-required policy on the 
     * client side.
     * Enabling this policy will guarantee that cookies pertaining to the 
     * Lightstreamer Server will be sent with each request.
START_NODE_JSDOC_EXCLUDE
     * <BR>This holds for both cookies returned by the Server (possibly affinity cookies
     * inserted by a Load Balancer standing in between) and for cookies set by
     * other sites (for instance on the front-end page) and with a domain
     * specification which includes Lightstreamer Server host.
     * Likewise, cookies set by Lightstreamer Server and with a domain
     * specification which includes other sites will be forwarded to them.
END_NODE_JSDOC_EXCLUDE
START_WEB_JSDOC_EXCLUDE
     * <BR>This holds only for cookies returned by the Server (possibly affinity cookies
     * inserted by a Load Balancer standing in between). If other cookies received
     * by the application also pertain to Lightstreamer Server host, they must be
     * manually set through the static {@link LightstreamerClient.addCookies} method.
     * Likewise, cookies set by Lightstreamer Server and also pertaining to other hosts
     * accessed by the application must be manually extracted through the static
     * {@link LightstreamerClient.getCookies} method and handled properly.
END_WEB_JSDOC_EXCLUDE
     * <BR>On the other hand enabling this setting may prevent the client from
     * opening a streaming connection or even to connect at all depending on the
     * browser/environment.
     * 
     * <p class="default-value"><b>Default value:</b> false.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next HTTP request or WebSocket establishment.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "cookieHandlingRequired" on any 
     * {@link ClientListener} listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called.</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     * 
     * @param {boolean} cookieHandlingRequired true/false to enable/disable the 
     * cookies-are-required policy.
     */
    setCookieHandlingRequired: function(cookieHandlingRequired) {
      this.heavySetter("cookieHandlingRequired",this.checkBool(cookieHandlingRequired));
    },
    
    /**  
     * Inquiry method that checks if the client is going to connect only if it
     * can guarantee that cookies pertaining to the server will be sent.
     *
     * @return {boolean} true/false if the cookies-are-required policy is enabled or not.
     * 
     * @see ConnectionOptions#setCookieHandlingRequired
     */
    isCookieHandlingRequired: function() {
      return this.cookieHandlingRequired;
    },
    
    /**
     * Setter method that enables/disables the "early-open" of the WebSocket 
     * connection.<BR/>
     * When enabled a WebSocket is open to the address specified through
     * {@link ConnectionDetails#setServerAddress} before a potential server instance 
     * address is received during session creation. In this case if a server instance 
     * address is received, the previously open WebSocket is closed and a new one is open 
     * to the received server instance address.<br/> 
     * If disabled, the session creation is completed to verify if such
     * a server instance address is configured in the server before opening the
     * WebSocket.<BR/>
     * For these reasons this setting should be set to false if the server 
     * configuration specifies a &lt;control_link_address&gt; and/or a
     * &lt;control_link_machine_name&gt; element in its configuration;
     * viceversa it should be set to true if such elements are not set on
     * the target server(s) configuration.
     * 
     * <p class="edition-note"><B>Edition Note:</B> Server Clustering is
	 * an optional feature, available depending on Edition and License Type.
	 * To know what features are enabled by your license, please see the License tab of the
	 * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while 
     * the client already owns a session it will be applied the next time a session 
     * is requested to a server.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "earlyWSOpenEnabled" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     * 
     * @param {boolean} earlyWSOpenEnabled true/false to enable/disable the 
     * early-open of the WebSocket connection.
     * 
     * @see ConnectionOptions#setServerInstanceAddressIgnored
     */
    setEarlyWSOpenEnabled: function(earlyWSOpenEnabled) {
      this.heavySetter("earlyWSOpenEnabled",this.checkBool(earlyWSOpenEnabled));
    },
    
    /**  
     * Inquiry method that checks if the client is going to early-open the
     * WebSocket connection to the address specified in 
     * {@link ConnectionDetails#setServerAddress}.
     *
     * @return {boolean} true/false if the early-open of the WebSocket connection is 
     * enabled or not.
     * 
     * @see ConnectionOptions#setEarlyWSOpenEnabled
     */
    isEarlyWSOpenEnabled: function() {
      return this.earlyWSOpenEnabled;
    },
    
    /**
     * Setter method that enables/disables the reverse-heartbeat mechanism
     * by setting the heartbeat interval. If the given value 
     * (expressed in milliseconds) equals 0 then the reverse-heartbeat mechanism will
     * be disabled; otherwise if the given value is greater than 0 the mechanism  
     * will be enabled with the specified interval.
     * <BR>When the mechanism is active, the client will ensure that there is at most
     * the specified interval between a control request and the following one,
     * by sending empty control requests (the "reverse heartbeats") if necessary.
     * <BR>This can serve various purposes:<ul>
     * <li>Preventing the communication infrastructure from closing an inactive socket
     * that is ready for reuse for more HTTP control requests, to avoid
     * connection reestablishment overhead. However it is not 
     * guaranteed that the connection will be kept open, as the underlying TCP 
     * implementation may open a new socket each time a HTTP request needs to be sent.<BR>
     * Note that this will be done only when a session is in place.</li>
     * <li>Allowing the Server to detect when a streaming connection or Websocket
     * is interrupted but not closed. In these cases, the client eventually closes
     * the connection, but the Server cannot see that (the connection remains "half-open")
     * and just keeps trying to write.
     * This is done by notifying the timeout to the Server upon each streaming request.
     * For long polling, the {@link ConnectionOptions#setIdleTimeout} setting has a similar function.</li>
     * <li>Allowing the Server to detect cases in which the client has closed a connection
     * in HTTP streaming, but the socket is kept open by some intermediate node,
     * which keeps consuming the response.
     * This is also done by notifying the timeout to the Server upon each streaming request,
     * whereas, for long polling, the {@link ConnectionOptions#setIdleTimeout} setting has a similar function.</li>
     * </ul>
     * 
     * <p class="default-value"><b>Default value:</b> 0 (meaning that the mechanism is disabled).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the setting will be obeyed immediately, unless a higher heartbeat
     * frequency was notified to the Server for the current connection. The setting
     * will always be obeyed upon the next connection (either a bind or a brand new session).</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "reverseHeartbeatInterval" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, decimal
     * or a not-number value is passed.
     * 
     * @param {Number} reverseHeartbeatInterval the interval, expressed in milliseconds,
     * between subsequent reverse-heartbeats, or 0.
     */
    setReverseHeartbeatInterval: function(reverseHeartbeatInterval) {
      this.heavySetter("reverseHeartbeatInterval",this.checkPositiveNumber(reverseHeartbeatInterval,true));
    },
    
    /**
     * Inquiry method that gets the reverse-heartbeat interval expressed in 
     * milliseconds.
     * A 0 value is possible, meaning that the mechanism is disabled.
     * 
     * @return {Number} the reverse-heartbeat interval, or 0.
     * 
     * @see ConnectionOptions#setReverseHeartbeatInterval
     */
    getReverseHeartbeatInterval: function() {
      return this.reverseHeartbeatInterval;
    },
    
    /**
     * Setter method that enables/disables the setting of extra HTTP headers to all the 
     * request performed to the Lightstreamer server by the client.
     * Note that when the value is set WebSockets are disabled
START_NODE_JSDOC_EXCLUDE
     * (as the current browser client API does not support the setting of custom HTTP headers)
END_NODE_JSDOC_EXCLUDE
     * unless {@link ConnectionOptions#setHttpExtraHeadersOnSessionCreationOnly}
     * is set to true. <BR> Also note that
     * if the browser/environment does not have the possibility to send extra headers while 
     * some are specified through this method it will fail to connect.
     * Also note that the Content-Type header is reserved by the client library itself,
     * while other headers might be refused by the browser/environment and others might cause the
     * connection to the server to fail.
START_WEB_JSDOC_EXCLUDE
     * <BR>For instance, you cannot use this method to specify custom cookies to be sent to
     * Lightstreamer Server. Use the static {@link LightstreamerClient.addCookies} instead
     * (and {@link LightstreamerClient.getCookies} for inquiries). <BR>
END_WEB_JSDOC_EXCLUDE
START_NODE_JSDOC_EXCLUDE
     * <BR>For instance, you cannot use this method to specify custom cookies to be sent to
     * Lightstreamer Server. They can only be set and inquired through the browser's
     * document.cookie object. <BR>
END_NODE_JSDOC_EXCLUDE
     * The use of custom headers might also cause the
     * browser/environment to send an OPTIONS request to the server before opening the actual connection.
START_NODE_JSDOC_EXCLUDE
     * Finally, note that, in case of cross-origin requests, extra headers have to be authorized
     * on the server configuration file, in the cross_domain_policy element.
END_NODE_JSDOC_EXCLUDE
     * 
     * <p class="default-value"><b>Default value:</b> null (meaning no extra headers are sent).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next HTTP request or WebSocket establishment.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "httpExtraHeaders" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @param {Object} headersObj a JSON object containing header-name header-value pairs. 
     * Null can be specified to avoid extra headers to be sent.
     */
    setHttpExtraHeaders: function(headersObj) {
      //we store it and dispatch it as string so that it can be passed across windows using copyByBValue
      if (!headersObj) {
        this.heavySetter("httpExtraHeaders",null);
        return;
      }
      var headersStr = "";
      for (var i in headersObj) {
        headersStr += i +"\n"+ headersObj[i]+"\n";
      }
      
      this.heavySetter("httpExtraHeaders",headersStr);
      
    },
    
    /**
     * Inquiry method that gets the JSON object containing the extra headers
     * to be sent to the server.
     * 
     * @return {Object} the JSON object containing the extra headers
     * to be sent
     * 
     * @see ConnectionOptions#setHttpExtraHeaders
     */
    getHttpExtraHeaders: function() {
      //put together the object
      if (!this.httpExtraHeaders) {
        return this.httpExtraHeaders;
      }
      var headerObj = {};
      var headersArray = this.httpExtraHeaders.split('\n');
      
      for (var i=0; i<headersArray.length-1; i+=2 ) {
        headerObj[headersArray[i]] = headersArray[i+1];
      }
      
      return headerObj;
    },
    
    /**
     * Setter method that enables/disables a restriction on the forwarding of the extra http headers 
     * specified through {@link ConnectionOptions#setHttpExtraHeaders}.
     * If true, said headers will only be sent during the session creation process (and thus
     * will still be available to the Metadata Adapter notifyUser method) but will not
     * be sent on following requests. On the contrary, when set to true, the specified extra
     * headers will be sent to the server on every request: as a consequence, if any 
     * extra header is actually specified, WebSockets will be disabled (as the current browser
     * client API does not support the setting of custom HTTP headers).
     * 
     * <p class="default-value"><b>Default value:</b> false.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next HTTP request or WebSocket establishment.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "httpExtraHeadersOnSessionCreationOnly" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     * 
     * @param {boolean} httpExtraHeadersOnSessionCreationOnly true/false to enable/disable the 
     * restriction on extra headers forwarding.
     */
    setHttpExtraHeadersOnSessionCreationOnly: function(httpExtraHeadersOnSessionCreationOnly) {
      this.heavySetter("httpExtraHeadersOnSessionCreationOnly",this.checkBool(httpExtraHeadersOnSessionCreationOnly));
    },
    
    /**  
     * Inquiry method that checks if the restriction on the forwarding of the 
     * configured extra http headers applies or not.
     *
     * @return {boolean} true/false if the restriction applies or not.
     * 
     * @see ConnectionOptions#setHttpExtraHeadersOnSessionCreationOnly
     */
    isHttpExtraHeadersOnSessionCreationOnly: function() {
      return this.httpExtraHeadersOnSessionCreationOnly;
    },
    
    /**
     * Setter method that sets the maximum time allowed for attempts to recover
     * the current session upon an interruption, after which a new session will be created.
     * If the given value (expressed in milliseconds) equals 0, then any attempt
     * to recover the current session will be prevented in the first place.
     * <BR>In fact, in an attempt to recover the current session, the client will
     * periodically try to access the Server at the address related with the current
     * session. In some cases, this timeout, by enforcing a fresh connection attempt,
     * may prevent an infinite sequence of unsuccessful attempts to access the Server.
     * <BR>Note that, when the Server is reached, the recovery may fail due to a
     * Server side timeout on the retention of the session and the updates sent.
     * In that case, a new session will be created anyway.
     * A setting smaller than the Server timeouts may prevent such useless failures,
     * but, if too small, it may also prevent successful recovery in some cases.</p>
     * 
     * <p class="default-value"><b>Default value:</b> 15000 (15 seconds).</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "sessionRecoveryTimeout" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionOptions upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, decimal
     * or a not-number value is passed.
     * 
     * @param {Number} sessionRecoveryTimeout the maximum time allowed
     * for recovery attempts, expressed in milliseconds, including 0.
     */
    setSessionRecoveryTimeout: function(sessionRecoveryTimeout) {
      this.heavySetter("sessionRecoveryTimeout",this.checkPositiveNumber(sessionRecoveryTimeout,true));
    },
    
    /**
     * Inquiry method that gets the maximum time allowed for attempts to recover
     * the current session upon an interruption, after which a new session will be created.
     * A 0 value also means that any attempt to recover the current session is prevented
     * in the first place.
     * 
     * @return {Number} the maximum time allowed for recovery attempts, possibly 0.
     * 
     * @see ConnectionOptions#setSessionRecoveryTimeout
     */
    getSessionRecoveryTimeout: function() {
      return this.sessionRecoveryTimeout;
    },
    
    ///////////////PRIVATE
    
    /**
     * @private
     */
    hasHttpExtraHeaders: function(sessionCreation) {
      //put together the object
      if (!this.httpExtraHeaders) {
        return false;
      } else if (sessionCreation) {
        return true;
      }
      return !this.httpExtraHeadersOnSessionCreationOnly;
    },
    
    /**
     * @private
     */
    extractHttpExtraHeaders: function(sessionCreation) {
      if (!sessionCreation && this.httpExtraHeadersOnSessionCreationOnly) {
        return null;
      } else {
        return this.getHttpExtraHeaders();
      }
    },
    
    /**
     * TODO documentation
     * @private
     */
    setXDomainStreamingEnabled: function(xDomainStreamingEnabled) {
      this.heavySetter("xDomainStreamingEnabled",this.checkBool(xDomainStreamingEnabled));
    },
    
    /**
     * TODO documentation
     * @private
     */
    isXDomainStreamingEnabled: function() {
      return this.xDomainStreamingEnabled;
    },
    
    /**
     * TODO documentation
     * @private
     */
    setCorsXHREnabled: function(corsXHREnabled) {
      this.heavySetter("corsXHREnabled",this.checkBool(corsXHREnabled));
    },
    
    /**
     * TODO documentation
     * @private
     */
    isCorsXHREnabled: function() {
      return this.corsXHREnabled;
    },
    
    /**
     * TODO documentation
     * @private
     */
    setForceBindTimeout: function(_timeout) {
      this.heavySetter("forceBindTimeout",this.checkPositiveNumber(_timeout));
    },
    
    /**
     * TODO documentation
     * @private
     */
    getForceBindTimeout: function() {
      return this.forceBindTimeout;
    },
    
    /**
     * TODO documentation
     * @private
     */
    setSwitchCheckTimeout: function(_timeout) {
      this.heavySetter("switchCheckTimeout",this.checkPositiveNumber(_timeout));
    },
    
    /**
     * TODO documentation
     * @private
     */
    getSwitchCheckTimeout: function() {
      return this.switchCheckTimeout;
    },
    
    /**
     * TODO documentation
     * @private
     */
    setSpinFixTimeout: function(_timeout) {
      this.heavySetter("spinFixTimeout",this.checkPositiveNumber(_timeout));
    },
    
    /**
     * TODO documentation
     * @private
     */
    getSpinFixTimeout: function() {
      return this.spinFixTimeout;
    },
    
    /**
     * TODO documentation
     * @private
     */
    setSpinFixEnabled: function(_enabled) {
      this.heavySetter("spinFixTimeout",this._enabled === null ? null : this.checkBool(_enabled));
    },
    
    /**
     * TODO documentation
     * @private
     */
    getSpinFixEnabled: function() {
      return this.spinFixEnabled;
    },
    
    /**
     * (used by LightstreamerClient)
     * @private
     */
    installRemoteAdapterStatusObserver: function(metadataErrorCode, dataAdapterName, statusItemName, reconnectMaxDelay) {
        this.remoteAdapterStatusObserver = {
                metadataErrorCode: metadataErrorCode, 
                dataAdapterName: dataAdapterName, 
                statusItemName: statusItemName, 
                reconnectMaxDelay: reconnectMaxDelay
        };
    }
    
  };


  ConnectionOptions.prototype["setContentLength"] = ConnectionOptions.prototype.setContentLength;
  ConnectionOptions.prototype["getContentLength"] = ConnectionOptions.prototype.getContentLength;
  ConnectionOptions.prototype["setIdleTimeout"] = ConnectionOptions.prototype.setIdleTimeout;
  ConnectionOptions.prototype["getIdleTimeout"] = ConnectionOptions.prototype.getIdleTimeout;
  ConnectionOptions.prototype["setKeepaliveInterval"] = ConnectionOptions.prototype.setKeepaliveInterval;
  ConnectionOptions.prototype["getKeepaliveInterval"] = ConnectionOptions.prototype.getKeepaliveInterval;
  ConnectionOptions.prototype["setRequestedMaxBandwidth"] = ConnectionOptions.prototype.setRequestedMaxBandwidth;
  ConnectionOptions.prototype["getRequestedMaxBandwidth"] = ConnectionOptions.prototype.getRequestedMaxBandwidth;
  ConnectionOptions.prototype["getRealMaxBandwidth"] = ConnectionOptions.prototype.getRealMaxBandwidth;
  ConnectionOptions.prototype["setPollingInterval"] = ConnectionOptions.prototype.setPollingInterval;
  ConnectionOptions.prototype["getPollingInterval"] = ConnectionOptions.prototype.getPollingInterval;
  ConnectionOptions.prototype["setReconnectTimeout"] = ConnectionOptions.prototype.setReconnectTimeout;
  ConnectionOptions.prototype["getReconnectTimeout"] = ConnectionOptions.prototype.getReconnectTimeout;
  ConnectionOptions.prototype["setStalledTimeout"] = ConnectionOptions.prototype.setStalledTimeout;
  ConnectionOptions.prototype["getStalledTimeout"] = ConnectionOptions.prototype.getStalledTimeout;
  ConnectionOptions.prototype["setConnectTimeout"] = ConnectionOptions.prototype.setConnectTimeout;
  ConnectionOptions.prototype["getConnectTimeout"] = ConnectionOptions.prototype.getConnectTimeout;
  ConnectionOptions.prototype["setCurrentConnectTimeout"] = ConnectionOptions.prototype.setCurrentConnectTimeout;
  ConnectionOptions.prototype["getCurrentConnectTimeout"] = ConnectionOptions.prototype.getCurrentConnectTimeout;
  ConnectionOptions.prototype["setRetryDelay"] = ConnectionOptions.prototype.setRetryDelay;
  ConnectionOptions.prototype["getRetryDelay"] = ConnectionOptions.prototype.getRetryDelay;
  ConnectionOptions.prototype["setFirstRetryMaxDelay"] = ConnectionOptions.prototype.setFirstRetryMaxDelay;
  ConnectionOptions.prototype["getFirstRetryMaxDelay"] = ConnectionOptions.prototype.getFirstRetryMaxDelay;
  ConnectionOptions.prototype["setSlowingEnabled"] = ConnectionOptions.prototype.setSlowingEnabled;
  ConnectionOptions.prototype["isSlowingEnabled"] = ConnectionOptions.prototype.isSlowingEnabled;
  ConnectionOptions.prototype["setForcedTransport"] = ConnectionOptions.prototype.setForcedTransport;
  ConnectionOptions.prototype["getForcedTransport"] = ConnectionOptions.prototype.getForcedTransport;
  ConnectionOptions.prototype["setServerInstanceAddressIgnored"] = ConnectionOptions.prototype.setServerInstanceAddressIgnored;
  ConnectionOptions.prototype["isServerInstanceAddressIgnored"] = ConnectionOptions.prototype.isServerInstanceAddressIgnored;
  ConnectionOptions.prototype["setCookieHandlingRequired"] = ConnectionOptions.prototype.setCookieHandlingRequired;
  ConnectionOptions.prototype["isCookieHandlingRequired"] = ConnectionOptions.prototype.isCookieHandlingRequired;
  ConnectionOptions.prototype["setEarlyWSOpenEnabled"] = ConnectionOptions.prototype.setEarlyWSOpenEnabled;
  ConnectionOptions.prototype["isEarlyWSOpenEnabled"] = ConnectionOptions.prototype.isEarlyWSOpenEnabled;
  ConnectionOptions.prototype["setReverseHeartbeatInterval"] = ConnectionOptions.prototype.setReverseHeartbeatInterval;
  ConnectionOptions.prototype["getReverseHeartbeatInterval"] = ConnectionOptions.prototype.getReverseHeartbeatInterval;
  ConnectionOptions.prototype["setHttpExtraHeaders"] = ConnectionOptions.prototype.setHttpExtraHeaders;
  ConnectionOptions.prototype["getHttpExtraHeaders"] = ConnectionOptions.prototype.getHttpExtraHeaders;
  ConnectionOptions.prototype["setHttpExtraHeadersOnSessionCreationOnly"] = ConnectionOptions.prototype.setHttpExtraHeadersOnSessionCreationOnly;
  ConnectionOptions.prototype["isHttpExtraHeadersOnSessionCreationOnly"] = ConnectionOptions.prototype.isHttpExtraHeadersOnSessionCreationOnly;
  ConnectionOptions.prototype["setSessionRecoveryTimeout"] = ConnectionOptions.prototype.setSessionRecoveryTimeout;
  ConnectionOptions.prototype["getSessionRecoveryTimeout"] = ConnectionOptions.prototype.getSessionRecoveryTimeout;
  
  //
  ConnectionOptions.prototype["setXDomainStreamingEnabled"] = ConnectionOptions.prototype.setXDomainStreamingEnabled;
  ConnectionOptions.prototype["isXDomainStreamingEnabled"] = ConnectionOptions.prototype.isXDomainStreamingEnabled;
  ConnectionOptions.prototype["setCorsXHREnabled"] = ConnectionOptions.prototype.setCorsXHREnabled;
  ConnectionOptions.prototype["isCorsXHREnabled"] = ConnectionOptions.prototype.isCorsXHREnabled;
  ConnectionOptions.prototype["setForceBindTimeout"] = ConnectionOptions.prototype.setForceBindTimeout;
  ConnectionOptions.prototype["getForceBindTimeout"] = ConnectionOptions.prototype.getForceBindTimeout;
  ConnectionOptions.prototype["setSwitchCheckTimeout"] = ConnectionOptions.prototype.setSwitchCheckTimeout;
  ConnectionOptions.prototype["getSwitchCheckTimeout"] = ConnectionOptions.prototype.getSwitchCheckTimeout;
  ConnectionOptions.prototype["setSpinFixTimeout"] = ConnectionOptions.prototype.setSpinFixTimeout;
  ConnectionOptions.prototype["getSpinFixTimeout"] = ConnectionOptions.prototype.getSpinFixTimeout;
  ConnectionOptions.prototype["setSpinFixEnabled"] = ConnectionOptions.prototype.setSpinFixEnabled;
  ConnectionOptions.prototype["getSpinFixEnabled"] = ConnectionOptions.prototype.getSpinFixEnabled;

  ConnectionOptions.prototype["setRetryTimeout"] = ConnectionOptions.prototype.setRetryDelay; //keep for backward compatibility with 6.1
  ConnectionOptions.prototype["getRetryTimeout"] = ConnectionOptions.prototype.getRetryDelay; //keep for backward compatibility with 6.1
  ConnectionOptions.prototype["setIdleMillis"] = ConnectionOptions.prototype.setIdleTimeout; //keep for backward compatibility with 6.2 (and 7.0.1)
  ConnectionOptions.prototype["getIdleMillis"] = ConnectionOptions.prototype.getIdleTimeout; //keep for backward compatibility with 6.2 (and 7.0.1)
  ConnectionOptions.prototype["setKeepaliveMillis"] = ConnectionOptions.prototype.setKeepaliveInterval; //keep for backward compatibility with 6.2 (and 7.0.1)
  ConnectionOptions.prototype["getKeepaliveMillis"] = ConnectionOptions.prototype.getKeepaliveInterval; //keep for backward compatibility with 6.2 (and 7.0.1)
  ConnectionOptions.prototype["setPollingMillis"] = ConnectionOptions.prototype.setPollingInterval; //keep for backward compatibility with 6.2 (and 7.0.1)
  ConnectionOptions.prototype["getPollingMillis"] = ConnectionOptions.prototype.getPollingInterval; //keep for backward compatibility with 6.2 (and 7.0.1)
  ConnectionOptions.prototype["setReverseHeartbeatMillis"] = ConnectionOptions.prototype.setReverseHeartbeatInterval; //keep for backward compatibility with 6.2 (and 7.0.1)
  ConnectionOptions.prototype["getReverseHeartbeatMillis"] = ConnectionOptions.prototype.getReverseHeartbeatInterval; //keep for backward compatibility with 6.2 (and 7.0.1)

  Inheritance(ConnectionOptions, Bean);
  Inheritance(ConnectionOptions, RetryDelayCounter, true); // mixin  
  Inheritance(ConnectionOptions, ConnectTimeoutCounter, true); // mixin  
  export default ConnectionOptions;


