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
import MpnUnsubscribeFilter from "./MpnUnsubscribeFilter";
import Assertions from "../utils/Assertions";

    /**
     * Manages the life cycle of the filtered unsubscription requests.
     * <p>
     * A filtered unsubscription can be in the following states:
     * <ul>
     * <li><b>waiting</b>: the filtered unsubscription is waiting for the device to register. 
     * After that the filtered unsubscription becomes pending and the corresponding request is sent.</li>
     * <li><b>pending</b>: the corresponding request has been sent but no response has been received yet.</li>
     * </ul>
     */
    var UnsubscribeFilterManager = function(mpnManager) {
        this.mpnManager = mpnManager;
        /**
         * The state of the contained objects is <b>pending</b>.
         */
        /*List<MpnUnsubscribeFilter>*/ this.pendings = new MpnUtils.MyList();
        /**
         * The state of the contained objects is <b>waiting</b>.
         */
        /*List<MpnUnsubscribeFilter>*/ this.waitings = new MpnUtils.MyList();
    }
    
    UnsubscribeFilterManager.prototype = {
            
            /**
             * Resets the internal data structures to start a new registration.
             */
            reset: function() {
                this.pendings.clear();
                this.waitings.clear();
            },
            
            /**
             * Adds the filtered unsubscription to the waiting list.
             */
            addWaiting: function(filter) {
                this.waitings.add(new MpnUnsubscribeFilter(filter));
            },
            
            /**
             * Unsubscribes the objects on the waiting list, which are put in the pending list.
             */
            unsubscribeWaitings: function() {
                for (var i = 0, len = this.waitings.size(); i < len; i++) {
                    /*MpnUnsubscribeFilter*/ var filter = this.waitings.get(i); 
                    this.unsubscribe(filter);
                }
                this.waitings.clear();
            },
            
            /**
             * Tries to unsubscribe the object, which is put in the pending list.
             */
            unsubscribe: function(/*MpnUnsubscribeFilter*/ filter) {
                Assertions.assert(! this.pendings.contains(filter));
                this.pendings.add(filter);
                this.mpnManager.requestManager.sendUnsubscribeFilteredRequest(0, filter);
            },
            
            /**
             * Fired when the message REQOK/REQERR is received.
             * The filtered unsubscription is removed from the pending list.
             */
            onUnsubscribeRepsone: function(/*MpnUnsubscribeFilter*/ filter) {
                var contained = this.pendings.remove(filter);
                Assertions.assert(contained);
            },
            
            /**
             * Fired when the current session is closed.
             * The pending filtered unsubscriptions are marked as waiting so they will be sent when a new session
             * becomes available.
             * 
             * @param recovery if the flag is true, the closing is due to an automatic recovery.
             * Otherwise the closing is due to a disconnection made by the user
             * (see {@link LightstreamerClient#disconnect()}).
             */
            onSessionClose: function(recovery) {
                if (recovery) {
                    this.waitings.addAll(this.pendings);
                    this.pendings.clear();
                    
                } else {
                    this.waitings.clear();
                    this.pendings.clear();
                }
            }
    }
    
    export default UnsubscribeFilterManager;

