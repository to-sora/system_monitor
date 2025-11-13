// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { listUsers, updateUserPassword, deleteUser } = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/authorizeAdminMiddleware');

// Apply authentication middleware to all routes in this router
router.use(authenticate);

// Apply admin authorization middleware
router.use(authorizeAdmin);

// List all users
router.get('/', listUsers);

// Update user password
router.put('/password', updateUserPassword);

// Delete a user
router.delete('/', deleteUser);

module.exports = router;
