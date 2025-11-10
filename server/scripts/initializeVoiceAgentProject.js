// Initialize Voice Agent Telnyx App Project in Command Center
// This script registers the project and creates activation templates

const axios = require('axios');

const API_BASE = 'http://localhost:7500/api';

const projectData = {
  id: 'voice-agent-telnyx-app',
  name: 'Voice Agent Telnyx App',
  description: 'Multi-agent voice application using Telnyx API with parallel AI development agents',
  status: 'active',
  github_url: 'https://github.com/devklg/voice-agent-telnyx-app',
  github_branch: 'main',
  repository_path: 'd:/voice-agent-telnyx-app',
  total_stories: 91,
  completed_stories: 0,
  in_progress_stories: 3,
  total_agents: 77,
  active_agents: 3
};

const activationTemplates = [
  // Epic 1: Project Setup & Core Infrastructure
  {
    project_id: 'voice-agent-telnyx-app',
    role_name: 'DataArchitect',
    agent_name: 'DataArchitect',
    role: 'Database Architect & Knowledge Base Engineer',
    type: 'database-engineer',
    specialties: ['neon-postgresql', 'neo4j', 'knowledge-base', 'mcp-integration'],
    assigned_stories: [],
    branch_pattern: 'feature/knowledge-base-integration',
    description: 'Integrate Neon PostgreSQL and Neo4j into the Agent Intervector Command Center to create a comprehensive knowledge base system that enables all AI development agents to share learnings, framework documentation, and problem-solutions.',
    priority: 'HIGH',
    tasks: [
      'Complete Neon PostgreSQL integration using MCP tools',
      'Implement all CRUD operations for knowledge base',
      'Implement Neo4j graph database for agent relationships',
      'Create API routes for knowledge management',
      'Test all integrations with real data',
      'Write comprehensive documentation'
    ],
    success_criteria: [
      'Neon PostgreSQL connected via MCP',
      'All 6 tables created (agent_knowledge, framework_docs, troubleshooting, code_patterns, story_learnings, agent_expertise)',
      'Knowledge storage working with real data',
      'Neo4j connected via MCP with agent nodes created',
      'API routes implemented and tested',
      'Documentation complete'
    ]
  },
  {
    project_id: 'voice-agent-telnyx-app',
    role_name: 'UIDesigner',
    agent_name: 'UIDesigner',
    role: 'Frontend Engineer & Brand Designer',
    type: 'frontend-engineer',
    specialties: ['react', 'css', 'brand-design', 'magnificent-worldwide-styling'],
    assigned_stories: [],
    branch_pattern: 'feature/ui-rebrand',
    description: 'Apply the Magnificent Worldwide Marketing & Sales Group brand identity to the Agent Intervector Command Center dashboard and add GitHub project integration display.',
    priority: 'HIGH',
    tasks: [
      'Import and apply brand CSS (Orbitron + Poppins fonts)',
      'Update header with gradient effects',
      'Style agent cards with elevated design and hover effects',
      'Create GitHub project integration card component',
      'Update project data with GitHub information',
      'Test all pages for consistent styling'
    ],
    success_criteria: [
      'Brand fonts loaded (Orbitron + Poppins)',
      'Brand colors applied throughout (blue #3b82f6, gold #facc15)',
      'Gradient effects on key headers',
      'Card hover effects working',
      'GitHub project card displaying with repository link',
      'All pages styled consistently',
      'No console errors'
    ]
  },
  {
    project_id: 'voice-agent-telnyx-app',
    role_name: 'BackendEngineer',
    agent_name: 'BackendEngineer',
    role: 'Backend Engineer & Agent Coordinator',
    type: 'backend-engineer',
    specialties: ['nodejs', 'api-design', 'agent-coordination'],
    assigned_stories: [],
    branch_pattern: 'feature/agent-roles-structure',
    description: 'Create the agent role assignment structure that allows Kevin to assign multiple stories to one named agent with a specific role (e.g., "DatabaseArchitect" handling multiple database-related stories).',
    priority: 'HIGH',
    tasks: [
      'Create agentRoles.js configuration with Epic 1-2 roles',
      'Update git hook for new naming convention (role-based)',
      'Implement API routes for role assignments',
      'Create agent activation prompt generator utility',
      'Test role registration and story lookup',
      'Write comprehensive documentation'
    ],
    success_criteria: [
      'agentRoles.js created with role definitions',
      'Git hook updated for new naming convention',
      'API routes implemented (/api/assignments)',
      'Registration endpoint working',
      'Story lookup working',
      'Activation prompt generator functional',
      'Documentation complete'
    ]
  }
];

async function initialize() {
  try {
    console.log('🚀 Initializing Voice Agent Telnyx App project in Command Center...\n');

    // 1. Register project
    console.log('📦 Registering project...');
    const projectResponse = await axios.post(`${API_BASE}/projects`, projectData);
    console.log(`✅ Project registered: ${projectResponse.data.data.name}\n`);

    // 2. Create activation templates
    console.log('📝 Creating activation templates...');
    for (const template of activationTemplates) {
      const response = await axios.post(`${API_BASE}/activation/templates`, template);
      console.log(`✅ Template created: ${response.data.data.agent_name}`);
    }

    console.log('\n✨ Initialization complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Project: ${projectData.name}`);
    console.log(`   - Activation Templates: ${activationTemplates.length}`);
    console.log(`   - Dashboard: http://localhost:3007`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Generate activation prompts via API');
    console.log('   2. Spin up Claude Code mobile instances');
    console.log('   3. Monitor progress on dashboard\n');

  } catch (error) {
    console.error('❌ Initialization failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

initialize();
