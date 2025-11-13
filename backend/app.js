// backend/app.new.js
// Production-ready Express application using SQLite

const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import rate limiters
const { apiLimiter, authLimiter, uploadLimiter, adminLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const datatypeRoutes = require('./routes/datatypeRoutes');
const dataRoutes = require('./routes/dataRoutes');
const dataRetrievalRoutes = require('./routes/dataRetrievalRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - restrict in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// HTTP request logging using Morgan (only in development/production as needed)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Health check routes (no authentication required)
app.use('/health', healthRoutes);

// Authentication routes with strict rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Data upload routes with upload-specific rate limiting
app.use('/api/data', uploadLimiter, dataRoutes);

// Data retrieval routes
app.use('/api/data', dataRetrievalRoutes);

// Device and datatype routes (admin operations)
app.use('/api/devices', adminLimiter, deviceRoutes);
app.use('/api/keys', adminLimiter, datatypeRoutes);

// Default Route
app.get('/', (req, res) => {
  res.json({
    name: 'System Monitor Backend',
    version: '2.0.0',
    status: 'Production Ready',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      devices: '/api/devices',
      keys: '/api/keys',
      data: '/api/data'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);

  // Don't leak error details in production
  const errorResponse = {
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

module.exports = app;
