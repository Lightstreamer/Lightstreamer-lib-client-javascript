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
import Utils from "../Utils";

  /**
   * can be used as mixin, just call initChannel in your constructor
   * @constructor
   */
  export default {
    createCaller: function (name, definition) {
      if (definition.wantsResponse) {

        if (definition.addSessionPhase) {
          return function () {
            try {
              var r = this.target[name].apply(this.target, [this.sessionPhase].concat(Utils.argumentsToArray(arguments)));
              return Promise.resolve(r);
            } catch(e) {
              return Promise.reject(e);
            }
          };

        } else {
          return function () {
            try {
              var r = this.target[name].apply(this.target, arguments);
              return Promise.resolve(r);
            } catch(e) {
              return Promise.reject(e);
            }
          };
        }



      } else {
        if (definition.addSessionPhase) {
          return function () {
            try {
              this.target[name].apply(this.target, [this.sessionPhase].concat(Utils.argumentsToArray(arguments)));
            } catch (e) {
                console.error(e);
            }
          };
        } else {
          return function () {
            try {
              this.target[name].apply(this.target, arguments);
            } catch (e) {
                console.error(e);
            }
          };
        }
      }
    }
  };



