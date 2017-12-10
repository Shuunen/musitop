'use strict'

import userOptions from '../config'
import Log from './log'
import Playlist from './playlist'
import Server from './server'
import Socket from './socket'

const defaultOptions = {
    host: 'musitop.io',
    port: 1606,
}

export default class App {

    protected options
    protected server
    protected socket
    protected playlist

    constructor() {
        Log.info('App : in constructor')
        const options = Object.assign({}, defaultOptions, userOptions)
        this.options = options
        this.server = new Server(options).instance
        this.socket = new Socket(this.server).instance
        this.playlist = new Playlist(options)
        this.playlist
            .scan(options).then(status => {
                Log.info('App : ' + status)
            })
            .catch(error => Log.error(error))
    }
}

const instance = new App()
