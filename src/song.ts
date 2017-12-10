'use strict'

import * as fs from 'fs'
import Log from './log'

export default class Song {

    title: string
    artist: string
    filepath: string
    cover: string // ?

    constructor(filepath: string) {
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
