import Constants from "../Constants";
import LoggerManager from "../../src-log/LoggerManager";
import TlcpServerMessage from "./NewTlcpServerMessage";
import RequestsHelper from "./RequestsHelper";
import Utils from "../Utils";
import RetryDelayCounter from './RetryDelayCounter';
import CtrlRequest from '../utils/CtrlRequest';
import RecoveryBean from "./RecoveryBean";
import WebSocketConnection from "../net/WebSocketConnection";
import {WS, addGlobalEventListener, removeGlobalEventListener} from "PIToolkit";
import Request from "../net/Request";
import ConnectionSelector from "../net/ConnectionSelector";

var State = {}; var stateNames = [];
(function() {
    var i = 0;
    State.Init = ++i; stateNames[i] = "Init";
    State.Opening = ++i; stateNames[i] = "Opening";
    State.Probing = ++i; stateNames[i] = "Probing";
    State.CreatingOrBinding = ++i; stateNames[i] = "CreatingOrBinding";
    State.Disconnected = ++i; stateNames[i] = "Disconnected";
    State.Pause1 = ++i; stateNames[i] = "Pause1";
    State.Pause2 = ++i; stateNames[i] = "Pause2";
    State.SwitchAndCreatingHTTP = ++i; stateNames[i] = "SwitchAndCreatingHTTP";
    State.SwitchAndCreating = ++i; stateNames[i] = "SwitchAndCreating";
    State.SwitchAndCreatingPOLLING = ++i; stateNames[i] = "SwitchAndCreatingPOLLING";
    State.SwitchAndRebinding = ++i; stateNames[i] = "SwitchAndRebinding";
    State.SwitchAndRebindingPOLLING = ++i; stateNames[i] = "SwitchAndRebindingPOLLING";
    State.Recovering = ++i; stateNames[i] = "Recovering"; // Recovery state
    State.Pause_R0 = ++i; stateNames[i] = "Pause_R0"; // Recovery state
    State.Pause_R = ++i; stateNames[i] = "Pause_R"; // Recovery state
    State.Streaming = ++i; stateNames[i] = "Streaming";
    State.Receiving = ++i; stateNames[i] = "Receiving"; // MainRegion
    State.Stalling = ++i; stateNames[i] = "Stalling"; // MainRegion
    State.Stalled = ++i; stateNames[i] = "Stalled"; // MainRegion
    State.Switching = ++i; stateNames[i] = "Switching"; // MainRegion
    State.Slowing = ++i; stateNames[i] = "Slowing"; // MainRegion
    State.RhbDisabled = ++i; stateNames[i] = "RhbDisabled"; // ReverseHeartbeatRegion
    State.RhbEnabled = ++i; stateNames[i] = "RhbEnabled"; // ReverseHeartbeatRegion
    State.SlwRunning0 = ++i; stateNames[i] = "SlwRunning0"; // SlowingRegion
    State.SlwRunning1 = ++i; stateNames[i] = "SlwRunning1"; // SlowingRegion
    State.SlwRunning2 = ++i; stateNames[i] = "SlwRunning2"; // SlowingRegion
    State.SlwSlowing = ++i; stateNames[i] = "SlwSlowing"; // SlowingRegion
    State.FromRecovery = ++i; stateNames[i] = "FromRecovery"; // ProgRegion
    State.NoDebug = ++i; stateNames[i] = "NoDebug"; // ProgRegion
    State.Debug = ++i; stateNames[i] = "Debug"; // ProgRegion
})();

function isFinalState(state) {
    switch (state) {
    case State.Disconnected:
    case State.SwitchAndCreatingHTTP:
    case State.SwitchAndCreating:
    case State.SwitchAndCreatingPOLLING:
    case State.SwitchAndRebinding:
    case State.SwitchAndRebindingPOLLING:
        return true;
    default:
        return false;
    }
}

var Event = {}; var eventNames = [];
(function() {
    var i = 0;
    Event._connect = ++i; eventNames[i] = "_connect";
    Event.connect = ++i; eventNames[i] = "connect";
    Event.connect_switch = ++i; eventNames[i] = "connect_switch";
    Event.connect_giveup = ++i; eventNames[i] = "connect_giveup";
    Event.retry = ++i; eventNames[i] = "retry";
    Event.retry_switch = ++i; eventNames[i] = "retry_switch";
    Event.bind = ++i; eventNames[i] = "bind";
    Event.disconnect = ++i; eventNames[i] = "disconnect";
    Event.subscribe = ++i; eventNames[i] = "subscribe";
    Event.unsubscribe = ++i; eventNames[i] = "unsubscribe";
    Event.message = ++i; eventNames[i] = "message";
    Event.register = ++i; eventNames[i] = "register";
    Event.subscribeMpn = ++i; eventNames[i] = "subscribeMpn";
    Event.unsubscribeMpn = ++i; eventNames[i] = "unsubscribeMpn";
    Event.unsubscribeFilterMpn = ++i; eventNames[i] = "unsubscribeFilterMpn";
    Event.onOpen = ++i; eventNames[i] = "onOpen";
    Event.onOpen_Creating = ++i; eventNames[i] = "onOpen_Creating";
    Event.onOpen_Binding = ++i; eventNames[i] = "onOpen_Binding";
    Event.onOpen_busy = ++i; eventNames[i] = "onOpen_busy";
    Event.onRetryTimeout = ++i; eventNames[i] = "onRetryTimeout";
    Event.onRetryTimeout_isWsForced = ++i; eventNames[i] = "onRetryTimeout_isWsForced";
    Event.onRetryTimeout_NOTisWsForced = ++i; eventNames[i] = "onRetryTimeout_NOTisWsForced";
    Event.onRetryTimeout_hasRecoveryTimeoutElapsed = ++i; eventNames[i] = "onRetryTimeout_hasRecoveryTimeoutElapsed";
    Event.onRetryTimeout_NOThasRecoveryTimeoutElapsed = ++i; eventNames[i] = "onRetryTimeout_NOThasRecoveryTimeoutElapsed";
    Event.onLoopTimeout = ++i; eventNames[i] = "onLoopTimeout";
    Event.onWsErrorOrClose = ++i; eventNames[i] = "onWsErrorOrClose";
    Event.onWsErrorOrClose_isWsForced = ++i; eventNames[i] = "onWsErrorOrClose_isWsForced";
    Event.onWsErrorOrClose_NOTisWsForced = ++i; eventNames[i] = "onWsErrorOrClose_NOTisWsForced";
    Event.onWsErrorOrClose_isRecoveryEnabled = ++i; eventNames[i] = "onWsErrorOrClose_isRecoveryEnabled";
    Event.onWsErrorOrClose_NOTisRecoveryEnabled = ++i; eventNames[i] = "onWsErrorOrClose_NOTisRecoveryEnabled";
    Event.requestSwitch = ++i; eventNames[i] = "requestSwitch";
    Event.requestSwitch_NOTisWsStreaming = ++i; eventNames[i] = "requestSwitch_NOTisWsStreaming";
    Event.constrain = ++i; eventNames[i] = "constrain";
    Event.constrain_NOTunmanaged = ++i; eventNames[i] = "constrain_NOTunmanaged";
    Event.reconf = ++i; eventNames[i] = "reconf";
    Event.sendLog = ++i; eventNames[i] = "sendLog";
    Event.WSOK = ++i; eventNames[i] = "WSOK";
    Event._CONOK = ++i; eventNames[i] = "_CONOK";
    Event.CONOK = ++i; eventNames[i] = "CONOK"; // transport is ws-streaming and RhbDisabled
    Event.CONOK_rhb = ++i; eventNames[i] = "CONOK_rhb"; // transport is ws-streaming and RhbEnabled
    Event.CONOK_switch = ++i; eventNames[i] = "CONOK_switch"; // transport is not ws-streaming and RhbDisabled
    Event.CONOK_switch_rhb = ++i; eventNames[i] = "CONOK_switch_rhb"; // transport is not ws-streaming and RhbEnabled
    Event.NOOP = ++i; eventNames[i] = "NOOP";
    Event.PROBE = ++i; eventNames[i] = "PROBE";
    Event.SERVNAME = ++i; eventNames[i] = "SERVNAME";
    Event.CLIENTIP = ++i; eventNames[i] = "CLIENTIP";
    Event.CONS = ++i; eventNames[i] = "CONS";
    Event.CONERR = ++i; eventNames[i] = "CONERR";
    Event.CONERR_isFatalError = ++i; eventNames[i] = "CONERR_isFatalError";
    Event.CONERR_isSoftError = ++i; eventNames[i] = "CONERR_isSoftError";
    Event.CONERR_isMetadataAdapterError = ++i; eventNames[i] = "CONERR_isMetadataAdapterError";
    Event.CONERR_isGenericMetadataAdapterError = ++i; eventNames[i] = "CONERR_isGenericMetadataAdapterError";
    Event.CONERR_isServerBusyError = ++i; eventNames[i] = "CONERR_isServerBusyError";
    Event.ERROR = ++i; eventNames[i] = "ERROR";
    Event.END = ++i; eventNames[i] = "END";
    Event.END_isFatalError = ++i; eventNames[i] = "END_isFatalError";
    Event.END_NOTisFatalError = ++i; eventNames[i] = "END_NOTisFatalError";
    Event.REQOK = ++i; eventNames[i] = "REQOK";
    Event.SUBOK = ++i; eventNames[i] = "SUBOK";
    Event.SUBCMD = ++i; eventNames[i] = "SUBCMD";
    Event.U = ++i; eventNames[i] = "U";
    Event.UNSUB = ++i; eventNames[i] = "UNSUB";
    Event.EOS = ++i; eventNames[i] = "EOS";
    Event.CONF = ++i; eventNames[i] = "CONF";
    Event.CS = ++i; eventNames[i] = "CS";
    Event.OV = ++i; eventNames[i] = "OV";
    Event.MSGDONE = ++i; eventNames[i] = "MSGDONE";
    Event.MSGFAIL = ++i; eventNames[i] = "MSGFAIL";
    Event.MSGFAIL_isMessageDiscarded = ++i; eventNames[i] = "MSGFAIL_isMessageDiscarded";
    Event.MSGFAIL_isMessageDeny = ++i; eventNames[i] = "MSGFAIL_isMessageDeny";
    Event.MSGFAIL_isMessageError = ++i; eventNames[i] = "MSGFAIL_isMessageError";
    Event.REQERR = ++i; eventNames[i] = "REQERR";
    Event.REQERR_isSyncError = ++i; eventNames[i] = "REQERR_isSyncError";
    Event.REQERR_isFatalError = ++i; eventNames[i] = "REQERR_isFatalError";
    Event.REQERR_isMessageError = ++i; eventNames[i] = "REQERR_isMessageError";
    Event.REQERR_isSubscriptionError = ++i; eventNames[i] = "REQERR_isSubscriptionError";
    Event.REQERR_isUnsubscriptionError19 = ++i; eventNames[i] = "REQERR_isUnsubscriptionError19";
    Event.REQERR_isRegistrationError = ++i; eventNames[i] = "REQERR_isRegistrationError";
    Event.REQERR_isMpnSubscriptionError = ++i; eventNames[i] = "REQERR_isMpnSubscriptionError";
    Event.REQERR_isMpnUnsubscriptionError = ++i; eventNames[i] = "REQERR_isMpnUnsubscriptionError";
    Event.REQERR_isOtherError = ++i; eventNames[i] = "REQERR_isOtherError";
    Event.MPNREG = ++i; eventNames[i] = "MPNREG";
    Event.MPNOK = ++i; eventNames[i] = "MPNOK";
    Event.MPNDEL = ++i; eventNames[i] = "MPNDEL";
    Event._LOOP = ++i; eventNames[i] = "_LOOP";
    Event.LOOP = ++i; eventNames[i] = "LOOP";
    Event.LOOP_slow = ++i; eventNames[i] = "LOOP_slow";
    Event.PROG = ++i; eventNames[i] = "PROG";
    Event._U = ++i; eventNames[i] = "_U";
    Event._SUBOK = ++i; eventNames[i] = "_SUBOK";
    Event._SUBCMD = ++i; eventNames[i] = "_SUBCMD";
    Event._UNSUB = ++i; eventNames[i] = "_UNSUB";
    Event._EOS = ++i; eventNames[i] = "_EOS";
    Event._CS = ++i; eventNames[i] = "_CS";
    Event._OV = ++i; eventNames[i] = "_OV";
    Event._CONF = ++i; eventNames[i] = "_CONF";
    Event._MSGDONE = ++i; eventNames[i] = "_MSGDONE";
    Event._MSGFAIL = ++i; eventNames[i] = "_MSGFAIL";
    Event._MPNREG = ++i; eventNames[i] = "_MPNREG";
    Event._MPNOK = ++i; eventNames[i] = "_MPNOK";
    Event._MPNDEL = ++i; eventNames[i] = "_MPNDEL";
    Event.U_skip = ++i; eventNames[i] = "U_skip";
    Event.SUBOK_skip = ++i; eventNames[i] = "SUBOK_skip";
    Event.SUBCMD_skip = ++i; eventNames[i] = "SUBCMD_skip";
    Event.UNSUB_skip = ++i; eventNames[i] = "UNSUB_skip";
    Event.EOS_skip = ++i; eventNames[i] = "EOS_skip";
    Event.CS_skip = ++i; eventNames[i] = "CS_skip";
    Event.OV_skip = ++i; eventNames[i] = "OV_skip";
    Event.CONF_skip = ++i; eventNames[i] = "CONF_skip";
    Event.MSGDONE_skip = ++i; eventNames[i] = "MSGDONE_skip";
    Event.MSGFAIL_skip = ++i; eventNames[i] = "MSGFAIL_skip";
    Event.MPNREG_skip = ++i; eventNames[i] = "MPNREG_skip";
    Event.MPNOK_skip = ++i; eventNames[i] = "MPNOK_skip";
    Event.MPNDEL_skip = ++i; eventNames[i] = "MPNDEL_skip";
    Event.SYNC = ++i; eventNames[i] = "SYNC";
    Event.SYNC_huge_blw_range = ++i; eventNames[i] = "SYNC_huge_blw_range";
    Event.SYNC_huge_blw_in_range = ++i; eventNames[i] = "SYNC_huge_blw_in_range";
    Event.SYNC_huge_in_range = ++i; eventNames[i] = "SYNC_huge_in_range";
    Event.SYNC_huge_abv_range_and_slw_disabled = ++i; eventNames[i] = "SYNC_huge_abv_range_and_slw_disabled";
    Event.SYNC_huge_abv_range_and_slw_enabled = ++i; eventNames[i] = "SYNC_huge_abv_range_and_slw_enabled";
    Event.SYNC_blw_range = ++i; eventNames[i] = "SYNC_blw_range";
    Event.SYNC_in_range = ++i; eventNames[i] = "SYNC_in_range";
    Event.SYNC_abv_range_and_slw_disabled = ++i; eventNames[i] = "SYNC_abv_range_and_slw_disabled";
    Event.SYNC_abv_range_and_slw_enabled = ++i; eventNames[i] = "SYNC_abv_range_and_slw_enabled";
    Event.SYNC_isHuge = ++i; eventNames[i] = "SYNC_isHuge";
    Event.SYNC_NOTisHuge = ++i; eventNames[i] = "SYNC_NOTisHuge";
    Event.dataAdapterDisconnect = ++i; eventNames[i] = "dataAdapterDisconnect";
    Event.onKeepaliveTimeout = ++i; eventNames[i] = "onKeepaliveTimeout";
    Event.onStalledTimeout = ++i; eventNames[i] = "onStalledTimeout";
    Event.onReconnectTimeout_isRecoveryEnabled = ++i; eventNames[i] = "onReconnectTimeout_isRecoveryEnabled";
    Event.onReconnectTimeout_NOTisRecoveryEnabled = ++i; eventNames[i] = "onReconnectTimeout_NOTisRecoveryEnabled";
    Event.any_server_msg = ++i; eventNames[i] = "any_server_msg";
    Event.any_ctrl_req = ++i; eventNames[i] = "any_ctrl_req";
    Event.rhbIntervalChange = ++i; eventNames[i] = "rhbIntervalChange";
    Event.rhbIntervalChange_eq_0 = ++i; eventNames[i] = "rhbIntervalChange_eq_0";
    Event.rhbIntervalChange_gt_0 = ++i; eventNames[i] = "rhbIntervalChange_gt_0";
    Event.onReverseHeartbeatTimeout = ++i; eventNames[i] = "onReverseHeartbeatTimeout";
    Event.requestSlow = ++i; eventNames[i] = "requestSlow";
    Event.onOnline = ++i; eventNames[i] = "onOnline";
    Event.onOnline_hasRecoveryTimeoutElapsed = ++i; eventNames[i] = "onOnline_hasRecoveryTimeoutElapsed";
    Event.onOnline_NOThasRecoveryTimeoutElapsed = ++i; eventNames[i] = "onOnline_NOThasRecoveryTimeoutElapsed";
    Event.runtime_error = ++i; eventNames[i] = "runtime_error";
})();

