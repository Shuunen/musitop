'use strict';

/***
 *    ___▄▄▄▄▄___▄███▄___█▄▄▄▄____▄___▄███▄___█▄▄▄▄_
 *    __█_____▀▄_█▀___▀__█__▄▀_____█__█▀___▀__█__▄▀_
 *    ▄__▀▀▀▀▄___██▄▄____█▀▀▌_█_____█_██▄▄____█▀▀▌__
 *    _▀▄▄▄▄▀____█▄___▄▀_█__█__█____█_█▄___▄▀_█__█__
 *    ___________▀███▀_____█____█__█__▀███▀_____█___
 *    ____________________▀______█▐____________▀____
 *    ___________________________▐__________________
 */
var fs = require('fs');
var path = require('path');
var musicMetadata = require('musicmetadata');
var port = 1404;
var express = require('express');
var https = require('https');
var app = express();
var ip = require('ip').address();
var options = {
    key: fs.readFileSync('./certs/server.key'),
    cert: fs.readFileSync('./certs/server.crt')
};
var server = https.createServer(options, app);
var io = require('socket.io')(server);

app.use('/', express.static('web'));

app.get('/stream.mp3', function (req, res) {
    res.sendFile(song);
});
/*
app.listen(port, function () {
    notify('Server', 'Musitop server started on https://' + ip + ':' + port);
});
*/
server.listen(port, function () {
    notify('Server', 'Musitop server started on https://' + ip + ':' + port);
});

// SOCKET
var onDisconnect = function () {
    // notify('Socket', 'server side disconnected');
};

var onConnection = function () {
    notify('Socket', 'Server side connection established');
};

var onMusicIs = function (musicIs) {
    if (musicIs === 'good') {
        notify('Client', '★ Keep this song :D');
        notify('Will keep', fileName(song), 'info');
        keep = true;
        io.emit('music was', musicIs);
    } else if (musicIs === 'bad') {
        notify('Client', '✕ Delete this song :|');
        notify('Deleting', fileName(song), 'info');
        deleteSong();
        playNext('onMusicIs bad');
        io.emit('music was', musicIs);
    } else if (musicIs === 'next') {
        notify('Client', '» Next song please :)');
        if (keep) {
            moveSong();
        }
        playNext('onMusicIs next');
        io.emit('music was', musicIs);
    } else if (musicIs === 'pause') {
        notify('Client', '|| Pause song please');
        io.emit('pause', 'please :)');
    } else {
        notify('Server', 'Client said that music is "' + musicIs + '" ?!?', 'info');
    }
};

var onError = function (err) {
    notify('Socket', 'Client had errors', 'error', err);
};

var onEvent = function (e) {
    notify('Event', e);
};

// var io = require('socket.io')(socketPort);
var connectSocket = function () {
    notify('Socket', 'Server connecting...');
    io.on('connection', function (socket) {
        // notify('Socket', 'Server side connection detected');
        socket.on('music is', onMusicIs);
        socket.on('error', onError);
        socket.on('disconnect', onDisconnect);
        socket.on('connect', onConnection);
        socket.on('event', onEvent);
        io.emit('options', {
            audioClientSide: config.get('audioClientSide')
        });
        io.emit('metadata', metadata);
    });
};

connectSocket();

/***
 *    █_▄▄__█____██__▀▄____▄_▄███▄___█▄▄▄▄_
 *    █___█_█____█_█___█__█__█▀___▀__█__▄▀_
 *    █▀▀▀__█____█▄▄█___▀█___██▄▄____█▀▀▌__
 *    █_____███▄_█__█___█____█▄___▄▀_█__█__
 *    _█________▀___█_▄▀_____▀███▀_____█___
 *    __▀__________█__________________▀____
 *    ____________▀________________________
 */
var childProcess = require('child_process');
var notifier = require('node-notifier');
var os = require('os');
var isLinux = (os.type() === 'Linux');
var configFile = 'config.json';
var config = require('config-prompt')({
    musicPath: {
        type: 'string',
        required: true
    },
    keepPath: {
        type: 'string',
        required: true
    },
    audioClientSide: {
        type: 'boolean',
        default: true,
        required: false
    },
    keepFeature: {
        type: 'boolean',
        default: true,
        required: false
    },
    deleteFeature: {
        type: 'boolean',
        default: true,
        required: false
    },
    shuffleMusic: {
        type: 'boolean',
        default: true
    }
});
var shuffle = require('shuffle-array');
var playlist = [];
var song = '';
var player = null;
var autoKill = false;
var manualKill = false;
var keep = false;
var metadata = null;
var startTimestamp = null;

function playFolder() {
    var musicPath = config.get('musicPath');
    notify('Server', 'Scanning "' + musicPath + '"' + ' for songs');
    fs.readdir(musicPath, function (err, files) {
        if (err) {
            config.trash();
            notify('Error', 'Failed at reading musicPath', 'error', err);
        } else {
            // inject files
            files.forEach(function (fileName) {
                var filePath = path.join(musicPath, fileName);
                var fileStat = fs.statSync(filePath);
                if (fileStat.isFile() && (fileName.indexOf('.mp3') !== -1)) {
                    playlist.push(filePath);
                }
            });
            // shuffle if necessary
            if (config.get('shuffleMusic')) {
                shuffle(playlist);
            }
            // start playing
            playNext('playFolder');
        }
    });
}

function fileName(filePath) {
    // input  : "C:\Stuff\Music\to test\Mike feat. Snowball - Animal.mp3"
    // output : "Mike feat. Snowball - Animal"
    return path.basename(filePath).split('.').reverse().splice(1).reverse().join('.');
}

