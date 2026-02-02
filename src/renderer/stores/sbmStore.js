/**
 * SBM Store
 * Manages Standar Biaya Masukan (SBM) state
 * Includes uang harian, transport, and honorarium tariffs
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSbmStore = defineStore('sbm', () => {
  // State
  const sbmTahunList = ref([]);
  const currentSbmTahun = ref(null);
  const uangHarianList = ref([]);
  const transportList = ref([]);
  const honorariumList = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const activeSbmTahun = computed(() => {
    return sbmTahunList.value.find(s => s.is_active === 1) || null;
  });

  const availableYears = computed(() => {
    const years = sbmTahunList.value.map(s => s.tahun);
    return years.sort((a, b) => b - a);
  });

  const uangHarianByProvinsi = computed(() => {
    const grouped = {};
    uangHarianList.value.forEach(item => {
      const provinsi = item.provinsi || 'LAINNYA';
      if (!grouped[provinsi]) {
        grouped[provinsi] = [];
      }
      grouped[provinsi].push(item);
    });
    return grouped;
  });

  const honorariumByKategori = computed(() => {
    const grouped = {};
    honorariumList.value.forEach(item => {
      const kategori = item.kategori || 'LAINNYA';
      if (!grouped[kategori]) {
        grouped[kategori] = [];
      }
      grouped[kategori].push(item);
    });
    return grouped;
  });

  const transportByModa = computed(() => {
    const grouped = {};
    transportList.value.forEach(item => {
      const moda = item.moda || 'LAINNYA';
      if (!grouped[moda]) {
        grouped[moda] = [];
      }
      grouped[moda].push(item);
    });
    return grouped;
  });

  // SBM Tahun Actions
  async function fetchSbmTahunList() {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.tahunList();
      if (result?.success) {
        sbmTahunList.value = result.data || [];
      } else if (Array.isArray(result)) {
        sbmTahunList.value = result;
      }
      return sbmTahunList.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat daftar SBM';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSbmTahunById(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.tahunGet(id);
      if (result?.success) {
        currentSbmTahun.value = result.data;
      } else if (result && !result.success) {
        currentSbmTahun.value = result;
      }
      return currentSbmTahun.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data SBM';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createSbmTahun(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.tahunCreate(data);
      if (result?.success) {
        await fetchSbmTahunList();
        return result.data;
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal membuat SBM tahun';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSbmTahun(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.tahunUpdate(id, data);
      if (result?.success) {
        if (currentSbmTahun.value?.id === id) {
          currentSbmTahun.value = { ...currentSbmTahun.value, ...data };
        }
        await fetchSbmTahunList();
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate SBM tahun';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSbmTahun(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.tahunDelete(id);
      if (result?.success) {
        sbmTahunList.value = sbmTahunList.value.filter(s => s.id !== id);
        if (currentSbmTahun.value?.id === id) {
          currentSbmTahun.value = null;
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus SBM tahun';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function setActiveSbmTahun(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.tahunSetActive(id);
      if (result?.success) {
        await fetchSbmTahunList();
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengaktifkan SBM tahun';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Uang Harian Actions
  async function fetchUangHarianList(sbmTahunId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.uangHarianList(sbmTahunId);
      if (result?.success) {
        uangHarianList.value = result.data || [];
      } else if (Array.isArray(result)) {
        uangHarianList.value = result;
      }
      return uangHarianList.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat daftar uang harian';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createUangHarian(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.uangHarianCreate(data);
      if (result?.success) {
        await fetchUangHarianList(data.sbm_tahun_id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal membuat uang harian';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateUangHarian(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.uangHarianUpdate(id, data);
      if (result?.success) {
        const index = uangHarianList.value.findIndex(u => u.id === id);
        if (index !== -1) {
          uangHarianList.value[index] = { ...uangHarianList.value[index], ...data };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate uang harian';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteUangHarian(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.uangHarianDelete(id);
      if (result?.success) {
        uangHarianList.value = uangHarianList.value.filter(u => u.id !== id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus uang harian';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Transport Actions
  async function fetchTransportList(sbmTahunId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.transportList(sbmTahunId);
      if (result?.success) {
        transportList.value = result.data || [];
      } else if (Array.isArray(result)) {
        transportList.value = result;
      }
      return transportList.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat daftar transport';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createTransport(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.transportCreate(data);
      if (result?.success) {
        await fetchTransportList(data.sbm_tahun_id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal membuat transport';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTransport(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.transportUpdate(id, data);
      if (result?.success) {
        const index = transportList.value.findIndex(t => t.id === id);
        if (index !== -1) {
          transportList.value[index] = { ...transportList.value[index], ...data };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate transport';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTransport(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.transportDelete(id);
      if (result?.success) {
        transportList.value = transportList.value.filter(t => t.id !== id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus transport';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Honorarium Actions
  async function fetchHonorariumList(sbmTahunId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.honorariumList(sbmTahunId);
      if (result?.success) {
        honorariumList.value = result.data || [];
      } else if (Array.isArray(result)) {
        honorariumList.value = result;
      }
      return honorariumList.value;
    } catch (err) {
      error.value = err.message || 'Gagal memuat daftar honorarium';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createHonorarium(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.honorariumCreate(data);
      if (result?.success) {
        await fetchHonorariumList(data.sbm_tahun_id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal membuat honorarium';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateHonorarium(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.honorariumUpdate(id, data);
      if (result?.success) {
        const index = honorariumList.value.findIndex(h => h.id === id);
        if (index !== -1) {
          honorariumList.value[index] = { ...honorariumList.value[index], ...data };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate honorarium';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteHonorarium(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.honorariumDelete(id);
      if (result?.success) {
        honorariumList.value = honorariumList.value.filter(h => h.id !== id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus honorarium';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function insertDefaultHonorarium(sbmTahunId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.sbm?.insertDefaultHonorarium(sbmTahunId);
      if (result?.success) {
        await fetchHonorariumList(sbmTahunId);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menambah honorarium default';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Lookup Actions (for transaction forms)
  async function lookupUangHarian(tahun, provinsi, kota) {
    try {
      const result = await window.electronAPI?.sbm?.lookupUangHarian({ tahun, provinsi, kota });
      return result?.data || result || null;
    } catch (err) {
      console.error('Failed to lookup uang harian:', err);
      return null;
    }
  }

  async function lookupHonorarium(tahun, kategori, kualifikasi) {
    try {
      const result = await window.electronAPI?.sbm?.lookupHonorarium({ tahun, kategori, kualifikasi });
      return result?.data || result || null;
    } catch (err) {
      console.error('Failed to lookup honorarium:', err);
      return null;
    }
  }

  async function lookupTransport(tahun, asal, tujuan, moda) {
    try {
      const result = await window.electronAPI?.sbm?.lookupTransport({ tahun, asal, tujuan, moda });
      return result?.data || result || null;
    } catch (err) {
      console.error('Failed to lookup transport:', err);
      return null;
    }
  }

  // Utility methods
  function clearError() {
    error.value = null;
  }

  function clearCurrentSbmTahun() {
    currentSbmTahun.value = null;
    uangHarianList.value = [];
    transportList.value = [];
    honorariumList.value = [];
  }

  return {
    // State
    sbmTahunList,
    currentSbmTahun,
    uangHarianList,
    transportList,
    honorariumList,
    loading,
    error,

    // Getters
    activeSbmTahun,
    availableYears,
    uangHarianByProvinsi,
    honorariumByKategori,
    transportByModa,

    // SBM Tahun Actions
    fetchSbmTahunList,
    fetchSbmTahunById,
    createSbmTahun,
    updateSbmTahun,
    deleteSbmTahun,
    setActiveSbmTahun,

    // Uang Harian Actions
    fetchUangHarianList,
    createUangHarian,
    updateUangHarian,
    deleteUangHarian,

    // Transport Actions
    fetchTransportList,
    createTransport,
    updateTransport,
    deleteTransport,

    // Honorarium Actions
    fetchHonorariumList,
    createHonorarium,
    updateHonorarium,
    deleteHonorarium,
    insertDefaultHonorarium,

    // Lookup Actions
    lookupUangHarian,
    lookupHonorarium,
    lookupTransport,

    // Utilities
    clearError,
    clearCurrentSbmTahun
  };
});
