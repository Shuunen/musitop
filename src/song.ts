'use strict'

import { createReadStream, ReadStream, writeFile } from 'fs'
import * as musicMetadata from 'musicmetadata'
import Log from './log'

export default class Song {

    title: string
    artist: string
    filepath: string
    cover: string // ?

    constructor(filepath: string) {
        if (!filepath) {
            Log.error('Song     : cannot init without a filepath')
            return
        }
        // Log.info('Song     : in constructor with filepath', filepath)
        this.filepath = filepath
    }

    setMetadata(): Promise<Song> {
        Log.info('Song     : getting metadata for current song')
        return this.getMetadata().then((metadata: IMusicMetadata) => {
            if (metadata) {
                Log.info('Song     : successfuly got metadata')
                this.artist = metadata.artist[0]
                this.title = metadata.title
            } else {
                Log.warn('Song     : did not got any metadata for song')
            }
            return this
        })
    }

    getMetadata(): Promise<IMusicMetadata> {
        return new Promise(resolve => {
            const stream: ReadStream = createReadStream(this.filepath)
            musicMetadata(stream, (err, metadata) => {
                stream.close()
                if (err) {
                    Log.error('failed at reading mp3 metadata for song "' + this.filepath + '"', err)
                }
                const picture: { data: Buffer } = metadata.picture[0]
                if (!picture) {
                    Log.info('No cover art in this mp3')
                    resolve(metadata)
                    return
                }
                // if covert art has been found, translate it to a file
                // let buffer = new Buffer(picture.data, 'binary')
                const buffer: Buffer = picture.data
                const path: string = 'public/cover.jpg'
                writeFile(path, buffer, 'binary', error => {
                    if (error) {
                        Log.error('Failed at writing cover file to disk', error)
                    } else {
                        // delay color palette getting
                        // setTimeout(() => getColorPaletteFrom(path), 500)
                    }
                    delete metadata.picture
                    resolve(metadata)
                })
            })
        })
    }
}

interface IMusicMetadata {
    title: string
    artist: string[]
    albumartist: string[]
    album: string
    year: string
    track: {
        no: number
        of: number,
    }
    genre: string[]
    disk: {
        no: number
        of: number,
    }
    duration: number
}
