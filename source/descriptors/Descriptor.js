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

  
  var Descriptor = function() {
    this.subDescriptor = null;
    this.len = 0;
  };
  
  Descriptor.prototype = {
      setSubDescriptor: function(subDescriptor) {
        this.subDescriptor = subDescriptor;
      },
      
      getSubDescriptor: function() {
        return this.subDescriptor;
      },
      
      getSize: function() {
        return this.len;
      },
      
      getFullSize: function() {
        if (this.subDescriptor) {
          return this.getSize() + this.subDescriptor.getSize();
        }
        return this.getSize();
      },
      
      setSize: function(len) {
        this.len = len;
      }
      
      /*abstract*/ /*getComposedString*/
      /*abstract*/ /*getPos*/
      /*abstract*/ /*getName*/
      /*abstract*/ /*isList*/
  };
  
  export default Descriptor;
  
  
