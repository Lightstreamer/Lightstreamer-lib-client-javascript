import Inheritance from "../../src-tool/Inheritance";
import SimpleLogAppender from "../../src-log/SimpleLogAppender";
import IllegalStateException from "../../src-tool/IllegalStateException";
    
    /**
     * Log appender sending the logs over a WebSocket channel connected to the server having the given address.
     * 
     * @since May 2018
     */
    var WsAppender = function(address) {
        var self = this;
        self._callSuperConstructor(WsAppender, ["DEBUG", "*"]); // log all
        self.ws = new WebSocket(address);
        self.wsPromise = new Promise(function(resolve, reject) {
            self.ws.onopen = function() {
                //document.getElementById("content").appendChild(document.createTextNode(" connected2"));
                self.ws.send("=== " + new Date() + " ===");
                resolve();
            };
            self.ws.onerror = function() {
                console.error("WsAppender connection error");
            };
            self.ws.onclose = function() {
                console.error("WsAppender connection closed");
            };
            self.ws.onmessage = function(event) {
                var msg = event.data;
                //document.getElementById("content").appendChild(document.createTextNode(" " + msg));
                if (msg == "refresh") {
                    window.location.reload(true);
                }
            };
        });
    };
    
    WsAppender.prototype.log = function(category, level, mex, header) {
        mex = this.composeLine(category, level, mex, header);
        var self = this;
        self.wsPromise.then(function() {            
            self.ws.send(mex);
        });
    };
    
    WsAppender.prototype["log"] = WsAppender.prototype.log;  
    Inheritance(WsAppender, SimpleLogAppender);
    export default WsAppender;

