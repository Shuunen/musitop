'use strict'

import * as fs from 'fs'
import * as  http2 from 'http2'
import * as mime from 'mime-types'
import * as path from 'path'
import Log from './log'

const {
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_METHOD,
    HTTP_STATUS_NOT_FOUND,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
} = http2.constants

const options = {
    cert: fs.readFileSync('./certs/server.crt'),
    key: fs.readFileSync('./certs/server.key'),
}

const serverRoot = './public'

export class Server {

    private server

    constructor() {
        Log.info('Server : in constructor')
        this.create()
        this.listen()
    }

    private create() {
        this.server = http2.createSecureServer(options)
    }

    private listen() {
        this.server.on('stream', (stream, headers) => {
            const reqPath = headers[HTTP2_HEADER_PATH]
            const reqMethod = headers[HTTP2_HEADER_METHOD]
            const fullPath = path.join(serverRoot, reqPath)
            const responseMimeType = mime.lookup(fullPath)
            Log.info('Server : path requested :', fullPath)
            Log.info('Server : mime prepared :', responseMimeType)
            if (!responseMimeType) {
                Log.info('Server : serve text')
                stream.respond({ 'content-type': 'text/plain' }, {
                    onError: (err) => this.respondToStreamError(err, stream),
                })
                stream.end('hello you :)')
            } else {
                Log.info('Server : serve static file')
                stream.respondWithFile(fullPath, { 'content-type': responseMimeType }, {
                    onError: (err) => this.respondToStreamError(err, stream),
                })
            }
        })
        this.server.listen(443)
        Log.info('Server : listening on https://musitop.io')
    }

    private respondToStreamError(err, stream) {
        Log.info('Server : stream error')
        Log.info(err)
        if (err.code === 'ENOENT') {
            stream.respond({ ':status': HTTP_STATUS_NOT_FOUND })
        } else {
            stream.respond({ ':status': HTTP_STATUS_INTERNAL_SERVER_ERROR })
        }
        stream.end()
    }

}
