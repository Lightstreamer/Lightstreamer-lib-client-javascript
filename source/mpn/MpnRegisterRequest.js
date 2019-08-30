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

