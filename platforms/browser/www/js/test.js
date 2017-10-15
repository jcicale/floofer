
$(document).bind( "pagecreate", function() {

    setTimeout(function() { $("#new-user-info").popup("open");}, 500);
    setInitialBreedSelect();
    $('#breed-select').append("test");
    // var url = "http://api.petfinder.com/pet.getRandom?format=json&key=3a62ece31719a64dcf6726980917d7ad&animal=dog&output=basic&callback=?"


    $('#settings-submit-button').on('click', function () {
        let settings = {
            animalType: null,
            location: false,
            zip: null,
            age: "any",
            sex: "any",
            breed: "any"
        };

        settings.animalType = $("input[name=animal-type-select]:checked").val()
        settings.location = $("#location-flip").val();
        settings.zip = $("#zip-input").val();
        settings.age = $("#age-select").val();
        settings.sex = $("#gender-select").val();
        settings.breed = $("#breed-select").val();


        $.getJSON(buildQueryUrl(settings), function (data) {
            console.log(data);

            // alert(data.petfinder.pet.age.$t);
            });

        });

});

function buildQueryUrl(settings) {
    if (settings.animalType && (settings.zip !== "" || settings.location !== "off")) {
        let queryUrl = "http://api.petfinder.com/pet.find?format=json&key=2350ef4b4c00d28ac3a15bf88648b19e";

        queryUrl += "&animal=" + settings.animalType;

        if (settings.zip) {
            queryUrl += "&location=" + settings.zip;
        }
        if (settings.age !== "any") {
            queryUrl += "&age=" + settings.age;
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

//default to dog breeds, update if another animal is selected
function setInitialBreedSelect() {
    let url = "http://api.petfinder.com/breed.list?format=json&key=2350ef4b4c00d28ac3a15bf88648b19e&animal=dog&callback=?";
    populateBreedList(url);
}

function updateBreedSelect(breed) {
    console.log(breed);
    let url = "http://api.petfinder.com/breed.list?format=json&key=2350ef4b4c00d28ac3a15bf88648b19e&animal=" + breed + "&callback=?";
    populateBreedList(url);
}

function populateBreedList(queryUrl) {
    $.getJSON(queryUrl, function (data) {
        let breeds = data.petfinder.breeds.breed;

        $('#breed-select').empty();
        $('#breed-select').append("<option value=\"Any\">Any</option>");

        for (let i = 0; i < breeds.length; i ++) {
            let breedString = breeds[i].$t;
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