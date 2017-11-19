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

// function customPush () {
//     myNavigator.pushPage('pageNav1.html', { data: { title: myNavigator.topPage.querySelector('ons-input').value } })
// }
//
// function customPush2 (event) {
//     myNavigator.pushPage('pageNav2.html', { data: { cardTitle: event.target.textContent } })
// }

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
    $(document).on('deviceready', function (event) {

        event.preventDefault();

        document.addEventListener('init', function(event) {

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
                //make sure it's populated
                // setTimeout(setInitialMatch, 1000);
            }

            //setup menu click binding
            $(document).off().on("click", "#menu-settings", function () {
                fn.load('settings-page.html');
            });

            $(document).off().on("click", "#menu-match", function () {
                fn.load('match-page.html');
            });

            $(document).off().on("click", "#menu-match-map", function () {
                fn.load('match-map-page.html');
            });

            $(document).off().on("click", ".hamburger-menu", function() {
                fn.open();
            });

            if (event.target.matches('#settings-page')) {

                //set initial breed list to dog
                updateBreedSelect('dog');

                $(document).off().on("click", "#x-button", function() {
                    closeModal();
                });
                $(document).off().on("click", "#got-it-button", function() {
                    closeModal();
                });

                if (firstLoad) {
                    $('#new-user-info').show();
                    firstLoad = false;
                }

                $(document).off().on("click", "#dog-button", function() {
                    selectAnimal('dog');
                });
                $(document).off().on("click", "#cat-button", function() {
                    selectAnimal('cat');
                });
                $(document).off().on("click", "#reptile-button", function() {
                    selectAnimal('reptile');
                });
                $(document).off().on("click", "#horse-button", function() {
                    selectAnimal('horse');
                });$(document).off().on("click", "#bird-button", function() {
                    selectAnimal('bird');
                });
                $(document).off().on("click", "#smallfurry-button", function() {
                    selectAnimal('smallfurry');
                });
                $(document).off().on("click", "#submit-button", function() {
                    submitSettings();
                });






                // function setInitialMatch() {
                //     $("#no-more-matches-text").remove();
                //     $("#matches-pet-photo").removeClass("no-more-matches");
                //     var cachedPetsArray = storage.getArray("petsArray");
                //     var fullSizePhotos = cachedPetsArray[0].photos;
                //     if(fullSizePhotos !== []) {
                //         $('#matches-pet-photo').attr("src", fullSizePhotos[0]);
                //     } else {
                //         $('#matches-pet-photo').attr("src", "../assets/icons/dog.svg");
                //     }
                //     $('#matches-pet-info').empty();
                //     $('#matches-pet-info').append(cachedPetsArray[0].name + " | " + cachedPetsArray[0].age + " |" +
                //         " " + (cachedPetsArray[0].gender === "M" ? "Male" : "Female") + " | " +
                //         petSizeAbbreviationToFull(cachedPetsArray[0].size));
                // }
                //
                // function petSizeAbbreviationToFull(abbreviation) {
                //     switch (abbreviation) {
                //         case 'S':
                //             return "Small";
                //             break;
                //         case 'M':
                //             return "Medium";
                //             break;
                //         case 'L':
                //             return "Large";
                //             break;
                //         case 'XL':
                //             return "Extra Large";
                //             break;
                //     }
                // }
                //

            }

            if (event.target.matches('#matches-page')) {

            }
            if (event.target.matches('#pageNav1')) {
                $(document).off().on("click", "#page1-push", function() {
                    $('#myNavigator').pushPage('pageNav1.html');
                });
                $(document).off().on("click", "#page1-pop", function() {
                    $('#myNavigator').popPage();
                });

                // var title = event.target.data && event.target.data.title ? event.target.data.title : 'Custom Page';
                // event.target.querySelector('ons-toolbar div.center').textContent = title;
            }
            if (event.target.matches('#pageNav2')) {
                $(document).off().on("click", ".page2-push", function() {
                    $('#myNavigator').pushPage('pageNav2.html');
                });

                // var cardTitle = event.target.data && event.target.data.cardTitle ? event.target.data.cardTitle : 'Custom Card';
                // event.target.querySelector('ons-card div.title').textContent = cardTitle;
            }

        }, false);

    });

})();

// (function() {
//
//     $(document).on("pagecreate", "#settings-page", function(e) {
//
//         e.preventDefault();
//
//         function onDeviceReady () {
//
//             setTimeout(function () {
//                 $("#new-user-info").popup("open");
//             }, 500);
//             // setInitialBreedSelect();
//             // var url = "http://api.petfinder.com/pet.getRandom?format=json&key=3a62ece31719a64dcf6726980917d7ad&animal=dog&output=basic&callback=?"
//
//
//             function addSettingsToLocalStorage(settings) {
//
//                 if (storage.getItem('animalType')) {
//                     storage.removeItem('animalType');
//                 }
//                 if (storage.getItem('location')) {
//                     storage.removeItem('location');
//                 }
//                 if (storage.getItem('zip')) {
//                     storage.removeItem('zip');
//                 }
//                 if (storage.getItem('age')) {
//                     storage.removeItem('age');
//                 }
//                 if (storage.getItem('sex')) {
//                     storage.removeItem('sex');
//                 }
//                 if (storage.getItem('breed')) {
//                     storage.removeItem('breed');
//                 }
//
//                 storage.setItem('animalType', settings.animalType);
//                 storage.setItem('location', settings.location);
//                 storage.setItem('zip', settings.zip);
//                 storage.setItem('age', settings.age);
//                 storage.setItem('sex', settings.sex);
//                 storage.setItem('breed', settings.breed);
//             }
//
//         }
//
//         $(document).on("deviceready", onDeviceReady);
//
//     });
//
// })();