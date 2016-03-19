function sendNotification(text) {
    var queryInfo = {
        active: true
    }
    chrome.tabs.query(queryInfo, function (tabs) {
        var tab = tabs[1];
        chrome.tabs.executeScript(null, { file: "jquery-2.2.2.min.js" }, function() {
            chrome.tabs.executeScript(null, { file: "notification.js" }, function() {
                chrome.tabs.executeScript(null, { code: 'postNotification("' + text + '");'});
            });
        });
    });
}

function getGameState(game) {
    return {
        id: game.gameday,
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
        score: {
                    away: game.linescore.r.away,
                    home: game.linescore.r.home,
               }
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

        if(diff.indexOf('outs') != -1 && newGameState.outs - gameState.outs == 2) {
            _.filter(gameStateListeners, {'event': 'doubleplay'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.outs, gameState.outs)) {
                    listener.callback();
                }
            });
        }

        if(diff.indexOf('score') != -1 && (newGameState.score.away > gameState.score.away || newGameState.score.home > gameState.score.home)) {
            _.filter(gameStateListeners, {'event': 'score'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.score, gameState.score)) {
                    listener.callback(newGameState.score);
                }
            });
        }

        if(diff.indexOf('runners') != -1 && (newGameState.runners.second || newGameState.runners.third)) {
            _.filter(gameStateListeners, {'event': 'risp'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.risp, gameState.risp)) {
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

// Setting so that we have data during the demo even though no games are active :(
var SIMULATE = true;
var state = 0;
var timeout = 4000;
if (SIMULATE) {
	timeout *= 1;
}

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
    function updateState() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var data = JSON.parse(xhttp.responseText).data.games.game;
            if (gameState) {
                checkGameState(data[5]);
            } else {
                gameState = getGameState(data[5]);
            }
			console.log(gameState);
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

    xhttp.onreadystatechange = updateState
	if (!SIMULATE) {
        xhttp.open("GET", "http://mlb.mlb.com/gdcross/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/master_scoreboard.json", true);
	} else {
		xhttp.open("GET", "state_" + String(state) + ".json");
		state += 1;
		if (state === 4) {
			state = 0;
		}
	}
    xhttp.send();
    // sendNotification('My text');

}, timeout);

var strings = {
    strike: 'strike',
    doubleplay: 'double play',
    single: 'single',
    play: 'play',
    risp: 'risp',
    score: 'score',
};

var callbacks = {
    strike: function(){sendNotification(strings.strike)},
    doubleplay: function(){sendNotification(strings.doubleplay);},
    single: function(){sendNotification(strings.single)},
    play: function(){sendNotification(strings.play)},
    risp: function(){sendNotification(strings.risp)},
    score: function(data){sendNotification(strings.score.replace('away', data.away).replace('home', data.home));},
}

var DEBUG_BIND_ALL_EVENTS = false;

_.forEach(callbacks, function(callback, gameEvent) {
    chrome.storage.local.get(gameEvent, function(val) {
        if(val[gameEvent] || DEBUG_BIND_ALL_EVENTS) {
            bindGameListener(gameEvent, callback);
            console.log(gameEvent + ' on');
        }
    });
});

function updateAnnouncer() {
    chrome.storage.local.get('announcer', function(val) {
        var announcer = val.announcer || 'default';
        $.get('https://raw.githubusercontent.com/loewen-uwaterloo/baseball-hackday/master/announcers/' + announcer + '.json', {}, function(data) {
            $.extend(strings, data);
            console.log(strings);
            }, 'json');
    });
}
updateAnnouncer();

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        var callback = callbacks[key];
        if(callback) {
            if(storageChange.newValue) {
                bindGameListener(key, callback);
                console.log('on');
            } else {
                removeGameListener(key);
            }
        }
        if(key == 'announcer') {
            updateAnnouncer();
        }
    }
});

