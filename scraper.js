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
var gameStateListeners = [];

function checkGameState() {
    var newGameState = getGameState();
    var diff = getGameStateDiff(newGameState, gameState);
    if(diff.length) {
        console.log(diff);
        if(diff.indexOf('strikes') != -1) {  // not sure why other lodash functions aren't working
            console.log('strikes diff');
            _.filter(gameStateListeners, {'event': 'strike'}).forEach(function(listener) {
                console.log(listener);
                if(!listener.condition || listener.condition(newGameState.strikes, gameState.strike)) {
                    console.log(listener);
                    listener.callback();
                }
            });
        }
        console.log(diff);
    }
    gameState = newGameState;
}

function bindGameListener(eventName, call, condition) {
    gameStateListeners.push({'event': eventName, callback: call, condition: condition});
}

var gameEvents = [];
jQuery.fn.reverse = [].reverse;

function triggerGameEvent(eventName, newGameEvent) {
    _.filter(gameStateListeners, {'event': eventName}).forEach(function(listener) {
        console.log(listener);
        if(!listener.condition || listener.condition(newGameEvent.description)) {
            console.log(listener);
            listener.callback();
        }
    });
}
function checkGameEvents() {
    $('#events > *').reverse().each(function(){
        var $gameEvent = $(this);
        if($gameEvent.hasClass('play')) {
            var abNum = $gameEvent.find(' > .detail').data('ab-num');
            if(! _.find(gameEvents, {'ab-num': abNum})) {
                var newGameEvent = {
                    'ab-num': abNum,
                    'description': $gameEvent.find('.description').text()
                }
                console.log(newGameEvent);
                gameEvents.push(newGameEvent);

                if(newGameEvent.description.indexOf('singles')) {
                    triggerGameEvent('single', newGameEvent);
                }
            }
        }
    });
}

function startScraper() {
    gameState = getGameState();
    window.setInterval(function(){
        checkGameState();
        checkGameEvents();
    }, 1000);
}

startScraper();

bindGameListener('strike', function(){console.log('STRIKKKEEE!');});
bindGameListener('single', function(){console.log('SINGLE!SINGLE!');});
bindGameListener('play', function(){console.log('There was a play!');});
