cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-plugin-device.device",
        "file": "plugins/cordova-plugin-device/www/device.js",
        "pluginId": "cordova-plugin-device",
        "clobbers": [
            "device"
        ]
    },
    {
        "id": "cordova-plugin-geolocation.geolocation",
        "file": "plugins/cordova-plugin-geolocation/www/android/geolocation.js",
        "pluginId": "cordova-plugin-geolocation",
        "clobbers": [
            "navigator.geolocation"
        ]
    },
    {
        "id": "cordova-plugin-geolocation.PositionError",
        "file": "plugins/cordova-plugin-geolocation/www/PositionError.js",
        "pluginId": "cordova-plugin-geolocation",
        "runs": true
    },
    {
        "id": "cordova-plugin-splashscreen.SplashScreen",
        "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
        "pluginId": "cordova-plugin-splashscreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.3.2",
    "cordova-plugin-device": "1.1.6",
    "cordova-plugin-compat": "1.2.0",
    "cordova-plugin-geolocation": "2.4.3",
    "cordova-plugin-splashscreen": "4.0.3"
};
// BOTTOM OF METADATA
});