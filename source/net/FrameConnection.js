import ServerConnection from "./ServerConnection";
import FakeNotifyConnection from "./FakeNotifyConnection";
import Request from "./Request";
import Inheritance from "../../src-tool/Inheritance";
import IFrameHandler from "../../src-tool/IFrameHandler";
import Executor from "../../src-tool/Executor";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import Environment from "../../src-tool/Environment";
import FormConnection from "./FormConnection";
import LoggerManager from "../../src-log/LoggerManager";
import LegacyEncoder from "../encoders/LegacyEncoder";
import Constants from "../Constants";
import Utils from "../Utils";
  
  var LEGACY_ENCODER = new LegacyEncoder();

  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  
  var FrameConnection = function(target) {
    this._callSuperConstructor(FrameConnection); 
    this.target = Utils.sanitizeIFrameName(target);
    this.callPhase = 0;
    this.isOpen = false;
    this.formConnection = null;
    
    this._frame = IFrameHandler.getFrameWindow(this.target,true);
    
    this.constr = FrameConnection;
  };
  
  /*
  on IE10
    if page is https and server is https, on two different hosts but with the same domain set, this connection will unexpectedly fail.
    Lucky enough such combination does not lead to this connection unless the transport is forced to HTTP-STREAMING.  
  */
  
  ServerConnection.attachPublicStaticMethods(FrameConnection,{
    isAvailable: function() {
      return Environment.isBrowserDocument();
    },
    isCrossSite: false,
    isCrossProtocol: false,
    areCookiesGuaranteed: true,
    attachEngineId: true,
    isStreamEnabled: true,
    canUseCustomHeaders: false
  });
  
  FrameConnection.prototype = {
    
    /*public*/ toString: function() {
      return ["[","FrameConnection",this.isOpen,this.target,this.callPhase,this.formConnection,"]"].join("|");
    }, 
  
    /*private*/ _closeImpl: function(ph) {
      if (ph != this.callPhase) {
        return;
      }
      this.callPhase++;
      if (this.isOpen) {
        this._loadImpl(this.callPhase,Request.aboutBlank);
        this.isOpen = false;
      }
    },
    
    /*public*/ _close: function() {
      streamLogger.logDebug("Closing connection opened using replace on forever-frame");
      var ph = ++this.callPhase;
      Executor.addTimedTask(this._closeImpl,0,this,[ph]);
    },
     
    /*private*/ _loadImpl: function(ph,request,phase,responseCallback,errorCallback) {
      if (ph != this.callPhase || EnvironmentStatus.isUnloading()) {
        return;
      }
      this._callSuperMethod(FrameConnection,this._loadName,[request,phase,responseCallback,errorCallback]);
  
      this.callPhase++;
      
      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("Replace on forever-frame transport sending", request.getFile(), request.getData());
      }
      
      try {
        //we could cache this reference but it seems more secure this way
        var frameRef = IFrameHandler.getFrameWindow(this.target);
        if (frameRef == null) {
            streamLogger.logError("Replace on forever-frame not available");
            return false;
        }
        
        /*Simulates an error only saw on Dario's IE
        if (request.getUrl().indexOf("ajax_frame") == -1) {
          throw "Damned IE";
        }
        */
        
        var _url = request.getUrlWithParams();
      
        frameRef.location.replace(_url);
        this.isOpen = true;
        
      } catch(_e) {
        //what could I do? 
        streamLogger.logError("Error while sending request using  replace on forever-frame",_e);
        return false;
      }
      
      return true;
      
    },
    
    /*private*/ loadByForm: function(request,phase,responseCallback,errorCallback) {
      if (!this.formConnection) {
        this.formConnection = new FormConnection(this.target);
      }
      this.callPhase++;
      var res = this.formConnection._load(request,phase,responseCallback,errorCallback);
      if (res) {
        this.isOpen = true;
      }
      return res;
    },
    
    /*public*/ _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      if (request.method == Request._POST) {
        //we can't handle POST requests, so fall back to a FormConnection
        return this.loadByForm(request,phase,responseCallback,errorCallback);
      }
      var ph = ++this.callPhase;
      Executor.addTimedTask(this._loadImpl,0,this,[ph,request,phase,responseCallback,errorCallback]);
      return true;
    },
    
    /*public*/ getEncoder: function() {
      return LEGACY_ENCODER;
    }
    
  };
  
  Inheritance(FrameConnection, FakeNotifyConnection);
  export default FrameConnection;
  
