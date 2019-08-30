import LoggerManager from "../../src-log/LoggerManager";
import BrowserDetection from "../../src-tool/BrowserDetection";
import Helpers from "../../src-tool/Helpers";
import Constants from "../Constants";

  var MAD_LIMIT = BrowserDetection.isProbablyFX(1.5,true) ? 10 : 50;
  
  //we know that the problem arises on FX<1.6. for other browsers we keep the control but we wait a lot more before showing the message
  var madLimit = MAD_LIMIT;
  var madCreates = 0;
  var lastTime = 0;
  var firstTime = 0;
  
  var oldMadCreates = null;
  var oldLastTime = null;
  var oldFirstTime = null;
  
  var sessionLogger = LoggerManager.getLoggerProxy(Constants.SESSION);


  var MadTester = {
    
    /*public*/ init: function() {
      madLimit = MAD_LIMIT;
      madCreates = 0;
      lastTime = 0;
      firstTime = 0;
      oldMadCreates = null;
      oldLastTime = null;
      oldFirstTime = null;
    },
    
    /*public*/ incMadTest: function() {
      //save data for possible rollback
      oldMadCreates = madCreates;
      oldLastTime = lastTime;
      oldFirstTime = firstTime;
      
      var nowTime = Helpers.getTimeStamp();
      
      if (!firstTime) {
        //first request
        firstTime = nowTime;
      }
      
      if ((nowTime - firstTime) >= 60000) {
        //more than 1 minute from the previous test, reset
        madCreates = 0;
        firstTime = nowTime;
      }
      
      if (lastTime && (nowTime - lastTime) < 1000) {
        //not enough time between create_session requests, inc
        madCreates++;    
      }
  
      lastTime = nowTime;
    },
    
    /*public*/ rollbackLastMadTest: function() {
      if (oldLastTime != lastTime) {
        madCreates = oldMadCreates;
        lastTime = oldLastTime;
        firstTime = oldFirstTime;
      }
    },
  
    /*public*/ canMakeRequest: function() {
      if (lastTime == 0) {
        // first step. I let it go ...
        return true;
      } else if (!madLimit) {
        // message already given. Return false and declare the client mad
        return false;
      } else if (madCreates >= madLimit) {
        sessionLogger.logError("It has been detected that the JavaScript engine of this browser is not respecting the timeouts in setTimeout method calls. The Client has been disconnected from the Server in order to avoid reconnection loops. To try again, just refresh the page.");
        madLimit = 0;
        return false;
      }
      
      return true;
    }
  };

  export default MadTester;

