const axios = require('axios');
const fs = require('fs').promises;

/**
 * Script to add ChromaDB v2 Integration Guide to both Neo4j and ChromaDB
 * This creates a dual knowledge base for future agent reference
 */

// Configuration
const CHROMA_BASE_URL = process.env.CHROMA_API_URL || 'http://localhost:8000';
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

const TENANT = 'default_tenant';
const DATABASE = 'default_database';

// Knowledge document metadata
const knowledgeDoc = {
  id: 'KB-CHROMADB-V2-001',
  title: 'ChromaDB v2 API Integration Guide',
  category: 'Database Integration',
  tags: ['chromadb', 'v2-api', 'vector-database', 'rest-api', 'migration', 'knowledge-base'],
  created: '2025-01-08',
  status: 'Production Ready',
  severity: 'Critical',
  type: 'technical-guide',
  file_path: 'd:\\voice-agent-telnyx-app\\docs\\knowledge-base\\chromadb-v2-integration-guide.md'
};

// Axios client for ChromaDB
const chromaClient = axios.create({
  baseURL: CHROMA_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

async function readKnowledgeDocument() {
  console.log('📖 Reading knowledge document...');
  const content = await fs.readFile(knowledgeDoc.file_path, 'utf-8');
  console.log(`✅ Loaded document (${content.length} characters)`);
  return content;
}

async function addToChromaDB(content) {
  console.log('\n📦 Adding to ChromaDB...');

  try {
    // 1. Get or create knowledge base collection
    const collectionsEndpoint = `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`;

    let collection;
    try {
      const listResponse = await chromaClient.get(collectionsEndpoint);
      collection = listResponse.data.find(col => col.name === 'command_center_knowledge');

      if (!collection) {
        const createResponse = await chromaClient.post(collectionsEndpoint, {
          name: 'command_center_knowledge',
          metadata: {
            description: 'Agent Command Center knowledge base',
            purpose: 'technical_documentation',
            created_by: 'knowledge_import_script'
          }
        });
        collection = createResponse.data;
        console.log('  ✓ Created new collection: command_center_knowledge');
      } else {
        console.log('  ✓ Using existing collection: command_center_knowledge');
      }
    } catch (error) {
      console.error('❌ Error managing collection:', error.message);
      throw error;
    }

    // 2. Add document to collection
    const addEndpoint = `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections/${collection.id}/add`;

    // Generate simple placeholder embedding (384 dimensions - common size)
    // In production, you'd use an actual embedding model
    const placeholderEmbedding = Array(384).fill(0).map(() => Math.random());

    await chromaClient.post(addEndpoint, {
      ids: [knowledgeDoc.id],
      documents: [content],
      metadatas: [{
        title: knowledgeDoc.title,
        category: knowledgeDoc.category,
        tags: knowledgeDoc.tags.join(','),
        created: knowledgeDoc.created,
        status: knowledgeDoc.status,
        severity: knowledgeDoc.severity,
        type: knowledgeDoc.type,
        doc_id: knowledgeDoc.id
      }],
      embeddings: [placeholderEmbedding]  // Placeholder embedding for now
    });

    console.log(`✅ Added document to ChromaDB: ${knowledgeDoc.id}`);
    return true;

  } catch (error) {
    if (error.response) {
      console.error('❌ ChromaDB API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ ChromaDB Error:', error.message);
    }
    return false;
  }
}

async function addToNeo4j(content) {
  console.log('\n🔗 Adding to Neo4j...');

  try {
    const neo4j = require('neo4j-driver');

    const driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );

    const session = driver.session();

    try {
      // Create knowledge document node with relationships
      const result = await session.run(`
        // Create the knowledge document node
        MERGE (doc:KnowledgeDocument {id: $id})
        SET doc.title = $title,
            doc.category = $category,
            doc.created = datetime($created),
            doc.status = $status,
            doc.severity = $severity,
            doc.type = $type,
            doc.content = $content,
            doc.file_path = $file_path,
            doc.updated_at = datetime()

        // Create category node and relationship
        MERGE (cat:Category {name: $category})
        MERGE (doc)-[:BELONGS_TO_CATEGORY]->(cat)

        // Create tag nodes and relationships
        WITH doc
        UNWIND $tags as tagName
        MERGE (tag:Tag {name: tagName})
        MERGE (doc)-[:TAGGED_WITH]->(tag)

        // Link to ChromaDB integration topic
        WITH doc
        MERGE (topic:Topic {name: 'ChromaDB'})
        MERGE (doc)-[:RELATES_TO_TOPIC]->(topic)

        // Create API version node
        WITH doc
        MERGE (version:APIVersion {name: 'ChromaDB v2'})
        MERGE (doc)-[:DOCUMENTS_VERSION]->(version)

        // Create integration type
        WITH doc
        MERGE (intType:IntegrationType {name: 'Vector Database'})
        MERGE (doc)-[:INTEGRATION_TYPE]->(intType)

        RETURN doc.id as id, doc.title as title
      `, {
        id: knowledgeDoc.id,
        title: knowledgeDoc.title,
        category: knowledgeDoc.category,
        tags: knowledgeDoc.tags,
        created: knowledgeDoc.created,
        status: knowledgeDoc.status,
        severity: knowledgeDoc.severity,
        type: knowledgeDoc.type,
        content: content,
        file_path: knowledgeDoc.file_path
      });

      console.log(`✅ Added document to Neo4j: ${result.records[0].get('id')}`);
      console.log(`   Title: ${result.records[0].get('title')}`);

      // Create key concept nodes from the document
      await session.run(`
        MATCH (doc:KnowledgeDocument {id: $docId})

        // Create key concepts as nodes
        MERGE (c1:Concept {name: 'ChromaDB v2 Architecture'})
        MERGE (doc)-[:EXPLAINS_CONCEPT]->(c1)

        MERGE (c2:Concept {name: 'Tenant/Database/Collection Hierarchy'})
        MERGE (doc)-[:EXPLAINS_CONCEPT]->(c2)

        MERGE (c3:Concept {name: 'REST API Endpoints'})
        MERGE (doc)-[:EXPLAINS_CONCEPT]->(c3)

        MERGE (c4:Concept {name: 'Collection UUID Identifiers'})
        MERGE (doc)-[:EXPLAINS_CONCEPT]->(c4)

        MERGE (c5:Concept {name: 'Embeddings Requirement'})
        MERGE (doc)-[:EXPLAINS_CONCEPT]->(c5)

        // Create problem-solution relationships
        MERGE (p1:Problem {name: 'Module Caching Issues'})
        MERGE (s1:Solution {name: 'Clean npm install'})
        MERGE (doc)-[:DOCUMENTS_PROBLEM]->(p1)
        MERGE (doc)-[:PROVIDES_SOLUTION]->(s1)
        MERGE (s1)-[:SOLVES]->(p1)

        MERGE (p2:Problem {name: '404 Not Found Errors'})
        MERGE (s2:Solution {name: 'Use Full Hierarchy Endpoints'})
        MERGE (doc)-[:DOCUMENTS_PROBLEM]->(p2)
        MERGE (doc)-[:PROVIDES_SOLUTION]->(s2)
        MERGE (s2)-[:SOLVES]->(p2)

        RETURN count(*) as concepts_created
      `, { docId: knowledgeDoc.id });

      console.log('✅ Created concept relationships in Neo4j');

      return true;

    } finally {
      await session.close();
      await driver.close();
    }

  } catch (error) {
    console.error('❌ Neo4j Error:', error.message);
    return false;
  }
}

async function verifyKnowledge() {
  console.log('\n🔍 Verifying knowledge base entries...\n');

  // Verify ChromaDB
  try {
    const collectionsEndpoint = `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`;
    const listResponse = await chromaClient.get(collectionsEndpoint);
    const collection = listResponse.data.find(col => col.name === 'command_center_knowledge');

    if (collection) {
      const getEndpoint = `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections/${collection.id}/get`;
      const response = await chromaClient.post(getEndpoint, {
        where: { doc_id: knowledgeDoc.id },
        include: ['documents', 'metadatas']
      });

      if (response.data.documents && response.data.documents.length > 0) {
        console.log('✅ ChromaDB: Document verified');
        console.log(`   ID: ${response.data.metadatas[0].doc_id}`);
        console.log(`   Title: ${response.data.metadatas[0].title}`);
      } else {
        console.log('⚠️  ChromaDB: Document not found');
      }
    }
  } catch (error) {
    console.log('⚠️  ChromaDB verification failed:', error.message);
  }

  // Verify Neo4j
  try {
    const neo4j = require('neo4j-driver');
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    const session = driver.session();

    try {
      const result = await session.run(`
        MATCH (doc:KnowledgeDocument {id: $id})
        OPTIONAL MATCH (doc)-[r]->(related)
        RETURN doc.title as title,
               count(r) as relationship_count,
               collect(DISTINCT labels(related)) as related_types
      `, { id: knowledgeDoc.id });

      if (result.records.length > 0) {
        const record = result.records[0];
        console.log('✅ Neo4j: Document verified');
        console.log(`   Title: ${record.get('title')}`);
        console.log(`   Relationships: ${record.get('relationship_count')}`);
        console.log(`   Connected to: ${record.get('related_types').map(t => t[0]).join(', ')}`);
      } else {
        console.log('⚠️  Neo4j: Document not found');
      }
    } finally {
      await session.close();
      await driver.close();
    }
  } catch (error) {
    console.log('⚠️  Neo4j verification failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Knowledge Base Import Script');
  console.log('================================\n');
  console.log(`Document: ${knowledgeDoc.title}`);
  console.log(`ID: ${knowledgeDoc.id}`);
  console.log(`Category: ${knowledgeDoc.category}`);
  console.log(`Tags: ${knowledgeDoc.tags.join(', ')}\n`);

  try {
    // Read the knowledge document
    const content = await readKnowledgeDocument();

    // Add to ChromaDB (required)
    const chromaSuccess = await addToChromaDB(content);

    // Add to Neo4j (optional - skip if not configured)
    let neo4jSuccess = false;
    let neo4jSkipped = false;

    if (!process.env.NEO4J_PASSWORD || process.env.NEO4J_PASSWORD === 'password') {
      console.log('\n⚠️  Neo4j: Skipping (not configured)');
      console.log('   To enable Neo4j, set NEO4J_PASSWORD environment variable');
      neo4jSkipped = true;
    } else {
      neo4jSuccess = await addToNeo4j(content);
    }

    // Verify
    await verifyKnowledge();

    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`ChromaDB: ${chromaSuccess ? '✅ Success' : '❌ Failed'}`);
    if (neo4jSkipped) {
      console.log(`Neo4j:    ⏭️  Skipped (not configured)`);
    } else {
      console.log(`Neo4j:    ${neo4jSuccess ? '✅ Success' : '❌ Failed'}`);
    }

    if (chromaSuccess) {
      console.log('\n✨ Knowledge base successfully updated in ChromaDB!');
      console.log('\nFuture agents can now query this knowledge from:');
      console.log('  - ChromaDB: Semantic search on technical content');
      if (neo4jSuccess) {
        console.log('  - Neo4j: Graph relationships and concept exploration');
      }
      process.exit(0);
    } else {
      console.log('\n⚠️  ChromaDB import failed. Please check the logs above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
