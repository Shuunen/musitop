'use strict'

import Pino = require('pino')

const pino = Pino({
    prettyPrint: true, // lighter output
})

export class Log {

    public static info(thing) {
        pino.info(thing)
    }
}
