# FASE 10H: COMPLETE PROCUREMENT WORKFLOW ARCHITECTURE

## 📊 PROCUREMENT FLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMINTAAN TIER 1/2/3                        │
│                  (Budget Allocation - Pagu)                     │
│               Status: Draft → Submitted → Approved              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LEMBAR PERMINTAAN (LP)                        │
│              Pilih Barang/Jasa yang dibutuhkan                  │
│        Status: Draft → Submitted → Approved → Terbuka Proses   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROSES PENGADAAN (PROCUREMENT)                 │
│           (Tender, Negosiasi, Pemilihan Penyedia)              │
│              Status: Proses Penyedia → Kontrak                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  KONTRAK & PO (Purchase Order)                  │
│                   Status: Draf → Ditandatangani                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              KUITANSI UANG MUKA (Advance Payment)               │
│          Bayar DP (misalnya 30% dari total harga)              │
│              Status: Belum Bayar → Sudah Bayar                 │
│         Dokumen: Invoice + Kwitansi + Bukti Transfer           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 PERTANGGUNGJAWABAN PEMBELIAN                    │
│              Upload Nota Belanja & Bukti Penerimaan             │
│          Status: Menunggu → Diverifikasi → Diterima            │
│    Dokumen: Nota, Bukti Terima, Foto Barang, DAFTAR BELANJA   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            PERHITUNGAN KURANG LEBIH & PENGEMBALIAN              │
│        (Over/Under Invoice Calculation & Reconciliation)        │
│         Status: Belum Proses → Dalam Proses → Selesai          │
│    Kalkulasi: Total Nota vs Total PO → Kurang/Lebih            │
│    - Jika Lebih: Harus Kembalikan ke Vendor                    │
│    - Jika Kurang: Vendor hrs Isi Kekurangan                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│     PEMBAYARAN SISA / PENYELESAIAN PEMBAYARAN (Final Payment)   │
│        Bayar Sisa (70% - Jumlah Nota yang Diterima)            │
│              Status: Belum Bayar → Sudah Bayar                 │
│         Dokumen: Invoice Sisa + Bukti Transfer + SPBY          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            SPBY (Surat Pertanggungjawaban Belanja)              │
│              Final Accountability Document                      │
│                Status: Draft → Ditandatangani                  │
│         Dokumen: SPBY + Lampiran (All receipts & proofs)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ✅ PROCUREMENT COMPLETE & ARCHIVED
```

---

## 💰 BUDGET TRACKING MODEL

### Current State: Pagu (Budget Allocation)
```javascript
{
  permintaan_id: 'req-1769948581440',
  item_name: 'Pemeliharaan Jaringan Air',
  pagu: 21600000,              // Budget allocation
  sisa_pagu: 21600000,         // Remaining budget (initially = pagu)
  status: 'approved',
  created_at: '2026-02-01'
}
```

### After LP Submitted
```javascript
{
  permintaan_id: 'req-1769948581440',
  pagu: 21600000,
  sisa_pagu: 21600000,         // No change yet
  
  lp_id: 'LP-001-2026',
  lp_jumlah: 20000000,         // LP total amount
  status: 'lp_submitted'
}
```

### After LP Approved
```javascript
{
  permintaan_id: 'req-1769948581440',
  pagu: 21600000,
  sisa_pagu: 1600000,          // Pagu - LP amount
  
  lp_id: 'LP-001-2026',
  lp_jumlah: 20000000,
  lp_terserap: 20000000,       // Now absorbed into budget
  status: 'lp_approved'
}
```

### After Uang Muka (Advance Payment)
```javascript
{
  pagu: 21600000,
  sisa_pagu: 1600000,          // Still same
  
  lp_jumlah: 20000000,
  lp_terserap: 20000000,
  
  uang_muka_id: 'UM-001-2026',
  uang_muka_persen: 30,        // 30% DP
  uang_muka_jumlah: 6000000,   // 30% x 20M
  uang_muka_dibayar: true,
  uang_muka_tanggal: '2026-02-05',
  status: 'uang_muka_dibayar'
}
```

### After Pertanggungjawaban (Receipt & Invoice Matching)
```javascript
{
  pagu: 21600000,
  sisa_pagu: 1600000,
  
  lp_jumlah: 20000000,
  lp_terserap: 20000000,
  
  pertanggungjawaban_id: 'PJ-001-2026',
  nota_total: 19800000,        // Actual invoice total
  bukti_terima_total: 19800000,
  selisih: 200000,             // Less than PO (baik)
  status: 'pertanggungjawaban_diverifikasi'
}
```

### After Pembayaran Sisa (Final Payment)
```javascript
{
  pagu: 21600000,
  sisa_pagu: 1600000,          // Still same (only tracks allocation)
  
  total_pembayaran: 19800000,  // Actual spent
  pembayaran_status: 'lunas',
  
  uang_muka: 6000000,          // 30% advance paid earlier
  pembayaran_sisa: 13800000,   // 19.8M - 6M = 13.8M
  pembayaran_sisa_dibayar: true,
  pembayaran_sisa_tanggal: '2026-02-20',
  
  spby_id: 'SPBY-001-2026',
  spby_status: 'ditandatangani',
  status: 'complete'
}
```

---

## 🏗️ APPLICATION ARCHITECTURE

### Data Model Structure

```javascript
// Collection: permintaan (Budget Requests)
{
  id: 'req-1769948581440',
  tier: 'tier1',
  item_name: 'Pemeliharaan Jaringan Air',
  pagu: 21600000,
  status: 'approved',
  workflow_state: 'lp_pending'  // Next step: Create LP
}

