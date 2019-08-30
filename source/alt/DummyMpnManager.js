
    var dummy = function() {};
    
    export default function() {
        this.eventManager = {
                onSessionStart: dummy,
                onSessionClose: dummy
        };
    };
