const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { join } = require('path');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(cors());

io.on('connection', (socket) => {
  console.log("connected");
  socket.on('Played', (data) => {
    socket.broadcast.emit('update', data);
  });
})

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});














// Game instances (rooms)
// const gameRooms = {};

// io.on('connection', (socket) => {
//   console.log('user visited the website');
//   // Handle new player joining a specific game room
//   socket.on('joinGame', (roomId, playerName) => {
//     // Create a new room if it doesn't exist
//     if (!gameRooms[roomId]) {
//       gameRooms[roomId] = { players: [] };
//     }

//     // Join the specified room
//     socket.join(roomId);

//     // Add the player to the room
//     gameRooms[roomId].players.push({ id: socket.id, name: playerName });

//     // Notify everyone in the room about the new player
//     io.to(roomId).emit('playerJoined', gameRooms[roomId].players);

//     // Handle player input and game logic within the room
//     socket.on('playerInput', (inputData) => {
//       // Process player input and update game state
//       // Broadcast the updated state to all players in the room
//       io.to(roomId).emit('updateGameState', updatedState);
//     });

//     // Handle player disconnection
//     socket.on('disconnect', () => {
//       // Remove the player from the room
//       gameRooms[roomId].players = gameRooms[roomId].players.filter(player => player.id !== socket.id);

//       // Notify everyone in the room about the player leaving
//       io.to(roomId).emit('playerLeft', gameRooms[roomId].players);
//     });
//   });
//   socket.on('Played', (data) => {
//     socket.broadcast.emit('update', data);
//   });
// });
