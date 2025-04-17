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
import Inheritance from "../src-tool/Inheritance";
import NotificationBuilder from "./mpn/NotificationBuilder";

export default /*@__PURE__*/(function() {
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
    var SafariMpnBuilder = function(notificationFormat) {
        if (notificationFormat) {
            var descriptor = JSON.parse(notificationFormat);
            this._callSuperConstructor(SafariMpnBuilder, [descriptor]);
        } else {
            this._callSuperConstructor(SafariMpnBuilder);
        }
    };

    SafariMpnBuilder.prototype = {

            /**
             * Produces the JSON structure for the push notification format specified by this object.
             * @return {String} the JSON structure for the push notification format.
             */
            build: function() {
                var map = this._callSuperMethod(SafariMpnBuilder, "build");
                return JSON.stringify(map);
            },

            /**
             * Gets the value of <code>aps&period;alert&period;title</code> field.
             * @return {String} the value of <code>aps&period;alert&period;title</code> field, or null if absent.
             */
            getTitle: function() {
                return this.getValue("aps.alert", "title");
            },

            /**
             * Sets the <code>aps&period;alert&period;title</code> field.
             *
             * @param {String} title A string to be used for the <code>aps&period;alert&period;title</code> field value, or null to clear it.
             * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
             */
            setTitle: function(title) {
                return this.setValue("aps.alert", "title", title);
            },

            /**
             * Gets the value of <code>aps&period;alert&period;body</code> field.
             * @return {String} the value of <code>aps&period;alert&period;body</code> field, or null if absent.
             */
            getBody: function() {
                return this.getValue("aps.alert", "body");
            },

            /**
             * Sets the <code>aps&period;alert&period;body</code> field.
             *
             * @param {String} body A string to be used for the <code>aps&period;alert&period;body</code> field value, or null to clear it.
             * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
             */
            setBody: function(body) {
                return this.setValue("aps.alert", "body", body);
            },

            /**
             * Gets the value of <code>aps&period;alert&period;action</code> field.
             * @return {String} the value of <code>aps&period;alert&period;action</code> field, or null if absent.
             */
            getAction: function() {
                return this.getValue("aps.alert", "action");
            },

            /**
             * Sets the <code>aps&period;alert&period;action</code> field.
             *
             * @param {String} action A string to be used for the <code>aps&period;alert&period;action</code> field value, or null to clear it.
             * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
             */
            setAction: function(action) {
                return this.setValue("aps.alert", "action", action);
            },

            /**
             * Gets the value of <code>aps&period;url-args</code> field.
             * @return {String[]} the value of <code>aps&period;url-args</code> field, or null if absent.
             */
            getUrlArguments: function() {
                return this.getValue("aps", "url-args");
            },

            /**
             * Sets the <code>aps&period;url-args</code> field.
             *
             * @param {String[]} urlArguments An array to be used for the <code>aps&period;url-args</code> field value, or null to clear it.
             * @return {SafariMpnBuilder} this MpnBuilder object, for fluent use.
             */
            setUrlArguments: function(urlArguments) {
                return this.setValue("aps", "url-args", urlArguments);
            }
    };

    SafariMpnBuilder.prototype['build'] = SafariMpnBuilder.prototype.build;
    SafariMpnBuilder.prototype['getTitle'] = SafariMpnBuilder.prototype.getTitle;
    SafariMpnBuilder.prototype['setTitle'] = SafariMpnBuilder.prototype.setTitle;
    SafariMpnBuilder.prototype['getBody'] = SafariMpnBuilder.prototype.getBody;
    SafariMpnBuilder.prototype['setBody'] = SafariMpnBuilder.prototype.setBody;
    SafariMpnBuilder.prototype['getAction'] = SafariMpnBuilder.prototype.getAction;
    SafariMpnBuilder.prototype['setAction'] = SafariMpnBuilder.prototype.setAction;
    SafariMpnBuilder.prototype['getUrlArguments'] = SafariMpnBuilder.prototype.getUrlArguments;
    SafariMpnBuilder.prototype['setUrlArguments'] = SafariMpnBuilder.prototype.setUrlArguments;

    Inheritance(SafariMpnBuilder, NotificationBuilder);
    return SafariMpnBuilder;
})();

