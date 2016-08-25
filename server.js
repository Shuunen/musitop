'use strict';

var fs = require('fs');
var path = require('path');
var shuffle = require('shuffle-array');
var spawn = require('child_process').spawn;

function playOneInFolder (folder) {
    fs.readdir(folder, function (err, files) {
        if (err) {
            throw new Error(err);
        }
        var fileNames = [];
        files.forEach(function (fileName) {
            var filePath = path.join(folder, fileName);
            var fileStat = fs.statSync(filePath);
            if (fileStat.isFile()) {
                fileNames.push(fileName)
            }
        });
        playOneOfThese(fileNames);
    });
}

function playOneOfThese (fileNames) {
    if (doShuffle) {
        shuffle(fileNames);
    }
    var fileName = fileNames[0];
    var filePath = folder + '\\' + fileName;
    playThisOne(filePath);
}

function playThisOne (filePath) {
    var player = spawn('lib/1by1/1by1.exe', [filePath, '/hide', '/close']);
    player.stderr.on('data', function (stderr) {
        console.log("\n" + 'Stderr : ' + "\n" + stderr);
    });
    player.on('close', function (code) {
        console.log('player process exited with code ' + code);
    });
}

// init
var folder = 'D:\\MiCloud\\Music\\brained to test';
var doShuffle = true;
playOneInFolder(folder);