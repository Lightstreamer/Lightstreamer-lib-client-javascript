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
import Encoder from "./Encoder";
import Inheritance from "../../src-tool/Inheritance";
import Utils from "../Utils";
import Assertions from "../utils/Assertions";
    
    var names = {
            encodeRequest: 'encodeRequest',
            encodeUnqRequest: 'encodeUnqRequest'
    };
    names = Utils.getReverse(names);
  
  var WSEncoder = function(wsConnection) {
      this.wsConnection = wsConnection;
  };
  
  WSEncoder.prototype = {
      toString: function() {
        return "[WSEncoder]";
      },
      
      getFixedOverhead: function(fileName) {
        //the batching algorithm doesn't count the name of the 
        //request file (e.g. control.js) as part of the request and thus as part of the length of
        //the request; however in the ws case the file name is part of the request body and thus 
        //should be taken into account. 
        return fileName.length+2; //2 is \r\n
      },
      
      getExt: function() {
        return "";
      },
      
      /**
       * @override
       */
      encodeRequest: function(params,extraParams,sessionId) {
          extraParams = this.expandWithSessionId(extraParams, sessionId);
          return this._callSuperMethod(WSEncoder,names['encodeRequest'],[params,extraParams,sessionId]);
      },
      
      /**
       * @override
       */
      encodeUnqRequest: function(params,extraParams,unquotedParam,sessionId) {
          extraParams = this.expandWithSessionId(extraParams, sessionId);
          return this._callSuperMethod(WSEncoder,names['encodeUnqRequest'],[params,extraParams,unquotedParam,sessionId]);
      },
      
      /**
       * @override
       */
      encodeDestroyRequest: function(params,bridge,sessionId,extraParams) {
          // destroy request already have sessionId set
          return this._callSuperMethod(WSEncoder,names['encodeRequest'],[params,extraParams,sessionId]);
      },
      
      /**
	   * Adds the parameter LS_session only if the WS connection has no default sessionId.
       * The default sessionId is established when the client receives the response of
       * a bind_session request.
       *
       * @private
       */
      expandWithSessionId: function(extraParams, sessionId) {
          var defaultSessionId = this.wsConnection.getDefaultSessionId();
          if (defaultSessionId == null) {
              extraParams = Utils.extendObj(extraParams,{"LS_session": sessionId});

          } else {
              // omit LS_session since the server knows the sessionId of the connection
              //>>excludeStart("debugExclude", pragmas.debugExclude);            
              Assertions.verifyValue(defaultSessionId, sessionId, "Unexpected session ID");
              //>>excludeEnd("debugExclude");
          }
          return extraParams;
      }
  };
  
  Inheritance(WSEncoder,Encoder);
  export default WSEncoder;
  

