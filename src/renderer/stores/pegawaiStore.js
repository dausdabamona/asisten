/**
 * Pegawai Store
 * Manages pegawai (employee) state with pagination, search, and filters
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const usePegawaiStore = defineStore('pegawai', () => {
  // State
  const pegawaiList = ref([]);
  const currentPegawai = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Pagination
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filters
  const filters = ref({
    search: '',
    unit_kerja_id: '',
    status: '',
    golongan: '',
    status_pegawai: ''
  });

  // Getters
  const totalPegawai = computed(() => pagination.value.total);

  const hasNextPage = computed(() => {
    return pagination.value.page < pagination.value.totalPages;
  });

  const hasPrevPage = computed(() => {
    return pagination.value.page > 1;
  });

  // Actions
  async function fetchPegawaiList(options = {}) {
    loading.value = true;
    error.value = null;

    const params = {
      page: options.page || pagination.value.page,
      limit: options.limit || pagination.value.limit,
      ...filters.value
    };

    try {
      const result = await window.electronAPI?.pegawai?.list(params);
      if (result) {
        if (Array.isArray(result)) {
          pegawaiList.value = result;
          pagination.value = {
            page: params.page || 1,
            limit: params.limit || 10,
            total: result.length,
            totalPages: Math.ceil(result.length / (params.limit || 10))
          };
        } else {
          pegawaiList.value = result.data || [];
          pagination.value = {
            page: result.page || 1,
            limit: result.limit || 10,
            total: result.total || 0,
            totalPages: result.totalPages || Math.ceil((result.total || 0) / (result.limit || 10))
          };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data pegawai';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPegawaiById(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pegawai?.get(id);
      if (result) {
        currentPegawai.value = result;
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data pegawai';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createPegawai(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pegawai?.create(data);
      if (result) {
        // Refresh list
        await fetchPegawaiList();
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menambah pegawai';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updatePegawai(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pegawai?.update(id, data);
      if (result) {
        // Update in list
        const index = pegawaiList.value.findIndex(p => p.id === id);
        if (index > -1) {
          pegawaiList.value[index] = { ...pegawaiList.value[index], ...data };
        }
        // Update current if same
        if (currentPegawai.value?.id === id) {
          currentPegawai.value = { ...currentPegawai.value, ...data };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate pegawai';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deletePegawai(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pegawai?.delete(id);
      if (result) {
        // Remove from list
        pegawaiList.value = pegawaiList.value.filter(p => p.id !== id);
        pagination.value.total--;
        // Clear current if same
        if (currentPegawai.value?.id === id) {
          currentPegawai.value = null;
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus pegawai';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function importFromCSV(file) {
    loading.value = true;
    error.value = null;
    try {
      // Read file content
      const reader = new FileReader();
      const content = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const result = await window.electronAPI?.pegawai?.importCsv(content);
      if (result?.success) {
        await fetchPegawaiList();
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal import CSV';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function exportToCSV() {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.pegawai?.exportCsv(filters.value);
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal export CSV';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Pagination methods
  function setPage(page) {
    pagination.value.page = page;
    fetchPegawaiList({ page });
  }

  function nextPage() {
    if (hasNextPage.value) {
      setPage(pagination.value.page + 1);
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      setPage(pagination.value.page - 1);
    }
  }

  // Filter methods
  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.page = 1; // Reset to first page
    fetchPegawaiList();
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1;
    fetchPegawaiList();
  }

  function clearFilters() {
    filters.value = {
      search: '',
      unit_kerja_id: '',
      status: '',
      golongan: '',
      status_pegawai: ''
    };
    pagination.value.page = 1;
    fetchPegawaiList();
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentPegawai() {
    currentPegawai.value = null;
  }

  return {
    // State
    pegawaiList,
    currentPegawai,
    loading,
    error,
    pagination,
    filters,

    // Getters
    totalPegawai,
    hasNextPage,
    hasPrevPage,

    // Actions
    fetchPegawaiList,
    fetchPegawaiById,
    createPegawai,
    updatePegawai,
    deletePegawai,
    importFromCSV,
    exportToCSV,

    // Pagination
    setPage,
    nextPage,
    prevPage,

    // Filters
    setFilter,
    setFilters,
    clearFilters,

    // Utilities
    clearError,
    clearCurrentPegawai
  };
});
