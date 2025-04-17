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
import Global from "../Global";
import Constants from "../Constants";
import Helpers from "../../src-tool/Helpers";
import Executor from "../../src-tool/Executor";
import NewEngineHandler from "../pushpage/NewEngineHandler";
import NewEngineHandlerRemote from "../pushpage/NewEngineHandlerRemote";
import Policies from "./Policies";
import SharedStatus from "./SharedStatus";
import CrossPageBridge from "../cross-tab/CrossPageBridge";
import SharedWorkerBridge from "../cross-tab/SharedWorkerBridge";
import RemotePage from "../cross-tab/RemotePage";

  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);

  var WAIT_ENGINE_TIMEOUT = 1000;

  var TYPE_DIRECT = 1;
  var TYPE_REMOTE_DIRECT = 2;
  var TYPE_WORKER = 3;

  function cleanEngineCookies(id,appName) {
    var manger = SharedStatus.getManager();

    manger.cleanSharedStatus(appName,id);
    manger.removeId(appName,id);
  }

  function Search(client,shareName,policyOnFound,policyOnNotFound,localOnly,shareRef,aloneTimeout) {
    this.shareName = shareName;
    
    this.localOnly = localOnly;
    this.policyOnFound = policyOnFound; //NOTE if shared workers are used we always do it fast
    this.policyOnNotFound = policyOnNotFound;
    this.shareRef = shareRef;

    this.getNextPhase = 0;

    this.checkedEngines = {}; //this is used to prevent getEngineValues from returning twice the same engine

    this.searchPhase = 0;

    this.client = client;
    this.resolved = false;

    this.aloneTimeout = aloneTimeout || Constants.ALONE_CHECK_TIMEOUT;

    this.ok = null;
    this.no = null;
    
    this.noHope = false;
  }

  Search.activeSearches = 0;

  Search.prototype = {

    stop: function() {
      sharingLogger.logInfo("Stop search for an engine");
      this.searchPhase++;
      if (!this.resolved){
        this._callNo();
      }
    },
    find: function(alreadyUsed) {
      this.checkedEngines = alreadyUsed || {};
      var promise = this._makePromise();
      this._find(this.searchPhase,false);
      return promise;
    },
    getCheckedEngineList: function() {
      return this.checkedEngines;
    },

    _callOk: function(value) {
      this.resolved = true;
      // promise resolve (see _makePromise)
      this.ok(value);
      this.stop();
    },
    _callNo: function() {
      this.resolved = true;
      // promise reject (see _makePromise)
      this.no();
      this.stop();
    },
    
    _noHope: function() {
      this.noHope = true;
    },

    _onEngineNotFound: function() {

      if (this.policyOnNotFound == Policies.CREATE) {
        sharingLogger.logInfo("No sharing was found, a new sharing will be created");
        this._callOk(null);

      } else if (this.policyOnNotFound == Policies.WAIT) {
        sharingLogger.logInfo("No sharing was found, will keep on searching after a pause",WAIT_ENGINE_TIMEOUT);
        Executor.addTimedTask(this._find,WAIT_ENGINE_TIMEOUT,this,[this.searchPhase, false]);

      } else {
        //FAIL
        sharingLogger.logInfo("No sharing was found, no sharing will be created, this client will fail");
        this._callNo();
      }

    },

    _onEngineFound: function(engineType,ref,engineId) {
      var that = this;
      if (this.policyOnFound == Policies.ABORT) {
        sharingLogger.logInfo("A sharing was found but attaching is disabled, this client will fail");
        this._callNo();

      } else if (this.policyOnFound != Policies.IGNORE) {
        //ATTACH or ATTACH:FAST
        sharingLogger.logInfo("A sharing was found, this will attach to", engineId);
        var eh;
        if (engineType == TYPE_DIRECT) {
          //ref is the LightstreamerEngine
          eh = new NewEngineHandler(this.client);
          ref.bindLocalClient(eh);

        } else {

          var bridge;
          if (engineType == TYPE_REMOTE_DIRECT) {
            //ref is the remote bridge
            bridge = new CrossPageBridge();

          } else /*TYPE_WORKER*/ {
            //ref is the worker blob url
            bridge = new SharedWorkerBridge();
          }
          var promise = bridge.start(ref);
          eh = new NewEngineHandlerRemote(this.client,bridge);
          promise['then'](
                  null,
                  function() { /* error handler */
                      sharingLogger.logInfo("Engine", engineId + " must die");
                      /*
                       * This type of error happens in the following scenario (for example):
                       * - a page is open in HTTP
                       * - another page is open in HTTPS
                       * - both pages have an iframe open in HTTPS containing a LS client connected in HTTPS.
                       * 
                       * Every time a client tries to connect to the shared worker of the other page, 
                       * it gets this fatal error (no communication is possible between the two pages).
                       * 
                       * To avoid endless attempts, the client must ignore other engines.
                       */
                      eh.onEngineDeath(false/*suicided*/, true/*noHopeToAttachToAnotherEngine*/);
                  });
        }

        eh.setEngineId(engineId);
        this._callOk(eh);

      } else {
        //IGNORE
        //what do I need this policy for? o_O
        sharingLogger.logInfo("A sharing was found, but accordingly with the configuration it will be ignored");
        this.stop();
      }


    },



    _find: function(phase,targeted) {
      if (this.searchPhase != phase) {
        return;
      }
      phase =  ++this.searchPhase;


      sharingLogger.logDebug("Searching for available sharing");

      /* Local sharing was disabled because it didn't work well
      var lsEngine = Global.getSharableEngine(this.shareName);
      if (lsEngine) {
        sharingLogger.logDebug("Local engine found");
        //engine is on this window, we use it
        this._onEngineFound(TYPE_DIRECT, lsEngine, lsEngine.getEngineId());

      } else
      */ 
      if (this.localOnly) {
        sharingLogger.logDebug("Local engine not found. Can't search on other pages because of the current sharing configuration");
        this._onEngineNotFound();

      } else if (this.shareRef) {
        sharingLogger.logDebug("Search remote engine in other page");
        try {
          var remoteGlobal = this.shareRef["Lightstreamer"];
          var remoteEngine = remoteGlobal.getSharableEngine(this.shareName);
          
          sharingLogger.logDebug("RemoteEngine =", remoteEngine + " (" + this.shareName + ").");
          
          if (remoteEngine != null) {
            var remoteEngineId = remoteEngine.getEngineId();

            if (remoteGlobal.hasGlobal(remoteEngineId, Constants.WORKER_BRIDGE_GLOBAL)) {
              var worker = remoteGlobal.getGlobal(remoteEngineId, Constants.WORKER_BRIDGE_GLOBAL);
              this._onEngineFound(TYPE_WORKER, worker, remoteEngineId);
              return;

            } else if (remoteGlobal.hasGlobal(remoteEngineId, Constants.FRAME_BRIDGE_GLOBAL)) {
              var bridge = remoteGlobal.getGlobal(remoteEngineId, Constants.FRAME_BRIDGE_GLOBAL);
              this._onEngineFound(TYPE_REMOTE_DIRECT, bridge, remoteEngineId);
              return;
            }
          } else {
            if (targeted == true) {
              this._noHope();
            }
          }
        } catch(e) {
          sharingLogger.logDebug("Can't access reference ", e);
        }

        this.shareRef = null;
        this._find(this.searchPhase,false);


      } else {

        sharingLogger.logDebug("Search remote engine in shared storage");

        var that = this;

        var np = ++this.getNextPhase;
        Executor.addTimedTask(function() {
          if (np == that.getNextPhase) {
            that.getNextPhase++;
          }
        },Constants.STOP_SEARCH_TIMEOUT);

        Search.activeSearches++;
        this._getNextEngineValues(this.getNextPhase)["then"](function(obj) {
          Search.activeSearches--;
          if (phase != that.searchPhase) {
            return;
          }

          sharingLogger.logDebug("Storage inspection complete");

          if (obj == null) {
            sharingLogger.logDebug("No valid engine found");
            that._onEngineNotFound();
          } else {

            sharingLogger.logInfo("Valid engine found: ", obj.id);

            var values = obj.values;
            var blobId = values[Constants.BLOB_INDEX];
            var frameName = values[Constants.FRAME_NAME_INDEX];
            if (blobId !== Constants.NULL_VALUE) {
              try {
                sharingLogger.logDebug("Engine ", obj.id + " shares through shared worker", blobId);
                that._onEngineFound(TYPE_WORKER, blobId, obj.id);
              } catch(e) {
                //no luck with that worker, blacklist it, try again
                that._find(phase,false);
              }
            } else if (frameName !== Constants.NULL_VALUE) {
              sharingLogger.logDebug("Engine ", obj.id + " shares through direct communication", frameName);
              var remotePage = new RemotePage(frameName);
              var remoteWindow = remotePage.getRemotePageReference();

              if (remoteWindow != null) {
                
                //reference is good, try to find an engine in it
                remoteWindow["then"](function(winRef) {
                  that.shareRef = winRef;
                  if (!winRef) {
                      that._noHope();
                    } 
                  
                    that._find(phase, true);
                  
                });
              } else {
                //we were unable to get a hold on the page, ignore this engine and try
                //again
                that._find(phase,false);
              }

            } else {
              //the found values are invalid, ignore this engine and keep going
              sharingLogger.logInfo("invalid values",values);
              that._find(phase,false);
            }
          }


        });
      }
    },

    _makePromise: function() {
      var that = this;
      return new Promise(function(ok,no) {
        that.ok = ok;
        that.no = no;
      });
    },

    _getNextEngineValues: function(ph,prevCallData) {
      if (this.getNextPhase != ph) {
        return Promise.resolve(null);
      }
      var that = this;

      var standardDelay = Constants.REFRESH_STATUS_INTERVAL;
      var slowDelay = Constants.REFRESH_STATUS_INTERVAL+Constants.REFRESH_STATUS_INTERVAL_TOLERANCE;
      var sharedManager = SharedStatus.getManager();

      return new Promise(function(endCall) {
        if (prevCallData) {
          for (var prev in prevCallData) {
            //these are the engines that were valid during the previous check, let's see if they are good to be used
            var values = sharedManager.readSharedStatus(that.shareName, prev);
            if (values && values[Constants.TIMESTAMP_INDEX] != prevCallData[prev]) {
              //promoted! let's attach to it
              that.checkedEngines[prev] = true;
              endCall({
                id: prev,
                values:values
              });
              return;
            }
          }
        }
        var newCallData = {};


        var engines = sharedManager.readIds(that.shareName);
        if (engines) {

          var somethingGood = false;
          for (var i=0; i<engines.length; i++) {
            if (that.checkedEngines[engines[i]]) {
              continue;
            }

            var values = sharedManager.readSharedStatus(that.shareName,engines[i]);
            if (!values  || values.length < 5) {
              cleanEngineCookies(engines[i],that.shareName);
              sharingLogger.logDebug("Unexpected missing values in sharing cookie",engines[i]);
              continue;
            }

            if (values[Constants.BUILD_INDEX] != Constants.BUILD || values[Constants.PROTOCOL_INDEX] != Constants.PAGE_PROTOCOL) {
              //not compatible, skip
              sharingLogger.logDebug("Skipping not compatible engine",values);
              continue;
            }


            var ts = Helpers.getTimeStamp();
            var engineTime = parseInt(values[Constants.TIMESTAMP_INDEX]);
            var diff = ts -engineTime;

            var fastLink = values[Constants.BLOB_INDEX] != Constants.NULL_VALUE || that.policyOnFound == Policies.FAST;
            var maxDiff = fastLink ?  standardDelay : slowDelay;

            if (diff <= maxDiff) {
              //good value

              if (fastLink) {
                //want it fast, solve now!
                that.checkedEngines[engines[i]] = true;
                endCall({
                  id: engines[i],
                  values:values
                });
                return;

              } else {
                //first time we got a good value from this engine, save it and try again
                somethingGood = true;
                newCallData[engines[i]] = engineTime;
              }
            } else {
              //this value is old
              if (fastLink && diff <= slowDelay) {
                //this was a fast link, let's try treat it as a slow link
                somethingGood = true;
                newCallData[engines[i]] = engineTime;

              } else if (diff > 60000) {
                sharingLogger.logInfo("Found a likely dead engine");
                cleanEngineCookies(engines[i],that.shareName);
                //this engine is dead, go on
                continue;

              }//else this is really old, do not consider it

            }
             //we already returned this but we got back here, thus it wasn't good enough
          }

        }

        if (somethingGood) {
          //we have found a valid engine but we have to wait and check again before trying to attach to it
          sharingLogger.logDebug("Valid engine values found. Wait for popup-protection timeout");
          Executor.addTimedTask(function() {
            that._getNextEngineValues(ph,newCallData)["then"](function(obj) {
              endCall(obj);
            });
          },Constants.REFRESH_STATUS_INTERVAL);

        } else if (prevCallData) {
          sharingLogger.logDebug("No compatible sharing detected");
          endCall(null);
        } else {
          //first call got no engine, wait a bit and try again, just in case
          sharingLogger.logDebug("No valid engine values found. Check again in ",that.aloneTimeout);
          Executor.addTimedTask(function() {
            that._getNextEngineValues(ph,{})["then"](function(obj) {
              endCall(obj);
            });
          },that.aloneTimeout);
        }
      });
    }


  };

  Search.failSearch = {
    stop: function(){},
    find: function() {
      return Promise.resolve(null);
    },
    getCheckedEngineList: function() {
      return {};
    }
  };
  Search.abortSearch = {
    stop: function(){},
    find: function() {
      return Promise.reject(null);
    },
    getCheckedEngineList: function() {
      return {};
    }
  };


  export default Search;

