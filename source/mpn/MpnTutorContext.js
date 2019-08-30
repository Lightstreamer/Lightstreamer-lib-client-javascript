

	/**
     * An instance of the class is shared by all the tutors created within a session.
     * When the MpnManager closes a session, by setting the {@code dismissed} flag to true
     * it signals that all the tutors in the context must stop to retransmit.
     */
	var MpnTutorContext = function() {
		this.dismissed = false;
	};
	
	export default MpnTutorContext;

