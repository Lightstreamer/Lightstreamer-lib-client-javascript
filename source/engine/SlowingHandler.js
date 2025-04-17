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
import LoggerManager from "../../src-log/LoggerManager";
import Global from "../Global";
import Helpers from "../../src-tool/Helpers";
import ASSERT from "../../src-test/ASSERT";
import Constants from "../Constants";
  
  //Coefficient of the moving average used to collect samples of delays.
  var momentum = 5/10;
  //Maximum level of the delay allowed, beyond which the adjustment is triggered (milliseconds).
  var maxMean = 7000;
  var hugeDelay = 20000;
  
  var protocolLogger = LoggerManager.getLoggerProxy(Constants.PROTOCOL);
  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);
  
  var SlowingHandler = function(policyBean,engId) {
    
    // Time of reception of the first synchronization signal from the server; acts as a reference for subsequent checks on the delay with respect to the server.
    this.refTime = 0;
    // Average delay compared to the server so far measured (milliseconds).
    this.meanElaborationDelay = null;
    
    this.hugeFlag = false;
    
    this.policyBean = policyBean;
    
    this.session = null;
  };
  
  
  SlowingHandler.prototype = {
    
    
    /*public*/ toString: function() {
      return ["[","SlowingHandler",this.meanElaborationDelay,this.refTime,momentum,maxMean,"]"].join("|");
    },
    
    /*public*/ isLate: function(lateVal) {
      return this.meanElaborationDelay!=null  && this.meanElaborationDelay > lateVal;
    },
    
    /*public*/ changeSession: function(newSession) {
      this.session = newSession;
    },
    
    /*public*/ getDelay: function() {
      /*if (!this.policyBean.slowingEnabled) {
        return null;
      }*/
      return this.meanElaborationDelay!=null && this.meanElaborationDelay>0 ? Math.round(this.meanElaborationDelay) : null;
    },
    
    /*public*/ resetSync: function() {
      this.meanElaborationDelay = null;
      this.hugeFlag = false;
    },
    
    /*public*/ prepareForSync: function() {
      this.hugeFlag = false;
    },
   
    /*public*/ testPollSync: function(millis) {
      // we reuse the mechanism for calculating the statistics of streaming
      this.testSync(millis);
      // ignore the result; for polling, if the delays are too high,
      // we could run into a sync error with subsequent reconnection
    },
    
    /*private*/ syncCheck: function(secs) {
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      if (!ASSERT.verifyOk(this.session.isReceivingAnswer())) {
        protocolLogger.logError("Sync message received while session wasn't in receiving status");
      }
    //>>excludeEnd("debugExclude");
      // request for synchronization control
      if (this.session.isStreamingSession()) {
        // sync does not arrive in polling
        // and moreover they would not be significant
        var syncProblem = this.testSync(secs * 1000);

        if (!syncProblem) {
          this.session.onSynchOk();
          
        } else if (this.policyBean.slowingEnabled) {
          // we could use constrains to reduce the flow,
          // but we've seen that polling is enough
          this.session.onSlowRequested();
          
          // the average delay (meanElaborationDelay) of the streaming case
          // remains as the initial estimate of the expected delay to each poll
        }
    
      }
      
    },
    
    /*public*/ startSync: function(isPolling) {
      if (!isPolling) {
        // by convention, in streaming we reset the measurements 
        // of average delays at each new session
        this.resetSync();
      } else {
        // we keep the estimate already accumulated, not only in the previous cycles,
        // but also in the previous session, even if it was streaming;
        // the thing has the only effect to increase the life of the
        // session requested from the Server; we just have to try not to overdo it
      }
      
      this.refTime = Helpers.getTimeStamp();
    },
    
    /*private*/ testSync: function(millis) {
      // heuristic check to determine if the client lags behind
      // and possible relaunch of the server with heuristic modification of the minimum refresh time
      var currTime = Helpers.getTimeStamp();
      
      
      if (!this.refTime) {
        //this cannot happen..btw we handle the case signaling a delay problem
        return true;
      }
      
  /////// leave the comment to trigger the heuristic: //////////////////////////////////////////////////////////////////////////
      // this.refTime -= 2000;
      
      /*cc = !cc ? 1 : cc+1;
       if (cc == 4) {
         this.refTime -= 200000;
       } else if (cc == 5) {
         this.refTime += 200000;
       }*/
      
      var diffTime = (currTime - this.refTime) - millis;
      // calculate a moving average of delays;
      // I do not take into account the distance between the different observations
      if (this.meanElaborationDelay == null) {
        this.meanElaborationDelay = diffTime;
        sessionLogger.logDebug("First sync message, check not performed");
        return false;        // the first time, I don't check
        
      } else {
        
        //detect unlucky sleep
        //we should avoid false positive...how? 
        //If we got a huge delay we forgive the first one but not the second one 
        if (diffTime > hugeDelay && diffTime > this.meanElaborationDelay*2) {
          this.hugeFlag = !this.hugeFlag;
          if (this.hugeFlag) {
            sessionLogger.logInfo("Huge delay detected by sync signals. Restored from standby/hibernation?");
            //let's try to ignore this check, the pc probably slept; we should get a sync error soon
            return this.meanElaborationDelay > maxMean;
          }
        } 
        
        
        this.meanElaborationDelay = this.meanElaborationDelay * momentum + diffTime * (1 - momentum);

        if (this.meanElaborationDelay < 60) { //the executer runs every 50ms, we can forgive such delay
          this.meanElaborationDelay = 0;
          sessionLogger.logDebug("No delay detected by sync signals");
          return false;
              
        } else if (this.isLate(maxMean)) {
          // things are going bad
          sessionLogger.logInfo("Delay detected by sync signals");
          return true;
            
        } else {
          sessionLogger.logDebug("No delay detected by sync signals");
          return false;
            
        }
      }
    }
    

  };
  
  export default SlowingHandler;
  
