// backend/controllers/deviceController.new.js
// Device controller using SQLite

const Device = require('../db/models/Device');

/**
 * Get all devices
 */
const getAllDevices = async (req, res) => {
  try {
    const devices = Device.findAll();
    res.status(200).json({ devices });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Server error while fetching devices.' });
  }
};

/**
 * Get device by ID
 */
const getDeviceById = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = Device.findByDeviceId(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    res.status(200).json({ device });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ message: 'Server error while fetching device.' });
  }
};

/**
 * Create a new device
 */
const createDevice = async (req, res) => {
  try {
    const { deviceId, name, description } = req.body;

    // Validate input
    if (!deviceId || !name) {
      return res.status(400).json({ message: 'deviceId and name are required.' });
    }

    const device = Device.create({ deviceId, name, description });

    console.log(`Device created: ${deviceId} by ${req.user.username}`);

    res.status(201).json({
      message: 'Device created successfully.',
      device
    });
  } catch (error) {
    if (error.message === 'Device ID already exists') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Create device error:', error);
    res.status(500).json({ message: 'Server error while creating device.' });
  }
};

/**
 * Update device
 */
const updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const updates = req.body;

    const device = Device.findByDeviceId(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    const updatedDevice = Device.update(deviceId, updates);

    console.log(`Device updated: ${deviceId} by ${req.user.username}`);

    res.status(200).json({
      message: 'Device updated successfully.',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ message: 'Server error while updating device.' });
  }
};

/**
 * Delete device
 */
const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = Device.findByDeviceId(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    Device.delete(deviceId);

    console.log(`Device deleted: ${deviceId} by ${req.user.username}`);

    res.status(200).json({ message: 'Device deleted successfully.' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ message: 'Server error while deleting device.' });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
};
