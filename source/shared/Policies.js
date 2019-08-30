
  export default {
    ATTACH: "ATTACH",
    FAST: "ATTACH:FAST", //sharePolicyOnFound ?ATTACH:FAST? means that when searching for an engine it will behave as if enableFasterSeekEngine(true) was called on client 5
    IGNORE: "IGNORE", //sharePolicyOnFound ?IGNORE? means that the client will behave using the sharePolicyOnNotFound policy even if it finds an engine.
    ABORT: "ABORT",
    CREATE: "CREATE",
    WAIT: "WAIT"
  };

