// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/authorizeAdminMiddleware');

// Public Route
router.post('/login', login);

// Protected Route (Admin Only)
router.post('/register', authenticate, authorizeAdmin, register);

module.exports = router;
