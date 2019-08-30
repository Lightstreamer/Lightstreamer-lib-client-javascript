import Bean from "./Bean";
import Inheritance from "../../src-tool/Inheritance";
import Utils from "../Utils";
  
  var noNotificationList = {};

  var varNames = {
      connectionRequested: "connectionRequested",
      clientsCount: "clientsCount"
  };
  varNames = Utils.getReverse(varNames); 

  var Configuration = function(toClone){

    this.connectionRequested = false;
    this.clientsCount = 0;

    
    this.noNotificationList = noNotificationList; 
    this.varNames = varNames;
    
    this._callSuperConstructor(Configuration,arguments); 
    this.constr = "Configuration";
    
  };

  Configuration.prototype = {
    getConnectionRequested: function() {
      return this.connectionRequested;
    },
    getClientsCount: function() {
      return this.clientsCount;
    }
  };
  
  Inheritance(Configuration, Bean);
  export default Configuration;
  
