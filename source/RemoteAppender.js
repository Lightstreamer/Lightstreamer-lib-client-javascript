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
import BufferAppender from "../src-log/BufferAppender";
import Executor from "../src-tool/Executor";
import IllegalArgumentException from "../src-tool/IllegalArgumentException";

export default /*@__PURE__*/(function() {
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
  var RemoteAppender = function(level, category, lsClient) {
    this._callSuperConstructor(RemoteAppender, [level, category, 10]);
        
    this.waiting = false;
    
    if (!lsClient) {
      throw new IllegalArgumentException("a LightstreamerClient instance is necessary for a RemoteAppender to work.");
    }
    
    this._client = lsClient;
  };
  
  
  RemoteAppender.prototype = {

  
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
    log: function(category, level, mex, header) {
      this._callSuperMethod(RemoteAppender,"log",[category, level, mex, header]);
      this._flush(true);
    },
    
    /**
     * @private 
     */
    _flush: function(syncCall) {
      if (this.getLength() <= 0) {
        return;
      }
      
      if (this._client.getStatus().indexOf("CONNECTED") == 0) {
        var sendObj = this.extractLogForNetwork();

        if (this._client.sendLog(sendObj)) {
          this.reset();
          this.waiting = false;
          return;
        }
      } 
      
      if (!this.waiting || !syncCall) {
        this.waiting = true;
        Executor.addTimedTask(this._flush,2000,this);
      }
    },
    
    extractLogForNetwork: function(maxRows,sepBefore) {
      var orig = this._callSuperMethod(RemoteAppender,"extractLog",["LS_log"]);
      orig = orig.split("LS_log");
      
      var sepBefore = "LS_log";
      var dump = {};
      for (var i=0; i<orig.length; i++) {
        if (orig[i].length == 0) {
          continue;
        }
        var name = sepBefore+(i+1);
        dump[name] = encodeURIComponent(orig[i].replace(/[\n\r\f]/g,"||"));
      }
      
      return dump;
    },
    
    
    /**
     * Disabled
     */
    extractLog: function() {
      return null;
    }
  };

  RemoteAppender.prototype["extractLog"] = RemoteAppender.prototype.extractLog;
  RemoteAppender.prototype["log"] = RemoteAppender.prototype.log;
  
  Inheritance(RemoteAppender, BufferAppender,false,true);
  return RemoteAppender;
})();

