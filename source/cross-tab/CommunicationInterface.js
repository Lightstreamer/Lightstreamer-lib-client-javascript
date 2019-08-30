


  function CommunicationInterface() {}; //extends EventDispatcher

  CommunicationInterface.prototype = {

    isReady: function() {
    },

    sendMessage: function(target,type,messageId,params){

    },

    removeTarget: function(target) {
    }

  }



  function CommunicationInterfaceListener() {

  };

  CommunicationInterfaceListener.prototype = {

    onReady: function() {
    },
    onMessage: function(messageObject) {
    },
    onMessageFail: function(target,messageId) {
    },
    onRemote: function(id) {
      //this event is only fired on MASTER instances
    }

  };

  export default CommunicationInterface;

