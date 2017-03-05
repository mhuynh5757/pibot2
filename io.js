var server = require('./server');
var io = require('socket.io')(server);

var ui = io.of('/ui');
var control = io.of('/control');

var robot_state = {
  BUSY: false,
  READY: true
}

var map = [];

// UI related websocket interfaces
ui.on('connection', function(socket) {
  socket.emit('data', map);
  socket.on('command', function(command) {
    control.emit('message', command);
  });
});

// robotics control related websocket interfaces
control.on('connection', function(socket) {
  console.log('robot connected');
  
  socket.on('data', function(data) {
    map = data;
    ui.emit('data', data);
  });
  
  socket.on('message', function(message) {
    ui.emit('message', message);
  });
  
  socket.on('status', function(status) {
    ui.emit('status', status);
  });
});
  