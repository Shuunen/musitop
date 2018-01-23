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
// Utils
function shuffle(array) {
    var i = 0, j = 0, temp = null
    for (i = array.length - 1; i > 0; i -= 1) {
        j = Math.floor(Math.random() * (i + 1))
        temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
}
// Player
const title = document.querySelector('h2')
const loveButton = document.querySelector('.button.love')
const player = document.querySelector('audio')
const playPauseButton = document.querySelector('.button.play')
let willPlay = false
player.autoplay = false
function nextSong() { sendAction('next-song') }
function prevSong() { sendAction('prev-song') }
function loveSong() { sendAction('love-song') }
function hateSong() { if (confirm('Are u Sure ? This will delete the file !')) sendAction('hate-song') }
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
function updateSongData(data) {
    title.innerText = data.artist + ' - ' + data.title
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
        log('client ws web : got this message from server "' + msg.split(':')[0] + '"')
        if (msg.includes('song-data')) {
            const song = JSON.parse(msg.split('song-data:')[1])
            log(song)
            updateSongData(song)
        } else if (msg.includes('song-ready')) {
            getSong()
        } else if (msg.includes('song-changed')) {
            getSong(true)
        } else if (msg.includes('pause-song')) {
            playPause()
        } else if (msg.includes('love-song')) {
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
window.addEventListener('beforeunload', function () {
    socket.close();
});
function sendAction(action) {
    log(`sending "${action}" to server socket`)
    // avoid using this currentTime for next song :)
    delete sessionStorage['musitop.currentTime']
    socket.send(action)
}
// theme
const themes = [
    {
        background: 'https://media1.giphy.com/media/3ov9k6nCKUAHnzL41q/giphy.gif',
        color: 'yellow'
    },
    {
        background: 'https://media.giphy.com/media/3o7aD9y2CKtGHRfhOE/giphy.gif',
        color: 'violet'
    }
]
shuffle(themes)
const theme = themes[0]
document.body.style.backgroundImage = 'url("' + theme.background + '")'
document.body.style.color = theme.color
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
