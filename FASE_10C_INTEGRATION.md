# FASE 10C: INTEGRATION & TESTING GUIDE

**Status**: ✅ Ready for Integration  
**Created**: February 1, 2026

---

## Quick Start

### 1. Verify Installation
```bash
cd /workspaces/ppk-asisten

# Check tier2 files exist
ls src/main/templates/pengadaan/tier2/
# Should show: ba-negosiasi.js, bast.js, hps.js, index.js, 
#              kwitansi.js, spesifikasi-teknis.js, ssp-pph22.js, 
#              surat-pesanan.js, undangan-penawaran.js

# Verify API integration
grep -n "tier2Generators" src/main/api/dokumen.js
# Should show 2 matches (import + registration)
```

### 2. Start Application
```bash
npm run dev
# App will initialize tier2 generators on startup
# Check console for: "Document API initialized"
# Should list all tier2 generators
```

---

## Testing Tier 2 Generators

### Test Data Template

```javascript
// Common test data structure
const testData = {
  satker: {
    nama: 'Kementerian Pendidikan dan Kebudayaan',
    alamat: 'Jl. Menteng Raya No. 37, Jakarta Pusat',
    kota: 'Jakarta',
    npwp: '01.000.000.0-000.000'
  },
  
  lp: {
    nomor: 'LP/2026/001',
    nomor_kontrak: 'SPK/2026/001',
    nomor_bast: 'BAST/2026/001',
    nomor_kwi: 'KWI/2026/001',
    nama_pengadaan: 'Pengadaan Mesin Fotokopi Canon Color',
    nilai_kontrak: 50000000,
    total_nilai: 50000000,
    hps: 54000000,
    sumber_dana: 'DIPA 2026 Kode Rekening 6.2.2.03.01',
    jangka_waktu_kontrak: 30,
    tanggal_kontrak: new Date('2026-02-01'),
    tanggal_mulai_kontrak: new Date('2026-02-05'),
    tanggal_dibuat: new Date('2026-01-20'),
    batas_penawaran: new Date('2026-02-15'),
    tanggal_serah_terima: new Date('2026-03-10'),
    catatan_serah_terima: 'Barang diterima dalam kondisi baik sesuai pesanan',
    penjelasan_umum: 'Mesin fotokopi untuk kebutuhan operasional kantor pusat',
    catatan_spesifikasi: 'Semua mesin harus dilengkapi dengan service call center 24 jam'
  },

  supplier: {
    nama: 'PT Canon Indonesia',
    alamat: 'Jl. Gatot Subroto No. 42, Jakarta',
    kota: 'Jakarta',
    npwp: '01.234.567.8-123.000',
    nama_direktur: 'Hiroshi Tanaka',
    jabatan_direktur: 'Presiden Direktur'
  },

  pejabat: {
    ppk: {
      nama: 'Drs. Bambang Sutrisno, M.Pd.',
      nip: '19650315 198903 1 001'
    },
    bendahara: {
      nama: 'Siti Nurhaliza, S.E.',
      nip: '19700420 199203 2 002'
    }
  },

  items: [
    {
      uraian: 'Mesin Fotokopi Canon Color 2520 - Unit 1',
      deskripsi: 'Mesin fotokopi warna digital dengan fitur scanning',
      spesifikasi: 'Canon imagePRESS C2520, resolusi 4800x2400 dpi, kecepatan 25 ppm warna',
      standar: 'ISO 9001',
      volume: 1,
      satuan: 'Unit',
      harga_satuan: 25000000,
      harga_penawaran: 25000000,
      harga_negosiasi: 23000000,
      jumlah: 25000000,
      kondisi: 'Baik',
      keterangan: 'Kondisi baru dengan garansi 2 tahun dan training operator'
    },
    {
      uraian: 'Mesin Fotokopi Canon Color 2520 - Unit 2',
      deskripsi: 'Mesin fotokopi warna digital dengan fitur scanning',
      spesifikasi: 'Canon imagePRESS C2520, resolusi 4800x2400 dpi, kecepatan 25 ppm warna',
      standar: 'ISO 9001',
      volume: 1,
      satuan: 'Unit',
      harga_satuan: 25000000,
      harga_penawaran: 27000000,
      harga_negosiasi: 27000000,
      jumlah: 25000000,
      kondisi: 'Baik',
      keterangan: 'Kondisi baru dengan garansi 2 tahun dan training operator'
    }
  ],

  negosiasi: {
    tanggal: new Date('2026-02-10'),
    total_penawaran: 52000000,
    total_negosiasi: 50000000
  },

  pph22_amount: 750000 // 1.5% dari 50 juta
};
```

