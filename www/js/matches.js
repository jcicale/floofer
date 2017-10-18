(function() {

    $("#matches-page").on("pagecreate", function(e) {

        e.preventDefault();

        function onPageLoad () {
            //set up storage
            var storage = window.localStorage;

            Storage.prototype.getArray = function(key) {
                return JSON.parse(this.getItem(key))
            };
            //set up match index
            var matchIndex = 0;

            function getFullSizePhotos(index) {
                var cachedPetsArray = storage.getArray("petsArray");
                var fullSizePhotos = [];
                for (var i = 0; i < cachedPetsArray[index].photos.length; i++) {
                    if (cachedPetsArray[index].photos[i]['@size'] === "pn") {
                        fullSizePhotos.push(cachedPetsArray[index].photos[i].$t);
                    }
                }
                return fullSizePhotos;
            }


            $( "div.profile-container" ).on( "swipeleft", function( event ) {

            });

        }

        $(document).on("pageload", onPageLoad());

    });

})();
