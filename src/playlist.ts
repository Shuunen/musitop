'use strict'

import * as fs from 'fs'
import * as path from 'path'
import { IAppOptions } from './app'
import Log from './log'
import Song from './song'

export default class Playlist {

    list: string[] = []

    constructor(options: IAppOptions) {
        Log.info('Playlist : in constructor')
    }

    play(): Promise<Song> {
        return new Promise((resolve, reject) => {
            const filepath: string = this.list[0]
            Log.info('Playlist : creating song with filepath', filepath)
            const song: Song = new Song(filepath)
            resolve(song)
        })
    }

    scan(options: IAppOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            const musicPath: string = options.musicPath
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
                        const filePath: string = path.join(musicPath, fileName)
                        const fileStat: fs.Stats = fs.statSync(filePath)
                        if (fileStat.isFile() && (fileName.indexOf('.mp3') !== -1)) {
                            this.list.push(filePath)
                        }
                    })
                    // shuffle if necessary
                    // if (options.shuffle) { }
                    resolve('path scanned, found ' + this.list.length + ' songs')
                }
            })
        })
    }
}