// Collection: lembar_permintaan (Purchase Requests)
{
  id: 'LP-001-2026',
  permintaan_id: 'req-1769948581440',  // Link to permintaan
  dipa_items: ['item-1', 'item-2'],
  jumlah: 20000000,
  status: 'approved',
  workflow_state: 'pengadaan_pending'  // Next step: Procurement process
}

// Collection: proses_pengadaan (Procurement Process)
{
  id: 'PROC-001-2026',
  lp_id: 'LP-001-2026',
  method: 'tender',  // atau negosiasi, pemesanan langsung
  status: 'completed',
  workflow_state: 'po_pending'  // Next step: Create PO
}

// Collection: po_contracts (Purchase Orders)
{
  id: 'PO-001-2026',
  proc_id: 'PROC-001-2026',
  vendor_id: 'vendor-123',
  vendor_name: 'PT ABC Supplier',
  jumlah: 20000000,
  harga_satuan: 1000000,
  qty: 20,
  dp_persen: 30,
  dp_jumlah: 6000000,
  status: 'signed',
  workflow_state: 'uang_muka_pending'  // Next step: Advance payment
}

// Collection: uang_muka (Advance Payments)
{
  id: 'UM-001-2026',
  po_id: 'PO-001-2026',
  jumlah: 6000000,
  tanggal_pembayaran: '2026-02-05',
  bukti_transfer: 'file-uuid-1',  // Proof of payment
  kwitansi_url: 'file-uuid-2',
  status: 'dibayar',
  workflow_state: 'pertanggungjawaban_pending'
}

// Collection: pertanggungjawaban (Accountability)
{
  id: 'PJ-001-2026',
  uang_muka_id: 'UM-001-2026',
  po_id: 'PO-001-2026',
  nota_belanja_url: 'file-uuid-3',
  daftar_belanja: [
    { item: 'Item A', qty: 10, harga: 900000, total: 9000000 },
    { item: 'Item B', qty: 10, harga: 990000, total: 9900000 }
  ],
  nota_total: 18900000,
  bukti_terima_url: 'file-uuid-4',
  bukti_terima_tanggal: '2026-02-10',
  status: 'verified',
  workflow_state: 'kurang_lebih_pending'
}

// Collection: kurang_lebih (Over/Under Calculation)
{
  id: 'KL-001-2026',
  pj_id: 'PJ-001-2026',
  po_total: 20000000,
  nota_total: 18900000,
  selisih: 1100000,  // Kurang (vendor belum lengkap)
  tipe_selisih: 'kurang',
  catatan: 'Vendor akan melengkapi barang kurang sesuai PO',
  status: 'menunggu_kelengkapan',
  workflow_state: 'pembayaran_sisa_pending'
}

