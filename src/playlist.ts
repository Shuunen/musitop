'use strict'

import * as del from 'del'
import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'
import AppConfig from './config'
import Log from './log'
import Song from './song'

export default class Playlist {

    current: number = 0
    currentSong: Song
    list: string[] = []
    moveSong: boolean = false

    constructor() {
        Log.info('Playlist : in constructor')
        this.getSongs().then(list => {
            this.list = list
            Log.info(`App : scanned ${this.list.length} songs !`)
        })
    }

    getSongs(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const musicPath: string = AppConfig.musicPath
            if (!musicPath || !musicPath.length) {
                reject('musicPath is not defined')
            }
            Log.info('Playlist : scanning "' + musicPath + '" for songs')
            glob(musicPath + '/**/*.mp3', (err, files) => {
                if (err) {
                    Log.error(err)
                    reject('failed at reading path')
                } else {
                    resolve(files)
                }
            })
        })
    }

    async getCurrentSong(): Promise<Song> {
        if (this.current < 0) {
            // before first song -> going to last
            this.current = (this.list.length - 1)
        } else if (this.current > (this.list.length - 1)) {
            // after last song -> going to first
            this.current = 0
        }
        if (!this.currentSong) {
            const songPath: string = this.list[this.current]
            Log.info(`Playlist : Playing song ${this.current + 1} / ${this.list.length}`)
            Log.info(`Playlist : ${this.fileName(songPath)}`)
            this.currentSong = await new Song(songPath).setMetadata()
        }
        return this.currentSong
    }

    async nextSong(reverse: boolean = false): Promise<boolean> {
        if (this.moveSong) {
            Log.info('Playlist : will move song to keep folder')
            await this.moveCurrentSong()
        } else {
            Log.info('Playlist : nothing to move')
        }
        if (reverse) {
            this.current--
        } else if (!this.moveSong) {
            this.current++
        }
        delete this.currentSong
        Log.info('Playlist : new position', this.current + 1)
        return Promise.resolve(true)
    }

    prevSong(): void {
        this.nextSong(true)
    }

    fileName(filePath: string): string {
        // input  : "C:\Stuff\Music\to test\Mike feat. Snowball - Animal.mp3"
        // output : "Mike feat. Snowball - Animal"
        let fileName: string = ''
        try {
            fileName = path.basename(filePath).split('.').reverse().splice(1).reverse().join('.')
        } catch (error) {
            Log.error('Failed at getting filename for "', filePath, '"')
            throw error
        }
        return fileName
    }

    async deleteCurrentSong(): Promise<boolean> {
        const songPath: string = await this.removeCurrentSongFromList()
        return del([songPath], { force: true })
            .then(() => {
                Log.info('Playlist : Deleted "' + this.fileName(songPath) + '"')
                return true
            })
            .catch(error => {
                Log.error('Playlist : Delete failed')
                throw error
            })
            .then(() => delete this.currentSong)
    }

    async removeCurrentSongFromList(): Promise<string> {
        const song: Song = await this.getCurrentSong()
        this.list.splice(this.current, 1)
        return song.filepath
    }

    loveCurrentSong(): void {
        Log.info('Playlist : will move song before playing the next one')
        this.moveSong = true
    }

    async moveCurrentSong(): Promise<void> {
        const songPath: string = await this.removeCurrentSongFromList()
        const newSongPath: string = path.join(AppConfig.keepPath, path.basename(songPath))
        fs.rename(songPath, newSongPath, error => {
            if (error) {
                Log.error('Playlist : Move failed')
                throw error
            } else {
                Log.info('Playlist : Moved ', this.fileName(songPath))
            }
            this.moveSong = false
        })
    }
}
