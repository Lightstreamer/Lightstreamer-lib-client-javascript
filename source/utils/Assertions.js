import ASSERT from "../../src-test/ASSERT";
import LoggerManager from "../../src-log/LoggerManager";
    
    var log = LoggerManager.getLoggerProxy("assertions");
    
    /**
     * Assertion utilities.
     * 
     * @since May 2018
     */
    var Assertions = {
            assert: function(cond, msg) {
                if (! cond) {
                   this.fail(msg);
                }
            },
            
            assertNotNull: function(val, msg) {
                if (val == null) {
                    this.fail(msg);
                }
            },
            
            assertNull: function(val, msg) {
                if (val != null) {
                    this.fail(msg);
                }
            },
            
            assertEquals: function(a, b, msg) {
                if (a !== b) {
                    this.fail(msg + ": Expected " + a + " but found " + b);
                }
            },
            
            implies: function(a, b, msg) {
                this.assert(! a || b, msg);
            },
            
            fail: function(msg) {
                if (msg != null) {
                    log.logError(msg);
                }
                ASSERT.fail();
            },
            
            verifyOk: function(a, msg) {
                if (! ASSERT.verifyOk(a)) {
                    if (msg != null) {
                        log.logError(msg);
                    }
                }
            },
            
            verifyNotOk: function(a, msg) {
                if (! ASSERT.verifyNotOk(a)) {
                    if (msg != null) {
                        log.logError(msg);
                    }
                }
            },
            
            verifyValue: function(a, b, msg) {
                if (! ASSERT.verifyValue(a, b, null)) {
                    if (msg != null) {
                        log.logError(msg);
                    }
                }
            },
            
            verifyDiffValue: function(a, b, msg) {
                if (! ASSERT.verifyDiffValue(a, b, null)) {
                    if (msg != null) {
                        log.logError(msg);
                    }
                }
            }
    };
    
    export default Assertions;
