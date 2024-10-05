// backend/routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  createDevice,
  updateDevice,
  deleteDevice
} = require('../controllers/deviceController');
const authenticate = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/authorizeAdminMiddleware');

// Apply authentication and admin authorization to all routes in this router
router.use(authenticate);
router.use(authorizeAdmin);

// GET /api/devices - Get all devices
router.get('/', getAllDevices);

// POST /api/devices - Create a new device
router.post('/', createDevice);

// PUT /api/devices/:deviceId - Update a device
router.put('/:deviceId', updateDevice);

// DELETE /api/devices/:deviceId - Delete a device
router.delete('/:deviceId', deleteDevice);

module.exports = router;
