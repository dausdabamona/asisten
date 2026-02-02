# QUICK START - LEMBAR PERMINTAAN (LP)

**Status:** ✅ NEW FEATURE  
**Date:** February 2026  
**Version:** 1.0

---

## 📋 APA ITU LEMBAR PERMINTAAN (LP)?

Lembar Permintaan adalah dokumen formal yang diajukan oleh suatu unit untuk meminta pengadaan barang/jasa. 

**Fitur Utama:**
- ✅ Multi-item dalam 1 LP (tidak perlu membuat banyak form)
- ✅ Auto-tier detection berdasarkan harga (Tier 1/2/3)
- ✅ Budget summary per tier
- ✅ Easy add/remove items
- ✅ Real-time calculation

---

## 🚀 CARA MENGGUNAKAN

### Akses Lembar Permintaan

**URL:** `http://localhost:5174/#/transaksi/lp/tambah`

**Atau dari Sidebar:**
- Click "Transaksi" → "Lembar Permintaan" → "Buat LP Baru"

---

## 📝 FORM FIELDS

### Section 1: Informasi Permintaan

| Field | Contoh | Keterangan |
|-------|--------|-----------|
| **Unit Pengajuan** | Fakultas Teknik | Pilih unit dari dropdown |
| **Tanggal Permintaan** | 7 Feb 2026 | Default = hari ini |
| **Penanggung Jawab Unit** | 197805101999031001 | NIP pejabat yang bertanggung jawab |
| **Deskripsi Permintaan** | Upgrade infrastruktur jaringan | Optional - alasan pengadaan |

### Section 2: Daftar Barang/Jasa

Tabel dengan kolom:

| Kolom | Keterangan | Mandatory |
|-------|-----------|-----------|
| **No** | Auto-increment | - |
| **Deskripsi Barang/Jasa** | Detail item yang diminta | ✅ Ya |
| **Qty** | Jumlah | ✅ Ya (min 1) |
| **Unit** | Satuan (Unit, Set, Paket, dll) | ✅ Ya |
| **Est. Harga** | Estimated price per item | ✅ Ya |
| **Total** | Auto-calculated (Qty × Price) | - |
| **Tier** | Auto-detected | - |
| **Aksi** | Delete row (if > 1 item) | - |

---

## 📊 CONTOH PENGISIAN

### Scenario: Unit Teknik minta network equipment

**Step 1: Isi Info Permintaan**
```
Unit Pengajuan: Fakultas Teknik
Tanggal: 7 Feb 2026
Penanggung Jawab: Dr. Budi / 197805101999031001
Deskripsi: Upgrade konektivitas internet gedung B dan C
```

**Step 2: Tambah Items ke Tabel**

| No | Deskripsi | Qty | Unit | Harga | Total | Tier |
|----|-----------|-----|------|-------|-------|------|
| 1 | Switch Managed 24 Port | 2 | Unit | 5.000.000 | 10.000.000 | Tier 1 |
| 2 | Kabel Cat 6A 100m | 5 | Roll | 1.500.000 | 7.500.000 | Tier 1 |
| 3 | Media Converter SFP | 4 | Unit | 2.000.000 | 8.000.000 | Tier 1 |
| 4 | Instalasi & Konfigurasi | 1 | Paket | 12.000.000 | 12.000.000 | Tier 2 |
| 5 | UPS 10KVA | 1 | Unit | 35.000.000 | 35.000.000 | **Tier 3** |

**Step 3: System Auto-Calculate**

```
💰 RINGKASAN ANGGARAN

Tier 1 (< Rp 10M):    Rp 25.500.000  (Items: 1, 2, 3)
Tier 2 (Rp 10-50M):   Rp 12.000.000  (Item: 4)
Tier 3 (> Rp 50M):    Rp 35.000.000  (Item: 5)
                      ─────────────
GRAND TOTAL:          Rp 72.500.000
```

**Step 4: Submit**
- Click "✓ Ajukan LP"
- System generates LP ID: `LP-1706000581440` (auto)
- Redirect ke transaksi list
- LP sekarang bisa dilihat di LP List dengan status "Submitted"

---

## ⚙️ AUTO-TIER DETECTION

