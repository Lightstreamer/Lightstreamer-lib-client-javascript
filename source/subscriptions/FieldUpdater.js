import jsonpatch from "jsonpatch/jsonpatch.min";
import Constants from "../Constants";
import LoggerManager from "../../src-log/LoggerManager";

var stInit = 0, stString = 1, stFirstPatch = 2, stPatchUpdate = 3, stUnchanged = 4, stNull = 5,  stError = 6;
var stNames = {
  0: "Init", 1: "String", 2: "FirstPatch", 3: "Update", 4: "Unchanged", 5: "Null", 6: "Error"
}

var internalLogger = LoggerManager.getLoggerProxy(Constants.INTERNAL);

var FieldUpdater = function(subId, itemPos, fieldPos) {
  this.id = "JP<" + subId + "," + itemPos + "," + fieldPos + ">";
  this.state = stInit;
  this.value = null;
  this.patch = null;
  this.isChanged = false;
};

FieldUpdater.prototype = {
  changeState: function(state) {
    this.state = state;
    if (internalLogger.isDebugLogEnabled()) {
      internalLogger.logDebug(this.id + ' goto: ' + stNames[this.state]);
    }
  },
  logEvent: function(e) {
    if (internalLogger.isDebugLogEnabled()) {
      internalLogger.logDebug(this.id + ' evt: ' + e + ' in ' + stNames[this.state]);
    }
  },
  ignoreEvent: function() {
    if (internalLogger.isDebugLogEnabled()) {
      internalLogger.logDebug(this.id + ' event has been ignored in ' + stNames[this.state]);
    }
  },
  wrongEvent: function(event) {
    this.gotoError("Unexpected event '" + event + "' in " + stNames[this.state]);
  },
  evtInternalError: function(error) {
    this.isChanged = true;
    this.logEvent("internal error(" + error + ")");
    switch (this.state) {
    default:
      this.gotoError(error);
      break;
    }
  },
  evtNull: function() {
    this.isChanged = true;
    this.logEvent("null");
    switch (this.state) {
    default:
      this.gotoNull();
      break;
    }
  },
  evtString: function(s) {
    this.isChanged = true;
    this.logEvent("string(" + s + ")");
    switch (this.state) {
    default:
      this.gotoString(s);
      break;
    }
  },
  evtPatch: function(patch) {
    this.isChanged = true;
    this.logEvent("patch(" + patch + ")");
    switch (this.state) {
    case stString:
      this.gotoFirstPatch(patch);
      break;
    case stInit:
    case stNull:
    case stError:
      this.wrongEvent("patch");
      break;
    default:
      this.gotoPatchUpdate(patch);
      break;
    }
  },
  evtUnchanged: function() {
    this.isChanged = false;
    this.logEvent("unchanged");
    switch (this.state) {
    case stInit:
    case stError:
      this.wrongEvent("unchanged");
      break;
    case stFirstPatch:
    case stPatchUpdate:
      this.gotoUnchanged();
      break;
    default:
      this.ignoreEvent();
      break;
    }
  },
  gotoString: function(s) {
    this.changeState(stString);
    this.value = s;
  },
  gotoNull: function() {
    this.changeState(stNull);
    this.value = null;
  },
  gotoFirstPatch: function(/*string*/patch) {
    this.changeState(stFirstPatch);
    var oldValue = this.value;
    try {
      this.value = JSON.parse(this.value);
      this.patch = JSON.parse(patch);
      this.value = jsonpatch.apply_patch(this.value, this.patch);
    } catch(e) {
      var msg = e + " <value=" + oldValue + ",patch=" + patch + ">";
      this.evtInternalError(msg);
    }
  },
  gotoPatchUpdate: function(/*string*/patch) {
    this.changeState(stPatchUpdate);
    var oldValue = this.value;
    try {
      this.patch = JSON.parse(patch);
      this.value = jsonpatch.apply_patch(this.value, this.patch);
    } catch(e) {
      var msg = e + " <value=" + JSON.stringify(oldValue) + ",patch=" + patch + ">";
      this.evtInternalError(msg);
    }
  },
  gotoUnchanged: function() {
    this.changeState(stUnchanged);
  },
  gotoError: function(error) {
    this.changeState(stError);
    if (internalLogger.isErrorLogEnabled()) {
      internalLogger.logError(this.id + ' ' + error);
    }
  },
  getImmutableView: function() {
    var state = this.state;
    var value = this.value;
    var patch = this.patch;
    var changed = this.isChanged;
    return {
      getValue: function() {
        switch (state) {
        case stError:
          throw new Error("The value is not available");
        case stFirstPatch:
        case stPatchUpdate:
        case stUnchanged:
          return JSON.stringify(value);
        default:
          return value;
        }
      },
      getValueAsJSONPatchIfAvailable: function() {
        switch (state) {
        case stError:
          throw new Error("The value is not available");
        case stFirstPatch:
        case stPatchUpdate:
          return patch;
        case stUnchanged:
          return [];
        default:
          return null;
        }
      },
      isValueChanged: function() {
        switch (state) {
        case stError:
          throw new Error("The value is not available");
        default:
          return changed;
        }
      }
    }
  }
};

export default FieldUpdater;