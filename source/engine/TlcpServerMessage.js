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