System **otomatis** menentukan Tier berdasarkan total per item:

```
Item Total < Rp 10.000.000     → Tier 1
Item Total Rp 10-50.000.000    → Tier 2
Item Total > Rp 50.000.000     → Tier 3
```

**Contoh:**
- Network Switch 2 × Rp 5.000.000 = Rp 10.000.000 → **Tier 2** (batas)
- Kabel 5 × Rp 1.500.000 = Rp 7.500.000 → **Tier 1**
- UPS 1 × Rp 35.000.000 = Rp 35.000.000 → **Tier 3**

Tier otomatis update saat qty atau harga berubah!

---

## 📋 FORM ACTIONS

### Save Draft (Simpan Draft)
- Data disimpan ke localStorage
- Status tetap "Draft"
- Bisa di-edit nanti
- LP ID belum digenerate

### Submit (Ajukan LP)
- Data disimpan ke localStorage
- Generate LP ID otomatis
- Status berubah ke "Submitted"
- Redirect ke transaksi list
- LP siap untuk proses berikutnya (Proses Pengadaan)

### Kembali
- Click "← Kembali"
- Redirect ke transaksi list (data tidak disimpan jika belum klik Save Draft)

---

## ✅ VALIDATION CHECKLIST

**Sebelum Submit, pastikan:**

- [ ] Unit pengajuan dipilih
- [ ] Tanggal permintaan diisi
- [ ] NIP penanggung jawab diisi
- [ ] Minimal 1 item ditambahkan
- [ ] Setiap item:
  - [ ] Deskripsi diisi
  - [ ] Qty minimal 1
  - [ ] Unit diisi
  - [ ] Harga diisi (> 0)
- [ ] Tidak ada error yang ditampilkan di bawah form

**Jika ada yang belum lengkap:**
- Submit button akan DISABLED (warna abu-abu)
- Error messages akan ditampilkan di bagian "⚠️ Periksa Data Berikut"

---

## 🔄 WORKFLOW SETELAH SUBMIT

Setelah LP disubmit, langkah berikutnya adalah:

```
Step 1: LP Ajukan (di form ini) ✅ DONE
          ↓
Step 2: Proses Pengadaan (Tender/Negosiasi)
          ↓
Step 3: Pilih Penyedia/Vendor
          ↓
Step 4: Input Kontrak/PO
          ↓
Step 5: Uang Muka (DP pembayaran)
          ↓
Step 6: Pertanggungjawaban (Invoice verification)
          ↓
Step 7-9: Settlement & Closure
```

**Untuk lanjut ke Proses Pengadaan:**
- Buka LP yang baru dibuat dari LP List
- Click button "Proses Pengadaan"

---

## 🧮 BUDGET CALCULATION

### Formula:

```
Total Per Item = Qty × Estimate Price

Example:
├─ Item 1: 2 × 5.000.000 = 10.000.000 (Tier 2 - batas)
├─ Item 2: 5 × 1.500.000 = 7.500.000 (Tier 1)
├─ Item 3: 4 × 2.000.000 = 8.000.000 (Tier 1)
├─ Item 4: 1 × 12.000.000 = 12.000.000 (Tier 2)
└─ Item 5: 1 × 35.000.000 = 35.000.000 (Tier 3)

Tier 1 Subtotal: 7.500.000 + 8.000.000 = 15.500.000
Tier 2 Subtotal: 10.000.000 + 12.000.000 = 22.000.000
Tier 3 Subtotal: 35.000.000 = 35.000.000
                                  ─────────────
GRAND TOTAL:                    Rp 72.500.000
```

---

## 📝 TIPS & TRICKS

### Tip 1: Bulk Add Items
Jangan perlu fill 1 per 1. Kamu bisa:
1. Isi Unit & Tanggal
2. Add items banyak kali dengan "+ Tambah Item"
3. Fill data per item
4. Submit semuanya sekaligus

### Tip 2: Edit Items
- Klik di field untuk mengedit
- Qty/Harga auto-update total
- Total auto-update tier
- No perlu manual refresh

### Tip 3: Delete Items
- Click icon 🗑️ di kolom Aksi
- Item akan terhapus dari tabel
- Minimal 1 item harus ada

