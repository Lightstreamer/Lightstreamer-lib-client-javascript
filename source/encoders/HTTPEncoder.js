import Encoder from "./Encoder";
import Inheritance from "../../src-tool/Inheritance";
import Utils from "../Utils";
  
  var unique = 1;
  
  var names = {
      encodeMessageRequest: "encodeMessageRequest",
      encodeControlRequest: "encodeControlRequest",
      encodeDestroyRequest: "encodeDestroyRequest",
      encodeHeartbeatRequest: "encodeHeartbeatRequest",
      encodeLogRequest: "encodeLogRequest"
  };
  names = Utils.getReverse(names); 
  
  var HTTPEncoder = function() {
    
  };
  
  HTTPEncoder.prototype = {
      /*private*/ encodeMessageRequest: function(params,bridge,sessionId,extraParams) {
        extraParams = Utils.extendObj(extraParams,{"LS_session": sessionId});
        return this._callSuperMethod(HTTPEncoder,names['encodeMessageRequest'],[params,bridge,sessionId,extraParams]);
      },
      
      /*private*/ encodeControlRequest: function(params,bridge,sessionId,extraParams) {
        extraParams = Utils.extendObj(extraParams,{"LS_session": sessionId});
        return this._callSuperMethod(HTTPEncoder,names['encodeControlRequest'],[params,bridge,sessionId,extraParams]);
      },
      
      /*private*/ encodeDestroyRequest: function(params,bridge,sessionId,extraParams) {
        return this._callSuperMethod(HTTPEncoder,names['encodeDestroyRequest'],[params,bridge,sessionId,extraParams]);
      },
      
      /*private*/ encodeHeartbeatRequest: function(params,bridge,sessionId,extraParams) {
        if (sessionId) {
          //heartbeat can be sent with or without LS_session
          extraParams = Utils.extendObj(extraParams,{"LS_session": sessionId});
        }
        extraParams = Utils.extendObj(extraParams,{"LS_unique": unique++});
        return this._callSuperMethod(HTTPEncoder,names['encodeHeartbeatRequest'],[params,bridge,sessionId,extraParams]);
      },
      
      /*private*/ encodeLogRequest: function(params,bridge,sessionId,extraParams) {
        if (sessionId) {
          //send_log can be sent with or without LS_session
          extraParams = Utils.extendObj(extraParams,{"LS_session": sessionId});
        }
        extraParams = Utils.extendObj(extraParams,{"LS_unique": unique++});
        return this._callSuperMethod(HTTPEncoder,names['encodeLogRequest'],[params,bridge,sessionId,extraParams]);
      },
      
      expand: function(params,unquotedParam) {
        var data = "";
        if (params) {
          for (var name in params) {
            if (name !== unquotedParam) {
              data += name+"="+params[name]+"&";
            } else {
              data += name+"="+encodeURIComponent(params[name])+"&";
            }
          }
        }
        return data;
      },
      
      //unquoted requests not supported, so we encode parameters that are not encoded and we do not attach the LS_unq parameter
      encodeUnqRequest: function(params,extraParams,unquotedParam) {
        var data = this.expand(params,unquotedParam);
        data += this.expand(extraParams,unquotedParam);
        
        return data;
      }
  };
  
  
  Inheritance(HTTPEncoder,Encoder);
  export default HTTPEncoder;

