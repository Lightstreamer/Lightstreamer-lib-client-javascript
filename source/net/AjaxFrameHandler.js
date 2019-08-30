import LoggerManager from "../../src-log/LoggerManager";
import FrameConnection from "./FrameConnection";
import Request from "./Request";
import Utils from "../Utils";
import Executor from "../../src-tool/Executor";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import IFrameHandler from "../../src-tool/IFrameHandler";
import Global from "../Global";
import Environment from "../../src-tool/Environment";
import Inheritance from "../../src-tool/Inheritance";
import Dismissable from "../../src-tool/Dismissable";
import Constants from "../Constants";
import Helpers from "../../src-tool/Helpers";

  //possible statuses
  var DISABLED = -1; //we will never use XHR
  var LOADING_FRAME = 0; //downloading the ajax_frame.html
  var READY = 1; //can use XHR right now
  var NO_INIT = 2; //ajax_frame.html not yet loaded (ie requested by someone)
  var LOADING_AGAIN = 3; //download possibly failed, trying again
  var GIVE_UP = 4; //
  
  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  
  
  /**
   * this timeout does not block the current download, but let the sendXHR return false instead of returning true
   * this MUST be < than the connection timeout, otherwise:
   *   if the ajax frame is not on the server we will never connect
   *   also if the roundtrip is > than 4 seconds we will never try a connection in html;
   *      (actually if the roundtrip is > 4 seconds we will never wait enough for a server request to return, by the way...) 
   */
  var giveUpTimeout = 2000;
  var ajaxFrameTimeout = 10000;  // milliseconds
  
  var nextAFrame = 0;
  
  var createdFrames = {};
  
  var AjaxFrameHandler = function(path) {
    this.path = path;
    
    this.ajaxTimeoutPhase = Helpers.randomG(); 
    this.status = Environment.isBrowserDocument() && (window.ActiveXObject || typeof(XMLHttpRequest) != "undefined") ? NO_INIT  : DISABLED;
    
    this.aframeId = ++nextAFrame;
    this.frameName = "LS_AJAXFRAME_" + this.aframeId;
    
    this.initTouches();
    
    this.attachToGlobal();
  };
  
  AjaxFrameHandler.getAjaxFrame = function(serverAndServerUrlPath) {
    if (!createdFrames[serverAndServerUrlPath]){
      createdFrames[serverAndServerUrlPath] = new AjaxFrameHandler(serverAndServerUrlPath);
      createdFrames[serverAndServerUrlPath]._load(false);
    }
    return createdFrames[serverAndServerUrlPath];
  };
  
  function cleanStaticRef(serverAndServerUrlPath) {
    if (createdFrames[serverAndServerUrlPath]){
      delete (createdFrames[serverAndServerUrlPath]);
    }
  }
  

  AjaxFrameHandler.prototype = {
      
    /*public*/ toString: function() {
      return ["[","AjaxFrameHandler",this.status,"]"].join("|");
    },
    
    /*private*/ attachToGlobal: function() {
      //exports the LS_a method
      var that = this;
      Global.exportGlobal(this.aframeId,"LS_a",function(phase) {
        that.onAjaxFrameReady(phase);
      },"A");
    },
    
    /*private*/ clean: function(ph) {
      this.status = DISABLED;
      Global.cleanGlobal(this.aframeId,"LS_a","A");
      cleanStaticRef(this.path);
      IFrameHandler.disposeFrame(this.frameName);
    },
    
    /*private*/ init: function(retrying) {
      this.ajaxTimeoutPhase++; 
      this.status = retrying ? LOADING_AGAIN : LOADING_FRAME;
    },
    
    /*public*/ _load: function(retrying) {
      if (this.status == DISABLED) { //cannot use this.isDisabled() here as LOADING_AGAIN (and GIVE_UP) is a good status for _load to be called
        return;
      }
      
      streamLogger.logDebug("Loading XHR frame to perform non-cross-origin requests");
          
      if (this.isReady()) {
        //we already have this server's ajax frame 
        return;
        
      } else {
        this.init(retrying); //incs phases
        var localTimeoutPhase = this.ajaxTimeoutPhase;
        
        if (Utils.isOffline()) {
          //should be useless, if we're offline the createSession is continuosly checking if we have returned online; as soon as we are 
          //(online) a new _load will be called by the SessionHandler 
          streamLogger.logDebug("Client is offline, will retry later to load XHR frame");
                    
          /*Executor.addTimedTask(this.asyncLoad,ajaxFrameTimeout,this,[localTimeoutPhase]);
          return;*/
        }
        
        var _command = "id="+this.aframeId+"&";
        if (!Utils.hasDefaultDomain()) {
          _command += "domain="+ Utils.getDomain() +"&";
        }
        
        var ajReq = new Request(this.path,"xhr.html",_command);
        
        var frameLoader = new FrameConnection(this.frameName);

        frameLoader._load(ajReq);
        
        //give some seconds to the ajax frame to be loaded
        Executor.addTimedTask(this.frameTimeout,ajaxFrameTimeout,this,[localTimeoutPhase]);
        Executor.addTimedTask(this.giveUp,giveUpTimeout,this,[localTimeoutPhase]);
        
      }
      
    },
    
    /*internal*/ onAjaxFrameReady: function() {
      if (EnvironmentStatus.isUnloaded()) { //must check the unloaded because is called by the ajaxFrame thread
        return;
      }

      if (this.status != READY) {

        streamLogger.logDebug("XHR frame loaded");
        //the ajax frame spent some time to be downloaded,
        //but now it's here and we can start using it again
        this.status = READY;
      }
    },
    
    /*private*/ frameTimeout: function(localTimeoutPhase) {
      if (this.status == DISABLED) {
        return;
      }
      if (this.ajaxTimeoutPhase == localTimeoutPhase && !this.isReady()) {
        streamLogger.logDebug("XHR frame loading timeout expired, try to reload");
        //the ajax frame didn't arrive, next attempt will return false
        //in the meanwhile we try reloading it
        
        this._load(true);
      }
    },
    
    /*private*/ giveUp: function(localTimeoutPhase) {
      if (this.status == DISABLED) {
        return;
      }

      if (this.ajaxTimeoutPhase == localTimeoutPhase && !this.isReady()) {
        streamLogger.logDebug("XHR frame loading timeout expired again, will not try again");
        //next attempt will return false
        this.status = GIVE_UP;
      }
    },
    
    /*internal*/ disable: function() {
      this.status = DISABLED;
      this.ajaxTimeoutPhase++;
    },
    
    /*public*/ isReady: function() {
       return this.status === READY;
    },
    
    /*public*/ isDisabled: function() {
      return this.status === DISABLED || this.status === LOADING_AGAIN || this.status === GIVE_UP;
    },
    
    /**
     * @return {boolean} one of the following: 
     * null means "please wait", 
     * false means "no way", 
     * true means "sent"
     */
    /*public*/ sendXHR: function(_url,_data,senderObject,extraHeaders) {
      if (this.isDisabled()) {
        return false;
      } else if(this.status !== READY) {
        return null; //try later please
      }
        
      streamLogger.logDebug("Passing request to the XHR frame",_url);
      
      var done;
      try {
        done = IFrameHandler.getFrameWindow(this.frameName)["sendRequest"](_url, _data, senderObject,extraHeaders) !== false;
        
      } catch(_e) {
        //we don't know what's happened, what should we do?
        done = false;
        streamLogger.logDebug("Error passing request to the XHR frame",_e);
      }
  
      if (done === false) {
        //if we received a false we completely disable the use of XHR
        this.disable();
      } 
      
      return done;
    }
  
  };
  
  Inheritance(AjaxFrameHandler,Dismissable,true,true);
  export default AjaxFrameHandler;
  
