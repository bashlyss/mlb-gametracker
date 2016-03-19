var postNotification = function(text) {
    // TODO use text
  var body = $('body');
  var notificationDiv = '<div id="notifictation" style="position: fixed; top: 0; right: 0; padding: 10px; min-width: 200px; text-align: center; background: #ffffcc;"><p>SFG vs. OAK</p><p>' + text + '</p></div>'
  body.append(notificationDiv);

  setTimeout(function() {
      $('#notifictation').remove();
  }, 2000);
};
