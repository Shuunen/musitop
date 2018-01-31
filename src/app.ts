'use strict'

import Log from './log'
import Playlist from './playlist'
import Server from './server'
import Socket from './socket'

export default class App {

    server: Server
    socket: Socket
    playlist: Playlist
    list: string[]

    constructor() {
        Log.info('App      : in constructor')
        this.playlist = new Playlist()
        this.server = new Server(this.playlist)
        this.socket = new Socket(this.server.instance, this.playlist)
    }
}

const instance: App = new App()
Log.debug('App instance created', instance)
