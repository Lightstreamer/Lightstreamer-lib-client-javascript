import Inheritance from "../../src-tool/Inheritance";
import Tutor from "../control/Tutor";
	
	/**
	 * Superclass of all the MPN tutors.
	 * <p>
	 * <b>NB</b> An MPN tutor is designed to stop retransmitting a request when the corresponding REQOK/REQERR is received.
	 * Thus it is important that the {@link MpnRequestListener} of the request calls the method {@link #onResponse()}
	 * at the end of the methods {@link MpnRequestListener#onOK()} and {@link MpnRequestListener#onError()}.
	 */
	var MpnTutor = function(timeoutMs, tutorContext, mpnManager) {
		this._callSuperConstructor(MpnTutor, [mpnManager.lsClient.connectionOptions, timeoutMs]);
		this.responseReceived = false;
		this.tutorContext = tutorContext;
		this.mpnManager = mpnManager;
	};
	
	MpnTutor.prototype = {
			
			/**
			 * Should be called when a REQOK/REQERR is received to stop retransmissions.
			 */
			onResponse: function() {
				this.responseReceived = true;
			},
			
			verifySuccess: function() {
		        // a request must be retransmitted only if 1) the server has not responded (with either REQOK or REQERR)
		        // and 2) the tutor is not dismissed 
		        return this.responseReceived || this.tutorContext.dismissed;
		    },
		    
		    notifyAbort: function() {
		        // process the abort as a (sort of) response
		        this.responseReceived = true;
		    }
	};
	
	Inheritance(MpnTutor,Tutor);
	export default MpnTutor;

