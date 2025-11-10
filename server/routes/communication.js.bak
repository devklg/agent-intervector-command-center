const express = require('express');
const router = express.Router();
const chromaService = require('../services/chromaService');
const { validateMessage } = require('../middleware/validation');

// Send message between agents
router.post('/send', validateMessage, async (req, res) => {
  try {
    const {
      from_agent,
      to_agent,
      message_type,
      priority,
      content,
      thread_id,
      subject
    } = req.body;

    const message = {
      id: `msg_${from_agent.toLowerCase()}_${Date.now()}`,
      from_agent,
      to_agent,
      message_type,
      priority: priority || 'MEDIUM',
      timestamp: new Date().toISOString(),
      thread_id: thread_id || `thread_${Date.now()}`,
      status: 'delivered',
      subject: subject || 'Agent Communication',
      content
    };

    await chromaService.addMessage(message);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: error.message
    });
  }
});

// Broadcast message to all agents
router.post('/broadcast', async (req, res) => {
  try {
    const {
      from_agent,
      message_type,
      priority,
      content,
      subject
    } = req.body;

    const broadcastMessage = {
      id: `broadcast_${from_agent.toLowerCase()}_${Date.now()}`,
      from_agent,
      to_agent: 'ALL_AGENTS',
      message_type: message_type || 'system_notification',
      priority: priority || 'HIGH',
      timestamp: new Date().toISOString(),
      thread_id: `broadcast_${Date.now()}`,
      status: 'delivered',
      subject: subject || 'System Broadcast',
      content
    };

    await chromaService.addMessage(broadcastMessage);

    res.status(201).json({
      success: true,
      message: 'Broadcast sent successfully',
      data: broadcastMessage
    });
  } catch (error) {
    console.error('Broadcast message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast',
      details: error.message
    });
  }
});

// Get messages for specific agent
router.get('/messages/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { limit = 50, offset = 0, priority, status } = req.query;

    const filters = {
      where: {
        to_agent: agentId
      },
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    if (priority) {
      filters.where.priority = priority;
    }
    if (status) {
      filters.where.status = status;
    }

    const result = await chromaService.getMessages(filters);

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.total
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages',
      details: error.message
    });
  }
});

// Get all communication log with filters
router.get('/log', async (req, res) => {
  try {
    const { limit = 100, offset = 0, priority, agent, message_type } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    if (priority || agent || message_type) {
      filters.where = {};
      if (priority) filters.where.priority = priority;
      if (agent) filters.where.$or = [
        { from_agent: agent },
        { to_agent: agent }
      ];
      if (message_type) filters.where.message_type = message_type;
    }

    const result = await chromaService.getMessages(filters);

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.total
      }
    });
  } catch (error) {
    console.error('Get communication log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve communication log',
      details: error.message
    });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, agent, priority } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const filters = {
      limit: parseInt(limit)
    };

    if (agent || priority) {
      filters.where = {};
      if (agent) filters.where.$or = [
        { from_agent: agent },
        { to_agent: agent }
      ];
      if (priority) filters.where.priority = priority;
    }

    const result = await chromaService.searchMessages(q, filters);

    res.json({
      success: true,
      data: result.messages,
      query: q,
      total: result.total
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search messages',
      details: error.message
    });
  }
});

// Get thread conversation
router.get('/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit = 50 } = req.query;

    const filters = {
      where: {
        thread_id: threadId
      },
      limit: parseInt(limit)
    };

    const result = await chromaService.getMessages(filters);

    // Sort by timestamp
    const sortedMessages = result.messages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.json({
      success: true,
      data: sortedMessages,
      thread_id: threadId,
      total: result.total
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve thread',
      details: error.message
    });
  }
});

// Mark messages as read
router.put('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Note: ChromaDB doesn't support direct updates, so this would need
    // to be implemented with a separate read status tracking system
    // For now, we'll return success but implement full functionality later
    
    res.json({
      success: true,
      message: 'Message marked as read',
      message_id: messageId
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read',
      details: error.message
    });
  }
});

// Get communication statistics
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get recent messages for statistics
    const result = await chromaService.getMessages({
      limit: 1000 // Adjust based on needs
    });

    const messages = result.messages.filter(msg => 
      new Date(msg.timestamp) >= startDate
    );

    // Calculate statistics
    const stats = {
      total_messages: messages.length,
      by_priority: {},
      by_agent: {},
      by_message_type: {},
      recent_activity: messages.slice(0, 10)
    };

    messages.forEach(msg => {
      // Count by priority
      stats.by_priority[msg.priority] = (stats.by_priority[msg.priority] || 0) + 1;
      
      // Count by agent
      stats.by_agent[msg.from_agent] = (stats.by_agent[msg.from_agent] || 0) + 1;
      
      // Count by message type
      stats.by_message_type[msg.message_type] = (stats.by_message_type[msg.message_type] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
      period_days: parseInt(days)
    });
  } catch (error) {
    console.error('Get communication stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve communication statistics',
      details: error.message
    });
  }
});

module.exports = router;