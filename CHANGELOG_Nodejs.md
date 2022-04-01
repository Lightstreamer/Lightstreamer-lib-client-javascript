# SDK for Node.js Clients CHANGELOG

## 8.0.4 build 1790

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 1 Apr 2022</i>

<!--29/7/2021-->
Fixed a bug about message sending that, upon a message retransmission, could have caused the client to trigger ClientListener.onServerError with error code 32 or 33.

<!--15/12/2012-->
Fixed a bug that could have caused the client to not unsubscribe from an item when the user
called the methods LightstreamerClient.subscribe and LightstreamerClient.unsubscribe in rapid sequence or more in general when the server received a subscription request and the corresponding unsubscription request at the same time.

<!--31/3/2022-->
Fixed a compatibility issue with Server versions 7.1.0 and later, related with the support of the `<service_url_prefix>` Server configuration element. In case a non-lowercase prefix had been used, the websocket connections would have failed.


## 8.0.3 build 1787

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 10 Dec 2020</i>

<!---id=3168--->
Fixed a bug introduced in version 7.2.1 and affecting the ItemUpdate.isSnapshot method. In case of a subscription of multiple items with a single Subscription object, the method returned true only for the first snapshot received. After that, the method returned false even when the updates were indeed snapshots.


## 8.0.2 build 1784

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 11 Dec 2019</i>

Revised the policy of reconnection attempts to reduce the attempt
frequency in case of repeated failure of the first bind request, which
could be due to issues in accessing the "control link" (when
configured).

## 8.0.1 build 1774

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 9 October 2019</i>

Fixed a bug which could have caused the Client to ignore a call to
LightstreamerClient.disconnect, when it was invoked while the Client was
reconnecting, that is, when LightstreamerClient.getStatus was equal to
DISCONNECTED:WILL-RETRY or DISCONNECTED:TRYING-RECOVERY.

Fixed a bug which could have caused the ClientListener.onStatusChange
callback to notify the status DISCONNECTED:WILL-RETRY as the first
status instead of CONNECTING. The anomaly could be triggered by invoking
LightstreamerClient.disconnect while the Client was trying to recover
the session, and then invoking LightstreamerClient.connect.

Fixed a bug which could have caused the Client to disconnect abruptly
when the Server signaled a harmless error message.

Revised and improved the layout of the jsdocs.

## 8.0.0 build 1771.1012

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 30 August 2019</i>

