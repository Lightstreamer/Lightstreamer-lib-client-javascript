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
import Bean from "./Bean";
import Inheritance from "../../src-tool/Inheritance";
import Utils from "../Utils";
  
  var noNotificationList = {};

  var varNames = {
      connectionRequested: "connectionRequested",
      clientsCount: "clientsCount"
  };
  varNames = Utils.getReverse(varNames); 

  var Configuration = function(toClone){

    this.connectionRequested = false;
    this.clientsCount = 0;

    
    this.noNotificationList = noNotificationList; 
    this.varNames = varNames;
    
    this._callSuperConstructor(Configuration,arguments); 
    this.constr = "Configuration";
    
  };

  Configuration.prototype = {
    getConnectionRequested: function() {
      return this.connectionRequested;
    },
    getClientsCount: function() {
      return this.clientsCount;
    }
  };
  
  Inheritance(Configuration, Bean);
  export default Configuration;
  
