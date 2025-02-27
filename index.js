const http = require('http');
const express = require('express');
const {Server} = require('socket.io');

const app = express();
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
let waitingUsers = []; // Array to store waiting users
let userPairs = {};
let usernames = {};

app.get('/', (req, res)=> {
    res.sendFile(__dirname + "/index.html")
});

io.on("connection", (socket) => {

    socket.on("setUsername", (username) => {
        usernames[socket.id] = username;
    });
    // When a user explicitly requests a match
    socket.on("findMatch", () => {

        // Prevent duplicate entries
        if (!waitingUsers.includes(socket.id)) {
            waitingUsers.push(socket.id);
        }

        // Pair users only when at least two have requested
        if (waitingUsers.length >= 2) {
            const user1 = waitingUsers.shift();
            const user2 = waitingUsers.shift();

            userPairs[user1] = user2;
            userPairs[user2] = user1;

            const username1 = usernames[user1] || "Unknown";
            const username2 = usernames[user2] || "Unknown";

            io.to(user1).emit("paired", { 
                yourId: user1, partnerId: user2, 
                yourUsername: username1, partnerUsername: username2 
            });

            io.to(user2).emit("paired", { 
                yourId: user2, partnerId: user1, 
                yourUsername: username2, partnerUsername: username1 
            });

        }
    });

    // Handle messaging
    socket.on("message", (message) => {
        const partnerId = userPairs[socket.id];
        if (partnerId) {
            io.to(partnerId).emit("message", message);
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);

        const partnerId = userPairs[socket.id];

        if (partnerId) {
            io.to(partnerId).emit("partnerDisconnected");
            delete userPairs[partnerId];
        }

        // Remove from waiting list if present
        waitingUsers = waitingUsers.filter((id) => id !== socket.id);
        delete userPairs[socket.id];
    });
});

server.listen(port,()=> {})
