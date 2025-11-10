import api from './api';

const taskService = {
  // Create a new task
  createTask: (taskData) => api.post('/tasks', taskData),

  // Get all tasks for a project
  getProjectTasks: (projectId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/tasks/project/${projectId}?${params}`);
  },

  // Get a specific task
  getTask: (taskId) => api.get(`/tasks/${taskId}`),

  // Update a task
  updateTask: (taskId, updates) => api.put(`/tasks/${taskId}`, updates),

  // Get incomplete tasks
  getIncompleteTasks: () => api.get('/tasks/incomplete/all'),

  // Detect task breakdowns
  detectBreakdowns: () => api.get('/tasks/breakdowns/detect'),

  // Get task handoff chain
  getHandoffChain: (projectId) => api.get(`/tasks/handoff/${projectId}/chain`),

  // Log agent activity
  logActivity: (agentId, activity) =>
    api.post('/tasks/activity/log', { agent_id: agentId, activity }),

  // Get agent activity
  getAgentActivity: (agentId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/tasks/activity/${agentId}?${params}`);
  },

  // Update subtask status
  updateSubtask: (taskId, subtaskIndex, status) =>
    api.put(`/tasks/${taskId}/subtask/${subtaskIndex}`, { status }),

  // Mark task as failed
  failTask: (taskId, reason) =>
    api.post(`/tasks/${taskId}/fail`, { reason }),

  // Retry a failed task
  retryTask: (taskId) =>
    api.post(`/tasks/${taskId}/retry`),

  // Reassign task to different agent
  reassignTask: (taskId, assignedAgent, reason) =>
    api.post(`/tasks/${taskId}/reassign`, { assigned_agent: assignedAgent, reason })
};

export default taskService;
