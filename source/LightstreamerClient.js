import Helpers from "../src-tool/Helpers";
import Global from "./Global";
import Executor from "../src-tool/Executor";
import Configuration from "./beans/Configuration";
import ConnectionOptions from "./beans/ConnectionOptions";
import ConnectionDetails from "./beans/ConnectionDetails";
import NewEngineHandler from "./pushpage/NewEngineHandler";
import ServerConnection from "./net/ServerConnection";
import MessageProxy from "./pushpage/MessageProxy";
import SubscriptionsHandler from "./subscriptions/SubscriptionsHandler";
import Inheritance from "../src-tool/Inheritance";
import Setter from "../src-tool/Setter";
import EventDispatcher from "../src-tool/EventDispatcher";
import Constants from "./Constants";
import EnvironmentStatus from "../src-tool/EnvironmentStatus";
import IllegalArgumentException from "../src-tool/IllegalArgumentException";
import Environment from "../src-tool/Environment";
import LoggerManager from "../src-log/LoggerManager";
import IllegalStateException from "../src-tool/IllegalStateException";
import ASSERT from "../src-test/ASSERT";
import PushEvents from "./engine/PushEvents";
import LightstreamerEngine from "./engine/LightstreamerEngine";
import ls_sbc from "./ls_sbc";
import BrowserDetection from "../src-tool/BrowserDetection";
import Assertions from "./utils/Assertions";
import Utils from "./Utils";
import Subscription from "./Subscription";
import MpnManager from "./mpn/MpnManager";
import WebSocketConnection from "./net/WebSocketConnection";

