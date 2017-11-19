window.fn = {};

window.fn.open = function () {
    var menu = document.getElementById('menu');
    menu.open();
};

window.fn.load = function (page) {
    var menu = document.getElementById('menu');
    var myNavigator = document.getElementById('myNavigator');

    menu.close();
    myNavigator.resetToPage(page, { animation: 'fade' });
};

function customPush () {
    myNavigator.pushPage('pageNav1.html', { data: { title: myNavigator.topPage.querySelector('ons-input').value } })
}

function customPush2 (event) {
    myNavigator.pushPage('pageNav2.html', { data: { cardTitle: event.target.textContent } })
}

function closeModal () {
    document.getElementById('new-user-info').hide();
}

function selectAnimal(animal) {
    document.getElementById(animal + "-button").classList.add('selected');
}



(function() {
    document.addEventListener('init', function(event) {
        event.preventDefault();

        if (event.target.matches('#settings-page')) {
            $('#new-user-info').show();

            console.log('hello?');
            // Set up content...
        }
        if (event.target.matches('#pageNav1')) {
            var title = event.target.data && event.target.data.title ? event.target.data.title : 'Custom Page';
            event.target.querySelector('ons-toolbar div.center').textContent = title;
        }
        if (event.target.matches('#pageNav2')) {
            var cardTitle = event.target.data && event.target.data.cardTitle ? event.target.data.cardTitle : 'Custom Card';
            event.target.querySelector('ons-card div.title').textContent = cardTitle;
        }
    }, false);
})();







