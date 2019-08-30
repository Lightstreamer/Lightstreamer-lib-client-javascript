import Utils from "../Utils";
import StringStringManager from "./StringStringManager";

  var values = {};

  export default Utils.extendObj({
    read: function(key) {
      return values[key];
    },
    write: function(key,val) {
      values[key] = val;
    },
    clean: function(key) {
      delete(values[key]);
    },
    keys: function() {
      var list = [];
      for (var key in values) {
        list.push(key);
      }
      return list;
    }

  },StringStringManager);



