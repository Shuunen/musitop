'use strict'

import * as fs from 'fs'
import * as path from 'path'
import * as shuffle from 'shuffle-array'
import Log from './log'
import Song from './song'

export default class Playlist {

    protected list = []

    constructor(options) {
        Log.info('Playlist : in constructor')
        this.scan(options)
            .then(status => {
                Log.info(status)
                return this.loadNext()
            })
            .then(song => {
                Log.info('Playlist : got first song', song)
            })
            .catch(error => Log.error(error))
    }

    public loadNext(): Promise<Song> {
        return new Promise((resolve, reject) => {
            const filepath = this.list[0]
            Log.info('Playlist : creating song with filepath', filepath)
            const song = new Song(filepath)
            resolve(song)
        })
    }

    private scan(options) {
        return new Promise((resolve, reject) => {
            const musicPath = options.musicPath
            if (!musicPath || !musicPath.length) {
                reject('musicPath is not defined')
            }
            Log.info('Playlist : scanning "' + musicPath + '" for songs')
            fs.readdir(musicPath, (err, files) => {
                if (err) {
                    Log.error(err)
                    reject('failed at reading path')
                } else {
                    // inject files
                    files.forEach(fileName => {
                        const filePath = path.join(musicPath, fileName)
                        const fileStat = fs.statSync(filePath)
                        if (fileStat.isFile() && (fileName.indexOf('.mp3') !== -1)) {
                            this.list.push(filePath)
                        }
                    })
                    // shuffle if necessary
                    if (options.shuffle) {
                        shuffle(this.list)
                    }
                    resolve('path scanned, found ' + this.list.length + ' songs')
                }
            })
        })
    }
}
