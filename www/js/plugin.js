(function (global) {
    "use strict";

    function onDeviceReady() {
        setTimeout(loadMapsApi, 3000);
    }



    document.addEventListener("deviceready", onDeviceReady, false);
})(window);