/**
 * Neo4j Graph Database API Routes
 * Handles agent relationships, task dependencies, knowledge graphs
 */

const express = require('express');
const router = express.Router();
const neo4jService = require('../services/neo4jService');

// ========================================
// AGENT NODE OPERATIONS
// ========================================

/**
 * POST /api/neo4j/agents/create
 * Create or update an agent node
 */
router.post('/agents/create', async (req, res) => {
  try {
    const { agent_id, name, type, specialties, metadata } = req.body;

    const agent = await neo4jService.upsertAgent({
      agentId: agent_id,
      name,
      type,
      status: metadata?.status || 'online',
      specialties,
      frameworks: metadata?.frameworks || [],
      languages: metadata?.languages || [],
      priority: metadata?.priority || 'MEDIUM'
    });

    res.status(201).json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Create agent node error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neo4j/agents/relate
 * Create relationship between agents
 */
router.post('/agents/relate', async (req, res) => {
  try {
    const { from_agent, to_agent, relationship, properties } = req.body;

    const result = await neo4jService.recordCollaboration(
      from_agent,
      to_agent,
      properties || {}
    );

    res.json({
      success: true,
      relationship: result
    });
  } catch (error) {
    console.error('Create agent relationship error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/agents/:agentId/network
 * Get agent collaboration network
 */
router.get('/agents/:agentId/network', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { depth = 2 } = req.query;

    const network = await neo4jService.getCollaborationNetwork(
      agentId,
      parseInt(depth)
    );

    res.json({
      success: true,
      agentId,
      depth: parseInt(depth),
      network
    });
  } catch (error) {
    console.error('Get agent network error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/agents
 * Get all agents
 */
router.get('/agents', async (req, res) => {
  try {
    const agents = await neo4jService.getAllAgents();

    res.json({
      success: true,
      count: agents.length,
      agents
    });
  } catch (error) {
    console.error('Get all agents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/agents/:agentId
 * Get specific agent with relationships
 */
router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await neo4jService.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// TASK DEPENDENCY OPERATIONS
// ========================================

/**
 * POST /api/neo4j/tasks/create
 * Create a task node
 */
router.post('/tasks/create', async (req, res) => {
  try {
    const { task_id, name, status, assigned_agent, story_id, metadata } = req.body;

    const cypher = `
      CREATE (t:Task {
        taskId: $taskId,
        name: $name,
        status: $status,
        assignedAgent: $assignedAgent,
        storyId: $storyId,
        metadata: $metadata,
        createdAt: datetime()
      })
      RETURN t
    `;

    const result = await neo4jService.query(cypher, {
      taskId: task_id,
      name,
      status,
      assignedAgent: assigned_agent,
      storyId: story_id,
      metadata: JSON.stringify(metadata || {})
    });

    res.status(201).json({
      success: true,
      task: result[0]?.t.properties
    });
  } catch (error) {
    console.error('Create task node error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neo4j/tasks/dependency
 * Create task dependency
 */
router.post('/tasks/dependency', async (req, res) => {
  try {
    const { task_id, depends_on, type } = req.body;

    const cypher = `
      MATCH (t1:Task {taskId: $taskId})
      MATCH (t2:Task {taskId: $dependsOn})
      MERGE (t1)-[r:DEPENDS_ON]->(t2)
      SET r.type = $type, r.createdAt = datetime()
      RETURN r
    `;

    const result = await neo4jService.query(cypher, {
      taskId: task_id,
      dependsOn: depends_on,
      type: type || 'blocking'
    });

    res.json({
      success: true,
      dependency: result[0]?.r.properties
    });
  } catch (error) {
    console.error('Create task dependency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/tasks/dependencies/:projectId
 * Get task dependency graph for a project
 */
router.get('/tasks/dependencies/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const cypher = `
      MATCH (t:Task)
      WHERE t.storyId STARTS WITH $projectId
      OPTIONAL MATCH (t)-[r:DEPENDS_ON]->(dep:Task)
      RETURN t, collect({type: type(r), task: dep}) as dependencies
      ORDER BY t.createdAt
    `;

    const result = await neo4jService.query(cypher, { projectId });

    res.json({
      success: true,
      projectId,
      tasks: result
    });
  } catch (error) {
    console.error('Get task dependencies error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/tasks/blocked/:projectId
 * Find blocked tasks
 */
router.get('/tasks/blocked/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const cypher = `
      MATCH (t:Task)-[:DEPENDS_ON]->(blocker:Task)
      WHERE t.storyId STARTS WITH $projectId
        AND t.status IN ['pending', 'ready']
        AND blocker.status <> 'completed'
      RETURN t, collect(blocker) as blockers
    `;

    const result = await neo4jService.query(cypher, { projectId });

    res.json({
      success: true,
      projectId,
      blockedTasks: result
    });
  } catch (error) {
    console.error('Find blocked tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// COMMUNICATION PATTERN OPERATIONS
// ========================================

/**
 * POST /api/neo4j/communication/log
 * Log communication between agents
 */
router.post('/communication/log', async (req, res) => {
  try {
    const { from_agent, to_agent, message_type, content, timestamp } = req.body;

    const cypher = `
      MATCH (a1:Agent {agentId: $fromAgent})
      MATCH (a2:Agent {agentId: $toAgent})
      CREATE (a1)-[c:COMMUNICATED {
        messageType: $messageType,
        content: $content,
        timestamp: datetime($timestamp)
      }]->(a2)
      RETURN c
    `;

    const result = await neo4jService.query(cypher, {
      fromAgent: from_agent,
      toAgent: to_agent,
      messageType: message_type,
      content,
      timestamp: timestamp || new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      communication: result[0]?.c.properties
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
 * GET /api/neo4j/communication/pattern/:agentId
 * Get agent communication patterns
 */
router.get('/communication/pattern/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { time_range = '7d' } = req.query;

    // Calculate time threshold
    const daysAgo = parseInt(time_range) || 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysAgo);

    const cypher = `
      MATCH (a:Agent {agentId: $agentId})-[c:COMMUNICATED]-(other:Agent)
      WHERE c.timestamp > datetime($threshold)
      RETURN other, count(c) as messageCount, collect(c.messageType) as messageTypes
      ORDER BY messageCount DESC
    `;

    const result = await neo4jService.query(cypher, {
      agentId,
      threshold: thresholdDate.toISOString()
    });

    res.json({
      success: true,
      agentId,
      timeRange: time_range,
      patterns: result
    });
  } catch (error) {
    console.error('Get communication pattern error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// KNOWLEDGE GRAPH OPERATIONS
// ========================================

/**
 * POST /api/neo4j/knowledge/create
 * Create knowledge node
 */
router.post('/knowledge/create', async (req, res) => {
  try {
    const { type, name, properties } = req.body;

    const knowledge = await neo4jService.createKnowledgeNode({
      knowledgeId: `k-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: name,
      category: properties?.category || 'general',
      type,
      tags: properties?.tags || [],
      createdBy: properties?.createdBy || 'system'
    });

    res.status(201).json({
      success: true,
      knowledge
    });
  } catch (error) {
    console.error('Create knowledge node error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neo4j/knowledge/link
 * Link knowledge to agent
 */
router.post('/knowledge/link', async (req, res) => {
  try {
    const { knowledge_id, agent_id, relationship } = req.body;

    const result = await neo4jService.linkKnowledgeToAgent(
      knowledge_id,
      agent_id,
      relationship || 'KNOWS'
    );

    res.json({
      success: true,
      link: result
    });
  } catch (error) {
    console.error('Link knowledge to agent error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neo4j/knowledge/query
 * Query knowledge graph
 */
router.post('/knowledge/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query string is required'
      });
    }

    // Security: Only allow SELECT/MATCH queries, not CREATE/DELETE
    const queryLower = query.toLowerCase().trim();
    const dangerousKeywords = ['create', 'delete', 'drop', 'merge', 'set', 'remove'];

    if (dangerousKeywords.some(keyword => queryLower.includes(keyword))) {
      return res.status(403).json({
        success: false,
        error: 'Only read queries are allowed'
      });
    }

    const result = await neo4jService.query(query);

    res.json({
      success: true,
      results: result
    });
  } catch (error) {
    console.error('Knowledge query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// STORY/EPIC OPERATIONS
// ========================================

/**
 * POST /api/neo4j/stories/create
 * Create story node
 */
router.post('/stories/create', async (req, res) => {
  try {
    const { story_id, title, epic_id, status, assigned_agents } = req.body;

    const cypher = `
      CREATE (s:Story {
        storyId: $storyId,
        title: $title,
        epicId: $epicId,
        status: $status,
        assignedAgents: $assignedAgents,
        createdAt: datetime()
      })
      RETURN s
    `;

    const result = await neo4jService.query(cypher, {
      storyId: story_id,
      title,
      epicId: epic_id,
      status,
      assignedAgents: JSON.stringify(assigned_agents || [])
    });

    res.status(201).json({
      success: true,
      story: result[0]?.s.properties
    });
  } catch (error) {
    console.error('Create story node error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/neo4j/stories/link-epic
 * Link story to epic
 */
router.post('/stories/link-epic', async (req, res) => {
  try {
    const { story_id, epic_id } = req.body;

    const cypher = `
      MATCH (s:Story {storyId: $storyId})
      MERGE (e:Epic {epicId: $epicId})
      MERGE (s)-[r:BELONGS_TO]->(e)
      SET r.createdAt = datetime()
      RETURN r
    `;

    const result = await neo4jService.query(cypher, {
      storyId: story_id,
      epicId: epic_id
    });

    res.json({
      success: true,
      link: result[0]?.r.properties
    });
  } catch (error) {
    console.error('Link story to epic error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/stories/epic-tree/:epicId
 * Get epic story tree
 */
router.get('/stories/epic-tree/:epicId', async (req, res) => {
  try {
    const { epicId } = req.params;

    const cypher = `
      MATCH (e:Epic {epicId: $epicId})
      OPTIONAL MATCH (s:Story)-[:BELONGS_TO]->(e)
      RETURN e, collect(s) as stories
    `;

    const result = await neo4jService.query(cypher, { epicId });

    res.json({
      success: true,
      epicId,
      data: result[0] || { e: null, stories: [] }
    });
  } catch (error) {
    console.error('Get epic story tree error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// PATH FINDING & ANALYTICS
// ========================================

/**
 * POST /api/neo4j/path/shortest
 * Find shortest path between agents
 */
router.post('/path/shortest', async (req, res) => {
  try {
    const { from, to, relationships } = req.body;

    const relationshipFilter = relationships && relationships.length > 0
      ? `[${relationships.map(r => `:${r}`).join('|')}*]`
      : '[*]';

    const cypher = `
      MATCH path = shortestPath(
        (a1:Agent {agentId: $from})-${relationshipFilter}-(a2:Agent {agentId: $to})
      )
      RETURN path, length(path) as distance
    `;

    const result = await neo4jService.query(cypher, { from, to });

    res.json({
      success: true,
      from,
      to,
      path: result[0] || null
    });
  } catch (error) {
    console.error('Find shortest path error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/stats
 * Get graph statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const cypher = `
      MATCH (n)
      RETURN
        count(n) as totalNodes,
        labels(n) as nodeLabels
    `;

    const result = await neo4jService.query(cypher);

    const stats = await neo4jService.getCollaborationStats();

    res.json({
      success: true,
      stats: {
        nodes: result,
        collaborations: stats
      }
    });
  } catch (error) {
    console.error('Get graph stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/analytics/central-agents
 * Get most connected agents
 */
router.get('/analytics/central-agents', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const agents = await neo4jService.getMostConnectedAgents(parseInt(limit));

    res.json({
      success: true,
      limit: parseInt(limit),
      agents
    });
  } catch (error) {
    console.error('Get central agents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/neo4j/analytics/communities/:projectId
 * Get community detection for project
 */
router.get('/analytics/communities/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // This is a simplified version - in production you'd use Neo4j Graph Data Science library
    const cypher = `
      MATCH (a:Agent)-[:WORKED_ON]->(p:Project {projectId: $projectId})
      OPTIONAL MATCH (a)-[:COLLABORATED_WITH]-(other:Agent)
      RETURN a, collect(DISTINCT other) as collaborators
    `;

    const result = await neo4jService.query(cypher, { projectId });

    res.json({
      success: true,
      projectId,
      communities: result
    });
  } catch (error) {
    console.error('Get communities error:', error);
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
 * GET /api/neo4j/health
 * Check Neo4j connection health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await neo4jService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
