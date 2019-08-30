import Environment from "../src-tool/Environment";
import Constants from "./Constants";
import Helpers from "../src-tool/Helpers";

export default /*@__PURE__*/(function() {
  var removeDot = new RegExp("\\.","g");
  var removeMinus = new RegExp("-","g");

  var ignoredChars = {
      ".":true,
      " ":true,
      "0":true
  };
  
  var requestIdCounter = 1;
  var subscriptionIdCounter = 1;

  var Utils = {

    isOffline: function() {
      return Environment.isBrowser() ? navigator.onLine === false : false;
    },

    canUseLocalStorage: function() {
      try {
		if (typeof localStorage != "undefined" && localStorage !== null && localStorage.getItem && localStorage.setItem) {
		  var x = '__canUseLocalStorage_test__',
		      y = 'true';

		  localStorage.setItem(x, y);
		  localStorage.removeItem(x);

		  return true;
		} else {
		  return false;
		}
      } catch(_e) {
        return false;
      }
    },

    getDomain: function() {
      try {
        return document.domain;
      } catch(e) {
        //wp8 webview (eg phonegapp apps) will throw an exception if try to read
        //document.domain. Yes I had the same look on my face when I discovered this
        return "";
      }
    },

    hasDefaultDomain: function() {
      if (!Environment.isBrowserDocument()) {
        return true;
      }
      try {
        var fixHost = document.location.host;
        if (fixHost.indexOf("[") > -1) {
          //if host is an IPv6 it's impossible that the domain has been changed
          return true;
        }

        return  Utils.getDomain() == document.location.hostname;
      } catch(_e) {
        //guess who's got an exception while reading location.host? IE of course
        return false;
      }
    },


    /**
     * necessario per IE7 altrimenti (faccio un esempio che mi vien + semplice):
     * Copio numero da finestra A a finestra B
     * B � un numero
     * Chiudo A
     * B magicamente diventa un oggetto.
     * L'errore riportato da IE7 �:
     * "Il chiamato (server [applicazione non server]) non � disponibile ed � scomparso.
     * Tutte le connessioni non sono valide. La chiamata non � stata effettuata."
     * [l'errore su IE7 sembra non presentarsi pi�]
     */
    copyByValue: function(_value) {

      if (typeof _value != "undefined") {
        if (_value === true || _value === false) {
          //booleano
          return _value === true;

        } else if (_value == null) {
          return null;

        } else if (typeof _value == "number" || _value instanceof Number) {
            return Number(_value);

        } else if (Helpers.isArray(_value)) {
          var arr = [];
          for (var i = 0; i<_value.length; i++) {
            arr[i] = this.copyByValue(_value[i]);
          }
          return arr;

        } else if (typeof _value == "string" || _value instanceof String) {
          return String(_value);

        } else if (_value.length === -1) {
          return Constants.UNCHANGED;

        } else if (isNaN(_value) && typeof _value == "number") {
          return NaN;

        } else {
          //it's not undefined, it's not null, it's not a number, it's not a string
          //it has not the toString method:
          //it should be a JSON object

          var obj = {};
          for (var i in _value) {
            obj[this.copyByValue(i)] = this.copyByValue(_value[i]);
          }
          return obj;

        }
      }
      return null;

    },

    extendObj: function(core,extension) {
      core = core || {};
      if (extension) {
        for (var p in extension) {
          core[p] = extension[p];
        }
      }
      return core;
    },

    sanitizeIFrameName: function(_name) {
      // ie does not want that there are points in the name of a frame and -
      // should be the only special characters present in a
      // domain so I don't have to replace anything else
      return _name.replace(removeDot,"_").replace(removeMinus,"__");
    },

    getReverse: function(map) {
      var res = {};

      for (var i in map) {
        res[map[i]] = i;
      }

      return res;
    },

    argumentsToArray: function(params) {
      if (params && !params.pop) {
        //this is an Arguments, not an array
        var tmp = [];
        for (var i=0; i<params.length; i++) {
          tmp.push(params[i]);
        }
        return tmp;
      }
      return params;
    },

    /**
     * Parses the value of a set-cookie header containing multiple cookie definitions separated by commas.
     * Notwithstanding RFC 6265 forbids cookie folding, some libraries (e.g. faye-websocket)
     * returns multiple set-cookie headers as a comma-separated string.
     *
     * @param {String} cookieStr comma-separated cookie definitions (e.g. 'cookie1=val1; attr1, cookie2=val2')
     * @return {String[]} an array of cookie definitions (e.g. ['cookie1=val1; attr1', 'cookie2=val2'])
     */
    parseSetCookieHeader: function(cookieDefs) {
        /*
         * Set-cookie syntax:
         *
         * <HEADER> ::= <COOKIE>* (separated by commas)
         * <COOKIE> ::= <NAME-VALUE>';'<ATTRIBUTE-SEQ>
         * <NAME-VALUE> ::= <CHAR>* (not containing commas or semicolons)
         * <ATTRIBUTE-SEQ> ::= <ATTRIBUTE>* (separated by semicolons)
         * <ATTRIBUTE> ::= <CHAR>* (not containing commas or semicolons)
         */

        if (! cookieDefs) {
            return [];
        }
        // string iterator (returns empty string when reaches the end)
        var it = {
                i: 0,
                next: function() {
                    return cookieDefs.charAt(this.i++);
                }
        };
        var expiresAttribute = /^\s*Expires/i;
        var cookies = [];
        var ch = it.next();
        /* <HEADER> */
        while (ch) {
            var cookie = '';
            /* <COOKIE> */
            var nameValue = '';
            /* <NAME-VALUE> */
            while (ch && ch != ';' && ch != ',') {
                nameValue += ch;
                ch = it.next();
            } /* end <NAME-VALUE> */
            nameValue = nameValue.trim();
            cookie += nameValue;
            if (ch == ';') {
                cookie += '; ';
                ch = it.next(); // consume semicolon
            }
            /* <ATTRIBUTE-SEQ> */
            while (ch && ch != ',') {
                var attribute = '';
                /* <ATTRIBUTE> */
                while (ch && ch != ';' && ch != ',') {
                    attribute += ch;
                    ch = it.next();
                } /* end <ATTRIBUTE> */

                // NB Expires attribute (e.g. Expires=Wed, 21 Oct 2015 07:28:00 GMT) needs a special processing
                // because it contains an internal comma, which must not be mistaken for a cookie separator
                if (attribute.match(expiresAttribute)) {
                    console.assert(ch == ',');
                    attribute += ch;
                    ch = it.next(); // consume internal comma
                    while (ch && ch != ';' && ch != ',') {
                        attribute += ch;
                        ch = it.next();
                    }
                }

                attribute = attribute.trim();
                cookie += attribute;
                if (ch == ';') {
                    cookie += '; ';
                    ch = it.next(); // consume semicolon
                }
            } /* end <ATTRIBUTE-SEQ> */
            /* end <COOKIE> */
            cookies.push(cookie);
            ch = it.next(); // consume comma
        } /* end <HEADER> */
        return cookies;
    },
    
    /**
     * LS_reqId generator.
     */
    nextRequestId: function() {
        return requestIdCounter++;
    },
    
    /**
     * LS_subId generator.
     */
    nextSubscriptionId: function() {
        return subscriptionIdCounter++;
    },
    
    /**
     * Returns a custom promise with two additional methods resolve and reject.
     */
    defer: function() {
        var res, rej;
        var p = new Promise(function(resolve, reject) {
            res = resolve;
            rej = reject;
        });
        p.resolve = res;
        p.reject = rej;
        return p;
    }

  };

  return Utils;
})();

