import Assertions from "../utils/Assertions";
    
    /**
     * Bean about the status of the recovery attempt.
     * <p>
     * State graph of the bean. The event start=T means the client wants to recover the current session.
     * Transitions not depicted should not happen.
    <pre>
       start=F                            start=T
       +--+                               +--+
       |  |                               |  |
       |  |                               |  |
    +--+--v------+   start=T/set ts    +--+--v-----+
    |recovery=F  +--------------------->recovery=T |
    |            +<--------------------+           |
    +------------+   start=F/reset ts  +-----------+
    </pre>
     *
     * @since May 2018
     */
    var RecoveryBean = function() {
        if (arguments.length == 0) {
            this.ctor0();
        } else {
            Assertions.assert(arguments.length == 2, "Recovery error (1)");
            this.ctor2(arguments[0], arguments[1]);
        }
        Assertions.assert(this.invariant(), "Recovery error (2)");
    };
    
    RecoveryBean.prototype = {
            
            invariant: function() {
                return this.recovery ? this.recoveryTimestampMs != -1 : this.recoveryTimestampMs == -1;
            },
            
            /**
             * Initial state. No recovery.
             */
            ctor0: function() {
                this.recovery = false;
                this.recoveryTimestampMs = -1;
            },
            
            /**
             * Next state.
             * 
             * @param {boolean} startRecovery
             * @param {RecoveryBean} old
             */
            ctor2: function(startRecovery, old) {
                if (old.recovery) {
                    if (startRecovery) {
                        this.recovery = true;
                        this.recoveryTimestampMs = old.recoveryTimestampMs;                        
                    } else {
                        /*
                         * This case can occur when, for example, after a recovery
                         * the client rebinds in HTTP because the opening of Websockets takes too long. 
                         */
                        this.recovery = false;
                        this.recoveryTimestampMs = -1;
                    }
                    
                } else {
                    if (startRecovery) {
                        this.recovery = true;
                        this.recoveryTimestampMs = Date.now();
                        
                    } else {
                        Assertions.assert(old.recoveryTimestampMs == -1, "Recovery error (4)");
                        this.recovery = false;
                        this.recoveryTimestampMs = -1;
                    }
                }
            },
            
            /**
             * Restore the time left to complete a recovery, i.e. calling timeLeftMs(maxTimeMs) returns maxTimeMs.
             * The method must be called when a recovery is successful.
             */
            restoreTimeLeft: function() {
                this.recovery = false;
                this.recoveryTimestampMs = -1;
            },
            
            /**
             * True when the session has been created to recover the previous session,
             * which was discarded because of a network error.
             */
            isRecovery: function() {
                return this.recovery;
            },
            
            /**
             * Time left to recover the session.
             * When zero or a negative value, the session must be discarded.
             * 
             * @param {Number} maxTimeMs
             * @return {Number}
             */
            timeLeftMs: function(maxTimeMs) {
                if (this.recovery) {
                    Assertions.assert(this.recoveryTimestampMs != -1, "Recovery error (5)");
                    return maxTimeMs - (Date.now() - this.recoveryTimestampMs);
                    
                } else {            
                    return maxTimeMs;
                }
            }
    };
    
    export default RecoveryBean;
