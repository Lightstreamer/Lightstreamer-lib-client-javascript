import MpnUtils from "./MpnUtils";

    /**
     * The list of active MPN subscriptions.
     * <p>
     * Each subscription in the list is subscribed: it has received a MPNOK (user subscription) or
     * it has been published by the MPN internal adapter (server subscription).   
     */
    var SubscriptionList = function() {
        /**
         * Maps the mpnSubId (i.e. the values of the second argument of the message MPNOK)
         * with the corresponding subscription objects.
         * <p>
         * The state of the contained objects is <b>subscribed</b>.
         */
        /*Map<String, List<MpnSubscription>>*/ this.subscriptions = new MpnUtils.MyMap();
    };
    
    SubscriptionList.prototype = {
            
            /**
             * Returns the objects in the subscription list satisfying the filter 
             * (that can be null, "ALL", "SUBSCRIBED" or "TRIGGERED").
             * See {@link LightstreamerClient#getMpnSubscriptions(String)}.
             * <p>
             * NB For each subId, only the last added subscription is returned.
             */
            /*List<MpnSubscription>*/ getSubscriptions: function(filter) {
                var ls = new MpnUtils.MyList();
                var all = (filter == null || filter == "ALL");
                /*List<List<MpnSubscription>>*/ var values = this.subscriptions.values();
                for (var i = 0, len = values.size(); i < len; i++) {
                    /*List<MpnSubscription>*/ var subs = values.get(i);
                    /*MpnSubscription*/ var sub = subs.getLast();
                    if (all || sub.getStatus() == filter) {
                        ls.add(sub);
                    }
                }
                return ls;
            },
            
            /**
             * Returns the last added subscription having the specified subId.
             * If there are no subscriptions with the specified subId, returns null.
             */
            /*MpnSubscription*/ findSubscription: function(subId) {
                var /*List<MpnSubscription>*/ ls = this.subscriptions.get(subId);
                return ls == null ? null : ls.getLast();
            },
            
            /**
             * Returns true if there is a subscribed items with the given subId.
             */
            isSubscribed: function(subId) {
                return this.subscriptions.containsKey(subId);
            },
            
            /**
             * Adds the subscription.
             */
            add: function(subId, /*MpnSubscription*/ sub) {
                var /*List<MpnSubscription>*/ ls = this.subscriptions.get(subId);
                if (ls == null) {
                    ls = new MpnUtils.MyList();
                    this.subscriptions.put(subId, ls);
                }
                ls.add(sub);
            },
            
            /**
             * Removes all the subscription having the specified subId.
             */
            remove: function(subId, /*Visitor*/ visitor) {
                var /*List<MpnSubscription>*/ ls = this.subscriptions.remove(subId);
                this.forEach(ls, visitor);
            },
            
            /**
             * Clears the list.
             */
            clear: function() {
                this.subscriptions.clear();
            },
            
            /**
             * Executes the visitor for each subscription having the given subId.
             */
            forEachWithSubId: function(subId, /*Visitor*/ visitor) {
                var /*List<MpnSubscription>*/ ls = this.subscriptions.get(subId);
                this.forEach(ls, visitor);
            },
            
            /**
             * Executes the visitor for each subscription in the given list.
             */
            forEach: function(/*List<MpnSubscription>*/ ls, /*Visitor*/ visitor) {
                if (ls != null && ! ls.isEmpty()) {
                    if (visitor.visit != null) {                        
                        for (var i = 0, len = ls.size(); i < len; i++) {
                            var sub = ls.get(i);
                            visitor.visit(sub);
                        }
                    }
                    if (visitor.afterVisit != null) {                        
                        visitor.afterVisit();
                    }
                    
                } else {
                    if (visitor.onEmpty != null) {                        
                        visitor.onEmpty();
                    }
                }
            }
            
            /*
            //Subscription list visitor. 
            abstract class Visitor {
                //Called when the visited list is empty.
                void onEmpty() {}
                
                //Called for each subscription in the visited list.
                abstract void visit(MpnSubscription sub);
                
                //Called after all the subscriptions in the list has been visited.
                //<br>NB The method is NOT called if the visited list is empty. 
                void afterVisit() {}
            }
            */
    };
    
    export default SubscriptionList;

