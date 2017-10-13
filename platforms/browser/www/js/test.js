$(document).ready(function () {
    var url = "http://api.petfinder.com/pet.getRandom?format=json&key=3a62ece31719a64dcf6726980917d7ad&animal=dog&output=basic&callback=?"

    $('#loadImage').on('click', function () {
        $( ".inner" ).append( "<p>Test</p>" );

        $.getJSON(url, function (data) {
            console.log(data);

            alert(data.petfinder.pet.age.$t);
            });

        });

    var fromTemplate = function () {
        var dialog = document.getElementById('initial-dialog');

        if (dialog) {
            dialog.show();
        }
        else {
            ons.createDialog('dialog.html')
                .then(function (dialog) {
                    dialog.show();
                });
        }
    };


});

