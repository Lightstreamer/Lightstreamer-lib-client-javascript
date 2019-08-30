import CrossTabChannel from "./CrossTabChannel";
import Utils from "../Utils";

  /**
   * can be used as mixin, just call initChannel in your constructor
   * @constructor
   */
  function ChanneledHandler(bridge,remoteId) {
    this.initChannel(bridge,remoteId);
  }

  ChanneledHandler.createCaller = function(name,definition) {
    if (definition.addSessionPhase) {
      return function() {
        return this.channel.call(name,[this.sessionPhase].concat(Utils.argumentsToArray(arguments)),definition.wantsResponse,definition.responseTimeout);
      }
    } else {
      return function() {
        return this.channel.call(name,arguments,definition.wantsResponse,definition.responseTimeout);
      }
    }
  };

  ChanneledHandler.prototype = {
    initChannel: function(bridge,remoteId) {
      this.channel = new CrossTabChannel(this,bridge,remoteId);
    },
    terminateChannel: function(preserveBridge) {
      this.channel.dispose(preserveBridge);
    }
  };

  export default ChanneledHandler;


