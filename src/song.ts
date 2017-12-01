'use strict'

import Log from './log'

export default class Song {

    protected title
    protected artist
    protected path
    protected cover

    constructor(path) {
        Log.info('Song : in constructor')
        this.path = path
        this.title = 'Ecuador'
        this.artist = '666'
    }
}
