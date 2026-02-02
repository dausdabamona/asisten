# INTEGRATION GUIDE - FASE 9: SURAT TUGAS

## 🔌 SETUP & INTEGRATION

### 1. Database Migration

```bash
# Run migration untuk membuat tabel Surat Tugas
npm run migrate:latest

# Atau manual di database:
# Jalankan file: src/main/migrations/005-add-surat-tugas-tables.js
```

### 2. Electron IPC Setup

File sudah terintegrasi di `src/main/api/index.js`. Pastikan:

```javascript
// Di main.js atau window preload, routes sudah terdaftar:
const routes = require('./api/index.js').routes;

// Kemudian register ke IPC:
Object.entries(routes).forEach(([channel, handler]) => {
  ipcMain.handle(channel, async (event, data) => {
    try {
      return await handler(data);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
});
```

### 3. Frontend Store Configuration

Store sudah terbuat di `src/renderer/stores/suratTugasStore.js`. Pastikan Pinia sudah terintegrasi:

```javascript
// Di main.js (sudah ada):
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)
```

### 4. Router Configuration

Router sudah updated di `src/renderer/router/index.js`. Pastikan:

```javascript
// Di main.js (sudah ada):
import router from './router/index.js'
app.use(router)

// Di App.vue (sudah ada):
<router-view v-if="$route.path.startsWith('/transaksi')" />
```

---

## 🧪 TESTING GUIDE

### Unit Test: Nomor ST Generation

```javascript
// Test: Nomor ST harus unique per jenis & tahun
test('Generate nomor surat tugas', async () => {
  const nomor1 = await store.generateNomor('DALAM_KOTA');
  const nomor2 = await store.generateNomor('LUAR_KOTA');
  
  expect(nomor1).toMatch(/^ST-PDK\/\d{4}\/\d{3}$/);
  expect(nomor2).toMatch(/^ST-PLK\/\d{4}\/\d{3}$/);
  expect(nomor1).not.toBe(nomor2);
});
```

### Integration Test: Create Surat Tugas

```javascript
test('Create surat tugas dengan pelaksana', async () => {
  const data = {
    jenis: 'LUAR_KOTA',
    maksud_tujuan: 'Workshop',
    kota_tujuan: 'Jakarta',
    tanggal_berangkat: '2024-03-01',
    tanggal_kembali: '2024-03-05',
    dipa_item_id: 1,
    pelaksana: [
      { pegawai_id: 1, is_ketua: true }
    ]
  };
  
  const result = await store.createST(data);
  
  expect(result.success).toBe(true);
  expect(result.data.nomor).toBeDefined();
  expect(result.data.status).toBe('DRAFT');
});
```

### Integration Test: Calculate Biaya

```javascript
test('Calculate biaya dari SBM', async () => {
  const result = await store.calculateBiaya(
    stId,
    [{ pegawai_id: 1, golongan: 'III/d', eselon: 'III' }],
    sbmData
  );
  
  expect(result.pelaksana[0].biaya.uang_harian).toBeDefined();
  expect(result.pelaksana[0].biaya.penginapan).toBeDefined();
  expect(result.pelaksana[0].biaya.transport).toBeDefined();
  expect(result.total).toBeGreaterThan(0);
});
```

### E2E Test: Complete Workflow

```javascript
test('Complete workflow: Create -> Update -> Pertanggungjawaban', async () => {
  // 1. Create ST
  const st = await store.createST(stData);
  expect(st.data.status).toBe('DRAFT');
  
  // 2. Add pelaksana
  await store.addPelaksana(st.data.id, pelaksanaData);
  
  // 3. Calculate biaya
  await store.calculateBiaya(st.data.id, pelaksanaList, sbmData);
  
  // 4. Update status to DISETUJUI
  await store.updateST(st.data.id, { status: 'DISETUJUI' });
  
  // 5. Add bukti perjalanan
  await store.addBukti(st.data.id, buktiData);
  
  // 6. Update pertanggungjawaban
  await store.updatePertanggungjawaban(st.data.id, {
    ringkasan_hasil: 'Workshop berhasil diselenggarakan',
    bukti: [buktiData]
  });
  
  // 7. Verify final status
  const final = await store.getById(st.data.id);
  expect(final.status).toBe('PEMBAYARAN');
});
```

---

## 🔍 MANUAL TESTING CHECKLIST

