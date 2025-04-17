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
import Inheritance from "../../src-tool/Inheritance";
import MpnRequest from "./MpnRequest";

    var MpnUnsubscribeFilterRequest = function(deviceId, filter) {
        this._callSuperConstructor(MpnUnsubscribeFilterRequest);
        //assert filter == "ALL" || filter == "ACTIVE" || filter == "TRIGGERED"
        this.addParam('LS_op', 'deactivate');
        this.addParam('PN_deviceId', deviceId);
        if (filter != "ALL") {            
            this.addParam('PN_subscriptionStatus', filter);
        }
    };
    
    Inheritance(MpnUnsubscribeFilterRequest, MpnRequest);
    export default MpnUnsubscribeFilterRequest;

