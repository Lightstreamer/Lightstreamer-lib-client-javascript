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


  function CallDefinition(wantsResponse,addSessionPhase,responseTimeout) {
    this.wantsResponse = wantsResponse;
    this.addSessionPhase = addSessionPhase;
    this.responseTimeout = responseTimeout || false;
  };

  var WANTS_RESPONSE = true;
  var NO_RESPONSE = false;
  var SESSION_BOUND = true;
  var NOT_BOUND = false;

  CallDefinition.simple = new CallDefinition(NO_RESPONSE,NOT_BOUND);
  CallDefinition.simpleWithResponse = new CallDefinition(WANTS_RESPONSE,NOT_BOUND);
  CallDefinition.simpleWithResponseAndTimeout = new CallDefinition(WANTS_RESPONSE,NOT_BOUND,2000);
  CallDefinition.session = new CallDefinition(NO_RESPONSE,SESSION_BOUND);
  CallDefinition.sessionWithResponse = new CallDefinition(WANTS_RESPONSE,SESSION_BOUND);
  CallDefinition.sessionWithResponseAndTimeout = new CallDefinition(WANTS_RESPONSE,SESSION_BOUND,4000);

  export default CallDefinition;
