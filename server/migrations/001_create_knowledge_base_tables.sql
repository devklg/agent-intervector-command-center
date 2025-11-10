-- ============================================================================
-- Agent Intervector Command Center - Knowledge Base Schema
-- Database: Neon PostgreSQL
-- Author: DataArchitect Agent
-- Description: Creates 6 core tables for comprehensive agent knowledge management
-- ============================================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: AGENT_KNOWLEDGE
-- Purpose: Core knowledge base for agent learnings and insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(100) NOT NULL,
  knowledge_type VARCHAR(50) NOT NULL, -- 'learning', 'insight', 'best_practice', 'warning'
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  tags JSONB DEFAULT '[]',
  source VARCHAR(100) DEFAULT 'manual', -- 'manual', 'automated', 'communication', 'project'
  metadata JSONB DEFAULT '{}',
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for agent_knowledge
CREATE INDEX idx_agent_knowledge_agent_id ON agent_knowledge(agent_id);
CREATE INDEX idx_agent_knowledge_type ON agent_knowledge(knowledge_type);
CREATE INDEX idx_agent_knowledge_category ON agent_knowledge(category);
CREATE INDEX idx_agent_knowledge_created_at ON agent_knowledge(created_at DESC);
CREATE INDEX idx_agent_knowledge_tags ON agent_knowledge USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_agent_knowledge_content_search ON agent_knowledge USING GIN(
  to_tsvector('english', title || ' ' || content)
);

-- ============================================================================
-- TABLE 2: FRAMEWORK_DOCS
-- Purpose: Comprehensive framework documentation storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS framework_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework_name VARCHAR(100) NOT NULL, -- 'React', 'Node.js', 'PostgreSQL', etc.
  version VARCHAR(50) NOT NULL,
  section VARCHAR(200) NOT NULL, -- 'Getting Started', 'API Reference', 'Best Practices'
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  code_examples JSONB DEFAULT '[]', -- Array of code examples
  links JSONB DEFAULT '[]', -- Array of external links
  tags JSONB DEFAULT '[]',
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for framework_docs
CREATE INDEX idx_framework_docs_name ON framework_docs(framework_name);
CREATE INDEX idx_framework_docs_version ON framework_docs(version);
CREATE INDEX idx_framework_docs_section ON framework_docs(section);
CREATE INDEX idx_framework_docs_tags ON framework_docs USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_framework_docs_content_search ON framework_docs USING GIN(
  to_tsvector('english', title || ' ' || content)
);

-- ============================================================================
-- TABLE 3: TROUBLESHOOTING
-- Purpose: Problem-solution pairs for quick issue resolution
-- ============================================================================

CREATE TABLE IF NOT EXISTS troubleshooting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_type VARCHAR(100) NOT NULL, -- 'error', 'bug', 'performance', 'security', 'configuration'
  error_message TEXT,
  context TEXT NOT NULL, -- Detailed description of when/where the problem occurred
  solution TEXT NOT NULL,
  steps_taken JSONB DEFAULT '[]', -- Array of steps to reproduce/solve
  related_files JSONB DEFAULT '[]', -- Array of file paths
  agent_id VARCHAR(100), -- Which agent solved this
  project_id VARCHAR(100),
  tags JSONB DEFAULT '[]',
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for troubleshooting
CREATE INDEX idx_troubleshooting_type ON troubleshooting(problem_type);
CREATE INDEX idx_troubleshooting_agent_id ON troubleshooting(agent_id);
CREATE INDEX idx_troubleshooting_project_id ON troubleshooting(project_id);
CREATE INDEX idx_troubleshooting_created_at ON troubleshooting(created_at DESC);
CREATE INDEX idx_troubleshooting_tags ON troubleshooting USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_troubleshooting_search ON troubleshooting USING GIN(
  to_tsvector('english', COALESCE(error_message, '') || ' ' || context || ' ' || solution)
);

-- ============================================================================
-- TABLE 4: CODE_PATTERNS
-- Purpose: Reusable code patterns and best practices
-- ============================================================================

CREATE TABLE IF NOT EXISTS code_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_name VARCHAR(200) NOT NULL,
  language VARCHAR(50) NOT NULL, -- 'JavaScript', 'Python', 'SQL', etc.
  category VARCHAR(100) NOT NULL, -- 'design_pattern', 'utility', 'algorithm', 'architecture'
  description TEXT NOT NULL,
  code_snippet TEXT NOT NULL,
  use_cases JSONB DEFAULT '[]', -- Array of use case descriptions
  best_practices JSONB DEFAULT '[]',
  anti_patterns JSONB DEFAULT '[]', -- What to avoid
  tags JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for code_patterns
