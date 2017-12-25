'use strict'

/***
 *    _██████╗██╗_____██╗███████╗███╗___██╗████████╗
 *    ██╔════╝██║_____██║██╔════╝████╗__██║╚══██╔══╝
 *    ██║_____██║_____██║█████╗__██╔██╗_██║___██║___
 *    ██║_____██║_____██║██╔══╝__██║╚██╗██║___██║___
 *    ╚██████╗███████╗██║███████╗██║_╚████║___██║___
 *    _╚═════╝╚══════╝╚═╝╚══════╝╚═╝__╚═══╝___╚═╝___
 *    ______________________________________________
 */

import * as WebSocket from 'ws'
import { AppConfig } from './config'
import Log from './log'

const address: string = 'wss://' + AppConfig.host + ':' + AppConfig.port
// Log.info('Client ws node : will connect to "' + address + '"')
const ws: WebSocket = new WebSocket(address, { rejectUnauthorized: false })

const action: string = process.argv.slice(2).join(' ')
// Log.info('Client ws node : will send action "' + action + '"')

ws.on('open', () => {
    Log.info('Client ws node : ws is open, sending action "' + action + '"')
    ws.send(action)
    ws.close()
})

ws.on('error', error => Log.info('Client ws node : ws got error', error))
