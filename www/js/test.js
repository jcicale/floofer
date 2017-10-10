var hideDialog = function (id) {
    document.getElementById(id).hide();
};

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