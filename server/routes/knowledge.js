/**
 * Knowledge Base API Routes
 * Comprehensive API for managing agent knowledge, framework docs, troubleshooting,
 * code patterns, story learnings, and agent expertise
 *
 * @author DataArchitect Agent
 */

const express = require('express');
const router = express.Router();
const neonService = require('../services/neonService');
const neo4jService = require('../services/neo4jService');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

// ========================================
// VALIDATION SCHEMAS
// ========================================

const knowledgeSchema = Joi.object({
  agent_id: Joi.string().required().max(100),
  knowledge_type: Joi.string().required().valid('learning', 'insight', 'best_practice', 'warning'),
  title: Joi.string().required().max(500),
  content: Joi.string().required(),
  category: Joi.string().max(100),
  tags: Joi.array().items(Joi.string()),
  source: Joi.string().max(100),
  metadata: Joi.object(),
  created_by: Joi.string().required().max(100)
});

const frameworkDocSchema = Joi.object({
  framework_name: Joi.string().required().max(100),
  version: Joi.string().required().max(50),
  section: Joi.string().required().max(200),
  title: Joi.string().required().max(500),
  content: Joi.string().required(),
  code_examples: Joi.array().items(Joi.object()),
  links: Joi.array().items(Joi.string()),
  tags: Joi.array().items(Joi.string()),
  created_by: Joi.string().required().max(100)
});

const troubleshootingSchema = Joi.object({
  problem_type: Joi.string().required().valid('error', 'bug', 'performance', 'security', 'configuration'),
  error_message: Joi.string().allow(''),
  context: Joi.string().required(),
  solution: Joi.string().required(),
  steps_taken: Joi.array().items(Joi.string()),
  related_files: Joi.array().items(Joi.string()),
  agent_id: Joi.string().max(100),
  project_id: Joi.string().max(100),
  tags: Joi.array().items(Joi.string()),
  created_by: Joi.string().required().max(100)
});

const codePatternSchema = Joi.object({
  pattern_name: Joi.string().required().max(200),
  language: Joi.string().required().max(50),
  category: Joi.string().required().valid('design_pattern', 'utility', 'algorithm', 'architecture'),
  description: Joi.string().required(),
  code_snippet: Joi.string().required(),
  use_cases: Joi.array().items(Joi.string()),
  best_practices: Joi.array().items(Joi.string()),
  anti_patterns: Joi.array().items(Joi.string()),
  tags: Joi.array().items(Joi.string()),
  created_by: Joi.string().required().max(100)
});

const storyLearningSchema = Joi.object({
  story_id: Joi.string().required().max(100),
  story_title: Joi.string().required().max(500),
  project_id: Joi.string().max(100),
  agent_id: Joi.string().required().max(100),
  learning_type: Joi.string().required().valid('technical', 'process', 'collaboration', 'estimation'),
  description: Joi.string().required(),
  challenges_faced: Joi.array().items(Joi.string()),
  solutions_applied: Joi.array().items(Joi.string()),
  code_snippets: Joi.array().items(Joi.object()),
  time_saved_minutes: Joi.number().integer().min(0),
  complexity_rating: Joi.string().valid('simple', 'medium', 'complex'),
  tags: Joi.array().items(Joi.string()),
  created_by: Joi.string().required().max(100)
});

const agentExpertiseSchema = Joi.object({
  agent_id: Joi.string().required().max(100),
  agent_name: Joi.string().required().max(200),
  specialties: Joi.array().items(Joi.string()),
  frameworks: Joi.array().items(Joi.string()),
  languages: Joi.array().items(Joi.string()),
  domains: Joi.array().items(Joi.string()),
  skill_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert'),
  total_contributions: Joi.number().integer().min(0),
  successful_tasks: Joi.number().integer().min(0),
  failed_tasks: Joi.number().integer().min(0),
  avg_task_time_minutes: Joi.number().min(0),
  metadata: Joi.object()
});

// ========================================
// AGENT KNOWLEDGE ROUTES
// ========================================

/**
 * GET /api/knowledge
 * Get knowledge entries with filtering
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      agent_id: req.query.agent_id,
      knowledge_type: req.query.knowledge_type,
      category: req.query.category,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50
    };

    const knowledge = await neonService.getKnowledge(filters);

    res.json({
      success: true,
      count: knowledge.length,
      data: knowledge
    });
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge
 * Create new knowledge entry
 */
router.post('/', validateRequest(knowledgeSchema), async (req, res) => {
  try {
    const knowledge = await neonService.createKnowledge(req.body);

    // Create knowledge node in Neo4j graph
    if (process.env.GRAPH_RELATIONSHIPS_ENABLED === 'true') {
      try {
        await neo4jService.createKnowledgeNode({
          knowledgeId: knowledge.id,
          title: knowledge.title,
          category: knowledge.category,
          type: knowledge.knowledge_type,
          tags: JSON.parse(knowledge.tags || '[]'),
          createdBy: knowledge.created_by
        });

        await neo4jService.linkKnowledgeToAgent(knowledge.id, knowledge.agent_id, 'CREATED');
      } catch (graphError) {
        console.error('Error creating knowledge graph:', graphError);
        // Continue even if graph creation fails
      }
    }

    res.status(201).json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('Error creating knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create knowledge',
      message: error.message
    });
  }
});

