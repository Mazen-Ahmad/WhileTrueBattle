const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
// Add this line with other imports at the top
const contestRoutes = require('./routes/contest');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      /\.vercel\.app$/,
      /\.onrender\.com$/
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || "http://localhost:3000",
    /\.vercel\.app$/, // Allow all Vercel apps
    /\.onrender\.com$/ // Allow Render preview URLs
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500
  skip: (req) => {
    // Skip rate limiting for health and keep-alive endpoints
    return req.path === '/api/health' || req.path === '/keep-alive';
  }
});
app.use(limiter);


app.get('/keep-alive', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/contests', contestRoutes);
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
const Room = require('./models/Room');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', async (roomCode, userId) => {
    try {
      const room = await Room.findOne({ roomCode })
        .populate('participants.user', 'username');
      
      if (room) {
        socket.join(roomCode);
        socket.emit('room-joined', room);
        socket.to(roomCode).emit('user-joined', {
          message: 'A user joined the room',
          participants: room.participants
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
socket.on('start-contest', (roomCode) => {
  socket.to(roomCode).emit('contest-started', { roomCode });
});

socket.on('join-contest', (roomCode) => {
  socket.join(`contest-${roomCode}`);
});

socket.on('code-submitted', (data) => {
  socket.to(`contest-${data.roomCode}`).emit('submission-received', data);
});
  // Leave room
  socket.on('leave-room', (roomCode) => {
    socket.leave(roomCode);
    socket.to(roomCode).emit('user-left', {
      message: 'A user left the room'
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
