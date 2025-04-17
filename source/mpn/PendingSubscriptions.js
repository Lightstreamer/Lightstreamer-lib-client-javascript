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
import MpnUtils from "./MpnUtils";
import Assertions from "../utils/Assertions";

    /**
     * A mapping from ephemeralSubId to pending subscription requests.
     * A request is pending when the request has been sent to the server but the client has not received a response
     * (i.e. MPNOK/REQERR message).
     */
    var PendingSubscriptions = function() {
        /**
         * Maps the ephemeralSubId (i.e. the values of the parameters LS_subId of the subscribe requests)
         * with the corresponding subscriptions.
         */
        /*Map<String, PendingRequest>*/ this.pendings = new MpnUtils.MyMap();
    };
    
    PendingSubscriptions.prototype = {
            
            /**
             * Associates a subscription with an ephemeralSubId.
             */
            put: function(ephemeralSubId, /*MpnSubscription*/ sub) {
                this.pendings.put(ephemeralSubId, new PendingRequest(sub));
            },
            
            /**
             * Remove the request corresponding to an ephemeralSubId.
             */
            remove: function(ephemeralSubId) {
                var /*PendingRequest*/ req = this.pendings.remove(ephemeralSubId);
                return req;
            },
            
            /**
             * Returns the list of the currently pending subscriptions.
             */
            /*List<MpnSubscription>*/ values: function() {
                var /*List<MpnSubscription>*/ ls = new MpnUtils.MyList();
                var /*List<PendingRequest>*/ values = this.pendings.values();
                for (var i = 0, len = values.size(); i < len; i++) {
                    var req = values.get(i);
                    ls.add(req.subscription);
                }
                return ls;
            },
            
            clear: function() {
                this.pendings.clear();
            },
            
            /**
             * Returns the pending request corresponding to the specified subscription.
             */
            /*PendingRequest*/ getPendingRequest: function(/*MpnSubscription*/ sub) {
                var values = this.pendings.values();
                for (var i = 0, len = values.size(); i < len; i++) {
                    var req = values.get(i);
                    if (req.subscription == sub) {
                        return req;
                    }
                }
                return null;
            }
    };
    
    /**
     * A request which has been sent to the server, but whose response has not been received.
     * A listener can be attached to a pending request. When the request is completed, the listener is fired.
     */
    var PendingRequest = function(/*MpnSubscription*/ sub) {
        this.subscription = sub;
        this.handler = null;
    };
    
    PendingRequest.prototype = {
            
            setOnCompleteHandler: function(/*OnCompleteHandler*/ handler) {
                Assertions.assert(this.handler == null);
                this.handler = handler;
            },
            
            /**
             * This method must be called when the response arrives.
             * If there is an attached listener, it is fired.
             * 
             * @param success true if the response is right. False when the response is an error.
             */
            onComplete: function(success) {
                if (this.handler != null) {
                    this.handler.onComplete(success);
                    this.handler = null;
                }
            }
    };
    
//    interface OnCompleteHandler {
//        
//        /**
//         * Signals that a {@link PendingRequest} has been carried out.
//         * 
//         * @param success true if the response is right. False when the response is an error.
//         */
//        void onComplete(boolean success);
//    }
    
    export default PendingSubscriptions;

