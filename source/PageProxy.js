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
import LoggerManager from "../src-log/LoggerManager";
import Helpers from "../src-tool/Helpers";
import Constants from "./Constants";

export default /*@__PURE__*/(function() {
  var trySym = 0;
  var foundWins = 0;
  var messageSeen = false;
  
  var neverOpenAgain = false; 
  
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);
  
  var linkedWindows = [];
  
  /*
   * Composes the code to be executed in the frame found by name.
   * It works both for the search of an engine and for a pushpage.
   * For various bugs in all browsers, it is not possible to write
   * an ordinary function and extract the source.
   * If the page name does not match the one given as
   * parameter, we will try to close it.
   *
   * @param {String} _name name of the page
   * @param {String} trash page name to be assigned in case it should be closed
   *
   * @return {String} the call to be made
   */
  function makeCall(_name, trash) {
    var funBase = function(_name, trash) {
      if (window.name == _name) { 
        if (window == top && ! (window["Lightstreamer"] && window["Lightstreamer"].wstatus)) {
          window.name = trash;
          window.close();
        }
      }
    };

    var funName = "callFun";  //so we are sure that
    //will be obfuscated or not evenly
    return "var " + funName + " = " + funBase.toString() + "; " + funName + "('" + _name + "', '" + trash + "');";

  }
  
  function closeTrashPopup (pageFound, pageName, trashName)  {
    // we must first verify that we are not caught in the Opera 7 bug
    if (pageFound.name != pageName && pageFound.name != trashName) {
      return;
    }
    pageFound.close();
  }
    
  /*
   * @return {boolean} false if the window open was PROBABLY not executed at all
   * returns null (at least on FX) if the open was blocked by a popup blocker
   * returns a value if it was successfull or if it opened a popup  
   */
  function windowOpen(_url, pageName) {
    var result = null;
    sharingLogger.logDebug("Trying to attach to a cross-page engine");
    if (neverOpenAgain) {
      return false;
    }
    try {
      result = openWindowExe(_url, pageName);
    } catch(_e) {
      sharingLogger.logDebug("Exception while trying to attach to a cross-page engine",_e);
      return false;
    }
    if (result) {
      try {
        foundWins++; //???
      } catch(unexpected) {
        //the window object went out from the scope chain
        //ensure that other popups are not open by setting the
        //neverOpenAgain flag
        neverOpenAgain = true;
      }
    } 
    return result;
  }

  function openNortonWindowExe(_url, pageName) {
    var tryFlag = true;
    if ((foundWins - trySym) < -5) {
      // I tried at least 10 times and had 10 null pointers
      // I believe this browser is not able to run the window.open
      // if it has been copied to another variable
      tryFlag = false;
    }
    if (window["SymRealWinOpen"] && tryFlag) {
      trySym++;

      // this method could go into exception.
      return window["SymRealWinOpen"](_url, pageName, "height=100,width=100", true);
      
    } else if (!messageSeen) {
      messageSeen = true;
      
      sharingLogger.logWarn("You have Norton Internet Security or Norton\nPersonal Firewall installed on this computer.\nIf no real-time data show up, then you need\nto disable Ad Blocking in Norton Internet\nSecurity and then refresh this page");     
    } 
    
    trySym = 0; //why do we do this? This will generate more window.open
    return null; //return false?
  }
    
  function openWindowExe(_url, pageName)  {
    try {
      if (window["SymError"]) {
        return openNortonWindowExe(_url, pageName);
      } else {
        return window.open(_url, pageName, "height=100,width=100", true);
      }
    } catch(e) {
      return null;
    }
  }
  
  /*
   * Object containing the pointer to an external page.
   * It is managed as an object to allow the methods of
   * search to deal with exceptions more easily.
   *
   * @constructor
   * @params {window} page the page to which to build the proxy.
   * it can be declared initially null and searched for later
   */
  var PageProxy = function() {
    this.refPage = null;
  };

  PageProxy.prototype = {
    
    /*public*/ getWindowRef: function() {
      return this.refPage;
    },

    
    /*
     * Get the pointer to a page, searching for it by name.
     * To be sure it's a framework page,
     * verify that there is support for logging.
     * @param {String} pageName page name
     * @param {boolean} get_parent links with the parent of the page pageName
     * @return {boolean} true if a window.open was performed, false otherwise
     */
    linkLSPage: function(pageName, get_parent) {
      var pageFound = null;
      try {
        if (linkedWindows[pageName]) {
          pageFound = linkedWindows[pageName];
        }
      } catch(_e) {
        pageFound = null;
      }
      
      if (pageFound) {
        delete(linkedWindows[pageName]); //will be restored later on if we pass the first tests
        if(this.linkedLSPageVerify(pageFound,pageName,get_parent)) {
          return true;
        }
      }
      
      var trashName = pageName + "__TRASH";
      var cwCall = makeCall(pageName, trashName);
      var safeScript = "eval(" + '"' + cwCall + "; " + '"' + ")";
      // without eval, IE 5.01 and earlier sometimes do not handle the URL (we do not support anymore IE <6)
      
      pageFound = windowOpen("javascript:" + safeScript, pageName, false);
      
      if (pageFound === false) {
        sharingLogger.logDebug("Cross-page engine not found");
        return false;
      } else if (!pageFound) {
        //THIS IS PROBABLY A BLOCKED POPUP. Safari and Firefox pass from here, btw I can't find where safari notifies the issue to the user.
        sharingLogger.logDebug("Probably blocked popup detected: firefox-safari case");
        return true;
      }
   
      sharingLogger.logDebug("Cross-page engine attached");
      this.linkedLSPageVerify(pageFound,pageName,get_parent);
      return true;
      
    },
    
    /*private*/ linkedLSPageVerify: function(pageFound,pageName,get_parent) {
            
      try {
      
        sharingLogger.logDebug("Verify if the found cross-page engine can be used");
        if (pageFound.closed) {
          sharingLogger.logDebug("can't use found cross-page engine: page is now closed");
          return false;
        }
        
        var searchedPage = pageFound;
        
        if (get_parent) {
          if (pageFound == pageFound.top && !pageFound["Lightstreamer"]) {
            sharingLogger.logDebug("can't use found cross-page engine: uneffective popup detected, chrome case");
            //THIS IS PROBABLY A SHOWN POPUP CASE. Chrome passes from here but blocks the popup 

            // probably the engine is not there and a popup has been opened;
            // the popup should close by itself, but let's try to close it
            // also from here
            var trashName = pageName + "__TRASH";
            try {
              closeTrashPopup(pageFound, pageName, trashName);
            } catch (_e) {
              sharingLogger.logDebug("problem closing the generated popup",_e);
            }
            return false;
          }
          
          searchedPage = pageFound.parent;
          
          if (searchedPage == null) {
            sharingLogger.logDebug("Probably blocked popup detected: opera common case");
            //on Opera THIS IS PROBABLY A BLOCKED POPUP CASE. We do not special-log this as opera always passes from here (link through win.open does not work)
            return false;
          }
        }
        
        if (!searchedPage["Lightstreamer"]) {
          sharingLogger.logDebug("can't use found cross-page engine: Lightstreamer singleton not available");
          return false;
        }
        
        if (!searchedPage["Lightstreamer"].wstatus) {
          sharingLogger.logDebug("can't use found cross-page engine: Lightstreamer singleton content unavailable");
          return false;
        }
        
        sharingLogger.logDebug("Ready to use found cross-page engine: looks ok");
        this.refPage = searchedPage;
        this.pageName = pageName;
        linkedWindows[pageName] = pageFound;
        
      } catch(_e) {
        sharingLogger.logDebug("can't use found cross-page engine: exception throw while accessing it",_e);
        return false;
      }
      return true;
    }
    
  };

  
  
  return PageProxy;
})();
  
  
