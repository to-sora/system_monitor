// backend/routes/datatypeRoutes.new.js
const express = require('express');
const router = express.Router();
const {
  getAllDataTypes,
  getDataTypeByKeyName,
  createDataType,
  updateDataType,
  deleteDataType
} = require('../controllers/datatypeController');
const authenticate = require('../middleware/authMiddleware');
const { validateDataTypeCreation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

router.get('/', getAllDataTypes);
router.get('/:keyName', getDataTypeByKeyName);
router.post('/', validateDataTypeCreation, createDataType);
router.put('/:keyName', updateDataType);
router.delete('/:keyName', deleteDataType);

module.exports = router;
