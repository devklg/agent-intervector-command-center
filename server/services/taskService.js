const chromaService = require('./chromaService');

/**
 * Task Tracking Service
 * Manages agent task assignments, tracking, and breakdown detection
 */

class TaskService {
  constructor() {
    this.collectionName = 'agent_tasks';
    this.activityCollectionName = 'agent_activity_log';
  }

  /**
   * Create a new task
   */
  async createTask(taskData) {
    const task = {
      task_id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project_id: taskData.project_id,
      name: taskData.name,
      description: taskData.description || '',
      assigned_agent: taskData.assigned_agent,
      status: 'pending', // pending, in_progress, completed, failed, blocked, incomplete
      priority: taskData.priority || 'MEDIUM', // LOW, MEDIUM, HIGH, CRITICAL

      // Timestamps
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
      expected_completion: taskData.expected_completion || null,

      // Subtasks for granular tracking
      subtasks: taskData.subtasks || [],

      // Handoff tracking
      handoff_to: taskData.handoff_to || null,
      handoff_from: taskData.handoff_from || null,
      blocked_by: null,
      blocks: taskData.blocks || [], // Tasks that depend on this one

      // Evidence and artifacts
      files_modified: [],
      files_expected: taskData.files_expected || [],
      commits: [],

      // Metrics
      time_spent: 0, // seconds
      retries: 0,
      completion_percentage: 0,
      failure_reason: null,

      // Tags for categorization
      tags: taskData.tags || [],
      category: taskData.category || 'general' // styling, backend, frontend, database, etc.
    };

    try {
      const result = await chromaService.addMessage({
        id: task.task_id,
        from_agent: 'system',
        to_agent: task.assigned_agent,
        message_type: 'task_assignment',
        priority: task.priority,
        content: JSON.stringify(task),
        timestamp: task.created_at,
        metadata: {
          task_id: task.task_id,
          project_id: task.project_id,
          task_name: task.name,
          status: task.status,
          category: task.category
        }
      });

      return { success: true, task };
    } catch (error) {
      console.error('Failed to create task:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update task status and track progress
   */
  async updateTask(taskId, updates) {
    try {
      // Get existing task
      const existingTask = await this.getTask(taskId);
      if (!existingTask) {
        return { success: false, error: 'Task not found' };
      }

      const updatedTask = {
        ...existingTask,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Auto-calculate completion percentage from subtasks
      if (updatedTask.subtasks && updatedTask.subtasks.length > 0) {
        const completedSubtasks = updatedTask.subtasks.filter(
          st => st.status === 'completed'
        ).length;
        updatedTask.completion_percentage = Math.round(
          (completedSubtasks / updatedTask.subtasks.length) * 100
        );
      }

      // Set timestamps based on status changes
      if (updates.status === 'in_progress' && !existingTask.started_at) {
        updatedTask.started_at = new Date().toISOString();
      }
      if (updates.status === 'completed' && !existingTask.completed_at) {
        updatedTask.completed_at = new Date().toISOString();
        updatedTask.completion_percentage = 100;
      }

      // Store updated task
      await chromaService.addMessage({
        id: `${taskId}-update-${Date.now()}`,
        from_agent: 'system',
        to_agent: updatedTask.assigned_agent,
        message_type: 'task_update',
        priority: updatedTask.priority,
        content: JSON.stringify(updatedTask),
        timestamp: updatedTask.updated_at,
        metadata: {
          task_id: taskId,
          project_id: updatedTask.project_id,
          task_name: updatedTask.name,
          status: updatedTask.status,
          category: updatedTask.category,
          completion_percentage: updatedTask.completion_percentage
        }
      });

      return { success: true, task: updatedTask };
    } catch (error) {
      console.error('Failed to update task:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId) {
    try {
      const messages = await chromaService.getMessages({
        where: { task_id: taskId },
        limit: 1
      });

      if (messages.messages && messages.messages.length > 0) {
        return JSON.parse(messages.messages[0].content);
      }

      return null;
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }

  /**
   * Get all tasks for a project
   */
  async getProjectTasks(projectId, filters = {}) {
    try {
      const where = { project_id: projectId };

      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.assigned_agent) {
        where.assigned_agent = filters.assigned_agent;
      }
      if (filters.category) {
        where.category = filters.category;
      }

      const messages = await chromaService.getMessages({
        where,
        limit: filters.limit || 100
      });

      if (messages.messages && messages.messages.length > 0) {
        return messages.messages.map(msg => JSON.parse(msg.content));
      }

      return [];
    } catch (error) {
      console.error('Failed to get project tasks:', error);
      return [];
    }
  }

  /**
   * Get incomplete tasks (for breakdown detection)
   */
  async getIncompleteTasks() {
    try {
      const messages = await chromaService.getMessages({
        where: { status: 'incomplete' },
        limit: 50
      });

      if (messages.messages && messages.messages.length > 0) {
        return messages.messages.map(msg => JSON.parse(msg.content));
      }

      return [];
    } catch (error) {
      console.error('Failed to get incomplete tasks:', error);
      return [];
    }
  }

  /**
   * Detect task breakdowns
   * Identifies tasks that are stuck, incomplete, or taking too long
   */
  async detectBreakdowns() {
    try {
      const now = new Date();
      const breakdowns = [];

      // Get all in-progress and pending tasks
      const activeTasks = await chromaService.getMessages({
        where: { status: 'in_progress' },
        limit: 100
      });

      if (activeTasks.messages) {
        for (const msg of activeTasks.messages) {
          const task = JSON.parse(msg.content);
          const issues = [];

          // Check if task is taking too long
          if (task.started_at) {
            const elapsed = (now - new Date(task.started_at)) / 1000; // seconds
            const expected = task.expected_completion
              ? (new Date(task.expected_completion) - new Date(task.started_at)) / 1000
              : 3600; // Default 1 hour

            if (elapsed > expected * 1.5) {
              issues.push({
                type: 'overdue',
                severity: 'high',
                message: `Task running ${Math.round(elapsed / 60)} minutes, expected ${Math.round(expected / 60)} minutes`
              });
            }
          }

          // Check for incomplete subtasks
          if (task.subtasks && task.subtasks.length > 0) {
            const incomplete = task.subtasks.filter(st => st.status !== 'completed');
            const failed = task.subtasks.filter(st => st.status === 'failed');

            if (failed.length > 0) {
              issues.push({
                type: 'failed_subtasks',
                severity: 'critical',
                message: `${failed.length} subtask(s) failed: ${failed.map(f => f.name).join(', ')}`
              });
            }

            if (task.completion_percentage < 50 && task.started_at) {
              const elapsed = (now - new Date(task.started_at)) / 1000;
              if (elapsed > 1800) { // 30 minutes
                issues.push({
                  type: 'low_progress',
                  severity: 'medium',
                  message: `Only ${task.completion_percentage}% complete after ${Math.round(elapsed / 60)} minutes`
                });
              }
            }
          }

          // Check for missing expected files
          if (task.files_expected && task.files_expected.length > 0) {
            const missing = task.files_expected.filter(
              file => !task.files_modified.includes(file)
            );
            if (missing.length > 0) {
              issues.push({
                type: 'missing_files',
                severity: 'medium',
                message: `Expected files not modified: ${missing.join(', ')}`
              });
            }
          }

          if (issues.length > 0) {
            breakdowns.push({
              task,
              issues,
              detected_at: now.toISOString()
            });
          }
        }
      }

      return breakdowns;
    } catch (error) {
      console.error('Failed to detect breakdowns:', error);
      return [];
    }
  }

  /**
   * Log agent activity
   */
  async logActivity(agentId, activity) {
    const activityLog = {
      activity_id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agent_id: agentId,
      session_id: activity.session_id,
      timestamp: new Date().toISOString(),
      action: activity.action, // file_created, file_modified, task_started, task_stopped, etc.
      target: activity.target, // file path, task id, etc.
      success: activity.success !== false,
      details: activity.details || {},
      task_id: activity.task_id || null
    };

    try {
      await chromaService.addMessage({
        id: activityLog.activity_id,
        from_agent: agentId,
        to_agent: 'system',
        message_type: 'activity_log',
        priority: 'LOW',
        content: JSON.stringify(activityLog),
        timestamp: activityLog.timestamp,
        metadata: {
          agent_id: agentId,
          action: activityLog.action,
          task_id: activityLog.task_id
        }
      });

      return { success: true, activity: activityLog };
    } catch (error) {
      console.error('Failed to log activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get agent activity history
   */
  async getAgentActivity(agentId, filters = {}) {
    try {
      const where = { agent_id: agentId };

      if (filters.task_id) {
        where.task_id = filters.task_id;
      }
      if (filters.action) {
        where.action = filters.action;
      }

      const messages = await chromaService.getMessages({
        where,
        limit: filters.limit || 100
      });

      if (messages.messages && messages.messages.length > 0) {
        return messages.messages.map(msg => JSON.parse(msg.content));
      }

      return [];
    } catch (error) {
      console.error('Failed to get agent activity:', error);
      return [];
    }
  }

  /**
   * Get task handoff chain
   */
  async getTaskHandoffChain(projectId) {
    try {
      const tasks = await this.getProjectTasks(projectId);

      // Build handoff chain
      const chain = [];
      const taskMap = new Map(tasks.map(t => [t.task_id, t]));

      for (const task of tasks) {
        const step = {
          task_id: task.task_id,
          task_name: task.name,
          agent: task.assigned_agent,
          status: task.status,
          completion_percentage: task.completion_percentage,
          handoff_from: task.handoff_from,
          handoff_to: task.handoff_to,
          created_at: task.created_at,
          completed_at: task.completed_at
        };

        chain.push(step);
      }

      // Sort by creation time
      chain.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      return chain;
    } catch (error) {
      console.error('Failed to get handoff chain:', error);
      return [];
    }
  }
}

module.exports = new TaskService();
