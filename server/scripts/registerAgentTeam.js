// Register 12-Agent Team for Voice Agent Telnyx App
// This script creates the complete team structure with names, roles, and tasks
// All information will be visible in the Command Center dashboard

const axios = require('axios');

const API_BASE = 'http://localhost:7500/api';

const projectData = {
  id: 'voice-agent-telnyx-app',
  name: 'Voice Agent Telnyx App',
  description: 'Multi-level marketing voice AI system with genealogy tracking and white-label replication',
  status: 'active',
  github_url: 'https://github.com/devklg/voice-agent-telnyx-app',
  github_branch: 'main',
  repository_path: 'd:/voice-agent-telnyx-app',
  total_stories: 89,
  completed_stories: 0,
  in_progress_stories: 4,
  total_agents: 12,
  active_agents: 0
};

// 12 Role-Based Agents with Complete Profiles
const agentTeam = [
  {
    // Agent 1: Atlas - Infrastructure Architect
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Atlas',
    agent_name: 'Atlas',
    role: 'Infrastructure Architect',
    type: 'infrastructure-architect',
    specialties: ['database-architecture', 'neo4j', 'postgresql', 'mongodb', 'redis', 'chromadb', 'data-modeling'],
    assigned_stories: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9'],
    branch_pattern: 'feature/atlas-infrastructure',
    description: 'Database architecture and infrastructure design for all 5 database systems (MongoDB, PostgreSQL, Neo4j, Redis, ChromaDB) and genealogy graph implementation',
    priority: 'HIGH',
    tasks: [
      'Epic 1: Configure MongoDB connection and schema (Story 1.2)',
      'Epic 1: Configure PostgreSQL connection and core tables (Story 1.3)',
      'Epic 1: Configure Neo4j connection and genealogy schema (Story 1.4)',
      'Epic 1: Configure Redis connection and caching strategy (Story 1.5)',
      'Epic 1: Configure ChromaDB connection and vector storage (Story 1.6)',
      'Epic 8: Implement partner node creation in Neo4j (Story 8.1)',
      'Epic 8: Implement sponsorship relationship tracking (Story 8.2)',
      'Epic 8: Build genealogy tree traversal queries (Story 8.3)',
      'Epic 8: Implement downline analytics and metrics (Story 8.4)',
      'Epic 8: Build upline sponsor chain visualization (Story 8.5)',
      'Epic 8: Implement genealogy search and filtering (Story 8.6)',
      'Epic 8: Create genealogy performance optimization (Story 8.7)',
      'Epic 8: Build genealogy data export functionality (Story 8.8)',
      'Epic 8: Implement genealogy integrity validation (Story 8.9)'
    ],
    success_criteria: [
      'All 5 database connections established and tested',
      'Database schemas created for all entities',
      'Neo4j genealogy graph fully implemented',
      'Data consistency maintained across databases',
      'Documentation complete for all database patterns',
      'All 15 stories completed with passing tests'
    ],
    estimated_time_hours: 60
  },
  {
    // Agent 2: Phoenix - DevOps Engineer
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Phoenix',
    agent_name: 'Phoenix',
    role: 'DevOps Engineer',
    type: 'devops-engineer',
    specialties: ['docker', 'ci-cd', 'github-actions', 'monitoring', 'infrastructure-as-code', 'deployment'],
    assigned_stories: ['1.7', '1.8', '1.9', '1.10', '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10'],
    branch_pattern: 'feature/phoenix-devops',
    description: 'DevOps infrastructure, CI/CD pipelines, monitoring, and white-label replication system implementation',
    priority: 'HIGH',
    tasks: [
      'Epic 1: Create Docker Compose configuration for local development (Story 1.7)',
      'Epic 1: Configure CI/CD pipeline with GitHub Actions (Story 1.8)',
      'Epic 1: Set up monitoring and logging infrastructure (Story 1.9)',
      'Epic 1: Create environment-specific configuration management (Story 1.10)',
      'Epic 9: Design replication architecture (Story 9.1)',
      'Epic 9: Implement replica provisioning system (Story 9.2)',
      'Epic 9: Build white-label customization engine (Story 9.3)',
      'Epic 9: Create replica deployment automation (Story 9.4)',
      'Epic 9: Implement replica monitoring system (Story 9.5)',
      'Epic 9: Build replica update distribution (Story 9.6)',
      'Epic 9: Create replica data isolation (Story 9.7)',
      'Epic 9: Implement replica backup and recovery (Story 9.8)',
      'Epic 9: Build replica health checks (Story 9.9)',
      'Epic 9: Create replica management dashboard (Story 9.10)'
    ],
    success_criteria: [
      'Docker Compose working for local development',
      'CI/CD pipeline deploying successfully',
      'Monitoring dashboards operational',
      'Configuration management working across environments',
      'Replication system fully functional',
      'All 14 stories completed with passing tests'
    ],
    estimated_time_hours: 56
  },
  {
    // Agent 3: Nexus - Voice AI Integration Specialist
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Nexus',
    agent_name: 'Nexus',
    role: 'Voice AI Integration Specialist',
    type: 'voice-ai-specialist',
    specialties: ['telnyx-api', 'claude-ai', 'real-time-communication', 'ai-orchestration', 'qualification-logic'],
    assigned_stories: ['2.1', '2.2', '2.3', '2.10'],
    branch_pattern: 'feature/nexus-voice-ai',
    description: 'Telnyx Call Control API integration, Claude AI conversation streaming, qualification logic, and AI quality monitoring',
    priority: 'HIGH',
    tasks: [
      'Epic 2: Integrate Telnyx Call Control API and initiate outbound calls (Story 2.1)',
      'Epic 2: Handle call connection and start Claude AI conversation stream (Story 2.2)',
      'Epic 2: Implement Ron Maleziis qualification logic with BANTI framework (Story 2.3)',
      'Epic 2: Implement AI conversation quality monitoring and improvement (Story 2.10)'
    ],
    success_criteria: [
      'Telnyx Call Control API integrated successfully',
      'Claude AI streaming conversations working with <500ms latency',
      'BANTI qualification framework implemented',
      'Quality monitoring system operational',
      'All 4 stories completed with passing tests'
    ],
    estimated_time_hours: 32
  },
  {
    // Agent 4: Echo - Speech & Transcription Engineer
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Echo',
    agent_name: 'Echo',
    role: 'Speech & Transcription Engineer',
    type: 'speech-engineer',
    specialties: ['deepgram', 'speech-to-text', 'text-to-speech', 'audio-processing', 'speaker-diarization'],
    assigned_stories: ['2.4', '2.7'],
    branch_pattern: 'feature/echo-transcription',
    description: 'Real-time speech-to-text transcription with Deepgram and call recording system implementation',
    priority: 'HIGH',
    tasks: [
      'Epic 2: Implement real-time call transcription with Deepgram (Story 2.4)',
      'Epic 2: Implement call recording and storage with dual-channel audio (Story 2.7)'
    ],
    success_criteria: [
      'Deepgram integration working for real-time STT',
      'Speaker diarization implemented',
      'Transcripts stored in MongoDB and ChromaDB',
      'Call recording system with dual-channel audio working',
      'All 2 stories completed with passing tests'
    ],
    estimated_time_hours: 16
  },
  {
    // Agent 5: Bridge - Call Management Specialist
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Bridge',
    agent_name: 'Bridge',
    role: 'Call Management Specialist',
    type: 'call-manager',
    specialties: ['call-flow', 'hot-transfer', 'webhook-handling', 'state-management', 'cost-tracking'],
    assigned_stories: ['2.5', '2.6', '2.8', '2.9'],
    branch_pattern: 'feature/bridge-call-management',
    description: 'Call flow control, hot transfer protocol, webhook handling, cost tracking, and state management',
    priority: 'HIGH',
    tasks: [
      'Epic 2: Implement 5-step hot transfer protocol to partner sponsors (Story 2.5)',
      'Epic 2: Implement webhook handler for Telnyx call events with HMAC validation (Story 2.6)',
      'Epic 2: Implement call cost tracking and budget management (Story 2.8)',
      'Epic 2: Implement call state management with Redis caching (Story 2.9)'
    ],
    success_criteria: [
      'Hot transfer protocol working with 5-step handoff',
      'Webhook handler processing events idempotently',
      'Cost tracking and budget enforcement operational',
      'Call state management with Redis working',
      'All 4 stories completed with passing tests'
    ],
    estimated_time_hours: 32
  },
  {
    // Agent 6: Sage - CRM & Analytics Engineer
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Sage',
    agent_name: 'Sage',
    role: 'CRM & Analytics Engineer',
    type: 'crm-engineer',
    specialties: ['crm-systems', 'ai-follow-up', 'graphrag', 'analytics', 'postgresql', 'data-visualization'],
    assigned_stories: ['3.1', '3.2', '3.3', '3.4', '3.5'],
    branch_pattern: 'feature/sage-crm',
    description: 'AI-powered CRM with lead management, automated follow-up, GraphRAG relationship intelligence, and analytics',
    priority: 'MEDIUM',
    tasks: [
      'Epic 3: Implement lead CRUD operations (Story 3.1)',
      'Epic 3: Implement AI agentic follow-up system (Story 3.2)',
      'Epic 3: Implement GraphRAG relationship mapping (Story 3.3)',
      'Epic 3: Implement empowerment analytics dashboard (Story 3.4)',
      'Epic 3: Implement traditional CRM features (notes, tasks, etc.) (Story 3.5)'
    ],
    success_criteria: [
      'Lead CRUD operations working',
      'AI follow-up system operational',
      'GraphRAG relationship mapping implemented',
      'Analytics dashboard displaying metrics',
      'Traditional CRM features functional',
      'All 5 stories completed with passing tests'
    ],
    estimated_time_hours: 40
  },
  {
    // Agent 7: Tempo - Scheduling & Calendar Specialist
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Tempo',
    agent_name: 'Tempo',
    role: 'Scheduling & Calendar Specialist',
    type: 'scheduling-specialist',
    specialties: ['calendar-apis', 'google-calendar', 'outlook', 'scheduling-algorithms', 'notifications', 'timezone-handling'],
    assigned_stories: ['4.1', '4.2', '4.3', '4.4'],
    branch_pattern: 'feature/tempo-scheduling',
    description: 'Automated appointment scheduling with calendar integrations, reminders, and rescheduling handling',
    priority: 'MEDIUM',
    tasks: [
      'Epic 4: Implement automated appointment scheduling (Story 4.1)',
      'Epic 4: Implement calendar integrations (Google, Outlook, Apple) (Story 4.2)',
      'Epic 4: Implement reminder notification system (Story 4.3)',
      'Epic 4: Implement rescheduling and cancellation handling (Story 4.4)'
    ],
    success_criteria: [
      'Automated scheduling working',
      'Calendar integrations functional for all platforms',
      'Reminder system sending notifications',
      'Rescheduling and cancellations handled properly',
      'All 4 stories completed with passing tests'
    ],
    estimated_time_hours: 32
  },
  {
    // Agent 8: Horizon - Dashboard & Monitoring UI Lead
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Horizon',
    agent_name: 'Horizon',
    role: 'Dashboard & Monitoring UI Lead',
    type: 'frontend-engineer',
    specialties: ['react', 'nextjs', 'real-time-visualization', 'websockets', 'dashboard-ui', 'performance-optimization'],
    assigned_stories: ['5.1', '5.2', '5.3', '5.4', '5.5'],
    branch_pattern: 'feature/horizon-dashboard',
    description: 'Real-time partner dashboard with call monitoring, metrics visualization, and white-label branding',
    priority: 'MEDIUM',
    tasks: [
      'Epic 5: Implement real-time call monitoring dashboard (Story 5.1)',
      'Epic 5: Implement performance metrics visualization (Story 5.2)',
      'Epic 5: Implement call history and playback interface (Story 5.3)',
      'Epic 5: Implement team leadership views (Story 5.4)',
      'Epic 5: Implement white-label brand customization (Story 5.5)'
    ],
    success_criteria: [
      'Real-time monitoring dashboard operational',
      'Performance metrics displaying correctly',
      'Call history and playback working',
      'Team leadership views functional',
      'White-label branding system implemented',
      'All 5 stories completed with passing tests'
    ],
    estimated_time_hours: 40
  },
  {
    // Agent 9: Mentor - Training & Coaching Systems Engineer
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Mentor',
    agent_name: 'Mentor',
    role: 'Training & Coaching Systems Engineer',
    type: 'training-specialist',
    specialties: ['lms', 'ai-coaching', 'content-management', 'skill-assessment', 'knowledge-organization'],
    assigned_stories: ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7'],
    branch_pattern: 'feature/mentor-training',
    description: 'Leadership development platform with training content, AI coaching, mentorship, and skill assessment',
    priority: 'LOW',
    tasks: [
      'Epic 6: Implement training content management system (Story 6.1)',
      'Epic 6: Implement AI coaching engine (Story 6.2)',
      'Epic 6: Implement mentorship platform (Story 6.3)',
      'Epic 6: Implement knowledge library organization (Story 6.4)',
      'Epic 6: Implement skill assessment system (Story 6.5)',
      'Epic 6: Implement team training tools (Story 6.6)',
      'Epic 6: Implement duplication framework (Story 6.7)'
    ],
    success_criteria: [
      'Training content management system working',
      'AI coaching engine operational',
      'Mentorship platform functional',
      'Knowledge library organized and searchable',
      'Skill assessment system implemented',
      'Team training tools working',
      'Duplication framework complete',
      'All 7 stories completed with passing tests'
    ],
    estimated_time_hours: 56
  },
  {
    // Agent 10: Sovereign - Master Admin & Control Panel Lead
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Sovereign',
    agent_name: 'Sovereign',
    role: 'Master Admin & Control Panel Lead',
    type: 'admin-engineer',
    specialties: ['multi-tenant-architecture', 'admin-dashboards', 'access-control', 'financial-controls', 'system-monitoring'],
    assigned_stories: ['7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9'],
    branch_pattern: 'feature/sovereign-admin',
    description: 'Master administration system with global settings, partner management, analytics, compliance, and financial controls',
    priority: 'LOW',
    tasks: [
      'Epic 7: Implement master administration dashboard (Story 7.1)',
      'Epic 7: Implement global settings control (Story 7.2)',
      'Epic 7: Implement partner management system (Story 7.3)',
      'Epic 7: Implement organization analytics (Story 7.4)',
      'Epic 7: Implement genealogy oversight tools (Story 7.5)',
      'Epic 7: Implement compliance and audit features (Story 7.6)',
      'Epic 7: Implement replica management interface (Story 7.7)',
      'Epic 7: Implement financial controls and reporting (Story 7.8)',
      'Epic 7: Implement system monitoring dashboard (Story 7.9)'
    ],
    success_criteria: [
      'Master admin dashboard operational',
      'Global settings control working',
      'Partner management system functional',
      'Organization analytics displaying',
      'Genealogy oversight tools working',
      'Compliance and audit features implemented',
      'Replica management interface functional',
      'Financial controls operational',
      'System monitoring working',
      'All 9 stories completed with passing tests'
    ],
    estimated_time_hours: 72
  },
  {
    // Agent 11: Pulse - Communications Hub Engineer
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Pulse',
    agent_name: 'Pulse',
    role: 'Communications Hub Engineer',
    type: 'communications-engineer',
    specialties: ['messaging-systems', 'notifications', 'real-time-communication', 'push-notifications', 'email'],
    assigned_stories: ['10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.7', '10.8'],
    branch_pattern: 'feature/pulse-communications',
    description: 'Team communications and engagement hub with messaging, notifications, and collaboration features',
    priority: 'LOW',
    tasks: [
      'Epic 10: Implement team messaging system (Story 10.1)',
      'Epic 10: Implement notification engine (push, email, SMS) (Story 10.2)',
      'Epic 10: Implement announcement and broadcast features (Story 10.3)',
      'Epic 10: Implement team collaboration tools (Story 10.4)',
      'Epic 10: Implement engagement tracking (Story 10.5)',
      'Epic 10: Implement communication preferences (Story 10.6)',
      'Epic 10: Implement communication analytics (Story 10.7)',
      'Epic 10: Implement mobile push notifications (Story 10.8)'
    ],
    success_criteria: [
      'Team messaging system working',
      'Notification engine sending all types',
      'Announcement and broadcast features functional',
      'Team collaboration tools operational',
      'Engagement tracking implemented',
      'Communication preferences working',
      'Communication analytics displaying',
      'Mobile push notifications sending',
      'All 8 stories completed with passing tests'
    ],
    estimated_time_hours: 64
  },
  {
    // Agent 12: Guardian - Security & Compliance Specialist
    project_id: 'voice-agent-telnyx-app',
    role_name: 'Guardian',
    agent_name: 'Guardian',
    role: 'Security & Compliance Specialist',
    type: 'security-specialist',
    specialties: ['authentication', 'authorization', 'encryption', 'security-auditing', 'compliance', 'vulnerability-assessment'],
    assigned_stories: [],
    branch_pattern: 'feature/guardian-security',
    description: 'Cross-functional security and compliance specialist ensuring all code meets security standards',
    priority: 'HIGH',
    tasks: [
      'Review all PRs for security vulnerabilities',
      'Implement authentication system across all services',
      'Add authorization and permission layers',
      'Ensure data encryption at rest and in transit',
      'Create comprehensive audit logging system',
      'Implement security best practices throughout codebase',
      'Conduct regular security reviews',
      'Document compliance procedures (GDPR, HIPAA, etc.)',
      'Perform vulnerability assessments',
      'Create security incident response procedures'
    ],
    success_criteria: [
      'All PRs reviewed for security issues',
      'Authentication system implemented',
      'Authorization working across all services',
      'Data encryption verified',
      'Audit logging operational',
      'Security best practices documented',
      'Compliance documentation complete',
      'Zero critical security vulnerabilities'
    ],
    estimated_time_hours: 80
  }
];

