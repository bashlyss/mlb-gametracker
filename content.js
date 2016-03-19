// content.js
var firstHref = $("a[href^='http']").eq(0).attr("href");

console.log(firstHref);

window.setInterval(function () {
    var date = new Date();
    var year = String(date.getFullYear());
    var month = String(date.getMonth());
    if (date.getMonth() < 10) {
        month = '0' + month;
    }
    var day = String(date.getDay());
    if (date.getDay() < 10) {
        day = '0' + day;
    }
    $.get("http://mlb.mlb.com/gdcross/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/master_scoreboard,json", function (response) {
        console.log(response);
    });
});
