const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'))

io.on('connection', (socket) => {
  // socket.on('Action', (data) => {
  //   socket.broadcast.emit('draw', data);
  // });
})

server.listen(3000, () => {
  console.log(`server running at http://localhost:${3000}`);
});
