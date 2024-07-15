const { Server } = require("socket.io");

function useWebSocket(server) {
    const io = new Server(server);

    io.on('connection', function (socket) {
        socket.on('user-send', function (data) {
            console.log(data);
            io.emit('broadcast', data);
        });
    });

    return io;
}

module.exports = useWebSocket;