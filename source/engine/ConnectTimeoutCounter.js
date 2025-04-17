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
import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
    
    var log = LoggerManager.getLoggerProxy(Constants.SESSION);
    
    /**
     * WARNING
     * The algorithm is the same as RetryDelayCounter. In case of change, consider whether the change must
     * be ported there.
     * <p>
     * 
     * Computes <code>currentConnectTimeout</code> in the following way:
     * <ul>
     * <li>the first 10 times when increase() is called, currentConnectTimeout equals connectTimeout</li>
     * <li>the next times, currentConnectTimeout is doubled until it reaches the value of 60s</li>
     * </ul>
     * 
     * @since December 2018
     */
    var ConnectTimeoutCounter = function(delay) {
        this.initConnectTimeout(delay);
    };
    
    ConnectTimeoutCounter.prototype = {
            
            /**
             * Resets connectTimeout and currentConnectTimeout.
             */
            resetConnectTimeout: function(delay) {
                this.initConnectTimeout(delay);
                if (log.isDebugLogEnabled()) {
                    log.debug("Reset currentConnectTimeout: " + this.currentConnectTimeout);
                }
            },
            
            /**
             * Increase currentConnectTimeout.
             */
            increaseConnectTimeout: function() {
                if (this.connectAttempt >= 9 && this.currentConnectTimeout < this.maxConnectTimeout) {
                    this.currentConnectTimeout *= 2;
                    if (this.currentConnectTimeout > this.maxConnectTimeout) {
                        this.currentConnectTimeout = this.maxConnectTimeout;
                    }
                    if (log.isDebugLogEnabled()) {
                        log.debug("Increase currentConnectTimeout: " + this.currentConnectTimeout);
                    }
                }
                this.connectAttempt++;
            },
            
            /**
             * Increase the timeout to the maximum value.
             */
            increaseConnectTimeoutToMax: function() {
                this.currentConnectTimeout = this.maxConnectTimeout;
                if (log.isDebugLogEnabled()) {
                    log.debug("Increase currentConnectTimeout to max: " + this.currentConnectTimeout);
                }
            },
            
            /**
             * Initializes connectTimeout and currentConnectTimeout.
             */
            initConnectTimeout: function(connectTimeout) {
                this.currentConnectTimeout = connectTimeout;
                this.minConnectTimeout = connectTimeout;
                this.maxConnectTimeout = Math.max(60000, connectTimeout);
                this.connectAttempt = 0;
            }
    };

    export default ConnectTimeoutCounter;

