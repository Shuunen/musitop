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
var sharp = require('sharp')
var gitServer = require('simple-git')(__dirname)
var webClientFolder = 'web-client'
var publicFolder = 'public'
var gitWebClient = require('simple-git')(webClientFolder)
var coverPath = __dirname + '/' + publicFolder + '/cover.jpg'
var coverMissingPath = __dirname + '/' + publicFolder + '/no-cover.jpg'
var coverBlurryPath = __dirname + '/' + publicFolder + '/cover-blurry.jpg'
var coverMissingBlurryPath = __dirname + '/' + publicFolder + '/no-cover-blurry.jpg'
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

app.get('/stream.mp3', function (req, res) {
    res.sendFile(song)
})

app.get('/cover.jpg', function (req, res) { res.sendFile(coverPath) })
app.get('/cover-256.jpg', function (req, res) { res.sendFile(coverPath.replace('.', '-256.')) }) // TODO : try to factorize
app.get('/cover-512.jpg', function (req, res) { res.sendFile(coverPath.replace('.', '-512.')) })
app.get('/cover-blurry.jpg', function (req, res) { res.sendFile(coverBlurryPath) })

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
        gitWebClient.pull(function (err, update) {
            var ret = {
                target: 'client'
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
        notify('Will keep', fileName(song), 'info')
        loveSong()
        keep = true
        ioEmit('music was', musicIs)
    } else if (musicIs === 'bad') {
        notify('Client', '✕ Delete this song :|')
        notify('Deleting', fileName(song), 'info')
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
        notify('Server', 'Client said that music is "' + musicIs + '" ?!?', 'info')
    }
}

var onError = function (err) {
    notify('Socket', 'Client had errors', 'error', err)
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
    ioEmit('metadata', metadata)
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
var notifier = require('node-notifier')
var os = require('os')
var Lastfm = require('lastfm-njs')
var lastfm = null
var isLinux = (os.type() === 'Linux')
var configFile = 'config.json'
var config = require('config-prompt')({
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
    desktopNotifications: {
        type: 'boolean',
        default: true
    },
    lastfmAccess: {
        type: 'string',
        default: 'key/secret/user/pass'
    },
    lumiSwitches: {
        type: 'string',
        default: 'goodId/badId'
    }
})
var shuffle = require('shuffle-array')
var playlist = []
var song = ''
var player = null
var autoKill = false
var manualKill = false
var keep = false
var metadata = null
var palette = null

function playFolder() {
    var musicPath = config.get('musicPath')
    notify('Server', 'Scanning "' + musicPath + '"' + ' for songs')
    fs.readdir(musicPath, function (err, files) {
        if (err) {
            config.trash()
            notify('Error', 'Failed at reading musicPath', 'error', err)
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
    if (from) {
        from += '' // avoid "unused var" errors & keep it in case
        // notify('Server', 'playNext called by ' + from );
    }
    // here splice return first item & remove it from playlist
    song = playlist.splice(0, 1)[0]
    getMetadata()
    // if audio output is server side
    if (!config.get('audioClientSide')) {
        playSong()
    }
    setTimeout(function () {
        notify('Server', '♫ Remaining ' + playlist.length + ' track(s)')
        notify('Playing', fileName(song), 'info')
        ioEmit('metadata', metadata)
        scrobbleSong()
    }, 1100)
}

function getMetadata() {
    metadata = null
    var readableStream = fs.createReadStream(song)
    musicMetadata(readableStream, {
        duration: true
    }, function (err, meta) {
        if (err) {
            notify('Error', 'Fail at reading mp3 metadata for song "' + song + '"', 'error', err)
        } else {
            metadata = meta
            metadata.uid = getTimestamp()
            metadata.stream = '/stream.mp3'
            readableStream.close()
            generateCovers()
        }
    })
}

function getTimestamp() {
    return Math.round(Date.now() / 1000)
}

function generateCovers() {
    var data = metadata.picture[0]
    try {
        var buffer = new Buffer(data.data, 'binary')
        /* Main cover */
        sharp(buffer)
            .resize(550, 350)
            .crop(sharp.gravity.center)
            .toFile(coverPath, (err) => {
                if (err) {
                    notify('Server', 'Generate main covers failed, see me', null, err)
                } else {
                    vibrant.from(coverPath).getPalette((err, swatches) => {
                        palette = swatches
                        ioEmit('palette', palette)
                    })
                }
            })
        /* Blurry one for background */
        sharp(buffer)
            .blur(10)
            .toFile(coverBlurryPath, (err) => { if (err) { notify('Server', 'Generate blurry covers failed, see me', null, err) } })
        /* Small ones for media session */
        const resize = size => sharp(buffer).resize(size, size)
            .toFile(coverPath.replace('.', '-' + size + '.'), (err) => { if (err) { notify('Server', 'Generate blurry covers failed, see me', null, err) } })
        Promise.all([512, 256].map(resize)).then(() => { notify('Server', 'Generate covers sizes complete') })
    } catch (error) {
        notify('Server', 'Generate covers failed, see my catch', null, error)
        fs.createReadStream(coverMissingPath).pipe(fs.createWriteStream(coverPath))
        fs.createReadStream(coverMissingBlurryPath).pipe(fs.createWriteStream(coverBlurryPath))
    }
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
                notify('Server', 'Move failed, see me')
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
                notify('Error', 'Delete failed', 'error', err)
            } else {
                notify('Server', '✕ Deleted ' + fileName(lastSongPath))
            }
        })
    })
}

