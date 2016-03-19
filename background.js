function sendNotification() {
    var queryInfo = {
        active: true
    }
    chrome.tabs.query(queryInfo, function (tabs) {
        var tab = tabs[1];
        chrome.tabs.executeScript(null, { file: "jquery-2.2.2.min.js" }, function() {
            chrome.tabs.executeScript(null, { file: "notification.js" });
        });
    });
}

function getGameState(game) {
    return {
        teams: {
                   away: game.away_name_abbrev,
                   home: game.home_name_abbrev,
               },
        runners: {
                     first: game.runners_on_base.hasOwnProperty('runner_on_1b'),
                     second: game.runners_on_base.hasOwnProperty('runner_on_2b'),
                     third: game.runners_on_base.hasOwnProperty('runner_on_3b')

                 },
        balls: parseInt(game.status.b),
        strikes: parseInt(game.status.s),
        outs: parseInt(game.status.o),
    }
}

function getGameStateDiff(a, b) {
    return _.reduce(a, function(result, value, key) {
		if (key in ['balls', 'strikes', 'outs']) {
			return value > b[key] ? result : result.concat(key);
		}
        return _.isEqual(value, b[key]) ? result : result.concat(key);
    }, []);
}

var gameState = null;
var gameStateListeners = [];

function checkGameState(game) {
    var newGameState = getGameState(game);
    var diff = getGameStateDiff(newGameState, gameState);
    if(diff.length) {
        if(diff.indexOf('strikes') != -1) {  // not sure why other lodash functions aren't working
            _.filter(gameStateListeners, {'event': 'strike'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.strikes, gameState.strike)) {
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


function triggerGameEvent(eventName, newGameEvent) {
    _.filter(gameStateListeners, {'event': eventName}).forEach(function(listener) {
        if(!listener.condition || listener.condition(newGameEvent.description)) {
            listener.callback();
        }
    });
}

bindGameListener('strike', function(){console.log('STRIKKKEEE!');});
bindGameListener('single', function(){console.log('SINGLE!SINGLE!');});
bindGameListener('play', function(){console.log('There was a play!');});



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
            var data = JSON.parse(xhttp.responseText).data.games.game;
            if (gameState) {
                checkGameState(data[4]);
            } else {
                gameState = getGameState(data[4]);
            }
            var queryInfo = {
                active: true,
            }

            chrome.tabs.query(queryInfo, function (tabs) {
                var tab = tabs[0];
                chrome.tabs.executeScript( tab.id, {
                    code: 'console.log("hello")'
                });
            });

        }
    };
    xhttp.open("GET", "http://mlb.mlb.com/gdcross/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/master_scoreboard.json", true);
    xhttp.send();

}, 1000);

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

