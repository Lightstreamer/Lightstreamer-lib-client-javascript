import IllegalStateException from "../../src-tool/IllegalStateException";
  export default function(client) {
    return {
      "enableSharing": function() {
        throw new IllegalStateException("ConnectionSharing is not included in the Lightstreamer library");
      },
      "isMaster": function() {
        return client.isMaster();
      }
    };
  };
