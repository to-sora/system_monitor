// utils/logger.js
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const yaml = require('yamljs');

const config = yaml.load('./config/config.yaml');
const logStream = fs.createWriteStream(path.join(__dirname, '../logs/app.log'), { flags: 'a' });


const logger = morgan(config.logging.level || 'combined', { stream: logStream });

module.exports = logger;
