'use strict'

/***
 *    -▄▄▄▄▄▄▄▄▄▄▄--▄---------▄--▄▄▄▄▄▄▄▄▄▄▄--▄▄▄▄▄▄▄▄▄▄▄--▄▄▄▄▄▄▄▄▄▄▄--▄▄▄▄▄▄▄▄▄▄▄--▄---------▄-
 *    ▐░░░░░░░░░░░▌▐░▌-------▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌-------▐░▌
 *    ▐░█▀▀▀▀▀▀▀▀▀-▐░▌-------▐░▌▐░█▀▀▀▀▀▀▀▀▀--▀▀▀▀█░█▀▀▀▀-▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌-------▐░▌
 *    ▐░▌----------▐░▌-------▐░▌▐░▌---------------▐░▌-----▐░▌-------▐░▌▐░▌-------▐░▌▐░▌-------▐░▌
 *    ▐░█▄▄▄▄▄▄▄▄▄-▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄------▐░▌-----▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌
 *    ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌-----▐░▌-----▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
 *    -▀▀▀▀▀▀▀▀▀█░▌-▀▀▀▀█░█▀▀▀▀--▀▀▀▀▀▀▀▀▀█░▌-----▐░▌-----▐░█▀▀▀▀█░█▀▀-▐░█▀▀▀▀▀▀▀█░▌-▀▀▀▀█░█▀▀▀▀-
 *    ----------▐░▌-----▐░▌---------------▐░▌-----▐░▌-----▐░▌-----▐░▌--▐░▌-------▐░▌-----▐░▌-----
 *    -▄▄▄▄▄▄▄▄▄█░▌-----▐░▌------▄▄▄▄▄▄▄▄▄█░▌-----▐░▌-----▐░▌------▐░▌-▐░▌-------▐░▌-----▐░▌-----
 *    ▐░░░░░░░░░░░▌-----▐░▌-----▐░░░░░░░░░░░▌-----▐░▌-----▐░▌-------▐░▌▐░▌-------▐░▌-----▐░▌-----
 *    -▀▀▀▀▀▀▀▀▀▀▀-------▀-------▀▀▀▀▀▀▀▀▀▀▀-------▀-------▀---------▀--▀---------▀-------▀------
 *    -------------------------------------------------------------------------------------------
 */

const electron = require('electron')
const path = require('path')
const childProcess = require('child_process')
// const os = require('os');
// const isLinux = (os.type() === 'Linux');
// const isWindows = (os.type() === 'Windows');
const baseDir = path.join(__dirname, '..')
const icons = {
    good: {
        send: 'good',
        instance: null,
        icon: path.join(baseDir, 'icons/Aha-Soft/Thumbs up.png'),
        tooltip: 'Keep this',
        balloon: {
            title: 'Song marked to keep',
            content: 'Will be moved to keep folder'
        }
    },
    next: {
        send: 'next',
        instance: null,
        icon: path.join(baseDir, 'icons/Aha-Soft/Last.png'),
        tooltip: 'Next track'
    },
    bad: {
        send: 'bad',
        instance: null,
        icon: path.join(baseDir, 'icons/Aha-Soft/Thumbs down.png'),
        tooltip: 'Delete this',
        balloon: {
            title: 'Song marked to delete',
            content: 'Will be deleted'
        }
    }
}
const debug = false
const log = function (thing, bonus) {
    if (!debug) {
        return
    }
    bonus = bonus || ''
    console.log('Systray :', thing, bonus) // eslint-disable-line no-console
}
// communicate with server via generic client
const tellServer = function (goodOrBad) {
    log('User clicked on "' + goodOrBad + '"')
    childProcess.execFile('node', ['client', '--musicIs=' + goodOrBad], { cwd: baseDir }, (error, stdout, stderr) => {
        if (error) {
            log('Error occured in tellServer child stderr :', stderr)
            throw error
        }
        log('Somthing occured in tellServer child stdout :', stdout)
    })
}

// add one icon in system tray
const addTrayIcon = function (icon) {
    icon.instance = new electron.Tray(icon.icon)
    icon.instance.setToolTip(icon.tooltip)
    icon.instance.on('click', function () {
        if (this.balloon) {
            this.instance.displayBalloon(this.balloon)
        }
        tellServer(this.send)
    }.bind(icon))
}

// init tray icons
electron.app.on('ready', function () {
    log('Electron is ready')
    // timeouts enforce the order in which icons will be displayed in systray
    setTimeout(function () {
        addTrayIcon(icons.good)
    }, 100)
    setTimeout(function () {
        addTrayIcon(icons.next)
    }, 200)
    setTimeout(function () {
        addTrayIcon(icons.bad)
    }, 300)
})

// add systray controls
// childProcess.spawn('node_modules/electron/dist/electron', ['systray'])
