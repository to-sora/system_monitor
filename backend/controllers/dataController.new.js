// backend/controllers/dataController.new.js
// Data upload controller using SQLite

const DataValue = require('../db/models/DataValue');
const DataType = require('../db/models/DataType');
const Device = require('../db/models/Device');

/**
 * Upload a single data value
 */
const uploadDataValue = async (req, res) => {
  try {
    const { key, machine, value, timestamp } = req.body;

    // Validate input
    if (!key || !machine || value === undefined || !timestamp) {
      return res.status(400).json({
        message: 'key, machine, value, and timestamp are required.'
      });
    }

    // Validate key exists
    const dataType = DataType.findByKeyName(key);
    if (!dataType) {
      return res.status(404).json({ message: `Key "${key}" not found.` });
    }

    // Validate device exists
    const device = Device.findByDeviceId(machine);
    if (!device) {
      return res.status(404).json({ message: `Device "${machine}" not found.` });
    }

    // Validate timestamp
    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      return res.status(400).json({ message: 'Invalid timestamp format.' });
    }

    // Validate value type
    if (dataType.dataType === 'float') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return res.status(400).json({ message: 'Value must be a number for float type.' });
      }
    }

    // Create data value
    const dataValue = DataValue.create({
      key,
      machine,
      value,
      timestamp: timestampDate
    });

    res.status(201).json({
      message: 'Data value uploaded successfully.',
      dataValue: {
        id: dataValue.id,
        key: dataValue.key,
        machine: dataValue.machine,
        value: dataValue.value,
        timestamp: dataValue.timestamp
      }
    });
  } catch (error) {
    console.error('Upload data value error:', error);
    res.status(500).json({ message: 'Server error while uploading data value.' });
  }
};

/**
 * Upload multiple data values (bulk)
 */
const uploadDataValues = async (req, res) => {
  try {
    const dataValues = req.body;

    // Validate input is array
    if (!Array.isArray(dataValues) || dataValues.length === 0) {
      return res.status(400).json({ message: 'Request body must be a non-empty array.' });
    }

    // Validate each data value
    const errors = [];
    const validData = [];

    for (let i = 0; i < dataValues.length; i++) {
      const data = dataValues[i];
      const { key, machine, value, timestamp } = data;

      // Check required fields
      if (!key || !machine || value === undefined || !timestamp) {
        errors.push({
          index: i,
          message: 'Missing required fields: key, machine, value, timestamp'
        });
        continue;
      }

      // Validate timestamp
      const timestampDate = new Date(timestamp);
      if (isNaN(timestampDate.getTime())) {
        errors.push({ index: i, message: 'Invalid timestamp format' });
        continue;
      }

      // Note: For performance, we skip key and device validation in bulk
      // Uncomment below if strict validation is needed
      /*
      const dataType = DataType.findByKeyName(key);
      if (!dataType) {
        errors.push({ index: i, message: `Key "${key}" not found` });
        continue;
      }

      const device = Device.findByDeviceId(machine);
      if (!device) {
        errors.push({ index: i, message: `Device "${machine}" not found` });
        continue;
      }
      */

      validData.push({
        key,
        machine,
        value,
        timestamp: timestampDate
      });
    }

    // If all data is invalid
    if (validData.length === 0) {
      return res.status(400).json({
        message: 'No valid data to upload.',
        errors
      });
    }

    // Insert valid data in transaction
    const ids = DataValue.createMany(validData);

    res.status(201).json({
      message: 'Data values uploaded successfully.',
      uploaded: ids.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Server error while uploading data values.' });
  }
};

module.exports = {
  uploadDataValue,
  uploadDataValues
};
