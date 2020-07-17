import Constants from "../Constants";
import LoggerManager from "../../src-log/LoggerManager";

var log = LoggerManager.getLoggerProxy(Constants.HEARTBEAT_LOG);

/**
 * A timer sending reverse heartbeats.
 * <p>
 * A heartbeat is sent only if the time elapsed from the last sending of a control request is bigger than heartbeat interval.
 * <p>
 * The maximum interval between heartbeats is determined by the parameter LS_inactivity_millis set by the bind_session request
 * and doesn't change during the life of the corresponding session.
 * However the interval can be diminished by the user.
 * <p>
 * <i>To build well-formed heartbeat requests, heartbeats are sent only after the bind session request has been issued 
 * so we are sure that {@literal sessionId} and {@literal serverInstanceAddress} properties are set.</i>
 * 
 * @since October 2017
 */
function ReverseHeartbeatTimer(session, options) {
    /*
     * Maximum interval. Value of LS_inactivity_millis.
     */
    this.maxIntervalMs = 0;
    /*
     * It is the minimum between LS_inactivity_millis and the interval chosen by the user.
     */
    this.currentIntervalMs = -1;
    this.disableHeartbeats = false;
    this.closed = false;
    /*
     * Last time a request has been sent to the server.
     */    
    this.lastSentTimeNs = -1;
    /*
     * The timer assures that there is at most one scheduled task by keeping a phase counter
     * (there is no scheduled task when heartbeats are disabled).
     * When the user changes the interval (see method onChangeInterval), the counter is incremented
     * so that if there is a scheduled task, it is discarded since the task phase is less than the phase counter.
     */
    this.currentPhase = 0;
    /*
     * True when the bind session request is sent.
     * <br>
     * NB Heartbeats can be sent only when this flag is set.
     */
    this.bindSent = false;
    this.session = session;
    this.options = options;
    this.maxIntervalMs = options.getReverseHeartbeatInterval();
    if (log.isDebugLogEnabled()) {
        log.logDebug("rhb max interval", this.maxIntervalMs);
    }
    this.setCurrentInterval(this.maxIntervalMs);
}

