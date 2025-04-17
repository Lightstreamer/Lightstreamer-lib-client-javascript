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
import Inheritance from "../../src-tool/Inheritance";
import NewPushPageHandler from "./NewPushPageHandler";
import ChanneledHandler from "../cross-tab/ChanneledHandler";

  var disposeName;
  for(var i in  {dispose:true}) {
    disposeName=i;
  }

  function NewPushPageHandlerRemote(engine,bridge,pushPageId) {
    this._callSuperConstructor(NewPushPageHandlerRemote,[engine,pushPageId]);
    this.initChannel(bridge,pushPageId);
  }

  NewPushPageHandlerRemote.prototype = {
    dispose: function() {
      this._callSuperMethod(NewPushPageHandlerRemote,disposeName);
      this.terminateChannel(true); //the pushpage handler must not kill the channel as the channel can be used by others
      //future calls will get an exception that will cause an onPushPageLost event in the PushPage collection if remote
    }
  };

  var methods = NewPushPageHandler.methods;
  for (var i in methods) {
    NewPushPageHandlerRemote.prototype[i] = ChanneledHandler.createCaller(i,methods[i])
  }

  Inheritance(NewPushPageHandlerRemote,NewPushPageHandler);
  Inheritance(NewPushPageHandlerRemote,ChanneledHandler,true);
  export default NewPushPageHandlerRemote;

