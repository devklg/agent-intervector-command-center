const express = require('express');
const router = express.Router();
const chromaService = require('../services/chromaService');

// System health check
router.get('/', async (req, res) => {
  try {
    const chromaHealth = await chromaService.healthCheck();

    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Agent Command Center',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      components: {
        chromadb: chromaHealth.status,
        express: 'healthy',
        api: 'healthy'
      }
    };

    // Overall status is unhealthy if any component is down
    if (chromaHealth.status === 'unhealthy') {
      systemHealth.status = 'degraded';
      systemHealth.warnings = ['ChromaDB connection failed'];
    }

    const httpStatus = systemHealth.status === 'healthy' ? 200 : 503;
    res.status(httpStatus).json(systemHealth);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ChromaDB-specific health check
router.get('/chromadb', async (req, res) => {
  try {
    const chromaHealth = await chromaService.healthCheck();
    res.json(chromaHealth);
  } catch (error) {
    console.error('ChromaDB health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// System metrics
router.get('/metrics', async (req, res) => {
  try {
    // Get agent directory
    const agents = await chromaService.getAgentDirectory();

    // Get recent messages
    const messages = await chromaService.getMessages({ limit: 1000 });

    // Calculate metrics
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    const recentMessages = messages.messages.filter(m =>
      new Date(m.timestamp) >= oneDayAgo
    );

    const lastHourMessages = messages.messages.filter(m =>
      new Date(m.timestamp) >= oneHourAgo
    );

    const metrics = {
      timestamp: now.toISOString(),
      agents: {
        total: agents.length,
        online: agents.filter(a => a.status === 'online').length,
        offline: agents.filter(a => a.status === 'offline').length,
        busy: agents.filter(a => a.status === 'busy').length
      },
      messages: {
        total: messages.total,
        last_24h: recentMessages.length,
        last_hour: lastHourMessages.length,
        rate_per_hour: Math.round(lastHourMessages.length)
      },
      system: {
        uptime_seconds: Math.round(process.uptime()),
        uptime_formatted: formatUptime(process.uptime()),
        memory_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        memory_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        cpu_usage_percent: process.cpuUsage(),
        node_version: process.version,
        platform: process.platform
      },
      performance: {
        avg_message_size: calculateAverageMessageSize(recentMessages),
        message_types: calculateMessageTypeDistribution(recentMessages),
        priority_distribution: calculatePriorityDistribution(recentMessages)
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      details: error.message
    });
  }
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    const chromaHealth = await chromaService.healthCheck();

    if (chromaHealth.status === 'healthy') {
      res.json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        reason: 'ChromaDB not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

function calculateAverageMessageSize(messages) {
  if (messages.length === 0) return 0;
  const totalSize = messages.reduce((sum, msg) =>
    sum + (msg.content?.length || 0), 0
  );
  return Math.round(totalSize / messages.length);
}

function calculateMessageTypeDistribution(messages) {
  const distribution = {};
  messages.forEach(msg => {
    distribution[msg.message_type] = (distribution[msg.message_type] || 0) + 1;
  });
  return distribution;
}

function calculatePriorityDistribution(messages) {
  const distribution = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };
  messages.forEach(msg => {
    if (distribution.hasOwnProperty(msg.priority)) {
      distribution[msg.priority]++;
    }
  });
  return distribution;
}

module.exports = router;
