function submitForm(e) {
    // Cancel the form submit
    e.preventDefault();
    var $form = $(e.target);

    var newData = {};
    newData['team'] = $form.find(':input[name="team"]').val();
    $form.find('input[name="event"]').each(function(){
        var val = $(this).attr('myval');
        newData[val] = $(this).is(':checked')
    });
    console.log(newData);
    chrome.storage.local.set(newData);
    $("#message").text('Your preferences have been saved');
    setTimeout(function () {
        $("#message").text('');
    }, 2000);
};

// When the popup HTML has loaded
window.addEventListener('load', function(e) {

    if ($('form').length) {
        $('form').on('submit', submitForm);
    }

    chrome.storage.local.get('team', function(val){$(':input[name="team"]').val(val.team);});
    ['ball', 'strike', 'risp', 'score', 'doubleplay'].forEach(function(field) {
        chrome.storage.local.get(field, function(val){
            console.log(':input[myval="' + field + '"]');
            console.log(val[field]);
            $(':input[myval="' + field + '"]').prop('checked', val[field]);
        });
    });

});
