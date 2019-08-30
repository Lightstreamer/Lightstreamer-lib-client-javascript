import Utils from "../Utils";

  /**
   * can be used as mixin, just call initChannel in your constructor
   * @constructor
   */
  export default {
    createCaller: function (name, definition) {
      if (definition.wantsResponse) {

        if (definition.addSessionPhase) {
          return function () {
            try {
              var r = this.target[name].apply(this.target, [this.sessionPhase].concat(Utils.argumentsToArray(arguments)));
              return Promise.resolve(r);
            } catch(e) {
              return Promise.reject(e);
            }
          };

        } else {
          return function () {
            try {
              var r = this.target[name].apply(this.target, arguments);
              return Promise.resolve(r);
            } catch(e) {
              return Promise.reject(e);
            }
          };
        }



      } else {
        if (definition.addSessionPhase) {
          return function () {
            try {
              this.target[name].apply(this.target, [this.sessionPhase].concat(Utils.argumentsToArray(arguments)));
            } catch (e) {
                console.error(e);
            }
          };
        } else {
          return function () {
            try {
              this.target[name].apply(this.target, arguments);
            } catch (e) {
                console.error(e);
            }
          };
        }
      }
    }
  };



