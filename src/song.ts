'use strict'

import Log from './log'

export default class Song {

    protected title
    protected artist
    protected filepath
    protected cover

    constructor(filepath) {
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