export default /*@__PURE__*/(function() {
  //THIS CLASS IMPLEMENTS BeanParent

  var actionsLogger = LoggerManager.getLoggerProxy(Constants.ACTIONS);
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);

  var uniqueIDCounter = 0;

  var ext_alpha_numeric = new RegExp("^[a-zA-Z0-9_]*$");

  var INVALID_SEQUENCE = "The given sequence name is not valid, use only alphanumeric characters plus underscore, or null";

  var NO_ADDRESS = "Configure the server address before trying to connect";


  /**
   * Creates an object to be configured to connect to a Lightstreamer server
   * and to handle all the communications with it.
   * It is possible to instantiate as many LightstreamerClient as needed.
   * Each LightstreamerClient is the entry point to connect to a Lightstreamer server,
   * subscribe to as many items as needed and to send messages.
START_NODE_JSDOC_EXCLUDE
   * Multiple LightstreamerClient instances may share the same connection if
   * configured to behave that way through {@link LightstreamerClient#enableSharing}.
END_NODE_JSDOC_EXCLUDE
   * @constructor
   *
   * @exports LightstreamerClient
   *
   * @throws {IllegalArgumentException} if a not valid address is passed. See
   * {@link ConnectionDetails#setServerAddress} for details.
   *
   * @param {String} [serverAddress] the address of the Lightstreamer Server to
   * which this LightstreamerClient will connect to. It is possible not to specify
   * it at all or to specify it later. See  {@link ConnectionDetails#setServerAddress}
   * for details.
   * @param {String} [adapterSet] the name of the Adapter Set mounted on Lightstreamer Server
   * to be used to handle all requests in the Session associated with this LightstreamerClient.
   * It is possible not to specify it at all or to specify it later. See
   * {@link ConnectionDetails#setAdapterSet} for details.
   *
   * @class Facade class for the management of the communication to
   * Lightstreamer Server. Used to provide configuration settings, event
   * handlers, operations for the control of the connection lifecycle,
   * {@link Subscription} handling and to send messages.
START_NODE_JSDOC_EXCLUDE
   * <BR>It can be configured to share its connection with other LightstreamerClient
   * instances (even if on different html pages) through
   * {@link LightstreamerClient#enableSharing} calls.
END_NODE_JSDOC_EXCLUDE
   */
  var LightstreamerClient = function(serverAddress, adapterSet) {

    this["C"] = LightstreamerClient;
    this._callSuperConstructor(LightstreamerClient);

    /**
     * Data object that contains options and policies for the connection to
     * the server. This instance is set up by the LightstreamerClient object at
     * its own creation.
     * <BR>Properties of this object can be overwritten by values received from a
     * Lightstreamer Server. Such changes will be notified through a
     * {@link ClientListener#onPropertyChange} event on listeners of this instance.
START_NODE_JSDOC_EXCLUDE
     * <BR>In case of a shared connection the involved LightstreamerClient instances
     * will keep this data object synchronized so that a change on a property of an object
     * of one of the instances will be reflected on all the others. Any change will
     * be notified through a {@link ClientListener#onPropertyChange} event on
     * listeners of this instance.
END_NODE_JSDOC_EXCLUDE
     *
     * @type ConnectionOptions
     *
     * @see ClientListener#onPropertyChange
     */
    this.connectionOptions = new ConnectionOptions();

    /**
     * Data object that contains the details needed to open a connection to
     * a Lightstreamer Server. This instance is set up by the LightstreamerClient object at
     * its own creation.
     * <BR>Properties of this object can be overwritten by values received from a
     * Lightstreamer Server. Such changes will be notified through a
     * {@link ClientListener#onPropertyChange} event on listeners of this instance.
START_NODE_JSDOC_EXCLUDE
     * <BR>In case of a shared connection the involved LightstreamerClient instances
     * will keep this data object synchronized so that a change on a property of an object
     * of one of the instances will be reflected on all the others. Any change will
     * be notified through a {@link ClientListener#onPropertyChange} event on
     * listeners of this instance.
END_NODE_JSDOC_EXCLUDE
     *
     * @type ConnectionDetails
     *
     * @see ClientListener#onPropertyChange
     */
    this.connectionDetails = new ConnectionDetails();

    this["connectionOptions"] = this.connectionOptions;
    this["connectionDetails"] = this.connectionDetails;

    this["connectionSharing"] = ls_sbc(this);

    this._configuration = new Configuration();
    this._policy = this.connectionOptions; //TODO can be avoided
    this._connection = this.connectionDetails;

    //this.statistics = null;

    if (serverAddress) {
      this._connection.setServerAddress(serverAddress);
    }

    if (adapterSet) {
      this._connection.setAdapterSet(adapterSet);
    }

    this._configuration.setBroadcaster(this);
    this._policy.setBroadcaster(this);
    this._connection.setBroadcaster(this);

    this.tables = new SubscriptionsHandler(this._policy);

    this.engineHandler = null;
    this.sharing = null;
    this.sharingPhase = 0;
    this.enableSharingPhase = 0;

    this.uID = ++uniqueIDCounter;
    this.messages = new MessageProxy();
    this.lastEngineStatus = Constants.DISCONNECTED;
    this.checkEngineTask = null;

    this.usedEngines = {};

    EnvironmentStatus.addUnloadHandler(this);

    /* MpnManager */
    this.mpnManager = new MpnManager(this);
  };


//START_WEB_JSDOC_EXCLUDE
  /**
   * Static method that can be used to share cookies between connections to the Server
   * (performed by this library) and connections to other sites that are performed
   * by the application. With this method, cookies received by the application
   * can be added (or replaced if already present) to the cookie set used by the
   * library to access the Server. Obviously, only cookies whose domain is compatible
   * with the Server domain will be used internally.
   *
   * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time;
   * it will affect the internal cookie set immediately and the sending of cookies
   * on future requests.</p>
   *
   * @param {String} uri String representation of the URI from which the supplied
   * cookies were received. It can be null.
   *
   * @param {String[]} cookies An array of String representations of the various
   * cookies to be added. Each cookie should be represented in the text format
   * provided for the Set-Cookie HTTP header by RFC 6265.
   *
   * @see LightstreamerClient.getCookies
   *
   * @static
   */
//END_WEB_JSDOC_EXCLUDE
  LightstreamerClient.addCookies = function(uri, cookieList) {
    if (Environment.isNodeJS()) {
      ServerConnection.addGlobalCookiesForNode(uri, cookieList);
    }
  };

//START_WEB_JSDOC_EXCLUDE
  /**
   * Static inquiry method that can be used to share cookies between connections to the Server
   * (performed by this library) and connections to other sites that are performed
   * by the application. With this method, cookies received from the Server can be
   * extracted for sending through other connections, according with the URI to be accessed.
   *
   * @param {String} uri String representation of the URI to which the cookies should
   * be sent, or null.
   *
   * @return {String[]} An array of String representations of the various cookies that can
   * be sent in a HTTP request for the specified URI. If a null URI was supplied,
   * the export of all available cookies, including expired ones, will be returned.
   * Each cookie is represented in the text format provided for the Set-Cookie HTTP header
   * by RFC 6265.
   *
   * @see LightstreamerClient.addCookies
   *
   * @static
   */
//END_WEB_JSDOC_EXCLUDE
  LightstreamerClient.getCookies = function(uri) {
    if (Environment.isNodeJS()) {
      var cookies = ServerConnection.getGlobalCookiesForNode(uri);
      var cookieValues = [];
      cookies.forEach(function(cookie_i, i, array) {
          // BEGIN ported from cookie_send in xmlhttprequest-cookie
          cookieValues.push(cookie_i.toString());
          // END ported from cookie_send in xmlhttprequest-cookie
      });
      return cookieValues;
    }
  };

  /**
   * Static method that permits to configure the logging system used by the library.
   * The logging system must respect the {@link LoggerProvider} interface. A custom
   * class can be used to wrap any third-party JavaScript logging system.
   * <BR>A ready-made LoggerProvider implementation is available within the
   * library in the form of the {@link SimpleLoggerProvider} class.
   * <BR>If no logging system is specified, all the generated log is discarded.
   * <BR>The following categories are available to be consumed:
   * <ul>
   * <li>
   * lightstreamer.stream:
   * <BR>logs socket activity on Lightstreamer Server connections;
   * <BR>at DEBUG level, read data is logged, write preparations are logged.
   * </li><li>
   * lightstreamer.protocol:
   * <BR>logs requests to Lightstreamer Server and Server answers;
   * <BR>at DEBUG level, request details and events from the Server are logged.
   * </li><li>
   * lightstreamer.session:
   * <BR>logs Server Session lifecycle events;
   * <BR>at INFO level, lifecycle events are logged;
   * <BR>at DEBUG level, lifecycle event details are logged.
   * </li><li>
   * lightstreamer.requests:
   * <BR>logs submission of control requests to the Server;
   * <BR>at WARN level, alert events from the Server are logged;
   * <BR>at INFO level, submission of control requests is logged;
   * <BR>at DEBUG level, requests batching and handling details are logged.
   * </li><li>
   * lightstreamer.subscriptions:
   * <BR>logs subscription requests and the related updates;
   * <BR>at INFO level, subscriptions and unsubscriptions are logged;
   * <BR>at DEBUG level, requests handling details are logged.
   * </li><li>
   * lightstreamer.messages:
   * <BR>logs sendMessage requests and the related updates;
   * <BR>at INFO level, sendMessage operations are logged;
   * <BR>at DEBUG level, request handling details are logged.
   * </li><li>
   * lightstreamer.actions:
   * <BR>logs settings / API calls.
   * </li>
START_NODE_JSDOC_EXCLUDE
   * <li>
   * lightstreamer.grids:
   * <BR>logs grid-related code.
   * </li><li>
   * lightstreamer.sharing:
   * <BR>logs creation / sharing / election of the Master and Slave
   * {@link LightstreamerClient};
   * <BR>at WARN level, problems getting a connection up and ready are logged;
   * <BR>at INFO level, found/lost events are logged;
   * <BR>at DEBUG level, connection management details and regular checks on the current connection are logged.
   * </li>
END_NODE_JSDOC_EXCLUDE
   * </ul>
   *
   * @param {LoggerProvider} provider A LoggerProvider instance that will be used
   * to generate log messages by the library classes.
   *
   * @static
   */
  LightstreamerClient.setLoggerProvider = function(provider) {
    LoggerManager.setLoggerProvider(provider);
  };

  /**
   * A constant string representing the name of the library.
   *
   * @type String
   */
  LightstreamerClient.LIB_NAME = Constants.LIBRARY_TAG;

  /**
   * A constant string representing the version of the library.
   *
   * @type String
   */
  LightstreamerClient.LIB_VERSION = Constants.LIBRARY_VERSION + " build " + Constants.BUILD;


  /**
   * @private
   */
  LightstreamerClient["simulateSilence"] = function(silence) {
    //used to test STALLED
    PushEvents.simulateSilence(silence);
  };


  LightstreamerClient.prototype = {

      toString: function() {
        return ["[","LightstreamerClient",this.uID,this.statusPhase,this.initPhase,"]"].join("|");
      },

      getTablesHandler: function() {
        return this.tables;
      },

      getMessageProxy: function() {
        return this.messages;
      },

      getEngineHandler: function() {
        return this.engineHandler;
      },

      setEngineHandler: function(newEh) {
        this.engineHandler = newEh;
        this.tables.switchEngineHandler(newEh);
        this.messages.switchEngineHandler(newEh);
        this.setEnginePhase = this.enableSharingPhase;

        this.checkEngineTask = Executor.addRepetitiveTask(newEh.checkDeath,5000,newEh);
      },

      clearEngineHandler: function() {
        if (this.engineHandler) {
          //we already have an engine, kill this one, start another

          this.usedEngines[this.engineHandler.getEngineId()] = true;

          this.tables.switchEngineHandler(null);
          this.messages.switchEngineHandler(null);

          if (this.checkEngineTask) {
            Executor.stopRepetitiveTask(this.checkEngineTask);
            this.checkEngineTask = null;
          }

          this.engineHandler.dispose();
          this.engineHandler = null;

          if (this.master) {
            this.master.dispose();
            this.master = null;
          }

          if (this._configuration.connectionRequested) {
            this.cacheEngineStatus(Constants.WILL_RETRY);
          } else {
            this.cacheEngineStatus(Constants.DISCONNECTED);
          }
        }

        if (this.search) {
          this.search.stop();
          this.search = null;
        }
      },

      broadcastSetting: function(objClass,prop,val) {
        if (this.engineHandler) {
          this.engineHandler.onClientConfigurationChange(objClass,prop,val);
        }

        return true;
      },

      notifyOptionChange: function(prop,inst) {
        //README if this method is changed take a look to lsClient of the appfiles: it contains a hack on this method
        if (inst != this._configuration) {
          this.dispatchEvent("onPropertyChange",[prop]);
        }
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Configures the client to share its connection and/or attach to a shared connection.
       * Different windows trying to share the connection to Lightstreamer Server must share the
       * exact same origin. Depending on the browser in use, connection sharing might not work.
       * Specify null to prevent any kind of sharing (this is also the default). In case
       * a connection is not currently required (i.e. the client is in DISCONNECTED status)
       * specifying null will also have the effect to dismiss resources currently held by the
       * client: failing to do that when a LightstreamerClient instance is not needed anymore
       * might prevent the VM from collecting all the allocated resources. Note that in this case
       * required resources will be prepared again once a call to {@link LightstreamerClient#connect}
       * is performed.
       *
       * <p class="default-value"><b>Default value:</b> by default no sharing is configured.</p>
       *
       * <p class="lifecycle"><b>Lifecycle:</b> this method can be called at any time.
       * <BR>Note that if multiple calls to this method are performed, the last one will
       * override the previous ones. Also if a call to enableSharing is made on a
       * Master client, the current connection (if any) will be dropped and the
       * remaining clients will enter the election algorithm.</p>
       *
       * @param {ConnectionSharing} sharing The sharing parameters or null to prevent any sharing
       */
// END_NODE_JSDOC_EXCLUDE
      enableSharing: function(sharing) {
        if (this.mpnRequested) {
            throw new IllegalStateException("Sharing is not available when MPN is enabled");
        }
        var userAgent = Environment.isBrowser() ? navigator.userAgent.toLowerCase() : null;
        if (userAgent != null && (userAgent.indexOf("ucbrowser") != -1 || userAgent.indexOf("ubrowser") != -1)) {
            sharingLogger.logInfo("Sharing is not available on UCBrowser");
            return;
        }
        this.enableSharingPhase++;
        Executor.addTimedTask(this.enableSharingExec,0,this,[sharing,this.enableSharingPhase]);
        this.sharingRequested = (sharing != null);
      },

      enableSharingExec: function(sharing,ph) {
        if (ph != this.enableSharingPhase) {
          return;
        }

        this.sharingPhase++;

        this.clearEngineHandler();

        this.sharing = sharing;
        if (sharing && ! sharing.isPossible()) {
            sharingLogger.logInfo("Connection sharing is not available");
        }
        if (sharing && sharing.isPossible()) {

          var ph = this.sharingPhase;
          var that = this;
          var nowSearching = sharing.findEngine(this);

          this.search = nowSearching;
          this.search.find(this.usedEngines)["then"](function(eh) {
            if(ph != that.sharingPhase) {
              return;
            }

            if (that.search.noHope == true) {
              that.sharing.noHope();
            }

            if (eh === null) {
              that.setupOwnEngine(ph,nowSearching.getCheckedEngineList()); //avoid suicide for an engine we failed to connect to
            } else {
              that.setEngineHandler(eh);
            }
          }, function() {
            if(ph != that.sharingPhase) {
              return;
            }
            that.dispatchEvent("onShareAbort");
          });


        } else if (sharing == null && this._configuration.connectionRequested) {
          this.setupOwnEngine();
        } //else { //no engine currently needed

      },

      /**
       * @private
       * @param suicided
       * @param noHopeToAttachToAnotherEngine if true, the client must not try to attach to another engine
       */
      engineMourningRoom: function(suicided, noHopeToAttachToAnotherEngine) {
        if (this.setEnginePhase != this.enableSharingPhase) {
          return;
        }
        //if we disposed the engine we won't reach this point as the clearEngineHandler in the enableSharing
        //prevents us from receiving the notification

        this.clearEngineHandler();

        if (EnvironmentStatus.isUnloading() || EnvironmentStatus.isUnloaded()) {
          actionsLogger.logInfo("Page is closing, won't search a new engine");
          return;
        }

//>>excludeStart("debugExclude", pragmas.debugExclude);
        if (!this.sharing) {
          ASSERT.fail();
          actionsLogger.logError("no sharing on mourning room?");
          return;
        }
//>>excludeEnd("debugExclude");

        actionsLogger.logInfo("Sharing lost, trying to obtain a new one");

        //to avoid conflicts, we must delay the creation of the engine by giving the search algorithm
        //more time between the two checks that convinces him he is alone
        var aloneTimeout = null;
        if (this._configuration.clientsCount <= 2) {
          //when the engine died there was at most one other page, leave the default alone-timeout (default is very short)
        } else if (suicided) {
          //in the suicided case there was a conflict, so leave more time (there should already be an alive engine somewhere)
          aloneTimeout = 10000;
        } else {

          //if everyone has the same timeout we get a ton of collisions
          //there are currently -1 clients wondering if it is proper to create an engine

          aloneTimeout = 200 + Helpers.randomG(this._configuration.clientsCount) * 500;
          if (aloneTimeout > 5000) {
            aloneTimeout = 5000; //keep a decent limit for the worst case scenario
          }

        }

        var newSharing = this.sharing.convertToElectionVersion(aloneTimeout, noHopeToAttachToAnotherEngine);
        this.enableSharingExec(newSharing,this.setEnginePhase);

      },

      unloadEvent: function() {
        // destroy the session when the browser tab is closed
        this.disconnect();
        if (this.engineHandler) {
          this.engineHandler.clientDeath();
        }
      },

      /**
       * @private
       */
      setupOwnEngine: function(ph,dontDieFor) {
        if (ph && ph != this.sharingPhase) {
          return;
        }
        this.setEngineHandler(new NewEngineHandler(this));
        this.master = new LightstreamerEngine(
                this._configuration,
                this._policy,
                this._connection,
                this.sharing,
                this.engineHandler,
                dontDieFor,
                this.mpnManager);
        this.engineHandler.setEngineId(this.master.getEngineId());
        this.engineHandler.setSessionPhase(this.master.getSessionPhase());

        return this.engineHandler;
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Inquiry method that checks if the LightstreamerClient has its own connection or if it is using
       * a connection shared by another LightstreamerClient.
       * This LightstreamerClient is not a Master if:
       * <ul>
       * <li>it is attached to another LightstreamerClient connection</li>
       * <li>no call to {@link LightstreamerClient#connect} or {@link LightstreamerClient#enableSharing}
       * was performed on it.</li>
       * <li>the {@link ClientListener#onShareAbort} event has been fired and no following
       * {@link LightstreamerClient#enableSharing} has been performed.</li>
       * <li>a call to {@link LightstreamerClient#enableSharing} has been performed and the client is currently
       * searching for a shared connection</li>
       * <li>a call to {@link LightstreamerClient#enableSharing} has been performed with null as parameter and no
       * subsequent call to connect has been performed</li>
       *
       * @return {boolean} Whenever the LightstreamerClient owning this instance is a Master or not.
       *
       * @see ConnectionSharing
       */
// END_NODE_JSDOC_EXCLUDE
      isMaster: function() {
        return this.master != null;
      },


      /**
       * Operation method that requests to open a Session against the configured
       * Lightstreamer Server.
       * <BR>When connect() is called, unless a single transport was forced through
       * {@link ConnectionOptions#setForcedTransport},
       * the so called "Stream-Sense" mechanism is started: if the client does not
       * receive any answer for some seconds from the streaming connection, then it
       * will automatically open a polling connection.
       * <BR>A polling connection may also be opened if the environment is not suitable
       * for a streaming connection.
START_NODE_JSDOC_EXCLUDE
       * <BR>When connect() is used to activate the Lightstreamer
       * Session on page start up, it is suggested to make this call as the
       * latest action of the scripts in the page. Otherwise, if the stream
       * connection is opened but third-party scripts are consuming most of the
       * CPU for page initialization (initial rendering, etc.), the parsing
       * of the streaming response could be delayed to the point that the Client
       * switches to polling mode. This is usually not the case nowadays but may
       * still happen if the client is used on old machines.
       * <BR>In case of a shared connection the connect call will apply to such
       * shared connection regardless of which LightstreamerClient is calling it.
       * <BR>If {@link LightstreamerClient#enableSharing} has not been called before the
       * first call to connect, then a default call will be performed with the
       * following parameter:
       * <BR><CODE>new ConnectionSharing("randomstring","IGNORE", "CREATE", true, null);</CODE>
END_NODE_JSDOC_EXCLUDE
       * <BR>Note that as "polling connection" we mean a loop of polling
       * requests, each of which requires opening a synchronous (i.e. not
       * streaming) connection to Lightstreamer Server.
       *
       * <p class="lifecycle"><b>Lifecycle:</b>
       * Note that the request to connect is accomplished by the client
       * asynchronously; this means that an invocation to {@link LightstreamerClient#getStatus}
       * right after connect() might not reflect the change yet. Also if a
       * CPU consuming task is performed right after the call the connection will
       * be delayed.
       * <BR>When the request to connect is finally being executed, if the current status
       * of the client is not DISCONNECTED, then nothing will be done.</p>
       *
START_NODE_JSDOC_EXCLUDE
       * @throws {IllegalStateException} if the LightstreamerClient cannot
       * connect to the server due to the sharing policies configured in the
       * {@link ConnectionSharing} object.
       * @see ConnectionSharing
       *
END_NODE_JSDOC_EXCLUDE
       * @throws {IllegalStateException} if no server address was configured
       * and there is no suitable default address to be used.
       *
       * @see LightstreamerClient#getStatus
       * @see LightstreamerClient#disconnect
       * @see ClientListener#onStatusChange
       * @see ConnectionDetails#setServerAddress
       */
      connect: function() {
        if (!this._connection.serverAddress) {
          throw new IllegalStateException(NO_ADDRESS);
        }

        actionsLogger.logInfo("Connect requested");

        //this.startupStatistics();


        Executor.addTimedTask(this.asynchConnect,0,this);
      },

      asynchConnect: function() {
        if (this.lastEngineStatus) {
          // if executed while not DISCONNECTED it will be ignored.
          if(this.lastEngineStatus != Constants.DISCONNECTED){
            // note: this case includes DISCONNECTED:WILL-RETRY and DISCONNECTED:TRYING-RECOVERY.
            return;
          }
        }

        if ((this.sharing == null || ! this.sharing.isPossible()) && !this.master) {
          this.setupOwnEngine();
        }

        actionsLogger.logDebug("Executing connect");

        this._configuration.simpleSetter('connectionRequested',true);

        var eh = this.getEngineHandler();
        if (eh) {
          eh.callConnect();
        }
      },
      /*
      startupStatistics: function() {
        this.dismissStatistics();
        this.statistics = new StatusStatistics();
        this.addListener(this.statistics);
      },

      dismissStatistics: function() {
        if (this.statistics) {
          this.statistics.dismiss();
          this.removeListener(this.statistics);
          delete this.statistics;
        }
      },
      */

      /**
       * Operation method that requests to close the Session opened against the
       * configured Lightstreamer Server (if any).
       * <BR>When disconnect() is called, the "Stream-Sense" mechanism is stopped.
       * <BR>Note that active {@link Subscription} instances, associated with this
       * LightstreamerClient instance, are preserved to be re-subscribed to on future
       * Sessions.
START_NODE_JSDOC_EXCLUDE
       * <BR>In case of a shared connection, the disconnect() call will apply to such
       * shared connection regardless of which LightstreamerClient is calling it.
END_NODE_JSDOC_EXCLUDE
       *
       * <p class="lifecycle"><b>Lifecycle:</b>
       * Note that the request to disconnect is accomplished by the client
       * asynchronously; this means that an invocation to {@link LightstreamerClient#getStatus}
       * right after disconnect() might not reflect the change yet. Also if a
       * CPU consuming task is performed right after the call the disconnection will
       * be delayed.
       * <BR>When the request to disconnect is finally being executed, if the status of the client is
       * "DISCONNECTED", then nothing will be done.</p>
       */
      disconnect: function() {
        actionsLogger.logInfo("Disconnect requested");

        //this.dismissStatistics();

        Executor.addTimedTask(this.asynchDisconnect,0,this);
      },

      asynchDisconnect: function() {

        actionsLogger.logDebug("Executing disconnect");

        this._configuration.simpleSetter('connectionRequested',false);

        var eh = this.getEngineHandler();
        if (eh) {
          eh.callDisconnect();
        }
      },

      /**
       * Inquiry method that gets the current client status and transport
       * (when applicable).
       *
       * @return {String} The current client status. It can be one of the following
       * values:
       * <ul>
       * <li>"CONNECTING" the client is waiting for a Server's response in order
       * to establish a connection;</li>
       * <li>"CONNECTED:STREAM-SENSING" the client has received a preliminary
       * response from the server and is currently verifying if a streaming connection
       * is possible;</li>
       * <li>"CONNECTED:WS-STREAMING" a streaming connection over WebSocket is active;</li>
       * <li>"CONNECTED:HTTP-STREAMING" a streaming connection over HTTP is active;</li>
       * <li>"CONNECTED:WS-POLLING" a polling connection over WebSocket is in progress;</li>
       * <li>"CONNECTED:HTTP-POLLING" a polling connection over HTTP is in progress;</li>
       * <li>"STALLED" the Server has not been sending data on an active
       * streaming connection for longer than a configured time;</li>
       * <li>"DISCONNECTED:WILL-RETRY" no connection is currently active but one will
       * be opened (possibly after a timeout).</li>
       * <li>"DISCONNECTED:TRYING-RECOVERY" no connection is currently active,
       * but one will be opened as soon as possible, as an attempt to recover
       * the current session after a connection issue;</li>
       * <li>"DISCONNECTED" no connection is currently active;</li>
       * </ul>
       *
       * @see ClientListener#onStatusChange
       */
      getStatus: function() {
        return this.lastEngineStatus;
      },

      /**
       * Operation method that sends a message to the Server. The message is
       * interpreted and handled by the Metadata Adapter associated to the
       * current Session. This operation supports in-order guaranteed message
       * delivery with automatic batching. In other words, messages are
       * guaranteed to arrive exactly once and respecting the original order,
       * whatever is the underlying transport (HTTP or WebSockets). Furthermore,
       * high frequency messages are automatically batched, if necessary,
       * to reduce network round trips.
       * <BR>Upon subsequent calls to the method, the sequential management of
       * the involved messages is guaranteed. The ordering is determined by the
       * order in which the calls to sendMessage are issued
START_NODE_JSDOC_EXCLUDE
       * ; in case of calls
       * issued from different LightstreamerClient instances on different html pages
       * sharing the same connection, the relative order is determined by the client
       * owning the shared connection. Anyway two messages sent through the same
       * LightstreamerClient instance will never surpass each other
END_NODE_JSDOC_EXCLUDE
       * .
       * <BR>If a message, for any reason, doesn't reach the Server (this is possible with the HTTP transport),
       * it will be resent; however, this may cause the subsequent messages to be delayed.
       * For this reason, each message can specify a "delayTimeout", which is the longest time the message, after
       * reaching the Server, can be kept waiting if one of more preceding messages haven't been received yet.
       * If the "delayTimeout" expires, these preceding messages will be discarded; any discarded message
       * will be notified to the listener through {@link ClientMessageListener#onDiscarded}.
       * Note that, because of the parallel transport of the messages, if a zero or very low timeout is 
       * set for a message and the previous message was sent immediately before, it is possible that the
       * latter gets discarded even if no communication issues occur.
       * The Server may also enforce its own timeout on missing messages, to prevent keeping the subsequent
       * messages for long time.
       * <BR>Sequence identifiers can also be associated with the messages.
       * In this case, the sequential management is restricted to all subsets
       * of messages with the same sequence identifier associated.
       * <BR>Notifications of the operation outcome can be received by supplying
       * a suitable listener. The supplied listener is guaranteed to be eventually
       * invoked; listeners associated with a sequence are guaranteed to be invoked
       * sequentially.
       * <BR>The "UNORDERED_MESSAGES" sequence name has a special meaning.
       * For such a sequence, immediate processing is guaranteed, while strict
       * ordering and even sequentialization of the processing is not enforced.
       * Likewise, strict ordering of the notifications is not enforced.
       * However, messages that, for any reason, should fail to reach the Server
       * whereas subsequent messages had succeeded, might still be discarded after
       * a server-side timeout, in order to ensure that the listener eventually gets a notification.
       * <BR>Moreover, if "UNORDERED_MESSAGES" is used and no listener is supplied,
       * a "fire and forget" scenario is assumed. In this case, no checks on
       * missing, duplicated or overtaken messages are performed at all, so as to
       * optimize the processing and allow the highest possible throughput.
       *
       * <p class="lifecycle"><b>Lifecycle:</b> Since a message is handled by the Metadata
       * Adapter associated to the current connection, a message can be sent
       * only if a connection is currently active.
       * If the special enqueueWhileDisconnected flag is specified it is possible to
       * call the method at any time and the client will take care of sending the
       * message as soon as a connection is available, otherwise, if the current status
       * is "DISCONNECTED*", the message will be abandoned and the
       * {@link ClientMessageListener#onAbort} event will be fired.
       * <BR>Note that, in any case, as soon as the status switches again to
       * "DISCONNECTED*", any message still pending is aborted, including messages
       * that were queued with the enqueueWhileDisconnected flag set to true.
       * <BR>Also note that forwarding of the message to the server is made
       * asynchronously; this means that if a CPU consuming task is
       * performed right after the call, the message will be delayed. Hence,
       * if a message is sent while the connection is active, it could be aborted
       * because of a subsequent disconnection. In the same way a message sent
       * while the connection is not active might be sent because of a subsequent
       * connection.</p>
       *
       * @throws: {IllegalArgumentException} if the given sequence name is
       * invalid.
       * @throws: {IllegalArgumentException} if NaN or a negative value is
       * given as delayTimeout.
       *
       * @param {String} msg a text message, whose interpretation is entirely
       * demanded to the Metadata Adapter associated to the current connection.
       * @param {String} [sequence="UNORDERED_MESSAGES"] an alphanumeric identifier, used to
       * identify a subset of messages to be managed in sequence; underscore
       * characters are also allowed. If the "UNORDERED_MESSAGES" identifier is
       * supplied, the message will be processed in the special way described
       * above.
       * <BR>The parameter is optional; if not supplied, "UNORDERED_MESSAGES" is used
       * as the sequence name.
       * @param {Number} [delayTimeout] a timeout, expressed in milliseconds.
       * If higher than the Server configured timeout on missing messages,
       * the latter will be used instead. <BR>
       * The parameter is optional; if not supplied, the Server configured timeout on missing
       * messages will be applied.
       * <BR>This timeout is ignored for the special "UNORDERED_MESSAGES" sequence,
       * although a server-side timeout on missing messages still applies.
       * @param {ClientMessageListener} [listener] an
       * object suitable for receiving notifications about the processing outcome.
       * <BR>The parameter is optional; if not supplied, no notification will be
       * available.
       * @param {boolean} [enqueueWhileDisconnected=false] if this flag is set to true, and
       * the client is in a disconnected status when the provided message
       * is handled, then the message is not aborted right away but is queued waiting
       * for a new session. Note that the message can still be aborted later when a new
       * session is established.
       */
      sendMessage: function(msg,sequence,delayTimeout,listener,enqueueWhileDisconnected) {
        if (!sequence) {
          sequence = Constants._UNORDERED_MESSAGES;
        } else if (!ext_alpha_numeric.test(sequence)){
          throw new IllegalArgumentException(INVALID_SEQUENCE);
        }

        //If a timeout is given it must be a number.
        //the values that return false from if(delayTimeout) are 0 null undefined and ""
        if (delayTimeout || delayTimeout == 0) {
          delayTimeout = this.checkPositiveNumber(delayTimeout, true);
        } else {
          delayTimeout = null;
        }

        enqueueWhileDisconnected = this.checkBool(enqueueWhileDisconnected,true);

        Executor.addTimedTask(this.asyncSendMessage,0,this,[msg,sequence,listener,delayTimeout,enqueueWhileDisconnected]);

      },

      asyncSendMessage: function(msg,sequence,listener,_timeout,enqueueWhileDisconnected) {

        if (this.engineHandler && this.engineHandler.isSessionAlive()) {
          this.messages.forwardMessage(msg,sequence,listener,_timeout);

        } else if (enqueueWhileDisconnected) {
          //we enqueue
          this.messages.enqueueMessage(msg,sequence,listener,_timeout);

        } else if (listener) {
          //we abort immediately
          //this.messages.messageAbort(listenerProxy.prog);//can't use this as we don't have the listenerProxy
          this.messages.fireEvent("onAbort",listener,[msg,false]);
        } //no listener: no abort
      },

      serverError: function(flag,mex) {
        this.dispatchEvent("onServerError",[flag,mex]);
      },

      sessionEnd: function() {
        this.getTablesHandler().pauseAllTables();
        this.getMessageProxy().cleanMessageListeners();
      },

      sessionStart: function() {
        this.getTablesHandler().handleAllWaitingTables();
        this.getMessageProxy().handleAllWaitingMessages();
        this.getLsEngine().resolve(this.master);
      },

      cacheEngineStatus: function(_status) {
        if (_status == this.lastEngineStatus) {
          return;
        }
        this.lastEngineStatus = _status;
        this.dispatchEvent("onStatusChange",[_status]);
      },

      sendLog: function(logStr) {
        if (this.engineHandler && this.engineHandler.isSessionAlive()) {
          this.engineHandler.forwardLog(logStr);
          return true;
        }
        return false;
      },

      onServerKeepalive: function() {
          this.dispatchEvent("onServerKeepalive");
      },


      /**
       * Inquiry method that returns an array containing all the {@link Subscription}
       * instances that are currently "active" on this LightstreamerClient.
       * <BR/>Internal second-level Subscription are not included.
       *
       * @return {String[]} An array, containing all the {@link Subscription} currently
       * "active" on this LightstreamerClient.
       * <BR>The array can be empty.
       */
      getSubscriptions: function() {
        var map = [];
        var origMap = this.tables.getAllTables();
        for (var _id in origMap) {
          if(!origMap[_id].isSubTable()) {
            map.push(origMap[_id]);
          }
        }
        return map;
      },

      /**
       * Operation method that adds a {@link Subscription} to the list of "active"
       * Subscriptions.
       * The Subscription cannot already be in the "active" state.
       * <BR>Active subscriptions are subscribed to through the server as soon as possible
       * (i.e. as soon as there is a session available). Active Subscription are
       * automatically persisted across different sessions as long as a related
       * unsubscribe call is not issued.
       *
       * <p class="lifecycle"><b>Lifecycle:</b> Subscriptions can be given to the LightstreamerClient at
       * any time. Once done the Subscription immediately enters the "active" state.
       * <BR>Once "active", a {@link Subscription} instance cannot be provided again
       * to a LightstreamerClient unless it is first removed from the "active" state
       * through a call to {@link LightstreamerClient#unsubscribe}.
       * <BR>Also note that forwarding of the subscription to the server is made
       * asynchronously; this means that if a CPU consuming task is
       * performed right after the call the subscription will be delayed.
       * <BR>A successful subscription to the server will be notified through a
       * {@link SubscriptionListener#onSubscription} event.</p>
       *
       * @throws {IllegalArgumentException} if the given Subscription does
       * not contain a field list/field schema.
       * @throws {IllegalArgumentException} if the given Subscription does
       * not contain a item list/item group.
       * @throws {IllegalStateException}  if the given Subscription is already "active".
       *
       * @param {Subscription} subscription A {@link Subscription} object, carrying
       * all the information needed to process its pushed values.
       *
       * @see SubscriptionListener#onSubscription
       */
      subscribe: function(subscription) {
        this.tables.addATable(subscription);
      },

      /**
       * Operation method that removes a {@link Subscription} that is currently in
       * the "active" state.
       * <BR>By bringing back a Subscription to the "inactive" state, the unsubscription
       * from all its items is requested to Lightstreamer Server.
       *
       * <p class="lifecycle"><b>Lifecycle:</b> Subscription can be unsubscribed from at
       * any time. Once done the Subscription immediately exits the "active" state.
       * <BR>Note that forwarding of the unsubscription to the server is made
       * asynchronously; this means that if a CPU consuming task is
       * performed right after the call the unsubscription will be delayed.
       * <BR>The unsubscription will be notified through a
       * {@link SubscriptionListener#onUnsubscription} event.</p>
       *
       * @throws {IllegalStateException} if the given Subscription is not
       * currently "active".
       *
       * @param {Subscription} subscription An "active" {@link Subscription} object
       * that was activated by this LightstreamerClient instance.
       *
       * @see SubscriptionListener#onUnsubscription
       */
      unsubscribe: function(subscription) {
        this.tables.removeATable(subscription);
      },

      /**
       * Adds a listener that will receive events from the LightstreamerClient
       * instance.
       * <BR>The same listener can be added to several different LightstreamerClient
       * instances.
       *
       * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
       *
       * @param {ClientListener} listener An object that will receive the events
       * as shown in the {@link ClientListener} interface.
       * <BR>Note that the given instance does not have to implement all of the
       * methods of the ClientListener interface. In fact it may also
       * implement none of the interface methods and still be considered a valid
       * listener. In the latter case it will obviously receive no events.
       */
      addListener: function(listener) {
        this._callSuperMethod(LightstreamerClient,"addListener",[listener]);
      },

      /**
       * Removes a listener from the LightstreamerClient instance so that it
       * will not receive events anymore.
       *
       * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
       *
       * @param {ClientListener} listener The listener to be removed.
       */
      removeListener: function(listener) {
        this._callSuperMethod(LightstreamerClient,"removeListener",[listener]);
      },

      /**
       * Returns an array containing the {@link ClientListener} instances that
       * were added to this client.
       *
       * @return {ClientListener[]} an array containing the listeners that were added to this client.
       * Listeners added multiple times are included multiple times in the array.
       */
      getListeners: function() {
        return this._callSuperMethod(LightstreamerClient,"getListeners");
      },

      /**
       * Returns a promise that is resolved with a LightstreamerEngine.
       * @private
       */
      getLsEngine: function() {
          if (this.lsEnginePromise == null) {
              this.lsEnginePromise = Utils.defer();
          }
          return this.lsEnginePromise;
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Operation method that registers the MPN device on the server's MPN Module.<BR>
       * By registering an MPN device, the client enables MPN functionalities such as {@link LightstreamerClient#subscribeMpn}.
       *
       * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
       * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
       * available at /dashboard).</p>
       *
       * <p class="lifecycle"><b>Lifecycle:</b> An {@link MpnDevice} can be registered at any time. The registration will be notified through a {@link MpnDeviceListener#onRegistered} event.</p>
       *
       * @param device An {@link MpnDevice} instance, carrying all the information about the MPN device.
       * @throws IllegalArgumentException if the specified device is null.
       *
       * @see #subscribeMpn
       */
// END_NODE_JSDOC_EXCLUDE
      registerForMpn: function(device) {
          if (this.sharingRequested) {
              throw new IllegalStateException("MPN is not available when sharing is enabled");
          }
          if (device == null) {
              throw new IllegalArgumentException("Device cannot be null");
          }
          this.mpnDevice = device;
          this.mpnManager.registerForMpn(device);
          this.mpnRequested = true;
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Operation method that subscribes an MpnSubscription on server's MPN Module.<BR>
       * This operation adds the {@link MpnSubscription} to the list of "active" subscriptions. MPN subscriptions are activated on the server as soon as possible
       * (i.e. as soon as there is a session available and subsequently as soon as the MPN device registration succeeds). Differently than real-time subscriptions,
       * MPN subscriptions are persisted on the server's MPN Module database and survive the session they were created on.<BR>
       * If the <code>coalescing</code> flag is <i>set</i>, the activation of two MPN subscriptions with the same Adapter Set, Data Adapter, Group, Schema and trigger expression will be
       * considered the same MPN subscription. Activating two such subscriptions will result in the second activation modifying the first MpnSubscription (that
       * could have been issued within a previous session). If the <code>coalescing</code> flag is <i>not set</i>, two activations are always considered different MPN subscriptions,
       * whatever the Adapter Set, Data Adapter, Group, Schema and trigger expression are set.<BR>
       * The rationale behind the <code>coalescing</code> flag is to allow simple apps to always activate their MPN subscriptions when the app starts, without worrying if
       * the same subscriptions have been activated before or not. In fact, since MPN subscriptions are persistent, if they are activated every time the app starts and
       * the <code>coalescing</code> flag is not set, every activation is a <i>new</i> MPN subscription, leading to multiple push notifications for the same event.
       *
       * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
       * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
       * available at /dashboard).</p>
       *
       * <p class="lifecycle"><b>Lifecycle:</b> An MpnSubscription can be given to the LightstreamerClient once an MpnDevice registration has been requested. The MpnSubscription
       * immediately enters the "active" state.<BR>
       * Once "active", an MpnSubscription instance cannot be provided again to an LightstreamerClient unless it is first removed from the "active" state through
       * a call to {@link #unsubscribeMpn}.<BR>
       * A successful subscription to the server will be notified through an {@link MpnSubscriptionListener#onSubscription} event.</p>
       *
       * @param subscription An MpnSubscription object, carrying all the information to route real-time data via push notifications.
       * @param coalescing A flag that specifies if the MPN subscription must coalesce with any pre-existing MPN subscription with the same Adapter Set, Data Adapter,
       * Group, Schema and trigger expression.
       * @throws IllegalStateException if the given MPN subscription does not contain a field list/field schema.
       * @throws IllegalStateException if the given MPN subscription does not contain a item list/item group.
       * @throws IllegalStateException if there is no MPN device registered.
       * @throws IllegalStateException if the given MPN subscription is already active.
       *
       * @see #unsubscribeMpn
       * @see #unsubscribeMpnSubscriptions
       */
// END_NODE_JSDOC_EXCLUDE
      subscribeMpn: function(subscription, coalescing) {
          if (subscription == null) {
              throw new IllegalArgumentException("MpnSubscription is null");
          }
          if (subscription.fields == null) {
              throw new IllegalArgumentException("Invalid MpnSubscription, please specify a field list or field schema");
          }
          if (subscription.items == null) {
              throw new IllegalArgumentException("Invalid MpnSubscription, please specify an item list or item group");
          }
          if (subscription.getNotificationFormat() == null) {
              throw new IllegalArgumentException("Invalid MpnSubscription, please specify a notification format");
          }
          if (subscription.isActive()) {
              throw new IllegalStateException("MpnSubscription is already active");
          }
          if (this.mpnDevice == null) {
              throw new IllegalStateException("No MPN device registered");
          }
          coalescing = !! coalescing;

          this.mpnManager.subscribe(subscription, coalescing);
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Operation method that unsubscribes an MpnSubscription from the server's MPN Module.<BR>
       * This operation removes the MpnSubscription from the list of "active" subscriptions.
       *
       * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
       * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
       * available at /dashboard).</p>
       *
       * <p class="lifecycle"><b>Lifecycle:</b> An MpnSubscription can be unsubscribed from at any time. Once done the MpnSubscription immediately exits the "active" state.<BR>
       * The unsubscription will be notified through an {@link MpnSubscriptionListener#onUnsubscription} event.</p>
       *
       * @param subscription An "active" MpnSubscription object.
       * @throws IllegalStateException if the given MPN subscription is not active.
       * @throws IllegalStateException if there is no MPN device registered.
       *
       * @see #subscribeMpn
       * @see #unsubscribeMpnSubscriptions
       */
// END_NODE_JSDOC_EXCLUDE
      unsubscribeMpn: function(/*MpnSubscription*/ subscription) {
          if (! subscription.isActive()) {
              throw new IllegalStateException("MpnSubscription is not active");
          }
          if (this.mpnDevice == null) {
              throw new IllegalStateException("No MPN device registered");
          }
          this.mpnManager.unsubscribe(subscription);
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Operation method that unsubscribes all the MPN subscriptions with a specified status from the server's MPN Module.<BR>
       * By specifying a status filter it is possible to unsubscribe multiple MPN subscriptions at once. E.g. by passing <code>TRIGGERED</code> it is possible
       * to unsubscribe all triggered MPN subscriptions. This operation removes the involved MPN subscriptions from the list of "active" subscriptions.
       *
       * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
       * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
       * available at /dashboard).</p>
       *
       * <p class="lifecycle"><b>Lifecycle:</b> Multiple unsubscription can be requested at any time. Once done the involved MPN subscriptions immediately exit the "active" state.<BR>
       * The unsubscription will be notified through an {@link MpnSubscriptionListener#onUnsubscription} event to all involved MPN subscriptions.</p>
       *
       * @param filter A status name to be used to select the MPN subscriptions to unsubscribe. If null all existing MPN subscriptions
       * are unsubscribed. Possible filter values are:<ul>
       * <li><code>ALL</code> or null</li>
       * <li><code>TRIGGERED</code></li>
       * <li><code>SUBSCRIBED</code></li>
       * </ul>
       * @throws IllegalArgumentException if the given filter is not valid.
       * @throws IllegalStateException if there is no MPN device registered.
       *
       * @see #subscribeMpn
       * @see #unsubscribeMpn
       */
// END_NODE_JSDOC_EXCLUDE
      unsubscribeMpnSubscriptions: function(filter) {
          if (! (filter == null || filter == "ALL" || filter == "SUBSCRIBED" || filter == "TRIGGERED")) {
              throw new IllegalArgumentException("The given value is not valid for this setting. Use null, ALL, TRIGGERED or SUBSCRIBED instead");
          }
          if (this.mpnDevice == null) {
              throw new IllegalStateException("No MPN device registered");
          }
          this.mpnManager.unsubscribeFilter(filter);
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Inquiry method that returns a collection of the existing MPN subscription with a specified status.<BR>
       * Can return both objects created by the user, via {@link MpnSubscription} constructors, and objects created by the client, to represent pre-existing MPN subscriptions.<BR>
       * Note that objects in the collection may be substituted at any time with equivalent ones: do not rely on pointer matching, instead rely on the
       * {@link MpnSubscription#getSubscriptionId} value to verify the equivalence of two MpnSubscription objects. Substitutions may happen
       * when an MPN subscription is modified, or when it is coalesced with a pre-existing subscription.
       *
       * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
       * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
       * available at /dashboard).</p>
       *
       * <p class="lifecycle"><b>Lifecycle:</b> The collection is available once an MpnDevice registration has been requested, but reflects the actual server's collection only
       * after an {@link MpnDeviceListener#onSubscriptionsUpdated} event has been notified.</p>
       *
       * @param {String} filter An MPN subscription status name to be used to select the MPN subscriptions to return. If null all existing MPN subscriptions
       * are returned. Possible filter values are:<ul>
       * <li><code>ALL</code> or null</li>
       * <li><code>TRIGGERED</code></li>
       * <li><code>SUBSCRIBED</code></li>
       * </ul>
       * @return {MpnSubscription[]} the collection of {@link MpnSubscription} with the specified status.
       * @throws IllegalArgumentException if the given filter is not valid.
       * @throws IllegalStateException if there is no MPN device registered.
       *
       * @see #findMpnSubscription
       */
// END_NODE_JSDOC_EXCLUDE
      getMpnSubscriptions: function(filter) {
          if (! (filter == null || "ALL" == filter || "SUBSCRIBED" == filter || "TRIGGERED" == filter)) {
              throw new IllegalArgumentException("The given value is not valid for this setting. Use null, ALL, TRIGGERED or SUBSCRIBED instead");
          }
          if (this.mpnDevice == null) {
              throw new IllegalStateException("No MPN device registered");
          }
          /*List<MpnSubscription>*/ var ls = this.mpnManager.getSubscriptions(filter);
          return ls.toArray();
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Inquiry method that returns the MpnSubscription with the specified subscription ID, or null if not found.<BR>
       * The object returned by this method can be an object created by the user, via MpnSubscription constructors, or an object created by the client,
       * to represent pre-existing MPN subscriptions.<BR>
       * Note that objects returned by this method may be substitutued at any time with equivalent ones: do not rely on pointer matching, instead rely on the
       * {@link MpnSubscription#getSubscriptionId} value to verify the equivalence of two MpnSubscription objects. Substitutions may happen
       * when an MPN subscription is modified, or when it is coalesced with a pre-existing subscription.
       *
       * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
       * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
       * available at /dashboard).</p>
       *
       * @param {String} subscriptionId The subscription ID to search for.
       * @return {MpnSubscription} the MpnSubscription with the specified ID, or null if not found.
       * @throws IllegalArgumentException if the given subscription ID is null.
       * @throws IllegalStateException if there is no MPN device registered.
       *
       * @see #getMpnSubscriptions
       */
// END_NODE_JSDOC_EXCLUDE
      findMpnSubscription: function(subscriptionId) {
          if (subscriptionId == null) {
              throw new IllegalArgumentException("Subscription id must be not null");
          }
          return this.mpnManager.findSubscription(subscriptionId);
      },
      
      /*
       * Subscribes to the given Remote Adapter status item, so that, when the status is "disconnected",
       * the client is forced to reconnect after the given reconnect delay.
       * Also, if the Metadata Adapter is disconnected and the server sends the given CONERR code, 
       * the client reconnects after the given delay instead of going to DISCONNECTED state.
       */
      handleRemoteAdapterStatus: function(metadataErrorCode, dataAdapterName, statusItemName, reconnectMaxDelay) {
          /* Adding properties to connectionOptions, they will be propagated to Master engine */
          this.connectionOptions.installRemoteAdapterStatusObserver(metadataErrorCode, dataAdapterName, statusItemName, reconnectMaxDelay);
          var adapterSub = new Subscription("MERGE", statusItemName, ["status"]);
          adapterSub.setDataAdapter(dataAdapterName);
          adapterSub.setRequestedSnapshot("yes");
          var that = this;
          adapterSub.addListener({
              // preserve the name of the method as it is called by the dispatcher
              "onItemUpdate": function(updateInfo) {
                  var status = updateInfo.getValue("status");
                  console.log("STATUS", status);
                  if (status && status != "connected") {
                      var eh = that.getEngineHandler();
                      if (eh) {
                          eh.callDisconnectAndReconnect();
                      }
                  }
              }
          });
          Executor.addTimedTask(this.subscribe, 0, this, [adapterSub]);
      }

  };

  /*
   * TEST-ONLY METHOD.
   * Enable WS if disabled.
   */
  LightstreamerClient["__restoreWs"] = WebSocketConnection.restoreClass;
  LightstreamerClient["__disableWs"] = WebSocketConnection.disableClass;

  /*
   * TEST-ONLY METHOD.
   */
  LightstreamerClient["__handleError5"] = Constants.handleError5;

  /**
   * This is a dummy constructor not to be used in any case.
   * @constructor
   *
   * @exports ClientListener
   * @class Interface to be implemented to listen to {@link LightstreamerClient} events
   * comprehending notifications of connection activity and errors.
   * <BR>Events for these listeners are executed asynchronously with respect to the code
   * that generates them. This means that, upon reception of an event, it is possible that
   * the current state of the client has changed furtherly.
   * <BR>Note that it is not necessary to implement all of the interface methods for
   * the listener to be successfully passed to the {@link LightstreamerClient#addListener}
   * method.
START_NODE_JSDOC_EXCLUDE
   * <BR>A ClientListener implementation is distributed together with the library:
   * {@link StatusWidget}.
END_NODE_JSDOC_EXCLUDE
   */
  function ClientListener() {

  };

  ClientListener.prototype = {
      /**
       * Event handler that is called when the Server notifies a refusal on the
       * client attempt to open a new connection or the interruption of a
       * streaming connection. In both cases, the {@link ClientListener#onStatusChange}
       * event handler has already been invoked with a "DISCONNECTED" status and
       * no recovery attempt has been performed. By setting a custom handler, however,
       * it is possible to override this and perform custom recovery actions.
       *
       * @param {Number} errorCode The error code. It can be one of the
       * following:
       * <ul>
       * <li>1 - user/password check failed</li>
       * <li>2 - requested Adapter Set not available</li>
       * <li>7 - licensed maximum number of sessions reached
       * (this can only happen with some licenses)</li>
       * <li>8 - configured maximum number of sessions reached</li>
       * <li>9 - configured maximum server load reached</li>
       * <li>10 - new sessions temporarily blocked</li>
       * <li>11 - streaming is not available because of Server license
       * restrictions (this can only happen with special licenses)</li>
       * <li>21 - a bind request has unexpectedly reached a wrong Server instance, which suggests that a routing issue may be in place</li>
       * <li>30-41 - the current connection or the whole session has been closed
       * by external agents; the possible cause may be:
       * <ul>
       * <li>The session was closed on the Server side (via software or by
       * the administrator) (32) or through a client "destroy" request (31);</li>
       * <li>The Metadata Adapter imposes limits on the overall open sessions
       * for the current user and has requested the closure of the current session
       * upon opening of a new session for the same user
START_NODE_JSDOC_EXCLUDE
       * on a different browser window
END_NODE_JSDOC_EXCLUDE
       * (35);</li>
       * <li>An unexpected error occurred on the Server while the session was in
       * activity (33, 34);</li>
       * <li>An unknown or unexpected cause; any code different from the ones
       * identified in the above cases could be issued.</li>
       * </ul>
       * A detailed description for the specific cause is currently not supplied
       * (i.e. errorMessage is null in this case).</li>
       * <li>60 - this version of the client is not allowed by the current license terms.</li>
       * <li>61 - there was an error in the parsing of the server response thus the client cannot continue with the current session.</li>
       * <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection.</li>
       * <li>68 - the Server could not open or continue with the session because of an internal error.</li>
       * <li>71 - this kind of client is not allowed by the current license terms.</li>
       * <li>&lt;= 0 - the Metadata Adapter has refused the user connection;
       * the code value is dependent on the specific Metadata Adapter
       * implementation</li>
       * </ul>
       * @param {String} errorMessage The description of the error as sent
       * by the Server.
       *
       * @see ConnectionDetails#setAdapterSet
       * @see ClientListener#onStatusChange
       */
      onServerError: function(errorCode, errorMessage) {

      },

      /**
       * Event handler that receives a notification each time the LightstreamerClient
       * status has changed. The status changes may be originated either by custom
       * actions (e.g. by calling {@link LightstreamerClient#disconnect}) or by
       * internal actions.
       * <BR/><BR/>The normal cases are the following:
       * <ul>
       * <li>After issuing connect(), if the current status is "DISCONNECTED*", the
       * client will switch to "CONNECTING" first and
       * to "CONNECTED:STREAM-SENSING" as soon as the pre-flight request receives its
       * answer.
       * <BR>As soon as the new session is established, it will switch to
       * "CONNECTED:WS-STREAMING" if the browser/environment permits WebSockets;
       * otherwise it will switch to "CONNECTED:HTTP-STREAMING" if the
       * browser/environment permits streaming or to "CONNECTED:HTTP-POLLING"
       * as a last resort.
       * <BR>On the other hand if the status is already "CONNECTED:*" a
       * switch to "CONNECTING" is usually not needed.</li>
       * <li>After issuing disconnect(), the status will switch to "DISCONNECTED".</li>
       * <li>In case of a server connection refusal, the status may switch from
       * "CONNECTING" directly to "DISCONNECTED". After that, the
       * {@link ClientListener#onServerError} event handler will be invoked.</li>
       * </ul>
       * <BR/>Possible special cases are the following:
       * <ul>
       * <li>In case of Server unavailability during streaming, the status may
       * switch from "CONNECTED:*-STREAMING" to "STALLED" (see
       * {@link ConnectionOptions#setStalledTimeout}).
       * If the unavailability ceases, the status will switch back to
       * ""CONNECTED:*-STREAMING"";
       * otherwise, if the unavailability persists (see
       * {@link ConnectionOptions#setReconnectTimeout}),
       * the status will switch to "DISCONNECTED:TRYING-RECOVERY" and eventually to
       * "CONNECTED:*-STREAMING".</li>
       * <li>In case the connection or the whole session is forcibly closed
       * by the Server, the status may switch from "CONNECTED:*-STREAMING"
       * or "CONNECTED:*-POLLING" directly to "DISCONNECTED". After that, the
       * {@link ClientListener#onServerError} event handler will be invoked.</li>
       * <li>Depending on the setting in {@link ConnectionOptions#setSlowingEnabled},
       * in case of slow update processing, the status may switch from
       * "CONNECTED:WS-STREAMING" to "CONNECTED:WS-POLLING" or from
       * "CONNECTED:HTTP-STREAMING" to "CONNECTED:HTTP-POLLING".</li>
       * <li>If the status is "CONNECTED:*-POLLING" and any problem during an
       * intermediate poll occurs, the status may switch to "CONNECTING" and
       * eventually to "CONNECTED:*-POLLING". The same may hold for the
       * "CONNECTED:*-STREAMING" case, when a rebind is needed.</li>
       * <li>In case a forced transport was set through
       * {@link ConnectionOptions#setForcedTransport}, only the related final
       * status or statuses are possible.</li>
       * <li>In case of connection problems, the status may switch from any value
       * to "DISCONNECTED:WILL-RETRY" (see {@link ConnectionOptions#setRetryDelay}),
       * then to "CONNECTING" and a new attempt will start.
       * However, in most cases, the client will try to recover the current session;
       * hence, the "DISCONNECTED:TRYING-RECOVERY" status will be entered
       * and the recovery attempt will start.</li>
       * <li>In case of connection problems during a recovery attempt, the status may stay
       * in "DISCONNECTED:TRYING-RECOVERY" for long time, while further attempts are made.
       * If the recovery is no longer possible, the current session will be abandoned
       * and the status will switch to "DISCONNECTED:WILL-RETRY" before the next attempts.</li>
START_NODE_JSDOC_EXCLUDE
       * <li>In case the local LightstreamerClient is exploiting the connection of a
       * different LightstreamerClient (see {@link ConnectionSharing}) and such
       * LightstreamerClient or its container window is disposed, the status will
       * switch to "DISCONNECTED:WILL-RETRY" unless the current status is "DISCONNECTED".
       * In the latter case it will remain "DISCONNECTED".</li>
END_NODE_JSDOC_EXCLUDE
       * </ul>
       *
       * <BR>By setting a custom handler it is possible to perform
       * actions related to connection and disconnection occurrences. Note that
       * {@link LightstreamerClient#connect} and {@link LightstreamerClient#disconnect},
       * as any other method, can be issued directly from within a handler.
       *
       * @param {String} chngStatus The new status. It can be one of the
       * following values:
       * <ul>
       * <li>"CONNECTING" the client has started a connection attempt and is
       * waiting for a Server answer.</li>
       * <li>"CONNECTED:STREAM-SENSING" the client received a first response from
       * the server and is now evaluating if a streaming connection is fully
       * functional. </li>
       * <li>"CONNECTED:WS-STREAMING" a streaming connection over WebSocket has
       * been established.</li>
       * <li>"CONNECTED:HTTP-STREAMING" a streaming connection over HTTP has
       * been established.</li>
       * <li>"CONNECTED:WS-POLLING" a polling connection over WebSocket has
       * been started. Note that, unlike polling over HTTP, in this case only one
       * connection is actually opened (see {@link ConnectionOptions#setSlowingEnabled}).
       * </li>
       * <li>"CONNECTED:HTTP-POLLING" a polling connection over HTTP has
       * been started.</li>
       * <li>"STALLED" a streaming session has been silent for a while,
       * the status will eventually return to its previous CONNECTED:*-STREAMING
       * status or will switch to "DISCONNECTED:WILL-RETRY" / "DISCONNECTED:TRYING-RECOVERY".</li>
       * <li>"DISCONNECTED:WILL-RETRY" a connection or connection attempt has been
       * closed; a new attempt will be performed (possibly after a timeout).</li>
       * <li>"DISCONNECTED:TRYING-RECOVERY" a connection has been closed and
       * the client has started a connection attempt and is waiting for a Server answer;
       * if successful, the underlying session will be kept.</li>
       * <li>"DISCONNECTED" a connection or connection attempt has been closed. The
       * client will not connect anymore until a new {@link LightstreamerClient#connect}
       * call is issued.</li>
       * </ul>
       *
       * @see LightstreamerClient#connect
       * @see LightstreamerClient#disconnect
       * @see LightstreamerClient#getStatus
       */
      onStatusChange: function(chngStatus) {
      },

      /**
       * Event handler that receives a notification each time  the value of a property of
       * {@link LightstreamerClient#connectionDetails} or {@link LightstreamerClient#connectionOptions}
       * is changed.
START_NODE_JSDOC_EXCLUDE
       * <BR>Properties of these objects can be modified by direct calls to them, but
       * also by calls performed on other LightstreamerClient instances sharing the
       * same connection and by server sent events.
END_NODE_JSDOC_EXCLUDE
       *
       * @param {String} the name of the changed property.
       * <BR>Possible values are:
       * <ul>
       * <li>adapterSet</li>
       * <li>serverAddress</li>
       * <li>user</li>
       * <li>password</li>
       * <li>serverInstanceAddress</li>
       * <li>serverSocketName</li>
       * <li>sessionId</li>
       * <li>contentLength</li>
       * <li>idleTimeout</li>
       * <li>keepaliveInterval</li>
       * <li>maxBandwidth</li>
       * <li>pollingInterval</li>
       * <li>reconnectTimeout</li>
       * <li>stalledTimeout</li>
       * <li>retryDelay</li>
       * <li>firstRetryMaxDelay</li>
       * <li>slowingEnabled</li>
       * <li>forcedTransport</li>
       * <li>serverInstanceAddressIgnored</li>
       * <li>cookieHandlingRequired</li>
       * <li>reverseHeartbeatInterval</li>
       * <li>httpExtraHeaders</li>
       * <li>httpExtraHeadersOnSessionCreationOnly</li>
       *
       * </ul>
       *
       * @see LightstreamerClient#connectionDetails
       * @see LightstreamerClient#connectionOptions
       */
      onPropertyChange: function(propertyName) {
      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Event handler that receives a notification in case a connection
       * sharing is aborted.
       * A connection sharing can only be aborted if one of the policies specified
       * in the {@link ConnectionSharing} instance supplied to the
       * {@link LightstreamerClient#enableSharing} method is "ABORT".
       * <BR>If this event is fired the client will never be able to connect to
       * the server unless a new call to enableSharing is issued.
       */
// END_NODE_JSDOC_EXCLUDE
      onShareAbort: function() {

      },

      /**
       * Event handler that receives a notification when the ClientListener instance
       * is added to a LightstreamerClient through
       * {@link LightstreamerClient#addListener}.
       * This is the first event to be fired on the listener.
       *
       * @param {LightstreamerClient} lsClient the LightstreamerClient this
       * instance was added to.
       */
      onListenStart: function(lsClient) {

      },

      /**
       * Event handler that receives a notification when the ClientListener instance
       * is removed from a LightstreamerClient through
       * {@link LightstreamerClient#removeListener}.
       * This is the last event to be fired on the listener.
       *
       * @param {LightstreamerClient} lsClient the LightstreamerClient this
       * instance was removed from.
       */
      onListenEnd: function(lsClient) {

      },

// START_NODE_JSDOC_EXCLUDE
      /**
       * Notifies that the Server has sent a keepalive message because a streaming connection
       * is in place and no update had been sent for the configured time
       * (see {@link ConnectionOptions#setKeepaliveInterval}).
       * However, note that the lack of both updates and keepalives is already managed by the library
       * (see {@link ConnectionOptions#setReconnectTimeout} and {@link ConnectionOptions#setStalledTimeout}).
       */
// END_NODE_JSDOC_EXCLUDE
      onServerKeepalive: function() {

      }

  };


  /**
   * This is a dummy constructor not to be used in any case.
   * @constructor
   *
   * @exports ClientMessageListener
   * @class Interface to be implemented to listen to {@link LightstreamerClient#sendMessage}
   * events reporting a message processing outcome.
   * <BR>Events for these listeners are executed asynchronously with respect to the code
   * that generates them.
   * <BR>Note that it is not necessary to implement all of the interface methods for
   * the listener to be successfully passed to the {@link LightstreamerClient#sendMessage}
   * method. On the other hand, if all of the handlers are implemented the library will
   * ensure to call one and only one of them per message.
   */
  function ClientMessageListener() {

  };

  ClientMessageListener.prototype = {
    /**
     * Event handler that is called by Lightstreamer when any notifications
     * of the processing outcome of the related message haven't been received
     * yet and can no longer be received.
     * Typically, this happens after the session has been closed.
     * In this case, the client has no way of knowing the processing outcome
     * and any outcome is possible.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     * @param {boolean} sentOnNetwork true if the message was probably sent on the
     * network, false otherwise.
     * <BR>Event if the flag is true, it is not possible to infer whether the message
     * actually reached the Lightstreamer Server or not.
     */
    onAbort: function(originalMessage,sentOnNetwork) {
      return;
    },

    /**
     * Event handler that is called by Lightstreamer when the related message
     * has been processed by the Server but the processing has failed for any
     * reason. The level of completion of the processing by the Metadata Adapter
     * cannot be determined.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     */
    onError: function(originalMessage) {
      return;
    },

    /**
     * Event handler that is called by Lightstreamer to notify that the related
     * message has been discarded by the Server. This means that the message
     * has not reached the Metadata Adapter and the message next in the sequence
     * is considered enabled for processing.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     */
    onDiscarded: function(originalMessage) {
      return;
    },

    /**
     * Event handler that is called by Lightstreamer when the related message
     * has been processed by the Server but the expected processing outcome
     * could not be achieved for any reason.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     * @param {Number} code the error code sent by the Server. It can be one
     * of the following:
     * <ul>
     * <li>&lt;= 0 - the Metadata Adapter has refused the message; the code
     * value is dependent on the specific Metadata Adapter implementation.</li>
     * </ul>
     * @param {String} message the description of the error sent by the Server.
     */
    onDeny: function(originalMessage,code, message) {
      return;
    },

    /**
     * Event handler that is called by Lightstreamer when the related message
     * has been processed by the Server with success.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     */
    onProcessed: function(originalMessage) {
      return;
    }
  };

  LightstreamerClient["addCookies"] = LightstreamerClient.addCookies;
  LightstreamerClient["getCookies"] = LightstreamerClient.getCookies;
  LightstreamerClient["setLoggerProvider"] = LightstreamerClient.setLoggerProvider;
  LightstreamerClient["LIB_NAME"] = LightstreamerClient.LIB_NAME;
  LightstreamerClient["LIB_VERSION"] = LightstreamerClient.LIB_VERSION;
  LightstreamerClient.prototype["connect"] = LightstreamerClient.prototype.connect;
  LightstreamerClient.prototype["disconnect"] = LightstreamerClient.prototype.disconnect;
  LightstreamerClient.prototype["getStatus"] = LightstreamerClient.prototype.getStatus;
  LightstreamerClient.prototype["sendMessage"] = LightstreamerClient.prototype.sendMessage;
  LightstreamerClient.prototype["getSubscriptions"] = LightstreamerClient.prototype.getSubscriptions;
  LightstreamerClient.prototype["subscribe"] = LightstreamerClient.prototype.subscribe;
  LightstreamerClient.prototype["unsubscribe"] = LightstreamerClient.prototype.unsubscribe;
  LightstreamerClient.prototype["addListener"] = LightstreamerClient.prototype.addListener;
  LightstreamerClient.prototype["removeListener"] = LightstreamerClient.prototype.removeListener;
  LightstreamerClient.prototype["getListeners"] = LightstreamerClient.prototype.getListeners;
  LightstreamerClient.prototype["registerForMpn"] = LightstreamerClient.prototype.registerForMpn;
  LightstreamerClient.prototype["subscribeMpn"] = LightstreamerClient.prototype.subscribeMpn;
  LightstreamerClient.prototype["unsubscribeMpn"] = LightstreamerClient.prototype.unsubscribeMpn;
  LightstreamerClient.prototype["unsubscribeMpnSubscriptions"] = LightstreamerClient.prototype.unsubscribeMpnSubscriptions;
  LightstreamerClient.prototype["findMpnSubscription"] = LightstreamerClient.prototype.findMpnSubscription;
  LightstreamerClient.prototype["getMpnSubscriptions"] = LightstreamerClient.prototype.getMpnSubscriptions;
  LightstreamerClient.prototype["handleRemoteAdapterStatus"] = LightstreamerClient.prototype.handleRemoteAdapterStatus;

  LightstreamerClient.prototype["enableSharing"] = LightstreamerClient.prototype.enableSharing;
  LightstreamerClient.prototype["isMaster"] = LightstreamerClient.prototype.isMaster;

  LightstreamerClient.prototype["unloadEvent"] = LightstreamerClient.prototype.unloadEvent;
  LightstreamerClient.prototype["preUnloadEvent"] = LightstreamerClient.prototype.unloadEvent;


  Inheritance(LightstreamerClient,EventDispatcher,false,true);
  Inheritance(LightstreamerClient,Setter,true,true);
  return LightstreamerClient;
})();


