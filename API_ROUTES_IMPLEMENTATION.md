# Agent Intervector Command Center - API Routes Implementation

## Overview
Comprehensive API routes have been implemented for both Neo4j and Neon PostgreSQL databases in the Command Center backend.

## What Was Implemented

### 1. Neo4j Graph Database Routes (`/api/neo4j/*`)
Located at: [server/routes/neo4j.js](server/routes/neo4j.js)

#### Agent Node Operations
- `POST /api/neo4j/agents/create` - Create or update agent nodes
- `POST /api/neo4j/agents/relate` - Create relationships between agents
- `GET /api/neo4j/agents/:agentId/network` - Get agent collaboration network
- `GET /api/neo4j/agents` - Get all agents
- `GET /api/neo4j/agents/:agentId` - Get specific agent with relationships

#### Task Dependency Operations
- `POST /api/neo4j/tasks/create` - Create task nodes
- `POST /api/neo4j/tasks/dependency` - Create task dependencies
- `GET /api/neo4j/tasks/dependencies/:projectId` - Get task dependency graph
- `GET /api/neo4j/tasks/blocked/:projectId` - Find blocked tasks

#### Communication Pattern Operations
- `POST /api/neo4j/communication/log` - Log agent communication
- `GET /api/neo4j/communication/pattern/:agentId` - Get communication patterns

#### Knowledge Graph Operations
- `POST /api/neo4j/knowledge/create` - Create knowledge nodes
- `POST /api/neo4j/knowledge/link` - Link knowledge to agents
- `POST /api/neo4j/knowledge/query` - Query knowledge graph (read-only)

#### Story/Epic Operations
- `POST /api/neo4j/stories/create` - Create story nodes
- `POST /api/neo4j/stories/link-epic` - Link stories to epics
- `GET /api/neo4j/stories/epic-tree/:epicId` - Get epic story tree

#### Analytics & Path Finding
- `POST /api/neo4j/path/shortest` - Find shortest path between agents
- `GET /api/neo4j/stats` - Get graph statistics
- `GET /api/neo4j/analytics/central-agents` - Get most connected agents
- `GET /api/neo4j/analytics/communities/:projectId` - Community detection

### 2. Neon PostgreSQL Routes (`/api/neon/*`)
Located at: [server/routes/neon.js](server/routes/neon.js)

#### Project Operations
- `POST /api/neon/projects/init` - Initialize new project
- `GET /api/neon/projects/:projectId` - Get project details

#### Branch Management (Neon's Unique Feature)
- `POST /api/neon/branches/create` - Create new branch
- `GET /api/neon/branches/:projectId` - List all branches
- `POST /api/neon/branches/switch` - Switch active branch
- `POST /api/neon/branches/merge` - Merge branches

#### Agent Data Storage
- `POST /api/neon/agents` - Store/update agent data
- `GET /api/neon/agents/:agentId/history` - Get agent history
- `PUT /api/neon/agents/:agentId/status` - Update agent status

#### Story and Task Management
- `POST /api/neon/stories` - Create story
- `PUT /api/neon/stories/:storyId` - Update story
- `GET /api/neon/stories/by-status` - Get stories by status

#### Session and Restore Points
- `POST /api/neon/restore-points` - Create restore point
- `GET /api/neon/restore-points/:projectId` - List restore points
- `POST /api/neon/restore-points/:restorePointId/restore` - Restore from point

#### Communication Logs
- `POST /api/neon/communications` - Log communication
- `GET /api/neon/communications` - Get communication history

#### Analytics and Reporting
- `GET /api/neon/analytics/project/:projectId` - Get project analytics
- `GET /api/neon/analytics/agent/:agentId` - Get agent performance metrics
- `GET /api/neon/analytics/sprint/:sprintId` - Get sprint metrics

#### Time-Series Data
- `POST /api/neon/metrics` - Record metric
- `GET /api/neon/metrics/timeseries` - Get metric time series

#### Search and Query
- `POST /api/neon/search/stories` - Search stories
- `POST /api/neon/search/fulltext` - Full-text search

#### Audit Trail
- `GET /api/neon/audit` - Get audit log