### Tip 4: Unit Selection
- Dropdown berisi daftar satker
- Scroll untuk pilih
- Sekali dipilih, tidak bisa dirubah jadi double-check

### Tip 5: Save Draft
- Jika belum yakin dengan data, click "Simpan Draft"
- LP tetap tersimpan dengan status Draft
- Bisa di-edit nanti sebelum final submit

---

## 💾 DATA STORAGE

Data LP disimpan di **localStorage**:

```javascript
// Draft LP
localStorage['ppk_lp_draft_LP-1234567890']

// Submitted LP
localStorage['ppk_lp_LP-1234567890']

// LP List (untuk display di tabel)
localStorage['ppk_lp_list'] = [
  {
    lp_id: 'LP-1234567890',
    unit_name: 'Fakultas Teknik',
    total: 72500000,
    status: 'submitted',
    created_at: '2026-02-07T...'
  },
  ...
]
```

---

## 🔗 RELATED FEATURES

### Untuk Membuat Permintaan dengan Status berbeda:

1. **Tier 1 Permintaan** (< Rp 10 Juta)
   - Route: `/transaksi/tier1/tambah`
   - Untuk single-item, simple request
   - Lebih cepat dari LP multi-item

2. **Tier 2 Permintaan** (Rp 10-50 Juta)
   - Route: `/transaksi/tier2/tambah`
   - Untuk items not in DIPA

3. **Tier 3 Permintaan** (> Rp 50 Juta)
   - Route: `/transaksi/tier3/tambah`
   - Untuk large requests outside DIPA/MAK

4. **Lembar Permintaan** (Multi-item)
   - Route: `/transaksi/lp/tambah`
   - Untuk bulk requests dari 1 unit
   - RECOMMENDED untuk real-world use ✅

---

## 🆘 TROUBLESHOOTING

### Q: Submit button disabled?
**A:** Check error section at bottom:
- Pastikan semua field "Unit", "Tanggal", "NIP" diisi
- Pastikan ada minimal 1 item
- Pastikan setiap item lengkap (deskripsi, qty, unit, harga)

### Q: Item total tidak auto-update?
**A:** 
- Pastikan kamu input angka di Qty dan Harga
- Tier akan auto-update saat total berubah
- Kalau masih tidak update, refresh page

### Q: Gimana kalau typo di unit atau item?
**A:**
- Klik field yang salah
- Edit langsung di tabel
- Auto-update, no perlu save

### Q: Mau delete item terakhir?
**A:**
- Tidak bisa! Minimal 1 item harus ada
- Gunakan "+ Tambah Item" kalau perlu tambah
- Kalau mau buat LP baru, click "Kembali"

### Q: Data hilang setelah refresh?
**A:**
- Jika belum save draft = hilang (karena hanya di memory)
- Jika sudah save draft = akan muncul saat buka form lagi
- Jika sudah submit = data permanent di localStorage

---

## 📊 NEXT STEPS AFTER SUBMIT

Setelah LP berhasil diajukan:

1. **View di LP List**
   - Go to: `/transaksi/lp`
   - Lihat LP baru dengan status "Submitted"

2. **Proses Pengadaan**
   - Click "Proses" button
   - Mulai tender/negosiasi
   - Select vendor

3. **Input Kontrak**
   - Input terms & conditions
   - Set payment method
   - Prepare for PO

4. **Next Workflow**
   - Start Uang Muka process
   - Pertanggungjawaban
   - Settlement

---

## 📱 RESPONSIVE DESIGN

✅ **Tabel akan responsive di:**
- Desktop: Full table view
- Tablet: Horizontal scroll enabled
- Mobile: Horizontal scroll + optimized for touch

Semua buttons dan inputs **touch-friendly** di mobile! ✨

---

## 🎉 KESIMPULAN

Lembar Permintaan adalah cara **terbaik** untuk submit multiple items sekaligus:

✅ One form, multiple items
✅ Auto tier detection
✅ Real-time budget calculation
✅ Easy to manage
✅ Professional workflow

**Ready to create your first LP?** 🚀

Go to: `http://localhost:5174/#/transaksi/lp/tambah`

---

**Created:** February 2026  
**Version:** 1.0  
**Status:** ✅ READY FOR USE