function playNext() {
    // notify('Server', 'playNext init' + (from ? ' from : ' + from : ''));
    // here splice return first item & remove it from playlist
    song = playlist.splice(0, 1)[0];
    getMetadata();
    // if audio output is server side
    if (!config.get('audioClientSide')) {
        playSong();
    }
    setTimeout(function () {
        notify('Server', '♫ Remaining ' + playlist.length + ' track(s)');
        notify('Playing', fileName(song), 'info');
        io.emit('metadata', metadata);
    }, 1100);
}

function getMetadata() {
    metadata = null;
    startTimestamp = Math.round(Date.now() / 1000);
    var readableStream = fs.createReadStream(song);
    musicMetadata(readableStream, {
        duration: true
    }, function (err, meta) {
        if (err) {
            notify('Error', 'Fail at reading mp3 metadata for song "' + song + '"', 'error', err);
        } else {
            metadata = meta;
            metadata.startTimestamp = startTimestamp;
            metadata.stream = '/stream.mp3';
            readableStream.close();
        }
    });
}

function moveSong() {
    // notify('Server', 'moveSong init');
    // because keep was true, we came here in moveSong
    // first thing to do is to reset this toggle :)
    keep = false;
    // because the file is actually read/locked by player
    // will move the file in an async way
    doAsync(function (lastSongPath) {
        var newLastSongPath = path.join(config.get('keepPath'), path.basename(lastSongPath));
        // notify('Server', 'will move it to : "' + newLastSongPath + '"');
        fs.rename(lastSongPath, newLastSongPath, function (err) {
            if (err) {
                notify('Server', 'Move failed, see me');
                throw new Error(err);
            } else {
                notify('Server', '> Moved ' + fileName(lastSongPath));
            }
        });
    });
}

function deleteSong() {
    doAsync(function (lastSongPath) {
        fs.unlink(lastSongPath, function (err) {
            if (err) {
                notify('Error', 'Delete failed', 'error', err);
            } else {
                notify('Server', '✕ Deleted ' + fileName(lastSongPath));
            }
        });
    });
}

function doAsync(callback) {
    if (!callback) {
        notify('Error', 'Do Async need a callback', 'error');
    } else {
        var lastSongPath = song + '';
        setTimeout(function () {
            callback(lastSongPath);
        }, 1000);
    }
}

function notify(action, message, type, bonus) {
    if (type) {
        // notify client side
        notifier.notify({
            title: action,
            message: message,
            type: type
        });
        type = null;
    }
    // in order to align logs :p
    var actionAligned = action;
    while (actionAligned.length < 6) {
        actionAligned += ' ';
    }
    console.log(actionAligned + ' : ' + message); // eslint-disable-line no-console
    if (bonus) {
        console.log(bonus); // eslint-disable-line no-console
    }
    if (action.toLowerCase() === 'error') {
        process.exit(0);
    }
}

function playSong() {
    // notify('playSong', 'autoKill is ' + autoKill);
    if (player && !autoKill) {
        // if any player we kill it, we don't want to have multiple players at the same time
        // notify('playSong', 'manualKill was ' + manualKill + ', now true');
        manualKill = true;
        player.kill();
    }

    if (isLinux) {
        // use cvlc on linux
        player = childProcess.spawn('cvlc', [song, '--play-and-exit']);
    } else {
        // use 1by1 on win
        player = childProcess.spawn('lib/1by1/1by1.exe', [song, '/hide', '/close']);
    }

    // because new player started
    // notify('playSong', 'autoKill was ' + autoKill + ', now false');
    autoKill = false;

    // when user did not asked anything, player close by itself
    player.on('close', function (code) {
        // notify('close', 'manualKill is ' + manualKill);
        if (manualKill) {
            // notify('Server', 'Player closed, was manual kill');
            // this avoid making move or play next if player was killed on purpose
            // notify('close', 'manualKill was ' + manualKill + ', now false');
            // notify('close', 'autoKill was ' + autoKill + ', now false');
            manualKill = false;
            autoKill = false;
        } else {
            // notify('Server', 'Player closed, was auto kill');
            // notify('close', 'autoKill was ' + autoKill + ', now true');
            autoKill = true;
            // here player just went until the end of the song & then exited
            if (code === null || code === 0) {
                if (keep) {
                    moveSong();
                }
                playNext('player closed');
            } else {
                notify('Server', 'Player process exited with non-handled code "' + code + '"', 'error');
            }
        }
    });
}

function getConfigFromUser(callback) {
    notify('Server', 'Will ask user for conf then save it locally');
    config.prompt({
        all: true,
        nodeEnv: false,
        silent: false
    }, function (err) {

        if (err) {
            config.trash();
            notify('Server', 'Failed at reading config, see logs', 'error', err);
        }
        // move conf file in config store to local folder
        // from : C:\Users\ME\.config\configstore\musitop.json
        // to   : .
        // notify('Server', 'Config path ' + config.path);
        fs.createReadStream(config.path).pipe(fs.createWriteStream(configFile));

        // if any callback, execute it
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
}

function getConfig(callback) {
    // get local config
    fs.readFile(configFile, function (err, configContent) {
        if (err) {
            notify('Server', 'No local config found');
        } else {
            notify('Server', 'Local config found, set found conf key/values into in-memory conf');
            config.all = JSON.parse(configContent);
        }
        var configErrors = config.validate();
        if (err || configErrors.length) {
            getConfigFromUser(callback);
        } else if (callback && typeof callback === 'function') {
            callback();
        } else {
            notify('Error', 'Error, no callback provided', 'error');
        }
    });
}

function init() {
    // get conf then play music
    getConfig(playFolder);
    // add systray controls
    childProcess.spawn('node_modules/electron/dist/electron', ['systray']);
}

// init
setTimeout(init, 100);