---

## Generator Testing

### 1. Undangan Penawaran
```javascript
// File: test-undangan-penawaran.js
const { ipcRenderer } = require('electron');

async function testUndanganPenawaran() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'UNDANGAN_PENAWARAN',
      testData
    );
    
    if (result.success) {
      console.log('✓ Undangan Penawaran generated:', result.filePath);
      // File should be: Undangan_Penawaran_LP-2026-001.docx
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testUndanganPenawaran();
```

**Expected Output**:
- File: `Undangan_Penawaran_LP-2026-001.docx`
- Content:
  - Government letterhead
  - Document number, attachment note, subject line
  - Recipient address
  - Invitation body with justification
  - Item requirements table (5 columns)
  - 5 terms/conditions
  - Closing statement
  - Single right-aligned signature block

---

### 2. Berita Acara Negosiasi
```javascript
async function testBANegosiasi() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'BA_NEGOSIASI',
      testData
    );
    
    if (result.success) {
      console.log('✓ BA Negosiasi generated:', result.filePath);
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testBANegosiasi();
```

**Expected Output**:
- File: `BA_Negosiasi_LP-2026-001.docx`
- Content:
  - Title: BERITA ACARA NEGOSIASI
  - Document number and date
  - Opening statement
  - Project information (HPS, funding source)
  - Party identification (PPK & Supplier)
  - Negotiation results table (Item | Initial Price | Negotiated Price | Difference)
  - Total comparison
  - Conclusion with amount in words
  - Double signature block

---

### 3. Surat Pesanan/SPK
```javascript
async function testSuratPesanan() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'SURAT_PESANAN',
      testData
    );
    
    if (result.success) {
      console.log('✓ Surat Pesanan generated:', result.filePath);
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testSuratPesanan();
```

**Expected Output**:
- File: `Surat_Pesanan_SPK-2026-001.docx`
- Content:
  - Title: SURAT PESANAN
  - Contract number
  - Party identification (PPK as PIHAK PERTAMA, Supplier as PIHAK KEDUA)
  - 5 Pasal (Articles):
    - Pasal 1: Scope - item table with totals
    - Pasal 2: Value - amount in words
    - Pasal 3: Duration - in days and words
    - Pasal 4: Payment - terms
    - Pasal 5: Sanctions - late payment penalty
  - Double signature block
  - Date and location

---

### 4. BAST (Berita Acara Serah Terima)
```javascript
async function testBAST() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'BAST_TIER2',
      testData
    );
    
    if (result.success) {
      console.log('✓ BAST generated:', result.filePath);
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testBAST();
```

**Expected Output**:
- File: `BAST_BAST-2026-001.docx`
- Content:
  - Title: BERITA ACARA SERAH TERIMA BARANG/HASIL PEKERJAAN
  - Document number
  - Opening statement with date
  - Party identification (Penerima = PPK, Penyerahkan = Supplier)
  - Contract reference
  - Delivery table (No | Item | Volume | Unit | Condition)
  - Condition statement
  - Optional remarks section
  - Double signature block (Supplier first, then PPK)

---

