# Knowledge Base - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Set Up Databases

**Option A: Neon PostgreSQL (Free Tier)**
1. Go to https://neon.tech
2. Sign up and create a project
3. Copy your connection string

**Option B: Local PostgreSQL**
```bash
docker run -d \
  --name postgres-knowledge \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=knowledge_base \
  -p 5432:5432 \
  postgres:15
```

**Option C: Neo4j (Optional)**
1. Go to https://neo4j.com/cloud/aura/
2. Create a free AuraDB instance
3. Copy URI and password

### 2. Configure Environment

```bash
# In .env file
KNOWLEDGE_BASE_ENABLED=true
NEON_DATABASE_URL=postgresql://user:pass@hostname/db?sslmode=require

# Optional
GRAPH_RELATIONSHIPS_ENABLED=true
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_PASSWORD=your-password
```

### 3. Run Migrations

```bash
npm run setup-knowledge-base
```

### 4. Start Server

```bash
npm run dev
```

### 5. Test It!

```bash
# Create knowledge
curl -X POST http://localhost:7500/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "TestAgent",
    "knowledge_type": "learning",
    "title": "My First Learning",
    "content": "This is a test knowledge entry",
    "category": "test",
    "tags": ["test", "demo"],
    "created_by": "TestAgent"
  }'

# Get knowledge
curl http://localhost:7500/api/knowledge?limit=5
```

## 📊 Common Operations

### Store a Learning
```javascript
POST /api/knowledge
{
  "agent_id": "MyAgent",
  "knowledge_type": "learning",
  "title": "How to X",
  "content": "Detailed explanation...",
  "category": "backend",
  "tags": ["nodejs", "express"],
  "created_by": "MyAgent"
}
```

### Find a Solution
```javascript
GET /api/knowledge/troubleshooting?error_search=ECONNREFUSED
```

### Get Code Pattern
```javascript
GET /api/knowledge/patterns?language=JavaScript&category=design_pattern
```

### Track Collaboration
```javascript
POST /api/knowledge/graph/collaboration
{
  "fromAgentId": "Agent1",
  "toAgentId": "Agent2",
  "context": {"task": "code-review"}
}
```

## 🎯 Use Cases

### 1. Agent Learns Something New
After solving a problem, immediately store it:
```javascript
await storeKnowledge({
  knowledge_type: 'learning',
  title: 'Fixed CORS issue in Express',
  content: 'Add cors middleware before routes...',
  category: 'backend'
});
```

### 2. Document a Framework
```javascript
await createFrameworkDoc({
  framework_name: 'React',
  version: '18.2',
  section: 'Hooks',
  title: 'useState Best Practices',
  content: 'Always declare state at top level...'
});
```

### 3. Share a Code Pattern
```javascript
await createCodePattern({
  pattern_name: 'Singleton Service',
  language: 'JavaScript',
  category: 'design_pattern',
  code_snippet: 'class Service { ... }',
  description: 'Single instance service pattern'
});
```

### 4. Log Story Completion
```javascript
await createStoryLearning({
  story_id: 'STORY-123',
  story_title: 'Implement User Auth',
  agent_id: 'BackendAgent',
  learning_type: 'technical',
  description: 'Learned about JWT implementation',
  time_saved_minutes: 60
});
```

## 🔍 Pro Tips

1. **Use Tags Liberally**: More tags = better discoverability
2. **Link Related Knowledge**: Use Neo4j to connect related items
3. **Update Expertise**: Keep agent profiles current
4. **Search First**: Before creating, search if it exists
5. **Categorize Consistently**: Use standard categories

## 📈 Analytics

```javascript
// Get system stats
GET /api/knowledge/graph/stats

// Find top agents
GET /api/knowledge/expertise?skill_level=expert

// View collaboration network
GET /api/knowledge/graph/collaboration/AgentId
```

## 🆘 Quick Fixes

**Can't connect to database?**
```bash
# Check connection string
echo $NEON_DATABASE_URL

# Test manually
psql $NEON_DATABASE_URL
```

**Tables not created?**
```bash
# Re-run migrations
npm run setup-knowledge-base
```

**Neo4j not working?**
```bash
# Disable it temporarily
GRAPH_RELATIONSHIPS_ENABLED=false
```

## 📚 Learn More

- [Full Documentation](./KNOWLEDGE_BASE.md)
- [API Reference](./KNOWLEDGE_BASE.md#api-endpoints)
- [Database Schema](./KNOWLEDGE_BASE.md#database-schema)

---

**Ready to build a smarter agent system! 🧠✨**
