// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/verify', requireAuth, authController.verifyToken);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/preferences', requireAuth, authController.updatePreferences);
router.delete('/account', requireAuth, authController.deleteAccount);

module.exports = router;