### 5. Spesifikasi Teknis
```javascript
async function testSpesifikasiTeknis() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'SPESIFIKASI_TEKNIS',
      testData
    );
    
    if (result.success) {
      console.log('✓ Spesifikasi Teknis generated:', result.filePath);
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testSpesifikasiTeknis();
```

**Expected Output**:
- File: `Spesifikasi_Teknis_LP-2026-001.docx`
- Content:
  - Title: SPESIFIKASI TEKNIS
  - Procurement information header
  - General explanation section
  - Per-item specifications (2-column table):
    - Deskripsi, Spesifikasi Teknis, Standar/SNI, Volume, Keterangan
  - Special notes section (if provided)

---

### 6. HPS (Harga Perkiraan Sendiri)
```javascript
async function testHPS() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'HPS',
      testData
    );
    
    if (result.success) {
      console.log('✓ HPS generated:', result.filePath);
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testHPS();
```

**Expected Output**:
- File: `HPS_LP-2026-001.docx`
- Content:
  - Title: HARGA PERKIRAAN SENDIRI (HPS)
  - Procurement info (name, LP number, year, funding source)
  - Detailed pricing table (6 columns)
  - Summary section:
    - Subtotal
    - PPN 11% (auto-calculated)
    - TOTAL HPS (subtotal × 1.11)
  - Signature block with preparer name and NIP

---

### 7. Kwitansi Tier 2
```javascript
async function testKwitansi() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'KWITANSI_TIER2',
      testData
    );
    
    if (result.success) {
      console.log('✓ Kwitansi generated:', result.filePath);
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testKwitansi();
```

**Expected Output**:
- File: `Kwitansi_Tier2_LP-2026-001.docx`
- Content:
  - Title: KWITANSI
  - Document number and date
  - Received from: PPK name and NIP
  - Large centered amount: Rp 50.000.000
  - Amount in words: lima puluh juta rupiah
  - Payment purpose and supplier details
  - Breakdown table:
    - Nilai Pengadaan: Rp 50.000.000
    - PPN 11%: Rp 5.500.000
    - Netto: Rp 55.500.000
  - Acknowledgment statement
  - Triple signature block (PPK | Supplier | Treasurer)

---

### 8. SSP PPh 22
```javascript
async function testSSPPph22() {
  try {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      'SSP_PPh22',
      testData
    );
    
    if (result.success) {
      console.log('✓ SSP PPh 22 generated:', result.filePath);
    } else {
      console.error('✗ Error:', result.error);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testSSPPph22();
```

**Expected Output**:
- File: `SSP_PPh22_LP-2026-001.docx`
- Content:
  - Title: SURAT SETORAN PAJAK (SSP) - PPh PASAL 22
  - Taxpayer identity table (WP)
  - Tax object identity table (Penerima)
  - Settlement details table:
    - Nilai Pengadaan
    - Tarif PPh Pasal 22 (1.5%)
    - Jumlah Setoran PPh (calculated)
  - Settlement information table:
    - Tax code (411121)
    - Tax period
    - Settlement date
    - Deposit location

---

## Validation Tests

### Test Missing Required Fields

```javascript
async function testValidation() {
  // Missing satker
  let result = await ipcRenderer.invoke('dokumen:generate', 'SURAT_PESANAN', {
    lp: testData.lp,
    supplier: testData.supplier,
    pejabat: testData.pejabat,
    items: testData.items
  });
  // Should return: { success: false, error: 'Data satker diperlukan' }

  // Missing items
  result = await ipcRenderer.invoke('dokumen:generate', 'BAST_TIER2', {
    satker: testData.satker,
    lp: testData.lp,
    supplier: testData.supplier,
    pejabat: testData.pejabat
  });
  // Should return: { success: false, error: 'Data items diperlukan' }

  // Missing negosiasi for BA Negosiasi
  result = await ipcRenderer.invoke('dokumen:generate', 'BA_NEGOSIASI', {
    satker: testData.satker,
    lp: testData.lp,
    supplier: testData.supplier,
    pejabat: testData.pejabat,
    items: testData.items
    // Missing: negosiasi
  });
  // Should return: { success: false, error: 'Data negosiasi diperlukan' }
}

testValidation();
```

