/**
 * Test Database Initialization
 * Run this to test if database creation and seeding works
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Simulate electron app before requiring database
const { app } = require('electron');
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      return path.join(__dirname, 'test-data');
    }
    return __dirname;
  }
};

// Mock electron module
require.cache[require.resolve('electron')] = {
  exports: { app: mockApp }
};

// Now require the database module
const PPKDatabase = require('./src/main/database.js');

console.log('Creating database instance...');
const db = new PPKDatabase();

console.log('\n=== Checking Pegawai Records ===');
const pegawaiCount = db.db.prepare('SELECT COUNT(*) as count FROM pegawai').get();
console.log('Total pegawai:', pegawaiCount.count);

if (pegawaiCount.count > 0) {
  const samplePegawai = db.db.prepare('SELECT * FROM pegawai LIMIT 5').all();
  console.log('\nSample pegawai records:');
  samplePegawai.forEach(p => {
    console.log(`  - ${p.nama} (${p.nip}) - ${p.jabatan}`);
  });
}

console.log('\n=== Checking Satker Table ===');
const satkerCount = db.db.prepare('SELECT COUNT(*) as count FROM satker').get();
console.log('Total satker:', satkerCount.count);

console.log('\n=== Checking DIPA-related Tables ===');
const tables = db.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%dipa%'").all();
console.log('DIPA tables:', tables.map(t => t.name).join(', ') || 'None');

console.log('\n=== All Tables ===');
const allTables = db.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
allTables.forEach(t => console.log(`  - ${t.name}`));

console.log('\n✅ Database test completed!');
process.exit(0);
