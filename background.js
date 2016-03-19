window.setInterval(function () {
    var date = new Date();
    var year = String(date.getFullYear());
    var month = String(date.getMonth() + 1);
    if (date.getMonth() < 9) {
        month = '0' + month;
    }
    var day = String(date.getDate());
    if (date.getDate() < 10) {
        day = '0' + day;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
          //  console.log(JSON.parse(xhttp.responseText));
        }
    };
    xhttp.open("GET", "http://mlb.mlb.com/gdcross/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/master_scoreboard.json", true);
    xhttp.send();

    var queryInfo = {
        active: true,
    }

    chrome.tabs.query(queryInfo, function (tabs) {
	var tab = tabs[0];
        chrome.tabs.executeScript( tab.id, {
            code: 'console.log("hello")'
        });
    });

}, 1000);

/*
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        if(key == 'strike') {
            if(storageChange.newValue) {
                // add listener
            } else {
                // remove listener
            }
        }
    }
});
*/