### 3. Health Checks
- `GET /api/neo4j/health` - Neo4j connection health
- `GET /api/neon/health` - Neon connection health

## Configuration

### Environment Variables (.env)
The following configuration has been added to [server/.env](server/.env):

```env
# Neo4j Configuration
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=%323%351%Kev
NEO4J_DATABASE=neo4j
NEO4J_MAX_POOL_SIZE=50
NEO4J_CONNECTION_TIMEOUT=30000
GRAPH_RELATIONSHIPS_ENABLED=true

# Neon PostgreSQL Configuration
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NEON_POOL_MAX=20
NEON_POOL_IDLE_TIMEOUT=30000
NEON_CONNECTION_TIMEOUT=10000
KNOWLEDGE_BASE_ENABLED=false

# Client URL for CORS
CLIENT_URL=http://localhost:3000
```

## Integration

### Server Setup
Routes are integrated in [server/index.js](server/index.js:51-53):

```javascript
// Neo4j and Neon database routes
app.use('/api/neo4j', require('./routes/neo4j'));
app.use('/api/neon', require('./routes/neon'));
```

### Database Services
Both services are already implemented:
- [server/services/neo4jService.js](server/services/neo4jService.js) - Neo4j operations
- [server/services/neonService.js](server/services/neonService.js) - Neon PostgreSQL operations

### Frontend Integration
Frontend services are ready to use these routes:
- [client/src/services/neo4jService.js](client/src/services/neo4jService.js)
- [client/src/services/neonService.js](client/src/services/neonService.js)

## Usage Example

### Creating an Agent Node (Neo4j)
```javascript
const response = await fetch('http://localhost:7500/api/neo4j/agents/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_id: 'agent-001',
    name: 'Bob the Builder',
    type: 'developer',
    specialties: ['JavaScript', 'React', 'Node.js'],
    metadata: {
      frameworks: ['Next.js', 'Express'],
      languages: ['JavaScript', 'TypeScript']
    }
  })
});
```

### Creating a Restore Point (Neon)
```javascript
const response = await fetch('http://localhost:7500/api/neon/restore-points', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Epic 2 Completion',
    description: 'Complete context after finishing Epic 2',
    projectId: 'project-main',
    branchName: 'main',
    contextData: {},
    tags: ['epic-2', 'milestone'],
    metadata: {
      type: 'restore_point',
      created_by: 'User'
    }
  })
});
```

## Next Steps

### For Neo4j:
1. Ensure Neo4j is running locally on port 7687
2. Password is already configured: `%323%351%Kev`
3. Set `GRAPH_RELATIONSHIPS_ENABLED=true` to activate

### For Neon PostgreSQL:
1. Create a Neon account at https://neon.tech
2. Create a new project and database
3. Copy the connection string to `NEON_DATABASE_URL`
4. Set `KNOWLEDGE_BASE_ENABLED=true` to activate

### Testing:
Start the server and test the endpoints:
```bash
cd server
npm run dev
```

Visit health endpoints:
- http://localhost:7500/api/neo4j/health
- http://localhost:7500/api/neon/health

## Database Schema Requirements

### Neo4j (Graph Database)
The neo4jService automatically creates:
- Uniqueness constraints on agent_id, project_id, knowledge_id
- Indexes on agent name, agent type, knowledge category

### Neon PostgreSQL (Relational Database)
You'll need to create tables for:
- projects, branches, agents, stories, restore_points
- communications, metrics, audit_log
- (Schemas will be provided by BMAD agents when needed)

## Security Features

1. **Rate Limiting**: 1000 requests per 15 minutes per IP
2. **CORS**: Configured for CLIENT_URL (http://localhost:3000)
3. **Knowledge Query Protection**: Only read operations allowed
4. **Input Validation**: All routes validate required parameters
5. **Error Handling**: Comprehensive error handling with appropriate status codes

## Notes

- All routes return JSON responses with `{ success: boolean, ... }` format
- Errors include descriptive messages for debugging
- Health checks return connection status and database info
- Frontend components already have mock data fallbacks
- Services gracefully handle database unavailability
