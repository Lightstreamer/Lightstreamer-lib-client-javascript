/**
 * This is an abstract class; no instances of this class should be created.
 * @constructor
 *
 * @exports AbstractGrid
 * @class The base class for the hierarchy of the *Grid classes.
 * Extends {@link AbstractWidget} to abstract a representation of the
 * internal tabular model as a visible grid made of HTML elements.
 * A specialized (derived) object, rather than an AbstractGrid instance, should
 * be created and used. Two of such classes are available with the library:
 * {@link StaticGrid} and {@link DynaGrid}.
 * This class is used by the mentioned specialized grid objects to inherit the
 * support for their basic configurations and common utilities.
 * <BR>The class is not meant as a base class for the creation of custom grids.
 * The class constructor and its prototype should never be used directly.
 *
 * @extends AbstractWidget
 */
export class AbstractGrid extends AbstractWidget {
    constructor();
    /**
     * Setter method that enables or disables the interpretation of the
     * values in the model as HTML code.
     * For instance, if the value "&lt;a href='news03.htm'&gt;Click here&lt;/a&gt;"
     * is placed in the internal model (either by manual call of the
     * {@link AbstractWidget#updateRow} method or by listening on a
     * {@link SubscriptionListener#onItemUpdate} event)
     * and HTML interpretation is enabled, then the target cell
     * will contain a link; otherwise it will contain that bare text.
     * Note that the setting applies to all the cells in the associated grid.
     * Anyway if it's not the content of a cell that is going to be updated,
     * but one of its properties, then this setting is irrelevant for such cell.
     * <BR>WARNING: When turning HTML interpretation on, make sure that
     * no malicious code may reach the internal model (for example
     * through the injection of undesired JavaScript code from the Data Adapter).
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this setting can be changed at any time.
     * <BR>Note that values that have already been placed in the grid cells will not
     * be updated to reflect the new setting.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     * @throws {IllegalArgumentException} if the given value is not a valid
     * boolean value.
     *
     * @param {boolean} enable true/false to enable/disable HTML interpretation
     * for the pushed values.
     */
    setHtmlInterpretationEnabled(enable: boolean): void;
    /**
     * Inquiry method that gets the type of interpretation to be applied for
     * the pushed values for this grid. In fact, the values can be
     * put in the target cells as HTML code or as text.
     *
     * @return {boolean} true if pushed values are interpreted as HTML code, false
     * otherwise.
     *
     * @see AbstractGrid#setHtmlInterpretationEnabled
     */
    isHtmlInterpretationEnabled(): boolean;
    /**
     * Setter method that specifies a list of HTML element types to be searched for
     * during the mapping of the grid to the HTML made by {@link AbstractGrid#parseHtml}.
     *
     * <p class="default-value"><b>Default value:</b> an array containing DIV SPAN and INPUT.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Node types can be specified at any time.
     * However, if the list is changed after the execution of the {@link AbstractGrid#parseHtml}
     * method then it will not be used until a new call to such method is performed.
     * </p>
     *
     * @param {String[]} nodeTypes an array of Strings representing the names of the node
     * types to be searched for. If the array contains an asterisk (*) then all the
     * node types will be checked.
     *
     * @see AbstractGrid#parseHtml
     */
    setNodeTypes(nodeTypes: String[]): void;
    /**
     * Inquiry method that gets the list of node of types that would be searched
     * in case of a call to {@link AbstractGrid#parseHtml}.
     *
     * @return {String[]} a list of node type names.
     *
     * @see AbstractGrid#setNodeTypes
     */
    getNodeTypes(): String[];
    /**
     * Setter method that decides whenever new rows entering the model will be
     * placed at the top of the grid or at the bottom.
     * <BR>Note that if the sort is enabled on the Grid through {@link AbstractGrid#setSort}
     * then this setting is ignored as new rows will be placed on their right
     * position based on the sort configuration.
     * <BR>Also note that the sort/add policy may be ignored depending on the grid
     * configuration; see the use of the "data-item" cell attribute in {@link StaticGrid}.
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this setting can be changed at any time.
     * <BR>Note anyway that changing this setting while the internal model
     * is not empty may result in a incosistent view.</p>
     *
     * @throws {IllegalArgumentException} if the given value is not a valid
     * boolean value.
     *
     * @param {boolean} isAddOnTop true/false to place new rows entering the model
     * as the first/last row of the grid.
     */
    setAddOnTop(isAddOnTop: boolean): void;
    /**
     * Inquiry method that gets true/false depending on how new rows
     * entering the grid are treated. If true is returned, new rows will be placed on top of
     * the grid. Viceversa, if false is returned, new rows are placed at the
     * bottom.
     *
     * @return {boolean} true if new rows are added on top, false otherwise.
     *
     * @see AbstractGrid#setAddOnTop
     */
    isAddOnTop(): boolean;
    /**
     * Setter method that configures the sort policy of the grid. If no
     * sorting policy is set, new rows are always added according with the
     * {@link AbstractGrid#setAddOnTop} setting.
     * If, on the other hand, sorting is enabled, then new
     * rows are positioned according to the sort criteria.
     * Sorting is also maintained upon update of an existing row; this may cause the row to be
     * repositioned.
     * <BR>If asynchronous row repositioning is undesired, it is possible to
     * set the sort and immediately disable it with two consecutive calls
     * to just enforce grid sorting based on the current contents.
     * <BR>The sort can also be performed on fields that are part of the model
     * but not part of the grid view.
     * <BR>Note that the sort/add policy may be ignored depending on the grid
     * configuration; see the use of the "data-item" cell attribute in {@link StaticGrid}.
     *
     * <p class="default-value"><b>Default value:</b> no sort is performed.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The sort configuration can be set and changed
     * at any time.</p>
     *
     * @throws {IllegalArgumentException} if one of the boolean parameters is neither
     * missing, null, nor a valid boolean value.
     *
     * @param {String} sortField The name of the field to be used as sort field,
     * or null to disable sorting.
     * @param {boolean} [descendingSort=false] true or false to perform descending or
     * ascending sort. This parameter is optional; if missing or null,
     * then ascending sort is performed.
     * @param {boolean} [numericSort=false] true or false to perform numeric or
     * alphabetical sort. This parameter is optional; if missing or null, then
     * alphabetical sort is performed.
     * @param {boolean} [commaAsDecimalSeparator=false] true to specify that sort
     * field values are decimal numbers in which the decimal separator is
     * a comma; false to specify it is a dot. This setting is used only if
     * numericSort is true, in which case it is optional, with false as its
     * default value.
     */
    setSort(sortField: string, descendingSort?: boolean, numericSort?: boolean, commaAsDecimalSeparator?: boolean): void;
    /**
     * Inquiry method that gets the name of the field currently used as sort
     * field, if available.
     *
     * @return {Number} The name of a field, or null if sorting is not currently
     * enabled.
     *
     * @see AbstractGrid#setSort
     */
    getSortField(): number;
    /**
     * Inquiry method that gets the sort direction currently configured.
     *
     * @return {boolean} true if descending sort is being performed, false if ascending
     * sort is, or null if sorting is not currently enabled.
     *
     * @see AbstractGrid#setSort
     */
    isDescendingSort(): boolean;
    /**
     * Inquiry method that gets the type of sort currently configured.
     *
     * @return {boolean} true if numeric sort is being performed, false if alphabetical
     * sort is, or null if sorting is not currently enabled.
     *
     * @see AbstractGrid#setSort
     */
    isNumericSort(): boolean;
    /**
     * Inquiry method that gets the type of interpretation to be used to
     * parse the sort field values in order to perform numeric sort.
     *
     * @return {boolean} true if comma is the decimal separator, false if it is a dot;
     * returns null if sorting is not currently enabled or numeric sorting
     * is not currently configured.
     *
     * @see AbstractGrid#setSort
     */
    isCommaAsDecimalSeparator(): boolean;
    /**
     * Creates an array containing all the unique values of the "data-field"
     * properties in all of the HTML elements associated to this grid during the
     * {@link AbstractGrid#parseHtml} execution. The result of this method is supposed to be
     * used as "Field List" of a Subscription.
     * <BR>Execution of this method is pointless if HTML elements associated to this
     * grid specify a field position instead of a field name in their "data-field"
     * property.
     * <BR>Note that elements specifying the "data-fieldtype" property set to "extra" or "second-level",
     * will be ignored by this method. This permits to distinguish fields that are part
     * of the main subscription (not specifying any "data-fieldtype" or specifying "first-level"), part of a
     * second-level Subscription (specifying "second-level") and not part of a Subscription at all,
     * but still manageable in a direct way (specifying "extra").
     *
     * @return {String[]} The list of unique values found in the "data-field" properties
     * of HTML element of this grid.
     *
     * @see Subscription#setFields
     */
    extractFieldList(): String[];
    /**
     * Creates an array containing all the unique values, of the "data-field" properties
     * in all of the HTML elements, having the "data-fieldtype" property set to "second-level",
     * associated to this grid during the {@link AbstractGrid#parseHtml} execution.
     * <BR>The result of this method is supposed to be
     * used as "Field List" of a second-level Subscription.
     * <BR>Execution of this method is pointless if HTML elements associated to this
     * grid specify a field position instead of a field name in their "data-field"
     * property.
     *
     * @return {String[]} The list of unique values found in the "data-field" properties
     * of HTML element of this grid.
     *
     * @see AbstractGrid#extractFieldList
     * @see Subscription#setCommandSecondLevelFields
     */
    extractCommandSecondLevelFieldList(): String[];
    /**
     * Operation method that is used to authorize and execute the binding of the
     * widget with the HTML of the page.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called once the HTML structure
     * the instance is expecting to find are ready in the DOM.
     * That said, it can be invoked at any time and subsequent invocations will update
     * the binding to the current state of the page DOM. Anyway, newly found cells
     * will be left empty until the next update involving them.</p>
     *
     * @see Chart
     * @see DynaGrid
     * @see StaticGrid
     */
    parseHtml(): void;
    /**
     * Operation method that is used to force the choice of what to use
     * as key for the integration in the internal model, when receiving
     * an update from a Subscription this grid is listening to.
     * <BR>Specifying "ITEM_IS_KEY" tells the widget to use the item as key;
     * this is the behavior that is already the default one when the Subscription
     * is in "MERGE" or "RAW" mode (see {@link AbstractWidget} for details).
     * <BR>Specifying "UPDATE_IS_KEY" tells the widget to use a progressive number
     * as key; this is the behavior that is already the default one when the
     * Subscription is in "DISTINCT" mode (see {@link AbstractWidget} for details).
     * <BR>Note that when listening to different Subscriptions the default behavior
     * is set when the grid is added as listener for the first one and then applied
     * to all the others regardless of their mode.
     *
     * <p class="lifecycle"><b>Lifecycle:</b>this method can only be called
     * while the internal model is empty.</p>
     *
     * @throws {IllegalArgumentException} if the given value is not valid.
     * @throws {IllegalStateException} if called while the grid is not empty.
     *
     * @param {String} interpretation either "ITEM_IS_KEY" or "UPDATE_IS_KEY",
     * or null to restore the default behavior.
     */
    forceSubscriptionInterpretation(interpretation: string): void;
    /**
     * Event handler that is called by Lightstreamer each time an update
     * pertaining to an item in the Subscription has been received from the
     * Server.
     *
     * @param {ItemUpdate} updateInfo a value object containing the
     * updated values for all the fields, together with meta-information about
     * the update itself and some helper methods that can be used to iterate through
     * all or new values.
     */
    onItemUpdate(updateInfo: ItemUpdate): void;
    /**
     * Event handler that is called by Lightstreamer each time a request
     * to clear the snapshot pertaining to an item in the Subscription has been
     * received from the Server.
     * More precisely, this kind of request can occur in two cases:
     * <ul>
     * <li>For an item delivered in COMMAND mode, to notify that the state
     * of the item becomes empty; this is equivalent to receiving an update
     * carrying a DELETE command once for each key that is currently active.</li>
     * <li>For an item delivered in DISTINCT mode, to notify that all the
     * previous updates received for the item should be considered as obsolete;
     * hence, if the listener were showing a list of recent updates for the
     * item, it should clear the list in order to keep a coherent view.</li>
     * </ul>
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled,
     * the notification refers to the first-level item (which is in COMMAND mode).
     * This kind of notification is not possible for second-level items (which are in
     * MERGE mode).
     * <BR/>This event can be sent by the Lightstreamer Server since version 6.0
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     */
    onClearSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully subscribed to through the Server.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     * <BR>This notification is always issued before the other ones related
     * to the same subscription. It invalidates all data that has been received
     * previously.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onSubscription event is fired an onUnsubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level subscriptions are not notified.
     */
    onSubscription(): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully unsubscribed from.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     *
     * <BR>After this notification no more events can be recieved until a new
     * {@link SubscriptionListener#onSubscription} event.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onUnsubscription event is fired an onSubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level unsubscriptions are not notified.
     */
    onUnsubscription(): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is added to a Subscription through
     * {@link Subscription#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was added to.
     */
    onListenStart(subscription: Subscription): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is removed from a Subscription through
     * {@link Subscription#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was removed from.
     */
    onListenEnd(subscription: Subscription): void;
    /**
     * Removes a row from the internal model and reflects the change on the view.
     * If no row associated with the given key is found nothing is done.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be removed.
     */
    removeRow(key: string): void;
    /**
     * Updates a row in the internal model and reflects the change on the view.
     * If no row associated with the given key is found then a new row is
     * created.
     * <BR>Example usage:
     * <BR><code>myWidget.updateRow("key1", {field1:"val1",field2:"val2"});</code>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time. If called while an updateRow on the same
     * internal model is still executing (e.g. if called while handling an onVisualUpdate
     * callback), then the new update:
     * <ul>
     * <li>if pertaining to a different key and/or if called on a {@link Chart} instance,
     * will be postponed until the first updateRow execution terminates;</li>
     * <li>if pertaining to the same key and if called on a {@link StaticGrid} / {@link DynaGrid}
     * instance, will be merged with the current one.</li>
     * </ul>
     * </p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be updated/added.
     * @param {Object} newValues A JavaScript object containing name/value pairs
     * to fill the row in the mode.
     * <BR>Note that the internal model does not have a fixed number of fields;
     * each update can add new fields to the model by simply specifying them.
     * Also, an update having fewer fields than the current model will have its
     * missing fields considered as unchanged.
     */
    updateRow(key: string, newValues: any): void;
    /**
     * Removes all the rows from the model and reflects the change on the view.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     */
    clean(): void;
    /**
     * Returns the value from the model for the specified key/field pair.
     * If the row for the specified key does not exist or if the specified field
     * is not available in the row then null is returned.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {String} key The key associated with the row to be read.
     * @param {String} field The field to be read from the row.
     *
     * @return {String} The current value for the specified field of the specified row,
     * possibly null. If the value for the specified field has never been
     * assigned in the model, the method also returns null.
     */
    getValue(key: string, field: string): string;
    /**
     * Utility method that can be used to control part of the behavior of
     * the widget in case it is used as a listener for one or more
     * {@link Subscription} instances.
     * <BR>Specifying the two flags it is possible to decide to clean the model and
     * view based on the status (subscribed or not) of the Subscriptions this
     * instance is listening to.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {boolean} onFirstSubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and an
     * onSubscription is fired by one of such Subscriptions.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and this
     * instance starts listening to a new Subscription that is already in the
     * subscribed status, then it will be considered as if an onSubscription
     * event was fired and thus a clean() call will be performed.
     *
     * @param {boolean} onLastUnsubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and the
     * onUnsubscription for such Subscription is fired.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and
     * this instance stops listening to such Subscription then it will be
     * considered as if the onUnsubscription event for that Subscription was fired
     * and thus a clean() call will be performed.
     *
     * @see Subscription#isSubscribed
     */
    setAutoCleanBehavior(onFirstSubscribe: boolean, onLastUnsubscribe: boolean): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item in the Subscription. Such notifications are sent only
     * if the items are delivered in an unfiltered mode; this occurs if the
     * subscription mode is:
     * <ul>
     * <li>RAW</li>
     * <li>MERGE or DISTINCT, with unfiltered dispatching specified</li>
     * <li>COMMAND, with unfiltered dispatching specified</li>
     * <li>COMMAND, without unfiltered dispatching specified (in this case,
     * notifications apply to ADD and DELETE events only)</li>
     * </ul>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     *
     * @see Subscription#setRequestedMaxFrequency
     */
    onItemLostUpdates(itemName: string, itemPos: number, lostUpdates: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item that was subscribed to as a second-level subscription.
     * Such notifications are sent only if the Subscription was configured in
     * unfiltered mode (second-level items are always in "MERGE" mode and
     * inherit the frequency configuration from the first-level Subscription).
     * <BR>By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     * @param {String} key The value of the key that identifies the
     * second-level item.
     *
     * @see Subscription#setRequestedMaxFrequency
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelItemLostUpdates(lostUpdates: number, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify that all
     * snapshot events for an item in the Subscription have been received,
     * so that real time events are now going to be received. The received
     * snapshot could be empty.
     * Such notifications are sent only if the items are delivered in
     * DISTINCT or COMMAND subscription mode and snapshot information was
     * indeed requested for the items.
     * By implementing this method it is possible to perform actions which
     * require that all the initial values have been received.
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled, the notification
     * refers to the first-level item (which is in COMMAND mode).
     * Snapshot-related updates for the second-level items (which are in
     * MERGE mode) can be received both before and after this notification.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     *
     * @see Subscription#setRequestedSnapshot
     * @see ItemUpdate#isSnapshot
     */
    onEndOfSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called when the Server notifies an error on a Subscription. By implementing this method it
     * is possible to perform recovery actions. <BR>
     * Note that, in order to perform a new subscription attempt, {@link LightstreamerClient#unsubscribe}
     * and {@link LightstreamerClient#subscribe} should be issued again, even if no change to the Subscription
     * attributes has been applied.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>15 - "key" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>16 - "command" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>25 - bad Selector name</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>29 - RAW mode is not allowed by the current license terms (for special licenses only)</li>
     *          <li>30 - subscriptions are not allowed by the current license terms (for special licenses only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     * @param {String} message The description of the error sent by the Server;
     * it can be null.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    onSubscriptionError(code: number, message: string): void;
    /**
     * Event handler that is called when the Server notifies an error on a second-level subscription. <BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>14 - the key value is not a valid name for the Item to be subscribed; only in this case, the error
     *              is detected directly by the library before issuing the actual request to the Server</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     *
     * @param {String} message The description of the error sent by the Server; it can be null.
     * @param {String} key The value of the key that identifies the second-level item.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelSubscriptionError(code: number, message: string, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify the client with the real maximum update frequency of the Subscription.
     * It is called immediately after the Subscription is established and in response to a requested change
     * (see {@link Subscription#setRequestedMaxFrequency}).
     * Since the frequency limit is applied on an item basis and a Subscription can involve multiple items,
     * this is actually the maximum frequency among all items. For Subscriptions with two-level behavior
     * (see {@link Subscription#setCommandSecondLevelFields} and {@link Subscription#setCommandSecondLevelFieldSchema})
     * , the reported frequency limit applies to both first-level and second-level items. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * but also because of number rounding. <BR>
     * Note that a maximum update frequency (that is, a non-unlimited one) may be applied by the Server
     * even when the subscription mode is RAW or the Subscription was done with unfiltered dispatching.
     *
     * @param {String} frequency  A decimal number, representing the maximum frequency applied by the Server
     * (expressed in updates per second), or the string "unlimited". A null value is possible in rare cases,
     * when the frequency can no longer be determined.
     */
    onRealMaxFrequency(frequency: string): void;
}

/**
 * This is an abstract class; no instances of this class should be created.
 * @constructor
 *
 * @exports AbstractWidget
 * @class The base class for the hierarchy of the provided widgets. It is an
 * abstract class representing a view on a set of tabular data, which is supposed
 * to be some sort of HTML visualization widget. Each row in the tabular model is associated with a key.
 * <BR>The class offers some management methods to modify/poll the model behind
 * the view but also implements the {@link SubscriptionListener} interface to be
 * automatically fed by listening on a {@link Subscription}.
 * <BR>When listening for Subscription events the widget will choose what to use
 * as key for its model based on the Subscription mode of the first Subscription
 * it was added to as a listener:
 * <ul>
 * <li>If the Subscription mode is MERGE or RAW, the widget will use the item as key:
 * each subscribed item will generate a row in the model. The key name will be
 * the item name when available, otherwise the 1-based item position within the
 * Subscription.</li>
 * <li>If the Subscription mode is COMMAND, the widget will use the value of the
 * "key" field as key: each row in the COMMAND subscription will generate a row
 * in the model. More precisely, the key value will be expressed as "&lt;item&gt; &lt;key&gt;"
 * where &lt;item&gt; is the item name when available, otherwise the 1-based item position
 * within the Subscription.
 * <BR>Note that this behavior is naturally extended to two-level subscriptions.</li>
 * <li>If the Subscription mode is DISTINCT, the widget will use a progressive
 * number as key: each update will generate a row in the model.</li>
 * </ul>
 * For each update received, all the included fields will be integrated into
 * the row related to the update key. The field name will be the one specified on
 * the related Subscription, when available; otherwise, it will be the 1-based field
 * position within the related Subscription.
 * <BR>Note that if the Subscription contains the same item name or field name multiple
 * times, their updates will not be distinguished in the model and the last value
 * processed by the library for that name will be assigned to the model.
 * You should ensure that item name or field name collisions cannot occur if the
 * colliding names are used to represent different entities; for instance, this holds for
 * collisions between first-level and second-level fields in a two-level Subscription.
 * Collisions are also possible if the widget is added as a listener to
 * other Subscription instances. In this case, also note that the new updates will be
 * processed and integrated in the model in the way already determined for the first
 * Subscription associated; so, you should ensure that the various Subscriptions yield
 * compatible updates.
 * <BR>For each {@link SubscriptionListener#onClearSnapshot} event received from any
 * of the Subscription the widget is listening to, all the rows internally associated
 * to the cleared item are removed. In case of collisions between different items feeding
 * the same row the row will be considered pertaining to the first item that fed it.
 * <BR>
 * <BR>Note that methods from the SubscriptionListener should not be called by
 * custom code.
 * <BR>Note that before any change to the internal model can be made, and
 * thus before an instance of this class can be used as listener for a
 * Subscription, the {@link AbstractWidget#parseHtml} method has to be called to prepare the view.
 * <BR>The class is not meant as a base class for the creation of custom widgets.
 * The class constructor and its prototype should never be used directly.
 *
 * @extends SubscriptionListener
 *
 * @see Chart
 * @see AbstractGrid
 */
export class AbstractWidget extends SubscriptionListener {
    constructor();
    /**
     * Removes a row from the internal model and reflects the change on the view.
     * If no row associated with the given key is found nothing is done.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be removed.
     */
    removeRow(key: string): void;
    /**
     * Updates a row in the internal model and reflects the change on the view.
     * If no row associated with the given key is found then a new row is
     * created.
     * <BR>Example usage:
     * <BR><code>myWidget.updateRow("key1", {field1:"val1",field2:"val2"});</code>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time. If called while an updateRow on the same
     * internal model is still executing (e.g. if called while handling an onVisualUpdate
     * callback), then the new update:
     * <ul>
     * <li>if pertaining to a different key and/or if called on a {@link Chart} instance,
     * will be postponed until the first updateRow execution terminates;</li>
     * <li>if pertaining to the same key and if called on a {@link StaticGrid} / {@link DynaGrid}
     * instance, will be merged with the current one.</li>
     * </ul>
     * </p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be updated/added.
     * @param {Object} newValues A JavaScript object containing name/value pairs
     * to fill the row in the mode.
     * <BR>Note that the internal model does not have a fixed number of fields;
     * each update can add new fields to the model by simply specifying them.
     * Also, an update having fewer fields than the current model will have its
     * missing fields considered as unchanged.
     */
    updateRow(key: string, newValues: any): void;
    /**
     * Removes all the rows from the model and reflects the change on the view.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     */
    clean(): void;
    /**
     * Returns the value from the model for the specified key/field pair.
     * If the row for the specified key does not exist or if the specified field
     * is not available in the row then null is returned.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {String} key The key associated with the row to be read.
     * @param {String} field The field to be read from the row.
     *
     * @return {String} The current value for the specified field of the specified row,
     * possibly null. If the value for the specified field has never been
     * assigned in the model, the method also returns null.
     */
    getValue(key: string, field: string): string;
    /**
     * Utility method that can be used to control part of the behavior of
     * the widget in case it is used as a listener for one or more
     * {@link Subscription} instances.
     * <BR>Specifying the two flags it is possible to decide to clean the model and
     * view based on the status (subscribed or not) of the Subscriptions this
     * instance is listening to.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {boolean} onFirstSubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and an
     * onSubscription is fired by one of such Subscriptions.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and this
     * instance starts listening to a new Subscription that is already in the
     * subscribed status, then it will be considered as if an onSubscription
     * event was fired and thus a clean() call will be performed.
     *
     * @param {boolean} onLastUnsubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and the
     * onUnsubscription for such Subscription is fired.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and
     * this instance stops listening to such Subscription then it will be
     * considered as if the onUnsubscription event for that Subscription was fired
     * and thus a clean() call will be performed.
     *
     * @see Subscription#isSubscribed
     */
    setAutoCleanBehavior(onFirstSubscribe: boolean, onLastUnsubscribe: boolean): void;
    /**
     * Abstract method. See subclasses descriptions for details.
     */
    parseHtml(): void;
    /**
     * Event handler that is called by Lightstreamer each time an update
     * pertaining to an item in the Subscription has been received from the
     * Server.
     *
     * @param {ItemUpdate} updateInfo a value object containing the
     * updated values for all the fields, together with meta-information about
     * the update itself and some helper methods that can be used to iterate through
     * all or new values.
     */
    onItemUpdate(updateInfo: ItemUpdate): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item in the Subscription. Such notifications are sent only
     * if the items are delivered in an unfiltered mode; this occurs if the
     * subscription mode is:
     * <ul>
     * <li>RAW</li>
     * <li>MERGE or DISTINCT, with unfiltered dispatching specified</li>
     * <li>COMMAND, with unfiltered dispatching specified</li>
     * <li>COMMAND, without unfiltered dispatching specified (in this case,
     * notifications apply to ADD and DELETE events only)</li>
     * </ul>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     *
     * @see Subscription#setRequestedMaxFrequency
     */
    onItemLostUpdates(itemName: string, itemPos: number, lostUpdates: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item that was subscribed to as a second-level subscription.
     * Such notifications are sent only if the Subscription was configured in
     * unfiltered mode (second-level items are always in "MERGE" mode and
     * inherit the frequency configuration from the first-level Subscription).
     * <BR>By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     * @param {String} key The value of the key that identifies the
     * second-level item.
     *
     * @see Subscription#setRequestedMaxFrequency
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelItemLostUpdates(lostUpdates: number, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify that all
     * snapshot events for an item in the Subscription have been received,
     * so that real time events are now going to be received. The received
     * snapshot could be empty.
     * Such notifications are sent only if the items are delivered in
     * DISTINCT or COMMAND subscription mode and snapshot information was
     * indeed requested for the items.
     * By implementing this method it is possible to perform actions which
     * require that all the initial values have been received.
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled, the notification
     * refers to the first-level item (which is in COMMAND mode).
     * Snapshot-related updates for the second-level items (which are in
     * MERGE mode) can be received both before and after this notification.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     *
     * @see Subscription#setRequestedSnapshot
     * @see ItemUpdate#isSnapshot
     */
    onEndOfSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer each time a request
     * to clear the snapshot pertaining to an item in the Subscription has been
     * received from the Server.
     * More precisely, this kind of request can occur in two cases:
     * <ul>
     * <li>For an item delivered in COMMAND mode, to notify that the state
     * of the item becomes empty; this is equivalent to receiving an update
     * carrying a DELETE command once for each key that is currently active.</li>
     * <li>For an item delivered in DISTINCT mode, to notify that all the
     * previous updates received for the item should be considered as obsolete;
     * hence, if the listener were showing a list of recent updates for the
     * item, it should clear the list in order to keep a coherent view.</li>
     * </ul>
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled,
     * the notification refers to the first-level item (which is in COMMAND mode).
     * This kind of notification is not possible for second-level items (which are in
     * MERGE mode).
     * <BR/>This event can be sent by the Lightstreamer Server since version 6.0
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     */
    onClearSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully subscribed to through the Server.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     * <BR>This notification is always issued before the other ones related
     * to the same subscription. It invalidates all data that has been received
     * previously.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onSubscription event is fired an onUnsubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level subscriptions are not notified.
     */
    onSubscription(): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully unsubscribed from.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     *
     * <BR>After this notification no more events can be recieved until a new
     * {@link SubscriptionListener#onSubscription} event.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onUnsubscription event is fired an onSubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level unsubscriptions are not notified.
     */
    onUnsubscription(): void;
    /**
     * Event handler that is called when the Server notifies an error on a Subscription. By implementing this method it
     * is possible to perform recovery actions. <BR>
     * Note that, in order to perform a new subscription attempt, {@link LightstreamerClient#unsubscribe}
     * and {@link LightstreamerClient#subscribe} should be issued again, even if no change to the Subscription
     * attributes has been applied.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>15 - "key" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>16 - "command" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>25 - bad Selector name</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>29 - RAW mode is not allowed by the current license terms (for special licenses only)</li>
     *          <li>30 - subscriptions are not allowed by the current license terms (for special licenses only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     * @param {String} message The description of the error sent by the Server;
     * it can be null.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    onSubscriptionError(code: number, message: string): void;
    /**
     * Event handler that is called when the Server notifies an error on a second-level subscription. <BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>14 - the key value is not a valid name for the Item to be subscribed; only in this case, the error
     *              is detected directly by the library before issuing the actual request to the Server</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     *
     * @param {String} message The description of the error sent by the Server; it can be null.
     * @param {String} key The value of the key that identifies the second-level item.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelSubscriptionError(code: number, message: string, key: string): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is added to a Subscription through
     * {@link Subscription#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was added to.
     */
    onListenStart(subscription: Subscription): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is removed from a Subscription through
     * {@link Subscription#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was removed from.
     */
    onListenEnd(subscription: Subscription): void;
    /**
     * Event handler that is called by Lightstreamer to notify the client with the real maximum update frequency of the Subscription.
     * It is called immediately after the Subscription is established and in response to a requested change
     * (see {@link Subscription#setRequestedMaxFrequency}).
     * Since the frequency limit is applied on an item basis and a Subscription can involve multiple items,
     * this is actually the maximum frequency among all items. For Subscriptions with two-level behavior
     * (see {@link Subscription#setCommandSecondLevelFields} and {@link Subscription#setCommandSecondLevelFieldSchema})
     * , the reported frequency limit applies to both first-level and second-level items. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * but also because of number rounding. <BR>
     * Note that a maximum update frequency (that is, a non-unlimited one) may be applied by the Server
     * even when the subscription mode is RAW or the Subscription was done with unfiltered dispatching.
     *
     * @param {String} frequency  A decimal number, representing the maximum frequency applied by the Server
     * (expressed in updates per second), or the string "unlimited". A null value is possible in rare cases,
     * when the frequency can no longer be determined.
     */
    onRealMaxFrequency(frequency: string): void;
}

/**
 * Constructor for AlertAppender.
 * @constructor
 *
 * @param {String} level The threshold level at which the SimpleLogAppender is created.
 * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not
 * or wrongly specified INFO is assumed.
 * @param {String} category The category this appender should listen to.
 * If not specified the appender will get log for every available category.
 * See {@link SimpleLogAppender#setCategoryFilter}.
 * @param {Number} dim Number of log messages to wait before sending a cumulative alert.
 * This parameter is optional, if lower than 1 or no value is passed, 5 is assumed.
 *
 * @exports AlertAppender
 * @class AlertAppender extends SimpleLogAppender and implements publishing of log messages
 * by issuing the specific browser alert.
 * AlertAppender instance objects can be configured with a window dimension, so as to wait
 * for the specified number of messages before sending an alert.
 *
 * @extends SimpleLogAppender
 */
export class AlertAppender extends SimpleLogAppender {
    constructor(level: string, category: string, dim: number);
    /**
     * Add a log message in a AlertAppender private instance. If the accumulated messages exceed the
     * limit a show alert function is called.
     *
     * @param {String} category the logger category that produced the given message.
     * @param {String} level the logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL.
     * @param {String} mex the message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     * @param {String} header a header for the message
     */
    log(category: string, level: string, mex: string, header: string): void;
    /**
     * Called by SimpleLoggerProvider to notify itself to a newly added appender.
     * @param {SimpleLoggerProvider} loggerProvider the SimpleLoggerProvider instance handling this appender.
     */
    setLoggerProvider(loggerProvider: SimpleLoggerProvider): void;
    /**
     * Utility method that can be used by subclasses to join various info in a single line.
     * The message will be composed this way:  category + " | " + level + " | " + header + " | " + mex
     * @protected
     * @param {String} category the message category
     * @param {String} level the message level
     * @param {String} mex the message itself
     * @param {String} header a custom header
     * @returns {String}
     */
    protected composeLine(category: string, level: string, mex: string, header: string): string;
    /**
     * Inquiry method that returns the current threshold level of this SimpleLogAppender
     * instance.
     *
     * @return {String} the level of this SimpleLogAppender instance.
     * It will be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL".
     */
    getLevel(): string;
    /**
     * Setter method that changes the current threshold level of this
     * SimpleLogAppender instance.
     * The filter can be changed at any time and will affect subsequent log lines
     *
     * @param {String} [level] The new level for this SimpleLogAppender instance.
     * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not or wrongly
     * specified INFO will be used.
     */
    setLevel(level?: string): void;
    /**
     * Inquiry method that returns the category for this SimpleLogAppender instance.
     * A SimpleLogAppender only receives log lines from the {@link Logger}
     * associated to the returned category, unless
     * "*" is returned, in which case it receives log from all loggers.
     *
     * @return {String} The category of this SimpleLogAppender instance, or "*".
     */
    getCategoryFilter(): string;
    /**
     * Setter method that changes the current category of this
     * SimpleLogAppender instance.
     * <br/>This SimpleLogAppender will only receive log lines from the {@link Logger}
     * associated to the specified category, unless
     * "*" is specified, in which case it will receive log from all loggers.
     * <br/>the filter can be changed at any time and will affect subsequent log lines.
     *
     * @param {String} [category] the new category for this SimpleLogAppender, or "*".
     * If not specified "*" is assumed
     */
    setCategoryFilter(category?: string): void;
}

/**
 * Constructor for BufferAppender.
 * @constructor
 *
 * @param {String} level The threshold level at which the SimpleLogAppender is created.
 * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not
 * or wrongly specified INFO is assumed.
 * @param {String} category The category this appender should listen to.
 * If not specified the appender will get log for every available category.
 * See {@link SimpleLogAppender#setCategoryFilter}.
 * @param {Number} size The maximum number of log messages stored in the internal buffer.
 * If 0 or no value is passed, unlimited is assumed.
 *
 * @exports BufferAppender
 * @class BufferAppender extends SimpleLogAppender and implements an internal buffer
 * store for log messages. The messages can be extracted from the buffer when needed.
 * The buffer size can be limited or unlimited. If limited it is implemented as
 * a FIFO queue.
 *
 * @extends SimpleLogAppender
 */
export class BufferAppender extends SimpleLogAppender {
    constructor(level: string, category: string, size: number);
    /**
     * Operation method that resets the buffer making it empty.
     */
    reset(): void;
    /**
     * Retrieve log messages from the buffer.
     * The extracted messages are then removed from the internal buffer.
     *
     * @param {String} [sep] separator string between the log messages in the result string. If null or not specified "\n" is used.
     *
     * @return {String} a concatenated string of all the log messages that have been retrieved.
     */
    extractLog(sep?: string): string;
    /**
     * Retrieve log messages from the buffer.
     * The extracted messages are NOT removed from the internal buffer.
     *
     * @param {Number} [maxRows] the number of log lines to be retrieved. If not specified all the available lines are retrieved.
     * @param {String} [sep] separator string between the log messages in the result string. If not specified "\n" is used.
     * @param {String} [level] the level of the log to be retrieved.
     *
     * @return {String} a concatenated string of all the log messages that have been retrieved.
     */
    getLog(maxRows?: number, sep?: string, level?: string): string;
    /**
     * Add a log message in the internal buffer.
     *
     * @param {String} category the logger category that produced the given message.
     * @param {String} level the logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL.
     * @param {String} mex the message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     * @param {String} header a header for the message
     */
    log(category: string, level: string, mex: string, header: string): void;
    /**
     * Gets the number of buffered lines
     * @returns {Number} the number of buffered lines
     */
    getLength(): number;
    /**
     * Called by SimpleLoggerProvider to notify itself to a newly added appender.
     * @param {SimpleLoggerProvider} loggerProvider the SimpleLoggerProvider instance handling this appender.
     */
    setLoggerProvider(loggerProvider: SimpleLoggerProvider): void;
    /**
     * Utility method that can be used by subclasses to join various info in a single line.
     * The message will be composed this way:  category + " | " + level + " | " + header + " | " + mex
     * @protected
     * @param {String} category the message category
     * @param {String} level the message level
     * @param {String} mex the message itself
     * @param {String} header a custom header
     * @returns {String}
     */
    protected composeLine(category: string, level: string, mex: string, header: string): string;
    /**
     * Inquiry method that returns the current threshold level of this SimpleLogAppender
     * instance.
     *
     * @return {String} the level of this SimpleLogAppender instance.
     * It will be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL".
     */
    getLevel(): string;
    /**
     * Setter method that changes the current threshold level of this
     * SimpleLogAppender instance.
     * The filter can be changed at any time and will affect subsequent log lines
     *
     * @param {String} [level] The new level for this SimpleLogAppender instance.
     * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not or wrongly
     * specified INFO will be used.
     */
    setLevel(level?: string): void;
    /**
     * Inquiry method that returns the category for this SimpleLogAppender instance.
     * A SimpleLogAppender only receives log lines from the {@link Logger}
     * associated to the returned category, unless
     * "*" is returned, in which case it receives log from all loggers.
     *
     * @return {String} The category of this SimpleLogAppender instance, or "*".
     */
    getCategoryFilter(): string;
    /**
     * Setter method that changes the current category of this
     * SimpleLogAppender instance.
     * <br/>This SimpleLogAppender will only receive log lines from the {@link Logger}
     * associated to the specified category, unless
     * "*" is specified, in which case it will receive log from all loggers.
     * <br/>the filter can be changed at any time and will affect subsequent log lines.
     *
     * @param {String} [category] the new category for this SimpleLogAppender, or "*".
     * If not specified "*" is assumed
     */
    setCategoryFilter(category?: string): void;
}

/**
 * Callback for {@link Chart#setXAxis} and {@link Chart#addYAxis}
 * @callback CustomParserFunction
 * @param {String} fieldValue the field value to be parsed.
 * @param {String} key the key associated with the given value
 * @return {Number} a valid number to be plotted or null if the value has to be considered unchanged
 */
declare type CustomParserFunction = (fieldValue: string, key: string) => number;

/**
 * Callback for {@link Chart#setXLabels} and {@link ChartLine#setYLabels}
 * @callback LabelsFormatter
 * @param {Number} value the value to be formatted before being print in a label.
 * @return {String} the String to be set as content for the label.
 */
declare type LabelsFormatter = (value: number) => string;

/**
 * Creates an object that extends {@link AbstractWidget} displaying its values
 * as a multiline chart.
 * <BR>Note that the {@link AbstractWidget#parseHtml} method is automatically called by this
 * constructor, hence the container element should have already been prepared on the page DOM.
 * However, preparing the element later and then invoking {@link AbstractWidget#parseHtml}
 * manually is also supported.
 * @constructor
 *
 * @param {String} id The HTML "id" attribute of a DOM Element to which the chart will be attached.
 *
 * @exports Chart
 * @class A widget displaying the data from its model as a multiline chart.
 * As with all the classes extending {@link AbstractWidget} the internal model
 * can be automatically updated by listening to one or more {@link Subscription}
 * instances.
 * <BR>In short, once both X and Y axis have been associated to a field through
 * {@link Chart#setXAxis} and {@link Chart#addYAxis},
 * each row in the model will be represented as a line in the chart,
 * connecting all the X,Y points corresponding to the subsequent values assumed
 * by the related fields and dynamically extending with new values. Actually,
 * it is possible to associate more fields to the Y axis so that it is possible to
 * have more than one line per row.
 * <BR>According to the axis settings, every time a row enters the model,
 * one or more lines will be added to the chart and corresponding instances of
 * {@link ChartLine} will be generated
 * and passed to the {@link ChartListener#onNewLine} event to be better
 * configured.
 * <BR>The behavior of the underlying model is described in {@link AbstractWidget},
 * but there is one exception: if this instance is used to listen to events from
 * {@link Subscription} instance(s), and the first Subscription it listens to is
 * a DISTINCT Subscription, then the base behavior is overridden and the same
 * behavior defined for MERGE and RAW modes is adopted.
 * <BR>
 * <BR>Note that, in order to create a chart, the X axis should be associated
 * with a field whose values are increasing. Anyway for both X and Y axis
 * the used value must be a numeric value. If the original field values are not
 * compliant with such restriction, they can be customized before being used by
 * means of a parser Function.
 * <BR>Also, even if the Chart instance is listening to {@link Subscription} events,
 * it is not mandatory to use server-sent fields to plot the chart.
 * <BR>The multiline chart for the visualization of model values is
 * dynamically maintained by an instance of this class inside a container HTML
 * element.
 * The container element must be prepared on the page in the form of any HTML
 * element owning the "data-source='Lightstreamer'" special attribute, together
 * with an HTML "id" attribute that has to be specified in the constructor of this class.
 *
 * @extends AbstractWidget
 */
export class Chart extends AbstractWidget {
    constructor(id: string);
    /**
     * This method is automatically called by the constructor of this class.
     * It will bind the current instance with the HTML element having the id
     * specified in the constructor.
     */
    parseHtml(): void;
    /**
     * Setter method that sets the stylesheet and positioning to be applied to
     * the chart area.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The chart area stylesheet and position attributes
     * can be set and changed at any time.</p>
     *
     * @throws {IllegalArgumentException} if one of the numeric values is not
     * valid.
     *
     * @param {String} [chartCss] the name of an existing stylesheet to be applied to
     * the chart. If not set, the stylesheet is inherited from
     * the DOM element containing the chart.
     *
     * @param {Number} [chartHeight] the height in pixels of the chart area.
     * Such height may be set as smaller than the height of the container
     * HTML element in order to make room for the X axis labels. If not set,
     * the whole height of the container HTML element is used.
     *
     * @param {Number} [chartWidth] the width in pixels of the chart area.
     * Such width may be set as smaller than the width of the container HTML
     * element in order to make room for the Y axis labels. If not set,
     * the whole width of the container HTML element is used.
     *
     * @param {Number} [chartTop=0] the distance in pixels between the top margin of the
     * chart area and the top margin of the container HTML element.
     * Such distance may be set as a nonzero value in order to make room for
     * the first Y axis label. If not set, 0 is used.
     *
     * @param {Number} [chartLeft=0] the distance in pixels between the left margin of
     * the chart area and the left margin of the container HTML element.
     * Such distance may be set as a nonzero value in order to make room for the
     * Y axis labels. If not set, 0 is used.
     */
    configureArea(chartCss?: string, chartHeight?: number, chartWidth?: number, chartTop?: number, chartLeft?: number): void;
    /**
     * Setter method that sets the field to be used as the source of the
     * X-coordinate for each update. An optional parser can be passed to normalize
     * the value before it is used to plot the chart.
     * The resulting values should be in the limits posed by the
     * {@link Chart#positionXAxis} method, otherwise a
     * {@link ChartListener#onXOverflow} event is fired to handle the situation.
     * null can also be specified, in which case, if the associated Y value is null
     * the chart will be cleared, otherwise the update will be ignored.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The X axis field can be set at any time.
     * Until set, no chart will be printed. If already set, the new setting only
     * affects the new points while all the previously plotted points are cleaned.</p>
     *
     * @param {String} field A field name representing the X axis.
     * @param {CustomParserFunction} [xParser] A parser function that can be used to normalize
     * the value of the X field before using it to plot the chart.
     * If the function is not supplied,
     * then the field values should represent valid numbers in JavaScript or be null.
     */
    setXAxis(field: string, xParser?: CustomParserFunction): void;
    /**
     * Adds field(s) to be used as the source of the Y-coordinate for each update
     * An optional parser can be passed to normalize the value before it is used to
     * plot the chart.
     * The resulting values should be in the limits posed by the
     * {@link ChartLine#positionYAxis} related to the involved line, otherwise a
     * {@link ChartListener#onYOverflow} event is fired to handle the situation.
     * null can also be specified, in which case, if the associated X value is null
     * the chart line will be cleared, otherwise the update will be ignored.
     * <BR>It is possible to specify an array of fields instead of specifying a
     * single field. If that's the case multiple chart lines will be generated
     * per each row in the model.
     * <BR>Note that for each field in the underlying model it is possible to associate
     * only one line. If multiple lines based on the same fields are needed, dedicated
     * fields should be added to the model, through {@link AbstractWidget#updateRow}.
     * In case this instance is used to listen to events from {@link Subscription}
     * instance(s), updateRow() can be invoked from within {@link SubscriptionListener#onItemUpdate}.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method can be invoked at any time, in order to
     * add fields to be plotted or in order to change the parser associated to
     * fields already being plotted.
     * Until invoked for the first time, no chart will be printed.</p>
     *
     * @param {String} field A field name representing the Y axis. An array
     * of field names can also be passed. Each field will generate its own line.
     * @param {(CustomParserFunction|CustomParserFunction[])} [yParser] A parser function that can be used to normalize
     * the value of the Y field before using it to plot the chart.
     * If the function
     * is not supplied, then the field values should represent valid numbers in JavaScript or be null.
     * <BR>If an array has been specified for the field parameter, then an array of parser functions can
     * also be passed. Each parser will be executed on the field having the same index
     * in the array. On the other hand, if an array of fields is passed but only one
     * parser has been specified, then the parser will be applied to all of the fields.
     *
     * @see Chart#removeYAxis
     */
    addYAxis(field: string, yParser?: CustomParserFunction | CustomParserFunction[]): void;
    /**
     * Removes field(s) currently used as the source of the Y-coordinate for each update
     * and all the related {@link ChartLine}.
     * <BR>It is possible to specify an array of fields instead of specifying a
     * single field. If that's the case all the specified fields and related chart lines
     * will be removed.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method can be invoked at any time, in order to
     * remove plotted fields.</p>
     *
     * @param {String} field A field name representing the Y axis. An array
     * of field names can also be passed.
     *
     * @see Chart#addYAxis
     */
    removeYAxis(field: string): void;
    /**
     * Operation method that sets or changes the limits for the visible part
     * of the X axis of the chart (that is, the minimum and maximum X-coordinates
     * shown in the chart).
     * If these limits are changed while the internal model is not empty
     * then this causes a repaint of the whole chart.
     * <BR>Note that rising the minimum X value shown also clears from
     * the memory all the points whose X value becomes lower. So, those points
     * will not be displayed again after lowering again the minimum X value.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The X axis limits can be set at any time.</p>
     *
     * @throws {IllegalArgumentException} if the min parameter is greater
     * than the max one.
     *
     * @param {Number} min lower limit for the visible part of the X axis.
     * @param {Number} max higher limit for the visible part of the X axis.
     */
    positionXAxis(min: number, max: number): void;
    /**
     * Setter method that configures the legend for the X axis. The legend
     * consists of a specified number of labels for the values in the X axis.
     * The labels values are determined based on the axis limits; the labels
     * appearance is controlled by supplying a stylesheet and a formatter
     * function.
     * <BR>Note that the room for the X axis labels on the page is not provided
     * by the library; it should be provided by specifying a chart height
     * smaller than the container element height, through the
     * {@link Chart#configureArea} setting. Moreover, as the first and last labels
     * are centered on the chart area borders, a suitable space should be
     * provided also on the left and right of the chart area, through the
     * same method.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Labels can be configured at any time.
     * If not set, no labels are displayed relative to the X axis.</p>
     *
     * @throws {IllegalArgumentException} if labelsNum is not a valid
     * poisitive integer number.
     *
     * @param {Number} labelsNum the number of labels to be spread on the
     * X axis; it should be 1 or greater.
     * @param {String} [labelsClass] the name of an existing stylesheet, to be
     * applied to the X axis label HTML elements. The parameter is optional;
     * if missing or null, then no specific stylesheet will be applied.
     * @param {LabelsFormatter} [labelsFormatter] a Function instance
     * used to format the X axis values designated for the labels.
     * If the function is not supplied, then the value will be used with no further formatting.
     *
     */
    setXLabels(labelsNum: number, labelsClass?: string, labelsFormatter?: LabelsFormatter): void;
    /**
     * Adds a listener that will receive events from the Chart
     * instance.
     * <BR>The same listener can be added to several different Chart
     * instances.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
     *
     * @param {ChartListener} listener An object that will receive the events
     * as shown in the {@link ChartListener} interface.
     * <BR>Note that the given instance does not have to implement all of the
     * methods of the ChartListener interface. In fact it may also
     * implement none of the interface methods and still be considered a valid
     * listener. In the latter case it will obviously receive no events.
     */
    addListener(listener: ChartListener): void;
    /**
     * Removes a listener from the Chart instance so that it
     * will not receive events anymore.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     *
     * @param {ChartListener} listener The listener to be removed.
     */
    removeListener(listener: ChartListener): void;
    /**
     * Returns an array containing the {@link ChartListener} instances that
     * were added to this client.
     *
     * @return {ChartListener[]} an array containing the listeners that were added to this instance.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners(): ChartListener[];
    /**
     * Event handler that is called by Lightstreamer each time an update
     * pertaining to an item in the Subscription has been received from the
     * Server.
     *
     * @param {ItemUpdate} updateInfo a value object containing the
     * updated values for all the fields, together with meta-information about
     * the update itself and some helper methods that can be used to iterate through
     * all or new values.
     */
    onItemUpdate(updateInfo: ItemUpdate): void;
    /**
     * Event handler that is called by Lightstreamer each time a request
     * to clear the snapshot pertaining to an item in the Subscription has been
     * received from the Server.
     * More precisely, this kind of request can occur in two cases:
     * <ul>
     * <li>For an item delivered in COMMAND mode, to notify that the state
     * of the item becomes empty; this is equivalent to receiving an update
     * carrying a DELETE command once for each key that is currently active.</li>
     * <li>For an item delivered in DISTINCT mode, to notify that all the
     * previous updates received for the item should be considered as obsolete;
     * hence, if the listener were showing a list of recent updates for the
     * item, it should clear the list in order to keep a coherent view.</li>
     * </ul>
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled,
     * the notification refers to the first-level item (which is in COMMAND mode).
     * This kind of notification is not possible for second-level items (which are in
     * MERGE mode).
     * <BR/>This event can be sent by the Lightstreamer Server since version 6.0
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     */
    onClearSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully subscribed to through the Server.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     * <BR>This notification is always issued before the other ones related
     * to the same subscription. It invalidates all data that has been received
     * previously.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onSubscription event is fired an onUnsubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level subscriptions are not notified.
     */
    onSubscription(): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully unsubscribed from.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     *
     * <BR>After this notification no more events can be recieved until a new
     * {@link SubscriptionListener#onSubscription} event.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onUnsubscription event is fired an onSubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level unsubscriptions are not notified.
     */
    onUnsubscription(): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is added to a Subscription through
     * {@link Subscription#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was added to.
     */
    onListenStart(subscription: Subscription): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is removed from a Subscription through
     * {@link Subscription#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was removed from.
     */
    onListenEnd(subscription: Subscription): void;
    /**
     * Removes a row from the internal model and reflects the change on the view.
     * If no row associated with the given key is found nothing is done.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be removed.
     */
    removeRow(key: string): void;
    /**
     * Updates a row in the internal model and reflects the change on the view.
     * If no row associated with the given key is found then a new row is
     * created.
     * <BR>Example usage:
     * <BR><code>myWidget.updateRow("key1", {field1:"val1",field2:"val2"});</code>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time. If called while an updateRow on the same
     * internal model is still executing (e.g. if called while handling an onVisualUpdate
     * callback), then the new update:
     * <ul>
     * <li>if pertaining to a different key and/or if called on a {@link Chart} instance,
     * will be postponed until the first updateRow execution terminates;</li>
     * <li>if pertaining to the same key and if called on a {@link StaticGrid} / {@link DynaGrid}
     * instance, will be merged with the current one.</li>
     * </ul>
     * </p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be updated/added.
     * @param {Object} newValues A JavaScript object containing name/value pairs
     * to fill the row in the mode.
     * <BR>Note that the internal model does not have a fixed number of fields;
     * each update can add new fields to the model by simply specifying them.
     * Also, an update having fewer fields than the current model will have its
     * missing fields considered as unchanged.
     */
    updateRow(key: string, newValues: any): void;
    /**
     * Removes all the rows from the model and reflects the change on the view.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     */
    clean(): void;
    /**
     * Returns the value from the model for the specified key/field pair.
     * If the row for the specified key does not exist or if the specified field
     * is not available in the row then null is returned.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {String} key The key associated with the row to be read.
     * @param {String} field The field to be read from the row.
     *
     * @return {String} The current value for the specified field of the specified row,
     * possibly null. If the value for the specified field has never been
     * assigned in the model, the method also returns null.
     */
    getValue(key: string, field: string): string;
    /**
     * Utility method that can be used to control part of the behavior of
     * the widget in case it is used as a listener for one or more
     * {@link Subscription} instances.
     * <BR>Specifying the two flags it is possible to decide to clean the model and
     * view based on the status (subscribed or not) of the Subscriptions this
     * instance is listening to.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {boolean} onFirstSubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and an
     * onSubscription is fired by one of such Subscriptions.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and this
     * instance starts listening to a new Subscription that is already in the
     * subscribed status, then it will be considered as if an onSubscription
     * event was fired and thus a clean() call will be performed.
     *
     * @param {boolean} onLastUnsubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and the
     * onUnsubscription for such Subscription is fired.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and
     * this instance stops listening to such Subscription then it will be
     * considered as if the onUnsubscription event for that Subscription was fired
     * and thus a clean() call will be performed.
     *
     * @see Subscription#isSubscribed
     */
    setAutoCleanBehavior(onFirstSubscribe: boolean, onLastUnsubscribe: boolean): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item in the Subscription. Such notifications are sent only
     * if the items are delivered in an unfiltered mode; this occurs if the
     * subscription mode is:
     * <ul>
     * <li>RAW</li>
     * <li>MERGE or DISTINCT, with unfiltered dispatching specified</li>
     * <li>COMMAND, with unfiltered dispatching specified</li>
     * <li>COMMAND, without unfiltered dispatching specified (in this case,
     * notifications apply to ADD and DELETE events only)</li>
     * </ul>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     *
     * @see Subscription#setRequestedMaxFrequency
     */
    onItemLostUpdates(itemName: string, itemPos: number, lostUpdates: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item that was subscribed to as a second-level subscription.
     * Such notifications are sent only if the Subscription was configured in
     * unfiltered mode (second-level items are always in "MERGE" mode and
     * inherit the frequency configuration from the first-level Subscription).
     * <BR>By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     * @param {String} key The value of the key that identifies the
     * second-level item.
     *
     * @see Subscription#setRequestedMaxFrequency
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelItemLostUpdates(lostUpdates: number, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify that all
     * snapshot events for an item in the Subscription have been received,
     * so that real time events are now going to be received. The received
     * snapshot could be empty.
     * Such notifications are sent only if the items are delivered in
     * DISTINCT or COMMAND subscription mode and snapshot information was
     * indeed requested for the items.
     * By implementing this method it is possible to perform actions which
     * require that all the initial values have been received.
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled, the notification
     * refers to the first-level item (which is in COMMAND mode).
     * Snapshot-related updates for the second-level items (which are in
     * MERGE mode) can be received both before and after this notification.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     *
     * @see Subscription#setRequestedSnapshot
     * @see ItemUpdate#isSnapshot
     */
    onEndOfSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called when the Server notifies an error on a Subscription. By implementing this method it
     * is possible to perform recovery actions. <BR>
     * Note that, in order to perform a new subscription attempt, {@link LightstreamerClient#unsubscribe}
     * and {@link LightstreamerClient#subscribe} should be issued again, even if no change to the Subscription
     * attributes has been applied.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>15 - "key" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>16 - "command" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>25 - bad Selector name</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>29 - RAW mode is not allowed by the current license terms (for special licenses only)</li>
     *          <li>30 - subscriptions are not allowed by the current license terms (for special licenses only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     * @param {String} message The description of the error sent by the Server;
     * it can be null.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    onSubscriptionError(code: number, message: string): void;
    /**
     * Event handler that is called when the Server notifies an error on a second-level subscription. <BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>14 - the key value is not a valid name for the Item to be subscribed; only in this case, the error
     *              is detected directly by the library before issuing the actual request to the Server</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     *
     * @param {String} message The description of the error sent by the Server; it can be null.
     * @param {String} key The value of the key that identifies the second-level item.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelSubscriptionError(code: number, message: string, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify the client with the real maximum update frequency of the Subscription.
     * It is called immediately after the Subscription is established and in response to a requested change
     * (see {@link Subscription#setRequestedMaxFrequency}).
     * Since the frequency limit is applied on an item basis and a Subscription can involve multiple items,
     * this is actually the maximum frequency among all items. For Subscriptions with two-level behavior
     * (see {@link Subscription#setCommandSecondLevelFields} and {@link Subscription#setCommandSecondLevelFieldSchema})
     * , the reported frequency limit applies to both first-level and second-level items. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * but also because of number rounding. <BR>
     * Note that a maximum update frequency (that is, a non-unlimited one) may be applied by the Server
     * even when the subscription mode is RAW or the Subscription was done with unfiltered dispatching.
     *
     * @param {String} frequency  A decimal number, representing the maximum frequency applied by the Server
     * (expressed in updates per second), or the string "unlimited". A null value is possible in rare cases,
     * when the frequency can no longer be determined.
     */
    onRealMaxFrequency(frequency: string): void;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports ChartListener
 * @class Interface to be implemented to listen to {@link Chart} events
 * comprehending notifications of chart overflow and new line creations.
 * <BR>Events for this listeners are executed synchronously with respect to the code
 * that generates them.
 * <BR>Note that it is not necessary to implement all of the interface methods for
 * the listener to be successfully passed to the {@link Chart#addListener}
 * method.
 * <BR>A ready made implementation of ChartListener providing basic functionalities
 * is distributed with the library: {@link SimpleChartListener}.
 */
export class ChartListener {
    constructor();
    /**
     * Event handler that is called each time that, due to an update to the internal
     * model of the {@link Chart} this instance is listening to, a new
     * {@link ChartLine} is being generated and displayed.
     * By implementing this method, it is possible to configure the appearance
     * of the new line.
     * <BR>A new line can be generated only when a new row enters the
     * model. Moreover, based on the configuration of {@link Chart#addYAxis} a new
     * row in the model may generate more than one line resulting in this event being
     * fired more than one time for a single update.
     *
     * @param {String} key The key associated with the row that caused the line
     * of this event to be generated (keys are described in {@link AbstractWidget}).
     * @param {ChartLine} newChartLine The object representing the new line that has
     * been generated.
     * @param {Number} currentX The X-coordinate of the first point of the line
     * of this event.
     * @param {Number} currentY The Y-coordinate of the first point of the line
     * of this event.
     *
     */
    onNewLine?(key: string, newChartLine: ChartLine, currentX: number, currentY: number): void;
    /**
     * Event handler that is called each time that, due to an update to the internal
     * model of the {@link Chart} this instance is listening to, one of the currently
     * active {@link ChartLine} is being removed.
     *
     * @param {String} key The key associated with the row that was removed causing
     * this event to be fired (keys are described in {@link AbstractWidget}).
     * @param {ChartLine} removedChartLine The object representing the line that has
     * been removed.
     *
     * @see Chart#removeYAxis
     */
    onRemovedLine?(key: string, removedChartLine: ChartLine): void;
    /**
     * Event handler that is called when a new update has been received
     * such that one or more points have to be added to the chart lines,
     * but cannot be shown because their X-coordinate value is higher than
     * the upper limit set for the X axis.
     * By implementing this event handler, the chart axis can be repositioned
     * through {@link Chart#positionXAxis} so that the new points can be shown
     * on the chart.
     * <BR>Note that if a new update is received such that one or more points
     * have to be added to the chart lines but cannot be shown because their
     * X-coordinate value is lower than the lower limit set for the X axis,
     * then this event handler is not called, but rather the new update is
     * ignored. X axis limits should always be set in such a way as to avoid
     * this case.
     *
     * @param {String} key The key associated with the row that during its update
     * made the overflow happen.
     * @param {Number} lastX The X-coordinate value of the new points to be
     * shown on the chart and that exceeds the current upper limit.
     * @param {Number} xMin The current lower limit for the visible part
     * of the X axis.
     * @param {Number} xMax The current upper limit for the visible part
     * of the X axis.
     */
    onXOverflow?(key: string, lastX: number, xMin: number, xMax: number): void;
    /**
     * Event handler that is called when a new update has been received
     * such that a new point for this line has to be added to the chart,
     * but cannot be shown because its Y-coordinate value is higher than
     * the upper limit set for the Y axis on this line, or lower than the
     * lower limit.
     * By implementing this event handler, the line can be repositioned
     * through {@link ChartLine#positionYAxis} so that the new point can be shown
     * on the chart.
     *
     * @param {String} key The key associated with the row that during its update
     * made the overflow happen.
     * @param {ChartLine} toUpdateChartLine The object representing the line that
     * made the overflow happen.
     * @param {Number} lastY The Y-coordinate value of the new point to be
     * shown on the chart and that exceeds the current upper or lower limit.
     * @param {Number} yMin The current lower limit for the visible part
     * of the Y axis.
     * @param {Number} yMax The current upper limit for the visible part
     * of the Y axis.
     */
    onYOverflow?(key: string, toUpdateChartLine: ChartLine, lastY: number, yMin: number, yMax: number): void;
}

/**
 * Used by Lightstreamer to provide a ChartLine object to each call of the
 * {@link ChartListener#onNewLine} event.
 * This constructor is not supposed to be used by custom code.
 * @constructor
 *
 * @exports ChartLine
 * @class Object that describes a single line of a multi-line
 * chart. Instances of this class are automatically generated by a {@link Chart}
 * instance based on the {@link Chart#setXAxis} and {@link Chart#addYAxis}
 * configurations and can be customized during the {@link ChartListener#onNewLine}
 * event.
 */
export class ChartLine {
    constructor();
    /**
     * Setter method that configures the legend for the Y axis. The legend
     * consists of a specified number of labels for the values in the Y axis.
     * The labels values are determined based on the axis limits; the labels
     * appearance is controlled by supplying a stylesheet and a formatter
     * function.
     * <BR>Note that the room for the Y axis labels on the page is not provided
     * by the library; it should be provided by specifying a chart width
     * smaller then the container element width and displaced on the right,
     * through the {@link Chart#configureArea} setting.
     * Moreover, as the upmost and lowest labels are centered on the chart
     * area borders, a little space should be provided also over and under
     * the chart area, through the same method.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Labels can be configured at any time.
     * If not set, no labels are displayed relative to the Y axis.
     * If set for different ChartLine instances on the same Chart
     * then more sets of labels will be printed.</p>
     *
     * @throws {IllegalArgumentException} if labelsNum is not a valid
     * positive integer number.
     *
     * @param {Number} labelsNum the number of labels to be spread on the
     * Y axis; it should be 1 or greater.
     * @param {String} [labelsClass] the name of an existing stylesheet, to be
     * applied to the Y axis label HTML elements. The parameter is optional;
     * if missing or null, then no specific stylesheet is applied.
     * @param {LabelsFormatter} [labelsFormatter] a Function instance
     * used to format the Y axis values designated for the labels.
     * <BR>The function will be invoked with a Number argument and should return a String.
     * If the function is not supplied, then the value will be used with no further formatting.
     */
    setYLabels(labelsNum: number, labelsClass?: string, labelsFormatter?: LabelsFormatter): void;
    /**
     * Setter method that sets the style to be applied to the points
     * drawn on the chart area. Colors of the points,
     * and lines can be customized using valid CSS colors while size is specified
     * in pixels.
     *
     * @throws {IllegalArgumentException} if pointSize or lineSize are not
     * valid positive integer numbers.
     *
     * @param {String} [pointColor=black]the color use to draw the points on the chart.
     * A point is drawn per each new value in the model. Any valid CSS color can
     * be used. By default "black" is used.
     * @param {String} [lineColor=black] the color use to draw the lines on the chart.
     * A line is to connect two consecutive points for the same line.
     * Any valid CSS color can be used. By default "black" is used.
     * @param {Number} [pointSize=1] the size in pixel of the drawn points.
     * By default 1 is used.
     * @param {Number} [lineSize=1] the size in pixel of the drawn lines.
     * By default 1 is used.
     */
    setStyle(pointColor?: string, lineColor?: string, pointSize?: number, lineSize?: number): void;
    /**
     * Operation method that sets or changes the limits for the visible part
     * of the Y axis of the chart (that is, the minimum and maximum Y-coordinates
     * shown in the chart for this line).
     * When these limits are changed a full repaint of the line is performed.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The Y axis limits can be set at any time.</p>
     *
     * @throws {IllegalArgumentException} if the min parameter is greater
     * than the max one.
     *
     * @param {Number} min lower limit for the visible part of the Y axis.
     * @param {Number} max higher limit for the visible part of the Y axis.
     */
    positionYAxis(min: number, max: number): void;
    /**
     * Inquiry method that retrieves the field in the Chart internal model
     * representing the Y axis to which this ChartLine pertains.
     *
     * @return {Number} the field representing the Y axis.
     *
     * @see Chart#addYAxis
     */
    getYField(): number;
}

/**
 * Used by LightstreamerClient to provide a basic connection properties data object.
 * @constructor
 *
 * @exports ConnectionDetails
 * @class Data object that contains the configuration settings needed
 * to connect to a Lightstreamer Server.
 * <BR/>The class constructor, its prototype and any other properties should never
 * be used directly; the library will create ConnectionDetails instances when needed.
 * <BR>Note that all the settings are applied asynchronously; this means that if a
 * CPU consuming task is performed right after the call, the effect of the setting
 * will be delayed.
 *
 * @see LightstreamerClient
 */
export class ConnectionDetails {
    constructor();
    /**
     * Setter method that sets the address of Lightstreamer Server.
    
     * Setting Lightstreamer Server address is not required when the front-end
     * pages are supplied by Lightstreamer Server itself (although this
     * scenario is advised only for demo purpose).
     * On the other hand, the setting should be configured if the front-end pages are
     * served by an external Web server or loaded directly from the file system or
     * the library is not running inside a browser.
     * <BR>When the client application is downloaded from a web server, the configured
     * server address should have the same protocol as the client page itself. If this
     * requirement is not respected, the client, depending on the browser in use,
     * may be unable to open a streaming connection and will try to resort
     * to polling.
    
     * <BR>Note that the addresses specified must always have the http: or https: scheme.
     * In case WebSockets are used, the specified scheme is
     * internally converted to match the related WebSocket protocol
     * (i.e. http becomes ws while https becomes wss).
     *
     * <p class="edition-note"><B>Edition Note:</B> HTTPS is an optional
     * feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
    
     * <p class="default-value"><b>Default value:</b> the address of the server
     * that supplies the library pages if any, null otherwise.</p>
    
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while connected,
     * it will be applied when the next session creation request is issued.
     * <BR>This setting can also be specified in the {@link LightstreamerClient}
     * constructor.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverAddress" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionDetails upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if the given address is not valid.
     *
     * @param {String} serverAddress The full address of Lightstreamer Server.
     * A null value can also be used, to restore the default value.
     * An IPv4 or IPv6 can also be used in place of a hostname, if compatible with
     * the environment in use (see the notes in the summary of this documentation).
     * Some examples of valid values include:
     * <BR>http://push.mycompany.com
     * <BR>http://push.mycompany.com:8080
     * <BR>http://79.125.7.252
     * <BR>http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]
     * <BR>http://[2001:0db8:85a3::8a2e:0370:7334]:8080
     *
     */
    setServerAddress(serverAddress: string): void;
    /**
     * Inquiry method that gets the configured address of Lightstreamer Server.
     *
     * @return {String} the configured address of Lightstreamer Server.
     */
    getServerAddress(): string;
    /**
     * Setter method that sets the name of the Adapter Set mounted on
     * Lightstreamer Server to be used to handle all requests in the session.
     * <BR>An Adapter Set defines the Metadata Adapter and one or several
     * Data Adapters. It is configured on the server side through an
     * "adapters.xml" file; the name is configured through the "id" attribute
     * in the &lt;adapters_conf&gt; element.
     *
     * <p class="default-value"><b>Default value:</b> The default Adapter Set, configured as
     * "DEFAULT" on the Server.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The Adapter Set name should be set on the
     * {@link LightstreamerClient#connectionDetails} object before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next time a new session is
     * requested to the server.
     * <BR>This setting can also be specified in the {@link LightstreamerClient}
     * constructor.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "adapterSet" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionDetails upon
     * which the setter was called
    
     * .</p>
     *
     * @param {String} adapterSet The name of the Adapter Set to be used. A null value
     * is equivalent to the "DEFAULT" name.
     */
    setAdapterSet(adapterSet: string): void;
    /**
     * Inquiry method that gets the name of the Adapter Set (which defines
     * the Metadata Adapter and one or several Data Adapters) mounted on
     * Lightstreamer Server that supply all the items used in this application.
     *
     * @return {String} the name of the Adapter Set; returns null if no name
     * has been configured, so that the "DEFAULT" Adapter Set is used.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    getAdapterSet(): string;
    /**
     * Setter method that sets the username to be used for the authentication
     * on Lightstreamer Server when initiating the push session.
     * The Metadata Adapter is responsible for checking the credentials
     * (username and password).
     *
     * <p class="default-value"><b>Default value:</b> If no username is supplied, no user
     * information will be sent at session initiation. The Metadata Adapter,
     * however, may still allow the session.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The username should be set on the
     * {@link LightstreamerClient#connectionDetails} object before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next time a new session is
     * requested to the server.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "user" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionDetails upon
     * which the setter was called
    
     * .</p>
     *
     * @param {String} user The username to be used for the authentication
     * on Lightstreamer Server. The username can be null.
     *
     * @see ConnectionDetails#setPassword
     */
    setUser(user: string): void;
    /**
     * Inquiry method that gets the username to be used for the authentication
     * on Lightstreamer Server when initiating the push session.
     *
     * @return {String} the username to be used for the authentication
     * on Lightstreamer Server; returns null if no user name
     * has been configured.
     *
     * @see ConnectionDetails#setUser
     */
    getUser(): string;
    /**
     * Setter method that sets the password to be used for the authentication
     * on Lightstreamer Server when initiating the push session.
     * The Metadata Adapter is responsible for checking the credentials
     * (username and password).
     *
     * <p class="default-value"><b>Default value:</b> If no password is supplied, no password
     * information will be sent at session initiation. The Metadata Adapter,
     * however, may still allow the session.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The username should be set on the
     * {@link LightstreamerClient#connectionDetails} object before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next time a new session is
     * requested to the server.
     * <BR><b>NOTE:</b> The password string will be stored as a JavaScript
     * variable.
     * That is necessary in order to allow automatic reconnection/reauthentication
     * for fail-over. For maximum security, avoid using an actual private
     * password to authenticate on Lightstreamer Server; rather use
     * a session-id originated by your web/application server, that can be
     * checked by your Metadata Adapter.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "password" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionDetails upon
     * which the setter was called
    
     * .</p>
     *
     * @param {String} password The password to be used for the authentication
     * on Lightstreamer Server. The password can be null.
     *
     * @see ConnectionDetails#setUser
     */
    setPassword(password: string): void;
    /**
     * Inquiry method that gets the server address to be used to issue all requests
     * related to the current session. In fact, when a Server cluster is in
     * place, the Server address specified through
     * {@link ConnectionDetails#setServerAddress} can identify various Server
     * instances; in order to ensure that all requests related to a session are
     * issued to the same Server instance, the Server can answer to the session
     * opening request by providing an address which uniquely identifies its own
     * instance.
     * When this is the case, this address is returned by the method;
     * otherwise, null is returned.
     * <BR>Note that the addresses will always have the http: or https: scheme.
     * In case WebSockets are used, the specified scheme is
     * internally converted to match the related WebSocket protocol
     * (i.e. http becomes ws while https becomes wss).
     *
     * <p class="edition-note"><B>Edition Note:</B> Server Clustering is
     * an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method gives a meaningful answer only when
     * a session is currently active.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverInstanceAddress" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient that received the setting from the
     * server
    
     * .</p>
     *
     * @return {String} address used to issue all requests related to the current
     * session.
     */
    getServerInstanceAddress(): string;
    /**
     * Inquiry method that gets the instance name of the Server which is
     * serving the current session. To be more precise, each answering port
     * configured on a Server instance (through a &lt;http_server&gt; or
     * &lt;https_server&gt; element in the Server configuration file) can be given
     * a different name; the name related to the port to which the session
     * opening request has been issued is returned.
     * <BR>Note that in case of polling or in case rebind requests are needed,
     * subsequent requests related to the same session may be issued to a port
     * different than the one used for the first request; the names configured
     * for those ports would not be reported. This, however, can only happen
     * when a Server cluster is in place and particular configurations for the
     * load balancer are used.
     *
     * <p class="edition-note"><B>Edition Note:</B> Server Clustering is
     * an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method gives a meaningful answer only when
     * a session is currently active.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverSocketName" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient that received the setting from the
     * server
    
     * .</p>
     *
     * @return {String} name configured for the Server instance which is managing the
     * current session.
     */
    getServerSocketName(): string;
    /**
     * Inquiry method that gets the ID associated by the server
     * to this client session.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The method gives a meaningful answer only when
     * a session is currently active.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "sessionId" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient that received the setting from the
     * server
    
     * .</p>
     *
     * @return {String} ID assigned by the Server to this client session.
     */
    getSessionId(): string;
    /**
     * Inquiry method that gets the IP address of this client as seen by the Server which is serving
     * the current session as the client remote address (note that it may not correspond to the client host;
     * for instance it may refer to an intermediate proxy). If, upon a new session, this address changes,
     * it may be a hint that the intermediary network nodes handling the connection have changed, hence the network
     * capabilities may be different. The library uses this information to optimize the connection. <BR>
     * Note that in case of polling or in case rebind requests are needed, subsequent requests related to the same
     * session may, in principle, expose a different IP address to the Server; these changes would not be reported.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> If a session is not currently active, null is returned;
     * soon after a session is established, the value may become available; but it is possible
     * that this information is not provided by the Server and that it will never be available.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to
     * {@link ClientListener#onPropertyChange} with argument "clientIp" on any
     * ClientListener listening to the related LightstreamerClient.</p>
     *
     * @return {String} A canonical representation of an IP address (it can be either IPv4 or IPv6), or null.
     */
    getClientIp(): string;
}

/**
 * Used by LightstreamerClient to provide an extra connection properties data object.
 * @constructor
 *
 * @exports ConnectionOptions
 * @class Data object that contains the policy settings
 * used to connect to a Lightstreamer Server.
 * <BR/>The class constructor, its prototype and any other properties should never
 * be used directly; the library will create ConnectionOptions instances when needed.
 * <BR>Note that all the settings are applied asynchronously; this means that if a
 * CPU consuming task is performed right after the call the effect of the setting
 * will be delayed.
 *
 * @see LightstreamerClient
 */
export class ConnectionOptions {
    constructor();
    /**
     * Setter method that sets the length in bytes to be used by the Server for the
     * response body on a stream connection (a minimum length, however, is ensured
     * by the server). After the content length exhaustion, the connection will be
     * closed and a new bind connection will be automatically reopened.
     * <BR>NOTE that this setting only applies to the "HTTP-STREAMING" case (i.e. not to WebSockets).
     *
     * <p class="default-value"><b>Default value:</b> A length decided by the library, to ensure
     * the best performance. It can be of a few MB or much higher, depending on the environment.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The content length should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next streaming connection (either a bind
     * or a brand new session).</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "contentLength" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, zero, decimal
     * or a not-number value is passed.
     *
     * @param {Number} contentLength The length to be used by the Server for the
     * response body on a HTTP stream connection.
     */
    setContentLength(contentLength: number): void;
    /**
     * Inquiry method that gets the length expressed in bytes to be used by the Server
     * for the response body on a HTTP stream connection.
     *
     * @return {Number} the length to be used by the Server
     * for the response body on a HTTP stream connection
     */
    getContentLength(): number;
    /**
     * Setter method that sets the maximum time the Server is allowed to wait
     * for any data to be sent in response to a polling request, if none has
     * accumulated at request time. Setting this time to a nonzero value and
     * the polling interval to zero leads to an "asynchronous polling"
     * behaviour, which, on low data rates, is very similar to the streaming
     * case. Setting this time to zero and the polling interval to a nonzero
     * value, on the other hand, leads to a classical "synchronous polling".
     * <BR>Note that the Server may, in some cases, delay the answer for more
     * than the supplied time, to protect itself against a high polling rate or
     * because of bandwidth restrictions. Also, the Server may impose an upper
     * limit on the wait time, in order to be able to check for client-side
     * connection drops.
     *
     * <p class="default-value"><b>Default value:</b> 19000 (19 seconds).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The idle timeout should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next polling request.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "idleTimeout" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative or a decimal
     * or a not-number value is passed.
     *
     * @param {Number} idleTimeout The time (in milliseconds) the Server is
     * allowed to wait for data to send upon polling requests.
     *
     * @see ConnectionOptions#setPollingInterval
     */
    setIdleTimeout(idleTimeout: number): void;
    /**
     * Inquiry method that gets the maximum time the Server is allowed to wait
     * for any data to be sent in response to a polling request, if none has
     * accumulated at request time. The wait time used by the Server, however,
     * may be different, because of server side restrictions.
     *
     * @return {Number} The time (in milliseconds) the Server is allowed to wait for
     * data to send upon polling requests.
     *
     * @see ConnectionOptions#setIdleTimeout
     */
    getIdleTimeout(): number;
    /**
     * Setter method that sets the interval between two keepalive packets
     * to be sent by Lightstreamer Server on a stream connection when
     * no actual data is being transmitted. The Server may, however, impose
     * a lower limit on the keepalive interval, in order to protect itself.
     * Also, the Server may impose an upper limit on the keepalive interval,
     * in order to be able to check for client-side connection drops.
     * If 0 is specified, the interval will be decided by the Server.
     *
     * <p class="default-value"><b>Default value:</b> 0 (meaning that the Server
     * will send keepalive packets based on its own configuration).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The keepalive interval should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next streaming connection (either a bind
     * or a brand new session).
     * <BR>Note that, after a connection,
     * the value may be changed to the one imposed by the Server.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "keepaliveInterval" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called or that received the setting from the
     * server
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative or a decimal
     * or a not-number value is passed.
     *
     * @param {Number} keepaliveInterval The time, expressed in milliseconds,
     * between two keepalive packets, or 0.
     */
    setKeepaliveInterval(keepaliveInterval: number): void;
    /**
     * Inquiry method that gets the interval between two keepalive packets
     * sent by Lightstreamer Server on a stream connection when no actual data
     * is being transmitted.
     * <BR>If the value has just been set and a connection to Lightstreamer
     * Server has not been established yet, the returned value is the time that
     * is being requested to the Server. Afterwards, the returned value is the time
     * used by the Server, that may be different, because of Server side constraints.
     * If the returned value is 0, it means that the interval is to be decided
     * by the Server upon the next connection.
     *
     * @return {Number} The time, expressed in milliseconds, between two keepalive
     * packets sent by the Server, or 0.
     *
     * @see ConnectionOptions#setKeepaliveInterval
     */
    getKeepaliveInterval(): number;
    /**
     * Setter method that sets the maximum bandwidth expressed in kilobits/s that can be consumed for the data coming from
     * Lightstreamer Server. A limit on bandwidth may already be posed by the Metadata Adapter, but the client can
     * furtherly restrict this limit. The limit applies to the bytes received in each streaming or polling connection.
     *
     * <p class="edition-note"><B>Edition Note:</B> Bandwidth Control is
     * an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="default-value"><b>Default value:</b> "unlimited".</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The bandwidth limit can be set and changed at any time. If a connection is currently active, the bandwidth
     * limit for the connection is changed on the fly. Remember that the Server may apply a different limit.
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to
     * {@link ClientListener#onPropertyChange} with argument "requestedMaxBandwidth" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called or that received the setting from the
     * server
    
     * .
     * <BR>
     * Moreover, upon any change or attempt to change the limit, the Server will notify the client
     * and such notification will be received through a call to
     * {@link ClientListener#onPropertyChange} with argument "realMaxBandwidth" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called or that received the setting from the
     * server
    
     * .</p>
     *
     * @param {Number} maxBandwidth A decimal number, which represents the maximum bandwidth requested for the streaming
     * or polling connection expressed in kbps (kilobits/sec). The string "unlimited" is also allowed, to mean that
     * the maximum bandwidth can be entirely decided on the Server side (the check is case insensitive).
     *
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number value (excluding special values) is passed.
     *
     * @see ConnectionOptions#getRealMaxBandwidth
     */
    setRequestedMaxBandwidth(maxBandwidth: number): void;
    /**
     * Inquiry method that gets the maximum bandwidth that can be consumed for the data coming from
     * Lightstreamer Server, as requested for this session.
     * The maximum bandwidth limit really applied by the Server on the session is provided by
     * {@link ConnectionOptions#getRealMaxBandwidth}
     *
     * @return {Number|String} A decimal number, which represents the maximum bandwidth requested for the streaming
     * or polling connection expressed in kbps (kilobits/sec), or the string "unlimited".
     *
     * @see ConnectionOptions#setRequestedMaxBandwidth
     */
    getRequestedMaxBandwidth(): number | string;
    /**
     * Inquiry method that gets the maximum bandwidth that can be consumed for the data coming from
     * Lightstreamer Server. This is the actual maximum bandwidth, in contrast with the requested
     * maximum bandwidth, returned by {@link ConnectionOptions#getRequestedMaxBandwidth}. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * or because bandwidth management is not supported (in this case it is always "unlimited"),
     * but also because of number rounding.
     *
     * <p class="lifecycle"><b>Lifecycle:</b>If a connection to Lightstreamer Server is not currently active, null is returned;
     * soon after the connection is established, the value becomes available, as notified
     * by a call to {@link ClientListener#onPropertyChange} with argument "realMaxBandwidth".</p>
     *
     * @return {Number|String} A decimal number, which represents the maximum bandwidth applied by the Server for the
     * streaming or polling connection expressed in kbps (kilobits/sec), or the string "unlimited", or null.
     *
     * @see ConnectionOptions#setRequestedMaxBandwidth
     */
    getRealMaxBandwidth(): number | string;
    /**
     * Setter method that sets the polling interval used for polling
     * connections. The client switches from the default streaming mode
     * to polling mode when the client network infrastructure does not allow
     * streaming. Also, polling mode can be forced
     * by calling {@link ConnectionOptions#setForcedTransport} with
     * "WS-POLLING" or "HTTP-POLLING" as parameter.
     * <BR>The polling interval affects the rate at which polling requests
     * are issued. It is the time between the start of a polling request and
     * the start of the next request. However, if the polling interval expires
     * before the first polling request has returned, then the second polling
     * request is delayed. This may happen, for instance, when the Server
     * delays the answer because of the idle timeout setting.
     * In any case, the polling interval allows for setting an upper limit
     * on the polling frequency.
     * <BR>The Server does not impose a lower limit on the client polling
     * interval.
     * However, in some cases, it may protect itself against a high polling
     * rate by delaying its answer. Network limitations and configured
     * bandwidth limits may also lower the polling rate, despite of the
     * client polling interval.
     * <BR>The Server may, however, impose an upper limit on the polling
     * interval, in order to be able to promptly detect terminated polling
     * request sequences and discard related session information.
     *
     *
     * <p class="default-value"><b>Default value:</b> 0 (pure "asynchronous polling" is configured).
     * </p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>The polling interval should be set before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next polling request.
     * <BR>Note that, after each polling request, the value may be
     * changed to the one imposed by the Server.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "pollingInterval" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called or that received the setting from the
     * server.
    
     * </p>
     *
     * @throws {IllegalArgumentException} if a negative or a decimal
     * or a not-number value is passed.
     *
     * @param {Number} pollingInterval The time (in milliseconds) between
     * subsequent polling requests. Zero is a legal value too, meaning that
     * the client will issue a new polling request as soon as
     * a previous one has returned.
     *
     * @see ConnectionOptions#setIdleTimeout
     */
    setPollingInterval(pollingInterval: number): void;
    /**
     * Inquiry method that gets the polling interval used for polling
     * connections.
     * <BR>If the value has just been set and a polling request to Lightstreamer
     * Server has not been performed yet, the returned value is the polling interval that is being requested
     * to the Server. Afterwards, the returned value is the the time between
     * subsequent polling requests that is really allowed by the Server, that may be
     * different, because of Server side constraints.
     *
     * @return {Number} The time (in milliseconds) between subsequent polling requests.
     *
     * @see ConnectionOptions#setPollingInterval
     */
    getPollingInterval(): number;
    /**
     * Setter method that sets the time the client, after entering "STALLED" status,
     * is allowed to keep waiting for a keepalive packet or any data on a stream connection,
     * before disconnecting and trying to reconnect to the Server.
     * The new connection may be either the opening of a new session or an attempt to recovery
     * the current session, depending on the kind of interruption.
     *
     * <p class="default-value"><b>Default value:</b> 3000 (3 seconds).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "reconnectTimeout" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number
     * value is passed.
     *
     * @param {Number} reconnectTimeout The idle time (in milliseconds)
     * allowed in "STALLED" status before trying to reconnect to the
     * Server.
     *
     * @see ConnectionOptions#setStalledTimeout
     */
    setReconnectTimeout(reconnectTimeout: number): void;
    /**
     * Inquiry method that gets the time the client, after entering "STALLED" status,
     * is allowed to keep waiting for a keepalive packet or any data on a stream connection,
     * before disconnecting and trying to reconnect to the Server.
     *
     * @return {Number} The idle time (in milliseconds) admitted in "STALLED"
     * status before trying to reconnect to the Server.
     *
     * @see ConnectionOptions#setReconnectTimeout
     */
    getReconnectTimeout(): number;
    /**
     * Setter method that sets the extra time the client is allowed
     * to wait when an expected keepalive packet has not been received on
     * a stream connection (and no actual data has arrived), before entering
     * the "STALLED" status.
     *
     * <p class="default-value"><b>Default value:</b> 2000 (2 seconds).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "stalledTimeout" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number
     * value is passed.
     *
     * @param {Number} stalledTimeout The idle time (in milliseconds)
     * allowed before entering the "STALLED" status.
     *
     * @see ConnectionOptions#setReconnectTimeout
     */
    setStalledTimeout(stalledTimeout: number): void;
    /**
     * Inquiry method that gets the extra time the client can wait
     * when an expected keepalive packet has not been received on a stream
     * connection (and no actual data has arrived), before entering the
     * "STALLED" status.
     *
     * @return {Number} The idle time (in milliseconds) admitted before entering the
     * "STALLED" status.
     *
     * @see ConnectionOptions#setStalledTimeout
     */
    getStalledTimeout(): number;
    /**
     * Does nothing.
     * <p>
     * <b>The method is deprecated and it has no effect.
     * To act on connection timeouts use {@link ConnectionOptions#setRetryDelay}.</b>
     */
    setConnectTimeout(): void;
    /**
     * Returns the same value as {@link ConnectionOptions#getRetryDelay}.
     * <p>
     * <b>The method is deprecated: use {@link ConnectionOptions#getRetryDelay} instead.</b>
     */
    getConnectTimeout(): void;
    /**
     * Does nothing.
     * <p>
     * <b>The method is deprecated and it has no effect.
     * To act on connection timeouts, only {@link ConnectionOptions#setRetryDelay} is available.</b>
     */
    setCurrentConnectTimeout(): void;
    /**
     * Inquiry method that gets the maximum time to wait for a response to a request.
     *
     * <p>
     * This value corresponds to the retry delay, but, in case of multiple failed attempts
     * on unresponsive connections, it can be changed dynamically by the library to higher values.
     * When this happens, the current value cannot be altered, but by issuing
     * {@link LightstreamerClient#disconnect} and {@link LightstreamerClient#connect}
     * it will restart from the retry delay.
     *
     * @return {Number} The time (in milliseconds) allowed to wait before trying a new connection.
     *
     * @see ConnectionOptions#setRetryDelay
     */
    getCurrentConnectTimeout(): number;
    /**
     * Setter method that sets
     * <ol>
     * <li>the minimum time to wait before trying a new connection
     * to the Server in case the previous one failed for any reason; and</li>
     * <li>the maximum time to wait for a response to a request
     * before dropping the connection and trying with a different approach.</li>
     * </ol>
     *
     * <p>
     * Enforcing a delay between reconnections prevents strict loops of connection attempts when these attempts
     * always fail immediately because of some persisting issue.
     * This applies both to reconnections aimed at opening a new session and to reconnections
     * aimed at attempting a recovery of the current session.<BR>
     * Note that the delay is calculated from the moment the effort to create a connection
     * is made, not from the moment the failure is detected.
     * As a consequence, when a working connection is interrupted, this timeout is usually
     * already consumed and the new attempt can be immediate (except that
     * {@link ConnectionOptions#setFirstRetryMaxDelay} will apply in this case).
     * As another consequence, when a connection attempt gets no answer and times out,
     * the new attempt will be immediate.
     *
     * <p>
     * As a timeout on unresponsive connections, it is applied in these cases:
     * <ul>
     * <li><i>Streaming</i>: Applied on any attempt to setup the streaming connection. If after the
     * timeout no data has arrived on the stream connection, the client may automatically switch transport
     * or may resort to a polling connection.</li>
     * <li>Polling and pre-flight requests</i>: Applied on every connection. If after the timeout
     * no data has arrived on the polling connection, the entire connection process restarts from scratch.</li>
     * </ul>
     *
     * <p>
     * <b>This setting imposes only a minimum delay. In order to avoid network congestion, the library may use a longer delay if the issue preventing the
     * establishment of a session persists.</b>
     *
     * <p class="default-value"><b>Default value:</b> 4000 (4 seconds).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "retryDelay" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number
     * value is passed.
     *
     * @param {Number} retryDelay The time (in milliseconds)
     * to wait before trying a new connection.
     *
     * @see ConnectionOptions#setFirstRetryMaxDelay
     * @see ConnectionOptions#getCurrentConnectTimeout
     */
    setRetryDelay(retryDelay: number): void;
    /**
     * Inquiry method that gets the minimum time to wait before trying a new connection
     * to the Server in case the previous one failed for any reason, which is also the maximum time to wait for a response to a request
     * before dropping the connection and trying with a different approach.
     * Note that the delay is calculated from the moment the effort to create a connection
     * is made, not from the moment the failure is detected or the connection timeout expires.
     *
     * @return {Number} The time (in milliseconds) to wait before trying a new connection.
     *
     * @see ConnectionOptions#setRetryDelay
     */
    getRetryDelay(): number;
    /**
     * Setter method that sets the maximum time to wait before trying a new connection to the Server
     * in case the previous one is unexpectedly closed while correctly working.
     * The new connection may be either the opening of a new session or an attempt to recovery
     * the current session, depending on the kind of interruption.
     * <BR/>The actual delay is a randomized value between 0 and this value.
     * This randomization might help avoid a load spike on the cluster due to simultaneous reconnections, should one of
     * the active servers be stopped. Note that this delay is only applied before the first reconnection: should such
     * reconnection fail, only the setting of {@link ConnectionOptions#setRetryDelay} will be applied.
     *
     * <p class="default-value"><b>Default value:</b> 100 (0.1 seconds).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "firstRetryMaxDelay" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, zero, or a not-number
     * value is passed.
     *
     * @param {Number} firstRetryMaxDelay The max time (in milliseconds)
     * to wait before trying a new connection.
     */
    setFirstRetryMaxDelay(firstRetryMaxDelay: number): void;
    /**
     * Inquiry method that gets the maximum time to wait before trying a new connection to the Server
     * in case the previous one is unexpectedly closed while correctly working.
     *
     * @return {Number} The max time (in milliseconds)
     * to wait before trying a new connection.
     *
     * @see ConnectionOptions#setFirstRetryMaxDelay
     */
    getFirstRetryMaxDelay(): number;
    /**
     * Setter method that turns on or off the slowing algorithm. This heuristic
     * algorithm tries to detect when the client CPU is not able to keep the pace
     * of the events sent by the Server on a streaming connection. In that case,
     * an automatic transition to polling is performed.
     * <BR/>In polling, the client handles all the data before issuing the
     * next poll, hence a slow client would just delay the polls, while the Server
     * accumulates and merges the events and ensures that no obsolete data is sent.
     * <BR/>Only in very slow clients, the next polling request may be so much
     * delayed that the Server disposes the session first, because of its protection
     * timeouts. In this case, a request for a fresh session will be reissued
     * by the client and this may happen in cycle.
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next streaming connection (either a bind
     * or a brand new session).</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "slowingEnabled" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     *
     * @param {boolean} slowingEnabled true or false, to enable or disable
     * the heuristic algorithm that lowers the item update frequency.
     */
    setSlowingEnabled(slowingEnabled: boolean): void;
    /**
     * Inquiry method that checks if the slowing algorithm is enabled or not.
     *
     * @return {boolean} Whether the slowing algorithm is enabled or not.
     *
     * @see ConnectionOptions#setSlowingEnabled
     */
    isSlowingEnabled(): boolean;
    /**
     * Setter method that can be used to disable/enable the
     * Stream-Sense algorithm and to force the client to use a fixed transport or a
     * fixed combination of a transport and a connection type. When a combination is specified the
     * Stream-Sense algorithm is completely disabled.
     * <BR>The method can be used to switch between streaming and polling connection
     * types and between HTTP and WebSocket transports.
     * <BR>In some cases, the requested status may not be reached, because of
     * connection or environment problems. In that case the client will continuously
     * attempt to reach the configured status.
     * <BR>Note that if the Stream-Sense algorithm is disabled, the client may still
     * enter the "CONNECTED:STREAM-SENSING" status; however, in that case,
     * if it eventually finds out that streaming is not possible, no recovery will
     * be tried.
     *
     * <p class="default-value"><b>Default value:</b> null (full Stream-Sense enabled).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while
     * the client is connecting or connected it will instruct to switch connection
     * type to match the given configuration.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "forcedTransport" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if the given value is not in the list
     * of the admitted ones.
     *
     * @param {String} forcedTransport can be one of the following:
     * <BR>
     * <ul>
     *    <li>null: the Stream-Sense algorithm is enabled and
     *    the client will automatically connect using the most appropriate
     *    transport and connection type among those made possible by the
     *    browser/environment.</li>
     *    <li>"WS": the Stream-Sense algorithm is enabled as in the null case but
     *    the client will only use WebSocket based connections. If a connection
     *    over WebSocket is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"HTTP": the Stream-Sense algorithm is enabled as in the null case but
     *    the client will only use HTTP based connections. If a connection
     *    over HTTP is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"WS-STREAMING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Streaming over WebSocket. If
     *    Streaming over WebSocket is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"HTTP-STREAMING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Streaming over HTTP. If
     *    Streaming over HTTP is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"WS-POLLING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Polling over WebSocket. If
     *    Polling over WebSocket is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *    <li>"HTTP-POLLING": the Stream-Sense algorithm is disabled and
     *    the client will only connect on Polling over HTTP. If
     *    Polling over HTTP is not possible because of the browser/environment
     *    the client will not connect at all.</li>
     *  </ul>
     */
    setForcedTransport(forcedTransport: string): void;
    /**
     * Inquiry method that gets the value of the forced transport (if any).
     *
     * @return {String} The forced transport or null
     *
     * @see ConnectionOptions#setForcedTransport
     */
    getForcedTransport(): string;
    /**
     * Setter method that can be used to disable/enable the automatic handling of
     * server instance address that may be returned by the Lightstreamer server
     * during session creation.
     * <BR>In fact, when a Server cluster is in place, the Server address specified
     * through {@link ConnectionDetails#setServerAddress} can identify various Server
     * instances; in order to ensure that all requests related to a session are
     * issued to the same Server instance, the Server can answer to the session
     * opening request by providing an address which uniquely identifies its own
     * instance.
     * <BR>Setting this value to true permits to ignore that address and to always connect
     * through the address supplied in setServerAddress. This may be needed in a test
     * environment, if the Server address specified is actually a local address
     * to a specific Server instance in the cluster.
     *
     * <p class="edition-note"><B>Edition Note:</B> Server Clustering is
     * an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while connected,
     * it will be applied when the next session creation request is issued.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "serverInstanceAddressIgnored" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     *
     * @param {boolean} serverInstanceAddressIgnored true or false, to ignore
     * or not the server instance address sent by the server.
     *
     * @see ConnectionDetails#setServerAddress
     */
    setServerInstanceAddressIgnored(serverInstanceAddressIgnored: boolean): void;
    /**
     * Inquiry method that checks if the client is going to ignore the server
     * instance address that will possibly be sent by the server.
     *
     * @return {boolean} Whether or not to ignore the server instance address sent by the
     * server.
     *
     * @see ConnectionOptions#setServerInstanceAddressIgnored
     */
    isServerInstanceAddressIgnored(): boolean;
    /**
     * Setter method that enables/disables the cookies-are-required policy on the
     * client side.
     * Enabling this policy will guarantee that cookies pertaining to the
     * Lightstreamer Server will be sent with each request.
    
     * <BR>This holds for both cookies returned by the Server (possibly affinity cookies
     * inserted by a Load Balancer standing in between) and for cookies set by
     * other sites (for instance on the front-end page) and with a domain
     * specification which includes Lightstreamer Server host.
     * Likewise, cookies set by Lightstreamer Server and with a domain
     * specification which includes other sites will be forwarded to them.
    
    
     * <BR>On the other hand enabling this setting may prevent the client from
     * opening a streaming connection or even to connect at all depending on the
     * browser/environment.
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next HTTP request or WebSocket establishment.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "cookieHandlingRequired" on any
     * {@link ClientListener} listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called.</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     *
     * @param {boolean} cookieHandlingRequired true/false to enable/disable the
     * cookies-are-required policy.
     */
    setCookieHandlingRequired(cookieHandlingRequired: boolean): void;
    /**
     * Inquiry method that checks if the client is going to connect only if it
     * can guarantee that cookies pertaining to the server will be sent.
     *
     * @return {boolean} true/false if the cookies-are-required policy is enabled or not.
     *
     * @see ConnectionOptions#setCookieHandlingRequired
     */
    isCookieHandlingRequired(): boolean;
    /**
     * Setter method that enables/disables the "early-open" of the WebSocket
     * connection.<BR/>
     * When enabled a WebSocket is open to the address specified through
     * {@link ConnectionDetails#setServerAddress} before a potential server instance
     * address is received during session creation. In this case if a server instance
     * address is received, the previously open WebSocket is closed and a new one is open
     * to the received server instance address.<br/>
     * If disabled, the session creation is completed to verify if such
     * a server instance address is configured in the server before opening the
     * WebSocket.<BR/>
     * For these reasons this setting should be set to false if the server
     * configuration specifies a &lt;control_link_address&gt; and/or a
     * &lt;control_link_machine_name&gt; element in its configuration;
     * viceversa it should be set to true if such elements are not set on
     * the target server(s) configuration.
     *
     * <p class="edition-note"><B>Edition Note:</B> Server Clustering is
     * an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This method can be called at any time. If called while
     * the client already owns a session it will be applied the next time a session
     * is requested to a server.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "earlyWSOpenEnabled" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     *
     * @param {boolean} earlyWSOpenEnabled true/false to enable/disable the
     * early-open of the WebSocket connection.
     *
     * @see ConnectionOptions#setServerInstanceAddressIgnored
     */
    setEarlyWSOpenEnabled(earlyWSOpenEnabled: boolean): void;
    /**
     * Inquiry method that checks if the client is going to early-open the
     * WebSocket connection to the address specified in
     * {@link ConnectionDetails#setServerAddress}.
     *
     * @return {boolean} true/false if the early-open of the WebSocket connection is
     * enabled or not.
     *
     * @see ConnectionOptions#setEarlyWSOpenEnabled
     */
    isEarlyWSOpenEnabled(): boolean;
    /**
     * Setter method that enables/disables the reverse-heartbeat mechanism
     * by setting the heartbeat interval. If the given value
     * (expressed in milliseconds) equals 0 then the reverse-heartbeat mechanism will
     * be disabled; otherwise if the given value is greater than 0 the mechanism
     * will be enabled with the specified interval.
     * <BR>When the mechanism is active, the client will ensure that there is at most
     * the specified interval between a control request and the following one,
     * by sending empty control requests (the "reverse heartbeats") if necessary.
     * <BR>This can serve various purposes:<ul>
     * <li>Preventing the communication infrastructure from closing an inactive socket
     * that is ready for reuse for more HTTP control requests, to avoid
     * connection reestablishment overhead. However it is not
     * guaranteed that the connection will be kept open, as the underlying TCP
     * implementation may open a new socket each time a HTTP request needs to be sent.<BR>
     * Note that this will be done only when a session is in place.</li>
     * <li>Allowing the Server to detect when a streaming connection or Websocket
     * is interrupted but not closed. In these cases, the client eventually closes
     * the connection, but the Server cannot see that (the connection remains "half-open")
     * and just keeps trying to write.
     * This is done by notifying the timeout to the Server upon each streaming request.
     * For long polling, the {@link ConnectionOptions#setIdleTimeout} setting has a similar function.</li>
     * <li>Allowing the Server to detect cases in which the client has closed a connection
     * in HTTP streaming, but the socket is kept open by some intermediate node,
     * which keeps consuming the response.
     * This is also done by notifying the timeout to the Server upon each streaming request,
     * whereas, for long polling, the {@link ConnectionOptions#setIdleTimeout} setting has a similar function.</li>
     * </ul>
     *
     * <p class="default-value"><b>Default value:</b> 0 (meaning that the mechanism is disabled).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the setting will be obeyed immediately, unless a higher heartbeat
     * frequency was notified to the Server for the current connection. The setting
     * will always be obeyed upon the next connection (either a bind or a brand new session).</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "reverseHeartbeatInterval" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, decimal
     * or a not-number value is passed.
     *
     * @param {Number} reverseHeartbeatInterval the interval, expressed in milliseconds,
     * between subsequent reverse-heartbeats, or 0.
     */
    setReverseHeartbeatInterval(reverseHeartbeatInterval: number): void;
    /**
     * Inquiry method that gets the reverse-heartbeat interval expressed in
     * milliseconds.
     * A 0 value is possible, meaning that the mechanism is disabled.
     *
     * @return {Number} the reverse-heartbeat interval, or 0.
     *
     * @see ConnectionOptions#setReverseHeartbeatInterval
     */
    getReverseHeartbeatInterval(): number;
    /**
     * Setter method that enables/disables the setting of extra HTTP headers to all the
     * request performed to the Lightstreamer server by the client.
     * Note that when the value is set WebSockets are disabled
    
     * (as the current browser client API does not support the setting of custom HTTP headers)
    
     * unless {@link ConnectionOptions#setHttpExtraHeadersOnSessionCreationOnly}
     * is set to true. <BR> Also note that
     * if the browser/environment does not have the possibility to send extra headers while
     * some are specified through this method it will fail to connect.
     * Also note that the Content-Type header is reserved by the client library itself,
     * while other headers might be refused by the browser/environment and others might cause the
     * connection to the server to fail.
    
    
     * <BR>For instance, you cannot use this method to specify custom cookies to be sent to
     * Lightstreamer Server. They can only be set and inquired through the browser's
     * document.cookie object. <BR>
    
     * The use of custom headers might also cause the
     * browser/environment to send an OPTIONS request to the server before opening the actual connection.
    
     * Finally, note that, in case of cross-origin requests, extra headers have to be authorized
     * on the server configuration file, in the cross_domain_policy element.
    
     *
     * <p class="default-value"><b>Default value:</b> null (meaning no extra headers are sent).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next HTTP request or WebSocket establishment.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "httpExtraHeaders" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @param {Object} headersObj a JSON object containing header-name header-value pairs.
     * Null can be specified to avoid extra headers to be sent.
     */
    setHttpExtraHeaders(headersObj: any): void;
    /**
     * Inquiry method that gets the JSON object containing the extra headers
     * to be sent to the server.
     *
     * @return {Object} the JSON object containing the extra headers
     * to be sent
     *
     * @see ConnectionOptions#setHttpExtraHeaders
     */
    getHttpExtraHeaders(): any;
    /**
     * Setter method that enables/disables a restriction on the forwarding of the extra http headers
     * specified through {@link ConnectionOptions#setHttpExtraHeaders}.
     * If true, said headers will only be sent during the session creation process (and thus
     * will still be available to the Metadata Adapter notifyUser method) but will not
     * be sent on following requests. On the contrary, when set to true, the specified extra
     * headers will be sent to the server on every request: as a consequence, if any
     * extra header is actually specified, WebSockets will be disabled (as the current browser
     * client API does not support the setting of custom HTTP headers).
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b>This setting should be performed before calling the
     * {@link LightstreamerClient#connect} method. However, the value can be changed
     * at any time: the supplied value will be used for the next HTTP request or WebSocket establishment.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "httpExtraHeadersOnSessionCreationOnly" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a not boolean value is given.
     *
     * @param {boolean} httpExtraHeadersOnSessionCreationOnly true/false to enable/disable the
     * restriction on extra headers forwarding.
     */
    setHttpExtraHeadersOnSessionCreationOnly(httpExtraHeadersOnSessionCreationOnly: boolean): void;
    /**
     * Inquiry method that checks if the restriction on the forwarding of the
     * configured extra http headers applies or not.
     *
     * @return {boolean} true/false if the restriction applies or not.
     *
     * @see ConnectionOptions#setHttpExtraHeadersOnSessionCreationOnly
     */
    isHttpExtraHeadersOnSessionCreationOnly(): boolean;
    /**
     * Setter method that sets the maximum time allowed for attempts to recover
     * the current session upon an interruption, after which a new session will be created.
     * If the given value (expressed in milliseconds) equals 0, then any attempt
     * to recover the current session will be prevented in the first place.
     * <BR>In fact, in an attempt to recover the current session, the client will
     * periodically try to access the Server at the address related with the current
     * session. In some cases, this timeout, by enforcing a fresh connection attempt,
     * may prevent an infinite sequence of unsuccessful attempts to access the Server.
     * <BR>Note that, when the Server is reached, the recovery may fail due to a
     * Server side timeout on the retention of the session and the updates sent.
     * In that case, a new session will be created anyway.
     * A setting smaller than the Server timeouts may prevent such useless failures,
     * but, if too small, it may also prevent successful recovery in some cases.</p>
     *
     * <p class="default-value"><b>Default value:</b> 15000 (15 seconds).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This value can be set and changed at any time.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a
     * call to {@link ClientListener#onPropertyChange} with argument "sessionRecoveryTimeout" on any
     * {@link ClientListener}
    
     * listening to any LightstreamerClient sharing the same
     * connection with the LightstreamerClient owning the ConnectionOptions upon
     * which the setter was called
    
     * .</p>
     *
     * @throws {IllegalArgumentException} if a negative, decimal
     * or a not-number value is passed.
     *
     * @param {Number} sessionRecoveryTimeout the maximum time allowed
     * for recovery attempts, expressed in milliseconds, including 0.
     */
    setSessionRecoveryTimeout(sessionRecoveryTimeout: number): void;
    /**
     * Inquiry method that gets the maximum time allowed for attempts to recover
     * the current session upon an interruption, after which a new session will be created.
     * A 0 value also means that any attempt to recover the current session is prevented
     * in the first place.
     *
     * @return {Number} the maximum time allowed for recovery attempts, possibly 0.
     *
     * @see ConnectionOptions#setSessionRecoveryTimeout
     */
    getSessionRecoveryTimeout(): number;
}

/**
 * Data object describing the sharing policies to be used by a LightstreamerClient
 * instance.
 * If the front-end includes more than one LightstreamerClient instance that
 * need to subscribe to the same server, it is advised that such instances
 * share the same connection to avoid saturating the client connection pool and
 * to open fewer sessions on the Lightstreamer Server.
 * Note that sharing is also possible between clients living in different
 * HTML pages, provided that they come from the same host. Note that Browser
 * capabilities and/or restrictions might prevent the sharing.
 * If sharing is enabled some Cookies or values on the Web Storage may
 * be used to exchange preliminary information across windows. The used keys
 * are prefixed with the "Lightstreamer_" string. Specifying true on the
 * preventCrossWindowShare parameter it is possible to prevent the
 * Cookies/Web Storage usage.
 * <BR>When different LightstreamerClient share the same connection, the one
 * actually holding the connection is also known as the current "Master" client.
 * Whenever possible, the Master LightstreamerClient should be hosted by a permanent page.
 * <BR>If the current Master, for any reason, disappears, then the connection to
 * Lightstreamer Server has to be reestablished: the election algorithm will
 * choose a new Master among the surviving LightstreamerClient instances and
 * will restore the same status that was in place before the previous Master
 * disappeared.
 * @constructor
 *
 * @exports ConnectionSharing
 *
 * @param {String} shareName A unique alphanumeric name for the shared
 * connection. The name can be used by different LightstreamerClient in order to
 * recognize a compatible shared connection. Two LightstreamerClient instances
 * should use the same shareName for their enableSharing calls only if they are
 * going to configure the connection in the same way to connect to the same
 * server. Obviously, this includes the user credentials.
 *
 * @param {String} sharePolicyOnFound The action to be taken in case a client
 * sharing a connection using the same shareName and coming from the same
 * host is found in the browser (i.e. an active Master is found).
 * <BR>Can be one of the following:
 * <ul>
 * <li>"ATTACH" the client will try to become a Slave to the found Master.
 * <BR>Note that this policy can only be used on clients living inside a
 * browser window (i.e. no web workers nor non-browser environments).
 * Also the "ATTACH" policy might not work as expected if the involved clients
 * are instantiated in HTML pages loaded from the file system rather than
 * downloaded from a web server.
 * <BR>Note that it is an application responsibility to ensure that the
 * configuration of the Master client (the user credentials, for instance)
 * is consistent with the configuration required by the new instance of the
 * application front-end. In particular, note that the allocated bandwidth
 * would be shared among the two (or more) LightstreamerClient instances as
 * well.
 * <BR>Note that a connection, to be correctly shared between different
 * pages, has to be created in the &lt;BODY&gt; part of the page.
 * If this condition is not met, on some browsers, slave clients may
 * waste some extra time before being able to access the shared connection.
 * <BR>Sharing the connection also enables the so called "Master election"
 * feature. If the Master client is closed and other clients share the
 * connection with it, then one of the existing clients will be automatically
 * chosen as the new Master; this client will restore the status and
 * configuration of the previous Master client as it was before its death.
 * <BR>Note that there may be cases in which the library is not able to
 * determine whether a shared connection is currently active. Moreover,
 * there may be cases in which the library is not able to obtain a reference
 * to a currently active Master client.
 * </li>
 * <li>"ATTACH:FAST" same as "ATTACH" but the client will take some risks
 * of making a popup appear in order to speed up things.</li>
 * <li>"IGNORE" the found Master will be ignored and the sharePolicyOnNotFound
 * behavior will be applied.</li>
 * <li>"ABORT" the client will give up in the search of an active shared
 * connection and will neither try to create its own; the
 * {@link ClientListener#onShareAbort} event will be fired.
 * <BR>This policy may be useful in order to avoid that multiple streaming
 * connections are open (note that the browser may have a limited pool of
 * connections) or that multiple sessions for the same user are open.</li>
 * </ul>
 *
 * @param {String} sharePolicyOnNotFound The action to be taken in case a client
 * sharing a connection using the same shareName and coming from the same
 * host is not found in the browser (i.e. no active Master is found).
 * <BR>Can be one of the following:
 * <ul>
 * <li>"CREATE" the client will create its own connection.</li>
 * <li>"ABORT" the client will give up in the search of an active shared
 * connection and will neither try to create its own; the
 * {@link ClientListener#onShareAbort} event will be fired.</li>
 * <li>"WAIT" the client will wait until it finds a connection using the same
 * shareName and coming from the same host; then the sharePolicyOnFound
 * behavior will be applied.</li>
 * </ul>
 *
 * @throws {IllegalArgumentException} if the sharename is not specified or
 * is invalid.
 * @throws {IllegalArgumentException} if a non-existent policy was specified
 * or if the specified policy is not compatible with the current environment.
 *
 * @param {boolean} [preventCrossWindowShare] <b>[optional]</b> Flag to enable/disable the sharing
 * of a connection that belongs to a LightstreamerClient instances living
 * in a different html page.
 * <BR>Note that cross-window sharing might be impossible in certain circumstances.
 * <BR>If this flag is set to true, a Master living on a different window will
 * not trigger the sharePolicyOnFound policy; hence, only sharing with another
 * LightstreamerClient instance belonging to the same page will be possible.
 * <BR>The parameter is optional; if not supplied, the default value is false.
 *
 * @param {Window} [shareRef] If known, the reference to a Window containing a
 * shared connection can be passed. For the passed reference to be used, "ATTACH"
 * or "ATTACH:FAST" should be used as sharePolicyOnFound.
 *
 * @class Data object that contains information about if and how the connection
 * is shared between different {@link LightstreamerClient} instances possibly
 * living on different html pages.
 *
 * @see LightstreamerClient#enableSharing
 */
export class ConnectionSharing {
    constructor(shareName: string, sharePolicyOnFound: string, sharePolicyOnNotFound: string, preventCrossWindowShare?: boolean, shareRef?: Window);
    /**
     * Inquiry method that returns the share name configured in this instance.
     *
     * @return {String} The configured share name.
     *
     * @see LightstreamerClient#enableSharing
     */
    getShareName(): string;
    /**
     * Connection sharing is possible only if the environment supports SharedWorkers or the user requested a local sharing.
     */
    isPossible(): void;
}

/**
 * Constructor for ConsoleAppender.
 * @constructor
 *
 * @throws {IllegalStateException} if the environment does not have any console object
 * or if such console is currently inaccessible.
 *
 * @param {String} level The threshold level at which the SimpleLogAppender is created.
 * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not
 * or wrongly specified INFO is assumed.
 * @param {String} category The category this appender should listen to.
 * If not specified the appender will get log for every available category.
 * See {@link SimpleLogAppender#setCategoryFilter}.
 *
 * @exports ConsoleAppender
 * @class ConsoleAppender extends SimpleLogAppender printing messages
 * on the console.
 *
 * @extends SimpleLogAppender
 */
export class ConsoleAppender extends SimpleLogAppender {
    constructor(level: string, category: string);
    /**
     * Publish a log message on the console.
     *
     * @param {String} category the logger category that produced the given message.
     * @param {String} level the logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL.
     * @param {String} mex the message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     * @param {String} header a header for the message
     *
     */
    log(category: string, level: string, mex: string, header: string): void;
    /**
     * Called by SimpleLoggerProvider to notify itself to a newly added appender.
     * @param {SimpleLoggerProvider} loggerProvider the SimpleLoggerProvider instance handling this appender.
     */
    setLoggerProvider(loggerProvider: SimpleLoggerProvider): void;
    /**
     * Utility method that can be used by subclasses to join various info in a single line.
     * The message will be composed this way:  category + " | " + level + " | " + header + " | " + mex
     * @protected
     * @param {String} category the message category
     * @param {String} level the message level
     * @param {String} mex the message itself
     * @param {String} header a custom header
     * @returns {String}
     */
    protected composeLine(category: string, level: string, mex: string, header: string): string;
    /**
     * Inquiry method that returns the current threshold level of this SimpleLogAppender
     * instance.
     *
     * @return {String} the level of this SimpleLogAppender instance.
     * It will be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL".
     */
    getLevel(): string;
    /**
     * Setter method that changes the current threshold level of this
     * SimpleLogAppender instance.
     * The filter can be changed at any time and will affect subsequent log lines
     *
     * @param {String} [level] The new level for this SimpleLogAppender instance.
     * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not or wrongly
     * specified INFO will be used.
     */
    setLevel(level?: string): void;
    /**
     * Inquiry method that returns the category for this SimpleLogAppender instance.
     * A SimpleLogAppender only receives log lines from the {@link Logger}
     * associated to the returned category, unless
     * "*" is returned, in which case it receives log from all loggers.
     *
     * @return {String} The category of this SimpleLogAppender instance, or "*".
     */
    getCategoryFilter(): string;
    /**
     * Setter method that changes the current category of this
     * SimpleLogAppender instance.
     * <br/>This SimpleLogAppender will only receive log lines from the {@link Logger}
     * associated to the specified category, unless
     * "*" is specified, in which case it will receive log from all loggers.
     * <br/>the filter can be changed at any time and will affect subsequent log lines.
     *
     * @param {String} [category] the new category for this SimpleLogAppender, or "*".
     * If not specified "*" is assumed
     */
    setCategoryFilter(category?: string): void;
}

/**
 * Constructor for DOMAppender.
 * @constructor
 *
 * @throws {IllegalArgumentException} if the DOMElement parameter is missing.
 *
 * @param {String} level The threshold level at which the SimpleLogAppender is created.
 * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not
 * or wrongly specified INFO is assumed.
 * @param {String} category The category this appender should listen to.
 * If not specified the appender will get log for every available category.
 * See {@link SimpleLogAppender#setCategoryFilter}.
 * @param {Object} DOMObj The DOM object to use for log message publishing.
 *
 * @exports DOMAppender
 * @class DOMAppender extends SimpleLogAppender and implements the publishing
 * of log messages by incrementally extending the text content of a supplied
 * container DOM object. Log lines are separated by &lt;br&gt; elements.
 *
 * @extends SimpleLogAppender
 */
export class DOMAppender extends SimpleLogAppender {
    constructor(level: string, category: string, DOMObj: any);
    /**
     * Setter method that specifies how new log lines have to be included
     * in the given container DOM object. In fact, some log lines may contain
     * custom parts (for instance, field values) that may be expressed in HTML
     * and intended for HTML rendering. In this case, instead of putting the
     * log messages in text nodes, the appender can be set for directly adding messages to the
     * innerHTML of the container object.
     * <BR>WARNING: When turning HTML interpretation on, make sure that
     * no malicious code may reach the log.
     *
     * @param {boolean} useInnerHtml Flag to switch On/Off the use of innerHTML.
     * false by default.
     */
    setUseInnerHtml(useInnerHtml: boolean): void;
    /**
     * Setter method that specifies if new log messages have to be
     * shown on top of the previous ones.
     *
     * @param {boolean} [nextOnTop] Layout of log messages in the DOM object;
     * if true the newest log line is displayed on top of DOM object.
     * false by default.
     */
    setNextOnTop(nextOnTop?: boolean): void;
    /**
     * Publish a log message on the specified DOM object.
     *
     * @param {String} category the logger category that produced the given message.
     * @param {String} level the logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL.
     * @param {String} mex the message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     * @param {String} header a header for the message
     *
     */
    log(category: string, level: string, mex: string, header: string): void;
    /**
     * Called by SimpleLoggerProvider to notify itself to a newly added appender.
     * @param {SimpleLoggerProvider} loggerProvider the SimpleLoggerProvider instance handling this appender.
     */
    setLoggerProvider(loggerProvider: SimpleLoggerProvider): void;
    /**
     * Utility method that can be used by subclasses to join various info in a single line.
     * The message will be composed this way:  category + " | " + level + " | " + header + " | " + mex
     * @protected
     * @param {String} category the message category
     * @param {String} level the message level
     * @param {String} mex the message itself
     * @param {String} header a custom header
     * @returns {String}
     */
    protected composeLine(category: string, level: string, mex: string, header: string): string;
    /**
     * Inquiry method that returns the current threshold level of this SimpleLogAppender
     * instance.
     *
     * @return {String} the level of this SimpleLogAppender instance.
     * It will be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL".
     */
    getLevel(): string;
    /**
     * Setter method that changes the current threshold level of this
     * SimpleLogAppender instance.
     * The filter can be changed at any time and will affect subsequent log lines
     *
     * @param {String} [level] The new level for this SimpleLogAppender instance.
     * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not or wrongly
     * specified INFO will be used.
     */
    setLevel(level?: string): void;
    /**
     * Inquiry method that returns the category for this SimpleLogAppender instance.
     * A SimpleLogAppender only receives log lines from the {@link Logger}
     * associated to the returned category, unless
     * "*" is returned, in which case it receives log from all loggers.
     *
     * @return {String} The category of this SimpleLogAppender instance, or "*".
     */
    getCategoryFilter(): string;
    /**
     * Setter method that changes the current category of this
     * SimpleLogAppender instance.
     * <br/>This SimpleLogAppender will only receive log lines from the {@link Logger}
     * associated to the specified category, unless
     * "*" is specified, in which case it will receive log from all loggers.
     * <br/>the filter can be changed at any time and will affect subsequent log lines.
     *
     * @param {String} [category] the new category for this SimpleLogAppender, or "*".
     * If not specified "*" is assumed
     */
    setCategoryFilter(category?: string): void;
}

/**
 * Creates an object that extends {@link AbstractGrid} displaying its values
 * in a grid made of HTML elements. The grid rows are displayed into dynamically
 * generated HTML rows. The object can be supplied to
 * {@link Subscription#addListener} and {@link Subscription#removeListener}
 * in order to display data from one or more Subscriptions.
 * @constructor
 *
 * @param {String} id The HTML "id" attribute of the HTML element that represents the template from
 * which rows of the grid will be cloned. The template can be either a visible
 * or a hidden part of the page; anyway, it will become invisible
 * as soon as the {@link AbstractGrid#parseHtml} method is executed.
 *
 * @param {boolean} autoParse If true the {@link AbstractGrid#parseHtml} method is executed
 * before the constructor execution is completed. If false the parseHtml method
 * has to be called later by custom code. It can be useful to set this flag
 * to false if, at the time of the DynaGrid instance creation, the HTML element
 * designated as template is not yet ready on the page.
 *
 * @exports DynaGrid
 * @class An {@link AbstractGrid} implementation that can be used to display
 * the values from the internal model in a dynamically created grid.
 * The HTML structure suitable for the visualization of the tabular model values is
 * dynamically maintained by Lightstreamer, starting from an HTML hidden template
 * row, containing cells. The template row can be provided as any HTML element
 * owning the "data-source='Lightstreamer'" special attribute.
 * <BR>The association between the DynaGrid and the HTML template is made during the
 * execution of the {@link AbstractGrid#parseHtml} method: it is expected that the element
 * representing the template row, in addition to the special "data-source"
 * custom attribute, has an HTML "ID" attribute containing a unique value that has to be
 * passed to the constructor of this class. The template will be then searched for by
 * "id" on the page DOM.
 * <BR>Once the association is made with the row template, the cells within it have
 * to be recognized: all the elements of the types specified in the
 * {@link AbstractGrid#setNodeTypes} are scanned for the "data-source='Lightstreamer'"
 * attribute that authorizes the library to track the HTML element as a cell
 * for the row.
 * <BR>
 * <BR>The "data-field" attribute will then instruct the library about
 * what field of the internal model has to be associated with the cell.
 * <BR>It is possible to associate more cells with the same field.
 * An optional "data-replica" attribute can be specified in this case. If used it will permit to access
 * the single cells during {@link DynaGridListener#onVisualUpdate} executions.
 * <BR>
 * <BR>By default, the content of the HTML element designated as cell will be
 * updated with the value from the internal model; in case the cell is an INPUT
 * or a TEXTAREA element, the "value" property will be updated instead.
 * It is possible to update any attribute of the HTML element or its CSS
 * styles by specifying the "data-update" custom attribute.
 * To target an attribute the attribute name has to be specified; it can be a
 * standard property (e.g. "data-update='href'"), a custom "data-" attribute
 * (e.g. "data-update='data-foo'") or even a custom attribute not respecting
 * the "data-" standard (e.g. "data-update='foo'").
 * To target CSS attributes the "data-update='style.attributeName'" form has to
 * be used (e.g. "data-update='style.backgroundColor'"); note that the form
 * "data-update='style.background-color'" will not be recognized by some browsers.
 * <BR>WARNING: also events like "onclick" can be assigned; in such cases make
 * sure that no malicious code may reach the internal model (for example
 * through the injection of undesired JavaScript code from the Data Adapter).
 * <BR>For each update to the internal model, the involved row is determined and
 * each value is displayed in the proper cell(s). If necessary, new rows are
 * cloned from the hidden template and attached to the DOM, or existing rows are
 * dropped. The position of new rows is determined by the {@link AbstractGrid#setAddOnTop}
 * or {@link AbstractGrid#setSort} settings.
 * <BR>In fact, there is a 1:1 correspondence between rows in the underlying
 * model and rows in the grid; however, pagination is also supported, so that
 * only a subset of the grid can be made visible.
 * <BR>
 * <BR>Note that the template element can contain an arbitrary HTML structure
 * and should contain HTML cells to be used to display the row field values.
 * However, it should not contain elements to which an HTML "id" attribute has been assigned,
 * because the elements will be cloned and the HTML specification prescribes
 * that an id must be unique in the document. (The id of the template element,
 * required by Lightstreamer, is not cloned).
 * <BR>More visualization actions can be performed through the provided
 * {@link VisualUpdate} event objects received on the {@link DynaGridListener}.
 *
 * @extends AbstractGrid
 */
export class DynaGrid extends AbstractGrid {
    constructor(id: string, autoParse: boolean);
    /**
     * Setter method that sets the maximum number of visible rows allowed
     * in the grid.
     * If a value for this property is set, then Lightstreamer
     * maintains a paging mechanism, such that only one logical page is
     * displayed at a time. Logical page 1 is shown by default, but each
     * logical page can be shown by calling the {@link DynaGrid#goToPage} method.
     * <BR>Note that, due to the dynamical nature of the grid,
     * logical pages other than page 1 may underlie to scrolling caused by
     * operations on rows belonging to lower logical pages; this effect
     * is emphasized if sorting is active.
     * <BR>Note that if this instance is used to listen to events from
     * {@link Subscription} instance(s), and the first Subscription it listens to is
     * a DISTINCT Subscription, then the behavior is different: when the limit
     * posed by this setting is reached, adding a new row will always
     * cause the removal of the oldest row from the model, with a
     * consequent repositioning of the remaining rows.
     *
     * <p class="default-value"><b>Default value:</b> "unlimited".</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this setting can be set and changed at any time.
     * If the internal model is not empty when this method is called, it will cause
     * the immediate adjustment of the rows to reflect the change. Moreover,
     * if applicable, the current logical page is automatically switched to page 1.
     * </p>
     *
     * @param {Number} maxDynaRows The maximum number of visible rows allowed,
     * or the string "unlimited", to mean that the grid is allowed
     * to grow without limits, without the need for paging (the check is case
     * insensitive).
     */
    setMaxDynaRows(maxDynaRows: number): void;
    /**
     * Inquiry method that gets the maximum number of visible rows allowed
     * in the grid.
     *
     * @return {Number} The maximum number of visible rows allowed, or the String
     * "unlimited", to notify that the grid is allowed to grow
     * without limits.
     *
     * @see DynaGrid#setMaxDynaRows
     */
    getMaxDynaRows(): number;
    /**
     * Operation method that shows a particular logical page in the internal model.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractGrid#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if this instance is used to listen to events
     * from {@link Subscription} instance(s), and the first Subscription it listens
     * to is a DISTINCT Subscription (in such case pagination is disabled).
     *
     * @throws {IllegalStateException} if the maximum number of visible rows is
     * set to unlimited.
     *
     * @throws {IllegalArgumentException} if the given value is not a valid
     * positive integer number.
     *
     * @param {Number} pageNumber The number of the logical page to be displayed.
     * The request is accepted even if the supplied number is higher than the
     * number of currently available logical pages, by displaying an empty
     * logical page, that may become nonempty as soon as enough rows are added
     * to the internal model.
     *
     * @see DynaGrid#setMaxDynaRows
     * @see DynaGrid#getCurrentPages
     */
    goToPage(pageNumber: number): void;
    /**
     * Inquiry method that gets the current number of nonempty logical pages
     * needed to show the rows in the internal model.
     *
     * @return {Number} The current number of logical pages. If pagination is not active
     * 1 is returned.
     */
    getCurrentPages(): number;
    /**
     * Setter method that enables or disables the automatic adjustment of
     * the page or element scrollbars at each new update to focus on the most
     * recently updated row.
     * If a growing grid is included in an HTML element that declares
     * (and supports) the "overflow" attribute then this element may develop
     * a vertical scrollbar in order to contain all the rows. Also if the
     * container elements do not declare any "overflow" CSS property, then the
     * same may happen to the entire HTML page.
     * In such a cases new rows added to the grid (or moved due to the sort settings)
     * may be placed in the nonvisible part of the including element/page.
     * <BR>This can be avoided by enabling the auto-scroll. In this case,
     * each time a row is added or updated, the scrollbar is repositioned
     * to show the row involved. This feature, however, should be used only
     * if the update rate is low or if this grid is listening to a DISTINCT
     * Subscription; otherwise, the automatic scrolling activity may be excessive.
     * <BR>Note that in case the grid is configured in UPDATE_IS_KEY mode (that is
     * the default mode used when the grid is listening to a DISTINCT subscription) and
     * the scrollbar is moved from its automatic position, then the auto-scroll
     * is disabled until the scrollbar is repositioned to its former
     * position. This automatic interruption of the auto scrolling is not supported
     * on pre-webkit Opera browsers.
     * <BR>The auto-scroll is performed only if single page mode is currently
     * used (i.e. the maximum number of visible rows is set to unlimited).
     *
     * <p class="default-value"><b>Default value:</b> "OFF".</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The auto-scroll policy can be set and changed
     * at any time.</p>
     *
     * @param {String} type The auto-scroll policy. Permitted values are:
     * <ul>
     * <li>"OFF": No auto-scrolling is required;</li>
     * <li>"ELEMENT": An element's scrollbar should auto-scroll;</li>
     * <li>"PAGE": The browser page's scrollbar should auto-scroll.</li>
     * </ul>
     * @param {String} elementId The HTML "id" attribute of the HTML element whose scrollbar
     * should auto-scroll, if the type argument is "ELEMENT"; not used,
     * otherwise.
     * @see DynaGrid#setMaxDynaRows
     * @see AbstractGrid#forceSubscriptionInterpretation
     *
     */
    setAutoScroll(type: string, elementId: string): void;
    /**
     * Adds a listener that will receive events from the DynaGrid
     * instance.
     * <BR>The same listener can be added to several different DynaGrid
     * instances.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
     *
     * @param {DynaGridListener} listener An object that will receive the events
     * as shown in the {@link DynaGridListener} interface.
     * <BR>Note that the given instance does not have to implement all of the
     * methods of the DynaGridListener interface. In fact it may also
     * implement none of the interface methods and still be considered a valid
     * listener. In the latter case it will obviously receive no events.
     */
    addListener(listener: DynaGridListener): void;
    /**
     * Removes a listener from the DynaGrid instance so that it
     * will not receive events anymore.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     *
     * @param {DynaGridListener} listener The listener to be removed.
     */
    removeListener(listener: DynaGridListener): void;
    /**
     * Returns an array containing the {@link DynaGridListener} instances that
     * were added to this client.
     *
     * @return {DynaGridListener[]} an array containing the listeners that were added to this instance.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners(): DynaGridListener[];
    /**
     * Setter method that enables or disables the interpretation of the
     * values in the model as HTML code.
     * For instance, if the value "&lt;a href='news03.htm'&gt;Click here&lt;/a&gt;"
     * is placed in the internal model (either by manual call of the
     * {@link AbstractWidget#updateRow} method or by listening on a
     * {@link SubscriptionListener#onItemUpdate} event)
     * and HTML interpretation is enabled, then the target cell
     * will contain a link; otherwise it will contain that bare text.
     * Note that the setting applies to all the cells in the associated grid.
     * Anyway if it's not the content of a cell that is going to be updated,
     * but one of its properties, then this setting is irrelevant for such cell.
     * <BR>WARNING: When turning HTML interpretation on, make sure that
     * no malicious code may reach the internal model (for example
     * through the injection of undesired JavaScript code from the Data Adapter).
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this setting can be changed at any time.
     * <BR>Note that values that have already been placed in the grid cells will not
     * be updated to reflect the new setting.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     * @throws {IllegalArgumentException} if the given value is not a valid
     * boolean value.
     *
     * @param {boolean} enable true/false to enable/disable HTML interpretation
     * for the pushed values.
     */
    setHtmlInterpretationEnabled(enable: boolean): void;
    /**
     * Inquiry method that gets the type of interpretation to be applied for
     * the pushed values for this grid. In fact, the values can be
     * put in the target cells as HTML code or as text.
     *
     * @return {boolean} true if pushed values are interpreted as HTML code, false
     * otherwise.
     *
     * @see AbstractGrid#setHtmlInterpretationEnabled
     */
    isHtmlInterpretationEnabled(): boolean;
    /**
     * Setter method that specifies a list of HTML element types to be searched for
     * during the mapping of the grid to the HTML made by {@link AbstractGrid#parseHtml}.
     *
     * <p class="default-value"><b>Default value:</b> an array containing DIV SPAN and INPUT.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Node types can be specified at any time.
     * However, if the list is changed after the execution of the {@link AbstractGrid#parseHtml}
     * method then it will not be used until a new call to such method is performed.
     * </p>
     *
     * @param {String[]} nodeTypes an array of Strings representing the names of the node
     * types to be searched for. If the array contains an asterisk (*) then all the
     * node types will be checked.
     *
     * @see AbstractGrid#parseHtml
     */
    setNodeTypes(nodeTypes: String[]): void;
    /**
     * Inquiry method that gets the list of node of types that would be searched
     * in case of a call to {@link AbstractGrid#parseHtml}.
     *
     * @return {String[]} a list of node type names.
     *
     * @see AbstractGrid#setNodeTypes
     */
    getNodeTypes(): String[];
    /**
     * Setter method that decides whenever new rows entering the model will be
     * placed at the top of the grid or at the bottom.
     * <BR>Note that if the sort is enabled on the Grid through {@link AbstractGrid#setSort}
     * then this setting is ignored as new rows will be placed on their right
     * position based on the sort configuration.
     * <BR>Also note that the sort/add policy may be ignored depending on the grid
     * configuration; see the use of the "data-item" cell attribute in {@link StaticGrid}.
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this setting can be changed at any time.
     * <BR>Note anyway that changing this setting while the internal model
     * is not empty may result in a incosistent view.</p>
     *
     * @throws {IllegalArgumentException} if the given value is not a valid
     * boolean value.
     *
     * @param {boolean} isAddOnTop true/false to place new rows entering the model
     * as the first/last row of the grid.
     */
    setAddOnTop(isAddOnTop: boolean): void;
    /**
     * Inquiry method that gets true/false depending on how new rows
     * entering the grid are treated. If true is returned, new rows will be placed on top of
     * the grid. Viceversa, if false is returned, new rows are placed at the
     * bottom.
     *
     * @return {boolean} true if new rows are added on top, false otherwise.
     *
     * @see AbstractGrid#setAddOnTop
     */
    isAddOnTop(): boolean;
    /**
     * Setter method that configures the sort policy of the grid. If no
     * sorting policy is set, new rows are always added according with the
     * {@link AbstractGrid#setAddOnTop} setting.
     * If, on the other hand, sorting is enabled, then new
     * rows are positioned according to the sort criteria.
     * Sorting is also maintained upon update of an existing row; this may cause the row to be
     * repositioned.
     * <BR>If asynchronous row repositioning is undesired, it is possible to
     * set the sort and immediately disable it with two consecutive calls
     * to just enforce grid sorting based on the current contents.
     * <BR>The sort can also be performed on fields that are part of the model
     * but not part of the grid view.
     * <BR>Note that the sort/add policy may be ignored depending on the grid
     * configuration; see the use of the "data-item" cell attribute in {@link StaticGrid}.
     *
     * <p class="default-value"><b>Default value:</b> no sort is performed.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The sort configuration can be set and changed
     * at any time.</p>
     *
     * @throws {IllegalArgumentException} if one of the boolean parameters is neither
     * missing, null, nor a valid boolean value.
     *
     * @param {String} sortField The name of the field to be used as sort field,
     * or null to disable sorting.
     * @param {boolean} [descendingSort=false] true or false to perform descending or
     * ascending sort. This parameter is optional; if missing or null,
     * then ascending sort is performed.
     * @param {boolean} [numericSort=false] true or false to perform numeric or
     * alphabetical sort. This parameter is optional; if missing or null, then
     * alphabetical sort is performed.
     * @param {boolean} [commaAsDecimalSeparator=false] true to specify that sort
     * field values are decimal numbers in which the decimal separator is
     * a comma; false to specify it is a dot. This setting is used only if
     * numericSort is true, in which case it is optional, with false as its
     * default value.
     */
    setSort(sortField: string, descendingSort?: boolean, numericSort?: boolean, commaAsDecimalSeparator?: boolean): void;
    /**
     * Inquiry method that gets the name of the field currently used as sort
     * field, if available.
     *
     * @return {Number} The name of a field, or null if sorting is not currently
     * enabled.
     *
     * @see AbstractGrid#setSort
     */
    getSortField(): number;
    /**
     * Inquiry method that gets the sort direction currently configured.
     *
     * @return {boolean} true if descending sort is being performed, false if ascending
     * sort is, or null if sorting is not currently enabled.
     *
     * @see AbstractGrid#setSort
     */
    isDescendingSort(): boolean;
    /**
     * Inquiry method that gets the type of sort currently configured.
     *
     * @return {boolean} true if numeric sort is being performed, false if alphabetical
     * sort is, or null if sorting is not currently enabled.
     *
     * @see AbstractGrid#setSort
     */
    isNumericSort(): boolean;
    /**
     * Inquiry method that gets the type of interpretation to be used to
     * parse the sort field values in order to perform numeric sort.
     *
     * @return {boolean} true if comma is the decimal separator, false if it is a dot;
     * returns null if sorting is not currently enabled or numeric sorting
     * is not currently configured.
     *
     * @see AbstractGrid#setSort
     */
    isCommaAsDecimalSeparator(): boolean;
    /**
     * Creates an array containing all the unique values of the "data-field"
     * properties in all of the HTML elements associated to this grid during the
     * {@link AbstractGrid#parseHtml} execution. The result of this method is supposed to be
     * used as "Field List" of a Subscription.
     * <BR>Execution of this method is pointless if HTML elements associated to this
     * grid specify a field position instead of a field name in their "data-field"
     * property.
     * <BR>Note that elements specifying the "data-fieldtype" property set to "extra" or "second-level",
     * will be ignored by this method. This permits to distinguish fields that are part
     * of the main subscription (not specifying any "data-fieldtype" or specifying "first-level"), part of a
     * second-level Subscription (specifying "second-level") and not part of a Subscription at all,
     * but still manageable in a direct way (specifying "extra").
     *
     * @return {String[]} The list of unique values found in the "data-field" properties
     * of HTML element of this grid.
     *
     * @see Subscription#setFields
     */
    extractFieldList(): String[];
    /**
     * Creates an array containing all the unique values, of the "data-field" properties
     * in all of the HTML elements, having the "data-fieldtype" property set to "second-level",
     * associated to this grid during the {@link AbstractGrid#parseHtml} execution.
     * <BR>The result of this method is supposed to be
     * used as "Field List" of a second-level Subscription.
     * <BR>Execution of this method is pointless if HTML elements associated to this
     * grid specify a field position instead of a field name in their "data-field"
     * property.
     *
     * @return {String[]} The list of unique values found in the "data-field" properties
     * of HTML element of this grid.
     *
     * @see AbstractGrid#extractFieldList
     * @see Subscription#setCommandSecondLevelFields
     */
    extractCommandSecondLevelFieldList(): String[];
    /**
     * Operation method that is used to authorize and execute the binding of the
     * widget with the HTML of the page.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called once the HTML structure
     * the instance is expecting to find are ready in the DOM.
     * That said, it can be invoked at any time and subsequent invocations will update
     * the binding to the current state of the page DOM. Anyway, newly found cells
     * will be left empty until the next update involving them.</p>
     *
     * @see Chart
     * @see DynaGrid
     * @see StaticGrid
     */
    parseHtml(): void;
    /**
     * Operation method that is used to force the choice of what to use
     * as key for the integration in the internal model, when receiving
     * an update from a Subscription this grid is listening to.
     * <BR>Specifying "ITEM_IS_KEY" tells the widget to use the item as key;
     * this is the behavior that is already the default one when the Subscription
     * is in "MERGE" or "RAW" mode (see {@link AbstractWidget} for details).
     * <BR>Specifying "UPDATE_IS_KEY" tells the widget to use a progressive number
     * as key; this is the behavior that is already the default one when the
     * Subscription is in "DISTINCT" mode (see {@link AbstractWidget} for details).
     * <BR>Note that when listening to different Subscriptions the default behavior
     * is set when the grid is added as listener for the first one and then applied
     * to all the others regardless of their mode.
     *
     * <p class="lifecycle"><b>Lifecycle:</b>this method can only be called
     * while the internal model is empty.</p>
     *
     * @throws {IllegalArgumentException} if the given value is not valid.
     * @throws {IllegalStateException} if called while the grid is not empty.
     *
     * @param {String} interpretation either "ITEM_IS_KEY" or "UPDATE_IS_KEY",
     * or null to restore the default behavior.
     */
    forceSubscriptionInterpretation(interpretation: string): void;
    /**
     * Event handler that is called by Lightstreamer each time an update
     * pertaining to an item in the Subscription has been received from the
     * Server.
     *
     * @param {ItemUpdate} updateInfo a value object containing the
     * updated values for all the fields, together with meta-information about
     * the update itself and some helper methods that can be used to iterate through
     * all or new values.
     */
    onItemUpdate(updateInfo: ItemUpdate): void;
    /**
     * Event handler that is called by Lightstreamer each time a request
     * to clear the snapshot pertaining to an item in the Subscription has been
     * received from the Server.
     * More precisely, this kind of request can occur in two cases:
     * <ul>
     * <li>For an item delivered in COMMAND mode, to notify that the state
     * of the item becomes empty; this is equivalent to receiving an update
     * carrying a DELETE command once for each key that is currently active.</li>
     * <li>For an item delivered in DISTINCT mode, to notify that all the
     * previous updates received for the item should be considered as obsolete;
     * hence, if the listener were showing a list of recent updates for the
     * item, it should clear the list in order to keep a coherent view.</li>
     * </ul>
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled,
     * the notification refers to the first-level item (which is in COMMAND mode).
     * This kind of notification is not possible for second-level items (which are in
     * MERGE mode).
     * <BR/>This event can be sent by the Lightstreamer Server since version 6.0
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     */
    onClearSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully subscribed to through the Server.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     * <BR>This notification is always issued before the other ones related
     * to the same subscription. It invalidates all data that has been received
     * previously.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onSubscription event is fired an onUnsubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level subscriptions are not notified.
     */
    onSubscription(): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully unsubscribed from.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     *
     * <BR>After this notification no more events can be recieved until a new
     * {@link SubscriptionListener#onSubscription} event.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onUnsubscription event is fired an onSubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level unsubscriptions are not notified.
     */
    onUnsubscription(): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is added to a Subscription through
     * {@link Subscription#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was added to.
     */
    onListenStart(subscription: Subscription): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is removed from a Subscription through
     * {@link Subscription#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was removed from.
     */
    onListenEnd(subscription: Subscription): void;
    /**
     * Removes a row from the internal model and reflects the change on the view.
     * If no row associated with the given key is found nothing is done.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be removed.
     */
    removeRow(key: string): void;
    /**
     * Updates a row in the internal model and reflects the change on the view.
     * If no row associated with the given key is found then a new row is
     * created.
     * <BR>Example usage:
     * <BR><code>myWidget.updateRow("key1", {field1:"val1",field2:"val2"});</code>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time. If called while an updateRow on the same
     * internal model is still executing (e.g. if called while handling an onVisualUpdate
     * callback), then the new update:
     * <ul>
     * <li>if pertaining to a different key and/or if called on a {@link Chart} instance,
     * will be postponed until the first updateRow execution terminates;</li>
     * <li>if pertaining to the same key and if called on a {@link StaticGrid} / {@link DynaGrid}
     * instance, will be merged with the current one.</li>
     * </ul>
     * </p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be updated/added.
     * @param {Object} newValues A JavaScript object containing name/value pairs
     * to fill the row in the mode.
     * <BR>Note that the internal model does not have a fixed number of fields;
     * each update can add new fields to the model by simply specifying them.
     * Also, an update having fewer fields than the current model will have its
     * missing fields considered as unchanged.
     */
    updateRow(key: string, newValues: any): void;
    /**
     * Removes all the rows from the model and reflects the change on the view.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     */
    clean(): void;
    /**
     * Returns the value from the model for the specified key/field pair.
     * If the row for the specified key does not exist or if the specified field
     * is not available in the row then null is returned.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {String} key The key associated with the row to be read.
     * @param {String} field The field to be read from the row.
     *
     * @return {String} The current value for the specified field of the specified row,
     * possibly null. If the value for the specified field has never been
     * assigned in the model, the method also returns null.
     */
    getValue(key: string, field: string): string;
    /**
     * Utility method that can be used to control part of the behavior of
     * the widget in case it is used as a listener for one or more
     * {@link Subscription} instances.
     * <BR>Specifying the two flags it is possible to decide to clean the model and
     * view based on the status (subscribed or not) of the Subscriptions this
     * instance is listening to.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {boolean} onFirstSubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and an
     * onSubscription is fired by one of such Subscriptions.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and this
     * instance starts listening to a new Subscription that is already in the
     * subscribed status, then it will be considered as if an onSubscription
     * event was fired and thus a clean() call will be performed.
     *
     * @param {boolean} onLastUnsubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and the
     * onUnsubscription for such Subscription is fired.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and
     * this instance stops listening to such Subscription then it will be
     * considered as if the onUnsubscription event for that Subscription was fired
     * and thus a clean() call will be performed.
     *
     * @see Subscription#isSubscribed
     */
    setAutoCleanBehavior(onFirstSubscribe: boolean, onLastUnsubscribe: boolean): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item in the Subscription. Such notifications are sent only
     * if the items are delivered in an unfiltered mode; this occurs if the
     * subscription mode is:
     * <ul>
     * <li>RAW</li>
     * <li>MERGE or DISTINCT, with unfiltered dispatching specified</li>
     * <li>COMMAND, with unfiltered dispatching specified</li>
     * <li>COMMAND, without unfiltered dispatching specified (in this case,
     * notifications apply to ADD and DELETE events only)</li>
     * </ul>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     *
     * @see Subscription#setRequestedMaxFrequency
     */
    onItemLostUpdates(itemName: string, itemPos: number, lostUpdates: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item that was subscribed to as a second-level subscription.
     * Such notifications are sent only if the Subscription was configured in
     * unfiltered mode (second-level items are always in "MERGE" mode and
     * inherit the frequency configuration from the first-level Subscription).
     * <BR>By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     * @param {String} key The value of the key that identifies the
     * second-level item.
     *
     * @see Subscription#setRequestedMaxFrequency
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelItemLostUpdates(lostUpdates: number, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify that all
     * snapshot events for an item in the Subscription have been received,
     * so that real time events are now going to be received. The received
     * snapshot could be empty.
     * Such notifications are sent only if the items are delivered in
     * DISTINCT or COMMAND subscription mode and snapshot information was
     * indeed requested for the items.
     * By implementing this method it is possible to perform actions which
     * require that all the initial values have been received.
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled, the notification
     * refers to the first-level item (which is in COMMAND mode).
     * Snapshot-related updates for the second-level items (which are in
     * MERGE mode) can be received both before and after this notification.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     *
     * @see Subscription#setRequestedSnapshot
     * @see ItemUpdate#isSnapshot
     */
    onEndOfSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called when the Server notifies an error on a Subscription. By implementing this method it
     * is possible to perform recovery actions. <BR>
     * Note that, in order to perform a new subscription attempt, {@link LightstreamerClient#unsubscribe}
     * and {@link LightstreamerClient#subscribe} should be issued again, even if no change to the Subscription
     * attributes has been applied.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>15 - "key" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>16 - "command" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>25 - bad Selector name</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>29 - RAW mode is not allowed by the current license terms (for special licenses only)</li>
     *          <li>30 - subscriptions are not allowed by the current license terms (for special licenses only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     * @param {String} message The description of the error sent by the Server;
     * it can be null.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    onSubscriptionError(code: number, message: string): void;
    /**
     * Event handler that is called when the Server notifies an error on a second-level subscription. <BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>14 - the key value is not a valid name for the Item to be subscribed; only in this case, the error
     *              is detected directly by the library before issuing the actual request to the Server</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     *
     * @param {String} message The description of the error sent by the Server; it can be null.
     * @param {String} key The value of the key that identifies the second-level item.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelSubscriptionError(code: number, message: string, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify the client with the real maximum update frequency of the Subscription.
     * It is called immediately after the Subscription is established and in response to a requested change
     * (see {@link Subscription#setRequestedMaxFrequency}).
     * Since the frequency limit is applied on an item basis and a Subscription can involve multiple items,
     * this is actually the maximum frequency among all items. For Subscriptions with two-level behavior
     * (see {@link Subscription#setCommandSecondLevelFields} and {@link Subscription#setCommandSecondLevelFieldSchema})
     * , the reported frequency limit applies to both first-level and second-level items. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * but also because of number rounding. <BR>
     * Note that a maximum update frequency (that is, a non-unlimited one) may be applied by the Server
     * even when the subscription mode is RAW or the Subscription was done with unfiltered dispatching.
     *
     * @param {String} frequency  A decimal number, representing the maximum frequency applied by the Server
     * (expressed in updates per second), or the string "unlimited". A null value is possible in rare cases,
     * when the frequency can no longer be determined.
     */
    onRealMaxFrequency(frequency: string): void;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports DynaGridListener
 * @class Interface to be implemented to listen to {@link DynaGrid} events
 * comprehending notifications of changes in the shown values and, in case
 * pagination is active, changes in the number of total logical pages.
 * <BR>Events for this listeners are executed synchronously with respect to the code
 * that generates them.
 * <BR>Note that it is not necessary to implement all of the interface methods for
 * the listener to be successfully passed to the {@link DynaGrid#addListener}
 * method.
 *
 * @see DynaGrid
 */
export class DynaGridListener {
    constructor();
    /**
     * Event handler that receives the notification that the number of
     * logical pages has changed. The number of logical pages can grow or
     * shrink because of addition or removal of rows and because of changes
     * in the logical page size setting.
     * By implementing this method it is possible, for example, to implement
     * a dynamic page index to allow direct jump to each logical page.
     *
     *
     * @param {Number} numPages The current total number of logical pages.
     * @see DynaGrid#setMaxDynaRows
     * @see DynaGrid#goToPage
     */
    onCurrentPagesChanged?(numPages: number): void;
    /**
     * Event handler that is called by Lightstreamer each time a row of the
     * grid is being added or modified.
     * By implementing this method, it is possible to perform custom
     * formatting on the field values, to set the cells stylesheets and to
     * control the display policy.
     * In addition, through a custom handler, it is possible to perform custom
     * display actions for the row, by directly acting on the DOM element
     * containing the grid row.
     * <BR>This event is also fired when a row is being removed from the grid,
     * to allow clearing actions related to custom display actions previously
     * performed for the row. Row removal may happen when the {@link DynaGrid}
     * is listening to events from {@link Subscription} instance(s), and the first
     * Subscription it listens to is a COMMAND Subscription;
     * removal may also happen in case of {@link AbstractWidget#removeRow} or
     * {@link AbstractWidget#clean} execution and in case of destruction of
     * a row caused by exceeding the maximum allowed number of rows (see
     * {@link DynaGrid#setMaxDynaRows}).
     * <BR>
     * <BR>This event is fired before the update is applied to both the HTML cells
     * of the grid and the internal model. As a consequence, through
     * {@link AbstractWidget#updateRow}, it is still possible to modify the current update.
     * <BR>This notification is unrelated to paging activity. New or changed
     * rows are notified regardless that they are being shown in the current
     * page or that they are currently hidden. Also, no notifications are
     * available to signal that a row is entering or exiting the currently
     * displayed page.
     *
     * @param {String} key the key associated with the row that is being
     * added/removed/updated (keys are described in {@link AbstractWidget}).
     *
     * @param {VisualUpdate} visualUpdate a value object containing the
     * updated values for all the cells, together with their display settings.
     * The desired settings can be set in the object, to substitute the default
     * settings, before returning.
     * <BR>visualUpdate can also be null, to notify a clearing action.
     * In this case, the row is being removed from the page.
     *
     * @param {Object} domNode The DOM pointer to the HTML row involved.
     * The row element has been created by Lightstreamer, by cloning the
     * template row supplied to the {@link DynaGrid}.
     */
    onVisualUpdate?(key: string, visualUpdate: VisualUpdate, domNode: any): void;
}

/**
 * Creates an object to be used to create a push notification format.<BR>
 * Use setters methods to set the value of push notification fields or use a JSON structure to initialize the fields.
 *
 * @constructor
 * @exports FirebaseMpnBuilder
 *
 * @param [notificationFormat] A JSON structure representing a push notification format.
 *
 * @class Utility class that provides methods to build or parse the JSON structure used to represent the format of a push notification.<BR>
 * It provides getters and setters for the fields of a push notification, following the format specified by Google's Firebase Cloud Messaging (FCM).
 * This format is compatible with {@link MpnSubscription#setNotificationFormat}.
 *
 * @see MpnSubscription#setNotificationFormat
 */
export class FirebaseMpnBuilder {
    constructor(notificationFormat?: any);
    /**
     * Produces the JSON structure for the push notification format specified by this object.
     * @return {String} the JSON structure for the push notification format.
     */
    build(): string;
    /**
     * Gets sub-fields of the <code>webpush&period;headers</code> field.
     * @return {Object} a map with sub-fields of the <code>webpush&period;headers</code> field, or null if absent.
     */
    getHeaders(): any;
    /**
     * Sets sub-fields of the <code>webpush&period;headers</code> field.
     *
     * @param {Object} headers map to be used for sub-fields of the <code>webpush&period;headers</code> field, or null to clear it.
     * @return {FirebaseMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setHeaders(headers: any): FirebaseMpnBuilder;
    /**
     * Gets the value of <code>webpush&period;notification&period;title</code> field.
     * @return {String} the value of <code>webpush&period;notification&period;title</code> field, or null if absent.
     */
    getTitle(): string;
    /**
     * Sets the <code>webpush&period;notification&period;title</code> field.
     *
     * @param {String} title A string to be used for the <code>webpush&period;notification&period;title</code> field value, or null to clear it.
     * @return {FirebaseMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setTitle(title: string): FirebaseMpnBuilder;
    /**
     * Gets the value of <code>webpush&period;notification&period;body</code> field.
     * @return {String} the value of <code>webpush&period;notification&period;body</code> field, or null if absent.
     */
    getBody(): string;
    /**
     * Sets the <code>webpush&period;notification&period;body</code> field.
     *
     * @param {String} body A string to be used for the <code>webpush&period;notification&period;body</code> field value, or null to clear it.
     * @return {FirebaseMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setBody(body: string): FirebaseMpnBuilder;
    /**
     * Gets the value of <code>webpush&period;notification&period;icon</code> field.
     * @return {String} the value of <code>webpush&period;notification&period;icon</code> field, or null if absent.
     */
    getIcon(): string;
    /**
     * Sets the <code>webpush&period;notification&period;icon</code> field.
     *
     * @param {String} icon A string to be used for the <code>webpush&period;notification&period;icon</code> field value, or null to clear it.
     * @return {FirebaseMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setIcon(icon: string): FirebaseMpnBuilder;
    /**
     * Gets sub-fields of the <code>webpush&period;data</code> field.
     * @return {Object} a map with sub-fields of the <code>webpush&period;data</code> field, or null if absent.
     */
    getData(): any;
    /**
     * Sets sub-fields of the <code>webpush&period;data</code> field.
     *
     * @param {Object} data A map to be used for sub-fields of the <code>webpush&period;data</code> field, or null to clear it.
     * @return {FirebaseMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setData(data: any): FirebaseMpnBuilder;
}

/**
 * Callback for {@link FunctionAppender}
 * @callback FunctionLogConsumer
 * @param {String} message the log message to be consumed. If a more detailed insight
 * on the message details is required it is suggested to implement a custom {@link SimpleLogAppender}.
 */
declare type FunctionLogConsumer = (message: string) => void;

/**
 * Constructor for FunctionAppender.
 * @constructor
 *
 * @param {String} level The threshold level at which the SimpleLogAppender is created.
 * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not
 * or wrongly specified INFO is assumed.
 * @param {String} category The category this appender should listen to.
 * If not specified the appender will get log for every available category.
 * See {@link SimpleLogAppender#setCategoryFilter}.
 * @param {FunctionLogConsumer} functionToCall a well defined function to call passing log messages.
 * The function will be invoked with a single String argument. If a more detailed insight
 * on the message details is required it is suggested to implement a custom SimpleLogAppender.
 * @param {Object} [objectToApplyTo] an instance of object to apply the functionToCall to.
 *
 * @exports FunctionAppender
 * @class FunctionAppender extends SimpleLogAppender and implements the publishing
 * of log messages by invocation of a custom function.
 *
 * @extends SimpleLogAppender
 */
export class FunctionAppender extends SimpleLogAppender {
    constructor(level: string, category: string, functionToCall: FunctionLogConsumer, objectToApplyTo?: any);
    /**
     * Publish a log message by calling the specified function.
     *
     * @param {String} category the logger category that produced the given message.
     * @param {String} level the logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL.
     * @param {String} mex the message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     * @param {String} header a header for the message
     *
     */
    log(category: string, level: string, mex: string, header: string): void;
    /**
     * Called by SimpleLoggerProvider to notify itself to a newly added appender.
     * @param {SimpleLoggerProvider} loggerProvider the SimpleLoggerProvider instance handling this appender.
     */
    setLoggerProvider(loggerProvider: SimpleLoggerProvider): void;
    /**
     * Utility method that can be used by subclasses to join various info in a single line.
     * The message will be composed this way:  category + " | " + level + " | " + header + " | " + mex
     * @protected
     * @param {String} category the message category
     * @param {String} level the message level
     * @param {String} mex the message itself
     * @param {String} header a custom header
     * @returns {String}
     */
    protected composeLine(category: string, level: string, mex: string, header: string): string;
    /**
     * Inquiry method that returns the current threshold level of this SimpleLogAppender
     * instance.
     *
     * @return {String} the level of this SimpleLogAppender instance.
     * It will be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL".
     */
    getLevel(): string;
    /**
     * Setter method that changes the current threshold level of this
     * SimpleLogAppender instance.
     * The filter can be changed at any time and will affect subsequent log lines
     *
     * @param {String} [level] The new level for this SimpleLogAppender instance.
     * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not or wrongly
     * specified INFO will be used.
     */
    setLevel(level?: string): void;
    /**
     * Inquiry method that returns the category for this SimpleLogAppender instance.
     * A SimpleLogAppender only receives log lines from the {@link Logger}
     * associated to the returned category, unless
     * "*" is returned, in which case it receives log from all loggers.
     *
     * @return {String} The category of this SimpleLogAppender instance, or "*".
     */
    getCategoryFilter(): string;
    /**
     * Setter method that changes the current category of this
     * SimpleLogAppender instance.
     * <br/>This SimpleLogAppender will only receive log lines from the {@link Logger}
     * associated to the specified category, unless
     * "*" is specified, in which case it will receive log from all loggers.
     * <br/>the filter can be changed at any time and will affect subsequent log lines.
     *
     * @param {String} [category] the new category for this SimpleLogAppender, or "*".
     * If not specified "*" is assumed
     */
    setCategoryFilter(category?: string): void;
}

/**
 * Constructs an IllegalArgumentException with the specified detail message.
 * @constructor
 *
 * @param {String} message short description of the error.
 *
 * @exports IllegalArgumentException
 * @class Thrown to indicate that a method has been passed an illegal
 * or inappropriate argument.
 * <BR>Use toString to extract details on the error occurred.
 */
export class IllegalArgumentException {
    constructor(message: string);
    /**
     * Name of the error, contains the "IllegalArgumentException" String.
     *
     * @type String
     */
    name: string;
    /**
     * Human-readable description of the error.
     *
     * @type String
     */
    message: string;
}

/**
 * Constructs an IllegalStateException with the specified detail message.
 * @constructor
 *
 * @param {String} message short description of the error.
 *
 * @exports IllegalStateException
 * @class Thrown to indicate that a method has been invoked at an illegal or
 * inappropriate time or that the internal state of an object is incompatible
 * with the call.
 * <BR>Use toString to extract details on the error occurred.
 */
export class IllegalStateException {
    constructor(message: string);
    /**
     * Name of the error, contains the "IllegalStateException" String.
     *
     * @type String
     */
    name: string;
    /**
     * Human-readable description of the error.
     *
     * @type String
     */
    message: string;
}

/**
 * This module introduce a "classic" inheritance mechanism as well as an helper to
 * copy methods from one class to another. See the Inheritance method documentation below for details.
 * @exports Inheritance
 */
declare module "Inheritance" {
    /**
     * This method extends a class with the methods of another class preserving super
     * methods and super constructor. This method should be called on a class only
     * after its prototype is already filled, otherwise
     * super methods may not work as expected.<br/>
     * The <i>_super_</i>, <i>_callSuperMethod</i> and <i>_callSuperConstructor</i> names are reserved: extending and
     * extended classes' prototypes must not define properties with such names.<br/>
     * Once extended it is possible to call the super constructor calling the _callSuperConstructor
     * method and the super methods calling the _callSuperMethod method
     * <br/>Note that this function is the module itself (see the example)
     *
     * @throws {IllegalStateException} if checkAliases is true and an alias of the super class
     * collides with a different method on the subclass.
     *
     * @param {Function} subClass the class that will extend the superClass
     * @param {Function} superClass the class to be extended
     * @param {boolean} [lightExtension] if true constructor and colliding methods of the
     * super class are not ported on the subclass hence only non-colliding methods will be copied
     * on the subclass (this kind of extension is also known as mixin)
     * @param {boolean} [checkAliases] if true aliases of colliding methods will be searched on the
     * super class prototype and, if found, the same alias will be created on the subclass. This is
     * especially useful when extending a class that was minified using the Google Closure Compiler.
     * Note however that collisions can still occur, between a property and a method and between methods
     * when the subclass is minified too. The only way to prevent collisions is to minify super and sub
     * classes together.
     * @function Inheritance
     * @static
     *
     * @example
     * require(["Inheritance"],function(Inheritance) {
     *   function Class1() {
     *   }
     *
     *   Class1.prototype = {
     *     method1: function(a) {
     *       return a+1;
     *     }
     *   };
     *
     *   function Class2() {
     *     this._callSuperConstructor(Class2);
     *   }
     *
     *   Class2.prototype = {
     *     method1: function(a,b) {
     *       return this._callSuperMethod(Class2,"method1",[a])+b;
     *     }
     *   };
     *
     *   Inheritance(Class2,Class1);
     *
     *   var class2Instance = new Class2();
     *   class2Instance.method1(1,2); //returns 4
     *
     * });
     */
    function Inheritance(subClass: (...params: any[]) => any, superClass: (...params: any[]) => any, lightExtension?: boolean, checkAliases?: boolean): void;
    /**
     * This method is attached to the prototype of each extended class as _callSuperMethod to make it possible to
     * call super methods.
     * <br/>Note that it is not actually visible in this module.
     *
     * @param {Function} ownerClass the class that calls this method.
     * @param {String} toCall the name of the super function to be called.
     * @param {Object[]} [params] array of parameters to be used to call the super method.
     * @static
     */
    function _callSuperMethod(ownerClass: (...params: any[]) => any, toCall: string, params?: object[]): void;
    /**
     * This method is attached to the
     * prototype of each extended class as _callSuperConstructor to make it possible
     * to call the super constructor.
     * <br/>Note that it is not actually visible in this module.
     *
     * @param {Function} ownerClass the class that calls this method.
     * @param {Object[]} [params] array of parameters to be used to call the super constructor.
     * @static
     */
    function _callSuperConstructor(ownerClass: (...params: any[]) => any, params?: object[]): void;
}

/**
 * Callback for {@link ItemUpdate#forEachChangedField} and {@link ItemUpdate#forEachField}
 * @callback ItemUpdateChangedFieldCallback
 * @param {String} fieldName of the involved changed field. If the related Subscription was
 * initialized using a "Field Schema" it will be null.
 * @param {Number} fieldPos 1-based position of the field within
 * the "Field List" or "Field Schema".
 * @param {String} value the value for the field. See {@link ItemUpdate#getValue} for details.
 */
declare type ItemUpdateChangedFieldCallback = (fieldName: string, fieldPos: number, value: string) => void;

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
export class ItemUpdate {
    constructor();
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
    getItemName(): string;
    /**
     * Inquiry method that retrieves the position in the "Item List" or "Item Group"
     * of the item to which this update pertains.
     *
     * @return {Number} the 1-based position of the item to which this update pertains.
     *
     * @see Subscription#setItemGroup
     * @see Subscription#setItems
     */
    getItemPos(): number;
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
     * is received (only the fields used to carry key and command informations
     * are valued).</li>
     * </ul>
     *
     * @see Subscription#setFieldSchema
     * @see Subscription#setFields
     */
    getValue(fieldNameOrPos: string): string;
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
    isValueChanged(fieldNameOrPos: string): boolean;
    /**
     * Inquiry method that asks whether the current update belongs to the
     * item snapshot (which carries the current item state at the time of
     * Subscription). Snapshot events are sent only if snapshot information
     * was requested for the items through {@link Subscription#setRequestedSnapshot}
     * and precede the real time events.
     * Snapshot informations take different forms in different subscription
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
    isSnapshot(): boolean;
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
    forEachChangedField(iterator: ItemUpdateChangedFieldCallback): void;
    /**
     * Receives an iterator function and invokes it once per each field
     * in the Subscription.
     * <BR>Note that the iterator is executed before this method returns.
     *
     * @param {ItemUpdateChangedFieldCallback} iterator Function instance that will be called once
     * per each field in the Subscription.
     */
    forEachField(iterator: ItemUpdateChangedFieldCallback): void;
}

/**
 * Creates an object to be configured to connect to a Lightstreamer server
 * and to handle all the communications with it.
 * It is possible to instantiate as many LightstreamerClient as needed.
 * Each LightstreamerClient is the entry point to connect to a Lightstreamer server,
 * subscribe to as many items as needed and to send messages.

 * Multiple LightstreamerClient instances may share the same connection if
 * configured to behave that way through {@link LightstreamerClient#enableSharing}.

 * @constructor
 *
 * @exports LightstreamerClient
 *
 * @throws {IllegalArgumentException} if a not valid address is passed. See
 * {@link ConnectionDetails#setServerAddress} for details.
 *
 * @param {String} [serverAddress] the address of the Lightstreamer Server to
 * which this LightstreamerClient will connect to. It is possible not to specify
 * it at all or to specify it later. See  {@link ConnectionDetails#setServerAddress}
 * for details.
 * @param {String} [adapterSet] the name of the Adapter Set mounted on Lightstreamer Server
 * to be used to handle all requests in the Session associated with this LightstreamerClient.
 * It is possible not to specify it at all or to specify it later. See
 * {@link ConnectionDetails#setAdapterSet} for details.
 *
 * @class Facade class for the management of the communication to
 * Lightstreamer Server. Used to provide configuration settings, event
 * handlers, operations for the control of the connection lifecycle,
 * {@link Subscription} handling and to send messages.

 * <BR>It can be configured to share its connection with other LightstreamerClient
 * instances (even if on different html pages) through
 * {@link LightstreamerClient#enableSharing} calls.
 */
export class LightstreamerClient {
    constructor(serverAddress?: string, adapterSet?: string);
    /**
     * Data object that contains options and policies for the connection to
     * the server. This instance is set up by the LightstreamerClient object at
     * its own creation.
     * <BR>Properties of this object can be overwritten by values received from a
     * Lightstreamer Server. Such changes will be notified through a
     * {@link ClientListener#onPropertyChange} event on listeners of this instance.
    
     * <BR>In case of a shared connection the involved LightstreamerClient instances
     * will keep this data object synchronized so that a change on a property of an object
     * of one of the instances will be reflected on all the others. Any change will
     * be notified through a {@link ClientListener#onPropertyChange} event on
     * listeners of this instance.
    
     *
     * @type ConnectionOptions
     *
     * @see ClientListener#onPropertyChange
     */
    connectionOptions: ConnectionOptions;
    /**
     * Data object that contains the details needed to open a connection to
     * a Lightstreamer Server. This instance is set up by the LightstreamerClient object at
     * its own creation.
     * <BR>Properties of this object can be overwritten by values received from a
     * Lightstreamer Server. Such changes will be notified through a
     * {@link ClientListener#onPropertyChange} event on listeners of this instance.
    
     * <BR>In case of a shared connection the involved LightstreamerClient instances
     * will keep this data object synchronized so that a change on a property of an object
     * of one of the instances will be reflected on all the others. Any change will
     * be notified through a {@link ClientListener#onPropertyChange} event on
     * listeners of this instance.
    
     *
     * @type ConnectionDetails
     *
     * @see ClientListener#onPropertyChange
     */
    connectionDetails: ConnectionDetails;
    /**
     * Static method that permits to configure the logging system used by the library.
     * The logging system must respect the {@link LoggerProvider} interface. A custom
     * class can be used to wrap any third-party JavaScript logging system.
     * <BR>A ready-made LoggerProvider implementation is available within the
     * library in the form of the {@link SimpleLoggerProvider} class.
     * <BR>If no logging system is specified, all the generated log is discarded.
     * <BR>The following categories are available to be consumed:
     * <ul>
     * <li>
     * lightstreamer.stream:
     * <BR>logs socket activity on Lightstreamer Server connections;
     * <BR>at DEBUG level, read data is logged, write preparations are logged.
     * </li><li>
     * lightstreamer.protocol:
     * <BR>logs requests to Lightstreamer Server and Server answers;
     * <BR>at DEBUG level, request details and events from the Server are logged.
     * </li><li>
     * lightstreamer.session:
     * <BR>logs Server Session lifecycle events;
     * <BR>at INFO level, lifecycle events are logged;
     * <BR>at DEBUG level, lifecycle event details are logged.
     * </li><li>
     * lightstreamer.requests:
     * <BR>logs submission of control requests to the Server;
     * <BR>at WARN level, alert events from the Server are logged;
     * <BR>at INFO level, submission of control requests is logged;
     * <BR>at DEBUG level, requests batching and handling details are logged.
     * </li><li>
     * lightstreamer.subscriptions:
     * <BR>logs subscription requests and the related updates;
     * <BR>at INFO level, subscriptions and unsubscriptions are logged;
     * <BR>at DEBUG level, requests handling details are logged.
     * </li><li>
     * lightstreamer.messages:
     * <BR>logs sendMessage requests and the related updates;
     * <BR>at INFO level, sendMessage operations are logged;
     * <BR>at DEBUG level, request handling details are logged.
     * </li><li>
     * lightstreamer.actions:
     * <BR>logs settings / API calls.
     * </li>
    
     * <li>
     * lightstreamer.grids:
     * <BR>logs grid-related code.
     * </li><li>
     * lightstreamer.sharing:
     * <BR>logs creation / sharing / election of the Master and Slave
     * {@link LightstreamerClient};
     * <BR>at WARN level, problems getting a connection up and ready are logged;
     * <BR>at INFO level, found/lost events are logged;
     * <BR>at DEBUG level, connection management details and regular checks on the current connection are logged.
     * </li>
    
     * </ul>
     *
     * @param {LoggerProvider} provider A LoggerProvider instance that will be used
     * to generate log messages by the library classes.
     *
     * @static
     */
    static setLoggerProvider(provider: LoggerProvider): void;
    /**
     * A constant string representing the name of the library.
     *
     * @type String
     */
    static LIB_NAME: string;
    /**
     * A constant string representing the version of the library.
     *
     * @type String
     */
    static LIB_VERSION: string;
    /**
     * Configures the client to share its connection and/or attach to a shared connection.
     * Different windows trying to share the connection to Lightstreamer Server must share the
     * exact same origin. Depending on the browser in use, connection sharing might not work.
     * Specify null to prevent any kind of sharing (this is also the default). In case
     * a connection is not currently required (i.e. the client is in DISCONNECTED status)
     * specifying null will also have the effect to dismiss resources currently held by the
     * client: failing to do that when a LightstreamerClient instance is not needed anymore
     * might prevent the VM from collecting all the allocated resources. Note that in this case
     * required resources will be prepared again once a call to {@link LightstreamerClient#connect}
     * is performed.
     *
     * <p class="default-value"><b>Default value:</b> by default no sharing is configured.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this method can be called at any time.
     * <BR>Note that if multiple calls to this method are performed, the last one will
     * override the previous ones. Also if a call to enableSharing is made on a
     * Master client, the current connection (if any) will be dropped and the
     * remaining clients will enter the election algorithm.</p>
     *
     * @param {ConnectionSharing} sharing The sharing parameters or null to prevent any sharing
     */
    enableSharing(sharing: ConnectionSharing): void;
    /**
     * Inquiry method that checks if the LightstreamerClient has its own connection or if it is using
     * a connection shared by another LightstreamerClient.
     * This LightstreamerClient is not a Master if:
     * <ul>
     * <li>it is attached to another LightstreamerClient connection</li>
     * <li>no call to {@link LightstreamerClient#connect} or {@link LightstreamerClient#enableSharing}
     * was performed on it.</li>
     * <li>the {@link ClientListener#onShareAbort} event has been fired and no following
     * {@link LightstreamerClient#enableSharing} has been performed.</li>
     * <li>a call to {@link LightstreamerClient#enableSharing} has been performed and the client is currently
     * searching for a shared connection</li>
     * <li>a call to {@link LightstreamerClient#enableSharing} has been performed with null as parameter and no
     * subsequent call to connect has been performed</li>
     *
     * @return {boolean} Whenever the LightstreamerClient owning this instance is a Master or not.
     *
     * @see ConnectionSharing
     */
    isMaster(): boolean;
    /**
     * Operation method that requests to open a Session against the configured
     * Lightstreamer Server.
     * <BR>When connect() is called, unless a single transport was forced through
     * {@link ConnectionOptions#setForcedTransport},
     * the so called "Stream-Sense" mechanism is started: if the client does not
     * receive any answer for some seconds from the streaming connection, then it
     * will automatically open a polling connection.
     * <BR>A polling connection may also be opened if the environment is not suitable
     * for a streaming connection.
    
     * <BR>When connect() is used to activate the Lightstreamer
     * Session on page start up, it is suggested to make this call as the
     * latest action of the scripts in the page. Otherwise, if the stream
     * connection is opened but third-party scripts are consuming most of the
     * CPU for page initialization (initial rendering, etc.), the parsing
     * of the streaming response could be delayed to the point that the Client
     * switches to polling mode. This is usually not the case nowadays but may
     * still happen if the client is used on old machines.
     * <BR>In case of a shared connection the connect call will apply to such
     * shared connection regardless of which LightstreamerClient is calling it.
     * <BR>If {@link LightstreamerClient#enableSharing} has not been called before the
     * first call to connect, then a default call will be performed with the
     * following parameter:
     * <BR><CODE>new ConnectionSharing("randomstring","IGNORE", "CREATE", true, null);</CODE>
    
     * <BR>Note that as "polling connection" we mean a loop of polling
     * requests, each of which requires opening a synchronous (i.e. not
     * streaming) connection to Lightstreamer Server.
     *
     * <p class="lifecycle"><b>Lifecycle:</b>
     * Note that the request to connect is accomplished by the client
     * asynchronously; this means that an invocation to {@link LightstreamerClient#getStatus}
     * right after connect() might not reflect the change yet. Also if a
     * CPU consuming task is performed right after the call the connection will
     * be delayed.
     * <BR>When the request to connect is finally being executed, if the current status
     * of the client is not DISCONNECTED, then nothing will be done.</p>
     *
    
     * @throws {IllegalStateException} if the LightstreamerClient cannot
     * connect to the server due to the sharing policies configured in the
     * {@link ConnectionSharing} object.
     * @see ConnectionSharing
     *
    
     * @throws {IllegalStateException} if no server address was configured
     * and there is no suitable default address to be used.
     *
     * @see LightstreamerClient#getStatus
     * @see LightstreamerClient#disconnect
     * @see ClientListener#onStatusChange
     * @see ConnectionDetails#setServerAddress
     */
    connect(): void;
    /**
     * Operation method that requests to close the Session opened against the
     * configured Lightstreamer Server (if any).
     * <BR>When disconnect() is called, the "Stream-Sense" mechanism is stopped.
     * <BR>Note that active {@link Subscription} instances, associated with this
     * LightstreamerClient instance, are preserved to be re-subscribed to on future
     * Sessions.
    
     * <BR>In case of a shared connection, the disconnect() call will apply to such
     * shared connection regardless of which LightstreamerClient is calling it.
    
     *
     * <p class="lifecycle"><b>Lifecycle:</b>
     * Note that the request to disconnect is accomplished by the client
     * asynchronously; this means that an invocation to {@link LightstreamerClient#getStatus}
     * right after disconnect() might not reflect the change yet. Also if a
     * CPU consuming task is performed right after the call the disconnection will
     * be delayed.
     * <BR>When the request to disconnect is finally being executed, if the status of the client is
     * "DISCONNECTED", then nothing will be done.</p>
     */
    disconnect(): void;
    /**
     * Inquiry method that gets the current client status and transport
     * (when applicable).
     *
     * @return {String} The current client status. It can be one of the following
     * values:
     * <ul>
     * <li>"CONNECTING" the client is waiting for a Server's response in order
     * to establish a connection;</li>
     * <li>"CONNECTED:STREAM-SENSING" the client has received a preliminary
     * response from the server and is currently verifying if a streaming connection
     * is possible;</li>
     * <li>"CONNECTED:WS-STREAMING" a streaming connection over WebSocket is active;</li>
     * <li>"CONNECTED:HTTP-STREAMING" a streaming connection over HTTP is active;</li>
     * <li>"CONNECTED:WS-POLLING" a polling connection over WebSocket is in progress;</li>
     * <li>"CONNECTED:HTTP-POLLING" a polling connection over HTTP is in progress;</li>
     * <li>"STALLED" the Server has not been sending data on an active
     * streaming connection for longer than a configured time;</li>
     * <li>"DISCONNECTED:WILL-RETRY" no connection is currently active but one will
     * be opened (possibly after a timeout).</li>
     * <li>"DISCONNECTED:TRYING-RECOVERY" no connection is currently active,
     * but one will be opened as soon as possible, as an attempt to recover
     * the current session after a connection issue;</li>
     * <li>"DISCONNECTED" no connection is currently active;</li>
     * </ul>
     *
     * @see ClientListener#onStatusChange
     */
    getStatus(): string;
    /**
     * Operation method that sends a message to the Server. The message is
     * interpreted and handled by the Metadata Adapter associated to the
     * current Session. This operation supports in-order guaranteed message
     * delivery with automatic batching. In other words, messages are
     * guaranteed to arrive exactly once and respecting the original order,
     * whatever is the underlying transport (HTTP or WebSockets). Furthermore,
     * high frequency messages are automatically batched, if necessary,
     * to reduce network round trips.
     * <BR>Upon subsequent calls to the method, the sequential management of
     * the involved messages is guaranteed. The ordering is determined by the
     * order in which the calls to sendMessage are issued
    
     * ; in case of calls
     * issued from different LightstreamerClient instances on different html pages
     * sharing the same connection, the relative order is determined by the client
     * owning the shared connection. Anyway two messages sent through the same
     * LightstreamerClient instance will never surpass each other
    
     * .
     * <BR>If a message, for any reason, doesn't reach the Server (this is possible with the HTTP transport),
     * it will be resent; however, this may cause the subsequent messages to be delayed.
     * For this reason, each message can specify a "delayTimeout", which is the longest time the message, after
     * reaching the Server, can be kept waiting if one of more preceding messages haven't been received yet.
     * If the "delayTimeout" expires, these preceding messages will be discarded; any discarded message
     * will be notified to the listener through {@link ClientMessageListener#onDiscarded}.
     * Note that, because of the parallel transport of the messages, if a zero or very low timeout is
     * set for a message and the previous message was sent immediately before, it is possible that the
     * latter gets discarded even if no communication issues occur.
     * The Server may also enforce its own timeout on missing messages, to prevent keeping the subsequent
     * messages for long time.
     * <BR>Sequence identifiers can also be associated with the messages.
     * In this case, the sequential management is restricted to all subsets
     * of messages with the same sequence identifier associated.
     * <BR>Notifications of the operation outcome can be received by supplying
     * a suitable listener. The supplied listener is guaranteed to be eventually
     * invoked; listeners associated with a sequence are guaranteed to be invoked
     * sequentially.
     * <BR>The "UNORDERED_MESSAGES" sequence name has a special meaning.
     * For such a sequence, immediate processing is guaranteed, while strict
     * ordering and even sequentialization of the processing is not enforced.
     * Likewise, strict ordering of the notifications is not enforced.
     * However, messages that, for any reason, should fail to reach the Server
     * whereas subsequent messages had succeeded, might still be discarded after
     * a server-side timeout, in order to ensure that the listener eventually gets a notification.
     * <BR>Moreover, if "UNORDERED_MESSAGES" is used and no listener is supplied,
     * a "fire and forget" scenario is assumed. In this case, no checks on
     * missing, duplicated or overtaken messages are performed at all, so as to
     * optimize the processing and allow the highest possible throughput.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Since a message is handled by the Metadata
     * Adapter associated to the current connection, a message can be sent
     * only if a connection is currently active.
     * If the special enqueueWhileDisconnected flag is specified it is possible to
     * call the method at any time and the client will take care of sending the
     * message as soon as a connection is available, otherwise, if the current status
     * is "DISCONNECTED*", the message will be abandoned and the
     * {@link ClientMessageListener#onAbort} event will be fired.
     * <BR>Note that, in any case, as soon as the status switches again to
     * "DISCONNECTED*", any message still pending is aborted, including messages
     * that were queued with the enqueueWhileDisconnected flag set to true.
     * <BR>Also note that forwarding of the message to the server is made
     * asynchronously; this means that if a CPU consuming task is
     * performed right after the call, the message will be delayed. Hence,
     * if a message is sent while the connection is active, it could be aborted
     * because of a subsequent disconnection. In the same way a message sent
     * while the connection is not active might be sent because of a subsequent
     * connection.</p>
     *
     * @throws: {IllegalArgumentException} if the given sequence name is
     * invalid.
     * @throws: {IllegalArgumentException} if NaN or a negative value is
     * given as delayTimeout.
     *
     * @param {String} msg a text message, whose interpretation is entirely
     * demanded to the Metadata Adapter associated to the current connection.
     * @param {String} [sequence="UNORDERED_MESSAGES"] an alphanumeric identifier, used to
     * identify a subset of messages to be managed in sequence; underscore
     * characters are also allowed. If the "UNORDERED_MESSAGES" identifier is
     * supplied, the message will be processed in the special way described
     * above.
     * <BR>The parameter is optional; if not supplied, "UNORDERED_MESSAGES" is used
     * as the sequence name.
     * @param {Number} [delayTimeout] a timeout, expressed in milliseconds.
     * If higher than the Server configured timeout on missing messages,
     * the latter will be used instead. <BR>
     * The parameter is optional; if not supplied, the Server configured timeout on missing
     * messages will be applied.
     * <BR>This timeout is ignored for the special "UNORDERED_MESSAGES" sequence,
     * although a server-side timeout on missing messages still applies.
     * @param {ClientMessageListener} [listener] an
     * object suitable for receiving notifications about the processing outcome.
     * <BR>The parameter is optional; if not supplied, no notification will be
     * available.
     * @param {boolean} [enqueueWhileDisconnected=false] if this flag is set to true, and
     * the client is in a disconnected status when the provided message
     * is handled, then the message is not aborted right away but is queued waiting
     * for a new session. Note that the message can still be aborted later when a new
     * session is established.
     */
    sendMessage(msg: string, sequence?: string, delayTimeout?: number, listener?: ClientMessageListener, enqueueWhileDisconnected?: boolean): void;
    /**
     * Inquiry method that returns an array containing all the {@link Subscription}
     * instances that are currently "active" on this LightstreamerClient.
     * <BR/>Internal second-level Subscription are not included.
     *
     * @return {String[]} An array, containing all the {@link Subscription} currently
     * "active" on this LightstreamerClient.
     * <BR>The array can be empty.
     */
    getSubscriptions(): String[];
    /**
     * Operation method that adds a {@link Subscription} to the list of "active"
     * Subscriptions.
     * The Subscription cannot already be in the "active" state.
     * <BR>Active subscriptions are subscribed to through the server as soon as possible
     * (i.e. as soon as there is a session available). Active Subscription are
     * automatically persisted across different sessions as long as a related
     * unsubscribe call is not issued.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Subscriptions can be given to the LightstreamerClient at
     * any time. Once done the Subscription immediately enters the "active" state.
     * <BR>Once "active", a {@link Subscription} instance cannot be provided again
     * to a LightstreamerClient unless it is first removed from the "active" state
     * through a call to {@link LightstreamerClient#unsubscribe}.
     * <BR>Also note that forwarding of the subscription to the server is made
     * asynchronously; this means that if a CPU consuming task is
     * performed right after the call the subscription will be delayed.
     * <BR>A successful subscription to the server will be notified through a
     * {@link SubscriptionListener#onSubscription} event.</p>
     *
     * @throws {IllegalArgumentException} if the given Subscription does
     * not contain a field list/field schema.
     * @throws {IllegalArgumentException} if the given Subscription does
     * not contain a item list/item group.
     * @throws {IllegalStateException}  if the given Subscription is already "active".
     *
     * @param {Subscription} subscription A {@link Subscription} object, carrying
     * all the information needed to process its pushed values.
     *
     * @see SubscriptionListener#onSubscription
     */
    subscribe(subscription: Subscription): void;
    /**
     * Operation method that removes a {@link Subscription} that is currently in
     * the "active" state.
     * <BR>By bringing back a Subscription to the "inactive" state, the unsubscription
     * from all its items is requested to Lightstreamer Server.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Subscription can be unsubscribed from at
     * any time. Once done the Subscription immediately exits the "active" state.
     * <BR>Note that forwarding of the unsubscription to the server is made
     * asynchronously; this means that if a CPU consuming task is
     * performed right after the call the unsubscription will be delayed.
     * <BR>The unsubscription will be notified through a
     * {@link SubscriptionListener#onUnsubscription} event.</p>
     *
     * @throws {IllegalStateException} if the given Subscription is not
     * currently "active".
     *
     * @param {Subscription} subscription An "active" {@link Subscription} object
     * that was activated by this LightstreamerClient instance.
     *
     * @see SubscriptionListener#onUnsubscription
     */
    unsubscribe(subscription: Subscription): void;
    /**
     * Adds a listener that will receive events from the LightstreamerClient
     * instance.
     * <BR>The same listener can be added to several different LightstreamerClient
     * instances.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
     *
     * @param {ClientListener} listener An object that will receive the events
     * as shown in the {@link ClientListener} interface.
     * <BR>Note that the given instance does not have to implement all of the
     * methods of the ClientListener interface. In fact it may also
     * implement none of the interface methods and still be considered a valid
     * listener. In the latter case it will obviously receive no events.
     */
    addListener(listener: ClientListener): void;
    /**
     * Removes a listener from the LightstreamerClient instance so that it
     * will not receive events anymore.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     *
     * @param {ClientListener} listener The listener to be removed.
     */
    removeListener(listener: ClientListener): void;
    /**
     * Returns an array containing the {@link ClientListener} instances that
     * were added to this client.
     *
     * @return {ClientListener[]} an array containing the listeners that were added to this client.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners(): ClientListener[];
    /**
     * Operation method that registers the MPN device on the server's MPN Module.<BR>
     * By registering an MPN device, the client enables MPN functionalities such as {@link LightstreamerClient#subscribeMpn}.
     *
     * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
     * available at /dashboard).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> An {@link MpnDevice} can be registered at any time. The registration will be notified through a {@link MpnDeviceListener#onRegistered} event.</p>
     *
     * @param device An {@link MpnDevice} instance, carrying all the information about the MPN device.
     * @throws IllegalArgumentException if the specified device is null.
     *
     * @see #subscribeMpn
     */
    registerForMpn(device: any): void;
    /**
     * Operation method that subscribes an MpnSubscription on server's MPN Module.<BR>
     * This operation adds the {@link MpnSubscription} to the list of "active" subscriptions. MPN subscriptions are activated on the server as soon as possible
     * (i.e. as soon as there is a session available and subsequently as soon as the MPN device registration succeeds). Differently than real-time subscriptions,
     * MPN subscriptions are persisted on the server's MPN Module database and survive the session they were created on.<BR>
     * If the <code>coalescing</code> flag is <i>set</i>, the activation of two MPN subscriptions with the same Adapter Set, Data Adapter, Group, Schema and trigger expression will be
     * considered the same MPN subscription. Activating two such subscriptions will result in the second activation modifying the first MpnSubscription (that
     * could have been issued within a previous session). If the <code>coalescing</code> flag is <i>not set</i>, two activations are always considered different MPN subscriptions,
     * whatever the Adapter Set, Data Adapter, Group, Schema and trigger expression are set.<BR>
     * The rationale behind the <code>coalescing</code> flag is to allow simple apps to always activate their MPN subscriptions when the app starts, without worrying if
     * the same subscriptions have been activated before or not. In fact, since MPN subscriptions are persistent, if they are activated every time the app starts and
     * the <code>coalescing</code> flag is not set, every activation is a <i>new</i> MPN subscription, leading to multiple push notifications for the same event.
     *
     * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
     * available at /dashboard).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> An MpnSubscription can be given to the LightstreamerClient once an MpnDevice registration has been requested. The MpnSubscription
     * immediately enters the "active" state.<BR>
     * Once "active", an MpnSubscription instance cannot be provided again to an LightstreamerClient unless it is first removed from the "active" state through
     * a call to {@link #unsubscribeMpn}.<BR>
     * A successful subscription to the server will be notified through an {@link MpnSubscriptionListener#onSubscription} event.</p>
     *
     * @param subscription An MpnSubscription object, carrying all the information to route real-time data via push notifications.
     * @param coalescing A flag that specifies if the MPN subscription must coalesce with any pre-existing MPN subscription with the same Adapter Set, Data Adapter,
     * Group, Schema and trigger expression.
     * @throws IllegalStateException if the given MPN subscription does not contain a field list/field schema.
     * @throws IllegalStateException if the given MPN subscription does not contain a item list/item group.
     * @throws IllegalStateException if there is no MPN device registered.
     * @throws IllegalStateException if the given MPN subscription is already active.
     *
     * @see #unsubscribeMpn
     * @see #unsubscribeMpnSubscriptions
     */
    subscribeMpn(subscription: any, coalescing: any): void;
    /**
     * Operation method that unsubscribes an MpnSubscription from the server's MPN Module.<BR>
     * This operation removes the MpnSubscription from the list of "active" subscriptions.
     *
     * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
     * available at /dashboard).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> An MpnSubscription can be unsubscribed from at any time. Once done the MpnSubscription immediately exits the "active" state.<BR>
     * The unsubscription will be notified through an {@link MpnSubscriptionListener#onUnsubscription} event.</p>
     *
     * @param subscription An "active" MpnSubscription object.
     * @throws IllegalStateException if the given MPN subscription is not active.
     * @throws IllegalStateException if there is no MPN device registered.
     *
     * @see #subscribeMpn
     * @see #unsubscribeMpnSubscriptions
     */
    unsubscribeMpn(subscription: any): void;
    /**
     * Operation method that unsubscribes all the MPN subscriptions with a specified status from the server's MPN Module.<BR>
     * By specifying a status filter it is possible to unsubscribe multiple MPN subscriptions at once. E.g. by passing <code>TRIGGERED</code> it is possible
     * to unsubscribe all triggered MPN subscriptions. This operation removes the involved MPN subscriptions from the list of "active" subscriptions.
     *
     * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
     * available at /dashboard).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Multiple unsubscription can be requested at any time. Once done the involved MPN subscriptions immediately exit the "active" state.<BR>
     * The unsubscription will be notified through an {@link MpnSubscriptionListener#onUnsubscription} event to all involved MPN subscriptions.</p>
     *
     * @param filter A status name to be used to select the MPN subscriptions to unsubscribe. If null all existing MPN subscriptions
     * are unsubscribed. Possible filter values are:<ul>
     * <li><code>ALL</code> or null</li>
     * <li><code>TRIGGERED</code></li>
     * <li><code>SUBSCRIBED</code></li>
     * </ul>
     * @throws IllegalArgumentException if the given filter is not valid.
     * @throws IllegalStateException if there is no MPN device registered.
     *
     * @see #subscribeMpn
     * @see #unsubscribeMpn
     */
    unsubscribeMpnSubscriptions(filter: any): void;
    /**
     * Inquiry method that returns a collection of the existing MPN subscription with a specified status.<BR>
     * Can return both objects created by the user, via {@link MpnSubscription} constructors, and objects created by the client, to represent pre-existing MPN subscriptions.<BR>
     * Note that objects in the collection may be substituted at any time with equivalent ones: do not rely on pointer matching, instead rely on the
     * {@link MpnSubscription#getSubscriptionId} value to verify the equivalence of two MpnSubscription objects. Substitutions may happen
     * when an MPN subscription is modified, or when it is coalesced with a pre-existing subscription.
     *
     * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
     * available at /dashboard).</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The collection is available once an MpnDevice registration has been requested, but reflects the actual server's collection only
     * after an {@link MpnDeviceListener#onSubscriptionsUpdated} event has been notified.</p>
     *
     * @param {String} filter An MPN subscription status name to be used to select the MPN subscriptions to return. If null all existing MPN subscriptions
     * are returned. Possible filter values are:<ul>
     * <li><code>ALL</code> or null</li>
     * <li><code>TRIGGERED</code></li>
     * <li><code>SUBSCRIBED</code></li>
     * </ul>
     * @return {MpnSubscription[]} the collection of {@link MpnSubscription} with the specified status.
     * @throws IllegalArgumentException if the given filter is not valid.
     * @throws IllegalStateException if there is no MPN device registered.
     *
     * @see #findMpnSubscription
     */
    getMpnSubscriptions(filter: string): MpnSubscription[];
    /**
     * Inquiry method that returns the MpnSubscription with the specified subscription ID, or null if not found.<BR>
     * The object returned by this method can be an object created by the user, via MpnSubscription constructors, or an object created by the client,
     * to represent pre-existing MPN subscriptions.<BR>
     * Note that objects returned by this method may be substitutued at any time with equivalent ones: do not rely on pointer matching, instead rely on the
     * {@link MpnSubscription#getSubscriptionId} value to verify the equivalence of two MpnSubscription objects. Substitutions may happen
     * when an MPN subscription is modified, or when it is coalesced with a pre-existing subscription.
     *
     * <p class="edition-note"><B>Edition Note:</B> MPN is an optional feature, available depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the Monitoring Dashboard (by default,
     * available at /dashboard).</p>
     *
     * @param {String} subscriptionId The subscription ID to search for.
     * @return {MpnSubscription} the MpnSubscription with the specified ID, or null if not found.
     * @throws IllegalArgumentException if the given subscription ID is null.
     * @throws IllegalStateException if there is no MPN device registered.
     *
     * @see #getMpnSubscriptions
     */
    findMpnSubscription(subscriptionId: string): MpnSubscription;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports ClientListener
 * @class Interface to be implemented to listen to {@link LightstreamerClient} events
 * comprehending notifications of connection activity and errors.
 * <BR>Events for these listeners are executed asynchronously with respect to the code
 * that generates them. This means that, upon reception of an event, it is possible that
 * the current state of the client has changed furtherly.
 * <BR>Note that it is not necessary to implement all of the interface methods for
 * the listener to be successfully passed to the {@link LightstreamerClient#addListener}
 * method.

 * <BR>A ClientListener implementation is distributed together with the library:
 * {@link StatusWidget}.
 */
export class ClientListener {
    constructor();
    /**
     * Event handler that is called when the Server notifies a refusal on the
     * client attempt to open a new connection or the interruption of a
     * streaming connection. In both cases, the {@link ClientListener#onStatusChange}
     * event handler has already been invoked with a "DISCONNECTED" status and
     * no recovery attempt has been performed. By setting a custom handler, however,
     * it is possible to override this and perform custom recovery actions.
     *
     * @param {Number} errorCode The error code. It can be one of the
     * following:
     * <ul>
     * <li>1 - user/password check failed</li>
     * <li>2 - requested Adapter Set not available</li>
     * <li>7 - licensed maximum number of sessions reached
     * (this can only happen with some licenses)</li>
     * <li>8 - configured maximum number of sessions reached</li>
     * <li>9 - configured maximum server load reached</li>
     * <li>10 - new sessions temporarily blocked</li>
     * <li>11 - streaming is not available because of Server license
     * restrictions (this can only happen with special licenses)</li>
     * <li>21 - a bind request has unexpectedly reached a wrong Server instance, which suggests that a routing issue may be in place</li>
     * <li>30-41 - the current connection or the whole session has been closed
     * by external agents; the possible cause may be:
     * <ul>
     * <li>The session was closed on the Server side (via software or by
     * the administrator) (32) or through a client "destroy" request (31);</li>
     * <li>The Metadata Adapter imposes limits on the overall open sessions
     * for the current user and has requested the closure of the current session
     * upon opening of a new session for the same user
    
     * on a different browser window
    
     * (35);</li>
     * <li>An unexpected error occurred on the Server while the session was in
     * activity (33, 34);</li>
     * <li>An unknown or unexpected cause; any code different from the ones
     * identified in the above cases could be issued.</li>
     * </ul>
     * A detailed description for the specific cause is currently not supplied
     * (i.e. errorMessage is null in this case).</li>
     * <li>60 - this version of the client is not allowed by the current license terms.</li>
     * <li>61 - there was an error in the parsing of the server response thus the client cannot continue with the current session.</li>
     * <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection.</li>
     * <li>68 - the Server could not open or continue with the session because of an internal error.</li>
     * <li>71 - this kind of client is not allowed by the current license terms.</li>
     * <li>&lt;= 0 - the Metadata Adapter has refused the user connection;
     * the code value is dependent on the specific Metadata Adapter
     * implementation</li>
     * </ul>
     * @param {String} errorMessage The description of the error as sent
     * by the Server.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see ClientListener#onStatusChange
     */
    onServerError?(errorCode: number, errorMessage: string): void;
    /**
     * Event handler that receives a notification each time the LightstreamerClient
     * status has changed. The status changes may be originated either by custom
     * actions (e.g. by calling {@link LightstreamerClient#disconnect}) or by
     * internal actions.
     * <BR/><BR/>The normal cases are the following:
     * <ul>
     * <li>After issuing connect(), if the current status is "DISCONNECTED*", the
     * client will switch to "CONNECTING" first and
     * to "CONNECTED:STREAM-SENSING" as soon as the pre-flight request receives its
     * answer.
     * <BR>As soon as the new session is established, it will switch to
     * "CONNECTED:WS-STREAMING" if the browser/environment permits WebSockets;
     * otherwise it will switch to "CONNECTED:HTTP-STREAMING" if the
     * browser/environment permits streaming or to "CONNECTED:HTTP-POLLING"
     * as a last resort.
     * <BR>On the other hand if the status is already "CONNECTED:*" a
     * switch to "CONNECTING" is usually not needed.</li>
     * <li>After issuing disconnect(), the status will switch to "DISCONNECTED".</li>
     * <li>In case of a server connection refusal, the status may switch from
     * "CONNECTING" directly to "DISCONNECTED". After that, the
     * {@link ClientListener#onServerError} event handler will be invoked.</li>
     * </ul>
     * <BR/>Possible special cases are the following:
     * <ul>
     * <li>In case of Server unavailability during streaming, the status may
     * switch from "CONNECTED:*-STREAMING" to "STALLED" (see
     * {@link ConnectionOptions#setStalledTimeout}).
     * If the unavailability ceases, the status will switch back to
     * ""CONNECTED:*-STREAMING"";
     * otherwise, if the unavailability persists (see
     * {@link ConnectionOptions#setReconnectTimeout}),
     * the status will switch to "DISCONNECTED:TRYING-RECOVERY" and eventually to
     * "CONNECTED:*-STREAMING".</li>
     * <li>In case the connection or the whole session is forcibly closed
     * by the Server, the status may switch from "CONNECTED:*-STREAMING"
     * or "CONNECTED:*-POLLING" directly to "DISCONNECTED". After that, the
     * {@link ClientListener#onServerError} event handler will be invoked.</li>
     * <li>Depending on the setting in {@link ConnectionOptions#setSlowingEnabled},
     * in case of slow update processing, the status may switch from
     * "CONNECTED:WS-STREAMING" to "CONNECTED:WS-POLLING" or from
     * "CONNECTED:HTTP-STREAMING" to "CONNECTED:HTTP-POLLING".</li>
     * <li>If the status is "CONNECTED:*-POLLING" and any problem during an
     * intermediate poll occurs, the status may switch to "CONNECTING" and
     * eventually to "CONNECTED:*-POLLING". The same may hold for the
     * "CONNECTED:*-STREAMING" case, when a rebind is needed.</li>
     * <li>In case a forced transport was set through
     * {@link ConnectionOptions#setForcedTransport}, only the related final
     * status or statuses are possible.</li>
     * <li>In case of connection problems, the status may switch from any value
     * to "DISCONNECTED:WILL-RETRY" (see {@link ConnectionOptions#setRetryDelay}),
     * then to "CONNECTING" and a new attempt will start.
     * However, in most cases, the client will try to recover the current session;
     * hence, the "DISCONNECTED:TRYING-RECOVERY" status will be entered
     * and the recovery attempt will start.</li>
     * <li>In case of connection problems during a recovery attempt, the status may stay
     * in "DISCONNECTED:TRYING-RECOVERY" for long time, while further attempts are made.
     * If the recovery is no longer possible, the current session will be abandoned
     * and the status will switch to "DISCONNECTED:WILL-RETRY" before the next attempts.</li>
    
     * <li>In case the local LightstreamerClient is exploiting the connection of a
     * different LightstreamerClient (see {@link ConnectionSharing}) and such
     * LightstreamerClient or its container window is disposed, the status will
     * switch to "DISCONNECTED:WILL-RETRY" unless the current status is "DISCONNECTED".
     * In the latter case it will remain "DISCONNECTED".</li>
    
     * </ul>
     *
     * <BR>By setting a custom handler it is possible to perform
     * actions related to connection and disconnection occurrences. Note that
     * {@link LightstreamerClient#connect} and {@link LightstreamerClient#disconnect},
     * as any other method, can be issued directly from within a handler.
     *
     * @param {String} chngStatus The new status. It can be one of the
     * following values:
     * <ul>
     * <li>"CONNECTING" the client has started a connection attempt and is
     * waiting for a Server answer.</li>
     * <li>"CONNECTED:STREAM-SENSING" the client received a first response from
     * the server and is now evaluating if a streaming connection is fully
     * functional. </li>
     * <li>"CONNECTED:WS-STREAMING" a streaming connection over WebSocket has
     * been established.</li>
     * <li>"CONNECTED:HTTP-STREAMING" a streaming connection over HTTP has
     * been established.</li>
     * <li>"CONNECTED:WS-POLLING" a polling connection over WebSocket has
     * been started. Note that, unlike polling over HTTP, in this case only one
     * connection is actually opened (see {@link ConnectionOptions#setSlowingEnabled}).
     * </li>
     * <li>"CONNECTED:HTTP-POLLING" a polling connection over HTTP has
     * been started.</li>
     * <li>"STALLED" a streaming session has been silent for a while,
     * the status will eventually return to its previous CONNECTED:*-STREAMING
     * status or will switch to "DISCONNECTED:WILL-RETRY" / "DISCONNECTED:TRYING-RECOVERY".</li>
     * <li>"DISCONNECTED:WILL-RETRY" a connection or connection attempt has been
     * closed; a new attempt will be performed (possibly after a timeout).</li>
     * <li>"DISCONNECTED:TRYING-RECOVERY" a connection has been closed and
     * the client has started a connection attempt and is waiting for a Server answer;
     * if successful, the underlying session will be kept.</li>
     * <li>"DISCONNECTED" a connection or connection attempt has been closed. The
     * client will not connect anymore until a new {@link LightstreamerClient#connect}
     * call is issued.</li>
     * </ul>
     *
     * @see LightstreamerClient#connect
     * @see LightstreamerClient#disconnect
     * @see LightstreamerClient#getStatus
     */
    onStatusChange?(chngStatus: string): void;
    /**
     * Event handler that receives a notification each time  the value of a property of
     * {@link LightstreamerClient#connectionDetails} or {@link LightstreamerClient#connectionOptions}
     * is changed.
    
     * <BR>Properties of these objects can be modified by direct calls to them, but
     * also by calls performed on other LightstreamerClient instances sharing the
     * same connection and by server sent events.
    
     *
     * @param {String} the name of the changed property.
     * <BR>Possible values are:
     * <ul>
     * <li>adapterSet</li>
     * <li>serverAddress</li>
     * <li>user</li>
     * <li>password</li>
     * <li>serverInstanceAddress</li>
     * <li>serverSocketName</li>
     * <li>sessionId</li>
     * <li>contentLength</li>
     * <li>idleTimeout</li>
     * <li>keepaliveInterval</li>
     * <li>maxBandwidth</li>
     * <li>pollingInterval</li>
     * <li>reconnectTimeout</li>
     * <li>stalledTimeout</li>
     * <li>retryDelay</li>
     * <li>firstRetryMaxDelay</li>
     * <li>slowingEnabled</li>
     * <li>forcedTransport</li>
     * <li>serverInstanceAddressIgnored</li>
     * <li>cookieHandlingRequired</li>
     * <li>reverseHeartbeatInterval</li>
     * <li>earlyWSOpenEnabled</li>
     * <li>httpExtraHeaders</li>
     * <li>httpExtraHeadersOnSessionCreationOnly</li>
     *
     * </ul>
     *
     * @see LightstreamerClient#connectionDetails
     * @see LightstreamerClient#connectionOptions
     */
    onPropertyChange?(the: string): void;
    /**
     * Event handler that receives a notification in case a connection
     * sharing is aborted.
     * A connection sharing can only be aborted if one of the policies specified
     * in the {@link ConnectionSharing} instance supplied to the
     * {@link LightstreamerClient#enableSharing} method is "ABORT".
     * <BR>If this event is fired the client will never be able to connect to
     * the server unless a new call to enableSharing is issued.
     */
    onShareAbort?(): void;
    /**
     * Event handler that receives a notification when the ClientListener instance
     * is added to a LightstreamerClient through
     * {@link LightstreamerClient#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {LightstreamerClient} lsClient the LightstreamerClient this
     * instance was added to.
     */
    onListenStart?(lsClient: LightstreamerClient): void;
    /**
     * Event handler that receives a notification when the ClientListener instance
     * is removed from a LightstreamerClient through
     * {@link LightstreamerClient#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {LightstreamerClient} lsClient the LightstreamerClient this
     * instance was removed from.
     */
    onListenEnd?(lsClient: LightstreamerClient): void;
    /**
     * Notifies that the Server has sent a keepalive message because a streaming connection
     * is in place and no update had been sent for the configured time
     * (see {@link ConnectionOptions#setKeepaliveInterval}).
     * However, note that the lack of both updates and keepalives is already managed by the library
     * (see {@link ConnectionOptions#setReconnectTimeout} and {@link ConnectionOptions#setStalledTimeout}).
     */
    onServerKeepalive?(): void;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports ClientMessageListener
 * @class Interface to be implemented to listen to {@link LightstreamerClient#sendMessage}
 * events reporting a message processing outcome.
 * <BR>Events for these listeners are executed asynchronously with respect to the code
 * that generates them.
 * <BR>Note that it is not necessary to implement all of the interface methods for
 * the listener to be successfully passed to the {@link LightstreamerClient#sendMessage}
 * method. On the other hand, if all of the handlers are implemented the library will
 * ensure to call one and only one of them per message.
 */
export class ClientMessageListener {
    constructor();
    /**
     * Event handler that is called by Lightstreamer when any notifications
     * of the processing outcome of the related message haven't been received
     * yet and can no longer be received.
     * Typically, this happens after the session has been closed.
     * In this case, the client has no way of knowing the processing outcome
     * and any outcome is possible.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     * @param {boolean} sentOnNetwork true if the message was probably sent on the
     * network, false otherwise.
     * <BR>Event if the flag is true, it is not possible to infer whether the message
     * actually reached the Lightstreamer Server or not.
     */
    onAbort?(originalMessage: string, sentOnNetwork: boolean): void;
    /**
     * Event handler that is called by Lightstreamer when the related message
     * has been processed by the Server but the processing has failed for any
     * reason. The level of completion of the processing by the Metadata Adapter
     * cannot be determined.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     */
    onError?(originalMessage: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify that the related
     * message has been discarded by the Server. This means that the message
     * has not reached the Metadata Adapter and the message next in the sequence
     * is considered enabled for processing.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     */
    onDiscarded?(originalMessage: string): void;
    /**
     * Event handler that is called by Lightstreamer when the related message
     * has been processed by the Server but the expected processing outcome
     * could not be achieved for any reason.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     * @param {Number} code the error code sent by the Server. It can be one
     * of the following:
     * <ul>
     * <li>&lt;= 0 - the Metadata Adapter has refused the message; the code
     * value is dependent on the specific Metadata Adapter implementation.</li>
     * </ul>
     * @param {String} message the description of the error sent by the Server.
     */
    onDeny?(originalMessage: string, code: number, message: string): void;
    /**
     * Event handler that is called by Lightstreamer when the related message
     * has been processed by the Server with success.
     *
     * @param {String} originalMessage the message to which this notification
     * is related.
     */
    onProcessed?(originalMessage: string): void;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports Logger
 * @class Simple Interface to be implemented to produce log.
 */
export class Logger {
    constructor();
    /**
     * Receives log messages at FATAL level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     *
     * @see LoggerProvider
     */
    fatal(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the FATAL level.
     * The method should return true if this Logger is enabled for FATAL events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log FATAL statements. However, even if the method returns false, FATAL log
     * lines may still be received by the {@link Logger#fatal} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if FATAL logging is enabled, false otherwise
     */
    isFatalEnabled(): boolean;
    /**
     * Receives log messages at ERROR level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    error(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the ERROR level.
     * The method should return true if this Logger is enabled for ERROR events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log ERROR statements. However, even if the method returns false, ERROR log
     * lines may still be received by the {@link Logger#error} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if ERROR logging is enabled, false otherwise
     */
    isErrorEnabled(): boolean;
    /**
     * Receives log messages at WARN level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    warn(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the WARN level.
     * The method should return true if this Logger is enabled for WARN events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log WARN statements. However, even if the method returns false, WARN log
     * lines may still be received by the {@link Logger#warn} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if WARN logging is enabled, false otherwise
     */
    isWarnEnabled(): boolean;
    /**
     * Receives log messages at INFO level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    info(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the INFO level.
     * The method should return true if this Logger is enabled for INFO events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log INFO statements. However, even if the method returns false, INFO log
     * lines may still be received by the {@link Logger#info} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if INFO logging is enabled, false otherwise
     */
    isInfoEnabled(): boolean;
    /**
     * Receives log messages at DEBUG level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    debug(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the DEBUG level.
     * The method should return true if this Logger is enabled for DEBUG events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log DEBUG statements. However, even if the method returns false, DEBUG log
     * lines may still be received by the {@link Logger#debug} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if DEBUG logging is enabled, false otherwise
     */
    isDebugEnabled(): boolean;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports LoggerProvider
 * @class Simple interface to be implemented to provide custom log producers
 * through {@link LightstreamerClient.setLoggerProvider}.
 *
 * <BR>A simple implementation of this interface is included with this library:
 * {@link SimpleLoggerProvider}.
 */
export class LoggerProvider {
    constructor();
    /**
     * Invoked by the {@link LightstreamerClient} to request a {@link Logger} instance that will be used for logging occurring
     * on the given category. It is suggested, but not mandatory, that subsequent
     * calls to this method related to the same category return the same {@link Logger}
     * instance.
     *
     * @param {String} category the log category all messages passed to the given
     * Logger instance will pertain to.
     *
     * @return {Logger} A Logger instance that will receive log lines related to
     * the given category.
     */
    getLogger(category: string): Logger;
}

/**
 * This is a fake constructor that should not be used.
 * @constructor
 *
 * @exports LogMessages
 *
 * @class Used internally by the library to produce "real" log messages
 * in the log generated by the internal classes. If this class is not included in the
 * generated library, only codes will be printed.
 * <BR>Note that if the library is used in the AMD version then it may be necessary,
 * depending on the AMD implementation in use, to require this class to make the
 * "real" log messages appear in the log.
 * <BR>It is suggested not to import this class unless a client log is needed
 * for debugging purposes.
 * <BR>It is possible to include this class in a JavaScript application to
 * programmatically obtain a log message associated to a given log code
 * exploiting the {@link LogMessages.getMessage} method.
 */
export class LogMessages {
    constructor();
    /**
     * Given a log code as generated by a library running without the LogMessages module,
     * this method can be used to extract the associated log message.
     *
     * @param {Number} id The id of the essage to be extracted.
     */
    static getMessage(id: number): void;
}

/**
 * Creates an object to be used to describe an MPN device that is going to be registered to the MPN Module of Lightstreamer Server.<BR>
 * During creation the MpnDevice tries to acquires any previously registered device token from localStorage.
 * It then saves the current device token on localStorage. Saving and retrieving the previous device token is used to handle automatically
 * the cases where the token changes. The MPN Module of Lightstreamer Server is able to move
 * MPN subscriptions associated with the previous token to the new one.
 *
 * @constructor
 * @param {String} token the device token
 * @param {String} appId the application identifier
 * @param {String} platform either "Google" for Google's Firebase Cloud Messaging (FCM) or "Apple" for Apple Push Notification Service (APNs)
 *
 * @throws IllegalArgumentException if <code>token</code> or <code>appId</code> is null or <code>platform</code> is not "Google" or "Apple".
 *
 * @exports MpnDevice
 *
 * @class Class representing a device that supports Web Push Notifications.<BR>
 * It contains device details and the listener needed to monitor its status.<BR>
 * An MPN device is created from the application identifier, the platform and a device token (a.k.a. registration token) obtained from
 * web push notifications APIs, and must be registered on the {@link LightstreamerClient} in order to successfully subscribe an MPN subscription.
 * See {@link MpnSubscription}.<BR>
 * After creation, an MpnDevice object is in "unknown" state. It must then be passed to the Lightstreamer Server with the
 * {@link LightstreamerClient#registerForMpn} method, which enables the client to subscribe MPN subscriptions and sends the device details to the
 * server's MPN Module, where it is assigned a permanent device ID and its state is switched to "registered".<BR>
 * Upon registration on the server, active MPN subscriptions of the device are received and exposed with the {@link LightstreamerClient#getMpnSubscriptions}
 * method.<BR>
 * An MpnDevice's state may become "suspended" if errors occur during push notification delivery. In this case MPN subscriptions stop sending notifications
 * and the device state is reset to "registered" at the first subsequent registration.
 */
export class MpnDevice {
    constructor(token: string, appId: string, platform: string);
    /**
     * Adds a listener that will receive events from the MpnDevice
     * instance.
     * <BR>The same listener can be added to several different MpnDevice
     * instances.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
     *
     * @param {MpnDeviceListener} listener An object that will receive the events
     * as shown in the {@link MpnDeviceListener} interface.
     * <BR>Note that the given instance does not have to implement all of the
     * methods of the MpnDeviceListener interface. In fact it may also
     * implement none of the interface methods and still be considered a valid
     * listener. In the latter case it will obviously receive no events.
     */
    addListener(listener: MpnDeviceListener): void;
    /**
     * Removes a listener from the MpnDevice instance so that it
     * will not receive events anymore.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     *
     * @param {MpnDeviceListener} listener The listener to be removed.
     */
    removeListener(listener: MpnDeviceListener): void;
    /**
     * Returns an array containing the {@link MpnDeviceListener} instances that
     * were added to this client.
     *
     * @return {MpnDeviceListener[]} an Array containing the listeners that were added to this client.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners(): MpnDeviceListener[];
    /**
     * The platform identifier of this MPN device. It equals <code>Google</code> or <code>Apple</code> and is used by the server as part of the device identification.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the MPN device platform.
     */
    getPlatform(): string;
    /**
     * The application ID of this MPN device. It is used by the server as part of the device identification.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the MPN device application ID.
     */
    getApplicationId(): string;
    /**
     * The device token of this MPN device. It is passed during creation and
     * is used by the server as part of the device identification.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the MPN device token.
     */
    getDeviceToken(): string;
    /**
     * The previous device token of this MPN device. It is obtained automatically from
     * localStorage during creation and is used by the server to restore MPN subscriptions associated with this previous token. May be null if
     * no MPN device has been registered yet on the application.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the previous MPN device token, or null if no MPN device has been registered yet.
     */
    getPreviousDeviceToken(): string;
    /**
     * Checks whether the MPN device object is currently registered on the server or not.<BR>
     * This flag is switched to true by server sent registration events, and back to false in case of client disconnection or server sent suspension events.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {boolean} true if the MPN device object is currently registered on the server.
     *
     * @see #getStatus
     */
    isRegistered(): boolean;
    /**
     * Checks whether the MPN device object is currently suspended on the server or not.<BR>
     * An MPN device may be suspended if errors occur during push notification delivery.<BR>
     * This flag is switched to true by server sent suspension events, and back to false in case of client disconnection or server sent resume events.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {boolean} true if the MPN device object is currently suspended on the server.
     *
     * @see #getStatus
     */
    isSuspended(): boolean;
    /**
     * The status of the device.<BR>
     * The status can be:<ul>
     * <li><code>UNKNOWN</code>: when the MPN device object has just been created or deleted. In this status {@link MpnDevice#isRegistered} and {@link MpnDevice#isSuspended} are both false.</li>
     * <li><code>REGISTERED</code>: when the MPN device object has been successfully registered on the server. In this status {@link MpnDevice#isRegistered} is true and
     * {@link MpnDevice#isSuspended} is false.</li>
     * <li><code>SUSPENDED</code>: when a server error occurred while sending push notifications to this MPN device and consequently it has been suspended. In this status
     * {@link MpnDevice#isRegistered} and {@link MpnDevice#isSuspended} are both true.</li>
     * </ul>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the status of the device.
     *
     * @see #isRegistered
     * @see #isSuspended
     */
    getStatus(): string;
    /**
     * The server-side timestamp of the device status.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {Number} The server-side timestamp of the device status.
     *
     * @see #getStatus
     */
    getStatusTimestamp(): number;
    /**
     * The server-side unique persistent ID of the device.<BR>
     * The ID is available only after the MPN device object has been successfully registered on the server. I.e. when its status is <code>REGISTERED</code> or
     * <code>SUSPENDED</code>.<BR>
     * Note: a device token change, if the previous device token was correctly stored on localStorage, does not cause the device ID to change: the
     * server moves previous MPN subscriptions from the previous token to the new one and the device ID remains unaltered.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the MPN device ID.
     */
    getDeviceId(): string;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports MpnDeviceListener
 *
 * @class Interface to be implemented to receive MPN device events including registration, suspension/resume and status change.<BR>
 */
export class MpnDeviceListener {
    constructor();
    /**
     * Event handler called when the MpnDeviceListener instance is added to an MPN device object through {@link MpnDevice#addListener}.<BR>
     * This is the first event to be fired on the listener.
     *
     * @param {MpnDevice} device The MPN device object this instance was added to.
     */
    onListenStart?(device: MpnDevice): void;
    /**
     * Event handler called when the MpnDeviceListener instance is removed from an MPN device object through {@link MpnDevice#removeListener}.<BR>
     * This is the last event to be fired on the listener.
     *
     * @param {MpnDevice} device The MPN device object this instance was removed from.
     */
    onListenEnd?(device: MpnDevice): void;
    /**
     * Event handler called when an MPN device object has been successfully registered on the server's MPN Module.<BR>
     * This event handler is always called before other events related to the same device.<BR>
     * Note that this event can be called multiple times in the life of an MPN device object in case the client disconnects and reconnects. In this case
     * the device is registered again automatically.
     */
    onRegistered?(): void;
    /**
     * Event handler called when an MPN device object has been suspended on the server's MPN Module.<BR>
     * An MPN device may be suspended if errors occur during push notification delivery.<BR>
     * Note that in some server clustering configurations this event may not be called.
     */
    onSuspended?(): void;
    /**
     * Event handler called when an MPN device object has been resumed on the server's MPN Module.<BR>
     * An MPN device may be resumed from suspended state at the first subsequent registration.<BR>
     * Note that in some server clustering configurations this event may not be called.
     */
    onResumed?(): void;
    /**
     * Event handler called when the server notifies that an MPN device changed its status.<BR>
     * Note that in some server clustering configurations the status change for the MPN device suspend event may not be called.
     *
     * @param {String} status The new status of the MPN device. It can be one of the following:<ul>
     * <li><code>UNKNOWN</code></li>
     * <li><code>REGISTERED</code></li>
     * <li><code>SUSPENDED</code></li>
     * </ul>
     * @param {Number} timestamp The server-side timestamp of the new device status.
     *
     * @see MpnDevice#getStatus
     * @see MpnDevice#getStatusTimestamp
     */
    onStatusChanged?(status: string, timestamp: number): void;
    /**
     * Event handler called when the server notifies an error while registering an MPN device object.<BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:<ul>
     * <li>40 - the MPN Module is disabled, either by configuration or by license restrictions.</li>
     * <li>41 - the request failed because of some internal resource error (e.g. database connection, timeout, etc.).</li>
     * <li>43 - invalid or unknown application ID.</li>
     * <li>45 - invalid or unknown MPN device ID.</li>
     * <li>48 - MPN device suspended.</li>
     * <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection.</li>
     * <li>68 - the Server could not fulfill the request because of an internal error.</li>
     * <li>&lt;= 0 - the Metadata Adapter has refused the subscription request; the code value is dependent on the specific Metadata Adapter implementation.</li>
     * </ul>
     * @param {String} message The description of the error sent by the Server; it can be null.
     */
    onRegistrationFailed?(code: number, message: string): void;
    /**
     * Event handler called when the server notifies that the list of MPN subscription associated with an MPN device has been updated.<BR>
     * After registration, the list of pre-existing MPN subscriptions for the MPN device is updated and made available through the
     * {@link LightstreamerClient#getMpnSubscriptions} method.
     *
     * @see LightstreamerClient#getMpnSubscriptions
     */
    onSubscriptionsUpdated?(): void;
}

/**
 * Creates an object to be used to describe an MPN subscription that is going to be subscribed to through the MPN Module of Lightstreamer Server.<BR>
 * The object can be supplied to {@link LightstreamerClient#subscribeMpn} in order to bring the MPN subscription to "active" state.<BR>
 * Note that all of the methods used to describe the subscription to the server can only be called while the instance is in the "inactive" state.
 *
 * <p>
 * Alternatively you can create an MpnSubscription object by passing a single argument either of type
 * <ul>
 * <li> {@link Subscription}: the new object is initialized by copying subscription mode, items, fields
 * and data adapter from the specified real-time subscription; or</li>
 * <li> {@link MpnSubscription}: the new object is initialized by copying all properties
 * (including the subscription ID) from the specified MPN subscription. <b>The created MpnSubscription is a copy of
 * the original MpnSubscription object and represents the same MPN subscription, since their subscription ID
 * is the same. When the object is supplied to {@link LightstreamerClient#subscribeMpn} in order to bring it
 * to "active" state, the MPN subscription is modified: any property changed in this MpnSubscription
 * replaces the corresponding value of the MPN subscription on the server.</b></li>
 * </ul>
 *
 * @constructor
 * @exports MpnSubscription
 *
 * @param {String} subscriptionMode The subscription mode for the items, required by Lightstreamer Server. Permitted values are:<ul>
 * <li><code>MERGE</code></li>
 * <li><code>DISTINCT</code></li>
 * </ul>
 * @param {String[]} items An array of items to be subscribed to through Lightstreamer Server. It is also possible specify the "Item List" or
 * "Item Group" later through {@link MpnSubscription#setItems} and {@link MpnSubscription#setItemGroup}.
 * @param {String[]} fields An array of fields for the items to be subscribed to through Lightstreamer Server. It is also possible to specify the "Field List" or
 * "Field Schema" later through {@link MpnSubscription#setFields} and {@link MpnSubscription#setFieldSchema}.
 * @throws IllegalArgumentException If no or invalid subscription mode is passed.
 * @throws IllegalArgumentException If either the items or the fields array is left null.
 * @throws IllegalArgumentException If the specified "Item List" or "Field List" is not valid; see {@link MpnSubscription#setItems} and {@link MpnSubscription#setFields} for details.
 *
 * @class Class representing a Web Push Notification subscription to be submitted to the MPN Module of a Lightstreamer Server.<BR>
 * It contains subscription details and the listener needed to monitor its status. Real-time data is routed via native push notifications.<BR>
 * In order to successfully subscribe an MPN subscription, first an MpnDevice must be created and registered on the LightstreamerClient with
 * {@link LightstreamerClient#registerForMpn}.<BR>
 * After creation, an MpnSubscription object is in the "inactive" state. When an MpnSubscription object is subscribed to on an LightstreamerClient
 * object, through the {@link LightstreamerClient#subscribeMpn} method, its state switches to "active". This means that the subscription request
 * is being sent to the Lightstreamer Server. Once the server accepted the request, it begins to send real-time events via native push notifications and
 * the MpnSubscription object switches to the "subscribed" state.<BR>
 * If a trigger expression is set, the MPN subscription does not send any push notifications until the expression evaluates to true. When this happens,
 * the MPN subscription switches to "triggered" state and a single push notification is sent. Once triggered, no other push notifications are sent.<BR>
 * When an MpnSubscription is subscribed on the server, it acquires a permanent subscription ID that the server later uses to identify the same
 * MPN subscription on subsequent sessions.<BR>
 * An MpnSubscription can be configured to use either an Item Group or an Item List to specify the items to be subscribed to, and using either a Field Schema
 * or Field List to specify the fields. The same rules that apply to {@link Subscription} apply to MpnSubscription.<BR>
 * An MpnSubscription object can also be provided by the client to represent a pre-existing MPN subscription on the server. In fact, differently than real-time
 * subscriptions, MPN subscriptions are persisted on the server's MPN Module database and survive the session they were created on.<BR>
 * MPN subscriptions are associated with the MPN device, and after the device has been registered the client retrieves pre-existing MPN subscriptions from the
 * server's database and exposes them with the {@link LightstreamerClient#getMpnSubscriptions} method.
 */
export class MpnSubscription {
    constructor(subscriptionMode: string, items: String[], fields: String[]);
    /**
     * Adds a listener that will receive events from the MpnSubscription
     * instance.
     * <BR>The same listener can be added to several different MpnSubscription
     * instances.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
     *
     * @param {MpnSubscriptionListener} listener An object that will receive the events
     * as shown in the {@link MpnSubscriptionListener} interface.
     * <BR>Note that the given instance does not have to implement all of the
     * methods of the MpnSubscriptionListener interface. In fact it may also
     * implement none of the interface methods and still be considered a valid
     * listener. In the latter case it will obviously receive no events.
     */
    addListener(listener: MpnSubscriptionListener): void;
    /**
     * Removes a listener from the MpnSubscription instance so that it
     * will not receive events anymore.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     *
     * @param {MpnSubscriptionListener} listener The listener to be removed.
     */
    removeListener(listener: MpnSubscriptionListener): void;
    /**
     * Returns an array containing the {@link MpnSubscriptionListener} instances that
     * were added to this client.
     *
     * @return {MpnSubscriptionListener[]} an Array containing the listeners that were added to this client.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners(): MpnSubscriptionListener[];
    /**
     * Returns the JSON structure to be used as the format of push notifications.<BR>
     * This JSON structure is sent by the server to the push notification service provider (FCM or APNs), hence it must follow
     * its specifications.<BR>
     *
     * @return {String} the JSON structure to be used as the format of push notifications.
     *
     * @see #setNotificationFormat
     */
    getNotificationFormat(): string;
    /**
     * Sets the JSON structure to be used as the format of push notifications.<BR>
     * This JSON structure is sent by the server to the push notification service provider (FCM or APNs), hence it must follow
     * its specifications.<BR>
     * The JSON structure may contain named arguments with the format <code>${field}</code>, or indexed arguments with the format <code>$[1]</code>. These arguments are
     * replaced by the server with the value of corresponding subscription fields before the push notification is sent.<BR>
     * For instance, if the subscription contains fields "stock_name" and "last_price", the notification format could be something like this:<ul>
     * <li><code>{ "notification" : { "body" : "Stock ${stock_name} is now valued ${last_price}" } }</code></li>
     * </ul>
     * Named arguments are available if the Metadata Adapter is a subclass of LiteralBasedProvider or provides equivalent functionality, otherwise only
     * indexed arguments may be used. In both cases common metadata rules apply: field names and indexes are checked against the Metadata Adapter, hence
     * they must be consistent with the schema and group specified.<BR>
     * A special server-managed argument may also be used:<ul>
     * <li><code>${LS_MPN_subscription_ID}</code>: the ID of the MPN subscription generating the push notification.
     * </ul>
     * The MpnBuilder object provides methods to build an appropriate JSON structure from its defining fields.<BR>
     * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
     * named arguments are always mapped to its corresponding indexed argument, even if originally the notification format used a named argument.<BR>
     * Note: the content of this property may be subject to length restrictions (See the "General Concepts" document for more information).
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>notification_format</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param {String} format the JSON structure to be used as the format of push notifications.
     * @throws IllegalStateException if the MpnSubscription is currently "active".
     *
     * @see FirebaseMpnBuilder
     * @see SafariMpnBuilder
     */
    setNotificationFormat(format: string): void;
    /**
     * Returns the boolean expression that is evaluated against each update and acts as a trigger to deliver the push notification.
     *
     * @return {boolean} the boolean expression that acts as a trigger to deliver the push notification.
     *
     * @see #setTriggerExpression
     */
    getTriggerExpression(): boolean;
    /**
     * Sets the boolean expression that will be evaluated against each update and will act as a trigger to deliver the push notification.<BR>
     * If a trigger expression is set, the MPN subscription does not send any push notifications until the expression evaluates to true. When this happens,
     * the MPN subscription "triggers" and a single push notification is sent. Once triggered, no other push notifications are sent. In other words, with a trigger
     * expression set, the MPN subscription sends *at most one* push notification.<BR>
     * The expression must be in Java syntax and can contain named arguments with the format <code>${field}</code>, or indexed arguments with the format <code>$[1]</code>.
     * The same rules that apply to {@link MpnSubscription#setNotificationFormat} apply also to the trigger expression. The expression is verified and evaluated on the server.<BR>
     * Named and indexed arguments are replaced by the server with the value of corresponding subscription fields before the expression is evaluated. They are
     * represented as String variables, and as such appropriate type conversion must be considered. E.g.<ul>
     * <li><code>Double.parseDouble(${last_price}) &gt; 500.0</code></li>
     * </ul>
     * Argument variables are named with the prefix <code>LS_MPN_field</code> followed by an index. Thus, variable names like <code>LS_MPN_field1</code> should be considered
     * reserved and their use avoided in the expression.<BR>
     * Consider potential impact on server performance when writing trigger expressions. Since Java code may use classes and methods of the JDK, a badly written
     * trigger may cause CPU hogging or memory exhaustion. For this reason, a server-side filter may be applied to refuse poorly written (or even
     * maliciously crafted) trigger expressions. See the "General Concepts" document for more information.<BR>
     * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
     * named arguments are always mapped to its corresponding indexed argument, even if originally the trigger expression used a named argument.<BR>
     * Note: the content of this property may be subject to length restrictions (See the "General Concepts" document for more information).
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>trigger</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param {boolean} expr the boolean expression that acts as a trigger to deliver the push notification.
     * @throws IllegalStateException if the MpnSubscription is currently "active".
     *
     * @see #isTriggered
     */
    setTriggerExpression(expr: boolean): void;
    /**
     * Checks if the MpnSubscription is currently "active" or not.<BR>
     * Most of the MpnSubscription properties cannot be modified if an MpnSubscription is "active".<BR>
     * The status of an MpnSubscription is changed to "active" through the {@link LightstreamerClient#subscribeMpn} method and back to "inactive"
     * through the {@link LightstreamerClient#unsubscribeMpn} and {@link LightstreamerClient#unsubscribeMpnSubscriptions} ones.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {boolean}true if the MpnSubscription is currently "active", false otherwise.
     *
     * @see #getStatus
     * @see LightstreamerClient#subscribeMpn
     * @see LightstreamerClient#unsubscribeMpn
     * @see LightstreamerClient#unsubscribeMpnSubscriptions
     */
    isActive(): boolean;
    /**
     * Checks if the MpnSubscription is currently subscribed to through the server or not.<BR>
     * This flag is switched to true by server sent subscription events, and back to false in case of client disconnection,
     * {@link LightstreamerClient#unsubscribeMpn} or {@link LightstreamerClient#unsubscribeMpnSubscriptions} calls, and server sent
     * unsubscription events.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {boolean} true if the MpnSubscription has been successfully subscribed on the server, false otherwise.
     *
     * @see #getStatus
     * @see LightstreamerClient#unsubscribe
     * @see LightstreamerClient#unsubscribeMpnSubscriptions
     */
    isSubscribed(): boolean;
    /**
     * Checks if the MpnSubscription is currently triggered or not.<BR>
     * This flag is switched to true when a trigger expression has been set and it evaluated to true at least once. For this to happen, the subscription
     * must already be in "active" and "subscribed" states. It is switched back to false if the subscription is modified with a
     * {@link LightstreamerClient#subscribeMpn} call on a copy of it, deleted with {@link LightstreamerClient#unsubscribeMpn} or
     * {@link LightstreamerClient#unsubscribeMpnSubscriptions} calls, and server sent subscription events.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {boolean} true if the MpnSubscription's trigger expression has been evaluated to true at least once, false otherwise.
     *
     * @see #getStatus
     * @see LightstreamerClient#subscribe
     * @see LightstreamerClient#unsubscribe
     * @see LightstreamerClient#unsubscribeMpnSubscriptions
     */
    isTriggered(): boolean;
    /**
     * The status of the subscription.<BR>
     * The status can be:<ul>
     * <li><code>UNKNOWN</code>: when the MPN subscription has just been created or deleted (i.e. unsubscribed). In this status {@link MpnSubscription#isActive}, {@link MpnSubscription#isSubscribed}
     * and {@link MpnSubscription#isTriggered} are all false.</li>
     * <li><code>ACTIVE</code>: when the MPN subscription has been submitted to the server, but no confirm has been received yet. In this status {@link MpnSubscription#isActive} is true,
     * {@link MpnSubscription#isSubscribed} and {@link MpnSubscription#isTriggered} are false.</li>
     * <li><code>SUBSCRIBED</code>: when the MPN subscription has been successfully subscribed on the server. If a trigger expression is set, it has not been
     * evaluated to true yet. In this status {@link MpnSubscription#isActive} and {@link MpnSubscription#isSubscribed} are true, {@link MpnSubscription#isTriggered} is false.</li>
     * <li><code>TRIGGERED</code>: when the MPN subscription has a trigger expression set, has been successfully subscribed on the server and
     * the trigger expression has been evaluated to true at least once. In this status {@link MpnSubscription#isActive}, {@link MpnSubscription#isSubscribed} and {@link MpnSubscription#isTriggered} are all true.</li>
     * </ul>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the status of the subscription.
     *
     * @see #isActive
     * @see #isSubscribed
     * @see #isTriggered
     */
    getStatus(): string;
    /**
     * The server-side timestamp of the subscription status.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>status_timestamp</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @return {Number} The server-side timestamp of the subscription status, expressed as a Java time.
     *
     * @see #getStatus
     */
    getStatusTimestamp(): number;
    /**
     * Setter method that sets the "Item List" to be subscribed to through
     * Lightstreamer Server. <BR>
     * Any call to this method will override any "Item List" or "Item Group"
     * previously specified.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
     * instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>group</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param {String[]} items an array of items to be subscribed to through the server.
     * @throws IllegalArgumentException if any of the item names in the "Item List"
     * contains a space or is a number or is empty/null.
     * @throws IllegalStateException if the MpnSubscription is currently
     * "active".
     */
    setItems(items: String[]): void;
    /**
     * Inquiry method that can be used to read the "Item List" specified for this MpnSubscription.<BR>
     * Note that if the single-item-constructor was used, this method will return an array
     * of length 1 containing such item.<BR>
     * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
     * items are always expressed with an "Item Group"", even if originally the MPN subscription used an "Item List".
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the MpnSubscription has been initialized
     * with an "Item List".</p>
    
     * @return {String[]} the "Item List" to be subscribed to through the server.
     *
     * @throws IllegalStateException if the MpnSubscription was not initialized.
     */
    getItems(): String[];
    /**
     * Setter method that sets the "Item Group" to be subscribed to through
     * Lightstreamer Server. <BR>
     * Any call to this method will override any "Item List" or "Item Group"
     * previously specified.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
     * instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>group</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param {String} groupName A String to be expanded into an item list by the
     * Metadata Adapter.
     * @throws IllegalStateException if the MpnSubscription is currently
     * "active".
     */
    setItemGroup(groupName: string): void;
    /**
     * Inquiry method that can be used to read the item group specified for this MpnSubscription.<BR>
     * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
     * items are always expressed with an "Item Group"", even if originally the MPN subscription used an "Item List".
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the MpnSubscription has been initialized
     * using an "Item Group"</p>
     *
     * @return {String} the "Item Group" to be subscribed to through the server.
     *
     * @throws IllegalStateException if the MpnSubscription was not initialized.
     */
    getItemGroup(): string;
    /**
     * Setter method that sets the "Field List" to be subscribed to through
     * Lightstreamer Server. <BR>
     * Any call to this method will override any "Field List" or "Field Schema"
     * previously specified.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
     * instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>schema</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param {String[]} fields an array of fields to be subscribed to through the server.
     * @throws IllegalArgumentException if any of the field names in the list
     * contains a space or is empty/null.
     * @throws IllegalStateException if the MpnSubscription is currently
     * "active".
     */
    setFields(fields: String[]): void;
    /**
     * Inquiry method that can be used to read the "Field List" specified for this MpnSubscription.<BR>
     * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
     * fields are always expressed with a "Field Schema"", even if originally the MPN subscription used a "Field List".
     *
     * <p class="lifecycle"><b>Lifecycle:</b>  This method can only be called if the MpnSubscription has been initialized
     * using a "Field List".</p>
     *
     * @return {String[]} the "Field List" to be subscribed to through the server.
     *
     * @throws IllegalStateException if the MpnSubscription was not initialized.
     */
    getFields(): String[];
    /**
     * Setter method that sets the "Field Schema" to be subscribed to through
     * Lightstreamer Server. <BR>
     * Any call to this method will override any "Field List" or "Field Schema"
     * previously specified.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
     * instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>schema</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param {String} schemaName A String to be expanded into a field list by the
     * Metadata Adapter.
     *
     * @throws IllegalStateException if the MpnSubscription is currently
     * "active".
     */
    setFieldSchema(schemaName: string): void;
    /**
     * Inquiry method that can be used to read the field schema specified for this MpnSubscription.<BR>
     * Note: if the MpnSubscription has been created by the client, such as when obtained through {@link LightstreamerClient#getMpnSubscriptions},
     * fields are always expressed with a "Field Schema"", even if originally the MPN subscription used a "Field List".
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called if the MpnSubscription has been initialized
     * using a "Field Schema"</p>
     *
     * @return {String} the "Field Schema" to be subscribed to through the server.
    
     * @throws IllegalStateException if the MpnSubscription was not initialized.
     */
    getFieldSchema(): string;
    /**
     * Setter method that sets the name of the Data Adapter
     * (within the Adapter Set used by the current session)
     * that supplies all the items for this MpnSubscription. <BR>
     * The Data Adapter name is configured on the server side through
     * the "name" attribute of the "data_provider" element, in the
     * "adapters.xml" file that defines the Adapter Set (a missing attribute
     * configures the "DEFAULT" name). <BR>
     * Note that if more than one Data Adapter is needed to supply all the
     * items in a set of items, then it is not possible to group all the
     * items of the set in a single MpnSubscription. Multiple MpnSubscriptions
     * have to be defined.
     *
     * <p class="default-value"><b>Default value:</b> The default Data Adapter for the Adapter Set,
     * configured as "DEFAULT" on the Server.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
     * instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>adapter</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param {String} dataAdapter the name of the Data Adapter. A null value
     * is equivalent to the "DEFAULT" name.
     * @throws IllegalStateException if the Subscription is currently
     * "active".
     *
     * @see ConnectionDetails#setAdapterSet
     */
    setDataAdapter(dataAdapter: string): void;
    /**
     * Inquiry method that can be used to read the name of the Data Adapter specified for this
     * MpnSubscription through {@link MpnSubscription#setDataAdapter}.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the name of the Data Adapter; returns null if no name has been configured,
     * so that the "DEFAULT" Adapter Set is used.
     */
    getDataAdapter(): string;
    /**
     * Setter method that sets the length to be requested to Lightstreamer
     * Server for the internal queuing buffers for the items in the MpnSubscription.<BR>
     * A Queuing buffer is used by the Server to accumulate a burst
     * of updates for an item, so that they can all be sent to the client,
     * despite of bandwidth or frequency limits.<BR>
     * Note that the Server may pose an upper limit on the size of its internal buffers.
     *
     * <p class="default-value"><b>Default value:</b> null, meaning to lean on the Server default based on the subscription
     * mode. This means that the buffer size will be 1 for MERGE
     * subscriptions and "unlimited" for DISTINCT subscriptions. See
     * the "General Concepts" document for further details.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
     * instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>requested_buffer_size</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param size  An integer number, representing the length of the internal queuing buffers
     * to be used in the Server. If the string "unlimited" is supplied, then no buffer
     * size limit is requested (the check is case insensitive). It is also possible
     * to supply a null value to stick to the Server default (which currently
     * depends on the subscription mode).
     * @throws IllegalStateException if the MpnSubscription is currently
     * "active".
     * @throws IllegalArgumentException if the specified value is not
     * null nor "unlimited" nor a valid positive integer number.
     *
     * @see MpnSubscription#setRequestedMaxFrequency
     */
    setRequestedBufferSize(size: any): void;
    /**
     * Inquiry method that can be used to read the buffer size, configured though
     * {@link MpnSubscription#setRequestedBufferSize}, to be requested to the Server for
     * this MpnSubscription.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {Number|String} An integer number, representing the buffer size to be requested to the server,
     * or the string "unlimited", or null.
     */
    getRequestedBufferSize(): number | string;
    /**
     * Setter method that sets the maximum update frequency to be requested to
     * Lightstreamer Server for all the items in the MpnSubscription.<BR>
     * Note that frequency limits on the items can also be set on the
     * server side and this request can only be issued in order to further
     * reduce the frequency, not to rise it beyond these limits.
     *
     * <p class="edition-note"><B>Edition Note:</B> A further global frequency limit could also be imposed by the Server,
     * depending on Edition and License Type.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
     *
     * <p class="default-value"><b>Default value:</b> null, meaning to lean on the Server default based on the subscription
     * mode. This consists, for all modes, in not applying any frequency
     * limit to the subscription (the same as "unlimited"); see the "General Concepts"
     * document for further details.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called while the MpnSubscription
     * instance is in its "inactive" state.</p>
     *
     * <p class="notification"><b>Notification:</b> A change to this setting will be notified through a call to {@link MpnSubscriptionListener#onPropertyChanged}
     * with argument <code>requested_max_frequency</code> on any {@link MpnSubscriptionListener} listening to the related MpnSubscription.</p>
     *
     * @param freq  A decimal number, representing the maximum update frequency (expressed in updates
     * per second) for each item in the Subscription; for instance, with a setting
     * of 0.5, for each single item, no more than one update every 2 seconds
     * will be received. If the string "unlimited" is supplied, then no frequency
     * limit is requested. It is also possible to supply the null value to stick
     * to the Server default (which currently corresponds to "unlimited").
     * The check for the string constants is case insensitive.
     * @throws IllegalStateException if the MpnSubscription is currently
     * "active".
     * @throws IllegalArgumentException if the specified value is not
     * null nor the special "unlimited" value nor a valid positive number.
     */
    setRequestedMaxFrequency(freq: any): void;
    /**
     * Inquiry method that can be used to read the max frequency, configured
     * through {@link MpnSubscription#setRequestedMaxFrequency}, to be requested to the
     * Server for this MpnSubscription.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {Number|String} A decimal number, representing the max frequency to be requested to the server
     * (expressed in updates per second), or the string "unlimited", or null.
     */
    getRequestedMaxFrequency(): number | string;
    /**
     * Inquiry method that can be used to read the mode specified for this
     * MpnSubscription.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the MpnSubscription mode specified in the constructor.
     */
    getMode(): string;
    /**
     * The server-side unique persistent ID of the MPN subscription.<BR>
     * The ID is available only after the MPN subscription has been successfully subscribed on the server. I.e. when its status is <code>SUBSCRIBED</code> or
     * <code>TRIGGERED</code>.<BR>
     * Note: more than one MpnSubscription may exists at any given time referring to the same MPN subscription, and thus with the same subscription ID.
     * For instace, copying an MpnSubscription with the copy initializer creates a second MpnSubscription instance with the same subscription ID. Also,
     * the <code>coalescing</code> flag of {@link LightstreamerClient#subscribeMpn} may cause the assignment of a pre-existing MPN subscription ID
     * to the new subscription.<BR>
     * Two MpnSubscription objects with the same subscription ID always represent the same server-side MPN subscription. It is the client's duty to keep the status
     * and properties of these objects up to date and aligned.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the MPN subscription ID.
     */
    getSubscriptionId(): string;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports MpnSubscriptionListener
 *
 * @class Interface to be implemented to receive {@link MpnSubscription} events including subscription/unsubscription, triggering and status change.<BR>
 */
export class MpnSubscriptionListener {
    constructor();
    /**
     * Event handler called when the MpnSubscriptionListener instance is added to an {@link MpnSubscription} through
     * {@link MpnSubscription#addListener}.<BR>
     * This is the first event to be fired on the listener.
     *
     * @param {MpnSubscription} subscription The {@link MpnSubscription} this instance was added to.
     */
    onListenStart?(subscription: MpnSubscription): void;
    /**
     * Event handler called when the MpnSubscriptionListener instance is removed from an {@link MpnSubscription} through
     * {@link MpnSubscription#removeListener}.<BR>
     * This is the last event to be fired on the listener.
     *
     * @param {MpnSubscription} subscription The {@link MpnSubscription} this instance was removed from.
     */
    onListenEnd?(subscription: MpnSubscription): void;
    /**
     * Event handler called when an {@link MpnSubscription} has been successfully subscribed to on the server's MPN Module.<BR>
     * This event handler is always called before other events related to the same subscription.<BR>
     * Note that this event can be called multiple times in the life of an MpnSubscription instance only in case it is subscribed multiple times
     * through {@link LightstreamerClient#unsubscribeMpn} and {@link LightstreamerClient#subscribeMpn}. Two consecutive calls
     * to this method are not possible, as before a second <code>onSubscription()</code> event an {@link MpnSubscriptionListener#onUnsubscription} event is always fired.
     */
    onSubscription?(): void;
    /**
     * Event handler called when an {@link MpnSubscription} has been successfully unsubscribed from on the server's MPN Module.<BR>
     * After this call no more events can be received until a new {@link MpnSubscriptionListener#onSubscription} event.<BR>
     * Note that this event can be called multiple times in the life of an MpnSubscription instance only in case it is subscribed multiple times
     * through {@link LightstreamerClient#unsubscribeMpn} and {@link LightstreamerClient#subscribeMpn}. Two consecutive calls
     * to this method are not possible, as before a second <code>onUnsubscription()</code> event an {@link MpnSubscriptionListener#onSubscription} event is always fired.
     */
    onUnsubscription?(): void;
    /**
     * Event handler called when the server notifies an error while subscribing to an {@link MpnSubscription}.<BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:<ul>
     * <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set.</li>
     * <li>21 - bad Group name.</li>
     * <li>22 - bad Group name for this Schema.</li>
     * <li>23 - bad Schema name.</li>
     * <li>24 - mode not allowed for an Item.</li>
     * <li>30 - subscriptions are not allowed by the current license terms (for special licenses only).</li>
     * <li>40 - the MPN Module is disabled, either by configuration or by license restrictions.</li>
     * <li>41 - the request failed because of some internal resource error (e.g. database connection, timeout, etc.).</li>
     * <li>43 - invalid or unknown application ID.</li>
     * <li>44 - invalid syntax in trigger expression.</li>
     * <li>45 - invalid or unknown MPN device ID.</li>
     * <li>46 - invalid or unknown MPN subscription ID (for MPN subscription modifications).</li>
     * <li>47 - invalid argument name in notification format or trigger expression.</li>
     * <li>48 - MPN device suspended.</li>
     * <li>49 - one or more subscription properties exceed maximum size.</li>
     * <li>50 - no items or fields have been specified.</li>
     * <li>52 - the notification format is not a valid JSON structure.</li>
     * <li>53 - the notification format is empty.</li>
     * <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection.</li>
     * <li>68 - the Server could not fulfill the request because of an internal error.</li>
     * <li>&lt;= 0 - the Metadata Adapter has refused the subscription request; the code value is dependent on the specific Metadata Adapter implementation.</li>
     * </ul>
     * @param {String} message The description of the error sent by the Server; it can be null.
     */
    onSubscriptionError?(code: number, message: string): void;
    /**
     * Event handler called when the server notifies an error while unsubscribing from an {@link MpnSubscription}.<BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:<ul>
     * <li>30 - subscriptions are not allowed by the current license terms (for special licenses only).</li>
     * <li>40 - the MPN Module is disabled, either by configuration or by license restrictions.</li>
     * <li>41 - the request failed because of some internal resource error (e.g. database connection, timeout, etc.).</li>
     * <li>43 - invalid or unknown application ID.</li>
     * <li>45 - invalid or unknown MPN device ID.</li>
     * <li>46 - invalid or unknown MPN subscription ID.</li>
     * <li>48 - MPN device suspended.</li>
     * <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection.</li>
     * <li>68 - the Server could not fulfill the request because of an internal error.</li>
     * <li>&lt;= 0 - the Metadata Adapter has refused the unsubscription request; the code value is dependent on the specific Metadata Adapter implementation.</li>
     * </ul>
     * @param {String} message The description of the error sent by the Server; it can be null.
     */
    onUnsubscriptionError?(code: number, message: string): void;
    /**
     * Event handler called when the server notifies that an {@link MpnSubscription} did trigger.<BR>
     * For this event to be called the MpnSubscription must have a trigger expression set and it must have been evaluated to true at
     * least once.<BR>
     * Note that this event can be called multiple times in the life of an MpnSubscription instance only in case it is subscribed multiple times
     * through {@link LightstreamerClient#unsubscribeMpn} and {@link LightstreamerClient#subscribeMpn}. Two consecutive calls
     * to this method are not possible.<BR>
     * Note also that in some server clustering configurations this event may not be called. The corresponding push notification is always sent, though.
     *
     * @see MpnSubscription#setTriggerExpression
     */
    onTriggered?(): void;
    /**
     * Event handler called when the server notifies that an {@link MpnSubscription} changed its status.<BR>
     * Note that in some server clustering configurations the status change for the MPN subscription's trigger event may not be called. The corresponding push
     * notification is always sent, though.
     *
     * @param {String} status The new status of the MPN subscription. It can be one of the following:<ul>
     * <li><code>UNKNOWN</code></li>
     * <li><code>ACTIVE</code></li>
     * <li><code>SUBSCRIBED</code></li>
     * <li><code>TRIGGERED</code></li>
     * </ul>
     * @param {Number} timestamp The server-side timestamp of the new subscription status.
     *
     * @see MpnSubscription#getStatus
     * @see MpnSubscription#getStatusTimestamp
     */
    onStatusChanged?(status: string, timestamp: number): void;
    /**
     * Event handler called each time the value of a property of {@link MpnSubscription} is changed.<BR>
     * Properties can be modified by direct calls to their setter or by server sent events. A property may be changed by a server sent event when the MPN subscription is
     * modified, or when two MPN subscriptions coalesce (see {@link LightstreamerClient#subscribeMpn}).
     *
     * @param {String} propertyName The name of the changed property. It can be one of the following:<ul>
     * <li><code>mode</code></li>
     * <li><code>group</code></li>
     * <li><code>schema</code></li>
     * <li><code>adapter</code></li>
     * <li><code>notification_format</code></li>
     * <li><code>trigger</code></li>
     * <li><code>requested_buffer_size</code></li>
     * <li><code>requested_max_frequency</code></li>
     * <li><code>status_timestamp</code></li>
     * </ul>
     */
    onPropertyChanged?(propertyName: string): void;
}

/**
 * Constructor for RemoteAppender.
 * @constructor
 *
 * @exports RemoteAppender
 *
 * @throws {IllegalArgumentException} if the LightstreamerClient parameter is missing
 *
 * @param {String} level The threshold level at which the RemoteAppender is created.
 * It should be one of "WARN", "ERROR" and "FATAL".
 * The use for "DEBUG" and "INFO" levels is not supported on this appender.
 * @param {String} category The category this appender should listen to.
 * See {@link SimpleLogAppender#setCategoryFilter}.
 * @param {LightstreamerClient} lsClient An instance of LightstreamerClient object used to send
 * log messages back to the server.
 *
 * @class RemoteAppender extends SimpleLogAppender and implements the publishing
 * of log messages by sending them back to Lightstreamer Server.
 * The Server will log the messages through its "LightstreamerLogger.webclient" logger
 * at DEBUG level.
 * <BR>Note that the delivery of some log messages to the Server may fail.
 *
 * @extends SimpleLogAppender
 */
export class RemoteAppender extends SimpleLogAppender {
    constructor(level: string, category: string, lsClient: LightstreamerClient);
    /**
     * Publish a log message by sending it to Lightstreamer server by LightstreamerClient object.
     * Specific layout: 'LS_log1=HH:mm:ss.ccc - category : message'.
     *
     * @param category The logger category that produced the given message.
     * @param level The logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL
     * constants values.
     * @param mex The message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     *
     */
    log(category: any, level: any, mex: any): void;
    /**
     * Disabled
     */
    extractLog(): void;
    /**
     * Called by SimpleLoggerProvider to notify itself to a newly added appender.
     * @param {SimpleLoggerProvider} loggerProvider the SimpleLoggerProvider instance handling this appender.
     */
    setLoggerProvider(loggerProvider: SimpleLoggerProvider): void;
    /**
     * Utility method that can be used by subclasses to join various info in a single line.
     * The message will be composed this way:  category + " | " + level + " | " + header + " | " + mex
     * @protected
     * @param {String} category the message category
     * @param {String} level the message level
     * @param {String} mex the message itself
     * @param {String} header a custom header
     * @returns {String}
     */
    protected composeLine(category: string, level: string, mex: string, header: string): string;
    /**
     * Inquiry method that returns the current threshold level of this SimpleLogAppender
     * instance.
     *
     * @return {String} the level of this SimpleLogAppender instance.
     * It will be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL".
     */
    getLevel(): string;
    /**
     * Setter method that changes the current threshold level of this
     * SimpleLogAppender instance.
     * The filter can be changed at any time and will affect subsequent log lines
     *
     * @param {String} [level] The new level for this SimpleLogAppender instance.
     * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not or wrongly
     * specified INFO will be used.
     */
    setLevel(level?: string): void;
    /**
     * Inquiry method that returns the category for this SimpleLogAppender instance.
     * A SimpleLogAppender only receives log lines from the {@link Logger}
     * associated to the returned category, unless
     * "*" is returned, in which case it receives log from all loggers.
     *
     * @return {String} The category of this SimpleLogAppender instance, or "*".
     */
    getCategoryFilter(): string;
    /**
     * Setter method that changes the current category of this
     * SimpleLogAppender instance.
     * <br/>This SimpleLogAppender will only receive log lines from the {@link Logger}
     * associated to the specified category, unless
     * "*" is specified, in which case it will receive log from all loggers.
     * <br/>the filter can be changed at any time and will affect subsequent log lines.
     *
     * @param {String} [category] the new category for this SimpleLogAppender, or "*".
     * If not specified "*" is assumed
     */
    setCategoryFilter(category?: string): void;
}

/**
 * Creates an object to be used to create a push notification format.<BR>
 * Use setters methods to set the value of push notification fields or use a JSON structure to initialize the fields.
 *
 * @constructor
 * @exports SafariMpnBuilder
 *
 * @param [notificationFormat] A JSON structure representing a push notification format.
 *
 * @class Utility class that provides methods to build or parse the JSON structure used to represent the format of a push notification.<BR>
 * It provides getters and setters for the fields of a push notification, following the format specified by Apple Push Notification Service (APNs).
 * This format is compatible with {@link MpnSubscription#setNotificationFormat}.
 *
 * @see MpnSubscription#setNotificationFormat
 */
export class SafariMpnBuilder {
    constructor(notificationFormat?: any);
    /**
     * Produces the JSON structure for the push notification format specified by this object.
     * @return {String} the JSON structure for the push notification format.
     */
    build(): string;
    /**
     * Gets the value of <code>aps&period;alert&period;title</code> field.
     * @return {String} the value of <code>aps&period;alert&period;title</code> field, or null if absent.
     */
    getTitle(): string;
    /**
     * Sets the <code>aps&period;alert&period;title</code> field.
     *
     * @param {String} title A string to be used for the <code>aps&period;alert&period;title</code> field value, or null to clear it.
     * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setTitle(title: string): SafariMpnBuilder;
    /**
     * Gets the value of <code>aps&period;alert&period;body</code> field.
     * @return {String} the value of <code>aps&period;alert&period;body</code> field, or null if absent.
     */
    getBody(): string;
    /**
     * Sets the <code>aps&period;alert&period;body</code> field.
     *
     * @param {String} body A string to be used for the <code>aps&period;alert&period;body</code> field value, or null to clear it.
     * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setBody(body: string): SafariMpnBuilder;
    /**
     * Gets the value of <code>aps&period;alert&period;action</code> field.
     * @return {String} the value of <code>aps&period;alert&period;action</code> field, or null if absent.
     */
    getAction(): string;
    /**
     * Sets the <code>aps&period;alert&period;action</code> field.
     *
     * @param {String} action A string to be used for the <code>aps&period;alert&period;action</code> field value, or null to clear it.
     * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setAction(action: string): SafariMpnBuilder;
    /**
     * Gets the value of <code>aps&period;url-args</code> field.
     * @return {String[]} the value of <code>aps&period;url-args</code> field, or null if absent.
     */
    getUrlArguments(): String[];
    /**
     * Sets the <code>aps&period;url-args</code> field.
     *
     * @param {String[]} urlArguments An array to be used for the <code>aps&period;url-args</code> field value, or null to clear it.
     * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
     */
    setUrlArguments(urlArguments: String[]): SafariMpnBuilder;
}

/**
 * Creates an object that will handle the positioning of the X axis and Y axis of
 * a {@link Chart} based on a few simple configuration parameters.
 * <BR>Note that this listener expects to listen to only one Chart but can
 * correctly handle different lines as long as they can be represented on the
 * same scale.
 * <BR>Methods from the {@link ChartListener} interface should not be called
 * directly on instances of this class.
 * @constructor
 *
 * @param {Number} [xSpan=60] The size of the X axis. The units of the value depends on
 * the model of the {@link Chart} instance and possibly on the parser configured on
 * the {@link Chart#setXAxis} method. If not specified, then 60 will be used.
 * @param {Number} [yPerc=20] A percentage that is used for the first positioning of the
 * Y axis: the Y axis will have as initial maximum position a value that is yPerc%
 * greater than the first Y position and as initial minimum position a value that
 * is yPerc% smaller than it. If not specified, then 20 (meaning 20%) will be used.
 *
 * @exports SimpleChartListener
 * @class Simple implementation of the {@link ChartListener} interface that can
 * be used to automatically adjust the axis of a {@link Chart} to center the lines on
 * the Chart.
 * <BR>In case of an X overflow the X axis limits will shift by half
 * of their total length meaning that the next point falls in the middle of the
 * visible area so that the shifting is not continuous for each new value
 * of X.
 * <BR>In case of an Y overflow the Y axis limits are stretched
 * in such a way that the new point falls on the visible part of the Y
 * axis.
 * <BR>Note that in case of an Y overflow all of the ChartLine instances of the
 * listened Chart will be stretched with the same values to keep the view consistent.
 *
 * @extends ChartListener
 */
export class SimpleChartListener extends ChartListener {
    constructor(xSpan?: number, yPerc?: number);
    /**
     * @inheritdoc
     */
    onListenStart?(): void;
    /**
     * Event handler that is called each time that, due to an update to the internal
     * model of the {@link Chart} this instance is listening to, a new
     * {@link ChartLine} is being generated and displayed.
     * By implementing this method, it is possible to configure the appearance
     * of the new line.
     * <BR>A new line can be generated only when a new row enters the
     * model. Moreover, based on the configuration of {@link Chart#addYAxis} a new
     * row in the model may generate more than one line resulting in this event being
     * fired more than one time for a single update.
     *
     * @param {String} key The key associated with the row that caused the line
     * of this event to be generated (keys are described in {@link AbstractWidget}).
     * @param {ChartLine} newChartLine The object representing the new line that has
     * been generated.
     * @param {Number} currentX The X-coordinate of the first point of the line
     * of this event.
     * @param {Number} currentY The Y-coordinate of the first point of the line
     * of this event.
     *
     */
    onNewLine?(key: string, newChartLine: ChartLine, currentX: number, currentY: number): void;
    /**
     * Event handler that is called each time that, due to an update to the internal
     * model of the {@link Chart} this instance is listening to, one of the currently
     * active {@link ChartLine} is being removed.
     *
     * @param {String} key The key associated with the row that was removed causing
     * this event to be fired (keys are described in {@link AbstractWidget}).
     * @param {ChartLine} removedChartLine The object representing the line that has
     * been removed.
     *
     * @see Chart#removeYAxis
     */
    onRemovedLine?(key: string, removedChartLine: ChartLine): void;
    /**
     * Event handler that is called when a new update has been received
     * such that one or more points have to be added to the chart lines,
     * but cannot be shown because their X-coordinate value is higher than
     * the upper limit set for the X axis.
     * By implementing this event handler, the chart axis can be repositioned
     * through {@link Chart#positionXAxis} so that the new points can be shown
     * on the chart.
     * <BR>Note that if a new update is received such that one or more points
     * have to be added to the chart lines but cannot be shown because their
     * X-coordinate value is lower than the lower limit set for the X axis,
     * then this event handler is not called, but rather the new update is
     * ignored. X axis limits should always be set in such a way as to avoid
     * this case.
     *
     * @param {String} key The key associated with the row that during its update
     * made the overflow happen.
     * @param {Number} lastX The X-coordinate value of the new points to be
     * shown on the chart and that exceeds the current upper limit.
     * @param {Number} xMin The current lower limit for the visible part
     * of the X axis.
     * @param {Number} xMax The current upper limit for the visible part
     * of the X axis.
     */
    onXOverflow?(key: string, lastX: number, xMin: number, xMax: number): void;
    /**
     * Event handler that is called when a new update has been received
     * such that a new point for this line has to be added to the chart,
     * but cannot be shown because its Y-coordinate value is higher than
     * the upper limit set for the Y axis on this line, or lower than the
     * lower limit.
     * By implementing this event handler, the line can be repositioned
     * through {@link ChartLine#positionYAxis} so that the new point can be shown
     * on the chart.
     *
     * @param {String} key The key associated with the row that during its update
     * made the overflow happen.
     * @param {ChartLine} toUpdateChartLine The object representing the line that
     * made the overflow happen.
     * @param {Number} lastY The Y-coordinate value of the new point to be
     * shown on the chart and that exceeds the current upper or lower limit.
     * @param {Number} yMin The current lower limit for the visible part
     * of the Y axis.
     * @param {Number} yMax The current upper limit for the visible part
     * of the Y axis.
     */
    onYOverflow?(key: string, toUpdateChartLine: ChartLine, lastY: number, yMin: number, yMax: number): void;
}

/**
 * This is an abstract class; no instances of this class should be created.
 * @constructor
 *
 * @param {String} level The threshold level at which the SimpleLogAppender is created.
 * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not
 * or wrongly specified INFO is assumed.
 * @param {String} category The category this appender should listen to.
 * If not specified the appender will get log for every available category.
 *
 * @exports SimpleLogAppender
 * @class Abstract class serving as a base class for appender classes for the {@link SimpleLoggerProvider}.
 * An instance of an appender class can be added
 * to a {@link SimpleLoggerProvider} instance in order to consume log lines.
 * <br/>Various classes that extend LogAppender and that consume the log lines
 * in various ways are provided. The definition of custom appender
 * implementations is supported through the usage of the {@link module:Inheritance Inheritance} utility.
 */
export class SimpleLogAppender {
    constructor(level: string, category: string);
    /**
     * Called by SimpleLoggerProvider to notify itself to a newly added appender.
     * @param {SimpleLoggerProvider} loggerProvider the SimpleLoggerProvider instance handling this appender.
     */
    setLoggerProvider(loggerProvider: SimpleLoggerProvider): void;
    /**
     * This implementation is empty.
     * This is the method that is supposedly written by subclasses to publish log messages
     *
     * @param {String} category the logger category that produced the given message.
     * @param {String} level the logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL.
     * @param {String} mex the message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     * @param {String} header a header for the message
     */
    log(category: string, level: string, mex: string, header: string): void;
    /**
     * Utility method that can be used by subclasses to join various info in a single line.
     * The message will be composed this way:  category + " | " + level + " | " + header + " | " + mex
     * @protected
     * @param {String} category the message category
     * @param {String} level the message level
     * @param {String} mex the message itself
     * @param {String} header a custom header
     * @returns {String}
     */
    protected composeLine(category: string, level: string, mex: string, header: string): string;
    /**
     * Inquiry method that returns the current threshold level of this SimpleLogAppender
     * instance.
     *
     * @return {String} the level of this SimpleLogAppender instance.
     * It will be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL".
     */
    getLevel(): string;
    /**
     * Setter method that changes the current threshold level of this
     * SimpleLogAppender instance.
     * The filter can be changed at any time and will affect subsequent log lines
     *
     * @param {String} [level] The new level for this SimpleLogAppender instance.
     * It should be one of "DEBUG", "INFO", "WARN", "ERROR" and "FATAL". If not or wrongly
     * specified INFO will be used.
     */
    setLevel(level?: string): void;
    /**
     * Inquiry method that returns the category for this SimpleLogAppender instance.
     * A SimpleLogAppender only receives log lines from the {@link Logger}
     * associated to the returned category, unless
     * "*" is returned, in which case it receives log from all loggers.
     *
     * @return {String} The category of this SimpleLogAppender instance, or "*".
     */
    getCategoryFilter(): string;
    /**
     * Setter method that changes the current category of this
     * SimpleLogAppender instance.
     * <br/>This SimpleLogAppender will only receive log lines from the {@link Logger}
     * associated to the specified category, unless
     * "*" is specified, in which case it will receive log from all loggers.
     * <br/>the filter can be changed at any time and will affect subsequent log lines.
     *
     * @param {String} [category] the new category for this SimpleLogAppender, or "*".
     * If not specified "*" is assumed
     */
    setCategoryFilter(category?: string): void;
}

/**
 * Constructor for SimpleLogger.
 * @constructor
 *
 * @param provider A SimpleLoggerProvider object instance used to dispatch the log messages
 * produced by this Logger instance.
 * @param category A category name for the Logger instance.
 *
 * @exports SimpleLogger
 * @class {@link Logger} implementation returned by the {@link SimpleLoggerProvider}.
 * @extends Logger
 */
export class SimpleLogger extends Logger {
    constructor(provider: any, category: any);
    /**
     * Receives log messages at FATAL level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     *
     * @see LoggerProvider
     */
    fatal(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the FATAL level.
     * The method should return true if this Logger is enabled for FATAL events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log FATAL statements. However, even if the method returns false, FATAL log
     * lines may still be received by the {@link SimpleLogger#fatal} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if FATAL logging is enabled, false otherwise
     */
    isFatalEnabled(): boolean;
    /**
     * Receives log messages at ERROR level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    error(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the ERROR level.
     * The method should return true if this Logger is enabled for ERROR events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log ERROR statements. However, even if the method returns false, ERROR log
     * lines may still be received by the {@link SimpleLogger#error} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if ERROR logging is enabled, false otherwise
     */
    isErrorEnabled(): boolean;
    /**
     * Receives log messages at WARN level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    warn(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the WARN level.
     * The method should return true if this Logger is enabled for WARN events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log WARN statements. However, even if the method returns false, WARN log
     * lines may still be received by the {@link SimpleLogger#warn} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if WARN logging is enabled, false otherwise
     */
    isWarnEnabled(): boolean;
    /**
     * Receives log messages at INFO level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    info(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the INFO level.
     * The method should return true if this Logger is enabled for INFO events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log INFO statements. However, even if the method returns false, INFO log
     * lines may still be received by the {@link SimpleLogger#info} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if INFO logging is enabled, false otherwise
     */
    isInfoEnabled(): boolean;
    /**
     * Receives log messages at DEBUG level.
     *
     * @param {String} message The message to be logged.
     * @param {Error} [exception] An Exception instance related to the current log message.
     */
    debug(message: string, exception?: Error): void;
    /**
     * Checks if this Logger is enabled for the DEBUG level.
     * The method should return true if this Logger is enabled for DEBUG events,
     * false otherwise.
     * <BR>This property is intended to let the library save computational cost by suppressing the generation of
     * log DEBUG statements. However, even if the method returns false, DEBUG log
     * lines may still be received by the {@link SimpleLogger#debug} method
     * and should be ignored by the Logger implementation.
     *
     * @return {boolean} true if DEBUG logging is enabled, false otherwise
     */
    isDebugEnabled(): boolean;
    /**
     * Call by SimpleLoggerProvider to configure the minimum log level enabled.
     *
     * @param {String} [level] log level enabled, if missing or if a not expected value is used
     * "DEBUG" is assumed
     */
    setLevel(level?: string): void;
}

/**
 * Empty constructor for SimpleLoggerProvider.
 * @constructor
 *
 * @exports SimpleLoggerProvider
 *
 * @class SimpleLoggerProvider implementation that can be used to consume logging
 * from the {@link LightstreamerClient}.
 * To enable client logging, an instance of this class has to be created and supplied through the
 * {@link LightstreamerClient.setLoggerProvider} method before any log can be
 * consumed.
 * <br/>In order to determine how to consume the log, one or multiple "appenders"
 * can be supplied to this object, through {@link SimpleLoggerProvider#addLoggerAppender}.
 * The {@link Logger} instances created by this LoggerProvider for the various log categories
 * will forward the log lines to the appenders, based on the appender preferences configured.
 * Category and level filters are available and can be configured on each appender.
 * <br/>Several appender classes are distributed with the library in
 * order to enable custom code to consume the log in different ways:
 * {@link ConsoleAppender}, {@link AlertAppender},
 * {@link DOMAppender}, {@link FunctionAppender} and {@link BufferAppender}.
 * <BR>
 * <BR>The SimpleLoggerProvider is available for the implementation of custom logging;
 * just invoke the {@link LoggerProvider#getLogger} method to get {@link Logger}
 * objects for custom categories, then invoke the various methods available on the
 * loggers to produce log messages to be handled by the configured appenders.
 *
 * @extends LoggerProvider
 */
export class SimpleLoggerProvider extends LoggerProvider {
    constructor();
    /**
     * Adds a {@link SimpleLogAppender} to this SimpleLoggerProvider instance. Such appender
     * will receive log lines from the Logger instances generated by this SimpleLoggerProvider instance.
     * The appender defines a category and a threshold level,
     * so that it will receive only the log lines with a level equal to or greater
     * than the threshold and only from the Logger associated with the requested category.
     *
     * <br/>Appenders can be added at any time; any loggers already created
     * by this SimpleLoggerProvider instance will start using the new appender.
     * Until the first appender is added, all log will be discarded.
     *
     * @param {SimpleLogAppender} logAppender An instance of SimpleLogAppender that will consume
     * the log.
     */
    addLoggerAppender(logAppender: SimpleLogAppender): void;
    /**
     * Removes a {@link SimpleLogAppender} from this SimpleLoggerProvider instance.
     * <br/>Appenders can be removed at any time.
     *
     * @param {SimpleLogAppender} logAppender An instance of SimpleLogAppender that was previously
     * added to this SimpleLoggerProvider instance.
     *
     * @see SimpleLoggerProvider#addLoggerAppender
     */
    removeLoggerAppender(logAppender: SimpleLogAppender): void;
    /**
     * Logger factory that gets a logger related to a specified category name.
     * If such logger does not exist it is created.
     * A unique instance is always maintained for each logger name.
     * This method can potentially cause a memory leak as once a Logger
     * is created it will never be dismissed. It is expected that the number of
     * categories within a single application is somewhat limited and in any case
     * not growing with time.
     *
     * @param {String} category The name of the desired log category.
     *
     * @return {Logger} The desired Logger instance.
     */
    getLogger(category: string): Logger;
    /**
     * Publish a log message on all SimpleLogAppender object instances added to this SimpleLoggerProvider so far.
     *
     * @param {String} category The category name that produced the given message.
     * @param {String} level The logging level of the given message. It should be one of DEBUG INFO WARN ERROR FATAL
     * constants values.
     * @param {*} mex The message to be logged. It could be a String instance, an Error instance or any other
     * object, provided that it has a toString method.
     *
     */
    dispatchLog(category: string, level: string, mex: any): void;
}

/**
 * Creates an object that extends {@link AbstractGrid} displaying its values
 * in a grid made of HTML elements. The grid rows are displayed into statically
 * prepared HTML rows. The object can be supplied to
 * {@link Subscription#addListener} and {@link Subscription#removeListener}
 * in order to display data from one or more Subscriptions.
 * @constructor
 *
 * @param {String} id An identification string to be specified in the HTML element
 * as the data "data-grid" property
 * value to make it possible for this StaticGrid instance to recognize its cells.
 * The binding between the cells and the StaticGrid is performed during the
 * {@link AbstractGrid#parseHtml} execution.
 *
 * @param {boolean} autoParse If true the {@link AbstractGrid#parseHtml} method is executed
 * before the constructor execution is completed. If false the parseHtml method
 * has to be called later by custom code. It can be useful to set this flag
 * to false if, at the time of the StaticGrid instance creation, the HTML elements
 * designated as cells are not yet ready on the page.
 *
 * @param {Object} rootEl if specified, the cells to make up the HTML grid will
 * only be searched in the list of descendants of this node. Equivalent to a
 * {@link StaticGrid#setRootNode} call, but useful if autoParse is true.
 *
 * @param {Object[]} cells an array of DOMElement instances that will make up the
 * HTML grid for this StaticGrid instance. If specified and not empty, the parseHtml
 * method will avoid searching cells in the DOM of the page. Equivalent to multiple
 * {@link StaticGrid#addCell} calls, but also useful if autoParse is true.
 *
 * @exports StaticGrid
 * @class An {@link AbstractGrid} implementation that can be used to display
 * the values from the internal model in a statically prepared grid.
 * The HTML structure suitable for the visualization of the tabular model values
 * must be prepared up-front in the DOM of the page as a matrix of HTML cells.
 * The cells making up the grid can be any HTML element
 * owning the "data-source='Lightstreamer'" special attribute. Such cells, to be
 * properly bound to the StatiGrid instance must also define the following
 * custom attributes:
 * <ul>
 * <li>"data-grid": an identification string that has to be equal to the id
 * that is specified in the constructor of this class. This id is used
 * to properly bind a cell to its StaticGrid instance.</li>
 * <li>"data-field": the name of a field in the internal model whose value will
 * be displayed in this cell.</li>
 * <li>"data-fieldtype" (optional): "extra", "first-level" or "second-level" to
 * specify the type of field. If not specified "first-level" is assumed.
 * The "data-fieldtype" property is only exploited in the {@link AbstractGrid#extractFieldList}
 * and {@link AbstractGrid#extractCommandSecondLevelFieldList} methods.</li>
 * <li>"data-row" (only if "data-item" is not specified): a progressive number
 * representing the number of the row associated with the cell.
 * When a new row enters the grid its position will be decided by the
 * {@link AbstractGrid#setAddOnTop} and {@link AbstractGrid#setSort} settings.
 * The "data-row" attribute will define to which row a cell pertains.
 * <BR>Note that the maximum value available for a data-row attribute in all
 * the cells pertaining to this StaticGrid will define the size of the view.
 * If the number of rows in the model exceeds the number of rows defined in the
 * HTML grid, rows that would have been displayed in the extra rows are not shown
 * in the view but are maintained in the model.
 * <BR>Note that if this instance is used to listen to events from
 * {@link Subscription} instance(s), and the first Subscription it listens to is
 * a DISTINCT Subscription, then the behavior is different: when the number of rows
 * in the model exceeds the number of rows defined in the HTML grid, adding a new
 * row will always cause the removal of the oldest row from the model, with a
 * consequent repositioning of the remaining rows.
 * </li>
 * <li>"data-item" (only if "data-row" is not specified): the name of a row in
 * the internal model, whose value (for the chosen field) will be displayed in
 * this cell; this attribute should
 * only be used if this instance is used to listen to events from
 * {@link Subscription} instance using the MERGE mode; so, this attribute should
 * identify the name or the 1-based position of an item in the MERGE Subscription.
 * This way it is possible to define a static positioning for each item in
 * the MERGE Subscription. On the contrary, by using "data-row" attributes, each
 * item will be placed based only on the {@link AbstractGrid#setAddOnTop} and
 * {@link AbstractGrid#setSort} settings and the positioning may depend on the
 * arrival order of the updates.
 * </li>
 * <li>"data-replica" (optional): this attribute can be specified in case there
 * are more cells associated to the same field. If used, it will permit to access
 * the single cells during {@link StaticGridListener#onVisualUpdate} executions.</li>
 * </ul>
 * <BR>
 * <BR>The association between the StaticGrid and the HTML cells is made during the
 * execution of the {@link AbstractGrid#parseHtml} method. Note that only the elements
 * specified in the {@link AbstractGrid#setNodeTypes} and that are descendants of the node
 * specified in the {@link StaticGrid#setRootNode} are taken into account, unless a list
 * of cells has been manually specified in the constructor or through the {@link StaticGrid#addCell}
 * method, in which case no elements other than the given ones are taken into
 * account.
 * <BR>Cells already associated to the grid can be removed from the page DOM,
 * hence from the grid, at any time. Cells already associated can also be moved or
 * altered so that they become no longer suitable for association or other HTML
 * elements may be made suitable, but, in this case, all changes will affect the
 * grid only after the next invocation of {@link AbstractGrid#parseHtml}.
 * <BR>Make sure that all the associated cells specify the same attribute among
 * "data-row" and "data-item"; the behavior of the grid is left unspecified
 * when this condition is not met.
 * <BR>
 * <BR>By default, the content of the HTML element designated as cell will be
 * updated with the value from the internal model; in case the cell is an INPUT
 * or a TEXTAREA element, the "value" property will be updated instead.
 * It is possible to update any attribute of the HTML element or its CSS
 * styles by specifying the "data-update" custom attribute.
 * To target an attribute the attribute name has to be specified; it can be a
 * standard property (e.g. "data-update='href'"), a custom "data-" attribute
 * (e.g. "data-update='data-foo'") or even a custom attribute not respecting
 * the "data-" standard (e.g. "data-update='foo'").
 * To target CSS attributes the "data-update='style.attributeName'" form has to
 * be used (e.g. "data-update='style.backgroundColor'"); note that the form
 * "data-update='style.background-color'" will not be recognized by some browsers.
 * <BR>WARNING: also events like "onclick" can be assigned; in such cases make
 * sure that no malicious code may reach the internal model (for example
 * through the injection of undesired JavaScript code from the Data Adapter).
 * <BR>More visualization actions can be performed through the provided
 * {@link VisualUpdate} event objects received on the {@link StaticGridListener}.
 *
 * @extends AbstractGrid
 */
export class StaticGrid extends AbstractGrid {
    constructor(id: string, autoParse: boolean, rootEl: any, cells: object[]);
    /**
     * Operation method that adds an HTML cell pointer to the StaticGrid.
     * <BR>Note that if at least one cell is manually specified then the
     * {@link AbstractGrid#parseHtml} will not perform any search in the DOM of the page
     * and will only use the given cells.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Cell pointers can be added to a StaticGrid at any time.
     * However, before an HTML element is actually used as a cell by the StaticGrid
     * a call to {@link AbstractGrid#parseHtml} is necessary.</p>
     *
     * @param {Object} cellElement A DOM pointer to an HTML node.
     * The specified HTML node should be a "legal" cell for the StaticGrid
     * (i.e. should be defined according with the requirements for the
     * StaticGrid as described in the overview of this class). Moreover,
     * nodes of any types are allowed.
     */
    addCell(cellElement: any): void;
    /**
     * Setter method that specifies the root node to be used when searching for
     * grid cells. If specified, only descendants of the supplied node will
     * be checked.
     * <br>Anyway note that if nodes are explicitly set through the constructor or through
     * the {@link StaticGrid#addCell} method, then the search will not be performed at all.
     *
     * <p class="default-value"><b>Default value:</b> the entire document.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a root node can be specified at any time.
     * However, before a new search is performed for the StaticGrid
     * a call to {@link AbstractGrid#parseHtml} is necessary.</p>
     *
     * @param {Object} rootNode a DOM node to be used as starting point
     * when searching for grid cells.
     */
    setRootNode(rootNode: any): void;
    /**
     * Creates an array containing all of the unique values of the "data-item"
     * properties in all of the HTML elements associated to this grid during the
     * {@link AbstractGrid#parseHtml} execution.
     * The result of this method is supposed to be used as "Item List" of a Subscription.
     *
     * <BR>Execution of this method is pointless if HTML elements associated to this
     * grid through "data-item" specify an item position instead of an item name.
     *
     * @return {String[]} The list of unique values found in the "data-item" properties
     * of HTML element of this grid.
     */
    extractItemList(): String[];
    /**
     * Adds a listener that will receive events from the StaticGrid
     * instance.
     * <BR>The same listener can be added to several different StaticGrid
     * instances.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be added at any time.</p>
     *
     * @param {StaticGridListener} listener An object that will receive the events
     * as shown in the {@link StaticGridListener} interface.
     * <BR>Note that the given instance does not have to implement all of the
     * methods of the StaticGridListener interface. In fact it may also
     * implement none of the interface methods and still be considered a valid
     * listener. In the latter case it will obviously receive no events.
     */
    addListener(listener: StaticGridListener): void;
    /**
     * Removes a listener from the StaticGrid instance so that it
     * will not receive events anymore.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     *
     * @param {StaticGridListener} listener The listener to be removed.
     */
    removeListener(listener: StaticGridListener): void;
    /**
     * Returns an array containing the {@link StaticGridListener} instances that
     * were added to this client.
     *
     * @return {StaticGridListener[]} an array containing the listeners that were added to this instance.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners(): StaticGridListener[];
    /**
     * Setter method that enables or disables the interpretation of the
     * values in the model as HTML code.
     * For instance, if the value "&lt;a href='news03.htm'&gt;Click here&lt;/a&gt;"
     * is placed in the internal model (either by manual call of the
     * {@link AbstractWidget#updateRow} method or by listening on a
     * {@link SubscriptionListener#onItemUpdate} event)
     * and HTML interpretation is enabled, then the target cell
     * will contain a link; otherwise it will contain that bare text.
     * Note that the setting applies to all the cells in the associated grid.
     * Anyway if it's not the content of a cell that is going to be updated,
     * but one of its properties, then this setting is irrelevant for such cell.
     * <BR>WARNING: When turning HTML interpretation on, make sure that
     * no malicious code may reach the internal model (for example
     * through the injection of undesired JavaScript code from the Data Adapter).
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this setting can be changed at any time.
     * <BR>Note that values that have already been placed in the grid cells will not
     * be updated to reflect the new setting.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     * @throws {IllegalArgumentException} if the given value is not a valid
     * boolean value.
     *
     * @param {boolean} enable true/false to enable/disable HTML interpretation
     * for the pushed values.
     */
    setHtmlInterpretationEnabled(enable: boolean): void;
    /**
     * Inquiry method that gets the type of interpretation to be applied for
     * the pushed values for this grid. In fact, the values can be
     * put in the target cells as HTML code or as text.
     *
     * @return {boolean} true if pushed values are interpreted as HTML code, false
     * otherwise.
     *
     * @see AbstractGrid#setHtmlInterpretationEnabled
     */
    isHtmlInterpretationEnabled(): boolean;
    /**
     * Setter method that specifies a list of HTML element types to be searched for
     * during the mapping of the grid to the HTML made by {@link AbstractGrid#parseHtml}.
     *
     * <p class="default-value"><b>Default value:</b> an array containing DIV SPAN and INPUT.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> Node types can be specified at any time.
     * However, if the list is changed after the execution of the {@link AbstractGrid#parseHtml}
     * method then it will not be used until a new call to such method is performed.
     * </p>
     *
     * @param {String[]} nodeTypes an array of Strings representing the names of the node
     * types to be searched for. If the array contains an asterisk (*) then all the
     * node types will be checked.
     *
     * @see AbstractGrid#parseHtml
     */
    setNodeTypes(nodeTypes: String[]): void;
    /**
     * Inquiry method that gets the list of node of types that would be searched
     * in case of a call to {@link AbstractGrid#parseHtml}.
     *
     * @return {String[]} a list of node type names.
     *
     * @see AbstractGrid#setNodeTypes
     */
    getNodeTypes(): String[];
    /**
     * Setter method that decides whenever new rows entering the model will be
     * placed at the top of the grid or at the bottom.
     * <BR>Note that if the sort is enabled on the Grid through {@link AbstractGrid#setSort}
     * then this setting is ignored as new rows will be placed on their right
     * position based on the sort configuration.
     * <BR>Also note that the sort/add policy may be ignored depending on the grid
     * configuration; see the use of the "data-item" cell attribute in {@link StaticGrid}.
     *
     * <p class="default-value"><b>Default value:</b> false.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> this setting can be changed at any time.
     * <BR>Note anyway that changing this setting while the internal model
     * is not empty may result in a incosistent view.</p>
     *
     * @throws {IllegalArgumentException} if the given value is not a valid
     * boolean value.
     *
     * @param {boolean} isAddOnTop true/false to place new rows entering the model
     * as the first/last row of the grid.
     */
    setAddOnTop(isAddOnTop: boolean): void;
    /**
     * Inquiry method that gets true/false depending on how new rows
     * entering the grid are treated. If true is returned, new rows will be placed on top of
     * the grid. Viceversa, if false is returned, new rows are placed at the
     * bottom.
     *
     * @return {boolean} true if new rows are added on top, false otherwise.
     *
     * @see AbstractGrid#setAddOnTop
     */
    isAddOnTop(): boolean;
    /**
     * Setter method that configures the sort policy of the grid. If no
     * sorting policy is set, new rows are always added according with the
     * {@link AbstractGrid#setAddOnTop} setting.
     * If, on the other hand, sorting is enabled, then new
     * rows are positioned according to the sort criteria.
     * Sorting is also maintained upon update of an existing row; this may cause the row to be
     * repositioned.
     * <BR>If asynchronous row repositioning is undesired, it is possible to
     * set the sort and immediately disable it with two consecutive calls
     * to just enforce grid sorting based on the current contents.
     * <BR>The sort can also be performed on fields that are part of the model
     * but not part of the grid view.
     * <BR>Note that the sort/add policy may be ignored depending on the grid
     * configuration; see the use of the "data-item" cell attribute in {@link StaticGrid}.
     *
     * <p class="default-value"><b>Default value:</b> no sort is performed.</p>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> The sort configuration can be set and changed
     * at any time.</p>
     *
     * @throws {IllegalArgumentException} if one of the boolean parameters is neither
     * missing, null, nor a valid boolean value.
     *
     * @param {String} sortField The name of the field to be used as sort field,
     * or null to disable sorting.
     * @param {boolean} [descendingSort=false] true or false to perform descending or
     * ascending sort. This parameter is optional; if missing or null,
     * then ascending sort is performed.
     * @param {boolean} [numericSort=false] true or false to perform numeric or
     * alphabetical sort. This parameter is optional; if missing or null, then
     * alphabetical sort is performed.
     * @param {boolean} [commaAsDecimalSeparator=false] true to specify that sort
     * field values are decimal numbers in which the decimal separator is
     * a comma; false to specify it is a dot. This setting is used only if
     * numericSort is true, in which case it is optional, with false as its
     * default value.
     */
    setSort(sortField: string, descendingSort?: boolean, numericSort?: boolean, commaAsDecimalSeparator?: boolean): void;
    /**
     * Inquiry method that gets the name of the field currently used as sort
     * field, if available.
     *
     * @return {Number} The name of a field, or null if sorting is not currently
     * enabled.
     *
     * @see AbstractGrid#setSort
     */
    getSortField(): number;
    /**
     * Inquiry method that gets the sort direction currently configured.
     *
     * @return {boolean} true if descending sort is being performed, false if ascending
     * sort is, or null if sorting is not currently enabled.
     *
     * @see AbstractGrid#setSort
     */
    isDescendingSort(): boolean;
    /**
     * Inquiry method that gets the type of sort currently configured.
     *
     * @return {boolean} true if numeric sort is being performed, false if alphabetical
     * sort is, or null if sorting is not currently enabled.
     *
     * @see AbstractGrid#setSort
     */
    isNumericSort(): boolean;
    /**
     * Inquiry method that gets the type of interpretation to be used to
     * parse the sort field values in order to perform numeric sort.
     *
     * @return {boolean} true if comma is the decimal separator, false if it is a dot;
     * returns null if sorting is not currently enabled or numeric sorting
     * is not currently configured.
     *
     * @see AbstractGrid#setSort
     */
    isCommaAsDecimalSeparator(): boolean;
    /**
     * Creates an array containing all the unique values of the "data-field"
     * properties in all of the HTML elements associated to this grid during the
     * {@link AbstractGrid#parseHtml} execution. The result of this method is supposed to be
     * used as "Field List" of a Subscription.
     * <BR>Execution of this method is pointless if HTML elements associated to this
     * grid specify a field position instead of a field name in their "data-field"
     * property.
     * <BR>Note that elements specifying the "data-fieldtype" property set to "extra" or "second-level",
     * will be ignored by this method. This permits to distinguish fields that are part
     * of the main subscription (not specifying any "data-fieldtype" or specifying "first-level"), part of a
     * second-level Subscription (specifying "second-level") and not part of a Subscription at all,
     * but still manageable in a direct way (specifying "extra").
     *
     * @return {String[]} The list of unique values found in the "data-field" properties
     * of HTML element of this grid.
     *
     * @see Subscription#setFields
     */
    extractFieldList(): String[];
    /**
     * Creates an array containing all the unique values, of the "data-field" properties
     * in all of the HTML elements, having the "data-fieldtype" property set to "second-level",
     * associated to this grid during the {@link AbstractGrid#parseHtml} execution.
     * <BR>The result of this method is supposed to be
     * used as "Field List" of a second-level Subscription.
     * <BR>Execution of this method is pointless if HTML elements associated to this
     * grid specify a field position instead of a field name in their "data-field"
     * property.
     *
     * @return {String[]} The list of unique values found in the "data-field" properties
     * of HTML element of this grid.
     *
     * @see AbstractGrid#extractFieldList
     * @see Subscription#setCommandSecondLevelFields
     */
    extractCommandSecondLevelFieldList(): String[];
    /**
     * Operation method that is used to authorize and execute the binding of the
     * widget with the HTML of the page.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can only be called once the HTML structure
     * the instance is expecting to find are ready in the DOM.
     * That said, it can be invoked at any time and subsequent invocations will update
     * the binding to the current state of the page DOM. Anyway, newly found cells
     * will be left empty until the next update involving them.</p>
     *
     * @see Chart
     * @see DynaGrid
     * @see StaticGrid
     */
    parseHtml(): void;
    /**
     * Operation method that is used to force the choice of what to use
     * as key for the integration in the internal model, when receiving
     * an update from a Subscription this grid is listening to.
     * <BR>Specifying "ITEM_IS_KEY" tells the widget to use the item as key;
     * this is the behavior that is already the default one when the Subscription
     * is in "MERGE" or "RAW" mode (see {@link AbstractWidget} for details).
     * <BR>Specifying "UPDATE_IS_KEY" tells the widget to use a progressive number
     * as key; this is the behavior that is already the default one when the
     * Subscription is in "DISTINCT" mode (see {@link AbstractWidget} for details).
     * <BR>Note that when listening to different Subscriptions the default behavior
     * is set when the grid is added as listener for the first one and then applied
     * to all the others regardless of their mode.
     *
     * <p class="lifecycle"><b>Lifecycle:</b>this method can only be called
     * while the internal model is empty.</p>
     *
     * @throws {IllegalArgumentException} if the given value is not valid.
     * @throws {IllegalStateException} if called while the grid is not empty.
     *
     * @param {String} interpretation either "ITEM_IS_KEY" or "UPDATE_IS_KEY",
     * or null to restore the default behavior.
     */
    forceSubscriptionInterpretation(interpretation: string): void;
    /**
     * Event handler that is called by Lightstreamer each time an update
     * pertaining to an item in the Subscription has been received from the
     * Server.
     *
     * @param {ItemUpdate} updateInfo a value object containing the
     * updated values for all the fields, together with meta-information about
     * the update itself and some helper methods that can be used to iterate through
     * all or new values.
     */
    onItemUpdate(updateInfo: ItemUpdate): void;
    /**
     * Event handler that is called by Lightstreamer each time a request
     * to clear the snapshot pertaining to an item in the Subscription has been
     * received from the Server.
     * More precisely, this kind of request can occur in two cases:
     * <ul>
     * <li>For an item delivered in COMMAND mode, to notify that the state
     * of the item becomes empty; this is equivalent to receiving an update
     * carrying a DELETE command once for each key that is currently active.</li>
     * <li>For an item delivered in DISTINCT mode, to notify that all the
     * previous updates received for the item should be considered as obsolete;
     * hence, if the listener were showing a list of recent updates for the
     * item, it should clear the list in order to keep a coherent view.</li>
     * </ul>
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled,
     * the notification refers to the first-level item (which is in COMMAND mode).
     * This kind of notification is not possible for second-level items (which are in
     * MERGE mode).
     * <BR/>This event can be sent by the Lightstreamer Server since version 6.0
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     */
    onClearSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully subscribed to through the Server.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     * <BR>This notification is always issued before the other ones related
     * to the same subscription. It invalidates all data that has been received
     * previously.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onSubscription event is fired an onUnsubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level subscriptions are not notified.
     */
    onSubscription(): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully unsubscribed from.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     *
     * <BR>After this notification no more events can be recieved until a new
     * {@link SubscriptionListener#onSubscription} event.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onUnsubscription event is fired an onSubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level unsubscriptions are not notified.
     */
    onUnsubscription(): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is added to a Subscription through
     * {@link Subscription#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was added to.
     */
    onListenStart(subscription: Subscription): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is removed from a Subscription through
     * {@link Subscription#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was removed from.
     */
    onListenEnd(subscription: Subscription): void;
    /**
     * Removes a row from the internal model and reflects the change on the view.
     * If no row associated with the given key is found nothing is done.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be removed.
     */
    removeRow(key: string): void;
    /**
     * Updates a row in the internal model and reflects the change on the view.
     * If no row associated with the given key is found then a new row is
     * created.
     * <BR>Example usage:
     * <BR><code>myWidget.updateRow("key1", {field1:"val1",field2:"val2"});</code>
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time. If called while an updateRow on the same
     * internal model is still executing (e.g. if called while handling an onVisualUpdate
     * callback), then the new update:
     * <ul>
     * <li>if pertaining to a different key and/or if called on a {@link Chart} instance,
     * will be postponed until the first updateRow execution terminates;</li>
     * <li>if pertaining to the same key and if called on a {@link StaticGrid} / {@link DynaGrid}
     * instance, will be merged with the current one.</li>
     * </ul>
     * </p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     *
     * @param {String} key The key associated with the row to be updated/added.
     * @param {Object} newValues A JavaScript object containing name/value pairs
     * to fill the row in the mode.
     * <BR>Note that the internal model does not have a fixed number of fields;
     * each update can add new fields to the model by simply specifying them.
     * Also, an update having fewer fields than the current model will have its
     * missing fields considered as unchanged.
     */
    updateRow(key: string, newValues: any): void;
    /**
     * Removes all the rows from the model and reflects the change on the view.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> once the {@link AbstractWidget#parseHtml} method has been called,
     * this method can be used at any time.</p>
     *
     * @throws {IllegalStateException} if parseHtml has not been executed yet.
     */
    clean(): void;
    /**
     * Returns the value from the model for the specified key/field pair.
     * If the row for the specified key does not exist or if the specified field
     * is not available in the row then null is returned.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {String} key The key associated with the row to be read.
     * @param {String} field The field to be read from the row.
     *
     * @return {String} The current value for the specified field of the specified row,
     * possibly null. If the value for the specified field has never been
     * assigned in the model, the method also returns null.
     */
    getValue(key: string, field: string): string;
    /**
     * Utility method that can be used to control part of the behavior of
     * the widget in case it is used as a listener for one or more
     * {@link Subscription} instances.
     * <BR>Specifying the two flags it is possible to decide to clean the model and
     * view based on the status (subscribed or not) of the Subscriptions this
     * instance is listening to.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @param {boolean} onFirstSubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and an
     * onSubscription is fired by one of such Subscriptions.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is no Subscription in the subscribed status and this
     * instance starts listening to a new Subscription that is already in the
     * subscribed status, then it will be considered as if an onSubscription
     * event was fired and thus a clean() call will be performed.
     *
     * @param {boolean} onLastUnsubscribe If true a {@link AbstractWidget#clean} call will be
     * automatically performed if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and the
     * onUnsubscription for such Subscription is fired.
     * <BR>As a special case, if in the list of Subscriptions this instance is
     * listening to there is only one Subscription in the subscribed status and
     * this instance stops listening to such Subscription then it will be
     * considered as if the onUnsubscription event for that Subscription was fired
     * and thus a clean() call will be performed.
     *
     * @see Subscription#isSubscribed
     */
    setAutoCleanBehavior(onFirstSubscribe: boolean, onLastUnsubscribe: boolean): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item in the Subscription. Such notifications are sent only
     * if the items are delivered in an unfiltered mode; this occurs if the
     * subscription mode is:
     * <ul>
     * <li>RAW</li>
     * <li>MERGE or DISTINCT, with unfiltered dispatching specified</li>
     * <li>COMMAND, with unfiltered dispatching specified</li>
     * <li>COMMAND, without unfiltered dispatching specified (in this case,
     * notifications apply to ADD and DELETE events only)</li>
     * </ul>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     *
     * @see Subscription#setRequestedMaxFrequency
     */
    onItemLostUpdates(itemName: string, itemPos: number, lostUpdates: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item that was subscribed to as a second-level subscription.
     * Such notifications are sent only if the Subscription was configured in
     * unfiltered mode (second-level items are always in "MERGE" mode and
     * inherit the frequency configuration from the first-level Subscription).
     * <BR>By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     * @param {String} key The value of the key that identifies the
     * second-level item.
     *
     * @see Subscription#setRequestedMaxFrequency
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelItemLostUpdates(lostUpdates: number, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify that all
     * snapshot events for an item in the Subscription have been received,
     * so that real time events are now going to be received. The received
     * snapshot could be empty.
     * Such notifications are sent only if the items are delivered in
     * DISTINCT or COMMAND subscription mode and snapshot information was
     * indeed requested for the items.
     * By implementing this method it is possible to perform actions which
     * require that all the initial values have been received.
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled, the notification
     * refers to the first-level item (which is in COMMAND mode).
     * Snapshot-related updates for the second-level items (which are in
     * MERGE mode) can be received both before and after this notification.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     *
     * @see Subscription#setRequestedSnapshot
     * @see ItemUpdate#isSnapshot
     */
    onEndOfSnapshot(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called when the Server notifies an error on a Subscription. By implementing this method it
     * is possible to perform recovery actions. <BR>
     * Note that, in order to perform a new subscription attempt, {@link LightstreamerClient#unsubscribe}
     * and {@link LightstreamerClient#subscribe} should be issued again, even if no change to the Subscription
     * attributes has been applied.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>15 - "key" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>16 - "command" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>25 - bad Selector name</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>29 - RAW mode is not allowed by the current license terms (for special licenses only)</li>
     *          <li>30 - subscriptions are not allowed by the current license terms (for special licenses only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     * @param {String} message The description of the error sent by the Server;
     * it can be null.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    onSubscriptionError(code: number, message: string): void;
    /**
     * Event handler that is called when the Server notifies an error on a second-level subscription. <BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>14 - the key value is not a valid name for the Item to be subscribed; only in this case, the error
     *              is detected directly by the library before issuing the actual request to the Server</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     *
     * @param {String} message The description of the error sent by the Server; it can be null.
     * @param {String} key The value of the key that identifies the second-level item.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelSubscriptionError(code: number, message: string, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify the client with the real maximum update frequency of the Subscription.
     * It is called immediately after the Subscription is established and in response to a requested change
     * (see {@link Subscription#setRequestedMaxFrequency}).
     * Since the frequency limit is applied on an item basis and a Subscription can involve multiple items,
     * this is actually the maximum frequency among all items. For Subscriptions with two-level behavior
     * (see {@link Subscription#setCommandSecondLevelFields} and {@link Subscription#setCommandSecondLevelFieldSchema})
     * , the reported frequency limit applies to both first-level and second-level items. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * but also because of number rounding. <BR>
     * Note that a maximum update frequency (that is, a non-unlimited one) may be applied by the Server
     * even when the subscription mode is RAW or the Subscription was done with unfiltered dispatching.
     *
     * @param {String} frequency  A decimal number, representing the maximum frequency applied by the Server
     * (expressed in updates per second), or the string "unlimited". A null value is possible in rare cases,
     * when the frequency can no longer be determined.
     */
    onRealMaxFrequency(frequency: string): void;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports StaticGridListener
 * @class Interface to be implemented to listen to {@link StaticGrid} events.
 * <BR>Events for this listeners are executed synchronously with respect to the code
 * that generates them.
 * <BR>Note that it is not necessary to implement all of the interface methods for
 * the listener to be successfully passed to the {@link StaticGrid#addListener}
 * method.
 *
 * @see StaticGrid
 */
export class StaticGridListener {
    constructor();
    /**
     * Event handler that is called by Lightstreamer each time a row of the
     * underlying model is added or modified and the change is going to be
     * applied to the corresponding cells in the grid.
     * By implementing this method, it is possible to perform custom
     * formatting on the field values, to set the cell stylesheets and to
     * control the display policy.
     * In addition, through a custom handler it is possible to perform custom
     * display actions for the row.
     * <BR>Note that the availability of cells currently associated to the row
     * fields depends on how the StaticGrid was configured.
     * <BR>This event is also fired when a row is removed from the model,
     * to allow clearing actions related to custom display actions previously
     * performed for the row. Row removal may happen when the {@link StaticGrid}
     * is listening to events from {@link Subscription} instance(s), and the first
     * Subscription it listens to is a COMMAND or a DISTINCT Subscription;
     * removal may also happen in case of {@link AbstractWidget#removeRow} or
     * {@link AbstractWidget#clean} execution.
     * <BR>On the other hand, in case the row is just repositioned on the grid
     * no notification is supplied, but the formatting and style are kept for
     * the new cells.
     * <BR>This event is fired before the update is applied to both the HTML cells
     * of the grid and the internal model. As a consequence, through
     * {@link AbstractWidget#updateRow} it is still possible to modify the current update.
     *
     * @param {String} key the key associated with the row that is being
     * added/removed/updated (keys are described in {@link AbstractWidget}).
     *
     * @param {VisualUpdate} visualUpdate a value object containing the
     * updated values for all the cells, together with their display settings.
     * The desired settings can be set in the object, to substitute the default
     * settings, before returning.
     * <BR>visualUpdate can also be null, to notify a clearing action.
     * In this case, the row is being removed from the page.
     *
     * @param {String} position the value of the data-row or data-item
     * value of the cells targeted by this update.
     */
    onVisualUpdate?(key: string, visualUpdate: VisualUpdate, position: string): void;
}

/**
 * Creates an object to be used to listen to events from a
 * {@link LightstreamerClient} instance.
 * The new object will create a small visual widget to display the status of
 * the connection.
 * The created widget will have a fixed position so that it will not move
 * when the page is scrolled.
 * @constructor
 *
 * @param {String} attachToBorder "left" "right" or "no" to specify if the generated
 * widget should be attached to the left border, right border or should not be
 * attached to any border. In the latter case, it should be immediately positioned
 * manually, by acting on the DOM element obtained through {@link StatusWidget#getDomNode}.
 * @param {String} distance The distance of the widget from the top/bottom (depending
 * on the fromTop parameter). The specified distance must also contain the units
 * to be used: all and only the units supported by CSS are accepted.
 * @param {boolean} fromTop true or false to specify if the distance is related
 * to the top or to the bottom of the page.
 * @param {String} [initialDisplay] "open" "closed" or "dyna" to specify if the generated
 * widget should be initialized open, closed or, in the "dyna" case, open and then
 * immediately closed. By default "dyna" is used.
 * If attachToBorder is set to "no" then this setting has no effects.
 *
 * @throws {IllegalArgumentException} if an invalid value was passed as
 * attachToBorder parameter.
 *
 * @exports StatusWidget
 * @class This class is a simple implementation of the ClientListener interface, which will display a
 * small widget with details about the status of the connection. The widget contains the "S" logo
 * and three tiny leds. The "S" logo changes color and luminosity to reflect the current connection status
 * (connecting, disconnected, connected, and stalled).
 * <ul>
 * <li>The left led indicates the transport in use: green if WS/WSS; yellow if HTTP/HTTPS.</li>
 * <li>The center led indicates the mode in use: green if streaming; yellow if polling.</li>
 * <li>The right led indicates where the physical connection in held: green if this LightstreamerClient
 * is the master instance, holding the connection; yellow if this LightstreamerClient instance is a slave
 * attached to the master Lightstreamer Client instance.</li>
 * </ul>
 * By rolling over or clicking over the widget, a panel appears with full details.
 * <BR>Note that the widget is generated using some features not available
 * on old browsers but as long as the
 * <a href="http://tools.ietf.org/html/rfc2397">"data" URL scheme</a>  is supported
 * the minimal functions of the widget will work (for instance, IE<=7 does not have support
 * for the "data" URL scheme).
 * <BR>Also note that on IE if "Quirks Mode" is activated the widget will not
 * be displayed correctly. Specify a doctype on the document where the widget
 * is going to be shown to prevent IE from entering the "Quirks Mode".
 *
 * @extends ClientListener
 */
export class StatusWidget extends ClientListener {
    constructor(attachToBorder: string, distance: string, fromTop: boolean, initialDisplay?: string);
    /**
     * Inquiry method that gets the DOM element that makes the widget container.
     * It may be necessary to extract it to specify some extra styles or to position
     * it in case "no" was specified as the attachToBorder constructor parameter.
     *
     * @return {Object} The widget DOM element.
     */
    getDomNode(): any;
    /**
     * Event handler that is called when the Server notifies a refusal on the
     * client attempt to open a new connection or the interruption of a
     * streaming connection. In both cases, the {@link ClientListener#onStatusChange}
     * event handler has already been invoked with a "DISCONNECTED" status and
     * no recovery attempt has been performed. By setting a custom handler, however,
     * it is possible to override this and perform custom recovery actions.
     *
     * @param {Number} errorCode The error code. It can be one of the
     * following:
     * <ul>
     * <li>1 - user/password check failed</li>
     * <li>2 - requested Adapter Set not available</li>
     * <li>7 - licensed maximum number of sessions reached
     * (this can only happen with some licenses)</li>
     * <li>8 - configured maximum number of sessions reached</li>
     * <li>9 - configured maximum server load reached</li>
     * <li>10 - new sessions temporarily blocked</li>
     * <li>11 - streaming is not available because of Server license
     * restrictions (this can only happen with special licenses)</li>
     * <li>21 - a bind request has unexpectedly reached a wrong Server instance, which suggests that a routing issue may be in place</li>
     * <li>30-41 - the current connection or the whole session has been closed
     * by external agents; the possible cause may be:
     * <ul>
     * <li>The session was closed on the Server side (via software or by
     * the administrator) (32) or through a client "destroy" request (31);</li>
     * <li>The Metadata Adapter imposes limits on the overall open sessions
     * for the current user and has requested the closure of the current session
     * upon opening of a new session for the same user
    
     * on a different browser window
    
     * (35);</li>
     * <li>An unexpected error occurred on the Server while the session was in
     * activity (33, 34);</li>
     * <li>An unknown or unexpected cause; any code different from the ones
     * identified in the above cases could be issued.</li>
     * </ul>
     * A detailed description for the specific cause is currently not supplied
     * (i.e. errorMessage is null in this case).</li>
     * <li>60 - this version of the client is not allowed by the current license terms.</li>
     * <li>61 - there was an error in the parsing of the server response thus the client cannot continue with the current session.</li>
     * <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection.</li>
     * <li>68 - the Server could not open or continue with the session because of an internal error.</li>
     * <li>71 - this kind of client is not allowed by the current license terms.</li>
     * <li>&lt;= 0 - the Metadata Adapter has refused the user connection;
     * the code value is dependent on the specific Metadata Adapter
     * implementation</li>
     * </ul>
     * @param {String} errorMessage The description of the error as sent
     * by the Server.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see ClientListener#onStatusChange
     */
    onServerError(errorCode: number, errorMessage: string): void;
    /**
     * Event handler that receives a notification each time the LightstreamerClient
     * status has changed. The status changes may be originated either by custom
     * actions (e.g. by calling {@link LightstreamerClient#disconnect}) or by
     * internal actions.
     * <BR/><BR/>The normal cases are the following:
     * <ul>
     * <li>After issuing connect(), if the current status is "DISCONNECTED*", the
     * client will switch to "CONNECTING" first and
     * to "CONNECTED:STREAM-SENSING" as soon as the pre-flight request receives its
     * answer.
     * <BR>As soon as the new session is established, it will switch to
     * "CONNECTED:WS-STREAMING" if the browser/environment permits WebSockets;
     * otherwise it will switch to "CONNECTED:HTTP-STREAMING" if the
     * browser/environment permits streaming or to "CONNECTED:HTTP-POLLING"
     * as a last resort.
     * <BR>On the other hand if the status is already "CONNECTED:*" a
     * switch to "CONNECTING" is usually not needed.</li>
     * <li>After issuing disconnect(), the status will switch to "DISCONNECTED".</li>
     * <li>In case of a server connection refusal, the status may switch from
     * "CONNECTING" directly to "DISCONNECTED". After that, the
     * {@link ClientListener#onServerError} event handler will be invoked.</li>
     * </ul>
     * <BR/>Possible special cases are the following:
     * <ul>
     * <li>In case of Server unavailability during streaming, the status may
     * switch from "CONNECTED:*-STREAMING" to "STALLED" (see
     * {@link ConnectionOptions#setStalledTimeout}).
     * If the unavailability ceases, the status will switch back to
     * ""CONNECTED:*-STREAMING"";
     * otherwise, if the unavailability persists (see
     * {@link ConnectionOptions#setReconnectTimeout}),
     * the status will switch to "DISCONNECTED:TRYING-RECOVERY" and eventually to
     * "CONNECTED:*-STREAMING".</li>
     * <li>In case the connection or the whole session is forcibly closed
     * by the Server, the status may switch from "CONNECTED:*-STREAMING"
     * or "CONNECTED:*-POLLING" directly to "DISCONNECTED". After that, the
     * {@link ClientListener#onServerError} event handler will be invoked.</li>
     * <li>Depending on the setting in {@link ConnectionOptions#setSlowingEnabled},
     * in case of slow update processing, the status may switch from
     * "CONNECTED:WS-STREAMING" to "CONNECTED:WS-POLLING" or from
     * "CONNECTED:HTTP-STREAMING" to "CONNECTED:HTTP-POLLING".</li>
     * <li>If the status is "CONNECTED:*-POLLING" and any problem during an
     * intermediate poll occurs, the status may switch to "CONNECTING" and
     * eventually to "CONNECTED:*-POLLING". The same may hold for the
     * "CONNECTED:*-STREAMING" case, when a rebind is needed.</li>
     * <li>In case a forced transport was set through
     * {@link ConnectionOptions#setForcedTransport}, only the related final
     * status or statuses are possible.</li>
     * <li>In case of connection problems, the status may switch from any value
     * to "DISCONNECTED:WILL-RETRY" (see {@link ConnectionOptions#setRetryDelay}),
     * then to "CONNECTING" and a new attempt will start.
     * However, in most cases, the client will try to recover the current session;
     * hence, the "DISCONNECTED:TRYING-RECOVERY" status will be entered
     * and the recovery attempt will start.</li>
     * <li>In case of connection problems during a recovery attempt, the status may stay
     * in "DISCONNECTED:TRYING-RECOVERY" for long time, while further attempts are made.
     * If the recovery is no longer possible, the current session will be abandoned
     * and the status will switch to "DISCONNECTED:WILL-RETRY" before the next attempts.</li>
    
     * <li>In case the local LightstreamerClient is exploiting the connection of a
     * different LightstreamerClient (see {@link ConnectionSharing}) and such
     * LightstreamerClient or its container window is disposed, the status will
     * switch to "DISCONNECTED:WILL-RETRY" unless the current status is "DISCONNECTED".
     * In the latter case it will remain "DISCONNECTED".</li>
    
     * </ul>
     *
     * <BR>By setting a custom handler it is possible to perform
     * actions related to connection and disconnection occurrences. Note that
     * {@link LightstreamerClient#connect} and {@link LightstreamerClient#disconnect},
     * as any other method, can be issued directly from within a handler.
     *
     * @param {String} chngStatus The new status. It can be one of the
     * following values:
     * <ul>
     * <li>"CONNECTING" the client has started a connection attempt and is
     * waiting for a Server answer.</li>
     * <li>"CONNECTED:STREAM-SENSING" the client received a first response from
     * the server and is now evaluating if a streaming connection is fully
     * functional. </li>
     * <li>"CONNECTED:WS-STREAMING" a streaming connection over WebSocket has
     * been established.</li>
     * <li>"CONNECTED:HTTP-STREAMING" a streaming connection over HTTP has
     * been established.</li>
     * <li>"CONNECTED:WS-POLLING" a polling connection over WebSocket has
     * been started. Note that, unlike polling over HTTP, in this case only one
     * connection is actually opened (see {@link ConnectionOptions#setSlowingEnabled}).
     * </li>
     * <li>"CONNECTED:HTTP-POLLING" a polling connection over HTTP has
     * been started.</li>
     * <li>"STALLED" a streaming session has been silent for a while,
     * the status will eventually return to its previous CONNECTED:*-STREAMING
     * status or will switch to "DISCONNECTED:WILL-RETRY" / "DISCONNECTED:TRYING-RECOVERY".</li>
     * <li>"DISCONNECTED:WILL-RETRY" a connection or connection attempt has been
     * closed; a new attempt will be performed (possibly after a timeout).</li>
     * <li>"DISCONNECTED:TRYING-RECOVERY" a connection has been closed and
     * the client has started a connection attempt and is waiting for a Server answer;
     * if successful, the underlying session will be kept.</li>
     * <li>"DISCONNECTED" a connection or connection attempt has been closed. The
     * client will not connect anymore until a new {@link LightstreamerClient#connect}
     * call is issued.</li>
     * </ul>
     *
     * @see LightstreamerClient#connect
     * @see LightstreamerClient#disconnect
     * @see LightstreamerClient#getStatus
     */
    onStatusChange(chngStatus: string): void;
    /**
     * Event handler that receives a notification each time  the value of a property of
     * {@link LightstreamerClient#connectionDetails} or {@link LightstreamerClient#connectionOptions}
     * is changed.
    
     * <BR>Properties of these objects can be modified by direct calls to them, but
     * also by calls performed on other LightstreamerClient instances sharing the
     * same connection and by server sent events.
    
     *
     * @param {String} the name of the changed property.
     * <BR>Possible values are:
     * <ul>
     * <li>adapterSet</li>
     * <li>serverAddress</li>
     * <li>user</li>
     * <li>password</li>
     * <li>serverInstanceAddress</li>
     * <li>serverSocketName</li>
     * <li>sessionId</li>
     * <li>contentLength</li>
     * <li>idleTimeout</li>
     * <li>keepaliveInterval</li>
     * <li>maxBandwidth</li>
     * <li>pollingInterval</li>
     * <li>reconnectTimeout</li>
     * <li>stalledTimeout</li>
     * <li>retryDelay</li>
     * <li>firstRetryMaxDelay</li>
     * <li>slowingEnabled</li>
     * <li>forcedTransport</li>
     * <li>serverInstanceAddressIgnored</li>
     * <li>cookieHandlingRequired</li>
     * <li>reverseHeartbeatInterval</li>
     * <li>earlyWSOpenEnabled</li>
     * <li>httpExtraHeaders</li>
     * <li>httpExtraHeadersOnSessionCreationOnly</li>
     *
     * </ul>
     *
     * @see LightstreamerClient#connectionDetails
     * @see LightstreamerClient#connectionOptions
     */
    onPropertyChange(the: string): void;
    /**
     * Event handler that receives a notification in case a connection
     * sharing is aborted.
     * A connection sharing can only be aborted if one of the policies specified
     * in the {@link ConnectionSharing} instance supplied to the
     * {@link LightstreamerClient#enableSharing} method is "ABORT".
     * <BR>If this event is fired the client will never be able to connect to
     * the server unless a new call to enableSharing is issued.
     */
    onShareAbort(): void;
    /**
     * Event handler that receives a notification when the ClientListener instance
     * is added to a LightstreamerClient through
     * {@link LightstreamerClient#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {LightstreamerClient} lsClient the LightstreamerClient this
     * instance was added to.
     */
    onListenStart(lsClient: LightstreamerClient): void;
    /**
     * Event handler that receives a notification when the ClientListener instance
     * is removed from a LightstreamerClient through
     * {@link LightstreamerClient#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {LightstreamerClient} lsClient the LightstreamerClient this
     * instance was removed from.
     */
    onListenEnd(lsClient: LightstreamerClient): void;
    /**
     * Notifies that the Server has sent a keepalive message because a streaming connection
     * is in place and no update had been sent for the configured time
     * (see {@link ConnectionOptions#setKeepaliveInterval}).
     * However, note that the lack of both updates and keepalives is already managed by the library
     * (see {@link ConnectionOptions#setReconnectTimeout} and {@link ConnectionOptions#setStalledTimeout}).
     */
    onServerKeepalive(): void;
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
export class Subscription {
    constructor(subscriptionMode: string, items?: string | String[], fields?: String[]);
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
    isActive(): boolean;
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
    isSubscribed(): boolean;
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
    setItems(items: String[]): void;
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
    getItems(): String[];
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
    setItemGroup(groupName: string): void;
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
    getItemGroup(): string;
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
    setFields(fields: String[]): void;
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
    getFields(): String[];
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
    setFieldSchema(schemaName: string): void;
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
    getFieldSchema(): string;
    /**
     * Inquiry method that can be used to read the mode specified for this
     * Subscription.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the Subscription mode specified in the constructor.
     */
    getMode(): string;
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
    setDataAdapter(dataAdapter: string): void;
    /**
     * Inquiry method that can be used to read the name of the Data Adapter
     * specified for this Subscription through {@link Subscription#setDataAdapter}.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the name of the Data Adapter; returns null if no name
     * has been configured, so that the "DEFAULT" Adapter Set is used.
     */
    getDataAdapter(): string;
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
    setSelector(selector: string): void;
    /**
     * Inquiry method that can be used to read the selctor name
     * specified for this Subscription through {@link Subscription#setSelector}.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the name of the selector.
     */
    getSelector(): string;
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
     * <p class="edition-note"><B>Edition Note:</B> A further global frequency limit could also
     * be imposed by the Server, depending on Edition and License Type; this specific limit also applies to RAW mode
     * and to unfiltered dispatching.
     * To know what features are enabled by your license, please see the License tab of the
     * Monitoring Dashboard (by default, available at /dashboard).</p>
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
    setRequestedMaxFrequency(freq: number): void;
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
    getRequestedMaxFrequency(): string;
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
    setRequestedBufferSize(size: number): void;
    /**
     * Inquiry method that can be used to read the buffer size, configured though
     * {@link Subscription#setRequestedBufferSize}, to be requested to the Server for
     * this Subscription.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the buffer size to be requested to the server.
     */
    getRequestedBufferSize(): string;
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
    setRequestedSnapshot(required: string): void;
    /**
     * Inquiry method that can be used to read the snapshot preferences, configured
     * through {@link Subscription#setRequestedSnapshot}, to be requested to the Server for
     * this Subscription.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the snapshot preference to be requested to the server.
     */
    getRequestedSnapshot(): string;
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
    setCommandSecondLevelFields(fields: String[]): void;
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
    getCommandSecondLevelFields(): String[];
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
    setCommandSecondLevelFieldSchema(schemaName: string): void;
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
    getCommandSecondLevelFieldSchema(): string;
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
    setCommandSecondLevelDataAdapter(dataAdapter: string): void;
    /**
     * Inquiry method that can be used to read the second-level Data
     * Adapter name configured through {@link Subscription#setCommandSecondLevelDataAdapter}.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> This method can be called at any time.</p>
     *
     * @return {String} the name of the second-level Data Adapter.
     */
    getCommandSecondLevelDataAdapter(): string;
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
    getValue(itemIdentifier: string, fieldIdentifier: string): string;
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
    getCommandValue(itemIdentifier: string, keyValue: string, fieldIdentifier: string): string;
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
    getKeyPosition(): number;
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
    getCommandPosition(): number;
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
    addListener(listener: SubscriptionListener): void;
    /**
     * Removes a listener from the Subscription instance so that it
     * will not receive events anymore.
     *
     * <p class="lifecycle"><b>Lifecycle:</b> a listener can be removed at any time.</p>
     *
     * @param {SubscriptionListener} listener The listener to be removed.
     */
    removeListener(listener: SubscriptionListener): void;
    /**
     * Returns an array containing the {@link SubscriptionListener} instances that
     * were added to this client.
     *
     * @return {SubscriptionListener[]} an Array containing the listeners that were added to this client.
     * Listeners added multiple times are included multiple times in the array.
     */
    getListeners(): SubscriptionListener[];
    /**
     * Changes the real max frequency of this subscription.
     * <br>If there is a change, the method SubscriptionListener.onRealMaxFrequency is triggered.
     * <br>The method SubscriptionListener.onRealMaxFrequency is also triggered if there is a new maximum
     * among the item frequencies of a two-level command subscription.
     */
    configure(): void;
}

/**
 * This is a dummy constructor not to be used in any case.
 * @constructor
 *
 * @exports SubscriptionListener
 * @class Interface to be implemented to listen to {@link Subscription} events
 * comprehending notifications of subscription/unsubscription, updates, errors and
 * others.
 * <BR>Events for this listeners are executed asynchronously with respect to the code
 * that generates them.
 * <BR>Note that it is not necessary to implement all of the interface methods for
 * the listener to be successfully passed to the {@link Subscription#addListener}
 * method.

 * <BR>The {@link AbstractWidget} and its subclasses, distributed together
 * with the library, implement this interface.
 *
 * @see DynaGrid
 * @see StaticGrid
 * @see Chart
 */
export class SubscriptionListener {
    constructor();
    /**
     * Event handler that is called by Lightstreamer each time an update
     * pertaining to an item in the Subscription has been received from the
     * Server.
     *
     * @param {ItemUpdate} updateInfo a value object containing the
     * updated values for all the fields, together with meta-information about
     * the update itself and some helper methods that can be used to iterate through
     * all or new values.
     */
    onItemUpdate?(updateInfo: ItemUpdate): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item in the Subscription. Such notifications are sent only
     * if the items are delivered in an unfiltered mode; this occurs if the
     * subscription mode is:
     * <ul>
     * <li>RAW</li>
     * <li>MERGE or DISTINCT, with unfiltered dispatching specified</li>
     * <li>COMMAND, with unfiltered dispatching specified</li>
     * <li>COMMAND, without unfiltered dispatching specified (in this case,
     * notifications apply to ADD and DELETE events only)</li>
     * </ul>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     *
     * @see Subscription#setRequestedMaxFrequency
     */
    onItemLostUpdates?(itemName: string, itemPos: number, lostUpdates: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that, due to
     * internal resource limitations, Lightstreamer Server dropped one or more
     * updates for an item that was subscribed to as a second-level subscription.
     * Such notifications are sent only if the Subscription was configured in
     * unfiltered mode (second-level items are always in "MERGE" mode and
     * inherit the frequency configuration from the first-level Subscription).
     * <BR>By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} lostUpdates The number of consecutive updates dropped
     * for the item.
     * @param {String} key The value of the key that identifies the
     * second-level item.
     *
     * @see Subscription#setRequestedMaxFrequency
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelItemLostUpdates?(lostUpdates: number, key: string): void;
    /**
     * Event handler that is called by Lightstreamer to notify that all
     * snapshot events for an item in the Subscription have been received,
     * so that real time events are now going to be received. The received
     * snapshot could be empty.
     * Such notifications are sent only if the items are delivered in
     * DISTINCT or COMMAND subscription mode and snapshot information was
     * indeed requested for the items.
     * By implementing this method it is possible to perform actions which
     * require that all the initial values have been received.
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled, the notification
     * refers to the first-level item (which is in COMMAND mode).
     * Snapshot-related updates for the second-level items (which are in
     * MERGE mode) can be received both before and after this notification.
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     *
     * @see Subscription#setRequestedSnapshot
     * @see ItemUpdate#isSnapshot
     */
    onEndOfSnapshot?(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer each time a request
     * to clear the snapshot pertaining to an item in the Subscription has been
     * received from the Server.
     * More precisely, this kind of request can occur in two cases:
     * <ul>
     * <li>For an item delivered in COMMAND mode, to notify that the state
     * of the item becomes empty; this is equivalent to receiving an update
     * carrying a DELETE command once for each key that is currently active.</li>
     * <li>For an item delivered in DISTINCT mode, to notify that all the
     * previous updates received for the item should be considered as obsolete;
     * hence, if the listener were showing a list of recent updates for the
     * item, it should clear the list in order to keep a coherent view.</li>
     * </ul>
     * <BR/>Note that, if the involved Subscription has a two-level behavior enabled,
     * the notification refers to the first-level item (which is in COMMAND mode).
     * This kind of notification is not possible for second-level items (which are in
     * MERGE mode).
     * <BR/>This event can be sent by the Lightstreamer Server since version 6.0
     *
     * @param {String} itemName name of the involved item. If the Subscription
     * was initialized using an "Item Group" then a null value is supplied.
     * @param {Number} itemPos 1-based position of the item within the "Item List"
     * or "Item Group".
     */
    onClearSnapshot?(itemName: string, itemPos: number): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully subscribed to through the Server.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     * <BR>This notification is always issued before the other ones related
     * to the same subscription. It invalidates all data that has been received
     * previously.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onSubscription event is fired an onUnsubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level subscriptions are not notified.
     */
    onSubscription?(): void;
    /**
     * Event handler that is called by Lightstreamer to notify that a Subscription
     * has been successfully unsubscribed from.
     * This can happen multiple times in the life of a Subscription instance,
     * in case the Subscription is performed multiple times through
     * {@link LightstreamerClient#unsubscribe} and {@link LightstreamerClient#subscribe}.
     * This can also happen multiple times in case of automatic recovery after a connection
     * restart.
     *
     * <BR>After this notification no more events can be recieved until a new
     * {@link SubscriptionListener#onSubscription} event.
     * <BR>Note that two consecutive calls to this method are not possible, as before
     * a second onUnsubscription event is fired an onSubscription event is eventually
     * fired.
     * <BR>If the involved Subscription has a two-level behavior enabled,
     * second-level unsubscriptions are not notified.
     */
    onUnsubscription?(): void;
    /**
     * Event handler that is called when the Server notifies an error on a Subscription. By implementing this method it
     * is possible to perform recovery actions. <BR>
     * Note that, in order to perform a new subscription attempt, {@link LightstreamerClient#unsubscribe}
     * and {@link LightstreamerClient#subscribe} should be issued again, even if no change to the Subscription
     * attributes has been applied.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>15 - "key" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>16 - "command" field not specified in the schema for a COMMAND mode subscription</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>25 - bad Selector name</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>29 - RAW mode is not allowed by the current license terms (for special licenses only)</li>
     *          <li>30 - subscriptions are not allowed by the current license terms (for special licenses only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     * @param {String} message The description of the error sent by the Server;
     * it can be null.
     *
     * @see ConnectionDetails#setAdapterSet
     */
    onSubscriptionError?(code: number, message: string): void;
    /**
     * Event handler that is called when the Server notifies an error on a second-level subscription. <BR>
     * By implementing this method it is possible to perform recovery actions.
     *
     * @param {Number} code The error code sent by the Server. It can be one of the following:
     *        <ul>
     *          <li>14 - the key value is not a valid name for the Item to be subscribed; only in this case, the error
     *              is detected directly by the library before issuing the actual request to the Server</li>
     *          <li>17 - bad Data Adapter name or default Data Adapter not defined for the current Adapter Set</li>
     *          <li>21 - bad Group name</li>
     *          <li>22 - bad Group name for this Schema</li>
     *          <li>23 - bad Schema name</li>
     *          <li>24 - mode not allowed for an Item</li>
     *          <li>26 - unfiltered dispatching not allowed for an Item, because a frequency limit is associated
     *              to the item</li>
     *          <li>27 - unfiltered dispatching not supported for an Item, because a frequency prefiltering is
     *              applied for the item</li>
     *          <li>28 - unfiltered dispatching is not allowed by the current license terms (for special licenses
     *              only)</li>
     *          <li>66 - an unexpected exception was thrown by the Metadata Adapter while authorizing the connection</li>
     *          <li>68 - the Server could not fulfill the request because of an internal error.</li>
     *          <li>&lt;= 0 - the Metadata Adapter has refused the subscription or unsubscription request; the
     *              code value is dependent on the specific Metadata Adapter implementation</li>
     *        </ul>
     *
     * @param {String} message The description of the error sent by the Server; it can be null.
     * @param {String} key The value of the key that identifies the second-level item.
     *
     * @see ConnectionDetails#setAdapterSet
     * @see Subscription#setCommandSecondLevelFields
     * @see Subscription#setCommandSecondLevelFieldSchema
     */
    onCommandSecondLevelSubscriptionError?(code: number, message: string, key: string): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is added to a Subscription through
     * {@link Subscription#addListener}.
     * This is the first event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was added to.
     */
    onListenStart?(subscription: Subscription): void;
    /**
     * Event handler that receives a notification when the SubscriptionListener instance
     * is removed from a Subscription through
     * {@link Subscription#removeListener}.
     * This is the last event to be fired on the listener.
     *
     * @param {Subscription} subscription the Subscription this
     * instance was removed from.
     */
    onListenEnd?(subscription: Subscription): void;
    /**
     * Event handler that is called by Lightstreamer to notify the client with the real maximum update frequency of the Subscription.
     * It is called immediately after the Subscription is established and in response to a requested change
     * (see {@link Subscription#setRequestedMaxFrequency}).
     * Since the frequency limit is applied on an item basis and a Subscription can involve multiple items,
     * this is actually the maximum frequency among all items. For Subscriptions with two-level behavior
     * (see {@link Subscription#setCommandSecondLevelFields} and {@link Subscription#setCommandSecondLevelFieldSchema})
     * , the reported frequency limit applies to both first-level and second-level items. <BR>
     * The value may differ from the requested one because of restrictions operated on the server side,
     * but also because of number rounding. <BR>
     * Note that a maximum update frequency (that is, a non-unlimited one) may be applied by the Server
     * even when the subscription mode is RAW or the Subscription was done with unfiltered dispatching.
     *
     * @param {String} frequency  A decimal number, representing the maximum frequency applied by the Server
     * (expressed in updates per second), or the string "unlimited". A null value is possible in rare cases,
     * when the frequency can no longer be determined.
     */
    onRealMaxFrequency?(frequency: string): void;
}

/**
 * Callback for {@link VisualUpdate#forEachChangedField}
 * @callback ChangedFieldCallback
 * @param {String} field name of the involved changed field.
 * @param {String} value the new value for the field. See {@link VisualUpdate#getChangedFieldValue} for details.
 * Note that changes to the values made through {@link VisualUpdate#setCellValue} calls will not be reflected
 * by the iterator, as they don't affect the model.
 */
declare type ChangedFieldCallback = (field: string, value: string) => void;

/**
 * Used by Lightstreamer to provide a value object to each call of the
 * {@link StaticGridListener#onVisualUpdate} and
 * {@link DynaGridListener#onVisualUpdate} events. This constructor
 * is not supposed to be used by custom code.
 * @constructor
 *
 * @exports VisualUpdate
 * @class Contains all the information related to a row update that is about
 * to be displayed on a grid. This may happen because of a call to the
 * {@link AbstractWidget#updateRow} method, or, in case
 * an AbstractGrid is used to listen to a {@link Subscription}, because of
 * an update received from Lightstreamer Server.
 * <BR> Specifically, for each row it supplies:
 * <ul>
 * <li>The current values for the row fields in the grid and in the
 * underlying model and a method to modify the value in the gris cells
 * before updating them on the DOM.</li>
 * <li>Methods to set the stylesheets to be applied to the HTML cells.</li>
 * <li>Methods to configure the visual effect to be applied to the HTML
 * cells in order to emphasize the changes in the cell values.</li>
 * </ul>
 * The provided visual effect consists of the following sequence:
 * <ul>
 * <li>A change in the cell colors, with a fading behaviour, to temporary
 * "hot" colors.</li>
 * <li>The change of the values to the new values and the change of the
 * stylesheets to the full "hot" stylesheet; after the change, the cell
 * stays in this "hot" phase for a while.</li>
 * <li>A change in the cell colors, with a fading behaviour, to the final
 * "cold" colors.</li>
 * <li>The change of the stylesheets to the full "cold" stylesheets.</li>
 * </ul>
 * <BR/>The class constructor, its prototype and any other properties should never
 * be used directly.
 *
 * @see StaticGridListener#onVisualUpdate
 * @see DynaGridListener#onVisualUpdate
 */
export class VisualUpdate {
    constructor();
    /**
     * Inquiry method that gets the value that is going to be shown in the grid
     * in a specified cell or the current value if the value is not going to be
     * changed.
     * <BR>Note that if the value is not changing then no effects or styles are
     * going to be applied on the cell itself. If the effect is desired even if
     * the value in the cell is unchanged, then a call to {@link VisualUpdate#setCellValue} can
     * be performed using the value from this getter.
     * <BR>In order to inquiry the values for the row cells on the underlying
     * model, the {@link VisualUpdate#getChangedFieldValue} method is available.
     *
     * @throws {IllegalArgumentException} if no cells were associated with
     * the specified field.
     *
     * @param {String} field The field name associated with one of the cells in the
     * grid (the "data-field" attribute).
     * @param {String} [replicaId] A custom identifier that can be used in case two
     * or more cells were defined for the same field (the "data-replica" attribute).
     * If more cells have been defined but this parameter is not specified, then a random
     * cell will be selected.
     *
     * @return {String} A text or null; if the value for the specified field has never been
     * assigned in the model, the method also returns null.
     *
     * @see VisualUpdate#setCellValue
     * @see VisualUpdate#getChangedFieldValue
     */
    getCellValue(field: string, replicaId?: string): string;
    /**
     * Setter method that assigns the value to be shown in a specified cell of
     * the grid.
     * The specified value is the text that will be actually written in the cell
     * (for instance, it may be a formatted version of the original value),
     * unless it is null, in which case the value currently shown will be kept.
     * The latter may still be the initial cell value (or the cell value
     * specified on the template) if no formatted value hasn't been supplied
     * for the field yet.
     * <BR>Note that this method does not update the internal model of the AbstractGrid
     * so that if a value is set through this method it can't be used
     * for features working on such model (e.g. it can't be used to sort the grid).
     * If a change to the model is required use the {@link AbstractWidget#updateRow} method.
     *
     * @throws {IllegalArgumentException} if no cells were associated with
     * the specified field.
     *
     * @param {String} field The field name associated with one of the cells in the
     * grid (the "data-field" attribute).
     * @param {String} value the value to be written in the cell, or null.
     * @param {String} [replicaId] A custom identifier that can be used in case two
     * or more cells were defined for the same field (the "data-replica" attribute).
     * If more cells were defined but this parameter is not specified, then a random
     * cell will be selected.
     */
    setCellValue(field: string, value: string, replicaId?: string): void;
    /**
     * Inquiry method that gets the value that is going to update the underlying
     * model of the grid for the associated field. It can be null if no change
     * for the specified field is going to be applied.
     *
     * @param {String} field The name of a field from the model.
     *
     * @return {String} The new value of the specified field (possibly null), or null
     * if the field is not changing.
     * If the value for the specified field has never been
     * assigned in the model, the method also returns null.
     */
    getChangedFieldValue(field: string): string;
    /**
     * Setter method that configures the length of the "hot" phase for the
     * current row. The "hot" phase is one of the phases of the visual effect
     * supplied by Lightstreamer to emphasize the change of the row values.
     * <br/>By default 1200 ms is set.
     *
     * @param {Number} val Duration in milliseconds of the "hot" phase.
     */
    setHotTime(val: number): void;
    /**
     * Setter method that configures the length of the color fading phase
     * before the "hot" phase. This fading phase is one of the phases of
     * the visual effect supplied by Lightstreamer to emphasize the change
     * of the row values. A 0 length means that the color switch to "hot"
     * colors should be instantaneous and should happen together with value
     * and stylesheet switch.
     * <BR>Warning: The fading effect, if enabled, may be computation
     * intensive for some client environments, when high-frequency updates
     * are involved.
     * <br/>By default 0 ms (no fading at all) is set.
     *
     * @param {Number} val Duration in milliseconds of the fading phase before
     * the "hot" phase.
     */
    setColdToHotTime(val: number): void;
    /**
     * Setter method that configures the length of the color fading phase
     * after the "hot" phase. This fading phase is one of the phases of
     * the visual effect supplied by Lightstreamer to emphasize the change
     * of the row values. A 0 length means that the color switch from "hot"
     * to final "cold" colors should be instantaneous and should happen
     * together with the stylesheet switch.
     * <BR>Warning: The fading effect, if enabled, may be very computation
     * intensive for some client environments, when high-frequency updates
     * are involved.
     * <br/>By default 0 ms (no fading at all) is set.
     *
     * @param {Number} val Duration in milliseconds of the fading phase after
     * the "hot" phase.
     */
    setHotToColdTime(val: number): void;
    /**
     * Setter method that configures the stylesheet changes to be applied
     * to all the HTML cells of the involved row, while changing the field values.
     * A temporary "hot" style can
     * be specified as different than the final "cold" style. This allows
     * Lightstreamer to perform a visual effect, in which a temporary "hot"
     * phase is visible. By using this method, stylesheet attributes can be
     * specified one at a time.
     * <BR>If nonzero fading times are specified, through
     * {@link VisualUpdate#setColdToHotTime} and/or {@link VisualUpdate#setHotToColdTime},
     * then the "color" and "backgroundColor" attributes, if set, will be
     * changed with a fading behaviour.
     * Note that if color attributes are not set and nonzero fading times are
     * specified in {@link VisualUpdate#setColdToHotTime} and/or {@link VisualUpdate#setHotToColdTime},
     * this will cause a delay of the "hot" and "cold" phase switches;
     * however, as fading times refer to the whole row, you may need to set
     * them as nonzero in order to allow fading on some specific fields only.
     * <BR>If a row stylesheet is set through the {@link VisualUpdate#setStyle} method,
     * then this method should be used only to set stylesheet properties
     * not set by the row stylesheet. This condition applies throughout the
     * whole lifecycle of the cell (i.e. manipulating the same style property
     * through both methods, even at different times, does not guarantee
     * the result).
     * <br/>By default for each stylesheet attribute that is not
     * specified neither with this method nor with {@link VisualUpdate#setStyle}, the
     * current value is left unchanged.
     *
     * @param {String} hotValue the temporary "hot" value for the involved
     * attribute, or null if the attribute should not change while entering
     * "hot" phase; an empty string causes the current attribute value
     * to be cleared.
     * @param {String} coldValue the final "cold" value for the involved
     * attribute, or null if the attribute should not change while exiting
     * "hot" phase; an empty string causes the "hot" phase attribute value
     * to be cleared.
     * @param {String} attrName the name of an HTML stylesheet attribute.
     * The DOM attribute name should be used, not the CSS name (e.g.
     * "backgroundColor" is accepted, while "background-color" is not).
     * Note that if the "color" or "backgroundColor" attribute is being set,
     * then several color name conventions are supported by the underlying
     * DOM manipulation functions; however, in order to take advantage of the
     * color fading support, only the "#RRGGBB" syntax is fully supported.
     */
    setAttribute(hotValue: string, coldValue: string, attrName: string): void;
    /**
     * Setter method that configures the stylesheets to be applied to the
     * HTML cells of the involved row, while changing the field values.
     * A temporary "hot" style can
     * be specified as different than the final "cold" style. This allows
     * Lightstreamer to perform a visual effect, in which a temporary "hot"
     * phase is visible. By using this method, the names of existing
     * stylesheets are supplied.
     * <BR>Note that in order to specify cell colors that can change with
     * a fading behavior, the {@link VisualUpdate#setAttribute} method should be used instead,
     * as fading is not supported when colors are specified in the stylesheets
     * with this method. So, if nonzero fading times are specified in
     * {@link VisualUpdate#setColdToHotTime} and/or {@link VisualUpdate#setHotToColdTime},
     * this will just cause a delay of the "hot" and "cold" phase switches;
     * however, as fading times refer to the whole row, you may need to set
     * them as nonzero in order to allow fading on some specific fields only.
     * for each stylesheet attribute that is not
     * specified neither with this method nor with {@link VisualUpdate#setStyle}, the
     * current value is left unchanged.
     * <br/>By default no stylesheet is applied to the cell.
     *
     * @param {String} hotStyle the name of the temporary "hot" stylesheet,
     * or null if the cells style should not change while entering "hot" phase.
     * @param {String} coldStyle the name of the final "cold" stylesheet,
     * or null if the cells style should not change while exiting "hot" phase.
     */
    setStyle(hotStyle: string, coldStyle: string): void;
    /**
     * Setter method that configures the stylesheet changes to be applied
     * to the HTML cell related with a specified field, while changing its
     * value.
     * The method can be used to override, for a specific field, the settings
     * made through {@link VisualUpdate#setAttribute}.
     * <BR>If a specific stylesheet is assigned to the field through the
     * {@link VisualUpdate#setStyle} or {@link VisualUpdate#setCellStyle} method,
     * then this method can be used only in order to set stylesheet properties
     * not set by the assigned specific stylesheet. This condition applies
     * throughout the whole lifecycle of the cell (i.e. it is discouraged
     * to manipulate the same style property through both methods,
     * even at different times).
     * <br/>By default  the settings possibly made by {@link VisualUpdate#setAttribute}
     * are used.</p>
     *
     * @throws {IllegalArgumentException} if no cells were associated with
     * the specified field.
     *
     * @param {String} field The field name associated with one of the cells in the
     * grid (the "data-field" attribute).
     * @param {String} hotValue the temporary "hot" value for the involved
     * attribute, or null if the attribute should not change while entering
     * "hot" phase; an empty string causes the current attribute value
     * to be cleared.
     * @param {String} coldValue the final "cold" value for the involved
     * attribute, or null if the attribute should not change while exiting
     * "hot" phase; an empty string causes the "hot" phase attribute value
     * to be cleared.
     * @param {String} attrName the name of an HTML stylesheet attribute.
     * The DOM attribute name should be used, not the CSS name (e.g.
     * "backgroundColor" is accepted, while "background-color" is not).
     * @param {String} [replicaId] A custom identifier that can be used in case two
     * or more cells were defined for the same field (the "data-replica" attribute).
     * If more cells were defined but this parameter is not specified, then a random
     * cell will be selected.
     *
     * @see VisualUpdate#setAttribute
     */
    setCellAttribute(field: string, hotValue: string, coldValue: string, attrName: string, replicaId?: string): void;
    /**
     * Setter method that configures the stylesheet to be applied to the
     * HTML cell related with a specified field, while changing its value.
     * <BR>This method can be used to override, for a specific field, the settings
     * made through {@link VisualUpdate#setStyle}.
     * <br/>By default the stylesheet possibly set through {@link VisualUpdate#setStyle}
     * is used.</p>
     *
     * @throws {IllegalArgumentException} if no cells were associated with
     * the specified field.
     *
     * @param {String} field The field name associated with one of the cells in the
     * grid (the "data-field" attribute).
     * @param {String} hotStyle the name of the temporary "hot" stylesheet,
     * or null if the cell style should not change while entering "hot" phase
     * (regardless of the settings made through {@link VisualUpdate#setStyle} and
     * {@link VisualUpdate#setAttribute}).
     * @param {String} coldStyle the name of the final "cold" stylesheet,
     * or null if the cell style should not change while exiting "hot" phase
     * (regardless of the settings made through {@link VisualUpdate#setStyle} and
     * {@link VisualUpdate#setAttribute}).
     * @param {String} [replicaId] A custom identifier that can be used in case two
     * or more cells were defined for the same field (the "data-replica" attribute).
     * If more cells were defined but this parameter is not specified, then a random
     * cell will be selected.
     *
     * @see VisualUpdate#setStyle
     */
    setCellStyle(field: string, hotStyle: string, coldStyle: string, replicaId?: string): void;
    /**
     * Receives an iterator function and invokes it once per each field
     * of the underlying model changed with the current update.
     * <BR>Note that in case of an event generated by the creation of a new row
     * all the field will be iterated.
     * <BR>Note that the iterator is executed before this method returns.
     * <BR>Note that the iterator will iterate through all of the changed fields
     * including fields not having associated cells. Also, even if a field is
     * associated with more cells it will be passed to the iterator only once.
     *
     * @param {ChangedFieldCallback} iterator Function instance that will be called once per
     * each field changed on the current update on the internal model.
     *
     * @see VisualUpdate#getChangedFieldValue
     */
    forEachChangedField(iterator: ChangedFieldCallback): void;
}

declare module 'lightstreamer-client-web';