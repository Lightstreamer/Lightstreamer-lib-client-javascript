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

  var NameDescriptor = function(val) {
    this._callSuperConstructor(NameDescriptor); 
    this.name = val;
  };
  
  NameDescriptor.prototype = {
      getComposedString: function() {
        return this.name;
      },
      
      getPos: function(name) {
        if (this.subDescriptor) {
          var fromSub = this.subDescriptor.getPos(name);
          return fromSub!==null ? fromSub+this.len : null;
        }
        return null;
      },
      
      getName: function(pos) {
        if (this.subDescriptor) {
          return this.subDescriptor.getName(pos-this.len);
        }
        return null;
      },
      
      getOriginal: function() {
        return this.name;
      },
      
      isList: function() {
          return false;
      }
  };
  
  Inheritance(NameDescriptor, Descriptor);
  export default NameDescriptor;
  
