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

  
  var StreamAsStringHandler = function(){
    this.progress=0;
  };
  
  StreamAsStringHandler.prototype = {
    
    /*private*/ extractNewData: function(_stream,isComplete) {
      
      var endIndex = -1;
      if (isComplete) {
        endIndex = _stream.length;
      } else {
        endIndex = _stream.lastIndexOf("\r\n");
        if (endIndex < 0) {
          return null;
        } else {
          endIndex += 2;
        }
      }
      
      var newData = _stream.substring(this.progress, endIndex);
      
      this.progress = endIndex;
      
      return newData;
      
    }, 
    
    /*public*/ streamProgress: function(_stream) {
      return this.extractNewData(_stream,false);
    },
    
    /*public*/ streamComplete: function(_stream) {
      return this.extractNewData(_stream,true);
    }
    
  };
  
  export default StreamAsStringHandler;
  
