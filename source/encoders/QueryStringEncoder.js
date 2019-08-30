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
  

