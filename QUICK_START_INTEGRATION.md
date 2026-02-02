# QUICK START GUIDE - Integrated Transaction Management

## 🚀 Fitur Utama

Sistem yang sudah diimplementasikan memungkinkan Anda untuk:

1. **Kelola semua transaksi dalam satu tempat** - Lembar Permintaan, Surat Tugas, dan Tier 1/2/3 dapat dilihat bersama di `/transaksi`
2. **Filter & cari dengan mudah** - Cari berdasarkan tipe transaksi, status, atau keyword
3. **Navigasi yang terstruktur** - Sidebar menu yang jelas dengan quick action cards di dashboard
4. **Buat berbagai jenis permintaan** - Tier 1 (< Rp 10 Juta), Tier 2 (Rp 10-50 Juta), Tier 3 (> Rp 50 Juta)
5. **Edit & hapus draft** - Ubah atau hapus transaksi yang masih dalam status draft

---

## 📍 MENU NAVIGATION

### Dashboard
- Klik tombol logo atau "Dashboard" di sidebar
- Lihat quick action buttons untuk membuat transaksi baru
- Lihat ringkasan data dalam statistics cards
- Lihat daftar transaksi terbaru

### Transaksi → Semua Transaksi
- Klik "📊 Semua Transaksi" di sidebar
- Lihat daftar **lengkap** semua jenis transaksi
- Filter berdasarkan:
  - **Jenis:** LP, ST, Tier1, Tier2, Tier3
  - **Status:** Draft, Diajukan, Disetujui, Ditolak, Selesai
  - **Keyword:** Cari berdasarkan nomor, nama, atau deskripsi
- Click row untuk lihat detail atau edit (jika draft)

### Transaksi → Lembar Permintaan
- Klik "📋 Lembar Permintaan" di sidebar
- Lihat daftar LP saja
- Klik "Tambah LP Barang" atau "Tambah LP Jasa" untuk membuat baru

### Transaksi → Surat Tugas
- Klik "✈️ Surat Tugas" di sidebar
- **BARU!** Route ini sekarang berfungsi (sebelumnya tidak bisa diakses)
- Klik "Tambah Surat Tugas" untuk membuat baru
- Lihat daftar semua surat tugas

### Permintaan → Tier 1/2/3
- Klik salah satu dari "Tier 1", "Tier 2", atau "Tier 3" di sidebar
- Buka form untuk membuat permintaan baru
- Submit untuk menyimpan ke database

---

## 🆕 FEATURES YANG BARU

### 1. Unified Transaction List (`/transaksi`)

**Apa itu?** - Satu halaman yang menampilkan SEMUA transaksi dari semua sistem

**Bagian:**
- **Quick Actions** - 3 tombol untuk membuat LP, ST, atau Tier baru
- **Filters** - Filter berdasarkan tipe, status, atau pencarian
- **Statistics** - Card summary dengan jumlah transaksi per status
- **Unified Table** - Tabel yang menggabungkan LP, ST, dan Tier

**Contoh Filter:**
- Jenis: "ST" → Tampilkan hanya Surat Tugas
- Status: "Draft" → Tampilkan hanya yang belum diajukan
- Search: "ATK" → Tampilkan semua transaksi dengan kata "ATK"

---

### 2. Tier Form Views - Routed & Standalone

Sebelumnya: Form Tier 1/2/3 embedded di dalam App.vue  
Sekarang: Form terpisah dengan routing yang proper

#### **Tier 1 Form** - Untuk kebutuhan < Rp 10 Juta

**Akses via:**
- Dashboard quick action button
- Sidebar: Permintaan → Tier 1
- Direct URL: `/#/transaksi/tier1/tambah`

**Form Fields:**
```
Nama Barang/Jasa *        [Text input]
Deskripsi                  [Textarea]
Item DIPA *               [Multi-select checkbox list]
  - Searchable
  - Show auto-total
Unit *                    [Autocomplete + Tambah button]
Penanggung Jawab *        [Dropdown pegawai]

[Cancel] [Simpan]
```

**Data Saved:** localStorage['ppk_requests'] with budget_item_ids array

---

#### **Tier 2 Form** - Untuk kebutuhan Rp 10-50 Juta

