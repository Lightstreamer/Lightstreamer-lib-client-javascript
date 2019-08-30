import ServerConnection from "./ServerConnection";
import Inheritance from "../../src-tool/Inheritance";
import Executor from "../../src-tool/Executor";
  
  var FakeNotifyConnection = function() {
    this._callSuperConstructor(FakeNotifyConnection);
  };
  
  //this is an abstract class
  ServerConnection.attachPublicStaticMethods(FakeNotifyConnection,{
    isAvailable: false,
    isCrossSite: false,
    isCrossProtocol: false,
    areCookiesGuaranteed: false,
    attachEngineId: false,
    canUseCustomHeaders: false
  });
  
  FakeNotifyConnection.prototype = {
    
    _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      if (responseCallback) {
        Executor.addTimedTask(this.notifySender,1000,this,[responseCallback,phase]);
     }
      return true;
    },
    
    notifySender: function(responseCallback,phase) {
      //we don't have responses from the form requests (but we could...)
      //so we wait a moment and then send an empty response
      
      Executor.executeTask(responseCallback,["",phase]);
      
      
      //we could notify the handler now, in any case there is a traffic light on the formhandler
      //that will avoid "too-close" requests (the problem here is to not saturate the connection pool
    }
    
  };
  
  
  Inheritance(FakeNotifyConnection, ServerConnection);
  
  export default FakeNotifyConnection;
  
