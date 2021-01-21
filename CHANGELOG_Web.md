# SDK for Web Clients CHANGELOG

## 8.1.0-beta1

<i>Compatible with Lightstreamer Server since 7.1.1.</i><br/>
<i>May not be compatible with code developed with the previous version; see
compatibility notes below.</i><br/>
<i>Made available as a prerelease on 17 Jul 2020</i>

Fully revised and improved the session establishment process and the
Stream-Sense algorithm. Now a websocket connection will be tried immediately,
without a pre-flight http request; only if websockets turn out to be not
supported by the browser/environment will http streaming be tried.<br/>
This should significantly reduce the average session establishment time in
most scenarios.<br/>
The possible cases of wrong diagnosis of websocket unavailability and
unnecessary resort to http streaming should also be reduced.<br/>
A noticeable consequence of the change is that, when a Load Balancer is
in place and a "control link address" is configured on the Server, most of the
streaming activity will now be expected on sockets opened towards the balancer
endpoint, whereas, before, the whole streaming activity flowed on sockets
opened towards the control link address.

As a consequence of the new Stream-Sense algorithm, the "EarlyWSOpenEnabled"
property of the ConnectionOptions bean has been removed. This affects its
getter and setter and also the invocations of onPropertyChange
on the ClientListener.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Custom code using "EarlyWSOpenEnabled" in any
of the mentioned forms has to be modified by removing all references.</i>


## 8.0.3 build 1800

<i>Compatible with Lightstreamer Server since 7.1.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 10 Dec 2020</i>

<!---id=3168--->
Fixed a bug introduced in version 7.2.1 and affecting the ItemUpdate.isSnapshot method. In case of a subscription of multiple items with a single Subscription object, the method returned true only for the first snapshot received. After that, the method returned false even when the updates were indeed snapshots.


## 8.0.2 build 1797

<i>Compatible with Lightstreamer Server since 7.1.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Released on 11 Dec 2019</i>

Fixed a bug on IE11 which could have caused an exception with the
message "Operation aborted" when invoking the method
LightstreamerClient.sendMessage. In some cases, the message could have
been still sent successfully.

Revised the policy of reconnection attempts to reduce the attempt
frequency in case of repeated failure of the first bind request, which
could be due to issues in accessing the "control link" (when
configured).

## 8.0.1 build 1784

<i>Compatible with Lightstreamer Server since 7.1.</i><br/>
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

## 8.0.0 build 1781.1015

<i>Compatible with Lightstreamer Server since 7.1.</i><br/>
<i>May not be compatible with code developed with the previous version; see
compatibility notes below.</i><br/>
<i>No longer compatible with the SDK for Flash Clients; see compatibility
notes below.</i><br/>
<i>Released on 30 August 2019</i>

Made the library available on the public npm service, at the following
address:\

