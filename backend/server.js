// backend/server.new.js
// Production-ready HTTPS server with graceful shutdown

require('dotenv').config(); // Load environment variables

const fs = require('fs');
const https = require('https');
const app = require('./app');
const db = require('./db/database');
const { scheduleBackups } = require('./utils/backup');

// Connect to database
try {
  db.connect();
  console.log('✓ Database connected successfully');
} catch (error) {
  console.error('✗ Database connection failed:', error);
  process.exit(1);
}

// Schedule automatic backups if enabled
if (process.env.ENABLE_AUTO_BACKUP !== 'false') {
  scheduleBackups();
}

// SSL options
const sslKeyPath = process.env.SSL_KEY_PATH || './server.key';
const sslCertPath = process.env.SSL_CERT_PATH || './server.cert';

let server;

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  // HTTPS server
  const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };

  server = https.createServer(sslOptions, app);
  console.log('✓ HTTPS enabled');
} else {
  // HTTP server (fallback for development)
  const http = require('http');
  server = http.createServer(app);
  console.warn('⚠ Warning: Running in HTTP mode. SSL certificates not found.');
  console.warn('  Please generate SSL certificates for production use.');
}

// Server configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
server.listen(PORT, HOST, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
  console.log(`✓ Server running on ${protocol}://${HOST}:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Process ID: ${process.pid}`);
});

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('✓ HTTP server closed');

    // Close database connection
    try {
      db.close();
      console.log('✓ Database connection closed');
    } catch (error) {
      console.error('✗ Error closing database:', error);
    }

    console.log('✓ Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠ Forceful shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = server;
