'use strict'

import Log from './log'
import Server from './server'
import Song from './song'

const defaultOptions = {
    port: 1444,
}

export default class App {

    protected options
    protected server

    constructor() {
        Log.info('App : in constructor')
        this.options = Object.assign({}, defaultOptions)
        this.server = new Server(this.options).instance
        Log.info(new Song('test.mp3'))
    }
}

const instance = new App()
