<script setup>
/**
 * LPListView - Lembar Permintaan List View
 * Displays list of LP with filters, search, and actions
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useLembarPermintaanStore, LP_STATUS, LP_STATUS_LABEL, LP_JENIS } from '../../stores/lembarPermintaanStore';
import LPStatusBadge from '../../components/lp/LPStatusBadge.vue';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';

const router = useRouter();
const lpStore = useLembarPermintaanStore();

// Filter state
const searchQuery = ref('');
const filterStatus = ref('');
const filterJenis = ref('');
const filterTahun = ref(new Date().getFullYear());
const currentPage = ref(1);
const itemsPerPage = ref(20);

// Loading and error states
const loading = ref(false);
const error = ref(null);

// Computed
const statusOptions = computed(() => [
  { value: '', label: 'Semua Status' },
  ...Object.entries(LP_STATUS_LABEL).map(([value, label]) => ({ value, label }))
]);

const jenisOptions = computed(() => [
  { value: '', label: 'Semua Jenis' },
  { value: LP_JENIS.BARANG, label: 'Barang' },
  { value: LP_JENIS.JASA, label: 'Jasa' },
  { value: LP_JENIS.PJLP, label: 'PJLP' },
  { value: LP_JENIS.KEGIATAN, label: 'Kegiatan' }
]);

const tahunOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    years.push({ value: y, label: String(y) });
  }
  return years;
});

const filteredList = computed(() => lpStore.lpList);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredList.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredList.value.length / itemsPerPage.value)
);

const summary = computed(() => lpStore.lpSummary);

// Methods
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    await lpStore.fetchLPList({
      search: searchQuery.value,
      status: filterStatus.value,
      jenis: filterJenis.value,
      tahun: filterTahun.value
    });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const goToDetail = (lp) => {
  router.push({ name: 'LPDetail', params: { id: lp.id } });
};

const goToEdit = (lp) => {
  router.push({ name: 'LPEdit', params: { id: lp.id } });
};

const goToCreate = (jenis) => {
  if (jenis === 'BARANG') {
    router.push({ name: 'LPBarangTambah' });
  } else {
    router.push({ name: 'LPJasaTambah' });
  }
};

const handleDelete = async (lp) => {
  if (!confirm(`Yakin ingin menghapus LP ${lp.nomor}?`)) return;

  try {
    await lpStore.deleteLP(lp.id);
    await fetchData();
  } catch (err) {
    alert('Gagal menghapus: ' + err.message);
  }
};

const handlePrint = async (lp) => {
  try {
    await lpStore.printLP(lp.id);
  } catch (err) {
    alert('Gagal mencetak: ' + err.message);
  }
};

// Watchers
watch([searchQuery, filterStatus, filterJenis, filterTahun], () => {
  currentPage.value = 1;
  fetchData();
}, { debounce: 300 });

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lembar Permintaan</h1>
        <p class="text-gray-600">Kelola permintaan pengadaan barang dan jasa</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="goToCreate('BARANG')"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          LP Barang
        </button>
        <button
          @click="goToCreate('JASA')"
          class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          LP Jasa
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">Total LP</p>
        <p class="text-2xl font-bold text-gray-900">{{ summary.total || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">Draft</p>
        <p class="text-2xl font-bold text-gray-600">{{ summary.draft || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">Diajukan</p>
        <p class="text-2xl font-bold text-blue-600">{{ summary.diajukan || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">Proses</p>
        <p class="text-2xl font-bold text-yellow-600">{{ summary.proses || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">Selesai</p>
        <p class="text-2xl font-bold text-green-600">{{ summary.selesai || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-gray-500">Total Nilai</p>
        <p class="text-lg font-bold text-blue-600">{{ formatRupiah(summary.totalNilai || 0) }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormInput
          v-model="searchQuery"
          placeholder="Cari nomor, uraian..."
          icon="search"
        />
        <FormSelect
          v-model="filterStatus"
          :options="statusOptions"
          placeholder="Status"
        />
        <FormSelect
          v-model="filterJenis"
          :options="jenisOptions"
          placeholder="Jenis"
        />
        <FormSelect
          v-model="filterTahun"
          :options="tahunOptions"
          placeholder="Tahun"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredList.length === 0"
      class="bg-white rounded-lg shadow p-12 text-center"
    >
      <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">Belum ada Lembar Permintaan</h3>
      <p class="mt-2 text-gray-500">Mulai dengan membuat LP baru</p>
      <div class="mt-6 flex justify-center space-x-3">
        <button
          @click="goToCreate('BARANG')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Buat LP Barang
        </button>
        <button
          @click="goToCreate('JASA')"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Buat LP Jasa
        </button>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uraian</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nilai</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="lp in paginatedList"
            :key="lp.id"
            class="hover:bg-gray-50 cursor-pointer"
            @click="goToDetail(lp)"
          >
            <td class="px-4 py-3">
              <span class="text-sm font-medium text-blue-600 hover:text-blue-800">
                {{ lp.nomor }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ formatDate(lp.tanggal_pengajuan) }}
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-gray-900 line-clamp-2">{{ lp.uraian }}</div>
              <div v-if="lp.kegiatan_nama" class="text-xs text-gray-500">
                {{ lp.kegiatan_nama }}
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-flex px-2 py-0.5 text-xs font-medium rounded',
                  lp.jenis === 'BARANG' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                ]"
              >
                {{ lp.jenis }}
              </span>
              <span v-if="lp.tier" class="ml-1 text-xs text-gray-500">
                Tier {{ lp.tier }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-medium text-gray-900">
              {{ formatRupiah(lp.nilai_total) }}
            </td>
            <td class="px-4 py-3 text-center">
              <LPStatusBadge :status="lp.status" size="sm" />
            </td>
            <td class="px-4 py-3" @click.stop>
              <div class="flex items-center justify-center space-x-2">
                <button
                  @click="goToDetail(lp)"
                  class="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                  title="Lihat Detail"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
                <button
                  v-if="lp.status === 'DRAFT'"
                  @click="goToEdit(lp)"
                  class="p-1.5 text-gray-400 hover:text-yellow-600 rounded"
                  title="Edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  @click="handlePrint(lp)"
                  class="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  title="Cetak"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                  </svg>
                </button>
                <button
                  v-if="lp.status === 'DRAFT'"
                  @click="handleDelete(lp)"
                  class="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  title="Hapus"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
        <div class="text-sm text-gray-600">
          Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
          {{ Math.min(currentPage * itemsPerPage, filteredList.length) }}
          dari {{ filteredList.length }}
        </div>
        <div class="flex space-x-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Sebelumnya
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
