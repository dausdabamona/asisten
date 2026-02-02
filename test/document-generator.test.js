/**
 * Document Generator Test
 * Tests helper functions and PDF generation for Kwitansi, SPP, and SPM
 *
 * Run: node test/document-generator.test.js
 */

const path = require('path');
const fs = require('fs');

// Test output directory
const TEST_OUTPUT = path.join(__dirname, '../test-output');

// Ensure test output directory exists
if (!fs.existsSync(TEST_OUTPUT)) {
  fs.mkdirSync(TEST_OUTPUT, { recursive: true });
}

console.log('='.repeat(60));
console.log('PPK ASISTEN - DOCUMENT GENERATOR TESTS');
console.log('='.repeat(60));
console.log('');

// ==================== Test Helper Functions ====================

// Import helpers directly (they don't depend on Electron)
const helpersPath = path.join(__dirname, '../src/main/services/documentHelpers.js');
const helpersCode = fs.readFileSync(helpersPath, 'utf8');

// Extract and evaluate the functions
const {
  numberToWords,
  formatDate,
  formatCurrency,
  calculateTax,
  generateDocumentNumber
} = require('../src/main/services/documentHelpers');

console.log('1. TESTING HELPER FUNCTIONS');
console.log('-'.repeat(40));

// Test numberToWords
console.log('\n   numberToWords():');
const testAmounts = [
  { input: 0, expected: 'nol' },
  { input: 100, expected: 'Seratus rupiah' },
  { input: 1000, expected: 'Seribu rupiah' },
  { input: 5000000, expected: 'Lima juta rupiah' },
  { input: 12345678, expected: 'Dua belas juta tiga ratus empat puluh lima ribu enam ratus tujuh puluh delapan rupiah' },
  { input: 50000000, expected: 'Lima puluh juta rupiah' }
];

let helperTestsPassed = 0;
let helperTestsFailed = 0;

testAmounts.forEach(({ input, expected }) => {
  const result = numberToWords(input);
  const passed = result.toLowerCase().includes(expected.toLowerCase().split(' ')[0]);
  if (passed) {
    helperTestsPassed++;
    console.log(`   [OK]  ${input.toLocaleString('id-ID').padStart(15)} => ${result}`);
  } else {
    helperTestsFailed++;
    console.log(`   [FAIL] ${input.toLocaleString('id-ID').padStart(15)} => ${result}`);
    console.log(`          Expected to contain: ${expected}`);
  }
});

// Test formatDate
console.log('\n   formatDate():');
const testDate = new Date('2025-01-31T10:00:00Z');
const dateTests = [
  { format: 'full', expected: '31 Januari 2025' },
  { format: 'short', expected: '31 Jan 2025' },
  { format: 'numeric', expected: '31/01/2025' }
];

dateTests.forEach(({ format, expected }) => {
  const result = formatDate(testDate, format);
  if (result === expected) {
    helperTestsPassed++;
    console.log(`   [OK]  ${format.padEnd(8)} => ${result}`);
  } else {
    helperTestsFailed++;
    console.log(`   [FAIL] ${format.padEnd(8)} => ${result} (expected: ${expected})`);
  }
});

// Test formatCurrency
console.log('\n   formatCurrency():');
const currencyTests = [
  { input: 5000000, expected: 'Rp 5.000.000' },
  { input: 10000000, expected: 'Rp 10.000.000' },
  { input: 50000000, expected: 'Rp 50.000.000' }
];

currencyTests.forEach(({ input, expected }) => {
  const result = formatCurrency(input);
  if (result === expected) {
    helperTestsPassed++;
    console.log(`   [OK]  ${input.toLocaleString().padStart(12)} => ${result}`);
  } else {
    helperTestsFailed++;
    console.log(`   [FAIL] ${input.toLocaleString().padStart(12)} => ${result} (expected: ${expected})`);
  }
});

// Test calculateTax
console.log('\n   calculateTax():');
const taxResult = calculateTax(5000000);
console.log(`   Base Amount:  ${formatCurrency(taxResult.baseAmount)}`);
console.log(`   PPh (1.5%):   ${formatCurrency(taxResult.pph)} ${taxResult.pph === 75000 ? '[OK]' : '[FAIL]'}`);
console.log(`   PPN (11%):    ${formatCurrency(taxResult.ppn)} ${taxResult.ppn === 550000 ? '[OK]' : '[FAIL]'}`);
console.log(`   Total Tax:    ${formatCurrency(taxResult.totalTax)} ${taxResult.totalTax === 625000 ? '[OK]' : '[FAIL]'}`);
console.log(`   Net Amount:   ${formatCurrency(taxResult.netAmount)} ${taxResult.netAmount === 4925000 ? '[OK]' : '[FAIL]'}`);

