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
import Subscription from "../Subscription";
	
	/**
     * Manages the subscription/unsubscription of the DEV- adapter publishing info about the current MPN device. 
     */
	var DEV_Manager = function(mpnManager) {
		this.mpnManager = mpnManager;
	};
	
	DEV_Manager.prototype = {
			
			/**
	         * Subscribes to DEV- adapter.
	         */
	        subscribeToDEVAdapter: function() {
	        	var that = this;
	        	this.listener = {
	        			/**
	        	         * When dismissed, incoming messages are discarded.
	        	         */
	        			dismissed: false,
	        			
	        			// preserve the name of the method as it is called by the dispatcher
	        			"onItemUpdate": function(itemUpdate) {
	        				if (this.dismissed) {
	                            return;
	                        }
	        				try {
	        				    var status = itemUpdate.getValue("status");
	        				    var timestamp = parseInt(itemUpdate.getValue("status_timestamp"), 10);
	        				    that.mpnManager.mpnDevice.eventManager.onStatusChange(status, timestamp);
                            } catch (e) {
                                that.mpnManager.onFatalError(e);
                            }
	        			}
	        	};
	        	this.subscription = new Subscription(
	        			"MERGE", 
	        			"DEV-" + this.mpnManager.mpnDevice.deviceId, 
	        			["status", "status_timestamp"]);
	        	this.subscription.setDataAdapter(this.mpnManager.mpnDevice.adapterName);
	            this.subscription.setRequestedMaxFrequency("unfiltered");
	        	this.subscription.addListener(this.listener);
	        	this.mpnManager.lsClient.subscribe(this.subscription);
	        },
	        
	        /**
	         * Unsubscribes from DEV- adapterName.
	         */
	        unsubscribeFromDEVAdapter: function() {
	            if (this.subscription != null) {
	                this.mpnManager.lsClient.unsubscribe(this.subscription);
	                this.subscription.removeListener(this.listener);
	                this.listener.dismissed = true;
	                this.subscription = null;
	                this.listener = null;
	            }
	        }
	};

	export default DEV_Manager;

