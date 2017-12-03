'use strict'

import Log from './log'
import Playlist from './playlist'
import Server from './server'
import Socket from './socket'

// TODO : this should come from external file
const userOptions = {
    musicPath: 'D:/Cloud/music/good',
}

const defaultOptions = {
    port: 1444,
}

export default class App {

    protected options
    protected server
    protected socket
    protected playlist

    constructor() {
        Log.info('App : in constructor')
        this.options = Object.assign({}, userOptions, defaultOptions)
        this.server = new Server(this.options).instance
        this.socket = new Socket(this.server).instance
        this.playlist = new Playlist(this.options)
    }
}

const instance = new App()
