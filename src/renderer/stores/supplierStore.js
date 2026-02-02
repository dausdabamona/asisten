/**
 * Supplier Store
 * Manages supplier (vendor) state with pagination, search, and filters
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSupplierStore = defineStore('supplier', () => {
  // State
  const supplierList = ref([]);
  const currentSupplier = ref(null);
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
    jenis: '', // BADAN_USAHA, PERORANGAN, or empty for all
    status: '',
    kualifikasi_usaha: '',
    is_narasumber: false
  });

  // Getters
  const totalSupplier = computed(() => pagination.value.total);

  const badanUsahaList = computed(() =>
    supplierList.value.filter(s => s.jenis === 'BADAN_USAHA')
  );

  const peroranganList = computed(() =>
    supplierList.value.filter(s => s.jenis === 'PERORANGAN')
  );

  const narasumberList = computed(() =>
    supplierList.value.filter(s => s.jenis === 'PERORANGAN' && s.klasifikasi_honor)
  );

  const hasNextPage = computed(() =>
    pagination.value.page < pagination.value.totalPages
  );

  const hasPrevPage = computed(() =>
    pagination.value.page > 1
  );

  // Actions
  async function fetchSupplierList(options = {}) {
    loading.value = true;
    error.value = null;

    const params = {
      page: options.page || pagination.value.page,
      limit: options.limit || pagination.value.limit,
      ...filters.value
    };

    try {
      const result = await window.electronAPI?.supplier?.list(params);
      if (result) {
        supplierList.value = result.data || [];
        pagination.value = {
          page: result.page || 1,
          limit: result.limit || 10,
          total: result.total || 0,
          totalPages: result.totalPages || Math.ceil((result.total || 0) / (result.limit || 10))
        };
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data supplier';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSupplierById(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.supplier?.get(id);
      if (result) {
        currentSupplier.value = result;
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal memuat data supplier';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createSupplier(data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.supplier?.create(data);
      if (result) {
        await fetchSupplierList();
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menambah supplier';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSupplier(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.supplier?.update(id, data);
      if (result) {
        // Update in list
        const index = supplierList.value.findIndex(s => s.id === id);
        if (index > -1) {
          supplierList.value[index] = { ...supplierList.value[index], ...data };
        }
        // Update current if same
        if (currentSupplier.value?.id === id) {
          currentSupplier.value = { ...currentSupplier.value, ...data };
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal mengupdate supplier';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSupplier(id) {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI?.supplier?.delete(id);
      if (result) {
        supplierList.value = supplierList.value.filter(s => s.id !== id);
        pagination.value.total--;
        if (currentSupplier.value?.id === id) {
          currentSupplier.value = null;
        }
      }
      return result;
    } catch (err) {
      error.value = err.message || 'Gagal menghapus supplier';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function searchSupplier(query, jenis = null) {
    try {
      const result = await window.electronAPI?.supplier?.search({ query, jenis });
      return result || [];
    } catch (err) {
      console.error('Search supplier error:', err);
      return [];
    }
  }

  // Pagination methods
  function setPage(page) {
    pagination.value.page = page;
    fetchSupplierList({ page });
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
    pagination.value.page = 1;
    fetchSupplierList();
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1;
    fetchSupplierList();
  }

  function clearFilters() {
    filters.value = {
      search: '',
      jenis: '',
      status: '',
      kualifikasi_usaha: '',
      is_narasumber: false
    };
    pagination.value.page = 1;
    fetchSupplierList();
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentSupplier() {
    currentSupplier.value = null;
  }

  return {
    // State
    supplierList,
    currentSupplier,
    loading,
    error,
    pagination,
    filters,

    // Getters
    totalSupplier,
    badanUsahaList,
    peroranganList,
    narasumberList,
    hasNextPage,
    hasPrevPage,

    // Actions
    fetchSupplierList,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    searchSupplier,

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
    clearCurrentSupplier
  };
});
