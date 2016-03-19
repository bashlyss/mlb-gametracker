function submitForm(e) {
    // Cancel the form submit
    e.preventDefault();
    var form = $(e.target);
    var data = form.serializeArray();
    console.log(data);

    var newData = {}
    $('form input[name="event"]').each(function(){
        var val = $(this).attr('myval');
        newData[val] = $(this).is(':checked')
    });
    chrome.storage.local.set(newData);
};

// When the popup HTML has loaded
window.addEventListener('load', function(e) {

    if ($('form').length) {
        $('form').on('submit', submitForm);
    }
});
