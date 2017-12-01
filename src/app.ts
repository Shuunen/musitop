'use strict'

import Log from './log'
import Server from './server'

const defaultOptions = {
    port: 1444,
}

export default class App {

    protected options
    protected server

    constructor() {
        Log.info('App : in constructor')
        this.options = Object.assign({}, defaultOptions)
        this.server = new Server(this.options)
    }
}

const instance = new App()
