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
import EnvironmentStatus from "../src-tool/EnvironmentStatus";
import Environment from "../src-tool/Environment";
  
  var ls = "Lightstreamer";
  
  var Lightstreamer = {
    wstatus: EnvironmentStatus,
    
    
    toString: function() {
      return "["+ls+" "+this["library"]+" client version "+this["version"]+" build " +this["build"]+"]";
    },
   
    exportGlobal: function(exportId,exportName,exportVal,prefix) {
      prefix = prefix || "_";
      
      var gName = prefix+exportId;
      if (!this[gName]) {
        this[gName] = {};
      }
      this[gName][exportName] = exportVal;
      
      return ls+"."+gName+"."+exportName;
    },
    
    hasGlobal: function(exportId,exportName,prefix) {
      prefix = prefix || "_";
      var gName = prefix+exportId;
      return this[gName] && this[gName][exportName];
    },

    getGlobal: function(exportId,exportName,prefix) {
      prefix = prefix || "_";
      var gName = prefix+exportId;
      if (this[gName]) {
        return this[gName][exportName];
      }
      return null;
    },
    
    cleanGlobal: function(exportId,cleanName,prefix) {
      prefix = prefix || "_";
      
      var gName = prefix+exportId;
      if (this[gName] && this[gName][cleanName]) {
        delete(this[gName][cleanName]);
        
        for (var inThere in this[gName]) {
          return;
        }
        delete(this[gName]);
        
      }
    },
    
    cleanAllGlobals: function(exportId,prefix) {
      prefix = prefix || "_";
      
      var gName = prefix+exportId;
      if (this[gName]) {
        delete(this[gName]);
      }
    },
    
    //ExtIframe exports "EQCallback_"+frameName (QXXX) [OK]
      //nobody cleans...
    
    //SessionHandler exports LS_forceReload (_XXX) [OK]
      //cleaned by LightstreamerEngine.suicide
    
    //PushEvents exports: 
      //LS_e (_XXX) [OK]
      //LS_t (_XXX) [OK]
      //LS_u (_XXX) [OK]
      //LS_v (_XXX) [OK]
      //LS_o (_XXX) [OK]
      //LS_n (_XXX) [OK]
      //LS_s (_XXX) [OK]
      //LS_l (_XXX) [OK]
      //LS_w (_XXX) [OK]
        //cleaned by LightstreamerEngine.suicide
  
    //LightstreamerEngine exports lsEngine on its bind call (_XXX) [OK]
      //cleans all _XXX on its suicide call
    
    //AjaxFrame exports LS_a on its attachGlobal call (AXXX) [OK}
      //nobody cleans...
  
    //PushPage exports lsPage on its changeStatusPhase call (PXXX) [OK]
      //cleans PXXX.lsPage on its changeStatusPhase call 
      
    localSharedEngines: {},
    addSharableEngine: function(name,lsEngine) {
      var sharedEngines = this.localSharedEngines;

      if (!sharedEngines[name]) {
        sharedEngines[name] = [];
      }
      sharedEngines[name].push(lsEngine);
    },
    removeSharableEngine: function(name,lsEngine) {
      var sharedEngines = this.localSharedEngines[name];
      
      if (sharedEngines) {
        for (var i = 0; i < sharedEngines.length; i++) {
          if(sharedEngines[i] == lsEngine) {
            sharedEngines.splice(i,1);
          }
        }
        if (sharedEngines.length == 0) {
          delete(sharedEngines[name]);
        }
      }
    },
    
    getSharableEngine: function(engineName) {
      if (this.localSharedEngines[engineName]) {
        var sharedEngines = this.localSharedEngines[engineName];
        if (sharedEngines && sharedEngines.length > 0) {
          //we grab the first one 
          return sharedEngines[0];
        }
      }
      return null;
    }
    
    
    
  };
  
  //OpenAjax
  if (Environment.isBrowserDocument()) {
    if (window.OpenAjax && window.OpenAjax.hub) {
        window.OpenAjax.hub.registerLibrary(ls, "http://www.lightstreamer.com/", Lightstreamer.version);
    }

    //create the global object
    window["Lightstreamer"] = Lightstreamer;
  }


  Lightstreamer["library"] = Constants.LIBRARY_NAME;
  Lightstreamer["version"] = Constants.LIBRARY_VERSION;
  Lightstreamer["build"] = Constants.BUILD;
  
  
  export default Lightstreamer;  
