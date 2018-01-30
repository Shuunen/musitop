'use strict'

import userConfig from '../config'
import defaultConfig from '../config.defaults'
import Log from './log'

const config: IAppOptions = Object.assign({}, defaultConfig, userConfig)

if (!config.musicPath.includes('/')) {
    Log.info('Config : musicPath does not contains any slash, you might check it')
}

export default config

export interface IAppOptions {
    host: string
    doMove: boolean
    musicPath: string
    keepPath: string
    port: number
}
