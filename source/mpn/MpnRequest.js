import Utils from "../Utils";
    
    var MpnRequest = function() {
        this.query = {};
        this.reqId = Utils.nextRequestId();
        this.addParam('LS_reqId', this.reqId);
    };
    
    MpnRequest.prototype = {
            
            addParam: function(key, value) {
                this.query[key] = encodeURIComponent(value);
            }
    };
    
    export default MpnRequest;

