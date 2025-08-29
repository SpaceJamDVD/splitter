// server/index.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const requireAuth = require('./middleware/requireAuth');

const app = express();
const server = http.createServer(app);

/* -------- CORS (dev/prod via env) -------- */
// Prefer ALLOWED_ORIGINS (comma-separated). Fallback to CLIENT_URL or localhost.
const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = envOrigins.length
  ? envOrigins
  : ['http://localhost:3000'];

const corsOptions = {
  origin(origin, cb) {
    // allow tools without an Origin (curl/postman) and any whitelisted origin
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

if (process.env.NODE_ENV === 'production') {
  // needed for secure cookies behind Render/Proxies
  app.set('trust proxy', 1);
}

app.use(cors(corsOptions));

/* -------- App middleware -------- */
app.use(express.json());
app.use(cookieParser());

/* -------- Socket.IO (share same CORS policy) -------- */
const io = new Server(server, { cors: corsOptions });
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => socket.join(roomId));
  socket.on('send-message', (data) =>
    socket.to(data.room).emit('receive-message', data)
  );
});

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

/* -------- Routes -------- */
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const groupRoutes = require('./routes/groups');
app.use('/api/groups', groupRoutes);

const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', requireAuth, transactionRoutes);

const memberBalanceRoutes = require('./routes/memberBalance');
app.use('/api/memberBalance', requireAuth, memberBalanceRoutes);

const budgetRoutes = require('./routes/budgets');
app.use('/api/budgets', requireAuth, budgetRoutes);

// quick health check for DB
app.get('/api/test-db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ success: true, message: 'MongoDB is connected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -------- Start -------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
