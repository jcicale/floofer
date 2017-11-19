(function() {
    $(document).on("pageinit", "#settings-page", function(e) {

        e.preventDefault();

        function onDeviceReady() {

            function onSuccess(location) {

                var locationTime = Date(location.timestamp);

                var myLatitude = location.coords.latitude;

                var myLongitude = location.coords.longitude;

                var myAltitude = location.coords.altitude;

                var myHeading = location.coords.heading;

                console.log("found location successfully!")
                console.log("My latitude = " + myLatitude);
                console.log("My longitude = " + myLongitude);
                console.log("My heading = " + myHeading + " at an altitude of " + myAltitude);
                console.log("Results recorded at " + locationTime);
            }

            function onFail(error) {
                console.log("location error code = "+error.code+" message = "+error.message);
            }

            function getLocation() {
                navigator.geolocation.getCurrentPosition(onSuccess,
                    onFail, {
                        timeout: 15000,
                        enableHighAccuracy: true
                    });
            }

            $("#settings-submit-button").on("tap", function(e) {
                e.preventDefault();
                if($("#location-flip").val() === "on") {
                    getLocation();
                }

            });

        }

        $(document).on("deviceready", onDeviceReady);
    });

})();