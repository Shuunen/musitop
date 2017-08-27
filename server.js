'use strict'

/***
 *    ___▄▄▄▄▄___▄███▄___█▄▄▄▄____▄___▄███▄___█▄▄▄▄_
 *    __█_____▀▄_█▀___▀__█__▄▀_____█__█▀___▀__█__▄▀_
 *    ▄__▀▀▀▀▄___██▄▄____█▀▀▌_█_____█_██▄▄____█▀▀▌__
 *    _▀▄▄▄▄▀____█▄___▄▀_█__█__█____█_█▄___▄▀_█__█__
 *    ___________▀███▀_____█____█__█__▀███▀_____█___
 *    ____________________▀______█▐____________▀____
 *    ___________________________▐__________________
 */
var fs = require('fs')
var path = require('path')
var childProcess = require('child_process')
var musicMetadata = require('musicmetadata')
var httpPort = 1404
var httpsPort = 1444
var express = require('express')
var https = require('spdy')
var http = require('http')
var app = express()
var colorable = require('colorable')
var aqara = require('lumi-aqara')
var jimp = require('jimp')
var gitServer = require('simple-git/promise')(__dirname)
var webClientFolder = 'web-client'
var publicFolder = 'public'
var publicFolderPath = __dirname + '/' + publicFolder
var gitWebClient = require('simple-git/promise')(webClientFolder)
var ip = require('ip').address()
var options = {
    key: fs.readFileSync('./certs/server.key'),
    cert: fs.readFileSync('./certs/server.crt')
}
var vibrant = require('node-vibrant')
var httpServer = http.createServer(app).listen(httpPort, (error) => {
    if (error) {
        notify('Error', error)
    } else {
        notify('Server', 'Musitop server started')
        notify('Server', 'http://localhost:' + httpPort)
        notify('Server', 'http://' + ip + ':' + httpPort)
    }
})
var httpsServer = https.createServer(options, app).listen(httpsPort, (error) => {
    if (error) {
        notify('Error', error)
    } else {
        notify('Server', 'Musitop server started')
        notify('Server', 'https://localhost:' + httpsPort)
        notify('Server', 'https://' + ip + ':' + httpsPort)
    }
})
var httpIo = require('socket.io')(httpServer)
var httpsIo = require('socket.io')(httpsServer)
var ioEmit = function (channel, data) {
    // notify('Socket', 'send data on "' + channel + '"');
    httpIo.emit(channel, data)
    httpsIo.emit(channel, data)
}

// var logger = require('morgan');
// app.use(logger('dev'));

// enable CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.get('/pushy', (req, res) => {
    var stream = res.push('/main.js', {
        status: 200, // optional
        method: 'GET', // optional
        request: {
            accept: '*/*'
        },
        response: {
            'content-type': 'application/javascript'
        }
    })
    stream.on('error', function (e) {
        notify('warn', e)
    })
    stream.end('alert("hello from push stream!");')
    res.end('<script src="/main.js"></script>')
})

app.get('/stream/:songId', function (req, res) { // eslint-disable-line no-useless-escape
    let songId = req.params.songId
    if (!songId || !songId.length) {
        res.status(404).send('you need to provide the song id')
    } else {
        songId = parseInt(songId.split('.')[0])
        let isCurrent = songs.current.uid === songId
        let isNext = songs.next.uid === songId
        if (!isCurrent && !isNext) {
            notify('Server', 'Song UID unknow "' + songId + '"')
            notify('Server', 'UIDs known are : ' + songs.current.uid + ' & ' + songs.next.uid)
            res.status(500).send('server has no idea about this song location')
        } else {
            if (isCurrent) {
                notify('Server', 'Streaming ' + songs.current.nameWithId)
                res.sendFile(songs.current.path)
            } else {
                notify('Server', 'Streaming ' + songs.next.nameWithId)
                res.sendFile(songs.next.path)
            }
        }
    }
})

app.get('/cover/:id.jpg', function (req, res) {
    let coverId = req.params.id
    notify('Server', 'Got a request for cover id "' + coverId + '"')
    res.sendFile(publicFolderPath + '/' + coverId + '.jpg')
})

app.get('/colors/:primary/:secondary', function (req, res) {

    var colors = {
        primary: req.params.primary,
        secondary: req.params.secondary
    }

    var result = colorable(colors, {
        compact: true,
        threshold: 0
    })

    res.status(200).json(result)
})

