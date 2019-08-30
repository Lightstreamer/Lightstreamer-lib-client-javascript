import SecondLevelSubscriptionListener from "./subscriptions/SecondLevelSubscriptionListener";
import ItemUpdate from "./subscriptions/ItemUpdate";
import ListDescriptor from "./descriptors/ListDescriptor";
import NameDescriptor from "./descriptors/NameDescriptor";
import Inheritance from "../src-tool/Inheritance";
import Setter from "../src-tool/Setter";
import Matrix from "../src-tool/Matrix";
import Executor from "../src-tool/Executor";
import Constants from "./Constants";
import EventDispatcher from "../src-tool/EventDispatcher";
import IllegalArgumentException from "../src-tool/IllegalArgumentException";
import IllegalStateException from "../src-tool/IllegalStateException";
import LoggerManager from "../src-log/LoggerManager";
import Utils from "./Utils";
import Assertions from "./utils/Assertions";
import Helpers from "../src-tool/Helpers";
import RealMaxFrequencyManager from "./subscriptions/RealMaxFrequencyManager";
import ValidationUtils from "./utils/ValidationUtils";
import ASSERT from "../src-test/ASSERT";

export default /*@__PURE__*/(function() {
  var TABLE_OFF = 1;
  var TABLE_WAITING = 2;
  var TABLE_SUBSCRIBING = 3;
  var TABLE_PUSHING = 4;
  var TABLE_PAUSED = 5;
  
  var modeCheck = {
      "COMMAND": true,
      "RAW": true,
      "MERGE": true,
      "DISTINCT": true};
  
  
  var SIMPLE = 1;
  var METAPUSH = 2;
  var MULTIMETAPUSH = 3;
  
  var UNCHANGED = Constants.UNCHANGED;
  
  var subscriptionsLogger = LoggerManager.getLoggerProxy(Constants.SUBSCRIPTIONS);
  
  var INVALID_MODE =  "The given value is not a valid subscription mode. Admitted values are MERGE, DISTINCT, RAW, COMMAND";
  
  var INVALID_SECOND_LEVEL_KEY = "The received key value is not a valid name for an Item";

  var NO_ITEMS = "Invalid Subscription, please specify an item list or item group";
  var NO_FIELDS = "Invalid Subscription, please specify a field list or field schema";
  
  var IS_ALIVE = "Cannot modify an active Subscription, please unsubscribe before applying any change";
  var NOT_ALIVE = "Subscription is not active";
  
  var ILLEGAL_FREQ_EXC = "Can't change the frequency from/to 'unfiltered' or to null while the Subscription is active";
  
  var NUMERIC_DISTINCT_ONLY = "Numeric values are only allowed when the subscription mode is DISTINCT";
  var RAW_NO_SNAPSHOT = "Snapshot is not permitted if RAW was specified as mode";
  var REQ_SNAP_EXC = "The given value is not valid for this setting; use null, 'yes', 'no' or a positive number instead";
  
  var NO_SUB_SCHEMA_NOR_LIST = "The second level of this Subscription was not initiated";
 
  var NO_SECOND_LEVEL = "Second level field list is only available on COMMAND Subscriptions";
  var NO_COMMAND = "This method can only be used on COMMAND subscriptions";

  function sortFun(a,b) {
    return a-b;
  }
  

  /**
   * Creates an object to be used to describe a Subscription that is going
   * to be subscribed to through Lightstreamer Server.
   * The object can be supplied to {@link LightstreamerClient#subscribe} and
   * {@link LightstreamerClient#unsubscribe}, in order to bring the Subscription to
   * "active" or back to "inactive" state.
   * <BR>Note that all of the methods used to describe the subscription to the server
   * can only be called while the instance is in the "inactive" state; the only
   * exception is {@link Subscription#setRequestedMaxFrequency}.
   * @constructor
   * 
   * @exports Subscription
   * 
   * @throws {IllegalArgumentException} If no or invalid subscription mode is 
   * passed.
   * @throws {IllegalArgumentException} If the list of items is specified while
   * the list of fields is not, or viceversa.
   * @throws {IllegalArgumentException} If the specified "Item List" or "Field List"
   * is not valid; see {@link Subscription#setItems} and {@link Subscription#setFields} for details.
   *
   * @param {String} subscriptionMode the subscription mode for the
   * items, required by Lightstreamer Server. Permitted values are:
   * <ul>
   * <li>MERGE</li>
   * <li>DISTINCT</li>
   * <li>RAW</li>
   * <li>COMMAND</li>
   * </ul>
   * 
   * @param {String|String[]} [items] an array of Strings containing a list of items to
   * be subscribed to through the server. In case of a single-item subscription the String
   * containing the item name can be passed in place of the array; both of the 
   * following examples represent a valid subscription:
   * <BR><code>new Subscription(mode,"item1",fieldList);</code>
   * <BR><code>new Subscription(mode,["item1","item2"],fieldList);</code>
   * <BR>It is also possible to pass null (or nothing) and specify the
   * "Item List" or "Item Group" later through {@link Subscription#setItems} and
   * {@link Subscription#setItemGroup}. In this case the fields parameter must not be specified.
   
   * 
   * @param {String[]} [fields] An array of Strings containing a list of fields 
   * for the items to be subscribed to through Lightstreamer Server.
   * <BR>It is also possible to pass null (or nothing) and specify the
   * "Field List" or "Field Schema" later through {@link Subscription#setFields} and
   * {@link Subscription#setFieldSchema}. In this case the items parameter must not be specified.
   *
   * @class Class representing a Subscription to be submitted to a Lightstreamer
   * Server. It contains subscription details and the listeners needed to process the
   * real-time data. 
   * <BR>After the creation, a Subscription object is in the "inactive"
   * state. When a Subscription object is subscribed to on a {@link LightstreamerClient} 
   * object, through the {@link LightstreamerClient#subscribe} method, its state 
   * becomes "active". This means that the client activates a subscription to the 
   * required items through Lightstreamer Server and the Subscription object begins 
   * to receive real-time events.
   * 
   * <BR>A Subscritpion can be configured to use either an Item Group or an Item List to 
   * specify the items to be subscribed to and using either a Field Schema or Field List
   * to specify the fields.
   * <BR>"Item Group" and "Item List" are defined as follows:
   * <ul>
   * <li>"Item Group": an Item Group is a String identifier representing a list of items.
   * Such Item Group has to be expanded into a list of items by the getItems method of the
   * MetadataProvider of the associated Adapter Set. When using an Item Group, items in the 
   * subscription are identified by their 1-based index within the group.
   * <BR>It is possible to configure the Subscription to use an "Item Group" using the {@link Subscription#setItemGroup}
   * method.
   * </li> 
   * <li>"Item List": an Item List is an array of Strings each one representing an item.
   * For the Item List to be correctly interpreted a LiteralBasedProvider or a MetadataProvider
   * with a compatible implementation of getItems has to be configured in the associated Adapter Set.
   * <BR>Note that no item in the list can be empty, can contain spaces or can 
   * be a number. 
   * <BR>When using an Item List, items in the subscription are identified by their name or by
   * their 1-based index within the list.
   * <BR>It is possible to configure the Subscription to use an "Item List" using the {@link Subscription#setItems}
   * method or by specifying it in the constructor.
   * </li> 
   * </ul>
   * <BR>"Field Schema" and "Field List" are defined as follows:
   * <ul>
   * <li>"Field Schema": a Field Schema is a String identifier representing a list of fields.
   * Such Field Schema has to be expanded into a list of fields by the getFields method of the
   * MetadataProvider of the associated Adapter Set. When using a Field Schema, fields in the 
   * subscription are identified by their 1-based index within the schema.
   * <BR>It is possible to configure the Subscription to use a "Field Schema" using the {@link Subscription#setFieldSchema}
   * method.
   * </li>
   * <li>"Field List": a Field List is an array of Strings each one representing a field.
   * For the Field List to be correctly interpreted a LiteralBasedProvider or a MetadataProvider
   * with a compatible implementation of getFields has to be configured in the associated Adapter Set.
   * <BR>Note that no field in the list can be empty or can contain spaces. 
   * <BR>When using a Field List, fields in the subscription are identified by their name or by
   * their 1-based index within the list.
   * <BR>It is possible to configure the Subscription to use a "Field List" using the {@link Subscription#setFields}
   * method or by specifying it in the constructor.
   * </li> 
   * </ul>
   */
  var Subscription = function(subscriptionMode, items, fields) {

    //admitted calls:
    //mode, item, fields
    //mode, items, fields
    //mode
    
    this._callSuperConstructor(Subscription);
    
    subscriptionMode = new String(subscriptionMode).toUpperCase();
    if (!subscriptionMode || !modeCheck[subscriptionMode]) {
      throw new IllegalArgumentException(INVALID_MODE);
    }
    this._mode = subscriptionMode;
    
    this.itemList = null;
    this.itemGroup = null;
    this.itemDescriptor = null;

    this.fieldList = null;
    this.fieldSchema = null;
    this.fieldDescriptor = null;
    
    //DEFAULT: yes if mode is MERGE, DISTINCT, or COMMAND; null if mode is RAW 
    this.isRequiredSnapshot = subscriptionMode === "RAW" ? null : "yes";
    this.requestedMaxFrequency = null;
    this.requestedBufferSize = null;
    this._start = null;
    this._end = null;
    this._selector = null;
    this.dataAdapter = null;
    
    this.tableNumber = null;
   
    this.requestParams = null;
    
    /*
     * The real max frequency, i.e. the argument of a CONF message.
     */
    this.realMaxFrequency = new RealMaxFrequencyManager.Frequency(null);
    /*
     * An instance of RealMaxFrequencyManager.
     */
    this.realMaxFrequencyManager = null;
    
/////////////////
  
    this.oldValuesByItem = new Matrix(); 
    
    this.oldValuesByKey = new Matrix(); 
    
/////////////////    
    
    this.handler = null;

    this.tablePhaseType = TABLE_OFF; 
    this.tablePhase = 0;  
    this._id = null;

    this.onCount = 0;
    this.sCount = 0;
    
    this.setBehavior(this._mode == Constants.COMMAND ? METAPUSH : SIMPLE);
    
/////////////////To manage Metapush
   
    this.commandCode = null;
    this.keyCode = null;
    
/////////////////To manage MultiMetapush
 
    this.underDataAdapter = null;
    this.subTables = new Matrix();
    
    this.subFieldList = null;
    this.subFieldSchema = null;
    this.subFieldDescriptor = null;
    
    //completely useless (may directly use the constant)
    //I save it here so that I can modifiy it to DISTINCT in the SubscriptionUnusualEvents test.
    this.subMode = Constants.MERGE;

/////////////////Setup   
    if (items) {
      if (!fields || !Helpers.isArray(fields)) {
        throw new IllegalArgumentException(ValidationUtils.NO_VALID_FIELDS);
      }
      
      
      if (Helpers.isArray(items)) {
        //list of items
        this.setItems(items);
      } else {
        this.setItems([items]);
      }
      
      this.setFields(fields);
      
    } else if (fields) {
      throw new IllegalArgumentException(ValidationUtils.YES_FIELDS_NO_ITEMS);
    }
    
  };
  
  Subscription.prototype = {
      
    toString: function() {
      return ["[","Subscription",this.tablePhaseType,this.tablePhase,this._id,this.tableNumber,"]"].join("|");
    },
    
//table status events    
    
    cleanData: function() {
      //called at the end of a pushing life (onRemove and onPause), empties structures that will be reinited on the onSubmission
      this.tableNumber = null;
      
      this.oldValuesByItem = new Matrix(); 
      this.oldValuesByKey = new Matrix(); 
      
      //resets the schema size
      this.fieldDescriptor.setSize(0);
      this.itemDescriptor.setSize(0);
      
      
      if (this.behavior == MULTIMETAPUSH) {
        this.fieldDescriptor.setSubDescriptor(null);
        this.subTables = new Matrix();
      }

      subscriptionsLogger.logDebug("Subscription reset",this);
    },
    
    onAdd: function(_id, nGen, handler) {
      this.notAliveCheck();
      if (!this.itemDescriptor) {
        throw new IllegalArgumentException(NO_ITEMS);
      }
      if (!this.fieldDescriptor) {
        throw new IllegalArgumentException(NO_FIELDS);
      }
      
      
      this.tablePhaseType = TABLE_PAUSED;
      this._id = _id;
      this.handler = handler;
          
      this.onCount++;
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(this.onCount,1,"Wrong count while adding");
    //>>excludeEnd("debugExclude");
      
      this.snapshotManager = new SnapshotManager(this);

      subscriptionsLogger.logInfo("Subscription entered the active state",this);
      
      return true;
    },
    
    onSubmission: function() {
      this.tablePhaseType = TABLE_WAITING;

      subscriptionsLogger.logDebug("Subscription waiting to be sent to server",this);
    },
    
    onTableNumber: function(tableNum) {
          this.tableNumber = tableNum;
          this.tablePhaseType = TABLE_SUBSCRIBING;
          
          subscriptionsLogger.logDebug("Subscription queued to be sent to server",this);        
    },
    
    onPause: function() {
      //called after an onSessionEnd, remove session related data (eg received push...)
      var unsub = this.isPushing();
      
      this.tablePhaseType = TABLE_PAUSED;
      
      this.cleanData();
      
      if (unsub) {
        this.onEndPush();
      }
       
      subscriptionsLogger.logDebug("Subscription is now on hold",this);
    },
    
    onRemove: function() {
      this.isAliveCheck();
      
      var unsub = this.isPushing();
      
      this.tablePhaseType = TABLE_OFF; 
      this._id = null;
      delete(this.requestParams);
      
      if (this.behavior == MULTIMETAPUSH) {
        this.removeSubTables();
      }
      
      this.cleanData();
      
      this.onCount--;
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(this.onCount,0, "Wrong count while removing");
    //>>excludeEnd("debugExclude");
      if (unsub) {
        this.onEndPush();
      }
      
      this.handler = null;
      
      subscriptionsLogger.logDebug("Subscription exits the active status; it can now be modified",this);
      
    },

    onStartPush: function(kPos,cPos,itms,flds) {
      this.tablePhaseType = TABLE_PUSHING;
      
      this.sCount++;
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(this.sCount,1, "Wrong count starting push");
    //>>excludeEnd("debugExclude");
      subscriptionsLogger.logInfo("Subscription is now subscribed to",this);
      
      if (this.behavior == MULTIMETAPUSH) {
        this.fieldDescriptor.setSubDescriptor(this.subFieldDescriptor);
      }
      
      if (this.fieldSchema && this.behavior != SIMPLE) {
        this.setServerSentMetapushFields(cPos, kPos);
      }
      
      this.itemDescriptor.setSize(itms);
      this.fieldDescriptor.setSize(flds);
      
      //notify table start
      this.dispatchEvent("onSubscription");
      
    },
    
    onStopPush: function() {
      //onEndPush sends the unsubscription notifications
    },
    
    onEndPush: function() {
      
      this.sCount--;
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(this.sCount,0, "Wrong count ending push");
    //>>excludeEnd("debugExclude");
      subscriptionsLogger.logInfo("Subscription is not subscribed to anymore",this);
      
      //notify table end
      this.dispatchEvent("onUnsubscription");
        
    },
    
    removeSubTables: function() {
      var that = this;
      this.subTables.forEachElement(function(el,item,key) {
        that.removeSubTable(item,key);
      });
    },
    
    removeItemSubTables: function(_item) {
      var that = this;
      this.subTables.forEachElementInRow(function(el,item,key) {
        that.removeSubTable(item,key);
      });
    },
    
    getTableNumber: function() {
      return this.tableNumber;
    },
    
    getTablePhase: function() {
      return this.tablePhase;
    },
    
    getRequestParams: function() {
      this.generateRequest();
      return this.requestParams;
    },

    /*private*/ generateMaxFrequencyParam: function() {
      if (this.requestedMaxFrequency != null) {
        var rmf = this.requestedMaxFrequency;
        return {"LS_requested_max_frequency": rmf};
      }
      return {};
    },
    
    /*private*/ generateRequest: function() {
      
      var req = {
          "LS_mode": this._mode,
          "LS_group": encodeURIComponent(this.itemDescriptor.getComposedString()),
          "LS_schema": encodeURIComponent(this.fieldDescriptor.getComposedString())
      };
      
      if (this.dataAdapter != null) {
        req["LS_data_adapter"]= encodeURIComponent(this.dataAdapter);
      }
    
      if (this._selector != null) {
        req["LS_selector"]= encodeURIComponent(this._selector);
      }
  
      if (this._start != null) {
        req["LS_start"]=this._start;
      }
      if (this._end != null) {
        req["LS_end"]=this._end;
      }
      if (this.isRequiredSnapshot != null) {
        req["LS_snapshot"]= this.isRequiredSnapshot === "yes" ? "true" : (this.isRequiredSnapshot === "no" ? "false" : this.isRequiredSnapshot);
      }
      
      //LS_requested_max_frequency
      Utils.extendObj(req,this.generateMaxFrequencyParam());

      
      if (this.requestedBufferSize != null) {
        var rbs = this.requestedBufferSize;
        if (rbs == "unlimited" || rbs > 0) {
          req["LS_requested_buffer_size"]=rbs;
        }
      }
      
      subscriptionsLogger.logDebug("Subscription request generated",this);
      
      this.requestParams = req;
      
      return this.requestParams;
    },
    
    setSchemaReadMetapushFields: function() {
      if (this._mode != Constants.COMMAND || this.fieldList == null) {
        return;
      }
      
      this.commandCode = this.fieldList.getPos("command"); 
      this.keyCode = this.fieldList.getPos("key");
      
      if (!this.commandCode || !this.keyCode) {
        throw new IllegalArgumentException("A field list for a COMMAND subscription must contain the key and command fields");
      }
      
    },
   
    setServerSentMetapushFields: function(commandPos, keyPos) {
      subscriptionsLogger.logDebug("Received position of COMMAND and KEY fields from server",this,commandPos,keyPos);
      
      this.commandCode = commandPos; 
      this.keyCode = keyPos;
    },
    
    getSubscriptionId: function() {
      return this._id;
    },
    
    notAliveCheck: function() {
      if (this.isActive()) {
        throw new IllegalStateException(IS_ALIVE);
      }
    },
    
    isAliveCheck: function() {
      if (!this.isActive()) {
        throw new IllegalStateException(NOT_ALIVE);
      }
    },
    
    secondLevelCheck: function() {
      if (this._mode != Constants.COMMAND) {
        throw new IllegalStateException(NO_SECOND_LEVEL);
      }
    },
    
    commandCheck: function() {
      if (this._mode != Constants.COMMAND) {
        throw new IllegalStateException(NO_COMMAND);
      }
    },
    
//////////////////phases, see https://docs.google.com/a/lightstreamer.com/drawings/d/1SsbEMF78re0ASAgByUhy5EQeKWjTG9FUkGR4zMGhtSc/edit?hl=en_US
    
    isOff: function() {
      return this.tablePhaseType == TABLE_OFF;
    },
    isWaiting: function() {
      return this.tablePhaseType == TABLE_WAITING;
    },
    isSubscribing: function() {
      return this.tablePhaseType == TABLE_SUBSCRIBING;
    },
    isPushing: function() {
      return this.tablePhaseType == TABLE_PUSHING;
    },
    isPaused: function() {
      return this.tablePhaseType == TABLE_PAUSED;
    },
    
  
    /**  
     * Inquiry method that checks if the Subscription is currently "active" or not.
     * Most of the Subscription properties cannot be modified if a Subscription is "active".
     * <BR>The status of a Subscription is changed to "active" through the  
     * {@link LightstreamerClient#subscribe} method and back to "inactive" through the
     * {@link LightstreamerClient#unsubscribe} one.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {boolean} true/false if the Subscription is "active" or not.
     * 
     * @see LightstreamerClient#subscribe
     * @see LightstreamerClient#unsubscribe
     */
    isActive: function() {
      return this.tablePhaseType != TABLE_OFF;
    },
    
    /**  
     * Inquiry method that checks if the Subscription is currently subscribed to
     * through the server or not.
     * <BR>This flag is switched to true by server sent Subscription events, and 
     * back to false in case of client disconnection, 
     * {@link LightstreamerClient#unsubscribe} calls and server sent unsubscription
     * events. 
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {boolean} true/false if the Subscription is subscribed to
     * through the server or not.
     */
    isSubscribed: function() {
      return this.isPushing(); 
    },
   
    /**
     * Setter method that sets the "Item List" to be subscribed to through 
     * Lightstreamer Server.
     * <BR>Any call to this method will override any "Item List" or "Item Group"
     * previously specified.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalArgumentException} if the given object is not an array.
     * @throws {IllegalArgumentException} if any of the item names in the "Item List"
     * contains a space or is a number or is empty/null.
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * 
     * @param {String[]} items An array of Strings containing an "Item List" to
     * be subscribed to through the server. 
     */
    setItems: function(items) {
      this.notAliveCheck();
      
      ValidationUtils.checkItemNames(items,"An item");
      
      this.itemList = items == null ? null : new ListDescriptor(items);
      this.itemGroup = null;
      this.itemDescriptor = this.itemList; 

    },
    
    /**
     * Inquiry method that can be used to read the "Item List" specified for this
     * Subscription.
     * <BR>Note that if a single item was specified in the constructor, this method
     * will return an array of length 1 containing such item.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the Subscription has
     * been initialized with an "Item List".
     * </p>
     * 
     * @throws {IllegalStateException} if the Subscription was initialized
     * with an "Item Group" or was not initialized at all.
     * 
     * @return {String[]} the "Item List" to be subscribed to through the server. 
     */
    getItems: function() {
      if (!this.itemList) {
        if (this.itemGroup) {
          throw new IllegalStateException(ValidationUtils.USE_GET_ITEM_GROUP);
        } else  {
          throw new IllegalStateException(ValidationUtils.NO_GROUP_NOR_LIST);
        }
      }
      return this.itemList.getOriginal();
    },
    
    /**
     * Setter method that sets the "Item Group" to be subscribed to through 
     * Lightstreamer Server.
     * <BR>Any call to this method will override any "Item List" or "Item Group"
     * previously specified.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * 
     * @param {String} groupName A String to be expanded into an item list by the
     * Metadata Adapter. 
     */
    setItemGroup: function(groupName) {
      this.notAliveCheck();
      
      this.itemList = null;
      this.itemGroup = groupName == null ? null : new NameDescriptor(groupName);
      this.itemDescriptor = this.itemGroup;
    },

    /**
     * Inquiry method that can be used to read the item group specified for this
     * Subscription.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the Subscription has
     * been initialized using an "Item Group"
     * </p>
     *
     * @throws {IllegalStateException} if the Subscription was initialized
     * with an "Item List" or was not initialized at all.
     * 
     * @return {String} the "Item Group" to be subscribed to through the server. 
     */
    getItemGroup: function() {
      if (!this.itemGroup) {
        if (this.itemList) {
          throw new IllegalStateException(ValidationUtils.USE_GET_ITEMS);
        } else {
          throw new IllegalStateException(ValidationUtils.NO_GROUP_NOR_LIST);
        }
      }
      return this.itemGroup.getOriginal();
    },
    
    /**
     * Setter method that sets the "Field List" to be subscribed to through 
     * Lightstreamer Server.
     * <BR>Any call to this method will override any "Field List" or "Field Schema"
     * previously specified.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalArgumentException} if the given object is not an array.
     * @throws {IllegalArgumentException} if any of the field names in the list
     * contains a space or is empty/null.
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * 
     * @param {String[]} fields An array of Strings containing a list of fields to
     * be subscribed to through the server. 
     */
    setFields: function(fields) {
      this.notAliveCheck();
      
      ValidationUtils.checkFieldNames(fields,"A field");
      
      this.fieldList =  fields == null ? null : new ListDescriptor(fields);
      this.fieldSchema = null;
      this.fieldDescriptor = this.fieldList;
      
      this.setSchemaReadMetapushFields();
      
    },

    /**
     * Inquiry method that can be used to read the "Field List" specified for this
     * Subscription.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the Subscription has
     * been initialized using a "Field List". 
     * </p>
     * 
     * @throws {IllegalStateException} if the Subscription was initialized
     * with a "Field Schema" or was not initialized at all.
     * 
     * @return {String[]} the "Field List" to be subscribed to through the server. 
     */
    getFields: function() {
      if (!this.fieldList) {
        if (this.fieldSchema) {
          throw new IllegalStateException(ValidationUtils.USE_GET_FIELD_SCHEMA);
        } else {
          throw new IllegalStateException(ValidationUtils.NO_SCHEMA_NOR_LIST);
        }
      }
      return this.fieldList.getOriginal();
    },
    
    /**
     * Setter method that sets the "Field Schema" to be subscribed to through 
     * Lightstreamer Server.
     * <BR>Any call to this method will override any "Field List" or "Field Schema"
     * previously specified.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * 
     * @param {String} schemaName A String to be expanded into a field list by the
     * Metadata Adapter. 
     */
    setFieldSchema: function(schemaName) {
      this.notAliveCheck();
      
      this.fieldList = null;
      this.fieldSchema = schemaName == null ? null : new NameDescriptor(schemaName);
      this.fieldDescriptor = this.fieldSchema;
    },

    /**
     * Inquiry method that can be used to read the field schema specified for this
     * Subscription.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the Subscription has
     * been initialized using a "Field Schema" 
     * </p>
     * 
     * @throws {IllegalStateException} if the Subscription was initialized
     * with a "Field List" or was not initialized at all.
     * 
     * @return {String} the "Field Schema" to be subscribed to through the server. 
     */
    getFieldSchema: function() {
      if (!this.fieldSchema) {
        if (this.fieldList) {
          throw new IllegalStateException(ValidationUtils.USE_GET_FIELDS);
        } else {
          throw new IllegalStateException(ValidationUtils.NO_SCHEMA_NOR_LIST);
        }
      }
      return this.fieldSchema.getOriginal();
    },
    
    /**
     * Inquiry method that can be used to read the mode specified for this
     * Subscription.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {String} the Subscription mode specified in the constructor.
     */
    getMode: function() {
      return this._mode;
    },
   
    /**
     * Setter method that sets the name of the Data Adapter
     * (within the Adapter Set used by the current session)
     * that supplies all the items for this Subscription.
     * <BR>The Data Adapter name is configured on the server side through
     * the "name" attribute of the "data_provider" element, in the
     * "adapters.xml" file that defines the Adapter Set (a missing attribute
     * configures the "DEFAULT" name).
     * <BR>Note that if more than one Data Adapter is needed to supply all the
     * items in a set of items, then it is not possible to group all the
     * items of the set in a single Subscription. Multiple Subscriptions
     * have to be defined.
     *
     * <p class="default-value"><b>Default value:</b> The default Data Adapter for the Adapter Set,
     * configured as "DEFAULT" on the Server.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     *
     * @param {String} dataAdapter the name of the Data Adapter. A null value 
     * is equivalent to the "DEFAULT" name.
     *  
     * @see ConnectionDetails#setAdapterSet
     */
    setDataAdapter: function(dataAdapter) {
      this.notAliveCheck();
      
      this.dataAdapter = dataAdapter;
      subscriptionsLogger.logDebug("Adapter Set assigned",this,dataAdapter);
    },
    
    /**
     * Inquiry method that can be used to read the name of the Data Adapter 
     * specified for this Subscription through {@link Subscription#setDataAdapter}.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {String} the name of the Data Adapter; returns null if no name
     * has been configured, so that the "DEFAULT" Adapter Set is used.
     */
    getDataAdapter: function() {
      return this.dataAdapter;
    },
    
    /**
     * Setter method that sets the selector name for all the items in the
     * Subscription. The selector is a filter on the updates received. It is
     * executed on the Server and implemented by the Metadata Adapter.
     *
     * <p class="default-value"><b>Default value:</b> null (no selector).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     *
     * @param {String} selector name of a selector, to be recognized by the
     * Metadata Adapter, or null to unset the selector.
     */
    setSelector: function(selector) {
      this.notAliveCheck();
      
      this._selector = selector;
      subscriptionsLogger.logDebug("Selector assigned",this,selector);
    },
    
    /**
     * Inquiry method that can be used to read the selctor name  
     * specified for this Subscription through {@link Subscription#setSelector}.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {String} the name of the selector.
     */
    getSelector: function() {
      return this._selector;
    },
      
    /**
     * Setter method that sets the maximum update frequency to be requested to
     * Lightstreamer Server for all the items in the Subscription. It can
     * be used only if the Subscription mode is MERGE, DISTINCT or
     * COMMAND (in the latter case, the frequency limitation applies to the
     * UPDATE events for each single key). For Subscriptions with two-level behavior
     * (see {@link Subscription#setCommandSecondLevelFields} and {@link Subscription#setCommandSecondLevelFieldSchema})
     * , the specified frequency limit applies to both first-level and second-level items. <BR>
     * Note that frequency limits on the items can also be set on the
     * server side and this request can only be issued in order to furtherly
     * reduce the frequency, not to rise it beyond these limits. <BR>
     * This method can also be used to request unfiltered dispatching
     * for the items in the Subscription. However, unfiltered dispatching
     * requests may be refused if any frequency limit is posed on the server
     * side for some item.
     *
     * <ALLEGRO_EDITION_NOTE><p class="edition-note"><B>Edition Note:</B> A further global frequency limit could also
	 * be imposed by the Server, depending on Edition and License Type; this specific limit also applies to RAW mode
	 * and to unfiltered dispatching.
	 * To know what features are enabled by your license, please see the License tab of the
	 * Monitoring Dashboard (by default, available at /dashboard).</p></ALLEGRO_EDITION_NOTE>
     *
     * <p class="default-value"><b>Default value:</b> null, meaning to lean on the Server default based on the subscription
     * mode. This consists, for all modes, in not applying any frequency 
     * limit to the subscription (the same as "unlimited"); see the "General Concepts"
     * document for further details.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can can be called at any time with some
     * differences based on the Subscription status:
     * <ul>
     * <li>If the Subscription instance is in its "inactive" state then
     * this method can be called at will.</li>
     * <li>If the Subscription instance is in its "active" state then the method
     * can still be called unless the current value is "unfiltered" or the
     * supplied value is "unfiltered" or null.
     * If the Subscription instance is in its "active" state and the
     * connection to the server is currently open, then a request
     * to change the frequency of the Subscription on the fly is sent to the server.</li>
     * </ul>
     * </p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active" and the current value of this property is "unfiltered".
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active" and the given parameter is null or "unfiltered".
     * @throws {IllegalArgumentException} if the specified value is not
     * null nor one of the special "unlimited" and "unfiltered" values nor
     * a valid positive number.
     *
     * @param {Number} freq A decimal number, representing the maximum update frequency (expressed in updates
     * per second) for each item in the Subscription; for instance, with a setting
     * of 0.5, for each single item, no more than one update every 2 seconds
     * will be received. If the string "unlimited" is supplied, then no frequency
     * limit is requested. It is also possible to supply the string 
     * "unfiltered", to ask for unfiltered dispatching, if it is allowed for the 
     * items, or a null value to stick to the Server default (which currently
     * corresponds to "unlimited").
     * The check for the string constants is case insensitive.
     */
    setRequestedMaxFrequency: function(freq) {
      //can be:
      //null -> do not send to the server
      //unfiltered or unlimited
      //>0 double
      
      if (freq) {
        freq = new String(freq);
        freq = freq.toLowerCase();
      }
      
      var orig = this.requestedMaxFrequency;
      if (this.isActive()) {
        if (!freq && freq != 0) {
          throw new IllegalStateException(ILLEGAL_FREQ_EXC);
        } else if (freq == "unfiltered" || this.requestedMaxFrequency == "unfiltered") {
          throw new IllegalStateException(ILLEGAL_FREQ_EXC);
        }
      }
      
      if (!freq && freq != 0) {
        this.requestedMaxFrequency = null;
      } else {
      
        if (freq == "unfiltered" || freq == "unlimited") {
          this.requestedMaxFrequency = freq;
        } else {
          try {
            this.requestedMaxFrequency = this.checkPositiveNumber(freq,false,true) ;
          } catch(_e) {
            throw new IllegalArgumentException(ValidationUtils.MAX_FREQ_EXC);
          }
        }
      }


      
      
      if ((this.isWaiting() || this.isSubscribing() || this.isPushing()) && String(orig) != String(this.requestedMaxFrequency)) {

        //the value changes at runtime, we need to regenerate the request
        //this.generateRequest();

        //we've already sent the subscription request to the engine,
        //send a new request to contain the frequency change
        this.handler.updateSubscriptionParams(this,this.generateMaxFrequencyParam());
        
        if (this.behavior == MULTIMETAPUSH) {
          var that = this;
          this.subTables.forEachElement(function(el,row,col) {
            //>>excludeStart("debugExclude", pragmas.debugExclude);  
              Assertions.verifyOk(that.isPushing(), "Table not pushing");
            //>>excludeEnd("debugExclude");
              el.setRequestedMaxFrequency(that.requestedMaxFrequency);
          });
        } // if not alive we cannot have subtables...
        
      }
      
      subscriptionsLogger.logDebug("Requested Max Frequency assigned",this,this.requestedMaxFrequency);
    },
    
    /**
     * Inquiry method that can be used to read the max frequency, configured
     * through {@link Subscription#setRequestedMaxFrequency}, to be requested to the 
     * Server for this Subscription.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {String} A decimal number, representing the max frequency to be requested to the server
     * (expressed in updates per second), or the strings "unlimited" or "unfiltered", or null.
     */
    getRequestedMaxFrequency: function() {
      return this.requestedMaxFrequency == null ? null : String(this.requestedMaxFrequency);
    },
  
    /**
     * Setter method that sets the length to be requested to Lightstreamer
     * Server for the internal queueing buffers for the items in the Subscription.
     * A Queueing buffer is used by the Server to accumulate a burst
     * of updates for an item, so that they can all be sent to the client,
     * despite of bandwidth or frequency limits. It can be used only when the
     * subscription mode is MERGE or DISTINCT and unfiltered dispatching has
     * not been requested. Note that the Server may pose an upper limit on the
     * size of its internal buffers.
     *
     * <p class="default-value"><b>Default value:</b> null, meaning to lean
     * on the Server default based on the subscription mode. This means that
     * the buffer size will be 1 for MERGE subscriptions and "unlimited" for
     * DISTINCT subscriptions. See the "General Concepts" document for further details.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * @throws {IllegalArgumentException} if the specified value is not
     * null nor  "unlimited" nor a valid positive integer number.
     *
     * @param {Number} size The length of the internal queueing buffers to be
     * used in the Server. If the string "unlimited" is supplied, then no buffer
     * size limit is requested (the check is case insensitive). It is also possible
     * to supply a null value to stick to the Server default (which currently
     * depends on the subscription mode).
     *
     * @see Subscription#setRequestedMaxFrequency
     */
    setRequestedBufferSize: function(size) {
      this.notAliveCheck();
      
      //can be
      //null -> do not send to the server
      //unlimited
      //>0 integer
      
      if (!size && size != 0) {
        this.requestedBufferSize = null;
      } else {
        size = new String(size);
        size = size.toLowerCase();
        if (size == "unlimited") {
          this.requestedBufferSize = size;
        } else {
          try {
            this.requestedBufferSize = this.checkPositiveNumber(size);
          } catch(_e) {
            throw new IllegalArgumentException(ValidationUtils.MAX_BUF_EXC);
          }
        }
      }
      
      subscriptionsLogger.logDebug("Requested Buffer Size assigned",this,this.requestedBufferSize);
    },
    
    /**
     * Inquiry method that can be used to read the buffer size, configured though
     * {@link Subscription#setRequestedBufferSize}, to be requested to the Server for
     * this Subscription.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {String} the buffer size to be requested to the server.
     */
    getRequestedBufferSize: function() {
      return this.requestedBufferSize == null ? null : String(this.requestedBufferSize);
    },
  
  
    /**
     * Setter method that enables/disables snapshot delivery request for the
     * items in the Subscription. The snapshot can be requested only if the
     * Subscription mode is MERGE, DISTINCT or COMMAND.
     *
     * <p class="default-value"><b>Default value:</b> "yes" if the Subscription mode is not "RAW",
     * null otherwise.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * @throws {IllegalArgumentException} if the specified value is not
     * "yes" nor "no" nor null nor a valid integer positive number.
     * @throws {IllegalArgumentException} if the specified value is not
     * compatible with the mode of the Subscription: 
     * <ul>
     *  <li>In case of a RAW Subscription only null is a valid value;</li>
     *  <li>In case of a non-DISTINCT Subscription only null "yes" and "no" are
     *  valid values.</li>
     * </ul>
     *
     * @param {String} required "yes"/"no" to request/not request snapshot
     * delivery (the check is case insensitive). If the Subscription mode is 
     * DISTINCT, instead of "yes", it is also possible to supply a number, 
     * to specify the requested length of the snapshot (though the length of 
     * the received snapshot may be less than requested, because of insufficient 
     * data or server side limits);
     * passing "yes"  means that the snapshot length should be determined
     * only by the Server. Null is also a valid value; if specified no snapshot 
     * preference will be sent to the server that will decide itself whether
     * or not to send any snapshot. 
     * 
     * @see ItemUpdate#isSnapshot
     */
    setRequestedSnapshot: function(required) {
      this.notAliveCheck();

      if (!required && required != 0) {
        //null - admitted for all modes
        this.isRequiredSnapshot = null;
        
      } else {
        required = new String(required);
        required = required.toLowerCase();
        
        if (required == "no") {  
          //the string no - admitted for all modes
          this.isRequiredSnapshot = required;
        
        } else {
          if (this._mode == Constants.RAW) {
            throw new IllegalStateException(RAW_NO_SNAPSHOT);
          }
          
          if (required == "yes") {
            //the string yes - admitted for MERGE, DISTINCT, COMMAND modes
            this.isRequiredSnapshot = required;
            
          } else if (!isNaN(required)) {
            if (this._mode != Constants.DISTINCT) {
              //THROW
              throw new IllegalStateException(NUMERIC_DISTINCT_ONLY);
            }
            
            //a String to be parsed as a >0 int - admitted for DISTINCT mode
            try {
              this.isRequiredSnapshot = this.checkPositiveNumber(required);
            } catch(_e) {
              throw new IllegalArgumentException(REQ_SNAP_EXC);
            }
          
          }  else {
            throw new IllegalArgumentException(REQ_SNAP_EXC);
          }
          
        }
        
      }
      
      subscriptionsLogger.logDebug("Snapshot Required assigned",this,this.isRequiredSnapshot);
    },
    
    /**
     * Inquiry method that can be used to read the snapshot preferences, configured
     * through {@link Subscription#setRequestedSnapshot}, to be requested to the Server for
     * this Subscription.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {String} the snapshot preference to be requested to the server.
     */
    getRequestedSnapshot: function() {
      return this.isRequiredSnapshot;
    },
    
    /**
     * Setter method that sets the "Field List" to be subscribed to through 
     * Lightstreamer Server for the second-level items. It can only be used on
     * COMMAND Subscriptions.
     * <BR>Any call to this method will override any "Field List" or "Field Schema"
     * previously specified for the second-level.
     * <BR>Calling this method enables the two-level behavior:
     * <BR>in synthesis, each time a new key is received on the COMMAND Subscription, 
     * the key value is treated as an Item name and an underlying Subscription for
     * this Item is created and subscribed to automatically, to feed fields specified
     * by this method. This mono-item Subscription is specified through an "Item List"
     * containing only the Item name received. As a consequence, all the conditions
     * provided for subscriptions through Item Lists have to be satisfied. The item is 
     * subscribed to in "MERGE" mode, with snapshot request and with the same maximum
     * frequency setting as for the first-level items (including the "unfiltered" 
     * case). All other Subscription properties are left as the default. When the 
     * key is deleted by a DELETE command on the first-level Subscription, the 
     * associated second-level Subscription is also unsubscribed from. 
     * <BR>Specifying null as parameter will disable the two-level behavior.
     *       
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalArgumentException} if the given object is not null nor 
     * an array.
     * @throws {IllegalArgumentException} if any of the field names in the "Field List"
     * contains a space or is empty/null.
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * @throws {IllegalStateException} if the Subscription mode is not "COMMAND".
     * 
     * @param {String[]} fields An array of Strings containing a list of fields to
     * be subscribed to through the server.
     * <BR>Ensure that no name conflict is generated between first-level and second-level
     * fields. In case of conflict, the second-level field will not be accessible
     * by name, but only by position.
     * 
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    setCommandSecondLevelFields: function(fields) {
      this.notAliveCheck();
      this.secondLevelCheck();
      
      ValidationUtils.checkFieldNames(fields,"A field");
      
      this.subFieldList = fields == null ? null : new ListDescriptor(fields);
      this.subFieldSchema = null;
      this.subFieldDescriptor = this.subFieldList;
      
      this.prepareSecondLevel();
      
    },
    
    /**
     * Inquiry method that can be used to read the "Field List" specified for 
     * second-level Subscriptions.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the second-level of
     * this Subscription has been initialized using a "Field List"  
     * </p>
     * 
     * @throws {IllegalStateException} if the Subscription was initialized
     * with a field schema or was not initialized at all.
     * 
     * @return {String[]} the list of fields to be subscribed to through the server. 
     */
    getCommandSecondLevelFields: function() {
      if (!this.subFieldList) {
        if (this.subFieldSchema) {
          throw new IllegalStateException("The second level of this Subscription was initiated using a field schema, use getCommandSecondLevelFieldSchema instead of using getCommandSecondLevelFields");
        } else {
          throw new IllegalStateException(NO_SUB_SCHEMA_NOR_LIST);
        }
      }
      return this.subFieldList.getOriginal();
    },
    
    /**
     * Setter method that sets the "Field Schema" to be subscribed to through 
     * Lightstreamer Server for the second-level items. It can only be used on
     * COMMAND Subscriptions.
     * <BR>Any call to this method will override any "Field List" or "Field Schema"
     * previously specified for the second-level.
     * <BR>Calling this method enables the two-level behavior:
     * <BR>in synthesis, each time a new key is received on the COMMAND Subscription, 
     * the key value is treated as an Item name and an underlying Subscription for
     * this Item is created and subscribed to automatically, to feed fields specified
     * by this method. This mono-item Subscription is specified through an "Item List"
     * containing only the Item name received. As a consequence, all the conditions
     * provided for subscriptions through Item Lists have to be satisfied. The item is 
     * subscribed to in "MERGE" mode, with snapshot request and with the same maximum
     * frequency setting as for the first-level items (including the "unfiltered" 
     * case). All other Subscription properties are left as the default. When the 
     * key is deleted by a DELETE command on the first-level Subscription, the 
     * associated second-level Subscription is also unsubscribed from. 
     * <BR>Specify null as parameter will disable the two-level behavior.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     * 
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * @throws {IllegalStateException} if the Subscription mode is not "COMMAND".
     * 
     * @param {String} schemaName A String to be expanded into a field list by the
     * Metadata Adapter. 
     * 
     * @see Subscription#setCommandSecondLevelFields
     */
    setCommandSecondLevelFieldSchema: function(schemaName) {
      this.notAliveCheck();
      this.secondLevelCheck();
      
      this.subFieldList = null;
      this.subFieldSchema = schemaName == null ? null : new NameDescriptor(schemaName);
      this.subFieldDescriptor = this.subFieldSchema;
      
      this.prepareSecondLevel();
      
    },
    
    /**
     * Inquiry method that can be used to read the "Field Schema" specified for 
     * second-level Subscriptions.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the second-level of
     * this Subscription has been initialized using a "Field Schema".
     * </p>
     * 
     * @throws {IllegalStateException} if the Subscription was initialized
     * with a "Field List" or was not initialized at all.
     * 
     * @return {String} the "Field Schema" to be subscribed to through the server. 
     */
    getCommandSecondLevelFieldSchema: function() {
      if (!this.subFieldSchema) {
        if (this.subFieldList) {
          throw new IllegalStateException("The second level of this Subscription was initiated using a field list, use getCommandSecondLevelFields instead of using getCommandSecondLevelFieldSchema");
        } else {
          throw new IllegalStateException(NO_SUB_SCHEMA_NOR_LIST);
        }
      }
      return this.subFieldSchema.getOriginal();
    },
    
    /**
     * Setter method that sets the name of the second-level Data Adapter (within 
     * the Adapter Set used by the current session) that supplies all the 
     * second-level items.
     * All the possible second-level items should be supplied in "MERGE" mode 
     * with snapshot available. 
     * The Data Adapter name is configured on the server side through the 
     * "name" attribute of the &lt;data_provider&gt; element, in the "adapters.xml" 
     * file that defines the Adapter Set (a missing attribute configures the 
     * "DEFAULT" name).
     * 
     * <p class="default-value"><b>Default value:</b> The default Data Adapter for the Adapter Set,
     * configured as "DEFAULT" on the Server.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the Subscription
     * instance is in its "inactive" state.</p>
     *
     * @throws {IllegalStateException} if the Subscription is currently 
     * "active".
     * @throws {IllegalStateException} if the Subscription mode is not "COMMAND".
     *
     * @param {String} dataAdapter the name of the Data Adapter. A null value 
     * is equivalent to the "DEFAULT" name.
     *  
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    setCommandSecondLevelDataAdapter: function(dataAdapter) {
      this.notAliveCheck();
      this.secondLevelCheck();
      
      this.underDataAdapter = dataAdapter;
      subscriptionsLogger.logDebug("Second level Data Adapter Set assigned",this,dataAdapter);
    },
    
    /**
     * Inquiry method that can be used to read the second-level Data 
     * Adapter name configured through {@link Subscription#setCommandSecondLevelDataAdapter}.
     *  
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @return {String} the name of the second-level Data Adapter.
     */
    getCommandSecondLevelDataAdapter : function() {
      return this.underDataAdapter;
    },
    
    /**
     * Returns the latest value received for the specified item/field pair.
     * <BR>It is suggested to consume real-time data by implementing and adding
     * a proper {@link SubscriptionListener} rather than probing this method.
     * In case of COMMAND Subscriptions, the value returned by this
     * method may be misleading, as in COMMAND mode all the keys received, being
     * part of the same item, will overwrite each other; for COMMAND Subscriptions,
     * use {@link Subscription#getCommandValue} instead.
     * <BR>Note that internal data is cleared when the Subscription is 
     * unsubscribed from. 
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time; if called 
     * to retrieve a value that has not been received yet, then it will return null. 
     * </p>
     * 
     * @throws {IllegalArgumentException} if an invalid item name or field
     * name is specified or if the specified item position or field position is
     * out of bounds.
     * 
     * @param {String} itemIdentifier a String representing an item in the 
     * configured item list or a Number representing the 1-based position of the item
     * in the specified item group. (In case an item list was specified, passing 
     * the item position is also possible).
     * 
     * @param {String} fieldIdentifier a String representing a field in the 
     * configured field list or a Number representing the 1-based position of the field
     * in the specified field schema. (In case a field list was specified, passing 
     * the field position is also possible).
     * 
     * @return {String} the current value for the specified field of the specified item
     * (possibly null), or null if no value has been received yet.
     */
    getValue: function(itemIdentifier, fieldIdentifier) {
      return this.oldValuesByItem.get(this.toItemPos(itemIdentifier),this.toFieldPos(fieldIdentifier));
    },
    
    /**
     * Returns the latest value received for the specified item/key/field combination.
     * This method can only be used if the Subscription mode is COMMAND.
     * Subscriptions with two-level behavior are also supported, hence the specified
     * field can be either a first-level or a second-level one.
     * <BR>It is suggested to consume real-time data by implementing and adding
     * a proper {@link SubscriptionListener} rather than probing this method.
     * <BR>Note that internal data is cleared when the Subscription is 
     * unsubscribed from. 
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time; if called 
     * to retrieve a value that has not been received yet, then it will return null.
     * </p>
     * 
     * @throws {IllegalArgumentException} if an invalid item name or field
     * name is specified or if the specified item position or field position is
     * out of bounds.
     * @throws {IllegalStateException} if the Subscription mode is not 
     * COMMAND.
     * 
     * @param {String} itemIdentifier a String representing an item in the 
     * configured item list or a Number representing the 1-based position of the item
     * in the specified item group. (In case an item list was specified, passing 
     * the item position is also possible).
     * 
     * @param {String} keyValue a String containing the value of a key received
     * on the COMMAND subscription.
     * 
     * @param {String} fieldIdentifier a String representing a field in the 
     * configured field list or a Number representing the 1-based position of the field
     * in the specified field schema. (In case a field list was specified, passing
     * the field position is also possible).
     * 
     * @return {String} the current value for the specified field of the specified
     * key within the specified item (possibly null), or null if the specified
     * key has not been added yet (note that it might have been added and eventually deleted).
     */
    getCommandValue: function(itemIdentifier, keyValue, fieldIdentifier) {
      this.commandCheck();
     
      return this.oldValuesByKey.get(this.toItemPos(itemIdentifier)+" "+keyValue,this.toFieldPos(fieldIdentifier,true));
    },  
    
    /**
     * Returns the position of the "key" field in a COMMAND Subscription.
     * <BR>This method can only be used if the Subscription mode is COMMAND
     * and the Subscription was initialized using a "Field Schema".
     *  
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @throws {IllegalStateException} if the Subscription mode is not 
     * COMMAND or if the {@link SubscriptionListener#onSubscription} event for this Subscription
     * was not yet fired.
     * 
     * @return {Number} the 1-based position of the "key" field within the "Field Schema".
     */
    getKeyPosition: function() {
      this.commandCheck();
      
      if (!this.fieldSchema && this.fieldList) {
        throw new IllegalStateException("This Subscription was initiated using a field list, key field is always 'key'");
      }
      
      if (this.keyCode == null) {
        throw new IllegalStateException("The position of the key field is currently unknown");
      }
      
      return this.keyCode;
    },
    
    /**
     * Returns the position of the "command" field in a COMMAND Subscription.
     * <BR>This method can only be used if the Subscription mode is COMMAND
     * and the Subscription was initialized using a "Field Schema".
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     * 
     * @throws {IllegalStateException} if the Subscription mode is not 
     * COMMAND or if the {@link SubscriptionListener#onSubscription} event for this Subscription
     * was not yet fired.
     * 
     * @return {Number} the 1-based position of the "command" field within the "Field Schema".
     */
    getCommandPosition: function() {
      this.commandCheck();

      if (!this.fieldSchema && this.fieldList) {
        throw new IllegalStateException("This Subscription was initiated using a field list, command field is always 'command'");
      }
      
      if (this.commandCode == null) {
        throw new IllegalStateException("The position of the command field is currently unknown");
      }
      
      return this.commandCode;
    },
    
    /*private*/ toFieldPos: function(fieldNameOrPos,full) {
      var res = this.toPos(fieldNameOrPos,this.fieldDescriptor,full);
      if (res === null) {
        throw new IllegalArgumentException("the specified field does not exist");
      } else if (res === false) {
        throw new IllegalArgumentException("the specified field position is out of bounds");
      }
      
      return res; 
    },
    
    /*private*/toItemPos: function(itemNameOrPos) {
      var res = this.toPos(itemNameOrPos,this.itemDescriptor);
      if (res === null) {
        throw new IllegalArgumentException("the specified item does not exist");
      } else if (res === false) {
        throw new IllegalArgumentException("the specified item position is out of bounds");
      } 
      return res;
    },
    
    /*private*/ toPos: function(nameOrPos,descriptor,full) {
      var pos = (isNaN(nameOrPos) ? descriptor.getPos(nameOrPos) : nameOrPos);
      if (pos == null) {
        return null;
      } else if (pos <= 0 || pos > (full ? descriptor.getFullSize() : descriptor.getSize())) {
        return false;
      }
      
      return pos;
    },
    
    
    prepareSecondLevel: function() {
      if (this.subFieldDescriptor == null) {
        //disable second level
        this.setBehavior(METAPUSH);
        
      } else {
        //enable second level
        this.setBehavior(MULTIMETAPUSH);
      }
    },

    endOfSnapshot: function(_item) {
      var _name = this.itemDescriptor.getName(_item);
      
      this.snapshotManager.endOfSnapshot();
      this.dispatchEvent("onEndOfSnapshot",[_name,_item]);
    },
    
    clearSnapshot: function(_item) {
      var _name = this.itemDescriptor.getName(_item);
      
      if (this.behavior == METAPUSH) {
        //delete key-status
        this.oldValuesByKey = new Matrix();
      } else if (this.behavior == MULTIMETAPUSH) {
        //delete key-status
        this.oldValuesByKey = new Matrix();
        //unsubscribe subtables
        this.removeItemSubTables(_item);
      }
      this.dispatchEvent("onClearSnapshot",[_name,_item]);
      
    },
    
    lostUpdates: function(_item,lostUpdates,optKeyVal) {
      var _name = this.itemDescriptor.getName(_item);
      
      this.dispatchEvent("onItemLostUpdates",[_name,_item,lostUpdates]);
    },
    
    sonLostUpdates: function(relKey,lostUpdates) {
      this.dispatchEvent("onCommandSecondLevelItemLostUpdates",[lostUpdates,relKey]);
    },
    
    serverDeny: function(flag,msg) {
      this.dispatchEvent("onSubscriptionError",[flag,msg]);
    },
    
    sonServerDeny: function(code,msg,relKey) {
      this.dispatchEvent("onCommandSecondLevelSubscriptionError",[code,msg,relKey]);
    },
    
    update: function(args,snap,fromMultison) {
    //>>excludeStart("debugExclude", pragmas.debugExclude);  
      Assertions.verifyValue(TABLE_PUSHING,this.tablePhaseType, "Wrong table phase");
    //>>excludeEnd("debugExclude");
      // number of the item of the current update
      var _item = args[1];
      
      this.snapshotManager.update();
      var isSnapshot = this.snapshotManager.isSnapshot();
      
      //OLD for METAPUSH (old is the new value)
      //for item|key and not for per item.
      var _key = new String(_item);
      
      if (this.behavior != SIMPLE) {
        //handle metapush update
        //WARNING, args is modified by the method
        _key = this.organizeMPUpdate(args,_item,fromMultison);
       
        //args enters UNCHANGED by item exits UNCHANGED by key
        //oldValuesByItem is updated with new values
        
      } 
      
      if (this.behavior == MULTIMETAPUSH && !fromMultison) {
        // multi table,
        // here the logic of subscriptions and unregistration is managed
        // here we do not enter if the update is generated by a son as such
        // update all carry as UPDATE command
        this.handleMultiTableSubscriptions(args); 
      }
      
      if (this.behavior == SIMPLE) {
        this.updateStructure(this.oldValuesByItem,_item,args,true);
      } else {
        this.updateStructure(this.oldValuesByKey,_key,args,true);
        
        //organizeMPUpdate has already updated the oldValuesByItem array
      }
      var updateObj =  new ItemUpdate(this.itemDescriptor.getName(_item), _item, this.fieldDescriptor, isSnapshot, args);
      this.dispatchEvent("onItemUpdate",[updateObj]);
 
      if (this.oldValuesByKey.get(_key,this.commandCode) == "DELETE") {
        this.oldValuesByKey.delRow(_key);
      }
      
    },
    
    updateStructure: function(struct,_key,args, fillInUnchanged) {
      var len = args.length - 2;
      var _field = 1;
      var fieldInArgs = 2;
      args.unchangedMap = {};
      for (; _field <= len; _field++, fieldInArgs++) {
        
        if (args[fieldInArgs] !== UNCHANGED) {
          struct.insert(args[fieldInArgs], _key, _field);
        } else if (fillInUnchanged) {
          args[fieldInArgs] = struct.get(_key,_field);
          args.unchangedMap[fieldInArgs] = true;
        }
        
      }
    },
    
    
/////////////METAPUSH    
    
    organizeMPUpdate: function(args,_item,fromMultison) {
      
      var item_key;
      if ((typeof args[this.keyCode + 1] == "undefined")||(typeof args[this.commandCode + 1] == "undefined")) {
        subscriptionsLogger.logWarn("key and/or command position not correctly configured");
        return null;
      }
      
      // the server unchanged are not covered yet, so I need to evaluate what value I need
      if (args[this.keyCode + 1] == UNCHANGED) {
        //unchanged, so take the old value
        item_key = _item + " " + this.oldValuesByItem.get(_item,this.keyCode);
      } else {
        //take the new value
        item_key = _item + " " + args[this.keyCode + 1];
      }
      
      // I cover unchanged item with unchanged key and prepare old item for the next round
      // only makes sense for COMMAND updates, multimetapush child updates
      // are already organized by single key
      if (!fromMultison) {
        args.changedFields = [];
      
        for (var i = 2; i < args.length; i++) {
          if (args[i] && args[i] == UNCHANGED) {
            //if unchanged on server take old _item
            args[i] = this.oldValuesByItem.get(_item,(i - 1));
          } else {
            //copy on old _item the new value
            this.oldValuesByItem.insert(args[i],_item,(i - 1));
          }
          
          if (args[i] == this.oldValuesByKey.get(item_key,(i - 1))) {
            // if server value = old key, overwrite server value with unchanged value
            args[i] = UNCHANGED;
          } else {
            args.changedFields.push(i-1);
          }
        }
      
      
        if (this.behavior == MULTIMETAPUSH) {
          var newL = this.getFullSchemaSize() + 2;
          if(newL > args.length) {
            // I received an update on the table in COMMAND.
            // since this update does not have the fields of the
            // subtable MERGE, I extend the update with unchanged ones.
           
            for (var i = args.length; i < newL; i++) {
              args[i] = UNCHANGED;
            }
          }
        }
        
      } else {
        
        // the update of a child has the same key as item|key which certainly hasn't changed
        args[this.keyCode + 1] = UNCHANGED;
        // the command probably hasn't changed either:
        if (args[this.commandCode + 1] == this.oldValuesByKey.get(item_key,this.commandCode)) {
          args[this.commandCode + 1] = UNCHANGED;
        } else {
          args.changedFields.push(this.commandCode);
          args.changedFields.sort(sortFun);
        }
      }
      return item_key;
    },
    
    
//////////MULTI-METAPUSH    
    
    handleMultiTableSubscriptions: function(args) {
      // manage the logic of subscriptions and unregistration
      var _item = args[1];
      var _key = (args[this.keyCode + 1] == UNCHANGED) ? this.oldValuesByItem.get(_item,this.keyCode) : args[this.keyCode + 1];
      var itemCommand = args[this.commandCode + 1];
      
      var subTableExists = this.hasSubTable(_item,_key);
      if (itemCommand == "DELETE") {
        if (subTableExists) {
          this.removeSubTable(_item,_key);
        }
      } else if (!subTableExists) {
        this.addSubTable(_item,_key);
      }
    },
    
    makeSubTable: function(parentSubscription) {
      this.subTableFlag = true;
      this.realMaxFrequencyManager = new RealMaxFrequencyManager.SecondLevelMultiMetaPushRealMaxFrequencyManager(this, parentSubscription);
    },
    
    isSubTable: function() {
      //do not abuse
      return this.subTableFlag;
    },
    
    hasSubTable: function(_item,_key) {
      return this.subTables.get(_item,_key) !== null;
    },
    
    removeSubTable: function(_item,_key) {
      this.handler.removeATable(this.subTables.get(_item,_key));
      this.subTables.del(_item,_key);
      this.realMaxFrequencyManager.onDeleteSecondLevelSubscription();
    },
    
    addSubTable: function(_item,_key) {
      var st = new Subscription(this.subMode);
      st.makeSubTable(this);
      
      this.subTables.insert(st,_item,_key);
      
      try {
        st.setItems([_key]);
      } catch(e) {
        this.dispatchEvent("onCommandSecondLevelSubscriptionError", [14, INVALID_SECOND_LEVEL_KEY, _key]);
        return;
      }
      
      if (this.subFieldList) {
        st.setFields(this.subFieldList.getOriginal());
      } else {
        st.setFieldSchema(this.subFieldSchema.getOriginal());
      }
      
      st.setDataAdapter(this.underDataAdapter);
      st.setRequestedSnapshot("yes");
      st.requestedMaxFrequency = this.requestedMaxFrequency;
      

      var subList = new SecondLevelSubscriptionListener(this,_item,_key);
      st.addListener(subList);
            
      this.handler.addATable(st);
    },
    
    setSecondLevelSchemaSize: function(size) {
      this.subFieldDescriptor.setSize(size);
    },
    
    getMainSchemaSize: function() {
      return this.fieldDescriptor.getSize();
    },
    
    getFullSchemaSize: function() {
      return this.fieldDescriptor.getFullSize();
    },
    
    getKeyPos: function() {
      return this.keyCode;
    },
    
    getCommandPos: function() {
      return this.commandCode;
    },
    
    /**
     * Adds a listener that will receive events from the Subscription 
     * instance.
     * <BR>The same listener can be added to several different Subscription 
     * instances.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
     * 
     * @param {SubscriptionListener} listener An object that will receive the events
     * as shown in the {@link SubscriptionListener} interface.
     * <BR>Note that the given instance does not have to implement all of the 
     * methods of the SubscriptionListener interface. In fact it may also 
     * implement none of the interface methods and still be considered a valid 
     * listener. In the latter case it will obviously receive no events.
     */
    addListener: function(listener) {
      this._callSuperMethod(Subscription,"addListener",[listener]);
    },
    
    /**
     * Removes a listener from the Subscription instance so that it
     * will not receive events anymore.
     * 
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     * 
     * @param {SubscriptionListener} listener The listener to be removed.
     */
    removeListener: function(listener) {
      this._callSuperMethod(Subscription,"removeListener",[listener]);
    },
    
    /**
     * Returns an array containing the {@link SubscriptionListener} instances that
     * were added to this client.
     * 
     * @return {SubscriptionListener[]} an Array containing the listeners that were added to this client.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners: function() {
      return this._callSuperMethod(Subscription,"getListeners");
    },
    
    setBehavior: function(behavior) {
        this.behavior = behavior;
        switch (behavior) {
        case SIMPLE:
        case METAPUSH:
            this.realMaxFrequencyManager = new RealMaxFrequencyManager.FlatPushRealMaxFrequencyManager(this);
            break;
            
        case MULTIMETAPUSH:
            this.realMaxFrequencyManager = new RealMaxFrequencyManager.FirstLevelMultiMetaPushRealMaxFrequencyManager(this);
            break;
            
        default:
            ASSERT.verifyOk(false);
        }
    },
    
    /**
     * Changes the real max frequency of this subscription.
     * <br>If there is a change, the method SubscriptionListener.onRealMaxFrequency is triggered.
     * <br>The method SubscriptionListener.onRealMaxFrequency is also triggered if there is a new maximum
     * among the item frequencies of a two-level command subscription.
     */
    configure: function(frequency) {
        this.realMaxFrequencyManager.configure(frequency);
    }

  };
  
  /*
   * Detects whether the current update is a snapshot according to the rules in the following table.
   * <pre>
+--------------------+-------+----------+----------+---------+---------+-------+-------+-------+
|                    | r1    | r2       | r3       | r4      | r5      | r6    | r7    | r8    |
+--------------------+-------+----------+----------+---------+---------+-------+-------+-------+
| snapshot requested | false | true     | true     | true    | true    | true  | true  | true  |
+--------------------+-------+----------+----------+---------+---------+-------+-------+-------+
| mode               | -     | DISTINCT | DISTINCT | COMMAND | COMMAND | MERGE | MERGE | RAW   |
+--------------------+-------+----------+----------+---------+---------+-------+-------+-------+
| first update       | -     | -        | -        | -       | -       | false | true  | -     |
+--------------------+-------+----------+----------+---------+---------+-------+-------+-------+
| EOS received       | -     | false    | true     | false   | true    | -     | -     | -     |
+--------------------+-------+----------+----------+---------+---------+-------+-------+-------+
| isSnapshot()       | false | true     | false    | true    | false   | false | true  | error |
+--------------------+-------+----------+----------+---------+---------+-------+-------+-------+
   * </pre>
   */
  function SnapshotManager(subscription) {
      this.firstUpdate = true;
      this.eosReceived = false;
      this.state = SnapshotManagerState.NO_UPDATE_RECEIVED;
      this.subscription = subscription;
  }
  
  /**
   * Notifies the manager that a new update is available.
   */
  SnapshotManager.prototype.update = function() {
      if (this.state == SnapshotManagerState.NO_UPDATE_RECEIVED) {
          this.state = SnapshotManagerState.ONE_UPDATE_RECEIVED;
          
      } else if (this.state == SnapshotManagerState.ONE_UPDATE_RECEIVED) {
          this.state = SnapshotManagerState.MORE_THAN_ONE_UPDATE_RECEIVED;
          this.firstUpdate = false;
      }
  }
  
  /**
   * Notifies the manager that the message EOS has arrived.
   */
  SnapshotManager.prototype.endOfSnapshot = function() {
      this.eosReceived = true;
  }
  
  /**
   * Returns true if the user has requested the snapshot.
   */
  SnapshotManager.prototype.snapshotRequested = function() {
      return this.subscription.isRequiredSnapshot != null && this.subscription.isRequiredSnapshot != "no";
  }
  
  /**
   * Returns true if the current update is a snapshot.
   */
  SnapshotManager.prototype.isSnapshot = function() {
      if (! this.snapshotRequested()) {
          // r1
          return false;
          
      } else if (Constants.MERGE == this.subscription._mode) {
          // r6, r7
          return this.firstUpdate;
          
      } else if (Constants.COMMAND == this.subscription._mode || Constants.DISTINCT == this.subscription._mode) {
          // r2, r3, r4, r5
          return ! this.eosReceived;
          
      } else {
          // r8
          // should never happen
          return false;
      }
  }
  
  /*
   * Control states of {@link SnapshotManager}.
   */
  var SnapshotManagerState = {
          NO_UPDATE_RECEIVED: 0,
          ONE_UPDATE_RECEIVED: 1,
          MORE_THAN_ONE_UPDATE_RECEIVED: 2
  };
  
  Subscription.prototype["isActive"] = Subscription.prototype.isActive;
  Subscription.prototype["isSubscribed"] = Subscription.prototype.isSubscribed;
  Subscription.prototype["setItems"] = Subscription.prototype.setItems;
  Subscription.prototype["getItems"] = Subscription.prototype.getItems;
  Subscription.prototype["setItemGroup"] = Subscription.prototype.setItemGroup;
  Subscription.prototype["getItemGroup"] = Subscription.prototype.getItemGroup;
  Subscription.prototype["setFields"] = Subscription.prototype.setFields;
  Subscription.prototype["getFields"] = Subscription.prototype.getFields;
  Subscription.prototype["setFieldSchema"] = Subscription.prototype.setFieldSchema;
  Subscription.prototype["getFieldSchema"] = Subscription.prototype.getFieldSchema;
  Subscription.prototype["getMode"] = Subscription.prototype.getMode;
  Subscription.prototype["setDataAdapter"] = Subscription.prototype.setDataAdapter;
  Subscription.prototype["getDataAdapter"] = Subscription.prototype.getDataAdapter;
  Subscription.prototype["setSelector"] = Subscription.prototype.setSelector;
  Subscription.prototype["getSelector"] = Subscription.prototype.getSelector;
  Subscription.prototype["setRequestedMaxFrequency"] = Subscription.prototype.setRequestedMaxFrequency;
  Subscription.prototype["getRequestedMaxFrequency"] = Subscription.prototype.getRequestedMaxFrequency;
  Subscription.prototype["setRequestedBufferSize"] = Subscription.prototype.setRequestedBufferSize;
  Subscription.prototype["getRequestedBufferSize"] = Subscription.prototype.getRequestedBufferSize;
  Subscription.prototype["setRequestedSnapshot"] = Subscription.prototype.setRequestedSnapshot;
  Subscription.prototype["getRequestedSnapshot"] = Subscription.prototype.getRequestedSnapshot;
  Subscription.prototype["setCommandSecondLevelFields"] = Subscription.prototype.setCommandSecondLevelFields;
  Subscription.prototype["getCommandSecondLevelFields"] = Subscription.prototype.getCommandSecondLevelFields;
  Subscription.prototype["setCommandSecondLevelFieldSchema"] = Subscription.prototype.setCommandSecondLevelFieldSchema;
  Subscription.prototype["getCommandSecondLevelFieldSchema"] = Subscription.prototype.getCommandSecondLevelFieldSchema;
  Subscription.prototype["setCommandSecondLevelDataAdapter"] = Subscription.prototype.setCommandSecondLevelDataAdapter;
  Subscription.prototype["getCommandSecondLevelDataAdapter"] = Subscription.prototype.getCommandSecondLevelDataAdapter;
  Subscription.prototype["getValue"] = Subscription.prototype.getValue;
  Subscription.prototype["getCommandValue"] = Subscription.prototype.getCommandValue;
  Subscription.prototype["getKeyPosition"] = Subscription.prototype.getKeyPosition;
  Subscription.prototype["getCommandPosition"] = Subscription.prototype.getCommandPosition;
  Subscription.prototype["addListener"] = Subscription.prototype.addListener;
  Subscription.prototype["removeListener"] = Subscription.prototype.removeListener;
  Subscription.prototype["getListeners"] = Subscription.prototype.getListeners;
  
  Inheritance(Subscription,EventDispatcher,false,true);
  Inheritance(Subscription,Setter,true,true);
  return Subscription;
})();
  

