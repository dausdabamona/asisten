# QUICK START - PROCUREMENT WORKFLOW (Pengadaan)

## 🎯 Tujuan
Fitur Procurement Workflow memudahkan pengelolaan seluruh proses pengadaan barang/jasa dari permintaan anggaran hingga pertanggungjawaban pembayaran.

---

## 📋 Alur Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Permintaan (Request Budget)                            │
│  ✓ Tier 1/2/3 approval, Pagu allocated                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Lembar Permintaan (LP)                                 │
│  ✓ Specify items + quantities, Request approval                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Proses Pengadaan (Procurement Process)                 │
│  ✓ Tender/Negotiation, Vendor selection                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: PO & Kontrak (Purchase Order & Contract)               │
│  ✓ Create PO, Set payment terms (e.g., 30% DP, 70% Final)       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 🔴 Step 5: Uang Muka (Advance Payment) - START HERE             │
│  • Pay DP (typically 30% of PO)                                 │
│  • Upload payment proof (transfer receipt, check, etc)          │
│  • Verify payment completed                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: Pertanggungjawaban (Accountability)                    │
│  • Upload Invoice (Nota Belanja) from vendor                    │
│  • Upload Goods Receipt (Berita Acara Penerimaan Barang)         │
│  • List all items purchased with quantities & prices            │
│  • Verify invoice matches PO                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 7: Kurang/Lebih (Over/Under Calculation)                  │
│  • Calculate difference: Invoice Total vs PO Total              │
│  • If over: Need approval for additional payment                │
│  • If under: Calculate refund amount                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 8: Pembayaran Sisa (Final Payment Settlement)             │
│  • Pay remaining balance (70% if standard DP)                   │
│  • Upload final payment proof                                   │
│  • Close payment cycle                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 9: SPBY (Surat Pertanggungjawaban Belanja)                │
│  • Generate accountability letter                               │
│  • Sign document                                                │
│  • Archive complete workflow                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 CARA MENGGUNAKAN

### Scenario: Sudah ada LP-001-2026 dengan Total PO Rp 20.000.000

#### **Step 5: UANG MUKA (Advance Payment)**

**Lokasi:** `/transaksi/procurement/LP-001-2026` → **Uang Muka (DP)**

**Form Fields:**

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Tanggal Pembayaran** | 7 Feb 2026 | Kapan DP dibayarkan |
| **Metode Pembayaran** | Transfer Bank | Pilih: Transfer / Cheque / Tunai / Giro |
| **No. Referensi** | TRF-20260207-001 | No transfer / No cek / No giro |
| **Dari Rekening** | 1234567890 (BCA) | Optional - rekening pengirim |
| **Bukti Pembayaran** | [Upload PDF] | 🔴 WAJIB - Scan struk transfer / cek copy |
| **Kwitansi dari Vendor** | [Upload PDF] | Optional - jika ada |
| **Diverifikasi oleh** | Rina Hartono | Nama pejabat yang verifikasi |

**Checklist yang harus dicentang:**
- ✅ Jumlah pembayaran sudah sesuai: Rp 6.000.000 (30% dari Rp 20.000.000)
- ✅ Pembayaran ke rekening/nama penerima yang benar
- ✅ Bukti pembayaran lengkap dan jelas

**Submit → Otomatis lanjut ke Step 6 (Pertanggungjawaban)**

---

#### **Step 6: PERTANGGUNGJAWABAN (Accountability)**

**Lokasi:** `/transaksi/procurement/LP-001-2026` → **Pertanggungjawaban**

**Form Fields:**

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Nomor Nota Belanja** | INV-202602-001 | No invoice dari vendor |
| **Tanggal Nota Belanja** | 5 Feb 2026 | Tanggal invoice |
| **Nama Vendor** | PT ABC Supplier | Nama perusahaan supplier |
| **Scan Nota Belanja** | [Upload PDF] | 🔴 WAJIB - Nota original dari vendor |

