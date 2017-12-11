'use strict'

import userOptions from '../config'
import Log from './log'
import Playlist from './playlist'
import Server from './server'

const defaultOptions: IAppOptions = {
    host: 'musitop.io',
    musicPath: '',
    port: 1606,
}

export default class App {

    options: IAppOptions
    server: Server
    playlist: Playlist
    songs: string[]

    constructor() {
        Log.info('App : in constructor')
        const options: IAppOptions = Object.assign({}, defaultOptions, userOptions)
        this.options = options
        this.server = new Server(options)
        this.playlist = new Playlist(options)
        this.init()
    }

    init(): void {
        Log.info('App : init')
        this.playlist.getSongs(this.options)
            .then(songs => this.songs = songs)
    }
}

const instance: App = new App()

export interface IAppOptions {
    host: string
    musicPath: string
    port: number
}
