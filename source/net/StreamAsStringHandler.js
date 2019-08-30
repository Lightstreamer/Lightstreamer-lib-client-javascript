
  
  var StreamAsStringHandler = function(){
    this.progress=0;
  };
  
  StreamAsStringHandler.prototype = {
    
    /*private*/ extractNewData: function(_stream,isComplete) {
      
      var endIndex = -1;
      if (isComplete) {
        endIndex = _stream.length;
      } else {
        endIndex = _stream.lastIndexOf("\r\n");
        if (endIndex < 0) {
          return null;
        } else {
          endIndex += 2;
        }
      }
      
      var newData = _stream.substring(this.progress, endIndex);
      
      this.progress = endIndex;
      
      return newData;
      
    }, 
    
    /*public*/ streamProgress: function(_stream) {
      return this.extractNewData(_stream,false);
    },
    
    /*public*/ streamComplete: function(_stream) {
      return this.extractNewData(_stream,true);
    }
    
  };
  
  export default StreamAsStringHandler;
  
