import HTTPEncoder from "../encoders/HTTPEncoder";
import Utils from "../Utils";
import nodeUtils from 'node-utils';

  function retFalse() {
    return false;
  }

  function retTrue() {
    return true;
  }

  var BASIC_ENCODER = new HTTPEncoder();

  /**
   * ServerConnection interface to be implemented for a ServerConnection type to be used with ControlConnectionHandler
   * or to connect with the server
   * @private
   */
  var ServerConnection = function() {
    for(var i in  {_load:true}) {
      //used by implementation to call super methods without using the static string everywhere (it's a trick)
      this._loadName=i;
    }

    //implementation MUST declare the constr variable with their constructon on each instance.
    this.constr = ServerConnection;

  };

  ServerConnection.attachPublicStaticMethods = function(_class,obj) {
    for (var i in obj) {
      if (obj[i] === true) {
        _class[i] = retTrue;
      } else if (obj[i] === false) {
        _class[i] = retFalse;
      } else {
        _class[i] = obj[i];
      }
    }
  };

  ServerConnection.attachPublicStaticMethods(ServerConnection,{
    /**
     * @static
     * whenever this Class can be used in this browser.
     * It is possible to return true even if the connection is not available at the moment
     * in such case any call to the load method of any instance of this class must return null; btw
     * such situation can't go on forever so that after a timeout (handled by the class) this method and
     * the load method of any instance of this class MUST return false.
     *
     * If the load method of an instance of this class returns false this method MUST return false too
     * @param serverAddress the address this class is going to be used for
     * @private
     */
    isAvailable: false,
    isCrossSite: false,
    isCrossProtocol: false,
    areCookiesGuaranteed: false,
    attachEngineId: false,
    isStreamEnabled: false,
    canUseCustomHeaders: false
  });


  ServerConnection.prototype = {

    /**
     * if possible closes the connection, otherwise do nothing
     * @private
     */
    _close: function() {
      return;
    },

    sessionLoad: function(request,phase,responseCallback,errorCallback,connectionEndCallback,engId) {

      return this._load(request,phase,responseCallback,errorCallback,connectionEndCallback);
    },

    /**
     * Method that loads a requests
     * @param {Object} request
     * @param {Number} phase the phase of the request, must be returned as the second parameter of the callbacks
     * @param {Function} responseCallback this callback must be called when the request is complete. The first parameter
     * must be the result fetched while the second one is the phase and must be the same value passed to the load method.
     * In case the ServerConnection implementation does not handle server response for any reason it must call the responseCallback
     * callback with the first parameter set as null (for instance, the FakeNotifyConnection calls the callback after 1 second with no
     * idea of what has happened to the request; you may want to extend such abstract class if once sent you don't have any
     * idea on what happens to the request).
     * @param {Function} errorCallback this callback must be called if the request fails in any way.
     * It's completely alternative to the response callback (any load call produces only one between a responseCallback call
     * and a errorCallback call) It has 2 parameters, the first one represents the error (you may want to use an
     * Exception instance) the other one is the phase and must be the same value passed to the load method
     * @param {boolean} connectionEndCallback a callback to be called when the connection class is unsure if the connection
     * ended correctly or was broken; may be useful on Streaming connections implemented with XHR
     *
     * @return {boolean} true if the request was (presumably) sent, null if the request can't be sent but
     * probably can be sent in the future or false if there is no way this instance can send the request;
     * if this method returns null after a certain number of calls MUST return true or false;
     * @private
     */
    _load: function(request,phase,responseCallback,errorCallback,connectionEndCallback) {
      return false;
    },

    getEncoder: function() {
      return BASIC_ENCODER;
    }
  };

//START_WEB_JSDOC_EXCLUDE
  ServerConnection.getGlobalCookiesForNode = nodeUtils.getGlobalCookiesForNode;
  ServerConnection.addGlobalCookiesForNode = nodeUtils.addGlobalCookiesForNode;
//END_WEB_JSDOC_EXCLUDE
  export default ServerConnection;
