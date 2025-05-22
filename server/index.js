// server/index.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('./middleware/requireAuth');
const cors = require('cors');


const app = express();

// CORS setup
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const groupRoutes = require('./routes/groups');
app.use('/api/groups', requireAuth, groupRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Your routes go here
app.get('/api/test-db', async (req, res) => {
    try {
      await mongoose.connection.db.admin().ping();
      res.json({ success: true, message: "MongoDB is connected" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