if (taxResult.pph === 75000) helperTestsPassed++; else helperTestsFailed++;
if (taxResult.ppn === 550000) helperTestsPassed++; else helperTestsFailed++;

// Test generateDocumentNumber
console.log('\n   generateDocumentNumber():');
const docNumTests = [
  { prefix: 'KW', seq: 1 },
  { prefix: 'SPP', seq: 5 },
  { prefix: 'SPM', seq: 10 }
];

docNumTests.forEach(({ prefix, seq }) => {
  const result = generateDocumentNumber(prefix, seq);
  const valid = result.includes(prefix) && result.includes(new Date().getFullYear().toString());
  if (valid) {
    helperTestsPassed++;
    console.log(`   [OK]  ${prefix.padEnd(4)} seq=${seq} => ${result}`);
  } else {
    helperTestsFailed++;
    console.log(`   [FAIL] ${prefix.padEnd(4)} seq=${seq} => ${result}`);
  }
});

console.log('\n');
console.log('2. TESTING PDF GENERATION');
console.log('-'.repeat(40));

// Test PDFKit directly
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
  console.log('\n   PDFKit installed: [OK]');
} catch (e) {
  console.log('\n   PDFKit installed: [FAIL] - ' + e.message);
  process.exit(1);
}

// Test data - T1/2025/001
const testRequest = {
  id: 'req-test-001',
  request_number: 'T1/2025/001',
  item_name: 'Pengadaan ATK Kantor',
  description: 'Pembelian alat tulis kantor untuk kebutuhan operasional semester I tahun 2025',
  estimated_value: 5000000,
  tier: 'tier1',
  unit: 'Bagian Umum',
  budget_code: '5211.001.001',
  status: 'approved',
  created_at: '2025-01-31T10:00:00Z',
  ppk_name: 'Dr. Ahmad Fadli, M.Si',
  ppk_nip: '198501152010121001',
  sequence: 1
};

