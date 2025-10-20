// frosty - Backend Server (Production Ready)
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// --- إعدادات CORS للإنتاج ---
// اسمح بالاتصال من الرابط الذي يحدده Render أو من localhost
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL }));

const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

let roomStates = {};
let chatHistory = {};

app.get('/', (req, res) => {
    res.send('frosty backend running.'); // للتأكد أن الخادم يعمل
});

app.get('/create-room', (req, res) => {
    const roomID = uuidv4().substring(0, 8);
    console.log(`[frosty] New room created: ${roomID}`);
    roomStates[roomID] = {
        videoUrl: "https://www.youtube.com/watch?v=M7FIvfx5J10",
        playing: false,
        time: 0
    };
    chatHistory[roomID] = [];
    res.json({ roomID: roomID });
});

io.on('connection', (socket) => {
    console.log(`[frosty] Client connected: ${socket.id}`);

    socket.on('JOIN_ROOM', ({ roomID, username }) => {
        socket.join(roomID);
        console.log(`[frosty] User '${username}' joined ${roomID}`);

        if (roomStates[roomID]) {
            socket.emit('SERVER_SYNC_STATE', roomStates[roomID]);
        }
        if (chatHistory[roomID]) {
            socket.emit('SERVER_CHAT_HISTORY', chatHistory[roomID]);
        }
        io.to(roomID).emit('SERVER_USER_JOINED', `${username} انضم للغرفة.`);
    });

    socket.on('CLIENT_SYNC_STATE', (data) => {
        const { roomID, state } = data;
        if (roomStates[roomID]) {
            roomStates[roomID] = state;
            socket.to(roomID).emit('SERVER_SYNC_STATE', state);
        }
    });

    socket.on('CLIENT_CHAT_MESSAGE', (data) => {
        const { roomID, user, message } = data;
        const chatMessage = { user, message, id: uuidv4() };
        if (chatHistory[roomID]) {
            chatHistory[roomID].push(chatMessage);
            if (chatHistory[roomID].length > 50) chatHistory[roomID].shift();
        }
        io.to(roomID).emit('SERVER_NEW_MESSAGE', chatMessage);
    });

    socket.on('CLIENT_CHANGE_VIDEO', (data) => {
        const { roomID, videoUrl, username } = data;
        const newState = { videoUrl, playing: false, time: 0 };
        roomStates[roomID] = newState;
        io.to(roomID).emit('SERVER_SYNC_STATE', newState);
        io.to(roomID).emit('SERVER_NEW_MESSAGE', { 
            user: 'System', 
            message: `${username} قام بتغيير الفيديو.`,
            id: uuidv4() 
        });
    });

    socket.on('disconnect', () => {
        console.log(`[frosty] Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`[frosty] Backend server running on port ${PORT}`);
});
