import Utils from "../Utils";
import StringStringManager from "./StringStringManager";

  export default Utils.extendObj({    
    read: function(key) {
      return localStorage.getItem(key);
    },
    write: function(key,val) {
      localStorage.setItem(key,val);
    },
    clean: function(key) {
      localStorage.removeItem(key);
    },
    keys: function() {
      var list = [];
      for (var i=0; i<localStorage.length; i++) {
        list.push(localStorage.key(i));
      }
      return list;
    }
    
  },StringStringManager);
  
  
