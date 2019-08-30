import Constants from "../Constants";

  export default function(args,reuse) {
   
    var copiedArgs = reuse ? args : [];
    copiedArgs.changedFields = [];
    if(!reuse) {
      copiedArgs[0] = parseInt(args[0]);
      copiedArgs[1] = parseInt(args[1]);
    }
    
    for (var i = 2, l=args.length; i < l; i++) {
      if (!args[i]) {
        if (!reuse) {
          if (args[i] === "") {
            copiedArgs[i] = "";
          } else {
            copiedArgs[i] = null;
          }
        }
        
        copiedArgs.changedFields.push(i-1);
      } else if (args[i].length == -1) {
        copiedArgs[i] = Constants.UNCHANGED;
      } else {
        if (!reuse) {
          copiedArgs[i] = args[i].toString();
        }
        copiedArgs.changedFields.push(i-1);
      }
    }
    
    return copiedArgs;
    
    
  };
  
  


