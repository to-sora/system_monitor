// routes/datatypeRoutes.js
const express = require('express');
const router = express.Router();
const { createDataType, getAllDataTypes } = require('../controllers/datatypeController');
const authenticate = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes in this router
router.use(authenticate);

// Create DataType
router.post('/', createDataType);

// Get All DataTypes
router.get('/', getAllDataTypes);

module.exports = router;
