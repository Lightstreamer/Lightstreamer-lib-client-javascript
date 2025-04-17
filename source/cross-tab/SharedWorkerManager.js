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
import Environment from "../../src-tool/Environment";
  export default {
    canGenerate: function() {
      return Environment.isBrowserDocument() && typeof SharedWorker !== "undefined" && typeof Blob !== "undefined" && window.URL;
    },

    createWorker: function(code) {
      var blob = new Blob([code]);
      // Obtain a blob URL reference to our worker 'file'.
      var blobURL = window.URL.createObjectURL(blob);
      return blobURL;
    },


    removeWorker: function(blobURL) {
      window.URL.revokeObjectURL(blobURL);
    }
  }
