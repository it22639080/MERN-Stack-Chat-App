import express from 'express';
import "dotenv/config"
import cors from 'cors';
import http from 'http';
import { connect } from 'http2';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoute.js';
import { Server } from 'socket.io';

// create express app and http server
const app = express();
const server = http.createServer(app)
// create socket.io server
export const io = new Server(server, {
    cors: {
        origin: "*"}
})

export const userSocketMap = {}; // {userId:socketId}

// socket.io connection
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}`);

    if(userId) userSocketMap[userId] = socket.id; 

    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Emit online users to all clients

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${userId}`); 
        delete userSocketMap[userId]; // Remove user from the map on disconnect})  
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Emit updated online users to all clients
    });
        // map userId to socketId
    
    
})

//moddleware setup

app.use(express.json({limit: '4mb'}));
app.use(cors());

app.use("/api/status",(req, res) => 
    res.send("Server is running"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);


await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});