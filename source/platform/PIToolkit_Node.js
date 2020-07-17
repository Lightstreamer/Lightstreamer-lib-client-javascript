import Utils from "../Utils";
import nodeUtils from 'node-utils';
import Constants from "../Constants";
import LoggerManager from "../../src-log/LoggerManager";

var log = LoggerManager.getLoggerProxy(Constants.SESSION);

export function WS(url, protocol, onopen, onmessage, onclose, onerror) {
        var that = this;
        this.ws = new nodeUtils.NodeWS(url, protocol, getOptions(url));
        this.ws.onopen = function() {
            try {
                /*
                 * Add cookie definitions in the WebSocket handshake response to the cookie jar (maintained by the HTTP transport manager).
                 *
                 * Problem: HTTP and WebSocket transports are independent components not sharing the cookies.
                 *
                 * Solution: Use the cookie manager of the HTTP transport to holds also the cookies returned by
                 * the WebSocket handshake response.
                 */
                var headers = that.ws.headers;
                if (headers['set-cookie']) {
                    /*
                     * NOTE
                     * Notwithstanding  RFC 6265 section 3 forbids set-cookie header folding,
                     * faye-websocket folds multiple set-cookie headers into a single header separating the values by commas.
                     *
                     * The procedure parseSetCookieHeader recovers the cookie definitions from the collapsed header.
                     */
                    var cookies = Utils.parseSetCookieHeader(headers['set-cookie']);
                    nodeUtils.addGlobalCookiesForNode(url, cookies);
                }
                onopen();
            }
            catch (e) {
                log.logError("Runtime error", e);
            }
        };
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

function getOptions(url) {
    var cookie = "";
    var cookies = nodeUtils.getGlobalCookiesForNode(url);
    /* Set header Cookie */
    cookies.forEach(function(cookie_i, i, array) {
        // BEGIN ported from cookie_send in xmlhttprequest-cookie
        if (cookie !== "")
            cookie += "; ";
        cookie += cookie_i['name'] + "=" + cookie_i['value'];
        // END ported from cookie_send in xmlhttprequest-cookie
    });

    var options = {};
    if (cookie.length > 0) {
        options.headers = { 'Cookie' : cookie };
    }
    return options;
}

export function addGlobalEventListener(event, handler) {
    // not supported
}

export function removeGlobalEventListener(event, handler) {
    // not supported
}
