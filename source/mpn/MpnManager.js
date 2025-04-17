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
import Assertions from "../utils/Assertions";
import MpnSubscription from "../MpnSubscription";
import MpnEventManager from "./MpnEventManager";
import MpnRequestManager from "./MpnRequestManager";
import DEV_Manager from "./DEV_Manager";
import SUBS_Manager from "./SUBS_Manager";
import SubscribeManager from "./SubscribeManager";
import SubscriptionList from "./SubscriptionList";
import UnsubscribeFilterManager from "./UnsubscribeFilterManager";
import MpnUnsubscribeFilter from "./MpnUnsubscribeFilter";
import UnsubscribeManager from "./UnsubscribeManager";
    
	var log = LoggerManager.getLoggerProxy(Constants.MPN);
	
    /**
     * @since July 2018
     */
    function MpnManager(lsClient) {
    	this.lsClient = lsClient;
        this.stateMachine = new StateMachine(this);
        this.requestManager = new MpnRequestManager(this);
        this.eventManager = new MpnEventManager(this);
        this.dev_manager = new DEV_Manager(this);
        this.subs_manager = new SUBS_Manager(this);
        this.subscribeManager = new SubscribeManager(this);
        this.subscriptions = new SubscriptionList();
        this.unsubscribeManager = new UnsubscribeManager(this);
        this.unsubscribeFilterManager = new UnsubscribeFilterManager(this);
    }
    
    MpnManager.prototype = {
    		
    		/* 
    	     * **********************************
    	     * API exposed to LightstreamerClient
    	     * **********************************
    	     */
    		
            /**
             * See {@link LightstreamerClient#registerForMpn(MpnDeviceInterface)}.
             */
    		registerForMpn: function(device) {
    	        this.stateMachine.register(device);
    	    },
    	    
    	    /**
    	     * See {@link LightstreamerClient#subscribe(MpnSubscription, boolean)}.
    	     */
    	    subscribe: function(sub, coalescing) {
    	        try {
    	            sub.eventManager.onSubscribe(coalescing);
    	            this.stateMachine.subscribe(sub);
                } catch (e) {
                    this.onFatalError(e);
                }
    	    },
    	    
    	    /**
    	     * See {@link LightstreamerClient#unsubscribe(MpnSubscription)}.
    	     */
    	    unsubscribe: function(/*MpnSubscription*/ sub) {
    	        sub.throwErrorIfInactiveOrUnsubscribing();
    	        try {
    	            sub.eventManager.onUnsubscribe();
    	            this.stateMachine.unsubscribe(sub);
                } catch (e) {
                    this.onFatalError(e);
                }
    	    },
    	    
    	    /**
    	     * See {@link LightstreamerClient#unsubscribeMpnSubscriptions(String)}.
    	     */
    	    unsubscribeFilter: function(filter) {
    	        this.stateMachine.unsubscribeFilter(filter);
    	    },
    	    
    	    /**
    	     * See {@link LightstreamerClient#getMpnSubscriptions(String)}.
    	     */
    	    /*List<MpnSubscription>*/ getSubscriptions: function(filter) {
    	        return this.subscriptions.getSubscriptions(filter);
    	    },
    	    
    	    /**
    	     * See {@link LightstreamerClient#findMpnSubscription(String)}.
    	     */
    	    /*MpnSubscription*/ findSubscription: function(subId) {
    	        return this.subscriptions.findSubscription(subId);
    	    },
    	    
    	    getDeviceId: function() {
                return this.mpnDevice == null ? null : this.mpnDevice.deviceId;
            },
            
            /*
             * Support methods
             */
            
            onFatalError: function(error) {
                this.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.onFatalError(error);
                });
            }
    	    
    };
    
    var StateMachine = function(mpnManager) {
    	this.mpnManager = mpnManager;
    	this.state = 0 /*NO_SESSION*/;
    };
    
    StateMachine.NO_SESSION = 0;
    StateMachine.SESSION_OK = 1;
    StateMachine.READY = 2;
    StateMachine.REGISTERING = 3;
    StateMachine.REGISTERED = 4;
    StateMachine.NAMES = [];
    StateMachine.NAMES[StateMachine.NO_SESSION] = "NO_SESSION";
    StateMachine.NAMES[StateMachine.SESSION_OK] = "SESSION_OK";
    StateMachine.NAMES[StateMachine.READY] = "READY";
    StateMachine.NAMES[StateMachine.REGISTERING] = "REGISTERING";
    StateMachine.NAMES[StateMachine.REGISTERED] = "REGISTERED";
    
    StateMachine.prototype = {
    		
    		/**
             * Fired when a new session starts.
             */
    		onSessionStart: function() {
    			var event = "onSessionStart";
    			switch (this.state) {
    			
    			case StateMachine.NO_SESSION:
    				this.next(StateMachine.SESSION_OK, event);
    				break;
    				
    			case StateMachine.READY:
    				this.mpnManager.requestManager.sendRegisterRequest(0);
    	            this.next(StateMachine.REGISTERING, event);
    	            break;
    	            
    			default:
    	            this.throwError(event);
    			}
    		},
    		
    		/**
             * Fired when the current session closes.
             * 
             * @param recovery if the flag is true, the closing is due to an automatic recovery.
             * Otherwise the closing is due to a disconnection made by the user
             * (see {@link LightstreamerClient#disconnect()}).
             */
            onSessionClose: function(recovery) {
                var event = "onSessionClose";
                this.mpnManager.dev_manager.unsubscribeFromDEVAdapter();
                this.mpnManager.subs_manager.unsubscribeFromSUBSAdapter();
                this.mpnManager.requestManager.createTutorContext();
                this.mpnManager.subscribeManager.onSessionClose(recovery);
                this.mpnManager.unsubscribeManager.onSessionClose(recovery);
                this.mpnManager.unsubscribeFilterManager.onSessionClose(recovery);
                if (this.mpnManager.mpnDevice != null) {
                    this.mpnManager.mpnDevice.eventManager.onSessionClose(recovery);
                }
            	switch (this.state) {
            	
            	case StateMachine.NO_SESSION:
            		this.next(StateMachine.NO_SESSION, event);
            		break;
            		
            	case StateMachine.SESSION_OK:
            		this.next(StateMachine.NO_SESSION, event);
            		break;
            		
            	case StateMachine.READY:
            		this.next(StateMachine.READY, event);
            		break;
            		
            	case StateMachine.REGISTERING:
            		this.next(StateMachine.READY, event);
            		break;
            		
            	case StateMachine.REGISTERED:
            		this.next(StateMachine.READY, event);
            		break;
            	}
    		},
    		
    		/**
             * Fired when the user registers the device.
             */
    		register: function(device) {
    			var event = "register";
    			switch (this.state) {
    			
    			case StateMachine.NO_SESSION:
    				this.resetDevice(device);
    				this.next(StateMachine.READY, event);
    				break;
    				
    			case StateMachine.SESSION_OK:
    				this.resetDevice(device);
    	            this.mpnManager.requestManager.sendRegisterRequest(0);
    	            this.next(StateMachine.REGISTERING, event);
    				break;
    				
    			case StateMachine.READY:
    				this.resetDevice(device);
    	            this.next(StateMachine.READY, event);
    				break;
    				
    			case StateMachine.REGISTERING:
    				this.resetDevice(device);
    	            this.mpnManager.requestManager.sendRegisterRequest(0);
    	            this.next(StateMachine.REGISTERING, event);
    				break;
    				
    			case StateMachine.REGISTERED:
    				this.resetDevice(device);
    	            this.mpnManager.requestManager.sendRegisterRequest(0);
    	            this.next(StateMachine.REGISTERING, event);
    				break;
    			}
    		},
    		
    		/**
             * Fired when the message MPNREG is received.
             */
            onRegisterOK: function(deviceId, adapterName) {
            	var event = "onRegisterOK";
            	switch (this.state) {
            	
				case StateMachine.REGISTERING:
					this.mpnManager.mpnDevice.eventManager.onRegisterOK(deviceId, adapterName);
					this.mpnManager.requestManager.sendWaitings();
					this.mpnManager.dev_manager.subscribeToDEVAdapter();
					this.mpnManager.subs_manager.subscribeToSUBSAdapter();
					this.next(StateMachine.REGISTERED, event);
					break;

                case StateMachine.REGISTERED:
                    // ignore MPNREG duplicates
                    break;

				default:
				    this.throwError(event);
				}
            },
            
            /**
             * Fired when the registration fails.
             */
            onRegisterError: function(code, message) {
            	var event = "onRegisterError";
            	switch (this.state) {
            	
            	case StateMachine.REGISTERING:
            		this.mpnManager.mpnDevice.eventManager.onRegisterError(code, message);
                    this.next(StateMachine.SESSION_OK, event);
            		break;
            		
            	default:
            	    this.throwError(event);
            	}
            },
            
            /**
             * Fired when the user subscribes to an item.
             */
            subscribe: function(sub) {
                var event = "subscribe";
                switch (this.state) {
                
                case StateMachine.REGISTERED:
                    this.mpnManager.subscribeManager.subscribe(sub);
                    break;
                    
                default:                    
                    this.mpnManager.subscribeManager.addWaiting(sub);
                }
            },
            
            /**
             * Fired when the user unsubscribes from an item.
             */
            unsubscribe: function(/*MpnSubscription*/ sub) {
                var event = "unsubscribe";
                switch (this.state) {
                
                case StateMachine.REGISTERED:
                    /*
                     * Sometimes the user requests an unsubscription when the corresponding subscription has been sent 
                     * over the network and the client is awaiting the response.
                     * In this case we must await the subscription response and then send the unsubscription request.
                     */
                    var /*PendingRequest*/ req = this.mpnManager.subscribeManager.getPendingRequest(sub);
                    if (req == null) {
                        /* there is no pending subscription */
                        this.mpnManager.unsubscribeManager.unsubscribe(sub);
                        
                    } else {
                        var that = this;
                        /* set the listener that will fire the unsubscription when the subscription request is completed */
                        req.setOnCompleteHandler(/*PendingRequest.OnCompleteHandler*/ {
                            
                            onComplete: function(success) {
                                if (success) {
                                    that.mpnManager.unsubscribeManager.unsubscribe(sub);
                                } else {
                                    /*
                                     * ignore the unsubscription request since the subscription request failed
                                     */
                                }
                            }
                        });
                    }
                    break;
                
                default:
                    /*
                     * Sometimes a subscription is immediately followed by an unsubscription.
                     * If the subscription has not been sent over the network (i.e. it is in the waiting list), 
                     * we can avoid to send both the subscription and the unsubscription requests 
                     * and simply make a state transition on the subscription object.
                     */
                    var subscribeRequestWasWaiting = this.mpnManager.subscribeManager.removeWaiting(sub);
                    if (subscribeRequestWasWaiting) {
                        sub.eventManager.cancelSubscription();

                    } else {

                        /* send the unsubscription request when the the device is registered */
                        this.mpnManager.unsubscribeManager.addWaiting(sub);
                    }
                }
            },
            
            /**
             * Fired when the user unsubscribes from a set of items using a filter.
             */
            unsubscribeFilter: function(filter) {
                var event = "unsubscribeFilter";
                switch (this.state) {
                
                case StateMachine.REGISTERED:
                    this.mpnManager.unsubscribeFilterManager.unsubscribe(new MpnUnsubscribeFilter(filter));
                    break;
                    
                default:                    
                    this.mpnManager.unsubscribeFilterManager.addWaiting(filter);
                }
            },
    		
    		/**
    	     * Resets internal data structures when starting a new registration.
    	     */
            resetDevice: function(device) {
    		    /* unsbuscribe form DEV- and SUBS- */
    	        this.mpnManager.dev_manager.unsubscribeFromDEVAdapter();
    	        this.mpnManager.subs_manager.unsubscribeFromSUBSAdapter();
    			/* abort pending requests */
    	        this.mpnManager.requestManager.createTutorContext();
    	        /* clear internal data structures */
    	        this.mpnManager.subscribeManager.reset();
    	        this.mpnManager.unsubscribeManager.reset();
    	        this.mpnManager.unsubscribeFilterManager.reset();
    			/* set the new device */
    			this.mpnManager.mpnDevice = device;
    		},
    		
    		/**
             * Changes the current state.
             */
    		next: function(next, event) {
    			if (log.isDebugLogEnabled()) {
    				var from = StateMachine.NAMES[this.state];
    				var to = StateMachine.NAMES[next];
    				log.logDebug("MpnManager state change", this.mpnManager.getDeviceId(), "on '" + event + "': " + from + " -> " + to);
    			}
    			this.state = next;
    		},
    		
    		throwError: function(event) {
                var msg = "Unexpected event '" + event + "' in state " + StateMachine.NAMES[this.state] + " (" + this.mpnManager.getDeviceId() + ")";
                log.logError(msg);
                throw new Error(msg);
            }
    };
    
    export default MpnManager;
