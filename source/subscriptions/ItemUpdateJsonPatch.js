import LoggerManager from "../../src-log/LoggerManager";
import IllegalArgumentException from "../../src-tool/IllegalArgumentException";
import Constants from "../Constants";

var actionsLogger = LoggerManager.getLoggerProxy(Constants.ACTIONS);

var emptyField = {
  getValue: function() {
    return null;
  },
  getValueAsJSONPatchIfAvailable: function() {
    return null;
  },
  isValueChanged: function() {
    return false;
  }
};

var ItemUpdateJsonPatch = function(rawUpdate, itemUpdater) {
  this.rawUpdate = rawUpdate;
  this.itemName = rawUpdate.getItemName();
  this.itemPos = rawUpdate.getItemPos();
  this.fieldDescriptor = rawUpdate.fieldDescriptor;
  this.snapshot = rawUpdate.isSnapshot();
  this.nFields = rawUpdate.getNumFields();
  this.fieldMap = {};
  for (var fieldPos = 1; fieldPos <= this.nFields; fieldPos++) {
    var fieldUpdater = itemUpdater.getFieldUpdater(this.itemPos, fieldPos);
    if (fieldUpdater != null) {
      this.fieldMap[fieldPos] = fieldUpdater.getImmutableView();
    }
  }
};

ItemUpdateJsonPatch.prototype = {
  getItemName: function() {
    return this.itemName;
  },

  getItemPos: function() {
    return this.itemPos;
  },

  getValue: function(fieldNameOrPos) {
    var fieldPos = this.toPos(fieldNameOrPos);
    return this.toField(fieldPos).getValue();
  },

  getValueAsJSONPatchIfAvailable: function(fieldNameOrPos) {
    var fieldPos = this.toPos(fieldNameOrPos);
    return this.toField(fieldPos).getValueAsJSONPatchIfAvailable();
  },

  isValueChanged: function(fieldNameOrPos) {
    var fieldPos = this.toPos(fieldNameOrPos);
    return this.toField(fieldPos).isValueChanged();
  },

  isSnapshot: function() {
    return this.snapshot;
  },

  forEachChangedField: function(iterator) {
    for (var fieldPos = 1; fieldPos <= this.nFields; fieldPos++) {
      var field = this.toField(fieldPos);
      if (field.isValueChanged()) {
        var name = this.fieldDescriptor.getName(fieldPos);
        var newV = field.getValue();
        try {
          iterator(name,fieldPos,newV);
        } catch(_e) {
          actionsLogger.logErrorExc(_e,"An exception was thrown while executing the Function passed to the forEachChangedField method");
        }
      }
    }
  },

  forEachField: function(iterator) {
    for (var fieldPos = 1; fieldPos <= this.nFields; fieldPos++) {
      var name = this.fieldDescriptor.getName(fieldPos);
      var newV = this.toField(fieldPos).getValue();
      try {
        iterator(name,fieldPos,newV);
      } catch(_e) {
        actionsLogger.logErrorExc(_e,"An exception was thrown while executing the Function passed to the forEachField method");
      }
    }
  },

  extract: function() {
    // used by SecondLevelSubscriptionListener
    return this.rawUpdate.extract();
  },

  toField: function(fieldPos) {
    var field = this.fieldMap[fieldPos];
    return field != null ? field : emptyField;
  },

  toPos: function(fieldNameOrPos) {
    var arrPos = (isNaN(fieldNameOrPos) ? this.fieldDescriptor.getPos(fieldNameOrPos) : fieldNameOrPos);
    if (arrPos == null) {
      throw new IllegalArgumentException( "the specified field does not exist");
      
    } else if (arrPos <= 0 || arrPos > this.fieldDescriptor.getFullSize()) {
      throw new IllegalArgumentException("the specified field position is out of bounds"); 
    }
    return arrPos;
  }
};

ItemUpdateJsonPatch.prototype["getItemName"] = ItemUpdateJsonPatch.prototype.getItemName;
ItemUpdateJsonPatch.prototype["getItemPos"] = ItemUpdateJsonPatch.prototype.getItemPos;
ItemUpdateJsonPatch.prototype["getValue"] = ItemUpdateJsonPatch.prototype.getValue;
ItemUpdateJsonPatch.prototype["getValueAsJSONPatchIfAvailable"] = ItemUpdateJsonPatch.prototype.getValueAsJSONPatchIfAvailable;
ItemUpdateJsonPatch.prototype["isValueChanged"] = ItemUpdateJsonPatch.prototype.isValueChanged;
ItemUpdateJsonPatch.prototype["isSnapshot"] = ItemUpdateJsonPatch.prototype.isSnapshot;
ItemUpdateJsonPatch.prototype["forEachChangedField"] = ItemUpdateJsonPatch.prototype.forEachChangedField;
ItemUpdateJsonPatch.prototype["forEachField"] = ItemUpdateJsonPatch.prototype.forEachField;

export default ItemUpdateJsonPatch;