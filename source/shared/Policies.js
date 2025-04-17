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

  export default {
    ATTACH: "ATTACH",
    FAST: "ATTACH:FAST", //sharePolicyOnFound ?ATTACH:FAST? means that when searching for an engine it will behave as if enableFasterSeekEngine(true) was called on client 5
    IGNORE: "IGNORE", //sharePolicyOnFound ?IGNORE? means that the client will behave using the sharePolicyOnNotFound policy even if it finds an engine.
    ABORT: "ABORT",
    CREATE: "CREATE",
    WAIT: "WAIT"
  };

