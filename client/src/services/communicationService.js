import api from './api';

const communicationService = {
  // Send message
  sendMessage: async (messageData) => {
    const response = await api.post('/communication/send', messageData);
    return response.data;
  },

  // Broadcast message
  broadcastMessage: async (messageData) => {
    const response = await api.post('/communication/broadcast', messageData);
    return response.data;
  },

  // Get messages for agent
  getAgentMessages: async (agentId, options = {}) => {
    const response = await api.get(`/communication/messages/${agentId}`, {
      params: options
    });
    return response.data;
  },

  // Get communication log
  getCommunicationLog: async (filters = {}) => {
    const response = await api.get('/communication/log', { params: filters });
    return response.data;
  },

  // Search messages
  searchMessages: async (query, options = {}) => {
    const response = await api.get('/communication/search', {
      params: { q: query, ...options }
    });
    return response.data;
  },

  // Get thread
  getThread: async (threadId, options = {}) => {
    const response = await api.get(`/communication/thread/${threadId}`, {
      params: options
    });
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await api.put(`/communication/messages/${messageId}/read`);
    return response.data;
  },

  // Get communication statistics
  getStats: async (days = 7) => {
    const response = await api.get('/communication/stats', {
      params: { days }
    });
    return response.data;
  }
};

export default communicationService;
