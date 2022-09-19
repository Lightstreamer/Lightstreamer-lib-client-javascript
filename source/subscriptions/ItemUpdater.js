import FieldUpdater from "./FieldUpdater";
import Matrix from "../../src-tool/Matrix";

var ItemUpdater = function() {
  this.itemFieldMatrix = new Matrix();
};

ItemUpdater.prototype = {
  updateItem: function(subId, update) {
    var that = this;
    var itemPos = update.getItemPos();
    update.forEachField(function(name, fieldPos, val) {
      var value = update.getValue(fieldPos);
      var isChanged = update.isValueChanged(fieldPos);
      that.updateField(subId, itemPos, fieldPos, value, isChanged);
    });
  },
  updateField: function(subId, itemPos, fieldPos, fieldValue, isChanged) {
    var fieldUpdater = this.getOrCreateFieldUpdater(subId, itemPos, fieldPos);
    if (!isChanged) {
      fieldUpdater.evtUnchanged();
    } else if (fieldValue == null) {
      fieldUpdater.evtNull();
    } else if (fieldValue.isJSONPatch) {
      // field 'isJSONPatch' is set in Utils.parseUpdates
      fieldUpdater.evtPatch(fieldValue);
    } else {
      fieldUpdater.evtString(fieldValue);
    }
  },
  getOrCreateFieldUpdater: function(subId, itemPos, fieldPos)/*FieldUpdater*/ {
    var fieldUpdater = this.itemFieldMatrix.get(itemPos, fieldPos);
    if (fieldUpdater == null) {
      fieldUpdater = new FieldUpdater(subId, itemPos, fieldPos);
      this.itemFieldMatrix.insert(fieldUpdater, itemPos, fieldPos);
    }
    return fieldUpdater;
  },
  getFieldUpdater: function(itemPos, fieldPos) {
    return this.itemFieldMatrix.get(itemPos, fieldPos);
  }
};

export default ItemUpdater;