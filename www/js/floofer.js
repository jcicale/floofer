(function() {

    document.addEventListener('deviceready', function(event) {

        event.preventDefault();

        const API_KEY_PF = '2350ef4b4c00d28ac3a15bf88648b19e';
        //initialize googlemaps api
        $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB2K5U_RRvqQVUF3GXSXmtLcugsIocZT4U");

        var deviceType = device.platform;

        var firstLoad = true;
        //global vars for settings
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
        var geolocatedZip = 0;
        var geocoder;
        var markersList;
        var infoWindowsList;
        var currentlySelectedPet;
        var currentlySelectedPetIdsList;

        //keeping track of our current pet search
        var matchIndex = 0;
        var currentPetsList;
        var evenArray;
        var direction;

        //initialize these to any stored pets
        var likedPets = [];
        var likedPetIds = [];

        //for making additional calls to API without changing settings
        //only load 25 at a time into each array
        var currentQueryUrl;
        var offset;
        var petsArray0 = [];
        var petsArray1 = [];

        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                var displayName = user.displayName;
                var email = user.email;
                var userId = user.uid;
                var database = firebase.database();

                function writeUserData(userId, displayName, email) {
                    var userExists;
                    var ref = database.ref("users/" + userId);
                    ref.once("value")
                        .then(function(snapshot) {
                            userExists = snapshot.exists();
                            if (!userExists) {
                                firebase.database().ref('users/' + userId).set({
                                    username: displayName,
                                    email: email,
                                    firstLoad: true
                                });

                                ons.ready(function() {
                                    //hack because init and show are not calling on load :(
                                    onsShow();
                                    document.addEventListener('show', onsShow, false);
                                });

                            } else {
                                firebase.database().ref('users/' + userId + '/firstLoad').set(false);
                                firstLoad = false;

                                var petListRef = database.ref("users/" + userId).child("likedPets");
                                petListRef.once('value', function(snapshot) {
                                    snapshot.forEach(function(childSnapshot) {
                                        var childData = childSnapshot.val();
                                        likedPets.push(childData);
                                    });
                                    console.log('init liked pets: ');
                                    console.log(likedPets);
                                });

                                var petIdsListRef = database.ref("users/" + userId).child("likedPetIds");
                                petIdsListRef.once('value', function(snapshot) {
                                    snapshot.forEach(function(childSnapshot) {
                                        var childData = childSnapshot.val();
                                        likedPetIds.push(childData);
                                    })
                                    console.log('init liked pet ids: ');
                                    console.log(likedPetIds);
                                });

                                ons.ready(function() {
                                    console.log('ons ready firing');
                                    //hack because init and show are not calling on load :(
                                    onsShow();
                                    document.addEventListener('show', onsShow, false);
                                });
                            }
                        });
                }
                writeUserData(userId, displayName, email);


            } else {
                // User is signed out.
                window.location = 'index.html';
            }
        }, function(error) {
            console.log(error);
        });

        console.log("cordova checked...device ready");

        function onsShow(event) {
            //properties - initial page load
            var page;
            var id;
            if (event) {
                page = event.target;
                id = page.id;
                onsNav(page);
            } else {
                page = {};
                page.id = 'settings';
            }

            var tabbar = document.getElementById("tabbar");

            //load main menu and navigation


            //check home page
            if (page.id === 'settings') {
                //set initial breed list to dog
                updateBreedSelect('dog');

                $("#settings-logout").off().on("click", function() {
                    firebase.auth().signOut().then(function() {
                        // Sign-out successful.
                        window.location = "index.html";
                    }, function(error) {
                        // An error happened.
                        console.log('oops: ' + error);
                    });
                });

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
                        geolocatedZip = 0;
                        settings.location = 0;
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
                    tabbar.setActiveTab(0);
                }

                $('#its-a-match').hide();

                $("#matches-logout").off().on("click", function() {
                    firebase.auth().signOut().then(function() {
                        // Sign-out successful.
                        window.location = "index.html";
                    }, function(error) {
                        // An error happened.
                        console.log('oops: ' + error);
                    });
                });

                if (matchIndex !== 0) {
                    populateNextMatch();
                }

                $('#keep-playing-icon').off().on('tap', function() {
                    $('#its-a-match').hide();
                });

                document.addEventListener('swiperight', function(event) {
                    event.preventDefault();

                    if (matchIndex === currentPetsList.length - 6) {
                        var queryUrl = currentQueryUrl + "&offset=" + offset + "&callback=?"
                        $.getJSON(queryUrl, function (data) {
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
                    direction = "swipe-right";
                    addDirectionTransitionAndSaveMatches("swipe-right");
                });

                document.addEventListener('swipeleft', function(event) {
                    event.preventDefault();

                    if (target.event.matches("#pet-swipe")) {
                        if (matchIndex === currentPetsList.length - 6) {
                            var queryUrl = currentQueryUrl + "&offset=" + offset + "&callback=?";
                            // console.log(queryUrl);
                            $.getJSON(queryUrl, function (data) {
                                // console.log(data);
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
                    }
                });

                $("#pass-button").off().on("tap", function() {
                    if (matchIndex === currentPetsList.length - 6) {
                        var queryUrl = currentQueryUrl + "&offset=" + offset + "&callback=?";
                        // console.log(queryUrl);
                        $.getJSON(queryUrl, function (data) {
                            // console.log(data);
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

                $("#want-button").off().on("tap", function() {
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
                $("#match-map-logout").on("click", function() {
                    firebase.auth().signOut().then(function() {
                        // Sign-out successful.
                        window.location = "index.html";
                    }, function(error) {
                        // An error happened.
                        console.log('oops: ' + error);
                    });
                });


                if(!geocoder) {
                    geocoder = new google.maps.Geocoder;
                }

                initMap();
            }
        }

        //onsen - set stack-based navigation
        function onsNav(page) {
            if (page.id === 'match-map') {
                if (likedPetIds) {
                    document.querySelector('#mini-profile').onclick = function() {
                        document.querySelector('#navigator').pushPage('match-profile.html',
                            {data:
                                {   title: currentlySelectedPet.name,
                                    type: currentlySelectedPet.animalType,
                                    photos: currentlySelectedPet.photos,
                                    id: currentlySelectedPet.id,
                                    description: currentlySelectedPet.description,
                                    contact: currentlySelectedPet.contact,
                                    shelterId: currentlySelectedPet.shelterId,
                                    age: currentlySelectedPet.age,
                                    gender: currentlySelectedPet.gender,
                                    size: currentlySelectedPet.size,
                                    breed: currentlySelectedPet.breed}});
                    };
                }

            }else if (page.id === 'matches') {
                document.querySelector("#pet-profile-icon").onclick = function() {
                    document.querySelector('#navigator').pushPage('match-profile.html',
                        {data:
                            {   title: currentPetsList[matchIndex-1].name,
                                type: currentPetsList[matchIndex-1].animalType,
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
                //stupid petfinder broke their stupid api

                // var shelterUrl = 'http://api.petfinder.com/shelter.get?format=json&key=2350ef4b4c00d28ac3a15bf88648b19e&id='
                //     + page.data.shelterId + '&callback=?';
                // console.log(shelterUrl);
                // var shelterName;
                // $.getJSON(shelterUrl, function (data) {
                //     console.log(data);
                //     shelterName = data.petfinder.shelter.name.$t;
                // });
                page.querySelector('ons-toolbar .center').innerHTML = page.data.title + "'s Profile";
                page.querySelector('#inquire-button').innerHTML = "Inquire about " + page.data.title;
                page.querySelector('#profile-pet-description').innerHTML = page.data.description;
                if (page.data.contact.phone && page.data.contact.email) {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact) +
                        "\nPhone: " + page.data.contact.phone + "\nEmail: " + page.data.contact.email;
                } else if (page.data.contact.phone) {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact) + "\nPhone: " + page.data.contact.phone;
                } else if (page.data.contact.email)  {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact) +"\nEmail: " + page.data.contact.email;
                } else {
                    page.querySelector('#profile-pet-contact').innerHTML = "<strong>Contact Information</strong>" +
                        "\nLocation: " + getAddressString(page.data.contact);
                }

                // $('#inquire-button').off().on('click', function () {
                //     window.open('https://www.petfinder.com/' + page.data.type.toLowerCase() + "/" + page.data.title.replace(/[^A-Z0-9]+/ig, "-").toLowerCase()
                //         + "-" + page.data.id.replace(/[^A-Z0-9]+/ig, "-").toLowerCase() + "/" + page.data.contact.state.toLowerCase() + "/"
                //         + page.data.contact.city.replace(/[^A-Z0-9]+/ig, "-").toLowerCase() + "/"
                //         + shelterName.replace(/[^A-Z0-9]+/ig, "-").toLowerCase() + "-" + page.data.shelterId.toLowerCase() + "/#petInquiry");
                // });
                $('#unmatch-button').off().on('click', function () {
                    likedPetIds = likedPetIds.filter(function (e) {
                        return e !== page.data.id;
                    });
                    var likedPetIdsRef = firebase.database().ref("users/" + firebase.auth().currentUser.uid).child("likedPetIds");
                    var likedPetIdsQuery = likedPetIdsRef.orderByValue();
                    likedPetIdsQuery.once("value", function(snapshot) {
                        snapshot.forEach(function(data) {
                           if (data.val() === page.data.id) {
                               data.ref.remove();
                           }
                        });
                    });


                    likedPets = likedPets.filter(function (e) {
                        return e.id !== page.data.id;
                    });
                    var likedPetsRef = firebase.database().ref("users/" + firebase.auth().currentUser.uid).child("likedPets");
                    var likedPetsQuery = likedPetsRef.orderByChild('id');
                    likedPetsQuery.once("value", function(snapshot) {
                        snapshot.forEach(function(data) {
                            if (data.val().id === page.data.id) {
                                data.ref.remove();
                            };
                        });
                    });


                    if (markersList) {
                        for (var i = 1; i < markersList.length; i++) {
                            if (markersList[i].petIds.length === 1) {
                                if (markersList[i].petIds[0] === page.data.id) {
                                    markersList[i].setMap(null);
                                    markersList[i] = null;
                                    markersList.splice(i, 1);
                                }
                            } else {
                                for (var j = 0; j < markersList[i].petIds.length; j++) {
                                    if (markersList[i].petIds[j] === page.data.id) {
                                        markersList[i].petIds.splice(j, i);
                                    }
                                }
                            }
                        }
                        if (markersList.length > 1) {
                            markersList[1].setIcon('./assets/icons/pink-dot.png');
                            currentlySelectedPet = getLikedPetById(markersList[1].petIds[0]);
                            currentlySelectedPetIdsList = markersList[1].petIds;
                            updateMiniProfile();
                        } else {
                            currentlySelectedPet = null;
                            currentlySelectedPetIdsList = [];
                            $('#mini-profile').empty();
                        }
                    }

                    $('#its-a-match').hide();

                    document.querySelector('#navigator').popPage();
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

                if (page.data.photos !== 'null') {
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
                } else {
                    $('#profile-photo-carousel').append("<ons-carousel-item class='profile-carousel-item'><img" +
                        " class='profile-carousel' src='../assets/icons/" + page.data.animalType + "-256.png'></ons-carousel-item>");
                }


                document.addEventListener('postchange', function(event) {
                    if (event.target.id === 'profile-photo-carousel') {
                        document.getElementById('dot' + event.lastActiveIndex).classList.remove('selected-dot');
                        document.getElementById('dot' + event.activeIndex).classList.add('selected-dot');
                    }
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
                                geolocatedZip = results[0].address_components[j].short_name;
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
                // console.log(queryUrl);
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
                // console.log(data);

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
            settings.location = geolocatedZip;
            settings.zip = $("#zip-input").val();
            settings.age = $("#age-select").val();
            settings.size = $("#size-select").val();
            settings.sex = $("#gender-select").val();
            settings.breed = $("#breed-select").val();

            if (deviceType === "Android") {
                if(settings.breed) {
                    var pup = settings.breed;
                    window.CustomPluginFloofer.getPup(pup,
                        function(result) {
                            console.log("Custom Android Plugin result = "+result);
                        },
                        function(error) {
                            console.log("Custom Android Plugin error = "+error);
                        }
                    );
                }
            }

            if (settings.animalType && (settings.location || settings.zip)) {
                settings.neverSet = false;

                makePetfinderAPICall(petfinderAPICallback);

                $('#want-button').disabled = false;
                $('#pass-button').disabled = false;

                document.getElementById('tabbar').setActiveTab(1);
            }
            else alert("You must select an animal type and either enable location services or enter a zip.");

        }

        //query Petfinder
        function makePetfinderAPICall(callback) {
            $.getJSON(buildQueryUrl(settings), function (data) {
                // console.log(data);
                offset = data.petfinder.lastOffset.$t;
                populateTemporaryPetsArray(data, 0);

                callback();
            });
        }
        //complete when API call finishes
        function petfinderAPICallback() {
            currentPetsList = petsArray0;
            setInitialMatch();
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

                    var contactObject = {};
                    if(petData.petfinder.pets.pet[i].contact.address1.$t) {
                        contactObject.address1 = petData.petfinder.pets.pet[i].contact.address1.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.address2.$t) {
                        contactObject.address2 = petData.petfinder.pets.pet[i].contact.address2.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.city.$t) {
                        contactObject.city = petData.petfinder.pets.pet[i].contact.city.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.email.$t) {
                        contactObject.email = petData.petfinder.pets.pet[i].contact.email.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.phone.$t) {
                        contactObject.phone = petData.petfinder.pets.pet[i].contact.phone.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.state.$t) {
                        contactObject.state = petData.petfinder.pets.pet[i].contact.state.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.zip.$t) {
                        contactObject.zip = petData.petfinder.pets.pet[i].contact.zip.$t
                    }

                    if (petData.petfinder.pets.pet[i].options && petData.petfinder.pets.pet[i].media.photos) {
                        petsArray0.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: contactObject,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
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
                            contact: contactObject,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
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
                            contact: contactObject,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: fullSizePhotos,

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
                            contact: contactObject,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: "null",
                        });
                    }
                }
            } else if (arrayId === 1) {
                petsArray1 = [];
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

                    var contactObject = {};
                    if(petData.petfinder.pets.pet[i].contact.address1.$t) {
                        contactObject.address1 = petData.petfinder.pets.pet[i].contact.address1.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.address2.$t) {
                        contactObject.address2 = petData.petfinder.pets.pet[i].contact.address2.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.city.$t) {
                        contactObject.city = petData.petfinder.pets.pet[i].contact.city.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.email.$t) {
                        contactObject.email = petData.petfinder.pets.pet[i].contact.email.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.phone.$t) {
                        contactObject.phone = petData.petfinder.pets.pet[i].contact.phone.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.state.$t) {
                        contactObject.state = petData.petfinder.pets.pet[i].contact.state.$t
                    }
                    if(petData.petfinder.pets.pet[i].contact.zip.$t) {
                        contactObject.zip = petData.petfinder.pets.pet[i].contact.zip.$t
                    }

                    if (petData.petfinder.pets.pet[i].options && petData.petfinder.pets.pet[i].media.photos) {
                        petsArray1.push({
                            name: petData.petfinder.pets.pet[i].name.$t,
                            age: petData.petfinder.pets.pet[i].age.$t,
                            gender: petData.petfinder.pets.pet[i].sex.$t,
                            size: petData.petfinder.pets.pet[i].size.$t,
                            breed: breedList,
                            id: petData.petfinder.pets.pet[i].id.$t,
                            description: petData.petfinder.pets.pet[i].description.$t,
                            contact: contactObject,
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
                            contact: contactObject,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
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
                            contact: contactObject,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: fullSizePhotos,
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
                            contact: contactObject,
                            shelterId: petData.petfinder.pets.pet[i].shelterId.$t,
                            photos: "null",
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
                // console.log(fullSizePhotos[0]);
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
                petSizeAbbreviationToFull(currentPetsList[matchIndex].size) + "\n" + breedString + " | "
                + currentPetsList[matchIndex].contact.city + ", " + currentPetsList[matchIndex].contact.state);
        }

        function addDirectionTransitionAndSaveMatches (direction) {
            var currentPet = currentPetsList[matchIndex];

            if (direction === "swipe-right") {
                if (currentPet.photos !== 'null') {
                    $("#match-popup-photo").attr("src", currentPet.photos[0]);
                } else $("#match-popup-photo").attr("src", "../assets/icons/" + animalType +"-256.png");
                $("#likes-you-too").empty().prepend(currentPet.name + " likes you too! :)");
                $("#pet-profile-icon").attr("src", getIconForAnimalType(animalType));

                currentPet.animalType = animalType;

                likedPets.push(currentPet);
                var likedPetsRef = firebase.database().ref("users/" + firebase.auth().currentUser.uid).child("likedPets");
                likedPetsRef.push(currentPet);

                likedPetIds.push(currentPet.id);
                var likedPetIdsRef = firebase.database().ref("users/" + firebase.auth().currentUser.uid).child("likedPetIds");
                likedPetIdsRef.push(currentPet.id);

                // console.log(likedPetIds);
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
                    $('#matches-pet-photo').attr("src", "../assets/icons/" + animalType +"-256.png");
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
                    petSizeAbbreviationToFull(currentPetsList[matchIndex].size) + "\n" + breedString +
                    " | " + currentPetsList[matchIndex].contact.city + ", " + currentPetsList[matchIndex].contact.state);
            } else {
                $("#matches-pet-photo").attr("src", "../assets/icons/" + animalType +"-256.png").addClass("no-more-matches");
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
            if(contactInfo.address1) {
                addressString += contactInfo.address1;
            }
            if (contactInfo.address2) {
                addressString += ", " + contactInfo.address2;
            }
            if (contactInfo.city) {
                addressString += " " + contactInfo.city;
            }
            if (contactInfo.state) {
                addressString += ", " + contactInfo.state;
            }
            if (contactInfo.zip) {
                addressString += " " + contactInfo.zip;
            }
            return addressString;
        }

        //map helper
        function initMap() {
            var mapcenter;
            var map = null;

            markersList = [];
            infoWindowsList = [];

            var likedPetAddresses = [];
            for (var i = 0; i < likedPets.length; i++) {
                likedPetAddresses.push({
                    address: getAddressString(likedPets[i].contact),
                    petId: likedPets[i].id
                });
            }

            if (settings.location !== 0) {
                mapcenter = settings.location.toString();
            } else if (settings.zip !== 0) {
                mapcenter = settings.zip.toString();
            } else mapcenter = '60657';

            // console.log(likedPetAddresses);

            createMapAndUserMarker(likedPetAddresses, mapcenter, map, createMapAndUserMarkerCallback);


        }

        function createMapAndUserMarker(likedPetAddresses, mapcenter, map, callback) {
            geocoder.geocode( {'address': mapcenter}, function(results, status){
                if (status === "OK") {
                    map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 12,
                        center: results[0].geometry.location
                    });
                    var infowindow = new google.maps.InfoWindow({
                        content: "Your location (as of your most recent search)",
                    });
                    var marker = new google.maps.Marker({
                        position: results[0].geometry.location,
                        icon: "./assets/icons/star.png",
                        title: 'userLocation'
                    });
                    marker.addListener('click', function() {
                        for (var i = 0; i < markersList.length; i++) {
                            if (i !== 0){
                                markersList[i].setIcon('./assets/icons/blue-dot.png');
                            }
                        }
                        for (var i = 0; i <infoWindowsList.length; i++) {
                            infoWindowsList[i].close();
                        }
                        infowindow.open(map, marker);
                    });
                    markersList.push(marker);
                    infoWindowsList.push(infowindow);
                    callback(likedPetAddresses, map);
                } else {
                    console.log('Geocode of user location not sucessful: ' + status);
                }
            });
        }

        function createMapAndUserMarkerCallback(likedPetAddresses, map) {
            if (likedPetAddresses.length === 0) {
                markersList[0].setMap(map);

                $('#mini-profile').append("<div id='no-pets-container'>" +
                    "<img style='margin: 1em auto 0 auto; display: block; width: 175px;'" +
                    " src='./assets/icons/" + (animalType ? animalType : "dog") + "-256.png'>" +
                    "<p id='no-pets-map-text'>Hmmm, there doesn't seem to be anything here. Why don't you try checking" +
                    " your <span id='matches-link'>matches page</span> or trying some new" +
                    " <span id='settings-link'>filters?</span></p>" +
                    "</div>");

                document.getElementById("matches-link").addEventListener('click', function() {
                    document.getElementById('tabbar').setActiveTab(1);
                });
                document.getElementById("settings-link").addEventListener('click', function() {
                    document.getElementById('tabbar').setActiveTab(0);
                });
            } else {
                for (var i = 0; i < likedPetAddresses.length; i++) {
                    geocodePetsAddress(likedPetAddresses[i], geocodePetsAddressCallback, map, i, likedPetAddresses.length);
                }
            }

        }

        function geocodePetsAddress(petAddress, callback, map, index, length) {
            geocoder.geocode( { 'address': petAddress.address}, function(results, status) {
                if (status === 'OK') {
                    var flag = false;
                    var sameMarker;

                    for (var i = 1; i < markersList.length; i++) {
                        if ((markersList[i].getPosition().lat() === results[0].geometry.location.lat()) &&
                            (markersList[i].getPosition().lng() === results[0].geometry.location.lng())) {
                            flag = true;
                            sameMarker = i;
                        }
                    }
                    //if there's already a marker in this location, add to that marker's infowindow and petIds
                    if (flag) {
                        var windowToUpdate = infoWindowsList[sameMarker];
                        var currentContent = windowToUpdate.getContent();
                        var newContent = currentContent + "<p>" + getLikedPetNameById(petAddress.petId) + "'s" +
                            " location</p>";
                        windowToUpdate.setContent(newContent);
                        var markerToUpdate = markersList[sameMarker];
                        var currentPetIdsList = markerToUpdate.petIds;
                        currentPetIdsList.push(petAddress.petId);
                        markerToUpdate.petIds = currentPetIdsList;
                    }
                    //else create a new marker
                    else {
                        var contentString = '<p id="pet' + petAddress.petId + '">' + getLikedPetNameById(petAddress.petId) + '\'s location</p>';

                        var infowindow = new google.maps.InfoWindow({
                            content: contentString
                        });

                        var petIds = [];
                        petIds.push(petAddress.petId);

                        var marker = new google.maps.Marker({
                            position: results[0].geometry.location,
                            placeId: results[0].place_id,
                            icon: "./assets/icons/blue-dot.png",
                            petIds: petIds
                        });

                        marker.addListener('click', function() {
                            for (var i = 0; i < markersList.length; i++) {
                                if (i !== 0){
                                    markersList[i].setIcon('./assets/icons/blue-dot.png');
                                }
                            }
                            for (var i = 0; i <infoWindowsList.length; i++) {
                                infoWindowsList[i].close();
                            }
                            currentlySelectedPet = getLikedPetById(marker.petIds[0]);
                            currentlySelectedPetIdsList = marker.petIds;
                            marker.setIcon('./assets/icons/pink-dot.png');
                            infowindow.open(map, marker);
                            updateMiniProfile();

                        });
                    }


                    callback(map, marker, infowindow, index, length);

                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });
        }

        function geocodePetsAddressCallback(map, marker, infowindow, index, length){
            if(marker) {
                markersList.push(marker);
            }

            if (infowindow) {
                infoWindowsList.push(infowindow);
            }

            if (index === length-1) {
                // console.log('bug hunting');
                // console.log(markersList.length);
                // console.log(markersList);
                for (var j = 0; j < markersList.length; j++) {
                    markersList[j].setMap(map);
                }
                var bounds = new google.maps.LatLngBounds();
                for (var i = 0; i < markersList.length; i++) {
                    bounds.extend(markersList[i].getPosition());
                }

                map.fitBounds(bounds);

                if (currentlySelectedPet) {
                    updateMiniProfile();
                } else {
                    if (markersList.length > 1) {
                        markersList[1].setIcon('./assets/icons/pink-dot.png');
                        currentlySelectedPet = getLikedPetById(markersList[1].petIds[0]);
                        currentlySelectedPetIdsList = markersList[1].petIds;
                        updateMiniProfile();
                    } else {
                        $('#mini-profile').append("<div id='no-pets-container'>" +
                            "<img style='margin: 1em auto 0 auto; display: block; width: 175px;'" +
                            " src='./assets/icons/" + (animalType ? animalType : "dog") + "-256.png'>" +
                            "<p id='no-pets-map-text'>Hmmm, there doesn't seem to be anything here. Why don't you try checking" +
                            " your <span id='matches-link'>matches page</span> or trying some new" +
                            " <span id='settings-link'>filters?</span></p>" +
                            "</div>");

                        document.getElementById("matches-link").addEventListener('click', function() {
                            document.getElementById('tabbar').setActiveTab(1);
                        });
                        document.getElementById("settings-link").addEventListener('click', function() {
                            document.getElementById('tabbar').setActiveTab(0);
                        });
                    }

                }
            }
        }

        function getLikedPetNameById(petId) {
            for (var i = 0; i < likedPets.length; i++) {
                if (likedPets[i].id === petId) {
                    return likedPets[i].name;
                }
            }
        }

        function getLikedPetById(petId) {
            for (var i = 0; i < likedPets.length; i++) {
                if (likedPets[i].id === petId) {
                    return likedPets[i];
                }
            }
        }

        function updateMiniProfile() {
            for (var idx = 1; idx < markersList.length; idx++) {
                if (markersList[idx].petIds.includes(currentlySelectedPet.id)) {
                    markersList[idx].setIcon('./assets/icons/pink-dot.png');
                }
            }

            $('#mini-profile').empty();

            // console.log(currentlySelectedPetIdsList);

            if (currentlySelectedPetIdsList.length === 1) {
                $('#mini-profile').append(
                    "<ons-col id='pet'" + currentlySelectedPetIdsList[0] + " width=\"50%\">\n" +
                    "    <div id=\"mini-profile-picture-container\" class=\"frame\">\n" +
                    "        <span class=\"helper\"></span>\n" +
                    "        <img id=\"mini-profile-picture\" src=\"\">\n" +
                    "    </div>\n" +
                    "</ons-col>\n" +
                    "<ons-col width=\"50%\">\n" +
                    "    <div id=\"mini-profile-description-container\">\n" +
                    "        <p id=\"mini-profile-name\"></p>\n" +
                    "        <p id=\"mini-profile-description\"></p>\n" +
                    "        <p style=\"color: #696969; text-decoration: underline; font-weight: 700; margin: 0;\">Tap to read more...</p>\n" +
                    "    </div>\n" +
                    "</ons-col>")

                if(currentlySelectedPet.photos !== 'null'){
                    $('#mini-profile-picture').attr('src', currentlySelectedPet.photos[0]);
                } else $('#mini-profile-picture').attr('src', '../assets/icons/' + animalType + '-256.png');

                document.querySelector('#mini-profile-name').innerHTML = currentlySelectedPet.name + ", " + currentlySelectedPet.age;
                document.querySelector('#mini-profile-description').innerHTML = currentlySelectedPet.description;
            } else {
                $('#mini-profile').append(
                    "<ons-list id='pets-list'>\n" +
                    "    <ons-list-header>Pets at this Location</ons-list-header>\n" +
                    "</ons-list>");
                for (var i = 0; i < currentlySelectedPetIdsList.length; i++) {
                    $('#pets-list').append(
                        "<ons-list-item id='pet" + currentlySelectedPetIdsList[i] + "' modifier=\"chevron" +
                        " longdivider\" tappable>\n" +
                        "    <div class=\"left\">\n" +
                        "        <img class=\"list-item__thumbnail\" src='" + getLikedPetById(currentlySelectedPetIdsList[i]).photos[0] + "'>\n" +
                        "    </div>\n" +
                        "    <div class=\"center\">\n" +
                        "        <span class=\"list-item__title\">" + getLikedPetNameById(currentlySelectedPetIdsList[i]) + "</span>" +
                        "        <span class=\"list-item__subtitle\">" +
                        getLikedPetById(currentlySelectedPetIdsList[i]).age + " | " +
                        (getLikedPetById(currentlySelectedPetIdsList[i]).gender === "M" ? "Male" : "Female") + " | " +
                        petSizeAbbreviationToFull(getLikedPetById(currentlySelectedPetIdsList[i]).size) +
                        "</span>\n" +
                        "    </div>\n" +
                        "</ons-list-item>\n");
                }
                for (var j = 0; j < currentlySelectedPetIdsList.length; j++) {
                    document.getElementById('pet' + currentlySelectedPetIdsList[j]).addEventListener('click', function(event) {
                        event.preventDefault();

                        var id = $(this).attr('id');
                        id = id.replace(/\D/g,'');

                        currentlySelectedPet = getLikedPetById(id);
                    }, false);
                }

            }

        }

    }, false);
})();
