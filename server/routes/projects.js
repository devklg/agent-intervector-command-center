const express = require('express');
const router = express.Router();
const chromaService = require('../services/chromaService');

// In-memory project storage (would be MongoDB in production)
let projects = [];
let projectIdCounter = 1;

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { status, agent } = req.query;

    let filteredProjects = projects;

    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    if (agent) {
      filteredProjects = filteredProjects.filter(p =>
        p.assigned_agents.includes(agent)
      );
    }

    res.json({
      success: true,
      data: filteredProjects,
      total: filteredProjects.length
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve projects',
      details: error.message
    });
  }
});

// Get specific project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.find(p => p.id === parseInt(projectId));

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get project-related messages
    const messages = await chromaService.searchMessages(
      `project ${project.name}`,
      { limit: 50 }
    );

    res.json({
      success: true,
      data: {
        ...project,
        recent_activity: messages.messages.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project',
      details: error.message
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      assigned_agents = [],
      priority = 'MEDIUM',
      deadline,
      tasks = []
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const project = {
      id: projectIdCounter++,
      name,
      description: description || '',
      status: 'active',
      priority,
      assigned_agents,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deadline: deadline || null,
      completion_percentage: 0,
      tasks: tasks.map((task, index) => ({
        id: index + 1,
        title: task.title || task,
        status: 'pending',
        assigned_to: task.assigned_to || null,
        created_at: new Date().toISOString()
      })),
      metadata: {
        total_messages: 0,
        active_tasks: tasks.length,
        completed_tasks: 0
      }
    };

    projects.push(project);

    // Notify assigned agents
    for (const agentId of assigned_agents) {
      await chromaService.addMessage({
        id: `msg_project_${Date.now()}_${agentId}`,
        from_agent: 'SYSTEM',
        to_agent: agentId,
        message_type: 'task_assignment',
        priority: priority,
        timestamp: new Date().toISOString(),
        thread_id: `thread_project_${project.id}`,
        status: 'delivered',
        subject: `New Project Assignment: ${name}`,
        content: `You have been assigned to project "${name}". ${description || 'No description provided.'}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      details: error.message
    });
  }
});

// Update project
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;

    const projectIndex = projects.findIndex(p => p.id === parseInt(projectId));

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: projects[projectIndex]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
      details: error.message
    });
  }
});

// Delete project
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectIndex = projects.findIndex(p => p.id === parseInt(projectId));

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projects[projectIndex];
    projects.splice(projectIndex, 1);

    // Notify agents
    for (const agentId of project.assigned_agents) {
      await chromaService.addMessage({
        id: `msg_project_delete_${Date.now()}_${agentId}`,
        from_agent: 'SYSTEM',
        to_agent: agentId,
        message_type: 'system_notification',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString(),
        thread_id: `thread_project_${project.id}`,
        status: 'delivered',
        subject: `Project Deleted: ${project.name}`,
        content: `Project "${project.name}" has been deleted.`
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      details: error.message
    });
  }
});

// Add task to project
router.post('/:projectId/tasks', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, assigned_to, description } = req.body;

    const project = projects.find(p => p.id === parseInt(projectId));

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const task = {
      id: project.tasks.length + 1,
      title,
      description: description || '',
      status: 'pending',
      assigned_to: assigned_to || null,
      created_at: new Date().toISOString()
    };

    project.tasks.push(task);
    project.updated_at = new Date().toISOString();
    project.metadata.active_tasks++;

    // Notify assigned agent
    if (assigned_to) {
      await chromaService.addMessage({
        id: `msg_task_${Date.now()}_${assigned_to}`,
        from_agent: 'SYSTEM',
        to_agent: assigned_to,
        message_type: 'task_assignment',
        priority: project.priority,
        timestamp: new Date().toISOString(),
        thread_id: `thread_project_${project.id}`,
        status: 'delivered',
        subject: `New Task: ${title}`,
        content: `New task in project "${project.name}": ${title}. ${description || ''}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: task
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add task',
      details: error.message
    });
  }
});

// Update task status
router.put('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { status, assigned_to } = req.body;

    const project = projects.find(p => p.id === parseInt(projectId));

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const task = project.tasks.find(t => t.id === parseInt(taskId));

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Update task
    if (status) task.status = status;
    if (assigned_to) task.assigned_to = assigned_to;
    task.updated_at = new Date().toISOString();

    // Update project metadata
    if (status === 'completed' && task.status !== 'completed') {
      project.metadata.completed_tasks++;
      project.metadata.active_tasks--;
    }

    // Calculate completion percentage
    project.completion_percentage = Math.round(
      (project.metadata.completed_tasks / project.tasks.length) * 100
    );
    project.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      details: error.message
    });
  }
});

// Get project statistics
router.get('/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.find(p => p.id === parseInt(projectId));

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const stats = {
      project_id: project.id,
      project_name: project.name,
      completion_percentage: project.completion_percentage,
      total_tasks: project.tasks.length,
      completed_tasks: project.metadata.completed_tasks,
      active_tasks: project.metadata.active_tasks,
      assigned_agents: project.assigned_agents.length,
      status: project.status,
      created_at: project.created_at,
      days_active: Math.ceil(
        (new Date() - new Date(project.created_at)) / (1000 * 60 * 60 * 24)
      ),
      tasks_by_status: {
        pending: project.tasks.filter(t => t.status === 'pending').length,
        in_progress: project.tasks.filter(t => t.status === 'in_progress').length,
        completed: project.tasks.filter(t => t.status === 'completed').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project statistics',
      details: error.message
    });
  }
});

module.exports = router;
