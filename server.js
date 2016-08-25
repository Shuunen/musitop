'use strict';

var fs = require('fs');
var path = require('path');
var shuffle = require('shuffle-array');
var spawn = require('child_process').spawn;
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
    player.on('close', function (code) {
        console.log('player process exited with code ' + code);
        playList();
    });
}

// init
playFolder('D:\\MiCloud\\Music\\brained to test', true);