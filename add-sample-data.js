// Simple script to add sample data via the API
const axios = require('axios');

const API_URL = 'http://localhost:7500/api';

// Sample agents for your Voice Agent Telnyx App
const sampleAgents = [
  {
    name: 'PROMETHEUS',
    type: 'orchestrator',
    specialties: ['system-coordination', 'task-delegation'],
    status: 'online',
    priority: 'CRITICAL',
    description: 'Main orchestrator for the 77-agent system'
  },
  {
    name: 'THEO-5001',
    type: 'architect',
    specialties: ['system-design', 'architecture'],
    status: 'online',
    priority: 'CRITICAL',
    description: 'System architect and design coordinator'
  },
  {
    name: 'TelnyxConnector',
    type: 'integration',
    specialties: ['telnyx-api', 'connectivity'],
    status: 'online',
    priority: 'HIGH',
    description: 'Handles all Telnyx API integrations'
  },
  {
    name: 'VoiceProcessor',
    type: 'processor',
    specialties: ['voice-processing', 'audio'],
    status: 'online',
    priority: 'HIGH',
    description: 'Processes voice data and audio streams'
  },
  {
    name: 'NLPEngine',
    type: 'ai',
    specialties: ['nlp', 'understanding'],
    status: 'online',
    priority: 'HIGH',
    description: 'Natural language processing and understanding'
  }
];

// Sample project
const sampleProject = {
  name: 'Voice Agent Telnyx App',
  description: 'Multi-agent voice application using Telnyx API with 77 parallel agents',
  status: 'active',
  agents: []  // Will be populated after creating agents
};

async function addSampleData() {
  console.log('🚀 Adding sample data to Agent Command Center...\n');

  try {
    // Add agents
    console.log('📍 Adding agents...');
    const createdAgents = [];

    for (const agent of sampleAgents) {
      try {
        const response = await axios.post(`${API_URL}/agents`, agent);
        createdAgents.push(response.data.data);
        console.log(`  ✓ Added agent: ${agent.name}`);
      } catch (error) {
        console.log(`  ⚠ Agent ${agent.name} might already exist`);
      }
    }

    // Add project
    console.log('\n📁 Adding project...');
    sampleProject.agents = createdAgents.map(a => a.id);

    try {
      await axios.post(`${API_URL}/projects`, sampleProject);
      console.log(`  ✓ Added project: ${sampleProject.name}`);
    } catch (error) {
      console.log('  ⚠ Project might already exist');
    }

    console.log('\n✨ Sample data added successfully!');
    console.log('🌐 Open http://localhost:3007 to see your dashboard');
    console.log('\n📝 Note: This added 5 sample agents. You can add the remaining 72 agents');
    console.log('   through the UI or by extending this script.');

  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
    console.log('\n⚠️  Make sure the backend is running on port 7500');
  }
}

// Run the script
addSampleData();