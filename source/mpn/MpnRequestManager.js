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
import MpnTutorContext from "./MpnTutorContext";
import MpnRegisterTutor from "./MpnRegisterTutor";
import MpnRegisterRequest from "./MpnRegisterRequest";
import MpnSubscribeRequest from "./MpnSubscribeRequest";
import MpnSubscribeTutor from "./MpnSubscribeTutor";
import MpnUnsubscribeFilterRequest from "./MpnUnsubscribeFilterRequest";
import MpnUnsubscribeFilterTutor from "./MpnUnsubscribeFilterTutor";
import MpnUnsubscribeRequest from "./MpnUnsubscribeRequest";
import MpnUnsubscribeTutor from "./MpnUnsubscribeTutor";

    /**
     * API exposed to {@link MpnTutor}
     */
    var MpnRequestManager = function(mpnManager) {
        this.mpnManager = mpnManager;
        // the context shared by all the tutors belonging to the same session
        this.tutorContext = new MpnTutorContext();
    };
    
    MpnRequestManager.prototype = {
        
            /**
             * Dismisses the old context and creates a new one.
             */
            createTutorContext: function() {
                // dismiss the old context and create a new one
                this.tutorContext.dismissed = true;
                this.tutorContext = new MpnTutorContext();
            },
            
            /**
             * Sends a registration request.
             */
            sendRegisterRequest: function(timeoutMs) {
                var request = new MpnRegisterRequest(this.mpnManager.mpnDevice);
                var tutor = new MpnRegisterTutor(timeoutMs, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendRegisterForMpn(request, tutor);
                });
            },
            
            /**
             * Sends a subscription request.
             */
            sendSubscribeRequest: function(timeoutMs, ephemeralSubId, /*MpnSubscription*/ sub) {
                var request = new MpnSubscribeRequest(ephemeralSubId, this.mpnManager.mpnDevice.getDeviceId(), sub);
                var tutor = new MpnSubscribeTutor(timeoutMs, ephemeralSubId, sub, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendMpnSubscription(request, tutor);
                });
            },
            
            /**
             * Sends an unsubscription request.
             */
            sendUnsubscribeRequest: function(timeoutMs, /*MpnSubscription*/ sub) {
                var request = new MpnUnsubscribeRequest(this.mpnManager.mpnDevice.getDeviceId(), sub);
                var tutor = new MpnUnsubscribeTutor(timeoutMs, sub, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendMpnUnsubscription(request, tutor);
                });
            },
            
            /**
             * Sends a filtered unsubscription request.
             */
            sendUnsubscribeFilteredRequest: function(timeoutMs, /*MpnUnsubscribeFilter*/ unsubFilter) {
                var request = new MpnUnsubscribeFilterRequest(this.mpnManager.mpnDevice.getDeviceId(), unsubFilter.filter);
                var tutor = new MpnUnsubscribeFilterTutor(timeoutMs, unsubFilter, this.mpnManager, this.tutorContext);
                this.mpnManager.lsClient.getLsEngine().then(function(lsEngine) {
                    lsEngine.sendMpnFilteredUnsubscription(request, tutor);
                });
            },

            /**
             * Sends the requests on the waiting list.
             */
            sendWaitings: function() {
                /* send pending mpn subscriptions */
                this.mpnManager.subscribeManager.subscribeWaitings();
                /* send pending mpn unsubscriptions */
                this.mpnManager.unsubscribeManager.unsubscribeWaitings();
                this.mpnManager.unsubscribeFilterManager.unsubscribeWaitings();
            },
            
            /**
             * 
             * Fired when the message REQOK/REQERR is received as a response to a filtered unsubscription.
             */
            onUnsubscriptionFilterResponse: function(/*MpnUnsubscribeFilter*/ filter) {
                this.mpnManager.unsubscribeFilterManager.onUnsubscribeRepsone(filter);
            }
    };
    
    export default MpnRequestManager;

