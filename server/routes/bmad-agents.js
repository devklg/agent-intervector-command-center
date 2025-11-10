const express = require('express');
const router = express.Router();
const bmadAgentService = require('../services/bmadAgentService');

/**
 * BMAD Agent Management Routes
 * Provides access to BMAD framework agents for specialized task execution
 */

// Get all BMAD agents
router.get('/all', async (req, res) => {
  try {
    const agents = await bmadAgentService.getAllAgents();
    res.json({ success: true, agents, total: agents.length });
  } catch (error) {
    console.error('Error getting all agents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agents by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const agents = await bmadAgentService.getAgentsByCategory(category);
    res.json({ success: true, category, agents, total: agents.length });
  } catch (error) {
    console.error('Error getting agents by category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agents by phase
router.get('/phase/:phase', async (req, res) => {
  try {
    const { phase } = req.params;
    const agents = await bmadAgentService.getAgentsByPhase(phase);
    res.json({ success: true, phase, agents, total: agents.length });
  } catch (error) {
    console.error('Error getting agents by phase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific agent by ID
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await bmadAgentService.getAgentById(agentId);

    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    res.json({ success: true, agent });
  } catch (error) {
    console.error('Error getting agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search agents
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const agents = await bmadAgentService.searchAgents(query);
    res.json({ success: true, query, agents, total: agents.length });
  } catch (error) {
    console.error('Error searching agents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all agent categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await bmadAgentService.getCategories();
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agents grouped by module
router.get('/meta/modules', async (req, res) => {
  try {
    const modules = await bmadAgentService.getAgentsByModule();
    res.json({ success: true, modules });
  } catch (error) {
    console.error('Error getting modules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent statistics
router.get('/meta/stats', async (req, res) => {
  try {
    const stats = await bmadAgentService.getAgentStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting agent stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recommended agent for a task
router.post('/recommend', async (req, res) => {
  try {
    const { task_description } = req.body;

    if (!task_description) {
      return res.status(400).json({ success: false, error: 'task_description is required' });
    }

    const recommendations = await bmadAgentService.getRecommendedAgent(task_description);
    res.json({ success: true, task_description, recommendations, total: recommendations.length });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create an agent invocation request
router.post('/invoke', async (req, res) => {
  try {
    const { agent_id, workflow, context } = req.body;

    if (!agent_id || !workflow) {
      return res.status(400).json({ success: false, error: 'agent_id and workflow are required' });
    }

    const request = await bmadAgentService.createAgentRequest(agent_id, workflow, context);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Error creating agent request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
