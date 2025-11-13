// backend/routes/dataRoutes.new.js
const express = require('express');
const router = express.Router();
const { uploadDataValue, uploadDataValues } = require('../controllers/dataController');
const authenticate = require('../middleware/authMiddleware');
const { validateDataValue, validateBulkDataValues } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// POST /api/data - Upload a single DataValue
router.post('/', validateDataValue, uploadDataValue);

// POST /api/data/bulk - Upload multiple DataValues
router.post('/bulk', validateBulkDataValues, uploadDataValues);

module.exports = router;
