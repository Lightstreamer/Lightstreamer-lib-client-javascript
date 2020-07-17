import Inheritance from "../../src-tool/Inheritance";

function CtrlRequest(query, type) {
    this.query = query;
    this.type = type;
}

CtrlRequest.SUB = 1;
CtrlRequest.UNSUB = 2;
CtrlRequest.MSG = 3;
CtrlRequest.MPN_REG = 4;
CtrlRequest.MPN_SUB = 5;
CtrlRequest.MPN_UNSUB = 6;
CtrlRequest.MPN_UNSUB_FILTER = 7;
CtrlRequest.FORCE = 8;
CtrlRequest.CONS = 9;
CtrlRequest.RECONF = 10;
CtrlRequest.LOG = 11;

CtrlRequest.toString = function(obj) {
    var s = ' ';
    for (var p in obj) {
        s += p + '=' + obj[p] + ' ';
    }
    return s;
}

CtrlRequest.prototype.toString = function() {
    return CtrlRequest.toString(this.query);
};

export default CtrlRequest;
