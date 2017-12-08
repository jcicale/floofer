cordova.define("com.juliacicale.floofer.CustomPluginFloofer.CustomPluginFloofer", function(require, exports, module) { var exec = require('cordova/exec');

var pupPlugin = {

  getPup:function(pup, successCallback, errorCallback) {

    cordova.exec(
      successCallback,
      errorCallback,
      'CustomPluginFloofer',
      'getPup',
      [{
        "pup": pup
      }]
    );

  }
}

module.exports = pupPlugin;
});
