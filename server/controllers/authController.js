// server/controllers/authController.js
const User = require('../models/User');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');

class AuthController {
  // Register new user
  async register(req, res) {
    const { username, password, email, firstName, lastName } = req.body;

    try {
      // Validate required fields
      if (!username || !password || !email) {
        return res.status(400).json({
          error: 'Username, email, and password are required',
        });
      }

      // Create user - let Mongoose handle validation and password hashing
      const user = new User({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: password, // Will be hashed by pre-save middleware
        profile: {
          firstName: firstName?.trim(),
          lastName: lastName?.trim(),
        },
        // Set defaults for new users
        isActive: true,
        preferences: {
          notifications: {
            email: {
              budgetAlerts: true,
              transactionUpdates: true,
              weeklyReports: false,
            },
            push: {
              budgetAlerts: true,
              transactionUpdates: false,
            },
          },
        },
      });

      await user.save();

      // Create JWT payload
      const payload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      };

      // Generate token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.profile.fullName,
          isEmailVerified: user.isEmailVerified,
        },
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
        const fieldName = field === 'email' ? 'Email' : 'Username';
        return res.status(400).json({
          error: `${fieldName} already exists`,
        });
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
        return res.status(400).json({
          error: 'Username/email and password are required',
        });
      }

      // Find user by username or email - include password for comparison
      const user = await User.findOne({
        $or: [
          { username: username.trim() },
          { email: username.trim().toLowerCase() },
        ],
        isActive: true, // Only allow active users to login
      }).select('+passwordHash'); // Include password for comparison

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          error:
            'Account temporarily locked due to too many failed attempts. Try again later.',
        });
      }

      // Compare password using the instance method
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        // Increment failed login attempts
        await user.incLoginAttempts();
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Get user's groups
      const userGroups = await Group.find({
        members: user._id,
      });
      const primaryGroupId = userGroups.length > 0 ? userGroups[0]._id : null;

      // Create JWT payload with more user info
      const payload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        groupId: primaryGroupId,
        isEmailVerified: user.isEmailVerified,
        plan: user.subscription.plan,
      };

      // Generate token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.profile.fullName,
          avatar: user.profile.avatar,
          isEmailVerified: user.isEmailVerified,
          plan: user.subscription.plan,
          groupId: primaryGroupId,
          preferences: user.preferences,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Verify token
  async verifyToken(req, res) {
    try {
      const user = await User.findById(req.user.userId);

      if (!user || !user.isActive) {
        return res.status(404).json({ error: 'User not found or inactive' });
      }

      // Get user's groups
      const userGroups = await Group.find({
        members: user._id,
      });
      const primaryGroupId = userGroups.length > 0 ? userGroups[0]._id : null;

      res.json({
        valid: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.profile.fullName,
          avatar: user.profile.avatar,
          isEmailVerified: user.isEmailVerified,
          plan: user.subscription.plan,
          groupId: primaryGroupId,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
        },
      });
    } catch (err) {
      console.error('Token verification error:', err);
      res.status(500).json({ error: 'Token verification failed' });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, timezone, currency } = req.body;
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update profile fields
      if (firstName !== undefined) user.profile.firstName = firstName.trim();
      if (lastName !== undefined) user.profile.lastName = lastName.trim();
      if (timezone !== undefined) user.profile.timezone = timezone;
      if (currency !== undefined) user.profile.currency = currency;

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.profile.fullName,
          avatar: user.profile.avatar,
          timezone: user.profile.timezone,
          currency: user.profile.currency,
        },
      });
    } catch (err) {
      console.error('Profile update error:', err);

      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ error: errors.join(', ') });
      }

      res.status(500).json({ error: 'Profile update failed' });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const { preferences } = req.body;
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Merge preferences (deep merge)
      if (preferences.notifications) {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...preferences.notifications,
        };
      }

      if (preferences.privacy) {
        user.preferences.privacy = {
          ...user.preferences.privacy,
          ...preferences.privacy,
        };
      }

      await user.save();

      res.json({
        message: 'Preferences updated successfully',
        preferences: user.preferences,
      });
    } catch (err) {
      console.error('Preferences update error:', err);
      res.status(500).json({ error: 'Preferences update failed' });
    }
  }

  // Logout (server-side token blacklisting would go here if needed)
  async logout(req, res) {
    try {
      res.json({
        message: 'Logged out successfully',
      });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Soft delete user account
  async deleteAccount(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Soft delete
      await user.softDelete();

      res.json({
        message: 'Account deactivated successfully',
      });
    } catch (err) {
      console.error('Account deletion error:', err);
      res.status(500).json({ error: 'Account deletion failed' });
    }
  }
}

module.exports = new AuthController();
