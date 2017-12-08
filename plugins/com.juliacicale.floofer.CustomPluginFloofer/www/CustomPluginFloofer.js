var exec = require('cordova/exec');

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