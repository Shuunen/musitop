'use strict'

import * as del from 'del'
import * as fs from 'fs'
import * as path from 'path'
import AppConfig from './config'
import Log from './log'
import Song from './song'

export default class Playlist {

    current: number = 0
    list: string[] = []

    constructor() {
        Log.info('Playlist : in constructor')
        this.getSongs().then(list => {
            this.list = list
            Log.info(`App : scanned ${this.list.length} songs !`)
        })
    }

    play(): Promise<Song> {
        return new Promise(resolve => {
            const filepath: string = this.list[0]
            Log.info('Playlist : creating song with filepath', filepath)
            const song: Song = new Song(filepath)
            resolve(song)
        })
    }

    getSongs(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const musicPath: string = AppConfig.musicPath
            if (!musicPath || !musicPath.length) {
                reject('musicPath is not defined')
            }
            Log.info('Playlist : scanning "' + musicPath + '" for songs')
            fs.readdir(musicPath, (err, files) => {
                if (err) {
                    Log.error(err)
                    reject('failed at reading path')
                } else {
                    const list: string[] = []
                    files.forEach(fileName => {
                        const filePath: string = path.join(musicPath, fileName)
                        const fileStat: fs.Stats = fs.statSync(filePath)
                        if (fileStat.isFile() && (fileName.indexOf('.mp3') !== -1)) {
                            list.push(filePath)
                        }
                    })
                    resolve(list)
                }
            })
        })
    }

    getRandomSong(): string {
        // Log.info(`Playlist : getRandomSong from ${this.list.length}`)
        return this.list[Math.floor(Math.random() * this.list.length)]
    }

    getCurrentSong(): string {
        Log.info(`Playlist : Playing song ${this.current + 1} / ${this.list.length}`)
        return this.list[this.current]
    }

    fileName(filePath: string): string {
        // input  : "C:\Stuff\Music\to test\Mike feat. Snowball - Animal.mp3"
        // output : "Mike feat. Snowball - Animal"
        return path.basename(filePath).split('.').reverse().splice(1).reverse().join('.')
    }

    deleteCurrentSong(): void {
        const songPath: string = this.getCurrentSong()
        del([songPath], { force: true }).then(() => {
            Log.info('Playlist : Deleted "' + this.fileName(songPath) + '"')
        }).catch(error => Log.error(error))
    }
}
