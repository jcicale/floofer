const API_KEY = '2350ef4b4c00d28ac3a15bf88648b19e';

//general navigation functions
window.fn = {};

window.fn.open = function () {
    var menu = document.getElementById('menu');
    menu.open();
};

window.fn.load = function (page) {
    var menu = document.getElementById('menu');
    var myNavigator = document.getElementById('myNavigator');

    // if(page == 'matches-page.html' && settings.neverSet) {
    //     alert('You have to choose settings first!');
    //     menu.close();
    //     myNavigator.resetToPage('settings-page.html', {animation: 'fade'});
    // } else {
    menu.close();
    myNavigator.resetToPage(page, { animation: 'fade' });
    // }

};

//setting up localStorage
var storage = window.localStorage;

Storage.prototype.setArray = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
};
Storage.prototype.getArray = function(key) {
    return JSON.parse(this.getItem(key))
};

//global vars for settings
var firstLoad = true;

var animalType = null;

var settings = {
    animalType: null,
    location: false,
    zip: null,
    age: "any",
    size: "any",
    sex: "any",
    breed: "any",
    neverSet: true
};


(function() {
    document.addEventListener('deviceready', function (event) {

        event.preventDefault();

        function onsInit(event) {
            //properties - initial page load
            var page = event.target;
            console.log("page-event="+page.id);
            //load main menu and navigation
            onsMenu();
            //check home page
            if (page.id === 'splitter') {
                //set initial breed list to dog
                updateBreedSelect('dog');

                $("#x-button").off().on("click", function() {
                    closeModal();
                });
                $('#got-it-button').off().on("click", function() {
                    closeModal();
                });

                if (firstLoad) {
                    $('#new-user-info').show();
                    firstLoad = false;
                }

                $("#dog-button").off().on("click", function() {
                    selectAnimal('dog');
                });
                $("#cat-button").off().on("click", function() {
                    selectAnimal('cat');
                });
                $("#reptile-button").off().on("click", function() {
                    selectAnimal('reptile');
                });
                $("#horse-button").off().on("click", function() {
                    selectAnimal('horse');
                });$("#bird-button").off().on("click", function() {
                    selectAnimal('bird');
                });
                $("#smallfurry-button").off().on("click", function() {
                    selectAnimal('smallfurry');
                });
                $("#submit-button").off().on("click", function() {
                    submitSettings();
                });

            }

            if (page.matches('matches-page')) {
                function setInitialMatch() {
                    $("#no-more-matches-text").remove();
                    $("#matches-pet-photo").removeClass("no-more-matches");
                    var cachedPetsArray = storage.getArray("petsArray");
                    var fullSizePhotos = cachedPetsArray[0].photos;
                    if(fullSizePhotos !== []) {
                        $('#matches-pet-photo').attr("src", fullSizePhotos[0]);
                    } else {
                        $('#matches-pet-photo').attr("src", "../assets/icons/dog.svg");
                    }
                    $('#matches-pet-info').empty();
                    $('#matches-pet-info').append(cachedPetsArray[0].name + " | " + cachedPetsArray[0].age + " |" +
                        " " + (cachedPetsArray[0].gender === "M" ? "Male" : "Female") + " | " +
                        petSizeAbbreviationToFull(cachedPetsArray[0].size));
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
            if (page.matches('pageNav1')) {
                $("#page1-push").off().on("click", function() {
                    $('#myNavigator').pushPage('pageNav1.html');
                });
                $("#page1-pop").off().on("click", function() {
                    $('#myNavigator').popPage();
                });

            }
            if (page.matches('pageNav2')) {
                $(".page2-push").off().on("click", function() {
                    $('#myNavigator').pushPage('pageNav2.html');
                });

            }
        }

        function onsMenu () {
            $("#menu-settings").off().on("click", function () {
                fn.load('settings-page.html');
            });

            $("#menu-match").off().on("click", function () {
                fn.load('match-page.html');
            });

            $("#menu-match-map").off().on("click", function () {
                fn.load('match-map-page.html');
            });

            $(".hamburger-menu").off().on("click", function() {
                fn.open();
            });
        }

        //settings helper functions
        function closeModal () {
            document.getElementById('new-user-info').hide();
        }

        function selectAnimal (animal) {
            if (animalType) {
                document.getElementById(animalType + "-button").classList.remove('selected');
            }
            animalType = animal;
            document.getElementById(animal + "-button").classList.add('selected');

            updateBreedSelect(animal);
        }

        function buildQueryUrl (settings) {
            if (settings.animalType && (settings.zip !== "" || settings.location !== "off")) {
                var queryUrl = "http://api.petfinder.com/pet.find?format=json&key=" + API_KEY;

                queryUrl += "&animal=" + settings.animalType;

                if (settings.zip) {
                    queryUrl += "&location=" + settings.zip;
                }
                if (settings.age !== "any") {
                    queryUrl += "&age=" + settings.age;
                }
                if (settings.size !== "any") {
                    queryUrl += "&size=" + settings.size;
                }
                if (settings.sex !== "any") {
                    queryUrl += "&sex=" + settings.sex;
                }
                if (settings.breed !== "any") {
                    queryUrl += "&breed=" + settings.breed;
                }
                queryUrl += "&callback=?";
                console.log(queryUrl);
                return queryUrl;
            }
            alert("You have to select type of animal and location!");
        }

        function updateBreedSelect (breed) {
            var url = "http://api.petfinder.com/breed.list?format=json&key=" + API_KEY + "&animal=" + breed + "&callback=?";
            populateBreedList(url);
        }

        function populateBreedList (queryUrl) {

            $.getJSON(queryUrl, function (data) {
                console.log(data);

                var breeds = data.petfinder.breeds.breed;

                $('#dynamic-breed-select').empty();
                $('#dynamic-breed-select').append("<option value=\"any\">Any</option>");

                for (var i = 0; i < breeds.length; i ++) {
                    var breedString = breeds[i].$t;
                    $('#dynamic-breed-select').append("<option value=\"" + breedString + "\">" + breedString + "</option>");
                }
            });
        }

        function getFullSizePhotosForSinglePet (pet) {

            var fullSizePhotos = [];

            if (pet.media.photos) {
                for (var i = 0; i < pet.media.photos.photo.length; i++) {
                    if (pet.media.photos.photo[i]['@size'] === "pn") {
                        fullSizePhotos.push(pet.media.photos.photo[i].$t);
                    }
                }

            }
            return fullSizePhotos;
        }

        function submitSettings () {
            storage.clear();

            settings.animalType = animalType;
            settings.location = $("#location-services-switch").val();
            settings.zip = $("#zip-input").val();
            settings.age = $("#age-select").val();
            settings.size = $("#size-select").val();
            settings.sex = $("#gender-select").val();
            settings.breed = $("#breed-select").val();

            if (settings.animalType && (settings.location || settings.zip)) {
                settings.neverSet = false;

                $.getJSON(buildQueryUrl(settings), function (data) {
                    console.log(data);

                    // if (storage.getArray("petsArray")) {
                    //     storage.removeItem("petsArray");
                    // }

                    var petsArray = [];
                    for (var i = 0; i < data.petfinder.pets.pet.length; i++) {

                        if (data.petfinder.pets.pet[i].media.photos) {
                            var fullSizePhotos = getFullSizePhotosForSinglePet(data.petfinder.pets.pet[i]);
                        }

                        if (data.petfinder.pets.pet[i].options && data.petfinder.pets.pet[i].media.photos) {
                            petsArray.push({
                                name: data.petfinder.pets.pet[i].name.$t,
                                age: data.petfinder.pets.pet[i].age.$t,
                                gender: data.petfinder.pets.pet[i].sex.$t,
                                size: data.petfinder.pets.pet[i].size.$t,
                                breed: data.petfinder.pets.pet[i].breeds.breed,
                                id: data.petfinder.pets.pet[i].id.$t,
                                options: data.petfinder.pets.pet[i].options.option,
                                photos: fullSizePhotos
                            });
                        } else if (data.petfinder.pets.pet[i].options) {
                            petsArray.push({
                                name: data.petfinder.pets.pet[i].name.$t,
                                age: data.petfinder.pets.pet[i].age.$t,
                                gender: data.petfinder.pets.pet[i].sex.$t,
                                size: data.petfinder.pets.pet[i].size.$t,
                                breed: data.petfinder.pets.pet[i].breeds.breed,
                                id: data.petfinder.pets.pet[i].id.$t,
                                options: data.petfinder.pets.pet[i].options.option,
                                photos: "null"
                            });
                        } else if (data.petfinder.pets.pet[i].media.photos) {
                            petsArray.push({
                                name: data.petfinder.pets.pet[i].name.$t,
                                age: data.petfinder.pets.pet[i].age.$t,
                                gender: data.petfinder.pets.pet[i].sex.$t,
                                size: data.petfinder.pets.pet[i].size.$t,
                                breed: data.petfinder.pets.pet[i].breeds.breed,
                                id: data.petfinder.pets.pet[i].id.$t,
                                photos: fullSizePhotos,
                                options: "null"

                            });
                        } else {
                            petsArray.push({
                                name: data.petfinder.pets.pet[i].name.$t,
                                age: data.petfinder.pets.pet[i].age.$t,
                                gender: data.petfinder.pets.pet[i].sex.$t,
                                size: data.petfinder.pets.pet[i].size.$t,
                                breed: data.petfinder.pets.pet[i].breeds.breed,
                                photos: "null",
                                options: "null"
                            });
                        }

                    }

                    storage.setArray("petsArray", petsArray);

                });
            }
            // setInitialMatch();
        }

        document.addEventListener('init', onsInit, false);
        // setTimeout(onsInit, 1000);

    }, false);

})();
