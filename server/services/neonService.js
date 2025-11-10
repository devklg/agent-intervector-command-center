/**
 * Neon PostgreSQL Service
 * Handles all interactions with Neon PostgreSQL database for knowledge base storage
 * Designed for the Agent Intervector Command Center
 *
 * @author DataArchitect Agent
 * @description Service for managing agent knowledge, framework docs, troubleshooting,
 *              code patterns, story learnings, and agent expertise
 */

const { Pool } = require('pg');

class NeonService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize connection pool to Neon PostgreSQL
   */
  async connect() {
    try {
      if (this.pool) {
        console.log('✅ Neon PostgreSQL: Already connected');
        return;
      }

      const config = {
        connectionString: process.env.NEON_DATABASE_URL,
        max: parseInt(process.env.NEON_POOL_MAX || '20'),
        idleTimeoutMillis: parseInt(process.env.NEON_POOL_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.NEON_CONNECTION_TIMEOUT || '10000'),
        ssl: {
          rejectUnauthorized: false
        }
      };

      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('✅ Neon PostgreSQL: Connected successfully');

      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('❌ Neon PostgreSQL: Unexpected pool error', err);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ Neon PostgreSQL: Connection failed', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Execute a query with automatic retry logic
   */
  async query(text, params = []) {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.pool.query(text, params);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`❌ Query attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }
    return await this.pool.connect();
  }

  /**
   * Health check for the database connection
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time, version() as version');
      return {
        status: 'healthy',
        connected: this.isConnected,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version
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
  // AGENT KNOWLEDGE OPERATIONS
  // ========================================

  /**
   * Create a new knowledge entry
   */
  async createKnowledge(knowledge) {
    const query = `
      INSERT INTO agent_knowledge
        (agent_id, knowledge_type, title, content, category, tags, source, metadata, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      knowledge.agent_id,
      knowledge.knowledge_type,
      knowledge.title,
      knowledge.content,
      knowledge.category || 'general',
      JSON.stringify(knowledge.tags || []),
      knowledge.source || 'manual',
      JSON.stringify(knowledge.metadata || {}),
      knowledge.created_by
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get knowledge entries with filtering
   */
  async getKnowledge(filters = {}) {
    let query = 'SELECT * FROM agent_knowledge WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.agent_id) {
      query += ` AND agent_id = $${paramCount}`;
      values.push(filters.agent_id);
      paramCount++;
    }

    if (filters.knowledge_type) {
      query += ` AND knowledge_type = $${paramCount}`;
      values.push(filters.knowledge_type);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    const result = await this.query(query, values);
    return result.rows;
  }

  /**
   * Update knowledge entry
   */
  async updateKnowledge(id, updates) {
    const query = `
      UPDATE agent_knowledge
      SET
        title = COALESCE($2, title),
        content = COALESCE($3, content),
        category = COALESCE($4, category),
        tags = COALESCE($5, tags),
        metadata = COALESCE($6, metadata),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      updates.title,
      updates.content,
      updates.category,
      updates.tags ? JSON.stringify(updates.tags) : null,
      updates.metadata ? JSON.stringify(updates.metadata) : null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete knowledge entry
   */
  async deleteKnowledge(id) {
    const query = 'DELETE FROM agent_knowledge WHERE id = $1 RETURNING *';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // ========================================
  // FRAMEWORK DOCUMENTATION OPERATIONS
  // ========================================

  /**
   * Store framework documentation
   */
  async createFrameworkDoc(doc) {
    const query = `
      INSERT INTO framework_docs
        (framework_name, version, section, title, content, code_examples, links, tags, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      doc.framework_name,
      doc.version,
      doc.section,
      doc.title,
      doc.content,
      JSON.stringify(doc.code_examples || []),
      JSON.stringify(doc.links || []),
      JSON.stringify(doc.tags || []),
      doc.created_by
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get framework documentation
   */
  async getFrameworkDocs(filters = {}) {
    let query = 'SELECT * FROM framework_docs WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.framework_name) {
      query += ` AND framework_name = $${paramCount}`;
      values.push(filters.framework_name);
      paramCount++;
    }

    if (filters.version) {
      query += ` AND version = $${paramCount}`;
      values.push(filters.version);
      paramCount++;
    }

    if (filters.section) {
      query += ` AND section = $${paramCount}`;
      values.push(filters.section);
      paramCount++;
    }

    query += ' ORDER BY framework_name, version DESC, section, created_at DESC';

    const result = await this.query(query, values);
    return result.rows;
  }

  // ========================================
  // TROUBLESHOOTING OPERATIONS
  // ========================================

  /**
   * Store troubleshooting entry
   */
  async createTroubleshooting(entry) {
    const query = `
      INSERT INTO troubleshooting
        (problem_type, error_message, context, solution, steps_taken, related_files, agent_id, project_id, tags, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      entry.problem_type,
      entry.error_message,
      entry.context,
      entry.solution,
      JSON.stringify(entry.steps_taken || []),
      JSON.stringify(entry.related_files || []),
      entry.agent_id,
      entry.project_id,
      JSON.stringify(entry.tags || []),
      entry.created_by
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Search troubleshooting entries
   */
  async searchTroubleshooting(filters = {}) {
    let query = 'SELECT * FROM troubleshooting WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.problem_type) {
      query += ` AND problem_type = $${paramCount}`;
      values.push(filters.problem_type);
      paramCount++;
    }

    if (filters.error_search) {
      query += ` AND error_message ILIKE $${paramCount}`;
      values.push(`%${filters.error_search}%`);
      paramCount++;
    }

    if (filters.agent_id) {
      query += ` AND agent_id = $${paramCount}`;
      values.push(filters.agent_id);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await this.query(query, values);
    return result.rows;
  }

  // ========================================
  // CODE PATTERNS OPERATIONS
  // ========================================

  /**
   * Store code pattern
   */
  async createCodePattern(pattern) {
    const query = `
      INSERT INTO code_patterns
        (pattern_name, language, category, description, code_snippet, use_cases, best_practices, anti_patterns, tags, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      pattern.pattern_name,
      pattern.language,
      pattern.category,
      pattern.description,
      pattern.code_snippet,
      JSON.stringify(pattern.use_cases || []),
      JSON.stringify(pattern.best_practices || []),
      JSON.stringify(pattern.anti_patterns || []),
      JSON.stringify(pattern.tags || []),
      pattern.created_by
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get code patterns
   */
  async getCodePatterns(filters = {}) {
    let query = 'SELECT * FROM code_patterns WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.language) {
      query += ` AND language = $${paramCount}`;
      values.push(filters.language);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (pattern_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY usage_count DESC, created_at DESC';

    const result = await this.query(query, values);
    return result.rows;
  }

  /**
   * Increment pattern usage count
   */
  async incrementPatternUsage(id) {
    const query = `
      UPDATE code_patterns
      SET usage_count = usage_count + 1, last_used_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // ========================================
  // STORY LEARNINGS OPERATIONS
  // ========================================

  /**
   * Store story learning
   */
  async createStoryLearning(learning) {
    const query = `
      INSERT INTO story_learnings
        (story_id, story_title, project_id, agent_id, learning_type, description, challenges_faced, solutions_applied, code_snippets, time_saved_minutes, complexity_rating, tags, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      learning.story_id,
      learning.story_title,
      learning.project_id,
      learning.agent_id,
      learning.learning_type,
      learning.description,
      JSON.stringify(learning.challenges_faced || []),
      JSON.stringify(learning.solutions_applied || []),
      JSON.stringify(learning.code_snippets || []),
      learning.time_saved_minutes || 0,
      learning.complexity_rating || 'medium',
      JSON.stringify(learning.tags || []),
      learning.created_by
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get story learnings
   */
  async getStoryLearnings(filters = {}) {
    let query = 'SELECT * FROM story_learnings WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.project_id) {
      query += ` AND project_id = $${paramCount}`;
      values.push(filters.project_id);
      paramCount++;
    }

    if (filters.agent_id) {
      query += ` AND agent_id = $${paramCount}`;
      values.push(filters.agent_id);
      paramCount++;
    }

    if (filters.learning_type) {
      query += ` AND learning_type = $${paramCount}`;
      values.push(filters.learning_type);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.query(query, values);
    return result.rows;
  }

  // ========================================
  // AGENT EXPERTISE OPERATIONS
  // ========================================

  /**
   * Update agent expertise
   */
  async upsertAgentExpertise(expertise) {
    const query = `
      INSERT INTO agent_expertise
        (agent_id, agent_name, specialties, frameworks, languages, domains, skill_level, total_contributions, successful_tasks, failed_tasks, avg_task_time_minutes, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (agent_id)
      DO UPDATE SET
        agent_name = EXCLUDED.agent_name,
        specialties = EXCLUDED.specialties,
        frameworks = EXCLUDED.frameworks,
        languages = EXCLUDED.languages,
        domains = EXCLUDED.domains,
        skill_level = EXCLUDED.skill_level,
        total_contributions = EXCLUDED.total_contributions,
        successful_tasks = EXCLUDED.successful_tasks,
        failed_tasks = EXCLUDED.failed_tasks,
        avg_task_time_minutes = EXCLUDED.avg_task_time_minutes,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      expertise.agent_id,
      expertise.agent_name,
      JSON.stringify(expertise.specialties || []),
      JSON.stringify(expertise.frameworks || []),
      JSON.stringify(expertise.languages || []),
      JSON.stringify(expertise.domains || []),
      expertise.skill_level || 'intermediate',
      expertise.total_contributions || 0,
      expertise.successful_tasks || 0,
      expertise.failed_tasks || 0,
      expertise.avg_task_time_minutes || 0,
      JSON.stringify(expertise.metadata || {})
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get agent expertise
   */
  async getAgentExpertise(agentId) {
    const query = 'SELECT * FROM agent_expertise WHERE agent_id = $1';
    const result = await this.query(query, [agentId]);
    return result.rows[0];
  }

  /**
   * Get all agents expertise
   */
  async getAllAgentsExpertise(filters = {}) {
    let query = 'SELECT * FROM agent_expertise WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.skill_level) {
      query += ` AND skill_level = $${paramCount}`;
      values.push(filters.skill_level);
      paramCount++;
    }

    query += ' ORDER BY total_contributions DESC';

    const result = await this.query(query, values);
    return result.rows;
  }

  /**
   * Close database connection pool
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('✅ Neon PostgreSQL: Disconnected');
    }
  }
}

// Export singleton instance
module.exports = new NeonService();
