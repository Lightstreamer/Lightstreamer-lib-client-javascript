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
import Constants from "../Constants";
import Executor from "../../src-tool/Executor";
import Utils from "../Utils";
import LoggerManager from "../../src-log/LoggerManager";
import Helpers from "../../src-tool/Helpers";
  
  var cycleId = 0;
  
  var MAX_STATUSES = 10;
  var NO_CHANGES_TIMEOUT = 60000;
  
  var statsLogger = LoggerManager.getLoggerProxy(Constants.STATS);
  
  
  //Implements ClientListener
  
  var StatusStatistics = function() {
    this.connStatuses = [];
    this._id = ++cycleId;
    
    this.ph = 0;
    this._client = null;
    
    this.start();
  };
  
  
  StatusStatistics.prototype = {
   
      start: function() {
        this.startTime = Helpers.getTimeStamp();
        this.connectedTime = null;
        this.streamSenseTime = this.startTime;
      },
      
      dismiss: function() {
        this.ph++;
      },
      
      noChanges: function(ph) {
        if (ph != this.ph) {
          return;
        }
        
        statsLogger.logWarn("No status changes in ",NO_CHANGES_TIMEOUT,"milliseconds",this.connStatuses);
        
      },
      
      onListenStart: function(_client) {
        this._client = _client;
      },
      
      onStatusChange: function(chngStatus) { 
        this.ph++;
        this.connStatuses.push(chngStatus);
        var now =  Helpers.getTimeStamp();
        
        var isMaster = this._client && this._client.isMaster();
        
        if (chngStatus.indexOf(Constants.CONNECTED) == 0) {
          if (chngStatus.indexOf(Constants.SENSE) > -1) {
                        
            this.streamSenseTime = now;
            
          } else {
            //Hooray! we're connected now!
            this.connectedTime = now;
            
            var timeToSense = this.streamSenseTime-this.startTime;
            var spentTime = this.connectedTime-this.startTime;
            
            statsLogger.logInfo(this._id,"Client connected in/pre-flight in",spentTime,"/",timeToSense,this.connStatuses,isMaster);
            this.connStatuses = [];
            return;
          }
        } 
        
        if (this.connectedTime) {
          //we lost our previous connection, let's reset everything
          this.start();
        }
        
        if (chngStatus != "DISCONNECTED" && !Utils.isOffline()) {
          Executor.addTimedTask(this.noChanges,NO_CHANGES_TIMEOUT,this,[this.ph]);
        }
        
        if (this.connStatuses.length >= MAX_STATUSES) {
          var diff = now-this.startTime;
          statsLogger.logWarn(this._id,"Not connected client after",diff,this.connStatuses,isMaster);
          this.connStatuses = [];
        }
        
      }
  };
  
  export default StatusStatistics;
  
  
