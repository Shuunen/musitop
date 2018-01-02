'use strict'

import { Server as SecureServer } from 'https'
import { Server as WebSocketServer, WebSocket } from 'ws'
import Log from './log'
import Song from './song'

export default class Socket {

    messagesToBroadcast: string[] = ['next-song', 'love-song', 'hate-song', 'pause-song']
    instance: WebSocketServer
    clients: WebSocket[]

    constructor(server: SecureServer) {
        Log.info('Socket : in constructor')
        // initialize the WebSocket server instance
        this.clients = []
        this.instance = new WebSocketServer({ server })
        this.instance.on('connection', (ws: WebSocket) => this.onConnection(ws))
        this.instance.on('open', () => Log.info('Socket : is open'))
        this.instance.on('close', () => Log.info('Socket : is close'))
    }

    playing(song: Song): void {
        Log.info('Socket : saying to clients that current song is', song)
    }

    onConnection(ws: WebSocket): void {
        this.addClient(ws)
        // connection is up, let's add a simple simple event
        ws.on('message', (message: string) => {
            // log the received message and send it back to the client
            // if the message need to be broadcasted to clients
            if (this.messagesToBroadcast.indexOf(message) !== -1) {
                Log.info('Socket : received action "' + message + '"')
                this.broadcast(message)
            } else {
                Log.info('Socket : received non-handled message "' + message + '"')
            }
        })
    }

    addClient(client: WebSocket): void {
        this.clients.push(client)
        Log.info(`Socket : ${this.clients.length} client(s) connected !`)
    }

    broadcast(action: string): void {
        if (!this.clients.length) {
            Log.info('Socket : no clients = no broadcast :)')
        } else {
            Log.info(`Socket : broadcasting "${action}" to ${this.clients.length} client(s)`)
        }
        let clientsToDelete: number[] = []
        this.clients.forEach((client, index) => {
            try {
                client.send(action)
            } catch (error) {
                const msg: string = error.message
                if (msg.includes('not opened')) {
                    clientsToDelete.push(index)
                } else {
                    Log.error('Socket : unhandled error :')
                    Log.error(error)
                }
            }
        })
        if (clientsToDelete.length) {
            Log.info(`Socket : deleting ${clientsToDelete.length} unusable client(s) of ${this.clients.length}`)
            // reverse to delete indexes from higher to lower to avoid deleting wrong indexes
            clientsToDelete = clientsToDelete.reverse()
            clientsToDelete.forEach(clientIndex => this.clients.splice(clientIndex, 1))
        }
    }
}
