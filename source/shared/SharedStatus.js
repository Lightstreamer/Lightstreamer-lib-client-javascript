import Global from "../Global";
import Executor from "../../src-tool/Executor";
import Constants from "../Constants";
import SharedCollector from "./SharedCollector";
import WebStorageManager from "./WebStorageManager";
import SharedCookieManager from "./SharedCookieManager";
import NoStorageManager from "./NoStorageManager";
import Helpers from "../../src-tool/Helpers";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import IFrameHandler from "../../src-tool/IFrameHandler";
import LoggerManager from "../../src-log/LoggerManager";
import Utils from "../Utils";
import SharedWorkerManager from "../cross-tab/SharedWorkerManager";
import SharedWorkerBridge from "../cross-tab/SharedWorkerBridge";
import CrossPageBridge from "../cross-tab/CrossPageBridge";
  
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);
  var defaultManager = Utils.canUseLocalStorage() ? WebStorageManager : SharedCookieManager;
  
  var idPivot = Helpers.randomG();

  var DEFAULT_SHARE_FRAME_TIMEOUT = 500;

  var SharedStatus = function(shareName,engine) {
    this.shareName = shareName;
    this.engine = engine;
    this.id = null;
    this.bridge = null;
    this.manager = NoStorageManager;
  };
  
  
  var TIMESTAMP_INDEX = Constants.TIMESTAMP_INDEX;
  
  SharedStatus.getManager = function(forceCookies) {
    return forceCookies ? SharedCookieManager : defaultManager;
  };
    
  SharedStatus.prototype = {
    toString: function() {
      return ["[SharedStatus",this.id,this.shareName,"]"].join("|");
    },

    getBridge: function() {
      return this.bridge;
    },

    _start: function() {
      this.running = true;
      EnvironmentStatus.addBeforeUnloadHandler(this);
      EnvironmentStatus.addUnloadHandler(this);
    },

    setupCrossTabSharing: function(suicideNotification,dontDieFor,forceCookies,forceFrame) {
      if (this.running) {
        return false;
      }

      this.dontDieFor = dontDieFor || {};

      this.lastTimestamp = null;

      this.shareFrameTimeout = DEFAULT_SHARE_FRAME_TIMEOUT;

      this.suicideNotification = suicideNotification;

      this.currentServer = null;
      this.host = location.host;
      this.frameName = Constants.NULL_VALUE;
      this.blobId = Constants.NULL_VALUE;
      this.preClean = false;

      this.foolOffset = 0;

      //forceCookies is never used by the library, is used by the test though
      if (forceCookies) {
        this.manager = SharedCookieManager;
        SharedCollector.start(true);
      } else {
        this.manager = defaultManager;
        SharedCollector.start();
      }
      this.forceCookies = forceCookies;

      this.startupThread = null;
      this.thread = null;

      this._initId();

      this._setupLocalSharing();
      this.bridge = null;
      if (forceFrame || !SharedWorkerManager.canGenerate()) {
        this.frameName = this.generateFrame();
      } else {
        this.blobId = this.generateWorker();
      }

      this.newerEngines = {};

      sharingLogger.logInfo("SharedStatus remote sharing is ready");

      this._start();
      return true;

    },

    setupLocalSharing: function() {
      if (this.running) {
        return false;
      }

      this._initId(true);
      this._setupLocalSharing();

      sharingLogger.logInfo("SharedStatus local sharing is ready");

      this._start();
      return true;
    },

    _setupLocalSharing: function() {
      Global.addSharableEngine(this.shareName,this.engine);
    },
      
    _initId: function(localOnly) {
      do {
        this.id = idPivot++;
      } while(Global.hasGlobal(this.id,'lsEngine'));

      if (localOnly) {
        return;
      }

      //first add our id to the list of ids per application 
      if (!this.manager.addId(this.shareName,this.id)) {
        //same ID already there? uhm,
         this._initId(); //will generate a new id
         return;
      }
      
      if(this.manager.readSharedStatus(this.shareName,this.id)) {
        //ID not in list but specific cookie already exists? uhm uhm
        this._initId(); //will generate a new id
        return;
      }
    },
    
    _startRefreshThread: function() {
      this.thread = Executor.addRepetitiveTask(this.refreshStatusThread,Constants.REFRESH_STATUS_INTERVAL,this);
      sharingLogger.logInfo("Started refresh thread",this);
    },
    
    /*private*/ generateFrame: function() {
      var frameName = this.frameName;
      if (frameName == Constants.NULL_VALUE) {
        frameName = Utils.sanitizeIFrameName("LSF__"+ Utils.getDomain() +"_"+this.id+"_"+this.shareName);

        this.bridge = new CrossPageBridge();


        Global.exportGlobal(this.id,Constants.FRAME_BRIDGE_GLOBAL,this.bridge);
      }

      if (!IFrameHandler.getFrameWindow(frameName,true)) {
        this.startupThread = Executor.addTimedTask(this.generateFrame,this.shareFrameTimeout,this);
        this.shareFrameTimeout *= 2;
      } else {
        this.shareFrameTimeout = DEFAULT_SHARE_FRAME_TIMEOUT;
        this._startBridge();

      }

      return frameName;
    },

    /*private*/ generateWorker: function() {
      var worker = SharedWorkerManager.createWorker(SharedWorkerBridge.WORKER_CODE);


      this.bridge = new SharedWorkerBridge();
      this._startBridge(worker);

      Global.exportGlobal(this.id,Constants.WORKER_BRIDGE_GLOBAL,worker);

      return worker;
    },

    _startBridge: function(obj) {
      var that = this;
      this.bridge.addListener({
        "onReady": function() {
          that.refreshStatus();
          that.startupThread = Executor.addTimedTask(that._startRefreshThread,0,that);


          that.bridge.removeListener(this);
        }
      });
      this.bridge.start(obj);
    },

    /*public*/ getId: function() {
      return this.id;
    },

    /*public*/ addConnectionToServerFlag: function(serverAddress) {
      if (serverAddress == this.currentServer) {
        return;
      }
      this.currentServer = serverAddress;
      this.manager.addId(serverAddress,this.id,this.shareName);
    },
    
    /*public*/ removeConnectionToServerFlag: function(serverAddress) {
      if (this.currentServer != serverAddress) {
        //unexpected!
        if (this.currentServer == null) {
          sharingLogger.logWarn("Address already removed?",serverAddress);
        } else {
          sharingLogger.logError("Removing wrong address?",this.currentServer,serverAddress);
        }
      } else {
        this.currentServer = null;
      }
      this.manager.removeId(serverAddress,this.id,this.shareName);
    },
    
    /*public*/ getNumberOfConnectionsToServer: function(serverAddress) {
      var ids = this.manager.readIdsObjects(serverAddress);
      if (!ids) {
        return 0;
      }
      var count = 0;
      for (var i=0; i<ids.length; i++) {
        var diff =  Helpers.getTimeStamp() - ids[i].getStatus()[TIMESTAMP_INDEX];
        if (diff >  Constants.REFRESH_STATUS_INTERVAL) {
          continue;
        }
        count++;
      }
      
      return count;
    },
    
    /*private*/ refreshStatus: function() {
      this.lastTimestamp = Helpers.getTimeStamp()+this.foolOffset;
      var myValues = [this.lastTimestamp,this.frameName,this.host,Constants.BUILD,Constants.PAGE_PROTOCOL,this.blobId];
      
      this.manager.writeSharedStatus(this.shareName,this.id,myValues);
    },
    /*private*/ refreshStatusThread: function() {
      if (this.preClean) {
        sharingLogger.logDebug("Engine is probably dying, skip one cookie refresh");
        
        //cleanedCookies is true if the onbeforeunload was executed but the onunload didn't yet 
        //(as we passed the unloaded check)
        //in this case we avoid one refresh, if in 1 second the onunload doesn't execute than 
        //we probably got a false positive onbeforeunload so we can restart refreshing the cookies
        this.preClean = false;
        return;
        //in any case it's not a huge problem to leave cookies as multiple control on the validity of a cookie are performed
      }
      
      var foundFlag = false;
      
      if (this.suicideNotification) { //we may not care about suicide
        sharingLogger.logDebug("Checking status",this);
        var engines = this.manager.readIds(this.shareName);
        if (!engines) {
         //where is my id? do not worry, we're going to rewrite it later
          sharingLogger.logDebug("No engines",this);
        } else {
          sharingLogger.logDebug("Checking shared status to verify if there are similar engines alive",this.shareName);
          
          for (var i = 0; i < engines.length; i++) { 
            if (engines[i] == this.id) {
              continue;
            }
            
            var values = this.manager.readSharedStatus(this.shareName,engines[i]);
            if (!values) {
              sharingLogger.logDebug("Engine found, no values though",engines[i]);
              continue;
            }
            
            if (values[Constants.BUILD_INDEX] != Constants.BUILD || values[Constants.PROTOCOL_INDEX] != Constants.PAGE_PROTOCOL) {
              //not compatible, skip
              sharingLogger.logDebug("Engine found, not compatible though",engines[i]);
              continue;
            }
            
            //in Opera we've seen a case where 2 engines didn't suicide because they had quite always the same value
            //now we try to detect the case and to fool the test...
            if (values[TIMESTAMP_INDEX] == this.lastTimestamp) {
              this.foolOffset = Helpers.randomG(5);
            } 
  
            if (values[TIMESTAMP_INDEX] > this.lastTimestamp) {
              foundFlag |= this.newerEngineFound(engines[i],values[TIMESTAMP_INDEX]);
              
            } else if (this.newerEngines[engines[i]]) {
              delete (this.newerEngines[engines[i]]);
            }
            
          }
        }
      }
      
      if (!foundFlag) {
        sharingLogger.logDebug("Write engine shared status");
        this.manager.addId(this.shareName, this.id);//just in case it disappeared
        this.refreshStatus();
      }
    },
    
    /*private*/ newerEngineFound: function(id,value) {
      sharingLogger.logDebug("Found engine", id + " with a newer status");

      if (this.newerEngines[id]) {
        if (this.newerEngines[id] != value && !this.dontDieFor[id]) {
          sharingLogger.logInfo("There is a concurrent engine. Close engine ", this.id);
          this.executeSuicide();
        } else {
          return false;
        }
      }
      this.newerEngines[id] = value;
      return true;
    },

    /*private*/ executeSuicide: function() {
      this.clean();
      
      if (this.suicideNotification) {
        Executor.executeTask(this.suicideNotification);
      }
    },
    
    
    /*private*/ lightClean: function() {
      //remove my personal values
      
      this.manager.cleanSharedStatus(this.shareName,this.id);
      //remove me from the id list
      this.manager.removeId(this.shareName,this.id);
          
      this.preClean = true;
    },
    
    /*private*/ clean: function() {
      
      //Executor and IFrameHandler are resilient so we don't have to be
      sharingLogger.logInfo("Stopped refresh thread",this);
      Executor.stopRepetitiveTask(this.thread);
      Executor.stopRepetitiveTask(this.startupThread);//works even if the task is not actually repetitive
      this.thread = null;
      this.startupThread = null;

      if (this.frameName != Constants.NULL_VALUE) {
        IFrameHandler.disposeFrame(this.frameName);
      } else if (this.blobId != Constants.NULL_VALUE) {
        SharedWorkerManager.removeWorker(this.blobId);
      }
      this.frameName = Constants.NULL_VALUE;
      this.blobId = Constants.NULL_VALUE;

      
      this.removeConnectionToServerFlag(this.currentServer);

      if (this.shareName) {
        Global.removeSharableEngine(this.shareName, this.engine);
      }
      if (this.bridge) {
        Global.cleanGlobal(this.id,Constants.FRAME_BRIDGE_GLOBAL);
        Global.cleanGlobal(this.id,Constants.WORKER_BRIDGE_GLOBAL);
      }
      this.bridge = null;

      this.lightClean();
    },
    
    /*internal*/ unloadEvent: function() {
      this.clean();
    },
    
    /*internal*/ preUnloadEvent: function() {
      this.lightClean();
    },
    
    /*public*/ dispose: function() {
      this.clean();

      EnvironmentStatus.removeBeforeUnloadHandler(this);
      EnvironmentStatus.removeUnloadHandler(this);
      
      SharedCollector.stop(this.forceCookies);
    }
    
  };
  
  
  SharedStatus.prototype["unloadEvent"] = SharedStatus.prototype.unloadEvent;
  SharedStatus.prototype["preUnloadEvent"] = SharedStatus.prototype.preUnloadEvent;
  
  
  export default SharedStatus;
