// controllers/dataController.js
const DataValue = require('../models/DataValue');
const DataType = require('../models/DataType');
const Device = require('../models/Device');

// Helper function to validate DataType
const validateDataType = async (key, value, dataType) => {
  if (dataType.dataType === 'float') {
    if (typeof value !== 'number') {
      throw new Error(`Value for key '${key}' must be a number.`);
    }
  } else if (dataType.dataType === 'message') {
    if (typeof value !== 'string') {
      throw new Error(`Value for key '${key}' must be a string.`);
    }
    if (value.length > 200) {
      throw new Error(`Message length for key '${key}' exceeds 200 characters.`);
    }
    // Additional sanitization can be added here to prevent NoSQL injection
  } else {
    throw new Error(`Unsupported dataType '${dataType.dataType}' for key '${key}'.`);
  }

  return dataType;
};

// controllers/dataController.js

// Upload DataValue
const uploadDataValue  = async (req, res) => {
  // console.log('Received request to upload data');
  // console.log('Request body:', req.body);
try {
  const { key, machine, value, timestamp } = req.body;

  if (!key || !machine || value === undefined) {
    return res.status(400).json({ message: 'Key, machine, and value are required.' });
  }

  // Retrieve the dataType for validation and potential conversion
  let target_dataType = await DataType.findOne({ keyName: key });

  if (!target_dataType) {
    throw new Error(`DataType with keyName '${key}' does not exist.`);
  }

  // Perform the conversion based on the dataType
  let convertedValue = value;
  if (target_dataType.dataType === 'float') {
    if (typeof value !== 'number') {
      // Try to convert the value to a number
      convertedValue = parseFloat(value);
      if (isNaN(convertedValue)) {
        throw new Error(`Value for key '${key}' must be convertible to a number.`);
      }
    }
  } else if (target_dataType.dataType === 'message') {
    if (typeof value !== 'string') {
      // Convert value to string
      convertedValue = String(value);
    }
    if (convertedValue.length > 200) {
      throw new Error(`Message length for key '${key}' exceeds 200 characters.`);
    }
  } else {
    throw new Error(`Unsupported dataType '${target_dataType.dataType}' for key '${key}'.`);
  }

  // Validate DataType and value
  await validateDataType(key, convertedValue, target_dataType);

  // Create new DataValue
  const dataValue = new DataValue({
    key,
    machine,
    value: convertedValue,
    timestamp: timestamp ? new Date(timestamp) : undefined
  });

  await dataValue.save();

  res.status(201).json({ message: 'Data uploaded successfully.' });
} catch (err) {
  console.error(err.message);
  res.status(400).json({ message: err.message });
}
};
// controllers/dataController.js

// Upload multiple DataValues
const uploadDataValues = async (req, res) => {
  // console.log('Received request to upload data in bulk');
  // console.log('Request body:', req.body);
  try {
      const dataValues = req.body; // Expecting an array of data points

      // Validate that the request body is an array
      if (!Array.isArray(dataValues)) {
          return res.status(400).json({ message: 'Expected an array of data values.' });
      }

      // Validate that the array is not empty
      if (dataValues.length === 0) {
          return res.status(400).json({ message: 'No data values provided.' });
      }

      // Extract unique keys from the data values
      const uniqueKeys = [...new Set(dataValues.map(data => data.key))];

      // Fetch all required DataTypes in a single query
      const dataTypes = await DataType.find({ keyName: { $in: uniqueKeys } });

      // Create a map for quick DataType lookup
      const dataTypeMap = {};
      dataTypes.forEach(dt => {
          dataTypeMap[dt.keyName] = dt;
      });

      // Identify any missing DataTypes
      const missingKeys = uniqueKeys.filter(key => !dataTypeMap[key]);
      if (missingKeys.length > 0) {
          throw new Error(`DataType(s) for keyName(s) '${missingKeys.join(', ')}' do not exist.`);
      }

      const processedDataValues = [];

      // Process each data point
      for (const data of dataValues) {
          const { key, machine, value, timestamp } = data;

          // Validate required fields
          if (!key || !machine || value === undefined) {
              return res.status(400).json({ message: 'Each data value must include key, machine, and value.' });
          }

          const target_dataType = dataTypeMap[key];

          // Convert value based on DataType
          let convertedValue = value;

          if (target_dataType.dataType === 'float') {
              if (typeof value !== 'number') {
                  convertedValue = parseFloat(value);
                  if (isNaN(convertedValue)) {
                      throw new Error(`Value for key '${key}' must be convertible to a number.`);
                  }
              }
          } else if (target_dataType.dataType === 'message') {
              if (typeof value !== 'string') {
                  convertedValue = String(value);
              }
              if (convertedValue.length > 200) {
                  throw new Error(`Message length for key '${key}' exceeds 200 characters.`);
              }
          } else {
              throw new Error(`Unsupported dataType '${target_dataType.dataType}' for key '${key}'.`);
          }

          // Validate DataType and value
          await validateDataType(key, convertedValue, target_dataType);

          // Prepare the DataValue object
          const dataValue = {
              key,
              machine,
              value: convertedValue,
              timestamp: timestamp ? new Date(timestamp) : undefined
          };

          processedDataValues.push(dataValue);
      }

      // Insert all processed DataValues into the database
      await DataValue.insertMany(processedDataValues);

      res.status(201).json({ message: 'Data uploaded successfully.', count: processedDataValues.length });
  } catch (err) {
      console.error(err.message);
      res.status(400).json({ message: err.message });
  }
};

module.exports = { 
  uploadDataValue,
  uploadDataValues
};
