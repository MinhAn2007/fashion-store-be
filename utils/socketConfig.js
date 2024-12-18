const socketIo = require('socket.io');

const connectedUsers = new Map();

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    // Register user when they connect
    socket.on('register', ({ userId }) => {
      connectedUsers.set(userId, socket.id);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      for (let [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });

  return {
    io,
    connectedUsers
  };
};

module.exports = initSocket;