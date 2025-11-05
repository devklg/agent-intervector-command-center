import api from './api';

const agentService = {
  // Get all agents
  getAllAgents: async () => {
    const response = await api.get('/agents');
    return response.data;
  },

  // Get specific agent
  getAgent: async (agentId) => {
    const response = await api.get(`/agents/${agentId}`);
    return response.data;
  },

  // Create new agent
  createAgent: async (agentData) => {
    const response = await api.post('/agents', agentData);
    return response.data;
  },

  // Update agent
  updateAgent: async (agentId, updateData) => {
    const response = await api.put(`/agents/${agentId}`, updateData);
    return response.data;
  },

  // Delete/deactivate agent
  deleteAgent: async (agentId) => {
    const response = await api.delete(`/agents/${agentId}`);
    return response.data;
  },

  // Get agent statistics
  getAgentStats: async (agentId, days = 7) => {
    const response = await api.get(`/agents/${agentId}/stats`, {
      params: { days }
    });
    return response.data;
  },

  // Get agent tasks
  getAgentTasks: async (agentId, status = 'all') => {
    const response = await api.get(`/agents/${agentId}/tasks`, {
      params: { status }
    });
    return response.data;
  }
};

export default agentService;
