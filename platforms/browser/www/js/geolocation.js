(function() {

    document.addEventListener('deviceready', function(event) {

        event.preventDefault();

        function onsInitGeolocation() {



        }

        document.addEventListener("init", onsInitGeolocation, false);
    });

})();