/**
 * Lembar Permintaan Store
 * Manages Lembar Permintaan (LP) state for procurement requests
 * Handles full lifecycle: Draft -> Diajukan -> Disetujui -> Proses -> Kontrak -> Serah Terima -> Pembayaran -> Selesai
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Jenis LP (Type of LP)
export const LP_JENIS = {
  BARANG: 'BARANG',
  JASA: 'JASA',
  PJLP: 'PJLP',
  KEGIATAN: 'KEGIATAN'
};

// Status constants
export const LP_STATUS = {
  DRAFT: 'DRAFT',
  DIAJUKAN: 'DIAJUKAN',
  DISETUJUI: 'DISETUJUI',
  PROSES_PENGADAAN: 'PROSES_PENGADAAN',
  KONTRAK: 'KONTRAK',
  SERAH_TERIMA: 'SERAH_TERIMA',
  PEMBAYARAN: 'PEMBAYARAN',
  SELESAI: 'SELESAI',
  BATAL: 'BATAL'
};

// Status labels
export const LP_STATUS_LABEL = {
  DRAFT: 'Draft',
  DIAJUKAN: 'Diajukan',
  DISETUJUI: 'Disetujui',
  PROSES_PENGADAAN: 'Proses Pengadaan',
  KONTRAK: 'Kontrak',
  SERAH_TERIMA: 'Serah Terima',
  PEMBAYARAN: 'Pembayaran',
  SELESAI: 'Selesai',
  BATAL: 'Batal'
};

// Status colors
export const LP_STATUS_COLOR = {
  DRAFT: 'gray',
  DIAJUKAN: 'yellow',
  DISETUJUI: 'blue',
  PROSES_PENGADAAN: 'orange',
  KONTRAK: 'purple',
  SERAH_TERIMA: 'cyan',
  PEMBAYARAN: 'pink',
  SELESAI: 'green',
  BATAL: 'red'
};

// Valid status transitions
export const LP_STATUS_TRANSITIONS = {
  DRAFT: ['DIAJUKAN', 'BATAL'],
  DIAJUKAN: ['DISETUJUI', 'DRAFT', 'BATAL'],
  DISETUJUI: ['PROSES_PENGADAAN', 'BATAL'],
  PROSES_PENGADAAN: ['KONTRAK', 'BATAL'],
  KONTRAK: ['SERAH_TERIMA'],
  SERAH_TERIMA: ['PEMBAYARAN'],
  PEMBAYARAN: ['SELESAI'],
  SELESAI: [],
  BATAL: []
};

// Tier thresholds
export const TIER_THRESHOLDS = {
  TIER1: 10000000,      // <= 10 juta
  TIER2: 50000000,      // > 10 juta s.d. 50 juta
  TIER3: Infinity       // > 50 juta
};

export const useLembarPermintaanStore = defineStore('lembarPermintaan', () => {
  // State
  const lpList = ref([]);
  const currentLP = ref(null);
  const lpItems = ref([]);
  const lpLogs = ref([]);
  const lpDokumen = ref([]);
  const lpLampiran = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Filters
  const filters = ref({
    jenis: '',
    status: '',
    search: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    unitPengusulId: ''
  });

  // Pagination
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Getters
  const lpByStatus = computed(() => {
    const grouped = {};
    Object.keys(LP_STATUS).forEach(status => {
      grouped[status] = lpList.value.filter(lp => lp.status === status);
    });
    return grouped;
  });

  const lpBarang = computed(() => lpList.value.filter(lp => lp.jenis === 'BARANG'));
  const lpJasa = computed(() => lpList.value.filter(lp => lp.jenis === 'JASA'));
  const lpPJLP = computed(() => lpList.value.filter(lp => lp.jenis === 'PJLP'));
  const lpKegiatan = computed(() => lpList.value.filter(lp => lp.jenis === 'KEGIATAN'));

  const lpDraft = computed(() => lpList.value.filter(lp => lp.status === 'DRAFT'));
  const lpInProgress = computed(() => lpList.value.filter(lp =>
    !['DRAFT', 'SELESAI', 'BATAL'].includes(lp.status)
  ));
  const lpSelesai = computed(() => lpList.value.filter(lp => lp.status === 'SELESAI'));

  const totalNilaiLP = computed(() => {
    return lpList.value.reduce((sum, lp) => sum + (lp.total_nilai || 0), 0);
  });

  // Calculate tier from value
  const calculateTier = (nilai) => {
    if (nilai <= TIER_THRESHOLDS.TIER1) return 'TIER1';
    if (nilai <= TIER_THRESHOLDS.TIER2) return 'TIER2';
    return 'TIER3';
  };

  // Get recommended procurement method
  const getMetodePengadaan = (tier) => {
    switch (tier) {
      case 'TIER1': return 'Pembelian Langsung';
      case 'TIER2': return 'Pengadaan Langsung';
      case 'TIER3': return 'Tender/Seleksi';
      default: return '';
    }
  };

  // Check if status transition is valid
  const isValidTransition = (fromStatus, toStatus) => {
    const validTargets = LP_STATUS_TRANSITIONS[fromStatus] || [];
    return validTargets.includes(toStatus);
  };

  // Actions
  async function fetchLPList(filterParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters.value,
        ...filterParams
      };
      const result = await window.electronAPI?.lp?.list(params);
      if (result?.success) {
        lpList.value = result.data || [];
        pagination.value = {
          page: result.page || 1,
          limit: result.limit || 20,
          total: result.total || 0,
          totalPages: result.totalPages || 0
        };
      } else if (Array.isArray(result)) {
        lpList.value = result;
      }
      return lpList.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat daftar LP';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchLPById(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.lp?.get(id);
      if (result?.success) {
        currentLP.value = result.data;
        // Also fetch related data
        await Promise.all([
          fetchLPItems(id),
          fetchLPLogs(id),
          fetchLPDokumen(id),
          fetchLPLampiran(id)
        ]);
      } else if (result && !result.error) {
        currentLP.value = result;
        await Promise.all([
          fetchLPItems(id),
          fetchLPLogs(id),
          fetchLPDokumen(id),
          fetchLPLampiran(id)
        ]);
      }
      return currentLP.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data LP';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createLP(data) {
    loading.value = true;
    error.value = null;
    try {
      // Auto-calculate tier
      const tier = calculateTier(data.total_nilai || 0);
      const metodePengadaan = getMetodePengadaan(tier);

      const lpData = {
        ...data,
        kategori_tier: tier,
        metode_pengadaan: metodePengadaan,
        status: 'DRAFT'
      };

      const result = await window.electronAPI?.lp?.create(lpData);
      if (result?.success) {
        return result.data;
      }
      throw new Error(result?.error || 'Gagal membuat LP');
    } catch (err) {
      error.value = err.message || 'Gagal membuat LP';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateLP(id, data) {
    loading.value = true;
    error.value = null;
    try {
      // Re-calculate tier if total_nilai changed
      if (data.total_nilai !== undefined) {
        data.kategori_tier = calculateTier(data.total_nilai);
        data.metode_pengadaan = getMetodePengadaan(data.kategori_tier);
      }

      const result = await window.electronAPI?.lp?.update(id, data);
      if (result?.success) {
        if (currentLP.value?.id === id) {
          currentLP.value = { ...currentLP.value, ...data };
        }
        return result.data;
      }
      throw new Error(result?.error || 'Gagal mengupdate LP');
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate LP';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLP(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.lp?.delete(id);
      if (result?.success) {
        lpList.value = lpList.value.filter(lp => lp.id !== id);
        if (currentLP.value?.id === id) {
          currentLP.value = null;
        }
        return true;
      }
      throw new Error(result?.error || 'Gagal menghapus LP');
    } catch (err) {
      error.value = err.message || 'Gagal menghapus LP';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateStatus(id, newStatus, keterangan = '') {
    loading.value = true;
    error.value = null;
    try {
      // Validate transition
      const lp = currentLP.value?.id === id ? currentLP.value : lpList.value.find(l => l.id === id);
      if (lp && !isValidTransition(lp.status, newStatus)) {
        throw new Error(`Tidak dapat mengubah status dari ${lp.status} ke ${newStatus}`);
      }

      const result = await window.electronAPI?.lp?.updateStatus(id, newStatus, keterangan);
      if (result?.success) {
        if (currentLP.value?.id === id) {
          currentLP.value.status = newStatus;
        }
        const listIndex = lpList.value.findIndex(l => l.id === id);
        if (listIndex !== -1) {
          lpList.value[listIndex].status = newStatus;
        }
        return true;
      }
      throw new Error(result?.error || 'Gagal mengubah status');
    } catch (err) {
      error.value = err.message || 'Gagal mengubah status';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Item actions
  async function fetchLPItems(lpId) {
    try {
      const result = await window.electronAPI?.lp?.itemList(lpId);
      if (result?.success) {
        lpItems.value = result.data || [];
      } else if (Array.isArray(result)) {
        lpItems.value = result;
      }
      return lpItems.value;
    } catch (err) {
      console.error('Failed to fetch LP items:', err);
      lpItems.value = [];
    }
  }

  async function addItem(lpId, itemData) {
    try {
      const result = await window.electronAPI?.lp?.itemAdd(lpId, itemData);
      if (result?.success) {
        lpItems.value.push(result.data);
        // Recalculate total
        await recalculateLPTotal(lpId);
        return result.data;
      }
      throw new Error(result?.error || 'Gagal menambah item');
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  async function updateItem(itemId, itemData) {
    try {
      const result = await window.electronAPI?.lp?.itemUpdate(itemId, itemData);
      if (result?.success) {
        const index = lpItems.value.findIndex(i => i.id === itemId);
        if (index !== -1) {
          lpItems.value[index] = { ...lpItems.value[index], ...itemData };
        }
        // Recalculate total
        if (currentLP.value) {
          await recalculateLPTotal(currentLP.value.id);
        }
        return result.data;
      }
      throw new Error(result?.error || 'Gagal mengupdate item');
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  async function deleteItem(itemId) {
    try {
      const result = await window.electronAPI?.lp?.itemDelete(itemId);
      if (result?.success) {
        lpItems.value = lpItems.value.filter(i => i.id !== itemId);
        // Recalculate total
        if (currentLP.value) {
          await recalculateLPTotal(currentLP.value.id);
        }
        return true;
      }
      throw new Error(result?.error || 'Gagal menghapus item');
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  async function recalculateLPTotal(lpId) {
    const total = lpItems.value.reduce((sum, item) => sum + (item.jumlah || 0), 0);
    await updateLP(lpId, { total_nilai: total });
    return total;
  }

  // Log actions
  async function fetchLPLogs(lpId) {
    try {
      const result = await window.electronAPI?.lp?.logList(lpId);
      if (result?.success) {
        lpLogs.value = result.data || [];
      } else if (Array.isArray(result)) {
        lpLogs.value = result;
      }
      return lpLogs.value;
    } catch (err) {
      console.error('Failed to fetch LP logs:', err);
      lpLogs.value = [];
    }
  }

  // Dokumen actions
  async function fetchLPDokumen(lpId) {
    try {
      const result = await window.electronAPI?.lp?.dokumenList(lpId);
      if (result?.success) {
        lpDokumen.value = result.data || [];
      } else if (Array.isArray(result)) {
        lpDokumen.value = result;
      }
      return lpDokumen.value;
    } catch (err) {
      console.error('Failed to fetch LP dokumen:', err);
      lpDokumen.value = [];
    }
  }

  async function generateDokumen(lpId, jenisDokumen) {
    loading.value = true;
    try {
      const result = await window.electronAPI?.lp?.dokumenGenerate(lpId, jenisDokumen);
      if (result?.success) {
        await fetchLPDokumen(lpId);
        return result.data;
      }
      throw new Error(result?.error || 'Gagal generate dokumen');
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Lampiran actions
  async function fetchLPLampiran(lpId) {
    try {
      const result = await window.electronAPI?.lp?.lampiranList(lpId);
      if (result?.success) {
        lpLampiran.value = result.data || [];
      } else if (Array.isArray(result)) {
        lpLampiran.value = result;
      }
      return lpLampiran.value;
    } catch (err) {
      console.error('Failed to fetch LP lampiran:', err);
      lpLampiran.value = [];
    }
  }

  async function addLampiran(lpId, lampiranData) {
    try {
      const result = await window.electronAPI?.lp?.lampiranAdd(lpId, lampiranData);
      if (result?.success) {
        lpLampiran.value.push(result.data);
        return result.data;
      }
      throw new Error(result?.error || 'Gagal menambah lampiran');
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  async function deleteLampiran(lampiranId) {
    try {
      const result = await window.electronAPI?.lp?.lampiranDelete(lampiranId);
      if (result?.success) {
        lpLampiran.value = lpLampiran.value.filter(l => l.id !== lampiranId);
        return true;
      }
      throw new Error(result?.error || 'Gagal menghapus lampiran');
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  // Utility actions
  async function generateNomorLP(jenis) {
    try {
      const result = await window.electronAPI?.lp?.generateNomor(jenis);
      if (result?.success) {
        return result.data;
      }
      return result || '';
    } catch (err) {
      console.error('Failed to generate nomor LP:', err);
      return '';
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1;
  }

  function setPage(page) {
    pagination.value.page = page;
  }

  function clearFilters() {
    filters.value = {
      jenis: '',
      status: '',
      search: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      unitPengusulId: ''
    };
    pagination.value.page = 1;
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentLP() {
    currentLP.value = null;
    lpItems.value = [];
    lpLogs.value = [];
    lpDokumen.value = [];
    lpLampiran.value = [];
  }

  return {
    // State
    lpList,
    currentLP,
    lpItems,
    lpLogs,
    lpDokumen,
    lpLampiran,
    loading,
    error,
    filters,
    pagination,

    // Getters
    lpByStatus,
    lpBarang,
    lpJasa,
    lpPJLP,
    lpKegiatan,
    lpDraft,
    lpInProgress,
    lpSelesai,
    totalNilaiLP,

    // Utility functions (exported for use in components)
    calculateTier,
    getMetodePengadaan,
    isValidTransition,

    // LP Actions
    fetchLPList,
    fetchLPById,
    createLP,
    updateLP,
    deleteLP,
    updateStatus,

    // Item Actions
    fetchLPItems,
    addItem,
    updateItem,
    deleteItem,
    recalculateLPTotal,

    // Log Actions
    fetchLPLogs,

    // Dokumen Actions
    fetchLPDokumen,
    generateDokumen,

    // Lampiran Actions
    fetchLPLampiran,
    addLampiran,
    deleteLampiran,

    // Utility Actions
    generateNomorLP,
    setFilters,
    setPage,
    clearFilters,
    clearError,
    clearCurrentLP
  };
});
