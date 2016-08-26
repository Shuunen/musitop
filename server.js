'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');
var shuffle = require('shuffle-array');
var spawn = require('child_process').spawn;
var net = require('net');
var notifier = require('node-notifier');

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
    // console.log('new connection from %s', remoteAddress);
    connection.on('data', function (data) {
        var message = data.toString();
        if (message === 'good') {
            console.log('Client  : keep this one <3');
            notify('Will keep', song);
            keepSong();
        } else if (message === 'bad') {
            console.log('Client  : delete this stuff -_-"');
            deleteSong();
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
    // input  : "C:\Stuff\Music\to test\Miike Sn0wball - Animal.mp3"
    // output : "Miike Sn0wball - Animal"
    return path.basename(filePath).split('.')[0];
}

function playNext () {
    // here splice return first item & remove it from playlist
    song = playlist.splice(0, 1)[0];
    console.log('Playing : ' + fileName(song));
    playSong();
}

function keepSong () {
    keep = true;
}

function moveSong () {
    doAsync(function (lastSongPath) {
        fs.rename(lastSongPath, path.join(keepInFolderPath, path.basename(lastSongPath)), function (err) {
            if (err) throw err;
            notify('Moved', lastSongPath);
        });
    });
    playNext();
}

function deleteSong () {
    doAsync(function (lastSongPath) {
        fs.unlink(lastSongPath, function (err) {
            if (err) throw err;
            notify('Deleted', lastSongPath, 'warn');
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

function notify (action, filePath, type) {
    // notify client side
    notifier.notify({
        title: action,
        message: fileName(filePath),
        type: (type || 'info')
    });
    // in order to align logs :p
    while (action.length < 7) {
        action += ' ';
    }
    console.log(action + ' : ' + fileName(filePath));
}

function playSong () {
    player = spawn('lib/1by1/1by1.exe', [song, '/hide', '/close']);
    player.stderr.on('data', function (stderr) {
        console.log("\n" + 'Stderr : ' + "\n" + stderr);
    });
    player.on('close', function (code) {
        if (code === null || code === 0) {
            if (keep) {
                // start by resetting this toggle
                keep = false;
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