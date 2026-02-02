# FASE 10D: DOKUMEN PENGADAAN TIER 3 (>Rp 50 Juta)

**Status**: ✅ COMPLETED  
**Date**: February 1, 2026  
**Location**: `src/main/templates/pengadaan/tier3/`

---

## Overview

FASE 10D mengimplementasikan sistem generator dokumen untuk pengadaan Tier 3 dengan nilai >Rp 50 juta. Tier 3 merupakan kategori dengan nilai pengadaan tertinggi yang memerlukan dokumentasi paling formal, lengkap, dan detail sesuai standar pemerintah untuk pengadaan bernilai tinggi.

---

## Architecture Decisions

### Why Multi-Page Documents?
Tier 3 contracts require comprehensive documentation with multiple sections:
- **Separate chapters** for clarity and organization
- **Page breaks** between major sections
- **Formal structure** with numbered articles/pasal
- **Detailed explanations** for each section
- **Professional formatting** for government standards

### Generator Count Strategy
Unlike Tier 2 (10 generators), Tier 3 starts with **2 core generators**:
1. **KAK/TOR** - Foundation document (replaces Nota Dinas for Tier 3)
2. **Kontrak Lengkap** - Formal contract with all standard clauses

**Rationale**: Tier 3 documents are complex and multi-page. Starting with the two most critical generators allows for:
- Thorough implementation and testing
- Room for future expansion (SPPBJ, SPP, etc.)
- Extensible architecture for additional generators

---

## File Structure

```
src/main/templates/pengadaan/tier3/
├── index.js                     # Generator registry (18 lines)
├── kak-tor.js                   # KAK/TOR Generator (230 lines)
└── kontrak.js                   # Kontrak Lengkap (300+ lines)
```

**Total New Code**: ~550 lines

---

## Generator 1: KAK/TOR (Kerangka Acuan Kerja)

**File**: `kak-tor.js`  
**Class**: `KAKTORGenerator`  
**IPC Name**: `KAK_TOR`  
**Pages**: 5-10 halaman (multi-page)

### Purpose
Official framework and reference document that outlines:
- Project background and justification
- Objectives and targets
- Scope of work with detailed specifications
- Funding sources and budget allocation
- Work timeline and deliverables

### Required Data

```javascript
{
  satker: {
    nama: string,
    alamat: string,
    kota: string,
    npwp?: string
  },
  lp: {
    nomor: string,
    nama_pengadaan: string,
    total_nilai: number,
    kode_akun?: string,
    lokasi_pelaksanaan?: string,
    jangka_waktu_kontrak?: number,
    tanggal_kontrak?: Date
  },
  items: [{
    uraian: string,
    spesifikasi?: string,
    spesifikasi_detail?: string,
    standar?: string,
    volume: number,
    satuan: string
  }],
  kak?: {
    latar_belakang?: string,
    maksud?: string,
    tujuan?: string,
    sasaran?: string
  },
  pejabat?: {
    ppk?: {
      nama: string,
      nip: string
    }
  }
}
```

### Content Structure

**Halaman 1: Title Page**
- Document title (KERANGKA ACUAN KERJA)
- Project name (in uppercase)
- Organization name
- Fiscal year

**Halaman 2+: Chapter I - Pendahuluan**
- 1.1 Latar Belakang (Background)
- 1.2 Maksud dan Tujuan (Purpose and Objectives)
- 1.3 Sasaran (Targets)
- 1.4 Sumber Pendanaan (Funding Source)

**Halaman: Chapter II - Ruang Lingkup**
- 2.1 Lingkup Pekerjaan (Item table with specs)
- 2.2 Lokasi Pekerjaan (Work Location)
- 2.3 Jangka Waktu (Timeline in days)

**Halaman: Chapter III - Spesifikasi Teknis**
- Per-item technical specifications
- Standards reference
- Detailed requirements

**Halaman: Chapter IV - Penutup**
- Closing statement
- Signature block (PPK only)

### Key Features
- ✅ Multi-page with page breaks between chapters
- ✅ Automatic table generation for items
- ✅ Dynamic content based on provided data
- ✅ Terbilang conversion for contract duration
- ✅ Formatted currency values
- ✅ Government letterhead (implied in context)
- ✅ Professional layout with chapter numbering

### Output Filename
```
KAK_TOR_[nomor].docx
```

