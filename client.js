var argv = require('minimist')(process.argv.slice(2));

// console.log(argv);

/***
 *    _██████╗██╗_____██╗███████╗███╗___██╗████████╗
 *    ██╔════╝██║_____██║██╔════╝████╗__██║╚══██╔══╝
 *    ██║_____██║_____██║█████╗__██╔██╗_██║___██║___
 *    ██║_____██║_____██║██╔══╝__██║╚██╗██║___██║___
 *    ╚██████╗███████╗██║███████╗██║_╚████║___██║___
 *    _╚═════╝╚══════╝╚═╝╚══════╝╚═╝__╚═══╝___╚═╝___
 *    ______________________________________________
 */

var net = require('net');
var port = 6666;
var client = new net.Socket();
client.connect(port, '127.0.0.1', function () {
    console.log('Client connected');
    var musicIs = argv.musicIs || 'smooth';
    client.write(musicIs);
    client.end();
});
client.on('close', function () {
    console.log('Client close');
});
client.on('end', function () {
    console.log('Client end');
});
client.on('error', function (e) {
    console.log('Client error', e);
});