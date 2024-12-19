let io;

module.exports = {
  setSocketIO: (socketIO) => {
    io = socketIO;
  },
  getSocketIO: () => io
};