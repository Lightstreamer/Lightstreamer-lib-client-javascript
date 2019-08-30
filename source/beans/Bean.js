import LoggerManager from "../../src-log/LoggerManager";
import Utils from "../Utils";
import Inheritance from "../../src-tool/Inheritance";
import Setter from "../../src-tool/Setter";
import Constants from "../Constants";
 
  var actionsLogger = LoggerManager.getLoggerProxy(Constants.ACTIONS);
  var sharingLogger = LoggerManager.getLoggerProxy(Constants.SHARING);
  
  
  var Bean = function(orig){
    /**
     * this is an abstract class, actual classes must declare a valid name
     */ 
    this.constr = "Bean";

    this.parent = null;
    this.broadcastSimples = false;

    /*abstract*/ //this.noNotificationList = [];
    /*abstract*/ //this.doNotLogValueList = [];
    /*abstarct*/ //this.varNames = {};
    
    if (orig) {
      this.copySettings(orig);
    }
    
  };
  
  Bean.prototype = {
      
    getPropName: function(prop) {
      return this.varNames[prop];
    },
  
    /*public*/ simpleSetter: function(prop,_value) {
      var propName = this.getPropName(prop);
      
      var orig = this[propName];
      this[propName] = Utils.copyByValue(_value);
      
      //actionsLogger.logDebug("New value for setting received from internal settings",this.parent,prop,this.getValueForLog(propName));
      
      if (this.parent && this.broadcastSimples) {
        this.broadcastSetting(prop);   
        
      } //else we should be a LightstreamerClient: only the engine sets broadcastSimples to true,
      //otherwise we'll have loop of broadcasts. LightstreamerClient only broadcasts setting made
      //through "proper" setters; simpleSetter MUST NOT be used by non-library calls
      
      if (orig != this[propName]) { //obviously notify changes only if the value is actually changed
        this.notifyChange(prop);
      }
    },
    
    /*private*/ getValueForLog: function(propName) {
      return this.doNotLogValueList && this.doNotLogValueList[propName] ? "[...]" : this[propName];
    },
    
    /*protected*/ heavySetter: function(prop,_value) {
      var propName = this.getPropName(prop);
            
      if(_value != this[propName]) {//obviously notify changes only if the value is actually changed
        //save the new value
        this[propName] = _value;
        
        //actionsLogger.logInfo("New value for setting received from API",prop,this.getValueForLog(propName));
        
        //spread the word
        this.broadcastSetting(prop);
        //once we have spread the word we issue the change event 
        this.notifyChange(prop);
      }
    },
    
    /*public*/ setBroadcaster: function(_parent,broadcastSimples) {
      this.parent = _parent;
      this.broadcastSimples = broadcastSimples;
    },
    
    /**
     * @param
     */
    /*private*/ broadcastSetting: function(prop) { 
      var propName = this.getPropName(prop);
      //sharingLogger.logDebug("Broadcasting setting to shared LightstreamerClient instances",prop,this.getValueForLog(propName));
      
      if (this.parent && this.parent.broadcastSetting) {
        if (!this.parent.broadcastSetting(this.constr,prop,Utils.copyByValue(this[propName]))) {
          // if the broadcast fails only the local instance will have the update value
          return false;
        }
      }
      
      
      return true;
    },
    
    notifyChange: function(prop) {
      var propName = this.getPropName(prop);
      if (this.parent && this.parent.notifyOptionChange) {
        
        if (this.noNotificationList && this.noNotificationList[propName]) {
          return;
        }
        
        //actionsLogger.logDebug("Setting changed, firing notification",prop,this.getValueForLog(propName));
            
        this.parent.notifyOptionChange(prop,this);
      }
    },
    
    /*public*/ copySettings: function(original) {
      var sl = this.varNames;
      for (var i in sl) {
        //this[sl[i]] = Utils.copyByValue(original[sl[i]]); 
        this.simpleSetter(i, original[sl[i]]);
      }
    },

    forEachProperty: function(call) {
      for (var i in this.varNames) {
        call(i, this[this.varNames[i]]);
      }
    }

  };
  
  Inheritance(Bean,Setter,false,true);
  export default Bean;

