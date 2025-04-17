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

import QueryStringEncoder from "./QueryStringEncoder";
import Inheritance from "../../src-tool/Inheritance";
  
  var LegacyEncoder = function() {
    
  };
  
  LegacyEncoder.prototype = {
      toString: function() {
        return "[LegacyEncoder]";
      },
      
      getExt: function() {
        return ".html";
      },

      wrapUp: function(requestData) {
      //in this case the LS_querystring is added by the form itself so we skip the wrap up here.
        return requestData;
      }
  };
  
  Inheritance(LegacyEncoder,QueryStringEncoder);
  export default LegacyEncoder;
  

