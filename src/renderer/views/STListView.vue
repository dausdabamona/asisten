<template>
  <div class="st-list-view">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Surat Tugas</h1>
        <p class="text-gray-600">Kelola Surat Tugas Perjalanan Dinas</p>
      </div>
      <router-link
        to="/transaksi/st/tambah"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Surat Tugas
      </router-link>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition',
            activeTab === tab.value
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined"
            :class="[
              'ml-2 py-0.5 px-2 rounded-full text-xs',
              activeTab === tab.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
          <input
            v-model="searchQuery"
            @input="debouncedSearch"
            type="text"
            placeholder="Nomor ST, Nama Pelaksana, Tujuan..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="filters.status"
            @change="applyFilters"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="SPPD_TERBIT">SPPD Terbit</option>
            <option value="BERANGKAT">Berangkat</option>
            <option value="KEMBALI">Kembali</option>
            <option value="PEMBAYARAN">Pembayaran</option>
            <option value="SELESAI">Selesai</option>
            <option value="BATAL">Batal</option>
          </select>
        </div>

        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Periode</label>
          <input
            v-model="filters.tanggal_dari"
            @change="applyFilters"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Clear Filters -->
      <div class="mt-3 flex justify-end">
        <button
          @click="clearAllFilters"
          class="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-800">{{ store.error }}</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nomor ST
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pelaksana
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tujuan
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Biaya
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="filteredList.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                Tidak ada data surat tugas
              </td>
            </tr>
            <tr v-for="st in filteredList" :key="st.id" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ st.nomor }}</div>
                <div class="text-xs text-gray-500">{{ store.jenisLabel(st.jenis) }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ st.pelaksana_names || '-' }}</div>
                <div class="text-xs text-gray-500">{{ st.jumlah_pelaksana }} orang</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ st.kota_tujuan }}</div>
                <div class="text-xs text-gray-500">{{ st.provinsi_tujuan || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ formatDate(st.tanggal_berangkat) }}
                </div>
                <div class="text-xs text-gray-500">
                  s/d {{ formatDate(st.tanggal_kembali) }} ({{ st.lama_hari }} hari)
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ formatRupiah(st.total_biaya) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                    getStatusClass(st.status)
                  ]"
                >
                  {{ st.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <router-link
                    :to="`/transaksi/st/${st.id}`"
                    class="text-blue-600 hover:text-blue-900"
                    title="Lihat Detail"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </router-link>
                  <button
                    v-if="st.status === 'DRAFT'"
                    @click="confirmDelete(st)"
                    class="text-red-600 hover:text-red-900"
                    title="Hapus"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="store.pagination.total > store.pagination.limit" class="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="store.prevPage(); loadData()"
            :disabled="store.pagination.page === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="store.nextPage(); loadData()"
            :disabled="store.pagination.page >= store.totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Menampilkan
              <span class="font-medium">{{ (store.pagination.page - 1) * store.pagination.limit + 1 }}</span>
              sampai
              <span class="font-medium">{{ Math.min(store.pagination.page * store.pagination.limit, store.pagination.total) }}</span>
              dari
              <span class="font-medium">{{ store.pagination.total }}</span>
              hasil
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="store.prevPage(); loadData()"
                :disabled="store.pagination.page === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <button
                @click="store.nextPage(); loadData()"
                :disabled="store.pagination.page >= store.totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteModal.show"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click.self="deleteModal.show = false"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-3">Hapus Surat Tugas?</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Apakah Anda yakin ingin menghapus surat tugas
              <strong>{{ deleteModal.item?.nomor }}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div class="flex gap-3 px-4 py-3">
            <button
              @click="deleteModal.show = false"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button
              @click="handleDelete"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSuratTugasStore } from '../stores/suratTugasStore';

const store = useSuratTugasStore();

const activeTab = ref('all');
const searchQuery = ref('');
const filters = ref({
  status: null,
  tanggal_dari: null,
  tanggal_sampai: null
});

const deleteModal = ref({
  show: false,
  item: null
});

const tabs = computed(() => [
  { label: 'Semua', value: 'all', count: store.stList.length },
  { label: 'Dalam Kota', value: 'DALAM_KOTA', count: store.stByJenis('DALAM_KOTA').length },
  { label: 'Luar Kota', value: 'LUAR_KOTA', count: store.stByJenis('LUAR_KOTA').length },
  { label: 'Luar Provinsi', value: 'LUAR_PROVINSI', count: store.stByJenis('LUAR_PROVINSI').length }
]);

const filteredList = computed(() => {
  if (activeTab.value === 'all') {
    return store.stList;
  }
  return store.stByJenis(activeTab.value);
});

// Debounced search
let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500);
};

const applyFilters = () => {
  store.setFilter('search', searchQuery.value);
  store.setFilter('status', filters.value.status);
  store.setFilter('tanggal_dari', filters.value.tanggal_dari);
  store.setFilter('tanggal_sampai', filters.value.tanggal_sampai);
  
  if (activeTab.value !== 'all') {
    store.setFilter('jenis', activeTab.value);
  } else {
    store.setFilter('jenis', null);
  }
  
  loadData();
};

const clearAllFilters = () => {
  searchQuery.value = '';
  filters.value = {
    status: null,
    tanggal_dari: null,
    tanggal_sampai: null
  };
  store.clearFilters();
  loadData();
};

const loadData = async () => {
  await store.fetchSTList();
};

const confirmDelete = (st) => {
  deleteModal.value = {
    show: true,
    item: st
  };
};

const handleDelete = async () => {
  try {
    // Get user info (should come from auth store)
    const userId = 1; // TODO: Get from auth
    const userName = 'Admin'; // TODO: Get from auth
    
    await store.deleteST(deleteModal.value.item.id, userId, userName);
    deleteModal.value.show = false;
  } catch (error) {
    console.error('Error deleting ST:', error);
  }
};

const getStatusClass = (status) => {
  const classes = {
    DRAFT: 'bg-gray-100 text-gray-800',
    DISETUJUI: 'bg-blue-100 text-blue-800',
    SPPD_TERBIT: 'bg-cyan-100 text-cyan-800',
    BERANGKAT: 'bg-purple-100 text-purple-800',
    KEMBALI: 'bg-orange-100 text-orange-800',
    PEMBAYARAN: 'bg-yellow-100 text-yellow-800',
    SELESAI: 'bg-green-100 text-green-800',
    BATAL: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

// Watch active tab changes
watch(activeTab, () => {
  applyFilters();
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.st-list-view {
  @apply p-6;
}
</style>
