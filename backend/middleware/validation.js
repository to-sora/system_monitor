// backend/middleware/validation.js
// Input validation middleware using express-validator

const { body, query, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('isAdmin')
    .optional()
    .isBoolean()
    .withMessage('isAdmin must be a boolean'),
  handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Validation rules for device creation
 */
const validateDeviceCreation = [
  body('deviceId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Device ID can only contain letters, numbers, underscores, and hyphens'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  handleValidationErrors
];

/**
 * Validation rules for device update
 */
const validateDeviceUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  handleValidationErrors
];

/**
 * Validation rules for data type creation
 */
const validateDataTypeCreation = [
  body('keyName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Key name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Key name can only contain letters, numbers, underscores, and hyphens'),
  body('dataType')
    .isIn(['float', 'message'])
    .withMessage('Data type must be either "float" or "message"'),
  body('normalRange')
    .optional()
    .isObject()
    .withMessage('Normal range must be an object'),
  body('normalRange.min')
    .optional()
    .isFloat()
    .withMessage('Normal range min must be a number'),
  body('normalRange.max')
    .optional()
    .isFloat()
    .withMessage('Normal range max must be a number'),
  body('warningRange')
    .optional()
    .isObject()
    .withMessage('Warning range must be an object'),
  body('missingDataAllowance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Missing data allowance must be a positive number'),
  handleValidationErrors
];

/**
 * Validation rules for single data value upload
 */
const validateDataValue = [
  body('key')
    .trim()
    .notEmpty()
    .withMessage('Key is required'),
  body('machine')
    .trim()
    .notEmpty()
    .withMessage('Machine is required'),
  body('value')
    .notEmpty()
    .withMessage('Value is required'),
  body('timestamp')
    .notEmpty()
    .isISO8601()
    .withMessage('Timestamp must be in ISO 8601 format'),
  handleValidationErrors
];

/**
 * Validation rules for bulk data upload
 */
const validateBulkDataValues = [
  body()
    .isArray({ min: 1, max: 1000 })
    .withMessage('Request body must be an array with 1-1000 items'),
  body('*.key')
    .trim()
    .notEmpty()
    .withMessage('Each item must have a key'),
  body('*.machine')
    .trim()
    .notEmpty()
    .withMessage('Each item must have a machine'),
  body('*.value')
    .notEmpty()
    .withMessage('Each item must have a value'),
  body('*.timestamp')
    .notEmpty()
    .withMessage('Each item must have a timestamp'),
  handleValidationErrors
];

/**
 * Validation rules for daily data query
 */
const validateDailyDataQuery = [
  query('device')
    .trim()
    .notEmpty()
    .withMessage('Device is required'),
  query('keys')
    .notEmpty()
    .withMessage('Keys are required'),
  query('range')
    .matches(/^\d+[hms]$/)
    .withMessage('Range must be in format like 24h, 30m, or 15s'),
  handleValidationErrors
];

/**
 * Validation rules for monthly aggregated data query
 */
const validateMonthlyDataQuery = [
  query('device')
    .trim()
    .notEmpty()
    .withMessage('Device is required'),
  query('key')
    .trim()
    .notEmpty()
    .withMessage('Key is required'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateLogin,
  validateDeviceCreation,
  validateDeviceUpdate,
  validateDataTypeCreation,
  validateDataValue,
  validateBulkDataValues,
  validateDailyDataQuery,
  validateMonthlyDataQuery
};
