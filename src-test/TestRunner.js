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
import ASSERT from "./ASSERT";

export default /*@__PURE__*/(function() {
  /**
   * Constructor for TestRunner.
   * @constructor
   * 
   * @exports TestRunner
   * @class TestRunner is the class to be used to run custom written classes extending the {@link AbstractTest} class.
   * It is the core of the testing project enabling the writing of both sincronous and asynchronous events.
   * <br>It is possible to fill the TestRunner with as many tests as needed before launching it. It extends the EventDispatcher 
   * from utility-toolkit-javascript in order to notify of tests executions the outside code.
   * @extends EventDispatcher
   */
  var TestRunner = function() {
    this.tests = [];
    this.runningTest = -1;
    this.initDispatcher();
  };
  
  TestRunner.prototype = {
      /**
       * Adds a test to the test queue.
       * @param {AbstractTest} test a test to be queued to run.
       */
      pushTest: function(test) {
        this.tests.push(test);
        test.addListener(this);
      }, 
      
      /**
       * Returns the total number of queued tests
       * @returns total number of queued tests
       */
      size: function() {
        return this.tests.length;
      },

      /**
       * Starts running tests.
       */
      start: function() {
        if (this.runningTest != -1) {
          throw "Already started";
        } else if (this.tests.length <= 0) {
          throw "No tests to run";
        }
        this.nextTest();
      },
     
      /**
       * @private 
       */
      nextTest: function() {
        this.runningTest++;
        if (this.runningTest >= this.tests.length) {
          this.runningTest = -1;
          this.dispatchEvent("onAllTestComplete",[ASSERT.getFailures()]);
          return;
        }
        
        this.dispatchEvent("onTestStart",[this.runningTest,this.tests[this.runningTest]]);
        this.tests[this.runningTest].start();
        
        
      },
      
      /**
       * Implementation for {@link AbstractTestListener}  
       */
      onTestCompleted: function() {
        this.dispatchEvent("onTestEnd",[this.runningTest,this.tests[this.runningTest]]);
        this.nextTest();
      }
      
  };
  
  //closure compiler exports
  TestRunner.prototype["onTestCompleted"] = TestRunner.prototype.onTestCompleted;
  TestRunner.prototype["start"] = TestRunner.prototype.start;
  TestRunner.prototype["pushTest"] = TestRunner.prototype.pushTest;
  TestRunner.prototype["size"] = TestRunner.prototype.size;

  //implements AbstractTestListener
  Inheritance(TestRunner,EventDispatcher,true);
  
  
  
  /**
   * Empty constructor.
   * @constructor
   * 
   * @exports TestRunnerListener
   * @class The interface to be implemented to listen to the TestRunner class
   */
  var TestRunnerListener = function() {};
  TestRunnerListener.prototype = {
      /**
       * Fired once all the test are completed.
       * @param {Number} assertFailed the number of
       * failed assertions. 
       */
      onAllTestComplete:function(assertFailed) {},
      /**
       * Fired when a test is starting.
       * @param {Number} index the number of the
       * test in the queue.
       * {param} {AbstractTest} test the test instance.
       */
      onTestStart: function(index,test) {},
      /**
       * Fired when a test is completed.
       * @param {Number} index the number of the
       * test in the queue.
       * @param {AbstractTest} test the test instance.
       */
      onTestEnd:function(index,test) {}
  };
  
  
 
  return TestRunner;
})();
  


