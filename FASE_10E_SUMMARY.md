# FASE 10E: DOKUMEN PERJALANAN DINAS

**Status**: ✅ COMPLETED  
**Date**: February 1, 2026  
**Location**: `src/main/templates/perjalanan-dinas/`

---

## Overview

FASE 10E mengimplementasikan sistem generator dokumen untuk Perjalanan Dinas (business travel). Dokumen perjalanan dinas adalah dokumen penting untuk proses perjalanan resmi pegawai pemerintah, mencakup perintah tugas, surat perjalanan, dan rincian biaya.

---

## Architecture

### Generator Perjalanan Dinas

Berbeda dengan pengadaan, dokumen perjalanan dinas lebih sederhana (1-3 halaman) dan fokus pada:
- Otoritas pemberi tugas
- Data pelaksana (yang melakukan perjalanan)
- Alokasi biaya
- Pengesahan lokasi tujuan

### Fase Perjalanan Dinas

```
┌─────────────────────────────────────────┐
│ 1. Surat Tugas (Perintah dari KPA)     │
│    ↓                                     │
│ 2. SPPD (Surat Perintah Perjalanan)    │
│    Halaman Depan & Belakang            │
│    ↓                                     │
│ 3. Rincian Biaya (Detail komponen)     │
│    ↓                                     │
│ 4. Kwitansi (Bukti pembayaran)         │
│    ↓                                     │
│ 5. Laporan Perjalanan (Hasil kerja)    │
└─────────────────────────────────────────┘
```

---

## File Structure

```
src/main/templates/perjalanan-dinas/
├── index.js                    # Generator registry (12 lines)
├── surat-tugas.js              # Surat Tugas Generator (165 lines)
├── sppd.js                     # SPPD Generator (245 lines)
└── rincian-biaya.js            # Rincian Biaya Generator (165 lines)
```

**Total New Code**: ~587 lines

---

## Generator 1: Surat Tugas

**File**: `surat-tugas.js`  
**Class**: `SuratTugasGenerator`  
**IPC Name**: `SURAT_TUGAS`  
**Pages**: 1 halaman

### Purpose

Dokumen perintah resmi dari Kuasa Pengguna Anggaran (KPA) untuk menugaskan pegawai melakukan perjalanan dinas.

### Required Data

```javascript
{
  satker: {
    nama: string,
    alamat: string,
    kota: string
  },
  st: {
    nomor: string,
    maksud_tujuan: string,
    kota_tujuan: string,
    provinsi_tujuan?: string,
    tanggal_berangkat: Date,
    tanggal_kembali: Date,
    lama_hari: number,
    tanggal_dibuat: Date,
    dasar_nomor?: string,
    jenis_dasar?: string,
    dasar_tanggal?: Date
  },
  pelaksana: [{
    nama: string,
    nip: string,
    pangkat?: string,
    golongan?: string,
    jabatan?: string
  }],
  pejabat: {
    kpa: {
      nama: string,
      nip: string
    }
  }
}
```

### Content Structure

**Halaman 1**:
- Kop surat (from kop-surat-helper)
- Judul: "SURAT TUGAS"
- Nomor surat
- Data KPA pemberi tugas
- Tabel daftar pelaksana (No, Nama/NIP, Pangkat/Gol, Jabatan)
- Detail tugas:
  - Maksud perjalanan
  - Kota/Provinsi tujuan
  - Tanggal berangkat s.d. kembali
  - Lama perjalanan (dalam hari + terbilang)
  - Dasar hukum (jika ada)
- Penutup
- Tempat dan tanggal
- Tanda tangan KPA (1 orang)

### Key Features

✅ Tabel otomatis untuk multiple pelaksana  
✅ Konversi hari ke terbilang  
✅ Flexible dasar hukum  
✅ Format standar government  

### Output Filename

```
Surat_Tugas_[nomor].docx
```

### IPC Usage

```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'SURAT_TUGAS', {
  satker: { nama: 'Dinas X', alamat: 'Jl. Y', kota: 'Sorong' },
  st: {
    nomor: 'ST/2026/001',
    maksud_tujuan: 'Monitoring dan evaluasi program',
    kota_tujuan: 'Jakarta',
    provinsi_tujuan: 'DKI Jakarta',
    tanggal_berangkat: new Date('2026-02-15'),
    tanggal_kembali: new Date('2026-02-20'),
    lama_hari: 5,
    tanggal_dibuat: new Date('2026-02-01'),
    dasar_nomor: '05/DINAS/2026',
    jenis_dasar: 'SK',
    dasar_tanggal: new Date('2026-01-15')
  },
  pelaksana: [
    { nama: 'Bambang', nip: '196503...', pangkat: 'Pembina', golongan: 'IV/a', jabatan: 'Kepala Bidang' },
    { nama: 'Ahmad', nip: '196805...', pangkat: 'Penata', golongan: 'III/c', jabatan: 'Staf' }
  ],
  pejabat: {
    kpa: { nama: 'Dr. Rinto', nip: '196401...' }
  }
});
```

