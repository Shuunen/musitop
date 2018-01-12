// Logger
const logEl = document.querySelector('.log')
function log(str, isError) {
    console.log(str)
    const line = document.createElement('div')
    line.classList.add('line')
    if (isError) {
        line.classList.add('error')
    }
    line.textContent = str
    logEl.appendChild(line)
    logEl.scrollTo(0, logEl.scrollHeight)
}
function toggleLog() {
    logEl.style.display = (!logEl.style.display || logEl.style.display === 'none' ? 'block' : 'none')
    sessionStorage['musitop.logDisplay'] = logEl.style.display
}
function checkLogVisibility() {
    if (sessionStorage['musitop.logDisplay']) {
        logEl.style.display = sessionStorage['musitop.logDisplay']
    }
}
// Player
const loveButton = document.querySelector('.button.love')
const player = document.querySelector('audio')
const playPauseButton = document.querySelector('.button.play')
let willPlay = false
player.autoplay = false
function nextSong() { sendAction('next-song') }
function prevSong() { sendAction('prev-song') }
function loveSong() { sendAction('love-song') }
function hateSong() { sendAction('hate-song') }
function playPause(fromButton) {
    let fromUser = (fromButton === true)
    if (player.paused) {
        if (!fromUser && sessionStorage['musitop.lastStatus'] && sessionStorage['musitop.lastStatus'] === 'paused') {
            log('restoring song state, lastStatus was paused so don\'t start/play current song')
            // delete sessionStorage['musitop.lastStatus']
            return
        }
        if (sessionStorage['musitop.currentTime']) {
            log('restoring song currentTime from ls')
            willPlay = true
            player.currentTime = sessionStorage['musitop.currentTime']
            delete sessionStorage['musitop.currentTime']
            setTimeout(function () {
                player.play()
                willPlay = false
            }, 100)
        } else if (!willPlay) {
            log('no currentTime in ls, just playing song')
            player.play()
        }
    } else {
        player.pause()
        if (fromUser) {
            sessionStorage['musitop.lastStatus'] = 'paused'
        }
    }
}
function updateStatus() {
    if (player.paused) {
        playPauseButton.innerHTML = 'i&gt;'
        log('updateStatus : was playing -> do pause')
    } else {
        sessionStorage['musitop.lastStatus'] = 'playing'
        playPauseButton.innerHTML = 'ii'
        log('updateStatus : was paused -> do play')
    }
}
function getSong(justChanged) {
    if (justChanged) {
        delete sessionStorage['musitop.currentTime']
    }
    player.src = '/song?time=' + new Date().getTime()
    loveButton.classList.remove('active')
}
// Cron
function cron() {
    if (!player.paused) {
        // log('setting currentTime in st')
        sessionStorage['musitop.currentTime'] = player.currentTime
    }
}
// WebSocket
let socket = null
function connectSocket() {
    socket = new WebSocket('wss://' + document.location.host)
    socket.onopen = () => log('client ws web : open :)')
    socket.onmessage = event => {
        const msg = event.data
        log('client ws web : got this message from server "' + msg + '"')
        if (msg === 'song-ready') {
            getSong()
        } else if (msg === 'song-changed') {
            getSong(true)
        } else if (msg === 'pause-song') {
            playPause()
        } else if (msg === 'love-song') {
            loveButton.classList.add('active')
        } else {
            log('unhandled message from server', true)
        }
    }
    socket.onerror = event => log('client ws web : error happened', event)
    socket.onclose = (event) => {
        log('client ws web : connection closed', event)
        connectSocket()
    }
}
function sendAction(action) {
    log(`sending "${action}" to server socket`)
    // avoid using this currentTime for next song :)
    delete sessionStorage['musitop.currentTime']
    socket.send(action)
}
// init
function init() {
    player.addEventListener('ended', nextSong)
    player.addEventListener('pause', updateStatus)
    player.addEventListener('play', updateStatus)
    player.addEventListener('canplay', playPause)
    document.addEventListener('dblclick', toggleLog)
    connectSocket()
    checkLogVisibility()
    setInterval(cron, 1000)
}
init()
