'use strict';

var fs = require('fs');
var path = require('path');
var shuffle = require('shuffle-array');
var spawn = require('child_process').spawn;
var net = require('net');
var notifier = require('node-notifier');
// var argv = require('minimist')(process.argv.slice(2));
// console.log(argv);

/***
 *    ___▄▄▄▄▄___▄███▄___█▄▄▄▄____▄___▄███▄___█▄▄▄▄_
 *    __█_____▀▄_█▀___▀__█__▄▀_____█__█▀___▀__█__▄▀_
 *    ▄__▀▀▀▀▄___██▄▄____█▀▀▌_█_____█_██▄▄____█▀▀▌__
 *    _▀▄▄▄▄▀____█▄___▄▀_█__█__█____█_█▄___▄▀_█__█__
 *    ___________▀███▀_____█____█__█__▀███▀_____█___
 *    ____________________▀______█▐____________▀____
 *    ___________________________▐__________________
 */
var port = 6666;
var server = net.createServer();
server.on('connection', handleConnection);
server.listen(port, function () {
    console.log('Musitop server listen on ' + port);
});
function handleConnection (connection) {
    // var remoteAddress = connection.remoteAddress + ':' + connection.remotePort;
    // notify('New connection','From ' + remoteAddress, false);
    connection.on('data', function (data) {
        var message = data.toString();
        if (message === 'good') {
            notify('Will keep', fileName(song), false);
            keepSong();
        } else if (message === 'bad') {
            notify('Client', 'Delete this stuff -_-"', false);
            deleteSong();
        } else if (message === 'next') {
            notify('Client', 'Next song please', false);
            player.kill();
        } else {
            notify('Error', 'Client said non-handled message "' + message + '"', 'error');
        }
    });
    connection.on('error', function (e) {
        notify('Error', 'Client error, see logs', 'error');
        console.log(e);
    });
}

/***
 *    █_▄▄__█____██__▀▄____▄_▄███▄___█▄▄▄▄_
 *    █___█_█____█_█___█__█__█▀___▀__█__▄▀_
 *    █▀▀▀__█____█▄▄█___▀█___██▄▄____█▀▀▌__
 *    █_____███▄_█__█___█____█▄___▄▀_█__█__
 *    _█________▀___█_▄▀_____▀███▀_____█___
 *    __▀__________█__________________▀____
 *    ____________▀________________________
 */
var playlist = [];
var song = '';
var player = null;
var keep = false;

function playFolder (folder, doShuffle) {
    fs.readdir(folder, function (err, files) {
        if (err) {
            notify('Error', 'Fail at reading folder, see logs', 'error');
            throw new Error(err);
        }
        files.forEach(function (fileName) {
            //noinspection JSCheckFunctionSignatures
            var filePath = path.join(folder, fileName);
            var fileStat = fs.statSync(filePath);
            if (fileStat.isFile()) {
                playlist.push(filePath)
            }
        });
        if (doShuffle) {
            shuffle(playlist);
        }
        playNext();
    });
}

function fileName (filePath) {
    // input  : "C:\Stuff\Music\to test\Mike feat. Snowball - Animal.mp3"
    // output : "Mike feat. Snowball - Animal"
    return path.basename(filePath).split('.').reverse().splice(1).reverse().join('.');
}

function playNext () {
    // by default, don't keep newly playing song
    keep = false;
    // here splice return first item & remove it from playlist
    song = playlist.splice(0, 1)[0];
    playSong();
    setTimeout(function () {
        notify('Remaining', playlist.length + ' track(s)', false);
        notify('Playing', fileName(song), false);
    }, 1100);
}

function keepSong () {
    keep = true;
}

function moveSong () {
    doAsync(function (lastSongPath) {
        //noinspection JSCheckFunctionSignatures
        fs.rename(lastSongPath, path.join(keepInFolderPath, path.basename(lastSongPath)), function (err) {
            if (err) throw err;
            notify('Moved', fileName(lastSongPath));
        });
    });
    playNext();
}

function deleteSong () {
    keep = false;
    doAsync(function (lastSongPath) {
        fs.unlink(lastSongPath, function (err) {
            if (err) throw err;
            notify('Deleted', fileName(lastSongPath), 'warn');
        });
    });
    player.kill();
}

function doAsync (callback) {
    if (!callback) {
        notify('Error', 'Do Async need a callback', 'error');
    } else {
        var lastSongPath = song + '';
        setTimeout(function () {
            callback(lastSongPath);
        }, 1000);
    }
}

function notify (action, message, type) {
    if (type !== false) {
        // notify client side
        notifier.notify({
            title: action,
            message: message,
            type: (type || 'info')
        });
    }
    // in order to align logs :p
    while (action.length < 9) {
        action += ' ';
    }
    console.log(action + ' : ' + message);
}

function playSong () {
    player = spawn('lib/1by1/1by1.exe', [song, '/hide', '/close']);
    player.stderr.on('data', function (stderr) {
        notify('Stderr', stderr, 'error');
    });
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

// init
var playFolderPath = 'D:\\MiCloud\\Music\\brained to test';
var keepInFolderPath = 'D:\\MiCloud\\Music\\brained';
playFolder(playFolderPath, true);
spawn('node_modules/electron/dist/electron.exe', ['systray']); // add systray controls