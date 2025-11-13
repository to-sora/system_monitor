// backend/routes/dataRoutes.js
const express = require('express');
const router = express.Router();
const { uploadDataValue, uploadDataValues } = require('../controllers/dataController');
const authenticate = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes in this router
router.use(authenticate);

// POST /api/data - Upload a single DataValue
router.post('/', uploadDataValue);

// POST /api/data/bulk - Upload multiple DataValues
router.post('/bulk', uploadDataValues);

module.exports = router;
