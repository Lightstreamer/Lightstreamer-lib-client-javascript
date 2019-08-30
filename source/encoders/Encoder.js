import Request from "../net/Request";
import ControlRequest from "../control/ControlRequest";
import Utils from "../Utils";
import Constants from "../Constants";
  
  
  var SEND_MESSAGE = "msg";
  var SEND_LOG = "send_log";
  var CONTROL = "control";
  var HEARTBEAT = "heartbeat";
  
  var MEX_PARAM = "LS_message";
  var LEN_PARAM = "LS_unq";
  
  function getCustomizedPath(_type) {
    if (_type == ControlRequest.MESSAGE) {
      return SEND_MESSAGE;
    } else  if (_type == ControlRequest.LOG) { 
      return SEND_LOG;
    } else  if (_type == ControlRequest.HEARTBEAT) { 
      return HEARTBEAT;
    } else {
      return CONTROL;
    }
  }
  
  
  var Encoder = function() {
    
  };
  
  
  Encoder.prototype = {
      
      toString: function() {
        return "[Encoder]";
      },
      
      initRequest: function(queue,cookieRequired,extraHeaders) {
        //(queue); //sets file and method, not server
        
        var req = new Request();
        var path = getCustomizedPath(queue.getBatchType());
        var ext = this.getExt();
        req.setFile(path + ext);
        req.setMethod(Request._POST);
        req.setCookieFlag(cookieRequired);
        req.setExtraHeaders(extraHeaders);
        
        return req;
        
      },
      
      /**
       * @return null if all requests are discarded in the process 
       */
      /*private*/ encode: function(queue,sessionId,first) {
        var data = first ? "" : "\r\n";
        
        while (queue.getLength() > 0) {
        
          
          var controlRequest = queue.firstRequest();
     
         
          var bridge = controlRequest.getBridge();
          var requestType = controlRequest.getType();
          
          
          /*if (requestType == ControlRequest.ADD && bridge.verifySuccess()) {
            //verifySuccess returns true if the pushPagehandler disappeared or if a deleteTable event was received
            //so that getPushPageHandlerFromTableNumber returns null
            queue.shift();
          } else if (requestType == ControlRequest.REMOVE && bridge.verifySuccess()) {
            //if the related add was not sent, it's useless to send the delete request
            //there is no risk that the related add request is somewhere in queue because each tableNumber
            //is related to a single couple of ADD-REMOVE requests and the delete can't arrive before the add. 
            //BTW even if the add request is on the queue it will be discarded because the deleteTable event
            //removes the table reference from the pushPageHandlers so that the isSubscribed method returns true so that 
            //the add is not sent anyway
            bridge.notifyAborted();
            queue.shift();
          
          } else*/ if (bridge && bridge.verifySuccess()) {
            //if verify success is true means that an answer arrived while the request was in the queue.
            //In case of a send message if we send it we risk an LS_msg_num=undefined message cause HTTPEncoder may not be able to get a prog number for the handled message
            bridge.notifyAborted();
            queue.shift();
            
          } else {
            
            var params = controlRequest.getRequest();
            
            if (requestType == ControlRequest.MESSAGE) {
              return data+this.encodeMessageRequest(params,bridge,sessionId);
            
            } else if (requestType == ControlRequest.DESTROY) {
              return data+this.encodeDestroyRequest(params,bridge,sessionId);
              
            } else if (requestType == ControlRequest.HEARTBEAT) {
              return data+this.encodeHeartbeatRequest(params,bridge,sessionId);
              
            } else if (requestType == ControlRequest.LOG) {
              return data+this.encodeLogRequest(params,bridge,sessionId);
              
            } else { //CHANGE_SUB - CONSTRAINT - FORCE_REBIND - ADD - REMOVE
              return data+this.encodeControlRequest(params,bridge,sessionId);
            }
            
          }
        
        
        }
        return null;
        
      },
      
      expand: function(params,unquotedParam) {
        var data = "";
        if (params) {
          for (var name in params) {
            if (name !== unquotedParam) {
              data += name+"="+params[name]+"&";
            } 
          }
        }
        return data;
      },
    
      
      /*private*/ encodeRequest: function(params,extraParams,sessionId) {
        var data = this.expand(params);
        data += this.expand(extraParams);
        
        
        
        return data;
      },
      
      encodeUnqRequest: function(params,extraParams,unquotedParam,sessionId) {
        var data = this.expand(params,unquotedParam);
        data += this.expand(extraParams,unquotedParam);
        
        if (params[unquotedParam]) {
          data += unquotedParam+"="+params[unquotedParam];
        } else if (extraParams) {
          data += unquotedParam+"="+extraParams[unquotedParam];
        }

        var unq = data.length;
        
        return LEN_PARAM+"="+unq+"&"+data;
      },
      
      wrapUp: function(requestData) {
        // if there is no data, return a blank line because the server dislikes empty requests
        return requestData ? requestData : "\n";
      },
      
      /*protected*/ getExt: function() {
        return ".txt" + "?LS_protocol=" + Constants.TLCP_VERSION;
      },
      
      /*protected*/ getFixedOverhead: function(fileName) {
        return 0;
      },
      
      /*protected*/ getInvisibleOverhead: function(data) {
        return 2; //the \r\n that separates requests one from the following 
      },
      
      /*protected*/ encodeControlRequest: function(params,bridge,sessionId,extraParams) {
        return this.encodeRequest(params,extraParams,sessionId);
      },
      
      /*protected*/ encodeDestroyRequest: function(params,bridge,sessionId,extraParams) {
        // here the session ID to be specified may not be the current one
        // and it is already included among the base parameters
        return this.encodeRequest(params,extraParams,sessionId);
      },
      
      /*protected*/ encodeHeartbeatRequest: function(params,bridge,sessionId,extraParams) {
        return this.encodeRequest(params,extraParams,sessionId);
      },
      
      /*protected*/ encodeLogRequest: function(params,bridge,sessionId,extraParams) {
        return this.encodeRequest(params,extraParams,sessionId);
      },
      
      /*protected*/ encodeMessageRequest: function(params,bridge,sessionId,extraParams) {
        //    righe di questo tipo non sono ammesse se la richiesta viene sovraencodata tramite il parametro LS_querystring (il vecchio caso "form").
        //encodeURIComponent(LS_message)
        return this.encodeUnqRequest(params,extraParams,MEX_PARAM,sessionId);
      }
  };
  
  

  
  export default Encoder;
  