### IPC Usage
```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'KAK_TOR', {
  satker: { nama: 'Kemendikbud', alamat: '...', kota: 'Jakarta' },
  lp: {
    nomor: 'LP/2026/001',
    nama_pengadaan: 'Pengadaan Sistem Informasi Manajemen',
    total_nilai: 500000000,
    kode_akun: '6.2.2.03.01',
    lokasi_pelaksanaan: 'Jakarta',
    jangka_waktu_kontrak: 90
  },
  items: [
    {
      uraian: 'Lisensi Software (12 bulan)',
      spesifikasi: 'ERP System Enterprise Edition',
      spesifikasi_detail: 'Support untuk 500 users, cloud-based, backup harian',
      standar: 'ISO 27001',
      volume: 1,
      satuan: 'Paket'
    }
  ],
  kak: {
    latar_belakang: 'Custom background text...',
    maksud: 'Custom purpose...',
    tujuan: 'Custom objective...',
    sasaran: 'Custom target...'
  },
  pejabat: {
    ppk: { nama: 'Bambang Sutrisno', nip: '19650315 198903 1 001' }
  }
});

if (result.success) {
  console.log('KAK/TOR generated:', result.filePath);
}
```

---

## Generator 2: Kontrak Lengkap (Full Contract)

**File**: `kontrak.js`  
**Class**: `KontrakLengkapGenerator`  
**IPC Name**: `KONTRAK_LENGKAP`  
**Pages**: 10-15 halaman (multi-page)

### Purpose
Formal, comprehensive contract agreement that serves as binding legal document between government (PPK) and supplier. Includes:
- Party identification with legal authority
- Detailed scope and deliverables
- Contract value and payment terms
- Timeline and milestones
- Rights, obligations, and responsibilities
- Penalties and remedies
- Dispute resolution mechanisms

### Required Data

```javascript
{
  satker: {
    nama: string,
    alamat: string,
    kota: string,
    npwp?: string
  },
  lp: {
    nomor: string,
    nomor_kontrak: string,
    nama_pengadaan: string,
    nilai_kontrak: number,
    total_nilai: number,
    tanggal_kontrak: Date,
    tanggal_mulai_kontrak?: Date,
    tanggal_selesai_kontrak?: Date,
    jangka_waktu_kontrak?: number
  },
  supplier: {
    nama: string,
    alamat: string,
    npwp?: string,
    nama_direktur?: string,
    jabatan_direktur?: string,
    nama_bank?: string,
    nomor_rekening?: string,
    nama_rekening?: string
  },
  pejabat: {
    ppk: {
      nama: string,
      nip: string
    }
  },
  items: [{
    uraian: string,
    volume: number,
    satuan: string,
    harga_satuan: number,
    jumlah: number,
    spesifikasi?: string
  }]
}
```

### Content Structure

**Halaman 1: Title Page**
- SURAT PERJANJIAN (Agreement Letter)
- Project name
- Contract number
- Party names (Government & Supplier)
- Fiscal year

**Halaman 2: Introduction**
- Document preamble
- PIHAK PERTAMA (First Party - Government/PPK)
  - Name, NIP, Position, Address
  - Authority statement
- PIHAK KEDUA (Second Party - Supplier)
  - Company name, Address, NPWP
  - Representative (Direktur)
  - Authority statement
- Opening agreement clause

**Halaman 3+: PASAL 1 - LINGKUP PEKERJAAN**
- Scope of work statement
- Detailed item table (6 columns):
  - No, Uraian, Volume, Satuan, Harga Satuan, Jumlah
- Total amount clearly highlighted

**Halaman: PASAL 2 - NILAI KONTRAK**
- Contract value in Rupiah
- Amount in words (terbilang)
- Fixed lump-sum clause (non-changeable)

**Halaman: PASAL 3 - JANGKA WAKTU PELAKSANAAN**
- Duration in days and words
- Start and end dates
- Calendar days clarification

**Halaman: PASAL 4 - HAK DAN KEWAJIBAN PARA PIHAK**
- Rights and obligations of Government (4 items)
- Rights and obligations of Supplier (4 items)
- Detailed sub-clauses for each

**Halaman: PASAL 5 - CARA PEMBAYARAN**
- Payment condition (after 100% completion)
- BAST requirement
- Bank transfer details
- Account information

**Halaman: PASAL 6 - SANKSI DAN DENDA KETERLAMBATAN**
- Late penalty: 1/1000 per day
- Maximum penalty: 5% of contract value
- Contract termination clause

**Halaman: PASAL 7 - PENYELESAIAN PERSELISIHAN**
- Dispute resolution mechanism
- Negotiation first
- Court jurisdiction (Pengadilan Negeri)

