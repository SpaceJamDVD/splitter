// server/controllers/authController.js
const User = require('../models/User');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');

// Token blacklist (in-memory for now - we'll improve this later)
const tokenBlacklist = new Set();

class AuthController {
  // Helper method to generate both access and refresh tokens
  generateTokens(payload) {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_ACCESS_SECRET, // New env variable
      { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET, // New env variable
      { expiresIn: '7d' } // Long-lived refresh token
    );

    return { accessToken, refreshToken };
  }

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

      // Generate both tokens
      const { accessToken, refreshToken } = this.generateTokens(payload);

      console.log('🔐 New user registered - tokens generated:', {
        userId: user._id,
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
      });

      res.status(201).json({
        message: 'User created successfully',
        accessToken, // Short-lived token for API requests
        refreshToken, // Long-lived token for getting new access tokens
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

      // Generate both tokens
      const { accessToken, refreshToken } = this.generateTokens(payload);

      console.log('🔑 User logged in - tokens generated:', {
        userId: user._id,
        username: user.username,
        accessTokenExpiry: '15 minutes',
        refreshTokenExpiry: '7 days',
      });

      res.json({
        accessToken, // Short-lived token
        refreshToken, // Long-lived token
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

  // NEW: Refresh token endpoint
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      // Check if token is blacklisted
      if (tokenBlacklist.has(refreshToken)) {
        console.log('🚫 Attempted use of blacklisted refresh token');
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Make sure it's actually a refresh token
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Invalid token type' });
      }

      // Find user to make sure they still exist and are active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Get fresh user data for new token
      const userGroups = await Group.find({ members: user._id });
      const primaryGroupId = userGroups.length > 0 ? userGroups[0]._id : null;

      // Create new payload with fresh data
      const payload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        groupId: primaryGroupId,
        isEmailVerified: user.isEmailVerified,
        plan: user.subscription.plan,
      };

      // Generate new access token (keep same refresh token)
      const newAccessToken = jwt.sign(
        { ...payload, type: 'access' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      console.log('🔄 Token refreshed for user:', {
        userId: user._id,
        username: user.username,
        newTokenExpiry: '15 minutes',
      });

      res.json({
        accessToken: newAccessToken,
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
      console.error('Token refresh error:', err);

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED',
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  // Verify token (updated to work with access tokens)
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

  // Logout (now with token blacklisting)
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      // Add refresh token to blacklist if provided
      if (refreshToken) {
        tokenBlacklist.add(refreshToken);
        console.log('🚪 User logged out - refresh token blacklisted');
      }

      // Note: We can't blacklist access tokens easily since they're short-lived
      // The 15-minute expiry provides reasonable security

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

  // Helper method to get blacklist status (for debugging)
  getBlacklistInfo(req, res) {
    res.json({
      blacklistedTokensCount: tokenBlacklist.size,
      // Don't return actual tokens for security
    });
  }
}

module.exports = new AuthController();
