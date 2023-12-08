// public/project1/sketch.js
const socket = io();

function setup() {
  createCanvas(400, 400);
  socket.emit('join_project', 'project1');
}

function draw() {
  background(220);
  // Project 1-specific p5.js drawing code
}

// Emit a Project 1-specific event
socket.emit('project1_event', { message: 'Hello from Project 1' });
