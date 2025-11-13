// backend/controllers/authController.new.js
// Authentication controller using SQLite

const jwt = require('jsonwebtoken');
const User = require('../db/models/User');

/**
 * Register a new user (Admin only)
 */
const register = async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Password complexity check
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      isAdmin: isAdmin || false
    });

    // Audit log
    console.log(`User created: ${username} by admin ${req.user.username}`);

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Check for too many failed attempts
    const failedAttempts = User.getFailedLoginAttempts(username, 15);
    if (failedAttempts >= 5) {
      User.recordLoginAttempt(username, ipAddress, false);
      return res.status(429).json({
        message: 'Too many failed login attempts. Please try again in 15 minutes.'
      });
    }

    // Find user
    const user = User.findByUsername(username);
    if (!user) {
      User.recordLoginAttempt(username, ipAddress, false);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Verify password
    const isMatch = await User.comparePassword(password, user.password_hash);
    if (!isMatch) {
      User.recordLoginAttempt(username, ipAddress, false);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Record successful login
    User.recordLoginAttempt(username, ipAddress, true);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const tokenExpiry = process.env.JWT_EXPIRY || '7d';

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      },
      jwtSecret,
      { expiresIn: tokenExpiry }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = { register, login };
