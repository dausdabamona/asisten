# QUICK START: FASE 10E Perjalanan Dinas Generators

**Status**: ✅ Ready to Use  
**Date**: February 1, 2026

---

## Three Generators Available

### 1. SURAT TUGAS (Travel Order)
**IPC Name**: `SURAT_TUGAS`  
**Pages**: 1  
**Purpose**: Official travel order from KPA

```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'SURAT_TUGAS', {
  satker: { nama: 'Dinas X', alamat: 'Jl. Y', kota: 'Sorong' },
  st: {
    nomor: 'ST/2026/001',
    maksud_tujuan: 'Monitoring program',
    kota_tujuan: 'Jakarta',
    tanggal_berangkat: new Date('2026-02-15'),
    tanggal_kembali: new Date('2026-02-20'),
    lama_hari: 5,
    tanggal_dibuat: new Date('2026-02-01')
  },
  pelaksana: [
    { nama: 'Bambang', nip: '196503...', pangkat: 'Pembina', golongan: 'IV/a', jabatan: 'Kepala' }
  ],
  pejabat: { kpa: { nama: 'Rinto', nip: '196403...' } }
});
```

---

### 2. SPPD (Travel Permit)
**IPC Name**: `SPPD`  
**Pages**: 2 (front + back with transit approvals)  
**Purpose**: Official travel permit with multi-page signatures

```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'SPPD', {
  satker: { nama: 'Dinas X', alamat: 'Jl. Y', kota: 'Sorong' },
  st: {
    nomor: 'ST/2026/001',
    nomor_sppd: 'SPPD/2026/001',
    maksud_tujuan: 'Monitoring',
    kota_tujuan: 'Jakarta',
    tanggal_berangkat: new Date('2026-02-15'),
    tanggal_kembali: new Date('2026-02-20'),
    lama_hari: 5,
    moda_transport: 'Udara',
    kode_akun: '524111'
  },
  pelaksana: [{ nama: 'Bambang', nip: '196503...', golongan: 'IV/a' }],
  pejabat: { ppk: { nama: 'Rinto', nip: '196403...' } }
});
```

---

### 3. RINCIAN BIAYA (Cost Breakdown)
**IPC Name**: `RINCIAN_BIAYA_PERDIN`  
**Pages**: 1-2  
**Purpose**: Detailed cost breakdown per traveler

```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'RINCIAN_BIAYA_PERDIN', {
  satker: { nama: 'Dinas X', alamat: 'Jl. Y', kota: 'Sorong' },
  st: {
    nomor: 'ST/2026/001',
    kota_tujuan: 'Jakarta',
    tanggal_berangkat: new Date('2026-02-15'),
    tanggal_kembali: new Date('2026-02-20'),
    lama_hari: 5
  },
  pelaksana: [{ nama: 'Bambang', nip: '196503...', golongan: 'IV/a' }],
  biaya: [{
    uang_harian: 550000,      // 5 hari × Rp110k
    penginapan: 2000000,      // 4 malam × Rp500k
    transport: 5000000,
    transport_lokal: 1000000, // 5 hari × Rp200k
    representasi: 500000,     // 5 hari × Rp100k
    tarif_uang_harian: 110000,
    tarif_penginapan: 500000,
    tarif_transport_lokal: 200000,
    tarif_representasi: 100000
  }],
  pejabat: { ppk: { nama: 'Rinto', nip: '196403...' } }
});
```

---

## File Locations

```
src/main/templates/perjalanan-dinas/
├── index.js                    # Registry
├── surat-tugas.js              # Surat Tugas Generator
├── sppd.js                     # SPPD Generator
└── rincian-biaya.js            # Rincian Biaya Generator
```

---

## API Integration (Already Done)

✅ **dokumen.js line 14**: Import added
```javascript
const { perdinGenerators } = require('../templates/perjalanan-dinas');
```

✅ **dokumen.js lines 237-240**: Registration added
```javascript
Object.entries(perdinGenerators).forEach(([name, generator]) => {
  registerGenerator(name, generator);
});
```

---

## Required Data Fields

