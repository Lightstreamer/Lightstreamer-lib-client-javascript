import Inheritance from "../../src-tool/Inheritance";
import Descriptor from "./Descriptor";

  var NameDescriptor = function(val) {
    this._callSuperConstructor(NameDescriptor); 
    this.name = val;
  };
  
  NameDescriptor.prototype = {
      getComposedString: function() {
        return this.name;
      },
      
      getPos: function(name) {
        if (this.subDescriptor) {
          var fromSub = this.subDescriptor.getPos(name);
          return fromSub!==null ? fromSub+this.len : null;
        }
        return null;
      },
      
      getName: function(pos) {
        if (this.subDescriptor) {
          return this.subDescriptor.getName(pos-this.len);
        }
        return null;
      },
      
      getOriginal: function() {
        return this.name;
      },
      
      isList: function() {
          return false;
      }
  };
  
  Inheritance(NameDescriptor, Descriptor);
  export default NameDescriptor;
  