function doAsync(callback) {
    if (!callback) {
        notify('Error', 'Do Async need a callback', 'error')
    } else {
        var lastSongPath = song + ''
        setTimeout(function () {
            callback(lastSongPath)
        }, 1000)
    }
}

function notify(action, message, type, bonus) {
    if (type && config.get('desktopNotifications') !== false) {
        // notify client side
        notifier.notify({
            title: action,
            message: message,
            type: type
        })
    }
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
        // notify('playSong', 'manualKill was ' + manualKill + ', now true');
        manualKill = true
        player.kill()
    }

    if (isLinux) {
        // use cvlc on linux
        player = childProcess.spawn('cvlc', [song, '--play-and-exit'])
    } else {
        // use 1by1 on win
        player = childProcess.spawn('lib/1by1/1by1.exe', [song, '/hide', '/close'])
    }

    // because new player started
    // notify('playSong', 'autoKill was ' + autoKill + ', now false');
    autoKill = false

    // when user did not asked anything, player close by itself
    player.on('close', function (code) {
        // notify('close', 'manualKill is ' + manualKill);
        if (manualKill) {
            // notify('Server', 'Player closed, was manual kill');
            // this avoid making move or play next if player was killed on purpose
            // notify('close', 'manualKill was ' + manualKill + ', now false');
            // notify('close', 'autoKill was ' + autoKill + ', now false');
            manualKill = false
            autoKill = false
        } else {
            // notify('Server', 'Player closed, was auto kill');
            // notify('close', 'autoKill was ' + autoKill + ', now true');
            autoKill = true
            // here player just went until the end of the song & then exited
            if (code === null || code === 0) {
                if (keep) {
                    moveSong()
                }
                playNext('player closed')
            } else {
                notify('Server', 'Player process exited with non-handled code "' + code + '"', 'error')
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
                artist: metadata.artist[0],
                track: metadata.title,
                timestamp: getTimestamp(),
                callback: function (result) {
                    if (!result.success) {
                        notify('Server', 'scrobbleSong failed', 'error')
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
                artist: metadata.artist[0],
                track: metadata.title,
                callback: function (result) {
                    if (!result.success) {
                        notify('Server', 'loveSong failed', 'error')
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
            notify('Server', 'Failed at reading config, see logs', 'error', err)
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
        return notify('Error', 'LastFm access should have 4 parts', 'error')
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
    notify('Info', 'will serve "' + exposedFolder + '"')
    app.use('/', express.static(exposedFolder))
    if (config.get('serveWebClient')) {
        try {
            gitServer.clone('https://github.com/Shuunen/musitop-client', webClientFolder)
        } catch (error) {
            notify('Info', 'musitop client was already cloned')
        }
    }
}

function initLumiSwitches() {
    if (!config.get('lumiSwitches')) {
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
                notify('Lumi', name + ' has been double clicked, going to next song...')
                onMusicIs('next')
            })
            device.on('longClickPress', () => {
                notify('Lumi', name + ' has been long pressed, but no action configured')
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
            notify('Server', 'Local config found, set found conf key/values into in-memory conf')
            config.all = JSON.parse(configContent)
        }
        var configErrors = config.validate()
        if (err || configErrors.length) {
            getConfigFromUser(callback)
        } else if (callback && typeof callback === 'function') {
            initWebClient()
            initLastFm()
            initLumiSwitches()
            callback()
        } else {
            notify('Error', 'Error, no callback provided', 'error')
        }
    })
}

function init() {
    // get conf then play music
    getConfig(playFolder)
    // add systray controls
    childProcess.spawn('node_modules/electron/dist/electron', ['systray'])
}

// init
setTimeout(init, 100)