Made the library available on the public npm service, at the following
address:\
 [https://www.npmjs.com/package/lightstreamer-client-node](https://www.npmjs.com/package/lightstreamer-client-node)\
Previously the library was available with name "lightstreamer-client".\
 Moreover, the library is now open source, available on GitHub at the
following address:\

[https://github.com/Lightstreamer/Lightstreamer-lib-client-javascript](https://github.com/Lightstreamer/Lightstreamer-lib-client-javascript).\
 Hence, the non-minified version of the library is also provided.\
 The way the deliverables are provided has also changed: the library
module name is now "lightstreamer-client-node" for the non-minified
version and "lightstreamer-client-node/lightstreamer-node.min" for the
minified version. See the instructions on the npm page for details.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If upgrading an existing application (by changing
the package.json file), the library module name to be specified in
require() is no longer "lightstreamer-client" and should be modified to
refer to the minified version. Referring to the non-minified version is
also possible, but then the application startup may become slower.</i>

Improved the communication with the Server by adopting the public TLCP
protocol. Moreover, the internal protocol based on javascript commands
is no longer used; hence, the "eval" function is no longer invoked
within the library.

Added the support for TypeScript through the declaration file
*types.d.ts*.

Discontinued the support for React Native, which is now provided by the
Web Client SDK 8.0.0.

Replaced the "maxBandwidth" property of the ConnectionOptions bean with
two distinct properties: "requestedMaxBandwidth" and the read-only
"realMaxBandwidth", so that the setting is made with the former, while
the value applied by the Server is only reported by the latter, now
including changes during session life. The extension affects the getter
and setter names and also the invocations of onPropertyChange on the
ClientListener (see the docs for details).<br/>
<b>COMPATIBILITY NOTE:</b> <i>Custom
code using "maxBandwidth" in any of the mentioned forms has to be
ported.</i>

Introduced a new callback, "onRealMaxFrequency", to the
SubscriptionListener, to report the frequency constraint on the
subscription as determined by the Server and its changes during
subscription life. See the docs for details and special cases.

Fixed a bug introduced with the session recovery mechanism, which, under
certain conditions, could have caused the Client to ignore the
setForcedTransport setting after a recovery attempt, even a successful
one.

Removed a spurious notification of the DISCONNECTED:WILL-RETRY state
that could occur when invoking connect() after receiving an invocation
of onServerError(). The bug was harmless.

Introduced a new property, "clientIp", in the ConnectionDetails bean; it
is a read-only property with the related getter and keyword for
onPropertyChange (see the docs for details).

Slightly delayed the availability of the "serverSocketName" property of
the ConnectionDetails bean, which was already valued upon session start.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Custom code using getServerSocketName right after a
session start, should ensure that onPropertyChange for
"serverSocketName" gets invoked first.</i>

Removed useless requests to the Server for bandwidth change when the
Server is not configured for bandwidth management.

Added new error codes 66 and 68 to onServerError, onSubscriptionError,
and onSecondLevelSubscriptionError, to report server-side issues;
previously, upon such problems, the connection was just interrupted.\
 Added new error code 61 to onServerError, to report unexpected
client-side issues; previously, upon such problems, the connection was
just interrupted.\
 Removed error code 20 from onSubscriptionError and
onSecondLevelSubscriptionError documentation; when a subscription
request cannot find the session, the session is just closed and replaced
immediately.

By-passed the "retry delay" setting when recovering from a closed
session. This may speedup the recovery process.

Clarified in the docs the role of the delayTimeout in sendMessage.

Incremented the major version number.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If running
Lightstreamer Server with a license of "file" type which enables Node.js
Client SDK up to version 7.3 or earlier, clients based on this new
version will not be accepted by the Server: a license upgrade will be
needed.</i>

## 7.3.1 build 1767

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 3 Apr 2019</i>

Fixed a bug in the recently revised policy of reconnection attempts upon
failed or unresponsive requests. In case of multiple failed attempts on
unresponsive connections the retry delay was increased dynamically, but
was not restored to the configured value after a successful connection.
As a consequence, after a server or network unavailability lasting for a
couple of minutes, further cases of server or network unavailability
would be recovered in about one minute, even if much shorter.

Fixed an annoying formatting issue in the jsdoc page for
ConnectionOptions.

## 7.3.0 build 1766

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 14 Mar 2019</i>

Fixed a bug causing the conversion into numbers of user-supplied string
parameters (e.g. in settings in ConnectionDetails and ConnectionOptions)
which can be interpreted as numbers. For example a user name of the form
'1e2' could have been converted into the number 100, then used as the
string '100'.

Fixed several bugs in the session recovery mechanism:

-   Fixed a bug which could have caused, in case of a recovery failure
    due to the elapsing of the recently added "SessionRecoveryTimeout"
    setting, the failure of the first subsequent attempt to create a new
    session.
-   Fixed a bug causing the Client to always try a recovery when the
    ReconnectTimeout expired on a stalled session, regardless that the
    SessionRecoveryTimeout could be set as 0 to disable session
    recovery.
-   Fixed a bug that could have caused the silent discarding of control
    requests (e.g. subscriptions or messages) when the Client was
    attempting the recovery of the current session.
-   Fixed a bug that could have caused session recovery to fail if
    preceded by a previous successful session recovery on the same
    session by more than a few seconds.
-   Fixed a bug triggered by a call to connect() or setForcedTransport()
    issued while the Client was attempting the recovery of the current
    session. This caused the recovery to fail, but, then, the library
    might not reissue the current subscriptions on the newly created
    session.

Fixed a bug due to a race condition between a subscribe and a concurrent
disconnect, which could have caused the subscription to be skipped upon
a subsequent connect.

Modified the implementation of connect() when issued while the state is
either DISCONNECTED:WILL-RETRY or DISCONNECTED:TRYING-RECOVERY. The call
will no longer interrupt the pending reconnection attempt, but it will
be ignored, to lean on the current attempt. Note that a pending
reconnection attempt can still be interrupted by issuing disconnect()
first.\
 Modified in a similar way the implementation of setForcedTransport();
when issued while the state is either DISCONNECTED:WILL-RETRY or
DISCONNECTED:TRYING-RECOVERY, the call will no longer interrupt the
pending reconnection attempt, but it will apply to the outcome of that
connection attempt.

Wholly revised the policy of reconnection attempts upon failed or
unresponsive requests. Now the only property related with this policy is
"RetryDelay", which now affects both (1) the minimum time to wait before
trying a new connection to the Server in case the previous one failed
for any reason and (2) the maximum time to wait for a response to a
request before dropping the connection and trying with a different
approach.\
 Previously, point (2) was related with the "ConnectTimeout" and
"CurrentConnectTimeout" properties. Now, in case of multiple failed
attempts on unresponsive connections (i.e. while in CONNECTING state),
the timeout used may still be increased dynamically and can still be
inspected through getCurrentConnectTimeout, but this behavior is no
longer configurable.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Existing code that tries to
take control of the connection timeouts will no longer be obeyed, but we
assume that the new policy will bring an overall improvement. Note that,
when in CONNECTING state, the current timeout can be restored by issuing
disconnect() and then connect().</i><br/>
As a result of the change, methods
setConnectTimeout, getConnectTimeout and setCurrentConnectTimeout of
ConnectionOptions have been deprecated, as the setters have no effect
and the getter is now equivalent to getRetryDelay.\
 Also changed the default value of the "RetryDelay" property from 2
seconds to 4 seconds.

Changed the default value of the "EarlyWSOpenEnabled" property from true
to false (see ConnectionOptions.setEarlyWSOpenEnabled). This removes a
potential incompatibility with cookie-based Load Balancers, at the
expense of a possible slight delay in session startup.

Changed the default value of the "SlowingEnabled" property from true to
false (see ConnectionOptions.setSlowingEnabled).

Incremented the minor version number.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If running
Lightstreamer Server with a license of "file" type which enables Node.js
Client SDK up to version 7.2 or earlier, clients based on this new
version will not be accepted by the Server: a license upgrade will be
needed.</i>

## 7.2.4 build 1757

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 7 Jun 2018</i>

Introduced a maximum time on attempts to recover the current session,
after which a new session will be opened. The default is 15 seconds, but
it can be customized with the newly added "SessionRecoveryTimeout"
property in ConnectionOptions. This fixes a potential case of
permanently unsuccessful recovery, if the \<control\_link\_address\>
setting were leveraged in a Server cluster and a Server instance
happened to leave a cluster and were not automatically restarted.

Fixed a bug in the recently introduced session recovery mechanism
triggered by the use of the \<control\_link\_address\> setting on
Lightstreamer Server, which could have caused feasible recovery attempts
to fail.

Fixed a harmless bug, introduced in the previous version, which could
have caused a Server warning for "duplicated LS_session" on some client
requests.

## 7.2.3 build 1750

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 17 Apr 2018</i>

Fixed a bug in the recently introduced session recovery mechanism, by
which, a sendMessage request issued while a recovery operation was in
place, could have never been notified to the listener until the end of
the session (at which point an "abort" notification would have been
issued to the listener), even in case the recovery was successful.

Fixed a race condition, mostly possible while a session recovery was
being attempted, which could have caused the delay of subscription
requests due to a wrong request to the Server.

Addressed a particular case of session interruption that was still not
supported by the session recovery feature.

## 7.2.2 build 1747

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 23 Mar 2018</i>

Added the error code 21 in onServerError, that can be received upon some
failed requests, to inform that not only the current session was not
found but it is also likely that the request was routed to the wrong
Server instance. Previously, in the same cases, the SDK library would
not invoke onServerError and would open a new session instead.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If using an existing application, you should check
how it would handle the new (and unexpected) error code. A reconnection
attempt would ensure the previous behavior, although this is no longer
the suggested action.</i><br/>
Likewise, added the error code 11 in
onSubscriptionError and onCommandSecondLevelSubscriptionError, that can
be received instead of code 20, to inform that not only the current
session was not found but it is also likely that the request was routed
to the wrong Server instance.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Existing applications
which handle error code 20, should ensure that the new error code 11 is
also handled properly.</i>

Fixed a severe bug in the recently introduced session recovery
mechanism, by which, after the creation of a new session because of
network issues, it was possible that subsequent successful session
recovery would cause data loss.

Fixed a bug in the recently introduced session recovery mechanism,
which, upon particular kinds of network issues and if the creation of a
new session had been necessary, could have caused the Client to skip the
resuming of the active subscriptions.

Fixed an annoying typo in the documentation of onStatusChange regarding
the "DISCONNECTED:TRYING-RECOVERY" status.

Improved the library log by splitting the "lightstreamer.subscriptions"
category in three, with the introduction of "lightstreamer.messages" and
"lightstreamer.requests". See setLoggerProvider in LightstreamerClient
for details.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Existing code that collects log from
the "lightstreamer.subscriptions" category should be ported. This
obviously is not expected to affect production code.</i>

## 7.2.1 build 1745

<i>Compatible with Lightstreamer Server since 7.0 b2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 22 Feb 2018</i>

Modified the default value of the "RetryDelay" property from 5000 to
2000 ms. This should help recovering from network outages of a few
seconds, typical, for instance, of wifi/mobile network switches on
mobile phones.

Extended the recovery mechanism to stalled sessions. Now, when the
ReconnectTimeout expires, an attempt to recover the current session will
be performed first.

Fixed a race condition, introduced in the previous build 1737, which
could have caused the delay of subscription requests issued on a
websocket session startup due to a wrong request to the Server.

Improved the notification of closed sessions to the Server.

## 7.2.0 build 1743

<i>Compatible with Lightstreamer Server since 7.0 b2.</i><br/>
<i>May not be compatible with code developed with the previous version; see
compatibility notes below.</i><br/>
<i>Released on 20 Dec 2017</i>

Added automatic recovery of sessions upon unexpected socket interruption
during streaming or long polling. Now the library will perform an
attempt to resume the session from the interruption point. The attempt
may or may not succeed, also depending on the Server configuration of
the recovery capability.\
 As a consequence, introduced a new status, namely
DISCONNECTED:TRYING-RECOVERY, to inform the application when a recovery
attempt is being performed; hence, onStatusChange and getStatus can
provide the new status.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Existing code that uses the
status names received via onStatusChange or getStatus may have to be
aligned.</i>

Extended the reverse heartbeat mechanism, governed by the
"ReverseHeartbeatInterval" property. Now, it will also allow the Server
to detect when a client has abandoned a session although the socket
remains open.\
 Fixed a bug on sending reverse heartbeats to the Server, which,
sometimes, could have caused the Server to report a syntax error.

Added the new Server error code 71 to onServerError and clarified the
difference with error code 60.

Fixed the documentation of the "ContentLength", "KeepaliveInterval", and
"ReverseHeartbeatInterval" properties of ConnectionOptions, to clarify
that a zero value is not allowed in the first and it is allowed in the
others.

Improved subscription requests on WebSockets by removing unnecessary
parts.

Aligned the documentation to comply with current licensing policies.

## 7.1.1 build 1732.7

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 20 Nov 2017</i>

Removed all the occurrences of the deprecated "with" statement,
erroneously reintroduced in version 7.1.0.

Ensured source compatibility with React Native up to version 0.49.

## 7.1.0 build 1732

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 25 May 2017</i>

Fixed the recently added support for cookie handling on WebSocket
connections, to be fully compliant in the determination of outgoing
cookies.

Added static methods addCookies and getCookies to LightstreamerClient,
to simplify the sharing of cookies between Server connections operated
by the SDK library and the rest of the application.

## 7.0.9 build 1729

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 15 May 2017</i>

Improved the handling of cookies, by adding support of the WebSocket
case. Now, the invocation of setCookieHandlingRequired(true) no longer
causes the library to keep from using WebSockets.\
 Clarified in the docs for setHttpExtraHeaders how custom cookies can be
set and inquired, which is also how cookies set by other sites can be
supplied.

Added the error code 60 to "onServerError", to report cases in which the
Server license does not allow the Client SDK version.

Fixed a bug on the recovery of control requests upon session close and
replacement, which, through a rare race condition, could have caused the
block of all subsequent control requests.

## 7.0.7 build 1722

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 17 Mar 2017</i>

Removed all the occurrences of the deprecated "with" statement in order
to ensure Javascript strict mode compatibility.

## 7.0.6 build 1719

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 7 Mar 2017</i>

Fixed a bug which caused the invocations to the "setReconnectTimeout"
method in ConnectionOptions to be ignored.

Removed the polyfill of the Promise, which is no longer needed, yet it
might have caused compatibility issues in some environments.

## 7.0.5 build 1718

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 16 Jan 2017</i>

Removed a restriction on field names that can be supplied to a
Subscription object within a "field list"; names made by numbers are now
allowed. Obviously, the final validation on field names is made by the
Metadata Adapter.

## 7.0.4 build 1717

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 9 Jan 2017</i>

Fixed a bug introduced in version 6.1 which prevented the "slowing
algorithm" (see setSlowingEnabled) from working.

Fixed a bug in setRequestedBufferSize, which caused the value
"unlimited" to be ignored for subscriptions in MERGE mode, which would
stick to the default buffer size of 1.

Fixed the handling of wrong calls to getFields and getFieldSchema on
Subscription. In some cases, an exception different from the
IllegalStateException was thrown.

Fixed the log produced by the library, as, between the window name (when
available) and the timestamp a space was missing.

Revised the sendMessage implementation in the HTTP case, to limit
recovery actions when messages are not to be ordered and a listener is
not provided.\
 Revised sendMessage to accept 0 as a legal value for the "delayTimeout"
argument.

Revised the default setting for the "ContentLength" property of
ConnectionOptions, to allow the library to set it to the best value.

Clarified in the documentation the meaning of null in
setRequestedMaxFrequency and setRequestedBufferSize. Extended
setRequestedMaxFrequency to allow the setting also when the subscription
is "active" and the current value is null.

Revised the documentation of possible subscription error codes.

Added clarification details in the documentation of
setCookieHandlingRequired.

## 7.0.3 build 1712

<i>Compatible with Lightstreamer Server since 6.0.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 10 May 2016</i>

Introduced the new Node.js SDK. See the "sdk\_client\_nodejs\_unified"
folder.\
 Previously, the Node.js library was available as part of the SDK for
JavaScript Clients, now called SDK for Web Clients (Unified API).\
 Note that the library was released in two different versions: as a
"flavour" of the JavaScript Client SDK library and through the npm
service. This SDK only refers to the library deployed via npm. However,
currently, the use of the Web (Unified API) Client SDK library in the
Node.js flavour, which is based on AMD, is not recommended.\
 The SDK library has the same characteristics of the library in the
current SDK for Web Clients (Unified API) version 7.0.2 and you can
refer to that SDK for the changelog with respect to previous versions
(although some topics in that changelog, obviously, don't pertain to
Node.js), with the following additions:

-   There is no licensing restriction on the library version in use when
    a license file is configured on the Server. But note that if trying
    to access a Server with Server version earlier than 6.0.2 a license
    error will be issued by the Server.
-   Methods enableSharing and isMaster for the LightstreamerClient class
    are not available.<br/>
    <b>COMPATIBILITY NOTE:</b> <i>Custom code targeted for the
    Node.js environment was not expected to request connection sharing,
    which is not supported there.</i>
-   Some dependency third-party libraries have been upgraded.
-   Requests in HTTP now support cookie handling also in the Node.js
    environment. As a consequence, invocations of
    setCookieHandlingRequired(true) in class ConnectionOptions are now
    allowed, although they would disable the use of WebSocket, for which
    cookie handling is still not implemented.

