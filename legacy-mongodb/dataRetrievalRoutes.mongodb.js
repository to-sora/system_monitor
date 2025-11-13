// backend/routes/dataRetrievalRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDailyData,
  getMonthlyAggregatedData
} = require('../controllers/dataRetrievalController');
const authenticate = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes in this router
router.use(authenticate);

// GET /api/data/daily - Get daily data
router.get('/daily', getDailyData);

// GET /api/data/month - Get monthly aggregated data
router.get('/month', getMonthlyAggregatedData);

module.exports = router;
