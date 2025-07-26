const Joi = require('joi');

// Message validation schema
const messageSchema = Joi.object({
  from_agent: Joi.string().required().max(50),
  to_agent: Joi.string().required().max(50),
  message_type: Joi.string().valid(
    'coordination_request',
    'status_update', 
    'knowledge_share',
    'task_assignment',
    'progress_report',
    'system_notification',
    'emergency_alert'
  ).required(),
  priority: Joi.string().valid('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
  content: Joi.string().required().max(10000),
  thread_id: Joi.string().optional(),
  subject: Joi.string().optional().max(200)
});

// Agent registration schema
const agentSchema = Joi.object({
  agent_name: Joi.string().required().max(50),
  agent_type: Joi.string().valid('coordinator', 'developer', 'specialist', 'monitor').required(),
  specialties: Joi.string().optional().max(200),
  description: Joi.string().optional().max(500),
  config: Joi.object().optional()
});

// Project schema
const projectSchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().optional().max(1000),
  priority: Joi.string().valid('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
  assigned_agents: Joi.array().items(Joi.string()).optional(),
  deadline: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

// Restore point schema
const restorePointSchema = Joi.object({
  type: Joi.string().valid('session_state', 'milestone', 'emergency', 'agent_coordination').required(),
  manual_trigger: Joi.boolean().default(false),
  session_data: Joi.object({
    summary: Joi.string().optional(),
    tool_calls: Joi.number().optional(),
    duration: Joi.number().optional(),
    active_agents: Joi.array().items(Joi.string()).optional()
  }).optional()
});

// Validation middleware functions
const validateMessage = (req, res, next) => {
  const { error } = messageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateAgent = (req, res, next) => {
  const { error } = agentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateProject = (req, res, next) => {
  const { error } = projectSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateRestorePoint = (req, res, next) => {
  const { error } = restorePointSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validateMessage,
  validateAgent,
  validateProject,
  validateRestorePoint
};