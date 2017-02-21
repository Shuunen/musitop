var fs = require('fs');
var port = 1403;
var express = require('express');
var http2 = require('spdy');
var app = express();
var options = {
    key: fs.readFileSync('./certs/server.key'),
    cert: fs.readFileSync('./certs/server.crt')
};
http2.createServer(options, app).listen(port, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log('server started on https://localhost:' + port);
    }
});

app.get('/pushy', (req, res) => {
    var stream = res.push('/main.js', {
        request: {
            accept: '*/*'
        },
        response: {
            'content-type': 'application/javascript'
        }
    });
    stream.end('alert("hello from push stream!");');
    res.end('<script src="/main.js"></script>');
});
