// backend/routes/keyRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDataType,
  getAllDataTypes,
  getDataType,
  updateDataType,
  deleteDataType
} = require('../controllers/datatypeController');
const authenticate = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/authorizeAdminMiddleware');

// Apply authentication and admin authorization to all routes in this router
router.use(authenticate);
router.use(authorizeAdmin);

// GET /api/keys - Get all keys
router.get('/', getAllDataTypes);

// POST /api/keys - Create a new key
router.post('/', createDataType);

// GET /api/keys/:keyName - Get a specific key
router.get('/:keyName', getDataType);

// PUT /api/keys/:keyName - Update a key
router.put('/:keyName', updateDataType);

// DELETE /api/keys/:keyName - Delete a key
router.delete('/:keyName', deleteDataType);

module.exports = router;
