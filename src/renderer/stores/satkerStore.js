/**
 * Satker Store
 * Manages satker, pejabat, and unit kerja state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSatkerStore = defineStore('satker', () => {
  // State
  const satker = ref(null);
  const pejabat = ref([]);
  const unitKerja = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const normalizeList = (result) => {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    return [];
  };

  // Getters
  const activePejabat = computed(() => {
    return pejabat.value.filter(p => !p.status || p.status === 'aktif');
  });

  const pejabatByJenis = computed(() => {
    return (jenis) => pejabat.value.filter(p => p.jenis === jenis);
  });

  const activeUnitKerja = computed(() => {
    return unitKerja.value.filter(u => !u.status || u.status === 'aktif');
  });

  // Actions
  async function fetchSatker() {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.satker?.get();
      if (result) {
        satker.value = result?.data ?? result;
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data satker';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSatker(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.satker?.update(data);
      if (result) {
        satker.value = { ...satker.value, ...data };
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate data satker';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Pejabat Actions
  async function fetchPejabat() {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pejabat?.list();
      if (result) {
        pejabat.value = normalizeList(result);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data pejabat';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addPejabat(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pejabat?.create(data);
      if (result) {
        const created = result?.data ?? result;
        pejabat.value.push(created);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menambah pejabat';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updatePejabat(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pejabat?.update(id, data);
      if (result) {
        const index = pejabat.value.findIndex(p => p.id === id);
        if (index > -1) {
          pejabat.value[index] = { ...pejabat.value[index], ...data };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate pejabat';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deletePejabat(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pejabat?.delete(id);
      if (result) {
        pejabat.value = pejabat.value.filter(p => p.id !== id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus pejabat';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Unit Kerja Actions
  async function fetchUnitKerja() {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.unitKerja?.list();
      if (result) {
        unitKerja.value = normalizeList(result);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data unit kerja';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addUnitKerja(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.unitKerja?.create(data);
      if (result) {
        const created = result?.data ?? result;
        unitKerja.value.push(created);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menambah unit kerja';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateUnitKerja(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.unitKerja?.update(id, data);
      if (result) {
        const index = unitKerja.value.findIndex(u => u.id === id);
        if (index > -1) {
          unitKerja.value[index] = { ...unitKerja.value[index], ...data };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate unit kerja';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteUnitKerja(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.unitKerja?.delete(id);
      if (result) {
        unitKerja.value = unitKerja.value.filter(u => u.id !== id);
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus unit kerja';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Initialize - fetch all data
  async function initialize() {
    await Promise.all([
      fetchSatker(),
      fetchPejabat(),
      fetchUnitKerja()
    ]);
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    satker,
    pejabat,
    unitKerja,
    loading,
    error,

    // Getters
    activePejabat,
    pejabatByJenis,
    activeUnitKerja,

    // Actions
    fetchSatker,
    updateSatker,
    fetchPejabat,
    addPejabat,
    updatePejabat,
    deletePejabat,
    fetchUnitKerja,
    addUnitKerja,
    updateUnitKerja,
    deleteUnitKerja,
    initialize,
    clearError
  };
});
