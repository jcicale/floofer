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

            $( "div.profile-container" ).on( "swipeleft", passPet);

            $( "div.profile-container" ).on( "swiperight", matchPet);

            $("#pass-button").on("tap", passPet);
            $("#want-button").on("tap", matchPet);

            function passPet() {
                $("div.profile-container").addClass("swipe-left")
                // When the transition is done...
                    .on("webkitTransitionEnd transitionend otransitionend", function () {
                        // ...the list item will be removed
                        $("div.profile-container").empty().removeClass("swipe-left");
                    });

                matchIndex++;
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
            }

            function matchPet() {
                var currentPet = storage.getArray("petsArray")[matchIndex];

                $("#match-popup-photo").attr("src", currentPet.photos[0]);
                $("#likes-you-too").empty().prepend(currentPet.name + " likes you too! :)");
                $("#pet-profile-icon").attr("src", getIconForAnimalType(storage.getItem("animalType")));

                $("div.profile-container").addClass("swipe-right")
                // When the transition is done...
                    .on("webkitTransitionEnd transitionend otransitionend", function () {
                        // ...the list item will be removed
                        $("div.profile-container").empty().removeClass("swipe-right");
                    });
                $("#its-a-match").popup("open");

                matchIndex++;
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
            }



            function populateNextMatch() {
                var cachedPetsArray = storage.getArray("petsArray");
                if(cachedPetsArray[matchIndex].photos !== []) {
                    $('#matches-pet-photo').attr("src", cachedPetsArray[matchIndex].photos[0]);
                } else {
                    $('#matches-pet-photo').attr("src", "../assets/icons/dog.svg");
                }
                $('#matches-pet-info').empty();
                $('#matches-pet-info').append(cachedPetsArray[matchIndex].name + " | " + cachedPetsArray[matchIndex].age + " |" +
                    " " + (cachedPetsArray[matchIndex].gender === "M" ? "Male" : "Female") + " | " +
                    petSizeAbbreviationToFull(cachedPetsArray[matchIndex].size));
            }


            function petSizeAbbreviationToFull(abbreviation) {
                switch (abbreviation) {
                    case 'S':
                        return "Small";
                    case 'M':
                        return "Medium";
                    case 'L':
                        return "Large";
                    case 'XL':
                        return "Extra Large";
                }
            }

            function getIconForAnimalType(animalType) {
                switch (animalType) {
                    case 'dog':
                        return "assets/icons/dog.png";
                    case 'cat':
                        return "assets/icons/cat.png";
                    case 'horse':
                        return "assets/icons/horse.png";
                    case 'reptile':
                        return "assets/icons/chameleon.png";
                    case 'bird':
                        return "assets/icons/parrot.png";
                    case 'smallfurry':
                        return "assets/icons/guinea-pig.png"
                }
            }

        }

        $(document).on("pageload", onPageLoad());

    });

})();