var State2 = {
        Create: -1,
        Bind: -2,
        CreateTTL: -3
};

var CONERR_Code = {
        METADATA_ERROR: 1,
        SERVER_BUSY_ERROR: 2,
        SOFT_ERROR: 3,
        FATAL_ERROR: 4,
        GENERIC_METADATA_ERROR: 5
};

var log = LoggerManager.getLoggerProxy(Constants.STREAM);

function NewSessionWS(isPolling,forced,handler,handlerPhase,originalSession,skipCors,sessionRecovery,mpnManager) {
    this.oid = Utils.nextObjectId();
    this.handler = handler;
    this.mpnManager = mpnManager;
    this.state = State.Init;
    if (originalSession) {        
        // copy the parameters of the switched session before they are reset
        this.switchedSession = {
                sessionId: originalSession.sessionId,
                sessionServerAddress: originalSession.sessionServerAddress,
                serverSentBW: originalSession.serverSentBW,
                dataNotificationCount: originalSession.dataNotificationCount
        };
    }
}

NewSessionWS.Event = Event;

NewSessionWS.prototype = {
        
        dispatch: function(event, data) {
            try {
                this.event = event;
                this.eventData = data;
                
                // NB events expected in most of the states are treated apart from the rest
                if (isFinalState(this.state)) {
                    log.logWarn("oid=" + this.oid, "Ignore event", eventNames[event], "in state", stateNames[this.state]);
                }
                else if (event === Event.runtime_error) {
                    this.next(State.Disconnected);
                    this.doCloseWS();
                    this.doStopTimer();
                    this.doStopRhbTimer();
                    this.doNotifyOnServerError61();
                    this.enter_Disconnected();
                }
                else if (this.state !== State.Streaming && 
                        (event === Event.subscribe || event === Event.reconf || event == Event.unsubscribe
                                || event === Event.message || event === Event.register || event === Event.subscribeMpn
                                || event === Event.unsubscribeMpn || event === Event.unsubscribeFilterMpn
                                || event === Event.constrain || event === Event.sendLog)) {
                    // subscribe: all but Streaming
                    // reconf: all but Streaming
                    // unsubscribe: all but Streaming
                    // message: all but Streaming
                    // register: all but Streaming
                    // subscribeMpn: all but Streaming
                    // unsubscribeMpn: all but Streaming
                    // constrain: all but Streaming
                    // sendLog: all but Streaming
                    this.next(this.state);
                    this.doAddToWaitings(data);
                }
                else if (this.state !== State.Streaming && event === Event.disconnect) {
                    // disconnect: all but Streaming -> Disconnected
                    this.next(State.Disconnected);
                    this.enter_Disconnected();
                }
                else if (this.state !== State.Streaming && event === Event.dataAdapterDisconnect) {
                    // dataAdapterDisconnect: all but Streaming
                    this.next(this.state);
                    this.doIgnoreDataAdapterDisconnection();
                }
                else switch (this.state) {

                case State.Init:
                    switch (event) {
                    case Event._connect:
                        this.doInit();
                        this.doNotifyOnSessionStart();
                        this.doNotifyCONNECTING();
                        this.doChoose(function() {
                            if (this.isWsAvailable()) {
                                this.dispatch(Event.connect, data);
                            }
                            else if (this.isWsForced()) {
                                this.dispatch(Event.connect_giveup, data);
                            }
                            else {
                                this.dispatch(Event.connect_switch, data);
                            }
                        });
                        break;
                    case Event.connect:
                        // connect: Init -> Opening
                        this.next(State.Opening);
                        this.enter_Opening(data);
                        break;
                    case Event.connect_giveup:
                        // connect_giveup: Init -> Disconnected
                        this.next(State.Disconnected);
                        this.enter_Disconnected();
                        break;
                    case Event.connect_switch:
                        // connect_switch: Init -> SwitchAndCreatingHTTP
                        this.next(State.SwitchAndCreatingHTTP);
                        this.enter_SwitchAndCreatingHTTP();
                        break;
                    case Event.bind:
                        // bind: Init -> Opening
                        this.next(State.Opening);
                        this.doInitFromSwitchedSession();
                        this.doNotifyOnSessionBound();
                        this.enter_Opening(data);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;

                case State.Opening:
                    switch (event) {
                    case Event.onOpen:
                        this.doChoose(function() {
                            switch (this.state2) {
                            case State2.Create:
                                this.dispatch(Event.onOpen_Creating);
                                break;
                            case State2.Bind:
                                this.dispatch(Event.onOpen_Binding);
                                break;
                            case State2.CreateTTL:
                                this.dispatch(Event.onOpen_busy);
                                break;
                            default:
                                throw new Error('Unknown state ' + this.state2);
                            }
                        });
                        break;
                    case Event.onOpen_Creating:
                        // onOpen_Creating: Opening -> Probing
                        this.next(State.Probing);
                        this.enter_Probing_Creating();
                        break;
                    case Event.onOpen_Binding:
                        // onOpen_Binding: Opening -> Probing
                        this.next(State.Probing);
                        this.enter_Probing_Binding();
                        break;
                    case Event.onOpen_busy:
                        // onOpen_busy: Opening -> Probing
                        this.next(State.Probing);
                        this.enter_Probing_Busy();
                        break;
                    case Event.onRetryTimeout:
                        this.doChoose(function() {
                            if (this.isWsForced()) {
                                this.dispatch(Event.onRetryTimeout_isWsForced, data);
                            }
                            else {
                                this.dispatch(Event.onRetryTimeout_NOTisWsForced, data);
                            } 
                        });
                        break;
                    case Event.onRetryTimeout_NOTisWsForced:
                        // onRetryTimeout[WS not forced]: Opening -> SwitchAndCreating
                        this.next(State.SwitchAndCreating);
                        this.doSuspendWS();
                        this.enter_SwitchAndCreating("ws2.unavailable");
                        break;
                    case Event.onRetryTimeout_isWsForced:
                        // onRetryTimeout[WS forced]: Opening -> Disconnected
                        this.next(State.Disconnected);
                        this.enter_Disconnected();
                        break;
                    case Event.onWsErrorOrClose:
                        this.doChoose(function() {
                            if (this.isWsForced()) {
                                this.dispatch(Event.onWsErrorOrClose_isWsForced, data);
                            }
                            else {
                                this.dispatch(Event.onWsErrorOrClose_NOTisWsForced, data);
                            } 
                        });
                        break;
                    case Event.onWsErrorOrClose_NOTisWsForced:
                        // onWsErrorOrClose[WS not forced]: Opening -> SwitchAndCreating
                        this.next(State.SwitchAndCreating);
                        this.doSuspendWS();
                        this.enter_SwitchAndCreating("ws2.unavailable");
                        break;
                    case Event.onWsErrorOrClose_isWsForced:
                        // onWsErrorOrClose[WS forced]: Opening -> Disconnected
                        this.next(State.Disconnected);
                        this.enter_Disconnected();
                        break;
                    case Event.retry:
                        // retry: Opening
                        this.next(State.Opening);
                        this.doNotifyOnSessionRetry();
                        this.doNotifyOnSessionStart();
                        this.doNotifyCONNECTING();
                        this.enter_Opening(this.LS_cause);
                        break;
                    case Event.retry_switch:
                        // retry_switch: Opening -> SwitchAndCreating
                        this.next(State.SwitchAndCreating);
                        this.enter_SwitchAndCreating("api.switch");
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;

                case State.Probing:
                    switch (event) {
                    case Event.WSOK:
                        // WSOK: Probing -> CreatingOrBinding
                        this.next(State.CreatingOrBinding);
                        break;
                    case Event.onRetryTimeout:
                        this.doChoose(function() {                            
                            if (this.isWsForced()) {
                                this.dispatch(Event.onRetryTimeout_isWsForced);
                            }
                            else {
                                this.dispatch(Event.onRetryTimeout_NOTisWsForced);
                            }
                        });
                        break;
                    case Event.onRetryTimeout_isWsForced:
                        // onRetryTimeout[WS forced]: Probing -> Disconnected
                        this.next(State.Disconnected);
                        this.doDisableWs();
                        this.enter_Disconnected();
                        break;
                    case Event.onRetryTimeout_NOTisWsForced:
                        // onRetryTimeout[WS not forced]: Probing -> SwitchAndCreatingHTTP
                        this.next(State.SwitchAndCreatingHTTP);
                        this.doDisableWs();
                        this.enter_SwitchAndCreatingHTTP("ws2.mute");
                        break;
                    case Event.onWsErrorOrClose:
                        // onWsErrorOrClose: Probing -> Pause1
                        this.next(State.Pause1);
                        this.enter_Pause1("ws2.error");
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;

                case State.CreatingOrBinding:
                    switch (event) {
                    case Event._CONOK:
                        this.doChoose(function() {
                            if (this.isTransportWsStreaming()) {
                                if (this.isGranted_eq_0() && this.isRhbInterval_eq_0()) {
                                    this.dispatch(Event.CONOK, data);
                                }
                                else {
                                    this.dispatch(Event.CONOK_rhb, data);
                                }
                            }
                            else {
                                if (this.isGranted_eq_0() && this.isRhbInterval_eq_0()) {
                                    this.dispatch(Event.CONOK_switch, data);
                                }
                                else {
                                    this.dispatch(Event.CONOK_switch_rhb, data);
                                }
                            }
                        });
                        break;
                    case Event.CONOK:
                        // CONOK: CreatingOrBinding -> Receiving
                        this.init_Streaming(State.Receiving, State.RhbDisabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Receiving();
                        this.enter_Streaming_RhbDisabled();
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_NoDebug();
                        break;
                    case Event.CONOK_rhb:
                        // CONOK_rhb: CreatingOrBinding -> Receiving
                        this.init_Streaming(State.Receiving, State.RhbEnabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Receiving();
                        this.enter_Streaming_RhbEnabled();
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_NoDebug();
                        break;
                    case Event.CONOK_switch:
                        // CONOK_switch: CreatingOrBinding -> Switching
                        this.init_Streaming(State.Switching, State.RhbDisabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Switching();
                        this.enter_Streaming_RhbDisabled();
                        this.dispatch_RHB(Event.any_ctrl_req);
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_NoDebug();
                        break;
                    case Event.CONOK_switch_rhb:
                        // CONOK_switch_rhb: CreatingOrBinding -> Switching
                        this.init_Streaming(State.Switching, State.RhbEnabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Switching();
                        this.enter_Streaming_RhbEnabled();
                        this.dispatch_RHB(Event.any_ctrl_req);
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_NoDebug();
                        break;
                    case Event.onRetryTimeout:
                        // onRetryTimeout: CreatingOrBinding -> Opening
                        this.next(State.Opening);
                        this.doCloseWS();
                        this.doNotifyWILL_RETRY();
                        this.enter_Retrying("ws2.timeout");
                        break;
                    case Event.onWsErrorOrClose:
                        // onWsErrorOrClose: CreatingOrBinding -> Pause1
                        this.next(State.Pause1);
                        this.enter_Pause1("ws2.error");
                        break;
                    case Event.CONERR:
                        this.enter_CONERR_choose(data);
                        break;
                    case Event.CONERR_isMetadataAdapterError:
                        // CONERR[metadata error code]: CreatingOrBinding -> Pause1
                        this.enter_CONERR_isMetadataAdapterError(data);
                        break;
                    case Event.CONERR_isFatalError:
                        // CONERR[fatal error]: CreatingOrBinding -> Disconnected
                        this.enter_CONERR_isFatalError(data);
                        break;
                    case Event.CONERR_isSoftError:
                    case Event.CONERR_isGenericMetadataAdapterError:
                        // CONERR[code is 4/6/20/40/41/48]: CreatingOrBinding -> Pause1
                        this.next(State.Pause1);
                        this.enter_Pause1("ws2.conerr", data);
                        break;
                    case Event.CONERR_isServerBusyError:
                        // CONERR[code is 5 and TTL enabled]: CreatingOrBinding -> Retrying
                        this.enter_CONERR_isServerBusyError(data);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;
                    
                case State.Streaming:
                    switch (event) {
                    case Event.U:
                        // U: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnItemUpdate(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.subscribe:
                        // subscribe: Streaming
                        this.next(State.Streaming);
                        this.doSendSubscribe(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.reconf:
                        // reconf: Streaming
                        this.next(State.Streaming);
                        this.doSendReconf(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.message:
                        // message: Streaming
                        this.next(State.Streaming);
                        this.doSendMessage(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.unsubscribe:
                        // unsubscribe: Streaming
                        this.next(State.Streaming);
                        this.doSendUnsubscribe(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.register:
                        // register: Streaming
                        this.next(State.Streaming);
                        this.doSendRegister(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.subscribeMpn:
                        // subscribeMpn: Streaming
                        this.next(State.Streaming);
                        this.doSendMpnSubscribe(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.unsubscribeMpn:
                        // unsubscribeMpn: Streaming
                        this.next(State.Streaming);
                        this.doSendMpnUnsubscribe(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.unsubscribeFilterMpn:
                        // unsubscribeFilterMpn: Streaming
                        this.next(State.Streaming);
                        this.doSendMpnUnsubscribeFilter(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.REQOK:
                        // REQOK: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyREQOK(data);
                        break;
                    case Event.SUBOK:
                    case Event.SUBCMD:
                        // SUBOK, SUBCMD: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnSubscription(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.CONF:
                        // CONF: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnRealMaxFrequency(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.UNSUB:
                        // UNSUB: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doParseUNSUB(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.disconnect:
                        // disconnect: Streaming -> Disconnected
                        this.next(State.Disconnected);
                        this.exit_Streaming();
                        this.doSendDestroy("ws2.api");
                        this.enter_Disconnected();
                        break;
                    case Event.SERVNAME:
                        // SERVNAME: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doParseSERVNAME(data);
                        break;
                    case Event.CLIENTIP:
                        // CLIENTIP: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doParseCLIENTIP(data);
                        break;
                    case Event.CONS:
                        // CONS: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doParseCONS(data);
                        break;
                    case Event.ERROR:
                        // ERROR: Streaming -> Disconnected
                        this.next(State.Disconnected);
                        this.exit_Streaming();
                        this.enter_Aborting(data);
                        this.enter_Disconnected();
                        break;
                    case Event.NOOP:
                    	// NOOP: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        break;
                    case Event.PROBE:
                    	// PROBE: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnServerKeepalive();
                        break;
                    case Event.onWsErrorOrClose:
                        this.doChoose(function() {
                            if (this.isRecoveryEnabled()) {
                                this.dispatch(Event.onWsErrorOrClose_isRecoveryEnabled);
                            }
                            else {
                                this.dispatch(Event.onWsErrorOrClose_NOTisRecoveryEnabled);
                            }
                        });
                        break;
                    case Event.onWsErrorOrClose_isRecoveryEnabled:
                        // onWsErrorOrClose_isRecoveryEnabled: Streaming -> Pause_R0
                        this.next(State.Pause_R0);
                        this.exit_Streaming();
                        this.doCloseWS();
                        this.doNotifyTRYING_RECOVERY();
                        this.doRecordRecoveryTime();
                        this.enter_Pause_R0("ws2.error");
                        break;
                    case Event.onWsErrorOrClose_NOTisRecoveryEnabled:
                        // onWsErrorOrClose_NOTisRecoveryEnabled: Streaming -> Pause2
                        this.next(State.Pause2);
                        this.exit_Streaming();
                        this.doStartRetryTimerFromStreaming();
                        this.enter_Pause2("ws2.error");
                        break;
                    case Event.END:
                        this.doChoose(function() {                            
                            if (this.isFatalError_END(data)) {
                                this.dispatch(Event.END_isFatalError, data);
                            }
                            else {
                                this.dispatch(Event.END_NOTisFatalError, data);
                            }
                        });
                        break;
                    case Event.END_isFatalError:
                        // END: Streaming -> Disconnected
                        this.next(State.Disconnected);
                        this.exit_Streaming();
                        this.enter_Aborting(data);
                        this.enter_Disconnected();
                        break;
                    case Event.END_NOTisFatalError:
                        // END: Streaming -> Pause2
                        this.next(State.Pause2);
                        this.exit_Streaming();
                        this.doStartRetryTimerFromStreaming();
                        this.enter_Pause2("ws2.end", data);
                        break;
                    case Event.EOS:
                        // EOS: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnEndOfSnapshot(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.CS:
                        // CS: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnClearSnapshot(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.OV:
                        // OV: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnItemLostUpdates(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.MSGDONE:
                        // MSGDONE: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnProcessed(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.MSGFAIL:
                        this.doChoose(function() {
                            if (this.isMessageDiscarded(data)) {
                                this.dispatch(Event.MSGFAIL_isMessageDiscarded, data);
                            }
                            else if (this.isMessageDeny(data)) {
                                this.dispatch(Event.MSGFAIL_isMessageDeny, data);
                            }
                            else {
                                this.dispatch(Event.MSGFAIL_isMessageError, data);
                            }
                        });
                        break;
                    case Event.MSGFAIL_isMessageDiscarded:
                        // MSGFAIL_isMessageDiscarded: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMessageDiscarded(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.MSGFAIL_isMessageDeny:
                        // MSGFAIL_isMessageDeny: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMessageDeny(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.MSGFAIL_isMessageError:
                        // MSGFAIL_isMessageError: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMessageError_MSGFAIL(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.REQERR:
                        this.doChoose(function() {
                            if (this.isSyncError_REQERR(data)) {
                                this.dispatch(Event.REQERR_isSyncError, data);
                            }
                            else if (this.isFatalError_REQERR(data)) {
                                this.dispatch(Event.REQERR_isFatalError, data);
                            }
                            else {
                                var reqType = this.getRequestType(data);
                                switch (reqType) {
                                case CtrlRequest.SUB:
                                    this.dispatch(Event.REQERR_isSubscriptionError, data);
                                    break;
                                case CtrlRequest.MSG:
                                    this.dispatch(Event.REQERR_isMessageError, data);
                                    break;
                                case CtrlRequest.MPN_REG:
                                    this.dispatch(Event.REQERR_isRegistrationError, data);
                                    break;
                                case CtrlRequest.MPN_SUB:
                                    this.dispatch(Event.REQERR_isMpnSubscriptionError, data);
                                    break;
                                case CtrlRequest.MPN_UNSUB:
                                    this.dispatch(Event.REQERR_isMpnUnsubscriptionError, data);
                                    break;
                                default:
                                    if (reqType == CtrlRequest.UNSUB && data.causeCode == 19) {
                                        this.dispatch(Event.REQERR_isUnsubscriptionError19, data);
                                    } else {
                                        this.dispatch(Event.REQERR_isOtherError, data);
                                    }
                                }
                            }
                        });
                        break;
                    case Event.REQERR_isSyncError:
                        // REQERR_isSyncError: Pause2
                        this.next(State.Pause2);
                        this.exit_Streaming();
                        this.doStartRetryTimerFromStreaming();
                        this.enter_Pause2("ws2.reqerr", data);
                        break;
                    case Event.REQERR_isFatalError:
                        // REQERR_isFatalError: Disconnected
                        this.next(State.Disconnected);
                        this.exit_Streaming();
                        this.enter_Aborting(data);
                        this.enter_Disconnected();
                        break;
                    case Event.REQERR_isMessageError:
                        // REQERR_isMessageError: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMessageError_REQERR(data);
                        break;
                    case Event.REQERR_isSubscriptionError:
                        // REQERR_isSubscriptionError: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnSubscriptionError_REQERR(data);
                        break;
                    case Event.REQERR_isUnsubscriptionError19:
                        // REQERR_isUnsubscriptionError19: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doResendUnsubscriptionAfterREQERR19(data);
                        break;
                    case Event.REQERR_isRegistrationError:
                        // REQERR_isRegistrationError: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnRegistrationFailed_REQERR(data);
                        break;
                    case Event.REQERR_isMpnSubscriptionError:
                        // REQERR_isMpnSubscriptionError: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMpnSubscriptionError_REQERR(data);
                        break;
                    case Event.REQERR_isMpnUnsubscriptionError:
                        // REQERR_isMpnUnsubscriptionError: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMpnUnsubscriptionError_REQERR(data);
                        break;
                    case Event.REQERR_isOtherError:
                        // REQERR_isOtherError: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doIgnoreError_REQERR(data);
                        break;
                    case Event.MPNREG:
                        // MPNREG: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMPNREG(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.MPNOK:
                        // MPNOK: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMPNOK(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.MPNDEL:
                        // MPNDEL: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doNotifyOnMPNDEL(data);
                        this.doIncProgAndCount();
                        break;
                    case Event.requestSwitch:
                        this.doChoose(function() {
                            if (! this.isTransportWsStreaming()) {
                                this.dispatch(Event.requestSwitch_NOTisWsStreaming, this.policyBean.forcedTransport);
                            }
                        });
                        break;
                    case Event.requestSwitch_NOTisWsStreaming:
                        // requestSwitch_NOTisWsStreaming: Streaming
                        this.dispatch_StreamingMain(Event.requestSwitch_NOTisWsStreaming, data);
                        break;
                    case Event._LOOP:
                        this.doChoose(function() {
                            if (this.state_SM === State.Slowing) {
                                this.dispatch(Event.LOOP_slow);
                            }
                            else {                                
                                this.dispatch(Event.LOOP);
                            }
                        });
                        break;
                    case Event.LOOP:
                        // LOOP: Streaming -> SwitchAndRebinding
                        this.next(State.SwitchAndRebinding);
                        this.exit_Streaming();
                        this.enter_SwitchAndRebinding();
                        break;
                    case Event.LOOP_slow:
                        this.dispatch_StreamingMain(Event.LOOP_slow, data);
                        break;
                    case Event.onLoopTimeout:
                        this.dispatch_StreamingMain(Event.onLoopTimeout, data);
                        break;
                    case Event.constrain:
                        this.doChoose(function() {
                            if (this.serverSentBW !== "unmanaged") {
                                this.dispatch(Event.constrain_NOTunmanaged, data);
                            }
                        });
                        break;
                    case Event.constrain_NOTunmanaged:
                        // constrain: Streaming
                        this.next(State.Streaming);
                        this.doSendConstrain(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.sendLog:
                        // sendLog: Streaming
                        this.next(State.Streaming);
                        this.doSendLog(data);
                        this.dispatch_RHB(Event.any_ctrl_req);
                        break;
                    case Event.PROG:
                        // PROG: Streaming
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.PROG, data);
                        this.doSetProg(data);
                        break;
                    case Event._U:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.U, data);
                            }
                            else {
                                this.dispatch(Event.U_skip, data);
                            }
                        });
                        break;
                    case Event._SUBOK:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.SUBOK, data);
                            }
                            else {
                                this.dispatch(Event.SUBOK_skip, data);
                            }
                        });
                        break;
                    case Event._SUBCMD:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.SUBCMD, data);
                            }
                            else {
                                this.dispatch(Event.SUBCMD_skip, data);
                            }
                        });
                        break;
                    case Event._UNSUB:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.UNSUB, data);
                            }
                            else {
                                this.dispatch(Event.UNSUB_skip, data);
                            }
                        });
                        break;
                    case Event._EOS:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.EOS, data);
                            }
                            else {
                                this.dispatch(Event.EOS_skip, data);
                            }
                        });
                        break;
                    case Event._CS:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.CS, data);
                            }
                            else {
                                this.dispatch(Event.CS_skip, data);
                            }
                        });
                        break;
                    case Event._OV:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.OV, data);
                            }
                            else {
                                this.dispatch(Event.OV_skip, data);
                            }
                        });
                        break;
                    case Event._CONF:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.CONF, data);
                            }
                            else {
                                this.dispatch(Event.CONF_skip, data);
                            }
                        });
                        break;
                    case Event._MSGDONE:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.MSGDONE, data);
                            }
                            else {
                                this.dispatch(Event.MSGDONE_skip, data);
                            }
                        });
                        break;
                    case Event._MSGFAIL:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.MSGFAIL, data);
                            }
                            else {
                                this.dispatch(Event.MSGFAIL_skip, data);
                            }
                        });
                        break;
                    case Event._MPNREG:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.MPNREG, data);
                            }
                            else {
                                this.dispatch(Event.MPNREG_skip, data);
                            }
                        });
                        break;
                    case Event._MPNOK:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.MPNOK, data);
                            }
                            else {
                                this.dispatch(Event.MPNOK_skip, data);
                            }
                        });
                        break;
                    case Event._MPNDEL:
                        this.doChoose(function() {
                            if (! this.hasToBeSkipped()) {
                                this.dispatch(Event.MPNDEL, data);
                            }
                            else {
                                this.dispatch(Event.MPNDEL_skip, data);
                            }
                        });
                        break;
                    case Event.dataAdapterDisconnect:
                        // dataAdapterDisconnect: Streaming -> Pause2
                        this.next(State.Pause2);
                        this.exit_Streaming();
                        this.doStartDataAdapterTimer();
                        this.enter_Pause2("ws2.data.adapter.disconnect");
                        break;
                    case Event.U_skip:
                    case Event.SUBOK_skip:
                    case Event.SUBCMD_skip:
                    case Event.UNSUB_skip:
                    case Event.EOS_skip:
                    case Event.CS_skip:
                    case Event.OV_skip:
                    case Event.CONF_skip:
                    case Event.MSGDONE_skip:
                    case Event.MSGFAIL_skip:
                    case Event.MPNREG_skip:
                    case Event.MPNOK_skip:
                    case Event.MPNDEL_skip:
                        this.dispatch_StreamingMain(Event.any_server_msg, data);
                        this.dispatch_Prog(Event.any_server_msg, data);
                        this.doIncProg();
                        break;
                    case Event.onKeepaliveTimeout:
                        // onKeepaliveTimeout: Receiving -> Stalling
                        this.dispatch_StreamingMain(Event.onKeepaliveTimeout, data);
                        break;
                    case Event.onStalledTimeout:
                        // onStalledTimeout: Stalling -> Stalled
                        this.dispatch_StreamingMain(Event.onStalledTimeout, data);
                        break;
                    case Event.onReconnectTimeout:
                        this.doChoose(function() {
                            if (this.isRecoveryEnabled()) {
                                this.dispatch(Event.onReconnectTimeout_isRecoveryEnabled);
                            }
                            else {
                                this.dispatch(Event.onReconnectTimeout_NOTisRecoveryEnabled);
                            }
                        });
                        break;
                    case Event.onReconnectTimeout_isRecoveryEnabled:
                        // onStalledTimeout: Stalled -> Recovering
                        this.dispatch_StreamingMain(Event.onReconnectTimeout_isRecoveryEnabled, data);
                        break;
                    case Event.onReconnectTimeout_NOTisRecoveryEnabled:
                        // onStalledTimeout: Stalled -> Pause2
                        this.dispatch_StreamingMain(Event.onReconnectTimeout_NOTisRecoveryEnabled, data);
                        break;
                    case Event.onReverseHeartbeatTimeout:
                        this.dispatch_RHB(Event.onReverseHeartbeatTimeout);
                        break;
                    case Event.rhbIntervalChange:
                        this.dispatch_RHB(Event.rhbIntervalChange);
                        break;
                    case Event.rhbIntervalChange_eq_0:
                        this.dispatch_RHB(Event.rhbIntervalChange_eq_0);
                        break;
                    case Event.rhbIntervalChange_gt_0:
                        this.dispatch_RHB(Event.rhbIntervalChange_gt_0);
                        break;
                    case Event.SYNC:
                    case Event.SYNC_NOTisHuge:
                    case Event.SYNC_blw_range:
                    case Event.SYNC_in_range:
                    case Event.SYNC_abv_range_and_slw_disabled:
                    case Event.SYNC_isHuge:
                    case Event.SYNC_huge_blw_range:
                    case Event.SYNC_huge_blw_in_range:
                    case Event.SYNC_huge_in_range:
                    case Event.SYNC_huge_abv_range_and_slw_disabled:
                        this.dispatch_Slw(event, data);
                        break;
                    case Event.SYNC_abv_range_and_slw_enabled:
                    case Event.SYNC_huge_abv_range_and_slw_enabled:
                        this.dispatch_Slw(event, data);
                        this.doSignalRequestSlow();
                        break;
                    case Event.requestSlow:
                        this.dispatch_StreamingMain(Event.requestSlow, data);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;

                case State.Pause1:
                    switch (event) {
                    case Event.onRetryTimeout:
                        // onRetryTimeout: Pause1 -> Opening
                        this.next(State.Opening);
                        this.enter_Retrying(this.LS_cause);
                        break;
                    case Event.onOnline:
                        // onOnline: Pause1 -> Opening
                        this.next(State.Opening);
                        this.doStopTimer();
                        this.enter_Retrying(this.LS_cause);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;
                    
                case State.Pause2:
                    switch (event) {
                    case Event.onRetryTimeout:
                        // onRetryTimeout: Pause2 -> Opening
                        this.next(State.Opening);
                        this.enter_Retrying(this.LS_cause);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;
                    
                case State.Pause_R0:
                    switch (event) {
                    case Event.onRetryTimeout:
                        // onRetryTimeout: Pauser_R0 -> Recovering
                        this.next(State.Recovering);
                        this.enter_Recovering(this.LS_cause);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;
                    
                case State.Recovering:
                    switch (event) {
                    case Event.onWsErrorOrClose:
                        // onWsErrorOrClose: Recovering -> Pause_R
                        this.next(State.Pause_R);
                        this.doCloseWS();
                        this.enter_Pause_R("ws2.error");
                        break;
                    case Event.onOpen:
                        // onOpen: Recovering -> Recovering
                        this.next(State.Recovering);
                        this.doSendWsok();
                        this.doSendRecovery();
                        break;
                    case Event.WSOK:
                        // WSOK: Recovering -> Recovering
                        this.next(State.Recovering);
                        break;
                    case Event._CONOK:
                        this.doChoose(function() {
                            if (this.isTransportWsStreaming()) {
                                if (this.isGranted_eq_0() && this.isRhbInterval_eq_0()) {
                                    this.dispatch(Event.CONOK, data);
                                }
                                else {
                                    this.dispatch(Event.CONOK_rhb, data);
                                }
                            }
                            else {
                                if (this.isGranted_eq_0() && this.isRhbInterval_eq_0()) {
                                    this.dispatch(Event.CONOK_switch, data);
                                }
                                else {
                                    this.dispatch(Event.CONOK_switch_rhb, data);
                                }
                            }
                        });
                        break;
                    case Event.CONOK:
                        // CONOK: Recovering -> Receiving
                        this.init_Streaming(State.Receiving, State.RhbDisabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Receiving();
                        this.enter_Streaming_RhbDisabled();
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_FromRecovery();
                        break;
                    case Event.CONOK_rhb:
                        // CONOK_rhb: Recovering -> Receiving
                        this.init_Streaming(State.Receiving, State.RhbEnabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Receiving();
                        this.enter_Streaming_RhbEnabled();
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_FromRecovery();
                        break;
                    case Event.CONOK_switch:
                        // CONOK_switch: Recovering -> Switching
                        this.init_Streaming(State.Switching, State.RhbDisabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Switching();
                        this.enter_Streaming_RhbDisabled();
                        this.dispatch_RHB(Event.any_ctrl_req);
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_FromRecovery();
                        break;
                    case Event.CONOK_switch_rhb:
                        // CONOK_switch_rhb: Recovering -> Switching
                        this.init_Streaming(State.Switching, State.RhbEnabled);
                        this.enter_Streaming(data);
                        this.enter_Streaming_Switching();
                        this.enter_Streaming_RhbEnabled();
                        this.dispatch_RHB(Event.any_ctrl_req);
                        this.enter_Streaming_SlwRunning0();
                        this.enter_Streaming_FromRecovery();
                        break;
                    case Event.onRetryTimeout:
                        this.doChoose(function() {
                            if (this.hasRecoveryTimeoutElapsed()) {
                                this.dispatch(Event.onRetryTimeout_hasRecoveryTimeoutElapsed);
                            }
                            else {                                
                                this.dispatch(Event.onRetryTimeout_NOThasRecoveryTimeoutElapsed);
                            }
                        });
                        break;
                    case Event.onRetryTimeout_hasRecoveryTimeoutElapsed:
                        // onRetryTimeout_hasRecoveryTimeoutElapsed: Recovering -> Opening
                        this.next(State.Opening);
                        this.doCloseWS();
                        this.doNotifyWILL_RETRY();
                        this.enter_Retrying("ws2.recovery.timeout");
                        break;
                    case Event.onRetryTimeout_NOThasRecoveryTimeoutElapsed:
                        // onRetryTimeout_NOThasRecoveryTimeoutElapsed: Recovering -> Recovering
                        this.next(State.Recovering);
                        this.doCloseWS();
                        this.enter_Recovering("ws2.timeout");
                        break;
                    case Event.CONERR:
                        this.enter_CONERR_choose(data);
                        break;
                    case Event.CONERR_isMetadataAdapterError:
                        // CONERR[metadata error code]: Recovering -> Pause1
                        this.enter_CONERR_isMetadataAdapterError(data);
                        break;
                    case Event.CONERR_isGenericMetadataAdapterError:
                        // CONERR[code is 6]: Recovering -> Pause1
                        this.next(State.Pause1);
                        this.enter_Pause1("ws2.conerr", data);
                        break;
                    case Event.CONERR_isFatalError:
                        // CONERR[fatal error]: Recovering -> Disconnected
                        this.enter_CONERR_isFatalError(data);
                        break;
                    case Event.CONERR_isSoftError:
                        // CONERR[code is 4/20/40/41/48]: Recovering -> Retrying
                        this.next(State.Opening);
                        this.doCloseWS();
                        this.doStopTimer();
                        this.doNotifyWILL_RETRY();
                        this.enter_Retrying("ws2.conerr", data);
                        break;
                    case Event.CONERR_isServerBusyError:
                        // CONERR[code is 5 and TTL enabled]: Recovering -> Retrying
                        this.enter_CONERR_isServerBusyError(data);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;
                    
                case State.Pause_R:
                    switch (event) {
                    case Event.onRetryTimeout:
                        this.doChoose(function() {
                            if (this.hasRecoveryTimeoutElapsed()) {
                                this.dispatch(Event.onRetryTimeout_hasRecoveryTimeoutElapsed);
                            }
                            else {                                
                                this.dispatch(Event.onRetryTimeout_NOThasRecoveryTimeoutElapsed);
                            }
                        });
                        break;
                    case Event.onRetryTimeout_hasRecoveryTimeoutElapsed:
                        // onRetryTimeout_hasRecoveryTimeoutElapsed: Pause_R -> Opening
                        this.next(State.Opening);
                        this.doNotifyWILL_RETRY();
                        this.enter_Retrying("ws2.recovery.timeout");
                        break;
                    case Event.onRetryTimeout_NOThasRecoveryTimeoutElapsed:
                        // onRetryTimeout_NOThasRecoveryTimeoutElapsed: Pause_R -> Recovering
                        this.next(State.Recovering);
                        this.enter_Recovering(this.LS_cause);
                        break;
                    case Event.onOnline:
                        this.doChoose(function() {
                            if (this.hasRecoveryTimeoutElapsed()) {
                                this.dispatch(Event.onOnline_hasRecoveryTimeoutElapsed);
                            }
                            else {                                
                                this.dispatch(Event.onOnline_NOThasRecoveryTimeoutElapsed);
                            }
                        });
                        break;
                    case Event.onOnline_hasRecoveryTimeoutElapsed:
                        // onOnline_hasRecoveryTimeoutElapsed: Pause_R -> Opening
                        this.next(State.Opening);
                        this.doStopTimer();
                        this.doNotifyWILL_RETRY();
                        this.enter_Retrying("ws2.recovery.timeout");
                        break;
                    case Event.onOnline_NOThasRecoveryTimeoutElapsed:
                        // onOnline_NOThasRecoveryTimeoutElapsed: Pause_R -> Recovering
                        this.next(State.Recovering);
                        this.doStopTimer();
                        this.enter_Recovering(this.LS_cause);
                        break;
                    default:
                        this.handleWrongState();
                    }
                    break;
                    
                default:
                    this.handleWrongState();
                }
            } 
            catch (e) {
                this.handleWildException(e);
            }
        },
        
        next: function(newState) {
            if (log.isDebugLogEnabled()) {
                if (this.state === State.Streaming) {
                    this.logEvent(this.state, newState, this.state_SM, this.state_SM, newState);
                }
                else {
                    this.logEvent(this.state, newState, this.state, this.state, newState);
                }
            }
            this.state = newState;
            if (newState !== State.Streaming) {                
                this.state_SM = null;
            }
        },
        
        logEvent: function(source, target, selfAlias, sourceAlias, targetAlias, extraData) {
            extraData = extraData || '';
            log.logDebug("oid=" + this.oid, "Event", 
                    eventNames[this.event] + (this.eventData != null ? " {" + this.eventData + "}" : ""), ":",
                    (source === target ? stateNames[selfAlias] : stateNames[sourceAlias] + ' -> ' + stateNames[targetAlias]),
                    extraData);
        },
        
        doChoose: function(func) {
            func.apply(this);
        },
        
        init: function() {
            this.policyBean = this.handler.getPolicyBean();
            this.connectionBean = this.handler.getConnectionBean();
            
            this.serverAddressCache = this.connectionBean.serverAddress; // kept for compatibility with Session
            this.sessionServerAddress = this.serverAddressCache; // kept for compatibility with Session
            this.ignoreServerAddressCache = this.policyBean.serverInstanceAddressIgnored; // kept for compatibility with Session
            this.dataNotificationCount = 0; // kept for compatibility with Session
            this.progCount = this.dataNotificationCount;
            
            this.slwHugeDelay = 20000;
            this.slwMaxAvgDelay = 7000;
            
            this.bindCount = 0; // not used: kept only for compatibility with Session
            this.push_phase = 0; // not used: kept only for compatibility with Session
            this.recoveryBean = new RecoveryBean(); // not used: kept only for compatibility with Session
            
            this.retryDelayCounter = new RetryDelayCounter(this.policyBean.retryDelay);
            this.pendingReqs = {};
            this.waitingReqs = {};
            this.waitingReqs[CtrlRequest.SUB] = [];
            this.waitingReqs[CtrlRequest.RECONF] = [];
            this.waitingReqs[CtrlRequest.UNSUB] = [];
            this.waitingReqs[CtrlRequest.MSG] = [];
            this.waitingReqs[CtrlRequest.MPN_REG] = [];
            this.waitingReqs[CtrlRequest.MPN_SUB] = [];
            this.waitingReqs[CtrlRequest.MPN_UNSUB] = [];
            this.waitingReqs[CtrlRequest.MPN_UNSUB_FILTER] = [];
            this.waitingReqs[CtrlRequest.CONS] = [];
            this.waitingReqs[CtrlRequest.LOG] = [];
            
            var that = this;
            this.onlineHandler = function(e) {
                if (that.state === State.Pause1 || that.state === State.Pause_R) {                        
                    that.dispatch(Event.onOnline);
                } // else ignore event
            };
            addGlobalEventListener('online', this.onlineHandler);
            
            this.countables = [];
        },
        
        doInit: function() {
            this.init();
            this.state2 = State2.Create;
        },
        
        doInitFromSwitchedSession: function() {          
            this.init();
            this.state2 = State2.Bind;
            
            assert(this.switchedSession);
            
            this.sessionId = this.switchedSession.sessionId;
            if (this.switchedSession.sessionServerAddress) {                
                this.sessionServerAddress = this.switchedSession.sessionServerAddress;
            }
            this.serverSentBW = this.switchedSession.serverSentBW;
            this.dataNotificationCount = this.switchedSession.dataNotificationCount;
            this.progCount = this.dataNotificationCount;
        },
        
        doCleanUp: function() {
            removeGlobalEventListener('online', this.onlineHandler);
        },
        
        doResetVars: function() {
            //this.sessionId = null; don't reset sessionId since it is used by LS_old_session
            this.serverAddressCache = this.connectionBean.serverAddress;
            this.sessionServerAddress = this.serverAddressCache;
            this.ignoreServerAddressCache = this.policyBean.serverInstanceAddressIgnored;
            this.serverSentBW = null;
            this.grantedReverseHeartbeatInterval = null;
            this.dataNotificationCount = 0;
            this.progCount = 0;
            this.slwAvgDelay = null;
            this.openTs = null;
            this.recoveryTs = null;
            
            this.pendingReqs = {};
            this.doClearWaitings();
            
            this.countables = [];
        },
        
        enter_Retrying: function(cause, data) {
            this.doSetCause(cause, data);
            this.doSignalRetry();
            this.doResetVars();
            this.doChoose(function() {
                if (this.isTransportWsStreaming()) {
                    this.dispatch(Event.retry, this.policyBean.forcedTransport);
                }
                else {                    
                    this.dispatch(Event.retry_switch, this.policyBean.forcedTransport);
                }
            });
        },
        
        doSignalRetry: function() {
            // Bind -> Create : retry
            if (this.state2 === State2.Bind) {                
                this.state2 = State2.Create;
            }
        },
        
        doSignalServerBusy: function() {
            // Create -> CreateTTL : server_busy
            // Bind -> CreateTTL : server_busy
            this.state2 = State2.CreateTTL;
        },
        
        doSignalStreamOk: function() {
            // Bind -> Create : stream_ok
            // CreateTTL -> Create : stream_ok
            this.state2 = State2.Create;
        },
        
        enter_Opening: function(cause, data) {
            this.doSetCause(cause, data)
            this.doOpenWS();
            this.doStartRetryTimer();
            this.doIncreaseRetryDelay();
            this.doRecordOpenTime();
        },
        
        doRecordOpenTime: function() {
            this.openTs = this.now();
        },
        
        doOpenWS: function() {
            var that = this;
            var version =  Constants.TLCP_VERSION + ".lightstreamer.com";
            var url = this.sessionServerAddress + Constants.LIGHTSTREAMER_PATH;
            if (url.indexOf("http://") === 0) {
                url = url.replace("http://", "ws://");
            } 
            else {
                url = url.replace("https://", "wss://");
            }                
            log.logDebug("oid=" + this.oid, "WebSocket opening", url, version);
            this.ws = new WS(url, version, function() {
                that.dispatch(Event.onOpen);
            }, function (event) {
                that.parseData(event.data);
            }, function(event) {
                that.dispatch(Event.onWsErrorOrClose);
            }, function(event) {
                that.dispatch(Event.onWsErrorOrClose);
            });
        },
        
        doStartRetryTimer: function() {
            this.startTimer(this.retryDelayCounter.currentRetryDelay, Event.onRetryTimeout);
        },
        
        doStartMetadataAdapterTimer: function() {
            this.stopTimer();
            var delay = Math.ceil(Math.random() * this.policyBean.remoteAdapterStatusObserver.reconnectMaxDelay);
            this.startTimer(delay, Event.onRetryTimeout);
        },
        
        doStartDataAdapterTimer: function() {
            var delay = Math.ceil(Math.random() * this.policyBean.remoteAdapterStatusObserver.reconnectMaxDelay);
            this.startTimer(delay, Event.onRetryTimeout);
        },
        
        doIgnoreDataAdapterDisconnection: function() {
            // do nothing
        },
        
        doStartLoopTimer: function() {
            this.startTimer(this.policyBean.retryDelay, Event.onLoopTimeout);
        },
        
        doStopTimer: function() {
            this.stopTimer();
        },
        
        doIncreaseRetryDelay: function() {
            this.retryDelayCounter.increaseRetryDelay();
        },
        
        doIncreaseRetryDelayToMax: function() {
            this.retryDelayCounter.increaseRetryDelayToMax();
        },
        
        doCloseWS: function() {
            if (this.ws) {
                log.logDebug("oid=" + this.oid, "WebSocket transport closing");
                this.ws.close();
                this.ws = null;
            }
        },
        
        enter_SwitchAndCreatingHTTP: function(LS_cause) {
            this.doNotifyOnSessionRetry();
            this.doCloseWS();
            this.doStopTimer();
            this.doCleanUp();
            this.doInvokeCreateHTTP(LS_cause);
        },
        
        doInvokeCreateHTTP: function(LS_cause) {
            var isHTTP = true;
            var isPolling = this.policyBean.forcedTransport === Constants.HTTP_POLLING;
            this.handler.createSession(false, false, false, isPolling, isHTTP, LS_cause);
        },
        
        isTransportWsStreaming: function() {
            var ft = this.policyBean.forcedTransport;
            return ft === Constants.WS_STREAMING || ft === Constants.WS_ALL || ft === null;
        },
        
        doSuspendWS: function() {
            this.handler.suspendWS();
        },
        
        enter_SwitchAndCreating: function(LS_cause) {
            this.doNotifyOnSessionRetry();
            this.doCloseWS();
            this.doStopTimer();
            this.doCleanUp();
            this.doInvokeCreate(LS_cause);
        },
        
        doInvokeCreate: function(LS_cause) {
            var ft = this.policyBean.forcedTransport;
            var isHTTP = ft === Constants.HTTP_STREAMING || ft === Constants.HTTP_POLLING || ft === Constants.HTTP_ALL;
            var isPolling = ft === Constants.HTTP_POLLING || ft === Constants.WS_POLLING;
            this.handler.createSession(false, false, false, isPolling, isHTTP, LS_cause);
        },
        
        doSendForceRebind: function(cause) {
            var reqId = Utils.nextRequestId();
            var data = "control\r\n";
            data += "LS_op=force_rebind";
            data += "&LS_cause=" + cause;
            data += "&LS_reqId=" + reqId;
            data += "&LS_close_socket=true";
            this.sendData(data);
            
            this.addToPendings({type: CtrlRequest.FORCE}, reqId);
        },
        
        enter_SwitchAndRebinding: function() {
            this.doCloseWS();
            this.doStopTimer();
            this.doCleanUp();
            this.doInvokeBind();
        },
        
        doInvokeBind: function() {
            var ft = this.policyBean.forcedTransport;
            var isHTTP = ft === Constants.HTTP_STREAMING || ft === Constants.HTTP_POLLING || ft === Constants.HTTP_ALL;
            var isPolling = ft === Constants.HTTP_POLLING || ft === Constants.WS_POLLING;
            this.handler.bindSession(false, isPolling, isHTTP, "api.switch");
        },
        
        enter_Probing_Creating: function() {
            this.doSendWsok();
            this.doSendCreate();
            this.doSendWaitingRequests();
        },
        
        enter_Probing_Binding: function() {
            this.doSendWsok();
            this.doSendBind();
            this.doSendWaitingRequests();
        },
        
        enter_Probing_Busy: function() {
            this.doSendWsok();
            this.doSendCreateTTL();
            this.doSendWaitingRequests();
        },
        
        doSendWsok: function() {
            this.sendData("wsok");
        },
        
        sendCreate: function(ttl) {
            var data = "create_session\r\n";
            data += "LS_cause=" + this.getCause();
            if (this.sessionId != null) {
                data += "&LS_old_session=" + this.sessionId;
            }
            if (ttl) {
                data += "&LS_ttl_millis=unlimited";
            }
            if (this.policyBean.keepaliveInterval > 0) {
                data += "&LS_keepalive_millis=" + this.policyBean.keepaliveInterval;
            }
            if (!this.policyBean.slowingEnabled) {
                data += "&LS_send_sync=false";
            }
            this.grantedReverseHeartbeatInterval = this.policyBean.reverseHeartbeatInterval;
            if (this.policyBean.reverseHeartbeatInterval > 0) {
                data += "&LS_inactivity_millis=" + this.policyBean.reverseHeartbeatInterval;
            }
            if (this.policyBean.requestedMaxBandwidth > 0) { // <=0 means unlimited
                data += "&LS_requested_max_bandwidth=" + this.policyBean.requestedMaxBandwidth;
            } 
            this.waitingReqs[CtrlRequest.CONS] = []; // delete waiting bandwidth request
            if (this.connectionBean.adapterSet !== null) {
                data += "&LS_adapter_set=" + encodeURIComponent(this.connectionBean.adapterSet);
            }
            if (this.connectionBean.user !== null) {
                data += "&LS_user=" + encodeURIComponent(this.connectionBean.user);
            }
            data += "&LS_cid=" + Constants.LS_CID;
            
            log.logDebug("oid=" + this.oid, "WebSocket transport sending", data);
            
            if (this.connectionBean.password !== null) {
                data += "&LS_password=" + encodeURIComponent(this.connectionBean.password);
            }
            this.ws.send(data);
        },
        
        doSendCreate: function() {
           this.sendCreate();
        },
        
        doSendCreateTTL: function() {
            this.sendCreate(true);
        },
        
        doSendBind: function() {
            var data = "bind_session\r\n";
            data += "LS_session=" + this.sessionId;
            data += "&LS_cause=" + this.getCause();
            if (this.policyBean.keepaliveInterval > 0) {
                data += "&LS_keepalive_millis=" + this.policyBean.keepaliveInterval;
            }
            if (!this.policyBean.slowingEnabled) {
                data += "&LS_send_sync=false";
            }
            this.grantedReverseHeartbeatInterval = this.policyBean.reverseHeartbeatInterval;
            if (this.policyBean.reverseHeartbeatInterval > 0) {
                data += "&LS_inactivity_millis=" + this.policyBean.reverseHeartbeatInterval;
            }
            this.sendData(data);
        },
        
        enter_Streaming: function(msg) {
            this.doSignalStreamOk();
            this.doParseCONOK(msg);
            this.doNotifySTREAMING();
            this.doStopTimer();
            this.doResetCurrentRetryDelay();
            this.doSendWaitingRequests();
        },
        
        exit_Streaming: function() {
            this.doStopTimer();
            this.doStopRhbTimer();
        },
        
        init_Streaming: function(initMain, initRhb) {
            assert(this.state !== State.Streaming);
            
            if (log.isDebugLogEnabled()) {
                this.logEvent(this.state, initMain, this.state, this.state, initMain, (initRhb === State.RhbEnabled ? '(rhb)' : ''));
            }
            this.state = State.Streaming;
            this.state_SM = initMain;
            this.state_RHB = initRhb;
            this.state_Slw = State.SlwRunning0;
        },
        
        next_StreamingMain: function(newState) {
            assert(this.state === State.Streaming);
            
            if (log.isDebugLogEnabled()) {
                this.logEvent(this.state_SM, newState, this.state_SM, this.state_SM, newState, (this.state_RHB === State.RhbEnabled ? '(rhb)' : ''));
            }
            this.state_SM = newState;
        },
        
        dispatch_StreamingMain: function(event, data) {
            switch (this.state_SM) {
            
            case State.Receiving:
                switch (event) {
                case Event.any_server_msg:
                    // any_server_msg: Receiving -> Receiving
                    this.next_StreamingMain(State.Receiving);
                    this.enter_Streaming_Receiving();
                    break;
                case Event.onKeepaliveTimeout:
                    // onKeepaliveTimeout: Receiving -> Stalling
                    this.next_StreamingMain(State.Stalling);
                    this.enter_Streaming_Stalling();
                    break;
                case Event.requestSwitch_NOTisWsStreaming:
                    // requestSwitch_NOTisWsStreaming: Receiving -> Switching
                    this.next_StreamingMain(State.Switching);
                    this.enter_Streaming_Switching();
                    this.dispatch_RHB(Event.any_ctrl_req);
                    break;
                case Event.requestSlow:
                    // requestSlow: Receiving -> Slowing
                    this.next_StreamingMain(State.Slowing);
                    this.enter_Streaming_Slowing();
                    break;
                default:
                    this.handleWrongState();
                }
                break;

            case State.Stalling:
                switch (event) {
                case Event.any_server_msg:
                    // any_server_msg: Stalling -> Receiving
                    this.next_StreamingMain(State.Receiving);
                    this.enter_Streaming_Receiving();
                    break;
                case Event.onStalledTimeout:
                    // onStalledTimeout: Stalling -> Stalled
                    this.next_StreamingMain(State.Stalled);
                    this.enter_Streaming_Stalled();
                    break;
                case Event.requestSwitch_NOTisWsStreaming:
                    // requestSwitch_NOTisWsStreaming: Stalling -> Switching
                    this.next_StreamingMain(State.Switching);
                    this.enter_Streaming_Switching();
                    this.dispatch_RHB(Event.any_ctrl_req);
                    break;
                case Event.requestSlow:
                    // requestSlow: Stalling -> Slowing
                    this.next_StreamingMain(State.Slowing);
                    this.enter_Streaming_Slowing();
                    break;
                default:
                    this.handleWrongState();
                }
                break;

            case State.Stalled:
                switch (event) {
                case Event.any_server_msg:
                    // any_server_msg: Stalled -> Receiving
                    this.next_StreamingMain(State.Receiving);
                    this.doNotifySTREAMING();
                    this.enter_Streaming_Receiving();
                    break;
                case Event.onReconnectTimeout_isRecoveryEnabled:
                    // onReconnectTimeout_isRecoveryEnabled: Stalled -> Pause_R0
                    this.next(State.Pause_R0);
                    this.exit_Streaming();
                    this.doCloseWS();
                    this.doNotifyTRYING_RECOVERY();
                    this.doRecordRecoveryTime();
                    this.enter_Pause_R0("ws2.reconnect.timeout");
                    break;
                case Event.onReconnectTimeout_NOTisRecoveryEnabled:
                    // onReconnectTimeout_NOTisRecoveryEnabled: Stalled -> Pause2
                    this.next(State.Pause2);
                    this.exit_Streaming();
                    this.doStartRetryTimerFromStreaming();
                    this.enter_Pause2("ws2.reconnect.timeout");
                    break;
                case Event.requestSwitch_NOTisWsStreaming:
                    // requestSwitch_NOTisWsStreaming: Stalled -> Switching
                    this.next_StreamingMain(State.Switching);
                    this.enter_Streaming_Switching();
                    this.dispatch_RHB(Event.any_ctrl_req);
                    break;
                case Event.requestSlow:
                    // requestSlow: Stalled -> Slowing
                    this.next_StreamingMain(State.Slowing);
                    this.enter_Streaming_Slowing();
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                
            case State.Switching:
                switch (event) {
                case Event.any_server_msg:
                    // any_server_msg: Switching
                    this.next_StreamingMain(State.Switching);
                    break;
                case Event.requestSwitch_NOTisWsStreaming:
                    // ignore: already switching
                    break;
                case Event.onLoopTimeout:
                    // onLoopTimeout: Switching -> SwitchAndCreating
                    this.next(State.SwitchAndCreating);
                    this.exit_Streaming();
                    this.doSendDestroy("ws2.loop.timeout");
                    this.doCloseWS();
                    this.doNotifyWILL_RETRY();
                    this.enter_SwitchAndCreating("api.switch");
                    break;
                case Event.requestSlow:
                    // ignore
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                
            case State.Slowing:
                switch (event) {
                case Event.any_server_msg:
                    // any_server_msg: Slowing
                    this.next_StreamingMain(State.Slowing);
                    break;
                case Event.LOOP_slow:
                    // LOOP: Slowing -> SwitchAndRebindingPOLLING
                    this.next(State.SwitchAndRebindingPOLLING);
                    this.exit_Streaming();
                    this.enter_SwitchAndRebindingPOLLING();
                    break;
                case Event.onLoopTimeout:
                    // onLoopTimeout: Slowing -> SwitchAndCreatingPOLLING
                    this.next(State.SwitchAndCreatingPOLLING);
                    this.exit_Streaming();
                    this.doSendDestroy("ws2.loop.timeout");
                    this.doCloseWS();
                    this.doNotifyWILL_RETRY();
                    this.enter_SwitchAndCreatingPOLLING();
                    break;
                case Event.requestSwitch_NOTisWsStreaming:
                    // ignore
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                
            default:
                this.handleWrongState();
            }
        },
        
        enter_Streaming_Slowing: function() {
            this.doSendForceRebind("ws2.slow");
            this.doStopTimer();
            this.doStartLoopTimer();
        },
        
        enter_SwitchAndRebindingPOLLING: function() {
            this.doCloseWS();
            this.doStopTimer();
            this.doCleanUp();
            this.doInvokeBindPOLLING();
        },
        
        doInvokeBindPOLLING: function() {
            var isHTTP = false;
            var isPolling = true;
            this.handler.bindSession(false, isPolling, isHTTP, "slow");
        },
        
        enter_SwitchAndCreatingPOLLING: function() {
            this.doNotifyOnSessionRetry();
            this.doCloseWS();
            this.doStopTimer();
            this.doCleanUp();
            this.doInvokeCreatePOLLING();
        },
        
        doInvokeCreatePOLLING: function() {
            var isHTTP = false;
            var isPolling = true;
            this.handler.createSession(false, false, false, isPolling, isHTTP, "slow.loop.timeout");
        },
        
        next_RHB: function(newState) {
            assert(this.state === State.Streaming);
            
            if (log.isDebugLogEnabled()) {
                this.logEvent(this.state_RHB, newState, this.state_RHB, this.state_RHB, newState);
            }
            
            this.state_RHB = newState;
        },
        
        dispatch_RHB: function(event, data) {
            switch (this.state_RHB) {
            
            case State.RhbDisabled:
                switch (event) {
                case Event.any_ctrl_req:
                    // any_ctrl_req: RhbDisabled
                    // ignore
                    break;
                case Event.rhbIntervalChange:
                    this.doChoose(function() {
                        if (! this.isRhbInterval_eq_0()) {
                            this.dispatch(Event.rhbIntervalChange_gt_0);
                        }
                    });
                    break;
                case Event.rhbIntervalChange_gt_0:
                    // rhbIntervalChange_gt_0: RhbDisabled -> RhbEnabled
                    this.next_RHB(State.RhbEnabled);
                    this.enter_Streaming_RhbEnabled();
                    break;
                default:
                    this.handleWrongState();
                }
                break;
            
            case State.RhbEnabled:
                switch (event) {
                case Event.any_ctrl_req:
                    // any_ctrl_req: RhbEnabled
                    // don't call this.next_RHB(State.RhbEnabled) to avoid duplicate log
                    this.enter_Streaming_RhbEnabled();
                    break;
                case Event.onReverseHeartbeatTimeout:
                    // onReverseHeartbeatTimeout: RhbEnabled
                    this.next_RHB(State.RhbEnabled);
                    this.doSendHeartbeat();
                    this.enter_Streaming_RhbEnabled();
                    break;
                case Event.rhbIntervalChange:
                    this.doChoose(function() {
                        if (this.isGranted_eq_0() && this.isRhbInterval_eq_0()) {
                            this.dispatch(Event.rhbIntervalChange_eq_0);
                        }
                    });
                    break;
                case Event.rhbIntervalChange_eq_0:
                    // rhbIntervalChange_eq_0: RhbEnabled -> RhbDisabled
                    this.next_RHB(State.RhbDisabled);
                    this.doStopRhbTimer();
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                
            default:
                this.handleWrongState();
            }
        },
        
        isGranted_eq_0: function() {
            return this.grantedReverseHeartbeatInterval === 0;
        },
        
        isRhbInterval_eq_0: function() {
            return this.policyBean.reverseHeartbeatInterval === 0;
        },
        
        doRestartRhbTimer: function() {
            this.stopRhbTimer();
            this.startRhbTimer();
        },
        
        doStopRhbTimer: function() {
            this.stopRhbTimer();
        },
        
        doSendHeartbeat: function(request) {
            this.sendData("heartbeat\r\n\r\n");
        },
        
        enter_Streaming_RhbDisabled: function() {
            // nothing to do
        },
        
        enter_Streaming_RhbEnabled: function() {
            this.doRestartRhbTimer();
        },
        
        next_Slw: function(newState) {
            assert(this.state === State.Streaming);
            
            if (log.isDebugLogEnabled()) {
                this.logEvent(this.state_Slw, newState, this.state_Slw, this.state_Slw, newState, "{diffTime: " + this.slwDiffTime + ", avgDelay: " + this.slwAvgDelay + "}");
            }
            
            this.state_Slw = newState;
        },
        
        dispatch_Slw: function(event, data) {
            switch (this.state_Slw) {
            
            case State.SlwRunning0:
                switch (event) {
                case Event.SYNC:
                    this.next_Slw(State.SlwRunning1);
                    this.doInitAvgDelay(data);
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                
            case State.SlwRunning1:
                switch (event) {
                case Event.SYNC:
                    this.doSetDiffTime(data);
                    this.doChoose(function() {
                        if (this.isSyncDelayHuge()) {
                            this.dispatch(Event.SYNC_isHuge, data);
                        }
                        else {
                            this.dispatch(Event.SYNC_NOTisHuge, data);
                        }
                    });
                    break;
                case Event.SYNC_isHuge:
                    this.doChoose(function() {
                        if (this.isAvgDelay_abv_range_and_slw_disabled()) {
                            this.dispatch(Event.SYNC_huge_abv_range_and_slw_disabled, data);
                        }
                        else if (this.isAvgDelay_abv_range_and_slw_enabled()) {
                            this.dispatch(Event.SYNC_huge_abv_range_and_slw_enabled, data);
                        }
                        else {
                            this.dispatch(Event.SYNC_huge_blw_in_range, data);
                        }
                    });
                    break;
                case Event.SYNC_NOTisHuge:
                    this.doUpdateAvgDelay(data);
                    this.doChoose(function() {
                        if (this.isAvgDelay_blw_range()) {
                            this.dispatch(Event.SYNC_blw_range, data);
                        }
                        else if (this.isAvgDelay_abv_range_and_slw_disabled()) {
                            this.dispatch(Event.SYNC_abv_range_and_slw_disabled, data);
                        }
                        else if (this.isAvgDelay_abv_range_and_slw_enabled()) {
                            this.dispatch(Event.SYNC_abv_range_and_slw_enabled, data);
                        }
                        else {
                            this.dispatch(Event.SYNC_in_range, data);
                        }
                    });
                    break;
                case Event.SYNC_huge_abv_range_and_slw_disabled:
                    this.next_Slw(State.SlwRunning2);
                    break;
                case Event.SYNC_huge_abv_range_and_slw_enabled:
                    this.next_Slw(State.SlwSlowing);
                    break;
                case Event.SYNC_huge_blw_in_range:
                    this.next_Slw(State.SlwRunning2);
                    break;
                case Event.SYNC_blw_range:
                    this.next_Slw(State.SlwRunning1);
                    this.doSetAvgDelayToZero();
                    break;
                case Event.SYNC_abv_range_and_slw_disabled:
                    this.next_Slw(State.SlwRunning1);
                    break;
                case Event.SYNC_abv_range_and_slw_enabled:
                    this.next_Slw(State.SlwSlowing);
                    break;
                case Event.SYNC_in_range:
                    this.next_Slw(State.SlwRunning1);
                    break;
                default:
                    this.handleWrongState();
                }
                break;

            case State.SlwRunning2:
                switch (event) {
                case Event.SYNC:
                    this.doSetDiffTime(data);
                    this.doChoose(function() {
                        if (this.isSyncDelayHuge()) {
                            this.dispatch(Event.SYNC_isHuge, data);
                        }
                        else {
                            this.dispatch(Event.SYNC_NOTisHuge, data);
                        }
                    });
                    break;
                case Event.SYNC_isHuge:
                    this.doUpdateAvgDelay(data);
                    this.doChoose(function() {
                        if (this.isAvgDelay_blw_range()) {
                            this.dispatch(Event.SYNC_huge_blw_range, data);
                        }
                        else if (this.isAvgDelay_abv_range_and_slw_disabled()) {
                            this.dispatch(Event.SYNC_huge_abv_range_and_slw_disabled, data);
                        }
                        else if (this.isAvgDelay_abv_range_and_slw_enabled()) {
                            this.dispatch(Event.SYNC_huge_abv_range_and_slw_enabled, data);
                        }
                        else {
                            this.dispatch(Event.SYNC_huge_in_range, data);
                        }
                    });
                    break;
                case Event.SYNC_NOTisHuge:
                    this.doUpdateAvgDelay(data);
                    this.doChoose(function() {
                        if (this.isAvgDelay_blw_range()) {
                            this.dispatch(Event.SYNC_blw_range, data);
                        }
                        else if (this.isAvgDelay_abv_range_and_slw_disabled()) {
                            this.dispatch(Event.SYNC_abv_range_and_slw_disabled, data);
                        }
                        else if (this.isAvgDelay_abv_range_and_slw_enabled()) {
                            this.dispatch(Event.SYNC_abv_range_and_slw_enabled, data);
                        }
                        else {
                            this.dispatch(Event.SYNC_in_range, data);
                        }
                    });
                    break;
                case Event.SYNC_huge_blw_range:
                    this.next_Slw(State.SlwRunning1);
                    this.doSetAvgDelayToZero();
                    break;
                case Event.SYNC_huge_abv_range_and_slw_disabled:
                    this.next_Slw(State.SlwRunning1);
                    break;
                case Event.SYNC_huge_abv_range_and_slw_enabled:
                    this.next_Slw(State.SlwSlowing);
                    break;
                case Event.SYNC_huge_in_range:
                    this.next_Slw(State.SlwRunning1);
                    break;
                case Event.SYNC_blw_range:
                    this.next_Slw(State.SlwRunning2);
                    this.doSetAvgDelayToZero();
                    break;
                case Event.SYNC_abv_range_and_slw_disabled:
                    this.next_Slw(State.SlwRunning2);
                    break;
                case Event.SYNC_abv_range_and_slw_enabled:
                    this.next_Slw(State.SlwSlowing);
                    break;
                case Event.SYNC_in_range:
                    this.next_Slw(State.SlwRunning2);
                    break;
                default:
                    this.handleWrongState();
                }
                break;

            case State.SlwSlowing:
                switch (event) {
                case Event.SYNC:
                    this.next_Slw(State.SlwSlowing);
                    this.doIgnoreSYNC();
                    break;
                default:
                    this.handleWrongState();
                }
                break;
            
            default:
                this.handleWrongState();
            }
        },
        
        enter_Streaming_SlwRunning0: function() {
            this.slwRefTime = this.now();
        },
        
        next_Prog: function(newState) {
            assert(this.state === State.Streaming);
            
            if (log.isDebugLogEnabled()) {
                this.logEvent(this.state_Prog, newState, this.state_Prog, this.state_Prog, newState);
            }
            
            this.state_Prog = newState;
        },
        
        dispatch_Prog: function(event, data) {
            switch (this.state_Prog) {
                
            case State.FromRecovery:
                switch (event) {
                case Event.PROG:
                    this.next_Prog(State.NoDebug);
                    break;
                case Event.any_server_msg:
                    // ignore
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                
            case State.NoDebug:
                switch (event) {
                case Event.PROG:
                    this.next_Prog(State.Debug);
                    this.doAddToCountables(data);
                    break;
                    case Event.U:
                case Event.any_server_msg:
                    // ignore
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                
            case State.Debug:
                switch (event) {
                case Event.PROG:
                    this.doClearCountables(data);
                    break;
                case Event.any_server_msg:
                    this.doAddToCountables(data);
                    break;
                default:
                    this.handleWrongState();
                }
                break;
                 
            default:
                this.handleWrongState();
            }
        },
        
        enter_Streaming_NoDebug: function() {
            this.state_Prog = State.NoDebug;
        },
        
        enter_Streaming_FromRecovery: function() {
            this.state_Prog = State.FromRecovery;
        },
        
        doClearCountables: function(msg) {
            assertDefined(msg.prog);
            
            this.countables.push(msg);
            if (msg.prog > this.dataNotificationCount) {
                throw new Error("PROG mismatch. Expected " + this.dataNotificationCount + " but found " + msg.prog + ". Last events are: " + this.countables.join(" "));
            }
            this.countables.splice(0, this.countables.lenght - 1);
        },
        
        doAddToCountables: function(data) {
            this.countables.push(data.toString());
        },
        
        doInitAvgDelay: function(msg) {
            assertDefined(msg.syncMs);
            
            this.slwAvgDelay = this.now() - this.slwRefTime - msg.syncMs;
        },
        
        doSetDiffTime: function(msg) {
            assertDefined(msg.syncMs);
            
            this.slwDiffTime = this.now() - this.slwRefTime - msg.syncMs;
        },
        
        doSetAvgDelayToZero: function() {
            this.slwAvgDelay = 0;
        },
        
        doUpdateAvgDelay: function() {
            this.slwAvgDelay = 0.5 * (this.slwAvgDelay + this.slwDiffTime);
        },
        
        doSignalRequestSlow: function() {
            this.dispatch(Event.requestSlow);
        },
        
        doIgnoreSYNC: function() {
            // nothing to do
        },
        
        isSyncDelayHuge: function() {
            return this.slwDiffTime > this.slwHugeDelay && this.slwDiffTime > 2 * this.slwAvgDelay;
        },
        
        isAvgDelay_blw_range: function() {
            return this.slwAvgDelay < 60;
        },
        
        isAvgDelay_abv_range_and_slw_disabled: function() {
            return this.slwAvgDelay > this.slwMaxAvgDelay && ! this.policyBean.slowingEnabled;
        },
        
        isAvgDelay_abv_range_and_slw_enabled: function() {
            return this.slwAvgDelay > this.slwMaxAvgDelay && this.policyBean.slowingEnabled;
        },
        
        enter_Streaming_Receiving: function() {
            this.doRestartKeepaliveTimer();
        },
        
        enter_Streaming_Stalling: function() {
            this.doStartStalledTimer();
        },
        
        enter_Streaming_Stalled: function() {
            this.doStartReconnectTimer();
            this.doNotifySTALLED();
        },
        
        enter_Streaming_Switching: function() {
            this.doSendForceRebind("ws2.switch");
            this.doStopTimer();
            this.doStartLoopTimer();
        },
        
        doRestartKeepaliveTimer: function() {
            assert(this.policyBean.keepaliveInterval > 0);
            
            this.stopTimer();
            this.startTimer(this.policyBean.keepaliveInterval, Event.onKeepaliveTimeout);
        },
        
        doStartStalledTimer: function() {
            assert(this.policyBean.stalledTimeout > 0);
            
            this.startTimer(this.policyBean.stalledTimeout, Event.onStalledTimeout);
        },
        
        doStartReconnectTimer: function() {
            assert(this.policyBean.reconnectTimeout > 0);
            
            this.startTimer(this.policyBean.reconnectTimeout, Event.onReconnectTimeout);
        },
        
        doResetCurrentRetryDelay: function() {
            this.retryDelayCounter.resetRetryDelay(this.policyBean.retryDelay);
        },
        
        doParseCONOK: function(msg) {
            assertDefined(msg.sessionId, msg.requestLimitLength, msg.keepaliveInterval, msg.serverInstanceAddress);

            // CONOK,<session id>,<request limit>,<keep alive>,<control link>
            this.sessionId = msg.sessionId;
            // notify ClientListener.onPropertyChange("sessionId")
            this.connectionBean.simpleSetter("sessionId", this.sessionId);
            
            this.keepaliveInterval = msg.keepaliveInterval;
            // notify ClientListener.onPropertyChange("keepaliveInterval")
            this.policyBean.simpleSetter("keepaliveInterval", this.keepaliveInterval);

            var lastUsedAddress = this.sessionServerAddress;
            if (msg.serverInstanceAddress !== '*' && ! this.ignoreServerAddressCache) {
                this.sessionServerAddress = RequestsHelper.completeControlLink(this.sessionServerAddress, msg.serverInstanceAddress);
                // notify ClientListener.onPropertyChange("serverInstanceAddress")
                this.connectionBean.simpleSetter("serverInstanceAddress", this.sessionServerAddress);
            }
            
            if (lastUsedAddress !== this.sessionServerAddress) {
                this.handler.onObsoleteControlLink(lastUsedAddress);
                this.handler.onNewControlLink(this.sessionServerAddress);
            }
        },
        
        doNotifyOnSessionStart: function() {
            this.handler.onSessionStart();
            this.handler.onSessionBound();
        },
        
        doNotifyOnSessionBound: function() {
            this.handler.onSessionBound();
        },
        
        doNotifyOnSessionClose: function() {
            this.handler.onSessionClose(this.handler.statusPhase, true/*no retry*/);
        },
        
        doNotifyOnSessionRetry: function() {
            this.handler.onSessionClose(this.handler.statusPhase, false/*retry*/);
        },
        
        doNotifyOnServerError: function(msg) {
            assertDefined(msg.causeCode, msg.causeMsg);
            
            // CONERR,<code>,<message> or
            // ERROR,<code>,<message> or
            // END,<code>,<message> or
            // REQERR,<reqId>,<code>,<message>
            
            // translate error code
            var op = msg.getField(0);
            var c = msg.causeCode;
            if (op === 'END' && (0 < c && c < 30 || c > 39)) {
                c = 39;
            }
            else if (op === 'REQERR' && c === 11) {
                c = 21;
            }
            this.handler.onServerError(c, msg.causeMsg);
        },
        
        doNotifyOnServerError61: function() {
            this.handler.onServerError(61, "Unexpected error while parsing the response");
        },
        
        getCONERRCode: function(msg) {
            assertDefined(msg.causeCode, msg.causeMsg);
            
            if (msg.causeCode === this.policyBean.remoteAdapterStatusObserver.metadataErrorCode) {
                return CONERR_Code.METADATA_ERROR;
            }
            else if (msg.causeCode === 5 && Constants.handleError5) {
                return CONERR_Code.SERVER_BUSY_ERROR;
            }
            else if (msg.causeCode === 4 || msg.causeCode === 20 || msg.causeCode === 40
                    || msg.causeCode === 41 || msg.causeCode === 48) {
                return CONERR_Code.SOFT_ERROR;
            }
            else if (msg.causeCode === 6) {
                return CONERR_Code.GENERIC_METADATA_ERROR;
            }
            else {
                return CONERR_Code.FATAL_ERROR;
            }
        },
        
        enter_CONERR_choose: function(data) {
            this.doChoose(function() {
                var code = this.getCONERRCode(data);
                switch (code) {
                case CONERR_Code.FATAL_ERROR:
                    this.dispatch(Event.CONERR_isFatalError, data);
                    break;
                case CONERR_Code.SOFT_ERROR:
                    this.dispatch(Event.CONERR_isSoftError, data);
                    break;
                case CONERR_Code.METADATA_ERROR:
                    this.dispatch(Event.CONERR_isMetadataAdapterError, data);
                    break;
                case CONERR_Code.SERVER_BUSY_ERROR:
                    this.dispatch(Event.CONERR_isServerBusyError, data);
                    break;
                case CONERR_Code.GENERIC_METADATA_ERROR:
                    this.dispatch(Event.CONERR_isGenericMetadataAdapterError, data);
                    break;
                default:
                    throw new Error('Unknown CONERR class code ' + code);
                }
            });
        },
        
        enter_CONERR_isFatalError: function(data) {
            this.next(State.Disconnected);
            this.enter_Aborting(data);
            this.enter_Disconnected();
        },
        
        enter_CONERR_isMetadataAdapterError: function(data) {
            this.next(State.Pause1);
            this.doStartMetadataAdapterTimer();
            this.enter_Pause1("ws2.conerr", data);
        },
        
        enter_CONERR_isServerBusyError: function(data) {
            this.next(State.Opening);
            this.doSignalServerBusy();
            this.doStopTimer();
            this.doIncreaseRetryDelayToMax();
            this.doCloseWS();
            this.doNotifyWILL_RETRY();
            this.enter_Retrying("ws2.conerr", data);
        },
        
        isFatalError_END: function(msg) {
            assertDefined(msg.causeCode, msg.causeMsg);
            
            // END,<code>,<message>
            return msg.causeCode !== 41 && msg.causeCode !== 48;
        },
        
        doParseSERVNAME: function(msg) {
            assertDefined(msg.serverSocketName);
            
            // SERVNAME,<name>
            this.connectionBean.simpleSetter("serverSocketName", msg.serverSocketName);
        },
        
        doParseCLIENTIP: function(msg) {
            assertDefined(msg.clientIp);
            
            // CLIENTIP,<ip>
            this.handler.onIPReceived(msg.clientIp);
            this.connectionBean.simpleSetter("clientIp", msg.clientIp);
        },
        
        doParseCONS: function(msg) {
            assertDefined(msg.realMaxBandwidth);
            
            // CONS,(unmanaged|unlimited|<bandwidth>)
            this.serverSentBW = msg.realMaxBandwidth;
            this.policyBean.simpleSetter("realMaxBandwidth", (this.serverSentBW === "unmanaged" ? "unlimited" : this.serverSentBW));
        },
        
        doNotifyOnProcessed: function(msg) {
            assertDefined(msg.sequence, msg.prog);
            
            // MSGDONE,<sequence>,<prog>
            this.handler.onMessageOk(msg.sequence, msg.prog);
        },
        
        isMessageDiscarded: function(msg) {
            assertDefined(msg.causeCode);
            
            // MSGFAIL,<sequence>,<prog>,<error-code>,<error-message>
            return msg.causeCode === 38 || msg.causeCode === 39;
        },
        
        isMessageDeny: function(msg) {
            assertDefined(msg.causeCode);
            
            // MSGFAIL,<sequence>,<prog>,<error-code>,<error-message>
            return msg.causeCode <= 0;            
        },
        
        doNotifyOnMessageDiscarded: function(msg) {
            assertDefined(msg.causeCode, msg.sequence, msg.prog, msg.causeMsg);
            
            // MSGFAIL,<sequence>,<prog>,<error-code>,<error-message>
            if (msg.causeCode === 39) {
                var count = parseInt(msg.causeMsg, 10);
                for (var p = msg.prog - count + 1; p <= msg.prog; p++) {
                    this.handler.onMessageDiscarded(msg.sequence, p);
                }
            }
            else {
                this.handler.onMessageDiscarded(msg.sequence, msg.prog);
            }
        },
        
        doNotifyOnMessageDeny: function(msg) {
            assertDefined(msg.causeCode, msg.sequence, msg.prog, msg.causeMsg);
            
            // MSGFAIL,<sequence>,<prog>,<error-code>,<error-message>
            this.handler.onMessageDeny(msg.sequence, msg.causeCode, msg.prog, msg.causeMsg);
        },
        
        doNotifyOnMessageError_MSGFAIL: function(msg) {
            assertDefined(msg.causeCode, msg.sequence, msg.prog, msg.causeMsg);
            
            // MSGFAIL,<sequence>,<prog>,<error-code>,<error-message>
            this.handler.onMessageError(msg.sequence, msg.causeCode, msg.prog, msg.causeMsg);
        },
        
        doNotifyOnSubscription: function(msg) {
            /*
             * NB
             * This operation triggers the listener SubscriptionListener.onSubscription. 
             */
            assertDefined(msg.subId, msg.numItems, msg.numFields);
            if (msg.getField(0) === 'SUBCMD') {
                assertDefined(msg.keyPos, msg.cmdPos)
            }

            // SUBOK,<subId>,<numItems>,<numFields>
            // SUBCMD,<subId>,<numItems>,<numFields>,<keyPos>,<cmdPos>
            this.handler.onSubscription(msg.subId, msg.numItems, msg.numFields, msg.keyPos || 0, msg.cmdPos || 0);
        },
        
        doParseUNSUB: function(msg) {
            /*
             * NB
             * This operation does not trigger SubscriptionListener.onUnsubscription.
             * Instead the listener is triggered by unsubscribe event.
             */
            assertDefined(msg.subId);
            
            this.handler.onUnsubscription(msg.subId);
        },
        
        doNotifyOnItemUpdate: function(msg) {
            assertDefined(msg.subId, msg.itemId, msg.updates);
            
            this.handler.onUpdateReceived([msg.subId, msg.itemId].concat(msg.updates));
        },
        
        doNotifyOnEndOfSnapshot: function(msg) {
            assertDefined(msg.subId, msg.itemId);
            
            this.handler.onEndOfSnapshotEvent([msg.subId, msg.itemId]);
        },
        
        doNotifyOnClearSnapshot: function(msg) {
            assertDefined(msg.subId, msg.itemId);
            
            this.handler.onClearSnapshotEvent([msg.subId, msg.itemId]);
        },
        
        doNotifyOnItemLostUpdates: function(msg) {
            assertDefined(msg.subId, msg.itemId, msg.lostUpdates);
            
            this.handler.onLostUpdatesEvent([msg.subId, msg.itemId, msg.lostUpdates]);
        },
        
        doNotifyOnRealMaxFrequency: function(msg) {
            assertDefined(msg.subId, msg.frequency);

            this.handler.onSubscriptionReconf(msg.subId, null/*phase*/, msg.frequency);
        },
        
        doNotifyOnMPNREG: function(msg) {
            assertDefined(msg.deviceId, msg.adapterName);
            
            this.mpnManager.eventManager.onRegisterOK(msg.deviceId, msg.adapterName);
        },
        
        doNotifyOnMPNOK: function(msg) {
            assertDefined(msg.subId, msg.pnSubId);
            
            this.mpnManager.eventManager.onSubscribeOK(msg.subId, msg.pnSubId);
        },
        
        doNotifyOnMPNDEL: function(msg) {
            assertDefined(msg.pnSubId);
            
            this.mpnManager.eventManager.onUnsubscribeOK(msg.pnSubId);
        },
        
        doAddToWaitings: function(request) {
            assertDefined(request.type);
            var ls = this.waitingReqs[request.type];
            assert(ls);
            
            if (request.type === CtrlRequest.CONS) {
                // the new constrain request replaces the old request 
                ls[0] = request;
            }
            else {
                ls.push(request);
            }
        },
        
        doClearWaitings: function() {
            for (var category in this.waitingReqs) {
                this.waitingReqs[category] = [];
            }
        },
        
        doSendWaitingRequests: function() {            
            // NB order does matter
            this.sendRequests(CtrlRequest.SUB, this.doSendSubscribe);
            this.sendRequests(CtrlRequest.RECONF, this.doSendReconf);
            this.sendRequests(CtrlRequest.UNSUB, this.doSendUnsubscribe);
            this.sendRequests(CtrlRequest.MSG, this.doSendMessage);
            this.sendRequests(CtrlRequest.MPN_REG, this.doSendRegister);
            this.sendRequests(CtrlRequest.MPN_SUB, this.doSendMpnSubscribe);
            this.sendRequests(CtrlRequest.MPN_UNSUB, this.doSendMpnUnsubscribe);
            this.sendRequests(CtrlRequest.MPN_UNSUB_FILTER, this.doSendMpnUnsubscribeFilter);
            if (this.serverSentBW !== "unmanaged") {
                this.sendRequests(CtrlRequest.CONS, this.doSendConstrain);            
            }
            this.sendRequests(CtrlRequest.LOG, this.doSendLog);
        },
        
        sendRequests: function(type, sendFunc) {
            var ls = this.waitingReqs[type];
            for (var i = 0; i < ls.length; i++) {
                sendFunc.call(this, ls[i]);
            }
            this.waitingReqs[type] = [];
        },
        
        doSendSubscribe: function(request) {
            assertDefined(request.query);
            assertDefined(request.query['LS_reqId'], request.query['LS_subId']);
            var reqId = request.query['LS_reqId'];
            var subId = request.query['LS_subId'];
            
            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.handler.pushPagesHandler.subscriptionSent(subId);
            this.addToPendings(request, reqId);
        },
        
        doSendUnsubscribe: function(request) {
            assertDefined(request.query);
            assertDefined(request.query['LS_reqId'], request.query['LS_subId']);
            
            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.addToPendings(request, request.query['LS_reqId']);
        },
        
        doSendMessage: function(request) {
            assertDefined(request.query, request.sequence, request.prog, request.ack, request.reqId);
            assertDefined(request.query['LS_message']);

            // NB LS_message is the only parameter that is not url-encoded by the caller
            request.query['LS_message'] = encodeURIComponent(request.query['LS_message']);
            var data = "msg\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.handler.sendMessageHandler.sentOnNetwork(request.sequence, request.prog);
            if (request.ack) {
                this.addToPendings(request, request.reqId);
            }
            else {
                this.handler.sendMessageHandler.noAckMessageSent(request.sequence, request.prog);
            }
        },
        
        doSendRegister: function(request) {
            assertDefined(request.query, request.reqId);
            
            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.addToPendings(request, request.reqId);
        },
        
        doSendMpnSubscribe: function(request) {
            assertDefined(request.query, request.reqId);
            
            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.addToPendings(request, request.reqId);
        },
        
        doSendMpnUnsubscribe: function(request) {
            assertDefined(request.query, request.reqId);
            
            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.addToPendings(request, request.reqId);
        },
        
        doSendMpnUnsubscribeFilter: function(request) {
            assertDefined(request.query, request.reqId);
            
            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.addToPendings(request, request.reqId);
        },
        
        doSendDestroy: function(cause) {
            var data = "control\r\n";
            data += "LS_op=destroy";
            data += "&LS_cause=" + cause;
            data += "&LS_reqId=" + Utils.nextRequestId();
            data += "&LS_close_socket=true";
            this.sendData(data);
        },
        
        doSendLog: function(request) {
            assertDefined(request.query);
            
            var data = "send_log\r\n" + this.toFormBody(request.query);
            this.sendData(data);
        },
        
        addToPendings: function(request, reqId) {
            assert(! this.pendingReqs[reqId]);
            
            this.pendingReqs[reqId] = request;  
        },
        
        removeFromPendings: function(reqId) {
            var request = this.pendingReqs[reqId]; 
            // request can be null if the reqId is unknown
            
            delete this.pendingReqs[reqId];
            return request;
        },
        
        getRequestType: function(msg) {
            assertDefined(msg.reqId);
            
            var request = this.pendingReqs[msg.reqId];
            if (request == null) {
                return null;
            }
            assertDefined(request.type);
            return request.type;
        },
        
        doNotifyREQOK: function(msg) {
            // REQOK,<reqId>
            assertDefined(msg.reqId);
            
            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }
            
            assertDefined(request.type);
            if (request.type === CtrlRequest.MSG) {
                assertDefined(request.sequence, request.prog);
                
                this.handler.onMessageAck(request.sequence, request.prog);
            }
        },
        
        isSyncError_REQERR: function(msg) {
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);
            
            return msg.causeCode === 20;
        },
        
        isFatalError_REQERR: function(msg) {
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);
            
            return msg.causeCode === 11 || msg.causeCode === 65;
        },
        
        doIgnoreError_REQERR: function(msg) {
            // REQERR,<reqId>,<error-code>,<error-message>
            assertDefined(msg.reqId);
            
            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }
        },
        
        doNotifyOnSubscriptionError_REQERR: function(msg) {
            // REQERR,<reqId>,<error-code>,<error-message>
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);
            
            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }
            
            assertDefined(request.query['LS_subId']);
            this.handler.onTableError(request.query['LS_subId'], msg.causeCode, msg.causeMsg);
        },

        doResendUnsubscriptionAfterREQERR19: function(msg) {
            // it is possible that if an unsubscription request immediately follows 
            // a subscription request, the server, which processes the requests 
            // in parallel, processes the unsubscription before the subscription. 
            // but since there is no active subscription at the moment, the server returns 
            // the error 19 to the client. 
            // in that case the client should resend the unsubscription request in order to 
            // free resources on the server. 

            // REQERR,<reqId>,<error-code>,<error-message>
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);

            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }

            var that = this;
            setTimeout(function() {
                that.dispatch(Event.unsubscribe, request);
            }, 4000);
        },
        
        doNotifyOnMessageError_REQERR: function(msg) {
            // REQERR,<reqId>,<error-code>,<error-message>
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);
            
            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }
            
            assertDefined(request.sequence, request.prog);
            this.handler.onMessageError(request.sequence, msg.causeCode, request.prog, msg.causeMsg);
        },
        
        doNotifyOnRegistrationFailed_REQERR: function(msg) {
            // REQERR,<reqId>,<error-code>,<error-message>
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);
            
            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }
            
            this.mpnManager.eventManager.onRegisterError(msg.causeCode, msg.causeMsg);
        },
        
        doNotifyOnMpnSubscriptionError_REQERR: function(msg) {
            // REQERR,<reqId>,<error-code>,<error-message>
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);
            
            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }
            
            assertDefined(request.subscriptionId);
            this.mpnManager.eventManager.onSubscribeError(request.subscriptionId, msg.causeCode, msg.causeMsg);
        },
        
        doNotifyOnMpnUnsubscriptionError_REQERR: function(msg) {
            // REQERR,<reqId>,<error-code>,<error-message>
            assertDefined(msg.reqId, msg.causeCode, msg.causeMsg);
            
            var request = this.removeFromPendings(msg.reqId);
            if (request == null) {
                this.logUnknownRequest(msg);
                return;
            }
            
            assertDefined(request.subscriptionId);
            this.mpnManager.eventManager.onUnsubscribeError(request.subscriptionId, msg.causeCode, msg.causeMsg);
        },
        
        enter_Pause1: function(cause, data) {
            this.doSetCause(cause, data);
            this.doCloseWS();
            this.doNotifyWILL_RETRY();
        },
        
        enter_Pause2: function(cause, data) {
            this.doSetCause(cause, data);
            this.doCloseWS();
            this.doNotifyWILL_RETRY();
        },
        
        doStartRetryTimerFromStreaming: function() {
            var elapsedTime = this.now() - this.openTs;
            var remainingTime = this.policyBean.retryDelay - elapsedTime;
            var delay = remainingTime > 0 ? remainingTime : Math.ceil(Math.random() * this.policyBean.firstRetryMaxDelay);
            this.startTimer(delay, Event.onRetryTimeout);
        },
        
        enter_Aborting: function(msg) {
            this.doNotifyOnServerError(msg);
        },
        
        enter_Disconnected: function() {
            this.doCloseWS();
            this.doNotifyOnSessionClose();
            this.doStopTimer();
            this.doCleanUp();
            this.doNotifyDISCONNECTED();
        },
        
        notifyStatus: function(newStatus) {
            this.status = newStatus;
            // notify ClientListener.onStatusChange
            this.handler.statusChanged(this.handler.statusPhase);
        },
        
        doNotifyCONNECTING: function() {
            this.notifyStatus(Constants.CONNECTING);
        },
        
        doNotifySTREAMING: function() {
            this.notifyStatus(Constants.CONNECTED + Constants.WS_STREAMING);
        },
        
        doNotifyDISCONNECTED: function() {
            this.notifyStatus(Constants.DISCONNECTED);
        },
        
        doNotifyWILL_RETRY: function() {
            this.notifyStatus(Constants.WILL_RETRY);
        },
        
        doNotifySTALLED: function() {
            this.notifyStatus(Constants.STALLED);
        },
        
        handleWrongState: function() {
            throw new Error("Wrong state error on " + eventNames[this.event] + " in " + stateNames[this.state]);
        },
        
        handleWildException: function(e) {
            log.logError("oid=" + this.oid, "Wild exception in", stateNames[this.state], ":", e, this.toString());
            this.dispatch(Event.runtime_error);
        },
        
        isWsForced: function() {
            var transport = this.policyBean.forcedTransport;
            return transport === Constants.WS_STREAMING || transport === Constants.WS_POLLING || transport === Constants.WS_ALL;
        },
        
        isWsAvailable: function() {
            var connRequest = new Request(this.sessionServerAddress + Constants.LIGHTSTREAMER_PATH);
            connRequest.setCookieFlag(this.policyBean.isCookieHandlingRequired()); 
            connRequest.setExtraHeaders(this.policyBean.extractHttpExtraHeaders(false));
            return ConnectionSelector.isGood(
                    this.sessionServerAddress,
                    WebSocketConnection,
                    connRequest.isCrossSite(),
                    this.policyBean.isCookieHandlingRequired(),
                    connRequest.isCrossProtocol(),
                    this.policyBean.hasHttpExtraHeaders(false));
        },
     
        doSendConstrain: function(request) {
            assert(this.serverSentBW !== "unmanaged");                            
            assertDefined(request.query);
            assertDefined(request.query['LS_reqId']);
            var reqId = request.query['LS_reqId'];

            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);

            this.addToPendings(request, reqId);
        },
        
        doSendReconf: function(request) {
            assertDefined(request.query);
            assertDefined(request.query['LS_reqId']);
            var reqId = request.query['LS_reqId'];
            
            var data = "control\r\n" + this.toFormBody(request.query);
            this.sendData(data);
            
            this.addToPendings(request, reqId);
        },
        
        isRecoveryEnabled: function() {
            return this.policyBean.sessionRecoveryTimeout > 0;
        },
        
        enter_Recovering: function(cause, data) {
            this.doSetCause(cause, data);
            this.doOpenWS();
            this.doStartRetryTimer();
            this.doIncreaseRetryDelay();
            this.doRecordOpenTime();
        },
        
        enter_Pause_R0: function(cause) {
            this.doSetCause(cause);
            this.doStartFirstRetryTimer();
        },
        
        doStartFirstRetryTimer: function() {
            var delay = Math.ceil(Math.random() * this.policyBean.firstRetryMaxDelay);
            this.startTimer(delay, Event.onRetryTimeout);
        },
        
        enter_Pause_R: function(cause, data) {
            this.doSetCause(cause, data);
        },
        
        doNotifyTRYING_RECOVERY: function() {
            this.notifyStatus(Constants.TRYING_RECOVERY);
        },
        
        doRecordRecoveryTime: function() {
            this.recoveryTs = this.now();
        },
        
        doSendRecovery: function() {
            var data = "bind_session\r\n";
            data += "LS_session=" + this.sessionId;
            data += "&LS_cause=" + this.getCause();
            data += "&LS_recovery_from=" + this.dataNotificationCount;
            if (this.policyBean.keepaliveInterval > 0) {
                data += "&LS_keepalive_millis=" + this.policyBean.keepaliveInterval;
            }
            if (!this.policyBean.slowingEnabled) {
                data += "&LS_send_sync=false";
            }
            this.grantedReverseHeartbeatInterval = this.policyBean.reverseHeartbeatInterval;
            if (this.policyBean.reverseHeartbeatInterval > 0) {
                data += "&LS_inactivity_millis=" + this.policyBean.reverseHeartbeatInterval;
            }
            this.sendData(data);
        },
        
        hasRecoveryTimeoutElapsed: function() {
            assert(this.recoveryTs);
            
            return this.now() - this.recoveryTs >= this.policyBean.sessionRecoveryTimeout;
        },
        
        hasToBeSkipped: function() {
            return this.progCount < this.dataNotificationCount;
        },
        
        doSetProg: function(msg) {
            assertDefined(msg.prog);
            assert(msg.prog <= this.dataNotificationCount);
            
            this.progCount = msg.prog;
        },
        
        doIncProg: function() {
            assert(this.progCount < this.dataNotificationCount);
            
            this.progCount++;
        },
        
        doIncProgAndCount: function() {
            assert(this.dataNotificationCount === this.progCount);
            
            this.progCount++;
            this.dataNotificationCount++;
        },
        
        doNotifyOnServerKeepalive: function() {
            this.handler.onServerKeepalive();
        },
        
        doDisableWs: function() {
            WebSocketConnection.disableClass(this.sessionServerAddress);
        },
        
        now: function() {
            return new Date().getTime();
        },
        
        parseData: function(data) {
            var line;
            try {
                log.logDebug("oid=" + this.oid, "WebSocket transport receiving", data);
                var lines = data.split('\r\n');
                for (var i = 0; i < lines.length; i++) {
                    line = lines[i];
                    if (line === '') {
                        continue;
                    }
                    var msg = new TlcpServerMessage(line);
                    var op = msg.getField(0);
                    var event = null;
                    switch (op) {
                    case "U":
                        event = Event._U;
                        break;
                    case "SUBOK":
                        event = Event._SUBOK;
                        break;
                    case "SUBCMD":
                        event = Event._SUBCMD;
                        break;
                    case "UNSUB":
                        event = Event._UNSUB;
                        break;
                    case "EOS":
                        event = Event._EOS;
                        break;
                    case "CS":
                        event = Event._CS;
                        break;
                    case "OV":
                        event = Event._OV;
                        break;
                    case "CONF":
                        event = Event._CONF;
                        break;
                    case "MSGDONE":
                        event = Event._MSGDONE;
                        break;
                    case "MSGFAIL":
                        event = Event._MSGFAIL;
                        break;
                    case "MPNREG":
                        event = Event._MPNREG;
                        break;
                    case "MPNOK":
                        event = Event._MPNOK;
                        break;
                    case "MPNDEL":
                        event = Event._MPNDEL;
                        break;

                    case "CONOK":
                        event = Event._CONOK;
                        break;
                    case "SERVNAME":
                        event = Event.SERVNAME;
                        break;
                    case "CLIENTIP":
                        event = Event.CLIENTIP;
                        break;
                    case "CONS":
                        event = Event.CONS;
                        break;
                    case "PROG":
                        event = Event.PROG;
                        break;
                    case "REQOK":
                        event = Event.REQOK;
                        break;
                    case "REQERR":
                        event = Event.REQERR;
                        break;
                    case "LOOP":
                        event = Event._LOOP;
                        break;
                    case "PROBE":
                        event = Event.PROBE;
                        break;
                    case "SYNC":
                        event = Event.SYNC;
                        break;
                    case "NOOP":
                        event = Event.NOOP;
                        break;
                    case "WSOK":
                        event = Event.WSOK;
                        break;
                    case "END":
                        event = Event.END;
                        break;
                    case "ERROR":
                        event = Event.ERROR;
                        break;
                    case "CONERR":
                        event = Event.CONERR;
                        break;
                    }
                    assert(event, "Unknown event");
                    this.dispatch(event, msg);
                }
            } 
            catch (e) {
                log.logError("oid=" + this.oid, "Parse exception in", stateNames[this.state], ":", line, ":", e);
                this.dispatch(Event.runtime_error);
            }
        },
        
        sendData: function(data) {
            assert(this.ws);
            
            log.logDebug("oid=" + this.oid, "WebSocket transport sending", data);
            this.ws.send(data);
        },
        
        toFormBody: function(params) {
            var data = "";
            for (var p in params) {
                data += p + "=" + params[p] + "&";
            }
            return data;
        },
        
        startTimer: function(delay, event) {
            assert(this.timer == null);
            
            var that = this;
            this.timer = setTimeout(function() {
                that.timer = null;
                that.dispatch(event);
            }, delay);
        },
        
        stopTimer: function() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;                
            }
        },
        
        startRhbTimer: function() {
            assert(this.rhbTimer == null);
            assert(this.grantedReverseHeartbeatInterval != null);
            
            var g = this.grantedReverseHeartbeatInterval;
            var r = this.policyBean.reverseHeartbeatInterval;
            var delay = (r > 0) && (g === 0 || r < g) ? r : g;
            var that = this;
            this.rhbTimer = setTimeout(function() {
                that.rhbTimer = null;
                that.dispatch(Event.onReverseHeartbeatTimeout);
            }, delay);
        },
        
        stopRhbTimer: function() {
            if (this.rhbTimer) {
                clearTimeout(this.rhbTimer);
                this.rhbTimer = null;                
            }
        },
        
        doSetCause: function(cause, data) {
            this.LS_cause = cause + (data == null ? "" : data.causeCode);
        },
        
        getCause: function() {
            var cause = this.LS_cause || "unknown";
            this.LS_cause = null;
            return cause;
        },
        
        /*Override*/
        createSession: function(sessionId, cause, arg3) {
            this.sessionId = sessionId;
            this.dispatch(Event._connect, cause);
        },
        
        /*Override*/
        bindSession: function(cause) {
            this.dispatch(Event.bind, cause);
        },

        /*Override*/
        requestSwitch: function() {
            if (this.state === State.Streaming) {
                this.dispatch(Event.requestSwitch);
            }
        },
        
        /*Override*/
        changeBandwidth: function(params) {
            this.dispatch(Event.constrain, params);
        },
        
        reconf: function(params) {
            this.dispatch(Event.reconf, params);
        },
        
        /*Override*/
        closeSession: function() {
            this.dispatch(Event.disconnect);
        },
        
        subscribe: function(params) {
            this.dispatch(Event.subscribe, params);
        },
        
        unsubscribe: function(params) {
            this.dispatch(Event.unsubscribe, params);            
        },
        
        sendMessage: function(params) {
            this.dispatch(Event.message, params);
        },
        
        register: function(params) {
            this.dispatch(Event.register, params);
        },
        
        subscribeMpn: function(params) {
            this.dispatch(Event.subscribeMpn, params);
        },
        
        unsubscribeMpn: function(params) {
            this.dispatch(Event.unsubscribeMpn, params);
        },
        
        unsubscribeFilterMpn: function(params) {
            this.dispatch(Event.unsubscribeFilterMpn, params);
        },
        
        sendLog: function(params) {
            this.dispatch(Event.sendLog, params);
        },
        
        /*Override*/
        disconnectAndReconnect: function() {
            this.dispatch(Event.dataAdapterDisconnect);
        },
        
        /*Override*/
        handleReverseHeartbeat: function() {
            if (this.state === State.Streaming) {
                this.dispatch(Event.rhbIntervalChange);
            }
        },
        
        /*Override*/
        getHighLevelStatus: function() {
            return this.status;
        },
        
        /*Override*/
        getSessionId: function() {
            return this.sessionId;
        },
        
        /*Override*/
        onFatalError: function() {
            this.dispatch(Event.runtime_error);
        },
        
        /*Override*/
        isOpen: function() {
            // the flag is always true in order to force SessionHandler to call this class
            return true;
        },
        
        /*Override*/
        isActive: function() {
            // the flag is always true in order to force SessionHandler to call this class
            return true;
        },
        
        /*Override*/
        isRecovering: function() {
            return this.state === State.Recovering || this.state === State.Pause_R;
        },
        
        /*Override*/
        getPushServerAddress: function() {
            return this.sessionServerAddress;
        },
        
        /*Override*/
        shutdown: function() {
            // nothing to do
        },
        
        toString: function() {
            var s = "{"
            s += ' state: ' + stateNames[this.state];
            s += ' state_SM: ' + stateNames[this.state_SM];
            s += ' state_RHB: ' + stateNames[this.state_RHB];
            s += ' state_Slw: ' + stateNames[this.state_Slw];
            s += ' state_Prog: ' + stateNames[this.state_Prog];
            s += ' event: ' + eventNames[this.event];
            for (var p in this) {
                var v = this[p];
                if (typeof v !== "function") {                    
                    s += ' ' + p + ': ' + v;
                }
            }
            s += " }";
            return s;
        },

        logUnknownRequest: function(data) {
            log.logWarn("oid=" + this.oid, "Ignore response of unknown request", data, "in state", stateNames[this.state]);
        }
};

function assert(cond, msg) {
    if (! cond) {
        throw new Error('Assertion failed' + (msg ? ': ' + msg : ''));
    }
}

function assertDefined() {
    for (var i = 0; i < arguments.length; i++) {
        var prop = arguments[i];
        if (prop === undefined) {
            throw new Error('Property ' + i + ' is undefined');
        }
    }
}

export default NewSessionWS;
