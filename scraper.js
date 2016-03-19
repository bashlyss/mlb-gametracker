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

function getCount(field) {
    var $wrapper = $('.bso .' + field);
    if($wrapper.find('.four.active').length) {
        return 4;
    }
    if($wrapper.find('.three.active').length) {
        return 3;
    }
    if($wrapper.find('.two.active').length) {
        return 2;
    }
    if($wrapper.find('.one.active').length) {
        return 1;
    }
    return 0;
}

window.setInterval(function(){
    console.log('runners on base: ' + getRunners())
    console.log('balls: ' + getCount('balls'))
    console.log('strikes: ' + getCount('strikes'))
    console.log('outs: ' + getCount('outs'))
}, 1000);
