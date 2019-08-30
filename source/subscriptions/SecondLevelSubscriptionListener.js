import Constants from "../Constants";
import Assertions from "../utils/Assertions";
  
  var SecondLevelSubscriptionListener = function(parentTable,itemRef,relKey) {
    this.parentTable = parentTable;
    this.itemReference = itemRef;
    this.relKey = relKey;
  };
  
  SecondLevelSubscriptionListener.prototype = {
  
    /*onEndOfSnapshot: function(itemName, itemPos) {
      return;
    },
    
    onClearSnapshot: function(itemName, itemPos) {
      // not expected, as MERGE mode is implied here
      return;
    },
    
    onSubscription: function() {
      return;
    },
    
    onUnsubscription: function() {
      return;
    },*/  
      
    /*public*/ onItemLostUpdates: function(itemName, itemPos, lostUpdates) {
      if (!this.shouldDispatch()) {
        return;
      }
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(itemPos,1, "Unexpected item position");
    //>>excludeEnd("debugExclude");
      this.parentTable.sonLostUpdates(this.relKey,lostUpdates);
    },        
    
    /*public*/ onSubscriptionError: function(flag, msg) {
      if (!this.shouldDispatch()) {
        return;
      }
      
      this.parentTable.sonServerDeny(flag,msg,this.relKey);
    },
    
    /*public*/ onItemUpdate: function(updateInfo) {
      if (!this.shouldDispatch()) {
        return;
      }
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(updateInfo.getItemPos(),1, "Unexpected item position");
    //>>excludeEnd("debugExclude");
      var args = updateInfo.extract();
      this.parentTable.setSecondLevelSchemaSize(args.length - 2);
      
      //args contiene l'update per la sola sotto-tabella.
      //qui viene convertito in modo che rappresenti un update per 
      //la tabella padre
      args = this.convertMultiSonUpdate(args);

      //una volta convertito l'update la table di riferimento diventa il padre
      return this.parentTable.update(args,false,true);
      
    },
    
    /*private*/ shouldDispatch: function() {
      return this.parentTable.hasSubTable(this.itemReference,this.relKey);
    },
    
    /*private*/ convertMultiSonUpdate: function(args) {
      var fatherTable = this.parentTable;
      var _item = this.itemReference;
      
      var newArgs = [];
      newArgs[0] = fatherTable.getTableNumber();
      newArgs[1] = _item;
      newArgs.changedFields = [];
      
      var newLen = fatherTable.getFullSchemaSize()+2; //the combined length of the schemas + 2 (table number and item number)
      
      
      var y = 2; //y represents the 1-based position shifted by 1 (so field 1 is in position 2) of the underlying schema 
      //i represents the 1-based position shifted by 1 (so field 1 is in position 2) of the combined schema
      for (var i = 2; i < newLen; i++) {
        if (i == (fatherTable.getKeyPos() + 1)) {
          //l'item interessato risulta sempre come groupID
          
          newArgs[i] = this.relKey;
        } else if (i == (fatherTable.getCommandPos() + 1)) {
          // the command can only be an update
          newArgs[i] =  "UPDATE";
        } else if (i <= (fatherTable.getMainSchemaSize() + 1)) {
          // for fields that depend on the table in COMMAND, sign always unchanged (this update
          // is already prepared on item | key)
          newArgs[i] = Constants.UNCHANGED;
        } else {
          //fields from subtable
          newArgs[i] = args[y];

          //args has alrady been filled with real values!
          if (!args.unchangedMap[y]) {
          //if(args[y] != Constants.UNCHANGED) {
            newArgs.changedFields.push(i-1);
          } else {
            newArgs[i] = Constants.UNCHANGED;
          }
          
          y++;
          
        } 
      }
      return newArgs;
    }
    
  };
  
  //export these methods as they're called by the dispatcher
  SecondLevelSubscriptionListener.prototype["onSubscriptionError"] = SecondLevelSubscriptionListener.prototype.onSubscriptionError;
  SecondLevelSubscriptionListener.prototype["onItemUpdate"] = SecondLevelSubscriptionListener.prototype.onItemUpdate;
  SecondLevelSubscriptionListener.prototype["onItemLostUpdates"] = SecondLevelSubscriptionListener.prototype.onItemLostUpdates;
  
  export default SecondLevelSubscriptionListener;



