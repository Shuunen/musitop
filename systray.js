var electron = require('electron');
var path = require('path');
var net = require('net');
var port = 6666;
'use strict';

function tellServer (goodOrBad) {
    var client = new net.Socket();
    client.connect(port, '127.0.0.1', function () {
        console.log('Client connected');
        client.write(goodOrBad);
        client.end();
    });
    client.on('close', function () {
        console.log('Client close');
    });
    client.on('end', function () {
        console.log('Client end');
    });
    client.on('error', function (e) {
        console.log('Client error', e);
    });
}
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

var win = null;
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

function addTrayIcon (icon) {
    icon.instance = new electron.Tray(icon.icon);
    icon.instance.setToolTip(icon.tooltip);
    icon.instance.on('click', function () {
        if (this.balloon) {
            this.instance.displayBalloon(this.balloon);
        }
        tellServer(this.send);
    }.bind(icon));
}

electron.app.on('ready', function () {
    // i'm not sure this is required
    // win = new electron.BrowserWindow({ show: false });
    // init tray icons
    // don't know why but in this order, icons are displayed good, next, bad -_-''
    addTrayIcon(icons.next);
    addTrayIcon(icons.bad);
    addTrayIcon(icons.good);
});