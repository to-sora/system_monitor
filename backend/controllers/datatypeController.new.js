// backend/controllers/datatypeController.new.js
// DataType (Keys) controller using SQLite

const DataType = require('../db/models/DataType');

/**
 * Get all data types
 */
const getAllDataTypes = async (req, res) => {
  try {
    const dataTypes = DataType.findAll();
    res.status(200).json({ dataTypes });
  } catch (error) {
    console.error('Get data types error:', error);
    res.status(500).json({ message: 'Server error while fetching data types.' });
  }
};

/**
 * Get data type by key name
 */
const getDataTypeByKeyName = async (req, res) => {
  try {
    const { keyName } = req.params;

    const dataType = DataType.findByKeyName(keyName);
    if (!dataType) {
      return res.status(404).json({ message: 'Data type not found.' });
    }

    res.status(200).json({ dataType });
  } catch (error) {
    console.error('Get data type error:', error);
    res.status(500).json({ message: 'Server error while fetching data type.' });
  }
};

/**
 * Create a new data type
 */
const createDataType = async (req, res) => {
  try {
    const {
      keyName,
      dataType,
      normalRange,
      warningRange,
      missingDataAllowance,
      emailAlertRange
    } = req.body;

    // Validate input
    if (!keyName || !dataType) {
      return res.status(400).json({ message: 'keyName and dataType are required.' });
    }

    if (!['float', 'message'].includes(dataType)) {
      return res.status(400).json({ message: 'dataType must be "float" or "message".' });
    }

    const newDataType = DataType.create({
      keyName,
      dataType,
      normalRange,
      warningRange,
      missingDataAllowance,
      emailAlertRange
    });

    console.log(`Data type created: ${keyName} by ${req.user.username}`);

    res.status(201).json({
      message: 'Data type created successfully.',
      dataType: newDataType
    });
  } catch (error) {
    if (error.message === 'Key name already exists') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Create data type error:', error);
    res.status(500).json({ message: 'Server error while creating data type.' });
  }
};

/**
 * Update data type
 */
const updateDataType = async (req, res) => {
  try {
    const { keyName } = req.params;
    const updates = req.body;

    const dataType = DataType.findByKeyName(keyName);
    if (!dataType) {
      return res.status(404).json({ message: 'Data type not found.' });
    }

    const updatedDataType = DataType.update(keyName, updates);

    console.log(`Data type updated: ${keyName} by ${req.user.username}`);

    res.status(200).json({
      message: 'Data type updated successfully.',
      dataType: updatedDataType
    });
  } catch (error) {
    console.error('Update data type error:', error);
    res.status(500).json({ message: 'Server error while updating data type.' });
  }
};

/**
 * Delete data type
 */
const deleteDataType = async (req, res) => {
  try {
    const { keyName } = req.params;

    const dataType = DataType.findByKeyName(keyName);
    if (!dataType) {
      return res.status(404).json({ message: 'Data type not found.' });
    }

    DataType.delete(keyName);

    console.log(`Data type deleted: ${keyName} by ${req.user.username}`);

    res.status(200).json({ message: 'Data type deleted successfully.' });
  } catch (error) {
    console.error('Delete data type error:', error);
    res.status(500).json({ message: 'Server error while deleting data type.' });
  }
};

module.exports = {
  getAllDataTypes,
  getDataTypeByKeyName,
  createDataType,
  updateDataType,
  deleteDataType
};
