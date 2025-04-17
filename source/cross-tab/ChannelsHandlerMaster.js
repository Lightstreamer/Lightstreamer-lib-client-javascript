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


