function require() {}

var module = {};
module.config = function() {}; // requirejs module configuration (see https://requirejs.org/docs/api.html#config-moduleconfig)
module.exports = {};
var exports = {};

function define() {}
define.amd = {};

var process = {};
process.execPath = {};
process.v8 = {};
process.node = {};
process.versions = {};
process.versions.node = {};
process.versions.v8 = {};
process.nextTick = function() {};

window.OpenAjax = {};
window.OpenAjax.hub = {};
window.OpenAjax.hub.registerLibrary = function() {};

// these modules don't export their names as required by Google Closure Compiler, so they need an extra configuration
var Inheritance =  function() {};
Inheritance._super_ =  {};
Inheritance._callSuperConstructor =  function() {};
Inheritance._callSuperMethod =  function() {};
