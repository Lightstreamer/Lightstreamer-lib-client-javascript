import LoggerManager from "../../src-log/LoggerManager";
import Constants from "../Constants";
    
    var log = LoggerManager.getLoggerProxy(Constants.SESSION);
    
    /**
     * WARNING
     * The algorithm is the same as ConnectTimeoutCounter. In case of change, consider whether the change must
     * be ported there.
     * <p>
     * 
     * Computes <code>currentRetryDelay</code> in the following way:
     * <ul>
     * <li>the first 10 times when increase() is called, currentRetryDelay equals retryDelay</li>
     * <li>the next times, currentRetryDelay is doubled until it reaches the value of 60s</li>
     * </ul>
     * 
     * @since December 2018
     */
    var RetryDelayCounter = function(delay) {
        this.initRetryDelay(delay);
    };
    
    RetryDelayCounter.prototype = {
            
            /**
             * Resets retryDelay and currentRetryDelay.
             */
            resetRetryDelay: function(delay) {
                this.initRetryDelay(delay);
                if (log.isDebugLogEnabled()) {
                    log.debug("Reset currentRetryDelay: " + this.currentRetryDelay);
                }
            },
            
            /**
             * Increase currentRetryDelay.
             */
            increaseRetryDelay: function() {
                if (this.retryAttempt >= 9 && this.currentRetryDelay < this.maxRetryDelay) {
                    this.currentRetryDelay *= 2;
                    if (this.currentRetryDelay > this.maxRetryDelay) {
                        this.currentRetryDelay = this.maxRetryDelay;
                    }
                    if (log.isDebugLogEnabled()) {
                        log.debug("Increase currentRetryDelay: " + this.currentRetryDelay);
                    }
                }
                this.retryAttempt++;
            },
            
            /**
             * Increase the timeout to the maximum value.
             */
            increaseRetryDelayToMax: function() {
                this.currentRetryDelay = this.maxRetryDelay;
                if (log.isDebugLogEnabled()) {
                    log.debug("Increase currentRetryDelay to max: " + this.currentRetryDelay);
                }
            },
            
            /**
             * Initializes retryDelay and currentRetryDelay.
             */
            initRetryDelay: function(retryDelay) {
                this.currentRetryDelay = retryDelay;
                this.minRetryDelay = retryDelay;
                this.maxRetryDelay = Math.max(60000, retryDelay);
                this.retryAttempt = 0;
            }
    };

    export default RetryDelayCounter;

