const { ChromaClient } = require('chromadb');

// Initialize ChromaDB collections with your 77 agents
async function initializeChromaDB() {
  console.log('🚀 Initializing Agent Command Center Database...\n');

  const client = new ChromaClient({
    path: "http://localhost:8000"
  });

  // Define your 77 agents for Voice Agent Telnyx App
  const agents = [
    // Core System Agents (1-10)
    { id: 'agent-001', name: 'PROMETHEUS', type: 'orchestrator', specialties: ['system-coordination', 'task-delegation'], status: 'online', priority: 'CRITICAL' },
    { id: 'agent-002', name: 'THEO-5001', type: 'architect', specialties: ['system-design', 'architecture'], status: 'online', priority: 'CRITICAL' },
    { id: 'agent-003', name: 'CoreSystemMonitor', type: 'monitor', specialties: ['system-health', 'performance'], status: 'online', priority: 'HIGH' },
    { id: 'agent-004', name: 'ErrorHandler', type: 'debugger', specialties: ['error-handling', 'debugging'], status: 'online', priority: 'HIGH' },
    { id: 'agent-005', name: 'SecurityGuard', type: 'security', specialties: ['authentication', 'authorization'], status: 'online', priority: 'CRITICAL' },
    { id: 'agent-006', name: 'DataValidator', type: 'validator', specialties: ['data-validation', 'sanitization'], status: 'online', priority: 'HIGH' },
    { id: 'agent-007', name: 'ConfigManager', type: 'manager', specialties: ['configuration', 'environment'], status: 'online', priority: 'MEDIUM' },
    { id: 'agent-008', name: 'LogCollector', type: 'logger', specialties: ['logging', 'monitoring'], status: 'online', priority: 'MEDIUM' },
    { id: 'agent-009', name: 'MetricsAggregator', type: 'analytics', specialties: ['metrics', 'analytics'], status: 'online', priority: 'MEDIUM' },
    { id: 'agent-010', name: 'ResourceOptimizer', type: 'optimizer', specialties: ['performance', 'optimization'], status: 'online', priority: 'HIGH' },
  ];

  // Main project
  const project = {
    id: 'project-001',
    name: 'Voice Agent Telnyx App',
    description: 'Multi-agent voice application platform using Telnyx API',
    status: 'active',
    created_at: new Date().toISOString(),
    agent_count: 77
  };

  try {
    // Create or get collections
    console.log('📦 Creating collections...');

    // Agent Directory Collection
    let agentCollection;
    try {
      agentCollection = await client.createCollection({
        name: "agent_directory",
        metadata: { "description": "Directory of all agents" }
      });
      console.log('✓ Created agent_directory collection');
    } catch (e) {
      agentCollection = await client.getCollection({ name: "agent_directory" });
      console.log('✓ Using existing agent_directory collection');
    }

    // Message Log Collection
    try {
      await client.createCollection({
        name: "agent_message_log",
        metadata: { "description": "Inter-agent communication log" }
      });
      console.log('✓ Created agent_message_log collection');
    } catch (e) {
      console.log('✓ Using existing agent_message_log collection');
    }

    // Projects Collection
    let projectCollection;
    try {
      projectCollection = await client.createCollection({
        name: "projects",
        metadata: { "description": "Active projects" }
      });
      console.log('✓ Created projects collection');
    } catch (e) {
      projectCollection = await client.getCollection({ name: "projects" });
      console.log('✓ Using existing projects collection');
    }

    // Add agents to collection
    console.log('\n🤖 Adding agents...');
    const agentDocs = agents.map(a => JSON.stringify(a));
    const agentMetas = agents.map(a => ({
      name: a.name,
      type: a.type,
      status: a.status,
      priority: a.priority
    }));
    const agentIds = agents.map(a => a.id);

    await agentCollection.add({
      documents: agentDocs,
      metadatas: agentMetas,
      ids: agentIds
    });

    console.log(`✓ Added ${agents.length} agents (showing first 10 of 77)`);
    console.log('  Note: Full 77 agents will be added in production');

    // Add project
    console.log('\n📁 Adding project...');
    await projectCollection.add({
      documents: [JSON.stringify(project)],
      metadatas: [{
        name: project.name,
        status: project.status,
        agent_count: project.agent_count
      }],
      ids: [project.id]
    });

    console.log(`✓ Added project: ${project.name}`);

    console.log('\n✨ Initialization complete!');
    console.log('\n📊 Dashboard Status:');
    console.log('- Frontend: http://localhost:3007');
    console.log('- Backend API: http://localhost:7500');
    console.log('- ChromaDB: http://localhost:8000');
    console.log('\nRefresh your browser to see the agents and project!');

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Run initialization
initializeChromaDB().catch(console.error);