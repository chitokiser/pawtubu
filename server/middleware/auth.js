const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // If no token, proceed but without user info
  if (!token) {
    return next();
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecrettoken');
    req.user = decoded.user;
    next();
  } catch (err) {
    // If token is invalid, clear it and proceed without user info
    // Or you might want to return 401 here if strict auth is needed for all routes
    console.error('Invalid Token');
    next(); // Proceed without user info if token is invalid
  }
};
