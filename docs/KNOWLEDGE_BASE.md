# Knowledge Base Integration Guide

## Overview

The Agent Intervector Command Center now features a comprehensive **Knowledge Base System** that enables all AI development agents to share learnings, framework documentation, troubleshooting solutions, code patterns, story insights, and expertise tracking.

**Designed by:** DataArchitect Agent
**Version:** 1.0.0
**Date:** November 8, 2025

---

## Architecture

The Knowledge Base system uses a dual-database architecture:

### 1. **Neon PostgreSQL** (Structured Data)
- **Purpose:** Store structured knowledge entries with full-text search
- **Provider:** Neon (Serverless PostgreSQL)
- **Tables:** 6 core tables for different knowledge types
- **Features:** ACID compliance, full-text search, JSONB support, triggers

### 2. **Neo4j Graph Database** (Relationships)
- **Purpose:** Track agent relationships, collaborations, and knowledge connections
- **Provider:** Neo4j (Graph Database)
- **Nodes:** Agents, Projects, Knowledge
- **Relationships:** COLLABORATED_WITH, WORKED_ON, CREATED, RELATES_TO
- **Features:** Cypher queries, relationship analytics, network visualization

---

## Database Schema

### Table 1: `agent_knowledge`
Core knowledge base for agent learnings and insights.

**Columns:**
- `id` (UUID) - Primary key
- `agent_id` (VARCHAR) - Agent identifier
- `knowledge_type` (VARCHAR) - Type: learning, insight, best_practice, warning
- `title` (VARCHAR) - Knowledge title
- `content` (TEXT) - Full knowledge content
- `category` (VARCHAR) - Category (e.g., 'backend', 'frontend', 'devops')
- `tags` (JSONB) - Array of tags
- `source` (VARCHAR) - Source: manual, automated, communication, project
- `metadata` (JSONB) - Additional metadata
- `created_by` (VARCHAR) - Creator identifier
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- Full-text search on title + content
- agent_id, knowledge_type, category
- GIN index on tags

---

### Table 2: `framework_docs`
Comprehensive framework documentation storage.

**Columns:**
- `id` (UUID) - Primary key
- `framework_name` (VARCHAR) - Framework name (e.g., 'React', 'Express.js')
- `version` (VARCHAR) - Framework version
- `section` (VARCHAR) - Documentation section
- `title` (VARCHAR) - Doc title
- `content` (TEXT) - Documentation content
- `code_examples` (JSONB) - Array of code examples
- `links` (JSONB) - Array of external links
- `tags` (JSONB) - Tags
- `created_by` (VARCHAR) - Creator
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- framework_name, version, section
- Full-text search on title + content

---

### Table 3: `troubleshooting`
Problem-solution pairs for quick issue resolution.

**Columns:**
- `id` (UUID) - Primary key
- `problem_type` (VARCHAR) - Type: error, bug, performance, security, configuration
- `error_message` (TEXT) - Error message/description
- `context` (TEXT) - When/where the problem occurred
- `solution` (TEXT) - How it was solved
- `steps_taken` (JSONB) - Array of steps to reproduce/solve
- `related_files` (JSONB) - Array of file paths
- `agent_id` (VARCHAR) - Agent who solved it
- `project_id` (VARCHAR) - Related project
- `tags` (JSONB) - Tags
- `created_by` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- problem_type, agent_id, project_id
- Full-text search on error_message + context + solution

---

### Table 4: `code_patterns`
Reusable code patterns and best practices.

**Columns:**
- `id` (UUID) - Primary key
- `pattern_name` (VARCHAR) - Pattern name
- `language` (VARCHAR) - Programming language
- `category` (VARCHAR) - Category: design_pattern, utility, algorithm, architecture
- `description` (TEXT) - Pattern description
- `code_snippet` (TEXT) - Code example
- `use_cases` (JSONB) - Array of use cases
- `best_practices` (JSONB) - Best practices
- `anti_patterns` (JSONB) - What to avoid
- `tags` (JSONB) - Tags
- `usage_count` (INTEGER) - How many times used
- `last_used_at` (TIMESTAMP) - Last usage timestamp
- `created_by` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- language, category, usage_count
- Full-text search on pattern_name + description + code_snippet

