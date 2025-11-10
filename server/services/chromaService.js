const axios = require('axios');

class ChromaService {
  constructor() {
    this.baseURL = process.env.CHROMA_API_URL || 'http://localhost:8000';
    this.tenant = 'default_tenant';
    this.database = 'default_database';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    this.collections = {};
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.ensureCollections();
      this.initialized = true;
      console.log('✅ ChromaDB Service initialized successfully');
    } catch (error) {
      console.error('❌ ChromaDB initialization error:', error.message);
      throw error;
    }
  }

  async getCollection(name) {
    if (!this.collections[name]) {
      try {
        // v2 API: Create collection under tenant/database hierarchy
        const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections`;

        // First try to list collections and find existing one
        const listResponse = await this.client.get(endpoint);
        const existingCollection = listResponse.data.find(col => col.name === name);

        if (existingCollection) {
          this.collections[name] = {
            id: existingCollection.id,
            name: existingCollection.name
          };
        } else {
          // Create new collection
          const createResponse = await this.client.post(endpoint, {
            name,
            metadata: {
              description: `Collection for ${name}`,
              created_by: 'agent_command_center',
              purpose: 'intervector_communication'
            }
          });
          this.collections[name] = {
            id: createResponse.data.id,
            name: createResponse.data.name
          };
        }
      } catch (error) {
        console.error(`Error getting/creating collection ${name}:`, error.message);
        throw error;
      }
    }
    return this.collections[name];
  }

  // Agent Message Operations
  async addMessage(message) {
    try {
      await this.initialize();
      const collection = await this.getCollection('agent_message_log');

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/add`;

      await this.client.post(endpoint, {
        ids: [message.id],
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
        embeddings: [[]]  // Empty embedding for now
      });

      return { success: true, id: message.id };
    } catch (error) {
      console.error('ChromaDB add message error:', error.message);
      throw new Error('Failed to add message to ChromaDB');
    }
  }

  async getMessages(filters = {}) {
    try {
      await this.initialize();
      const collection = await this.getCollection('agent_message_log');

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/get`;

      const response = await this.client.post(endpoint, {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        include: ['documents', 'metadatas'],
        where: filters.where
      });

      const results = response.data;

      // Handle empty results
      if (!results.documents || results.documents.length === 0) {
        return { messages: [], total: 0 };
      }

      return {
        messages: results.documents.map((doc, i) => ({
          ...JSON.parse(doc),
          metadata: results.metadatas[i]
        })),
        total: results.documents.length
      };
    } catch (error) {
      console.error('ChromaDB get messages error:', error.message);
      throw new Error('Failed to retrieve messages from ChromaDB');
    }
  }

  async searchMessages(query, filters = {}) {
    try {
      await this.initialize();
      const collection = await this.getCollection('agent_message_log');

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/query`;

      const response = await this.client.post(endpoint, {
        query_texts: [query],
        n_results: filters.limit || 10,
        include: ['documents', 'metadatas', 'distances'],
        where: filters.where
      });

      const results = response.data;

      // Handle empty results
      if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
        return { messages: [], total: 0 };
      }

      return {
        messages: results.documents[0].map((doc, i) => ({
          ...JSON.parse(doc),
          metadata: results.metadatas[0][i],
          similarity: results.distances[0][i]
        })),
        total: results.documents[0].length
      };
    } catch (error) {
      console.error('ChromaDB search messages error:', error.message);
      throw new Error('Failed to search messages in ChromaDB');
    }
  }

  // Agent Directory Operations
  async updateAgentStatus(agentId, status) {
    try {
      await this.initialize();
      const collection = await this.getCollection('agent_directory');

      const agentData = {
        id: `agent_${agentId}`,
        agent_name: agentId,
        status: status.status || 'online',
        current_task: status.current_task || null,
        last_seen: new Date().toISOString(),
        specialization: status.specialization || null,
        performance_metrics: status.performance_metrics || {}
      };

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/upsert`;

      await this.client.post(endpoint, {
        ids: [agentData.id],
        documents: [JSON.stringify(agentData)],
        metadatas: [{
          agent_name: agentId,
          status: agentData.status,
          agent_type: status.agent_type || 'coordinator',
          last_seen: agentData.last_seen,
          specialties: status.specialties || ''
        }],
        embeddings: [[]]  // Empty embedding for now
      });

      return agentData;
    } catch (error) {
      console.error('ChromaDB update agent status error:', error.message);
      throw new Error('Failed to update agent status in ChromaDB');
    }
  }

  async getAgentDirectory() {
    try {
      await this.initialize();
      const collection = await this.getCollection('agent_directory');

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/get`;

      const response = await this.client.post(endpoint, {
        include: ['documents', 'metadatas']
      });

      const results = response.data;

      // Handle empty results
      if (!results.documents || results.documents.length === 0) {
        return [];
      }

      return results.documents.map((doc, i) => ({
        ...JSON.parse(doc),
        metadata: results.metadatas[i]
      }));
    } catch (error) {
      console.error('ChromaDB get agent directory error:', error.message);
      throw new Error('Failed to retrieve agent directory from ChromaDB');
    }
  }

  // Restore Point Operations
  async createRestorePoint(restorePoint) {
    try {
      await this.initialize();
      const collection = await this.getCollection('session_restore_context');

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/add`;

      await this.client.post(endpoint, {
        ids: [restorePoint.id],
        documents: [JSON.stringify(restorePoint)],
        metadatas: [{
          type: restorePoint.type,
          created_by: restorePoint.created_by,
          timestamp: restorePoint.timestamp,
          priority: restorePoint.metadata.priority,
          tags: restorePoint.metadata.tags.join(','),
          restore_complexity: restorePoint.metadata.restore_complexity
        }],
        embeddings: [[]]  // Empty embedding for now
      });

      return { success: true, id: restorePoint.id };
    } catch (error) {
      console.error('ChromaDB create restore point error:', error.message);
      throw new Error('Failed to create restore point in ChromaDB');
    }
  }

  async getRestorePoints(limit = 20) {
    try {
      await this.initialize();
      const collection = await this.getCollection('session_restore_context');

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/get`;

      const response = await this.client.post(endpoint, {
        limit: limit,
        include: ['documents', 'metadatas']
      });

      const results = response.data;

      // Handle empty results
      if (!results.documents || results.documents.length === 0) {
        return [];
      }

      return results.documents.map((doc, i) => ({
        ...JSON.parse(doc),
        metadata: results.metadatas[i]
      }));
    } catch (error) {
      console.error('ChromaDB get restore points error:', error.message);
      throw new Error('Failed to retrieve restore points from ChromaDB');
    }
  }

  async searchRestorePoints(query, limit = 10) {
    try {
      await this.initialize();
      const collection = await this.getCollection('session_restore_context');

      const endpoint = `/api/v2/tenants/${this.tenant}/databases/${this.database}/collections/${collection.id}/query`;

      const response = await this.client.post(endpoint, {
        query_texts: [query],
        n_results: limit,
        include: ['documents', 'metadatas', 'distances']
      });

      const results = response.data;

      // Handle empty results
      if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
        return [];
      }

      return results.documents[0].map((doc, i) => ({
        ...JSON.parse(doc),
        metadata: results.metadatas[0][i],
        similarity: results.distances[0][i]
      }));
    } catch (error) {
      console.error('ChromaDB search restore points error:', error.message);
      throw new Error('Failed to search restore points in ChromaDB');
    }
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await this.client.get('/api/v2/heartbeat');
      return {
        status: 'healthy',
        chromadb_heartbeat: response.data,
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
      for (const collectionName of collections) {
        await this.getCollection(collectionName);
      }
      console.log('✅ ChromaDB collections verified/created');
    } catch (error) {
      console.log('⚠️  ChromaDB collections setup warning:', error.message);
      throw error;
    }
  }
}

module.exports = new ChromaService();
