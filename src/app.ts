'use strict'

import userOptions from '../config'
import Log from './log'
import Playlist from './playlist'
import Server from './server'
import Socket from './socket'

const defaultOptions: IAppOptions = {
    host: 'musitop.io',
    musicPath: '',
    port: 1606,
}

export default class App {

    options: IAppOptions
    server: Server
    socket: Socket
    playlist: Playlist

    constructor() {
        Log.info('App : in constructor')
        const options: IAppOptions = Object.assign({}, defaultOptions, userOptions)
        this.options = options
        this.server = new Server(options)
        this.socket = new Socket(options, this.server.instance)
        this.playlist = new Playlist(options)
        this.playlist
            .scan(options)
            .then(status => Log.info('App : ' + status))
            .then(() => this.playlist.play())
            .then(song => this.server.setActiveSong(song))
            .catch(error => Log.error(error))
    }
}

const instance: App = new App()

export interface IAppOptions {
    host: string
    musicPath: string
    port: number
}
