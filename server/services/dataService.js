// Singleton instance of InMemoryService
// All routes should use this shared instance

const InMemoryService = require('./inMemoryService');

// Create single instance
const dataService = new InMemoryService();

module.exports = dataService;
