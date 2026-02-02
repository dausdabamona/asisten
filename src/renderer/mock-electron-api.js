/**
 * Mock Electron API for Browser Development
 * Provides fallback when running in regular browser (not Electron)
 */

// Load data from localStorage or use defaults
const loadMockData = () => {
  const stored = localStorage.getItem('ppk-mock-data');
  if (stored) {
    try {
      console.log('🔧 MOCK: Loading data from localStorage');
      return JSON.parse(stored);
    } catch (e) {
      console.warn('🔧 MOCK: Failed to parse stored data', e);
    }
  }
  return {
    pegawai: [],
    dipa: {
      headers: [],  // DIPA documents (nomor DIPA, tahun, satker)
      revisions: [], // DIPA revisions (revisi 0, 1, 2, etc)
      items: []     // DIPA items/rincian (kode akun, uraian, volume, harga)
    },
    formulirPermintaan: [], // Formulir Permintaan data
    satker: { kode_satker: '634146', nama_satker: 'Politeknik KP Sorong' },
    suppliers: [],
    sbm: { tahun: [] }
  };
};

// Save data to localStorage
const saveMockData = () => {
  try {
    localStorage.setItem('ppk-mock-data', JSON.stringify(mockData));
    console.log('💾 MOCK: Data saved to localStorage');
  } catch (e) {
    console.error('💾 MOCK: Failed to save data', e);
  }
};

// Mock data storage (persisted to localStorage)
const mockData = loadMockData();

// Helper to simulate async IPC
const mockInvoke = (handler) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = handler();
      resolve(result);
    }, 100);
  });
};

