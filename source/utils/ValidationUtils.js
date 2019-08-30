import Helpers from "../../src-tool/Helpers";
import IllegalArgumentException from "../../src-tool/IllegalArgumentException";
    
    var NO_VALID_ARRAY = "Please specifiy a valid array";
    var NO_EMPTY = " name cannot be empty";
    var NO_SPACE = " name cannot contain spaces";
    var NO_NUMBER = " name cannot be a number";
    
    function checkItemNames(_array, head) {
        if (!Helpers.isArray(_array)) {
            throw new IllegalArgumentException(NO_VALID_ARRAY);
        }
        for (var i = 0; i < _array.length; i++) {
            if (!_array[i]) {
                throw new IllegalArgumentException(head+NO_EMPTY);

            } else if (_array[i].indexOf(" ") > -1) {
                // An item name cannot contain spaces
                throw new IllegalArgumentException(head+NO_SPACE);

            } else if (!isNaN(_array[i])) {
                // An item name cannot be a number
                throw new IllegalArgumentException(head+NO_NUMBER);
            }
        }
    }

    function checkFieldNames(_array, head) {
        if (!Helpers.isArray(_array)) {
            throw new IllegalArgumentException(NO_VALID_ARRAY);
        }
        for (var i = 0; i < _array.length; i++) {
            if (!_array[i]) {
                throw new IllegalArgumentException(head+NO_EMPTY);

            } else if (_array[i].indexOf(" ") > -1) {
                // A field name cannot contain spaces
                throw new IllegalArgumentException(head+NO_SPACE);
            }
        }
    }
      
    export default {
        checkItemNames: checkItemNames,
        checkFieldNames: checkFieldNames,
        NO_SCHEMA_NOR_LIST: "The field list/field schema of this Subscription was not initiated",
        NO_GROUP_NOR_LIST: "The item list/item group of this Subscription was not initiated",
        USE_GET_ITEM_GROUP: "This Subscription was initiated using an item group, use getItemGroup instead of using getItems",
        USE_GET_ITEMS: "This Subscription was initiated using an item list, use getItems instead of using getItemGroup",
        USE_GET_FIELD_SCHEMA: "This Subscription was initiated using a field schema, use getFieldSchema instead of using getFields",
        USE_GET_FIELDS: "This Subscription was initiated using a field list, use getFields instead of using getFieldSchema",
        MAX_BUF_EXC: "The given value is not valid for this setting; use null, 'unlimited' or a positive number instead",
        MAX_FREQ_EXC: "The given value is not valid for this setting; use null, 'unlimited', 'unfiltered' or a positive number instead",
        YES_FIELDS_NO_ITEMS: "Please specify a valid item or item list",
        NO_VALID_FIELDS: "Please specify a valid field list"
    };
