// models/DataValue.js
const mongoose = require('mongoose');

const dataValueSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  machine: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be Number or String
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Compound index for efficient querying
dataValueSchema.index({ key: 1, machine: 1, timestamp: -1 });

module.exports = mongoose.model('DataValue', dataValueSchema);
