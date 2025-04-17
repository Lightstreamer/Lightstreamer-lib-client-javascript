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
  
  
