var postNotification = function(text) {
    // TODO use text
  var body = $('body');
  var notificationDiv = '<div id="mlbbaseball-notification" style="position: fixed; top: 0; right: 0; padding: 10px; min-width: 200px; text-align: center; margin: 8px; border-radius: 4px; font-size: 16px; background: #ddd; z-index: 1000000;"><p style="font-weight: 600; margin: 0;">SFG vs. OAK</p><p style="margin: 0;">' + text + '</p></div>'
  body.append(notificationDiv);

  setTimeout(function() {
      $('#mlbbaseball-notification').remove();
  }, 2000);
};