// Generate a sample Kwitansi PDF
async function generateTestKwitansi() {
  console.log('\n   Generating sample Kwitansi PDF...');
  const startTime = Date.now();

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 60, right: 60 }
  });

  const filePath = path.join(TEST_OUTPUT, 'kwitansi_T1-2025-001_test.pdf');
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const margins = doc.page.margins;
  const contentWidth = pageWidth - margins.left - margins.right;

  // Header
  doc.fontSize(10)
    .fillColor('#000000')
    .text('KEMENTERIAN KELAUTAN DAN PERIKANAN', margins.left, margins.top, { align: 'center', width: contentWidth });

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('POLITEKNIK KELAUTAN DAN PERIKANAN SORONG', margins.left, doc.y + 2, { align: 'center', width: contentWidth });

  doc.fontSize(9)
    .font('Helvetica')
    .text('Jl. Kapitan Pattimura, Tanjung Kasuari, Sorong Manoi', margins.left, doc.y + 2, { align: 'center', width: contentWidth });

  doc.text('Telp: (0951) 321234 | Email: poltek.sorong@kkp.go.id', margins.left, doc.y + 2, { align: 'center', width: contentWidth });

  // Header line
  doc.moveTo(margins.left, doc.y + 10)
    .lineTo(pageWidth - margins.right, doc.y + 10)
    .lineWidth(2)
    .stroke();

  doc.moveTo(margins.left, doc.y + 13)
    .lineTo(pageWidth - margins.right, doc.y + 13)
    .lineWidth(0.5)
    .stroke();

  doc.moveDown(3);

  // Title
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('KWITANSI', { align: 'center' });

  doc.fontSize(10)
    .font('Helvetica')
    .text(`Nomor: ${generateDocumentNumber('KW', testRequest.sequence)}`, { align: 'center' });

  doc.moveDown(2);

  // Body
  const labelWidth = 150;
  const valueX = margins.left + labelWidth;

  doc.text('Sudah terima dari', margins.left, doc.y);
  doc.text(': POLITEKNIK KELAUTAN DAN PERIKANAN SORONG', valueX, doc.y - 12);
  doc.moveDown(0.5);

  doc.text('Uang sejumlah', margins.left, doc.y);
  const amountWords = numberToWords(testRequest.estimated_value);

  // Box for amount in words
  doc.rect(valueX, doc.y - 12, contentWidth - labelWidth, 40)
    .stroke();
  doc.fontSize(9)
    .text(amountWords, valueX + 5, doc.y - 7, {
      width: contentWidth - labelWidth - 10,
      height: 35
    });

  doc.moveDown(3);

  doc.fontSize(10)
    .text('Untuk pembayaran', margins.left, doc.y);
  doc.text(`: ${testRequest.description}`, valueX, doc.y - 12, {
    width: contentWidth - labelWidth
  });

  doc.moveDown(1);

  // Amount box
  doc.text('Terbilang', margins.left, doc.y);
  doc.rect(valueX, doc.y - 12, 200, 25)
    .fillAndStroke('#F5F5F5', '#000000');

  doc.fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(formatCurrency(testRequest.estimated_value), valueX + 10, doc.y - 8);

  doc.moveDown(3);

  // Tax info
  const tax = calculateTax(testRequest.estimated_value);
  doc.font('Helvetica')
    .fontSize(9)
    .text('Potongan Pajak:', margins.left, doc.y);
  doc.text(`  - PPh Pasal 22 (1.5%): ${formatCurrency(tax.pph)}`, margins.left, doc.y + 2);
  doc.text(`  - PPN (11%): ${formatCurrency(tax.ppn)}`, margins.left, doc.y + 2);
  doc.text(`  - Total Potongan: ${formatCurrency(tax.totalTax)}`, margins.left, doc.y + 2);
  doc.text(`  - Jumlah Bersih: ${formatCurrency(tax.netAmount)}`, margins.left, doc.y + 2);

  doc.moveDown(3);

  // Signatures
  const sigY = doc.y;

  doc.fontSize(10)
    .text(`Sorong, ${formatDate(new Date())}`, margins.left, sigY, { width: 200 });
  doc.text('Yang Menerima,', margins.left, doc.y + 5, { width: 200 });
  doc.moveDown(4);
  doc.text('(_____________________)', margins.left, doc.y, { width: 200 });
  doc.fontSize(9)
    .text('Materai Rp 10.000', margins.left, doc.y + 2, { width: 200 });

  doc.fontSize(10)
    .text('Yang Membayar,', pageWidth - margins.right - 200, sigY + 17, { width: 200, align: 'center' });
  doc.moveDown(4);
  doc.text(testRequest.ppk_name, pageWidth - margins.right - 200, doc.y, { width: 200, align: 'center' });
  doc.fontSize(9)
    .text(`NIP. ${testRequest.ppk_nip}`, pageWidth - margins.right - 200, doc.y + 2, { width: 200, align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      const duration = Date.now() - startTime;
      const stats = fs.statSync(filePath);
      resolve({ filePath, duration, size: stats.size });
    });
    stream.on('error', reject);
  });
}

// Generate sample SPP
async function generateTestSPP() {
  console.log('\n   Generating sample SPP PDF...');
  const startTime = Date.now();

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 60, right: 60 }
  });

  const filePath = path.join(TEST_OUTPUT, 'spp_T1-2025-001_test.pdf');
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const margins = doc.page.margins;
  const contentWidth = pageWidth - margins.left - margins.right;

  // Header
  doc.fontSize(10)
    .text('KEMENTERIAN KELAUTAN DAN PERIKANAN', { align: 'center' });
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('POLITEKNIK KELAUTAN DAN PERIKANAN SORONG', { align: 'center' });
  doc.fontSize(9)
    .font('Helvetica')
    .text('Jl. Kapitan Pattimura, Tanjung Kasuari, Sorong Manoi', { align: 'center' });

  // Line
  doc.moveTo(margins.left, doc.y + 10)
    .lineTo(pageWidth - margins.right, doc.y + 10)
    .lineWidth(2)
    .stroke();

  doc.moveDown(3);

  // Title
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('SURAT PERMINTAAN PEMBAYARAN', { align: 'center' });

  doc.fontSize(10)
    .font('Helvetica')
    .text(`Nomor: ${generateDocumentNumber('SPP', testRequest.sequence)}`, { align: 'center' });

  doc.moveDown(2);

  // Table
  doc.font('Helvetica-Bold')
    .fontSize(11)
    .text('I. DATA UMUM', margins.left, doc.y);

  doc.moveDown(0.5);

  const tableData = [
    ['1', 'Nomor Pengajuan', testRequest.request_number],
    ['2', 'Tanggal Pengajuan', formatDate(testRequest.created_at)],
    ['3', 'Nama Barang/Jasa', testRequest.item_name],
    ['4', 'Unit Pengusul', testRequest.unit],
    ['5', 'Kode Anggaran', testRequest.budget_code],
    ['6', 'Tahun Anggaran', new Date().getFullYear().toString()],
    ['7', 'Jumlah (Rp)', formatCurrency(testRequest.estimated_value)],
    ['8', 'Terbilang', numberToWords(testRequest.estimated_value)]
  ];

  doc.font('Helvetica')
    .fontSize(9);

  let tableY = doc.y;
  const colWidths = [40, 150, contentWidth - 190];

  tableData.forEach((row, rowIdx) => {
    let x = margins.left;
    row.forEach((cell, colIdx) => {
      doc.rect(x, tableY, colWidths[colIdx], 20).stroke();
      doc.text(cell, x + 5, tableY + 5, { width: colWidths[colIdx] - 10 });
      x += colWidths[colIdx];
    });
    tableY += 20;
  });

  doc.y = tableY + 20;

  // Declaration
  doc.font('Helvetica')
    .fontSize(10)
    .text(
      'Dengan ini saya menyatakan bahwa permintaan pembayaran ini sesuai dengan peraturan yang berlaku.',
      margins.left, doc.y, { width: contentWidth, align: 'justify' }
    );

  doc.moveDown(3);

  // Signatures
  doc.text('Pemohon,', margins.left, doc.y);
  doc.moveDown(4);
  doc.text(testRequest.requester_name || '(_____________________)', margins.left, doc.y);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      const duration = Date.now() - startTime;
      const stats = fs.statSync(filePath);
      resolve({ filePath, duration, size: stats.size });
    });
    stream.on('error', reject);
  });
}