**Halaman: PASAL 8 - PENUTUP**
- Document finality statement
- 2 copies (official and recipient)
- Equal legal status clause

**Final Page: Signatures**
- Date and location
- Dual signature blocks (PPK & Supplier)

### Key Features
- ✅ Multi-page with page breaks between pasal
- ✅ Formal legal contract structure
- ✅ Comprehensive 8 pasal (standard government format)
- ✅ Automatic table generation for items
- ✅ Currency formatting (Rupiah with dots)
- ✅ Amount in words (terbilang)
- ✅ Terbilang for timeline duration
- ✅ Professional signature blocks
- ✅ Dual-party identification
- ✅ Sub-clause numbering (a, b, c, d)

### Output Filename
```
Kontrak_Lengkap_[nomor].docx
```

### IPC Usage
```javascript
const result = await ipcRenderer.invoke('dokumen:generate', 'KONTRAK_LENGKAP', {
  satker: {
    nama: 'Kementerian Pendidikan dan Kebudayaan',
    alamat: 'Jl. Menteng Raya No. 37, Jakarta Pusat',
    kota: 'Jakarta',
    npwp: '01.000.000.0-000.000'
  },
  lp: {
    nomor: 'LP/2026/001',
    nomor_kontrak: 'SPK/2026/001',
    nama_pengadaan: 'Sistem Informasi Manajemen Pendidikan',
    nilai_kontrak: 500000000,
    total_nilai: 500000000,
    tanggal_kontrak: new Date('2026-02-01'),
    tanggal_mulai_kontrak: new Date('2026-02-15'),
    tanggal_selesai_kontrak: new Date('2026-05-16'),
    jangka_waktu_kontrak: 90
  },
  supplier: {
    nama: 'PT Indonesia Digital Solutions',
    alamat: 'Jl. Sudirman No. 123, Jakarta Selatan',
    npwp: '01.234.567.8-123.000',
    nama_direktur: 'Bambang Hendra',
    jabatan_direktur: 'Presiden Direktur',
    nama_bank: 'Bank Mandiri',
    nomor_rekening: '0001234567890',
    nama_rekening: 'PT Indonesia Digital Solutions'
  },
  pejabat: {
    ppk: {
      nama: 'Dr. Bambang Sutrisno, S.E., M.M.',
      nip: '19650315 198903 1 001'
    }
  },
  items: [
    {
      uraian: 'Lisensi Software ERP (12 bulan) - 500 Users',
      volume: 1,
      satuan: 'Paket',
      harga_satuan: 250000000,
      jumlah: 250000000,
      spesifikasi: 'Enterprise Edition, cloud-based, backup harian'
    },
    {
      uraian: 'Implementasi & Training (3 bulan)',
      volume: 1,
      satuan: 'Layanan',
      harga_satuan: 200000000,
      jumlah: 200000000,
      spesifikasi: 'On-site training untuk 50 people, setup, testing'
    },
    {
      uraian: 'Maintenance & Support (12 bulan)',
      volume: 1,
      satuan: 'Layanan',
      harga_satuan: 50000000,
      jumlah: 50000000,
      spesifikasi: '24/7 support, hotline, bug fixes'
    }
  ]
});

if (result.success) {
  console.log('Kontrak generated:', result.filePath);
  // Output: Kontrak_Lengkap_SPK-2026-001.docx
}
```

---

## Registry: tier3/index.js

```javascript
const tier3Generators = {
  'KAK_TOR': new KAKTORGenerator(),
  'KONTRAK_LENGKAP': new KontrakLengkapGenerator(),
};
```

---

## API Integration

### Changes to dokumen.js

**Line 12**: Add import
```javascript
const { tier3Generators } = require('../templates/pengadaan/tier3');
```

**Lines 228-230**: Add registration in initializeDocumentAPI()
```javascript
// Register tier 3 generators
Object.entries(tier3Generators).forEach(([name, generator]) => {
  registerGenerator(name, generator);
});
```

### Available IPC Channels
```javascript
// Generate KAK/TOR
await ipcRenderer.invoke('dokumen:generate', 'KAK_TOR', kakData)

// Generate Kontrak Lengkap
await ipcRenderer.invoke('dokumen:generate', 'KONTRAK_LENGKAP', kontrakData)
```

---

## Generator Statistics

| Metric | Value |
|--------|-------|
| Total Generators (Tier 3) | 2 |
| Total Lines of Code | ~550 |
| Multi-page Documents | 2 |
| Page Breaks Used | 8+ |
| Pasal/Chapters in Kontrak | 8 |
| Pasal/Chapters in KAK | 4 |

