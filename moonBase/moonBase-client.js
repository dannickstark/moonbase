//io = require('socket.io');

function connectToMoon(){
    let socket = io.connect('http://localhost:3000');
    return socket;
}