async function registerAgentTeam() {
  try {
    console.log('🚀 Registering 12-Agent Team in Command Center...\n');

    // 1. Register/Update project
    console.log('📦 Registering project...');
    try {
      const projectResponse = await axios.post(`${API_BASE}/projects`, projectData);
      console.log(`✅ Project registered: ${projectResponse.data.data.name}\n`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  Project already exists, updating...');
        await axios.put(`${API_BASE}/projects/${projectData.id}`, projectData);
        console.log(`✅ Project updated: ${projectData.name}\n`);
      } else {
        throw error;
      }
    }

    // 2. Create activation templates for all 12 agents
    console.log('📝 Creating activation templates for 12 agents...\n');
    let templateCount = 0;

    for (const agent of agentTeam) {
      try {
        const response = await axios.post(`${API_BASE}/activation/templates`, agent);
        templateCount++;
        console.log(`✅ [${templateCount}/12] ${agent.agent_name} (${agent.role})`);
        console.log(`   Stories: ${agent.assigned_stories.length} assigned`);
        console.log(`   Time Estimate: ${agent.estimated_time_hours} hours`);
        console.log(`   Priority: ${agent.priority}\n`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
          console.log(`ℹ️  [${templateCount + 1}/12] ${agent.agent_name} template already exists, skipping...\n`);
          templateCount++;
        } else {
          throw error;
        }
      }
    }

    // 3. Display summary
    console.log('\n' + '='.repeat(70));
    console.log('✨ AGENT TEAM REGISTRATION COMPLETE!\n');
    console.log('📊 Team Summary:');
    console.log(`   Project: ${projectData.name}`);
    console.log(`   Total Agents: ${agentTeam.length}`);
    console.log(`   Total Stories: ${projectData.total_stories}`);
    console.log(`   Dashboard: http://localhost:3007\n`);

    console.log('👥 Agent Roster:\n');
    agentTeam.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent.agent_name} - ${agent.role}`);
      console.log(`      Stories: ${agent.assigned_stories.length}`);
      console.log(`      Specialties: ${agent.specialties.slice(0, 3).join(', ')}`);
      console.log(`      Priority: ${agent.priority}\n`);
    });

    console.log('🎯 Next Steps:\n');
    console.log('   1. Visit Command Center dashboard: http://localhost:3007');
    console.log('   2. View all agents and their assigned tasks');
    console.log('   3. Activate agents using self-activation API:');
    console.log('      curl -X POST http://localhost:7500/api/activation/self-activate \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{"project_id": "voice-agent-telnyx-app", "role_name": "Atlas"}\'');
    console.log('   4. Copy activation prompt and paste into Claude Code Mobile');
    console.log('   5. Repeat for each agent\n');

    console.log('📚 Documentation:');
    console.log('   - Agent Team Structure: docs/AGENT-TEAM-STRUCTURE.md');
    console.log('   - Parallel Development: docs/PARALLEL-DEVELOPMENT-GUIDE.md');
    console.log('   - Self-Activation Guide: docs/SELF-ACTIVATION-GUIDE.md\n');

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the registration
registerAgentTeam();
