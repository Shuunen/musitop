window.onload = function () {
    initVue();
};

var notifier = null;

var initVue = function () {
    notify('info', 'init vue');
    new Vue({
        el: '#app',
        data: {
            app: {
                name: 'Musitop',
                socket: null
            },
            isMobile: (typeof window.orientation !== 'undefined') || true,
            isLoading: true,
            isPaused: true,
            isPlaying: false,
            notifier: null,
            progressBarStyle: {
                transitionDuration: '0s',
                transform: 'translateX(-100%)'
            },
            player: null,
            song: {
                artist: 'Unknown artist',
                title: 'Unknown title',
                duration: 0,
                shouldStartAt: 0,
                startTimestamp: 0
            }
        },
        methods: {
            initSocket: function () {
                notify('Socket', 'client side connecting...');
                this.socket = io('http://' + document.location.hostname + ':1604');
                this.socket.on('metadata', this.onMetadata);
                this.socket.on('music was', this.onMusicWas);
                this.socket.on('options', this.onOptions);
                this.socket.on('error', this.onError);
                this.socket.on('disconnect', this.onDisconnect);
                this.socket.on('connect', this.onConnection);
                this.socket.on('pause', this.pauseResume);
            },
            onMetadata: function (metadata) {
                // avoid bothering this client with other clients data refresh
                if (metadata.startTimestamp === this.song.startTimestamp) {
                    notify('Socket', 'received same metadata infos');
                    return;
                }
                notify('Socket', 'received fresh metadata infos');
                notify('info', metadata);
                this.song.artist = metadata.albumartist[0];
                this.song.title = metadata.title;
                this.song.duration = Math.round(metadata.duration);
                this.song.startTimestamp = metadata.startTimestamp;
                injectCover(metadata.picture[0]); // specific process for covers
                this.resetProgressBar();
                this.player.src = metadata.stream + '?t=' + new Date().getTime();
                var shouldStartAt = Math.round(new Date().getTime() / 1000) - metadata.startTimestamp;
                // if should start song at 1 or 3 seconds, it's stupid
                shouldStartAt = shouldStartAt <= 5 ? 0 : shouldStartAt;
                // notify('info', 'song shouldStartAt : ' + shouldStartAt + ' seconds');
                this.player.currentTime = shouldStartAt;
                this.song.shouldStartAt = shouldStartAt;
            },
            onMusicWas: function (musicWas) {
                notify('Client', 'Server said that music was "' + musicWas + '"');
                if (musicWas === 'good') {
                    notify('Client', 'Will keep this song', 'success');
                } else if (musicWas === 'bad') {
                    notify('Client', 'Deleting this song...', 'info');
                } else if (musicWas === 'next') {
                    notify('Client', 'Next song was asked');
                    setTimeout(() => {
                        this.isLoading = true;
                    }, 200);
                } else if (musicWas === 'pause') {
                    notify('Client', '|| Pause song please');
                } else {
                    notify('Client', 'Server said that music was "' + musicWas + '" ?!?', 'info');
                }
            },
            onDisconnect: function () {
                notify('Socket', 'client side disconnected');
            },
            onError: function (e) {
                notify('Error', 'Client error, see logs', 'error');
                notify('error', e);
            },
            onConnection: function () {
                notify('Socket', 'client side connection init');
            },
            onOptions: function (options) {
                notify('Socket', 'received fresh options');
                notify('info', options);
            },
            updateStatus: function (e) {
                if (this.player) {
                    // notify('Client', e.type, 'info');
                    if (e.type === 'canplay') {
                        this.isLoading = false;
                        this.updateProgressBar();
                    } else if (!this.isLoading) {
                        this.isPaused = this.player.paused;
                        this.isPlaying = !this.player.paused;
                    }
                }
            },
            resetProgressBar: function () {
                this.progressBarStyle.transitionDuration = '0s';
                this.progressBarStyle.transform = 'translateX(-100%)';
            },
            updateProgressBar: function () {
                // notify('shouldStartAt', this.song.shouldStartAt);
                var percentDoneAtInit = Math.round(this.song.shouldStartAt / this.song.duration * 10000) / 100;
                // notify('percentDoneAtInit', percentDoneAtInit);
                var secondsLeft = Math.round(this.song.duration - this.song.shouldStartAt);
                // notify('secondsLeft', secondsLeft);
                this.progressBarStyle.transitionDuration = '0s';
                setTimeout(() => {
                    this.progressBarStyle.transitionDuration = secondsLeft + 's';
                }, 300);
                this.progressBarStyle.transform = 'translateX(-' + (100 - percentDoneAtInit) + '%)';
                setTimeout(() => {
                    this.progressBarStyle.transform = 'translateX(0%)';
                }, 900);
            },
            getTimestamp: function () {
                return Math.round(new Date().getTime() / 1000);
            },
            initPlayer: function () {
                this.player = document.querySelector('audio');
                this.player.autoplay = true;
                this.player.addEventListener('ended', this.nextSong);
                this.player.addEventListener('pause', this.updateStatus);
                this.player.addEventListener('play', this.updateStatus);
                this.player.addEventListener('canplay', this.updateStatus);
            },
            initKeyboard: function () {
                document.body.addEventListener('keyup', this.handleKeyboard);
            },
            initNotifier: function () {
                // create an instance of Notyf
                this.notifier = notifier = new Notyf({
                    delay: 4000
                });
            },
            handleKeyboard: function (event) {
                // notify('info', 'received keyup "' + event.key + '"');
                this.socket.emit('event', event.key);
                if (event.key === 'MediaTrackPrevious') { // <
                    this.musicIs('good');
                } else if (event.key === 'MediaStop') { // [ ]
                    this.musicIs('bad');
                } else if (event.key === 'MediaTrackNext') { // >
                    this.nextSong();
                } else if (event.key === 'MediaPlayPause') { // [>]
                    this.pauseResume();
                } else {
                    notify('info', 'key "' + event.key + '" is not handled yet');
                }
            },
            musicIs: function (musicIs) {
                this.socket.emit('music is', musicIs);
            },
            nextSong: function () {
                this.isLoading = true;
                // set player time to 0 for next song
                if (this.player) {
                    this.player.pause();
                    this.player.currentTime = 0;
                }
                this.socket.emit('music is', 'next');
            },
            pauseResume: function () {
                if (this.player) {
                    if (this.player.paused) {
                        this.player.play();
                        this.player.autoplay = true;
                        notify('info', 'song  was paused, resuming...');
                    } else {
                        this.player.pause();
                        this.player.autoplay = false;
                        notify('info', 'song  was playing, do pause');
                    }
                }
            }
        },
        mounted() {
            notify('info', this.app.name + ' init');
            this.initSocket();
            this.initPlayer();
            this.initKeyboard();
            this.initNotifier();
        }
    });
};

var notify = function (action, message, type) {
    /* eslint-disable no-console */
    if (type) {
        if (type === 'success') {
            notifier.confirm(message);
        } else if (type === 'info') {
            notifier.alert(message);
        } else {
            console.error('cannot use notifier with type "' + type + '"');
        }
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
            applyTheme('stroke', colors[0], '[data-stroke-primary]');
            applyTheme('stroke', colors[1], '[data-stroke-secondary]');
        } else {
            notify('error', 'did not retrieved primary & secondary colors from cover');
        }
    };
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