app.get('/server/version', function (req, res) {
    var pkg = JSON.parse(fs.readFileSync('./package.json'))
    res.status(200).json({
        version: pkg.version
    })
})

app.get('/server/update', function (req, res) {
    gitServer.pull(function (err, update) {
        var ret = {
            target: 'server'
        }
        if (err) {
            ret.error = err
        } else if (update && update.summary.changes) {
            ret.changes = update.summary.changes
        } else {
            ret.changes = 'none'
        }
        res.status(200).json(ret)
    })
})

app.get('/client/update', function (req, res) {
    if (!config.get('serveWebClient')) {
        res.status(200).json({
            error: 'there is no web client served'
        })
    } else {
        notify('Server', 'Getting git updates form web client folder')
        let ret = {
            target: 'client'
        }
        gitWebClient.pull()
            .then(update => {
                if (update && update.summary.changes) {
                    ret.changes = update.summary.changes
                } else {
                    ret.changes = 'none'
                }
                res.status(200).json(ret)
            })
            .catch(err => {
                ret.error = err
                res.status(200).json(ret) // TODO : keep a 200 here ?
            })
    }
})

var onDisconnect = function () {
    // notify('Socket', 'server side disconnected');
}

var onConnection = function () {
    notify('Socket', 'Server side connection established')
}

var onMusicIs = function (musicIs) {
    if (musicIs === 'good') {
        notify('Client', '★ Keep this song :D')
        notify('Will keep', songs.current.name)
        loveSong()
        keep = true
        ioEmit('music was', musicIs)
    } else if (musicIs === 'bad') {
        notify('Client', '✕ Delete this song :|')
        notify('Deleting', songs.current.name)
        deleteSong()
        playNext('onMusicIs bad')
        ioEmit('music was', musicIs)
    } else if (musicIs === 'next') {
        notify('Client', '» Next song please :)')
        if (keep) {
            moveSong()
        }
        playNext('onMusicIs next')
        ioEmit('music was', musicIs)
    } else if (musicIs === 'pause') {
        notify('Client', '|| Pause song please')
        ioEmit('pause', 'please :)')
    } else {
        notify('Server', 'Client said that music is "' + musicIs + '" ?!?')
    }
}

var onError = function (err) {
    notify('Socket', 'Client had errors', err)
}

var onEvent = function (e) {
    notify('Event', e)
}

var handleConnection = function (socket) {
    // notify('Socket', 'Server side connection detected');
    socket.on('music is', onMusicIs)
    socket.on('error', onError)
    socket.on('disconnect', onDisconnect)
    socket.on('connect', onConnection)
    socket.on('event', onEvent)
    ioEmit('options', {
        audioClientSide: config.get('audioClientSide')
    })
    ioEmit('palette', palette)
    ioEmit('metadata', songs.current.metadata)
}

var connectSocket = function () {
    notify('Socket', 'Server connecting...')
    httpIo.on('connection', handleConnection)
    httpsIo.on('connection', handleConnection)
}

connectSocket()

/***
 *    █_▄▄__█____██__▀▄____▄_▄███▄___█▄▄▄▄_
 *    █___█_█____█_█___█__█__█▀___▀__█__▄▀_
 *    █▀▀▀__█____█▄▄█___▀█___██▄▄____█▀▀▌__
 *    █_____███▄_█__█___█____█▄___▄▀_█__█__
 *    _█________▀___█_▄▀_____▀███▀_____█___
 *    __▀__________█__________________▀____
 *    ____________▀________________________
 */
const os = require('os')
const Lastfm = require('lastfm-njs')
let lastfm = null
const isLinux = (os.type() === 'Linux')
const configFile = 'config.json'
const defaultConfig = {
    musicPath: {
        type: 'string',
        required: true
    },
    keepPath: {
        type: 'string',
        required: true
    },
    serveWebClient: {
        type: 'boolean',
        default: true
    },
    audioClientSide: {
        type: 'boolean',
        default: true
    },
    keepFeature: {
        type: 'boolean',
        default: true
    },
    deleteFeature: {
        type: 'boolean',
        default: true
    },
    shuffleMusic: {
        type: 'boolean',
        default: true
    },
    systrayControls: {
        type: 'boolean',
        default: false
    },
    lastfmAccess: {
        type: 'string',
        default: 'key/secret/user/pass'
    },
    lumiSwitches: {
        type: 'string',
        default: 'goodId/badId'
    }
}
const config = require('config-prompt')(defaultConfig)
var shuffle = require('shuffle-array')
var playlist = []
var songs = {
    current: {
        uid: 0,
        path: '',
        name: '',
        nameWithId: '',
        metadata: null
    },
    next: {
        uid: 1,
        path: ''
    }
}
var player = null
var autoKill = false
var manualKill = false
var keep = false
var palette = null

