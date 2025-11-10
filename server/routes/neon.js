/**
 * Neon PostgreSQL API Routes
 * Handles project data, restore points, agent expertise, and knowledge management
 */

const express = require('express');
const router = express.Router();
const neonService = require('../services/neonService');

// ========================================
// PROJECT OPERATIONS
// ========================================

/**
 * POST /api/neon/projects/init
 * Initialize a new project
 */
router.post('/projects/init', async (req, res) => {
  try {
    const { name, description, metadata } = req.body;

    const query = `
      INSERT INTO projects (name, description, metadata, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;

    const result = await neonService.query(query, [
      name,
      description || '',
      JSON.stringify(metadata || {})
    ]);

    res.status(201).json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Initialize project error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/projects/:projectId
 * Get project details
 */
router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const query = 'SELECT * FROM projects WHERE id = $1';
    const result = await neonService.query(query, [projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// BRANCH MANAGEMENT (Neon's unique feature)
// ========================================

/**
 * POST /api/neon/branches/create
 * Create a new branch
 */
router.post('/branches/create', async (req, res) => {
  try {
    const { project_id, branch_name, parent_branch } = req.body;

    const query = `
      INSERT INTO branches (project_id, branch_name, parent_branch, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;

    const result = await neonService.query(query, [
      project_id,
      branch_name,
      parent_branch || 'main'
    ]);

    res.status(201).json({
      success: true,
      branch: result.rows[0]
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/branches/:projectId
 * List all branches for a project
 */
router.get('/branches/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const query = `
      SELECT * FROM branches
      WHERE project_id = $1
      ORDER BY created_at DESC
    `;

    const result = await neonService.query(query, [projectId]);

    res.json({
      success: true,
      projectId,
      branches: result.rows
    });
  } catch (error) {
    console.error('List branches error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neon/branches/switch
 * Switch active branch
 */
router.post('/branches/switch', async (req, res) => {
  try {
    const { project_id, branch_name } = req.body;

    const query = `
      UPDATE projects
      SET current_branch = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await neonService.query(query, [project_id, branch_name]);

    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Switch branch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neon/branches/merge
 * Merge branches
 */
router.post('/branches/merge', async (req, res) => {
  try {
    const { project_id, source_branch, target_branch } = req.body;

    // This is a simplified merge - in production you'd have more complex logic
    const query = `
      INSERT INTO branch_merges (project_id, source_branch, target_branch, merged_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;

    const result = await neonService.query(query, [
      project_id,
      source_branch,
      target_branch || 'main'
    ]);

    res.json({
      success: true,
      merge: result.rows[0]
    });
  } catch (error) {
    console.error('Merge branch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// AGENT DATA STORAGE
// ========================================

/**
 * POST /api/neon/agents
 * Store agent data
 */
router.post('/agents', async (req, res) => {
  try {
    const agentData = req.body;

    const query = `
      INSERT INTO agents (agent_id, agent_name, agent_type, metadata, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (agent_id)
      DO UPDATE SET
        agent_name = EXCLUDED.agent_name,
        agent_type = EXCLUDED.agent_type,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await neonService.query(query, [
      agentData.agent_id,
      agentData.agent_name,
      agentData.agent_type,
      JSON.stringify(agentData.metadata || {})
    ]);

    res.json({
      success: true,
      agent: result.rows[0]
    });
  } catch (error) {
    console.error('Store agent data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/agents/:agentId/history
 * Get agent history
 */
router.get('/agents/:agentId/history', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const query = `
      SELECT * FROM agent_history
      WHERE agent_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await neonService.query(query, [
      agentId,
      parseInt(limit),
      parseInt(offset)
    ]);

    res.json({
      success: true,
      agentId,
      history: result.rows
    });
  } catch (error) {
    console.error('Get agent history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/neon/agents/:agentId/status
 * Update agent status
 */
router.put('/agents/:agentId/status', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status, metadata } = req.body;

    const query = `
      UPDATE agents
      SET status = $2, metadata = $3, updated_at = NOW()
      WHERE agent_id = $1
      RETURNING *
    `;

    const result = await neonService.query(query, [
      agentId,
      status,
      JSON.stringify(metadata || {})
    ]);

    res.json({
      success: true,
      agent: result.rows[0]
    });
  } catch (error) {
    console.error('Update agent status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// STORY AND TASK MANAGEMENT
// ========================================

/**
 * POST /api/neon/stories
 * Create a story
 */
router.post('/stories', async (req, res) => {
  try {
    const story = req.body;

    const query = `
      INSERT INTO stories (
        id, epic_id, title, description, status, priority,
        assigned_agents, acceptance_criteria, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;

    const result = await neonService.query(query, [
      story.id,
      story.epic_id,
      story.title,
      story.description,
      story.status || 'pending',
      story.priority || 'medium',
      JSON.stringify(story.assigned_agents || []),
      JSON.stringify(story.acceptance_criteria || []),
      JSON.stringify(story.metadata || {})
    ]);

    res.status(201).json({
      success: true,
      story: result.rows[0]
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/neon/stories/:storyId
 * Update a story
 */
router.put('/stories/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const updates = req.body;

    const query = `
      UPDATE stories
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        status = COALESCE($4, status),
        priority = COALESCE($5, priority),
        metadata = COALESCE($6, metadata),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await neonService.query(query, [
      storyId,
      updates.title,
      updates.description,
      updates.status,
      updates.priority,
      updates.metadata ? JSON.stringify(updates.metadata) : null
    ]);

    res.json({
      success: true,
      story: result.rows[0]
    });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/stories/by-status
 * Get stories by status
 */
router.get('/stories/by-status', async (req, res) => {
  try {
    const { project_id, status } = req.query;

    const query = `
      SELECT * FROM stories
      WHERE 1=1
        ${project_id ? 'AND epic_id LIKE $1' : ''}
        ${status ? 'AND status = $2' : ''}
      ORDER BY created_at DESC
    `;

    const params = [];
    if (project_id) params.push(`${project_id}%`);
    if (status) params.push(status);

    const result = await neonService.query(query, params);

    res.json({
      success: true,
      stories: result.rows
    });
  } catch (error) {
    console.error('Get stories by status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// SESSION AND RESTORE POINTS
// ========================================

/**
 * POST /api/neon/restore-points
 * Create a restore point
 */
router.post('/restore-points', async (req, res) => {
  try {
    const rp = req.body;

    const query = `
      INSERT INTO restore_points (
        name, description, project_id, branch_name,
        context_data, tags, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const result = await neonService.query(query, [
      rp.name,
      rp.description,
      rp.projectId,
      rp.branchName || 'main',
      JSON.stringify(rp.contextData || {}),
      JSON.stringify(rp.tags || []),
      JSON.stringify(rp.metadata || {})
    ]);

    res.status(201).json({
      success: true,
      restore_point: result.rows[0]
    });
  } catch (error) {
    console.error('Create restore point error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/restore-points/:projectId
 * List restore points for a project
 */
router.get('/restore-points/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, sort = 'created_at_desc' } = req.query;

    const sortClause = sort === 'created_at_desc' ? 'created_at DESC' : 'created_at ASC';

    const query = `
      SELECT * FROM restore_points
      WHERE project_id = $1
      ORDER BY ${sortClause}
      LIMIT $2
    `;

    const result = await neonService.query(query, [projectId, parseInt(limit)]);

    res.json({
      success: true,
      projectId,
      restore_points: result.rows
    });
  } catch (error) {
    console.error('List restore points error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neon/restore-points/:restorePointId/restore
 * Restore from a point
 */
router.post('/restore-points/:restorePointId/restore', async (req, res) => {
  try {
    const { restorePointId } = req.params;

    // Get the restore point
    const query = 'SELECT * FROM restore_points WHERE id = $1';
    const result = await neonService.query(query, [restorePointId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Restore point not found'
      });
    }

    const restorePoint = result.rows[0];

    // Log the restoration
    const logQuery = `
      INSERT INTO restore_logs (restore_point_id, restored_at, metadata)
      VALUES ($1, NOW(), $2)
      RETURNING *
    `;

    const logResult = await neonService.query(logQuery, [
      restorePointId,
      JSON.stringify({ restored_by: 'user' })
    ]);

    res.json({
      success: true,
      restore_point: restorePoint,
      restore_log: logResult.rows[0]
    });
  } catch (error) {
    console.error('Restore from point error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// COMMUNICATION LOGS
// ========================================

/**
 * POST /api/neon/communications
 * Log communication
 */
router.post('/communications', async (req, res) => {
  try {
    const comm = req.body;

    const query = `
      INSERT INTO communications (
        from_agent, to_agent, message_type, content,
        priority, metadata, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await neonService.query(query, [
      comm.from_agent,
      comm.to_agent,
      comm.message_type,
      comm.content,
      comm.priority || 'normal',
      JSON.stringify(comm.metadata || {}),
      comm.timestamp || new Date().toISOString()
    ]);

    res.status(201).json({
      success: true,
      communication: result.rows[0]
    });
  } catch (error) {
    console.error('Log communication error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/communications
 * Get communication history
 */
router.get('/communications', async (req, res) => {
  try {
    const { agent_id, start_date, end_date, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM communications WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (agent_id) {
      query += ` AND (from_agent = $${paramCount} OR to_agent = $${paramCount})`;
      params.push(agent_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND timestamp >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND timestamp <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await neonService.query(query, params);

    res.json({
      success: true,
      communications: result.rows
    });
  } catch (error) {
    console.error('Get communication history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// ANALYTICS AND REPORTING
// ========================================

/**
 * GET /api/neon/analytics/project/:projectId
 * Get project analytics
 */
router.get('/analytics/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { time_range = '7d' } = req.query;

    const daysAgo = parseInt(time_range) || 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysAgo);

    const query = `
      SELECT
        COUNT(*) as total_stories,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_stories,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_stories,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_stories
      FROM stories
      WHERE epic_id LIKE $1
        AND created_at >= $2
    `;

    const result = await neonService.query(query, [
      `${projectId}%`,
      thresholdDate.toISOString()
    ]);

    res.json({
      success: true,
      projectId,
      timeRange: time_range,
      analytics: result.rows[0]
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/analytics/agent/:agentId
 * Get agent performance metrics
 */
router.get('/analytics/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const expertise = await neonService.getAgentExpertise(agentId);

    res.json({
      success: true,
      agentId,
      metrics: expertise || {
        message: 'No expertise data found for this agent'
      }
    });
  } catch (error) {
    console.error('Get agent performance metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/analytics/sprint/:sprintId
 * Get sprint metrics
 */
router.get('/analytics/sprint/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;
    const { project_id } = req.query;

    const query = `
      SELECT
        COUNT(*) as total_stories,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_stories,
        SUM(CAST(metadata->>'points' AS INTEGER)) FILTER (WHERE metadata->>'points' IS NOT NULL) as total_points,
        SUM(CAST(metadata->>'points' AS INTEGER)) FILTER (WHERE status = 'completed' AND metadata->>'points' IS NOT NULL) as completed_points
      FROM stories
      WHERE metadata->>'sprint_id' = $1
        ${project_id ? 'AND epic_id LIKE $2' : ''}
    `;

    const params = [sprintId];
    if (project_id) params.push(`${project_id}%`);

    const result = await neonService.query(query, params);

    res.json({
      success: true,
      sprintId,
      metrics: result.rows[0]
    });
  } catch (error) {
    console.error('Get sprint metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// TIME-SERIES DATA
// ========================================

/**
 * POST /api/neon/metrics
 * Record a metric
 */
router.post('/metrics', async (req, res) => {
  try {
    const metric = req.body;

    const query = `
      INSERT INTO metrics (
        metric_type, entity_id, entity_type, value,
        unit, timestamp, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await neonService.query(query, [
      metric.metric_type,
      metric.entity_id,
      metric.entity_type,
      metric.value,
      metric.unit,
      metric.timestamp || new Date().toISOString(),
      JSON.stringify(metric.metadata || {})
    ]);

    res.status(201).json({
      success: true,
      metric: result.rows[0]
    });
  } catch (error) {
    console.error('Record metric error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neon/metrics/timeseries
 * Get metric time series
 */
router.get('/metrics/timeseries', async (req, res) => {
  try {
    const { entity_id, metric_type, start_date, end_date } = req.query;

    const query = `
      SELECT * FROM metrics
      WHERE entity_id = $1
        AND metric_type = $2
        AND timestamp BETWEEN $3 AND $4
      ORDER BY timestamp ASC
    `;

    const result = await neonService.query(query, [
      entity_id,
      metric_type,
      start_date,
      end_date
    ]);

    res.json({
      success: true,
      entity_id,
      metric_type,
      data: result.rows
    });
  } catch (error) {
    console.error('Get metric timeseries error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// SEARCH AND QUERY
// ========================================

/**
 * POST /api/neon/search/stories
 * Search stories
 */
router.post('/search/stories', async (req, res) => {
  try {
    const { query: searchQuery, filters } = req.body;

    let sql = 'SELECT * FROM stories WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (searchQuery) {
      sql += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${searchQuery}%`);
      paramCount++;
    }

    if (filters?.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.priority) {
      sql += ` AND priority = $${paramCount}`;
      params.push(filters.priority);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const result = await neonService.query(sql, params);

    res.json({
      success: true,
      results: result.rows
    });
  } catch (error) {
    console.error('Search stories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neon/search/fulltext
 * Full text search
 */
router.post('/search/fulltext', async (req, res) => {
  try {
    const { search_term, entity_types } = req.body;

    // This is a simplified version - in production you'd use PostgreSQL full-text search
    const queries = [];

    if (!entity_types || entity_types.includes('stories')) {
      queries.push(
        neonService.query(
          `SELECT 'story' as type, * FROM stories WHERE title ILIKE $1 OR description ILIKE $1 LIMIT 10`,
          [`%${search_term}%`]
        )
      );
    }

    if (!entity_types || entity_types.includes('agents')) {
      queries.push(
        neonService.query(
          `SELECT 'agent' as type, * FROM agents WHERE agent_name ILIKE $1 LIMIT 10`,
          [`%${search_term}%`]
        )
      );
    }

    const results = await Promise.all(queries);
    const combined = results.flatMap(r => r.rows);

    res.json({
      success: true,
      search_term,
      results: combined
    });
  } catch (error) {
    console.error('Full text search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// AUDIT TRAIL
// ========================================

/**
 * GET /api/neon/audit
 * Get audit log
 */
router.get('/audit', async (req, res) => {
  try {
    const { entity_id, entity_type, start_date, end_date, limit = 50 } = req.query;

    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (entity_id) {
      query += ` AND entity_id = $${paramCount}`;
      params.push(entity_id);
      paramCount++;
    }

    if (entity_type) {
      query += ` AND entity_type = $${paramCount}`;
      params.push(entity_type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND timestamp >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND timestamp <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await neonService.query(query, params);

    res.json({
      success: true,
      audit_log: result.rows
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// HEALTH CHECK
// ========================================

/**
 * GET /api/neon/health
 * Check Neon connection health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await neonService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
