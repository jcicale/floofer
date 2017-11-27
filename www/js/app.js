(function() {

    //cordova - add listener to DOM & check deviceready event
    document.addEventListener('deviceready', function(event) {
        //prevent any bound defaults
        event.preventDefault();

        const API_KEY_PF = '2350ef4b4c00d28ac3a15bf88648b19e';
        //initialize googlemaps api
        $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB2K5U_RRvqQVUF3GXSXmtLcugsIocZT4U");

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

        //google maps/geolocation vars
        var latitude;
        var longitude;
        var geolocation = 0;
        var geocoder;

        var matchIndex;
        var petsList;
        var direction;

        var likedPets = [];

        console.log("cordova checked...device ready");

        function onsInit(event) {
            //properties - initial page load
            var page = event.target;
            console.log("page-event="+page.id);
            //load main menu and navigation
            onsMenu(page);
            //check home page
            if (page.id === 'settings') {
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

                $("#location-services-switch").off().on("change", function() {
                    if (document.getElementById("location-services-switch").checked) {
                         geocoder = new google.maps.Geocoder;
                        $('#location-progress').attr('indeterminate', true);
                         getLocation();
                   } else {
                       latitude = 0;
                       longitude = 0;
                       geolocation = 0;
                       console.log('slider off');
                   }
                });

                $("#submit-button").off().on("click", function() {
                    submitSettings();
                });
            } else if (page.id === 'matches') {
                $('#keep-playing-icon').on('tap', function() {
                    $('#its-a-match').hide();
                });

                // if (settings.neverSet) {
                //     alert('You must choose settings first!');
                //     content.load('settings.html');
                // }
                setTimeout(function() {
                    setInitialMatch();
                    populatePetsList();
                }, 1000);


                ons.GestureDetector(document.querySelector('#pet-swipe')).on('swipeleft swiperight', function(event) {
                    if (event.type === 'swipeleft') {
                        console.log('swipe left');
                        direction = "swipe-left";
                        addDirectionTransition ("swipe-left");
                    } else if (event.type === 'swiperight') {
                        console.log ('drag left');
                        direction = "swipe-right";
                        addDirectionTransition ("swipe-right");
                    }
                });

                $("#pass-button").on("tap", function() {
                    direction = "swipe-left";
                    addDirectionTransition ("swipe-left");
                });

                $("#want-button").on("tap", function() {
                    direction = "swipe-right";
                    addDirectionTransition("swipe-right");
                });

                $("ons-row.profile-container").on("webkitTransitionEnd transitionend otransitionend", function() {
                    if(direction === "swipe-left") {
                        $("ons-row.profile-container").removeClass("swipe-left");
                        $("#matches-pet-photo").attr('src', '');
                        populateNextMatch();
                    }
                    if (direction === "swipe-right") {
                        $("#its-a-match").show();

                        $("ons-row.profile-container").empty().removeClass("swipe-right").prepend("<div" +
                            " class='pet-photo'>" +
                            " <img src=''" +
                            " id='matches-pet-photo'></div><div class='pet-description'><p" +
                            " id='matches-pet-info'></p></div>" +
                            "");
                        populateNextMatch();
                    }
                });

            } else if (page.id === "match-map") {
                initMap();

            }
        }

        /*
        * ons menu - splitter and nav
        */

        //onsen - main menu
        function onsMenu(page) {
            //main menu
            var menu = document.getElementById('menu');
            //menu link - querySelectorAll due to more than one per page
            var menuLink = document.querySelectorAll('.menu-link');
            console.log(menuLink);
            //splitter content
            var content = document.getElementById('content');

            //check initial page has actually loaded - forces script to wait before getting menu-open (otherwise returns null...)
            if (page.id === 'settings' || page.id === 'matches' || page.id === 'match-map') {
                console.log("page id = "+page.id);
                //get menu icon - query selector OK due to one per ons page
                var menuOpen = document.querySelector('.menu-open');
                //check menu open is stored...
                if (menuOpen) {
                    console.log("menu open stored...");
                }

                //add event listener for main menu
                menuOpen.addEventListener('click', function(event) {
                    event.preventDefault();
                    //open main menu for current page
                    menu.open();
                    console.log("menu opened...");
                }, false);
            }
            //add handler for menu links
            onsMenuLink(page, menuLink, menu);
            //set navigation
            onsNav(page);

        }

        //onsen - menu links
        function onsMenuLink(page, menuLink, menu) {
            if (page.id === 'menu.html') {
                console.log("menu target...");
                //add listener per menu link
                console.log(menuLink);
                // var menuArray = Array.from(menuLink);
                for (var i = 0; i <menuLink.length; i++) {
                    var link = menuLink[i];
                    link.addEventListener('click', function (event) {
                        event.preventDefault();
                        var url = this.getAttribute('url');
                        console.log("menu link = "+ url);
                        content.load(url)
                            .then(menu.close.bind(menu));
                    });
                }
            }
        }

        //onsen - set stack-based navigation
        function onsNav(page) {
            console.log('onsNav page.id='+page.id);
            console.log(page.nodeName.toLowerCase());
            if (page.id === 'match-map') {
                page.querySelector('#fab-open').onclick = function() {
                    document.querySelector('#navigator').pushPage('match-profile.html', {data: {title: 'match profile' +
                    ' page'}});
                    console.log("push page title");
                };
            }else if (page.id === 'matches') {
                page.querySelector("#pet-profile-icon").onclick = function() {
                    document.querySelector('#navigator').pushPage('match-profile.html',
                        {data:
                            {   title: petsList[matchIndex-1].name,
                                photos: petsList[matchIndex-1].photos,
                                id: petsList[matchIndex-1].id,
                                description: petsList[matchIndex-1].description}});
                }
            } else if (page.id === 'match-profile') {
                page.querySelector('ons-toolbar .center').innerHTML = page.data.title + "'s Profile";
                page.querySelector('#inquire-button').innerHTML = "Inquire about " + page.data.title;
                page.querySelector('#profile-pet-description').innerHTML = page.data.description;

                $('#inquire-button').off().on('click', function () {
                    window.open('https://www.petfinder.com/adoption-inquiry/' + page.data.id);
                });

                for (var i = 0; i < page.data.photos.length; i++) {
                    $('#profile-photo-carousel').append("<ons-carousel-item class='profile-carousel-item'><img" +
                        " class='profile-carousel' src='" + page.data.photos[i] + "'></ons-carousel-item>");
                }
                if (page.data.photos.length > 1) {
                    for (var i = 0; i < page.data.photos.length; i++) {
                        $('#carousel-dots-container').append("<span id='dot" + i + "' class='carousel-dots'></span>");
                    }
                    document.getElementById('carousel-dots-container').classList.add('dots-present');
                    document.getElementById('dot0').classList.add('selected-dot');
                }

                document.addEventListener('postchange', function(event) {
                    document.getElementById('dot' + event.lastActiveIndex).classList.remove('selected-dot');
                    document.getElementById('dot' + event.activeIndex).classList.add('selected-dot');
                });

            }
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

        function onSuccess(location) {
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
            reverseGeocodeForZip();

            console.log("found location successfully!")
            console.log("My latitude = " + latitude);
            console.log("My longitude = " + longitude);
        }

        function onFail(error) {
            console.log(error);
            alert("We can't get your location right now. Be sure to give this app location access, or simply enter a" +
                " zip code instead.");
            $('#location-progress').removeAttr('indeterminate');
            $('#location-services-switch').checked = false;
        }

        function getLocation() {
            navigator.geolocation.getCurrentPosition(onSuccess,
                onFail, {
                    maximumAge: 0,
                    timeout: 10000,
                    enableHighAccuracy: true
                });
        }

        function reverseGeocodeForZip() {
            var latlng = {lat: latitude, lng: longitude};
            geocoder.geocode({'location': latlng}, function(results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        for (j = 0; j < results[0].address_components.length; j++) {
                            if (results[0].address_components[j].types[0] === 'postal_code')
                                geolocation = results[0].address_components[j].short_name;
                                $('#location-progress').removeAttr('indeterminate');
                        }
                    } else {
                        window.alert('No results found, please enter your zip code.');
                        $('#location-progress').removeAttr('indeterminate');
                        $('#location-services-switch').checked = false;
                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status + '. Please enter your zip code.');
                    $('#location-progress').removeAttr('indeterminate');
                    $('#location-services-switch').checked = false;
                }
            });
        }

        function buildQueryUrl (settings) {
            if (settings.animalType && (settings.zip !== "" || settings.location !== 0)) {
                var queryUrl = "http://api.petfinder.com/pet.find?format=json&key=" + API_KEY_PF;

                queryUrl += "&animal=" + settings.animalType;

                if (settings.location !== 0) {
                    queryUrl += "&location=" + settings.location;
                } else if (settings.zip) {
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
            var url = "http://api.petfinder.com/breed.list?format=json&key=" + API_KEY_PF + "&animal=" + breed + "&callback=?";
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
            settings.location = geolocation;
            settings.zip = $("#zip-input").val();
            settings.age = $("#age-select").val();
            settings.size = $("#size-select").val();
            settings.sex = $("#gender-select").val();
            settings.breed = $("#breed-select").val();

            if (settings.animalType && (settings.location || settings.zip)) {
                settings.neverSet = false;

                $.getJSON(buildQueryUrl(settings), function (data) {
                    console.log(data);

                    if (storage.getArray("petsArray")) {
                        storage.removeItem("petsArray");
                    }

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
                                description: data.petfinder.pets.pet[i].description.$t,
                                contact: data.petfinder.pets.pet[i].contact,
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
                                description: data.petfinder.pets.pet[i].description.$t,
                                contact: data.petfinder.pets.pet[i].contact,
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
                                description: data.petfinder.pets.pet[i].description.$t,
                                contact: data.petfinder.pets.pet[i].contact,
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
                                id: data.petfinder.pets.pet[i].id.$t,
                                description: data.petfinder.pets.pet[i].description.$t,
                                contact: data.petfinder.pets.pet[i].contact,
                                photos: "null",
                                options: "null"
                            });
                        }

                    }

                    storage.setArray("petsArray", petsArray);

                });
                content.load('matches.html');
            }
            else alert("You must select an animal type and either enable location services or enter a zip.");

        }

        //matches helper functions
        function setInitialMatch() {
            $("#no-more-matches-text").remove();
            $("#matches-pet-photo").removeClass("no-more-matches");
            var cachedPetsArray = storage.getArray("petsArray");
            var fullSizePhotos = cachedPetsArray[0].photos;
            if(fullSizePhotos !== []) {
                $('#matches-pet-photo').attr("src", fullSizePhotos[0]);
                console.log(fullSizePhotos[0]);
            } else {
                $('#matches-pet-photo').attr("src", "../assets/icons/dog-256.png");
            }
            $('#matches-pet-info').empty();
            $('#matches-pet-info').append(cachedPetsArray[0].name + " | " + cachedPetsArray[0].age + " |" +
                " " + (cachedPetsArray[0].gender === "M" ? "Male" : "Female") + " | " +
                petSizeAbbreviationToFull(cachedPetsArray[0].size));
        }

        function populatePetsList() {
            matchIndex = 0;
            petsList = window.localStorage.getArray("petsArray");
        }

        function addDirectionTransition (direction){
            var currentPet = petsList[matchIndex];

            if(direction === "swipe-right") {
                $("#match-popup-photo").attr("src", currentPet.photos[0]);
                $("#likes-you-too").empty().prepend(currentPet.name + " likes you too! :)");
                $("#pet-profile-icon").attr("src", getIconForAnimalType(animalType));
            }

            $("ons-row.profile-container").addClass(direction);

            matchIndex++;
        }

        function populateNextMatch() {

            if (petsList[matchIndex]) {
                if (petsList[matchIndex].photos !== []) {
                    $('#matches-pet-photo').attr("src", petsList[matchIndex].photos[0]);
                } else {
                    $('#matches-pet-photo').attr("src", "assets/icons/" + animalType +"-256.png");
                }
                $('#matches-pet-info').empty();
                $('#matches-pet-info').append(petsList[matchIndex].name + " | " + petsList[matchIndex].age + " |" +
                    " " + (petsList[matchIndex].gender === "M" ? "Male" : "Female") + " | " +
                    petSizeAbbreviationToFull(petsList[matchIndex].size));
            } else {
                $("#matches-pet-photo").attr("src", "assets/icons/" + animalType +"-256.png").addClass("no-more-matches");
                $("#matches-pet-info").empty();
                $("div.pet-photo").append("<p id='no-more-matches-text'>Uh oh! That's all the matches we could" +
                    " find for you right" +
                    " now. Why don't you try <a href='#settings-page'>adjusting your filters</a> or check out" +
                    " your current <a href='#'>match map</a> to see if there are any winners?</p>");
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

        //map helper
        function initMap() {
            var uluru = {lat: -25.363, lng: 131.044};
            var map = new google.maps.Map(document.getElementById('map'), {
                zoom: 4,
                center: uluru
            });
            var marker = new google.maps.Marker({
                position: uluru,
                map: map
            });
        }

        //onsen - init event is fired after ons-page attached to DOM...
        document.addEventListener('init', onsInit, false);

    }, false);

})();