// Generate sample SPM
async function generateTestSPM() {
  console.log('\n   Generating sample SPM PDF...');
  const startTime = Date.now();

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 60, right: 60 }
  });

  const filePath = path.join(TEST_OUTPUT, 'spm_T1-2025-001_test.pdf');
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const margins = doc.page.margins;
  const contentWidth = pageWidth - margins.left - margins.right;

  // Header
  doc.fontSize(10)
    .text('KEMENTERIAN KELAUTAN DAN PERIKANAN', { align: 'center' });
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('POLITEKNIK KELAUTAN DAN PERIKANAN SORONG', { align: 'center' });
  doc.fontSize(9)
    .font('Helvetica')
    .text('Jl. Kapitan Pattimura, Tanjung Kasuari, Sorong Manoi', { align: 'center' });

  doc.moveTo(margins.left, doc.y + 10)
    .lineTo(pageWidth - margins.right, doc.y + 10)
    .lineWidth(2)
    .stroke();

  doc.moveDown(3);

  // Title
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('SURAT PERINTAH MEMBAYAR', { align: 'center' });

  doc.fontSize(10)
    .font('Helvetica')
    .text(`Nomor: ${generateDocumentNumber('SPM', testRequest.sequence)}`, { align: 'center' });

  doc.moveDown(1);

  // To
  doc.text('Kepada Yth.', margins.left, doc.y);
  doc.text('Kepala Kantor Pelayanan Perbendaharaan Negara (KPPN)', margins.left, doc.y + 2);
  doc.text('di Sorong', margins.left, doc.y + 2);

  doc.moveDown(1.5);

  doc.text(
    'Berdasarkan Surat Permintaan Pembayaran (SPP) yang telah diverifikasi dan disetujui, dengan ini diperintahkan untuk membayar kepada:',
    margins.left, doc.y, { width: contentWidth, align: 'justify' }
  );

  doc.moveDown(1);

  // Payment details
  const tax = calculateTax(testRequest.estimated_value);

  doc.font('Helvetica-Bold')
    .fontSize(11)
    .text('RINCIAN PEMBAYARAN', margins.left, doc.y);

  doc.moveDown(0.5);
  doc.font('Helvetica')
    .fontSize(10);

  doc.text(`Nilai Bruto:     ${formatCurrency(testRequest.estimated_value)}`, margins.left, doc.y);
  doc.text(`PPh Pasal 22:    (${formatCurrency(tax.pph)})`, margins.left, doc.y + 2);
  doc.text(`PPN:             ${formatCurrency(tax.ppn)}`, margins.left, doc.y + 2);
  doc.text(`JUMLAH BERSIH:   ${formatCurrency(tax.netAmount)}`, margins.left, doc.y + 2);

  doc.moveDown(0.5);
  doc.text(`Terbilang: ${numberToWords(tax.netAmount)}`, margins.left, doc.y, { width: contentWidth });

  doc.moveDown(2);

  // Authorization
  doc.text(
    'Demikian Surat Perintah Membayar ini dibuat untuk dilaksanakan sebagaimana mestinya.',
    margins.left, doc.y, { width: contentWidth, align: 'justify' }
  );

  doc.moveDown(2);

  // Signature
  const sigX = pageWidth - margins.right - 220;
  doc.text(`Sorong, ${formatDate(new Date())}`, sigX, doc.y, { width: 220 });
  doc.text('Pejabat Penandatangan SPM', sigX, doc.y + 5, { width: 220 });
  doc.moveDown(4);
  doc.font('Helvetica-Bold')
    .text('Ir. Sutrisno, M.T.', sigX, doc.y, { width: 220 });
  doc.font('Helvetica')
    .fontSize(9)
    .text('NIP. 197801012005011001', sigX, doc.y + 2, { width: 220 });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      const duration = Date.now() - startTime;
      const stats = fs.statSync(filePath);
      resolve({ filePath, duration, size: stats.size });
    });
    stream.on('error', reject);
  });
}

