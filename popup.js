function submitForm(e) {
    // Cancel the form submit
    e.preventDefault();
    var form = $(e.target);
    var data = form.serialize();
    console.log(data);
};

// When the popup HTML has loaded
window.addEventListener('load', function(e) {

    if ($('form').length) {
        $('form').on('submit', submitForm);
    }
});
