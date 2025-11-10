const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

/**
 * Task Management Routes
 */

// Create a new task
router.post('/', async (req, res) => {
  try {
    const result = await taskService.createTask(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assigned_agent, category, limit } = req.query;

    const tasks = await taskService.getProjectTasks(projectId, {
      status,
      assigned_agent,
      category,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error getting project tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific task
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTask(taskId);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a task
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await taskService.updateTask(taskId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get incomplete tasks
router.get('/incomplete/all', async (req, res) => {
  try {
    const tasks = await taskService.getIncompleteTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error getting incomplete tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Detect task breakdowns
router.get('/breakdowns/detect', async (req, res) => {
  try {
    const breakdowns = await taskService.detectBreakdowns();
    res.json({ success: true, breakdowns });
  } catch (error) {
    console.error('Error detecting breakdowns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get task handoff chain for a project
router.get('/handoff/:projectId/chain', async (req, res) => {
  try {
    const { projectId } = req.params;
    const chain = await taskService.getTaskHandoffChain(projectId);
    res.json({ success: true, chain });
  } catch (error) {
    console.error('Error getting handoff chain:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log agent activity
router.post('/activity/log', async (req, res) => {
  try {
    const { agent_id, activity } = req.body;
    const result = await taskService.logActivity(agent_id, activity);
    res.json(result);
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent activity
router.get('/activity/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { task_id, action, limit } = req.query;

    const activities = await taskService.getAgentActivity(agentId, {
      task_id,
      action,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({ success: true, activities });
  } catch (error) {
    console.error('Error getting agent activity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update task subtask status
router.put('/:taskId/subtask/:subtaskIndex', async (req, res) => {
  try {
    const { taskId, subtaskIndex } = req.params;
    const { status } = req.body;

    const task = await taskService.getTask(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const index = parseInt(subtaskIndex);
    if (index < 0 || index >= task.subtasks.length) {
      return res.status(400).json({ success: false, error: 'Invalid subtask index' });
    }

    task.subtasks[index].status = status;
    const result = await taskService.updateTask(taskId, { subtasks: task.subtasks });
    res.json(result);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark task as failed with reason
router.post('/:taskId/fail', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;

    const result = await taskService.updateTask(taskId, {
      status: 'failed',
      failure_reason: reason,
      completed_at: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Error marking task as failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Retry a failed task
router.post('/:taskId/retry', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTask(taskId);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const result = await taskService.updateTask(taskId, {
      status: 'pending',
      started_at: null,
      completed_at: null,
      failure_reason: null,
      retries: task.retries + 1
    });

    res.json(result);
  } catch (error) {
    console.error('Error retrying task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reassign task to different agent
router.post('/:taskId/reassign', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assigned_agent, reason } = req.body;

    if (!assigned_agent) {
      return res.status(400).json({ success: false, error: 'assigned_agent is required' });
    }

    const task = await taskService.getTask(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Log the reassignment activity
    await taskService.logActivity('system', {
      session_id: 'reassignment',
      action: 'task_reassigned',
      target: taskId,
      success: true,
      details: {
        from_agent: task.assigned_agent,
        to_agent: assigned_agent,
        reason: reason || 'Manual reassignment'
      },
      task_id: taskId
    });

    const result = await taskService.updateTask(taskId, {
      assigned_agent,
      handoff_from: task.assigned_agent,
      status: 'pending',
      started_at: null
    });

    res.json(result);
  } catch (error) {
    console.error('Error reassigning task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
