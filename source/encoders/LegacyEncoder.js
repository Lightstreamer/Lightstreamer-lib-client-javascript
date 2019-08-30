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
  