CREATE INDEX idx_code_patterns_language ON code_patterns(language);
CREATE INDEX idx_code_patterns_category ON code_patterns(category);
CREATE INDEX idx_code_patterns_usage_count ON code_patterns(usage_count DESC);
CREATE INDEX idx_code_patterns_tags ON code_patterns USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_code_patterns_search ON code_patterns USING GIN(
  to_tsvector('english', pattern_name || ' ' || description || ' ' || code_snippet)
);

-- ============================================================================
-- TABLE 5: STORY_LEARNINGS
-- Purpose: Capture learnings from completed user stories/tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS story_learnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id VARCHAR(100) NOT NULL,
  story_title VARCHAR(500) NOT NULL,
  project_id VARCHAR(100),
  agent_id VARCHAR(100) NOT NULL, -- Which agent worked on it
  learning_type VARCHAR(50) NOT NULL, -- 'technical', 'process', 'collaboration', 'estimation'
  description TEXT NOT NULL,
  challenges_faced JSONB DEFAULT '[]', -- Array of challenges
  solutions_applied JSONB DEFAULT '[]', -- Array of solutions
  code_snippets JSONB DEFAULT '[]',
  time_saved_minutes INTEGER DEFAULT 0, -- How much time this learning could save in future
  complexity_rating VARCHAR(20) DEFAULT 'medium', -- 'simple', 'medium', 'complex'
  tags JSONB DEFAULT '[]',
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for story_learnings
CREATE INDEX idx_story_learnings_story_id ON story_learnings(story_id);
CREATE INDEX idx_story_learnings_project_id ON story_learnings(project_id);
CREATE INDEX idx_story_learnings_agent_id ON story_learnings(agent_id);
CREATE INDEX idx_story_learnings_type ON story_learnings(learning_type);
CREATE INDEX idx_story_learnings_created_at ON story_learnings(created_at DESC);
CREATE INDEX idx_story_learnings_tags ON story_learnings USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_story_learnings_search ON story_learnings USING GIN(
  to_tsvector('english', story_title || ' ' || description)
);