---

### Table 5: `story_learnings`
Capture learnings from completed user stories/tasks.

**Columns:**
- `id` (UUID) - Primary key
- `story_id` (VARCHAR) - Story identifier
- `story_title` (VARCHAR) - Story title
- `project_id` (VARCHAR) - Project identifier
- `agent_id` (VARCHAR) - Agent who worked on it
- `learning_type` (VARCHAR) - Type: technical, process, collaboration, estimation
- `description` (TEXT) - Learning description
- `challenges_faced` (JSONB) - Array of challenges
- `solutions_applied` (JSONB) - Array of solutions
- `code_snippets` (JSONB) - Code examples
- `time_saved_minutes` (INTEGER) - Potential time savings
- `complexity_rating` (VARCHAR) - simple, medium, complex
- `tags` (JSONB) - Tags
- `created_by` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- story_id, project_id, agent_id, learning_type
- Full-text search on story_title + description

---

### Table 6: `agent_expertise`
Track and manage agent capabilities and expertise levels.

**Columns:**
- `id` (UUID) - Primary key
- `agent_id` (VARCHAR) - Unique agent identifier
- `agent_name` (VARCHAR) - Agent name
- `specialties` (JSONB) - Array of specialty areas
- `frameworks` (JSONB) - Framework proficiencies
- `languages` (JSONB) - Programming languages
- `domains` (JSONB) - Domain knowledge areas
- `skill_level` (VARCHAR) - beginner, intermediate, advanced, expert
- `total_contributions` (INTEGER) - Total contributions
- `successful_tasks` (INTEGER) - Successful task count
- `failed_tasks` (INTEGER) - Failed task count
- `avg_task_time_minutes` (NUMERIC) - Average task time
- `metadata` (JSONB) - Additional stats
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- agent_id (unique), skill_level, total_contributions
- GIN indexes on specialties, frameworks, languages

---

## Neo4j Graph Schema

### Node Types

#### Agent Node
```cypher
(:Agent {
  agentId: String,
  name: String,
  type: String,
  status: String,
  specialties: [String],
  frameworks: [String],
  languages: [String],
  priority: String,
  createdAt: DateTime,
  updatedAt: DateTime
})
```

#### Project Node
```cypher
(:Project {
  projectId: String,
  name: String,
  description: String,
  status: String,
  technologies: [String],
  createdAt: DateTime,
  updatedAt: DateTime
})
```

#### Knowledge Node
```cypher
(:Knowledge {
  knowledgeId: String,
  title: String,
  category: String,
  type: String,
  tags: [String],
  createdBy: String,
  createdAt: DateTime
})
```

### Relationship Types

- **COLLABORATED_WITH**: Agent → Agent (tracks collaboration count and context)
- **WORKED_ON**: Agent → Project (tracks role and activity)
- **CREATED**: Agent → Knowledge (tracks authorship)
- **RELATES_TO**: Knowledge ↔ Knowledge (semantic relationships)

---

## Setup Instructions

### Prerequisites

1. **Neon PostgreSQL Account**
   - Sign up at https://neon.tech
   - Create a new project
   - Get your connection string

2. **Neo4j Account** (Optional but recommended)
   - Sign up at https://neo4j.com/cloud/aura/
   - Create a new AuraDB instance
   - Get your connection URI and credentials

### Step 1: Install Dependencies

```bash
cd /home/user/agent-intervector-command-center
npm install
```

Dependencies are automatically installed:
- `pg@^8.11.3` - PostgreSQL client
- `neo4j-driver@^5.14.0` - Neo4j driver

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your database credentials:

```env
# Neon PostgreSQL Configuration
NEON_DATABASE_URL=postgresql://user:password@your-neon-hostname.neon.tech/neondb?sslmode=require
NEON_POOL_MAX=20
NEON_POOL_IDLE_TIMEOUT=30000
NEON_CONNECTION_TIMEOUT=10000

# Neo4j Configuration
NEO4J_URI=neo4j+s://your-neo4j-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password
NEO4J_DATABASE=neo4j
NEO4J_MAX_POOL_SIZE=50
NEO4J_CONNECTION_TIMEOUT=30000

# Knowledge Base Settings
KNOWLEDGE_BASE_ENABLED=true
VECTOR_SEARCH_ENABLED=true
GRAPH_RELATIONSHIPS_ENABLED=true
KNOWLEDGE_RETENTION_DAYS=365
AUTO_CATEGORIZATION=true
```

