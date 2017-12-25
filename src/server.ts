'use strict'

import { exists as fileExists, readFile, readFileSync, statSync as fileStatSync } from 'fs'
import { IncomingMessage as Request, ServerResponse as Response } from 'http'
import { createServer as createSecureServer, Server as SecureServer, ServerOptions } from 'https'
import { lookup as mimeLookup } from 'mime-types'
import { join as pathJoin } from 'path'
import { IAppOptions } from './app'
import Log from './log'
import Song from './song'

const serverRoot: string = './public'

export default class Server {

    instance: SecureServer
    activeSong: Song
    getRandomSong: () => string

    constructor(options: IAppOptions) {
        Log.info('Server : in constructor')
        const serverOptions: ServerOptions = {
            cert: readFileSync(`./certs/${options.host}.crt`),
            key: readFileSync(`./certs/${options.host}.key`),
        }
        this.instance = createSecureServer(serverOptions, this.onRequest.bind(this))
        this.instance.listen(options.port)
        Log.info(`Server : listening on https://${options.host}:${options.port}`)
    }

    onRequest(request: Request, response: Response): void {
        Log.info(`Server : got request "${request.method} ${request.url}"`)
        const reqPath: string = request.url + ''
        let fullPath: string = pathJoin(serverRoot, reqPath)
        if (reqPath.includes('song')) {
            fullPath = this.getRandomSong()
        }
        const mimeType: string = mimeLookup(fullPath)
        // Log.info('Server : mime detected :', mimeType)
        fileExists(fullPath, exist => {
            if (!exist) {
                // if the file is not found, return 404
                response.statusCode = 404
                response.end(`File ${fullPath} not found!`)
                return
            }
            // if is a directory, then look for index.html
            if (fileStatSync(fullPath).isDirectory()) {
                fullPath += '/index.html'
            }
            // read file from file system
            readFile(fullPath, (err, data) => {
                if (err) {
                    response.statusCode = 500
                    response.end(`Error getting the file: ${err}.`)
                } else {
                    // if the file is found, set Content-type and send data
                    response.setHeader('Content-type', mimeType)
                    response.end(data)
                }
            })
        })
    }
}
