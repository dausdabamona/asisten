# FASE 10E Integration Guide - Perjalanan Dinas Generators

**Date**: February 1, 2026  
**Status**: ✅ COMPLETE

---

## Quick Integration Summary

FASE 10E integrates three Perjalanan Dinas document generators into the system:

| Generator | Lines | Pages | IPC Name | Purpose |
|-----------|-------|-------|----------|---------|
| Surat Tugas | 165 | 1 | `SURAT_TUGAS` | Travel order |
| SPPD | 245 | 2 | `SPPD` | Travel permit (front & back) |
| Rincian Biaya | 165 | 1-2 | `RINCIAN_BIAYA_PERDIN` | Cost breakdown |

All generators are **automatically registered** on app startup via `initializeDocumentAPI()`.

---

## File Changes

### New Files (4)
```
src/main/templates/perjalanan-dinas/
├── index.js              ← Registry (12 lines)
├── surat-tugas.js        ← Surat Tugas (165 lines)
├── sppd.js               ← SPPD (245 lines)
└── rincian-biaya.js      ← Rincian Biaya (165 lines)
```

### Modified Files (1)
```
src/main/api/dokumen.js
├── Line 14: Added perdin import
└── Lines 237-240: Added perdin registration
```

---

## Testing Generated Documents

### Test 1: Generate Surat Tugas

```javascript
const ipcRenderer = require('electron').ipcRenderer;

async function testSuratTugas() {
  const suratTugasData = {
    satker: {
      nama: 'Dinas Pendidikan Kota Sorong',
      alamat: 'Jl. Merdeka No. 45',
      kota: 'Sorong'
    },
    st: {
      nomor: 'ST/DPK/2026/001',
      maksud_tujuan: 'Monitoring dan evaluasi program pendidikan',
      kota_tujuan: 'Jakarta',
      provinsi_tujuan: 'DKI Jakarta',
      tanggal_berangkat: new Date('2026-02-15'),
      tanggal_kembali: new Date('2026-02-20'),
      lama_hari: 5,
      tanggal_dibuat: new Date('2026-02-01'),
      dasar_nomor: '05/DPK/2026',
      jenis_dasar: 'SK',
      dasar_tanggal: new Date('2026-01-15')
    },
    pelaksana: [
      {
        nama: 'Bambang Sutrisno',
        nip: '19650315 198903 1 001',
        pangkat: 'Pembina',
        golongan: 'IV/a',
        jabatan: 'Kepala Bidang Kurikulum'
      },
      {
        nama: 'Ahmad Prasetyo',
        nip: '19680512 199203 1 002',
        pangkat: 'Penata',
        golongan: 'III/c',
        jabatan: 'Staf Bidang Kurikulum'
      }
    ],
    pejabat: {
      kpa: {
        nama: 'Dr. Rinto Harahap, S.Pd., M.Si.',
        nip: '19640315 198803 1 001'
      }
    }
  };

  try {
    const result = await ipcRenderer.invoke('dokumen:generate', 'SURAT_TUGAS', suratTugasData);
    console.log('✅ Surat Tugas generated successfully');
    console.log('📄 File:', result.generatedFilename);
    console.log('📊 Size:', result.fileSize, 'bytes');
    
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSuratTugas();
```

**Expected Output**:
- ✅ 1-page document
- ✅ Filename: `Surat_Tugas_ST-DPK-2026-001.docx`
- ✅ Contains 2 pelaksana in table format
- ✅ KPA signature block
- ✅ Formatted dates and times

---

### Test 2: Generate SPPD

```javascript
async function testSPPD() {
  const sppdData = {
    satker: {
      nama: 'Dinas Pendidikan Kota Sorong',
      alamat: 'Jl. Merdeka No. 45',
      kota: 'Sorong'
    },
    st: {
      nomor: 'ST/DPK/2026/001',
      nomor_sppd: 'SPPD/DPK/2026/001',
      maksud_tujuan: 'Monitoring dan evaluasi program pendidikan',
      kota_asal: 'Sorong',
      kota_tujuan: 'Jakarta',
      tanggal_berangkat: new Date('2026-02-15'),
      tanggal_kembali: new Date('2026-02-20'),
      lama_hari: 5,
      moda_transport: 'Udara',
      kode_akun: '524111',
      tanggal_dibuat: new Date('2026-02-01')
    },
    pelaksana: [
      {
        nama: 'Bambang Sutrisno',
        nip: '19650315 198903 1 001',
        pangkat: 'Pembina',
        golongan: 'IV/a',
        jabatan: 'Kepala Bidang'
      }
    ],
    pejabat: {
      ppk: {
        nama: 'Dr. Rinto Harahap',
        nip: '19640315 198803 1 001'
      }
    }
  };

  try {
    const result = await ipcRenderer.invoke('dokumen:generate', 'SPPD', sppdData);
    console.log('✅ SPPD generated successfully');
    console.log('📄 File:', result.generatedFilename);
    console.log('📖 Pages: 2 (depan & belakang)');
    
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSPPD();
```

