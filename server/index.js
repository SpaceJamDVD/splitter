// server/index.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('./middleware/requireAuth');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// CORS setup
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

app.use(cookieParser());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes

app.set('io', io);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Some routes are protected, so we apply requireAuth middleware locally
const groupRoutes = require('./routes/groups');
app.use('/api/groups', groupRoutes);

const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', requireAuth, transactionRoutes);

const memberBalanceRoutes = require('./routes/memberBalance');
app.use('/api/memberBalance', requireAuth, memberBalanceRoutes);

const budgetRoutes = require('./routes/budgets');
app.use('/api/budgets', requireAuth, budgetRoutes);

// Test route
app.get('/api/test-db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ success: true, message: 'MongoDB is connected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  //console.log('User connected:', socket.id);

  // Handle custom events
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    //console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', (data) => {
    // Emit to specific room or broadcast
    socket.to(data.room).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    //console.log('User disconnected:', socket.id);
  });
});

// Start server (only once, using server not app)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
