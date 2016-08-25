'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');
var shuffle = require('shuffle-array');
var spawn = require('child_process').spawn;
var net = require('net');

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
    var remoteAddress = connection.remoteAddress + ':' + connection.remotePort;
    console.log('new connection from %s', remoteAddress);
    connection.on('data', function (data) {
        var message = data.toString();
        if (message === 'good') {
            console.log('Client said to keep this good music :)');
        } else if (message === 'bad') {
            console.log('Client said to delete this bad music');
        } else {
            console.log('Client said non-handled message : ' + message);
        }
    });
    connection.on('close', function () {
        console.log('Client closed');
    });
    connection.on('error', function (e) {
        console.log('Client error', e);
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

function playFolder (folder, doShuffle) {
    fs.readdir(folder, function (err, files) {
        if (err) {
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
        playList();
    });
}

function playList () {
    // here splice return first item & remove it from playlist
    var filePath = playlist.splice(0, 1);
    playSong(filePath);
}

function playSong (filePath) {
    var player = spawn('lib/1by1/1by1.exe', [filePath, '/hide', '/close']);
    player.stderr.on('data', function (stderr) {
        console.log("\n" + 'Stderr : ' + "\n" + stderr);
    });
    player.on('message', function (message) {
        console.log('player message : ' + message);
    });
    player.on('close', function (code) {
        console.log('player process exited with code ' + code);
        playList();
    });
}

// init
playFolder('D:\\MiCloud\\Music\\brained to test', true);