function playFolder() {
    var musicPath = config.get('musicPath')
    notify('Server', 'Scanning "' + musicPath + '"' + ' for songs')
    fs.readdir(musicPath, function (err, files) {
        if (err) {
            config.trash()
            notify('Error', 'Failed at reading musicPath', err)
        } else {
            // inject files
            files.forEach(function (fileName) {
                var filePath = path.join(musicPath, fileName)
                var fileStat = fs.statSync(filePath)
                if (fileStat.isFile() && (fileName.indexOf('.mp3') !== -1)) {
                    playlist.push(filePath)
                }
            })
            // shuffle if necessary
            if (config.get('shuffleMusic')) {
                shuffle(playlist)
            }
            // start playing
            playNext('playFolder')
        }
    })
}

function fileName(filePath) {
    // input  : "C:\Stuff\Music\to test\Mike feat. Snowball - Animal.mp3"
    // output : "Mike feat. Snowball - Animal"
    return path.basename(filePath).split('.').reverse().splice(1).reverse().join('.')
}

function playNext(from) {
    if (from === 'Zangdar') {
        // avoid "unused var from" lint errors & keep it for later uses
        notify('Server', 'playNext called by ' + from)
    }
    // update uids
    songs.current.uid++
    songs.next.uid++
    // here splice return first item & remove it from playlist
    songs.current.path = playlist.splice(0, 1)[0]
    songs.current.name = fileName(songs.current.path)
    songs.current.nameWithId = songs.current.name + ' (' + songs.current.uid + ')'
    songs.next.path = playlist[0]
    songs.next.name = fileName(songs.next.path)
    songs.next.nameWithId = songs.next.name + ' (' + songs.next.uid + ')'
    notify('Server', '♫ Remaining ' + playlist.length + ' track(s)')
    notify('Playing', songs.current.nameWithId)
    // if audio output is server side
    if (!config.get('audioClientSide')) {
        playSong()
    }

    getMetadata().then(metadata => {
        songs.current.metadata = metadata
        ioEmit('metadata', metadata)
        // scrobble song after few seconds
        setTimeout(() => scrobbleSong(), 2000)
    })
}

function getMetadata() {
    return new Promise(resolve => {
        var readableStream = fs.createReadStream(songs.current.path)
        musicMetadata(readableStream, {
            duration: true
        }, function (err, metadata) {
            if (err) {
                notify('Error', 'Fail at reading mp3 metadata for song "' + songs.current.path + '"', err)
            } else {
                metadata.uid = songs.current.uid
                metadata.stream = '/stream/' + songs.current.uid + '.mp3'
                metadata.nextStream = '/stream/' + songs.next.uid + '.mp3'
                metadata.coverId = 'no-cover'
                readableStream.close()
                let picture = metadata.picture[0]
                if (!picture) {
                    notify('Info', 'No cover art in this mp3')
                    resolve(metadata)
                    return
                }
                // if covert art has been found, translate it to a file
                // let buffer = new Buffer(picture.data, 'binary')
                let buffer = picture.data
                let name = 'cover'
                let path = publicFolderPath + '/' + name + '.jpg'
                fs.writeFile(path, buffer, 'binary', err => {
                    if (err) {
                        notify('Error', 'Failed at writing cover file to disk', err)
                    } else {
                        metadata.coverId = name
                        // delay color palette getting
                        setTimeout(() => getColorPaletteFrom(path), 500)
                    }
                    resolve(metadata)
                })
            }
        })
    })
}

function getTimestamp() {
    return Math.round(Date.now() / 1000)
}

function getColorPaletteFrom(imagePath) {
    vibrant.from(imagePath).getPalette((err, swatches) => {
        palette = swatches
        ioEmit('palette', palette)
    })
}