**Akses via:**
- Sidebar: Permintaan → Tier 2
- Direct URL: `/#/transaksi/tier2/tambah`

**Form Fields:**
```
Nama Barang/Jasa *        [Text input]
Deskripsi                  [Textarea]
Perkiraan Nilai *         [Number input] → shows formatted amount
MAK Terkait *             [Text input]
Unit *                    [Text input]

[Cancel] [Simpan]
```

**Karakteristik:** Untuk items yang belum ada di DIPA tapi masih dalam MAK

---

#### **Tier 3 Form** - Untuk kebutuhan > Rp 50 Juta

**Akses via:**
- Sidebar: Permintaan → Tier 3
- Direct URL: `/#/transaksi/tier3/tambah`

**Form Fields:**
```
Nama Barang/Jasa *        [Text input]
Deskripsi & Justifikasi * [Textarea - bigger]
Perkiraan Nilai *         [Number input]
Sumber Dana *             [Dropdown: Revisi DIPA, PNBP, Hibah, Lainnya]
Unit *                    [Text input]
Catatan Tambahan          [Textarea]

[Cancel] [Simpan]
```

**Karakteristik:** Untuk items di luar DIPA dan MAK, memerlukan justifikasi lengkap

---

### 3. Surat Tugas Routes - NOW WORKING! ✅

**Status:** Sebelumnya ST views ada tapi tidak bisa diakses via routing

**Akses:**
- Sidebar: Transaksi → Surat Tugas
- Atau: Dashboard → Click "Surat Tugas" quick action

**Routes:**
```
/transaksi/st             → STListView (daftar ST)
/transaksi/st/tambah      → STFormView (buat ST baru)
/transaksi/st/:id         → STDetailView (lihat detail)
/transaksi/st/:id/edit    → STFormView (edit ST)
/transaksi/st/:id/pertanggungjawaban → Accountability/reporting
```

---

### 4. Dashboard Quick Actions

**Sebelumnya:** Hanya ada satu tombol generic

**Sekarang:** 3 tombol dengan ikon dan deskripsi

```
┌─────────────────────────────────┬──────────────────────┬──────────────────┐
│ 📋                              │ ✈️                   │ 📝               │
│ Lembar Permintaan               │ Surat Tugas          │ Permintaan Tier  │
│ Buat permintaan pengadaan       │ Buat surat tugas     │ Ajukan permintaan│
│ barang/jasa                     │ perjalanan dinas     │ Tier 1/2/3       │
└─────────────────────────────────┴──────────────────────┴──────────────────┘
```

Click tombol → Navigate langsung ke form

---

## 📊 DATA & STATUS

### Transaction Status Flow

```
Draft (belum diajukan)
   ↓
Submitted (sudah diajukan, menunggu approval)
   ↓ ✓ Approved (disetujui)
   ├→ Completed (selesai)
   │
   └→ Rejected (ditolak)
       ↓ (dapat diubah jadi Draft untuk resubmit)
```

### Viewing Status

- **Dashboard:** Recent Requests table menunjukkan transaksi terbaru
- **Semua Transaksi:** Filter dan lihat semua berdasarkan status
- **Individual Form:** Status otomatis "Draft" saat create, berubah sesuai workflow

---

## 💾 DATA STORAGE

**Saat ini:** LocalStorage (browser)
- Semua Tier requests: `localStorage['ppk_requests']`
- Semua LP: Future `localStorage['ppk_lp_transactions']`
- Semua ST: Future `localStorage['ppk_st_transactions']`

**Bagaimana melihat data:**
1. Open browser Developer Tools (F12)
2. Go to Application → Local Storage
3. Click domain website
4. Cari key `ppk_requests`, `ppk_mock_data`, dll

**Export data:**
```javascript
// Di browser console
JSON.stringify(JSON.parse(localStorage.getItem('ppk_requests')), null, 2)
// Copy-paste ke file .json
```

---

## 🔍 COMMON TASKS

### Task 1: Membuat Tier 1 Request

1. Buka halaman aplikasi
2. Di sidebar, cari section "Permintaan"
3. Klik "Tier 1"
4. Halaman `/transaksi/tier1/tambah` terbuka
5. Isi form:
   - Nama Barang/Jasa: contoh "ATK Workshop"
   - Pilih item DIPA dengan checkbox (bisa multiple)
   - Masukkan Unit: "Bagian Umum"
   - Pilih Penanggung Jawab dari dropdown
