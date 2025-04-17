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
import Constants from "./Constants";
import LoggerManager from "../src-log/LoggerManager";
import Inheritance from "../src-tool/Inheritance";
import Setter from "../src-tool/Setter";
import Environment from "../src-tool/Environment";
import IllegalArgumentException from "../src-tool/IllegalArgumentException";
import SharedStatus from "./shared/SharedStatus";
import ChannelsHandlerMaster from "./cross-tab/ChannelsHandlerMaster";
import Policies from "./shared/Policies";
import Search from "./shared/Search";
import SharedWorkerManager from "./cross-tab/SharedWorkerManager";

export default /*@__PURE__*/(function() {
  var alpha_numeric = new RegExp("^[a-zA-Z0-9]*$");

  var foundPolicyCheck = {};
  foundPolicyCheck[Policies.ATTACH] = true;
  foundPolicyCheck[Policies.FAST] = true;
  foundPolicyCheck[Policies.IGNORE] = true;
  foundPolicyCheck[Policies.ABORT] = true;

  var notFoundPolicyCheck = {};
  notFoundPolicyCheck[Policies.CREATE] = true;
  notFoundPolicyCheck[Policies.ABORT] = true;
  notFoundPolicyCheck[Policies.WAIT] = true;

  var browserOnlyFoundPolicy = {};
  browserOnlyFoundPolicy[Policies.ATTACH] = true;
  browserOnlyFoundPolicy[Policies.FAST] = true;

  
  var NAME_IS_MANDATORY = "The share name is missing";
  var INVALID_NAME = "The given share name is not valid, use only alphanumeric characters";
  var WRONG_FOUND_POLICY = "sharePolicyOnFound must be one of: ATTACH, ATTACH:FAST, IGNORE, ABORT";
  var BROWSER_ONLY_POLICY = "ATTACH* can only be used if the LightstreamerClient is loaded inside a browser document";
  var WRONG_NOT_FOUND_POLICY = "sharePolicyOnNotFound must be one of: CREATE, ABORT, WAIT";
  
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);
  
    

  /**
   * Data object describing the sharing policies to be used by a LightstreamerClient
   * instance.
   * If the front-end includes more than one LightstreamerClient instance that
   * need to subscribe to the same server, it is advised that such instances
   * share the same connection to avoid saturating the client connection pool and
   * to open fewer sessions on the Lightstreamer Server.
   * Note that sharing is also possible between clients living in different
   * HTML pages, provided that they come from the same host. Note that Browser
   * capabilities and/or restrictions might prevent the sharing.
   * If sharing is enabled some Cookies or values on the Web Storage may
   * be used to exchange preliminary information across windows. The used keys
   * are prefixed with the "Lightstreamer_" string. Specifying true on the
   * preventCrossWindowShare parameter it is possible to prevent the
   * Cookies/Web Storage usage.
   * <BR>When different LightstreamerClient share the same connection, the one
   * actually holding the connection is also known as the current "Master" client.
   * Whenever possible, the Master LightstreamerClient should be hosted by a permanent page.
   * <BR>If the current Master, for any reason, disappears, then the connection to
   * Lightstreamer Server has to be reestablished: the election algorithm will
   * choose a new Master among the surviving LightstreamerClient instances and
   * will restore the same status that was in place before the previous Master
   * disappeared.
   * @constructor
   * 
   * @exports ConnectionSharing
   *
   * @param {String} shareName A unique alphanumeric name for the shared
   * connection. The name can be used by different LightstreamerClient in order to
   * recognize a compatible shared connection. Two LightstreamerClient instances
   * should use the same shareName for their enableSharing calls only if they are
   * going to configure the connection in the same way to connect to the same
   * server. Obviously, this includes the user credentials.
   *
   * @param {String} sharePolicyOnFound The action to be taken in case a client
   * sharing a connection using the same shareName and coming from the same
   * host is found in the browser (i.e. an active Master is found).
   * <BR>Can be one of the following:
   * <ul>
   * <li>"ATTACH" the client will try to become a Slave to the found Master.
   * <BR>Note that this policy can only be used on clients living inside a
   * browser window (i.e. no web workers nor non-browser environments).
   * Also the "ATTACH" policy might not work as expected if the involved clients
   * are instantiated in HTML pages loaded from the file system rather than
   * downloaded from a web server.
   * <BR>Note that it is an application responsibility to ensure that the
   * configuration of the Master client (the user credentials, for instance)
   * is consistent with the configuration required by the new instance of the
   * application front-end. In particular, note that the allocated bandwidth
   * would be shared among the two (or more) LightstreamerClient instances as
   * well.
   * <BR>Note that a connection, to be correctly shared between different
   * pages, has to be created in the &lt;BODY&gt; part of the page.
   * If this condition is not met, on some browsers, slave clients may
   * waste some extra time before being able to access the shared connection.
   * <BR>Sharing the connection also enables the so called "Master election"
   * feature. If the Master client is closed and other clients share the
   * connection with it, then one of the existing clients will be automatically
   * chosen as the new Master; this client will restore the status and
   * configuration of the previous Master client as it was before its death.
   * <BR>Note that there may be cases in which the library is not able to
   * determine whether a shared connection is currently active. Moreover,
   * there may be cases in which the library is not able to obtain a reference
   * to a currently active Master client.
   * </li>
   * <li>"ATTACH:FAST" same as "ATTACH" but the client will take some risks
   * of making a popup appear in order to speed up things.</li>
   * <li>"IGNORE" the found Master will be ignored and the sharePolicyOnNotFound
   * behavior will be applied.</li>
   * <li>"ABORT" the client will give up in the search of an active shared
   * connection and will neither try to create its own; the
   * {@link ClientListener#onShareAbort} event will be fired.
   * <BR>This policy may be useful in order to avoid that multiple streaming
   * connections are open (note that the browser may have a limited pool of
   * connections) or that multiple sessions for the same user are open.</li>
   * </ul>
   *
   * @param {String} sharePolicyOnNotFound The action to be taken in case a client
   * sharing a connection using the same shareName and coming from the same
   * host is not found in the browser (i.e. no active Master is found).
   * <BR>Can be one of the following:
   * <ul>
   * <li>"CREATE" the client will create its own connection.</li>
   * <li>"ABORT" the client will give up in the search of an active shared
   * connection and will neither try to create its own; the
   * {@link ClientListener#onShareAbort} event will be fired.</li>
   * <li>"WAIT" the client will wait until it finds a connection using the same
   * shareName and coming from the same host; then the sharePolicyOnFound
   * behavior will be applied.</li>
   * </ul>
   *
   * @throws {IllegalArgumentException} if the sharename is not specified or
   * is invalid.
   * @throws {IllegalArgumentException} if a non-existent policy was specified
   * or if the specified policy is not compatible with the current environment.
   *
   * @param {boolean} [preventCrossWindowShare] <b>[optional]</b> Flag to enable/disable the sharing
   * of a connection that belongs to a LightstreamerClient instances living
   * in a different html page.
   * <BR>Note that cross-window sharing might be impossible in certain circumstances.
   * <BR>If this flag is set to true, a Master living on a different window will
   * not trigger the sharePolicyOnFound policy; hence, only sharing with another
   * LightstreamerClient instance belonging to the same page will be possible.
   * <BR>The parameter is optional; if not supplied, the default value is false.
   *
   * @param {Window} [shareRef] If known, the reference to a Window containing a
   * shared connection can be passed. For the passed reference to be used, "ATTACH"
   * or "ATTACH:FAST" should be used as sharePolicyOnFound.
   *
   * @class Data object that contains information about if and how the connection
   * is shared between different {@link LightstreamerClient} instances possibly
   * living on different html pages.
   *
   * @see LightstreamerClient#enableSharing
   */
  var ConnectionSharing = function(shareName, sharePolicyOnFound, sharePolicyOnNotFound, preventCrossWindowShare, shareRef){


    if (!shareName) {
      throw new IllegalArgumentException(NAME_IS_MANDATORY);
    }

    if (!alpha_numeric.test(shareName)) {
      throw new IllegalArgumentException(INVALID_NAME);
    }

    if(!notFoundPolicyCheck[sharePolicyOnNotFound]) {
      throw new IllegalArgumentException(WRONG_NOT_FOUND_POLICY);
    }

    if(!foundPolicyCheck[sharePolicyOnFound]) {
      throw new IllegalArgumentException(WRONG_FOUND_POLICY);
    }

    this.preventCrossWindowShare = this.checkBool(preventCrossWindowShare,true);

    if (!Environment.isBrowserDocument()) {
      if (browserOnlyFoundPolicy[sharePolicyOnFound]) {
        throw new IllegalArgumentException(BROWSER_ONLY_POLICY);
      }
      this.preventCrossWindowShare = true;
    }

    if (Constants.PAGE_PROTOCOL == "file:" && !preventCrossWindowShare) {
      sharingLogger.logWarn("Forcing preventCrossWindowShare because page is on file:///");
      preventCrossWindowShare = true;
    }

    /**
     * @private
     */
    this.checkEngineTimeout = 5000;
    /**
     * @private
     */
    this.disposing = false;
    /**
     * @private
     */
    this.preventCrossWindowShare = preventCrossWindowShare;
    /**
     * @private
     */
    this.shareName = shareName;
    /**
     * @private
     */
    this.sharePolicyOnFound = sharePolicyOnFound;
    /**
     * @private
     */
    this.sharePolicyOnNotFound = sharePolicyOnNotFound;
    /**
     * @private
     */
    this.shareRef = shareRef;
    /**
     * @private
     */
    this.aloneTimeout = null;
    /**
     * @private
     */
    this.noHopeToAttach = false;
        
    if (sharingLogger.isDebugLogEnabled()) {
        sharingLogger.logDebug("New connection sharing", 
                "shareName=" + this.shareName,
                "sharePolicyOnFound=" + this.sharePolicyOnFound,
                "sharePolicyOnNotFound=" + this.sharePolicyOnNotFound,
                "preventCrossWindowShare=" + this.preventCrossWindowShare,
                "shareRef=" + this.shareRef);
    }
  };
  
  ConnectionSharing.prototype = {
    /**
     * @private
     */
    createSharedStatus: function(engine,suicideTask,dontDieFor) {
      var shared = new SharedStatus(this.shareName,engine);

      if (this.preventCrossWindowShare) {
        shared.setupLocalSharing();
      } else {
        suicideTask = this.avoidSuicide() ? null : suicideTask;
        shared.setupCrossTabSharing(suicideTask,dontDieFor);

      }

      return shared;

    },

    /**
     * @private
     */
    createChannelsManager: function(engine,bridge) {
      return new ChannelsHandlerMaster(engine,bridge);
    },

    /**
     * @private
     */
    avoidSuicide: function() {
      return ((this.sharePolicyOnFound === Policies.IGNORE) || this.noHopeToAttach);
    },
    
    /**
     * @private
     */
    noHope: function() {
      this.noHopeToAttach = true;
    },
    
    /**
     * @private
     * @param noHopeToAttachToAnotherEngine if true, the client must not try to attach to another engine
     */
    convertToElectionVersion: function(aloneTimeout, noHopeToAttachToAnotherEngine) {
      var newSharePolicyOnFound = noHopeToAttachToAnotherEngine ? Policies.IGNORE : this.sharePolicyOnFound;
      var newSharePolicyOnNotFound = this.sharePolicyOnFound == Policies.ATTACH || this.sharePolicyOnFound == Policies.FAST ? Policies.CREATE : this.sharePolicyOnNotFound;
      var newSharing = new ConnectionSharing(this.shareName, newSharePolicyOnFound, newSharePolicyOnNotFound, this.preventCrossWindowShare, this.shareRef);
      newSharing.aloneTimeout = aloneTimeout;
      return newSharing;
    },

    /**
     * @private
     */
    findEngine: function(client) {

      if (this.sharePolicyOnFound == Policies.IGNORE && this.sharePolicyOnNotFound == Policies.CREATE) {
        //IGNORE && CREATE
        //create now
        sharingLogger.logInfo("A new sharing will be immediately created");
        return Search.failSearch;

      } else if ((this.sharePolicyOnFound == Policies.IGNORE || this.sharePolicyOnFound == Policies.ABORT) && this.sharePolicyOnNotFound == Policies.ABORT) {
        //IGNORE && ABORT
        //fail now
        //ABORT && ABORT
        //fail now
        sharingLogger.logInfo("No way to obtain a sharing, this client will fail immediately");
        return Search.abortSearch;

      } else {
        //IGNORE && WAIT
        //will search forever :O

        //ABORT && WAIT
        //will search until it aborts

        //ABORT && CREATE
        //search, if found abort otherwise create

        //ATTACH/ATTACH:FAST && CREATE
        //search, if found attach otherwise create

        //ATTACH/ATTACH:FAST && ABORT
        //search, if found attach otherwise abort

        //ATTACH/ATTACH:FAST && WAIT
        //will search until it finds one

        sharingLogger.logInfo("A sharing will now be searched");
                
        return new Search(client,this.shareName,this.sharePolicyOnFound,this.sharePolicyOnNotFound,this.preventCrossWindowShare,this.shareRef,this.aloneTimeout);

      }

    },

    /**
     * Inquiry method that returns the share name configured in this instance.
     *
     * @return {String} The configured share name.
     *
     * @see LightstreamerClient#enableSharing
     */
    getShareName: function() {
      return this.shareName;
    },
    
    /**
     * Connection sharing is possible only if the environment supports SharedWorkers or the user requested a local sharing.
     */
    isPossible: function() {
        return this.preventCrossWindowShare || SharedWorkerManager.canGenerate();
    }


  };

  ConnectionSharing.prototype["getShareName"] = ConnectionSharing.prototype.getShareName;

  Inheritance(ConnectionSharing,Setter,true,true);
  return ConnectionSharing;
})();
  
