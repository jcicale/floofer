
$(document).bind( "pagecreate", function() {

    setTimeout(function() { $("#new-user-info").popup("open");}, 500);

    $('#new-user-info-x-button').on('click', function () {
        $('#new-user-info').popup("close");
    });

    $('#new-user-info-close-button').on('click', function () {
        $('#new-user-info').popup("close");
    });

    var url = "http://api.petfinder.com/pet.getRandom?format=json&key=3a62ece31719a64dcf6726980917d7ad&animal=dog&output=basic&callback=?"

    $('#settings-submit-button').on('click', function () {
        console.log('hellooo');


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

