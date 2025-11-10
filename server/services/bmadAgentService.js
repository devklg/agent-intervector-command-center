const fs = require('fs').promises;
const path = require('path');

class BMADAgentService {
  constructor() {
    this.agentsConfig = null;
    this.configPath = path.join(__dirname, '../config/bmad-agents.json');
  }

  /**
   * Load BMAD agents configuration
   */
  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.agentsConfig = JSON.parse(configData);
      console.log('✅ BMAD agents configuration loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load BMAD agents config:', error.message);
      return false;
    }
  }

  /**
   * Get all available BMAD agents
   */
  async getAllAgents() {
    if (!this.agentsConfig) {
      await this.loadConfig();
    }

    const allAgents = [];
    const modules = this.agentsConfig.bmad_agents;

    for (const [moduleKey, moduleData] of Object.entries(modules)) {
      for (const agent of moduleData.agents) {
        allAgents.push({
          ...agent,
          module: moduleKey,
          module_name: moduleData.module_name,
          module_description: moduleData.description
        });
      }
    }

    return allAgents;
  }

  /**
   * Get agents by category
   */
  async getAgentsByCategory(category) {
    const allAgents = await this.getAllAgents();
    return allAgents.filter(agent => agent.category === category);
  }

  /**
   * Get agents by phase
   */
  async getAgentsByPhase(phase) {
    const allAgents = await this.getAllAgents();
    return allAgents.filter(agent => agent.phase.includes(phase));
  }

  /**
   * Get a specific agent by ID
   */
  async getAgentById(agentId) {
    const allAgents = await this.getAllAgents();
    return allAgents.find(agent => agent.id === agentId);
  }

  /**
   * Search agents by keyword
   */
  async searchAgents(query) {
    const allAgents = await this.getAllAgents();
    const lowerQuery = query.toLowerCase();

    return allAgents.filter(agent => {
      return (
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.title.toLowerCase().includes(lowerQuery) ||
        agent.role.toLowerCase().includes(lowerQuery) ||
        agent.description.toLowerCase().includes(lowerQuery) ||
        agent.specialty.toLowerCase().includes(lowerQuery) ||
        agent.when_to_use.some(use => use.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Get all agent categories
   */
  async getCategories() {
    if (!this.agentsConfig) {
      await this.loadConfig();
    }

    return this.agentsConfig.agent_categories;
  }

  /**
   * Get agents grouped by module
   */
  async getAgentsByModule() {
    if (!this.agentsConfig) {
      await this.loadConfig();
    }

    const modules = {};
    const bmadAgents = this.agentsConfig.bmad_agents;

    for (const [moduleKey, moduleData] of Object.entries(bmadAgents)) {
      modules[moduleKey] = {
        module_name: moduleData.module_name,
        description: moduleData.description,
        agents: moduleData.agents
      };
    }

    return modules;
  }

  /**
   * Get recommended agent for a specific task type
   */
  async getRecommendedAgent(taskDescription) {
    const allAgents = await this.getAllAgents();
    const lowerTask = taskDescription.toLowerCase();

    // Simple keyword matching for recommendations
    const keywords = {
      'requirements': ['bmm-pm', 'bmm-analyst'],
      'prd': ['bmm-pm'],
      'architecture': ['bmm-architect', 'bmm-game-architect'],
      'design': ['bmm-ux-designer', 'cis-design-thinking-coach'],
      'story': ['bmm-sm', 'cis-storyteller'],
      'code': ['bmm-dev', 'bmm-game-developer'],
      'test': ['bmm-tea'],
      'documentation': ['bmm-tech-writer'],
      'brainstorm': ['cis-brainstorming-coach', 'bmm-analyst'],
      'problem': ['cis-creative-problem-solver'],
      'innovation': ['cis-innovation-strategist'],
      'game': ['bmm-game-designer', 'bmm-game-developer', 'bmm-game-architect']
    };

    for (const [keyword, agentIds] of Object.entries(keywords)) {
      if (lowerTask.includes(keyword)) {
        const recommendedAgents = allAgents.filter(agent => agentIds.includes(agent.id));
        if (recommendedAgents.length > 0) {
          return recommendedAgents;
        }
      }
    }

    return [];
  }

  /**
   * Create a request to invoke a BMAD agent
   * This would integrate with your agent execution system
   */
  async createAgentRequest(agentId, workflow, context = {}) {
    const agent = await this.getAgentById(agentId);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.workflows.includes(workflow)) {
      throw new Error(`Workflow ${workflow} not available for agent ${agentId}`);
    }

    // Return a structured agent invocation request
    return {
      request_id: `bmad-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agent: {
        id: agent.id,
        name: agent.name,
        title: agent.title,
        module: agent.module
      },
      workflow: workflow,
      context: context,
      created_at: new Date().toISOString(),
      status: 'pending'
    };
  }

  /**
   * Get agent statistics
   */
  async getAgentStats() {
    const allAgents = await this.getAllAgents();
    const categories = await this.getCategories();

    const stats = {
      total_agents: allAgents.length,
      by_module: {},
      by_category: {},
      by_phase: {}
    };

    // Count by module
    for (const agent of allAgents) {
      stats.by_module[agent.module] = (stats.by_module[agent.module] || 0) + 1;
    }

    // Count by category
    for (const agent of allAgents) {
      stats.by_category[agent.category] = (stats.by_category[agent.category] || 0) + 1;
    }

    // Count by phase
    for (const agent of allAgents) {
      const phase = agent.phase;
      stats.by_phase[phase] = (stats.by_phase[phase] || 0) + 1;
    }

    return stats;
  }
}

module.exports = new BMADAgentService();
