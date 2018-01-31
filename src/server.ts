'use strict'

import { createReadStream, exists as fileExists, readFileSync, ReadStream, Stats, statSync as fileStatSync } from 'fs'
import { IncomingMessage as Request, ServerResponse as Response } from 'http'
import { createServer as createSecureServer, Server as SecureServer, ServerOptions } from 'https'
import { lookup as mimeLookup } from 'mime-types'
import { join as pathJoin } from 'path'
import AppConfig from './config'
import Log from './log'
import Playlist from './playlist'
import Song from './song'

const serverRoot: string = './public'

export default class Server {

    activeSong: Song
    instance: SecureServer
    playlist: Playlist

    constructor(playlist: Playlist) {
        Log.info('Server   : in constructor')
        this.playlist = playlist
        const serverOptions: ServerOptions = {
            cert: readFileSync(`./certs/${AppConfig.host}.crt`),
            key: readFileSync(`./certs/${AppConfig.host}.key`),
        }
        this.instance = createSecureServer(serverOptions, this.onRequest.bind(this))
        this.instance.listen(AppConfig.port)
        Log.info(`Server   : listening on https://${AppConfig.host}:${AppConfig.port}`)
    }

    async onRequest(request: Request, response: Response): Promise<void> {
        let reqPath: string = request.url + ''
        Log.info(`Server   : got request "${request.method} ${reqPath}"`)
        if (reqPath === '/') {
            reqPath += '/index.html'
        }
        let fullPath: string = pathJoin(serverRoot, reqPath)
        if (reqPath.includes('song')) {
            const song: Song = await this.playlist.getCurrentSong()
            fullPath = song.filepath
        }
        const mimeType: string = mimeLookup(fullPath)
        // Log.info('Server   : mime detected :', mimeType)
        fileExists(fullPath, exist => {
            if (!exist) {
                // if the file is not found, return 404
                response.statusCode = 404
                response.end(`File ${fullPath} not found!`)
                return
            }
            const stat: Stats = fileStatSync(fullPath)
            const total: number = stat.size
            if (request.headers.range) {
                const range: string = request.headers.range + ''
                const parts: string[] = range.replace(/bytes=/, '').split('-')
                const partialstart: string = parts[0]
                const partialend: string = parts[1]

                const start: number = parseInt(partialstart, 10)
                const end: number = partialend ? parseInt(partialend, 10) : total - 1
                const chunksize: number = (end - start) + 1
                const readStream: ReadStream = createReadStream(fullPath, { start, end })
                response.writeHead(206, {
                    'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
                    'Accept-Ranges': 'bytes', 'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                })
                readStream.pipe(response)
            } else {
                response.writeHead(200, { 'Content-Length': total, 'Content-Type': mimeType })
                createReadStream(fullPath).pipe(response)
            }
        })
    }
}
