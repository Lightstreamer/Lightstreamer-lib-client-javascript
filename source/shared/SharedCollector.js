import WebStorageManager from "./WebStorageManager";
import SharedCookieManager from "./SharedCookieManager";
import Executor from "../../src-tool/Executor";
import Dismissable from "../../src-tool/Dismissable";
import Inheritance from "../../src-tool/Inheritance";
import Constants from "../Constants";
import Helpers from "../../src-tool/Helpers";
import Utils from "../Utils";
  
  var collectors = [];
  var MAX_DELAY = Constants.REFRESH_STATUS_INTERVAL + Constants.REFRESH_STATUS_INTERVAL_TOLERANCE;
  var interval = 60000;
  
  var Collector = function(manager) {
    this._callSuperConstructor(Collector);
    this.manager = manager;
    this.task = null;
  };
  Collector.prototype = {
      start: function() {
        if (this.task) {
          Executor.stopRepetitiveTask(this.task);
        }
        this.task = Executor.addRepetitiveTask(this.collect,interval,this);
        Executor.addTimedTask(this.collect,0,this);//also run now        
      },
      clean: function() {
        Executor.stopRepetitiveTask(this.task);
        for (var i=0; i<collectors.length; i++) {
          if (collectors[i] == this) {
            collectors.splice(i,1);
            return;
          }
        }
      }, 
      collect: function() {
        //contains _ --> engine status
        //contains :// --> server conn
        //neither --> list of engines
        var ts = Helpers.getTimeStamp();
                
        var keys = this.manager.getAllKeys();
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].indexOf("_") > 0) {
            this.checkEngine(keys[i],null,ts);
          }
        }
        
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].indexOf("_") <= -1) {
            this.checkList(keys[i]);
          }
        }
        
      },
      
      checkEngine: function(id,shareName,now) {
        if (!shareName) {
          var split = id.split("_");
          if (split.length != 2) {
            return false;
          }
          id = split[0];
          shareName = split[1];
        }
        
        var status = this.manager.readSharedStatus(shareName,id);
        
        
        
        if (!status) {
          return false;
        }
        
        if (!now) {
          return true;
        }
        
        var diff = now - status[Constants.TIMESTAMP_INDEX];
        if (diff > MAX_DELAY) {
          this.manager.cleanSharedStatus(shareName,id);
          return false;
        }
        return true;
      },
      
      checkList: function(key) {
        var list = this.manager.readIds(key);
        
        for (var i=0; i<list.length; i++) {
          if (list[i].indexOf("_")>0) {
            if(!this.checkEngine(list[i])) {
              this.manager.removeId(key,list[i]);
            }
          } else {
            if (!this.checkEngine(list[i],key)) {
              this.manager.removeId(key,list[i]);
            }
          }
          
        }
        
      }
  };
  Inheritance(Collector,Dismissable,false,true);
  
  var wsCollector = new Collector(WebStorageManager);
  var cookieCollector = new Collector(SharedCookieManager);
  var defaultCollector = Utils.canUseLocalStorage() ? wsCollector : cookieCollector;
  
 
  export default {
    start: function(forcedCookies) {
      var collector = forcedCookies ? cookieCollector : defaultCollector;
      for (var i=0; i<collectors.length; i++) {
        if (collectors[i] == collector) {
          collector.touch();
          return;
        }
      }
     
      collectors.push(collector);
      collector.touch();
      collector.start();
    },
    
    stop: function(forcedCookies) {
      var collector = forcedCookies ? cookieCollector : defaultCollector;
      for (var i=0; i<collectors.length; i++) {
        if (collectors[i] == collector) {
          collector.dismiss();
        }
      }
    },
    
    changeInterval: function(newInterval) {
      interval = newInterval;
      for (var i=0; i<collectors.length; i++) {
        collectors[i].start();
      }
    }
    
  };
  
