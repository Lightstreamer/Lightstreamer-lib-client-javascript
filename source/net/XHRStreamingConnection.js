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
import XHRConnection from "./XHRConnection";
import Inheritance from "../../src-tool/Inheritance";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import Executor from "../../src-tool/Executor";
import BrowserDetection from "../../src-tool/BrowserDetection";
import StreamAsStringHandler from "./StreamAsStringHandler";
import Environment from "../../src-tool/Environment";
import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";

  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  
  var XHRStreamingConnection = function() {
    this._callSuperConstructor(XHRStreamingConnection);
   
    this.parser = null;

    this.constr = XHRStreamingConnection;
  };
  if (XHRStreamingConnection.name == null) {
      XHRStreamingConnection.name = "XHRStreamingConnection";
  }
  
  var xhrCanStream = null;
  
  ServerConnection.attachPublicStaticMethods(XHRStreamingConnection,{
    isAvailable: function() {
      if (xhrCanStream !== null) {
        return xhrCanStream;
      }
      
      if (!Environment.isBrowserDocument()) {
        xhrCanStream = false;
      } else if (BrowserDetection.isProbablyIE()) {
     // on IE9 the test passes but the XHR streaming does not work, so we add a IE specific clausole
        xhrCanStream = false; 
      } else if (typeof(XMLHttpRequest) != "undefined") {
        xhrCanStream = typeof(new XMLHttpRequest().addEventListener) != "undefined";
      } else {
        xhrCanStream = false;
      }
      return xhrCanStream;
    },
    isStreamEnabled: function() {
      return !BrowserDetection.isProbablyOldOpera();
    },
    isCrossSite: false,
    isCrossProtocol: false,
    areCookiesGuaranteed: true,
    attachEngineId: false,
    canUseCustomHeaders: true
  });
  
  
  XHRStreamingConnection.prototype = {
    
    /*public*/ toString: function() {
      return ["[","XHRStreamingConnection",this.isOpen,this.phase,this.sendPhase,"]"].join("|");
    },
    
    /*public*/ _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
       var superCall = this._callSuperMethod(XHRStreamingConnection,this._loadName,[request,phase,responseCallback,errorCallback,connectionEndCallback]);
       
       streamLogger.logDebug("Streaming enabled on XHR");
       
       if (superCall) {
         this.parser = new StreamAsStringHandler();
       }
       return superCall;
    },

    /*private*/ onReadyStateChangeImpl: function(ph) {
      if (EnvironmentStatus.isUnloaded() || ph != this.phase || !this.sender) { //must test unloaded because this method is called by XHR s thread
        return;
      }
      
      var newData = null;
      if (this.isHttpStatusOk() && this.response) {
        if (this.sender.readyState == 3) {
          newData = this.parser.streamProgress(this.sender.responseText);
          
        } else if (this.sender.readyState == 4) {
          newData = this.parser.streamComplete(this.sender.responseText);
          
        }
        
        if (streamLogger.isDebugLogEnabled()) {
            streamLogger.logDebug("XHR transport receiving",newData);
        }
        
        if(newData!=null) {
          Executor.executeTask(this.response,[newData, this.sendPhase]);
        }
        
      }

      if (this.sender.readyState == 4) {
        if (!this.isHttpStatusOk() && this.response) {
          Executor.executeTask(this.response,[null, this.sendPhase]);
        }


        if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("XHR transport receiving");
        }

        if ((this.sender.readyState == 4 || newData == "") && this.connectionEndCallback) {
          //this is a good end of a connection or a broken connection;
          //let us check
          Executor.addTimedTask(this.notifyEnd, 100, this, [this.sendPhase]);

        }

        this.off();
        //request complete, remove references
        this.cleanRef();
      }
      
    }
      
  };
  
  Inheritance(XHRStreamingConnection, XHRConnection);
  export default XHRStreamingConnection;

