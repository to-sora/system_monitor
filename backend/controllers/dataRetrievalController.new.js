// backend/controllers/dataRetrievalController.new.js
// Data retrieval controller using SQLite with FIXED median calculation

const DataValue = require('../db/models/DataValue');
const DataType = require('../db/models/DataType');
const Device = require('../db/models/Device');

/**
 * Helper function to parse time range
 */
const parseTimeRange = (range) => {
  const regex = /^(\d+)([hms])$/;
  const match = range.match(regex);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let multiplier;
  switch (unit) {
    case 'h':
      multiplier = 60 * 60 * 1000;
      break;
    case 'm':
      multiplier = 60 * 1000;
      break;
    case 's':
      multiplier = 1000;
      break;
    default:
      multiplier = null;
  }

  if (!multiplier) return null;
  return value * multiplier;
};

/**
 * Calculate median correctly (FIXED BUG)
 */
const calculateMedian = (values) => {
  if (values.length === 0) return null;

  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  // FIX: Handle both even and odd length arrays
  if (sorted.length % 2 === 0) {
    // Even: average of two middle values
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // Odd: middle value
    return sorted[mid];
  }
};

/**
 * Get Daily Data
 */
const getDailyData = async (req, res) => {
  try {
    const { device, keys, range } = req.query;

    // Validate parameters
    if (!device || !keys || !range) {
      return res.status(400).json({ message: 'device, keys, and range are required.' });
    }

    // Validate device exists
    const deviceExists = Device.exists(device);
    if (!deviceExists) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    // Validate keys
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const validKeys = DataType.findByKeyNames(keyArray);

    if (validKeys.length !== keyArray.length) {
      return res.status(400).json({ message: 'One or more keys are invalid.' });
    }

    // Parse time range
    const rangeMs = parseTimeRange(range);
    if (rangeMs === null) {
      return res.status(400).json({
        message: 'Invalid time range format. Use formats like 24h, 30m, 15s.'
      });
    }

    const since = new Date(Date.now() - rangeMs);

    // Fetch data for each key
    const data = {};

    for (const key of keyArray) {
      const keyType = validKeys.find(k => k.keyName === key).dataType;

      const values = DataValue.find({
        key,
        machine: device,
        since
      });

      data[key] = {
        type: keyType,
        values: values.map(d => ({
          timestamp: d.timestamp,
          value: keyType === 'float' ? parseFloat(d.value) : d.value
        }))
      };
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error('Get daily data error:', err);
    res.status(500).json({ message: 'Server error while fetching daily data.' });
  }
};

/**
 * Get Monthly Aggregated Data (WITH FIXED MEDIAN CALCULATION)
 */
const getMonthlyAggregatedData = async (req, res) => {
  try {
    const { device, key } = req.query;

    // Validate parameters
    if (!device || !key) {
      return res.status(400).json({ message: 'device and key are required.' });
    }

    // Validate device exists
    const deviceExists = Device.exists(device);
    if (!deviceExists) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    // Validate key exists
    const dataType = DataType.findByKeyName(key);
    if (!dataType) {
      return res.status(404).json({ message: 'Key not found.' });
    }

    // Only for float types
    if (dataType.dataType !== 'float') {
      return res.status(400).json({
        message: 'Aggregated data is only available for float-type keys.'
      });
    }

    // Define the time range (past month)
    // FIX: Use setMonth correctly to avoid date overflow issues
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

    // Fetch relevant data
    const dataValues = DataValue.find({
      key,
      machine: device,
      since
    });

    if (dataValues.length === 0) {
      return res.status(200).json({
        data: null,
        message: 'No data available for the selected key and device.'
      });
    }

    // Extract and parse values (filter out invalid values)
    const values = dataValues
      .map(d => parseFloat(d.value))
      .filter(v => !isNaN(v) && isFinite(v));

    if (values.length === 0) {
      return res.status(200).json({
        data: null,
        message: 'No valid numeric data available.'
      });
    }

    // Sort data by timestamp for AUC calculation
    const sortedData = dataValues
      .map(d => ({
        value: parseFloat(d.value),
        timestamp: d.timestamp.getTime()
      }))
      .filter(d => !isNaN(d.value) && isFinite(d.value))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Calculate statistics
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    // FIXED: Calculate median correctly
    const median = calculateMedian(values);

    // Calculate Area Under the Curve (AUC) using trapezoidal integration
    let auc = 0;
    for (let i = 1; i < sortedData.length; i++) {
      const deltaTime = (sortedData[i].timestamp - sortedData[i - 1].timestamp) / 1000; // Convert to seconds
      auc += ((sortedData[i].value + sortedData[i - 1].value) / 2) * deltaTime;
    }

    const aggregatedData = {
      min,
      max,
      median,
      mean,
      auc,
      dataPoints: values.length
    };

    res.status(200).json({ data: aggregatedData });
  } catch (err) {
    console.error('Get monthly data error:', err);
    res.status(500).json({ message: 'Server error while fetching aggregated data.' });
  }
};

module.exports = { getDailyData, getMonthlyAggregatedData };
