const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser ,userLeave,getRoomUsers} = require('./utils/users');
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatRoom';

      // Run when client connects
io.on("connection", (socket) => {
   // console.log(io.of("/").adapter);
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      socket.join(user.room);
      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Bienvenu sur ChatRoom!'));
  
      // Broadcast when a user connects
      socket.broadcast.to(user.room).emit('message',
          formatMessage(botName, ` ${user.username} a rejoint le chat`)
        );
  
       //Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
    
    // Listen for chatMessage
    socket.on('chatMessage', msg => {
     const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
     // Runs when client disconnects
    socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    
    if(user){
      io.emit( 'message', formatMessage(botName, `${user.username} a quitté le chat`)); 
    //Send users and room info
    io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    
    
    } 
    });
    

});
const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`server running on port ${PORT}`));