// server/middleware/requireAuth.js
const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('./tokenStore'); // Import token blacklist

const requireAuth = (req, res, next) => {
  // Get access token from httpOnly cookie instead of Authorization header
  const token = req.cookies?.accessToken;

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN',
    });
  }

  // Check if token is blacklisted (for future use)
  if (tokenBlacklist.has(token)) {
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

    next(); // Continue to the protected route
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: err.expiredAt,
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid access token',
        code: 'INVALID_TOKEN',
      });
    }

    if (err.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Token not active yet',
        code: 'TOKEN_NOT_ACTIVE',
      });
    }

    // Generic error for any other JWT issues
    return res.status(401).json({
      error: 'Token verification failed',
      code: 'VERIFICATION_FAILED',
    });
  }
};

module.exports = requireAuth;
