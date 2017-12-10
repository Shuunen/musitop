'use strict'

import Pino = require('pino')

const pino: Pino = Pino({
    prettyPrint: true, // lighter output
})

export default class Log {

    // From Pino doc : level (string): one of 'fatal', 'error', 'warn', 'info', 'debug', 'trace'

    static debug: (...things: Array<{}>) => void = pino.debug.bind(pino)

    static info: (...things: Array<{}>) => void = pino.info.bind(pino)

    static warn: (...things: Array<{}>) => void = pino.warn.bind(pino)

    static error: (...things: Array<{}>) => void = pino.error.bind(pino)

}
