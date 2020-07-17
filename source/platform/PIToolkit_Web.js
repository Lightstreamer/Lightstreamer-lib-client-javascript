
export function WS(url, protocol, onopen, onmessage, onclose, onerror) {
    this.ws = new WebSocket(url, protocol);
    this.ws.onopen = onopen;
    this.ws.onmessage = onmessage
    this.ws.onclose = onclose;
    this.ws.onerror = onerror;
}

WS.prototype.send = function(data) {
    this.ws.send(data);
};

WS.prototype.close = function() {
    this.ws.onopen = null;
    this.ws.onmessage = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.close();
};

export function addGlobalEventListener(event, handler) {
    try {
        window.addEventListener(event, handler, false);
    } catch (e) {
        // event not supported by the browser
    }
}

export function removeGlobalEventListener(event, handler) {
    try {
        window.removeEventListener(event, handler);
    } catch (e) {
        // event not supported by the browser
    }
}
