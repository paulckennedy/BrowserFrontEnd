const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('.', {
  maxAge: isDev ? 0 : '1y',
  etag: true,
  lastModified: true
}));

// API Routes (for future backend functionality)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple API endpoint for document operations (placeholder)
app.get('/api/documents', (req, res) => {
  // This would connect to PostgreSQL in a real implementation
  res.json({
    documents: [
      {
        id: 1,
        name: 'welcome.md',
        content: '# Welcome\n\nThis is a sample document.',
        updated_at: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/documents', (req, res) => {
  // This would save to PostgreSQL in a real implementation
  const { name, content } = req.body;
  res.json({
    id: Date.now(),
    name,
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('healthy');
});

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: isDev ? err.message : 'Something went wrong!',
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 MarkdownEditor server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access URL: http://localhost:${PORT}`);
  
  if (isDev) {
    console.log(`\n🔧 Development mode enabled`);
    console.log(`🔍 API Health Check: http://localhost:${PORT}/api/health`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📤 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📤 SIGINT received, shutting down gracefully');
  process.exit(0);
});