---

## Total System Statistics (All Tiers)

| Tier | Generators | Documents | Total Lines |
|------|-----------|-----------|------------|
| Tier 1 | 2 | Nota Dinas, Kwitansi | ~200 |
| Tier 2 | 10 | Various (9 + BA Pemeriksaan) | ~1,100 |
| Tier 3 | 2 | KAK/TOR, Kontrak | ~550 |
| **Total** | **14** | **21 document types** | **~1,850** |

---

## Document Workflow: Tier 3 Procurement

```
Phase 1: Planning
├─ KAK/TOR (Kerangka Acuan Kerja)
│  └─ Foundation document with detailed specifications

Phase 2: Procurement Process
├─ Dokumen Pengadaan (future)
├─ Undangan/RFP (future)
└─ BA Evaluasi (future)

Phase 3: Contract
├─ KONTRAK LENGKAP ✅
│  └─ Formal binding agreement with all clauses

Phase 4: Execution
├─ SPMK (Surat Mulai Kerja)
├─ BA Pemeriksaan Kemajuan
└─ Laporan Berkala

Phase 5: Completion
├─ BAST (Berita Acara Serah Terima)
├─ Kwitansi
├─ SPP (Surat Permintaan Pembayaran)
└─ SPM (Surat Perintah Membayar)
```

---

## Multi-Page Implementation Details

### Page Breaks Strategy
**KAK/TOR**: 4 page breaks between chapters
- After Title Page → Chapter I
- After Chapter I → Chapter II
- After Chapter II → Chapter III
- After Chapter III → Chapter IV (closing)

**Kontrak**: 3+ page breaks between pasal
- After Title Page → Introduction
- After Pasal 1 & 2 → Pasal 3
- After Pasal 4 → Pasal 5
- After Pasal 6 → Pasal 7

### Content Distribution
- **Title Pages**: Professional formatting, centered text
- **Body Text**: 1.15 line spacing, justified alignment
- **Tables**: Maximum width (7200 DXA), proper column alignment
- **Numbering**: Auto-generated with indentation

### Spacing Management
- Header spacing: 240 DXA (between sections)
- Paragraph spacing: 120 DXA (after paragraphs)
- Spacer lines: 360 DXA per line (1 line = createSpacer(1))

---

## Validation & Error Handling

### KAK/TOR Validation
```
✓ satker required
✓ lp required
✓ items required (non-empty array)
△ kak optional (defaults provided)
△ pejabat optional (shows blank lines)
```

### Kontrak Lengkap Validation
```
✓ satker required
✓ lp required
✓ supplier required
✓ pejabat.ppk required
✓ items required (non-empty array)
```

---

## Testing Checklist

- [ ] KAK/TOR generates 5-10 page DOCX file
- [ ] Kontrak Lengkap generates 10-15 page DOCX file
- [ ] Page breaks appear correctly between sections
- [ ] Currency formatted as Rupiah (with dots)
- [ ] Amounts in words calculated correctly (terbilang)
- [ ] Timeline converted to words
- [ ] Table formatting correct and aligned
- [ ] Signatures positioned properly
- [ ] Document numbers in filenames
- [ ] All validation errors thrown with clear messages
- [ ] Optional fields handled gracefully
- [ ] Date formatting in Indonesian locale

---

## Future Enhancements (FASE 10E+)

Additional Tier 3 generators could include:
1. **SPPBJ** - Surat Penunjukan Pemenang (Winner Announcement)
2. **SPP** - Surat Permintaan Pembayaran (Payment Request)
3. **SPM** - Surat Perintah Membayar (Payment Order)
4. **SPMK** - Surat Perintah Mulai Kerja (Work Order)
5. **Dokumen Pengadaan** - Tender/RFP package
6. **BA Evaluasi** - Evaluation Minutes
7. **BA Pembukaan** - Bid Opening Minutes
8. **Addendum** - Contract amendments

---

## File Summary

### Created Files (2)
1. `tier3/kak-tor.js` - 230 lines
2. `tier3/kontrak.js` - 300+ lines

### Modified Files (2)
1. `tier3/index.js` - Registry (18 lines)
2. `dokumen.js` - Import + registration (3 lines added)

---

**Status**: ✅ **COMPLETE**

FASE 10D successfully implements high-value procurement documentation with KAK/TOR and comprehensive Contract generators. Both multi-page documents follow government standards with proper formatting, formal structure, and professional presentation.

Next phase (FASE 10E) can expand Tier 3 with additional document generators or focus on frontend integration across all tiers.
