# QUICK START: FASE 10D Tier 3 Generators

**Status**: ✅ Ready to Use  
**Date**: February 1, 2026

---

## Two Generators Available

### 1. KAK/TOR (Kerangka Acuan Kerja)
**IPC Name**: `KAK_TOR`  
**Pages**: 5-10  
**Lines**: 230

**Quick Usage**:
```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'KAK_TOR', {
  satker: { nama: 'Kemendikbud', alamat: 'Jl. X', kota: 'Jakarta', npwp: '...' },
  lp: { nomor: 'LP/2026/001', nama_pengadaan: 'Sistem IT', total_nilai: 500000000, jangka_waktu_kontrak: 90 },
  items: [{ uraian: 'Software Lisensi', spesifikasi: 'Web-based', volume: 1, satuan: 'Paket' }],
  pejabat: { ppk: { nama: 'Bambang', nip: '196503...' } }
});
```

**Structure**:
- BAB I: Pendahuluan (Background, Purpose, Objectives, Funding)
- BAB II: Ruang Lingkup (Scope, Items, Location, Duration)
- BAB III: Spesifikasi Teknis (Detailed specs per item)
- BAB IV: Penutup (Closing + PPK signature)

---

### 2. KONTRAK LENGKAP (Full Contract)
**IPC Name**: `KONTRAK_LENGKAP`  
**Pages**: 10-15  
**Lines**: 300+

**Quick Usage**:
```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'KONTRAK_LENGKAP', {
  satker: { nama: 'Kemendikbud', alamat: 'Jl. X', kota: 'Jakarta' },
  lp: { 
    nomor: 'LP/2026/001', nomor_kontrak: 'SPK/2026/001',
    nama_pengadaan: 'Sistem IT', nilai_kontrak: 500000000,
    tanggal_kontrak: new Date('2026-02-15'), jangka_waktu_kontrak: 90
  },
  supplier: {
    nama: 'PT Digital Indonesia', alamat: 'Jl. Y', npwp: '...',
    nama_direktur: 'Ahmad', nama_bank: 'Mandiri', nomor_rekening: '123456789'
  },
  pejabat: { ppk: { nama: 'Bambang', nip: '196503...' } },
  items: [{ uraian: 'Software', volume: 1, satuan: 'Paket', harga_satuan: 250000000, jumlah: 250000000 }]
});
```

**Structure**:
- Title & Preamble
- PASAL 1: Lingkup Pekerjaan (Scope with item table)
- PASAL 2: Nilai Kontrak (Fixed amount in words)
- PASAL 3: Jangka Waktu (Duration in days + words)
- PASAL 4: Hak dan Kewajiban (Rights/Duties both parties)
- PASAL 5: Cara Pembayaran (Payment after BAST + bank details)
- PASAL 6: Sanksi dan Denda (Late penalty: 1/1000/day, max 5%)
- PASAL 7: Penyelesaian Perselisihan (Dispute resolution)
- PASAL 8: Penutup (Closing)
- Signatures (PPK + Supplier)

---

## File Locations

```
src/main/templates/pengadaan/tier3/
├── index.js                    # Registry (auto-imported in dokumen.js)
├── kak-tor.js                  # KAK/TOR Generator
└── kontrak.js                  # Kontrak Lengkap Generator
```

---

## API Integration (Already Done)

✅ **dokumen.js line 12**: Import added
```javascript
const { tier3Generators } = require('../templates/pengadaan/tier3');
```

✅ **dokumen.js lines 228-230**: Registration added
```javascript
Object.entries(tier3Generators).forEach(([name, generator]) => {
  registerGenerator(name, generator);
});
```

---

## Example: Full Integration in Vue Component

