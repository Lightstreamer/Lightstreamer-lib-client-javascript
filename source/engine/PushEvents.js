import Global from "../Global";
import LoggerManager from "../../src-log/LoggerManager";
import EnvironmentStatus from "../../src-tool/EnvironmentStatus";
import ASSERT from "../../src-test/ASSERT";
import Constants from "../Constants";

  var protocolLogger = LoggerManager.getLoggerProxy(Constants.PROTOCOL);

  var simulateSilence = false;
  var currentProg = null;
  var currentIdForProg = null;

  var PushEvents = function(engId,tablePhaseChecker) {
    this.tablePhaseChecker = tablePhaseChecker;
    this.exportMethods(engId);

  };

  PushEvents.simulateSilence = function(silence) {
    simulateSilence = silence;
  };


  PushEvents.prototype = {

    changeSession: function(session) {
      protocolLogger.logDebug("Changing reference session",session);
      this.sessionHandler = session;
      if (this.sessionHandler.getSessionId() != this.currentIdForProg) {
          this.currentProg = null;
      }
    },

    exportMethods: function(engId) {
      var that = this;

      Global.exportGlobal(engId,"LS_e",function(flag, phase, arg3, controlLink, keepaliveIntervalDefault, requestLimitLength) {
        that.onPushEvent(flag, phase, arg3, controlLink, keepaliveIntervalDefault, requestLimitLength);
      });
      Global.exportGlobal(engId,"LS_t",function(_title) {
        that.onServerTitle(_title);
      });
      Global.exportGlobal(engId,"LS_u",function(winPhase, args, snap) {
        that.onUpdate(winPhase, args, snap);
      });
      Global.exportGlobal(engId,"LS_v",function(winPhase, args) {
        that.onUpdate(winPhase, args, true);
      });
      Global.exportGlobal(engId,"LS_o",function(winPhase, args) {
        that.onLostUpdatesEvent(winPhase, args);
      });
      Global.exportGlobal(engId,"LS_n",function(winPhase, args) {
        that.onEndOfSnapshotEvent(winPhase, args);
      });
      Global.exportGlobal(engId,"LS_s",function(winPhase, args) {
        // WARNING!!! this contains a recovery for a Server bug that lasted up to 6.1
        // now the recovery is no longer needed, as this new version, for both Web and Node.js,
        // requires Server version 6.2 (because of other, more important, reasons);
        // however, we keep the recovery, for now, to ensure partial backward compatibility
        if (args.length) {
          that.onClearSnapshotEvent(winPhase, args);
        } else {
          // it is a sync signal instead
          var phase = winPhase;
          var secs = args;
          that.onPushEvent(6, phase, secs);
        }
      });
      Global.exportGlobal(engId,"LS_l",function(flag, phase, tableCode, msg, isReqerr /*only for message errors*/) {
        that.onErrorEvent(flag, phase, tableCode, msg, isReqerr);
      });
      Global.exportGlobal(engId,"LS_w",function(flag, phase, tableCode, its, flds, kPos, cPos) {
        that.onControlEvent(flag, phase, tableCode, its, flds, kPos, cPos);
      });
      Global.exportGlobal(engId,"setTimeout",function(f,t) {
        setTimeout(f,t);
      });
      Global.exportGlobal(engId,"alert",function(m) {
        if (typeof alert != "undefined") {
          alert(m);
        } else if (typeof console != "undefined") {
          //node.js and possibly other server-side-js-environments will pass from here
          console.log(m);
        }
      });
      Global.exportGlobal(engId,"LS_svrname",function(name) {
          that.onServerName(name);
      });
      Global.exportGlobal(engId,"LS_MPNREG",function(deviceId, adapterName) {
          that.onMPNREG(deviceId, adapterName);
      });
      Global.exportGlobal(engId,"LS_MPNOK",function(lsSubId, pnSubId) {
          that.onMPNOK(lsSubId, pnSubId);
      });
      Global.exportGlobal(engId,"LS_MPNDEL",function(pnSubId) {
          that.onMPNDEL(pnSubId);
      });
    },

    preliminaryCheck: function(ph,tph,isPause,canBeBothPauseOrNot) {
      var _ok = !simulateSilence && !EnvironmentStatus.isUnloaded() && this.sessionHandler!=null;
      //log(-1,_ok);

      /*
       * NB
       * Checks was disabled for these reasons:
       * 1) the first two checks are wrong because TLCP answers don't carry phase information
       * 2) the third check doesn't work as expected when transport is polling (and further it is incomprehensible to me)
       */
//      if (_ok && ph) { //sendMessage related messages do not carry session phase information
//        _ok &= this.sessionHandler.checkSessionPhase(ph);
//        //log(-2,_ok,ph,this.sessionHandler.push_phase);
//      }
//
//      if (_ok && tph) {
//        _ok &= this.tablePhaseChecker.checkSessionPhase(tph);
//      }
//
//      if (_ok && !canBeBothPauseOrNot) {
//        if (isPause) {
//          _ok &= this.sessionHandler.isWaitingOKFromNet();
//        } else {
//          _ok &= this.sessionHandler.isReceivingAnswer();
//        }
//        //log(-3,_ok);
//      }
//      /*if (!_ok) {
//        log(0);
//      }*/

      if (protocolLogger.isDebugLogEnabled()) {
        protocolLogger.logDebug("Command phase check",_ok);
      }

      return _ok;
    },

    /**
     * Checks if a data notification can be forwarded to session.
     * In fact, in case of recovery, the initial notifications may be redundant.
     */
    processCountableNotification: function() {
        if (this.sessionHandler.getSessionId() != this.currentIdForProg) {
            // the associated sessionHandler object can be reused without notice
            this.currentProg = null;
        }
        var sessionProg = this.sessionHandler.getDataNotificationProg();
        protocolLogger.logDebug("Adding notification",sessionProg);
        if (this.currentProg != null) {
            //>>excludeStart("debugExclude", pragmas.debugExclude);
            if(!ASSERT.verifyOk((this.currentProg <= sessionProg))) {
              protocolLogger.logError("Unexpected progressive",this.currentProg);
            }
            //>>excludeEnd("debugExclude");
            this.currentProg++;
            if (this.currentProg <= sessionProg) {
                // already seen: to be skipped
                protocolLogger.logDebug("Skipping replicated progressive",this.currentProg);
                return false;
            } else {
                this.sessionHandler.onDataNotification();
                sessionProg = this.sessionHandler.getDataNotificationProg();
                //>>excludeStart("debugExclude", pragmas.debugExclude);
                if(!ASSERT.verifyValue(this.currentProg,sessionProg)) {
                  protocolLogger.logError("Unexpected progressive",this.currentProg);
                }
                //>>excludeEnd("debugExclude");
                return true;
            }
        } else {
            this.sessionHandler.onDataNotification();
            return true;
        }
    },

    onServerTitle: function(_title) {
      //USELESS
    },

    onPushEvent: function(flag, phase, arg3, controlLink, keepaliveIntervalDefault, requestLimitLength) {
      if (!this.preliminaryCheck(phase,null,flag == 1,flag == 3||flag == 4)) {
        return;
      }

      if (flag == 1) {
        //OK
        this.sessionHandler.onOKReceived(arg3,controlLink,requestLimitLength,keepaliveIntervalDefault);

      } else if (flag == 2) {
        //LOOP
        this.sessionHandler.onLoopReceived(arg3);

      } else if (flag == 3) {
        //SYNC ERROR
        this.sessionHandler.onSyncError("syncerror");

      } else if (flag == 4) {
        //END
        var cause = 30;
        if (arg3 != null) {
          cause = arg3;
          if (cause == 41) {
            this.sessionHandler.onError41();
            return;
          } else if (cause == 48) {
            // session max duration reached: behave like a sync error
            this.sessionHandler.onSyncError("expired");
            return;
          }
          if ((cause > 0 && cause < 30) || cause > 39) {
            // cause code unexpected in this context, hence considered as an error
            cause = 39;
          }
        }
        var message = "The session has been forcibly closed by the Server";
        // NB controlLink contains the message of END
        if (controlLink != null) {
            message = controlLink;
        }
        this.onErrorEvent(cause, phase, null, message);

      } else if (flag == 5) {
        this.sessionHandler.onServerSentBandwidth(arg3);

      } else if (flag == 6) {
        this.sessionHandler.onSyncReceived(arg3);

      } else if (flag == 7) {
        // NB when PROG, the fourth argument is not the control link but an array with the messages 
        // received between the previous and the current PROG
        var capturedMessages = controlLink;
        this.onProg(arg3, capturedMessages);

      } else {
        this.sessionHandler.onEnd("Unsupported Server version");
      }
    },
    
    onProg: function(prog, capturedMessages) {
        if (this.sessionHandler.getSessionId() != this.currentIdForProg) {
            // the associated sessionHandler object can be reused without notice
            this.currentProg = null;
        }
        var sessionProg = this.sessionHandler.getDataNotificationProg();
        if (this.currentProg == null) {
            this.currentProg = prog;
            this.currentIdForProg = this.sessionHandler.getSessionId();
            if (this.currentProg > sessionProg) {
                //>>excludeStart("debugExclude", pragmas.debugExclude);
                ASSERT.fail();
                //>>excludeEnd("debugExclude");
                protocolLogger.logError("Received event prog higher than expected",prog,sessionProg,capturedMessages);
                this.sessionHandler.onPROGCounterMismatch();
            }
        } else {
            // not allowed by the protocol, but we handle the case for testing scenarios;
            // these extra invocations of prog() can be enabled on the Server
            // through the <PROG_NOTIFICATION_GAP> private flag
            if (this.currentProg != prog) {
                //>>excludeStart("debugExclude", pragmas.debugExclude);
                ASSERT.fail();
                //>>excludeEnd("debugExclude");
                protocolLogger.logError("Received event prog different than expected",prog,this.currentProg,capturedMessages);
                this.sessionHandler.onPROGCounterMismatch();
            } else if (prog != sessionProg) {
                //>>excludeStart("debugExclude", pragmas.debugExclude);
                ASSERT.fail();
                //>>excludeEnd("debugExclude");
                protocolLogger.logError("Received event prog different than actual",prog,sessionProg,capturedMessages);
                this.sessionHandler.onPROGCounterMismatch();
            }
        }
    },

    onUpdate: function(winPhase, args, snap) {
      if (args.length < 2) {
        if (!this.preliminaryCheck(winPhase)) {
          return;
        }
        this.sessionHandler.onKeepalive();
      } else {
        if (!this.preliminaryCheck(null,winPhase)) {
          return;
        }
        if (! this.processCountableNotification()) {
          return;
        }
        this.sessionHandler.onUpdateReceived(args,snap || false);
      }
    },

    onSnapshot: function(winPhase,args) {
      this.onUpdate(winPhase,args,true);
    },

    onEndOfSnapshotEvent: function(winPhase,args) {
      if (!this.preliminaryCheck(null,winPhase)) {
        return;
      }
      if (! this.processCountableNotification()) {
        return;
      }

      this.sessionHandler.onEndOfSnapshotEvent(args);
    },

    onClearSnapshotEvent: function(winPhase,args) {
      if (!this.preliminaryCheck(null,winPhase)) {
        return;
      }
      if (! this.processCountableNotification()) {
        return;
      }

      this.sessionHandler.onClearSnapshotEvent(args);
    },

    //RAW; MERGE,DISTINCT or COMMAND with flag UNFILTERED; COMMAND without flag UNFILTERED (ADD and DELETE)
    onLostUpdatesEvent: function(winPhase, args) {
      if (!this.preliminaryCheck(null,winPhase)) {
        return;
      }
      if (! this.processCountableNotification()) {
        return;
      }

      this.sessionHandler.onLostUpdatesEvent(args);
    },

    /**
     * @param _code error code
     * @param num sequence number
     * @param messageCode sequence
     * @param msg error message
     * @param isReqerr when true, the error comes from a REQERR; when false, the error comes form a MSGFAIL.
     */
    onMessageErrorEvent: function(_code, num, messageCode, msg, isReqerr) {
      if (!this.preliminaryCheck()) {
        return;
      }
      
      //>>excludeStart("debugExclude", pragmas.debugExclude);
      if(!ASSERT.verifyValue(messageCode.substring(0, 3),"MSG")) {
        protocolLogger.logError("Unexpected message outcome sequence",messageCode);
      }
      //>>excludeEnd("debugExclude");
      var seq = messageCode.substr(3);
      
      // handle REQERR
      if (isReqerr) {
          this.sessionHandler.onMessageError(seq,_code,msg,num);
          return;
      }
      
      // handle MSGFAIL
      if (! this.processCountableNotification()) {
        return;
      }
      if (_code == 39) {  // 39 series of messages not received in time (and perhaps never arrived)
        var count = parseInt(msg);
        num = parseInt(num);
        for (var i = num - count + 1; i <= num; i++) {
          this.sessionHandler.onMessageDiscarded(seq, i);
        }

      } else if (_code == 38) {
        this.sessionHandler.onMessageDiscarded(seq,num);

      } else if (_code <= 0) {
        this.sessionHandler.onMessageDeny(seq,_code,msg,num);

      } else {
        // 34 request deemed invalid by the Metadata Adapter
        // 35 unexpected error in message processing
        this.sessionHandler.onMessageError(seq,_code,msg,num);
      }

    },

    /**
     * @param tableCode according to the format, it can represent a subscription error (when it is a number),
     * a CONERR (when null) or a message error (when starting with "MSG")
     * 
     * @param isReqerrFromMsg when true, the error comes from a REQERR; when false, the error comes form a MSGFAIL.
     * It is meaningful only if tableCode represents a message error
     */
    onErrorEvent: function(flag, phase, tableCode, msg, isReqerrFromMsg) {
      if (tableCode != null && isNaN(tableCode)) {
        this.onMessageErrorEvent(flag, phase, tableCode, msg, isReqerrFromMsg);
        return;
      }

      if (tableCode != null) {
        // handle REQERR about subscription errors
        if (!this.preliminaryCheck(null,phase)) {
          return;
        }
        this.sessionHandler.onTableError(tableCode,flag,msg);

      } else {
        // handle CONERR
        if (!this.preliminaryCheck(phase,null,null,true)) {
          return;
        }
        this.sessionHandler.forwardError(flag, msg);
      }

    },

    onControlEvent: function(flag, phase, tableCode, its, flds,kPos,cPos) {
      if (!this.preliminaryCheck(null,flag == 4 || flag == 5 || flag == 9 ? null : phase)) {
        return;
      }

      if (flag == 4) {
        // handle REQOK about message acknowledgments
        this.sessionHandler.onMessageAck(tableCode,phase);

      } else if (flag == 5) {
        // handle MSGDONE
        if (! this.processCountableNotification()) {
            return;
        }
        this.sessionHandler.onMessageOk(tableCode,phase);

      } else if (flag == 8) {
        // handle UNSUB
        if (! this.processCountableNotification()) {
            return;
        }
        this.sessionHandler.onUnsubscription(tableCode);

      } else if (flag == 6) {
        // handle SUBOK
        if (! this.processCountableNotification()) {
            return;
        }
        this.sessionHandler.onSubscription(tableCode,its,flds,kPos+1,cPos+1);

      } else if (flag == 9) {
        // handle CONF (i.e. subscription frequency)
        // NB "its" is the frequency sent by the server 
        if (! this.processCountableNotification()) {
            return;
        }
        this.sessionHandler.onSubscriptionReconf(tableCode,phase,its);

      } else {
        //?
        protocolLogger.logDebug("Unexpected command received, ignoring",flag);
      }

      // flag == 7
      // in response to a request of add_silent
      // to signal that the server is synchronized.

    },
    
    onServerName: function(name) {
        this.sessionHandler.onServerName(name);
    },
    
    onMPNREG: function(deviceId, adapterName) {
        if (! this.processCountableNotification()) {
            return;
        }
        this.sessionHandler.onMpnRegisterOK(deviceId, adapterName);
    },
    
    onMPNOK: function(lsSubId, pnSubId) {
        if (! this.processCountableNotification()) {
            return;
        }
        this.sessionHandler.onMpnSubscribeOK(lsSubId, pnSubId);
    },
    
    onMPNDEL: function(pnSubId) {
        if (! this.processCountableNotification()) {
            return;
        }
        this.sessionHandler.onMpnUnsubscribeOK(pnSubId);
    }

  };


  export default PushEvents;




/*END*/
  //call from the push frame to signal that a connection has been closed
  // voluntarily. In general it will be a connection that is already obsolete,
  // but if it were not so, the client should decide whether to try to reopen it
  // or give up and go immediately to the disconnected state.

  // the Server sends this event in each of the following cases,
  // which for the moment are not distinguished:
    // intervention of a new connection that sticks to the same session
      // (must have been made by hand)
    // unexpected exception during creation or during activity
      // (it never happened)
    // request closure with call destroy
    // closure requested by the Metadata Adapter via a ConflictingSessionException
      // (but only if it originated from another page; if it is
                // a reopening on this same page, the notification
                // does not arrive here, because it has the old phase)
    // closure required by identification as OldSession
      // (but, unless the request was made by hand,
                // the notification does not arrive here, because it has the old phase)
    // closure requested by JMX interface
  // don't send him in these cases
    // IOException on the connection
      // (but here could be the retry event, with flag == 3,
                // caused by the onload, managed by Safari and Chrome)
    // natural end of content-length
      // (here in reality it sends it, but the loop event, with flag == 2,
                // arrives first and sends this out of phase)
  
 
