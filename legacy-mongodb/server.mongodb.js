require('dotenv').config(); // Load environment variables
const fs = require('fs');
const https = require('https');
const app = require('./app');
const mongoose = require('mongoose');
const yaml = require('yamljs');
const config = yaml.load('./config/config.yaml');

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// SSL options
const sslOptions = {
  key: fs.readFileSync('./server.key'), // Replace with the actual path to your key file
  cert: fs.readFileSync('./server.cert') // Replace with the actual path to your cert file
};

// Start the HTTPS server
const PORT = process.env.PORT || config.server.port || 3000;
const HOST = process.env.HOST || config.server.host || '0.0.0.0';

https.createServer(sslOptions, app).listen(PORT, HOST, () => {
  console.log(`HTTPS Server is running on https://${HOST}:${PORT}`);
});
