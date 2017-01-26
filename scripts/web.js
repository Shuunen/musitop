var socketDoor = null;
var player = null;
var playerIsPaused = false;

window.onload = function () {
    connectSocket();
    handleControls();
    handleProgressBar();
    player = document.querySelector('audio');
    handleKeyControls();
};

var startTimestamp;
var secondTotal;
var handleProgressBar = function (metadata) {
    // reset loop data
    startTimestamp = null;
    secondTotal = 0;
    // init loop
    if (!metadata) {
        var secondLeft = 0;
        var actualTimestamp = null;
        var progressBar = document.querySelector('.progress-bar-inner');
        setInterval(function () {
            if (startTimestamp && secondTotal) {
                actualTimestamp = Math.round(Date.now() / 1000);
                secondLeft = startTimestamp - actualTimestamp;
                var percentDone = Math.round(secondLeft / secondTotal * -10000) / 100;
                // notify('info', 'percent done : ' + percentDone + '%');
                progressBar.style.width = percentDone + '%';
            }
        }, 1000);
    }
    // update loop
    else {
        if (!metadata.duration) {
            notify('warn', 'duration not specified (' + metadata.duration + ')');
        } else if (!metadata.startTimestamp) {
            notify('warn', 'startTimestamp not specified (' + metadata.startTimestamp + ')');
        } else {
            startTimestamp = metadata.startTimestamp;
            secondTotal = Math.round(metadata.duration);
        }
    }
};

var handleControls = function () {
    var ctrls = document.querySelectorAll('[data-music-is]');
    for (var i = 0; i < ctrls.length; i++) {
        var ctrl = ctrls[i];
        ctrl.onclick = ctrl.onmouseenter = ctrl.onmouseleave = handleControlsEvent;
    }
};

var handleKeyControls = function () {
    document.body.addEventListener('keyup', function (event) {
        var musicIs = '';
        if (event.key === 'ArrowUp') {
            musicIs = 'good';
        } else if (event.key === 'ArrowDown') {
            musicIs = 'bad';
        } else if (event.key === 'ArrowRight') {
            musicIs = 'next';
        } else if (event.key === 'ArrowLeft') {
            // do player pause/resume
            if (playerIsPaused) {
                player.play();
                playerIsPaused = false;
            } else {
                player.pause();
                playerIsPaused = true;
            }
        } else {
            notify('info', 'key "' + event.key + '" is not handled yet');
        }
        if (musicIs.length) {
            socketDoor.emit('music is', musicIs);
        }
    });
};

var handleControlsEvent = function (event) {
    var button = event.currentTarget;
    var musicIs = button.getAttribute('data-music-is') || '';
    if (musicIs.length) {
        if (event.type === 'click') {
            socketDoor.emit('music is', musicIs);
            button.classList.add('clicked');
            setTimeout(function () {
                button.classList.remove('clicked');
            }, 2000);
        } else if (event.type === 'mouseenter' || event.type === 'mouseleave') {
            var el = document.querySelector('[data-control-hover]');
            if (el) {
                el.setAttribute('data-control-hover', (event.type === 'mouseenter' ? musicIs : ''));
            }
        } else {
            notify('Info', 'catched event "' + event.type + '" on button but not handled yet');
        }
    } else {
        notify('Error', 'Cannot say how music is :(', 'error');
    }
};

var notify = function (action, message, type) {
    /* eslint-disable no-console */
    if (type) {
        console.log('notify client side with a toaster type "' + type + '"');
    }
    if (console[action]) {
        console[action](message);
    } else {
        // in order to align logs :p
        while (action.length < 9) {
            action += ' ';
        }
        console.log(action + ' : ' + message);
    }
    /* eslint-enable no-console */
};

var onDisconnect = function () {
    notify('Socket', 'client side disconnected');
};

var onError = function (e) {
    notify('Error', 'Client error, see logs', 'error');
    notify('error', e);
};

var onMusicIs = function (musicIs) {
    if (musicIs === 'good') {
        notify('Client', 'Keep this song :D');
    } else if (musicIs === 'bad') {
        notify('Client', 'Delete this song :|');
    } else if (musicIs === 'next') {
        notify('Client', 'Next song please :)');
    } else {
        notify('Error', 'Client said that music is "' + musicIs + '" ?!?', 'error');
    }
};

var connectSocket = function () {
    notify('Socket', 'client side connecting...');
    var socket = io('http://localhost:1404');
    socketDoor = socket;
    socket.on('metadata', onMetadata);
    socket.on('options', onOptions);
    socket.on('music is', onMusicIs);
    socket.on('error', onError);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnection);
};

var onConnection = function () {
    notify('Socket', 'client side connection init');
};

function onOptions(options) {
    notify('Socket', 'received fresh options');
    notify('info', options);
    player.autoplay = options.audioClientSide;
}

function onMetadata(metadata) {
    notify('Socket', 'received fresh metadata infos');
    notify('info', metadata);
    handleProgressBar(metadata);
    injectData(metadata.albumartist[0], '[data-artist]');
    injectData(metadata.title, '[data-title]');
    injectCover(metadata.picture[0]); // specific process for covers
    injectAudio(metadata.stream);
}

var injectAudio = function (stream) {
    player.src = stream;
};

var injectCover = function (cover) {
    var dataUrl = cover ? arrayBufferToDataUrl(cover.data) : 'icons/no-cover.svg';
    if (!dataUrl) {
        notify('warning', 'no cover embedded in music');
        return;
    }
    var gettingColorAtLeastForOne = false;
    var els = document.querySelectorAll('[data-cover]');
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var type = el.getAttribute('data-cover');
        if (type === 'background') {
            el.style.backgroundImage = 'url(' + dataUrl + ')';
        } else if (type === 'src') {
            el.src = dataUrl;
            if (!gettingColorAtLeastForOne) {
                gettingColorAtLeastForOne = true;
                getColorPaletteFromImage(el);
            }
        }
        el.classList.remove('loader');
    }
    if (!els) {
        notify('warning', 'no picture to populate');
    }
};

var getColorPaletteFromImage = function (image) {
    image.onload = function () {
        notify('info', 'cover image loaded');
        var target = document.querySelectorAll('[data-cover="gradient"]'); // why querySelectorAll
        target[0].style = '';
        if (!target.length) {
            notify('warning', 'no target to apply Grade');
            return;
        }
        Grade(target);
        var colors = target[0].style.backgroundImage.match(/(rgb\([\d]+,\s[\d]+,\s[\d]+\))/g); // to use [0] ?
        if (colors && colors.length === 2) {
            notify('Grade', 'got colors from cover : "' + colors[0] + '" & "' + colors[1] + '"');
            applyTheme('backgroundColor', colors[0], '[data-background-primary]');
            applyTheme('backgroundColor', colors[1], '[data-background-secondary]');
            applyTheme('color', colors[0], '[data-color-primary]');
            applyTheme('color', colors[1], '[data-color-secondary]');
        } else {
            notify('error', 'did not retrieved primary & secondary colors from cover');
        }
    };
};

var injectData = function (value, selector) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        el.innerText = value;
        el.classList.remove('loader');
    }
};

var arrayBufferToDataUrl = function (arrayBuffer) {
    // Obtain a blob: URL for the image data.
    var arrayBufferView = new Uint8Array(arrayBuffer);
    var blob = new Blob([arrayBufferView], {
        type: 'image/jpeg'
    });
    var urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
};

function applyTheme(property, value, selector) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (property === 'background') {
            el[property] = value;
        } else {
            el.style[property] = value;
        }
    }
}
