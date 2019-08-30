import FrameConnection from "../net/FrameConnection";
import BrowserDetection from "../../src-tool/BrowserDetection";
import IFrameHandler from "../../src-tool/IFrameHandler";
import Executor from "../../src-tool/Executor";
  
  var hgFrameName = "LS6__HOURGLASS";
  var stopDelay = 900;
  
  var Hourglass = function() {
    this.needStopHourGlass = false;
    this.hgFrame=null;
  };

  Hourglass.prototype = {
    
    /*public*/ prepare: function(streamingClass) {
      this.needStopHourGlass = streamingClass === FrameConnection;
      if (this.needStopHourGlass) {
        this.hgFrame = IFrameHandler.getFrameWindow(hgFrameName,true);
      }
      
    },
  
    /*public*/ stopHourGlass: function() {
      Executor.addTimedTask(this.stopHourGlassExe, stopDelay, this);
    },
    
    /*public*/ stopHourGlassExe: function() {
      if (!this.needStopHourGlass) {
        return;
      }
      
      this.needStopHourGlass = false;
      if (BrowserDetection.isProbablyAKhtml()) {
        //SAFARI non soffre della clessidra. Inoltre la window.open porta in 
        //primo piano la pagina in streaming anche se l'uitente l'ha messa dietro
        return;
        
        //IE will not pass from here
        //Opera will not pass from here 
      }
  
      //20110526 -> IE9 on Win7, IE6 on XP   do not need the trick
      //            IE7 on XP,   IE8 on XP   need the trick
      if (BrowserDetection.isProbablyIE(6,true) || BrowserDetection.isProbablyIE(9,false)) {
        return;
      } 
      
      /*
      //this version does not work:
      var stopHourGlass = new Image(); //var stopHourGlass = document.createElement("img");
      stopHourGlass.src = "http://app.lightstreamer.com/PortfolioDemo/images/logo.gif";
      comms_buffer["SHG"] = stopHourGlass;
      */
     
      try {
        
        window.open("about:blank",hgFrameName, null, true);
                
      } catch(exc) {
        //happens on IE7 & IE8;
        //actually happened 326 times on 333 total on the same IP from Houston...
        //just ignore the exception as the only drawback is the hourglass that keeps spinning.
      }

    }
  };
 
  export default Hourglass;
 