// Collection: pembayaran_sisa (Final Payment)
{
  id: 'PS-001-2026',
  kl_id: 'KL-001-2026',
  uang_muka_dibayarkan: 6000000,
  sisa_pembayaran: 12900000,  // 18.9M - 6M
  tanggal_pembayaran: '2026-02-20',
  bukti_transfer: 'file-uuid-5',
  status: 'dibayar',
  workflow_state: 'spby_pending'
}

// Collection: spby (Accountability Letter)
{
  id: 'SPBY-001-2026',
  ps_id: 'PS-001-2026',
  no_spby: 'SPBY/2026/001',
  ttd_bendahara: true,
  ttd_tanggal: '2026-02-21',
  lampiran_urls: [
    'file-uuid-po.pdf',
    'file-uuid-invoice.pdf',
    'file-uuid-bukti.pdf',
    'file-uuid-kwitansi.pdf'
  ],
  status: 'complete',
  archived_date: '2026-02-21'
}
```

---

## 🎨 UI/UX IMPLEMENTATION STRATEGY

### Strategy 1: Timeline/Stepper View (RECOMMENDED)

```
┌────────────────────────────────────────────────────┐
│  Procurement Workflow - LP-001-2026                │
│  Status: In Progress (Step 5 of 8)                 │
└────────────────────────────────────────────────────┘

Step 1: PERMINTAAN ✅ Complete
├─ Pagu: Rp 21.600.000
├─ Sisa: Rp 1.600.000
└─ Created: 1 Feb 2026

Step 2: LEMBAR PERMINTAAN ✅ Complete
├─ Total: Rp 20.000.000
├─ Items: 20 unit DIPA barang
└─ Approved: 2 Feb 2026

Step 3: PROSES PENGADAAN ✅ Complete
├─ Method: Tender
├─ Winner: PT ABC Supplier
└─ Completed: 5 Feb 2026

Step 4: PO & KONTRAK ✅ Complete
├─ PO Number: PO-001-2026
├─ Total: Rp 20.000.000
├─ Vendor: PT ABC Supplier
├─ DP: 30% (Rp 6.000.000)
└─ Signed: 6 Feb 2026

Step 5: UANG MUKA (DP) 🔄 IN PROGRESS [YOU ARE HERE]
├─ Amount: Rp 6.000.000
├─ Status: DIBAYAR ✅
├─ Paid: 7 Feb 2026
├─ Proof: [View Receipt]
└─ Next: Upload Receipt of Goods

Step 6: PERTANGGUNGJAWABAN
├─ Status: PENDING
├─ Invoice Total: -
├─ Goods Receipt: -
└─ [ Start Process ]

Step 7: KURANG LEBIH & PEMBAYARAN
├─ Status: NOT STARTED
└─ [ Waiting for Step 6 ]

Step 8: SPBY
├─ Status: NOT STARTED
└─ [ Waiting for Step 7 ]

[Timeline Bar showing: 1→2→3→4→5(active)→6→7→8]
```

**Advantages:**
- ✅ Clear progression
- ✅ Visual indication of current step
- ✅ Shows what's completed & what's pending
- ✅ Prevents skipping steps
- ✅ Easy to navigate between steps

---

### Strategy 2: Dashboard Cards View

```
PROCUREMENT TRACKING DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────┐  ┌─────────────────────────┐
│  BUDGET STATUS          │  │  CURRENT STEP           │
├─────────────────────────┤  ├─────────────────────────┤
│ Pagu          Rp 21.6M  │  │ 🔄 Uang Muka (DP)      │
│ Terserap      Rp 20.0M  │  │                         │
│ Sisa          Rp 1.6M   │  │ Paid: Rp 6.000.000    │
│                         │  │ Paid Date: 7 Feb 2026  │
│ [Progress Bar: 92.6%]   │  │ Proof: ✅ Uploaded     │
└─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│  PAYMENT TRACKING       │  │  NEXT ACTION            │
├─────────────────────────┤  ├─────────────────────────┤
│ Total PO    Rp 20.0M    │  │ Upload Receipt of Goods │
│ DP Paid     Rp 6.0M     │  │                         │
│ Remaining   Rp 14.0M    │  │ [Upload File]           │
│                         │  │ [Submit]                │
│ % Paid: 30% [========>] │  │                         │
└─────────────────────────┘  └─────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECENT ACTIVITIES
├─ ✅ Uang Muka Dibayar - 7 Feb 2026
├─ ✅ PO Ditandatangani - 6 Feb 2026
├─ ✅ Proses Pengadaan Selesai - 5 Feb 2026
├─ ✅ LP Disetujui - 2 Feb 2026
└─ ✅ Permintaan Disetujui - 1 Feb 2026
```

---

### Strategy 3: Integrated Tab Navigation

```
LEMBAR PERMINTAAN LP-001-2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tabs:
[Overview] [PO & Kontrak] [Uang Muka] [Pertanggungjawaban] [SPBY]
                            ↑ ACTIVE

