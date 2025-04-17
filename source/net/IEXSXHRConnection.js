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
import ServerConnection from "./ServerConnection";
import Inheritance from "../../src-tool/Inheritance";
import Executor from "../../src-tool/Executor";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import StreamAsStringHandler from "./StreamAsStringHandler";
import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
  
  // var LICENSE_ERR = "LS_window.alert('License not valid for this Client version');";
    // no longer possible with the required Server versions (>= 6.2)
    // the related code has now been removed (without even knowing what it was for)
  
  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  
  var IEXSXHRConnection = function() {
     this._callSuperConstructor(IEXSXHRConnection);
     this.isOpen=false;
     
     this.sendPhase=null;
     this.parser=null;
     this.xDomainReqInstance=null;
     
     this.progresses = 0;
     
     this.constr = IEXSXHRConnection;
  };
  if (IEXSXHRConnection.name == null) {
      IEXSXHRConnection.name = "IEXSXHRConnection";
  }
  
  var canStream = null;
  
  ServerConnection.attachPublicStaticMethods(IEXSXHRConnection,{
    isAvailable: function() {
      if (canStream !== null) {
        return canStream;
      }
      
      if (typeof(XDomainRequest) != "undefined") {
        canStream = true;
      } else {
        canStream = false;
      }
      
      return canStream;  
    },
    isStreamEnabled: true,
    isCrossSite: true,
    isCrossProtocol: false,
    areCookiesGuaranteed: false,
    attachEngineId: false,
    canUseCustomHeaders: false
  });  
  
  function getCallback(cb) {
    return function() {
      Executor.executeTask(cb);
    };
  }
  
  IEXSXHRConnection.prototype = {
    
    /*public*/ toString: function() {
      return ["[","IEXSXHRConnection",this.isOpen,this.sendPhase,"]"].join("|");
    },
    
    /*public*/ _close: function() {
      if (!this.isOpen) {
        return;
      }
      
      streamLogger.logDebug("Closing connection opened using IEXSXHR");
      
      //"disable callbacks"
      this.sendPhase = null;
      
      if (this.xDomainReqInstance) {
        try {
          this.xDomainReqInstance.abort();
          
        } catch (e) {
          streamLogger.logDebug("Error non closing connection opened using IEXSXHR");
        }
      }
      
      this.off();
      
      return;
    },
    
    /*public*/ _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      if (this.isOpen) {
        return null; //wait please :)
      }
      
      this.progresses = 0;
      
      this.xDomainReqInstance = new XDomainRequest();
      this.parser = new StreamAsStringHandler();
          
          
      var loadCB = Executor.packTask(this.respCompleteEvent,this,[phase,responseCallback,connectionEndCallback]);  
      var errorCB = Executor.packTask(this.asyncError,this,[phase,errorCallback,"xdr.err"]);  
      var timeoutCB = Executor.packTask(this.asyncError,this,[phase,errorCallback,"xdr.timeout"]);  
      var progressCB = Executor.packTask(this.progressEvent,this,[phase,responseCallback,false]);  
        

      this.xDomainReqInstance.onload = getCallback(loadCB);
      this.xDomainReqInstance.onerror = getCallback(errorCB);
      this.xDomainReqInstance.ontimeout = getCallback(timeoutCB);
      this.xDomainReqInstance.onprogress = getCallback(progressCB);
      
      this.sendPhase = phase;
      
      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("IEXSXHR transport sending", request.getFile(), request.getData());
      }
      
      try {
      
        this.xDomainReqInstance.open(request.getMethod(), request.getUrl());
        this.xDomainReqInstance.send(request.getData());
        
        this.isOpen = true;
       
        
      } catch(_e) {
        streamLogger.logError("Error opening connection using IEXSXHR",_e);
        return false;
      }
      
      return true;
    },
    
    /*private*/ asyncError: function(phase,errorCallback,mex) {
      if (this.sendPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }
      
      streamLogger.logDebug("Error on connection opened using IEXSXHR");
      
      Executor.executeTask(errorCallback,[mex,phase,false,this.progresses==0,false]);
    },
    
    /*private*/ progressEvent: function(phase,responseCallback,completed) {
      if (this.sendPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }
      
      this.progresses++;
      
      if (responseCallback) {
        var newData;
        if (!completed) {
          newData = this.parser.streamProgress(String(this.xDomainReqInstance.responseText));
        } else {
          newData = this.parser.streamComplete(String(this.xDomainReqInstance.responseText));
        }
        
        if (streamLogger.isDebugLogEnabled()) {
            streamLogger.logDebug("IEXSXHR transport receiving", newData);
        }
        
        if(newData!=null) {
          Executor.executeTask(responseCallback,[newData,this.sendPhase]);
        }
      }       
    },
    
    /*private*/ respCompleteEvent: function(phase,responseCallback,connectionEndCallback) {
      if (this.sendPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }
      
      this.progressEvent(phase,responseCallback,true);
      
      this.off();
      
      streamLogger.logDebug("Connection opened using IEXSXHR completed");
      
      if (connectionEndCallback) {
        //this is a good end of a connection or a broken connection;
        //let us check
        Executor.addTimedTask(this.notifyEnd, 100, this, [connectionEndCallback,phase]);
      }
      
    },
    
    /*private*/ notifyEnd: function(connectionEndCallback,ph) {
      Executor.executeTask(connectionEndCallback, [ph]);
    },
    
    
    /*private*/ off: function() {
      this.isOpen = false;
      this.sendPhase = null;
      this.parser = null;
      this.progresses = 0;
      
      if (this.xDomainReqInstance) {
        this.xDomainReqInstance.onload = null;
        this.xDomainReqInstance.onerror = null;
        this.xDomainReqInstance.ontimeout = null;
        this.xDomainReqInstance.onprogress = null;
        this.xDomainReqInstance = null;
      }
    }
  };
  
  
  Inheritance(IEXSXHRConnection, ServerConnection);
  export default IEXSXHRConnection;

 