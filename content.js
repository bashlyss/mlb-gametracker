// content.js
var firstHref = $("a[href^='http']").eq(0).attr("href");

console.log(firstHref);

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
    $.get("http://mlb.mlb.com/gdcross/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/master_scoreboard.json", function (response) {
        console.log(response);
    });
}, 1000);
