const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Database services
const neonService = require('./services/neonService');
const neo4jService = require('./services/neo4jService');

const app = express();
const PORT = process.env.PORT || 7500;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Routes
app.use('/api/agents', require('./routes/agents'));
app.use('/api/communication', require('./routes/communication'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/restore', require('./routes/restore'));
app.use('/api/health', require('./routes/health'));
app.use('/api/knowledge', require('./routes/knowledge'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Agent Command Center Backend',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize database connections
async function initializeDatabases() {
  console.log('\n📊 Initializing Knowledge Base...');

  // Initialize Neon PostgreSQL
  if (process.env.KNOWLEDGE_BASE_ENABLED === 'true' && process.env.NEON_DATABASE_URL) {
    try {
      await neonService.connect();
    } catch (error) {
      console.warn('⚠️  Neon PostgreSQL connection failed (optional feature):', error.message);
    }
  } else {
    console.log('ℹ️  Neon PostgreSQL: Disabled or not configured');
  }

  // Initialize Neo4j
  if (process.env.GRAPH_RELATIONSHIPS_ENABLED === 'true' && process.env.NEO4J_PASSWORD) {
    try {
      await neo4jService.connect();
    } catch (error) {
      console.warn('⚠️  Neo4j connection failed (optional feature):', error.message);
    }
  } else {
    console.log('ℹ️  Neo4j Graph Database: Disabled or not configured');
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Closing connections gracefully...`);

  try {
    await neonService.disconnect();
    await neo4jService.disconnect();
    console.log('✅ All database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Agent Command Center Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🧠 ChromaDB Integration: ${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || 7501}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize databases
  await initializeDatabases();

  console.log(`\n⚡ Ready for Intervector Communication!\n`);
});

module.exports = app;