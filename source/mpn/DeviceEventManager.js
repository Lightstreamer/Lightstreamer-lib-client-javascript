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
     * API exposed to {@link MpnManager}
     */
	var DeviceEventManager = function(device) {
		this.device = device;
	};
	
	DeviceEventManager.prototype = {
	        
	        /**
	         * Fired when the current session closes.
	         * 
	         * @param recovery if the flag is true, the closing is due to an automatic recovery.
	         * Otherwise the closing is due to a disconnection made by the user
	         * (see {@link LightstreamerClient#disconnect()}).
	         */
	        onSessionClose: function(recovery) {
	            if (recovery) {
	                // keep current state
	                
	            } else {
	                // reset state
	                this.device.stateMachine.onSessionClose();
	                this.device.deviceId = null;
	                this.device.adapterName = null;
	                this.device.statusTimestamp = 0;
	            }
            },
		
			/**
             * Fired when the message MPNREG is received.
             */
			onRegisterOK: function(deviceId, adapterName) {
				this.device.deviceId = deviceId;
                this.device.adapterName = adapterName;
	        },
	        
	        /**
             * Fired when a REQERR is received as a response of a register request.
             */
	        onRegisterError: function(code, message) {
	        	this.device.stateMachine.error(code, message);
	        },
	        
	        /**
             * Fired when item DEV- publishes an update.
             */
	        onStatusChange: function(status, timestamp) {
	        	switch (status) {
	            
	        	case "ACTIVE":
	        		this.device.stateMachine.activate(timestamp);
	                break;
	            
	        	case "SUSPENDED":
	        		this.device.stateMachine.suspend(timestamp);
	                break;
	            }
	        },
	        
	        onSubscriptionsUpdated: function() {
	            this.device.dispatchEvent("onSubscriptionsUpdated");
            }
	};

	export default DeviceEventManager;

