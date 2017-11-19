(function() {

    $("#matches-page").on("pagecreate", function(e) {

        e.preventDefault();
        var matchIndex;
        var petsList;
        var direction;

        function onPageLoad () {
            //set up storage
            var storage = window.localStorage;

            Storage.prototype.getArray = function(key) {
                return JSON.parse(this.getItem(key))
            };

            setTimeout(populatePetsList, 700);


            $( "div.profile-container" ).on( "swipeleft", function() {
                direction = "swipe-left";
                petFunction("swipe-left");
            });

            $( "div.profile-container" ).on( "swiperight", function() {
                direction = "swipe-right";
                petFunction("swipe-right");
            });

            $("#pass-button").on("tap", function() {
                direction = "swipe-left";
                petFunction("swipe-left");
            });

            $("#want-button").on("tap", function() {
                direction = "swipe-right";
                petFunction("swipe-right");
            });


            function populatePetsList() {
                matchIndex = 0;
                petsList = window.localStorage.getArray("petsArray");
                console.log(matchIndex);
                console.log(petsList);

            }

        $("div.profile-container").on("webkitTransitionEnd transitionend otransitionend", function() {
                if(direction === "swipe-left") {
                    $("div.profile-container").empty().removeClass("swipe-left").prepend("<div" +
                        " class='ui-block-a" +
                        " pet-photo'><img" +
                        " src=''" +
                        " id='matches-pet-photo'></div><div class='pet-description'><p" +
                        " id='matches-pet-info'></p></div>" +
                        "");
                }
                if (direction === "swipe-right") {
                    $("#its-a-match").popup("open");

                    $("div.profile-container").empty().removeClass("swipe-right").prepend("<div" +
                        " class='ui-block-a" +
                        " pet-photo'><img" +
                        " src=''" +
                        " id='matches-pet-photo'></div><div class='pet-description'><p" +
                        " id='matches-pet-info'></p></div>" +
                        "");
                }
            });

            function petFunction(direction){
                var currentPet = petsList[matchIndex];

                if(direction === "swipe-right") {
                    $("#match-popup-photo").attr("src", currentPet.photos[0]);
                    $("#likes-you-too").empty().prepend(currentPet.name + " likes you too! :)");
                    $("#pet-profile-icon").attr("src", getIconForAnimalType(storage.getItem("animalType")));
                }

                $("div.profile-container").addClass(direction);

                matchIndex++;
                setTimeout(populateNextMatch, 300);
            }

            function populateNextMatch() {

                if (petsList[matchIndex]) {
                    if (petsList[matchIndex].photos !== []) {
                        $('#matches-pet-photo').attr("src", petsList[matchIndex].photos[0]);
                    } else {
                        $('#matches-pet-photo').attr("src", "assets/icons/" + storage.getItem("animalType") +"-256.png");
                    }
                    $('#matches-pet-info').empty();
                    $('#matches-pet-info').append(petsList[matchIndex].name + " | " + petsList[matchIndex].age + " |" +
                        " " + (petsList[matchIndex].gender === "M" ? "Male" : "Female") + " | " +
                        petSizeAbbreviationToFull(petsList[matchIndex].size));
                } else {
                    $("#matches-pet-photo").attr("src", "assets/icons/" + storage.getItem("animalType") +"-256.png").addClass("no-more-matches");
                    $("#matches-pet-info").empty();
                    $("div.pet-photo").append("<p id='no-more-matches-text'>Uh oh! That's all the matches we could" +
                        " find for you right" +
                        " now. Why don't you try <a href='#settings-page'>adjusting your filters</a> or check out" +
                        " your current <a href='#'>match map</a> to see if there are any winners?</p>");
                }
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
