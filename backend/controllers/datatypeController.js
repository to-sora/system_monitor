// backend/controllers/datatypeController.js
const DataType = require('../models/DataType');

// Create DataType
const createDataType = async (req, res) => {
  try {
    // console.log('Received request to create DataType');
    // console.log('Request body:', req.body);
    const { keyName, dataType, normalRange, warningRange, missingDataAllowance, emailAlertRange } = req.body;

    // Validate required fields
    if (!keyName || !dataType || missingDataAllowance === undefined) {
      return res.status(400).json({ message: 'keyName, dataType, and missingDataAllowance are required.' });
    }

    // Validate dataType
    if (!['float', 'message'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid dataType. Must be "float" or "message".' });
    }

    // Check if keyName already exists
    const existingDataType = await DataType.findOne({ keyName });
    if (existingDataType) {
      return res.status(400).json({ message: 'DataType with this keyName already exists.' });
    }

    // Create new DataType
    const dataTypeObj = new DataType({
      keyName,
      dataType,
      normalRange,
      warningRange,
      missingDataAllowance,
      emailAlertRange // Optional field
    });

    await dataTypeObj.save();

    res.status(201).json({ message: 'DataType created successfully.', dataType: dataTypeObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating DataType.' });
  }
};

// Get All DataTypes
const getAllDataTypes = async (req, res) => {
  try {
    const dataTypes = await DataType.find().select('-__v'); // Exclude __v field
    // console.log('Fetched DataTypes:', dataTypes);
    res.status(200).json({ dataTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching DataTypes.' });
  }
};

// Get Single DataType by keyName
const getDataType = async (req, res) => {
  try {
    const { keyName } = req.params;
    const dataType = await DataType.findOne({ keyName }).select('-__v');

    if (!dataType) {
      return res.status(404).json({ message: 'DataType not found.' });
    }

    res.status(200).json({ dataType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching DataType.' });
  }
};

// Update DataType by keyName
const updateDataType = async (req, res) => {
  try {
    const { keyName } = req.params;
    const { dataType, normalRange, warningRange, missingDataAllowance, emailAlertRange } = req.body;

    // Validate dataType if provided
    if (dataType && !['float', 'message'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid dataType. Must be "float" or "message".' });
    }

    // Find and update the DataType
    const updatedDataType = await DataType.findOneAndUpdate(
      { keyName },
      { dataType, normalRange, warningRange, missingDataAllowance, emailAlertRange },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedDataType) {
      return res.status(404).json({ message: 'DataType not found.' });
    }

    res.status(200).json({ message: 'DataType updated successfully.', dataType: updatedDataType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating DataType.' });
  }
};

// Delete DataType by keyName
const deleteDataType = async (req, res) => {
  try {
    const { keyName } = req.params;

    // Find and delete the DataType
    const deletedDataType = await DataType.findOneAndDelete({ keyName });

    if (!deletedDataType) {
      return res.status(404).json({ message: 'DataType not found.' });
    }

    res.status(200).json({ message: 'DataType deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting DataType.' });
  }
};

module.exports = {
  createDataType,
  getAllDataTypes,
  getDataType,
  updateDataType,
  deleteDataType
};
