import api from './api';

const bmadAgentService = {
  // Get all BMAD agents
  getAllAgents: () => api.get('/bmad-agents/all'),

  // Get agents by category
  getAgentsByCategory: (category) => api.get(`/bmad-agents/category/${category}`),

  // Get agents by phase
  getAgentsByPhase: (phase) => api.get(`/bmad-agents/phase/${encodeURIComponent(phase)}`),

  // Get specific agent by ID
  getAgentById: (agentId) => api.get(`/bmad-agents/${agentId}`),

  // Search agents
  searchAgents: (query) => api.get(`/bmad-agents/search/${encodeURIComponent(query)}`),

  // Get all categories
  getCategories: () => api.get('/bmad-agents/meta/categories'),

  // Get agents grouped by module
  getAgentsByModule: () => api.get('/bmad-agents/meta/modules'),

  // Get agent statistics
  getAgentStats: () => api.get('/bmad-agents/meta/stats'),

  // Get recommended agent for a task
  getRecommendation: (taskDescription) =>
    api.post('/bmad-agents/recommend', { task_description: taskDescription }),

  // Create agent invocation request
  invokeAgent: (agentId, workflow, context = {}) =>
    api.post('/bmad-agents/invoke', {
      agent_id: agentId,
      workflow,
      context
    })
};

export default bmadAgentService;
