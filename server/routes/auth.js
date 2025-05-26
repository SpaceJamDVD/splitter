// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth'); // Only needed for protected routes

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout); // No auth required for logout

// Protected routes
router.get('/verify', requireAuth, authController.verifyToken);

module.exports = router;
