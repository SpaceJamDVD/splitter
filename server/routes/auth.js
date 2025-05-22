const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create and save user
    const user = new User({ username, passwordHash });
    await user.save();

    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Compare password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = {
      userId: user._id,
      username: user.username,
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

    res.json({ token,  username: user.username});
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
