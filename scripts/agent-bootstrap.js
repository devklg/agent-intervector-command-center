#!/usr/bin/env node

/**
 * Agent Bootstrap Script for Intervector Command Center
 * Designed by PROMETHEUS & THEO-5001
 * 
 * This script registers new agents in the system and configures
 * their initial settings for ChromaDB communication.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Agent configuration
const AGENT_TYPES = {
  coordinator: 'Strategic coordination and system orchestration',
  developer: 'Software development and implementation',
  specialist: 'Domain-specific expertise and analysis',
  monitor: 'System monitoring and performance tracking'
};

const SPECIALTIES = {
  frontend: 'React, UI/UX, dashboard development',
  backend: 'Express.js, API development, database management',
  realtime: 'WebSocket, live updates, streaming data',
  qa: 'Testing, validation, quality assurance',
  devops: 'Deployment, CI/CD, infrastructure',
  ai: 'Machine learning, embeddings, AI integration',
  coordination: 'Multi-agent orchestration, task distribution',
  psychology: 'User experience, behavioral analysis',
  visualization: 'Charts, graphs, data presentation',
  security: 'Authentication, authorization, threat detection'
};

class AgentBootstrap {
  constructor() {
    this.chromaHost = process.env.CHROMA_HOST || 'localhost';
    this.chromaPort = process.env.CHROMA_PORT || 8000;
    this.agentConfigPath = path.join(__dirname, '../config/agents.json');
  }

  /**
   * Register a new agent in the system
   */
  async registerAgent(options) {
    const {
      name,
      type,
      specialties = [],
      description = '',
      priority = 'MEDIUM'
    } = options;

    console.log(`\n🤖 Registering Agent: ${name}`);
    console.log(`📋 Type: ${type}`);
    console.log(`🎯 Specialties: ${specialties.join(', ')}`);

    // Validate inputs
    if (!AGENT_TYPES[type]) {
      throw new Error(`Invalid agent type: ${type}. Valid types: ${Object.keys(AGENT_TYPES).join(', ')}`);
    }

    // Generate agent configuration
    const agentConfig = {
      id: `agent_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: name,
      type: type,
      specialties: specialties,
      description: description || AGENT_TYPES[type],
      status: 'initializing',
      created_at: new Date().toISOString(),
      config: {
        priority: priority,
        auto_start: true,
        communication_enabled: true,
        restore_points_enabled: true,
        max_concurrent_tasks: type === 'coordinator' ? 10 : 5
      }
    };

    // Save agent configuration
    await this.saveAgentConfig(agentConfig);

    // Register in ChromaDB
    await this.registerInChromaDB(agentConfig);

    console.log(`✅ Agent ${name} registered successfully!`);
    console.log(`🆔 Agent ID: ${agentConfig.id}`);
    
    return agentConfig;
  }

  /**
   * Save agent configuration to local file
   */
  async saveAgentConfig(agentConfig) {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.agentConfigPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Load existing configurations
      let agents = {};
      if (fs.existsSync(this.agentConfigPath)) {
        const existingData = fs.readFileSync(this.agentConfigPath, 'utf8');
        agents = JSON.parse(existingData);
      }

      // Add new agent
      agents[agentConfig.id] = agentConfig;

      // Save updated configurations
      fs.writeFileSync(
        this.agentConfigPath, 
        JSON.stringify(agents, null, 2),
        'utf8'
      );

      console.log(`💾 Agent configuration saved to: ${this.agentConfigPath}`);
    } catch (error) {
      console.error(`❌ Failed to save agent configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register agent in ChromaDB
   */
  async registerInChromaDB(agentConfig) {
    try {
      const axios = require('axios');
      const chromaURL = `http://${this.chromaHost}:${this.chromaPort}`;

      // Check ChromaDB connection
      try {
        await axios.get(`${chromaURL}/api/v1/heartbeat`);
        console.log(`🔗 Connected to ChromaDB at ${chromaURL}`);
      } catch (error) {
        console.warn(`⚠️  ChromaDB not available at ${chromaURL}. Agent will be registered when ChromaDB is online.`);
        return;
      }

      // Add agent to agent_directory collection
      const response = await axios.post(`${chromaURL}/api/v1/collections/agent_directory/add`, {
        documents: [
          `Agent profile for ${agentConfig.name}: ${agentConfig.description}. Specialties: ${agentConfig.specialties.join(', ')}`
        ],
        metadatas: [{
          agent_name: agentConfig.name,
          agent_type: agentConfig.type,
          status: agentConfig.status,
          specialties: agentConfig.specialties.join(','),
          last_seen: agentConfig.created_at,
          priority: agentConfig.config.priority
        }],
        ids: [agentConfig.id]
      });

      console.log(`📡 Agent registered in ChromaDB agent_directory`);

      // Send registration notification
      await this.sendRegistrationMessage(agentConfig);

    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️  Agent already exists in ChromaDB`);
      } else {
        console.error(`❌ ChromaDB registration error: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Send agent registration message
   */
  async sendRegistrationMessage(agentConfig) {
    try {
      const axios = require('axios');
      const chromaURL = `http://${this.chromaHost}:${this.chromaPort}`;

      const message = {
        id: `msg_registration_${agentConfig.name.toLowerCase()}_${Date.now()}`,
        from_agent: 'SYSTEM',
        to_agent: 'ALL_AGENTS',
        message_type: 'system_notification',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString(),
        thread_id: 'thread_agent_registration',
        status: 'delivered',
        subject: `New Agent Registration: ${agentConfig.name}`,
        content: `Welcome ${agentConfig.name}! Agent registration complete. Type: ${agentConfig.type}, Specialties: ${agentConfig.specialties.join(', ')}. Ready for INTERVECTOR COMMUNICATION.`
      };

      await axios.post(`${chromaURL}/api/v1/collections/agent_message_log/add`, {
        documents: [message.content],
        metadatas: [{
          from_agent: message.from_agent,
          to_agent: message.to_agent,
          message_type: message.message_type,
          priority: message.priority,
          timestamp: message.timestamp,
          thread_id: message.thread_id,
          status: message.status,
          subject: message.subject
        }],
        ids: [message.id]
      });

      console.log(`📨 Registration notification sent`);
    } catch (error) {
      console.warn(`⚠️  Could not send registration message: ${error.message}`);
    }
  }

  /**
   * List all registered agents
   */
  listAgents() {
    try {
      if (!fs.existsSync(this.agentConfigPath)) {
        console.log('📭 No agents registered yet.');
        return;
      }

      const agentsData = fs.readFileSync(this.agentConfigPath, 'utf8');
      const agents = JSON.parse(agentsData);

      console.log('\n🤖 Registered Agents:');
      console.log('='.repeat(50));
      
      Object.values(agents).forEach(agent => {
        console.log(`\n👤 ${agent.name} (${agent.id})`);
        console.log(`   Type: ${agent.type}`);
        console.log(`   Specialties: ${agent.specialties.join(', ')}`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   Created: ${new Date(agent.created_at).toLocaleString()}`);
      });

      console.log(`\n📊 Total Agents: ${Object.keys(agents).length}`);
    } catch (error) {
      console.error(`❌ Failed to list agents: ${error.message}`);
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🧠 Agent Bootstrap Tool - Intervector Command Center
Designed by PROMETHEUS & THEO-5001

Usage:
  node agent-bootstrap.js [command] [options]

Commands:
  register    Register a new agent
  list        List all registered agents
  help        Show this help message

Register Options:
  --name <name>           Agent name (required)
  --type <type>           Agent type: ${Object.keys(AGENT_TYPES).join(', ')}
  --specialties <specs>   Comma-separated specialties
  --description <desc>    Agent description
  --priority <priority>   Priority level: CRITICAL, HIGH, MEDIUM, LOW

Examples:
  node agent-bootstrap.js register --name "ALEX-5003" --type developer --specialties "realtime,websocket"
  node agent-bootstrap.js register --name "SECURITY-AGENT" --type specialist --specialties "security,monitoring"
  node agent-bootstrap.js list

Agent Types:
${Object.entries(AGENT_TYPES).map(([type, desc]) => `  ${type.padEnd(12)} ${desc}`).join('\n')}

Specialties:
${Object.entries(SPECIALTIES).map(([spec, desc]) => `  ${spec.padEnd(12)} ${desc}`).join('\n')}
`);
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const bootstrap = new AgentBootstrap();

  switch (command) {
    case 'register':
      const options = {};
      for (let i = 1; i < args.length; i += 2) {
        const key = args[i]?.replace('--', '');
        const value = args[i + 1];
        if (key && value) {
          if (key === 'specialties') {
            options[key] = value.split(',').map(s => s.trim());
          } else {
            options[key] = value;
          }
        }
      }

      if (!options.name || !options.type) {
        console.error('❌ --name and --type are required for registration');
        bootstrap.showHelp();
        process.exit(1);
      }

      bootstrap.registerAgent(options)
        .then(() => {
          console.log('\n🎉 Agent registration completed successfully!');
          console.log('🚀 Agent is ready for INTERVECTOR COMMUNICATION!');
        })
        .catch(error => {
          console.error(`\n💥 Registration failed: ${error.message}`);
          process.exit(1);
        });
      break;

    case 'list':
      bootstrap.listAgents();
      break;

    case 'help':
    default:
      bootstrap.showHelp();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = AgentBootstrap;