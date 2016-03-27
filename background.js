// Testing config information
var SIMULATE = false; // Set to false for live data
var SIMULATION_STATE = 0;
var TIMEOUT = 1000;
var UPDATE_TIMEOUT = 30000;
if (SIMULATE) {
    TIMEOUT *= 8;
}

var team = '';

function sendNotification(url, text, home, away) {
    var queryInfo = {
        active: true
    }
    chrome.tabs.query(queryInfo, function (tabs) {
        chrome.tabs.executeScript(null, { file: "jquery-2.2.2.min.js" }, function() {
            chrome.tabs.executeScript(null, { file: "notification.js" }, function() {
                var runScript = 'postNotification("' + url + '", "' + text + '", "' + gameState.teams.home +'", "' + gameState.teams.away + '");'
                chrome.tabs.executeScript(null, { code: runScript });
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
    var url = 'http://mlb.mlb.com/mlb/gameday/index.jsp?gid=' + newGameState.id;
    var diff = getGameStateDiff(newGameState, gameState);
    if(diff.length) {
        if(diff.indexOf('strikes') != -1) {  // not sure why other lodash functions aren't working
            _.filter(gameStateListeners, {'event': 'strike'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.strikes, gameState.strikes)) {
                    listener.callback(url, newGameState);
                }
            });
        }

        if(diff.indexOf('balls') != -1) {  // not sure why other lodash functions aren't working
            _.filter(gameStateListeners, {'event': 'ball'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.balls, gameState.balls)) {
                    listener.callback(url, newGameState);
                }
            });
        }

        if(diff.indexOf('outs') != -1 && newGameState.outs - gameState.outs == 2) {
            _.filter(gameStateListeners, {'event': 'doubleplay'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.outs, gameState.outs)) {
                    listener.callback(url);
                }
            });
        }

        if(diff.indexOf('score') != -1 && (newGameState.score.away > gameState.score.away || newGameState.score.home > gameState.score.home)) {
            _.filter(gameStateListeners, {'event': 'score'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.score, gameState.score)) {
                    listener.callback(url, newGameState.score);
                }
            });
        }

        if(diff.indexOf('runners') != -1 && (newGameState.runners.second || newGameState.runners.third)) {
            _.filter(gameStateListeners, {'event': 'risp'}).forEach(function(listener) {
                if(!listener.condition || listener.condition(newGameState.risp, gameState.risp)) {
                    listener.callback(url);
                }
            });
        }

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

window.setInterval(function () {
    chrome.storage.local.get('enabled', function(val) {
        if(val.enabled) {
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
                    // TODO Get game state for a specific game based on team/timeslot
                    _.forEach(data, function (game) {
                        if (team === game.away_name_abbrev || team === game.home_name_abbrev) {
                            if (gameState) {
                                checkGameState(game);
                            } else {
                                gameState = getGameState(game);
                            }
                        }
                    });;
                    var queryInfo = {
                        active: true,
                    };
                }
            }

            xhttp.onreadystatechange = updateState
            if (!SIMULATE) {
                xhttp.open("GET", "http://mlb.mlb.com/gdcross/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/master_scoreboard.json", true);
            } else {
                xhttp.open("GET", "state_" + String(SIMULATION_STATE) + ".json");
                SIMULATION_STATE += 1;
                if (SIMULATION_STATE === 4) {
                    SIMULATION_STATE = 0;
                }
            }
            xhttp.send();
            // sendNotification('My text');
        };
    });
}, TIMEOUT);


window.setInterval(function () {
    chrome.storage.local.get('team', function(val) {
        team = val.team;
    });
}, UPDATE_TIMEOUT);

var strings = {
    strike: 'strike balls-strikes',
    ball: 'ball balls-strikes',
    doubleplay: 'double play',
    single: 'single',
    play: 'play',
    risp: 'risp',
    score: 'score home-away',
};

var callbacks = {
    strike: function(url, data){sendNotification(url, strings.strike.replace('balls', data.balls).replace('strikes', data.strikes))},
    ball: function(url, data){sendNotification(url, strings.ball.replace('balls', data.balls).replace('strikes', data.strikes))},
    doubleplay: function(url){sendNotification(url, strings.doubleplay);},
    single: function(url){sendNotification(url, strings.single)},
    play: function(url){sendNotification(url, strings.play)},
    risp: function(url){sendNotification(url, strings.risp)},
    score: function(url, data){sendNotification(url, strings.score.replace('away', data.away).replace('home', data.home));},
}

var DEBUG_BIND_ALL_EVENTS = false;

_.forEach(callbacks, function(callback, gameEvent) {
    chrome.storage.local.get(gameEvent, function(val) {
        if(val[gameEvent] || DEBUG_BIND_ALL_EVENTS) {
            bindGameListener(gameEvent, callback);
        }
    });
});

function updateAnnouncer() {
    chrome.storage.local.get('announcer', function(val) {
        var announcer = val.announcer || 'default';
        $.get('https://raw.githubusercontent.com/loewen-uwaterloo/baseball-hackday/master/announcers/' + announcer + '.json', {}, function(data) {
            $.extend(strings, data);
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
            } else {
                removeGameListener(key);
            }
        }
        if(key == 'announcer') {
            updateAnnouncer();
        }
    }
});

