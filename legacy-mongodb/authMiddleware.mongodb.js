// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const yaml = require('yamljs');
const config = yaml.load('./config/config.yaml');

const authenticate = (req, res, next) => {
  // console.log('Authenticating user...');
  // console.log('Request headers:', req.headers);
  // console.log('Request body:', req.body); 
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // console.log('Token:', token);
    // console.log('JWT Secret:', config.auth.jwtSecret);

    jwt.verify(token, config.auth.jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token.' });
      }
      req.user = user; // Attach user information to the request
      // console.log('User authenticated:', user);
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization header missing.' });
  }
};

module.exports = authenticate;