**Tabel Item Pembelian:**

Add items yang dibeli:

| No | Deskripsi | Qty | Unit | Harga/Unit | Total |
|----|-----------|-----|------|------------|-------|
| 1 | Network Switch 24 Port | 1 | Unit | 5.000.000 | 5.000.000 |
| 2 | Kabel Cat 6A 100m | 3 | Roll | 1.000.000 | 3.000.000 |
| 3 | Connector RJ45 | 100 | Pcs | 30.000 | 3.000.000 |
| 4 | Instalasi & Config | 1 | Paket | 8.000.000 | 8.000.000 |
| **TOTAL INVOICE:** | | | | | **Rp 19.000.000** |

**Goods Receipt Section:**

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Tanggal Penerimaan** | 6 Feb 2026 | Kapan barang diterima |
| **Diterima oleh** | Budi Santoso / 197805101999031001 | Nama & NIP penerima |
| **Scan Berita Acara** | [Upload PDF] | 🔴 WAJIB - Harus sudah ditandatangani |
| **Catatan Penerimaan** | Barang OK, tidak ada rusak | Optional - kondisi barang |

**Verification Checklist:**
- ✅ Barang sudah diterima sesuai spesifikasi & kondisi baik
- ✅ Invoice sudah diverifikasi dan sesuai dengan PO
- ✅ Total invoice sudah sesuai

**Verification Officer:**

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Diverifikasi oleh** | Rina Hartono / Kepala Bagian | Nama & jabatan |
| **Tanggal Verifikasi** | 7 Feb 2026 | Tanggal verifikasi |

**Info yang Ditampilkan:**
```
📊 Ringkasan Pertanggungjawaban
├─ Nomor Nota: INV-202602-001
├─ Total Invoice: Rp 19.000.000
├─ DP Telah Dibayar: Rp 6.000.000
├─ Sisa Pembayaran: Rp 13.000.000  ⬅️ System auto-calculate!
└─ Dokumen Lengkap: ✓ Ya
```

**Submit → Otomatis lanjut ke Step 7 (Kurang/Lebih)**

---

#### **Step 7: KURANG/LEBIH (Over/Under Calculation)**

**Lokasi:** `/transaksi/procurement/LP-001-2026` → **Kurang/Lebih**

**Automatic Calculation:**

```
PO Total:            Rp 20.000.000
Invoice Total:       Rp 19.000.000
                     ─────────────
Selisih:             Rp 1.000.000 (KURANG)

Analisis:
┌─────────────────────────────────────────┐
│ Status: KURANG (Under)                  │
│ Jumlah: Rp 1.000.000                    │
│ Aksi: Tambah pembayaran                 │
└─────────────────────────────────────────┘

Skenario 1: Vendor Bayar Kembali
├─ Upload bukti transfer refund dari vendor
├─ Update sisa pembayaran ke Rp 12.000.000

Skenario 2: Harga Berubah (Lebih)
├─ Jika Invoice > PO, perlu approval tambahan
├─ Upload persetujuan dari atasan

Skenario 3: Potongan Harga Diterima
├─ Catat diskon yang diterima
├─ Update grand total invoice
```

**Form Fields:**

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Analisa Selisih** | Vendor memberikan potongan | Penjelasan perbedaan |
| **Dokumen Pendukung** | [Upload] | Bukti transfer refund / invoice revised |
| **Jumlah Adjustment** | Rp 1.000.000 | Jumlah kurang/lebih |
| **Tipe Adjustment** | Refund | Refund / Tambah Bayar / Diskon |
| **Disetujui oleh** | Manager Purchasing | Nama approve |

**Submit → Otomatis lanjut ke Step 8 (Pembayaran Sisa)**

---

#### **Step 8: PEMBAYARAN SISA (Final Payment)**

**Lokasi:** `/transaksi/procurement/LP-001-2026` → **Pembayaran Sisa**

