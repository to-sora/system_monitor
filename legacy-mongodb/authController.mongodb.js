// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const yaml = require('yamljs');
const config = yaml.load('./config/config.yaml');


const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    const payload = {
      userId: user._id,
      username: user.username,
      isAdmin: user.isAdmin
    };

    const token = jwt.sign(payload, config.auth.jwtSecret, { expiresIn: config.auth.tokenExpiry });

    res.status(200).json({ token });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};


// controllers/authController.js

const authorizeAdmin = require('../middleware/authorizeAdminMiddleware');

// Register Controller
const register = async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;

    // Only admin can create new users
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required to create users.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
    if (isAdmin == true) {
      return res.status(400).json({ message: 'Cannot create admin user.' });
    }

    // Create new user
    const user = new User({ username, password, isAdmin });
    await user.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login };