### Basic CRUD
- [ ] Navigate ke `/transaksi/st`
- [ ] Click "Tambah Surat Tugas"
- [ ] Fill form dengan data lengkap
- [ ] Verify nomor ST di-generate otomatis
- [ ] Click "Simpan"
- [ ] Verify redirect ke detail page
- [ ] Click "Edit" (pastikan status DRAFT)
- [ ] Modify data
- [ ] Click "Update"
- [ ] Verify perubahan tersimpan
- [ ] Go back to list
- [ ] Delete draft ST
- [ ] Verify dihapus dari list

### Advanced Features
- [ ] Add multiple pelaksana
- [ ] Verify biaya breakdown per pelaksana
- [ ] Calculate biaya from SBM
- [ ] Add multi-destinasi rute
- [ ] Change status ke DISETUJUI
- [ ] Upload bukti perjalanan
- [ ] Test GPS tagging dengan "Use Current Location"
- [ ] Input pertanggungjawaban
- [ ] Generate Kwitansi
- [ ] Download PDF dokumen

### Filters & Search
- [ ] Filter by jenis (Dalam Kota/Luar Kota/Luar Provinsi)
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Search by nomor ST
- [ ] Search by nama pelaksana
- [ ] Search by tujuan
- [ ] Test pagination

### Data Validation
- [ ] Submit form tanpa maksud tujuan (should fail)
- [ ] Submit form tanpa pelaksana (should allow, add later)
- [ ] Upload file > 10MB (should fail)
- [ ] Add duplikasi pelaksana (should prevent)
- [ ] Set tanggal kembali < tanggal berangkat (should fail)

---

## 📊 API RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nomor": "ST-PLK/2024/001",
    "status": "DRAFT",
    ...
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation error message",
  "code": "VALIDATION_ERROR"
}
```

### List Response
```json
{
  "success": true,
  "data": [
    { ... },
    { ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

## 🛠️ TROUBLESHOOTING

### Issue: Routes not working
**Solution**: 
1. Verify router is properly imported in main.js
2. Check App.vue has `<router-view />` component
3. Ensure vue-router package is installed

### Issue: IPC channels not found
**Solution**:
1. Verify suratTugasApi.js is imported in index.js
2. Check all routes are properly registered in index.js
3. Verify IPC handlers are setup in main process

### Issue: Store not working
**Solution**:
1. Verify Pinia is imported and used in main.js
2. Check store file is in correct location (stores/suratTugasStore.js)
3. Ensure imports in views are correct

### Issue: Calculation not working
**Solution**:
1. Verify SBM data is loaded correctly
2. Check pelaksana golongan is provided
3. Verify date calculation logic (lama_hari must be > 0)

### Issue: File upload fails
**Solution**:
1. Check file size < 10MB
2. Verify upload directory permissions
3. Ensure supported file types (PDF, DOC, DOCX, JPG, PNG, GIF)

---

## 📝 IMPLEMENTATION CHECKLIST FOR DEVELOPER

### Database
- [x] Create migration file
- [x] Define all 7 tables
- [x] Add proper indexes & constraints
- [x] Add default values

### Backend API
- [x] Create suratTugasApi.js
- [x] Implement all CRUD methods
- [x] Add calculation logic
- [x] Add validation
- [x] Register routes in index.js

### Frontend Store
- [x] Create suratTugasStore.js
- [x] Define state, getters, actions
- [x] Implement filter & pagination
- [x] Add error handling

### Views
- [x] Create STListView.vue
- [x] Create STFormView.vue
- [x] Create STDetailView.vue
- [x] Create STPertanggungjawabanView.vue

### Components
- [x] Create PelaksanaModal.vue
- [x] Create RuteModal.vue
- [x] Create BuktiUploadModal.vue

### Router
- [x] Create router/index.js
- [x] Define all routes
- [x] Update main.js
- [x] Update App.vue

### Integration
- [x] Update api/index.js
- [ ] Connect with auth system (TODO)
- [ ] Connect with SBM database (TODO)
- [ ] Connect with Pegawai database (TODO)
- [ ] Connect with DIPA database (TODO)

---

## 🎓 KEY LEARNING POINTS

1. **Multi-Step Forms** - Implemented dengan active tab system
2. **Modal Components** - Reusable modal untuk add/edit operations
3. **Dynamic Calculations** - Real-time biaya calculation
4. **File Upload** - With validation & GPS tagging
5. **Status Workflow** - Linear status progression dengan audit log
6. **Settlement Logic** - Calculate differences & generate documents

---

## 📚 REFERENCES

- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- Pinia Store: https://pinia.vuejs.org/
- Electron IPC: https://www.electronjs.org/docs/latest/api/ipc-main
- Tailwind CSS: https://tailwindcss.com/

---

**Last Updated**: February 1, 2026
**Status**: Ready for Integration Testing
