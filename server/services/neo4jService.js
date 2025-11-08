/**
 * Neo4j Graph Database Service
 * Manages agent relationships, knowledge graphs, and collaboration patterns
 * Designed for the Agent Intervector Command Center
 *
 * @author DataArchitect Agent
 * @description Service for tracking agent relationships, project collaborations,
 *              and knowledge connections using Neo4j graph database
 */

const neo4j = require('neo4j-driver');

class Neo4jService {
  constructor() {
    this.driver = null;
    this.isConnected = false;
  }

  /**
   * Connect to Neo4j database
   */
  async connect() {
    try {
      if (this.driver) {
        console.log('✅ Neo4j: Already connected');
        return;
      }

      const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
      const user = process.env.NEO4J_USER || 'neo4j';
      const password = process.env.NEO4J_PASSWORD;

      if (!password) {
        throw new Error('NEO4J_PASSWORD environment variable is required');
      }

      this.driver = neo4j.driver(
        uri,
        neo4j.auth.basic(user, password),
        {
          maxConnectionPoolSize: parseInt(process.env.NEO4J_MAX_POOL_SIZE || '50'),
          connectionTimeout: parseInt(process.env.NEO4J_CONNECTION_TIMEOUT || '30000'),
        }
      );

      // Verify connectivity
      await this.driver.verifyConnectivity();
      this.isConnected = true;

      console.log('✅ Neo4j: Connected successfully');

      // Create constraints and indexes
      await this.createConstraints();

    } catch (error) {
      console.error('❌ Neo4j: Connection failed', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Create database constraints and indexes
   */
  async createConstraints() {
    const session = this.driver.session();

    try {
      // Create uniqueness constraints
      await session.run(`
        CREATE CONSTRAINT agent_id_unique IF NOT EXISTS
        FOR (a:Agent) REQUIRE a.agentId IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT project_id_unique IF NOT EXISTS
        FOR (p:Project) REQUIRE p.projectId IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT knowledge_id_unique IF NOT EXISTS
        FOR (k:Knowledge) REQUIRE k.knowledgeId IS UNIQUE
      `);

      // Create indexes for better query performance
      await session.run(`
        CREATE INDEX agent_name_index IF NOT EXISTS
        FOR (a:Agent) ON (a.name)
      `);

      await session.run(`
        CREATE INDEX agent_type_index IF NOT EXISTS
        FOR (a:Agent) ON (a.type)
      `);

      await session.run(`
        CREATE INDEX knowledge_category_index IF NOT EXISTS
        FOR (k:Knowledge) ON (k.category)
      `);

      console.log('✅ Neo4j: Constraints and indexes created');

    } catch (error) {
      console.error('❌ Neo4j: Failed to create constraints', error.message);
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a Cypher query
   */
  async query(cypher, params = {}) {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call connect() first.');
    }

    const session = this.driver.session({
      database: process.env.NEO4J_DATABASE || 'neo4j'
    });

    try {
      const result = await session.run(cypher, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a write transaction
   */
  async writeTransaction(txFunction) {
    const session = this.driver.session({
      database: process.env.NEO4J_DATABASE || 'neo4j'
    });

    try {
      return await session.executeWrite(txFunction);
    } finally {
      await session.close();
    }
  }

  /**
   * Health check for Neo4j connection
   */
  async healthCheck() {
    try {
      if (!this.driver) {
        return { status: 'disconnected', connected: false };
      }

      await this.driver.verifyConnectivity();

      const session = this.driver.session();
      const result = await session.run('CALL dbms.components() YIELD name, versions RETURN name, versions');
      await session.close();

      return {
        status: 'healthy',
        connected: true,
        database: result.records[0].toObject()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }

  // ========================================
  // AGENT NODE OPERATIONS
  // ========================================

  /**
   * Create or update an agent node
   */
  async upsertAgent(agent) {
    const cypher = `
      MERGE (a:Agent {agentId: $agentId})
      SET a.name = $name,
          a.type = $type,
          a.status = $status,
          a.specialties = $specialties,
          a.frameworks = $frameworks,
          a.languages = $languages,
          a.priority = $priority,
          a.updatedAt = datetime()
      ON CREATE SET a.createdAt = datetime()
      RETURN a
    `;

    const params = {
      agentId: agent.agentId,
      name: agent.name,
      type: agent.type,
      status: agent.status || 'online',
      specialties: agent.specialties || [],
      frameworks: agent.frameworks || [],
      languages: agent.languages || [],
      priority: agent.priority || 'MEDIUM'
    };

    const result = await this.query(cypher, params);
    return result[0]?.a.properties;
  }

  /**
   * Get agent with all relationships
   */
  async getAgent(agentId) {
    const cypher = `
      MATCH (a:Agent {agentId: $agentId})
      OPTIONAL MATCH (a)-[r]->(related)
      RETURN a, collect({type: type(r), node: related}) as relationships
    `;

    const result = await this.query(cypher, { agentId });
    return result[0];
  }

  /**
   * Get all agents
   */
  async getAllAgents() {
    const cypher = `
      MATCH (a:Agent)
      RETURN a
      ORDER BY a.name
    `;

    const result = await this.query(cypher);
    return result.map(r => r.a.properties);
  }

  // ========================================
  // COLLABORATION RELATIONSHIPS
  // ========================================

  /**
   * Record collaboration between agents
   */
  async recordCollaboration(fromAgentId, toAgentId, context = {}) {
    const cypher = `
      MATCH (a1:Agent {agentId: $fromAgentId})
      MATCH (a2:Agent {agentId: $toAgentId})
      MERGE (a1)-[r:COLLABORATED_WITH]->(a2)
      ON CREATE SET r.count = 1, r.firstCollaboration = datetime()
      ON MATCH SET r.count = r.count + 1
      SET r.lastCollaboration = datetime(),
          r.lastContext = $context
      RETURN r
    `;

    const params = {
      fromAgentId,
      toAgentId,
      context
    };

    const result = await this.query(cypher, params);
    return result[0]?.r.properties;
  }

  /**
   * Get agent collaboration network
   */
  async getCollaborationNetwork(agentId, depth = 2) {
    const cypher = `
      MATCH path = (a:Agent {agentId: $agentId})-[:COLLABORATED_WITH*1..${depth}]->(collaborator:Agent)
      RETURN DISTINCT collaborator, length(path) as distance
      ORDER BY distance, collaborator.name
    `;

    const result = await this.query(cypher, { agentId });
    return result.map(r => ({
      agent: r.collaborator.properties,
      distance: r.distance.toNumber()
    }));
  }

  /**
   * Find agents who worked on similar projects
   */
  async findSimilarAgents(agentId, limit = 5) {
    const cypher = `
      MATCH (a:Agent {agentId: $agentId})-[:WORKED_ON]->(p:Project)<-[:WORKED_ON]-(similar:Agent)
      WHERE similar.agentId <> $agentId
      RETURN similar, count(p) as sharedProjects
      ORDER BY sharedProjects DESC
      LIMIT $limit
    `;

    const result = await this.query(cypher, { agentId, limit });
    return result.map(r => ({
      agent: r.similar.properties,
      sharedProjects: r.sharedProjects.toNumber()
    }));
  }

  // ========================================
  // PROJECT RELATIONSHIPS
  // ========================================

  /**
   * Create or update a project node
   */
  async upsertProject(project) {
    const cypher = `
      MERGE (p:Project {projectId: $projectId})
      SET p.name = $name,
          p.description = $description,
          p.status = $status,
          p.technologies = $technologies,
          p.updatedAt = datetime()
      ON CREATE SET p.createdAt = datetime()
      RETURN p
    `;

    const params = {
      projectId: project.projectId,
      name: project.name,
      description: project.description || '',
      status: project.status || 'active',
      technologies: project.technologies || []
    };

    const result = await this.query(cypher, params);
    return result[0]?.p.properties;
  }

  /**
   * Link agent to project
   */
  async linkAgentToProject(agentId, projectId, role = 'contributor') {
    const cypher = `
      MATCH (a:Agent {agentId: $agentId})
      MATCH (p:Project {projectId: $projectId})
      MERGE (a)-[r:WORKED_ON]->(p)
      SET r.role = $role,
          r.lastActivity = datetime()
      ON CREATE SET r.startedAt = datetime()
      RETURN r
    `;

    const result = await this.query(cypher, { agentId, projectId, role });
    return result[0]?.r.properties;
  }

  /**
   * Get all agents working on a project
   */
  async getProjectAgents(projectId) {
    const cypher = `
      MATCH (a:Agent)-[r:WORKED_ON]->(p:Project {projectId: $projectId})
      RETURN a, r.role as role
      ORDER BY a.name
    `;

    const result = await this.query(cypher, { projectId });
    return result.map(r => ({
      agent: r.a.properties,
      role: r.role
    }));
  }

  // ========================================
  // KNOWLEDGE GRAPH OPERATIONS
  // ========================================

  /**
   * Create knowledge node
   */
  async createKnowledgeNode(knowledge) {
    const cypher = `
      CREATE (k:Knowledge {
        knowledgeId: $knowledgeId,
        title: $title,
        category: $category,
        type: $type,
        tags: $tags,
        createdBy: $createdBy,
        createdAt: datetime()
      })
      RETURN k
    `;

    const params = {
      knowledgeId: knowledge.knowledgeId,
      title: knowledge.title,
      category: knowledge.category,
      type: knowledge.type,
      tags: knowledge.tags || [],
      createdBy: knowledge.createdBy
    };

    const result = await this.query(cypher, params);
    return result[0]?.k.properties;
  }

  /**
   * Link knowledge to agent (who created/uses it)
   */
  async linkKnowledgeToAgent(knowledgeId, agentId, relationship = 'CREATED') {
    const cypher = `
      MATCH (k:Knowledge {knowledgeId: $knowledgeId})
      MATCH (a:Agent {agentId: $agentId})
      MERGE (a)-[r:${relationship}]->(k)
      SET r.timestamp = datetime()
      RETURN r
    `;

    const result = await this.query(cypher, { knowledgeId, agentId });
    return result[0]?.r.properties;
  }

  /**
   * Link related knowledge items
   */
  async linkRelatedKnowledge(knowledgeId1, knowledgeId2, relationshipType = 'RELATES_TO') {
    const cypher = `
      MATCH (k1:Knowledge {knowledgeId: $knowledgeId1})
      MATCH (k2:Knowledge {knowledgeId: $knowledgeId2})
      MERGE (k1)-[r:${relationshipType}]-(k2)
      SET r.timestamp = datetime()
      RETURN r
    `;

    const result = await this.query(cypher, { knowledgeId1, knowledgeId2 });
    return result[0]?.r.properties;
  }

  /**
   * Find related knowledge
   */
  async findRelatedKnowledge(knowledgeId, depth = 2, limit = 10) {
    const cypher = `
      MATCH path = (k:Knowledge {knowledgeId: $knowledgeId})-[*1..${depth}]-(related:Knowledge)
      WHERE related.knowledgeId <> $knowledgeId
      RETURN DISTINCT related, length(path) as distance
      ORDER BY distance, related.createdAt DESC
      LIMIT $limit
    `;

    const result = await this.query(cypher, { knowledgeId, limit });
    return result.map(r => ({
      knowledge: r.related.properties,
      distance: r.distance.toNumber()
    }));
  }

  /**
   * Get knowledge by category
   */
  async getKnowledgeByCategory(category, limit = 20) {
    const cypher = `
      MATCH (k:Knowledge {category: $category})
      RETURN k
      ORDER BY k.createdAt DESC
      LIMIT $limit
    `;

    const result = await this.query(cypher, { category, limit });
    return result.map(r => r.k.properties);
  }

  // ========================================
  // ANALYTICS & INSIGHTS
  // ========================================

  /**
   * Get agent collaboration statistics
   */
  async getCollaborationStats() {
    const cypher = `
      MATCH (a:Agent)-[r:COLLABORATED_WITH]->(b:Agent)
      RETURN
        count(DISTINCT a) as totalAgents,
        count(r) as totalCollaborations,
        avg(r.count) as avgCollaborationsPerPair,
        max(r.count) as maxCollaborations
    `;

    const result = await this.query(cypher);
    return result[0];
  }

  /**
   * Get most connected agents
   */
  async getMostConnectedAgents(limit = 10) {
    const cypher = `
      MATCH (a:Agent)-[r:COLLABORATED_WITH]-(other:Agent)
      RETURN a, count(DISTINCT other) as connections
      ORDER BY connections DESC
      LIMIT $limit
    `;

    const result = await this.query(cypher, { limit });
    return result.map(r => ({
      agent: r.a.properties,
      connections: r.connections.toNumber()
    }));
  }

  /**
   * Get knowledge distribution by category
   */
  async getKnowledgeDistribution() {
    const cypher = `
      MATCH (k:Knowledge)
      RETURN k.category as category, count(k) as count
      ORDER BY count DESC
    `;

    const result = await this.query(cypher);
    return result.map(r => ({
      category: r.category,
      count: r.count.toNumber()
    }));
  }

  /**
   * Find knowledge experts (agents with most knowledge in a category)
   */
  async findKnowledgeExperts(category, limit = 5) {
    const cypher = `
      MATCH (a:Agent)-[:CREATED]->(k:Knowledge {category: $category})
      RETURN a, count(k) as knowledgeCount
      ORDER BY knowledgeCount DESC
      LIMIT $limit
    `;

    const result = await this.query(cypher, { category, limit });
    return result.map(r => ({
      agent: r.a.properties,
      knowledgeCount: r.knowledgeCount.toNumber()
    }));
  }

  /**
   * Close Neo4j connection
   */
  async disconnect() {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.isConnected = false;
      console.log('✅ Neo4j: Disconnected');
    }
  }
}

// Export singleton instance
module.exports = new Neo4jService();
