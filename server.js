const express = require('express');
const app = express();

app.get('/', (eq, res) => {
    res.send('Hi0');
});

let server = app.listen(3000);

const io = require('socket.io')(server);

io.on('connect', (socket) => {
    console.log('New User connected!');
    
    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
    });
});

