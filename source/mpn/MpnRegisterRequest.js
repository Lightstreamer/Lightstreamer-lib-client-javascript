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

	/**
	 * A MPN registration request.
	 */
	var MpnRegisterRequest = function(device) {
	    this._callSuperConstructor(MpnRegisterRequest);
	    this.addParam('LS_op', 'register');
	    this.addParam('PN_type', device.platform);
	    this.addParam('PN_appId', device.appId);
		if (device.prevDeviceToken == null) {
		    this.addParam('PN_deviceToken', device.deviceToken);
		} else {
		    this.addParam('PN_deviceToken', device.prevDeviceToken);
		    this.addParam('PN_newDeviceToken', device.deviceToken);
		}
	};
	
	Inheritance(MpnRegisterRequest, MpnRequest);
	export default MpnRegisterRequest;

