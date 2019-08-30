const path = require('path');

module.exports = {
        
        sourceDir: path.resolve(__dirname, '..'),
        
        web: {
            esm: path.resolve(__dirname, 'dist/lightstreamer.esm.js'),
            cjs: path.resolve(__dirname, 'dist/lightstreamer.common.js'),
            umd: path.resolve(__dirname, 'dist/lightstreamer.js'),
            umd_min: path.resolve(__dirname, 'dist/lightstreamer.min.js'),
            /* Comment out the polyfills you don't need */
            polyfills: [
                'source/alt/PromisePolyfill'
            ],
            /*
             * Modules to be included.
             * To shrink the library, comment out the modules you don't need.
             */
            modules: [
                /* Base classes */
                "source/LightstreamerClient", // compatible with Web Workers
                "source/Subscription", // compatible with Web Workers
                "source/ConnectionSharing",
                "source/RemoteAppender", // compatible with Web Workers
                "source/MpnDevice", // compatible with Web Workers
                "source/MpnSubscription", // compatible with Web Workers
                "source/SafariMpnBuilder", // compatible with Web Workers
                "source/FirebaseMpnBuilder", // compatible with Web Workers
                "source/LogMessages", // compatible with Web Workers

                /* Widgets */
                "src-widget/Chart",
                "src-widget/DynaGrid",
                "src-widget/SimpleChartListener",
                "src-widget/StaticGrid",
                "src-widget/StatusWidget",

                /* Logging */
                "src-log/AlertAppender",
                "src-log/BufferAppender", // compatible with Web Workers
                "src-log/ConsoleAppender",
                "src-log/DOMAppender",
                "src-log/FunctionAppender", // compatible with Web Workers
                "src-log/SimpleLoggerProvider" // compatible with Web Workers
            ]
        },
        
        node: {
            cjs: path.resolve(__dirname, 'dist-node/lightstreamer-node.js'),
            cjs_min: path.resolve(__dirname, 'dist-node/lightstreamer-node.min.js'),
            /*
             * Modules to be included.
             * To shrink the library, comment out the modules you don't need.
             */
            modules: [
                /* Base classes */
                "source/LightstreamerClient",
                "source/Subscription",
                "source/RemoteAppender",
                "source/LogMessages",

                /* Logging */
                "src-log/BufferAppender",
                "src-log/ConsoleAppender",
                "src-log/FunctionAppender",
                "src-log/SimpleLoggerProvider"
            ]
        }
};