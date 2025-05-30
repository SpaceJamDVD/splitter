// server/routes/auth.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  verifyToken,
  updateProfile,
  updatePreferences,
  logout,
  deleteAccount,
  getBlacklistInfo,
} = require('../controllers/authController'); // Destructured import

const requireAuth = require('../middleware/requireAuth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/verify', requireAuth, verifyToken);
router.put('/profile', requireAuth, updateProfile);
router.put('/preferences', requireAuth, updatePreferences);
router.delete('/account', requireAuth, deleteAccount);

// Debug routes
router.get('/debug/blacklist', getBlacklistInfo);

module.exports = router;