┌────────────────────────────────────────────────────┐
│ UANG MUKA (DP - ADVANCE PAYMENT)                   │
├────────────────────────────────────────────────────┤
│                                                    │
│ DP Amount (30%):     Rp 6.000.000                 │
│ Payment Status:      ✅ DIBAYAR                    │
│ Payment Date:        7 Feb 2026                    │
│                                                    │
│ Bukti Transfer:      [📎 transfer-001.pdf]        │
│ Kwitansi:            [📎 kwitansi-001.pdf]        │
│                                                    │
│ ┌─ NEXT STEPS ────────────────────────────────┐  │
│ │                                              │  │
│ │ 1. Upload Receipt of Goods (Pertanggungjn) │  │
│ │    [Upload Bukti Terima Barang]            │  │
│ │                                              │  │
│ │ 2. Upload Invoice Details                   │  │
│ │    [Upload Nota Belanja + Daftar Barang]   │  │
│ │                                              │  │
│ │ [Submit & Continue to Next Step]           │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 📱 RECOMMENDED UI STRUCTURE

### Proposed React/Vue Component Hierarchy

```
ProcurementWorkflowDashboard/
├── ProcurementTimeline.vue          (Main stepper/timeline)
│   ├── TimelineStep.vue
│   │   ├── StepHeader
│   │   ├── StepContent (dynamic based on step)
│   │   └── StepActions
│   └── StepNavigator
│
├── ProcurementCards/
│   ├── BudgetStatusCard.vue
│   ├── PaymentTrackingCard.vue
│   ├── CurrentStepCard.vue
│   └── NextActionCard.vue
│
├── ProcurementForms/
│   ├── UangMukaForm.vue
│   ├── PertanggungjawabanForm.vue
│   ├── KurangLebihForm.vue
│   ├── PembayaranSisaForm.vue
│   └── SPBYForm.vue
│
├── DocumentUpload/
│   ├── FileUpload.vue
│   ├── FilePreview.vue
│   └── DocumentList.vue
│
└── ActivityTimeline.vue              (Recent activities)
```

---

## 🔄 WORKFLOW STATE TRANSITIONS

```javascript
// Each entity has workflow_state to track position in procurement

const workflowStates = {
  PERMINTAAN: [
    'draft',
    'submitted',
    'approved',  // → Next: Create LP
    'rejected',
    'archived'
  ],
  
  LEMBAR_PERMINTAAN: [
    'draft',
    'submitted',
    'approved',  // → Next: Proses Pengadaan
    'rejected',
    'archived'
  ],
  
  PROSES_PENGADAAN: [
    'tender_preparation',
    'tender_process',
    'selection',
    'completed',  // → Next: Create PO
    'cancelled',
    'archived'
  ],
  
  PO_KONTRAK: [
    'draft',
    'submitted',
    'approved',  // → Next: Uang Muka
    'signed',    // → Next: Uang Muka
    'rejected',
    'archived'
  ],
  
  UANG_MUKA: [
    'belum_dibayar',
    'bukti_uploaded',
    'verification_pending',
    'dibayar',    // → Next: Pertanggungjawaban
    'rejected',
    'archived'
  ],
  
  PERTANGGUNGJAWABAN: [
    'draft',
    'dokumen_uploaded',
    'verification_pending',
    'verified',   // → Next: Kurang Lebih
    'rejected',
    'archived'
  ],
  
  KURANG_LEBIH: [
    'calculating',
    'menunggu_aksi',      // Menunggu vendor/bendahara action
    'diselesaikan',       // → Next: Pembayaran Sisa
    'rejected',
    'archived'
  ],
  
  PEMBAYARAN_SISA: [
    'belum_dibayar',
    'bukti_uploaded',
    'verification_pending',
    'dibayar',    // → Next: SPBY
    'rejected',
    'archived'
  ],
  
  SPBY: [
    'draft',
    'ttd_pending',
    'ditandatangani',  // → Complete, Archive
    'archived'
  ]
};
```