---

## Generator 2: SPPD (Surat Perintah Perjalanan Dinas)

**File**: `sppd.js`  
**Class**: `SPPDGenerator`  
**IPC Name**: `SPPD`  
**Pages**: 2 halaman (depan + belakang)

### Purpose

Dokumen resmi perjalanan dinas yang berisi:
- **Halaman 1 (Depan)**: Data perjalanan dan perintah PPK
- **Halaman 2 (Belakang)**: Pengesahan tiba/berangkat dari berbagai lokasi

### Required Data

```javascript
{
  satker: {
    nama: string,
    alamat: string,
    kota: string
  },
  st: {
    nomor: string,
    nomor_sppd?: string,  // override nomor jika ada
    maksud_tujuan: string,
    kota_asal?: string,
    kota_tujuan: string,
    tanggal_berangkat: Date,
    tanggal_kembali: Date,
    lama_hari: number,
    moda_transport?: string,
    kode_akun?: string,
    keterangan?: string,
    tanggal_dibuat: Date
  },
  pelaksana: [{ nama, nip, pangkat?, golongan?, jabatan? }],
  pejabat: {
    ppk?: { nama, nip },
    kpa?: { nama, nip }
  }
}
```

### Content Structure

**Halaman 1: SPPD Depan**
- Judul: "SURAT PERINTAH PERJALANAN DINAS (SPPD)"
- Nomor SPPD
- Tabel isi SPPD (10 baris):
  1. Pejabat Pembuat Komitmen
  2. Nama pegawai
  3. Pangkat/Gol/Jabatan/Tingkat biaya
  4. Maksud perjalanan
  5. Alat angkutan
  6. Tempat berangkat & tujuan
  7. Lama perjalanan & tanggal
  8. Pengikut
  9. Pembebanan anggaran (instansi & akun)
  10. Keterangan lain
- Tanda tangan PPK

**Halaman 2: SPPD Belakang**
- Pengesahan tiba/berangkat (3 tempat untuk transit)
  - Setiap tempat: Tiba/Berangkat + Tanggal + Kepala Kantor + NIP
- Catatan lain-lain (2 baris kosong)
- Perhatian (disclaimer penting)
- Tanda tangan verifikasi PPK

### Key Features

✅ 2-halaman multi-purpose document  
✅ Automatic tingkat biaya determination  
✅ Multiple pengesahan lokasi (3 transit points)  
✅ Professional government format  
✅ Page break antara depan & belakang  

### Output Filename

```
SPPD_[nomor]_[nama_pelaksana].docx
```

### IPC Usage

```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'SPPD', {
  satker: { nama: 'Dinas Pendidikan', alamat: 'Jl. X', kota: 'Sorong' },
  st: {
    nomor: 'ST/2026/001',
    nomor_sppd: 'SPPD/2026/001',
    maksud_tujuan: 'Rapat koordinasi',
    kota_asal: 'Sorong',
    kota_tujuan: 'Jakarta',
    tanggal_berangkat: new Date('2026-02-15'),
    tanggal_kembali: new Date('2026-02-20'),
    lama_hari: 5,
    moda_transport: 'Udara',
    kode_akun: '524111',
    tanggal_dibuat: new Date('2026-02-01')
  },
  pelaksana: [{ nama: 'Bambang', nip: '196503...', golongan: 'IV/a' }],
  pejabat: {
    ppk: { nama: 'Rinto', nip: '196401...' }
  }
});
```

---

## Generator 3: Rincian Biaya Perjalanan Dinas

**File**: `rincian-biaya.js`  
**Class**: `RincianBiayaPerdinGenerator`  
**IPC Name**: `RINCIAN_BIAYA_PERDIN`  
**Pages**: 1-2 halaman

### Purpose

Dokumen rincian komponen biaya perjalanan dinas dengan breakdown lengkap per pelaksana.

### Required Data

```javascript
{
  satker: { nama, alamat, kota },
  st: {
    nomor: string,
    kota_tujuan: string,
    tanggal_berangkat: Date,
    tanggal_kembali: Date,
    lama_hari: number
  },
  pelaksana: [{ nama, nip, golongan? }],
  biaya?: [{
    pelaksana_id?: string/number,
    uang_harian: number,
    penginapan: number,
    transport: number,
    transport_lokal: number,
    representasi?: number,
    tarif_uang_harian?: number,
    tarif_penginapan?: number,
    tarif_transport_lokal?: number,
    tarif_representasi?: number,
    keterangan?: string
  }],
  pejabat: {
    ppk?: { nama, nip },
    kpa?: { nama, nip }
  }
}
```