**Expected Output**:
- ✅ 2-page document with page break
- ✅ Halaman 1: SPPD depan dengan tabel isi
- ✅ Halaman 2: Pengesahan tiba/berangkat (3 tempat)
- ✅ Filename: `SPPD_SPPD-DPK-2026-001_Bambang.docx`

---

### Test 3: Generate Rincian Biaya

```javascript
async function testRincianBiaya() {
  const biayaData = {
    satker: {
      nama: 'Dinas Pendidikan Kota Sorong',
      alamat: 'Jl. Merdeka No. 45',
      kota: 'Sorong'
    },
    st: {
      nomor: 'ST/DPK/2026/001',
      kota_tujuan: 'Jakarta',
      tanggal_berangkat: new Date('2026-02-15'),
      tanggal_kembali: new Date('2026-02-20'),
      lama_hari: 5
    },
    pelaksana: [
      {
        nama: 'Bambang Sutrisno',
        nip: '19650315 198903 1 001',
        golongan: 'IV/a'
      }
    ],
    biaya: [
      {
        uang_harian: 550000,        // 5 hari × Rp110.000
        penginapan: 2000000,        // 4 malam × Rp500.000
        transport: 5000000,         // Jakarta-Sorong roundtrip
        transport_lokal: 1000000,   // 5 hari × Rp200.000
        representasi: 500000,       // 5 hari × Rp100.000
        tarif_uang_harian: 110000,
        tarif_penginapan: 500000,
        tarif_transport_lokal: 200000,
        tarif_representasi: 100000
      }
    ],
    pejabat: {
      ppk: {
        nama: 'Dr. Rinto Harahap',
        nip: '19640315 198803 1 001'
      }
    }
  };

  try {
    const result = await ipcRenderer.invoke('dokumen:generate', 'RINCIAN_BIAYA_PERDIN', biayaData);
    console.log('✅ Rincian Biaya generated successfully');
    console.log('📄 File:', result.generatedFilename);
    console.log('💰 Total: Rp 9.050.000');
    
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRincianBiaya();
```

**Expected Output**:
- ✅ 1-2 page document
- ✅ Breakdown table: Uang harian, Penginapan, Transport, Transport lokal, Representasi
- ✅ Subtotal and Grand Total
- ✅ Terbilang (amount in words)
- ✅ Signature table (2 columns)

---

## Validation Testing

### Test 4: Validation Errors

```javascript
async function testValidationErrors() {
  // Test 1: Missing satker
  try {
    await ipcRenderer.invoke('dokumen:generate', 'SURAT_TUGAS', {
      st: { /* ... */ }
    });
  } catch (error) {
    console.log('✅ Caught missing satker:', error.message);
  }

  // Test 2: Empty pelaksana
  try {
    await ipcRenderer.invoke('dokumen:generate', 'SPPD', {
      satker: { nama: 'Test' },
      st: { /* ... */ },
      pelaksana: []  // Empty!
    });
  } catch (error) {
    console.log('✅ Caught empty pelaksana:', error.message);
  }

  // Test 3: Missing PPK
  try {
    await ipcRenderer.invoke('dokumen:generate', 'RINCIAN_BIAYA_PERDIN', {
      satker: { nama: 'Test' },
      st: { /* ... */ },
      pelaksana: [{ nama: 'Test' }],
      pejabat: {}  // No PPK/KPA
    });
  } catch (error) {
    console.log('✅ Caught missing PPK:', error.message);
  }
}

testValidationErrors();
```

---

## Frontend Integration Example

### Vue Component Usage

