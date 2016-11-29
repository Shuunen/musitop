var socketDoor = null;

window.onload = function () {
    connectSocket();
    handleControls();
};

var handleControls = function () {
    var ctrls = document.querySelectorAll('.controls .button');
    for (var i = 0; i < ctrls.length; i++) {
        var ctrl = ctrls[i];
        ctrl.onclick = ctrl.onmouseenter = ctrl.onmouseleave = handleControlsEvent;
    }
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
            document.querySelector('body > .content').setAttribute('data-control-hover', (event.type === 'mouseenter' ? musicIs : ''));
        } else {
            notify('Info', 'catched event "' + event.type + '" on button but not handled yet');
        }
    } else {
        notify('Error', 'Cannot say how music is :(', 'error');
    }
};

var notify = function (action, message, type) {
    if (type) {
        // notify client side
    }
    // in order to align logs :p
    while (action.length < 9) {
        action += ' ';
    }
    console.log(action + ' : ' + message);
};

var onDisconnect = function () {
    notify('Socket', 'client side disconnected');
};

var onError = function () {
    notify('Error', 'Client error, see logs', 'error');
    console.log(e);
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
    var socket = io('http://localhost:404');
    socketDoor = socket;
    socket.on('theme', onTheme);
    socket.on('player', onPlayer);
    socket.on('metadata', onMetadata);
    socket.on('music is', onMusicIs);
    socket.on('error', onError);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnection);
};

var onConnection = function () {
    notify('Socket', 'client side connection init');
};

function onPlayer (infos) {
    notify('Socket', 'received fresh player infos');
    console.log(infos);
    var el = document.querySelector('.status strong');
    if (el) {
        el.innerText = infos.currentlyPlaying;
        el.classList.remove('loader');
    } else {
        notify('warning', 'no status to populate');
    }
}

function onMetadata (metadata) {
    notify('Socket', 'received fresh metadata infos');
    console.log(metadata);

    injectData(metadata.albumartist[0], '[data-artist]');
    injectData(metadata.title, '[data-title]');
    // specific process for covers
    var dataUrl = arrayBufferToDataUrl(metadata.picture[0].data);
    if (dataUrl) {
        var els = document.querySelectorAll('[data-cover]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var type = el.getAttribute('data-cover');
            if (type === 'background') {
                el.style.backgroundImage = 'url(' + dataUrl + ')';
            } else if (type === 'src') {
                el.src = dataUrl;
                el.onload = function () {
                    notify('info', 'cover image loaded');
                    var el = document.querySelectorAll('[data-cover="gradient"]');
                    if (el) {
                        Grade(el);
                        var colors = document.body.style.backgroundImage.match(/(rgb\([\d]+,\s[\d]+,\s[\d]+\))/);
                        if (colors.length === 2) {
                            notify('info', 'got colors from cover');
                            console.log(colors);
                            applyTheme('backgroundColor', colors[0], '[data-background-primary]');
                            applyTheme('backgroundColor', colors[1], '[data-background-secondary]');
                            applyTheme('color', colors[0], '[data-color-primary]');
                            applyTheme('color', colors[1], '[data-color-secondary]');
                        } else {
                            notify('error', 'did not retrieved primary & secondary colors from cover');
                        }
                    }
                }
            }
            el.classList.remove('loader');
        }
        if (!els) {
            notify('warning', 'no picture to populate');
        }
    } else {
        notify('warning', 'no cover embedded in music');
    }
}

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
    var blob = new Blob([arrayBufferView], { type: "image/jpeg" });
    var urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
};

function onTheme (theme) {
    notify('Socket', 'received new theme instructions');
    console.log(theme);
    applyTheme('backgroundColor', theme.background, '[data-theme-background]');
    applyTheme('color', theme.color, '[data-theme-color]');
    applyTheme('borderColor', theme.color, '[data-theme-border-color]');
    applyTheme('background', theme.pattern, '[data-theme-pattern]');
    document.body.classList.add('loaded');
}

function applyTheme (property, value, selector) {
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