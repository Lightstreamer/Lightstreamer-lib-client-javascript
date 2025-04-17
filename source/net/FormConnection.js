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
import FakeNotifyConnection from "./FakeNotifyConnection";
import Inheritance from "../../src-tool/Inheritance";
import IFrameHandler from "../../src-tool/IFrameHandler";
import Executor from "../../src-tool/Executor";
import Environment from "../../src-tool/Environment";
import LoggerManager from "../../src-log/LoggerManager";
import LegacyEncoder from "../encoders/LegacyEncoder";
import Constants from "../Constants";
import Utils from "../Utils";
  
  var LEGACY_ENCODER = new LegacyEncoder();
  
  var streamLogger = LoggerManager.getLoggerProxy(Constants.STREAM);
  
  var formLifeSpan = 1000;
  
  var FormConnection = function(_target) {
    this._callSuperConstructor(FormConnection); 
    if (_target) {
      this.target = Utils.sanitizeIFrameName(_target);
      IFrameHandler.getFrameWindow(_target,true); 
    }
    
    this.isOpen = false;
    this.constr = FormConnection;
    this.loadPhase = 0;
  };
  
  ServerConnection.attachPublicStaticMethods(FormConnection,{
    isAvailable: function() {
      return Environment.isBrowserDocument();
    },
    isCrossSite: true, //is not actually cross site, btw as we ignore its responses we can say that isCrossSite 
    isCrossProtocol: true, //is not actually cross site, btw as we ignore its responses we can say that isCrossSite
    areCookiesGuaranteed: true,
    attachEngineId: true,
    canUseCustomHeaders: false
  });
  
  FormConnection.prototype = {
    
    /*public*/ toString: function() {
      return ["[","FormConnection",this.target,"]"].join("|");
    },
    
    /*public*/ _close: function() {
      streamLogger.logDebug("Closing connection opened using html form; actually doing nothing");
      this.isOpen = false;
      this.loadPhase++;
    },

    /*public*/ _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      if (this.isOpen) {
        return null; //please wait
      }
      this._callSuperMethod(FormConnection,this._loadName,[request,phase,responseCallback,errorCallback]);
      
      try {
        this.loadPhase++;
        var formToUse = this.generateForm();
        if (!formToUse) {
          return false;
        }
        
        if (streamLogger.isDebugLogEnabled()) {
            streamLogger.logDebug("Html form transport sending", request.getFile(), request.getData());
        }
        
        formToUse.formEl.method = request.getMethod();
        formToUse.formEl.target = this.target;
        formToUse.formEl.action = request.getUrl();
        
        formToUse.queryString.value = request.getData();
        formToUse.formEl.submit();
        
        var ph = this.loadPhase;
        Executor.addTimedTask(this.deleteForm,formLifeSpan,this,[formToUse.formEl,ph]);
        
        this.isOpen = true;
        
      } catch(_e) {
        streamLogger.logError("Error while sending request using html form",_e);
        return false;
      }

      return true;
    },
    
    /*private*/ generateForm: function() {
      var _body = document.getElementsByTagName("BODY")[0];
      if (!_body) {
        return null;
      }
      
      var formObj = {};
      formObj.formEl = document.createElement("FORM");
      try {
        formObj.formEl.acceptCharset="utf-8";
      } catch(_e) {
        //just in case
      }
      formObj.formEl.style.display = "none";
      
      formObj.queryString = document.createElement("INPUT");
      formObj.queryString.type = "hidden";
      formObj.queryString.name="LS_querystring";
      
      formObj.formEl.appendChild(formObj.queryString);
      
      _body.appendChild(formObj.formEl);
      
      return formObj;
 
      
      /*
      <form method="post" name="LS_form" id="LS_form" target="LS_CONTROLFRAME">
        <input type="hidden" name="LS_querystring" id="LS_querystring" value="">
      </form>
      */
    },
    
    /*private*/ deleteForm: function(_el,ph) {
      _el.parentNode.removeChild(_el);
      if (ph == this.loadPhase) {
        this.isOpen = false;
      }
    },
    
    /*public*/ getEncoder: function() {
      return LEGACY_ENCODER;
    }
  };
  
  
  
  Inheritance(FormConnection, FakeNotifyConnection);
  export default FormConnection;

