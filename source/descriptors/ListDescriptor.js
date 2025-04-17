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
import Inheritance from "../../src-tool/Inheritance";
import Descriptor from "./Descriptor";
  
  function getReverseList(list) {
    var reverseList = {};
    for (var i=0; i<list.length; i++) {
      reverseList[list[i]] = i+1;
    }
    return reverseList;
  }
  
  var ListDescriptor = function(val) {
    this._callSuperConstructor(ListDescriptor); 
    this.list = val;
    this.reverseList = getReverseList(val);
    this.len = val.length;
  };
  
  ListDescriptor.prototype = {
      
      setSize: function(len) {
        return;
      },
      
      getComposedString: function() {
        return this.list.join(" ");
      },
      
      getPos: function(name) {
        if(this.reverseList[name]) {
          return this.reverseList[name];
        } else if (this.subDescriptor) {
          var fromSub = this.subDescriptor.getPos(name);
          return fromSub !== null ? fromSub+this.len : null;
        }
        return null;
      },
      
      getName: function(pos) {
        if (pos > this.len) {
          if (this.subDescriptor) {
            return this.subDescriptor.getName(pos-this.len);
          }
         
        } 
        return this.list[pos-1] || null;
        
      },
      
      getOriginal: function() {
        return this.list;
      },
      
      isList: function() {
          return true;
      }
      
  };
  
  Inheritance(ListDescriptor, Descriptor);
  export default ListDescriptor;
  
