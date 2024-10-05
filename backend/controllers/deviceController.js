// backend/controllers/deviceController.js
const Device = require('../models/Device');

// Get All Devices
const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find().select('-__v'); // Exclude __v field
    res.status(200).json({ devices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching devices.' });
  }
};

// Create a New Device (Admin Only)
const createDevice = async (req, res) => {
  try {
    const { deviceId, name, description } = req.body;

    // Validate input
    if (!deviceId || !name) {
      return res.status(400).json({ message: 'deviceId and name are required.' });
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({ message: 'Device with this deviceId already exists.' });
    }

    // Create new device
    const device = new Device({ deviceId, name, description });
    await device.save();

    res.status(201).json({ message: 'Device created successfully.', device });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating device.' });
  }
};

// Update a Device (Admin Only)
const updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { name, description } = req.body;

    // Find and update the device
    const device = await Device.findOneAndUpdate(
      { deviceId },
      { name, description },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    res.status(200).json({ message: 'Device updated successfully.', device });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating device.' });
  }
};

// Delete a Device (Admin Only)
const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Find and delete the device
    const device = await Device.findOneAndDelete({ deviceId });

    if (!device) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    res.status(200).json({ message: 'Device deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting device.' });
  }
};

module.exports = { getAllDevices, createDevice, updateDevice, deleteDevice };
