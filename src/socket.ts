'use strict'

import { Server as SecureServer } from 'https'
import { Server as WebSocketServer, WebSocket } from 'ws'
import Log from './log'
import Song from './song'

export default class Socket {

    instance: WebSocketServer

    constructor(server: SecureServer) {
        Log.info('Socket : in constructor')
        // initialize the WebSocket server instance
        this.instance = new WebSocketServer({ server })
        this.instance.on('connection', (ws: WebSocket) => this.onConnection(ws))
        this.instance.on('open', () => Log.info('Socket : is open'))
        this.instance.on('close', () => Log.info('Socket : is close'))
    }

    playing(song: Song): void {
        Log.info('Socket : saying to clients that current song is', song)
    }

    onConnection(ws: WebSocket): void {
        // connection is up, let's add a simple simple event
        ws.on('message', (message: string) => {
            // log the received message and send it back to the client
            Log.info('Socket : received: ' + message)
            ws.send(`server ws : client said "${message}"`)
        })
        // send immediatly a feedback to the incoming connection
        // Log.info('Socket : sending a message to reply to client connection')
        ws.send('server ws : hi from node !')
    }
}