function moveSong() {
    // notify('Server', 'moveSong init');
    // because keep was true, we came here in moveSong
    // first thing to do is to reset this toggle :)
    keep = false
    // because the file is actually read/locked by player
    // will move the file in an async way
    doAsync(function (lastSongPath) {
        var newLastSongPath = path.join(config.get('keepPath'), path.basename(lastSongPath))
        // notify('Server', 'will move it to : "' + newLastSongPath + '"');
        fs.rename(lastSongPath, newLastSongPath, function (err) {
            if (err) {
                notify('Server', 'Move failed')
                throw new Error(err)
            } else {
                notify('Server', '> Moved ' + fileName(lastSongPath))
            }
        })
    })
}

function deleteSong() {
    doAsync(function (lastSongPath) {
        fs.unlink(lastSongPath, function (err) {
            if (err) {
                notify('Error', 'Delete failed', err)
            } else {
                notify('Server', '✕ Deleted ' + fileName(lastSongPath))
            }
        })
    })
}

function doAsync(callback) {
    if (!callback) {
        notify('Error', 'Do Async need a callback')
    } else {
        var lastSongPath = songs.current.path + ''
        setTimeout(function () {
            callback(lastSongPath)
        }, 1000)
    }
}

function notify(action, message, bonus) {
    // in order to align logs :p
    var actionAligned = action
    while (actionAligned.length < 6) {
        actionAligned += ' '
    }
    console.log(actionAligned + ' : ' + message) // eslint-disable-line no-console
    if (bonus) {
        console.log(bonus) // eslint-disable-line no-console
    }
    if (action.toLowerCase() === 'error') {
        process.exit(0)
    }
}

function playSong() {
    // notify('playSong', 'autoKill is ' + autoKill);
    if (player && !autoKill) {
        // if any player we kill it, we don't want to have multiple players at the same time
        // notify('playSong', 'manualKill was ' + manualKill + ' now true');
        manualKill = true
        player.kill()
    }

    if (isLinux) {
        // use cvlc on linux
        player = childProcess.spawn('cvlc', [songs.current.path, '--play-and-exit'])
    } else {
        // use 1by1 on win
        player = childProcess.spawn('lib/1by1/1by1.exe', [songs.current.path, '/hide', '/close'])
    }

    // because new player started
    // notify('playSong', 'autoKill was ' + autoKill + ' now false');
    autoKill = false

    // when user did not asked anything, player close by itself
    player.on('close', function (code) {
        // notify('close', 'manualKill is ' + manualKill);
        if (manualKill) {
            // notify('Server', 'Player closed was manual kill');
            // this avoid making move or play next if player was killed on purpose
            // notify('close', 'manualKill was ' + manualKill + ' now false');
            // notify('close', 'autoKill was ' + autoKill + ' now false');
            manualKill = false
            autoKill = false
        } else {
            // notify('Server', 'Player closed was auto kill');
            // notify('close', 'autoKill was ' + autoKill + ' now true');
            autoKill = true
            // here player just went until the end of the song & then exited
            if (code === null || code === 0) {
                if (keep) {
                    moveSong()
                }
                playNext('player closed')
            } else {
                notify('Server', 'Player process exited with non-handled code "' + code + '"')
            }
        }
    })
}

function scrobbleSong() {
    if (!lastfm) {
        return
    }
    // console.log(metadata);
    lastfm.auth_getMobileSession(function (res) {
        if (res.success) {
            lastfm.track_scrobble({
                artist: songs.current.metadata.artist[0],
                track: songs.current.metadata.title,
                timestamp: getTimestamp(),
                callback: function (result) {
                    if (!result.success) {
                        notify('Server', 'scrobbleSong failed')
                    }
                }
            })
        }
    })
}

function loveSong() {
    if (!lastfm) {
        return
    }
    // console.log(metadata);
    lastfm.auth_getMobileSession(function (res) {
        if (res.success) {
            lastfm.track_love({
                artist: songs.current.metadata.artist[0],
                track: songs.current.metadata.title,
                callback: function (result) {
                    if (!result.success) {
                        notify('Server', 'loveSong failed')
                    }
                }
            })
        }
    })
}


function getConfigFromUser(callback) {
    notify('Server', 'Will ask user for conf then save it locally')
    config.prompt({
        all: true,
        nodeEnv: false,
        silent: false
    }, function (err) {

        if (err) {
            config.trash()
            notify('Server', 'Failed at reading config', err)
        }
        // move conf file in config store to local folder
        // from : C:\Users\ME\.config\configstore\musitop.json
        // to   : .
        // notify('Server', 'Config path ' + config.path);
        fs.createReadStream(config.path).pipe(fs.createWriteStream(configFile))

        // if any callback, execute it
        if (callback && typeof callback === 'function') {
            callback()
        }
    })
}