**Calculation:**
```
Total Invoice:           Rp 19.000.000
Kurang/Lebih:           - Rp 1.000.000 (adjusted)
                         ──────────────
Adjusted Total:         Rp 18.000.000
DP Telah Bayar:         - Rp 6.000.000
                         ──────────────
Pembayaran Sisa:        = Rp 12.000.000 ⬅️ Jumlah bayar terakhir
```

**Form Fields:**

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Tanggal Pembayaran** | 15 Feb 2026 | Kapan sisa dibayar |
| **Metode Pembayaran** | Transfer Bank | Pilih metode |
| **No. Referensi** | TRF-20260215-001 | No transfer/cek |
| **Bukti Pembayaran** | [Upload PDF] | 🔴 WAJIB - Struk transfer |
| **Diverifikasi oleh** | Rina Hartono | Nama pejabat verifikasi |

**Summary:**
```
Jumlah Sisa Bayar: Rp 12.000.000
Metode: Transfer Bank
TRF: TRF-20260215-001
Bukti: ✓ Uploaded
Total Telah Dibayar: Rp 18.000.000 (100% dari invoice)
```

**Submit → Otomatis lanjut ke Step 9 (SPBY)**

---

#### **Step 9: SPBY (Accountability Letter)**

**Lokasi:** `/transaksi/procurement/LP-001-2026` → **SPBY**

**Automatic Document Generation:**

System akan generate SPBY (Surat Pertanggungjawaban Belanja) dengan data:

```
SURAT PERTANGGUNGJAWABAN BELANJA
Periode: 7 Feb - 15 Feb 2026

LP: LP-001-2026
Vendor: PT ABC Supplier
Total Invoice: Rp 19.000.000

Pembayaran:
├─ DP (30%): Rp 6.000.000 [TRF-20260207-001] ✓ Verified
├─ Sisa (70%): Rp 12.000.000 [TRF-20260215-001] ✓ Verified
├─ Total Dibayar: Rp 18.000.000
└─ Status: LUNAS

Barang:
├─ Network Switch 24 Port x 1 Unit
├─ Kabel Cat 6A 100m x 3 Roll
├─ Connector RJ45 x 100 Pcs
└─ Instalasi & Konfigurasi x 1 Paket

Ditandatangani oleh:
├─ Rina Hartono (Verifikasi): _____________
├─ Budi Santoso (Penerima): _____________
└─ Manager Purchasing: _____________

Diterbitkan: 15 Feb 2026
```

**Form Fields:**

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Preview SPBY** | [Preview PDF] | Lihat draft dokumen |
| **Tanda Tangan 1** | [Upload] | Signature pejabat 1 |
| **Tanda Tangan 2** | [Upload] | Signature pejabat 2 |
| **Tanda Tangan 3** | [Upload] | Signature pejabat 3 (optional) |
| **Catatan Penutup** | Workflow selesai | Optional notes |

**Submit → Selesai & Arsipkan**

---

## 📊 DASHBOARD VIEW

Setelah workflow dimulai, dapat dilihat di TransaksiListView:

```
┌────────────────────────────────────────────────────────────┐
│  RECENT REQUESTS & WORKFLOWS                              │
├────────────────────────────────────────────────────────────┤
│ REQUEST # │ ITEM │ VALUE │ STATUS │ STEP │ ACTION         │
├────────────────────────────────────────────────────────────┤
│ LP-001    │ Net… │ Rp20M │ Progress │ 5/9 │ [▶ Continue]  │
│ LP-002    │ Off… │ Rp15M │ Completed│ 9/9 │ [📄 View SPBY]│
│ LP-003    │ Car… │ Rp5M  │ Draft    │ 1/9 │ [Edit]        │
└────────────────────────────────────────────────────────────┘
```

Click **[▶ Continue]** untuk lanjut ke step berikutnya

---

## 💾 DATA STORAGE

Semua data disimpan di **localStorage** (sementara):

