#!/usr/bin/env node

/**
 * Test CSV Import to Database
 * 
 * This script tests:
 * 1. CSV data parsing
 * 2. IPC import function
 * 3. Data persistence in database
 */

const path = require('path');
const fs = require('fs');
const DatabaseManager = require('./src/main/database');
const PegawaiApi = require('./src/main/api/pegawaiApi');

// Initialize database
async function testCsvImport() {
  console.log('🧪 Testing CSV Import...\n');
  
  const db = new DatabaseManager();
  await db.initialize();
  
  // Create API instance (this will register IPC handlers, but we call directly)
  const pegawaiApi = new PegawaiApi(db);
  
  // Test data (simulating CSV import)
  const testData = [
    {
      nip: '999999999999999001',
      nama: 'TEST PEGAWAI 1',
      jabatan: 'Kepala',
      golongan: 'III/d',
      pangkat: 'Pembina',
      rekening: '1234567890',
      bank: 'BRI',
      unitKerja: 'Test Unit'
    },
    {
      nip: '999999999999999002',
      nama: 'TEST PEGAWAI 2',
      jabatan: 'Staf',
      golongan: 'II/c',
      pangkat: 'Penata Muda',
      rekening: '0987654321',
      bank: 'BCA',
      unitKerja: 'Test Unit'
    },
    {
      nip: '999999999999999003',
      nama: 'TEST PEGAWAI 3',
      jabatan: 'Pelaksana',
      golongan: 'II/a',
      pangkat: 'Juru',
      rekening: '5555555555',
      bank: 'Mandiri',
      unitKerja: 'Test Unit'
    }
  ];
  
  console.log(`📊 Test Data:\n`);
  testData.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.nama} (${p.nip})`);
  });
  
  // Get count before import
  const beforeQuery = db.db.prepare('SELECT COUNT(*) as count FROM pegawai').get();
  console.log(`\n📈 Before import: ${beforeQuery.count} pegawai in database`);
  
  // Import data
  console.log(`\n⏳ Importing ${testData.length} records...`);
  const result = pegawaiApi.importCsv(testData);
  
  console.log(`\n✅ Import Result:`);
  console.log(`  - Imported: ${result.imported}`);
  console.log(`  - Skipped: ${result.skipped}`);
  console.log(`  - Total: ${result.total}`);
  
  // Get count after import
  const afterQuery = db.db.prepare('SELECT COUNT(*) as count FROM pegawai').get();
  console.log(`\n📈 After import: ${afterQuery.count} pegawai in database`);
  
  // Verify imported data
  console.log(`\n🔍 Verifying imported data...`);
  const imported = db.db.prepare('SELECT * FROM pegawai WHERE nip LIKE ? ORDER BY nip DESC LIMIT ?')
    .all('999999999999999%', 3);
  
  if (imported.length > 0) {
    console.log(`✅ Found ${imported.length} imported records:`);
    imported.forEach(p => {
      console.log(`  - ${p.nama} (${p.nip}) - ${p.jabatan}`);
    });
  } else {
    console.log(`❌ No imported records found!`);
  }
  
  // Test query
  console.log(`\n🔎 Testing pegawai.list() method...`);
  const listResult = pegawaiApi.list({ limit: 5 });
  console.log(`  - Success: ${listResult.success}`);
  console.log(`  - Total in DB: ${listResult.total}`);
  console.log(`  - Returned: ${listResult.data.length}`);
  
  if (listResult.data.length > 0) {
    console.log(`  - Sample: ${listResult.data[0].nama}`);
  }
  
  console.log(`\n✅ Test complete!`);
}

testCsvImport().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