function initLastFm() {
    // check if lastfm access has been given
    if (!config.get('lastfmAccess')) {
        return
    }
    var accesses = config.get('lastfmAccess').split('/')
    if (accesses.length !== 4) {
        return notify('Error', 'LastFm access should have 4 parts')
    }
    // accesses should be like "api_key/api_secret/username/password"
    lastfm = new Lastfm({
        apiKey: accesses[0],
        apiSecret: accesses[1],
        username: accesses[2],
        password: accesses[3]
    })
}

function initWebClient() {
    // will expose musitop client if defined or just the web directory
    var exposedFolder = config.get('serveWebClient') ? webClientFolder : publicFolder
    notify('Info', 'Will serve "' + exposedFolder + '"')
    app.use('/', express.static(exposedFolder))
    if (config.get('serveWebClient')) {
        fs.readdir(webClientFolder + '/.git', error => {
            if (error) {
                gitServer.clone('https://github.com/Shuunen/musitop-client', webClientFolder)
                    .then(() => notify('Server', 'Succefully cloned musitop client'))
                    .catch(() => notify('Server', 'Failed at clonning musitop client'))
            } else {
                notify('Server', 'Avoid double clonning musitop client')
            }
        })
    }
}

function initSystray() {
    if (config.get('systrayControls') === false) {
        return
    }
    const dir = path.join(__dirname, 'systray')
    notify('Systray', 'Will be executed in ' + dir)
    // const systray = childProcess.spawn('yarn', { cwd: dir })
    // const systray = childProcess.spawn(dir, 'yarn')
    const child = childProcess.spawn('yarn && "node_modules/electron/dist/electron" systray.js', {
        stdio: 'inherit',
        shell: true,
        cwd: dir
    })
    child.on('error', (error) => {
        notify('Systray', 'Error occured', error)
    })
}

function initLumiSwitches() {
    if (config.get('lumiSwitches') === defaultConfig.lumiSwitches.default) {
        return
    }
    var aqaraInstance = new aqara()
    var lumiSwitches = config.get('lumiSwitches').split('/')
    var goodId = lumiSwitches[0]
    var badId = lumiSwitches[1]

    aqaraInstance.on('gateway', (gateway) => {
        notify('Lumi', 'gateway discovered')
        gateway.on('ready', () => notify('Lumi', 'gateway is ready'))
        gateway.on('offline', () => notify('Lumi', 'gateway is offline'))
        gateway.on('subdevice', (device) => {
            if (device.getType() !== 'switch') {
                return
            }
            let id = device.getSid()
            let isGood = (id === goodId)
            let isBad = (id === badId)
            let name = (isGood ? 'good green' : 'bad red')
            if (!isGood && !isBad) {
                notify('Lumi', 'the switch id "' + id + '" is not known yet')
                return
            }
            if (device.getBatteryPercentage() < 5) {
                notify('Lumi', 'you should change the battery of the ' + name + ' switch')
            }
            device.on('click', () => {
                notify('Lumi', name + ' has been clicked')
                onMusicIs(isGood ? 'good' : 'bad')
            })
            device.on('doubleClick', () => {
                notify('Lumi', name + ' has been double clicked so going to next song...')
                onMusicIs('next')
            })
            device.on('longClickPress', () => {
                notify('Lumi', name + ' has been long pressed but no action configured')
            })
        })
    })
}

function getConfig(callback) {
    // get local config
    fs.readFile(configFile, function (err, configContent) {
        if (!configContent || !configContent.length) {
            err = true // we fake an error because file is here but empty
        }
        if (err) {
            notify('Server', 'No local config found')
        } else {
            notify('Server', 'Local config found will set found conf key/values into in-memory conf')
            config.all = JSON.parse(configContent)
        }
        var configErrors = config.validate()
        if (err || configErrors.length) {
            getConfigFromUser(callback)
        } else if (callback && typeof callback === 'function') {
            initWebClient()
            initLastFm()
            initLumiSwitches()
            initSystray()
            callback()
        } else {
            notify('Error', 'No callback provided')
        }
    })
}

function init() {
    // get conf then play music
    getConfig(playFolder)
}

// init
setTimeout(init, 100)
