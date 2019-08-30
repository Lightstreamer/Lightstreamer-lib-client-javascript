import IllegalArgumentException from "../../src-tool/IllegalArgumentException";
import Bean from "./Bean";
import Inheritance from "../../src-tool/Inheritance";
import Environment from "../../src-tool/Environment";
import Global from "../Global";
import RequestsHelper from "../engine/RequestsHelper";
import Utils from "../Utils";
  
  var varNames = {
      serverAddress: "serverAddress",
      adapterSet: "adapterSet",
      user: "user",
      password: "password",
      serverInstanceAddress: "serverInstanceAddress",
      serverSocketName: "serverSocketName",
      sessionId: "sessionId",
      clientIp: "clientIp"
  };
  varNames = Utils.getReverse(varNames); 
  
  var doNotLogValueList = {password:true};

  
  var DEFAULT_SERVER = !Environment.isBrowser() || (location.protocol != "http:" && location.protocol != "https:")  ? null : (location.protocol + "//" + location.hostname + (location.port ? ":"+location.port : "") + "/");
  

  
  /**
   * Used by LightstreamerClient to provide a basic connection properties data object.
   * @constructor
   *
   * @exports ConnectionDetails
   * @class Data object that contains the configuration settings needed
   * to connect to a Lightstreamer Server.
   * <BR/>The class constructor, its prototype and any other properties should never
   * be used directly; the library will create ConnectionDetails instances when needed.
   * <BR>Note that all the settings are applied asynchronously; this means that if a
   * CPU consuming task is performed right after the call, the effect of the setting 
   * will be delayed.
   * 
   * @see LightstreamerClient
   */
  var ConnectionDetails = function(){
    
  
    
    //server to connect to
    //web client has a default == page's host; if loaded from file:/// the default will generate an exception during the connect call
    /**
     * @private
     */
    this.serverAddress =  DEFAULT_SERVER;
    
    //Name of the adapter set to use
    /**
     * @private
     */
    this.adapterSet = null;
    
    //User name to connect with the adapter set
    /**
     * @private
     */
    this.user = null;
    
    //Password to connect with the adapter set
    /**
     * @private
     */
    this.password = null;
    
    /**
     * @private
     */
    this.serverInstanceAddress = null;
    /**
     * @private
     */
    this.serverSocketName = null;
    /**
     * @private
     */
    this.sessionId = null;

    /**
     * @private
     */
    this.doNotLogValueList = doNotLogValueList;
    /**
     * @private
     */
    this.varNames = varNames;
    
    this._callSuperConstructor(ConnectionDetails,arguments); 
    
    /**
     * @private
     */
    this.constr = "ConnectionDetails";
    
  };
  
  ConnectionDetails.prototype = {
      
    /**
     * Setter method that sets the address of Lightstreamer Server.
START_NODE_JSDOC_EXCLUDE
     * Setting Lightstreamer Server address is not required when the front-end
     * pages are supplied by Lightstreamer Server itself (although this
     * scenario is advised only for demo purpose).
     * On the other hand, the setting should be configured if the front-end pages are
     * served by an external Web server or loaded directly from the file system or
     * the library is not running inside a browser. 
     * <BR>When the client application is downloaded from a web server, the configured
     * server address should have the same protocol as the client page itself. If this
     * requirement is not respected, the client, depending on the browser in use, 
     * may be unable to open a streaming connection and will try to resort
     * to polling. 
END_NODE_JSDOC_EXCLUDE
     * <BR>Note that the addresses specified must always have the http: or https: scheme.
     * In case WebSockets are used, the specified scheme is 
     * internally converted to match the related WebSocket protocol
     * (i.e. http becomes ws while https becomes wss).
     * 
     * <ALLEGRO_EDITION_NOTE><p class="edition-note"><B>Edition Note:</B> HTTPS is an optional
	 * feature, available depending on Edition and License Type.
	 * To know what features are enabled by your license, please see the License tab of the
	 * Monitoring Dashboard (by default, available at /dashboard).</p></ALLEGRO_EDITION_NOTE>
     * 
START_NODE_JSDOC_EXCLUDE
     * <p class="default-value"><b>Default value:</b> the address of the server
     * that supplies the library pages if any, null otherwise.</p>
END_NODE_JSDOC_EXCLUDE
     * 
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while connected, 
     * it will be applied when the next session creation request is issued.
     * <BR>This setting can also be specified in the {@link LightstreamerClient} 
     * constructor.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverAddress" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionDetails upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @throws {IllegalArgumentException} if the given address is not valid.
     *
     * @param {String} serverAddress The full address of Lightstreamer Server.
     * A null value can also be used, to restore the default value.
     * An IPv4 or IPv6 can also be used in place of a hostname, if compatible with
     * the environment in use (see the notes in the summary of this documentation).
     * Some examples of valid values include:
     * <BR>http://push.mycompany.com
     * <BR>http://push.mycompany.com:8080
     * <BR>http://79.125.7.252
     * <BR>http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]
     * <BR>http://[2001:0db8:85a3::8a2e:0370:7334]:8080
     * 
     */
    setServerAddress: function(serverAddress) {
      if (serverAddress === null) {
        serverAddress = DEFAULT_SERVER;
      } else {
        
        if (serverAddress.substr(serverAddress.length-1) != "/") {
          serverAddress+="/";
        }
        var _valid = RequestsHelper.verifyServerAddress(serverAddress);
        if (_valid !== true) {
          throw new IllegalArgumentException(_valid);
        }
         
      }
      
      this.heavySetter("serverAddress",serverAddress);
    },  
    
    /**
     * Inquiry method that gets the configured address of Lightstreamer Server.
     * 
     * @return {String} the configured address of Lightstreamer Server.
     */
    getServerAddress: function() {
      return this.serverAddress;
    },
 
    /** 
     * Setter method that sets the name of the Adapter Set mounted on 
     * Lightstreamer Server to be used to handle all requests in the session.
     * <BR>An Adapter Set defines the Metadata Adapter and one or several
     * Data Adapters. It is configured on the server side through an
     * "adapters.xml" file; the name is configured through the "id" attribute
     * in the &lt;adapters_conf&gt; element.
     *
     * <p class="default-value"><b>Default value:</b> The default Adapter Set, configured as
     * "DEFAULT" on the Server.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> The Adapter Set name should be set on the
     * {@link LightstreamerClient#connectionDetails} object before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next time a new session is 
     * requested to the server.
     * <BR>This setting can also be specified in the {@link LightstreamerClient} 
     * constructor.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "adapterSet" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionDetails upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @param {String} adapterSet The name of the Adapter Set to be used. A null value 
     * is equivalent to the "DEFAULT" name.
     */
    setAdapterSet: function(adapterSet) {
      this.heavySetter("adapterSet",adapterSet);
    },
    
    /**  
     * Inquiry method that gets the name of the Adapter Set (which defines
     * the Metadata Adapter and one or several Data Adapters) mounted on
     * Lightstreamer Server that supply all the items used in this application.
     *
     * @return {String} the name of the Adapter Set; returns null if no name
     * has been configured, so that the "DEFAULT" Adapter Set is used.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    getAdapterSet: function() {
      return this.adapterSet;
    },
        
    
    /**
     * Setter method that sets the username to be used for the authentication
     * on Lightstreamer Server when initiating the push session.
     * The Metadata Adapter is responsible for checking the credentials
     * (username and password).
     * 
     * <p class="default-value"><b>Default value:</b> If no username is supplied, no user
     * information will be sent at session initiation. The Metadata Adapter,
     * however, may still allow the session.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> The username should be set on the
     * {@link LightstreamerClient#connectionDetails} object before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next time a new session is 
     * requested to the server.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "user" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionDetails upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @param {String} user The username to be used for the authentication
     * on Lightstreamer Server. The username can be null.
     *
     * @see ConnectionDetails#setPassword
     */
    setUser: function(user) {
      this.heavySetter("user",user);
    },
    
    /**  
     * Inquiry method that gets the username to be used for the authentication
     * on Lightstreamer Server when initiating the push session.
     * 
     * @return {String} the username to be used for the authentication
     * on Lightstreamer Server; returns null if no user name
     * has been configured.
     *
     * @see ConnectionDetails#setUser
     */
    getUser: function() {
      return this.user;
    },
    
    /**
     * Setter method that sets the password to be used for the authentication
     * on Lightstreamer Server when initiating the push session.
     * The Metadata Adapter is responsible for checking the credentials
     * (username and password).
     * 
     * <p class="default-value"><b>Default value:</b> If no password is supplied, no password
     * information will be sent at session initiation. The Metadata Adapter,
     * however, may still allow the session.</p>
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> The username should be set on the
     * {@link LightstreamerClient#connectionDetails} object before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next time a new session is 
     * requested to the server.
     * <BR><b>NOTE:</b> The password string will be stored as a JavaScript
     * variable.
     * That is necessary in order to allow automatic reconnection/reauthentication
     * for fail-over. For maximum security, avoid using an actual private
     * password to authenticate on Lightstreamer Server; rather use
     * a session-id originated by your web/application server, that can be
     * checked by your Metadata Adapter.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "password" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient owning the ConnectionDetails upon 
     * which the setter was called
END_NODE_JSDOC_EXCLUDE
     * .</p>
     * 
     * @param {String} password The password to be used for the authentication
     * on Lightstreamer Server. The password can be null.
     *
     * @see ConnectionDetails#setUser
     */
    setPassword: function(password) {
      this.heavySetter("password",password);
    },
    
    /**
     * Inquiry method that gets the server address to be used to issue all requests
     * related to the current session. In fact, when a Server cluster is in
     * place, the Server address specified through 
     * {@link ConnectionDetails#setServerAddress} can identify various Server 
     * instances; in order to ensure that all requests related to a session are 
     * issued to the same Server instance, the Server can answer to the session 
     * opening request by providing an address which uniquely identifies its own 
     * instance.
     * When this is the case, this address is returned by the method;
     * otherwise, null is returned.
     * <BR>Note that the addresses will always have the http: or https: scheme.
     * In case WebSockets are used, the specified scheme is 
     * internally converted to match the related WebSocket protocol
     * (i.e. http becomes ws while https becomes wss).
     *
     * <ALLEGRO_EDITION_NOTE><p class="edition-note"><B>Edition Note:</B> Server Clustering is
	 * an optional feature, available depending on Edition and License Type.
	 * To know what features are enabled by your license, please see the License tab of the
	 * Monitoring Dashboard (by default, available at /dashboard).</p></ALLEGRO_EDITION_NOTE>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method gives a meaningful answer only when
     * a session is currently active.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverInstanceAddress" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient that received the setting from the
     * server
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @return {String} address used to issue all requests related to the current
     * session.
     */
    getServerInstanceAddress: function() { 
      return this.serverInstanceAddress;
    },
    
    /**
     * Inquiry method that gets the instance name of the Server which is
     * serving the current session. To be more precise, each answering port
     * configured on a Server instance (through a &lt;http_server&gt; or
     * &lt;https_server&gt; element in the Server configuration file) can be given
     * a different name; the name related to the port to which the session
     * opening request has been issued is returned.
     * <BR>Note that in case of polling or in case rebind requests are needed,
     * subsequent requests related to the same session may be issued to a port
     * different than the one used for the first request; the names configured
     * for those ports would not be reported. This, however, can only happen
     * when a Server cluster is in place and particular configurations for the
     * load balancer are used.
     *
     * <ALLEGRO_EDITION_NOTE><p class="edition-note"><B>Edition Note:</B> Server Clustering is
     * an optional feature, available depending on Edition and License Type.
	 * To know what features are enabled by your license, please see the License tab of the
	 * Monitoring Dashboard (by default, available at /dashboard).</p></ALLEGRO_EDITION_NOTE>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method gives a meaningful answer only when
     * a session is currently active.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverSocketName" on any 
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same 
     * connection with the LightstreamerClient that received the setting from the
     * server
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @return {String} name configured for the Server instance which is managing the
     * current session.
     */
    getServerSocketName: function() { 
      return this.serverSocketName;
    },

    /**
     * Inquiry method that gets the ID associated by the server
     * to this client session.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method gives a meaningful answer only when
     * a session is currently active.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "sessionId" on any
     * {@link ClientListener}
START_NODE_JSDOC_EXCLUDE
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient that received the setting from the
     * server
END_NODE_JSDOC_EXCLUDE
     * .</p>
     *
     * @return {String} ID assigned by the Server to this client session.
     */
    getSessionId: function() {
      return this.sessionId;
    },
    
    /**
     * Inquiry method that gets the IP address of this client as seen by the Server which is serving
     * the current session as the client remote address (note that it may not correspond to the client host;
     * for instance it may refer to an intermediate proxy). If, upon a new session, this address changes,
     * it may be a hint that the intermediary network nodes handling the connection have changed, hence the network
     * capabilities may be different. The library uses this information to optimize the connection. <BR>  
     * Note that in case of polling or in case rebind requests are needed, subsequent requests related to the same 
     * session may, in principle, expose a different IP address to the Server; these changes would not be reported.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> If a session is not currently active, null is returned;
     * soon after a session is established, the value may become available; but it is possible
     * that this information is not provided by the Server and that it will never be available.</p>
     * 
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to 
     * {@link ClientListener#onPropertyChange} with argument "clientIp" on any 
     * ClientListener listening to the related LightstreamerClient.</p>
     * 
     * @return {String} A canonical representation of an IP address (it can be either IPv4 or IPv6), or null.
     */
    getClientIp: function() {
        return this.clientIp;
    }
    
  };
  
  ConnectionDetails.prototype["setServerAddress"] = ConnectionDetails.prototype.setServerAddress;
  ConnectionDetails.prototype["getServerAddress"] = ConnectionDetails.prototype.getServerAddress;
  ConnectionDetails.prototype["setAdapterSet"] = ConnectionDetails.prototype.setAdapterSet;
  ConnectionDetails.prototype["getAdapterSet"] = ConnectionDetails.prototype.getAdapterSet;
  ConnectionDetails.prototype["setUser"] = ConnectionDetails.prototype.setUser;
  ConnectionDetails.prototype["getUser"] = ConnectionDetails.prototype.getUser;
  ConnectionDetails.prototype["setPassword"] = ConnectionDetails.prototype.setPassword;
  ConnectionDetails.prototype["getServerInstanceAddress"] = ConnectionDetails.prototype.getServerInstanceAddress;
  ConnectionDetails.prototype["getServerSocketName"] = ConnectionDetails.prototype.getServerSocketName;
  ConnectionDetails.prototype["getSessionId"] = ConnectionDetails.prototype.getSessionId;
  ConnectionDetails.prototype["getClientIp"] = ConnectionDetails.prototype.getClientIp;
  
  Inheritance(ConnectionDetails, Bean);
  export default ConnectionDetails;
  
