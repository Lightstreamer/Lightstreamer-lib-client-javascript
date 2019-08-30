
export default /*@__PURE__*/(function() {	
	/*
	 * Can be used as a replacement for Promise, but only for the basic usage.
	 * With this implementation, when the action is triggered, all "then" blocks
	 * are executed immediately, as callbacks, rather than being scheduled
	 * for an immediate but later execution.
	 * This behavior may pose reentrancy issues, but can be used in emergency
	 * situation when the scheduling implied by a promise turns out to be the
	 * cause of some unexpected race condition. 
	 */

    var SyncPromise = function(initializer) {
        this.pending = [];
        this.triggered = false;
        this.bound = false;
        this.value = null;
        this.failed = false;
        var that = this;
        initializer(
            function() { return that.onResolved.apply(that, arguments); },
            function() { return that.onRejected.apply(that, arguments); }
        );
    };
    
    SyncPromise.resolve = function(val) {
        return new SyncPromise(function(resolve, reject) {
            resolve(val);
        });
    };
        
    SyncPromise.reject = function(val) {
        return new SyncPromise(function(resolve, reject) {
            reject(val);
        });
    };
        
    SyncPromise.prototype = {
        
        then: function(ok, no) {
            if (this.triggered) {
                this.runStep(ok, no);
            } else {
                var next = { onOk: ok, onNo: no };
                this.pending.push(next);
            }
            return this;
        },
        
	    onResolved: function(val) {
	        if (this.triggered || this.bound) {
	            return null;
	        }
	        if (val && val.then && val.constructor === this.constructor) {
	            // we must link this promise to the one received
	            this.bound = true;
	                // as we cannot accept an external resolve or reject,
	                // since we already expect one from "val"
	            var that = this;
	            val.then(
	                function(v) { that.trigger(v, true); return that.value; },
	                function(v) { that.onRejected(v, false); }
	            );
	            // NOTE: we are not managing the case in which "val" is a real Promise!
	            // And, obviously, we cannot manage the case in which a SyncPromise
	            // is supplied to a real promise! The code must use them consistently 
	            return val;
	        } else {
		        this.trigger(val, true);
		        return this;
	        }
	    },
	    
        trigger: function(val, success) {
	        this.value = val;
	        this.failed = ! success;
	        while (this.pending.length > 0) {
	            var curr = this.pending.shift();
	            this.runStep(curr.onOk, curr.onNo);
	        }
	        this.triggered = true;
	        this.bound = false;
        },
	    
	    onRejected: function(val) {
	        if (this.triggered || this.bound) {
	            return null;
	        }
	        this.trigger(val, false);
	        return this;
	    },
	    
        runStep: function(ok, no) {
            try {
                if (this.failed) {
                    if (no) {
                        no.apply(null, [this.value]);
                    }
                } else {
                    var ret = ok.apply(null, [this.value]);
                    // this.value = ret;
                        // not part of the Promise specifications
                }
            } catch(_e) {
                // not part of the Promise specifications, though
                if (! this.failed) {
                    this.failed = true;
                    this.value = _e;
                }
            }
        }
            
    };
    
    return SyncPromise;
})();

