
    
    function MyList() {
        this.ls = [];
    }
    
    MyList.prototype = {
        
            add: function(obj) {
                this.ls.push(obj);
            },
            
            addAll: function(list) {
                for (var i = 0, len = list.size(); i < len; i++) {
                    this.add(list.get(i));
                }
            },
            
            remove: function(obj) {
                for (var i = 0, len = this.ls.length; i < len; i++) {
                    if (this.ls[i] == obj) {
                        this.ls.splice(i, 1);
                        return true;
                    }
                }
                return false;
            },
            
            contains: function(obj) {
                for (var i = 0, len = this.ls.length; i < len; i++) {
                    if (this.ls[i] == obj) {
                        return true;
                    }
                }
                return false;
            },
            
            clear: function() {
                this.ls.splice(0);
            },
            
            get: function(i) {
                return this.ls[i];
            },
            
            getLast: function() {
                return (this.ls.length == 0 ? null : this.ls[this.ls.length - 1]);
            },
            
            size: function() {
                return this.ls.length;
            },
            
            isEmpty: function() {
                return this.ls.length == 0;
            },
            
            toArray: function() {
                return this.ls;
            }
    };
    
    /**
     * NB
     * The key stored in the map is the value returned by toString() method.
     */
    function MyMap() {
        this.map = {};
    }
    
    MyMap.prototype = {
            
            get: function(key) {
                return this.map[key];
            },
            
            put: function(key, value) {
                this.map[key] = value;
            },
            
            remove: function(key) {
                var value = this.map[key];
                delete this.map[key];
                return value;
            },
            
            clear: function() {
                for (var prop in this.map) {
                    delete this.map[prop];
                }
            },
            
            containsKey: function(key) {
                return this.get(key) != null;
            },
            
            values: function() {
                var ls = new MyList();
                for (var key in this.map) {
                    ls.add(this.map[key]);
                }
                return ls;
            }
    };
    
    /**
     * NB
     * The object stored in the set is the value returned by toString() method.
     */
    function MySet() {
        this.set = {};
        this.size = 0;
    }
    
    MySet.prototype = {
      
            add: function(obj) {
                if (! this.set[obj]) {
                    this.set[obj] = true;
                    this.size++;
                }
            },
            
            remove: function(obj) {
                var value = !! this.set[obj];
                if (value) {
                    delete this.set[obj];
                    this.size--;
                }
                return value;
            },
            
            contains: function(obj) {
                return !! this.set[obj];
            },
            
            clear: function() {
                for (var prop in this.set) {
                    delete this.set[prop];
                }
                this.size = 0;
            },
            
            isEmpty: function() {
                return this.size == 0;
            }
    };

    export default {
        MyList: MyList,
        MyMap: MyMap,
        MySet: MySet
    };

