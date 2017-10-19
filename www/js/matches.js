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
            var matchIndex = 1;


            $( "div.profile-container" ).on( "swipeleft", function(  ) {
                $("div.profile-container").addClass("swipe-left")
                // When the transition is done...
                    .on("webkitTransitionEnd transitionend otransitionend", function () {
                        // ...the list item will be removed
                        $("div.profile-container").empty().removeClass("swipe-left");
                    });
                //wait a second before popping in the next one
                setTimeout(function () {
                    $("div.profile-container").prepend("<div" +
                        " class='ui-block-a" +
                        " pet-photo'><img" +
                        " src=''" +
                        " id='matches-pet-photo'></div><div class='pet-description'><p" +
                        " id='matches-pet-info'></p></div>" +
                        "");
                    populateNextMatch();
                }, 500);


                matchIndex++;
            });

            function populateNextMatch() {
                var cachedPetsArray = storage.getArray("petsArray");
                var fullSizePhotos = getFullSizePhotosForSinglePet(matchIndex, cachedPetsArray);
                console.log(fullSizePhotos);
                if(fullSizePhotos !== []) {
                    $('#matches-pet-photo').attr("src", fullSizePhotos[0]);
                } else {
                    $('#matches-pet-photo').attr("src", "../assets/icons/dog.svg");
                }
                $('#matches-pet-info').empty();
                $('#matches-pet-info').append(cachedPetsArray[matchIndex].name + " | " + cachedPetsArray[matchIndex].age + " |" +
                    " " + (cachedPetsArray[matchIndex].gender === "M" ? "Male" : "Female") + " | " +
                    petSizeAbbreviationToFull(cachedPetsArray[matchIndex].size));
            }

            function getFullSizePhotosForSinglePet(petIndex, cachedPetsArray) {
                var fullSizePhotos = [];
                if (cachedPetsArray[petIndex].photos) {
                    for (var i = 0; i < cachedPetsArray[petIndex].photos.length; i++) {
                        if (cachedPetsArray[petIndex].photos[i]['@size'] === "pn") {
                            fullSizePhotos.push(cachedPetsArray[petIndex].photos[i].$t);
                        }
                    }
                }
                return fullSizePhotos;
            }

            function petSizeAbbreviationToFull(abbreviation) {
                switch (abbreviation) {
                    case 'S':
                        return "Small";
                        break;
                    case 'M':
                        return "Medium";
                        break;
                    case 'L':
                        return "Large";
                        break;
                    case 'XL':
                        return "Extra Large";
                        break;
                }
            }

        }

        $(document).on("pageload", onPageLoad());

    });

})();
