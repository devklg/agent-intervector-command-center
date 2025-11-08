/**
 * Database Migration Runner
 * Executes SQL migrations for the Knowledge Base
 *
 * Usage: node scripts/run-migrations.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  console.log('🚀 Starting Knowledge Base Migration...\n');

  try {
    const migrationsDir = path.join(__dirname, '..', 'server', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await pool.query(sql);
      console.log(`✅ Migration completed: ${file}\n`);
    }

    console.log('✅ All migrations completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN (
          'agent_knowledge',
          'framework_docs',
          'troubleshooting',
          'code_patterns',
          'story_learnings',
          'agent_expertise'
        )
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Knowledge Base is ready to use!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
