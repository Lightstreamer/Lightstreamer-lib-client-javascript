import PageProxy from "../PageProxy";

  var blackList = {};

  function RemotePage(frameName) {
    this.frameName = frameName;
  }

  RemotePage.prototype = {

    getRemotePageReference: function() {
      if (blackList[this.frameName]) {
        return Promise.resolve(null);
      } else {
        var pageProxy = new PageProxy();

        var windowOpened = pageProxy.linkLSPage(this.frameName, true);
        if (windowOpened) {
          var ref = pageProxy.getWindowRef();
          if (ref == null) {
            blackList[this.frameName] = true;
            return Promise.resolve(null);
          } else {
            return Promise.resolve(ref);
          }
        } else {
          return Promise.resolve(null);
        }
      }
    }

/*
    if(this.openedFrames[values[Constants.FRAME_NAME_INDEX]]) {
      sharingLogger.logDebug("Skipping already-used cookie",iEngineName);
      //we've already done a window.open on this engine
      continue;
    }
    */
  };

  export default RemotePage;



