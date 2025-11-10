// Remove Old Activation Templates
// Removes the 3 original templates that were used for Command Center development

const axios = require('axios');

const API_BASE = 'http://localhost:7500/api';
const PROJECT_ID = 'voice-agent-telnyx-app';

const OLD_ROLES_TO_REMOVE = [
  'DataArchitect',
  'UIDesigner',
  'BackendEngineer'
];

async function removeOldTemplates() {
  try {
    console.log('🗑️  Removing old activation templates...\n');

    // First, get all templates to see what we have
    const allTemplates = await axios.get(`${API_BASE}/activation/templates?project_id=${PROJECT_ID}`);
    console.log(`📊 Found ${allTemplates.data.count} total templates\n`);

    // Display current templates
    console.log('Current templates:');
    allTemplates.data.data.forEach(t => {
      console.log(`  - ${t.role_name} (${t.agent_name})`);
    });
    console.log('');

    // Since there's no DELETE endpoint, we'll need to manipulate the data file directly
    // Load the current data
    const fs = require('fs').promises;
    const path = require('path');
    const dataFile = path.join(__dirname, '../data/command-center-data.json');

    console.log('📖 Reading data file...');
    const data = await fs.readFile(dataFile, 'utf8');
    const parsed = JSON.parse(data);

    console.log(`📦 Current activation templates: ${Object.keys(parsed.activationTemplates || {}).length}\n`);

    // Remove old templates
    let removedCount = 0;
    OLD_ROLES_TO_REMOVE.forEach(roleName => {
      const key = `${PROJECT_ID}:${roleName}`;
      if (parsed.activationTemplates && parsed.activationTemplates[key]) {
        console.log(`✅ Removing: ${roleName}`);
        delete parsed.activationTemplates[key];
        removedCount++;
      } else {
        console.log(`⚠️  Not found: ${roleName}`);
      }
    });

    console.log(`\n📦 Activation templates after removal: ${Object.keys(parsed.activationTemplates || {}).length}`);
    console.log(`🗑️  Removed ${removedCount} templates\n`);

    // Save updated data
    console.log('💾 Saving updated data...');
    await fs.writeFile(dataFile, JSON.stringify(parsed, null, 2));
    console.log('✅ Data file updated successfully\n');

    // Verify by checking API again
    console.log('🔍 Verifying via API...');
    const updatedTemplates = await axios.get(`${API_BASE}/activation/templates?project_id=${PROJECT_ID}`);
    console.log(`📊 Now showing ${updatedTemplates.data.count} templates:\n`);

    updatedTemplates.data.data.forEach(t => {
      console.log(`  ✅ ${t.role_name} (${t.agent_name})`);
    });

    console.log('\n✨ Cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Templates before: ${allTemplates.data.count}`);
    console.log(`   - Templates removed: ${removedCount}`);
    console.log(`   - Templates remaining: ${updatedTemplates.data.count}`);
    console.log(`   - Active agents: 12 role-based agents`);

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Data file not found. Server may need to be started first.');
    } else {
      console.error('❌ Cleanup failed:', error.response?.data || error.message);
    }
    process.exit(1);
  }
}

removeOldTemplates();
