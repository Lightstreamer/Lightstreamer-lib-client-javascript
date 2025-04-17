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
import IllegalStateException from "../../src-tool/IllegalStateException";
  export default function(client) {
    return {
      "enableSharing": function() {
        throw new IllegalStateException("ConnectionSharing is not included in the Lightstreamer library");
      },
      "isMaster": function() {
        return client.isMaster();
      }
    };
  };
