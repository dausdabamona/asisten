const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Simulate PPKDatabase structure
class TestDB {
  constructor() {
    const dbPath = path.join(os.homedir(), '.config/ppk-assistant/database/ppk.db');
    this.db = new Database(dbPath);
  }
}

// Import PegawaiApi
const PegawaiApi = require('./src/main/api/pegawaiApi');

// Create instance
const testDb = new TestDB();
const pegawaiApi = new PegawaiApi(testDb);

// Test list
console.log('Testing pegawai.list()...');
const result = pegawaiApi.list({ limit: 5 });
console.log('Result:', JSON.stringify(result, null, 2));

if (result.success && result.data) {
  console.log('\nFirst pegawai:');
  console.log('- NIP:', result.data[0].nip);
  console.log('- Nama:', result.data[0].nama);
  console.log('- Jabatan:', result.data[0].jabatan);
}

testDb.db.close();
