
    
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

