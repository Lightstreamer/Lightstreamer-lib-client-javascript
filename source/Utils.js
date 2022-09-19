import Environment from "../src-tool/Environment";
import Constants from "./Constants";
import Helpers from "../src-tool/Helpers";
import ASSERT from "../src-test/ASSERT";

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
  var objectIdCounter = 1;

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
    
    nextObjectId: function() {
        return objectIdCounter++;
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
    },
    
    parseUpdates: function(message) {
        // U,<table>,<item>|<field1>|...|<fieldN>
        // or U,<table>,<item>,<field1>|^<number of unchanged fields>|...|<fieldN>
        /* parse table and item */
        var tableIndex = message.indexOf(',') + 1;
        ASSERT.verifyOk(tableIndex == 2); // tested by the caller
        var itemIndex = message.indexOf(',', tableIndex) + 1;
        if (itemIndex <= 0) {
            throw new Error("Missing subscription field");
        }
        var fieldsIndex = message.indexOf(',', itemIndex) + 1;
        if (fieldsIndex <= 0) {
            throw new Error("Missing item field");
        }
        ASSERT.verifyOk(message.substring(0, tableIndex) == "U,"); // tested by the caller
        var table = myParseInt(message.substring(tableIndex, itemIndex - 1), "Invalid subscription");
        var item = myParseInt(message.substring(itemIndex, fieldsIndex - 1), "Invalid item");

        /* parse fields */
        var unchangedMarker = {};
        unchangedMarker.length = -1;

        var values = [];
        var fieldStart = fieldsIndex - 1; // index of the separator introducing the next field
        ASSERT.verifyOk(message.charAt(fieldStart) == ','); // tested above
        while (fieldStart < message.length) {

            var fieldEnd = message.indexOf('|', fieldStart + 1);
            if (fieldEnd == -1) {
                fieldEnd = message.length;
            }
            /*
                 Decoding algorithm:
                     1) Set a pointer to the first field of the schema.
                     2) Look for the next pipe “|” from left to right and take the substring to it, or to the end of the line if no pipe is there.
                     3) Evaluate the substring:
                            A) If its value is empty, the pointed field should be left unchanged and the pointer moved to the next field.
                            B) Otherwise, if its value corresponds to a single “#” (UTF-8 code 0x23), the pointed field should be set to a null value and the pointer moved to the next field.
                            C) Otherwise, If its value corresponds to a single “$” (UTF-8 code 0x24), the pointed field should be set to an empty value (“”) and the pointer moved to the next field.
                            D) Otherwise, if its value begins with a caret “^” (UTF-8 code 0x5E):
                                    - take the substring following the caret and convert it to an integer number;
                                    - for the corresponding count, leave the fields unchanged and move the pointer forward;
                                    - e.g. if the value is “^3”, leave unchanged the pointed field and the following two fields, and move the pointer 3 fields forward;
                            E) Otherwise, the value is an actual content: decode any percent-encoding and set the pointed field to the decoded value, then move the pointer to the next field.
                               Note: “#”, “$” and “^” characters are percent-encoded if occurring at the beginning of an actual content.
                     4) Return to the second step, unless there are no more fields in the schema.
             */
            var value = message.substring(fieldStart + 1, fieldEnd);
            if (value == "") { // step A
                values.push(unchangedMarker);

            } else if (value.charAt(0) == '#') { // step B
                if (value.length != 1) {
                    throw new Error("Wrong field quoting");
                } // a # followed by other text should have been quoted
                values.push(null);

            } else if (value.charAt(0) == '$') { // step C
                if (value.length != 1) {
                    throw new Error("Wrong field quoting");
                } // a $ followed by other text should have been quoted
                values.push("");

            } else if (value.charAt(0) == '^') { // step D
                if (value.charAt(1) == 'P') {
                  var unquoted = Utils.unquote(value.substring(2));
                  unquoted = new String(unquoted);
                  unquoted.isJSONPatch = true;
                  values.push(unquoted);
                } else {
                  var count = myParseInt(value.substring(1), "Invalid field count");
                  while (count-- > 0) {
                      values.push(unchangedMarker);
                  }
                }

            } else { // step E
                var unquoted = Utils.unquote(value);
                values.push(unquoted);
            }
            fieldStart = fieldEnd;
        }
        return values;
    },
    
    /**
     * Converts a string containing sequences as {@code %<hex digit><hex digit>} into a new string 
     * where such sequences are transformed in UTF-8 encoded characters. <br> 
     * For example the string "a%C3%A8" is converted to "aè" because the sequence 'C3 A8' is 
     * the UTF-8 encoding of the character 'è'.
     */
    unquote: decodeURIComponent

  };
  
  function myParseInt(field, errorMsg) {
      var n = parseInt(field, 10);
      if (isNaN(n)) {
          throw new Error(errorMsg);
      }
      return n;
  }

  return Utils;
})();

