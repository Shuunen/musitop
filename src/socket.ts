'use strict'

import { Http2SecureServer } from 'http2'
import * as WebSocket from 'ws'
import { IAppOptions } from './app'
import Log from './log'
import Song from './song'

export default class Socket {

    instance: WebSocket

    constructor(options: IAppOptions, server: Http2SecureServer) {
        Log.info('Socket : in constructor')
        // initialize the WebSocket server instance
        this.instance = new WebSocket.Server({ server })
        this.instance.on('connection', (ws: WebSocket) => this.onConnection(ws))
    }

    playing(song: Song): void {
        Log.info('Socket : saying to clients that current song is', song)
    }

    onConnection(ws: WebSocket): void {
        // connection is up, let's add a simple simple event
        ws.on('message', (message: string) => {
            // log the received message and send it back to the client
            Log.info('Socket : received: ' + message)
            ws.send(`Hello, you sent -> ${message}`)
        })
        // send immediatly a feedback to the incoming connection
        ws.send('Hi there, I am a WebSocket server')
    }
}
