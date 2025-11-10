import api from './api';

/**
 * Neon PostgreSQL Service
 * Handles structured data storage with branching capabilities
 */
const neonService = {
  // Project Operations
  initializeProject: async (projectData) => {
    const response = await api.post('/neon/projects/init', {
      name: projectData.name,
      description: projectData.description,
      metadata: projectData.metadata
    });
    return response.data;
  },

  getProjectDetails: async (projectId) => {
    const response = await api.get(`/neon/projects/${projectId}`);
    return response.data;
  },

  // Branch Management (Neon's unique feature)
  createBranch: async (projectId, branchName, parentBranch = 'main') => {
    const response = await api.post('/neon/branches/create', {
      project_id: projectId,
      branch_name: branchName,
      parent_branch: parentBranch
    });
    return response.data;
  },

  listBranches: async (projectId) => {
    const response = await api.get(`/neon/branches/${projectId}`);
    return response.data;
  },

  switchBranch: async (projectId, branchName) => {
    const response = await api.post('/neon/branches/switch', {
      project_id: projectId,
      branch_name: branchName
    });
    return response.data;
  },

  mergeBranch: async (projectId, sourceBranch, targetBranch = 'main') => {
    const response = await api.post('/neon/branches/merge', {
      project_id: projectId,
      source_branch: sourceBranch,
      target_branch: targetBranch
    });
    return response.data;
  },

  // Agent Data Storage
  storeAgentData: async (agentData) => {
    const response = await api.post('/neon/agents', agentData);
    return response.data;
  },

  getAgentHistory: async (agentId, options = {}) => {
    const response = await api.get(`/neon/agents/${agentId}/history`, {
      params: options
    });
    return response.data;
  },

  updateAgentStatus: async (agentId, status, metadata = {}) => {
    const response = await api.put(`/neon/agents/${agentId}/status`, {
      status,
      metadata,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },

  // Story and Task Management
  createStory: async (storyData) => {
    const response = await api.post('/neon/stories', {
      id: storyData.id,
      epic_id: storyData.epicId,
      title: storyData.title,
      description: storyData.description,
      status: storyData.status,
      priority: storyData.priority,
      assigned_agents: storyData.assignedAgents,
      acceptance_criteria: storyData.acceptanceCriteria,
      metadata: storyData.metadata
    });
    return response.data;
  },

  updateStory: async (storyId, updates) => {
    const response = await api.put(`/neon/stories/${storyId}`, updates);
    return response.data;
  },

  getStoriesByStatus: async (projectId, status) => {
    const response = await api.get(`/neon/stories/by-status`, {
      params: { project_id: projectId, status }
    });
    return response.data;
  },

  // Session and Restore Points
  createRestorePoint: async (restorePointData) => {
    const response = await api.post('/neon/restore-points', {
      name: restorePointData.name,
      description: restorePointData.description,
      project_id: restorePointData.projectId,
      branch_name: restorePointData.branchName,
      context_data: restorePointData.contextData,
      tags: restorePointData.tags,
      metadata: restorePointData.metadata
    });
    return response.data;
  },

  listRestorePoints: async (projectId, options = {}) => {
    const response = await api.get(`/neon/restore-points/${projectId}`, {
      params: options
    });
    return response.data;
  },

  restoreFromPoint: async (restorePointId) => {
    const response = await api.post(`/neon/restore-points/${restorePointId}/restore`);
    return response.data;
  },

  // Communication Logs
  logCommunication: async (communicationData) => {
    const response = await api.post('/neon/communications', {
      from_agent: communicationData.fromAgent,
      to_agent: communicationData.toAgent,
      message_type: communicationData.messageType,
      content: communicationData.content,
      priority: communicationData.priority,
      metadata: communicationData.metadata,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },

  getCommunicationHistory: async (options = {}) => {
    const response = await api.get('/neon/communications', {
      params: {
        agent_id: options.agentId,
        start_date: options.startDate,
        end_date: options.endDate,
        limit: options.limit || 100,
        offset: options.offset || 0
      }
    });
    return response.data;
  },

  // Analytics and Reporting
  getProjectAnalytics: async (projectId, timeRange = '7d') => {
    const response = await api.get(`/neon/analytics/project/${projectId}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  getAgentPerformanceMetrics: async (agentId, timeRange = '7d') => {
    const response = await api.get(`/neon/analytics/agent/${agentId}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  getSprintMetrics: async (projectId, sprintId) => {
    const response = await api.get(`/neon/analytics/sprint/${sprintId}`, {
      params: { project_id: projectId }
    });
    return response.data;
  },

  // Time-Series Data
  recordMetric: async (metricData) => {
    const response = await api.post('/neon/metrics', {
      metric_type: metricData.type,
      entity_id: metricData.entityId,
      entity_type: metricData.entityType,
      value: metricData.value,
      unit: metricData.unit,
      timestamp: metricData.timestamp || new Date().toISOString(),
      metadata: metricData.metadata
    });
    return response.data;
  },

  getMetricTimeSeries: async (entityId, metricType, startDate, endDate) => {
    const response = await api.get('/neon/metrics/timeseries', {
      params: {
        entity_id: entityId,
        metric_type: metricType,
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  },

  // Search and Query
  searchStories: async (query, filters = {}) => {
    const response = await api.post('/neon/search/stories', {
      query,
      filters
    });
    return response.data;
  },

  fullTextSearch: async (searchTerm, entityTypes = []) => {
    const response = await api.post('/neon/search/fulltext', {
      search_term: searchTerm,
      entity_types: entityTypes
    });
    return response.data;
  },

  // Audit Trail
  getAuditLog: async (entityId, entityType, options = {}) => {
    const response = await api.get('/neon/audit', {
      params: {
        entity_id: entityId,
        entity_type: entityType,
        start_date: options.startDate,
        end_date: options.endDate,
        limit: options.limit || 50
      }
    });
    return response.data;
  }
};

export default neonService;
