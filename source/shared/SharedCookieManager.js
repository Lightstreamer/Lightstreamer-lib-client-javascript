import CookieManager from "../../src-tool/CookieManager";
import StringStringManager from "./StringStringManager";
import Utils from "../Utils";
import Helpers from "../../src-tool/Helpers";

  export default Utils.extendObj({    
    
    read: function(key) {
      return CookieManager.readCookie(key);
    },
    write: function(key,val) {
      CookieManager.writeCookie(key,val);
    },
    clean: function(key) {
      CookieManager.removeCookie(key);
    },
    keys: function() {
      var list = [];
      var allCookies = CookieManager.getAllCookiesAsSingleString();
      list = allCookies.split(";");
      for (var i=0; i<list.length; i++) {
        list[i] = Helpers.trim(list[i]);
        list[i] = list[i].substring(0,list[i].indexOf("="));
        list[i] = decodeURIComponent(list[i]);
      }
      return list;
    }
    
  },StringStringManager);
  
  
