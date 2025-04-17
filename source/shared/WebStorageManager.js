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
  
  
