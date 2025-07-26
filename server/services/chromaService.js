const axios = require('axios');

class ChromaService {
  constructor() {
    this.baseURL = process.env.CHROMA_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Agent Message Operations
  async addMessage(message) {
    try {
      const response = await this.client.post('/api/v1/collections/agent_message_log/add', {
        documents: [JSON.stringify(message)],
        metadatas: [{
          from_agent: message.from_agent,
          to_agent: message.to_agent,
          message_type: message.message_type,
          priority: message.priority,
          timestamp: message.timestamp,
          thread_id: message.thread_id || null,
          status: message.status || 'delivered'
        }],
        ids: [message.id]
      });
      return response.data;
    } catch (error) {
      console.error('ChromaDB add message error:', error.message);
      throw new Error('Failed to add message to ChromaDB');
    }
  }

  async getMessages(filters = {}) {
    try {
      const params = {
        include: ['documents', 'metadatas'],
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

      if (filters.where) {
        params.where = filters.where;
      }

      const response = await this.client.post('/api/v1/collections/agent_message_log/get', params);
      
      return {
        messages: response.data.documents.map((doc, i) => ({
          ...JSON.parse(doc),
          metadata: response.data.metadatas[i]
        })),
        total: response.data.documents.length
      };
    } catch (error) {
      console.error('ChromaDB get messages error:', error.message);
      throw new Error('Failed to retrieve messages from ChromaDB');
    }
  }

  async searchMessages(query, filters = {}) {
    try {
      const response = await this.client.post('/api/v1/collections/agent_message_log/query', {
        query_texts: [query],
        n_results: filters.limit || 10,
        where: filters.where,
        include: ['documents', 'metadatas', 'distances']
      });

      return {
        messages: response.data.documents[0].map((doc, i) => ({
          ...JSON.parse(doc),
          metadata: response.data.metadatas[0][i],
          similarity: response.data.distances[0][i]
        })),
        total: response.data.documents[0].length
      };
    } catch (error) {
      console.error('ChromaDB search messages error:', error.message);
      throw new Error('Failed to search messages in ChromaDB');
    }
  }

  // Agent Directory Operations
  async updateAgentStatus(agentId, status) {
    try {
      const agentData = {
        id: `agent_${agentId}`,
        agent_name: agentId,
        status: status.status || 'online',
        current_task: status.current_task || null,
        last_seen: new Date().toISOString(),
        specialization: status.specialization || null,
        performance_metrics: status.performance_metrics || {}
      };

      await this.client.post('/api/v1/collections/agent_directory/upsert', {
        documents: [JSON.stringify(agentData)],
        metadatas: [{
          agent_name: agentId,
          status: agentData.status,
          agent_type: status.agent_type || 'coordinator',
          last_seen: agentData.last_seen,
          specialties: status.specialties || ''
        }],
        ids: [agentData.id]
      });

      return agentData;
    } catch (error) {
      console.error('ChromaDB update agent status error:', error.message);
      throw new Error('Failed to update agent status in ChromaDB');
    }
  }

  async getAgentDirectory() {
    try {
      const response = await this.client.post('/api/v1/collections/agent_directory/get', {
        include: ['documents', 'metadatas']
      });

      return response.data.documents.map((doc, i) => ({
        ...JSON.parse(doc),
        metadata: response.data.metadatas[i]
      }));
    } catch (error) {
      console.error('ChromaDB get agent directory error:', error.message);
      throw new Error('Failed to retrieve agent directory from ChromaDB');
    }
  }

  // Restore Point Operations
  async createRestorePoint(restorePoint) {
    try {
      const response = await this.client.post('/api/v1/collections/session_restore_context/add', {
        documents: [JSON.stringify(restorePoint)],
        metadatas: [{
          type: restorePoint.type,
          created_by: restorePoint.created_by,
          timestamp: restorePoint.timestamp,
          priority: restorePoint.metadata.priority,
          tags: restorePoint.metadata.tags.join(','),
          restore_complexity: restorePoint.metadata.restore_complexity
        }],
        ids: [restorePoint.id]
      });
      return response.data;
    } catch (error) {
      console.error('ChromaDB create restore point error:', error.message);
      throw new Error('Failed to create restore point in ChromaDB');
    }
  }

  async getRestorePoints(limit = 20) {
    try {
      const response = await this.client.post('/api/v1/collections/session_restore_context/get', {
        include: ['documents', 'metadatas'],
        limit: limit
      });

      return response.data.documents.map((doc, i) => ({
        ...JSON.parse(doc),
        metadata: response.data.metadatas[i]
      }));
    } catch (error) {
      console.error('ChromaDB get restore points error:', error.message);
      throw new Error('Failed to retrieve restore points from ChromaDB');
    }
  }

  async searchRestorePoints(query, limit = 10) {
    try {
      const response = await this.client.post('/api/v1/collections/session_restore_context/query', {
        query_texts: [query],
        n_results: limit,
        include: ['documents', 'metadatas', 'distances']
      });

      return response.data.documents[0].map((doc, i) => ({
        ...JSON.parse(doc),
        metadata: response.data.metadatas[0][i],
        similarity: response.data.distances[0][i]
      }));
    } catch (error) {
      console.error('ChromaDB search restore points error:', error.message);
      throw new Error('Failed to search restore points in ChromaDB');
    }
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await this.client.get('/api/v1/heartbeat');
      return {
        status: 'healthy',
        chromadb_version: response.data.nanosecond_heartbeat,
        connection: 'active'
      };
    } catch (error) {
      console.error('ChromaDB health check error:', error.message);
      return {
        status: 'unhealthy',
        error: error.message,
        connection: 'failed'
      };
    }
  }

  // Collection Management
  async ensureCollections() {
    const collections = [
      'agent_message_log',
      'agent_directory', 
      'session_restore_context',
      'command_center_knowledge',
      'command_center_intelligence'
    ];

    try {
      for (const collection of collections) {
        await this.client.post('/api/v1/collections', {
          name: collection,
          metadata: {
            description: `Collection for ${collection}`,
            created_by: 'agent_command_center',
            purpose: 'intervector_communication'
          }
        });
      }
      console.log('✅ ChromaDB collections verified/created');
    } catch (error) {
      // Collections might already exist, which is fine
      console.log('ℹ️  ChromaDB collections already exist or error:', error.message);
    }
  }
}

module.exports = new ChromaService();