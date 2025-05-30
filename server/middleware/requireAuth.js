// server/middleware/requireAuth.js
const jwt = require('jsonwebtoken');

// Access to the same blacklist from authController
const tokenBlacklist = new Set();

const requireAuth = (req, res, next) => {
  // Get access token from httpOnly cookie instead of Authorization header
  const token = req.cookies?.accessToken;

  // Check if token exists
  if (!token) {
    console.log('❌ Auth failed: No access token cookie found');
    return res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN',
    });
  }

  // Check if token is blacklisted (for future use)
  if (tokenBlacklist.has(token)) {
    console.log('❌ Auth failed: Token is blacklisted');
    return res.status(401).json({
      error: 'Token has been revoked',
      code: 'TOKEN_REVOKED',
    });
  }

  try {
    // Verify token using ACCESS token secret
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Validate token type - must be an access token
    if (decoded.type !== 'access') {
      console.log('❌ Auth failed: Invalid token type:', decoded.type);
      return res.status(401).json({
        error: 'Invalid token type',
        code: 'WRONG_TOKEN_TYPE',
      });
    }

    // Add decoded user info to request object
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      groupId: decoded.groupId,
      isEmailVerified: decoded.isEmailVerified,
      plan: decoded.plan,
      tokenType: decoded.type,
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp,
    };

    // Log successful auth (remove in production)
    console.log('✅ Auth successful via cookie:', {
      userId: decoded.userId,
      username: decoded.username,
      tokenType: decoded.type,
      expiresIn:
        Math.round((decoded.exp * 1000 - Date.now()) / 1000 / 60) + ' minutes',
    });

    next(); // Continue to the protected route
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);

    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      console.log('🕐 Access token expired - client should refresh');
      return res.status(401).json({
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: err.expiredAt,
      });
    }

    if (err.name === 'JsonWebTokenError') {
      console.log('🔐 Invalid token format or signature');
      return res.status(401).json({
        error: 'Invalid access token',
        code: 'INVALID_TOKEN',
      });
    }

    if (err.name === 'NotBeforeError') {
      console.log('⏰ Token used before valid time');
      return res.status(401).json({
        error: 'Token not active yet',
        code: 'TOKEN_NOT_ACTIVE',
      });
    }

    // Generic error for any other JWT issues
    console.error('🚨 Unexpected token error:', err);
    return res.status(401).json({
      error: 'Token verification failed',
      code: 'VERIFICATION_FAILED',
    });
  }
};

module.exports = requireAuth;
