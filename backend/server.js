require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: [
    'https://smart-warehouse-inventory-managemen.vercel.app',
    'https://smart-warehouse-inventory-management.onrender.com',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Smart Warehouse API' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api', require('./routes/api'));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Smart Warehouse API Server             ║
  ║   Running on port ${PORT}                   ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
