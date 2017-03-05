var server = require('./server');
var io = require('socket.io')(server);

var ui = io.of('/ui');
var control = io.of('/control');

// UI related websocket interfaces
ui.on('connection', function(socket) {
  socket.on('startup', function(data) {
    control.emit('startup', data);
  });
});

// robotics control related websocket interfaces
control.on('connection', function(socket) {
  socket.emit('startup', '');
  
  socket.on('data', function(data) {
    ui.emit('data', data);
  });
});
  