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
//Encoder used by FormConnection and FrameConnection (note that FrameConnection is not used for control requests)

import HTTPEncoder from "./HTTPEncoder";
import Inheritance from "../../src-tool/Inheritance";
  
  var QUERY_STRING = "LS_querystring=";
  
  var QueryStringEncoder = function() {
    
  };
  
  QueryStringEncoder.prototype = {

      /*public*/ getFixedOverhead: function(fileName) {
        return QUERY_STRING.length;
      },
      
      /*public*/ getInvisibleOverhead: function(requestData) {
        if (requestData) {
          //to use the query string the entire requestData needs to be re-encoded again
          //when the full request is complete
          return encodeURIComponent(requestData).length - requestData.length;
        } else {
          return 0;
        }
      },
      
      wrapUp: function(requestData) {
        return QUERY_STRING+encodeURIComponent(requestData);
      }
  };
  
  Inheritance(QueryStringEncoder,HTTPEncoder);
  export default QueryStringEncoder;
  