### Step 3: Run Database Migrations

```bash
npm run setup-knowledge-base
```

This will:
1. Connect to your Neon PostgreSQL database
2. Create all 6 tables with indexes
3. Create views and functions
4. Set up triggers for automatic timestamp updates
5. Insert sample data (DataArchitect agent)

Expected output:
```
🚀 Starting Knowledge Base Migration...
📄 Running migration: 001_create_knowledge_base_tables.sql
✅ Migration completed: 001_create_knowledge_base_tables.sql

🔍 Verifying tables...
📊 Created tables:
   ✓ agent_knowledge
   ✓ framework_docs
   ✓ troubleshooting
   ✓ code_patterns
   ✓ story_learnings
   ✓ agent_expertise

🎉 Knowledge Base is ready to use!
```

### Step 4: Start the Server

```bash
npm run dev
```

The server will:
1. Start on port 7500
2. Connect to Neon PostgreSQL (if enabled)
3. Connect to Neo4j (if enabled)
4. Display connection status

Expected output:
```
🚀 Agent Command Center Backend
📡 Server running on port 7500
🧠 ChromaDB Integration: localhost:7501
🔗 Environment: development

📊 Initializing Knowledge Base...
✅ Neon PostgreSQL: Connected successfully
✅ Neo4j: Connected successfully

⚡ Ready for Intervector Communication!
```

---

## API Endpoints

### Health Check

**GET** `/api/knowledge/health`

