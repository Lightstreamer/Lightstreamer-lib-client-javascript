/*
 * Copyright (C) 2012 Lightstreamer Srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import LoggerManager from "../../src-log/LoggerManager";
import IllegalArgumentException from "../../src-tool/IllegalArgumentException";
import Constants from "../Constants";
  

   var actionsLogger = LoggerManager.getLoggerProxy(Constants.ACTIONS);
   
   
   /**
    * Used by the client library to provide a value object to each call of the 
    * {@link SubscriptionListener#onItemUpdate} event.
    * @constructor
    * 
    * @exports ItemUpdate
    * @class Contains all the information related to an update of the field values 
    * for an item. It reports all the new values of the fields.
    * <BR>
    * <BR>
    * <B>COMMAND Subscription</B><BR>
    * If the involved Subscription is a COMMAND Subscription, then the values for 
    * the current update are meant as relative to the same key.
    * <BR>Moreover, if the involved Subscription has a two-level behavior enabled,
    * then each update may be associated with either a first-level or a second-level 
    * item. In this case, the reported fields are always the union of the first-level 
    * and second-level fields and each single update can only change either the 
    * first-level or the second-level fields (but for the "command" field, which is 
    * first-level and is always set to "UPDATE" upon a second-level update); note 
    * that the second-level field values are always null until the first second-level
    * update occurs).
    * When the two-level behavior is enabled, in all methods where a field name
    * has to be supplied, the following convention should be followed:
    * <ul>
    * <li>
    * The field name can always be used, both for the first-level and the second-level 
    * fields. In case of name conflict, the first-level field is meant. 
    * </li>
    * <li>
    * The field position can always be used; however, the field positions for 
    * the second-level fields start at the highest position of the first-level 
    * field list + 1. If a field schema had been specified for either first-level or 
    * second-level Subscriptions, then client-side knowledge of the first-level schema 
    * length would be required.
    * </li>
    * </ul>
    */
   var ItemUpdate = function() {
     
     // function(itemName, itemPos, fieldDescriptor, _isSnapshot, updateValues)
     
     //need to use arguments array to avoid documenting parameters in the public jsdocs
     /**
      * @private
      */
     this.itemPos = arguments[1];
     /**
      * @private
      */
     this.itemName = arguments[0];
     /**
      * @private
      */
     this._isSnapshot = arguments[3];
     /**
      * @private
      */
     this.fieldDescriptor = arguments[2];
     /**
      * @private
      */
     this.updateValues = arguments[4];
   };
   
   ItemUpdate.prototype = {
       
       /**  
        * Inquiry method that retrieves the name of the item to which this update 
        * pertains.
        * <BR>The name will be null if the related Subscription was initialized
        * using an "Item Group".
        * 
        * @return {String} the name of the item to which this update pertains.
        * 
        * @see Subscription#setItemGroup
        * @see Subscription#setItems
        */
       getItemName: function() {
         return this.itemName;
       },
       
       /**  
        * Inquiry method that retrieves the position in the "Item List" or "Item Group"
        * of the item to which this update pertains.
        * 
        * @return {Number} the 1-based position of the item to which this update pertains.
        * 
        * @see Subscription#setItemGroup
        * @see Subscription#setItems
        */
       getItemPos: function() {
         return this.itemPos;
       },
       
       /**
        * Inquiry method that gets the value for a specified field, as received 
        * from the Server with the current or previous update.
        * 
        * @throws {IllegalArgumentException} if the specified field is not
        * part of the Subscription.
        * 
        * @param {String} fieldNameOrPos The field name or the 1-based position of the field
        * within the "Field List" or "Field Schema".
        * 
        * @return {String} The value of the specified field; it can be null in the following 
        * cases:
        * <ul>
        * <li>a null value has been received from the Server, as null is a 
        * possible value for a field;</li>
        * <li>no value has been received for the field yet;</li>
        * <li>the item is subscribed to with the COMMAND mode and a DELETE command 
        * is received (only the fields used to carry key and command information 
        * are valued).</li>
        * </ul>
        * 
        * @see Subscription#setFieldSchema
        * @see Subscription#setFields
        */
       getValue: function(fieldNameOrPos) {
         var arrPos = this.toPos(fieldNameOrPos);
         var el = this.updateValues[arrPos];
         if (el && el.isUnchanged) {
           return el.value;
         }
         return el;
       },
       
       /**
        * Inquiry method that asks whether the value for a field has changed after 
        * the reception of the last update from the Server for an item.
        * If the Subscription mode is COMMAND then the change is meant as 
        * relative to the same key.
        * 
        * @param {String} fieldNameOrPos The field name or the 1-based position of the field
        * within the field list or field schema.
        * 
        * @return {boolean} Unless the Subscription mode is COMMAND, the return value is true 
        * in the following cases:
        * <ul>
        * <li>It is the first update for the item;</li>
        * <li>the new field value is different than the previous field value received 
        * for the item.</li>
        * </ul>
        * If the Subscription mode is COMMAND, the return value is true in the 
        * following cases:
        * <ul>
        * <li>it is the first update for the involved key value 
        * (i.e. the event carries an "ADD" command);</li>
        * <li>the new field value is different than the previous field value 
        * received for the item, relative to the same key value (the event 
        * must carry an "UPDATE" command);</li>
        * <li>the event carries a "DELETE" command (this applies to all fields 
        * other than the field used to carry key information).</li>
        * </ul>
        * In all other cases, the return value is false.
        * 
        * @throws {IllegalArgumentException} if the specified field is not
        * part of the Subscription.
        */
       isValueChanged: function(fieldNameOrPos) {
         var arrPos = this.toPos(fieldNameOrPos);
         return !this.updateValues.unchangedMap[arrPos];
       },
       
       /**
        * Inquiry method that asks whether the current update belongs to the 
        * item snapshot (which carries the current item state at the time of 
        * Subscription). Snapshot events are sent only if snapshot information
        * was requested for the items through {@link Subscription#setRequestedSnapshot}
        * and precede the real time events. 
        * Snapshot information take different forms in different subscription
        * modes and can be spanned across zero, one or several update events. 
        * In particular:
        * <ul>
        * <li>if the item is subscribed to with the RAW subscription mode, 
        * then no snapshot is sent by the Server;</li>
        * <li>if the item is subscribed to with the MERGE subscription mode, 
        * then the snapshot consists of exactly one event, carrying the current 
        * value for all fields;</li>
        * <li>if the item is subscribed to with the DISTINCT subscription mode, then
        * the snapshot consists of some of the most recent updates; these updates 
        * are as many as specified through 
        * {@link Subscription#setRequestedSnapshot}, unless fewer are available;</li>
        * <li>if the item is subscribed to with the COMMAND subscription mode, 
        * then the snapshot consists of an "ADD" event for each key that is 
        * currently present.</li>
        * </ul>
        * Note that, in case of two-level behavior, snapshot-related updates 
        * for both the first-level item (which is in COMMAND mode) and any 
        * second-level items (which are in MERGE mode) are qualified with this flag.
        * 
        * @return {boolean} true if the current update event belongs to the item snapshot; 
        * false otherwise.
        */
       isSnapshot: function() {
         return this._isSnapshot;
       },
       
       
       
       /**
        * Receives an iterator function and invokes it once per each field 
        * changed with the last server update. 
        * <BR>Note that if the Subscription mode of the involved Subscription is 
        * COMMAND, then changed fields are meant as relative to the previous update 
        * for the same key. On such tables if a DELETE command is received, all the 
        * fields, excluding the key field, will be iterated as changed, with null value. All of this 
        * is also true on tables that have the two-level behavior enabled, but in 
        * case of DELETE commands second-level fields will not be iterated. 
        * <BR>Note that the iterator is executed before this method returns.
        * 
        * @param {ItemUpdateChangedFieldCallback} iterator Function instance that will be called once 
        * per each field changed on the last update received from the server. 
        */
       forEachChangedField: function(iterator) {
         var ch = this.updateValues.changedFields;
         for (var i = 0; i < ch.length; i++) {
           var name = this.fieldDescriptor.getName(ch[i]); 
           var newV = this.updateValues[ch[i] + 1];
           
           try {
             iterator(name,ch[i],newV);
           } catch(_e) {
             actionsLogger.logErrorExc(_e,"An exception was thrown while executing the Function passed to the forEachChangedField method");
           }
           
         }
       },
       
       /**
        * Receives an iterator function and invokes it once per each field 
        * in the Subscription. 
        * <BR>Note that the iterator is executed before this method returns.
        * 
        * @param {ItemUpdateChangedFieldCallback} iterator Function instance that will be called once 
        * per each field in the Subscription. 
        */
       forEachField: function(iterator) {
         for (var i = 2; i < this.updateValues.length; i++) {
           
           var fieldPos = i-1;
           var name = this.fieldDescriptor.getName(fieldPos);
           var newV = this.updateValues[i];
           
           try {
             iterator(name,fieldPos,newV);
           } catch(_e) {
             actionsLogger.logErrorExc(_e,"An exception was thrown while executing the Function passed to the forEachField method");
           }
           
         }
       },
       
       /**
        * @private
        */
       /*private*/ toPos: function(fieldNameOrPos) {
         var arrPos = (isNaN(fieldNameOrPos) ? this.fieldDescriptor.getPos(fieldNameOrPos) : fieldNameOrPos);
         
         if (arrPos == null) {
           throw new IllegalArgumentException( "the specified field does not exist");
           
         } else if (arrPos <= 0 || arrPos > this.fieldDescriptor.getFullSize()+1) {
           throw new IllegalArgumentException("the specified field position is out of bounds");
           
         }
         
         //need to shift because before the updates in the array we have table and item.
         //table is shifted by the fact that the array index starts from 0 not from 1, item is shifted via the +1
         return arrPos+1; 
         
       },
       /**
        * @private
        */
       /*internal*/ extract: function() {
         return this.updateValues;
       },
       
       //I need this method to keep compatibility with the flash bridge
       /**
        * @private
        */
       /*internal*/ getNumFields: function() {
         return this.updateValues.length - 2;
       },
       
       //I need this method to keep compatibility with the flash bridge
       /**
        * @private
        */
       /*internal*/ getFieldName: function(pos) {
         return this.fieldDescriptor.getName(pos);
       }
           
   };
   
   ItemUpdate.prototype["getItemName"] = ItemUpdate.prototype.getItemName;
   ItemUpdate.prototype["getItemPos"] = ItemUpdate.prototype.getItemPos;
   ItemUpdate.prototype["getValue"] = ItemUpdate.prototype.getValue;
   ItemUpdate.prototype["isValueChanged"] = ItemUpdate.prototype.isValueChanged;
   ItemUpdate.prototype["isSnapshot"] = ItemUpdate.prototype.isSnapshot;
   ItemUpdate.prototype["forEachChangedField"] = ItemUpdate.prototype.forEachChangedField;
   ItemUpdate.prototype["forEachField"] = ItemUpdate.prototype.forEachField;

   export default ItemUpdate;
   
   /**
    * Callback for {@link ItemUpdate#forEachChangedField} and {@link ItemUpdate#forEachField} 
    * @callback ItemUpdateChangedFieldCallback
    * @param {String} fieldName of the involved changed field. If the related Subscription was
    * initialized using a "Field Schema" it will be null.
    * @param {Number} fieldPos 1-based position of the field within
    * the "Field List" or "Field Schema".
    * @param {String} value the value for the field. See {@link ItemUpdate#getValue} for details.
    */
   