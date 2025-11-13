// backend/routes/dataRetrievalRoutes.new.js
const express = require('express');
const router = express.Router();
const { getDailyData, getMonthlyAggregatedData } = require('../controllers/dataRetrievalController');
const authenticate = require('../middleware/authMiddleware');
const { validateDailyDataQuery, validateMonthlyDataQuery } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// GET /api/data/daily - Get daily data
router.get('/daily', validateDailyDataQuery, getDailyData);

// GET /api/data/month - Get monthly aggregated data
router.get('/month', validateMonthlyDataQuery, getMonthlyAggregatedData);

module.exports = router;