(function() {

    $(document).on("pagecreate", "#settings-page", function(e) {

        e.preventDefault();

        function onDeviceReady () {

            //setting up storage
            var storage = window.localStorage;

            Storage.prototype.setArray = function(key, obj) {
                return this.setItem(key, JSON.stringify(obj))
            };
            Storage.prototype.getArray = function(key) {
                return JSON.parse(this.getItem(key))
            };

            setTimeout(function () {
                $("#new-user-info").popup("open");
            }, 500);
            // setInitialBreedSelect();
            // var url = "http://api.petfinder.com/pet.getRandom?format=json&key=3a62ece31719a64dcf6726980917d7ad&animal=dog&output=basic&callback=?"

            $('#settings-submit-button').on('click', function () {
                storage.clear();

                var settings = {
                    animalType: null,
                    location: false,
                    zip: null,
                    age: "any",
                    size: "any",
                    sex: "any",
                    breed: "any"
                };

                settings.animalType = $("input[name=animal-type-select]:checked").val();
                settings.location = $("#location-flip").val();
                settings.zip = $("#zip-input").val();
                settings.age = $("#age-select").val();
                settings.size = $("#size-select").val();
                settings.sex = $("#gender-select").val();
                settings.breed = $("#breed-select").val();

                addSettingsToLocalStorage(settings);

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
                                name:data.petfinder.pets.pet[i].name.$t,
                                age:data.petfinder.pets.pet[i].age.$t,
                                gender:data.petfinder.pets.pet[i].sex.$t,
                                size:data.petfinder.pets.pet[i].size.$t,
                                breed:data.petfinder.pets.pet[i].breeds.breed,
                                id:data.petfinder.pets.pet[i].id.$t,
                                options:data.petfinder.pets.pet[i].options.option,
                                photos:fullSizePhotos
                            });
                        } else if (data.petfinder.pets.pet[i].options) {
                            petsArray.push({
                                name:data.petfinder.pets.pet[i].name.$t,
                                age:data.petfinder.pets.pet[i].age.$t,
                                gender:data.petfinder.pets.pet[i].sex.$t,
                                size:data.petfinder.pets.pet[i].size.$t,
                                breed:data.petfinder.pets.pet[i].breeds.breed,
                                id:data.petfinder.pets.pet[i].id.$t,
                                options:data.petfinder.pets.pet[i].options.option,
                                photos:"null"
                            });
                        } else if (data.petfinder.pets.pet[i].media.photos) {
                            petsArray.push({
                                name:data.petfinder.pets.pet[i].name.$t,
                                age:data.petfinder.pets.pet[i].age.$t,
                                gender:data.petfinder.pets.pet[i].sex.$t,
                                size:data.petfinder.pets.pet[i].size.$t,
                                breed:data.petfinder.pets.pet[i].breeds.breed,
                                id:data.petfinder.pets.pet[i].id.$t,
                                photos:fullSizePhotos,
                                options:"null"

                            });
                        } else {
                            petsArray.push({
                                name:data.petfinder.pets.pet[i].name.$t,
                                age:data.petfinder.pets.pet[i].age.$t,
                                gender:data.petfinder.pets.pet[i].sex.$t,
                                size:data.petfinder.pets.pet[i].size.$t,
                                breed:data.petfinder.pets.pet[i].breeds.breed,
                                photos:"null",
                                options:"null"
                            });
                        }

                    }

                    storage.setArray("petsArray", petsArray);

                });

                //make sure it's populated
                setTimeout(setInitialMatch, 1000);


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

                function getFullSizePhotosForSinglePet(pet) {

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


            });

            function addSettingsToLocalStorage(settings) {

                if (storage.getItem('animalType')) {
                    storage.removeItem('animalType');
                }
                if (storage.getItem('location')) {
                    storage.removeItem('location');
                }
                if (storage.getItem('zip')) {
                    storage.removeItem('zip');
                }
                if (storage.getItem('age')) {
                    storage.removeItem('age');
                }
                if (storage.getItem('sex')) {
                    storage.removeItem('sex');
                }
                if (storage.getItem('breed')) {
                    storage.removeItem('breed');
                }

                storage.setItem('animalType', settings.animalType);
                storage.setItem('location', settings.location);
                storage.setItem('zip', settings.zip);
                storage.setItem('age', settings.age);
                storage.setItem('sex', settings.sex);
                storage.setItem('breed', settings.breed);
            }

            function buildQueryUrl(settings) {
                if (settings.animalType && (settings.zip !== "" || settings.location !== "off")) {
                    var queryUrl = "http://api.petfinder.com/pet.find?format=json&key=2350ef4b4c00d28ac3a15bf88648b19e";

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
                alert("You have to select type of animal and location!")
            }

            function updateBreedSelect(breed) {
                var url = "http://api.petfinder.com/breed.list?format=json&key=2350ef4b4c00d28ac3a15bf88648b19e&animal=" + breed + "&callback=?";
                populateBreedList(url);
            }

            function populateBreedList(queryUrl) {

                $.getJSON(queryUrl, function (data) {
                    var breeds = data.petfinder.breeds.breed;

                    $('#breed-select').empty();
                    $('#breed-select').append("<option value=\"any\">Any</option>");

                    for (var i = 0; i < breeds.length; i ++) {
                        var breedString = breeds[i].$t;
                        $('#breed-select').append("<option value=\"" + breedString + "\">" + breedString + "</option>");
                    }
                    $('#breed-select').selectmenu('refresh');
                });
            }

            $('#new-user-info-x-button').on('click', function () {
                $('#new-user-info').popup("close");
            });

            $('#new-user-info-close-button').on('click', function () {
                $('#new-user-info').popup("close");
            });


            $('#dog-select').on('click', function() {
                updateBreedSelect("dog");
            });
            $('#cat-select').on('click', function() {
                updateBreedSelect("cat");
            });
            $('#reptile-select').on('click', function() {
                updateBreedSelect("reptile");
            });
            $('#horse-select').on('click', function() {
                updateBreedSelect("horse");
            });
            $('#bird-select').on('click', function() {
                updateBreedSelect("bird");
            });
            $('#small-furry-select').on('click', function() {
                updateBreedSelect("smallfurry");
            });

        }

        $(document).on("deviceready", onDeviceReady);

    });

})();

