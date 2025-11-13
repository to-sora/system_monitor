// backend/middleware/authMiddleware.new.js
// JWT authentication middleware for SQLite

const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }
      req.user = user; // Attach user information to the request
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization header missing or invalid.' });
  }
};

module.exports = authenticate;
