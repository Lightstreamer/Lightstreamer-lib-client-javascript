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
import Environment from "../src-tool/Environment";

export default /*@__PURE__*/(function() {
  var Constants = {

  /**
   * WARNING
   * if the flag is true, change TLCP_VERSION to 2.1.1 instead of 2.1.0
   */
    handleError5: false,
      
    REFRESH_STATUS_INTERVAL: 1000,
    REFRESH_STATUS_INTERVAL_TOLERANCE: 200,
    STOP_SEARCH_TIMEOUT: 10000,
    FRAME_NAME_INDEX: 1,
    TIMESTAMP_INDEX: 0,
    HOST_INDEX: 2,
    BUILD_INDEX: 3,
    PROTOCOL_INDEX: 4,
    BLOB_INDEX: 5,
    NULL_VALUE: "N",
    ALONE_CHECK_TIMEOUT: 200,

    MAIN_CLIENT: "MAIN",

    WORKER_BRIDGE_GLOBAL: "wbridge",
    FRAME_BRIDGE_GLOBAL: "fbridge",

    //channel fail codes
    PROMISE_TIMEOUT: 1,
    PROMISE_FAILURE: 2,


    BUILD: '$build$',
    LIBRARY_VERSION: '$version$',
    LIBRARY_NAME: '$library_name$',
    LIBRARY_TAG: '$library_tag$',
    LS_CID: '$LS_cid$',
    
    PAGE_PROTOCOL: Environment.isBrowserDocument() && (document.location.protocol == "http:" || document.location.protocol == "https:") ? document.location.protocol : "file:",
      
    STREAM: "lightstreamer.stream",
    PROTOCOL: "lightstreamer.protocol",
    SESSION: "lightstreamer.session",
    REQUESTS: "lightstreamer.requests",
    SUBSCRIPTIONS: "lightstreamer.subscriptions",
    MESSAGES: "lightstreamer.messages",
    ACTIONS: "lightstreamer.actions",
    SHARING: "lightstreamer.sharing",  
    CROSSTAB: "lightstreamer.crosstab",  
    STATS: "lightstreamer.stats",  
    MPN: "lightstreamer.mpn",  
    
    STORAGE_PREFIX: "Lightstreamer_",
      
    LIGHTSTREAMER_PATH: "lightstreamer",
    
    _UNORDERED_MESSAGES: "UNORDERED_MESSAGES",
    
    //unchanged field
    UNCHANGED: {length:-1,toString:function(){return "[UNCHANGED]";}},
    
    // *****from LightstreamerConstants -->
    
    CONNECTING: "CONNECTING",
    // connected prefix
    CONNECTED: "CONNECTED:",
    // create_session response received, trying to setup a streaming connection
    SENSE: "STREAM-SENSING",
    // receiving pushed data
    WS_STREAMING: "WS-STREAMING",
    HTTP_STREAMING: "HTTP-STREAMING",
    // connected but doesn't receive data
    STALLED: "STALLED",
    // polling for data
    WS_POLLING: "WS-POLLING",
    HTTP_POLLING: "HTTP-POLLING",
    // disconnected
    DISCONNECTED: "DISCONNECTED",
    WILL_RETRY: "DISCONNECTED:WILL-RETRY",
    TRYING_RECOVERY: "DISCONNECTED:TRYING-RECOVERY",

    WS_ALL: "WS",
    HTTP_ALL: "HTTP",
    
    RAW: "RAW",
    DISTINCT: "DISTINCT",
    COMMAND: "COMMAND",
    MERGE: "MERGE",

    MASTER: "MASTER",
    
    TLCP_VERSION: "TLCP-2.1.0"
  
  };
    
  return Constants;
})();
  
