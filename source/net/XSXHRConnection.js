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
import BrowserDetection from "../../src-tool/BrowserDetection";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import StreamAsStringHandler from "./StreamAsStringHandler";
import Environment from "../../src-tool/Environment";
import LoggerManager from "../../src-log/LoggerManager";
import Utils from "../Utils";
import Constants from "../Constants";
import nodeUtils from 'node-utils';

  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);

  var HAVE_HTTP_STATUS = Environment.isBrowser() ? 2 : 3;

  //status 0 happens in case of a 307 redirect that gets in a CORS context
  //it is also received if the server is down.
  //In the former case we want to retry immediately, in the other case we want
  //a delay.
  //Thus we alternate the error caused by  status 0 between an unable-to-open
  //(i.e.: we were unable to send the request) and a standard error (network reached,
  //but we are unable to connect)
  var CONSIDER_STATUS_0_UNABLE_TO_OPEN = true;

  var NodeXHR;
  if (Environment.isNodeJS()) {
    NodeXHR = nodeUtils.NodeXHR;
  }
  
  var objectIdCounter = 1;

  function XSXHRConnection() {
     this._callSuperConstructor(XSXHRConnection);
     
     this.objectId = objectIdCounter++;
     if (streamLogger.isDebugLogEnabled()) {
         streamLogger.logDebug("New CORS-XHR connection oid=", this.objectId);
     }
     this.isOpen=false;

     this.sendPhase=null;
     this.cachedSenderStatus = null;
     this.xhrInstance = null;

     this.parser = null;

     this.status0Disabled = false;

     this.constr = XSXHRConnection;
  };
  if (XSXHRConnection.name == null) {
      XSXHRConnection.name = "XSXHRConnection";
  }

  var doesWork = null;

  ServerConnection.attachPublicStaticMethods(XSXHRConnection,{
    isAvailable: function() {
      if (doesWork !== null) {
        return doesWork;
      }

      if (BrowserDetection.isProbablyIE(9,true)) {
        doesWork = false;
      } else if (typeof(XMLHttpRequest) != "undefined") {
        var t = new XMLHttpRequest();
        if (typeof(t.withCredentials) != "undefined") {
          doesWork = true;
        } else if (Environment.isOther()) {
          doesWork = true;
        }
      } else if (!Environment.isBrowser() && NodeXHR) {
        doesWork = true;
      }

      if (doesWork === null) {
        doesWork = false;
      }

      return doesWork;
    },
    isStreamEnabled: function() {
    //ATM, Environment.isOther() --> !t.withCredentials --> no streaming. We don't force though (isOther is currently react-active)
      return !BrowserDetection.isProbablyOldOpera() && !BrowserDetection.isProbablyPlaystation();
    },
    isCrossSite: true,
    isCrossProtocol: true,
    areCookiesGuaranteed: function() {
      if (Environment.isNodeJS()) {
        // uses a dedicated class
        return true;
      } else if (Constants.PAGE_PROTOCOL != "file:") {
        return true;
      } else if (! Environment.isBrowserDocument()) {
        // webworker results to be file: but a webworker can't be actually loaded from file: and
        // thus the withCredentials flag would always work
        return true;
      } else {
        // what about others? We do not know
        return false;
      }
    },
    attachEngineId: false,
    canUseCustomHeaders: true
  });

  function getCallback(cb) {
    return function() {
      Executor.executeTask(cb);
    };
  }

  XSXHRConnection.prototype = {

    /*public*/ toString: function() {
      return ["[","XSXHRConnection",this.isOpen,this.sendPhase,this.cachedSenderStatus,"]"].join("|");
    },

    /*public*/ _close: function() {
      if (!this.isOpen) {
        return; //wait please :)
      }

      if (streamLogger.isDebugLogEnabled()) {          
          streamLogger.logDebug("CORS-XHR connection closed oid=", this.objectId);
      }

      //"disable callbacks"
      this.sendPhase = null;

      if (this.xhrInstance) {
        try {
          this.xhrInstance.abort();
        } catch (e) {
          streamLogger.logDebug("Error non closing connection opened using CORS-XHR");
        }
      }

      this.off();
      return;
    },

    /*public*/ _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      if (this.isOpen) {
        return null; //wait please :)
      }

      if (NodeXHR) {
        this.xhrInstance = new NodeXHR();
      } else {
        this.xhrInstance = new XMLHttpRequest();
      }
      this.parser = new StreamAsStringHandler();

      var loadCB = Executor.packTask(this.onPartialResponse,this,[phase,responseCallback,connectionEndCallback,errorCallback]);
      this.xhrInstance.onreadystatechange = getCallback(loadCB);

      /*var that = this;
      this.xhrInstance.onreadystatechange = function() {
        that.onPartialResponse(phase,responseCallback,connectionEndCallback);
      };*/

      this.sendPhase = phase;
      this.cachedSenderStatus = null;

      if (streamLogger.isDebugLogEnabled()) {
          streamLogger.logDebug("CORS-XHR transport sending oid=", this.objectId, request.getFile(), request.getData());
      }

      try {

        this.xhrInstance.open(request.getMethod(), request.getUrl(), true);

        this.xhrInstance.withCredentials = request.getCookieFlag();

        var headers = request.getExtraHeaders();
        if(headers) {
          for (var i in headers) {
            //this will prob make the browser send an OPTIONS request to the server
            this.xhrInstance.setRequestHeader(i,headers[i]);
          }
        }

        this.xhrInstance.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        this.xhrInstance.send(request.getData());

        this.isOpen = true;

      } catch(_e) {
        streamLogger.logError("Error opening CORS-XHR connection oid=", this.objectId,_e);
        return false;
      }

      return true;

    },

    /*private*/ onPartialResponse: function(phase,responseCallback,connectionEndCallback,errorCallback) {
      if (this.sendPhase != phase || EnvironmentStatus.isUnloaded()) {
        return;
      }

      var newData = null;

      if (this.isHttpStatusOk() && responseCallback) {
        if (this.xhrInstance.readyState == 3) {
          newData = this.parser.streamProgress(this.xhrInstance.responseText);

        } else if (this.xhrInstance.readyState == 4) {
          newData = this.parser.streamComplete(this.xhrInstance.responseText);

        }

        if (streamLogger.isDebugLogEnabled()) {
            if (newData) {                
                streamLogger.logDebug("CORS-XHR transport receiving oid=", this.objectId, newData);
            }
        }

        if(newData!=null) {
          Executor.executeTask(responseCallback, [newData,this.sendPhase]);
        }

      }

      if (this.xhrInstance.readyState == 4) {
        if (!this.isHttpStatusOk()) {
          if (this.status0Disabled) {
            if (errorCallback) {
              if (streamLogger.isDebugLogEnabled) {
                  streamLogger.logDebug("CORS-XHR connection error oid=", this.objectId);
              }
              Executor.executeTask(errorCallback, ["status0",this.sendPhase,false,CONSIDER_STATUS_0_UNABLE_TO_OPEN,false]);
            }
            CONSIDER_STATUS_0_UNABLE_TO_OPEN = !CONSIDER_STATUS_0_UNABLE_TO_OPEN;
            this.status0Disabled = false;
          } else {
            if (responseCallback) {
              Executor.executeTask(responseCallback, [null,this.sendPhase]);
            }
          }


        }

        if (streamLogger.isDebugLogEnabled) {
            streamLogger.logDebug("CORS-XHR request completed oid=", this.objectId);
        }

        if (( this.xhrInstance.readyState == 4 || newData == "") && connectionEndCallback) {
          //this is a good end of a connection or a broken connection;
          //let us check
          Executor.addTimedTask(this.notifyEnd, 100, this, [this.sendPhase,connectionEndCallback]);
        }

        this.off();
      }

    },

    /*private*/ notifyEnd: function(ph,connectionEndCallback) {
      Executor.executeTask(connectionEndCallback, [ph]);
    },

    /*private*/ off: function() {
      this.isOpen = false;
      this.sendPhase = null;
      if (this.xhrInstance) {
        //xhr.abort = null;
        delete(this.xhrInstance.onreadystatechange);
        delete(this.xhrInstance);
      }
    },

    /*private*/ isHttpStatusOk: function() {
      try {
        if (this.cachedSenderStatus === null) {
          if (this.xhrInstance.readyState < HAVE_HTTP_STATUS) {
            return false;
          }




          //we have to cache the value as on Chrome (seen on version 10) the status may change from 200 to 0 if the socket is closed...
          this.cachedSenderStatus = this.xhrInstance.status >= 200 && this.xhrInstance.status <= 299;

          if (this.xhrInstance.status == 0) {
            this.status0Disabled = true;
          }
        }
        return this.cachedSenderStatus;

      } catch (_e) {

        streamLogger.logDebug("Error reading CORS-XHR status oid=", this.objectId,_e);
        return false;
      }
    }
  };


  Inheritance(XSXHRConnection, ServerConnection);
  export default XSXHRConnection;