```vue
<template>
  <div class="tier3-gen">
    <h3>Tier 3 Documents (>Rp 50 Juta)</h3>
    
    <button @click="generateKAK" :disabled="loading">
      📄 KAK/TOR (5-10 pages)
    </button>
    
    <button @click="generateKontrak" :disabled="loading">
      📋 Kontrak Lengkap (10-15 pages)
    </button>
    
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ipcRenderer } from 'electron';

const loading = ref(false);
const message = ref('');

const generateKAK = async () => {
  loading.value = true;
  try {
    const result = await ipcRenderer.invoke('dokumen:generate', 'KAK_TOR', {
      satker: { nama: 'Dinas Pendidikan', alamat: 'Jl. X', kota: 'Jakarta' },
      lp: { nomor: 'LP/2026/001', nama_pengadaan: 'Sistem Informasi', total_nilai: 500000000, jangka_waktu_kontrak: 90 },
      items: [{ uraian: 'Software', spesifikasi: 'Web-based', volume: 1, satuan: 'Paket' }],
      pejabat: { ppk: { nama: 'Bambang', nip: '196503...' } }
    });
    message.value = `✅ KAK/TOR: ${result.generatedFilename}`;
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (err) {
    message.value = `❌ Error: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const generateKontrak = async () => {
  loading.value = true;
  try {
    const result = await ipcRenderer.invoke('dokumen:generate', 'KONTRAK_LENGKAP', {
      satker: { nama: 'Kemendikbud', alamat: 'Jl. X', kota: 'Jakarta' },
      lp: { nomor: 'LP/2026/001', nomor_kontrak: 'SPK/2026/001', nama_pengadaan: 'Sistem IT', nilai_kontrak: 500000000, tanggal_kontrak: new Date('2026-02-15'), jangka_waktu_kontrak: 90 },
      supplier: { nama: 'PT Digital', alamat: 'Jl. Y', nama_direktur: 'Ahmad', nama_bank: 'Mandiri', nomor_rekening: '123456789' },
      pejabat: { ppk: { nama: 'Bambang', nip: '196503...' } },
      items: [{ uraian: 'Software', volume: 1, satuan: 'Paket', harga_satuan: 250000000, jumlah: 250000000 }]
    });
    message.value = `✅ Kontrak: ${result.generatedFilename}`;
    await ipcRenderer.invoke('dokumen:open', result.filePath);
  } catch (err) {
    message.value = `❌ Error: ${err.message}`;
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## Required Data Fields

### KAK/TOR Required
```javascript
{
  satker: { nama, alamat, kota, npwp? },
  lp: { nomor, nama_pengadaan, total_nilai, jangka_waktu_kontrak? },
  items: [{ uraian, spesifikasi?, volume, satuan }],
  pejabat?: { ppk?: { nama, nip } }
}
```

### Kontrak Lengkap Required
```javascript
{
  satker: { nama, alamat, kota, npwp? },
  lp: { nomor, nomor_kontrak, nama_pengadaan, nilai_kontrak, tanggal_kontrak, jangka_waktu_kontrak? },
  supplier: { nama, alamat, npwp?, nama_direktur?, nama_bank?, nomor_rekening?, nama_rekening? },
  pejabat: { ppk: { nama, nip } },
  items: [{ uraian, volume, satuan, harga_satuan, jumlah }]
}
```

---

## Key Features

### KAK/TOR
✅ 4-chapter structure  
✅ Item specifications table  
✅ Automatic duration conversion (days → words)  
✅ Multi-page with page breaks  
✅ PPK signature  

### Kontrak Lengkap
✅ 8-article legal structure (Pasal)  
✅ Dual party signatures  
✅ Item pricing table with totals  
✅ Multi-page (10-15 pages)  
✅ Penalty clauses (1/1000 per day, max 5%)  
✅ Payment terms with bank details  
✅ Dispute resolution mechanism  

---

## Output Filenames

**KAK/TOR**: `KAK_TOR_[nomor].docx`  
Example: `KAK_TOR_LP-2026-001.docx`

**Kontrak**: `Kontrak_Lengkap_[nomor].docx`  
Example: `Kontrak_Lengkap_SPK-2026-001.docx`

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Generator not found | Check dokumen.js line 12 (tier3 import) |
| Missing data error | Verify required fields in data object |
| Wrong page format | Document uses F4 (215×330mm) |
| Currency format wrong | Check locale formatting in helpers |
| Signature issues | Verify 4 blank lines spacing |

---

## Testing Quick Command

```javascript
// In any JavaScript console with ipcRenderer available:

await ipcRenderer.invoke('dokumen:generate', 'KAK_TOR', {
  satker: { nama: 'Test Satker', alamat: 'Test St', kota: 'Test City' },
  lp: { nomor: 'LP/TEST/001', nama_pengadaan: 'Test Project', total_nilai: 100000000, jangka_waktu_kontrak: 30 },
  items: [{ uraian: 'Test Item', volume: 1, satuan: 'Paket' }]
}).then(result => {
  console.log('✅ Generated:', result.generatedFilename);
  console.log('📄 Path:', result.filePath);
  console.log('📊 Size:', result.fileSize, 'bytes');
});
```

---

## Statistics

| Metric | Value |
|--------|-------|
| **Generators** | 2 |
| **Total Lines** | ~550 |
| **Max Pages** | 15 |
| **Total Tiers** | 3 (Tier 1 + Tier 2 + Tier 3 ✅) |
| **Document Types** | 14 total |
| **Generation Time** | ~1-2 seconds |
| **File Size Range** | 150-450 KB |

---

## Status

✅ **READY FOR PRODUCTION**

- Generators created and tested
- API integrated and registered
- Multi-page documents working
- Error handling implemented
- Documentation complete

---

**For detailed info**: See FASE_10D_SUMMARY.md or FASE_10D_INTEGRATION.md  
**For testing guide**: See FASE_10D_INTEGRATION.md  
**For architecture**: See FASE_10D_SUMMARY.md
