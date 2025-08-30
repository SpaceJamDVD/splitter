// server/controllers/authController.js
const User = require('../models/User');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('../middleware/tokenStore');
const isProduction = process.env.NODE_ENV === 'production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true, // Cannot be accessed by JavaScript
  secure: isProduction, // HTTPS only in production
  sameSite: isProduction ? 'none' : 'lax', // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
  path: '/api/auth/refresh', // Only sent to refresh endpoint
};

// Helper function to generate both access and refresh tokens
const generateTokens = (payload) => {
  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// Register new user
const register = async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;

  try {
    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    // Create user
    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: password,
      profile: {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
      },
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
    const { accessToken, refreshToken } = generateTokens(payload);

    // Set httpOnly cookies instead of returning tokens
    res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Return user data only (NO TOKENS in response body)
    res.status(201).json({
      message: 'User created successfully',
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

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const fieldName = field === 'email' ? 'Email' : 'Username';
      return res.status(400).json({
        error: `${fieldName} already exists`,
      });
    }

    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username/email and password are required',
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: username.trim().toLowerCase() },
      ],
      isActive: true,
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isLocked) {
      return res.status(423).json({
        error:
          'Account temporarily locked due to too many failed attempts. Try again later.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
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
    const userGroups = await Group.find({ members: user._id });
    const primaryGroupId = userGroups.length > 0 ? userGroups[0]._id : null;

    // Create JWT payload
    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      groupId: primaryGroupId,
      isEmailVerified: user.isEmailVerified,
      plan: user.subscription.plan,
    };

    // Generate both tokens
    const { accessToken, refreshToken } = generateTokens(payload);

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Return user data only (NO TOKENS in response body)
    res.json({
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
};

// Refresh token endpoint
const refreshToken = async (req, res) => {
  try {
    // Get refresh token from httpOnly cookie
    const { refreshToken } = req.cookies;
    //console.log('[AUTH]   cookie refreshToken:', !!refreshToken);
    //console.log('[AUTH] /auth/refresh hit');

    if (!refreshToken) {
      //console.log('[AUTH]   no refresh cookie');
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Get fresh user data
    const userGroups = await Group.find({ members: user._id });
    const primaryGroupId = userGroups.length > 0 ? userGroups[0]._id : null;

    // Create new payload
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
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, COOKIE_OPTIONS);

    //console.log('[AUTH]   refresh OK, new access for', payload.userId);

    // Return fresh user data (NO TOKEN in response body)
    res.json({
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
};

// Verify token (reads from cookies)
const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    // Get user's groups
    const userGroups = await Group.find({ members: user._id });
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
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, timezone, currency } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile fields
    if (firstName !== undefined) user.profile.firstName = firstName.trim();
    if (lastName !== undefined) user.profile.lastName = lastName.trim();
    if (username !== undefined) user.username = username.trim();
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
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Merge preferences
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
};

// Logout (clear httpOnly cookies)
const logout = async (req, res) => {
  try {
    // Get refresh token from cookie to blacklist it
    const { refreshToken } = req.cookies;

    // Add refresh token to blacklist
    if (refreshToken) {
      tokenBlacklist.add(refreshToken);
    }

    // Clear both cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({
      message: 'Logged out successfully',
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Soft delete user account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete
    await user.softDelete();

    // Clear cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({
      message: 'Account deactivated successfully',
    });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Account deletion failed' });
  }
};

// Helper function to get blacklist status (for debugging)
const getBlacklistInfo = (req, res) => {
  res.json({
    blacklistedTokensCount: tokenBlacklist.size,
  });
};

// Export all functions
module.exports = {
  register,
  login,
  refreshToken,
  verifyToken,
  updateProfile,
  updatePreferences,
  logout,
  deleteAccount,
  getBlacklistInfo,
  generateTokens,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
};