Check the health of the knowledge base system.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "neon": {
      "status": "healthy",
      "connected": true,
      "timestamp": "2025-11-08T23:00:00.000Z",
      "version": "PostgreSQL 15.3"
    },
    "neo4j": {
      "status": "healthy",
      "connected": true,
      "database": {...}
    }
  }
}
```

---

### Agent Knowledge

**GET** `/api/knowledge`

Get knowledge entries with filtering.

**Query Parameters:**
- `agent_id` (string) - Filter by agent
- `knowledge_type` (string) - Filter by type
- `category` (string) - Filter by category
- `search` (string) - Full-text search
- `limit` (number) - Max results (default: 50)

**Example:**
```bash
curl "http://localhost:7500/api/knowledge?agent_id=DataArchitect&limit=10"
```

**POST** `/api/knowledge`

Create a new knowledge entry.

**Request Body:**
```json
{
  "agent_id": "DataArchitect",
  "knowledge_type": "learning",
  "title": "PostgreSQL Connection Pooling Best Practices",
  "content": "Always use connection pooling with a max pool size of 20...",
  "category": "database",
  "tags": ["postgresql", "performance", "best-practice"],
  "source": "manual",
  "created_by": "DataArchitect"
}
```

**PUT** `/api/knowledge/:id`

Update a knowledge entry.

**DELETE** `/api/knowledge/:id`

Delete a knowledge entry.

---

### Framework Documentation

**GET** `/api/knowledge/frameworks`

Get framework documentation.

**Query Parameters:**
- `framework_name` (string)
- `version` (string)
- `section` (string)

**POST** `/api/knowledge/frameworks`

Create framework documentation.

**Request Body:**
```json
{
  "framework_name": "Express.js",
  "version": "4.18.2",
  "section": "Middleware",
  "title": "Custom Middleware Creation",
  "content": "Middleware functions have access to req, res, and next...",
  "code_examples": [
    {
      "title": "Basic Middleware",
      "code": "app.use((req, res, next) => { next(); })"
    }
  ],
  "links": ["https://expressjs.com/en/guide/writing-middleware.html"],
  "tags": ["middleware", "express", "nodejs"],
  "created_by": "DataArchitect"
}
```

---

### Troubleshooting

**GET** `/api/knowledge/troubleshooting`

Search troubleshooting entries.

**Query Parameters:**
- `problem_type` (string) - error, bug, performance, security, configuration
- `error_search` (string) - Search in error messages
- `agent_id` (string)
- `limit` (number)

**POST** `/api/knowledge/troubleshooting`

Create a troubleshooting entry.

**Request Body:**
```json
{
  "problem_type": "error",
  "error_message": "ECONNREFUSED: Connection refused to PostgreSQL",
  "context": "Attempting to connect to Neon PostgreSQL during server startup",
  "solution": "Verify that the NEON_DATABASE_URL is correct and includes SSL mode",
  "steps_taken": [
    "Check environment variables",
    "Test connection string manually",
    "Add sslmode=require to connection string"
  ],
  "related_files": ["server/services/neonService.js"],
  "agent_id": "DataArchitect",
  "tags": ["postgresql", "connection", "ssl"],
  "created_by": "DataArchitect"
}
```

---

### Code Patterns

**GET** `/api/knowledge/patterns`

Get code patterns.

**Query Parameters:**
- `language` (string) - Programming language
- `category` (string) - design_pattern, utility, algorithm, architecture
- `search` (string) - Full-text search

**POST** `/api/knowledge/patterns`

Create a code pattern.

**POST** `/api/knowledge/patterns/:id/use`

Increment pattern usage count (tracks popularity).

---

### Story Learnings

**GET** `/api/knowledge/learnings`

Get story learnings.

**Query Parameters:**
- `project_id` (string)
- `agent_id` (string)
- `learning_type` (string) - technical, process, collaboration, estimation

**POST** `/api/knowledge/learnings`

Create a story learning.

---

### Agent Expertise

**GET** `/api/knowledge/expertise`

Get all agents expertise.

**Query Parameters:**
- `skill_level` (string) - beginner, intermediate, advanced, expert

**GET** `/api/knowledge/expertise/:agentId`

Get specific agent expertise.

**POST** `/api/knowledge/expertise`

Create or update agent expertise.

**Request Body:**
```json
{
  "agent_id": "DataArchitect",
  "agent_name": "DataArchitect",
  "specialties": ["database-design", "knowledge-management", "postgresql", "neo4j"],
  "frameworks": ["Express.js", "PostgreSQL", "Neo4j"],
  "languages": ["JavaScript", "SQL", "Cypher"],
  "domains": ["backend", "databases", "api-design"],
  "skill_level": "expert",
  "total_contributions": 10,
  "successful_tasks": 9,
  "failed_tasks": 1,
  "avg_task_time_minutes": 120,
  "metadata": {
    "projects_completed": ["knowledge-base-integration"],
    "certifications": []
  }
}
```

---

### Graph Analytics (Neo4j)

**GET** `/api/knowledge/graph/agents`

Get all agents from the graph database.

**GET** `/api/knowledge/graph/collaboration/:agentId`

Get agent collaboration network.

**Query Parameters:**
- `depth` (number) - How many hops deep to search (default: 2)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "agent": {
        "agentId": "PROMETHEUS",
        "name": "PROMETHEUS",
        "type": "coordinator"
      },
      "distance": 1
    }
  ]
}
```

**POST** `/api/knowledge/graph/collaboration`

Record collaboration between agents.

**Request Body:**
```json
{
  "fromAgentId": "DataArchitect",
  "toAgentId": "PROMETHEUS",
  "context": {
    "task": "Knowledge Base Design Review",
    "outcome": "approved"
  }
}
```

**GET** `/api/knowledge/graph/stats`

Get graph analytics and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "collaboration": {
      "totalAgents": 5,
      "totalCollaborations": 12,
      "avgCollaborationsPerPair": 2.4,
      "maxCollaborations": 8
    },
    "knowledgeDistribution": [
      {"category": "database", "count": 15},
      {"category": "backend", "count": 10}
    ],
    "mostConnectedAgents": [...]
  }
}
```

---

## Usage Examples

### Example 1: Store a Learning

```javascript
const axios = require('axios');

const learning = {
  agent_id: 'DataArchitect',
  knowledge_type: 'learning',
  title: 'Neon PostgreSQL Connection Pooling',
  content: 'Use connection pooling with max 20 connections for optimal performance...',
  category: 'database',
  tags: ['postgresql', 'neon', 'performance'],
  created_by: 'DataArchitect'
};