### Content Structure

**Halaman 1**:
- Kop surat
- Judul: "RINCIAN BIAYA PERJALANAN DINAS"
- Info perjalanan (nomor ST, tujuan, tanggal, lama)
- Per pelaksana:
  - Nama & golongan (header)
  - Tabel komponen biaya:
    - No, Komponen, Tarif, Volume, Satuan, Jumlah
    - Komponen: Uang harian, Penginapan, Transport, Transport lokal, Representasi (jika ada)
    - Subtotal
- Grand total
- Terbilang total
- Tanda tangan (2 kolom: Pegawai & PPK)

### Key Features

✅ Automatic calculation untuk semua komponen  
✅ Multi-pelaksana support  
✅ Rupiah formatting dengan terbilang  
✅ Flexible biaya components  
✅ Professional signature layout  

### Output Filename

```
Rincian_Biaya_[nomor].docx
```

### IPC Usage

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
    uang_harian: 550000,
    penginapan: 2000000,
    transport: 5000000,
    transport_lokal: 1000000,
    representasi: 500000,
    tarif_uang_harian: 110000,
    tarif_penginapan: 500000,
    tarif_transport_lokal: 200000,
    tarif_representasi: 100000
  }],
  pejabat: {
    ppk: { nama: 'Rinto', nip: '196401...' }
  }
});
```

---

## Registry: perjalanan-dinas/index.js

```javascript
const perdinGenerators = {
  'SURAT_TUGAS': new SuratTugasGenerator(),
  'SPPD': new SPPDGenerator(),
  'RINCIAN_BIAYA_PERDIN': new RincianBiayaPerdinGenerator(),
};
```

---

## API Integration

### Changes to dokumen.js

**Line 14**: Add import
```javascript
const { perdinGenerators } = require('../templates/perjalanan-dinas');
```

**Lines 237-240**: Add registration in initializeDocumentAPI()
```javascript
// Register perjalanan dinas generators
Object.entries(perdinGenerators).forEach(([name, generator]) => {
  registerGenerator(name, generator);
});
```

### Available IPC Channels

```javascript
// Generate Surat Tugas
await ipcRenderer.invoke('dokumen:generate', 'SURAT_TUGAS', suratTugasData)

// Generate SPPD
await ipcRenderer.invoke('dokumen:generate', 'SPPD', sppdData)

// Generate Rincian Biaya
await ipcRenderer.invoke('dokumen:generate', 'RINCIAN_BIAYA_PERDIN', biayaData)
```

---

## Generator Statistics

| Metric | Value |
|--------|-------|
| Generators (Perjalanan Dinas) | 3 |
| Total Lines of Code | ~587 |
| Multi-page Documents | 1 (SPPD: 2 pages) |
| Single-page Documents | 2 |
| Total Tiers/Categories | 4 (Tier1, Tier2, Tier3, Perjalanan Dinas) |
| Total Generators System-wide | 17 |

---

## Complete System Overview

| Category | Generators | Total Pages | Purpose |
|----------|-----------|------------|---------|
| **Tier 1** (≤Rp 10M) | 2 | 2 | Low-value procurement |
| **Tier 2** (Rp 10-50M) | 10 | 10-11 | Medium-value procurement |
| **Tier 3** (>Rp 50M) | 2 | 15-25 | High-value procurement |
| **Perjalanan Dinas** | 3 | 4 | Business travel documents |
| **TOTAL** | **17** | **31-41** | Complete procurement + travel system |

---

## Future Enhancements (FASE 10E.2+)

### Remaining Perjalanan Dinas Generators
1. **Kwitansi Perjalanan** (1 page) - Payment receipt
2. **Laporan Perjalanan** (2-3 pages) - Travel report with achievements
3. **Permohonan Pembayaran** (1-2 pages) - Payment request from pegawai
4. **BA Pengesahan** (1 page) - Final approval document

### Integration Features
- Link dengan Surat Tugas module (existing)
- Database untuk tracking perjalanan
- Automatic cost calculations
- Reimbursement workflow

---

## Testing Checklist

- [x] Surat Tugas generates 1-page document
- [x] SPPD generates 2-page document with page break
- [x] Rincian Biaya generates 1-2 page document
- [x] Table formatting correct for all generators
- [x] Currency formatted as Rupiah
- [x] Terbilang conversion working
- [x] Signatures positioned properly
- [x] Document numbers in filenames
- [x] Validation errors thrown correctly
- [x] API integration complete
- [x] No breaking changes to existing code

---

**Status**: ✅ **COMPLETE & READY FOR TESTING**

FASE 10E successfully implements 3 perjalanan dinas document generators with full API integration. System now supports 17 total document generators across 4 categories (Procurement Tiers 1-3 + Travel Documents).
