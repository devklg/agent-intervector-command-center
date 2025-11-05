const express = require('express');
const router = express.Router();
const chromaService = require('../services/chromaService');
const { validateAgent } = require('../middleware/validation');

// Get all agents
router.get('/', async (req, res) => {
  try {
    const agents = await chromaService.getAgentDirectory();

    res.json({
      success: true,
      data: agents,
      total: agents.length
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agents',
      details: error.message
    });
  }
});

// Get specific agent by ID
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agents = await chromaService.getAgentDirectory();
    const agent = agents.find(a => a.agent_name === agentId || a.id === `agent_${agentId.toLowerCase()}`);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Get agent's recent messages
    const messages = await chromaService.getMessages({
      where: {
        $or: [
          { from_agent: agentId },
          { to_agent: agentId }
        ]
      },
      limit: 50
    });

    res.json({
      success: true,
      data: {
        ...agent,
        recent_messages: messages.messages
      }
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent',
      details: error.message
    });
  }
});

// Register/Create new agent
router.post('/', validateAgent, async (req, res) => {
  try {
    const {
      name,
      type,
      specialties = [],
      description = '',
      priority = 'MEDIUM'
    } = req.body;

    const agentId = `agent_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Check if agent already exists
    const existingAgents = await chromaService.getAgentDirectory();
    const exists = existingAgents.some(a => a.agent_name === name || a.id === agentId);

    if (exists) {
      return res.status(409).json({
        success: false,
        error: 'Agent already exists'
      });
    }

    // Create agent status
    const agentData = await chromaService.updateAgentStatus(name, {
      status: 'online',
      current_task: 'initializing',
      specialization: specialties.join(', '),
      agent_type: type,
      specialties: specialties.join(','),
      performance_metrics: {
        messages_sent: 0,
        messages_received: 0,
        tasks_completed: 0,
        success_rate: 100,
        avg_response_time: 0
      }
    });

    // Send registration notification
    await chromaService.addMessage({
      id: `msg_system_${Date.now()}`,
      from_agent: 'SYSTEM',
      to_agent: 'ALL_AGENTS',
      message_type: 'system_notification',
      priority: 'HIGH',
      timestamp: new Date().toISOString(),
      thread_id: 'thread_system_notifications',
      status: 'delivered',
      subject: `New Agent Registered: ${name}`,
      content: `Welcome ${name}! Agent type: ${type}. Specialties: ${specialties.join(', ')}. Ready for Intervector Communication.`
    });

    res.status(201).json({
      success: true,
      message: 'Agent registered successfully',
      data: agentData
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agent',
      details: error.message
    });
  }
});

// Update agent status/info
router.put('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const updateData = req.body;

    const updatedAgent = await chromaService.updateAgentStatus(agentId, updateData);

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: updatedAgent
    });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent',
      details: error.message
    });
  }
});

// Delete/Deactivate agent
router.delete('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    // Update status to offline/deactivated
    await chromaService.updateAgentStatus(agentId, {
      status: 'offline',
      current_task: 'deactivated'
    });

    // Send deactivation notification
    await chromaService.addMessage({
      id: `msg_system_${Date.now()}`,
      from_agent: 'SYSTEM',
      to_agent: 'ALL_AGENTS',
      message_type: 'system_notification',
      priority: 'MEDIUM',
      timestamp: new Date().toISOString(),
      thread_id: 'thread_system_notifications',
      status: 'delivered',
      subject: `Agent Deactivated: ${agentId}`,
      content: `Agent ${agentId} has been deactivated and is no longer available for task assignment.`
    });

    res.json({
      success: true,
      message: 'Agent deactivated successfully'
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate agent',
      details: error.message
    });
  }
});

// Get agent statistics
router.get('/:agentId/stats', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all messages involving this agent
    const sentMessages = await chromaService.getMessages({
      where: { from_agent: agentId },
      limit: 1000
    });

    const receivedMessages = await chromaService.getMessages({
      where: { to_agent: agentId },
      limit: 1000
    });

    const recentSent = sentMessages.messages.filter(m =>
      new Date(m.timestamp) >= startDate
    );

    const recentReceived = receivedMessages.messages.filter(m =>
      new Date(m.timestamp) >= startDate
    );

    const stats = {
      agent_id: agentId,
      period_days: parseInt(days),
      messages_sent: recentSent.length,
      messages_received: recentReceived.length,
      total_messages: recentSent.length + recentReceived.length,
      by_message_type: {},
      by_priority: {},
      response_times: [],
      active_threads: new Set(recentSent.map(m => m.thread_id)).size
    };

    // Calculate statistics
    [...recentSent, ...recentReceived].forEach(msg => {
      stats.by_message_type[msg.message_type] =
        (stats.by_message_type[msg.message_type] || 0) + 1;
      stats.by_priority[msg.priority] =
        (stats.by_priority[msg.priority] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent statistics',
      details: error.message
    });
  }
});

// Get agent's tasks/assignments
router.get('/:agentId/tasks', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status = 'all' } = req.query;

    const messages = await chromaService.getMessages({
      where: {
        to_agent: agentId,
        message_type: 'task_assignment'
      },
      limit: 100
    });

    let tasks = messages.messages;

    // Filter by status if specified
    if (status !== 'all') {
      tasks = tasks.filter(t => t.status === status);
    }

    res.json({
      success: true,
      data: tasks,
      total: tasks.length
    });
  } catch (error) {
    console.error('Get agent tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent tasks',
      details: error.message
    });
  }
});

module.exports = router;
