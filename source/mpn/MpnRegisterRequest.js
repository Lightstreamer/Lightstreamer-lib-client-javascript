import Inheritance from "../../src-tool/Inheritance";
import MpnRequest from "./MpnRequest";
import CtrlRequest from '../utils/CtrlRequest';

	/**
	 * A MPN registration request.
	 */
	var MpnRegisterRequest = function(device) {
	    this._callSuperConstructor(MpnRegisterRequest);
	    this.type = CtrlRequest.MPN_REG;
	    this.addParam('LS_op', 'register');
	    this.addParam('PN_type', device.platform);
	    this.addParam('PN_appId', device.appId);
		if (device.prevDeviceToken == null || device.prevDeviceToken == device.deviceToken) {
		    this.addParam('PN_deviceToken', device.deviceToken);
		} else {
		    this.addParam('PN_deviceToken', device.prevDeviceToken);
		    this.addParam('PN_newDeviceToken', device.deviceToken);
		}
	};
	
	MpnRegisterRequest.prototype.toString = function() {
	    return CtrlRequest.toString(this.query);
	};
	
	Inheritance(MpnRegisterRequest, MpnRequest);
	export default MpnRegisterRequest;