---

## 📊 DISPLAY STRATEGY FOR SISA PAGU

### Budget Dashboard View

```
┌──────────────────────────────────────────────────────┐
│              BUDGET ALLOCATION OVERVIEW              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ PERMINTAAN: Pemeliharaan Jaringan Air               │
│ ─────────────────────────────────────────────────────│
│ Pagu Tahun             Rp 21.600.000    [100%]      │
│ Terserap ke LP         Rp 20.000.000    [92.6%]     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│ SISA PAGU              Rp  1.600.000    [7.4%]      │
│                                                      │
│ Status Sisa Pagu:      TERSEDIA (bisa untuk LP lain) │
│                                                      │
└──────────────────────────────────────────────────────┘

BREAKDOWN:

┌────────────────────────────────────────────────────┐
│ LP-001-2026  | Rp 20.000.000 | 92.6%  | [View]   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Available for New LP:  Rp 1.600.000              │
│                                                    │
│ [Create New LP with Remaining Budget]             │
└────────────────────────────────────────────────────┘
```

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Core Workflow (Current)
- ✅ Permintaan + Tier
- ✅ Lembar Permintaan (LP)
- [ ] Proses Pengadaan UI
- [ ] PO & Kontrak Module

### Phase 2: Payment Processing (Next)
- [ ] Uang Muka Form & Tracking
- [ ] Receipt Upload System
- [ ] Payment Proof Management
- [ ] Budget Update on Payment

### Phase 3: Accountability
- [ ] Pertanggungjawaban Form
- [ ] Invoice Matching
- [ ] Receipt Verification
- [ ] Kurang Lebih Calculation

### Phase 4: Final Settlement
- [ ] Pembayaran Sisa Processing
- [ ] SPBY Generation
- [ ] Document Bundling
- [ ] Archive Management

### Phase 5: Reporting & Analytics
- [ ] Budget Tracking Dashboard
- [ ] Procurement KPI Reports
- [ ] Payment Timeline Charts
- [ ] Vendor Performance Analysis

---

## 🛠️ RECOMMENDED TECH STACK

```
Frontend (Existing):
- Vue 3
- Tailwind CSS
- vue-router

New Components Needed:
- Stepper/Timeline Component (headlessui or custom)
- File Upload with Preview (vue-dropzone or custom)
- Progress Bar Components
- Date Range Picker (date-fns)
- Document Preview (pdfjs)

Backend (Future):
- REST API with State Machines
- File Storage (S3 or local)
- PDF Generation (for SPBY)
- Email Notifications
```

---

## 📝 NEXT IMMEDIATE STEPS

**Option A: Timeline-Based (Recommended for MVP)**
1. Create `ProcurementTimeline.vue` component
2. Add Uang Muka step form
3. Add document upload module
4. Update budget display with sisa_pagu
5. Deploy & test with real workflow

**Option B: Card-Based Dashboard**
1. Create dashboard cards
2. Add procurement summary
3. Link to individual forms
4. Build step-by-step flow

**Option C: Tabbed Interface**
1. Create tab structure
2. Add form components per tab
3. Add navigation between tabs
4. Build validation for tab progression

---

## 💡 KEY INSIGHTS

1. **Budget Tracking:**
   - Pagu = Original allocation (doesn't change)
   - Sisa Pagu = Pagu - Total LP yang disetujui
   - Tampilin di dashboard agar user tahu tersisa berapa

2. **Multi-Step Process:**
   - Not linear - depends on procurement method
   - Need state machine to handle different paths
   - Validate each step before proceeding

3. **Document Management:**
   - Each step requires proof/documents
   - Build centralized file upload system
   - Link documents to procurement records

4. **Data Relationship:**
   - Permintaan → LP → Pengadaan → PO → Uang Muka → PJ → K/L → Bayar Sisa → SPBY
   - Track parent-child relationships
   - Maintain audit trail

5. **User Experience:**
   - Show progress clearly
   - Indicate what's next
   - Allow going back to previous steps (for editing drafts)
   - Provide summary at each stage

---

**Which approach do you prefer? Or should we combine strategies?**
