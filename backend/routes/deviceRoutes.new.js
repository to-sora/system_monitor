// backend/routes/deviceRoutes.new.js
const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
} = require('../controllers/deviceController.new');
const authenticate = require('../middleware/authMiddleware.new');
const { validateDeviceCreation, validateDeviceUpdate } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

router.get('/', getAllDevices);
router.get('/:deviceId', getDeviceById);
router.post('/', validateDeviceCreation, createDevice);
router.put('/:deviceId', validateDeviceUpdate, updateDevice);
router.delete('/:deviceId', deleteDevice);

module.exports = router;
