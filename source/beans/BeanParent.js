
  
  //currently LightstreamerEngine and LightstreamerClient implement this interface
  
  var BeanParent = function() {
  };
  
  BeanParent.prototype = {
    //OPTIONAL
    broadcastSetting: function(objClass,prop,val) {
      return;
    },
    
    //OPTIONAL
    notifyOptionChange: function(property,instance) {
      return;
    }
    
  };
  
  export default BeanParent;
  

