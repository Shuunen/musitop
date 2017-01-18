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

// WEB
var http = require('http');
var svgPatterns = [];
var svgPatternPath = 'patterns';
fs.readdir(svgPatternPath, function (err, files) {
    if (err) {
        notify('Error', 'Fail at reading patterns path, see logs', 'error');
        throw new Error(err);
    }
    files.forEach(function (fileName) {
        svgPatterns.push(svgPatternPath + '/' + fileName);
    });
});

var sendDynamicValues = function (bForce) {
    if (bForce) {
        updatedData = true;
    }
    if (!updatedData) {
        notify('info', 'no new data to send');
        return;
    }
    // notify('info', 'sending dynamic values to clients');
    io.emit('options', {
        audioClientSide: config.get('audioClientSide')
    });
    io.emit('metadata', metadata);
    updatedData = false;
};

var server = http.createServer(function (request, response) {

    var code = 200;
    var contentType = '';
    var url = request.url;
    var match = url.match(/^\/(v)?(\d)?/);
    var layoutVersion = (match && match[2]) ? match[2] : '2';

    if (url === '/') {
        contentType = 'text/html';
        url = 'layouts/v' + layoutVersion + '.html';
    } else if (url.indexOf('.mp3') !== -1) {
        url = song;
        contentType = 'audio/mpeg';
    } else if (url.indexOf('.svg') !== -1) {
        contentType = 'image/svg+xml';
    } else if (url.indexOf('.png') !== -1) {
        contentType = 'image/png';
    } else if (url.indexOf('.ico') !== -1) {
        contentType = 'image/vnd.microsoft.icon';
    } else if (url.indexOf('.js') !== -1) {
        contentType = 'application/javascript';
    } else {
        code = 404;
    }
    if (code !== 404) {
        if (url[0] === '/') {
            url = url.substr(1);
        }
        var fileStat = null;
        try {
            fileStat = fs.statSync(url);
        } catch (e) {
            notify('Error', 'cannot read file : ' + url);
        }
        if (fileStat && fileStat.isFile()) {
            response.writeHead(code, {
                'Content-Type': contentType
            });
            // notify('Info', 'router serve file : ' + url);
            var file = fs.readFileSync(url);
            response.end(file, 'binary');
            if (contentType === 'text/html') {
                updatedData = true;
            }
        } else {
            code = 404;
        }
    }
    if (code === 404) {
        response.writeHead(code, {
            'Content-Type': 'text/plain'
        });
        if (url.indexOf('.map') === -1) {
            notify('Error', 'router cannot serve file : ' + url);
        }
        response.end('file or resource not found :\'(');
    }
});

server.listen(port, function () {
    notify('Server', 'Musitop server started on http://localhost:' + port);
});

// SOCKET
var onDisconnect = function () {
    notify('Socket', 'server side disconnected');
};

var onConnection = function () {
    notify('Socket', 'server side connection established');
};

var onMusicIs = function (musicIs) {
    if (musicIs === 'good') {
        notify('Client', 'Keep this song :D');
        keepSong();
    } else if (musicIs === 'bad') {
        notify('Client', 'Delete this song :|');
        deleteSong();
    } else if (musicIs === 'next') {
        notify('Client', 'Next song please :)');
        playNext();
    } else {
        notify('Error', 'Client said that music is "' + musicIs + '" ?!?', 'error');
    }
};

var onError = function (e) {
    notify('Error', 'Client error, see logs', 'error');
    notify('error', e);
};

