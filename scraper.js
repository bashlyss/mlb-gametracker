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
        if(diff.indexOf('strikes') != -1) {  // not sure why other lodash functions aren't working
            _.filter(gameStateListeners, {'event': 'strike'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.strikes, gameState.strike)) {
                    listener.callback();
                }
            });
        }

        if(diff.indexOf('outs') != -1 && newGameState.outs - gameState.outs == 2) {
            _.filter(gameStateListeners, {'event': 'doubleplay'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.outs, gameState.outs)) {
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
function removeGameListener(eventName) {
    gameStateListeners = _.filter(gameStateListeners, function(val){ return val.event != eventName });
}

var gameEvents = [];
jQuery.fn.reverse = [].reverse;

function triggerGameEvent(eventName, newGameEvent) {
    _.filter(gameStateListeners, {'event': eventName}).forEach(function(listener) {
        if(!listener.condition || listener.condition(newGameEvent.description)) {
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

                if(newGameEvent.description.indexOf('singles') > 0) {
                    triggerGameEvent('single', newGameEvent);
                }

                triggerGameEvent('play', newGameEvent);
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


var callbacks = {
    strike: function(){alert('STRIKKKEEE!');},
    doubleplay: function(){alert('DOUBLE PLAY');},
    single: function(){console.log('SINGLE!SINGLE!');},
    play: function(){console.log('There was a play!');}
}

var DEBUG_BIND_ALL_EVENTS = false;

_.forEach(callbacks, function(callback, gameEvent) {
    chrome.storage.local.get(gameEvent, function(val) {
        if(val[gameEvent] || DEBUG_BIND_ALL_EVENTS) {
            bindGameListener(gameEvent, callback);
            console.log('on');
        }
    });
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        var callback = callbacks[key];
        if(callback) {
            if(storageChange.newValue) {
                bindGameListener(key, callback);
                console.log('on');
            } else {
                // remove listener
            }
        }
    }
});

