/**
 * DIPA Store
 * Manages DIPA (Daftar Isian Pelaksanaan Anggaran) state with revisions and items
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useDipaStore = defineStore('dipa', () => {
  // State
  const dipaList = ref([]);
  const currentDipa = ref(null);
  const revisiList = ref([]);
  const currentRevisi = ref(null);
  const dipaItems = ref([]);
  const hierarki = ref({});
  const loading = ref(false);
  const error = ref(null);

  // Pagination for items
  const itemPagination = ref({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Filters for items
  const itemFilters = ref({
    search: '',
    kode_program: '',
    kode_kegiatan: '',
    kode_akun: ''
  });

  // Getters
  const activeRevisi = computed(() => {
    return revisiList.value.find(r => r.is_active === 1) || null;
  });

  const totalPagu = computed(() => {
    if (activeRevisi.value) {
      return activeRevisi.value.total_pagu || 0;
    }
    return currentDipa.value?.total_pagu || 0;
  });

  const totalRealisasi = computed(() => {
    return dipaItems.value.reduce((sum, item) => sum + (item.realisasi || 0), 0);
  });

  const sisaPagu = computed(() => {
    return totalPagu.value - totalRealisasi.value;
  });

  const itemsByAkun = computed(() => {
    const grouped = {};
    dipaItems.value.forEach(item => {
      const akun = item.kode_akun || 'UNKNOWN';
      if (!grouped[akun]) {
        grouped[akun] = {
          kode_akun: akun,
          items: [],
          total_pagu: 0,
          total_realisasi: 0,
          total_blokir: 0
        };
      }
      grouped[akun].items.push(item);
      grouped[akun].total_pagu += item.total || 0;
      grouped[akun].total_realisasi += item.realisasi || 0;
      grouped[akun].total_blokir += item.nilai_blokir || 0;
    });
    return grouped;
  });

  const itemsByProgram = computed(() => {
    const grouped = {};
    dipaItems.value.forEach(item => {
      const program = item.kode_program || 'UNKNOWN';
      if (!grouped[program]) {
        grouped[program] = {
          kode_program: program,
          items: [],
          total_pagu: 0,
          total_realisasi: 0
        };
      }
      grouped[program].items.push(item);
      grouped[program].total_pagu += item.total || 0;
      grouped[program].total_realisasi += item.realisasi || 0;
    });
    return grouped;
  });

  const availableYears = computed(() => {
    const years = [...new Set(dipaList.value.map(d => d.tahun_anggaran))];
    return years.sort((a, b) => b - a);
  });

  // Actions
  async function fetchDipaList(tahun = null) {
    loading.value = true;
    error.value = null;
    try {
      const params = tahun ? { tahun } : {};
      const result = await window.electronAPI?.dipa?.list(params);
      if (result) {
        dipaList.value = result.data || result || [];
      }
      return dipaList.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat daftar DIPA';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDipaById(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.get(id);
      if (result) {
        // Extract data from response
        const data = result.data || result;
        currentDipa.value = data;
        return data;
      }
      return null;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data DIPA';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createDipa(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.create(data);
      if (result) {
        await fetchDipaList();
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal membuat DIPA';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDipa(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.update(id, data);
      if (result && currentDipa.value?.id === id) {
        currentDipa.value = { ...currentDipa.value, ...data };
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate DIPA';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Revisi Actions
  async function fetchRevisiList(dipaId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.revisiList(dipaId);
      if (result) {
        revisiList.value = result.data || result || [];
      }
      return revisiList.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat daftar revisi';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function uploadRevisiCSV(dipaId, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.revisiUpload(dipaId, data);
      if (result) {
        await fetchRevisiList(dipaId);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupload revisi';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function setRevisiActive(dipaId, revisiId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.revisiSetActive(dipaId, revisiId);
      if (result) {
        await fetchRevisiList(dipaId);
        // Update current revisi
        currentRevisi.value = revisiList.value.find(r => r.id === revisiId) || null;
        // Refresh DIPA data to get updated total_pagu from active revision
        await fetchDipaById(dipaId);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengaktifkan revisi';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteRevisi(dipaId, revisiId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.revisiDelete(dipaId, revisiId);
      if (result) {
        revisiList.value = revisiList.value.filter(r => r.id !== revisiId);
        if (currentRevisi.value?.id === revisiId) {
          currentRevisi.value = null;
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus revisi';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Items Actions
  async function fetchDipaItems(revisiId, filters = {}) {
    loading.value = true;
    error.value = null;
    try {
      const params = {
        revisi_id: revisiId,
        page: itemPagination.value.page,
        limit: itemPagination.value.limit,
        ...itemFilters.value,
        ...filters
      };
      const result = await window.electronAPI?.dipa?.itemsList(params);
      if (result) {
        dipaItems.value = result.data || [];
        itemPagination.value = {
          page: result.page || 1,
          limit: result.limit || 50,
          total: result.total || 0,
          totalPages: result.totalPages || 0
        };
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat item DIPA';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getHierarki(revisiId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.dipa?.itemsHierarki(revisiId);
      if (result) {
        // Normalize response - extract data from { success, data } wrapper
        const items = Array.isArray(result) ? result : (result.data || []);
        // Convert flat items to hierarki tree structure
        hierarki.value = buildHierarkiTree(items);
      }
      return hierarki.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat hierarki';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Helper function to build hierarki tree from flat items
  function buildHierarkiTree(items) {
    if (!items || items.length === 0) return {};
    
    const tree = {};
    
    items.forEach(item => {
      const program = item.kode_program || item.KODE_PROGRAM || 'Program';
      const kegiatan = item.kode_kegiatan || item.KODE_KEGIATAN || 'Kegiatan';
      const output = item.kode_output || item.KODE_OUTPUT || 'Output';
      const akun = item.kode_akun || item.KODE_AKUN || 'Akun';
      
      // Initialize structure
      if (!tree[program]) {
        tree[program] = {
          kode: program,
          label: program,
          uraian: item.uraian_program || item.URAIAN_PROGRAM || program,
          type: 'program',
          total_pagu: 0,
          total_realisasi: 0,
          total_blokir: 0,
          children: {}
        };
      }
      
      if (!tree[program].children[kegiatan]) {
        tree[program].children[kegiatan] = {
          kode: kegiatan,
          label: kegiatan,
          uraian: item.uraian_kegiatan || item.URAIAN_KEGIATAN || kegiatan,
          type: 'kegiatan',
          total_pagu: 0,
          total_realisasi: 0,
          total_blokir: 0,
          children: {}
        };
      }
      
      if (!tree[program].children[kegiatan].children[output]) {
        tree[program].children[kegiatan].children[output] = {
          kode: output,
          label: output,
          uraian: item.uraian_output || item.URAIAN_OUTPUT || output,
          type: 'output',
          total_pagu: 0,
          total_realisasi: 0,
          total_blokir: 0,
          children: {}
        };
      }
      
      if (!tree[program].children[kegiatan].children[output].children[akun]) {
        tree[program].children[kegiatan].children[output].children[akun] = {
          kode: akun,
          label: akun,
          uraian: item.uraian_akun || item.URAIAN_AKUN || akun,
          type: 'akun',
          total_pagu: 0,
          total_realisasi: 0,
          total_blokir: 0,
          item_count: 0,
          items: []
        };
      }
      
      // Add item to akun
      const pagu = parseFloat(item.total || item.pagu || item.nilai_pagu || 0);
      const realisasi = parseFloat(item.realisasi || 0);
      const blokir = parseFloat(item.blokir || 0);
      
      tree[program].children[kegiatan].children[output].children[akun].items.push({
        ...item,
        total_pagu: pagu,
        total_realisasi: realisasi,
        total_blokir: blokir
      });
      tree[program].children[kegiatan].children[output].children[akun].item_count++;
      
      // Sum up pagu/realisasi/blokir
      tree[program].children[kegiatan].children[output].children[akun].total_pagu += pagu;
      tree[program].children[kegiatan].children[output].children[akun].total_realisasi += realisasi;
      tree[program].children[kegiatan].children[output].children[akun].total_blokir += blokir;
      
      tree[program].children[kegiatan].children[output].total_pagu += pagu;
      tree[program].children[kegiatan].children[output].total_realisasi += realisasi;
      tree[program].children[kegiatan].children[output].total_blokir += blokir;
      
      tree[program].children[kegiatan].total_pagu += pagu;
      tree[program].children[kegiatan].total_realisasi += realisasi;
      tree[program].children[kegiatan].total_blokir += blokir;
      
      tree[program].total_pagu += pagu;
      tree[program].total_realisasi += realisasi;
      tree[program].total_blokir += blokir;
    });
    
    return tree;
  }

  async function getSisaPaguByItem(itemId) {
    try {
      const result = await window.electronAPI?.dipa?.itemsSisaPagu(itemId);
      return result;
    } catch (err) {
      console.error('Failed to get sisa pagu:', err);
      return null;
    }
  }

  async function parseCSVPreview(csvContent) {
    try {
      const result = await window.electronAPI?.dipa?.parseCSV(csvContent);
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mem-parse CSV';
      throw err;
    }
  }

  // Utility methods
  function setCurrentRevisi(revisi) {
    currentRevisi.value = revisi;
  }

  function setItemFilters(filters) {
    itemFilters.value = { ...itemFilters.value, ...filters };
    itemPagination.value.page = 1;
  }

  function setItemPage(page) {
    itemPagination.value.page = page;
  }

  function clearFilters() {
    itemFilters.value = {
      search: '',
      kode_program: '',
      kode_kegiatan: '',
      kode_akun: ''
    };
    itemPagination.value.page = 1;
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentDipa() {
    currentDipa.value = null;
    revisiList.value = [];
    currentRevisi.value = null;
    dipaItems.value = [];
    hierarki.value = {};
  }

  return {
    // State
    dipaList,
    currentDipa,
    revisiList,
    currentRevisi,
    dipaItems,
    hierarki,
    loading,
    error,
    itemPagination,
    itemFilters,

    // Getters
    activeRevisi,
    totalPagu,
    totalRealisasi,
    sisaPagu,
    itemsByAkun,
    itemsByProgram,
    availableYears,

    // DIPA Actions
    fetchDipaList,
    fetchDipaById,
    createDipa,
    updateDipa,

    // Revisi Actions
    fetchRevisiList,
    uploadRevisiCSV,
    setRevisiActive,
    deleteRevisi,

    // Items Actions
    fetchDipaItems,
    getHierarki,
    getSisaPaguByItem,
    parseCSVPreview,

    // Utilities
    setCurrentRevisi,
    setItemFilters,
    setItemPage,
    clearFilters,
    clearError,
    clearCurrentDipa
  };
});
