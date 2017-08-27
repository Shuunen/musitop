'use strict'

/***
 *    _██████╗██╗_____██╗███████╗███╗___██╗████████╗
 *    ██╔════╝██║_____██║██╔════╝████╗__██║╚══██╔══╝
 *    ██║_____██║_____██║█████╗__██╔██╗_██║___██║___
 *    ██║_____██║_____██║██╔══╝__██║╚██╗██║___██║___
 *    ╚██████╗███████╗██║███████╗██║_╚████║___██║___
 *    _╚═════╝╚══════╝╚═╝╚══════╝╚═╝__╚═══╝___╚═╝___
 *    ______________________________________________
 */

var httpPort = 1404
var ioClient = require('socket.io-client')
var argv = require('minimist')(process.argv.slice(2))
var musicIs = argv.musicIs || 'smooth'
var socket = ioClient.connect('http://localhost:' + httpPort)

socket.on('connect', function () {
    console.log('Client connected') // eslint-disable-line no-console
    socket.emit('music is', musicIs)
    socket.emit('debug', JSON.stringify(argv))
    socket.disconnect()
})

socket.on('disconnect', function () {
    console.log('Client disconnected') // eslint-disable-line no-console
})

socket.on('error', function (e) {
    console.log('Client error', e) // eslint-disable-line no-console
})