-- ============================================================================
-- TABLE 6: AGENT_EXPERTISE
-- Purpose: Track and manage agent capabilities and expertise levels
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_expertise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  agent_name VARCHAR(200) NOT NULL,
  specialties JSONB DEFAULT '[]', -- Array of specialty areas
  frameworks JSONB DEFAULT '[]', -- Array of framework proficiencies
  languages JSONB DEFAULT '[]', -- Array of programming languages
  domains JSONB DEFAULT '[]', -- Array of domain knowledge areas
  skill_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
  total_contributions INTEGER DEFAULT 0,
  successful_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  avg_task_time_minutes NUMERIC(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Additional stats and info
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for agent_expertise
CREATE INDEX idx_agent_expertise_agent_id ON agent_expertise(agent_id);
CREATE INDEX idx_agent_expertise_skill_level ON agent_expertise(skill_level);
CREATE INDEX idx_agent_expertise_contributions ON agent_expertise(total_contributions DESC);
CREATE INDEX idx_agent_expertise_specialties ON agent_expertise USING GIN(specialties);
CREATE INDEX idx_agent_expertise_frameworks ON agent_expertise USING GIN(frameworks);
CREATE INDEX idx_agent_expertise_languages ON agent_expertise USING GIN(languages);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Most referenced code patterns
CREATE OR REPLACE VIEW v_popular_code_patterns AS
SELECT
  pattern_name,
  language,
  category,
  usage_count,
  last_used_at,
  created_at
FROM code_patterns
WHERE usage_count > 0
ORDER BY usage_count DESC, last_used_at DESC;

-- View: Recent troubleshooting solutions
CREATE OR REPLACE VIEW v_recent_troubleshooting AS
SELECT
  problem_type,
  error_message,
  solution,
  agent_id,
  created_at
FROM troubleshooting
ORDER BY created_at DESC;

-- View: Agent expertise summary
CREATE OR REPLACE VIEW v_agent_expertise_summary AS
SELECT
  agent_id,
  agent_name,
  skill_level,
  total_contributions,
  successful_tasks,
  failed_tasks,
  CASE
    WHEN (successful_tasks + failed_tasks) > 0
    THEN ROUND((successful_tasks::NUMERIC / (successful_tasks + failed_tasks)) * 100, 2)
    ELSE 0
  END AS success_rate,
  avg_task_time_minutes
FROM agent_expertise
ORDER BY total_contributions DESC;

-- View: Knowledge base statistics
CREATE OR REPLACE VIEW v_knowledge_stats AS
SELECT
  (SELECT COUNT(*) FROM agent_knowledge) AS total_knowledge_entries,
  (SELECT COUNT(*) FROM framework_docs) AS total_framework_docs,
  (SELECT COUNT(*) FROM troubleshooting) AS total_troubleshooting_entries,
  (SELECT COUNT(*) FROM code_patterns) AS total_code_patterns,
  (SELECT COUNT(*) FROM story_learnings) AS total_story_learnings,
  (SELECT COUNT(*) FROM agent_expertise) AS total_agents_tracked,
  NOW() AS generated_at;

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function: Search across all knowledge sources
CREATE OR REPLACE FUNCTION search_knowledge_base(search_query TEXT)
RETURNS TABLE (
  source_table VARCHAR(50),
  id UUID,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY

  -- Search agent_knowledge
  SELECT
    'agent_knowledge'::VARCHAR(50),
    ak.id,
    ak.title::TEXT,
    LEFT(ak.content, 200)::TEXT,
    ak.created_at
  FROM agent_knowledge ak
  WHERE to_tsvector('english', ak.title || ' ' || ak.content) @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Search framework_docs
  SELECT
    'framework_docs'::VARCHAR(50),
    fd.id,
    fd.title::TEXT,
    LEFT(fd.content, 200)::TEXT,
    fd.created_at
  FROM framework_docs fd
  WHERE to_tsvector('english', fd.title || ' ' || fd.content) @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Search troubleshooting
  SELECT
    'troubleshooting'::VARCHAR(50),
    t.id,
    COALESCE(t.error_message, t.problem_type)::TEXT,
    LEFT(t.solution, 200)::TEXT,
    t.created_at
  FROM troubleshooting t
  WHERE to_tsvector('english', COALESCE(t.error_message, '') || ' ' || t.context || ' ' || t.solution) @@ plainto_tsquery('english', search_query)

  UNION ALL

  -- Search code_patterns
  SELECT
    'code_patterns'::VARCHAR(50),
    cp.id,
    cp.pattern_name::TEXT,
    LEFT(cp.description, 200)::TEXT,
    cp.created_at
  FROM code_patterns cp
  WHERE to_tsvector('english', cp.pattern_name || ' ' || cp.description) @@ plainto_tsquery('english', search_query)

  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_agent_knowledge_timestamp
  BEFORE UPDATE ON agent_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_framework_docs_timestamp
  BEFORE UPDATE ON framework_docs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_troubleshooting_timestamp
  BEFORE UPDATE ON troubleshooting
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_patterns_timestamp
  BEFORE UPDATE ON code_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_learnings_timestamp
  BEFORE UPDATE ON story_learnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_expertise_timestamp
  BEFORE UPDATE ON agent_expertise
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA INSERTION (Optional - for testing)
-- ============================================================================

-- Insert sample agent expertise
INSERT INTO agent_expertise (agent_id, agent_name, specialties, frameworks, languages, skill_level, total_contributions)
VALUES
  ('DataArchitect', 'DataArchitect', '["database-design", "knowledge-management", "postgresql", "neo4j"]', '["Express.js", "PostgreSQL", "Neo4j"]', '["JavaScript", "SQL", "Cypher"]', 'expert', 1)
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your environment)
-- ============================================================================

-- Grant permissions to application user (replace 'app_user' with your actual user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Initial knowledge base schema with 6 core tables')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Knowledge Base Schema Created Successfully!';
  RAISE NOTICE '   - agent_knowledge: Core knowledge storage';
  RAISE NOTICE '   - framework_docs: Framework documentation';
  RAISE NOTICE '   - troubleshooting: Problem-solution pairs';
  RAISE NOTICE '   - code_patterns: Reusable code patterns';
  RAISE NOTICE '   - story_learnings: Story completion insights';
  RAISE NOTICE '   - agent_expertise: Agent capability tracking';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Views and functions created for advanced queries';
  RAISE NOTICE '🔍 Full-text search indexes enabled';
  RAISE NOTICE '⚡ Auto-update triggers configured';
END $$;
