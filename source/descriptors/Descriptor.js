
  
  var Descriptor = function() {
    this.subDescriptor = null;
    this.len = 0;
  };
  
  Descriptor.prototype = {
      setSubDescriptor: function(subDescriptor) {
        this.subDescriptor = subDescriptor;
      },
      
      getSubDescriptor: function() {
        return this.subDescriptor;
      },
      
      getSize: function() {
        return this.len;
      },
      
      getFullSize: function() {
        if (this.subDescriptor) {
          return this.getSize() + this.subDescriptor.getSize();
        }
        return this.getSize();
      },
      
      setSize: function(len) {
        this.len = len;
      }
      
      /*abstract*/ /*getComposedString*/
      /*abstract*/ /*getPos*/
      /*abstract*/ /*getName*/
      /*abstract*/ /*isList*/
  };
  
  export default Descriptor;
  
  
