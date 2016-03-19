function submitForm(e) {
    // Cancel the form submit
    e.preventDefault();
    var form = $(e.target);
    var data = form.serializeArray();
    console.log(data);

    data.forEach(function(elem){
        if(elem.name == 'event') {
            var key = elem.value;
            chrome.storage.local.set({key: true});
            console.log(key);
        }
    });

};

// When the popup HTML has loaded
window.addEventListener('load', function(e) {

    if ($('form').length) {
        $('form').on('submit', submitForm);
    }
});


