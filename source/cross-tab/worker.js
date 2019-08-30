
//this file is not used as is: it is MANUALLY made into a string and inserted into SharedWorkerBridge
//you can use , you can use https://closure-compiler.appspot.com/home to compress it (use simple)

var listeners = {};
var nextId = 0;
var MASTER = "MASTER";
var REMOTE = "REMOTE";
var INITIALIZATION = "INITIALIZATION";
var REMOVE = "REMOVE";
var ALL = "ALL";
var FAILED = "FAILED";
var KILL = "KILL";


onconnect = function(e) {
  var port = e.ports[0];
  var id = nextId++;

  if (!listeners[MASTER]) {
    id = MASTER;
  }
  listeners[id] = port;


  port.addEventListener('message', function(e) {
    var obj = e.data;

    if (obj.type == REMOVE) {
      delete(listeners[obj.target]);
    } else if(obj.type == KILL) {
      terminate();
    } else {
      if (obj.target === ALL) {
        for (var i in listeners) {
          if (listeners[i] != port) {
            sendMessage(i, obj, port);
          }
        }
      } else {
        sendMessage(obj.target,obj,port);
      }
    }
  });
  port.start();


  port.postMessage({
    type: INITIALIZATION,
    id: id
  });

  if (id !== MASTER) {
    listeners[MASTER].postMessage({
      type: REMOTE,
      id: id
    });
  }
};


function sendMessage(target,message,feedbackPort) {
  var sendTo = listeners[target];
  if (!sendTo) {
    message.type = FAILED;
    feedbackPort.postMessage(message);
  } else {
    sendTo.postMessage(message);
  }
}

function terminate() {
  self.close();
  for (var i in listeners) {
    listeners[i].close();
  }
}