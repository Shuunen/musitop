'use strict';

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
var port = 1404;
var ioClient = require('socket.io-client');
var argv = require('minimist')(process.argv.slice(2));
var musicIs = argv.musicIs || 'smooth';
var socket = ioClient.connect('http://localhost:' + port);

socket.on('connect', function () {
    console.log('Client connected');
    socket.emit('music is', musicIs);
    socket.emit('debug', JSON.stringify(argv));
    socket.disconnect();
});

socket.on('disconnect', function () {
    console.log('Client disconnected');
});

socket.on('error', function (e) {
    console.log('Client error', e);
});
