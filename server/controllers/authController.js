// server/controllers/authController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthController {
  // Register new user
  async register(req, res) {
    const { username, password, email } = req.body;

    try {
      // Check if user exists by username
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Check if user exists by email (if provided)
      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ error: 'Email already taken' });
        }
      }

      // Validate required fields
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: 'Username and password are required' });
      }

      // Validate password strength (optional)
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: 'Password must be at least 6 characters' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create and save user
      const user = new User({
        username,
        passwordHash,
        ...(email && { email }), // Include email if provided
      });

      await user.save();

      res.status(201).json({
        message: 'User created successfully',
        userId: user._id,
        username: user.username,
      });
    } catch (err) {
      console.error('Registration error:', err);

      // Handle mongoose validation errors
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ error: errors.join(', ') });
      }

      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ error: `${field} already exists` });
      }

      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Login user
  async login(req, res) {
    const { username, password } = req.body;

    try {
      // Validate required fields
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: 'Username and password are required' });
      }

      // Find user (can login with username or email)
      const user = await User.findOne({
        $or: [
          { username },
          { email: username }, // Allow login with email as username
        ],
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create JWT payload
      const payload = {
        userId: user._id,
        username: user.username,
      };

      // Generate token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h', // Extended to 24h for better UX
      });

      res.json({
        token,
        username: user.username,
        userId: user._id,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Verify token (optional - for checking if user is still authenticated)
  async verifyToken(req, res) {
    try {
      // Token is already verified by middleware, so user is in req.user
      const user = await User.findById(req.user.userId).select('-passwordHash');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        valid: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Token verification error:', err);
      res.status(500).json({ error: 'Token verification failed' });
    }
  }

  // Logout (optional - mainly for client-side cleanup)
  async logout(req, res) {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}

module.exports = new AuthController();
