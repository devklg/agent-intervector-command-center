// Universal in-memory storage service for Agent Command Center
// Project-agnostic - can be used with any multi-agent development project

const fs = require('fs').promises;
const path = require('path');

class InMemoryService {
  constructor() {
    // Start with empty collections - projects register dynamically
    this.agents = [];
    this.messages = [];
    this.projects = [];
    this.activationTemplates = {}; // Store activation prompt templates
    this.dataFile = path.join(__dirname, '../data/command-center-data.json');

    // Auto-load data on startup
    this.loadData();
  }

  // ==================== PERSISTENCE ====================

  async loadData() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(data);
      await this.restore(parsed);
      console.log('✅ Data loaded from disk:', {
        projects: this.projects.length,
        agents: this.agents.length,
        templates: Object.keys(this.activationTemplates).length
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️  No existing data file, starting fresh');
      } else {
        console.error('❌ Error loading data:', error.message);
      }
    }
  }

  async saveData() {
    try {
      const data = await this.exportData();
      const dir = path.dirname(this.dataFile);

      // Create directory if it doesn't exist
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (err) {
        // Directory already exists, ignore
      }

      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
      console.log('💾 Data saved to disk');
    } catch (error) {
      console.error('❌ Error saving data:', error.message);
    }
  }

  // ==================== AGENTS ====================

  async getAgents(filters = {}) {
    let filtered = [...this.agents];

    if (filters.project_id) {
      filtered = filtered.filter(a => a.project_id === filters.project_id);
    }
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }

    return filtered;
  }

  async getAgentById(id) {
    return this.agents.find(a => a.id === id);
  }

  async getAgentByName(name) {
    return this.agents.find(a => a.name === name);
  }

  async addAgent(agentData) {
    const agent = {
      id: agentData.id || `agent-${Date.now()}`,
      name: agentData.name,
      type: agentData.type,
      specialties: agentData.specialties || [],
      status: agentData.status || 'offline',
      priority: agentData.priority || 'MEDIUM',
      project_id: agentData.project_id || null,
      assigned_stories: agentData.assigned_stories || [],
      role: agentData.role || null,
      description: agentData.description || '',
      current_task: agentData.current_task || null,
      branch: agentData.branch || null,
      git_activity: agentData.git_activity || null,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    this.agents.push(agent);
    await this.saveData();
    return agent;
  }

  async updateAgent(id, updates) {
    const agent = this.agents.find(a => a.id === id);
    if (!agent) return null;

    Object.assign(agent, updates, {
      last_updated: new Date().toISOString()
    });

    return agent;
  }

  async updateAgentByName(name, updates) {
    const agent = this.agents.find(a => a.name === name);
    if (!agent) return null;

    Object.assign(agent, updates, {
      last_updated: new Date().toISOString()
    });

    return agent;
  }

  async deleteAgent(id) {
    const index = this.agents.findIndex(a => a.id === id);
    if (index === -1) return false;

    this.agents.splice(index, 1);
    return true;
  }

  // ==================== GIT ACTIVITY ====================

  async updateGitActivity(agentName, gitData) {
    let agent = this.agents.find(a => a.name === agentName);

    // Auto-register agent if not exists
    if (!agent) {
      agent = await this.addAgent({
        name: agentName,
        type: 'developer',
        specialties: ['story-implementation'],
        status: 'busy'
      });
    }

    // Initialize git_activity if not exists
    if (!agent.git_activity) {
      agent.git_activity = {
        branch: null,
        last_commit: null,
        commit_count: 0,
        commits: []
      };
    }

    // Update branch
    if (gitData.branch) {
      agent.git_activity.branch = gitData.branch;
      agent.branch = gitData.branch;
    }

    // Update last commit
    if (gitData.last_commit) {
      agent.git_activity.last_commit = gitData.last_commit;
      agent.git_activity.commit_count++;

      // Add to commit history (keep last 20)
      agent.git_activity.commits.unshift(gitData.last_commit);
      agent.git_activity.commits = agent.git_activity.commits.slice(0, 20);
    }

    // Update status
    agent.status = 'busy';
    agent.last_updated = new Date().toISOString();

    return agent;
  }

  // ==================== MESSAGES ====================

  async getMessages(filters = {}) {
    let filtered = [...this.messages];

    if (filters.project_id) {
      filtered = filtered.filter(m => m.project_id === filters.project_id);
    }
    if (filters.from_agent) {
      filtered = filtered.filter(m => m.from_agent === filters.from_agent);
    }
    if (filters.to_agent) {
      filtered = filtered.filter(m => m.to_agent === filters.to_agent);
    }
    if (filters.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }

    return filtered.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  async addMessage(messageData) {
    const message = {
      id: `msg-${Date.now()}`,
      from_agent: messageData.from_agent,
      to_agent: messageData.to_agent,
      type: messageData.type || 'info',
      subject: messageData.subject || '',
      content: messageData.content,
      project_id: messageData.project_id || null,
      metadata: messageData.metadata || {},
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);
    return message;
  }

  // ==================== PROJECTS ====================

  async getProjects() {
    return this.projects;
  }

  async getProjectById(id) {
    return this.projects.find(p => p.id === id);
  }

  async addProject(projectData) {
    const project = {
      id: projectData.id || `project-${Date.now()}`,
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'active',
      github_url: projectData.github_url || null,
      github_branch: projectData.github_branch || 'main',
      repository_path: projectData.repository_path || null,
      total_stories: projectData.total_stories || 0,
      completed_stories: projectData.completed_stories || 0,
      in_progress_stories: projectData.in_progress_stories || 0,
      total_agents: projectData.total_agents || 0,
      active_agents: projectData.active_agents || 0,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    this.projects.push(project);
    await this.saveData();
    return project;
  }

  async updateProject(id, updates) {
    const project = this.projects.find(p => p.id === id);
    if (!project) return null;

    Object.assign(project, updates, {
      last_updated: new Date().toISOString()
    });

    return project;
  }

  async deleteProject(id) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return false;

    // Also delete all agents for this project
    this.agents = this.agents.filter(a => a.project_id !== id);
    this.messages = this.messages.filter(m => m.project_id !== id);
    this.projects.splice(index, 1);

    return true;
  }

  // ==================== ACTIVATION TEMPLATES ====================

  async storeActivationTemplate(templateData) {
    const template = {
      id: templateData.id || `template-${Date.now()}`,
      project_id: templateData.project_id,
      role_name: templateData.role_name,
      agent_name: templateData.agent_name,
      role: templateData.role,
      type: templateData.type,
      specialties: templateData.specialties || [],
      assigned_stories: templateData.assigned_stories || [],
      branch_pattern: templateData.branch_pattern,
      description: templateData.description,
      tasks: templateData.tasks || [],
      success_criteria: templateData.success_criteria || [],
      priority: templateData.priority || 'MEDIUM',
      created_at: new Date().toISOString()
    };

    const key = `${template.project_id}:${template.role_name}`;
    this.activationTemplates[key] = template;

    await this.saveData();
    return template;
  }

  async getActivationTemplate(projectId, roleName) {
    const key = `${projectId}:${roleName}`;
    return this.activationTemplates[key] || null;
  }

  async getAllActivationTemplates(projectId = null) {
    if (!projectId) {
      return Object.values(this.activationTemplates);
    }

    return Object.values(this.activationTemplates).filter(
      t => t.project_id === projectId
    );
  }

  // ==================== STATISTICS ====================

  async getStats(projectId = null) {
    const agents = projectId
      ? this.agents.filter(a => a.project_id === projectId)
      : this.agents;

    const messages = projectId
      ? this.messages.filter(m => m.project_id === projectId)
      : this.messages;

    return {
      total_agents: agents.length,
      online_agents: agents.filter(a => a.status === 'online').length,
      busy_agents: agents.filter(a => a.status === 'busy').length,
      offline_agents: agents.filter(a => a.status === 'offline').length,
      total_messages: messages.length,
      total_projects: this.projects.length,
      active_projects: this.projects.filter(p => p.status === 'active').length
    };
  }

  // ==================== RESTORE ====================

  async restore(data) {
    if (data.agents) {
      this.agents = data.agents;
    }
    if (data.messages) {
      this.messages = data.messages;
    }
    if (data.projects) {
      this.projects = data.projects;
    }
    if (data.activationTemplates) {
      this.activationTemplates = data.activationTemplates;
    }

    return {
      agents_restored: this.agents.length,
      messages_restored: this.messages.length,
      projects_restored: this.projects.length,
      templates_restored: Object.keys(this.activationTemplates).length
    };
  }

  async exportData() {
    return {
      agents: this.agents,
      messages: this.messages,
      projects: this.projects,
      activationTemplates: this.activationTemplates,
      exported_at: new Date().toISOString()
    };
  }
}

module.exports = InMemoryService;