---

## File System Tests

### Check Generated Files
```javascript
async function testFileGeneration() {
  // Generate all tier2 documents
  const generators = [
    'UNDANGAN_PENAWARAN',
    'BA_NEGOSIASI',
    'SURAT_PESANAN',
    'BAST_TIER2',
    'SPESIFIKASI_TEKNIS',
    'HPS',
    'KWITANSI_TIER2',
    'SSP_PPh22'
  ];

  for (const generator of generators) {
    const result = await ipcRenderer.invoke(
      'dokumen:generate',
      generator,
      testData
    );
    console.log(`${generator}: ${result.success ? '✓' : '✗'}`);
  }

  // List all documents
  const files = await ipcRenderer.invoke('dokumen:list');
  console.log(`Total files generated: ${files.files.length}`);
  
  files.files.forEach(file => {
    console.log(`- ${file.name} (${file.size} bytes, ${file.modified})`);
  });
}

testFileGeneration();
```

---

## Console Output Verification

After starting the app, you should see:

```
Document API initialized
Available generators: NOTA_DINAS_PERMINTAAN_TIER1, KWITANSI_TIER1, 
NOTA_DINAS_PERMINTAAN_TIER2, UNDANGAN_PENAWARAN, BA_NEGOSIASI, SURAT_PESANAN, 
BAST_TIER2, SPESIFIKASI_TEKNIS, HPS, KWITANSI_TIER2, SSP_PPh22
```

**Count**: Should show 11 generators (2 from tier1 + 9 from tier2)

---

## Integration Checklist

- [ ] All 9 tier2 files created in `/src/main/templates/pengadaan/tier2/`
- [ ] tier2/index.js exports all 9 generators with correct IPC names
- [ ] dokumen.js imports tier2Generators
- [ ] initializeDocumentAPI() registers tier2 generators
- [ ] App starts without errors
- [ ] Console shows all 11 generators (tier1 + tier2)
- [ ] Each generator produces valid DOCX file
- [ ] All required fields validated
- [ ] All optional fields handled gracefully
- [ ] Document content formatted correctly
- [ ] Signatures placed correctly
- [ ] Currency formatted as Rupiah
- [ ] Amounts in words calculated correctly
- [ ] Dates formatted in Indonesian
- [ ] Tables render properly
- [ ] Page breaks work correctly

---

## Troubleshooting

### Issue: Generator not registered
**Solution**: Check that `tier2Generators` import is present and `initializeDocumentAPI()` loops through tier2 generators.

### Issue: DOCX file corrupted
**Solution**: Ensure `createDocument()` and helpers properly finalize the document before save.

### Issue: Missing folder structure
**Solution**: Verify `/src/main/templates/pengadaan/tier2/` directory exists with all 9 files.

### Issue: IPC timeout
**Solution**: Check that generators are properly instantiated in tier2/index.js and implement validate() method.

### Issue: Incorrect currency formatting
**Solution**: Ensure `formatRupiah()` is imported from format-helper.js and data passed as numbers (not strings).

---

## Next Integration Steps

1. **Frontend UI Components**
   - Add "Generate Document" buttons to procurement views
   - Create modal for document type selection
   - Add download/preview functionality

2. **Database Integration**
   - Store generated document metadata in database
   - Link documents to procurement records
   - Track document versions

3. **Workflow Integration**
   - Auto-generate documents at specific workflow states
   - Enforce document completion before status change
   - Archive documents with procurement records

4. **Reporting**
   - Add document generation statistics
   - Track time-to-document metrics
   - Generate document audit trail

---

## Support

For issues or questions about FASE 10C generators, refer to:
- `FASE_10C_SUMMARY.md` - Complete documentation
- `FASE_10A_SUMMARY.md` - Helper function documentation
- Generator files - Inline code comments