6. Klik "Simpan Permintaan"
7. Auto-redirect ke `/transaksi` (daftar semua)
8. Request Anda akan muncul di tabel dengan status "Draft"

---

### Task 2: Melihat Semua Transaksi

1. Di sidebar, klik "📊 Semua Transaksi"
2. Halaman `/transaksi` membuka dengan unified table
3. Lihat statistik di atas (Total, Draft, Submitted, Approved, Completed)
4. Lihat semua transaksi tercampur (LP, ST, Tier)
5. Filter jika perlu:
   - Dropdown "Jenis Transaksi" → Pilih "Tier1", "LP", "ST", dll
   - Dropdown "Status" → Pilih "Draft", "Submitted", dll
   - Textbox "Cari" → Ketik keyword
6. Klik tombol "👁️" di kolom Aksi untuk lihat detail
7. Klik tombol "✏️" untuk edit (hanya kalau Draft)
8. Klik tombol "🗑️" untuk hapus (hanya kalau Draft)

---

### Task 3: Membuat Surat Tugas (YANG BARU BERFUNGSI!)

1. Di sidebar, klik "✈️ Surat Tugas" under section Transaksi
2. Halaman `/transaksi/st` (STListView) terbuka
3. Klik tombol "Tambah Surat Tugas"
4. Halaman `/transaksi/st/tambah` (STFormView) terbuka
5. Isi form (sesuai dengan struktur Surat Tugas)
6. Klik "Simpan"
7. ST akan muncul di `/transaksi` daftar unified

---

### Task 4: Edit Draft Request

1. Buka `/transaksi` (Semua Transaksi)
2. Cari request dengan status "Draft"
3. Klik tombol "✏️" di kolom Aksi
4. Form membuka dengan data pre-filled
5. Ubah yang diperlukan
6. Klik "Simpan"

---

### Task 5: Hapus Draft Request

1. Buka `/transaksi` (Semua Transaksi)
2. Cari request dengan status "Draft"
3. Klik tombol "🗑️" di kolom Aksi
4. Confirm dialog
5. Request dihapus dari localStorage

---

## ⚡ KEYBOARD SHORTCUTS (Future)

- `Ctrl+N` - New transaction
- `Ctrl+F` - Search/filter
- `Ctrl+Shift+L` - Go to transaction list
- `Esc` - Cancel current form

*Belum diimplementasikan, tapi bisa ditambahkan di masa depan*

---

## 🐛 TROUBLESHOOTING

### Q: Tier form tidak menyimpan data?
**A:** Check browser console (F12) untuk error. Pastikan localStorage tidak disabled.

### Q: Data tidak muncul di daftar?
**A:** 
- Refresh halaman (F5)
- Check browser localStorage di Developer Tools
- Pastikan form submit berhasil (look for "success" message)

### Q: Surat Tugas masih tidak bisa diakses?
**A:** Routes sudah ditambah di router/index.js. Jika error, clear browser cache:
- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Command+Shift+Delete

### Q: Bagaimana cara backup data?
**A:** 
1. Open browser console (F12 → Console tab)
2. Paste: `copy(localStorage.getItem('ppk_requests'))`
3. Paste di text file dan save (.json)

### Q: Bagaimana cara restore data?
**A:**
1. Open browser console (F12 → Console tab)
2. Paste: `localStorage.setItem('ppk_requests', 'PASTE_YOUR_JSON_HERE')`
3. Refresh halaman

---

## 📞 SUPPORT

Jika ada issue atau pertanyaan:

1. Check dokumentasi: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
2. Check FASE documentation files
3. Look at browser console untuk error messages
4. Check localStorage data di Developer Tools

---

## 🎯 NEXT UP (Future Phases)

- Kepanitiaan (Committee) management
- Document upload & file management  
- Digital signatures
- Email notifications
- Advanced reporting & analytics
- Mobile app

---

**Last Updated:** 2026-02-01  
**Version:** 1.0 - Full Integration  
**Status:** ✅ Production Ready
