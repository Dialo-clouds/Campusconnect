const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });
  
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  const users = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user-connected', (userId) => {
      users.set(userId, socket.id);
      console.log(`User ${userId} connected`);
      io.emit('users-online', Array.from(users.keys()));
    });

    socket.on('send-message', (data) => {
      const { receiverId, message, senderName, senderId, broadcast } = data;
      
      if (broadcast) {
        // Send to ALL connected users except sender
        for (let [userId, socketId] of users.entries()) {
          if (userId !== senderId) {
            io.to(socketId).emit('receive-message', {
              message: `📢 ANNOUNCEMENT: ${message}`,
              senderName: `📢 ADMIN (${senderName})`,
              senderId,
              timestamp: new Date().toISOString(),
              isBroadcast: true
            });
          }
        }
        console.log(`Broadcast sent to ${users.size - 1} users`);
      } else {
        // Regular message to single user
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive-message', {
            message,
            senderName,
            senderId,
            timestamp: new Date().toISOString(),
            isBroadcast: false
          });
        }
      }
    });

    socket.on('disconnect', () => {
      let disconnectedUser = null;
      for (let [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          disconnectedUser = userId;
          users.delete(userId);
          break;
        }
      }
      if (disconnectedUser) {
        io.emit('users-online', Array.from(users.keys()));
      }
      console.log('User disconnected:', socket.id);
    });
  });

  const PORT = 3001;
  server.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
  });
});