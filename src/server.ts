'use strict'

import * as fs from 'fs'
import { constants, createSecureServer, Http2SecureServer, IncomingHttpHeaders, ServerHttp2Stream } from 'http2'
import * as mime from 'mime-types'
import * as path from 'path'
import App, { IAppOptions } from './app'
import Log from './log'
import Song from './song'

const serverRoot: string = './public'

export default class Server {

    instance: Http2SecureServer
    activeSong: Song

    constructor(options: IAppOptions) {
        Log.info('Server : in constructor')
        const serverOptions: IServerOptions = {
            cert: fs.readFileSync(`./certs/${options.host}.crt`),
            key: fs.readFileSync(`./certs/${options.host}.key`),
        }
        this.instance = createSecureServer(serverOptions)
        this.instance.on('stream', (stream, headers) => this.onStream(stream, headers))
        this.instance.listen(options.port)
        Log.info(`Server : listening on https://${options.host}:${options.port}`)
    }

    setActiveSong(song: Song): void {
        this.activeSong = song
    }

    onStream(stream: ServerHttp2Stream, headers: IncomingHttpHeaders): void {
        const reqPath: string = headers[constants.HTTP2_HEADER_PATH].toString()
        const reqMethod: string = headers[constants.HTTP2_HEADER_METHOD].toString()
        let fullPath: string = path.join(serverRoot, reqPath)
        if (reqPath.includes('active-song')) {
            fullPath = this.activeSong.filepath
        }
        const responseMimeType: string = mime.lookup(fullPath)
        Log.info('Server : path requested :', fullPath)
        Log.info('Server : mime prepared :', responseMimeType)
        if (!responseMimeType) {
            Log.info('Server : serve text')
            stream.respond({ 'content-type': 'text/plain' })
            stream.end('hello you :)')
        } else {
            Log.info('Server : serve static file')
            stream.respondWithFile(fullPath, { 'content-type': responseMimeType }, {
                onError: (err) => this.respondToStreamError(err, stream),
            })
        }
    }

    respondToStreamError(err: NodeJS.ErrnoException, stream: ServerHttp2Stream): void {
        Log.info('Server : stream error')
        Log.info(err)
        if (err.code === 'ENOENT') {
            stream.respond({ ':status': constants.HTTP_STATUS_NOT_FOUND })
        } else {
            stream.respond({ ':status': constants.HTTP_STATUS_INTERNAL_SERVER_ERROR })
        }
        stream.end()
    }

}

interface IServerOptions {
    cert: Buffer
    key: Buffer
}
