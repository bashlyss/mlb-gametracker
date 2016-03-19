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

function getTeam(loc) {
    var $score = $('#boxscore .secondary.scores .' + loc + ' td');
    return {
        name: $('#boxscore .secondary.teams .' + loc + ' .full').text(),
        shortName: $('#boxscore .secondary.teams .' + loc + ' .short').text(),
        runs: $score.eq(0).text(),
        hits: $score.eq(1).text(),
        errors: $score.eq(2).text(),
    }
}

function getGameState() {
    return {
        teams: {
                   away: getTeam('away'),
                   home: getTeam('home'),
               },
        runners: getRunners(),
        balls: getCount('balls'),
        strikes: getCount('strikes'),
        outs: getCount('outs'),
    }

}

function getGameStateDiff(a, b) {
    return _.reduce(a, function(result, value, key) {
        return _.isEqual(value, b[key]) ?
        result : result.concat(key);
    }, []);
}

var gameState = null;

function startScraper() {
    gameState = getGameState();
    window.setInterval(function(){
        var newGameState = getGameState();
        var diff = getGameStateDiff(newGameState, gameState);
        if(diff.length) {
            console.log(diff);
        }
        gameState = newGameState;
    }, 1000);
}

startScraper();
