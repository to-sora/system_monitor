// backend/routes/authRoutes.new.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController.new');
const authenticate = require('../middleware/authMiddleware.new');
const authorizeAdmin = require('../middleware/authorizeAdminMiddleware');
const { validateUserRegistration, validateLogin } = require('../middleware/validation');

// Public Route
router.post('/login', validateLogin, login);

// Protected Route (Admin Only)
router.post('/register', authenticate, authorizeAdmin, validateUserRegistration, register);

module.exports = router;