/**
 * PUT /api/knowledge/:id
 * Update knowledge entry
 */
router.put('/:id', async (req, res) => {
  try {
    const knowledge = await neonService.updateKnowledge(req.params.id, req.body);

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge not found'
      });
    }

    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('Error updating knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update knowledge',
      message: error.message
    });
  }
});

/**
 * DELETE /api/knowledge/:id
 * Delete knowledge entry
 */
router.delete('/:id', async (req, res) => {
  try {
    const knowledge = await neonService.deleteKnowledge(req.params.id);

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge not found'
      });
    }

    res.json({
      success: true,
      message: 'Knowledge deleted successfully',
      data: knowledge
    });
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete knowledge',
      message: error.message
    });
  }
});

// ========================================
// FRAMEWORK DOCUMENTATION ROUTES
// ========================================

/**
 * GET /api/knowledge/frameworks
 * Get framework documentation
 */
router.get('/frameworks', async (req, res) => {
  try {
    const filters = {
      framework_name: req.query.framework_name,
      version: req.query.version,
      section: req.query.section
    };

    const docs = await neonService.getFrameworkDocs(filters);

    res.json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (error) {
    console.error('Error fetching framework docs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch framework documentation',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge/frameworks
 * Create framework documentation
 */
router.post('/frameworks', validateRequest(frameworkDocSchema), async (req, res) => {
  try {
    const doc = await neonService.createFrameworkDoc(req.body);

    res.status(201).json({
      success: true,
      data: doc
    });
  } catch (error) {
    console.error('Error creating framework doc:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create framework documentation',
      message: error.message
    });
  }
});

// ========================================
// TROUBLESHOOTING ROUTES
// ========================================

/**
 * GET /api/knowledge/troubleshooting
 * Search troubleshooting entries
 */
router.get('/troubleshooting', async (req, res) => {
  try {
    const filters = {
      problem_type: req.query.problem_type,
      error_search: req.query.error_search,
      agent_id: req.query.agent_id,
      limit: parseInt(req.query.limit) || 50
    };

    const entries = await neonService.searchTroubleshooting(filters);

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Error searching troubleshooting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search troubleshooting entries',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge/troubleshooting
 * Create troubleshooting entry
 */
router.post('/troubleshooting', validateRequest(troubleshootingSchema), async (req, res) => {
  try {
    const entry = await neonService.createTroubleshooting(req.body);

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error creating troubleshooting entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create troubleshooting entry',
      message: error.message
    });
  }
});

// ========================================
// CODE PATTERNS ROUTES
// ========================================

/**
 * GET /api/knowledge/patterns
 * Get code patterns
 */
router.get('/patterns', async (req, res) => {
  try {
    const filters = {
      language: req.query.language,
      category: req.query.category,
      search: req.query.search
    };

    const patterns = await neonService.getCodePatterns(filters);

    res.json({
      success: true,
      count: patterns.length,
      data: patterns
    });
  } catch (error) {
    console.error('Error fetching code patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch code patterns',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge/patterns
 * Create code pattern
 */
router.post('/patterns', validateRequest(codePatternSchema), async (req, res) => {
  try {
    const pattern = await neonService.createCodePattern(req.body);

    res.status(201).json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error creating code pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create code pattern',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge/patterns/:id/use
 * Increment pattern usage count
 */
router.post('/patterns/:id/use', async (req, res) => {
  try {
    const pattern = await neonService.incrementPatternUsage(req.params.id);

    if (!pattern) {
      return res.status(404).json({
        success: false,
        error: 'Pattern not found'
      });
    }

    res.json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error incrementing pattern usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to increment pattern usage',
      message: error.message
    });
  }
});

// ========================================
// STORY LEARNINGS ROUTES
// ========================================

/**
 * GET /api/knowledge/learnings
 * Get story learnings
 */
router.get('/learnings', async (req, res) => {
  try {
    const filters = {
      project_id: req.query.project_id,
      agent_id: req.query.agent_id,
      learning_type: req.query.learning_type
    };

    const learnings = await neonService.getStoryLearnings(filters);

    res.json({
      success: true,
      count: learnings.length,
      data: learnings
    });
  } catch (error) {
    console.error('Error fetching story learnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch story learnings',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge/learnings
 * Create story learning
 */
router.post('/learnings', validateRequest(storyLearningSchema), async (req, res) => {
  try {
    const learning = await neonService.createStoryLearning(req.body);

    res.status(201).json({
      success: true,
      data: learning
    });
  } catch (error) {
    console.error('Error creating story learning:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create story learning',
      message: error.message
    });
  }
});

// ========================================
// AGENT EXPERTISE ROUTES
// ========================================

/**
 * GET /api/knowledge/expertise
 * Get all agents expertise
 */
router.get('/expertise', async (req, res) => {
  try {
    const filters = {
      skill_level: req.query.skill_level
    };

    const expertise = await neonService.getAllAgentsExpertise(filters);

    res.json({
      success: true,
      count: expertise.length,
      data: expertise
    });
  } catch (error) {
    console.error('Error fetching agent expertise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent expertise',
      message: error.message
    });
  }
});

/**
 * GET /api/knowledge/expertise/:agentId
 * Get specific agent expertise
 */
router.get('/expertise/:agentId', async (req, res) => {
  try {
    const expertise = await neonService.getAgentExpertise(req.params.agentId);

    if (!expertise) {
      return res.status(404).json({
        success: false,
        error: 'Agent expertise not found'
      });
    }

    res.json({
      success: true,
      data: expertise
    });
  } catch (error) {
    console.error('Error fetching agent expertise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent expertise',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge/expertise
 * Create or update agent expertise
 */
router.post('/expertise', validateRequest(agentExpertiseSchema), async (req, res) => {
  try {
    const expertise = await neonService.upsertAgentExpertise(req.body);

    // Update agent node in Neo4j
    if (process.env.GRAPH_RELATIONSHIPS_ENABLED === 'true') {
      try {
        await neo4jService.upsertAgent({
          agentId: expertise.agent_id,
          name: expertise.agent_name,
          type: req.body.type || 'specialist',
          specialties: JSON.parse(expertise.specialties || '[]'),
          frameworks: JSON.parse(expertise.frameworks || '[]'),
          languages: JSON.parse(expertise.languages || '[]')
        });
      } catch (graphError) {
        console.error('Error updating agent graph:', graphError);
      }
    }

    res.status(201).json({
      success: true,
      data: expertise
    });
  } catch (error) {
    console.error('Error upserting agent expertise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upsert agent expertise',
      message: error.message
    });
  }
});

// ========================================
// GRAPH ANALYTICS ROUTES (Neo4j)
// ========================================

/**
 * GET /api/knowledge/graph/agents
 * Get all agents from graph database
 */
router.get('/graph/agents', async (req, res) => {
  try {
    const agents = await neo4jService.getAllAgents();

    res.json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    console.error('Error fetching agents from graph:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents from graph database',
      message: error.message
    });
  }
});

/**
 * GET /api/knowledge/graph/collaboration/:agentId
 * Get agent collaboration network
 */
router.get('/graph/collaboration/:agentId', async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 2;
    const network = await neo4jService.getCollaborationNetwork(req.params.agentId, depth);

    res.json({
      success: true,
      data: network
    });
  } catch (error) {
    console.error('Error fetching collaboration network:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaboration network',
      message: error.message
    });
  }
});

/**
 * POST /api/knowledge/graph/collaboration
 * Record collaboration between agents
 */
router.post('/graph/collaboration', async (req, res) => {
  try {
    const { fromAgentId, toAgentId, context } = req.body;

    if (!fromAgentId || !toAgentId) {
      return res.status(400).json({
        success: false,
        error: 'Both fromAgentId and toAgentId are required'
      });
    }

    const result = await neo4jService.recordCollaboration(fromAgentId, toAgentId, context);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error recording collaboration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record collaboration',
      message: error.message
    });
  }
});

/**
 * GET /api/knowledge/graph/stats
 * Get graph analytics and statistics
 */
router.get('/graph/stats', async (req, res) => {
  try {
    const [collabStats, distribution, connectedAgents] = await Promise.all([
      neo4jService.getCollaborationStats(),
      neo4jService.getKnowledgeDistribution(),
      neo4jService.getMostConnectedAgents(10)
    ]);

    res.json({
      success: true,
      data: {
        collaboration: collabStats,
        knowledgeDistribution: distribution,
        mostConnectedAgents: connectedAgents
      }
    });
  } catch (error) {
    console.error('Error fetching graph stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch graph statistics',
      message: error.message
    });
  }
});

// ========================================
// HEALTH CHECK
// ========================================

/**
 * GET /api/knowledge/health
 * Check knowledge base system health
 */
router.get('/health', async (req, res) => {
  try {
    const [neonHealth, neo4jHealth] = await Promise.all([
      neonService.healthCheck(),
      neo4jService.healthCheck()
    ]);

    const overall = neonHealth.status === 'healthy' && neo4jHealth.status === 'healthy'
      ? 'healthy'
      : 'degraded';

    res.json({
      success: true,
      status: overall,
      services: {
        neon: neonHealth,
        neo4j: neo4jHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
