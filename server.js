const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let users = [];
let chatHistory = [];

io.on('connection', (socket) => {
  socket.on('new user', (userData) => {
    socket.username = userData.name;
    socket.userColor = userData.color;
    users.push(socket);
    io.emit('user joined', users.map(user => user.username), users.length === 1);
    socket.emit('chat history', chatHistory);
    io.emit('user list', users.map(user => user.username));
  });

  socket.on('get user list', () => {
    const userList = users.map(user => user.username);
    socket.emit('user list modal', userList);
  });

  socket.on('chat message', (data) => {
    const privateMessage = data.recipient && data.recipient !== socket.username;
    const recipientSocket = users.find(user => user.username === data.recipient);

    if (privateMessage && recipientSocket) {
      recipientSocket.emit('chat message', { user: socket.username, color: socket.userColor, msg: `[ЛС] ${data.msg}` });
      socket.emit('chat message', { user: socket.username, color: socket.userColor, msg: `[ЛС] ${data.msg}` });
    } else {
      chatHistory.push({ user: socket.username, color: socket.userColor, msg: data.msg });
      io.emit('chat message', { user: socket.username, color: socket.userColor, msg: data.msg });
    }
  });

  socket.on('disconnect', () => {
    const index = users.findIndex(user => user === socket);
    if (index !== -1) {
      users.splice(index, 1);
      io.emit('user left', socket.username);
      io.emit('user list', users.map(user => user.username));
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