const response = await axios.post('http://localhost:7500/api/knowledge', learning);
console.log('Created:', response.data);
```

### Example 2: Search for Solutions

```javascript
const response = await axios.get('http://localhost:7500/api/knowledge/troubleshooting', {
  params: {
    error_search: 'ECONNREFUSED',
    limit: 5
  }
});

console.log('Found solutions:', response.data.data);
```

### Example 3: Track Agent Collaboration

```javascript
await axios.post('http://localhost:7500/api/knowledge/graph/collaboration', {
  fromAgentId: 'DataArchitect',
  toAgentId: 'PROMETHEUS',
  context: { task: 'knowledge-base-design' }
});
```

---

## Advanced Features

### Full-Text Search

All text-heavy tables have full-text search indexes:

```sql
-- Example: Search across all knowledge
SELECT * FROM agent_knowledge
WHERE to_tsvector('english', title || ' ' || content)
  @@ plainto_tsquery('english', 'postgresql connection pooling');
```

### Cross-Knowledge Search Function

```sql
SELECT * FROM search_knowledge_base('postgresql performance');
```

Returns results from all knowledge tables ranked by relevance.

### Views

**v_popular_code_patterns**: Most used code patterns
**v_recent_troubleshooting**: Recent solutions
**v_agent_expertise_summary**: Agent skills with success rates
**v_knowledge_stats**: Overall knowledge base statistics

---

## Best Practices

### 1. **Tag Everything**
Use descriptive tags for better discoverability:
```json
{
  "tags": ["postgresql", "neon", "connection-pooling", "performance", "best-practice"]
}
```

### 2. **Categorize Properly**
Use consistent categories:
- `backend`, `frontend`, `database`, `devops`, `security`, `testing`, `architecture`

### 3. **Document Solutions**
When solving a problem, immediately create a troubleshooting entry:
```javascript
await createTroubleshooting({
  problem_type: 'error',
  error_message: 'The actual error',
  context: 'When and where it happened',
  solution: 'How you fixed it',
  steps_taken: ['Step 1', 'Step 2']
});
```

### 4. **Update Expertise**
After completing tasks, update agent expertise:
```javascript
await updateExpertise({
  agent_id: 'YourAgentId',
  total_contributions: expertise.total_contributions + 1,
  successful_tasks: expertise.successful_tasks + 1
});
```

### 5. **Link Related Knowledge**
Use Neo4j to create knowledge relationships:
```javascript
await linkRelatedKnowledge(knowledgeId1, knowledgeId2, 'RELATES_TO');
```

---

## Monitoring & Maintenance

### Health Checks

Monitor system health:
```bash
curl http://localhost:7500/api/knowledge/health
```

### Database Statistics

Get knowledge base stats:
```sql
SELECT * FROM v_knowledge_stats;
```

### Cleanup Old Data

Retention is configured in `.env`:
```env
KNOWLEDGE_RETENTION_DAYS=365
```

Implement a cron job to archive old entries.

---

## Troubleshooting

### Connection Issues

**Problem:** "Neon PostgreSQL connection failed"

**Solution:**
1. Verify `NEON_DATABASE_URL` in `.env`
2. Ensure it includes `?sslmode=require`
3. Check Neon dashboard for database status
4. Verify IP whitelisting (if applicable)

**Problem:** "Neo4j connection failed"

**Solution:**
1. Verify `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
2. Check Neo4j Aura dashboard
3. Ensure URI uses `neo4j+s://` for secure connection

### Migration Errors

**Problem:** "Table already exists"

**Solution:**
The migration uses `CREATE TABLE IF NOT EXISTS`, so this is safe to ignore.

**Problem:** "Permission denied"

**Solution:**
Ensure your database user has CREATE, ALTER, and GRANT permissions.

---

## Future Enhancements

- [ ] Vector embeddings for semantic search (integration with ChromaDB)
- [ ] Auto-categorization using AI
- [ ] Knowledge recommendation engine
- [ ] Real-time knowledge sync across agents
- [ ] Knowledge quality ratings and reviews
- [ ] Export/import knowledge packages
- [ ] Knowledge versioning and history

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/devklg/agent-intervector-command-center/issues
- Email: agents@hivemind.ai

---

**Built with ❤️ by DataArchitect Agent**
*Empowering agents through shared knowledge*
