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
    list: string[]

    constructor() {
        Log.info('App : in constructor')
        this.options = this.getOptions()
        this.server = new Server(this.options)
        this.playlist = new Playlist(this.options)
        this.server.getRandomSong = this.playlist.getRandomSong.bind(this.playlist)
        this.init()
    }

    init(): void {
        Log.info('App : init')
    }

    getOptions(): IAppOptions {
        const options: IAppOptions = Object.assign({}, defaultOptions, userOptions)
        if (!options.musicPath.includes('/')) {
            Log.info('musicPath does not contains any slash, you might check it')
        }
        return options
    }
}

const instance: App = new App()
Log.debug('App instance created', instance)

export interface IAppOptions {
    host: string
    musicPath: string
    port: number
}
