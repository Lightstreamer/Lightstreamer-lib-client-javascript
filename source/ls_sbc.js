import ConnectionSharing from "./ConnectionSharing";
  export default function(client) {
    return {
      "enableSharing": function(n,p1,p2,c,s) {
        if (p1 == p2 && p1 == "ABORT") {
          client.enableSharing(null);
        } else {
          client.enableSharing(new ConnectionSharing(n, p1, p2, c, s));
        }
      },
      "isMaster": function() {
        return client.isMaster();
      }
    };
  };
