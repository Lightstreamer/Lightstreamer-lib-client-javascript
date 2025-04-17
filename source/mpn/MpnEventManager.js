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
     * API exposed to SessionManager
     */
	var MpnEventManager = function(mpnManager) {
		this.mpnManager = mpnManager;
	};
	
	MpnEventManager.prototype = {
			
			/**
	         * Fired when a new session is started.
	         */
	        onSessionStart: function() {
	            try {
	                this.mpnManager.stateMachine.onSessionStart();	                
	            } catch(e) {
	                this.mpnManager.onFatalError(e);
	            }
	        },
	        
	        /**
	         * Fired when the current session is closed.
	         * 
	         * @param recovery if the flag is true, the closing is due to an automatic recovery.
	         * Otherwise the closing is due to a disconnection made by the user
	         * (see {@link LightstreamerClient#disconnect()}).
	         */
	        onSessionClose: function(recovery) {
	            try {
	                this.mpnManager.stateMachine.onSessionClose(recovery);
	            } catch(e) {
                    this.mpnManager.onFatalError(e);
                }
            },
	        
	        /**
	         * Fired when the message MPNREG is received.
	         */
	        onRegisterOK: function(deviceId, adapterName) {
	            try {
	                this.mpnManager.stateMachine.onRegisterOK(deviceId, adapterName);
	            } catch(e) {
                    this.mpnManager.onFatalError(e);
                }
	        },
	        
	        /**
	         * Fired when a REQERR is received as a response of a register request.
	         */
	        onRegisterError: function(code, message) {
	        	this.mpnManager.stateMachine.onRegisterError(code, message);
	        },
	        
	        /**
	         * Fired when the message MPNOK is received.
	         * <p>
	         * <b>NB</b> Each subscription request has two identifiers: a subId, which is used to identify the 
	         * subscription and corresponds to the second argument of the message MPNOK, and an ephemeralSubId,
	         * which temporarily identifies the request until MPNOK is received and corresponds to the parameter
	         * LS_subId of the subscription request.
	         */
	        onSubscribeOK: function(ephemeralSubId, subId) {
	            this.mpnManager.subscribeManager.onUserSubscribeOK(ephemeralSubId, subId);
	        },
	        
	        /**
	         * Fired when a REQERR is received as a response of a subscription request.
	         */
	        onSubscribeError: function(subId, code, message) {
	            this.mpnManager.subscribeManager.onSubscribeError(subId, code, message);
	        },
	        
	        /**
	         * Fired when the message MPNDEL is received.
	         */
	        onUnsubscribeOK: function(subId) {
	            this.mpnManager.subscribeManager.onUnsubscribeOK(subId);
	        },
	        
	        /**
	         * Fired when a REQERR is received as a response of an unsubscription request.
	         */
	        onUnsubscribeError: function(subId, code, message) {
	            this.mpnManager.unsubscribeManager.onUnsubscribeError(subId, code, message);
	        }
	};
	
	export default MpnEventManager;

