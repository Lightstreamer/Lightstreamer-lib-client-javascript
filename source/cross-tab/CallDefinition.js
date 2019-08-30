

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