[https://www.npmjs.com/package/lightstreamer-client-web](https://www.npmjs.com/package/lightstreamer-client-web).\
 Moreover, the library is now open source, available on GitHub at the
following address:\

[https://github.com/Lightstreamer/Lightstreamer-lib-client-javascript](https://github.com/Lightstreamer/Lightstreamer-lib-client-javascript).\
 Hence, the non-minified version of the library is also provided.\
 The way the deliverables are provided has also changed on various
aspects:

-   The library named lightstreamer.js is now the non-minified version.
    The minified version is now supplied as lightstreamer.min.js.<br/>
    <b>COMPATIBILITY NOTE:</b> <i>If upgrading an existing application, consider
    downloading lightstreamer.min.js and specifying this name in the
    \<script\> blocks (or renaming the library, which, however, may be
    prone to confusion); otherwise, the application startup may become
    slower.</i>
-   The base libraries are now in UMD format. This means that they can
    be used also with applications that previously needed libraries
    generated with the generator tool by leveraging the "Use globals" or
    "Use namespaced globals" flags. Accordingly, the new generator tool
    no longer contains flags to differentiate "AMD" and "global" cases.
-   The support of namespaces (i.e. prefixes) for the library names no
    longer requires a special version of the library, but rather a
    slight change in the way the library is included (different if AMD
    or global names are levereged). This also allows namespace
    customization. See the instructions on the npm page for details.
    Accordingly, the new generator tool no longer contains flags to
    differentiate "namespaced" cases.<br/>
    <b>COMPATIBILITY NOTE:</b> <i>If upgrading
    an existing application which previously needed libraries generated
    with the generator tool by leveraging the "Use AMD with namespaced
    names" or "Use namespaced globals" flags, the \<script\> blocks
    should be modified.</i>
-   A version of the library with a minimal subset of classes (which
    corresponds to the default configuration of the generator tool) is
    now available out-of-the-box as "lightstreamer-core".
-   Versions of the library targeted to other bundlers are now
    available. See the npm page for details and instructions.

Introduced the support for Mobile Push Notifications. It consists in new
methods in the LightstreamerClient class together with new dedicated
classes. See the API documentation for details.\
 An MPN subscription is backed by a real-time subscription, from which
it may take any field value. Unlike the usual real-time subscriptions,
MPN subscriptions are persistent: they survive the session and are
identified by a permanent, global, unique key provided by the Server at
time of activation.\
 The notifications are managed by third-party services supported by the
Server, which determine the notification characteristics and the
supported devices.<br/>
<b>COMPATIBILITY NOTE:</b> <i>The extension requires Server 7.1
and breaks the compatibility with Server version 7.0. However, if MPN
support is not used, compatibility with Server version 7.0 is still
ensured.</i>

Improved the communication with the Server by adopting the public TLCP
protocol. Moreover, the internal protocol based on javascript commands
is no longer used; hence, the "eval" function is no longer invoked
within the library.\
 As a consequence, the support for very old browsers has been reduced,
depending on the deployment scenario (i.e. with regard to the type of
urls used to access the static pages and Lightstreamer Server). In
particular:

-   Dropped support for cross-protocol (i.e. http vs https) scenarios on
    various old browsers.
-   Dropped support for cross-site scenarios on various old browsers.
-   Dropped streaming capability (long polling still available) for old
    IE versions and similar browsers.

In many of these cases, the new limitation only occurs when
setCookieHandlingRequired(true) is invoked by the application.\
 More details on the current support level are provided in the
"Deployment Config Matrix". See paragraph 2.1.1 in the Web Client Guide
document included in the SDK.\
 Note that, as a consequence, if clients based on older versions of this
SDK are no longer in use, Lightstreamer Server's \<use\_protected\_js\>
configuration flag can be forced to N.

Added the support for TypeScript through the declaration file
*types.d.ts*.

Added the support for React Native. See the new
[demo](https://github.com/Lightstreamer/Lightstreamer-example-StockList-client-reactnative)
for details.

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

Reduced reconnection time in case the browser detects the online status.

By-passed the "retry delay" setting when recovering from a closed
session. This may speedup the recovery process.

Clarified in the docs the role of the delayTimeout in sendMessage.

Discontinued the support for the SDK for Flash Clients.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Existing clients using the Flash Client SDK should not be ported:
they have to stick to Web Client SDK library version 7.2.0.</i>

Incremented the major version number.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If running
Lightstreamer Server with a license of "file" type which enables Web
Client SDK up to version 7.2 or earlier, clients based on this new
version will not be accepted by the Server: a license upgrade will be
needed.</i>

## 7.2.0 build 1777

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
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

## 7.2.0 build 1776

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 15 Mar 2019</i>

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

Fixed a bug preventing the sharing of the connection among
LightstreamerClient objects created on the same page.

Fixed a bug due to a race condition between a subscribe and a concurrent
disconnect in a connection sharing scenario, which could have caused the
subscription to be skipped upon a subsequent connect.

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

Fixed a mistake in the supplied generator.html page, whereby the
"Include Promise polyfill" checkbox was only shown while one of the AMD
options was selected. Actually, the checkbox was still obeyed, as
expected, even when not visible.

Incremented the minor version number.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If running
Lightstreamer Server with a license of "file" type which enables Web
Client SDK up to version 7.1 or earlier, clients based on this new
version will not be accepted by the Server: a license upgrade will be
needed.</i>

## 7.1.3 build 1767

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 14 Jun 2018</i>

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

Fixed a bug in the recently introduced session recovery mechanism, by
which, a sendMessage request issued while a recovery operation was in
place, could have never been notified to the listener until the end of
the session (at which point an "abort" notification would have been
issued to the listener), even in case the recovery was successful.

Fixed a race condition, mostly possible while a session recovery was
being attempted, which could have caused the delay of subscription
requests due to a wrong request to the Server.

Addressed various issues related with connection sharing:

-   Improved the connection sharing mechanism, which, in some complex
    contexts where a page was unable to connect to a master, could have
    kept trying unsuccessfully. Now it would give up and open a separate
    connection.
-   Removed sharing restrictions on Firefox 57 and above, introduced in
    version 7.1.0. Now, sharing will be available as soon as it is
    allowed by the browser.
-   On the other hand, discontinued connection sharing support on
    browsers that don't provide the "shared worker" feature. However, on
    most of these browsers, connection sharing already failed for other
    reasons; it could have succeeded mainly on very old browsers. This
    fixes an issue with some browsers, like Chrome for Android, in which
    the attempt (bound to fail) to share the connection could have
    caused a spurious popup to appear or a blocked popup notification to
    be issued.
-   Disabled sharing on UC Browser. This fixes compatibility issues
    which, in case of sharing configured, might have caused any
    connection attempt to fail.

Addressed a particular case of session interruption that was still not
supported by the session recovery feature.

## 7.1.2 build 1749

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 23 Mar 2018</i>

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

## 7.1.1 build 1745

<i>Compatible with Lightstreamer Server since 7.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 28 Feb 2018</i>

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

Improved compatibility with the latest versions of Edge and Safari. This
required disabling connection sharing.

Improved the notification of closed sessions to the Server, to enforce a
cleanup when a browser tab is closing.

## 7.1.0 build 1737

<i>Compatible with Lightstreamer Server since 7.0 b2.</i><br/>
<i>May not be compatible with code developed with the previous version; see
compatibility notes below.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
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

Added the onServerKeepalive callback in the ClientListener. See the
JSDocs for details.

Extended the reverse heartbeat mechanism, governed by the
"ReverseHeartbeatInterval" property. Now, it will also allow the Server
to detect when a client has abandoned a session although the socket
remains open.\
 Fixed a bug on sending reverse heartbeats to the Server, which,
sometimes, could have caused the Server to report a syntax error.

Added the error codes 60 and 71 to "onServerError", to report cases in
which the Server license does not allow the Client SDK version.

Fixed a bug which caused the invocations to the "setReconnectTimeout"
method in ConnectionOptions to be ignored.

Fixed a bug on the recovery of control requests upon session close and
replacement, which, through a rare race condition, could have caused the
block of all subsequent control requests.

Fixed a bug that could affect the sorting of grid widgets requested
through setSort method in case of large numbers (greater that 1 million)
and comma as thousands separator.

Fixed the documentation of the "ContentLength", "KeepaliveInterval", and
"ReverseHeartbeatInterval" properties of ConnectionOptions, to clarify
that a zero value is not allowed in the first and it is allowed in the
others.

Put a workaround for a known issue with shared workers in Firefox 57 and
above, which could have caused misbehavior in case of connection
sharing. As a consequence, the support for connection sharing may be
limited.

Aligned the "Web Client Guide" document with regard to the referred
"Deployment Config Matrix", which had remained obsolete.

Improved subscription requests on WebSockets by removing unnecessary
parts.

Improved the messages shown by the provided StatusWidget.

Aligned the documentation to comply with current licensing policies.

## 7.0.4 build 1721

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 23 Jan 2017</i>

Removed a restriction on field names that can be supplied to a
Subscription object within a "field list"; names made by numbers are now
allowed. This includes the specification of field names as "data-field"
attributes in DOM cells to be handled by StaticGrid or DynaGrid.
Obviously, the final validation on field names is made by the Metadata
Adapter.

Fixed a bug introduced in version 6.1 which prevented the "slowing
algorithm" (see setSlowingEnabled) from working.

Fixed a bug in setRequestedBufferSize, which caused the value
"unlimited" to be ignored for subscriptions in MERGE mode, which would
stick to the default buffer size of 1.

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

Fixed the Documentation of the FlashBridge class, which included
spurious entries for names "onBridgeReadyCalled" and "callBridgeReady".

## 7.0.4 build 1718

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i>

Fixed a bug that could prevent the transition to "cold" style of a cell
in a grid, hence leaving it in "hot" state. This was only possible if
the Server's \<delta\_delivery\> setting had been forced to N.

Addressed a compatibility issue with the new Safari 10, which, on some
environments, caused the cells associated with StaticGrid or DynaGrid
objects not to be detected.

Fixed the handling of wrong calls to getFields and getFieldSchema on
Subscription. In some cases, an exception different from the
IllegalStateException was thrown.

Fixed a bug that could affect connection sharing on old browsers when
equipped with Norton Internet Security.

Fixed a bug in the logging support, which caused the setUseInnerHtml
method of the DOMAppender to be ineffective (false was always meant).

Fixed the log produced by the library, as, between the window name (when
available) and the timestamp a space was missing.

## 7.0.4 build 1717

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i>

Fixed a bug that, under conditions of client machine overloaded or badly
responsive, could have caused a successful subscription, together with
the related updates, not to be notified to the application. The bug only
affected slave pages when connection sharing was enabled.

## 7.0.3 build 1713

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 5 Sep 2016</i>

Fixed a bug that could have led, under certain circumstances, to an
endless loop of connection and disconnection when two or more pages were
trying to share the connection.

Added clarification details in the documentation of
setCookieHandlingRequired and enableSharing.

## 7.0.2 build 1710

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>May not be compatible with code developed with the previous version; see
compatibility notes below.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 10 May 2016</i>

Renamed the SDK, which was named "SDK for JavaScript Clients". The new
name also emphasizes that it is based on the Unified APIs, like an
increasing number of other Client SDKs.

Discontinued the documentation of the use of this library in a Node.js
environment. Now the new SDK for Node.js Clients (Unified API) is
available, with dedicated documentation and instructions on how to
acquire the library from the npm service.

Discontinued the supply of the alternative versions of the library,
which, however, can still be created with Generator.html. Also moved
Generator.html under the lib folder. \
 Note that the library version for Node.js was in AMD format and
required to be included in a custom source together with RequireJS. The
use of the library version available through the npm service (see the
new Node.js Client SDK) is recommended instead.

Changed the names of some properties in the ConnectionOptions bean. To
resume:

-   keepaliveMillis has become keepaliveInterval
-   idleMillis has become idleTimeout
-   pollingMillis has become pollingInterval
-   reverseHeartbeatMillis has become reverseHeartbeatInterval

This affects the getter and setter names and also the invocations of
onPropertyChange on the ClientListener.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Custom code
using getters and setters for any of the specified properties should be
ported, but the old getters and setters are still supported. On the
other hand, custom code which defines onPropertyChange on a
ClientListener and mentions any of the specified properties has to be
ported to the new property names.</i>

Separated the ConnectionSharing class from the LightstreamerClient: this
means the class and its dependencies can now be excluded using the
Generator.html. Hence, the API and usage for this class have changed:
`     clientInstance.connectionSharing.enableSharing(...);     clientInstance.connectionSharing.isMaster();   `
becomes
`     clientInstance.enableSharing(new ConnectionSharing(...));     clientInstance.isMaster();   `
where the parameters of the old enableSharing method and the new
ConnectionSharing constructor are still the same.<br/>
<b>COMPATIBILITY NOTE:</b> <i>
existing code leveraging enableSharing should be ported, although old
code still works for now (provided that the ConnectionSharing class is
not excluded via Generator.html); if no sharing at all is configured,
the enableSharing call can also be removed.</i><br/>
When connection sharing is
enabled, it is now possible to force the LightstreamerClient to release
sharing-related resources by using the enableSharing(null) call while
DISCONNECTED.

Fixed a bug introduced on version 6.2.6: the bug prevented the use of
WebSockets in some cases in which the user connection was switched from
a non-WS-enabling network to a WS-enabling one.

Fixed a bug: in case of a Subscription Error the Client would still try
to subscribe the Subscription again, until a manual unsubscribe call was
performed.

Fixed a bug which prevented the invalid-license error from being
notified on Node.js.

Changed the behavior of getConnectTimeout/setConnectTimeout. This
setting now accepts the "auto" value. If "auto" is specified, the
timeout will be chosen (and possibly changed overtime) by the library
itself. Note that "auto" is also the new default value. To check and/or
modify the current timeout a new getter/setter pair is exposed:
getCurrentConnectTimeout/setCurrentConnectTimeout.<br/>
<b>COMPATIBILITY NOTE:</b> <i>
If the getConnectTimeout method is called by the Client code its
receiving variable may now contain the string "auto"; moreover it is
likely that getConnectTimeout calls should be replaced by
getCurrentConnectTimeout ones.</i><br/>
See the docs for further details.

Slightly changed the reconnection policy upon unexpected errors
affecting an active session. In some known cases, the reconnection will
no longer be immediate (with the risk of a fast reconnection loop), but
the configured retry delay will be applied.

Improved the support for connection sharing by taking advantage of the
SharedWorker class, where supported by the browser. As a consequence,
sharing will now succeed in some contexts in which it used not to take
place.

Introduced a Promise polyfill
(https://github.com/jakearchibald/es6-promise). The polyfill is optional
and can be excluded using the Generator.html; in this case the library
expects to find the Promise class in the environment.

Fixed a wrong argument type in the docs for class FunctionAppender.\
 Fixed the documentation of onServerError and onStatusChange, to specify
that onServerError is always preceded, not followed, by onStatusChange
with DISCONNECTED.\
 Fixed various links in the JSDocs. Also slightly revised the style of
the JSDocs.

Fixed the documentation of the DOMAppender and FunctionAppender
constructors, which indicated optional arguments before a mandatory
argument. Actually, an argument qualified as optional can omitted only
if not followed by further arguments, hence arguments preceding a
mandatory one are mandatory as well.\
 Aligned the documentation of all Appenders by removing the optionality
attributes to their common constructor arguments.<br/>
<b>COMPATIBILITY NOTE:</b> <i>No
change is needed to existing code, because each of these arguments can
still be omitted, as long as no subsequent arguments are supplied.</i><br/>
Clarified the policy for optional function arguments in the docs
introduction.

Removed from the documentation various classes that are not related with
the interface, but used to be provided as utilities. The whole set of
utility classes can be found on GitHub at the following address:
https://github.com/Lightstreamer/utility-toolkit-javascript\
 Removed also some log-related classes that are not needed for setting
up the library log, but used to be provided to offer a full reusable
logging system. The whole logging system can be found on GitHub at the
following address:
https://github.com/Lightstreamer/utility-logging-javascript<br/>
<b>COMPATIBILITY NOTE:</b> <i>These classes are still included in the library as
part of the implementation, so application code exploiting them will
keep working. However, any future changes related with these classes
will not be reported.</i>

Incremented the major version number.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If running
Lightstreamer Server with a license file that supports Web Client SDK up
to version 6.x or earlier, clients based on this new version will not be
accepted by the Server.</i>

## 6.2.7 build 1679.2

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i>

Fixed a bug introduced on version 6.1.4 which only affected the use on
Node.js; the effect was that, when the Server was unavailable, no more
connection attempts were tried.

Fixed an error in the JSDocs, where SimpleLoggerProvider was documented
as a module (with static methods); actually, it is a class, with
instance methods and an empty constructor.

## 6.2.6 build 1678

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>May not be compatible with code developed with the previous version; see
compatibility notes below.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 16 Jul 2015</i>

Fixed a bug: when using the SDK library inside a WebWorker, setting the
setCookieHandlingRequired flag to true prevented the library from
connecting.

Fixed a bug on the onClearSnapshot implementation of the
DynaGrid/StaticGrid/Chart classes, which caused it to have no effect.

Fixed a bug in the SimpleLoggerProvider.removeLoggerAppender method.

Fixed an error in the JSDoc: in the ClientListener.onStatusChange the
status "CONNECTED:STREAM-SENSING" was erroneously reported as
"CONNECTED:STREAM-SENSE".

Prevented a serious error, on the opening of a WebSocket to a certain
host, from blocking other WebSockets connections to different hosts.

Changed the behavior of the addListener method for the
LightstreamerClient, Subscription, Chart, DynaGrid and StaticGrid
classes: adding a second time the same listener instance now has no
effect.<br/>
<b>COMPATIBILITY NOTE:</b> <i>if in existing code a same listener was
added two times to a certain instance, it will no longer receive the
events twice; moreover, upon the first invocation of removeListener it
will be removed and it will stop receiving events. Hence such code may
need to be revised.</i>

Introduced work-around for early XDomainRequest failures related to
specific proxies.

Introduced partial compatibility with React Native: at the moment the
Client can only connect in HTTP-POLLING mode.

Clarified in the docs that the RemoteAppender does not support log of
"INFO" and "DEBUG" levels.

Changed the value of the LightstreamerClient.LIB_NAME static property
to "javascript_client".

Changed the default value for the ConnectionOptions.setContentLength
setting.

## 6.2.5 build 1669

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 13 Feb 2015</i>

Introduced support for the new error related to the expiration of an
active session on Lightstreamer Server (error 48). The error is not
forwarded to the ClientListener, a reconnection is performed instead.

Improved support for stickiness expiration on load balancers: if a
client request pertaining to the current session is sent to the wrong
instance of Lightstreamer Server, the Client automatically terminates
the current session and opens a new one.

Fixed the Chart and ChartLine classes: positionXAxis and positionYAxis
were supposed to accept negative values, but such values were explicitly
blocked by their implementation.

Fixed a typo in the documentation of the "preventCrossWindowShare"
parameter of "enableSharing".

Fixed the fade effect on IE\<=8 for cases where the end color is
"transparent": in these cases the fade effect will not be applied and a
discrete switch will occur (previously there was no change at all and
the starting color was left).

Fixed the "inherited methods" section of the JSDocs: some methods were
missing, others were pointing to the wrong location. Also improved the
readability of such list.

Fixed a bug that, under rare circumstances, could have triggered a
non-strict loop of requests for the xhr.html file.

## 6.2.2 build 1664

<i>Compatible with Lightstreamer Server since 6.0.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 21 Jan 2015</i>

Added the error code 30 in onServerError; the case is only predisposed
for future special licenses.<br/>
<b>COMPATIBILITY NOTE:</b> <i>custom clients which
check the possible error outcomes don't have to be updated, as long as
there is no change in license terms.</i>

Extended the sendMessage with a new flag that permits to queue messages
while the Client is offline.

Renamed the setRetryTimeout and getRetryTimeout methods into
setRetryDelay and getRetryDelay. The old names are kept as aliases to
mantain backward compatibility with previously written code. The
behavior of the associated value is also changed: while the delay was
previously started from the failure of the connection, it is now
calculated from the start of the connection, thus absorbing any
round-trip or timeout between the start of the connection and its
failure.

Introduced the setFirstRetryMaxDelay and getFirstRetryMaxDelay settings.
The actual delay is a randomized value between 0 and the value set on
the property associated with the new methods. The randomization might
help avoid a load spike on the cluster due to simultaneous
reconnections, should one of the active servers be stopped. Previous
versions of the SDK library had an hardcoded 0 value for this setting,
the new 100ms default value should not introduce a noticeable
difference.

Fixed the management of invalid key values when two-level push is
active. Now an invalid key no longer causes the session to fail, but
only a notification to onCommandSecondLevelSubscriptionError with the
new code 14 is issued.\
 Fixed the documentation of two-level push, to specify the implicit
conditions that determine the (unlikely) cases in which a key value is
invalid.

Fixed an error in the obfuscation process which, under rare
circumstances, could have caused a "OpenAjax is not defined" exception.

Introduced the support for the new client identification mechanism.

Removed the examples, which are now only hosted on GitHub and managed
through the new "demos" site. Provided suitable references to find the
examples there. Example code for normal html pages should also be found
on GitHub; the source code of the preinstalled welcome page is no longer
meant as a reference.

Introduced the new
setHttpExtraHeadersOnSessionCreationOnly/isHttpExtraHeadersOnSessionCreationOnly
in the the ConnectionOptions class. Unlike with setHttpExtraHeaders,
extra http headers will not be sent on all connections, but only during
session creation; this still ensures that the headers will reach
notifyUser and does not disable WebSocket connections.

Introduced the support for io.js.

Fixed a bug that might have occasionally caused an error to be shown on
the browser console (the text of the error was: 'Uncaught Executor error
time: NaN').

Incremented the minor version number.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If running
Lightstreamer Server with a license file that supports Web Client SDK up
to version 6.1 or earlier, clients based on this new version will not be
accepted by the Server.</i>

## 6.1.4 build 1640.11

<i>Compatible with Lightstreamer Server since 5.1.2.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 22 Jul 2014</i>

Introduced the new setHttpExtraHeaders/getHttpExtraHeaders in the the
ConnectionOptions class. It is now possible to add extra http headers to
the requests sent to Lightstreamer Server. NOTE:</b> <i>Setting a non null
value for this setting disables WebSockets.</i>

Improved compatibility with redirect-based authentication mode used by
some proxies.

Fixed a bug in the autoscroll behavior of the DynaGrid class: it was
adhering to the documentation only if listening to a DISTINCT
Subscription.

Fixed a bug affecting IE8: if many Subscriptions were
subscribed/unsubscribed to the LightstreamerClient in a strict loop a
"Stack overflow at line: 0" error might have been generated.

Fixed an incompatibility with phonegap applications running on Windows
Phone 8.

Fixed a bug affecting Chrome, and potentially other browsers, that
prevented the SDK library from working correctly if, depending on the
case, "Block sites from setting any data" or "Block third-party cookies
and site data" was selected on the Content settings.

Fixed a bug introduced on version 6 that might have prevented the SDK
library to behave correctly if Websockets were not used (because of
configuration or network/browser/intermediaries capabilities) and a load
balancer using cookie stickiness was placed between the Client and the
servers.

## 6.1.1 build 1640

<i>Compatible with Lightstreamer Server since 5.1.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 10 Mar 2014</i>

Fixed an issue with Chrome 33 and greater, where a harmless request for
a page named "null" was performed to the web server.

Fixed an issue, introduced on version 6.1, with the Rekonq browser, that
prevented the SDK library from correctly starting up.

Fixed a bug that in rare cases could have prevented the recovery of a
shared connection in case of closure of the "master" Client.

Fixed an issue with Node.js on Linux that was observed in particular
scenarios and, in these cases, prevented the connection.

## 6.1 build 1634

<i>Compatible with Lightstreamer Server since 5.1.</i><br/>
<i>May not be compatible with code developed with the previous version; see
compatibility notes below.</i><br/>
<i>Not compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 19 Feb 2014</i>

Removed the need of cookie usage in most situations.

Added a onClearSnapshot callback to the SubscriptionListener. The
callback will be invoked upon a corresponding invocation of
"clearSnapshot" on the Adapter side for one of the subscribed items
(provided that the Subscription is for DISTINCT or COMMAND mode) with
the request to accomplish the specified action. Note that the
"clearSnapshot" invocation is not available for Servers lower than
version 6.0.<br/>
<b>COMPATIBILITY NOTE:</b> <i>Existing code will keep working as long
as, on the Adapter side, "clearSnapshot" is not used for items in
DISTINCT or COMMAND mode; otherwise, the item state on the Client may
become inconsistent, hence implementing the new callback would be
mandatory.</i>

Added a default handling of the onClearSnapshot event in the
AbstractGrid class that's thus reflected on subclasses:\
 All the rows/charts associated to an item receiveng the onClearSnapshot
event are removed from the widget.

Fixed a bug that in rare cases could have made the Client send
wrong-composed requests to Lightstreamer Server. The bug had two
effects, none of which caused any actual issue: the Client may have sent
extra useless requests; in response to such requests the Server would
have logged error messages in the log.

Fixed a bug that prevented the correct execution of
VisualUpdate.setCellValue calls having null as second parameter.

Expand the ConnectionOptions.setForcedTransport method to accept "HTTP"
and "WS" values. These new values force the Client to only use the
related transport without forcing it into using a fixed connection
method (i.e.: POLLING or STREAMING).

Fix a bug on the StaticGrid. Once sorted it may have routed updates to
the wrong rows.

Extended the Chart implementation to accept nulls as chart values. Nulls
have now special meanings: a single null (either on the X or Y axis)
will make the Chart ignore the update, a double null (on both the X and
Y axis) will clear the involved ChartLine.<br/>
<b>COMPATIBILITY NOTE:</b> <i>existing
code will keep working as long as the rule imposing to only feed the
Chart with valid numbers was respected. If not it is possible to
leverage parsers for the Chart.setXAxis and Chart.addYAxis methods to
prevent nulls to reach the internal Chart engine.</i>

Improved Node.js compatibility.

Revised the directory structure of the included examples.

Clarified the license terms for the included example source code.

Incremented the minor version number.<br/>
<b>COMPATIBILITY NOTE:</b> <i>If running
Lightstreamer Server with a license file that supports Web Client SDK up
to version 6.0 or earlier, clients based on this new version will not be
accepted by the Server.</i>

## 6.0.1 build 1603

<i>Compatible with Lightstreamer Server since 5.1.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 31 Jan 2013</i>

Improved the Chart class: now charts are printed using the \<canvas\>
element. If \<canvas\> is not available the SDK library will switch to
the previous behavior.

Fixed an issue that may crash IE7 in case the SDK library needs to
fallback to the "Unoptimized HTTP Polling".

Improved compatibility between Opera and the "Unoptimized HTTP Polling".

Fixed a bug on the StaticGrid class: if the grid was bound to a COMMAND
or DISTINCT Subscription and there were more cells bound to the same
field then the grid would have stopped showing updates on the HTML after
a clean or scroll operation.

## 6.0.1 build 1599

<i>Compatible with Lightstreamer Server since 5.1.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 10 Jan 2013</i>

Fixed a bug introduced on build 1595: UNORDERED messages may have been
repeated if the session connection was "Unoptimized Polling over HTTP"
(see http://goo.gl/kwREX for reference).

## 6.0.1 build 1595

<i>Compatible with Lightstreamer Server since 5.1.</i><br/>
<i>Compatible with code developed with the previous version.</i><br/>
<i>Compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 20 Dec 2012</i>

Removed a potential memory leak: the disposal of a LightstreamerClient
instance was leaving some resources behind.

Fixed generator.html to work on browsers when/where the console instance
is not available.

Introduced a better handling of proxies that can forward the WebSocket
handshake but can't properly handle the open WebSocket.

Fixed an issue with Firefox that might have caused a reconnection
attempt to hang for many seconds after Lightstreamer Server had been
unavailable for a while.

Fixed handling of string parameters entered in the ConnectionDetails and
ConnectionOptions objects: a parameter supposed to be a string may have
been mistakenly parsed as a number resulting in heading 0 and . to be
removed.

Improved style of the StatusWidget appearance by replacing any globally
set BackgroundColor with a transparent one.

Added some missing [optional] flags to the documentation.

Fixed a bug in the Subscription class: when used in COMMAND mode, the
"key" field of a "row" might have been mistakenly empty if such "row"
was removed (via a DELETE command) and then added again (via an ADD
command) by the adapter.

Fixed a bug in the ItemUpdate.isValueChanged method: when used against a
second-level field an erroneous true was returned.

Removed a 100/200 ms delay on subscriptions and messages that was
erroneously introduced client-side. In case of file:/// executions the
delay may also have been suffered during the dequeuing of received
updates.

Improved send message performances.

Improved fallback mechanisms for Android stock browser.

Extended the supplied Monitor Demo with the newly available
message-related statistics.

Added an example of integration with the Dojo libraries. Actually the
example is hosted on GitHub and only a link is provided.

Included in the Client Guide document notes on how to configure the
RequireJS optimization tool for use with a code including the JavaScript
Client SDK library.

## 6.0 build 1576

<i>Compatible with Lightstreamer Server since 5.0.</i><br/>
<i>Not compatible with code developed with the old SDK for HTML Clients.</i><br/>
<i>Not compatible with the previous version of the SDK for Flash Clients.</i><br/>
<i>Released on 3 Aug 2012</i>

Introduced the new JavaScript Client SDK, which replaces the old HTML
Client SDK with a brand new, fully redesigned, API and extended
features, including:

-   full support for WebSockets
-   single-js-file library
-   AMD-based modularization
-   generator tool for deployment of library subsets (based on modules)
-   support for out-of-browser apps (Node.js, PhoneGap, etc.)
-   faster Stream-Sense algorithm
-   support for cross-origin connections
-   new logging facility and error handling
-   new ready-made widgets, including a status indicator

See the included documentation for any details.\
 The HTML Client SDK library shipped with the previous versions of
Lightstreamer is still supported by Lightstreamer Server since Server
version 4.0.