```javascript
// Contoh structure
localStorage['ppk_workflow_LP-001-2026'] = {
  lpId: 'LP-001-2026',
  currentStep: 5,
  steps: [
    { name: 'permintaan', status: 'completed' },
    { name: 'lp', status: 'completed' },
    { name: 'pengadaan', status: 'completed' },
    { name: 'po', status: 'completed' },
    { name: 'uang_muka', status: 'in_progress' },
    ...
  ],
  data: {
    4: { payment_date: '2026-02-07', amount: 6000000, ... },
    5: { invoice_number: 'INV-202602-001', items: [...] },
    ...
  }
}
```

---

## ✅ CHECKLIST - UANG MUKA STEP

**Sebelum Submit:**
- [ ] Tanggal pembayaran diisi
- [ ] Metode pembayaran dipilih (Transfer/Cek/Tunai/Giro)
- [ ] Nomor referensi diisi
- [ ] Bukti pembayaran di-upload (wajib)
- [ ] Verifikasi jumlah (Rp 6.000.000) - dicek
- [ ] Verifikasi nama penerima - dicek
- [ ] Verifikasi dokumen lengkap - dicek
- [ ] Nama pejabat verifikasi diisi
- [ ] Form valid (status button berubah enabled)

**Submit → Simpan + Lanjut ke Pertanggungjawaban**

---

## ✅ CHECKLIST - PERTANGGUNGJAWABAN STEP

**Sebelum Submit:**
- [ ] Nomor nota belanja diisi
- [ ] Tanggal nota belanja diisi
- [ ] Nama vendor diisi
- [ ] Nota belanja di-upload (wajib)
- [ ] Minimal 1 item sudah ditambahkan di tabel
- [ ] Tanggal penerimaan barang diisi
- [ ] Nama penerima diisi
- [ ] Bukti terima barang di-upload (wajib)
- [ ] Verifikasi barang - dicek
- [ ] Verifikasi invoice sesuai PO - dicek
- [ ] Verifikasi total invoice - dicek
- [ ] Nama pejabat verifikasi diisi
- [ ] Tanggal verifikasi diisi
- [ ] Form valid (status button berubah enabled)

**Submit → Simpan + Lanjut ke Kurang/Lebih**

---

## 🔗 RELATED LINKS

- [FASE_10H_INTEGRATION.md](FASE_10H_INTEGRATION.md) - Complete architecture & design
- [FASE_10H_IMPLEMENTATION.md](FASE_10H_IMPLEMENTATION.md) - Implementation guide with code
- [FASE_10H_PROCUREMENT_WORKFLOW.md](FASE_10H_PROCUREMENT_WORKFLOW.md) - Original workflow documentation

---

## 🆘 TROUBLESHOOTING

**Q: Form tidak bisa di-submit?**
A: Check error section di bawah form - ada validasi yang belum terpenuhi

**Q: Upload file error?**
A: Pastikan file format (PDF/JPG/PNG) dan ukuran < 5MB

**Q: Mau kembali ke step sebelumnya?**
A: Click tombol "← Sebelumnya" atau click step circle di timeline

**Q: Data hilang?**
A: Data disimpan di localStorage. Buka DevTools → Application → Local Storage untuk cek

**Q: Gimana kalau ada perubahan di step 5 setelah submit?**
A: Saat ini backend belum ada - nanti akan ada edit history tracking

---

## 📱 NEXT FEATURES

- [ ] Backend API integration (MongoDB/PostgreSQL)
- [ ] Digital signature support
- [ ] Email notifications
- [ ] Workflow history/audit log
- [ ] Budget dashboard (real-time sisa pagu)
- [ ] Multi-user approval workflow
- [ ] Export to Excel/PDF
- [ ] Mobile app version

---

**Created:** February 2026
**Version:** 1.0 - Beta
**Status:** Ready for Testing

Mari test workflow ini dan laporkan feedback! 🚀
