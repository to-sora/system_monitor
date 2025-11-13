// backend/app.js
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const yaml = require('yamljs');
const config = yaml.load('./config/config.yaml');

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// HTTP request logging using Morgan and Winston
// const morgan = require('morgan');



// Routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const keyRoutes = require('./routes/keyRoutes');
const dataRetrievalRoutes = require('./routes/dataRetrievalRoutes');
const dataRoutes = require('./routes/dataRoutes'); // Updated routes

// Apply morgan to specific routes only
app.use('/api/auth', morgan('combined', { stream: { write: message => console.info(message.trim()) } }), authRoutes);
app.use('/api/devices', morgan('combined', { stream: { write: message => console.info(message.trim()) } }), deviceRoutes);
app.use('/api/keys', morgan('combined', { stream: { write: message => console.info(message.trim()) } }), keyRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/data', dataRoutes); // For uploading DataValues
app.use('/api/data', dataRetrievalRoutes); // For fetching data

// Default Route
app.get('/', (req, res) => {
  res.send('System Monitor Backend is running.');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

module.exports = app;