### SURAT_TUGAS Required
```javascript
{
  satker: { nama, alamat, kota },
  st: { nomor, maksud_tujuan, kota_tujuan, tanggal_berangkat, tanggal_kembali, lama_hari, tanggal_dibuat },
  pelaksana: [{ nama, nip, pangkat?, golongan?, jabatan? }],  // minimum 1
  pejabat: { kpa: { nama, nip } }
}
```

### SPPD Required
```javascript
{
  satker: { nama, alamat, kota },
  st: { nomor, nomor_sppd?, maksud_tujuan, kota_tujuan, tanggal_berangkat, tanggal_kembali, lama_hari, moda_transport?, kode_akun? },
  pelaksana: [{ nama, nip, golongan? }],  // will use first item
  pejabat: { ppk?: { nama, nip } OR kpa?: { nama, nip } }
}
```

### RINCIAN_BIAYA_PERDIN Required
```javascript
{
  satker: { nama, alamat, kota },
  st: { nomor, kota_tujuan, tanggal_berangkat, tanggal_kembali, lama_hari },
  pelaksana: [{ nama, nip, golongan? }],
  biaya?: [{
    uang_harian, penginapan, transport, transport_lokal, representasi?,
    tarif_uang_harian?, tarif_penginapan?, tarif_transport_lokal?, tarif_representasi?
  }],
  pejabat: { ppk?: { nama, nip } OR kpa?: { nama, nip } }
}
```

---

## Output Filenames

**SURAT_TUGAS**: `Surat_Tugas_[nomor].docx`  
Example: `Surat_Tugas_ST-2026-001.docx`

**SPPD**: `SPPD_[nomor]_[nama_pelaksana].docx`  
Example: `SPPD_SPPD-2026-001_Bambang.docx`

**RINCIAN_BIAYA_PERDIN**: `Rincian_Biaya_[nomor].docx`  
Example: `Rincian_Biaya_ST-2026-001.docx`

---

## Key Features

### SURAT_TUGAS
✅ Tabel pelaksana otomatis  
✅ Terbilang hari  
✅ Flexible dasar hukum  
✅ 1 halaman  

### SPPD
✅ 2 halaman (depan & belakang)  
✅ Page break otomatis  
✅ 3 tempat pengesahan (transit)  
✅ Tingkat biaya otomatis  

### RINCIAN_BIAYA_PERDIN
✅ Perhitungan otomatis  
✅ Rupiah formatting  
✅ Terbilang jumlah  
✅ Multi-komponen biaya  

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Generator not found | Verify dokumen.js line 14 import |
| Missing data error | Check required fields above |
| Wrong format | Dates should be Date objects |
| Currency wrong | Use numbers, formatRupiah() handles display |
| Page break not showing | Word viewer needs full Word, not preview |

---

## Testing Quick Command

```javascript
// Test in console with ipcRenderer available:

await ipcRenderer.invoke('dokumen:generate', 'SURAT_TUGAS', {
  satker: { nama: 'Test Dinas', alamat: 'Jl. Test', kota: 'Test City' },
  st: { 
    nomor: 'ST/TEST/001', 
    maksud_tujuan: 'Test', 
    kota_tujuan: 'Test', 
    tanggal_berangkat: new Date(), 
    tanggal_kembali: new Date(), 
    lama_hari: 3,
    tanggal_dibuat: new Date()
  },
  pelaksana: [{ nama: 'Test Person', nip: '19900101 000000 1 001' }],
  pejabat: { kpa: { nama: 'Test KPA', nip: '19600101 000000 1 001' } }
}).then(r => console.log('✅ Generated:', r.generatedFilename));
```

---

## Statistics

| Metric | Value |
|--------|-------|
| **Generators** | 3 |
| **Total Lines** | 587 |
| **Total Pages** | 4 (1 + 2 + 1) |
| **Total Tiers** | 4 (Tier1, Tier2, Tier3, Perjalanan Dinas) |
| **Document Types** | 17 total across all categories |

---

## Status

✅ **READY FOR PRODUCTION**

- Generators created and tested
- API integrated and registered
- Multi-page documents working
- Error handling implemented
- Integration complete

---

**For detailed info**: See FASE_10E_SUMMARY.md or FASE_10E_INTEGRATION.md
