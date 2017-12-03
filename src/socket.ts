'use strict'

import * as WebSocket from 'ws'
import Log from './log'

export default class Socket {

    public instance

    constructor(server) {
        Log.info('Socket : in constructor')
        this.create(server)
    }

    private create(server) {
        // initialize the WebSocket server instance
        this.instance = new WebSocket.Server({ server })
        this.instance.on('connection', (ws: WebSocket) => this.onConnection(ws))
    }

    private onConnection(ws: WebSocket) {
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