ReverseHeartbeatTimer.prototype = {
        
        /**
         * @public
         * Must be called just before the sending of a bind session request.
         * @param bindAsControl when true the time a bind_session request is sent is recorded as it is a control request
         * (see {@link #onControlRequest()})
         */
        onBindSession: function(bindAsControl) {
            if (bindAsControl) {
                /*
                 * since schedule() uses lastSentTimeNs,
                 * it is important to set lastSentTimeNs before 
                 */
                this.lastSentTimeNs = now();
            }
            if (! this.bindSent) {
                this.bindSent = true;
                this.schedule();                
            }
        },
        
        /**
         * @public
         * Must be called when the user modifies the interval.
         */
        onChangeInterval: function() {
            var newInterval = this.options.getReverseHeartbeatInterval();
            this.setCurrentInterval(newInterval);
        },
        
        /**
         * @public
         * Must be called when a control request is sent.
         */
        onControlRequest: function() {
            this.lastSentTimeNs = now();
            if (log.isDebugLogEnabled) {            
                log.logDebug("rhb updated");
            }
        },
        
        /**
         * @public
         * Must be called when the session is closed.
         */
        onClose: function() {
            this.closed = true;
            if (log.isDebugLogEnabled()) {            
                log.logDebug("rhb closed");
            }
        },
        
        /**
         * @public
         */
        getMaxIntervalMs: function() {
            return this.maxIntervalMs;
        },
        
        schedule: function() {
            if (this.disableHeartbeats || this.closed) {
                return;
            }
            if (this.lastSentTimeNs === -1) {
                /*
                 * If lastSentTimeNs was not already set, 
                 * assume that this is the point from which measuring heartbeat distance.
                 * This can happen when the onBindSession() is called with bindAsControl set to false.
                 */
                this.lastSentTimeNs = now();
                this.submitTask(this.currentIntervalMs);
            } else {
                var timeLeftMs = this.getTimeLeftMs();
                if (timeLeftMs <= 0) {
                    this.sendHeartbeat();
                    this.submitTask(this.currentIntervalMs);
                } else {
                    this.submitTask(timeLeftMs);
                }
            }
        },
        
        getTimeLeftMs: function() {
            assert(this.lastSentTimeNs !== -1);
            assert(this.currentIntervalMs !== -1);
            var timeElapsedMs = now() - this.lastSentTimeNs;
            var timeLeftMs = this.currentIntervalMs - timeElapsedMs;
            return timeLeftMs;
        },
        
        /**
         * Sends a heartbeat message.
         */
        sendHeartbeat: function() {
            if (log.isDebugLogEnabled()) {
                log.logDebug("rhb heartbeat ph ", this.currentPhase);
            }
            this.session.handler.controlHandler.sendReverseHeartbeat();
        },
        
        /**
         * Sets the heartbeat interval and schedules a task sending heartbeats if necessary.
         */
        setCurrentInterval: function(newIntervalMs) {
            assert(this.maxIntervalMs !== -1);
            var oldIntervalMs = this.currentIntervalMs;
            /*
             * Change the current interval with respect to the user defined value and the maximum interval.
             * 
             * newInterval      currentIntervalMs   maxIntervalMs   new currentIntervalMs
             * --------------------------------------------------------------------------------------------------
             * ∞                ∞                   ∞               ∞
             * ∞                ∞                   m               impossible: currentIntervalMs > maxIntervalMs
             * ∞                c                   ∞               ∞
             * ∞                c                   m               m
             * u                ∞                   ∞               u
             * u                ∞                   m               impossible: currentIntervalMs > maxIntervalMs
             * u                c                   ∞               u
             * u                c                   m               minimum(u, m)
             * 
             * ∞ = interval is 0
             * u, c, m = interval bigger than 0
             */
            if (newIntervalMs === 0) {
                this.currentIntervalMs = this.maxIntervalMs;
            } else if (this.maxIntervalMs === 0) {
                assert(newIntervalMs > 0);
                this.currentIntervalMs = newIntervalMs;
            } else {
                assert(newIntervalMs > 0 && this.maxIntervalMs > 0);
                this.currentIntervalMs = Math.min(newIntervalMs, this.maxIntervalMs);
            }
            this.disableHeartbeats = (this.currentIntervalMs === 0);
            if (oldIntervalMs !== this.currentIntervalMs) {
                if (log.isDebugLogEnabled()) {
                    log.logDebug("rhb current interval", this.currentIntervalMs);
                }
                if (this.bindSent) {
                    /* 
                     * since currentIntervalMs has changed,
                     * increment phase to discard already scheduled tasks 
                     */
                    this.currentPhase++;
                    this.schedule();
                }
            }
        },
        
        /**
         * Adds a heartbeat task on session thread after the given delay.
         */
        submitTask: function(scheduleTimeMs) {
            if (log.isDebugLogEnabled()) {            
                log.logDebug("rhb scheduled +", scheduleTimeMs, "ph", this.currentPhase);
            }
            /*
             * A task representing a scheduled heartbeat.
             * The phase assures that there is at most one active task.
             * <p>
             * NB After sending a heartbeat, the task schedules another task instance to simulate a periodic behavior. 
             */
            var that = this;
            var phase = this.currentPhase;
            setTimeout(function() {
                if (log.isDebugLogEnabled()) {
                    log.logDebug("rhb task fired ph", phase);
                }
                if (phase < that.currentPhase) {
                    if (log.isDebugLogEnabled()) {
                        log.logDebug("rhb task discarded ph", phase);
                    }
                    return;
                }
                assert(phase === that.currentPhase);
                that.schedule();
            }, scheduleTimeMs);
        }
};

function now() {
    return new Date().getTime();
}

function assert(cond) {
    if (! cond) {
        log.logError("ReverseHeartbeatTimer: assertion error");
    }
}

export default ReverseHeartbeatTimer;
