/*
  Copyright (c) Lightstreamer Srl

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
import Inheritance from "../src-tool/Inheritance";
import EventDispatcher from "../src-tool/EventDispatcher";
import LoggerManager from "../src-log/LoggerManager";

export default /*@__PURE__*/(function() {
  /**
   * Constructor for AbstractTest, it simply calls this.initDispatcher()
   * @constructor
   * 
   * @exports AbstractTest
   * @class AbstractTest is the class to be extended to to run a single test. AbstractTest instances are supposed to be
   * executed through {@link TestRunner}
   * @extends EventDispatcher
   * 
   * @example
   * define(["MyClass","ASSERT","Inheritance","AbstractTest"],
   *  function(MyClass,ASSERT,Inheritance,AbstractTest) {
   * 
   *  var MyClassTest(p1,p2,expected) {
   *    //store input somewhere
   *  }
   * 
   *  MyClassTest.getInstances = function() {
   *    return [new MyClassTest(0,0,0),
   *            new MyClassTest(0,1,1),
   *            new MyClassTest(1,1,10)];
   *  };
   *  
   *  MyClassTest.prototype = {
   *    start: function() {
   *      //use input to test MyClass
   *      //use ASSERT to verify test conditions
   *      
   *      //don't forget to call end. 
   *      //It can also be called on a timeout 
   *      this.end();
   *    }
   *  }
   * 
   *  Inheritance(MyClassTest,AbstractTest);
   *  return MyClassTest;
   * });
   */
  var AbstractTest = function() {
    this.initDispatcher();
  };
  
  /**
   * @property {LoggerProxy} testLogger A static logger instance that can be used for the test logging.
   */
  AbstractTest.testLogger = LoggerManager.getLoggerProxy("weswit.test");
  
  /**
   * Static method that may be reimplemented to return a list of AbstractTest 
   * instances to be run
   */
  AbstractTest.getInstances = function() {
    return [];
  };
  
  AbstractTest.prototype = {
      /**
       * Main method to be reimplemented. When called the current test should be
       * executed and then the {@link end} method should be called. Note that end
       * can also be called asynchronously (e.g.: you can use this class
       * to run end-to-end tests)
       */
      start:function() { //reimplement this method
        //do something then call end
        //this.end();
      },
      
      /**
       * Method to be called once the test is completed.
       */
      end: function() {
        this.dispatchEvent("onTestCompleted");
      }
  };
  
  AbstractTest.prototype["start"] = AbstractTest.prototype.start;
  AbstractTest.prototype["end"] = AbstractTest.prototype.end;
  AbstractTest["testLogger"] = AbstractTest.testLogger; 
  
  Inheritance(AbstractTest,EventDispatcher);
  
  
  /**
   * Empty constructor.
   * @constructor
   * 
   * @exports AbstractTestListener
   * @class The interface to be implemented to listen to the AbstractTest class.
   * There is generally no need to implement this interface as it is implemented 
   * by the {@link TestRunner} class.
   */
  var AbstractTestListener = function() {};
  AbstractTestListener.prototype = {
      /**
       * Fired when the test is completed.
       */
      onTestCompleted:function() {}
  };
  
  
  return AbstractTest;
})();
