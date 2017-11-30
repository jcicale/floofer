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
            location: 0,
            zip: 0,
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

        //keeping track of our current pet search
        var matchIndex = 0;
        var currentPetsList;
        var evenArray;
        var direction;

        var likedPets = [];
        var likedPetIds = [];

        var currentQueryUrl;
        var offset;
        var petsArray0 = [];
        var petsArray1 = [];

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
                //if settings already exist
                if (settings.animalType !== null) {
                    selectAnimal(settings.animalType);
                }
                if (settings.location !== 0) {
                    document.getElementById("location-services-switch").checked = true;
                }
                if (settings.zip !== 0 && settings.zip !== "") {
                    document.getElementById("zip-input").value = settings.zip;
                }
                if (settings.age !== "any") {
                    document.getElementById("age-select").value = settings.age;
                }
                if (settings.sex !== "any") {
                    document.getElementById("gender-select").value = settings.sex;
                }
                if (settings.size !== "any") {
                    document.getElementById("size-select").value = settings.size;
                }
                if (settings.breed !== "any") {
                    setTimeout(function() {
                        document.getElementById("dynamic-breed-select").value = settings.breed;
                    }, 300);
                }

            } else if (page.id === 'matches') {
                if (settings.neverSet) {
                    alert('You must choose settings first!');
                    content.load('settings.html');
                }

                if (matchIndex != 0) {
                    populateNextMatch();
                }

                $('#keep-playing-icon').on('tap', function() {
                    $('#its-a-match').hide();
                });

                ons.GestureDetector(document.querySelector('#pet-swipe')).on('swipeleft swiperight', function(event) {
                    if (event.type === 'swipeleft') {
                        console.log('swipe left');
                        direction = "swipe-left";
                        addDirectionTransitionAndSaveMatches ("swipe-left");
                    } else if (event.type === 'swiperight') {
                        console.log ('drag left');
                        direction = "swipe-right";
                        addDirectionTransitionAndSaveMatches ("swipe-right");
                    }
                });

                $("#pass-button").on("tap", function() {
                    if (matchIndex === currentPetsList.length - 6) {
                        var queryUrl = currentQueryUrl + "&offset=" + offset + "&callback=?";
                        console.log(queryUrl);
                        $.getJSON(queryUrl, function (data) {
                            console.log(data);
                            offset = data.petfinder.lastOffset.$t;
                            if (evenArray) {
                                populateTemporaryPetsArray(data, 1);
                            } else populateTemporaryPetsArray(data, 0);

                        });
                    }
                    if (matchIndex === currentPetsList.length - 1) {
                        if (evenArray) {
                            currentPetsList = petsArray1;
                            evenArray = !evenArray;
                        } else {
                            currentPetsList = petsArray0;
                            evenArray = !evenArray;
                        }
                    }
                    direction = "swipe-left";
                    addDirectionTransitionAndSaveMatches ("swipe-left");
                });

                $("#want-button").on("tap", function() {
                    if (matchIndex === currentPetsList.length - 6) {
                        var queryUrl = currentQueryUrl + "&offset=" + offset + "&callback=?"
                        $.getJSON(queryUrl, function (data) {
                            offset = data.petfinder.lastOffset.$t;
                            if (evenArray) {
                                populateTemporaryPetsArray(data, 1);
                            } else populateTemporaryPetsArray(data, 0);

                        });
                    }
                    if (matchIndex === currentPetsList.length -1) {
                        if (evenArray) {
                            currentPetsList = petsArray1;
                            evenArray = !evenArray;
                        } else {
                            currentPetsList = petsArray0;
                            evenArray = !evenArray;
                        }
                    }
                    direction = "swipe-right";
                    addDirectionTransitionAndSaveMatches("swipe-right");
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
                var savedPets = storage.getArray('likedPets');
                storage.removeItem('likedPetIds');
                storage.setArray('likedPetIds', likedPetIds)
                if (savedPets) {
                    for (var i = 0; i < savedPets.length; i++) {
                        likedPets.push(savedPets[i]);
                    }
                }
                storage.setArray('likedPets', likedPets);
                var petsToPin = likedPets;
                likedPets = [];

                if(!geocoder) {
                    geocoder = new google.maps.Geocoder;
                }

                initMap(petsToPin);

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
                            {   title: currentPetsList[matchIndex-1].name,
                                photos: currentPetsList[matchIndex-1].photos,
                                id: currentPetsList[matchIndex-1].id,
                                description: currentPetsList[matchIndex-1].description,
                                contact: currentPetsList[matchIndex-1].contact,
                                shelterId: currentPetsList[matchIndex-1].shelterId,
                                age: currentPetsList[matchIndex-1].age,
                                gender: currentPetsList[matchIndex-1].gender,
                                size: currentPetsList[matchIndex-1].size,
                                breed: currentPetsList[matchIndex-1].breed}});
                }
            } else if (page.id === 'match-profile') {
                var shelterUrl = 'http://api.petfinder.com/shelter.get?format=json&key=2350ef4b4c00d28ac3a15bf88648b19e&id='
                    + page.data.shelterId + '&callback=?';
                var shelterName;
                $.getJSON(shelterUrl, function (data) {
                    shelterName = data.petfinder.shelter.name.$t;
                    });
                page.querySelector('ons-toolbar .center').innerHTML = page.data.title + "'s Profile";
                page.querySelector('#inquire-button').innerHTML = "Inquire about " + page.data.title;
                page.querySelector('#profile-pet-description').innerHTML = page.data.description;
                if (page.data.contact.phone.$t && page.data.contact.email.$t) {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact) +
                        "\nPhone: " + page.data.contact.phone.$t + "\nEmail: " + page.data.contact.email.$t;
                } else if (page.data.contact.phone.$t) {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact) + "\nPhone: " + page.data.contact.phone.$t;
                } else if (page.data.contact.email.$t)  {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact) +"\nEmail: " + page.data.contact.email.$t;
                } else {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact);
                }

                    $('#inquire-button').off().on('click', function () {
                    window.open('https://www.petfinder.com/' + animalType.toLowerCase() + "/" + page.data.title.replace(/[^A-Z0-9]+/ig, "-").toLowerCase()
                        + "-" + page.data.id.replace(/[^A-Z0-9]+/ig, "-").toLowerCase() + "/" + page.data.contact.state.$t.toLowerCase() + "/"
                        + page.data.contact.city.$t.replace(/[^A-Z0-9]+/ig, "-").toLowerCase() + "/"
                        + shelterName.replace(/[^A-Z0-9]+/ig, "-").toLowerCase() + "-" + page.data.shelterId.toLowerCase() + "/#petInquiry");
                });
                var breedString = "";
                if (page.data.breed.length > 1) {
                    for (var i = 0; i <page.data.breed.length; i++) {
                        breedString += page.data.breed[i];
                        if (i !== page.data.breed.length-1) {
                            breedString += ", ";
                        }
                    }
                } else breedString = page.data.breed[0];
                $('#profile-pet-info').append(page.data.age + " | " + (page.data.gender === "M" ? "Male" : "Female")
                    + " | " + petSizeAbbreviationToFull(page.data.size) + " | " + breedString);

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
                currentQueryUrl = queryUrl;
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
            petsArray0 = [];
            petsArray1 = [];
            matchIndex = 0;

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
                    offset = data.petfinder.lastOffset.$t;
                    populateTemporaryPetsArray(data, 0);

                });
                $('#want-button').disabled = false;
                $('#pass-button').disabled = false;

                setTimeout(function() {
                    currentPetsList = petsArray0;
                    setInitialMatch();
                }, 1500);

                content.load('matches.html');
            }
            else alert("You must select an animal type and either enable location services or enter a zip.");

        }

        function populateTemporaryPetsArray(petData, arrayId) {
            if (arrayId === 0) {
                petsArray0 = [];
                for (var i = 0; i < petData.petfinder.pets.pet.length; i++) {

                    if (petData.petfinder.pets.pet[i].media.photos) {
                        var fullSizePhotos = getFullSizePhotosForSinglePet(petData.petfinder.pets.pet[i]);
                    }
                    var breedList = [];
                    if(petData.petfinder.pets.pet[i].breeds.breed.length > 1) {
                        for (j = 0; j < petData.petfinder.pets.pet[i].breeds.breed.length; j++) {
                            breedList.push(petData.petfinder.pets.pet[i].breeds.breed[j].$t);
                        }
                    } else breedList.push(petData.petfinder.pets.pet[i].breeds.breed.$t);

                    if (petData.petfinder.pets.pet[i].options && petData.petfinder.pets.pet[i].media.photos) {
                        petsArray0.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            options: petData.petfinder.pets.pet[i].options.option,
                            photos: fullSizePhotos
                        });
                    } else if (petData.petfinder.pets.pet[i].options) {
                        petsArray0.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            options: petData.petfinder.pets.pet[i].options.option,
                            photos: "null"
                        });
                    } else if (petData.petfinder.pets.pet[i].media.photos) {
                        petsArray0.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: fullSizePhotos,
                            options: "null"

                        });
                    } else {
                        petsArray0.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: "null",
                            options: "null"
                        });
                    }
                }
            } else if (arrayId === 1) {
                petsArray1 = [];
                for (var i = 0; i < petData.petfinder.pets.pet.length; i++) {

                    if (likedPetIds) {
                        if (likedPetIds.includes(petData.petfinder.pets.pet[i].id.$t)) {
                            continue;
                        }
                    }

                    if (petData.petfinder.pets.pet[i].media.photos) {
                        var fullSizePhotos = getFullSizePhotosForSinglePet(petData.petfinder.pets.pet[i]);
                    }
                    var breedList = [];
                    if(petData.petfinder.pets.pet[i].breeds.breed.length > 1) {
                        for (j = 0; j < petData.petfinder.pets.pet[i].breeds.breed.length; j++) {
                            breedList.push(petData.petfinder.pets.pet[i].breeds.breed[j].$t);
                        }
                    } else breedList.push(petData.petfinder.pets.pet[i].breeds.breed.$t);

                    if (petData.petfinder.pets.pet[i].options && petData.petfinder.pets.pet[i].media.photos) {
                        petsArray1.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            options: petData.petfinder.pets.pet[i].options.option,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: fullSizePhotos
                        });
                    } else if (petData.petfinder.pets.pet[i].options) {
                        petsArray1.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            options: petData.petfinder.pets.pet[i].options.option,
                            photos: "null"
                        });
                    } else if (petData.petfinder.pets.pet[i].media.photos) {
                        petsArray1.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: fullSizePhotos,
                            options: "null"

                        });
                    } else {
                        petsArray1.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: petData.petfinder.pets.pet[i].contact,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: "null",
                            options: "null"
                        });
                    }

                }
            }
        }

        //matches helper functions
        function setInitialMatch() {
            $("#no-more-matches-text").remove();
            $("#matches-pet-photo").removeClass("no-more-matches");
            evenArray = true;
            if (likedPetIds) {
                if (likedPetIds.includes(currentPetsList[matchIndex].id)) {
                    matchIndex++;
                    populateNextMatch();
                    return;
                }
            }
            var fullSizePhotos = currentPetsList[matchIndex].photos;
            if(fullSizePhotos !== []) {
                $('#matches-pet-photo').attr("src", fullSizePhotos[0]);
                console.log(fullSizePhotos[0]);
            } else {
                $('#matches-pet-photo').attr("src", "../assets/icons/dog-256.png");
            }
            $('#matches-pet-info').empty();

            var breedString = "";
            if (currentPetsList[matchIndex].breed.length > 1) {
                for (var i = 0; i < currentPetsList[matchIndex].breed.length; i++) {
                    breedString += currentPetsList[matchIndex].breed[i];
                    if (i !== currentPetsList[matchIndex].breed.length-1) {
                        breedString += ", ";
                    }
                }
            } else breedString = currentPetsList[matchIndex].breed[0];

            $('#matches-pet-info').append(currentPetsList[matchIndex].name + " | " + currentPetsList[matchIndex].age + " |" +
                " " + (currentPetsList[0].gender === "M" ? "Male" : "Female") + " | " +
                petSizeAbbreviationToFull(currentPetsList[matchIndex].size) + " | " + breedString);
        }

        function addDirectionTransitionAndSaveMatches (direction) {
            var currentPet = currentPetsList[matchIndex];

            if (direction === "swipe-right") {
                $("#match-popup-photo").attr("src", currentPet.photos[0]);
                $("#likes-you-too").empty().prepend(currentPet.name + " likes you too! :)");
                $("#pet-profile-icon").attr("src", getIconForAnimalType(animalType));

                likedPets.push(currentPet);
                likedPetIds.push(currentPet.id);
                console.log(likedPetIds);
            }

            $("ons-row.profile-container").addClass(direction);

            matchIndex++;

            if (matchIndex === currentPetsList.length) {
                matchIndex = 0;
            }
        }

        function populateNextMatch() {

            if (currentPetsList[matchIndex]) {
                if (likedPetIds) {
                    if (likedPetIds.includes(currentPetsList[matchIndex].id)) {
                        matchIndex++;
                        populateNextMatch();
                        return;
                    }
                }
                if (currentPetsList[matchIndex].photos !== "null") {
                    $('#matches-pet-photo').attr("src", currentPetsList[matchIndex].photos[0]);
                } else {
                    $('#matches-pet-photo').attr("src", "assets/icons/" + animalType +"-256.png");
                }
                $('#matches-pet-info').empty();
                var breedString = "";
                if (currentPetsList[matchIndex].breed.length > 1) {
                    for (var i = 0; i < currentPetsList[matchIndex].breed.length; i++) {
                        breedString += currentPetsList[matchIndex].breed[i];
                        if (i !== currentPetsList[matchIndex].breed.length-1) {
                            breedString += ", ";
                        }
                    }
                } else breedString = currentPetsList[matchIndex].breed[0];

                $('#matches-pet-info').append(currentPetsList[matchIndex].name + " | " + currentPetsList[matchIndex].age + " |" +
                    " " + (currentPetsList[matchIndex].gender === "M" ? "Male" : "Female") + " | " +
                    petSizeAbbreviationToFull(currentPetsList[matchIndex].size) + " | " + breedString);
            } else {
                $("#matches-pet-photo").attr("src", "assets/icons/" + animalType +"-256.png").addClass("no-more-matches");
                $("#matches-pet-info").empty();
                $("div.pet-description").append("<p id='no-more-matches-text'>Uh oh! That's all the matches we could" +
                    " find for you right now. Why don't you try <a id='settings-link'>adjusting your" +
                    " filters</a> or check out your current <a id='match-map-link'>match map</a> to see if" +
                    " there are any winners?</p>");
                $('#want-button').attr('disabled', true);
                $('#pass-button').attr('disabled', true);
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

        //match profile helper functions
        function getAddressString(contactInfo) {
            var addressString = ""
            if(contactInfo.address1.$t) {
                addressString += contactInfo.address1.$t;
            }
            if (contactInfo.address2.$t) {
                addressString += ", " + contactInfo.address2.$t;
            }
            if (contactInfo.city.$t) {
                addressString += " " + contactInfo.city.$t;
            }
            if (contactInfo.state.$t) {
                addressString += ", " + contactInfo.state.$t;
            }
            if (contactInfo.zip.$t) {
                addressString += " " + contactInfo.zip.$t;
            }
            return addressString;
        }

        //map helper
        function initMap(petsToPin) {
            var mapcenter;
            var map;
            var star = "/assets/icons/star.png";

            if (settings.location !== 0) {
                mapcenter = settings.location.toString();
            } else if (settings.zip !== 0) {
                mapcenter = settings.zip.toString();
            } else mapcenter = '60657';

            geocoder.geocode( {'address': mapcenter}, function(results, status){
                if (status === "OK") {
                    map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 4,
                        center: results[0].geometry.location
                    });
                    var marker = new google.maps.Marker({
                        map: map,
                        position: results[0].geometry.location,
                        icon: star
                    });
                } else {
                    console.log('Geocode was not successful for the following reason: ' + status);
                }
            });

            var likedPetAddresses = [];
            for (var i = 0; i < petsToPin.length; i++) {
                likedPetAddresses.push(getAddressString(petsToPin[i].contact));
            }

            console.log(likedPetAddresses);
            for (var i = 0; i < likedPetAddresses.length; i++) {
                geocoder.geocode( { 'address': likedPetAddresses[i]}, function(results, status) {
                    if (status === 'OK') {
                        var marker = new google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location
                        });
                    } else {
                        alert('Geocode was not successful for the following reason: ' + status);
                    }
                });
            }

        }

        //onsen - init event is fired after ons-page attached to DOM...
        document.addEventListener('init', onsInit, false);

    }, false);

})();