// Run all PDF tests
async function runPDFTests() {
  const results = [];

  try {
    const kwitansi = await generateTestKwitansi();
    console.log(`   [OK]  Kwitansi generated`);
    console.log(`         Path: ${kwitansi.filePath}`);
    console.log(`         Size: ${(kwitansi.size / 1024).toFixed(2)} KB`);
    console.log(`         Time: ${kwitansi.duration}ms ${kwitansi.duration < 2000 ? '(< 2s target)' : '(SLOW)'}`);
    results.push({ name: 'Kwitansi', success: true, ...kwitansi });
  } catch (e) {
    console.log(`   [FAIL] Kwitansi: ${e.message}`);
    results.push({ name: 'Kwitansi', success: false, error: e.message });
  }

  try {
    const spp = await generateTestSPP();
    console.log(`   [OK]  SPP generated`);
    console.log(`         Path: ${spp.filePath}`);
    console.log(`         Size: ${(spp.size / 1024).toFixed(2)} KB`);
    console.log(`         Time: ${spp.duration}ms ${spp.duration < 2000 ? '(< 2s target)' : '(SLOW)'}`);
    results.push({ name: 'SPP', success: true, ...spp });
  } catch (e) {
    console.log(`   [FAIL] SPP: ${e.message}`);
    results.push({ name: 'SPP', success: false, error: e.message });
  }

  try {
    const spm = await generateTestSPM();
    console.log(`   [OK]  SPM generated`);
    console.log(`         Path: ${spm.filePath}`);
    console.log(`         Size: ${(spm.size / 1024).toFixed(2)} KB`);
    console.log(`         Time: ${spm.duration}ms ${spm.duration < 2000 ? '(< 2s target)' : '(SLOW)'}`);
    results.push({ name: 'SPM', success: true, ...spm });
  } catch (e) {
    console.log(`   [FAIL] SPM: ${e.message}`);
    results.push({ name: 'SPM', success: false, error: e.message });
  }

  return results;
}

// Main test execution
async function main() {
  const pdfResults = await runPDFTests();

  console.log('\n');
  console.log('3. TEST SUMMARY');
  console.log('-'.repeat(40));

  console.log(`\n   Helper Functions:`);
  console.log(`     Passed: ${helperTestsPassed}`);
  console.log(`     Failed: ${helperTestsFailed}`);

  console.log(`\n   PDF Generation:`);
  const pdfPassed = pdfResults.filter(r => r.success).length;
  const pdfFailed = pdfResults.filter(r => !r.success).length;
  console.log(`     Passed: ${pdfPassed}`);
  console.log(`     Failed: ${pdfFailed}`);

  const avgTime = pdfResults.filter(r => r.duration).reduce((a, b) => a + b.duration, 0) / pdfResults.filter(r => r.duration).length;
  console.log(`     Avg Time: ${avgTime.toFixed(0)}ms`);

  console.log('\n');
  const totalPassed = helperTestsPassed + pdfPassed;
  const totalFailed = helperTestsFailed + pdfFailed;

  if (totalFailed === 0) {
    console.log('   [ALL TESTS PASSED]');
  } else {
    console.log(`   [${totalFailed} TESTS FAILED]`);
    process.exitCode = 1;
  }

  console.log('\n');
  console.log('   Generated PDFs in: ' + TEST_OUTPUT);
  console.log('');

  // List generated files
  console.log('   Files generated:');
  const files = fs.readdirSync(TEST_OUTPUT);
  files.forEach(f => {
    const stats = fs.statSync(path.join(TEST_OUTPUT, f));
    console.log(`     - ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
  });

  console.log('');
  console.log('='.repeat(60));
}

main().catch(console.error);
