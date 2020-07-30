# Lightstreamer Client SDK

Lightstreamer Client SDK enables any JavaScript application running in a web browser or in a Node.js container to communicate bidirectionally with a **Lightstreamer Server**. The API allows to subscribe to real-time data pushed by the server, to display such data, and to send any message to the server.

The library offers automatic recovery from connection failures, automatic selection of the best available transport, and full decoupling of subscription and connection operations. It is responsible of forwarding the subscriptions to the Server and re-forwarding all the subscriptions whenever the connection is broken and then reopened.

The library also offers support for Web Push Notifications on Apple platforms via **Apple Push Notification Service (APNs)** and  Google platforms  via  **Firebase Cloud Messaging (FCM)**. With Web Push, subscriptions deliver their updates via push notifications even when the application is offline. 

## Quickstart

To connect to a Lightstreamer Server, a [LightstreamerClient](https://lightstreamer.com/api/ls-web-client/latest/LightstreamerClient.html) object has to be created, configured, and instructed to connect to the Lightstreamer Server. 
A minimal version of the code that creates a LightstreamerClient and connects to the Lightstreamer Server on *https://push.lightstreamer.com* will look like this:

```
var client = new LightstreamerClient("https://push.lightstreamer.com/","DEMO");
client.connect();
```

For each subscription to be subscribed to a Lightstreamer Server a [Subscription](https://lightstreamer.com/api/ls-web-client/latest/Subscription.html) instance is needed.
A simple Subscription containing three items and two fields to be subscribed in *MERGE* mode is easily created (see [Lightstreamer General Concepts](https://lightstreamer.com/docs/ls-server/latest/General%20Concepts.pdf)):

```
var sub = new Ls.Subscription("MERGE",["item1","item2","item3"],["stock_name","last_price"]);
sub.setDataAdapter("QUOTE_ADAPTER");
sub.setRequestedSnapshot("yes");
client.subscribe(sub);
```

Before sending the subscription to the server, usually at least one [SubscriptionListener](https://lightstreamer.com/api/ls-web-client/latest/SubscriptionListener.html) is attached to the Subscription instance in order to consume the real-time updates. The following code shows the values of the fields *stock_name* and *last_price* each time a new update is received for the subscription:

```
sub.addListener({
    onItemUpdate: function(obj) {
      console.log(obj.getValue("stock_name") + ": " + obj.getValue("last_price"));
    }
});
```

Below is the complete JavaScript code embedded in an HTML page:

```
<html>
<head>
    <script src="https://unpkg.com/lightstreamer-client-web/lightstreamer.min.js"></script>
    <script>
    var client = new Ls.LightstreamerClient("https://push.lightstreamer.com","DEMO");  
    client.connect();
    
    var sub = new Ls.Subscription("MERGE",["item1","item2","item3"],["stock_name","last_price"]);
    sub.setDataAdapter("QUOTE_ADAPTER");
    sub.setRequestedSnapshot("yes");
    sub.addListener({
        onItemUpdate: function(obj) {
          console.log(obj.getValue("stock_name") + ": " + obj.getValue("last_price"));
        }
    });
    client.subscribe(sub);
    </script>
</head>
<body>
</body>
</html>
```

## Logging

To enable the internal client logger, create a [LoggerProvider](https://lightstreamer.com/api/ls-web-client/latest/LoggerProvider.html) and set it as the default provider of [LightstreamerClient](https://lightstreamer.com/api/ls-web-client/latest/LightstreamerClient.html).

```
var loggerProvider = new SimpleLoggerProvider();
loggerProvider.addLoggerAppender(new ConsoleAppender("DEBUG", "*"));
LightstreamerClient.setLoggerProvider(loggerProvider);
```

If you want to make a customized build of the client library, make sure the classes [SimpleLoggerProvider](https://lightstreamer.com/api/ls-web-client/latest/SimpleLoggerProvider.html) and [ConsoleAppender](https://lightstreamer.com/api/ls-web-client/latest/ConsoleAppender.html) are included in the configuration file *build.config.js*.

## npm Packages ##

- [npm Web Package](https://www.npmjs.com/package/lightstreamer-client-web)

- [npm Node.js Package](https://www.npmjs.com/package/lightstreamer-client-node)

## Building ##

To build the library, enter the directory *tools* and run the command *node build.js*.

The scripts generates the following builds for the Web platform (saved in *tools/dist*):

|           | **UMD**                                               | **CommonJS**                  | **ES Module**              |
|-----------|-------------------------------------------------------|-------------------------------|----------------------------|
| **Build** | lightstreamer.js<br> lightstreamer.min.js             | lightstreamer.common.js       | lightstreamer.esm.js       |

and the following ones for the Node.js platform (saved in *tools/dist-node*):

|           | **CommonJS**                                          | 
|-----------|-------------------------------------------------------|
| **Build** | lightstreamer-node.js<br> lightstreamer-node.min.js   |

For the build options, see the configuration file *tools/build.config.js*.

## Logmaps

In order to shrink the size of the library, it is possible to substitute the log messages produced by the library when the internal logger is enabled with numeric codes by commenting out the dependency *source/LogMessages* from the configuration file *build.config.js*. When *source/LogMessages* is excluded from the build, the build script generates an additional logmap file, which maps the numeric codes to the original log messages.

To decode an encoded log file, invoke the script *tools/decode-logs.js* passing as arguments the encoded log file and the logmap file generated by the build script. The decoded log is printed to the console.

For example:

```
node decode-logs log.txt lightstreamer.min.js.logmap
```

## Compatibility ##

The library requires Server 7.1 and breaks the compatibility with Server version 7.0. 
*However, if Web Push Notifications are not used, compatibility with Server version 7.0 is still ensured.*

## Documentation

- [Live demos](https://demos.lightstreamer.com/)

- [Web API Reference](https://lightstreamer.com/api/ls-web-client/latest/)

- [Web Client Guide](docs/WebClientGuide.adoc)

- [Node.js API Reference](https://www.lightstreamer.com/api/ls-nodejs-client/latest/)

## Support

For questions and support please use the [Official Forum](https://forums.lightstreamer.com/). The issue list of this page is **exclusively** for bug reports and feature requests.

## License

[Apache 2.0](https://opensource.org/licenses/Apache-2.0)
