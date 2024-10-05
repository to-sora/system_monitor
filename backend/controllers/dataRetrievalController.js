// backend/controllers/dataRetrievalController.js
const DataValue = require('../models/DataValue');
const DataType = require('../models/DataType');
const Device = require('../models/Device');
const mongoose = require('mongoose');

// Helper function to parse time range
const parseTimeRange = (range) => {
  const regex = /^(\d+)([hms])$/; // e.g., 24h, 30m, 15s
  const match = range.match(regex);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let multiplier;
  switch (unit) {
    case 'h':
      multiplier = 60 * 60 * 1000; // hours to milliseconds
      break;
    case 'm':
      multiplier = 60 * 1000; // minutes to milliseconds
      break;
    case 's':
      multiplier = 1000; // seconds to milliseconds
      break;
    default:
      multiplier = null;
  }

  if (!multiplier) return null;

  return value * multiplier;
};

// Get Daily Data
const getDailyData = async (req, res) => {
  try {
    const { device, keys, range } = req.query;

    // Validate parameters
    if (!device || !keys || !range) {
      return res.status(400).json({ message: 'device, keys, and range are required.' });
    }

    // Validate device exists
    const deviceExists = await Device.findOne({ deviceId: device });
    if (!deviceExists) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    // Validate keys
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const validKeys = await DataType.find({ keyName: { $in: keyArray } });
    if (validKeys.length !== keyArray.length) {
      return res.status(400).json({ message: 'One or more keys are invalid.' });
    }

    // Parse time range
    const rangeMs = parseTimeRange(range);
    if (rangeMs === null) {
      return res.status(400).json({ message: 'Invalid time range format. Use formats like 24h, 30m, 15s.' });
    }

    const since = new Date(Date.now() - rangeMs);

    // Fetch data for each key
    const data = {};

    for (const key of keyArray) {
      const keyType = validKeys.find(k => k.keyName === key).dataType;

      if (keyType === 'float') {
        const floatData = await DataValue.find({
          key,
          machine: device,
          timestamp: { $gte: since }
        }).sort({ timestamp: 1 });

        data[key] = {
          type: 'float',
          values: floatData.map(d => ({
            timestamp: d.timestamp,
            value: d.value
          }))
        };
      } else if (keyType === 'message') {
        const messageData = await DataValue.find({
          key,
          machine: device,
          timestamp: { $gte: since }
        }).sort({ timestamp: 1 });

        data[key] = {
          type: 'message',
          values: messageData.map(d => ({
            timestamp: d.timestamp,
            value: d.value
          }))
        };
      }
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching daily data.' });
  }
};

// Get Monthly Aggregated Data
const getMonthlyAggregatedData = async (req, res) => {
  try {
    const { device, key } = req.query;

    // Validate parameters
    if (!device || !key) {
      return res.status(400).json({ message: 'device and key are required.' });
    }

    // Validate device exists
    const deviceExists = await Device.findOne({ deviceId: device });
    if (!deviceExists) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    // Validate key exists
    const dataType = await DataType.findOne({ keyName: key });
    if (!dataType) {
      return res.status(404).json({ message: 'Key not found.' });
    }

    // Define the time range (past month)
    const since = new Date();
    since.setMonth(since.getMonth() - 1);

    // Fetch relevant data
    const dataValues = await DataValue.find({
      key,
      machine: device,
      timestamp: { $gte: since }
    });

    if (dataType.dataType !== 'float') {
      return res.status(400).json({ message: 'Aggregated data is only available for float-type keys.' });
    }

    if (dataValues.length === 0) {
      return res.status(200).json({ data: null, message: 'No data available for the selected key and device.' });
    }

    // Extract values
    //console.log(dataValues);
    const sortedData = dataValues.sort((a, b) => a.timestamp - b.timestamp);

    // Step 2: Extract values and convert timestamps
    const values = sortedData.map((d) => parseFloat(d.value));
    const timestamps = sortedData.map((d) => d.timestamp.getTime()); // in milliseconds

    
    // Step 2: Calculate min, max, mean, and median
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
    
    // Step 3: Calculate Area Under the Curve (AUC) using trapezoidal integration
    let auc = 0;
    for (let i = 1; i < values.length; i++) {
      const deltaTime = (timestamps[i] - timestamps[i - 1]) / 1000; // Convert to seconds
      //console.log('deltaTime:', deltaTime);
      //console.log('values[i]:', values[i]);
      //console.log('values[i - 1]:', values[i - 1]);
      auc += ((values[i] + values[i - 1]) / 2) * deltaTime;
    }
    
    // Output the results
    ////console.log('Min:', min);
    //console.log('Max:', max);
    //console.log('Mean:', mean);
    //console.log('Median:', median);
    //console.log('Area Under the Curve (AUC):', auc, 'value-seconds');

    const aggregatedData = {
      min,
      max,
      median,
      mean,
      auc
    };

    res.status(200).json({ data: aggregatedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching aggregated data.' });
  }
};

module.exports = { getDailyData, getMonthlyAggregatedData };