```vue
<template>
  <div class="perdin-document-generator">
    <h2>Generator Dokumen Perjalanan Dinas</h2>
    
    <div class="generator-buttons">
      <button @click="generateSuratTugas" :disabled="loading">
        📋 Generate Surat Tugas
      </button>
      <button @click="generateSPPD" :disabled="loading">
        ✈️ Generate SPPD
      </button>
      <button @click="generateRincianBiaya" :disabled="loading">
        💰 Generate Rincian Biaya
      </button>
    </div>

    <div v-if="loading" class="loading">
      Generating document...
    </div>

    <div v-if="message" :class="['message', message.type]">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ipcRenderer } from 'electron';
import { useSuratTugasStore } from '@/stores/suratTugasStore';

const loading = ref(false);
const message = ref(null);
const stStore = useSuratTugasStore();

const generateSuratTugas = async () => {
  loading.value = true;
  try {
    const st = stStore.currentSuratTugas;
    const result = await ipcRenderer.invoke('dokumen:generate', 'SURAT_TUGAS', {
      satker: st.satker,
      st: st,
      pelaksana: st.pelaksana,
      pejabat: st.pejabat
    });
    
    message.value = {
      type: 'success',
      text: `✅ Surat Tugas: ${result.generatedFilename}`
    };
    
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (error) {
    message.value = {
      type: 'error',
      text: `❌ Error: ${error.message}`
    };
  } finally {
    loading.value = false;
  }
};

const generateSPPD = async () => {
  loading.value = true;
  try {
    const st = stStore.currentSuratTugas;
    const result = await ipcRenderer.invoke('dokumen:generate', 'SPPD', {
      satker: st.satker,
      st: st,
      pelaksana: st.pelaksana,
      pejabat: st.pejabat
    });
    
    message.value = {
      type: 'success',
      text: `✅ SPPD: ${result.generatedFilename}`
    };
    
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (error) {
    message.value = {
      type: 'error',
      text: `❌ Error: ${error.message}`
    };
  } finally {
    loading.value = false;
  }
};

const generateRincianBiaya = async () => {
  loading.value = true;
  try {
    const st = stStore.currentSuratTugas;
    const result = await ipcRenderer.invoke('dokumen:generate', 'RINCIAN_BIAYA_PERDIN', {
      satker: st.satker,
      st: st,
      pelaksana: st.pelaksana,
      biaya: st.biaya,
      pejabat: st.pejabat
    });
    
    message.value = {
      type: 'success',
      text: `✅ Rincian Biaya: ${result.generatedFilename}`
    };
    
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (error) {
    message.value = {
      type: 'error',
      text: `❌ Error: ${error.message}`
    };
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.generator-buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

button {
  padding: 10px 20px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.loading {
  padding: 10px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  margin-top: 10px;
}

.message {
  padding: 10px;
  margin-top: 10px;
  border-left: 4px solid;
}

.message.success {
  background: #c8e6c9;
  border-color: #4caf50;
  color: #2e7d32;
}

.message.error {
  background: #ffcdd2;
  border-color: #f44336;
  color: #c62828;
}
</style>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "SURAT_TUGAS generator not found" | Check dokumen.js line 14 has perdin import |
| "Data satker diperlukan" | Verify satker object in data |
| "Data pelaksana diperlukan" | Pass non-empty pelaksana array |
| SPPD shows as 1 page | Check `createPageBreak()` is working |
| Currency not formatted | Verify formatRupiah() imported in generator |
| Terbilang numbers wrong | Check terbilang() helper function |

---

## Performance Notes

### Generation Time Estimates
- **Surat Tugas**: ~300-400ms
- **SPPD**: ~400-600ms (2 pages)
- **Rincian Biaya**: ~350-500ms

### File Size Estimates
- **Surat Tugas**: 50-80 KB
- **SPPD**: 100-150 KB
- **Rincian Biaya**: 60-100 KB

---

## Database Integration

### Existing Table: generated_documents

```sql
INSERT INTO generated_documents (
  name,
  category,
  subcategory,
  generated_filename,
  file_path,
  created_at
) VALUES (
  'SURAT_TUGAS',
  'perjalanan-dinas',
  'surat-tugas',
  'Surat_Tugas_ST-DPK-2026-001.docx',
  '/path/to/file.docx',
  '2026-02-01T10:30:00Z'
);
```

### Query Recent Perjalanan Dinas Documents

```javascript
const db = require('../database');

const perdinDocs = db.prepare(`
  SELECT * FROM generated_documents 
  WHERE category = 'perjalanan-dinas'
  ORDER BY created_at DESC
  LIMIT 10
`).all();

console.log('Recent perjalanan dinas documents:', perdinDocs);
```

---

## API Integration Verified

✅ **Import Added** (Line 14 of dokumen.js)  
✅ **Registration Added** (Lines 237-240 of dokumen.js)  
✅ **IPC Channels Active**:
- `dokumen:generate / SURAT_TUGAS`
- `dokumen:generate / SPPD`
- `dokumen:generate / RINCIAN_BIAYA_PERDIN`  

✅ **All tests passing**  
✅ **No breaking changes**

---

**Status**: ✅ **INTEGRATION COMPLETE & VERIFIED**

All FASE 10E perjalanan dinas generators are ready for use. System now supports 17 total document generators across 4 categories (Procurement Tiers 1-3 + Travel Documents).
