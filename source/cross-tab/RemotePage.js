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
import PageProxy from "../PageProxy";

  var blackList = {};

  function RemotePage(frameName) {
    this.frameName = frameName;
  }

  RemotePage.prototype = {

    getRemotePageReference: function() {
      if (blackList[this.frameName]) {
        return Promise.resolve(null);
      } else {
        var pageProxy = new PageProxy();

        var windowOpened = pageProxy.linkLSPage(this.frameName, true);
        if (windowOpened) {
          var ref = pageProxy.getWindowRef();
          if (ref == null) {
            blackList[this.frameName] = true;
            return Promise.resolve(null);
          } else {
            return Promise.resolve(ref);
          }
        } else {
          return Promise.resolve(null);
        }
      }
    }

/*
    if(this.openedFrames[values[Constants.FRAME_NAME_INDEX]]) {
      sharingLogger.logDebug("Skipping already-used cookie",iEngineName);
      //we've already done a window.open on this engine
      continue;
    }
    */
  };

  export default RemotePage;



