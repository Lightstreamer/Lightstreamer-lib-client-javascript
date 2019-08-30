import Constants from "../Constants";

  var VAL_SEP = "|";
  
  function EngineStatus(id,shareName,status) {
    this.id= id;
    this.shareName = shareName;
    this.status = status;
  }
  EngineStatus.prototype = {
    getStatus: function() {
      return this.status;
    }
  };
  
  export default { 
    
    /*abstract*/ 
    /*read: function(key) {
      
    },
    write: function(key,val) {
      
    },
    clean: function(key) {
      
    },*/
    
    /*public*/ readSharedStatus: function(shareName,id) {
      return this.readComposedValue(id+"_"+shareName);
    },
    
    //timestamp,frameName,host
    /*public*/ writeSharedStatus: function(shareName,id,values) {
      values = values.join(VAL_SEP);
      var key = Constants.STORAGE_PREFIX+id+"_"+shareName;
      this.write(key,values);
    },
    
    /*public*/ cleanSharedStatus: function(shareName,id) {
      var key = Constants.STORAGE_PREFIX+id+"_"+shareName;
      this.clean(key);
    },
    
    /*public*/ readIds: function(name) {
      return this.readComposedValue(name);
    },
    
    /*public*/ readIdsObjects: function(name) {
      var ids =  this.readComposedValue(name);
      if (!ids) {
        return null;
      }
      var objects = [];
      
      for (var i=0; i<ids.length; i++) {
        var split = ids[i].split("_"); //id_sharename
        if (split.length != 2) {
          continue; //unexpected
        }
        var status = this.readSharedStatus(split[1],split[0]);
        if (status != null) {
          objects.push(new EngineStatus(split[0],split[1],status));
        }
      }
      
      return objects;
    },
    
    /**
     * adds an id to a list of ids in the form |val1|val2|valX| (or val1|val2|valX) if such value is not in the list
     * @param {Object} name
     * @param {Object} id
     * @return {boolean} false if the id is already in the list, false otherwise
     */
    /*public*/ addId: function(name,id,shareName) {
      name = Constants.STORAGE_PREFIX+name;
      id = id+(shareName?"_"+shareName:"");
      
      var val = this.read(name);
      if (!val) {
        val = VAL_SEP;
      } else if (val.indexOf(VAL_SEP+id+VAL_SEP) > -1) {
        return false;
      }
      
      val += id + VAL_SEP;
      this.write(name,val);
      return true;
    },
    
    /**
     * removes an id from a list of ids in the form |val1|val2|valX| (or val1|val2|valX) if such value is in the list
     * @param {Object} name
     * @param {Object} id
     */
    /*public*/ removeId: function(name,id,shareName) {
      name = Constants.STORAGE_PREFIX+name;
      id = id+(shareName?"_"+shareName:"");
      var val = this.read(name);
      if (!val) {
        return;
      }
      var find = VAL_SEP+id+VAL_SEP;
      if (val.indexOf(find) > -1) {
        val = val.replace(find,VAL_SEP);
        if (val == VAL_SEP) {
          this.clean(name);
        } else {
          this.write(name, val);
        }
      }
    },
    
    /*public*/ getAllKeys: function() {
      //contains _ --> engine status
      //contains :// --> server conn
      //neither --> list of engines
      var keys = this.keys();
      var res = [];
      for (var i=0; i<keys.length; i++) {
        if (keys[i].indexOf(Constants.STORAGE_PREFIX) == 0) {
          keys[i] = keys[i].substring(Constants.STORAGE_PREFIX.length);
          res.push(keys[i]);
        }
      }
      return res;
    },
    
    
    /**
     * reads values in the form |val1|val2|valX| (or val1|val2|valX) and return an array with the read values
     */
    /*private*/ readComposedValue: function(key) {
      key = Constants.STORAGE_PREFIX+key;
      var composedVal = this.read(key);
      if(!composedVal) {
        return null;
      }
      var splitted = composedVal.split(VAL_SEP);
      if (splitted[0] == "") {
        splitted.shift();
      }
      
      if (splitted[splitted.length-1] == "") {
        splitted.pop();
      }
      return splitted.length > 0 ? splitted : null;
    }    
  };
  
  
  
