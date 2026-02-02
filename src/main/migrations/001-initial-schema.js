/**
 * Migration 001: Initial Schema
 *
 * This migration establishes the base schema for the PPK Assistant application.
 * It creates the foundational tables: users, procurement_requests, workflow_approvals,
 * documents, and budget_allocation.
 */

module.exports = {
  version: 1,
  name: 'initial-schema',

  up(db) {
    // This migration is typically run on fresh databases
    // The initial schema is created in initializeSchema()
    // This migration exists for tracking purposes

    console.log('Migration 001: Initial schema already applied via initializeSchema()');
  },

  down(db) {
    // WARNING: This will destroy all data
    const tables = [
      'workflow_approvals',
      'documents',
      'procurement_requests',
      'budget_allocation',
      'users'
    ];

    for (const table of tables) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }

    console.log('Migration 001: Rolled back initial schema');
  }
};
