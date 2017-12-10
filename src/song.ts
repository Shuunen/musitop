'use strict'

import * as fs from 'fs'
import Log from './log'

export default class Song {

    title: string
    artist: string
    filepath: fs.PathLike
    cover: string // ?

    constructor(filepath: fs.PathLike) {
        if (!filepath) {
            Log.error('Song : cannot init without a filepath')
            return
        }
        Log.info('Song : in constructor with filepath', filepath)
        this.filepath = filepath
        this.title = 'Ecuador'
        this.artist = '666'
    }
}
