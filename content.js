// content.js
var firstHref = $("a[href^='http']").eq(0).attr("href");

console.log(firstHref);






function getRunners() {
    var bases = [];
    if ($('.bases_container .base.first.active').length) {
        bases.push(1);
    }
    if ($('.bases_container .base.second.active').length) {
        bases.push(2);
    }
    if ($('.bases_container .base.third.active').length) {
        bases.push(3);
    }
    return bases
}

window.setInterval(function(){
    console.log('runners on base: ' + getRunners())
}, 1000);
