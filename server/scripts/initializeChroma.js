#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const CHROMA_URL = process.env.CHROMA_API_URL || 'http://localhost:8000';

// Define the 77 agents for the Voice Agent Telnyx App
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

  // Telnyx Integration Agents (11-25)
  { id: 'agent-011', name: 'TelnyxConnector', type: 'integration', specialties: ['telnyx-api', 'connectivity'], status: 'online', priority: 'CRITICAL' },
  { id: 'agent-012', name: 'CallRouter', type: 'router', specialties: ['call-routing', 'sip'], status: 'online', priority: 'HIGH' },
  { id: 'agent-013', name: 'VoiceProcessor', type: 'processor', specialties: ['voice-processing', 'audio'], status: 'online', priority: 'HIGH' },
  { id: 'agent-014', name: 'TranscriptionEngine', type: 'transcriber', specialties: ['speech-to-text', 'transcription'], status: 'online', priority: 'HIGH' },
  { id: 'agent-015', name: 'TTSEngine', type: 'synthesizer', specialties: ['text-to-speech', 'synthesis'], status: 'online', priority: 'HIGH' },
  { id: 'agent-016', name: 'WebRTCHandler', type: 'handler', specialties: ['webrtc', 'real-time'], status: 'online', priority: 'HIGH' },
  { id: 'agent-017', name: 'SIPManager', type: 'manager', specialties: ['sip-protocol', 'signaling'], status: 'online', priority: 'HIGH' },
  { id: 'agent-018', name: 'MediaStreamController', type: 'controller', specialties: ['media-streams', 'rtp'], status: 'online', priority: 'HIGH' },
  { id: 'agent-019', name: 'CodecNegotiator', type: 'negotiator', specialties: ['codecs', 'media-formats'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-020', name: 'SessionManager', type: 'manager', specialties: ['session-management', 'state'], status: 'online', priority: 'HIGH' },
  { id: 'agent-021', name: 'QualityMonitor', type: 'monitor', specialties: ['call-quality', 'QoS'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-022', name: 'RecordingAgent', type: 'recorder', specialties: ['call-recording', 'storage'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-023', name: 'ConferenceManager', type: 'manager', specialties: ['conferencing', 'multi-party'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-024', name: 'DTMFProcessor', type: 'processor', specialties: ['dtmf', 'tone-detection'], status: 'online', priority: 'LOW' },
  { id: 'agent-025', name: 'NumberPorting', type: 'service', specialties: ['number-porting', 'provisioning'], status: 'online', priority: 'LOW' },

  // AI & NLP Agents (26-40)
  { id: 'agent-026', name: 'NLPEngine', type: 'ai', specialties: ['nlp', 'understanding'], status: 'online', priority: 'HIGH' },
  { id: 'agent-027', name: 'IntentClassifier', type: 'classifier', specialties: ['intent-detection', 'classification'], status: 'online', priority: 'HIGH' },
  { id: 'agent-028', name: 'EntityExtractor', type: 'extractor', specialties: ['entity-extraction', 'ner'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-029', name: 'SentimentAnalyzer', type: 'analyzer', specialties: ['sentiment', 'emotion'], status: 'online', priority: 'LOW' },
  { id: 'agent-030', name: 'DialogManager', type: 'manager', specialties: ['dialog-flow', 'conversation'], status: 'online', priority: 'HIGH' },
  { id: 'agent-031', name: 'ContextTracker', type: 'tracker', specialties: ['context', 'state-tracking'], status: 'online', priority: 'HIGH' },
  { id: 'agent-032', name: 'ResponseGenerator', type: 'generator', specialties: ['response-generation', 'nlg'], status: 'online', priority: 'HIGH' },
  { id: 'agent-033', name: 'KnowledgeBase', type: 'knowledge', specialties: ['knowledge-management', 'faq'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-034', name: 'TrainingOptimizer', type: 'optimizer', specialties: ['model-training', 'ml-ops'], status: 'online', priority: 'LOW' },
  { id: 'agent-035', name: 'ModelValidator', type: 'validator', specialties: ['model-validation', 'testing'], status: 'online', priority: 'LOW' },
  { id: 'agent-036', name: 'LanguageDetector', type: 'detector', specialties: ['language-detection', 'multilingual'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-037', name: 'TranslationEngine', type: 'translator', specialties: ['translation', 'localization'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-038', name: 'VoiceBiometrics', type: 'biometric', specialties: ['voice-id', 'authentication'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-039', name: 'EmotionRecognizer', type: 'recognizer', specialties: ['emotion-detection', 'tone'], status: 'online', priority: 'LOW' },
  { id: 'agent-040', name: 'PersonalizationEngine', type: 'personalizer', specialties: ['personalization', 'preferences'], status: 'online', priority: 'MEDIUM' },

  // Database & Storage Agents (41-50)
  { id: 'agent-041', name: 'DatabaseConnector', type: 'connector', specialties: ['database', 'persistence'], status: 'online', priority: 'HIGH' },
  { id: 'agent-042', name: 'CacheManager', type: 'cache', specialties: ['caching', 'redis'], status: 'online', priority: 'HIGH' },
  { id: 'agent-043', name: 'QueryOptimizer', type: 'optimizer', specialties: ['query-optimization', 'sql'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-044', name: 'DataMigrator', type: 'migrator', specialties: ['migration', 'schema'], status: 'online', priority: 'LOW' },
  { id: 'agent-045', name: 'BackupManager', type: 'backup', specialties: ['backup', 'recovery'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-046', name: 'FileStorageHandler', type: 'storage', specialties: ['file-storage', 's3'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-047', name: 'VectorDBConnector', type: 'connector', specialties: ['vector-db', 'chromadb'], status: 'online', priority: 'HIGH' },
  { id: 'agent-048', name: 'IndexManager', type: 'indexer', specialties: ['indexing', 'search'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-049', name: 'DataSynchronizer', type: 'synchronizer', specialties: ['sync', 'replication'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-050', name: 'SchemaValidator', type: 'validator', specialties: ['schema-validation', 'integrity'], status: 'online', priority: 'MEDIUM' },

  // API & Integration Agents (51-60)
  { id: 'agent-051', name: 'APIGateway', type: 'gateway', specialties: ['api-gateway', 'routing'], status: 'online', priority: 'HIGH' },
  { id: 'agent-052', name: 'WebhookManager', type: 'webhook', specialties: ['webhooks', 'events'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-053', name: 'RateLimiter', type: 'limiter', specialties: ['rate-limiting', 'throttling'], status: 'online', priority: 'HIGH' },
  { id: 'agent-054', name: 'AuthenticationGate', type: 'auth', specialties: ['jwt', 'oauth'], status: 'online', priority: 'CRITICAL' },
  { id: 'agent-055', name: 'RESTHandler', type: 'handler', specialties: ['rest-api', 'http'], status: 'online', priority: 'HIGH' },
  { id: 'agent-056', name: 'GraphQLResolver', type: 'resolver', specialties: ['graphql', 'queries'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-057', name: 'WebSocketManager', type: 'websocket', specialties: ['websockets', 'real-time'], status: 'online', priority: 'HIGH' },
  { id: 'agent-058', name: 'EventEmitter', type: 'emitter', specialties: ['events', 'pub-sub'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-059', name: 'MessageQueue', type: 'queue', specialties: ['message-queue', 'rabbitmq'], status: 'online', priority: 'HIGH' },
  { id: 'agent-060', name: 'CORSHandler', type: 'handler', specialties: ['cors', 'security'], status: 'online', priority: 'HIGH' },

  // Testing & Deployment Agents (61-70)
  { id: 'agent-061', name: 'TestRunner', type: 'tester', specialties: ['unit-testing', 'integration'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-062', name: 'E2ETester', type: 'tester', specialties: ['e2e-testing', 'selenium'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-063', name: 'LoadTester', type: 'tester', specialties: ['load-testing', 'performance'], status: 'online', priority: 'LOW' },
  { id: 'agent-064', name: 'DeploymentManager', type: 'deployer', specialties: ['deployment', 'ci-cd'], status: 'online', priority: 'HIGH' },
  { id: 'agent-065', name: 'ContainerOrchestrator', type: 'orchestrator', specialties: ['docker', 'kubernetes'], status: 'online', priority: 'HIGH' },
  { id: 'agent-066', name: 'EnvironmentManager', type: 'manager', specialties: ['environments', 'staging'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-067', name: 'BuildAgent', type: 'builder', specialties: ['builds', 'compilation'], status: 'online', priority: 'HIGH' },
  { id: 'agent-068', name: 'ReleaseManager', type: 'manager', specialties: ['releases', 'versioning'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-069', name: 'RollbackController', type: 'controller', specialties: ['rollback', 'recovery'], status: 'online', priority: 'HIGH' },
  { id: 'agent-070', name: 'HealthChecker', type: 'checker', specialties: ['health-checks', 'monitoring'], status: 'online', priority: 'HIGH' },

  // UI/UX & Frontend Agents (71-77)
  { id: 'agent-071', name: 'UIRenderer', type: 'renderer', specialties: ['react', 'ui-rendering'], status: 'online', priority: 'HIGH' },
  { id: 'agent-072', name: 'StateManager', type: 'manager', specialties: ['state-management', 'redux'], status: 'online', priority: 'HIGH' },
  { id: 'agent-073', name: 'FormValidator', type: 'validator', specialties: ['form-validation', 'input'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-074', name: 'StyleProcessor', type: 'processor', specialties: ['css', 'styling'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-075', name: 'AssetOptimizer', type: 'optimizer', specialties: ['assets', 'performance'], status: 'online', priority: 'LOW' },
  { id: 'agent-076', name: 'AccessibilityChecker', type: 'checker', specialties: ['a11y', 'wcag'], status: 'online', priority: 'MEDIUM' },
  { id: 'agent-077', name: 'UXAnalyzer', type: 'analyzer', specialties: ['ux-analytics', 'user-behavior'], status: 'online', priority: 'LOW' }
];

// Initial project data
const project = {
  id: 'project-001',
  name: 'Voice Agent Telnyx App',
  description: 'Multi-agent voice application platform using Telnyx API for real-time voice interactions',
  status: 'active',
  created_at: new Date().toISOString(),
  agent_count: 77,
  modules: [
    'Core System',
    'Telnyx Integration',
    'AI & NLP',
    'Database & Storage',
    'API & Integration',
    'Testing & Deployment',
    'UI/UX & Frontend'
  ]
};

async function createCollection(name) {
  try {
    console.log(`Creating collection: ${name}...`);
    const response = await axios.post(`${CHROMA_URL}/api/v1/collections`, {
      name: name,
      metadata: { created_at: new Date().toISOString() }
    });
    console.log(`✓ Collection '${name}' created successfully`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`Collection '${name}' already exists, skipping...`);
    } else {
      console.error(`Error creating collection ${name}:`, error.message);
      throw error;
    }
  }
}

async function addAgentsToCollection() {
  try {
    console.log('\nAdding agents to agent_directory collection...');

    const documents = agents.map(agent => JSON.stringify(agent));
    const metadatas = agents.map(agent => ({
      name: agent.name,
      type: agent.type,
      status: agent.status,
      priority: agent.priority,
      specialties: agent.specialties.join(',')
    }));
    const ids = agents.map(agent => agent.id);

    await axios.post(`${CHROMA_URL}/api/v1/collections/agent_directory/add`, {
      documents: documents,
      metadatas: metadatas,
      ids: ids
    });

    console.log(`✓ Successfully added ${agents.length} agents`);
  } catch (error) {
    console.error('Error adding agents:', error.message);
    throw error;
  }
}

async function addProjectToCollection() {
  try {
    console.log('\nAdding project to projects collection...');

    await axios.post(`${CHROMA_URL}/api/v1/collections/projects/add`, {
      documents: [JSON.stringify(project)],
      metadatas: [{
        name: project.name,
        status: project.status,
        agent_count: project.agent_count,
        created_at: project.created_at
      }],
      ids: [project.id]
    });

    console.log(`✓ Successfully added project: ${project.name}`);
  } catch (error) {
    console.error('Error adding project:', error.message);
    throw error;
  }
}

async function testConnection() {
  try {
    console.log(`Testing connection to ChromaDB at ${CHROMA_URL}...`);
    const response = await axios.get(`${CHROMA_URL}/api/v1/heartbeat`);
    console.log('✓ ChromaDB connection successful');
    return true;
  } catch (error) {
    console.error('✗ Failed to connect to ChromaDB:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. ChromaDB is running (docker ps | grep chroma)');
    console.log('2. It\'s accessible at', CHROMA_URL);
    console.log('3. The CHROMA_API_URL in .env is correct');
    return false;
  }
}

async function initialize() {
  console.log('=================================');
  console.log('Agent Command Center Initialization');
  console.log('=================================\n');

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Create collections
    await createCollection('agent_directory');
    await createCollection('agent_message_log');
    await createCollection('projects');
    await createCollection('restore_points');

    // Populate with initial data
    await addAgentsToCollection();
    await addProjectToCollection();

    console.log('\n=================================');
    console.log('✓ Initialization Complete!');
    console.log('=================================');
    console.log('\nYou can now:');
    console.log('1. Open http://localhost:3007 to view the dashboard');
    console.log('2. See all 77 agents in the Agents section');
    console.log('3. View the Voice Agent Telnyx App project');
    console.log('4. Start coordinating agent communications!');

  } catch (error) {
    console.error('\n✗ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initialize();