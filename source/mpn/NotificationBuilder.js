
    
    var NotificationBuilder = function(descriptor) {
        this._descriptor = descriptor || {};
    };
    
    NotificationBuilder.prototype = {
            
            putAll: function(mapName, source) {
                var target = this.getMap(mapName);
                for (var p in source) {
                    target[p] = source[p];
                }
            },
            
            setValue: function(mapName, propName, propValue) {
                if (propValue != null) {
                    this.getMap(mapName)[propName] = propValue;
                } else {
                    delete this.getMap(mapName)[propName];
                }
                return this;
            },
            
            getValue: function(mapName, propName) {
                return this.getMap(mapName)[propName];
            },
            
            /*Map<String, Object>*/ getMap: function(path) {
                var descriptor = this._descriptor;
                var names = path.split(".");
                for (var i = 0, len = names.length; i < len; i++) {
                    var name = names[i];
                    var objectMap = descriptor[name];
                    if (objectMap == null) {
                        objectMap = {};
                        descriptor[name] = objectMap;
                    }
                    descriptor = objectMap;
                }
                return descriptor;
            },
      
            /*Map<String, Object>*/ build: function() {
                return this._descriptor;
            }
    };
    
    NotificationBuilder.prototype['putAll'] = NotificationBuilder.prototype.putAll;
    NotificationBuilder.prototype['setValue'] = NotificationBuilder.prototype.setValue;
    NotificationBuilder.prototype['getValue'] = NotificationBuilder.prototype.getValue;
    NotificationBuilder.prototype['getMap'] = NotificationBuilder.prototype.getMap;
    NotificationBuilder.prototype['build'] = NotificationBuilder.prototype.build;
    
    export default NotificationBuilder;

