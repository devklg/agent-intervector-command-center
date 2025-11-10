# Agent Database Integration Guide

## FOR BMAD AGENTS: Database Capabilities Available

This Command Center has **three specialized databases** that you can use to enhance agent coordination and knowledge management. These are NOT standard BMAD features - they are custom integrations specific to this project.

## Available Databases

### 1. Neo4j Graph Database (Port 7687)
**Purpose**: Store and query relationships between agents, tasks, knowledge, and stories.

**Status**: ✅ CONFIGURED AND READY
- URI: `neo4j://localhost:7687`
- User: `neo4j`
- Password: Configured in `.env`
- Database: `neo4j`

**Use Cases**:
- Track agent collaboration patterns
- Build task dependency graphs
- Link knowledge items to agents who created them
- Find the shortest path between agents who need to collaborate
- Analyze communication patterns
- Detect agent communities working on similar projects

**API Routes**: `/api/neo4j/*`

**Example - When Creating Agents**:
```javascript
// Instead of just storing agent data in files, also create graph nodes
POST /api/neo4j/agents/create
{
  "agent_id": "bob-5003",
  "name": "Bob the Builder",
  "type": "developer",
  "specialties": ["Node.js", "React", "Express"],
  "metadata": {
    "frameworks": ["Next.js"],
    "priority": "HIGH"
  }
}
```

**Example - Tracking Collaborations**:
```javascript
// When two agents work together, record it
POST /api/neo4j/agents/relate
{
  "from_agent": "bob-5003",
  "to_agent": "theo-5001",
  "relationship": "COORDINATES_WITH",
  "properties": {
    "context": "Working on Epic 2 voice integration"
  }
}
```

**When to Use Neo4j**:
- ✅ Creating/updating agent profiles
- ✅ Recording agent collaborations
- ✅ Tracking task dependencies
- ✅ Building knowledge graphs
- ✅ Finding related agents or knowledge
- ❌ Storing large text documents (use Neon instead)
- ❌ Storing code or file content (use git)

---

### 2. Neon PostgreSQL (Serverless)
**Purpose**: Structured data storage with git-like branching for database states.

**Status**: ⚠️ NOT CONFIGURED YET
- Connection string needed in `.env`
- Tables need to be created
- Set `KNOWLEDGE_BASE_ENABLED=true` when ready

**Use Cases**:
- Store project metadata and configuration
- Track agent history and performance metrics
- Save restore points for context recovery
- Log inter-agent communications
- Store story and task details
- Time-series metrics and analytics
- Full-text search across entities

**API Routes**: `/api/neon/*`

**Unique Feature - Database Branching**:
```javascript
// Create a branch to test schema changes
POST /api/neon/branches/create
{
  "project_id": "project-main",
  "branch_name": "test-new-schema",
  "parent_branch": "main"
}

// Test changes, then merge back to main
POST /api/neon/branches/merge
{
  "project_id": "project-main",
  "source_branch": "test-new-schema",
  "target_branch": "main"
}
```

**Creating Tables**:
When you need to use Neon, you'll create tables that match the API routes. For example:

```sql
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  current_branch VARCHAR(100) DEFAULT 'main',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restore_points (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_id VARCHAR(100),
  branch_name VARCHAR(100),
  context_data JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  agent_name VARCHAR(255),
  agent_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stories (
  id VARCHAR(50) PRIMARY KEY,
  epic_id VARCHAR(50),
  title VARCHAR(500),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_agents JSONB DEFAULT '[]',
  acceptance_criteria JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communications (
  id SERIAL PRIMARY KEY,
  from_agent VARCHAR(100),
  to_agent VARCHAR(100),
  message_type VARCHAR(100),
  content TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(100),
  entity_id VARCHAR(100),
  entity_type VARCHAR(50),
  value NUMERIC,
  unit VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

**When to Use Neon**:
- ✅ Storing structured project data
- ✅ Agent performance tracking
- ✅ Creating restore points for ChromaDB context
- ✅ Logging communications between agents
- ✅ Time-series metrics
- ✅ Full-text search
- ❌ Graph relationships (use Neo4j)
- ❌ Vector embeddings (use ChromaDB)

---

### 3. ChromaDB Vector Database (Port 8000)
**Purpose**: Zero-token context restoration using vector embeddings.

**Status**: ✅ CONFIGURED (localhost:8000)

**Use Cases**:
- Store project context as embeddings
- Restore context without using tokens
- Semantic search across agent knowledge
- Find similar conversations or code patterns

**How It Works**:
1. Store important context (code, conversations, decisions) as embeddings
2. Create a restore point in Neon that references the ChromaDB collection
3. Later, retrieve context by similarity search without using LLM tokens

**When to Use ChromaDB**:
- ✅ Saving session context for later restoration
- ✅ Semantic search across project knowledge
- ✅ Finding similar code or patterns
- ✅ Reducing token usage for large contexts
- ❌ Structured queries (use Neon)
- ❌ Relationship queries (use Neo4j)

---

## Integration Workflow

### When Starting a New Epic/Story:
1. **Create Nodes in Neo4j** for agents, tasks, and story
2. **Log Initial Data in Neon** (story details, assigned agents)
3. **Create Restore Point** in Neon to mark the starting context

### During Development:
1. **Record Collaborations in Neo4j** when agents coordinate
2. **Log Communications in Neon** for audit trail
3. **Update Metrics in Neon** for performance tracking

### When Completing Work:
1. **Update Task Status in Neo4j**
2. **Save Final Context to ChromaDB** for future reference
3. **Create Restore Point in Neon** marking completion

### When Context is Lost:
1. **Query Neon** for the last restore point
2. **Retrieve from ChromaDB** using the restore point reference
3. **Query Neo4j** for agent relationships and task dependencies

---

## How to Check Database Status

### Check Neo4j:
```bash
curl http://localhost:7500/api/neo4j/health
```

### Check Neon:
```bash
curl http://localhost:7500/api/neon/health
```

### Check All Agents in Neo4j:
```bash
curl http://localhost:7500/api/neo4j/agents
```

---

## Important Notes

1. **These databases are optional** - If not available, the system falls back to mock data
2. **Neo4j is ready now** - You can start using it immediately
3. **Neon needs setup** - Tables must be created before use
4. **Always check health endpoints** before using databases
5. **Frontend has mock data fallbacks** - UI works without databases

---

## For Bob: Initial Database Setup Task

When you're activated and ready to use databases:

1. **Test Neo4j connection**:
   ```bash
   curl http://localhost:7500/api/neo4j/health
   ```

2. **If Neon is configured**, create the initial schema:
   - Run the CREATE TABLE statements above
   - Test the connection
   - Create the first project and restore point

3. **Register yourself in Neo4j**:
   ```javascript
   POST /api/neo4j/agents/create
   {
     "agent_id": "bob-5003",
     "name": "Bob the Builder",
     "type": "full-stack-developer",
     "specialties": ["JavaScript", "React", "Node.js", "PostgreSQL", "Neo4j"],
     "metadata": {
       "frameworks": ["Next.js", "Express"],
       "languages": ["JavaScript", "TypeScript"],
       "priority": "HIGH"
     }
   }
   ```

---

## Documentation

Full API documentation: [API_ROUTES_IMPLEMENTATION.md](./API_ROUTES_IMPLEMENTATION.md)

Neo4j Service: [server/services/neo4jService.js](./server/services/neo4jService.js)

Neon Service: [server/services/neonService.js](./server/services/neonService.js)