var updatedData = false;
var io = require('socket.io')(server);
var connectSocket = function () {
    notify('Socket', 'server connecting...');
    io.on('connection', function (socket) {
        notify('Socket', 'server side connection detected');
        socket.on('music is', onMusicIs);
        socket.on('error', onError);
        socket.on('disconnect', onDisconnect);
        socket.on('connect', onConnection);
        sendDynamicValues();
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
var keep = false;
var metadata = null;
var startTimestamp = null;

function playFolder() {
    var musicPath = config.get('musicPath');
    notify('Scanning', '"' + musicPath + '"' + ' for songs');
    fs.readdir(musicPath, function (err, files) {
        if (err) {
            config.trash();
            notify('Error', 'Fail at reading musicPath, see logs', 'error');
            throw new Error(err);
        }
        files.forEach(function (fileName) {
            var filePath = path.join(musicPath, fileName);
            var fileStat = fs.statSync(filePath);
            if (fileStat.isFile() && (fileName.indexOf('.mp3') !== -1)) {
                playlist.push(filePath);
            }
        });

        if (config.get('shuffleMusic')) {
            shuffle(playlist);
        }
        playNext();
    });
}

function fileName(filePath) {
    // input  : "C:\Stuff\Music\to test\Mike feat. Snowball - Animal.mp3"
    // output : "Mike feat. Snowball - Animal"
    return path.basename(filePath).split('.').reverse().splice(1).reverse().join('.');
}

function playNext() {
    // by default, don't keep newly playing song
    keep = false;
    // here splice return first item & remove it from playlist
    song = playlist.splice(0, 1)[0];
    getMetadata();
    // if audio output is server side
    if (!config.get('audioClientSide')) {
        playSong();
    }
    setTimeout(function () {
        notify('Remaining', playlist.length + ' track(s)');
        notify('Playing', fileName(song), 'info');
        sendDynamicValues(true);
    }, 1100);
}

function getMetadata() {
    startTimestamp = Math.round(Date.now() / 1000);
    var readableStream = fs.createReadStream(song);
    musicMetadata(readableStream, {
        duration: true
    }, function (err, meta) {
        if (err) {
            notify('Error', 'Fail at reading mp3 metadata for ' + song + ', see logs', 'error');
        }
        metadata = meta;
        metadata.startTimestamp = startTimestamp;
        metadata.stream = '/stream.mp3';
        readableStream.close();
    });
}

function keepSong() {
    keep = true;
}

function moveSong() {

    doAsync(function (lastSongPath) {
        var newLastSongPath = path.join(config.get('keepPath'), path.basename(lastSongPath));

        // notify('Info', 'will move it to : "' + newLastSongPath + '"');
        fs.rename(lastSongPath, newLastSongPath, function (err) {
            if (err) throw err;
            notify('Moved', fileName(lastSongPath));
        });
    });

    playNext();
}

function deleteSong() {
    keep = false;
    doAsync(function (lastSongPath) {
        fs.unlink(lastSongPath, function (err) {
            if (err) {
                notify('Error', 'Delete failed, see logs');
                notify('Error', err);
            } else {
                notify('Deleted', fileName(lastSongPath));
            }
        });
    });

    if (player) {
        player.kill();
    }
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

function notify(action, message, type) {
    if (type) {
        // notify client side
        notifier.notify({
            title: action,
            message: message,
            type: type
        });
    }
    // in order to align logs :p
    while (action.length < 9) {
        action += ' ';
    }
    console.log(action + ' : ' + message); // eslint-disable-line no-console
}

function playSong() {

    if (player) {
        player.kill();
    }

    if (isLinux) {
        player = childProcess.spawn('cvlc', [song, '--play-and-exit']);
    } else {
        player = childProcess.spawn('lib/1by1/1by1.exe', [song, '/hide', '/close']);
    }

    player.on('close', function (code) {
        if (code === null || code === 0) {
            if (keep) {
                moveSong();
            } else {
                playNext();
            }
        } else {
            notify('Error', 'Player process exited with non-handled code "' + code + '"', 'error');
        }
    });
}

function getConfigFromUser(callback) {
    notify('Conf', 'will ask user for conf then save it locally');
    config.prompt({
        all: true,
        nodeEnv: false,
        silent: false
    }, function (err) {

        if (err) {
            config.trash();
            notify('Error', 'Fail at reading config, see logs', 'error');
            throw new Error(err);
        }
        // move conf file in config store to local folder
        // from : C:\Users\ME\.config\configstore\musitop.json
        // to   : .
        // notify('Config path', config.path);
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
            notify('Info', 'No local config found');
        } else {
            notify('Info', 'Local config found, set found conf key/values into in-memory conf');
            config.all = JSON.parse(configContent);
        }
        var configErrors = config.validate();
        if (err || configErrors.length) {
            getConfigFromUser(callback);
        } else if (callback && typeof callback === 'function') {
            callback();
        } else {
            notify('Error', 'no callback provided');
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
