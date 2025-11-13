// backend/routes/healthRoutes.js
// Health check and monitoring endpoints

const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs');
const { getStats, getDb } = require('../db/database');

/**
 * Basic health check
 * GET /health
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Detailed health check
 * GET /health/detailed
 */
router.get('/detailed', (req, res) => {
  try {
    // Get database stats
    const dbStats = getStats();

    // Get system info
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime()
    };

    // Get process info
    const processInfo = {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    // Check disk space (if on Linux)
    let diskSpace = null;
    try {
      if (process.env.DB_PATH) {
        const stats = fs.statSync(process.env.DB_PATH);
        diskSpace = {
          dbSize: stats.size,
          dbSizeHuman: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
        };
      }
    } catch (err) {
      // Ignore disk space errors
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        ...dbStats,
        dbSizeHuman: dbStats.dbSize ? `${(dbStats.dbSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'
      },
      system: systemInfo,
      process: processInfo,
      disk: diskSpace
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Database connectivity check
 * GET /health/db
 */
router.get('/db', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as test').get();

    if (result.test === 1) {
      res.status(200).json({
        status: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Database test query failed');
    }
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(503).json({
      status: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
