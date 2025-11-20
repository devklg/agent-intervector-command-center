import api from './api';

/**
 * Neo4j Service for Graph Database Operations
 * Handles agent relationships, task dependencies, and knowledge graphs
 */
const neo4jService = {
  // Agent Relationship Operations
  createAgentNode: async (agentData) => {
    const response = await api.post('/neo4j/agents/create', {
      agent_id: agentData.id,
      name: agentData.name,
      type: agentData.type,
      specialties: agentData.specialties,
      metadata: agentData.metadata
    });
    return response.data;
  },

  createAgentRelationship: async (fromAgentId, toAgentId, relationshipType, properties = {}) => {
    const response = await api.post('/neo4j/agents/relate', {
      from_agent: fromAgentId,
      to_agent: toAgentId,
      relationship: relationshipType, // COORDINATES_WITH, REPORTS_TO, COLLABORATES_WITH, etc.
      properties
    });
    return response.data;
  },

  getAgentNetwork: async (agentId, depth = 2) => {
    const response = await api.get(`/neo4j/agents/${agentId}/network`, {
      params: { depth }
    });
    return response.data;
  },

  // Task Dependency Graph
  createTaskNode: async (taskData) => {
    const response = await api.post('/neo4j/tasks/create', {
      task_id: taskData.task_id,
      name: taskData.name,
      status: taskData.status,
      assigned_agent: taskData.assigned_agent,
      story_id: taskData.story_id,
      metadata: taskData.metadata
    });
    return response.data;
  },

  createTaskDependency: async (taskId, dependsOnTaskId, dependencyType = 'DEPENDS_ON') => {
    const response = await api.post('/neo4j/tasks/dependency', {
      task_id: taskId,
      depends_on: dependsOnTaskId,
      type: dependencyType
    });
    return response.data;
  },

  getTaskDependencyGraph: async (projectId) => {
    const response = await api.get(`/neo4j/tasks/dependencies/${projectId}`);
    return response.data;
  },

  findBlockedTasks: async (projectId) => {
    const response = await api.get(`/neo4j/tasks/blocked/${projectId}`);
    return response.data;
  },

  // Communication Pattern Analysis
  logCommunication: async (fromAgent, toAgent, messageType, content) => {
    const response = await api.post('/neo4j/communication/log', {
      from_agent: fromAgent,
      to_agent: toAgent,
      message_type: messageType,
      content,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },

  getAgentCommunicationPattern: async (agentId, timeRange = '7d') => {
    const response = await api.get(`/neo4j/communication/pattern/${agentId}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  // Knowledge Graph Operations
  createKnowledgeNode: async (nodeData) => {
    const response = await api.post('/neo4j/knowledge/create', {
      type: nodeData.type, // CONCEPT, TECHNOLOGY, PATTERN, etc.
      name: nodeData.name,
      properties: nodeData.properties
    });
    return response.data;
  },

  linkKnowledgeToAgent: async (knowledgeId, agentId, relationshipType = 'KNOWS') => {
    const response = await api.post('/neo4j/knowledge/link', {
      knowledge_id: knowledgeId,
      agent_id: agentId,
      relationship: relationshipType
    });
    return response.data;
  },

  queryKnowledgeGraph: async (query) => {
    const response = await api.post('/neo4j/knowledge/query', { query });
    return response.data;
  },

  // Story/Epic Relationship Graph
  createStoryNode: async (storyData) => {
    const response = await api.post('/neo4j/stories/create', {
      story_id: storyData.id,
      title: storyData.title,
      epic_id: storyData.epicId,
      status: storyData.status,
      assigned_agents: storyData.assignedAgents
    });
    return response.data;
  },

  linkStoryToEpic: async (storyId, epicId) => {
    const response = await api.post('/neo4j/stories/link-epic', {
      story_id: storyId,
      epic_id: epicId
    });
    return response.data;
  },

  getEpicStoryTree: async (epicId) => {
    const response = await api.get(`/neo4j/stories/epic-tree/${epicId}`);
    return response.data;
  },

  // Path Finding
  findShortestPath: async (fromAgentId, toAgentId, relationshipTypes = []) => {
    const response = await api.post('/neo4j/path/shortest', {
      from: fromAgentId,
      to: toAgentId,
      relationships: relationshipTypes
    });
    return response.data;
  },

  // Graph Analytics
  getGraphStats: async () => {
    const response = await api.get('/neo4j/stats');
    return response.data;
  },

  getCentralAgents: async (limit = 10) => {
    const response = await api.get('/neo4j/analytics/central-agents', {
      params: { limit }
    });
    return response.data;
  },

  getCommunityDetection: async (projectId) => {
    const response = await api.get(`/neo4j/analytics/communities/${projectId}`);
    return response.data;
  }
};

export default neo4jService;
