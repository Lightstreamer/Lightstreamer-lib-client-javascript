/**
 * @since January 2018
 */
import EncodingUtils from "./EncodingUtils";


    var TlcpServerMessage = function(msg) {
        this.msg = msg;
        this.fields = msg.split(',');
    };
    
    TlcpServerMessage.prototype = {
            
            getField: function(n) {
                if (n >= this.fields.length) {
                    throw new Error('Field ' + n + ' does not exist');
                }
                return this.fields[n];
            },
            
            getFieldUnquoted: function(n) {
                return EncodingUtils.unquote(this.getField(n));
            },
            
            getFieldAsInt: function(n) {
                var f = this.getField(n);
                var num = parseInt(f, 10);
                if (isNaN(num)) {
                    throw new Error('Not an integer field');
                }
                return num;
            },
            
            getFieldAsFloat: function(n) {
                var f = this.getField(n);
                var num = parseFloat(f); 
                if (isNaN(num)) {
                    throw new Error('Not a float field');
                }
                return num;
            },
            
            getRawMsg: function() {
                return this.msg;
            }
    };

    export default TlcpServerMessage;
