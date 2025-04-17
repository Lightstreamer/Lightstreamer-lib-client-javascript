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
     * A filtered unsubscription can simultaneously unsubscribes from all the items sharing a given state.
     * <p>
     * The filter can be:
     * <ul>
     * <li>ALL: unsubscribes all the items</li>
     * <li>ACTIVE: unsubscribes all the active (i.e. subscribed) items</li>
     * <li>TRIGGERED: unsubscribes all the triggered items</li>
     * </ul>
     */
    function MpnUnsubscribeFilter(filter) {
        //assert filter == null || filter == "ALL" || filter == "SUBSCRIBED" || filter == "TRIGGERED"
        if (filter != null) {
            filter = filter.toUpperCase();
        }
        if (filter == null) {
            // the value null is processed as the value ALL
            filter = "ALL";
        } else if (filter == "SUBSCRIBED") {
            // NB SUBSCRIBED is translated to ACTIVE because the server expects this name
            filter = "ACTIVE";
        }
        this.filter = filter;
    }
    
    export default MpnUnsubscribeFilter;

