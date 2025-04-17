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
//see (the name there are obsolete, but the flow is quite the same):
//https://docs.google.com/a/lightstreamer.com/drawings/d/1AUup89gqDhESi5j94gLsk7rS0T_FUSZ6hsbs1SCy_rM/edit?hl=en

import ServerConnection from "./ServerConnection";
import Inheritance from "../../src-tool/Inheritance";
import AjaxFrameHandler from "./AjaxFrameHandler";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import Executor from "../../src-tool/Executor";
import Environment from "../../src-tool/Environment";
import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";

  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  var COMM_START = "/"+"*";
  
  var XHRConnection = function() {
    this._callSuperConstructor(XHRConnection);
    
    this.sendPhase = null;
    this.sender = null; //this will be the actual XHR 
    
    this.cachedSenderStatus = null;
    
    this.response = null;
    this.error = null;
    
    this.isOpen = false;
    this.phase = 0;
    
    this["LS_x"] = this.onErrorImpl;
    this.myFrameHandler = null;
    
    this.constr = XHRConnection;
  };
  if (XHRConnection.name == null) {
      XHRConnection.name = "XHRConnection";
  }
  
  ServerConnection.attachPublicStaticMethods(XHRConnection,{
    isAvailable: function() {
      return Environment.isBrowserDocument() && (window.ActiveXObject || typeof XMLHttpRequest != "undefined");
    },
    isCrossSite: false,
    isCrossProtocol: false,
    areCookiesGuaranteed: true,
    attachEngineId: false,
    canUseCustomHeaders: true
  });
  
  XHRConnection.prototype = {
    
    /*public*/ toString: function() {
      return ["[","XHRConnection",this.isOpen,this.phase,this.sendPhase,"]"].join("|");
    },
    
    /*public*/ _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      this.myFrameHandler = AjaxFrameHandler.getAjaxFrame(request.getPath()); 
      
      if (this.myFrameHandler.isDisabled()) {
        this.myFrameHandler.dismiss();
        return false;
      } else if (!this.myFrameHandler.isReady()) {
        //wait please :)
        return null;
      } else if (this.isOpen) {
        return null; //wait please :)
      }
      
      this.myFrameHandler.touch();
      
      this.sendPhase = phase;
      
      this.cachedSenderStatus = null;
      
      this.response = responseCallback;
      this.error = errorCallback;
      this.connectionEndCallback = connectionEndCallback;
      
      this.phase++;
      var that = this;
      var ph = this.phase;
      this["LS_h"] = function() {
        that.onReadyStateChangeImpl(ph);
      };
      
      this.isOpen = true;
      
      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("XHR transport sending", request.getFile(), request.getData());
      }
      
      return this.myFrameHandler.sendXHR(request.getUrl(),request.getData(),this,request.getExtraHeaders());
      
    },
    
    /*public*/ _close: function() {
      if(!this.isOpen) {
        return;
      }
      this.off();
      
      streamLogger.logDebug("Closing connection opened using XHR");
      
      try {
        if (this.sender && this.sender.abort) {
          this.sender.abort();
        }
      }catch(_ee) {
        //IE 8 may throw an exception while testing (just testing) the abort function, so we catch it  
        streamLogger.logError("Error closing connection opened using XHR",_ee);
      }
      this.cleanRef();
    },
    
    /*
     * on FX2 accessing the this.sender.status property of a request that failed due
     * to a network issue (ie the server is down) throws an exception. (IE9 in the same situation says status 12029...)
     * So it must be handled as a non-200 response (passing null to the responseCallback).
     * 
     * Note that IE9 RC throws an exception if the readyState is 3 and we check the status property; The message of the exception is "Unknown Error",
     * moreover if we try to access the responseText it says "not ready". In any case, at the moment XHRStreamingConnection is disabled on IE so that 
     * this problem should not arise.
     */
    /*private*/ isHttpStatusOk: function() {
      try {
        if (this.cachedSenderStatus === null) {
          if (this.sender.readyState < 2) {
            return false;
          } 
          //we have to cache the value as on Chrome (seen on version 10) the status may change from 200 to 0 if the socket is closed... 
          this.cachedSenderStatus = this.sender.status >= 200 && this.sender.status <= 299;
        } 
        return this.cachedSenderStatus;
        
      } catch (_e) {
        streamLogger.logDebug("Error reading XHR status",_e);
        return false;
      }
    },
    
    /*private*/ onReadyStateChangeImpl: function(ph) {
      if (EnvironmentStatus.isUnloaded() || ph != this.phase || !this.sender) { //must test unloaded because this method is called by XHR s thread
        return;
      }

      //should return true when the response is complete, false otherwise
    //not sure if "complete" is really needed (IE6 returns 4 as the other browsers)
      if (this.sender.readyState == 4 || this.sender.readyState == "complete") { 
        var _data = null;
        if (this.isHttpStatusOk()) {
          _data = this.sender.responseText;
          _data = _data.toString();
          if (_data.substring(0, 2) == COMM_START) { 
            _data = _data.substring(2, _data.length - 2);
          }
        } 
        
        if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("XHR transport receiving",_data);
        }


        if (this.response) {
          Executor.executeTask(this.response,[_data, this.sendPhase]);
        }

        Executor.addTimedTask(this.notifyEnd, 100, this, [this.sendPhase]);

        this.off();
        //request complete, remove references
        this.cleanRef();
      }
    },

    /*private*/ notifyEnd: function(ph) {
      Executor.executeTask(this.connectionEndCallback, [ph]);
    },
    
    /*private*/ onErrorImpl: function(e) {
      if (EnvironmentStatus.isUnloaded()) { //must test unloaded because this method is called by XHR s thread
        return;
      }
      
      //when it happens XHR is disabled, there is no need to check phase and so on
      //http://www.w3.org/TR/XMLHttpRequest/#exceptions
      //Note that only SECURITY_ERR is possible as we make asynchronous XHR requests
      this.myFrameHandler.disable();
      
      streamLogger.logDebug("Error on connection opened using XHR");
      
      this.off();
      if (this.error) {
        Executor.executeTask(this.error,["xhr.unknown",this.sendPhase,false,false,false]);
      }
      this.cleanRef();
    },
    
    /*private*/ cleanRef: function() {
       //try to remove circular reference (btw since such circle is wrapped 
        //it should not cause IE's leak even if left where it is)
        try {
          delete this.sender.onreadystatechange;
        } catch(_e) {
          //Firefox 3.5 sometimes passes from here
          streamLogger.logDebug("Error on disposing XHR's callback",_e);
        }
        try {
          delete this.sender;
        } catch(_e) {
          streamLogger.logDebug("Error on disposing XHR",_e);
        }
        
        this.error = null;
        this.response = null;
        
        if (this.myFrameHandler) {
          this.myFrameHandler.dismiss();
        }
    },
    
    /*private*/ off: function() {
      this.isOpen = false;
      this.phase++;
    }
  };
  
  Inheritance(XHRConnection, ServerConnection);
  export default XHRConnection;
  
