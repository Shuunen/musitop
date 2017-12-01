'use strict'

import Log from './log'
import Playlist from './playlist'
import Server from './server'

// TODO : this should come from external file
const userOptions = {
    musicPath: '/home/rracamier/Downloads/music',
}

const defaultOptions = {
    port: 1444,
}

export default class App {

    protected options
    protected server
    protected playlist

    constructor() {
        Log.info('App : in constructor')
        this.options = Object.assign({}, userOptions, defaultOptions)
        this.server = new Server(this.options).instance
        this.playlist = new Playlist(this.options)
    }
}

const instance = new App()
