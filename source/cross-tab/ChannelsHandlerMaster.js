import EventDispatcher from "../../src-tool/EventDispatcher";
import Inheritance from "../../src-tool/Inheritance";
import NewPushPageHandlerRemote from "../engine/NewPushPageHandlerRemote";

  function ChannelsHandlerMaster(engine,bridge) {
    this._callSuperConstructor(ChannelsHandlerMaster);
    this.bridge = bridge;
    this.engine = engine;

    this.bridge.addListener(this);
  }

  ChannelsHandlerMaster.prototype = {
    onRemote: function(id) {
      //yay a new pushpage!
      var pushPage = new NewPushPageHandlerRemote(this.engine,this.bridge,id);
      this.dispatchEvent("onNewPushPage",[id,pushPage]);
    },

    onMessageFail: function(target) {
      this.bridge.removeTarget(target);
      this.dispatchEvent("onPushPageLost",[target]);
    },

    dispose: function() {
      this.bridge.dispose();
    }

  };

  ChannelsHandlerMaster.prototype["onRemote"] = ChannelsHandlerMaster.prototype.onRemote;
  ChannelsHandlerMaster.prototype["onMessageFail"] = ChannelsHandlerMaster.prototype.onMessageFail;

  Inheritance(ChannelsHandlerMaster,EventDispatcher);
  export default ChannelsHandlerMaster;


