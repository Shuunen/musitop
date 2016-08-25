'use strict';

var spawn = require('child_process').spawn;

var folder = 'D:\\MiCloud\\Music\\brained to test';

var music = 'Benny Smiles - Hotline Theme.mp3';

var musicPath = folder + '\\' + music;

// close  Close the program after playing one track
// hide Hide the window and enable the Systray icon
// 1by1.exe rain.mp3 /hide /close

var player = spawn('lib/1by1/1by1.exe', [musicPath, '/hide', '/close']);

player.stdout.on('data', function (stdout) {
    console.log("\n" + 'Stdout : ' + "\n" + stdout);
});

player.stderr.on('data', function (stderr) {
    console.log("\n" + 'Stderr : ' + "\n" + stderr);
});

player.on('close', function (code) {
    console.log('player process exited with code ' + code);
});