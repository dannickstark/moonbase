//We are using Heroku

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (eq, res) => {
    res.send('Hi0');
});

let server = app.listen(PORT);

const io = require('socket.io')(server);

io.on('connect', (socket) => {
    console.log('New User connected!');
    
    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
    });
});

