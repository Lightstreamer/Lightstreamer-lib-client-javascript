import RequestsHelper from "./engine/RequestsHelper";
import IEXSXHRConnection from "./net/IEXSXHRConnection";
import ConnectionSelector from "./net/ConnectionSelector";
  
  RequestsHelper.getCreateSessionExtraPath = function() {
    return "dashboard/";
  };
  
  //remove the IEXSXHRConnection from the POLL_LIST in the dashboard case: 
  // * XDomainRequest (the class wrapped in IEXSXHRConnection) does not support the basic authentication
  // * Only create_session requests need the basic authentication support
  // * POLL_LIST is used for create_session requests
  // * POLL_LIST is not used for streaming bind_session requests or for control requests 
  //    (respectively STREAMING_LIST and CONTROL_LIST are used in such cases)
  for (var i=0; i<ConnectionSelector.POLL_LIST.length; i++) { //TODO I may want to separate the POLL_LIST and create CREATE_LIST in the future
    if (ConnectionSelector.POLL_LIST[i] === IEXSXHRConnection) {
      ConnectionSelector.POLL_LIST.splice(i,1);
      break;
    }
  }
  
  export default RequestsHelper;
  

