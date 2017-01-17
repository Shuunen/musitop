'use strict';

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

var electron = require('electron');
var path = require('path');
var childProcess = require('child_process');
// var os = require('os');
// var isLinux = (os.type() === 'Linux');
// var isWindows = (os.type() === 'Windows');
var icons = {
    good: {
        send: 'good',
        instance: null,
        icon: path.join(__dirname, 'icons/Aha-Soft/Thumbs up.png'),
        tooltip: 'Keep this',
        balloon: {
            icon: path.join(__dirname, 'icons/Paomedia/sign-check.png'),
            title: 'Song marked to keep',
            content: 'Will be moved to keep folder'
        }
    },
    next: {
        send: 'next',
        instance: null,
        icon: path.join(__dirname, 'icons/Aha-Soft/Last.png'),
        tooltip: 'Next track'
    },
    bad: {
        send: 'bad',
        instance: null,
        icon: path.join(__dirname, 'icons/Aha-Soft/Thumbs down.png'),
        tooltip: 'Delete this',
        balloon: {
            icon: path.join(__dirname, 'icons/Paomedia/sign-error.png'),
            title: 'Song marked to delete',
            content: 'Will be deleted'
        }
    }
};

// communicate with server via generic client
var tellServer = function (goodOrBad) {
    childProcess.fork('client.js', ['--musicIs=' + goodOrBad]);
};

// add one icon in system tray
var addTrayIcon = function (icon) {
    icon.instance = new electron.Tray(icon.icon);
    icon.instance.setToolTip(icon.tooltip);
    icon.instance.on('click', function () {
        if (this.balloon) {
            this.instance.displayBalloon(this.balloon);
        }
        tellServer(this.send);
    }.bind(icon));
};

// init tray icons
electron.app.on('ready', function () {
    // timeouts enforce the order in which icons will be displayed in systray
    setTimeout(function () {
        addTrayIcon(icons.good);
    }, 100);
    setTimeout(function () {
        addTrayIcon(icons.next);
    }, 200);
    setTimeout(function () {
        addTrayIcon(icons.bad);
    }, 300);
});
