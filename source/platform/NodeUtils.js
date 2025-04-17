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
var ws = require('faye-websocket');
var xhrc = require('xmlhttprequest-cookie');
var urlModule = require('url');

export default {
    NodeWS: ws['Client'],
    NodeXHR: xhrc['XMLHttpRequest'],
    /**
     * Extracts cookies from the internal cookie container with reference
     * to a request that should use them.
     *
     * @param {String} _url url of the request to be issued
     *
     * @returns {Array} String values of the various cookies to be packed into
     * a Cookie header, as though they had been received via Set-Cookie
     */
    getGlobalCookiesForNode: function(_url) {
        var cookieArray = [];
        if (xhrc) {
            if (_url == null) {
                var cookieJarContents = xhrc['CookieJar']['save']();
                var splitArray = cookieJarContents.split("\r\n");
                splitArray.forEach(function(cookie, i, array) {
                    if (cookie != '') {
                        cookieArray.push(cookie);
                    }
                });
            } else {
                var url = urlModule.parse(_url);
                // BEGIN ported from cookie_send in xmlhttprequest-cookie
                var cookies = xhrc['CookieJar']['findFuzzy'](url.hostname, url.pathname);
                for (var i = 0; i < cookies.length; i++) {
                    if (cookies[i]['secure'] && url.protocol !== "https:")
                        continue;
                    if (cookies[i]['httponly'] && url.protocol.match(/^https?:$/i) === null)
                        continue;
                // END ported from cookie_send in xmlhttprequest-cookie
                    cookieArray.push(cookies[i]);
                }
            }
        }
        return cookieArray;
    },
    /**
     * Integrates the internal cookie container with cookies obtained by a request.
     *
     * @param {String} _url url of the request that produced the cookies
     * @param {Array} cookies String values of the various Set-Cookie headers received
     */
    addGlobalCookiesForNode: function(_url, cookies) {
        if (xhrc) {
            // STEP 1: concatenate cookie definitions separating them by '\r\n'
            // (this is a requirement of CookieJar.load used below)
            var cookieDefs = '';
            cookies.forEach(function(cookie, i, array) {
                cookieDefs += "\r\n" + cookie;
            });
            // STEP 2: append cookie definitions to the cookie jar contents
            if (cookieDefs.length > 0) {
                var cookieJarContents = xhrc['CookieJar']['save']();
                cookieJarContents += cookieDefs;
                xhrc['CookieJar']['load'](cookieJarContents);
            }
        }
    }
};