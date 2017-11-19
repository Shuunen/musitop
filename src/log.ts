'use strict'

import Pino = require('pino')

const pino = Pino({
    prettyPrint: true, // lighter output
})

export class Log {

    // From Pino doc : level (string): one of 'fatal', 'error', 'warn', 'info', 'debug', 'trace'

    public static debug = pino.debug.bind(pino)
    public static info = pino.info.bind(pino)
    public static warn = pino.warn.bind(pino)
    public static error = pino.error.bind(pino)
}
