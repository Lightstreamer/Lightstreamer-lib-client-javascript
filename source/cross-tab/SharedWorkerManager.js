import Environment from "../../src-tool/Environment";
  export default {
    canGenerate: function() {
      return Environment.isBrowserDocument() && typeof SharedWorker !== "undefined" && typeof Blob !== "undefined" && window.URL;
    },

    createWorker: function(code) {
      var blob = new Blob([code]);
      // Obtain a blob URL reference to our worker 'file'.
      var blobURL = window.URL.createObjectURL(blob);
      return blobURL;
    },


    removeWorker: function(blobURL) {
      window.URL.revokeObjectURL(blobURL);
    }
  }
