var exec = require('child_process').exec;

var folder = 'D:\\MiCloud\\Music\\brained to test';

var music = 'Benny Smiles - Hotline Theme.mp3';

// close  Close the program after playing one track
// hide Hide the window and enable the Systray icon
// 1by1.exe rain.mp3 /hide /close
var cmd = 'start lib/1by1/1by1.exe _MUSIC_ /hide /close';
cmd = cmd.replace(/_MUSIC_/g, folder + '\\' + music);

exec(cmd, function (error, stdout, stderr) {
    console.log("\n" + 'Error : ' + "\n" + error);
    console.log("\n" + 'Stdout : ' + "\n" + stdout);
    console.log("\n" + 'Stderr : ' + "\n" + stderr);
});