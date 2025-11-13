// models/DataType.js
const mongoose = require('mongoose');

const dataTypeSchema = new mongoose.Schema({
  keyName: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  dataType: {
    type: String,
    enum: ['float', 'message'],
    required: true
  },
  normalRange: {
    min: Number,
    max: Number
  },
  warningRange: {
    min: Number,
    max: Number
  },
  missingDataAllowance: {
    type: Number, // in seconds
    required: true
  },
  emailAlertRange: { // Added field
    min: Number,
    max: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('DataType', dataTypeSchema);