// Mock Electron API
export const mockElectronAPI = {
  // ==================== Satker API ====================
  satker: {
    list: (params = {}) => mockInvoke(() => ({
      success: true,
      data: [mockData.satker],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 100,
        total: 1,
        totalPages: 1
      }
    })),
    get: () => mockInvoke(() => ({ success: true, data: mockData.satker })),
    create: (data) => mockInvoke(() => {
      mockData.satker = { ...mockData.satker, ...data, id: '1' };
      saveMockData();
      console.log('🔧 MOCK: Created satker', mockData.satker);
      return { success: true, data: mockData.satker };
    }),
    update: (id, data) => mockInvoke(() => {
      mockData.satker = { ...mockData.satker, ...data };
      saveMockData();
      console.log('🔧 MOCK: Updated satker', mockData.satker);
      return { success: true, data: mockData.satker };
    })
  },

  // ==================== Pegawai API ====================
  pegawai: {
    list: (params = {}) => mockInvoke(() => ({
      success: true,
      data: mockData.pegawai,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: mockData.pegawai.length,
        totalPages: Math.ceil(mockData.pegawai.length / (params.limit || 10))
      }
    })),
    get: (id) => mockInvoke(() => ({
      success: true,
      data: mockData.pegawai.find(p => p.id === id)
    })),
    create: (data) => mockInvoke(() => {
      const newPegawai = { id: Date.now().toString(), ...data };
      mockData.pegawai.push(newPegawai);
      saveMockData();
      return { success: true, data: newPegawai };
    }),
    update: (id, data) => mockInvoke(() => {
      const index = mockData.pegawai.findIndex(p => p.id === id);
      if (index !== -1) {
        mockData.pegawai[index] = { ...mockData.pegawai[index], ...data };
        saveMockData();
        return { success: true, data: mockData.pegawai[index] };
      }
      return { success: false, error: 'Not found' };
    }),
    delete: (id) => mockInvoke(() => {
      const index = mockData.pegawai.findIndex(p => p.id === id);
      if (index !== -1) {
        mockData.pegawai.splice(index, 1);
        saveMockData();
        return { success: true };
      }
      return { success: false, error: 'Not found' };
    }),
    importCsv: (content) => mockInvoke(() => {
      console.log('🔧 MOCK: Importing', content.length, 'pegawai records to memory');
      
      // Prevent duplicates by NIP
      const existingNips = new Set(mockData.pegawai.map(p => p.nip));
      const newRecords = content.filter(p => !existingNips.has(p.nip));
      const skipped = content.length - newRecords.length;
      
      mockData.pegawai = [...mockData.pegawai, ...newRecords];
      saveMockData(); // Persist to localStorage
      
      console.log(`🔧 MOCK: Imported ${newRecords.length}, skipped ${skipped} duplicates`);
      
      return {
        success: true,
        imported: newRecords.length,
        skipped: skipped,
        data: { success: newRecords.length, failed: 0, errors: [] }
      };
    }),
    exportCsv: () => mockInvoke(() => ({
      success: true,
      data: 'NIP,Nama,Jabatan,Golongan\n' // Minimal CSV
    }))
  },

  // ==================== DIPA API ====================
  dipa: {
    // DIPA Header CRUD
    list: (params = {}) => mockInvoke(() => ({
      success: true,
      data: mockData.dipa.headers,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: mockData.dipa.headers.length,
        totalPages: Math.ceil(mockData.dipa.headers.length / (params.limit || 10))
      }
    })),
    get: (id) => mockInvoke(() => ({
      success: true,
      data: mockData.dipa.headers.find(d => d.id === id)
    })),
    create: (data) => mockInvoke(() => {
      const newDipa = { 
        id: Date.now().toString(), 
        ...data,
        created_at: new Date().toISOString()
      };
      mockData.dipa.headers.push(newDipa);
      
      // Auto-create Revisi 0
      const revisi0 = {
        id: `rev-${Date.now()}`,
        dipa_id: newDipa.id,
        nomor_revisi: 0,
        tanggal_revisi: new Date().toISOString(),
        keterangan: 'DIPA Awal',
        is_active: true,
        created_at: new Date().toISOString()
      };
      mockData.dipa.revisions.push(revisi0);
      
      console.log('🔧 MOCK: Created DIPA header and Revisi 0', { dipa: newDipa, revisi: revisi0 });
      return { success: true, data: newDipa };
    }),
    update: (id, data) => mockInvoke(() => {
      const index = mockData.dipa.headers.findIndex(d => d.id === id);
      if (index !== -1) {
        mockData.dipa.headers[index] = { ...mockData.dipa.headers[index], ...data };
        return { success: true, data: mockData.dipa.headers[index] };
      }
      return { success: false, error: 'Not found' };
    }),
    delete: (id) => mockInvoke(() => {
      console.log('🔧 MOCK: Deleting DIPA ID:', id);
      
      const index = mockData.dipa.headers.findIndex(d => d.id === id);
      if (index !== -1) {
        // Get all revisions related to this DIPA BEFORE deleting
        const revisiIdsToDelete = mockData.dipa.revisions
          .filter(r => r.dipa_id === id)
          .map(r => r.id);
        
        console.log('🔧 MOCK: Found revisions to delete:', revisiIdsToDelete);
        
        // Delete all items from these revisions
        const itemsBefore = mockData.dipa.items.length;
        mockData.dipa.items = mockData.dipa.items.filter(i => !revisiIdsToDelete.includes(i.revisi_id));
        const itemsDeleted = itemsBefore - mockData.dipa.items.length;
        
        console.log(`🔧 MOCK: Deleted ${itemsDeleted} items`);
        
        // Delete revisions
        mockData.dipa.revisions = mockData.dipa.revisions.filter(r => r.dipa_id !== id);
        
        // Delete DIPA header
        mockData.dipa.headers.splice(index, 1);
        
        saveMockData();
        
        console.log(`🔧 MOCK: DIPA deleted. Remaining: ${mockData.dipa.headers.length} headers, ${mockData.dipa.revisions.length} revisions, ${mockData.dipa.items.length} items`);
        
        return { success: true };
      }
      return { success: false, error: 'Not found' };
    }),
    
    // DIPA Revisi
    revisiList: (dipaId) => mockInvoke(() => ({
      success: true,
      data: mockData.dipa.revisions.filter(r => r.dipa_id === dipaId)
    })),
    revisiUpload: (params, dataArg) => mockInvoke(() => {
      let dipaId;
      let data;
      if (params && typeof params === 'object' && 'dipaId' in params) {
        dipaId = params.dipaId;
        data = params.data;
      } else {
        dipaId = params;
        data = dataArg;
      }
      
      // Validate input
      if (!dipaId) {
        return { success: false, error: 'DIPA ID diperlukan' };
      }
      if (!data) {
        return { success: false, error: 'Data revisi diperlukan' };
      }
      if (data && (data.nomor_revisi === undefined || data.nomor_revisi === null)) {
        const existingNumbers = mockData.dipa.revisions
          .filter(r => r.dipa_id === dipaId)
          .map(r => Number(r.nomor_revisi) || 0);
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        data.nomor_revisi = nextNumber;
      }
      if (!data.tanggal_revisi) {
        return { success: false, error: 'Tanggal revisi diperlukan' };
      }
      
      // Check if this revision number already exists
      const existing = mockData.dipa.revisions.find(
        r => r.dipa_id === dipaId && r.nomor_revisi === data.nomor_revisi
      );
      if (existing) {
        return { success: false, error: `Revisi ${data.nomor_revisi} sudah ada` };
      }
      
      // Hitung total pagu dan jumlah item dari data.items atau gunakan yang dikirim
      let totalPagu = data.total_pagu || 0;
      let itemCount = data.total_item || 0;
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        itemCount = data.items.length;
        totalPagu = data.items.reduce((sum, item) => {
          const pagu = parseFloat(item.pagu) || parseFloat(item.nilai_pagu) || 0;
          return sum + pagu;
        }, 0);
      }
      
      const newRevisi = {
        id: `rev-${Date.now()}-${Math.random()}`,
        dipa_id: dipaId,
        nomor_revisi: parseInt(data.nomor_revisi),
        tanggal_revisi: data.tanggal_revisi,
        jenis_revisi: data.jenis_revisi || 'revisi',
        keterangan: data.keterangan || '',
        total_pagu: totalPagu,
        item_count: itemCount,
        is_active: false,
        created_at: new Date().toISOString()
      };
      
      mockData.dipa.revisions.push(newRevisi);
      
      // Simpan items ke storage jika ada
      if (data.items && Array.isArray(data.items)) {
        if (!mockData.dipa.items) {
          mockData.dipa.items = [];
        }
        // Simpan items dengan referensi ke revisi
        data.items.forEach((item, index) => {
          mockData.dipa.items.push({
            ...item,
            id: `item-${Date.now()}-${index}`,
            revisi_id: newRevisi.id,
            dipa_id: dipaId
          });
        });
      }
      saveMockData();
      
      console.log('🔧 MOCK: Created revisi', newRevisi);
      
      return { success: true, data: newRevisi };
    }),
    revisiSetActive: (params) => mockInvoke(() => {
      const { dipaId, revisiId } = params;
      
      // Deactivate all revisions for this DIPA
      mockData.dipa.revisions.forEach(r => {
        if (r.dipa_id === dipaId) r.is_active = false;
      });
      
      // Activate the selected one
      const revisi = mockData.dipa.revisions.find(r => r.id === revisiId);
      if (revisi) {
        revisi.is_active = true;
        
        // Update DIPA header with data from active revision
        const dipaIndex = mockData.dipa.headers.findIndex(d => d.id === dipaId);
        if (dipaIndex !== -1) {
          mockData.dipa.headers[dipaIndex].total_pagu = revisi.total_pagu || 0;
          mockData.dipa.headers[dipaIndex].item_count = revisi.item_count || 0;
          // Extract tahun from tanggal_revisi if not set
          if (!mockData.dipa.headers[dipaIndex].tahun_anggaran && revisi.tanggal_revisi) {
            const year = new Date(revisi.tanggal_revisi).getFullYear();
            mockData.dipa.headers[dipaIndex].tahun_anggaran = year;
          }
          console.log('🔧 MOCK: Updated DIPA header with revisi data', mockData.dipa.headers[dipaIndex]);
        }
        
        saveMockData();
        console.log('🔧 MOCK: Set revisi aktif', revisi.nomor_revisi);
        return { success: true };
      }
      
      return { success: false, error: 'Revisi tidak ditemukan' };
    }),
    revisiDelete: (params) => mockInvoke(() => {
      const { revisiId } = params;
      
      const revisiIndex = mockData.dipa.revisions.findIndex(r => r.id === revisiId);
      if (revisiIndex === -1) {
        return { success: false, error: 'Revisi tidak ditemukan' };
      }
      
      // Cannot delete if it's the only revision for this DIPA
      const revisi = mockData.dipa.revisions[revisiIndex];
      const dipasRevisions = mockData.dipa.revisions.filter(r => r.dipa_id === revisi.dipa_id);
      
      if (dipasRevisions.length === 1) {
        return { success: false, error: 'Tidak boleh menghapus revisi terakhir dari DIPA' };
      }
      
      // Delete items from this revision
      const itemsBefore = mockData.dipa.items.length;
      mockData.dipa.items = mockData.dipa.items.filter(i => i.revisi_id !== revisiId);
      const itemsDeleted = itemsBefore - mockData.dipa.items.length;
      
      // Delete the revision
      mockData.dipa.revisions.splice(revisiIndex, 1);
      
      saveMockData();
      
      console.log(`🔧 MOCK: Revisi dihapus. Items dihapus: ${itemsDeleted}`);
      
      return { success: true };
    }),
    
    // DIPA Items
    itemsList: (params) => mockInvoke(() => {
      const normalizeNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        const raw = String(value).trim();
        if (!raw) return 0;
        const cleaned = raw.replace(/\s+/g, '').replace(/\.(?=\d{3}(\D|$))/g, '');
        const normalized = cleaned.replace(/,/g, '.');
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const getField = (item, keys) => {
        for (const key of keys) {
          if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') {
            return item[key];
          }
        }
        return null;
      };

      const normalizeItem = (item) => {
        const volumeRaw = getField(item, ['volume', 'VOLKEG', 'VOL_KEG_1', 'VOLUME', 'VOLKEG_1']);
        const satuanRaw = getField(item, ['satuan', 'SATKEG', 'SAT_KEG_1', 'SATKEG_1']);
        const hargaRaw = getField(item, ['harga_satuan', 'HARGASAT', 'HARGA_SAT', 'HARGA_SATUAN']);
        const totalRaw = getField(item, ['total', 'TOTAL']);

        const normalized = {
          ...item,
          kode_program: item.kode_program ?? item.KODE_PROGRAM ?? null,
          kode_kegiatan: item.kode_kegiatan ?? item.KODE_KEGIATAN ?? null,
          kode_output: item.kode_output ?? item.KODE_OUTPUT ?? null,
          kode_akun: item.kode_akun ?? item.KODE_AKUN ?? null,
          uraian_item: item.uraian_item ?? item.URAIAN_ITEM ?? item.uraian ?? item.URAIAN ?? null
        };

        if (normalized.volume === undefined || normalized.volume === null || normalized.volume === '') {
          normalized.volume = normalizeNumber(volumeRaw);
        }
        if (!normalized.satuan) {
          normalized.satuan = satuanRaw ? String(satuanRaw).trim() : null;
        }
        if (normalized.harga_satuan === undefined || normalized.harga_satuan === null || normalized.harga_satuan === '') {
          normalized.harga_satuan = normalizeNumber(hargaRaw);
        }
        if (normalized.total === undefined || normalized.total === null || normalized.total === '') {
          const totalParsed = normalizeNumber(totalRaw);
          normalized.total = totalParsed || (normalizeNumber(volumeRaw) * normalizeNumber(hargaRaw));
        }

        return normalized;
      };

      return {
        success: true,
        data: mockData.dipa.items
          .filter(i => (params.revisiId ? i.revisi_id === params.revisiId : true))
          .map(normalizeItem)
      };
    }),
    itemsHierarki: (revisiId) => mockInvoke(() => {
      const normalizeNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        const raw = String(value).trim();
        if (!raw) return 0;
        const cleaned = raw.replace(/\s+/g, '').replace(/\.(?=\d{3}(\D|$))/g, '');
        const normalized = cleaned.replace(/,/g, '.');
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const getField = (item, keys) => {
        for (const key of keys) {
          if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') {
            return item[key];
          }
        }
        return null;
      };

      const normalizeItem = (item) => {
        const volumeRaw = getField(item, ['volume', 'VOLKEG', 'VOL_KEG_1', 'VOLUME', 'VOLKEG_1']);
        const satuanRaw = getField(item, ['satuan', 'SATKEG', 'SAT_KEG_1', 'SATKEG_1']);
        const hargaRaw = getField(item, ['harga_satuan', 'HARGASAT', 'HARGA_SAT', 'HARGA_SATUAN']);
        const totalRaw = getField(item, ['total', 'TOTAL']);

        const normalized = {
          ...item,
          kode_program: item.kode_program ?? item.KODE_PROGRAM ?? null,
          kode_kegiatan: item.kode_kegiatan ?? item.KODE_KEGIATAN ?? null,
          kode_output: item.kode_output ?? item.KODE_OUTPUT ?? null,
          kode_akun: item.kode_akun ?? item.KODE_AKUN ?? null,
          uraian_item: item.uraian_item ?? item.URAIAN_ITEM ?? item.uraian ?? item.URAIAN ?? null
        };

        if (normalized.volume === undefined || normalized.volume === null || normalized.volume === '') {
          normalized.volume = normalizeNumber(volumeRaw);
        }
        if (!normalized.satuan) {
          normalized.satuan = satuanRaw ? String(satuanRaw).trim() : null;
        }
        if (normalized.harga_satuan === undefined || normalized.harga_satuan === null || normalized.harga_satuan === '') {
          normalized.harga_satuan = normalizeNumber(hargaRaw);
        }
        if (normalized.total === undefined || normalized.total === null || normalized.total === '') {
          const totalParsed = normalizeNumber(totalRaw);
          normalized.total = totalParsed || (normalizeNumber(volumeRaw) * normalizeNumber(hargaRaw));
        }

        return normalized;
      };

      return {
        success: true,
        data: mockData.dipa.items.filter(i => i.revisi_id === revisiId).map(normalizeItem)
      };
    }),
    itemsSisaPagu: (itemId) => mockInvoke(() => {
      const item = mockData.dipa.items.find(i => i.id === itemId);
      return { success: true, data: item?.total || 0 };
    }),
    
    parseCSV: (content) => mockInvoke(() => {
      if (!content || typeof content !== 'string') {
        return { items: [], totalItems: 0, totalPagu: 0, programSummary: {}, akunSummary: {}, headers: [] };
      }

      const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) {
        return { items: [], totalItems: 0, totalPagu: 0, programSummary: {}, akunSummary: {}, headers: [] };
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, '').toUpperCase());

      // Define field mappings for common DIPA CSV formats
      const fieldMappings = {
        kode_akun: ['KODE_AKUN', 'KDAKUN', 'MAK', 'AKUN'],
        kode_program: ['KODE_PROGRAM', 'KDPROGRAM', 'PROGRAM'],
        kode_kegiatan: ['KODE_KEGIATAN', 'KDGIAT', 'KEGIATAN'],
        kode_output: ['KODE_OUTPUT', 'KDOUTPUT', 'OUTPUT'],
        kode_komponen: ['KODE_KOMPONEN', 'KDKOMP', 'KOMPONEN'],
        kode_sub_komponen: ['KODE_SUBKOMPONEN', 'KDSUBKOMP', 'SUBKOMPONEN'],
        uraian_item: ['URAIAN_ITEM', 'URAIAN', 'DESKRIPSI', 'NAMA'],
        volume: ['VOLUME', 'VOLKEG', 'VOL_KEG_1', 'VOLKEG_1'],
        satuan: ['SATUAN', 'SATKEG', 'SAT_KEG_1', 'SATKEG_1'],
        harga_satuan: ['HARGA_SATUAN', 'HARGASAT', 'HARGA_SAT', 'HARGA'],
        total: ['TOTAL', 'JUMLAH', 'NILAI', 'PAGU']
      };

      // Find column indices
      const indices = {};
      for (const [field, aliases] of Object.entries(fieldMappings)) {
        indices[field] = headers.findIndex(h => aliases.includes(h));
      }

      const items = [];
      let totalPagu = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/['"]/g, ''));
        
        const kodeAkun = indices.kode_akun >= 0 ? values[indices.kode_akun] : '';
        if (!kodeAkun) continue;
        
        const totalRaw = indices.total >= 0 ? values[indices.total] : '0';
        const total = Number(String(totalRaw).replace(/\./g, '').replace(/,/g, '.')) || 0;
        
        const item = {
          kode_akun: kodeAkun,
          kode_program: indices.kode_program >= 0 ? values[indices.kode_program] : null,
          kode_kegiatan: indices.kode_kegiatan >= 0 ? values[indices.kode_kegiatan] : null,
          kode_output: indices.kode_output >= 0 ? values[indices.kode_output] : null,
          kode_komponen: indices.kode_komponen >= 0 ? values[indices.kode_komponen] : null,
          kode_sub_komponen: indices.kode_sub_komponen >= 0 ? values[indices.kode_sub_komponen] : null,
          uraian_item: indices.uraian_item >= 0 ? values[indices.uraian_item] : null,
          volume: indices.volume >= 0 ? Number(String(values[indices.volume]).replace(/\./g, '').replace(/,/g, '.')) || 0 : 0,
          satuan: indices.satuan >= 0 ? values[indices.satuan] : null,
          harga_satuan: indices.harga_satuan >= 0 ? Number(String(values[indices.harga_satuan]).replace(/\./g, '').replace(/,/g, '.')) || 0 : 0,
          total
        };
        
        items.push(item);
        totalPagu += total;
      }

      const programSummary = {};
      const akunSummary = {};
      items.forEach(item => {
        const program = item.kode_program || 'UNKNOWN';
        if (!programSummary[program]) programSummary[program] = { count: 0, total: 0 };
        programSummary[program].count++;
        programSummary[program].total += item.total || 0;

        const akun = item.kode_akun?.substring(0, 2) || 'XX';
        if (!akunSummary[akun]) akunSummary[akun] = { count: 0, total: 0 };
        akunSummary[akun].count++;
        akunSummary[akun].total += item.total || 0;
      });

      return {
        items,
        totalItems: items.length,
        totalPagu,
        programSummary,
        akunSummary,
        headers
      };
    }),
    
    // Import CSV - Requires revisi_id or creates Revisi 0 if none exists
    importCsv: (content, options = {}) => mockInvoke(() => {
      console.log('🔧 MOCK: Importing', content.length, 'DIPA records to memory');
      console.log('🔧 MOCK: Import options:', options);
      
      if (!content || content.length === 0) {
        return { success: false, error: 'No data to import' };
      }
      
      // Get target revisi_id from options or use active revision
      let targetRevisi = null;
      
      if (options.revisi_id) {
        // Use specified revision
        targetRevisi = mockData.dipa.revisions.find(r => r.id === options.revisi_id);
        if (!targetRevisi) {
          return { success: false, error: `Revisi dengan ID ${options.revisi_id} tidak ditemukan` };
        }
      } else {
        // Find active revision or create Revisi 0
        // First, check if there's a DIPA header
        let dipaHeader = mockData.dipa.headers[0];
        if (!dipaHeader) {
          dipaHeader = {
            id: `dipa-${Date.now()}`,
            tahun_anggaran: options.tahun_anggaran || new Date().getFullYear(),
            nomor_dipa: options.nomor_dipa || `DIPA-${mockData.satker.kode_satker}-${new Date().getFullYear()}`,
            tanggal_dipa: options.tanggal_dipa || new Date().toISOString(),
            kdsatker: mockData.satker.kode_satker,
            nama_satker: mockData.satker.nama_satker,
            created_at: new Date().toISOString()
          };
          mockData.dipa.headers.push(dipaHeader);
          console.log('🔧 MOCK: Created DIPA header', dipaHeader);
        }
        
        // Find active revision
        targetRevisi = mockData.dipa.revisions.find(r => r.is_active && r.dipa_id === dipaHeader.id);
        
        // If no active revision, create Revisi 0
        if (!targetRevisi) {
          targetRevisi = {
            id: `rev-${Date.now()}`,
            dipa_id: dipaHeader.id,
            nomor_revisi: 0,
            tanggal_revisi: new Date().toISOString(),
            keterangan: 'DIPA Awal',
            is_active: true,
            created_at: new Date().toISOString()
          };
          mockData.dipa.revisions.push(targetRevisi);
          console.log('🔧 MOCK: Created Revisi 0', targetRevisi);
        }
      }
      
      console.log('🔧 MOCK: Importing to Revisi', targetRevisi.nomor_revisi);
      
      // Import items into target revision
      const existingKeys = new Set(
        mockData.dipa.items
          .filter(i => i.revisi_id === targetRevisi.id)
          .map(d => `${d.kode_akun || ''}-${d.uraian_item || ''}`)
      );
      
      const newRecords = content.filter(d => {
        const key = `${d.kode_akun || ''}-${d.uraian_item || ''}`;
        return !existingKeys.has(key);
      });
      
      const skipped = content.length - newRecords.length;
      
      const normalizeNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        const raw = String(value).trim();
        if (!raw) return 0;
        // Remove spaces and thousands separators, handle comma decimals
        const cleaned = raw.replace(/\s+/g, '').replace(/\.(?=\d{3}(\D|$))/g, '');
        const normalized = cleaned.replace(/,/g, '.');
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const getField = (item, keys) => {
        for (const key of keys) {
          if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') {
            return item[key];
          }
        }
        return null;
      };

      // Add items to target revision
      const itemsWithIds = newRecords.map((item, index) => {
        const volumeRaw = getField(item, ['volume', 'VOLKEG', 'VOL_KEG_1', 'VOLUME', 'VOLKEG_1']);
        const satuanRaw = getField(item, ['satuan', 'SATKEG', 'SAT_KEG_1', 'SATKEG_1']);
        const hargaRaw = getField(item, ['harga_satuan', 'HARGASAT', 'HARGA_SAT', 'HARGA_SATUAN']);
        const totalRaw = getField(item, ['total', 'TOTAL']);

        return {
        id: `item-${Date.now()}-${index}`,
        revisi_id: targetRevisi.id,
        kode_program: item.kode_program || null,
        kode_kegiatan: item.kode_kegiatan || null,
        kode_output: item.kode_output || null,
        kode_suboutput: item.kode_suboutput || null,
        kode_komponen: item.kode_komponen || null,
        kode_subkomponen: item.kode_subkomponen || null,
        kode_akun: item.kode_akun || null,
        uraian_item: item.uraian_item || item.uraian || null,
        volume: normalizeNumber(volumeRaw),
        satuan: satuanRaw ? String(satuanRaw).trim() : null,
        harga_satuan: normalizeNumber(hargaRaw),
        total: normalizeNumber(totalRaw) || (normalizeNumber(volumeRaw) * normalizeNumber(hargaRaw)),
        created_at: new Date().toISOString()
        };
      });
      
      mockData.dipa.items = [...mockData.dipa.items, ...itemsWithIds];
      saveMockData();
      
      console.log(`🔧 MOCK: Imported ${newRecords.length} items to Revisi ${targetRevisi.nomor_revisi}, skipped ${skipped} duplicates`);
      console.log(`🔧 MOCK: Total items in Revisi ${targetRevisi.nomor_revisi}: ${mockData.dipa.items.filter(i => i.revisi_id === targetRevisi.id).length}`);
      
      return {
        success: true,
        imported: newRecords.length,
        skipped: skipped,
        data: { 
          success: newRecords.length, 
          failed: 0, 
          errors: [],
          dipa_id: targetRevisi.dipa_id || mockData.dipa.headers[0]?.id,
          revisi_id: targetRevisi.id,
          nomor_revisi: targetRevisi.nomor_revisi
        }
      };
    }),

    cleanupItems: (params = {}) => mockInvoke(() => {
      const { revisiId } = params;
      const before = mockData.dipa.items.length;

      const shouldKeep = (item) => {
        const hasCore = Boolean(
          (item.kode_akun ?? item.KODE_AKUN) ||
          (item.uraian_item ?? item.URAIAN_ITEM ?? item.uraian ?? item.URAIAN)
        );

        const volume = Number(item.volume ?? item.VOLKEG ?? item.VOL_KEG_1 ?? 0) || 0;
        const total = Number(item.total ?? item.TOTAL ?? 0) || 0;

        return hasCore && (volume > 0 || total > 0);
      };

      mockData.dipa.items = mockData.dipa.items.filter(item => {
        if (revisiId && item.revisi_id !== revisiId) return true;
        return shouldKeep(item);
      });

      const removed = before - mockData.dipa.items.length;
      saveMockData();

      return { success: true, removed };
    }),
    
    exportCsv: () => mockInvoke(() => ({
      success: true,
      data: 'Kode Akun,Uraian,Volume,Satuan,Harga Satuan,Total\n'
    }))
  },

  // ==================== Supplier API ====================
  supplier: {
    list: () => mockInvoke(() => ({ success: true, data: mockData.suppliers })),
    get: (id) => mockInvoke(() => ({
      success: true,
      data: mockData.suppliers.find(s => s.id === id)
    })),
    create: (data) => mockInvoke(() => {
      const newSupplier = { id: Date.now().toString(), ...data };
      mockData.suppliers.push(newSupplier);
      return { success: true, data: newSupplier };
    }),
    update: (id, data) => mockInvoke(() => ({ success: true })),
    delete: (id) => mockInvoke(() => ({ success: true })),
    search: () => mockInvoke(() => ({ success: true, data: [] }))
  },

  // ==================== Pejabat API ====================
  pejabat: {
    list: () => mockInvoke(() => ({ success: true, data: [] })),
    create: (data) => mockInvoke(() => ({ success: true, data })),
    update: (id, data) => mockInvoke(() => ({ success: true })),
    delete: (id) => mockInvoke(() => ({ success: true }))
  },

  // ==================== Unit Kerja API ====================
  unitKerja: {
    list: () => mockInvoke(() => ({ success: true, data: [] })),
    create: (data) => mockInvoke(() => ({ success: true, data })),
    update: (id, data) => mockInvoke(() => ({ success: true })),
    delete: (id) => mockInvoke(() => ({ success: true }))
  },

  // ==================== SBM API ====================
  sbm: {
    tahunList: () => mockInvoke(() => ({ success: true, data: mockData.sbm.tahun })),
    tahunGet: (id) => mockInvoke(() => ({ success: true, data: {} })),
    tahunCreate: (data) => mockInvoke(() => ({ success: true, data })),
    tahunUpdate: (id, data) => mockInvoke(() => ({ success: true })),
    tahunDelete: (id) => mockInvoke(() => ({ success: true })),
    tahunSetActive: (id) => mockInvoke(() => ({ success: true })),
    uangHarianList: () => mockInvoke(() => ({ success: true, data: [] })),
    uangHarianCreate: (data) => mockInvoke(() => ({ success: true, data })),
    uangHarianUpdate: (id, data) => mockInvoke(() => ({ success: true })),
    uangHarianDelete: (id) => mockInvoke(() => ({ success: true })),
    transportList: () => mockInvoke(() => ({ success: true, data: [] })),
    transportCreate: (data) => mockInvoke(() => ({ success: true, data })),
    transportUpdate: (id, data) => mockInvoke(() => ({ success: true })),
    transportDelete: (id) => mockInvoke(() => ({ success: true })),
    penginapanList: () => mockInvoke(() => ({ success: true, data: [] })),
    penginapanCreate: (data) => mockInvoke(() => ({ success: true, data })),
    penginapanUpdate: (id, data) => mockInvoke(() => ({ success: true })),
    penginapanDelete: (id) => mockInvoke(() => ({ success: true }))
  },

  // ==================== Lembar Permintaan API ====================
  lp: {
    list: () => mockInvoke(() => ({ success: true, data: [] })),
    get: (id) => mockInvoke(() => ({ success: true, data: {} })),
    create: (data) => mockInvoke(() => ({ success: true, data })),
    update: (id, data) => mockInvoke(() => ({ success: true })),
    delete: (id) => mockInvoke(() => ({ success: true })),
    updateStatus: (id, status) => mockInvoke(() => ({ success: true })),
    generateDocument: (id) => mockInvoke(() => ({ success: true, data: { path: '/mock/document.pdf' } }))
  },

  // ==================== Formulir Permintaan API ====================
  formulirPermintaan: {
    list: (params = {}) => mockInvoke(() => {
      // Ensure array exists
      if (!mockData.formulirPermintaan) {
        mockData.formulirPermintaan = [];
      }
      return {
        success: true,
        data: mockData.formulirPermintaan,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 50,
          total: mockData.formulirPermintaan.length,
          totalPages: Math.ceil(mockData.formulirPermintaan.length / (params.limit || 50))
        }
      };
    }),
    get: (id) => mockInvoke(() => {
      if (!mockData.formulirPermintaan) mockData.formulirPermintaan = [];
      const fp = mockData.formulirPermintaan.find(f => f.id === id);
      return { success: true, data: fp };
    }),
    create: (data) => mockInvoke(() => {
      if (!mockData.formulirPermintaan) mockData.formulirPermintaan = [];
      
      // Generate nomor if not provided
      if (!data.nomor) {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const thisMonthData = mockData.formulirPermintaan.filter(fp => {
          const fpDate = new Date(fp.created_at);
          return fpDate.getMonth() === now.getMonth() && fpDate.getFullYear() === now.getFullYear();
        });
        const nextNum = String(thisMonthData.length + 1).padStart(3, '0');
        const unitCode = data.unit_kerja ? data.unit_kerja.substring(0, 3).toUpperCase() : 'XXX';
        data.nomor = `FP-${nextNum}/${unitCode}/${month}/${year}`;
      }
      
      const newFP = {
        id: data.id || `FP-${Date.now()}`,
        ...data,
        created_at: data.created_at || new Date().toISOString()
      };
      
      mockData.formulirPermintaan.push(newFP);
      saveMockData();
      
      console.log('🔧 MOCK: Created Formulir Permintaan', newFP.nomor);
      return { success: true, data: newFP };
    }),
    update: (id, data) => mockInvoke(() => {
      if (!mockData.formulirPermintaan) mockData.formulirPermintaan = [];
      const index = mockData.formulirPermintaan.findIndex(f => f.id === id);
      if (index !== -1) {
        mockData.formulirPermintaan[index] = { ...mockData.formulirPermintaan[index], ...data };
        saveMockData();
        return { success: true, data: mockData.formulirPermintaan[index] };
      }
      return { success: false, error: 'Not found' };
    }),
    delete: (id) => mockInvoke(() => {
      if (!mockData.formulirPermintaan) mockData.formulirPermintaan = [];
      const index = mockData.formulirPermintaan.findIndex(f => f.id === id);
      if (index !== -1) {
        mockData.formulirPermintaan.splice(index, 1);
        saveMockData();
        return { success: true };
      }
      return { success: false, error: 'Not found' };
    }),
    updateStatus: (id, status) => mockInvoke(() => {
      if (!mockData.formulirPermintaan) mockData.formulirPermintaan = [];
      const fp = mockData.formulirPermintaan.find(f => f.id === id);
      if (fp) {
        fp.status = status;
        fp.updated_at = new Date().toISOString();
        saveMockData();
        return { success: true };
      }
      return { success: false, error: 'Not found' };
    })
  },

  // ==================== Development Utilities ====================
  dev: {
    clearAllData: () => {
      console.log('🔧 MOCK: Clearing all data');
      mockData.pegawai = [];
      mockData.dipa = { headers: [], revisions: [], items: [] };
      mockData.suppliers = [];
      mockData.sbm.tahun = [];
      saveMockData();
      return { success: true };
    },
    clearPegawai: () => {
      console.log('🔧 MOCK: Clearing pegawai data');
      mockData.pegawai = [];
      saveMockData();
      return { success: true };
    },
    clearDipa: () => {
      console.log('🔧 MOCK: Clearing DIPA data');
      mockData.dipa = { headers: [], revisions: [], items: [] };
      saveMockData();
      return { success: true };
    },
    getDipaStats: () => {
      const stats = {
        headers: mockData.dipa.headers.length,
        revisions: mockData.dipa.revisions.length,
        items: mockData.dipa.items.length,
        revisi0Items: mockData.dipa.items.filter(i => {
          const rev = mockData.dipa.revisions.find(r => r.id === i.revisi_id);
          return rev?.nomor_revisi === 0;
        }).length
      };
      console.log('📊 DIPA Stats:', stats);
      return stats;
    }
  }
};

// Auto-inject when in browser (no Electron)
if (typeof window !== 'undefined' && !window.electronAPI) {
  console.log('🔧 Running in browser mode - injecting mock electronAPI');
  window.electronAPI = mockElectronAPI;
}
