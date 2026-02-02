<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePegawaiStore } from '../../stores/pegawaiStore';
import { useSatkerStore } from '../../stores/satkerStore';
import BaseTable from '../../components/ui/BaseTable.vue';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue';

const router = useRouter();
const pegawaiStore = usePegawaiStore();
const satkerStore = useSatkerStore();

// Local state
const showDeleteConfirm = ref(false);
const deleteTarget = ref({ id: null, nama: '' });
const deleting = ref(false);
const importInput = ref(null);
const importing = ref(false);
const exporting = ref(false);

// Filter state
const searchQuery = ref('');
const searchTimeout = ref(null);

// Table columns
const columns = [
  { key: 'nip', label: 'NIP', width: '150px' },
  { key: 'nama', label: 'Nama' },
  { key: 'golongan', label: 'Golongan', width: '100px', align: 'center' },
  { key: 'nama_jabatan', label: 'Jabatan' },
  { key: 'unit_kerja_nama', label: 'Unit Kerja' },
  { key: 'status', label: 'Status', width: '100px', align: 'center' },
  { key: 'actions', label: 'Aksi', width: '120px', align: 'right' }
];

// Options
const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Non-Aktif' }
];

const statusPegawaiOptions = [
  { value: '', label: 'Semua Jenis' },
  { value: 'ASN', label: 'ASN' },
  { value: 'PPPK', label: 'PPPK' },
  { value: 'HONORER', label: 'Honorer' }
];

const golonganOptions = [
  { value: '', label: 'Semua Golongan' },
  ...['I/a', 'I/b', 'I/c', 'I/d',
      'II/a', 'II/b', 'II/c', 'II/d',
      'III/a', 'III/b', 'III/c', 'III/d',
      'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'
  ].map(g => ({ value: g, label: g }))
];

// Computed
const unitKerjaOptions = computed(() => [
  { value: '', label: 'Semua Unit' },
  ...satkerStore.unitKerja.map(u => ({ value: u.id, label: u.nama }))
]);

// Methods
const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    pegawaiStore.setFilter('search', searchQuery.value);
  }, 300);
};

const handleFilterChange = (key, value) => {
  pegawaiStore.setFilter(key, value);
};

const handlePageChange = (page) => {
  pegawaiStore.setPage(page);
};

const goToAdd = () => {
  router.push('/master/pegawai/tambah');
};

const goToEdit = (id) => {
  router.push(`/master/pegawai/${id}`);
};

const confirmDelete = (pegawai) => {
  deleteTarget.value = { id: pegawai.id, nama: pegawai.nama };
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  deleting.value = true;
  try {
    await pegawaiStore.deletePegawai(deleteTarget.value.id);
    showDeleteConfirm.value = false;
  } catch (error) {
    alert('Gagal menghapus: ' + error.message);
  } finally {
    deleting.value = false;
  }
};

const handleImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  importing.value = true;
  try {
    const result = await pegawaiStore.importFromCSV(file);
    if (result.success) {
      alert(`Import berhasil!\nBerhasil: ${result.imported}\nGagal: ${result.failed}`);
    }
  } catch (error) {
    alert('Gagal import: ' + error.message);
  } finally {
    importing.value = false;
    // Reset input
    if (importInput.value) {
      importInput.value.value = '';
    }
  }
};

const handleExport = async () => {
  exporting.value = true;
  try {
    const result = await pegawaiStore.exportToCSV();
    if (result.success) {
      alert(`Export berhasil!\nFile: ${result.filename}\nJumlah data: ${result.count}`);
    }
  } catch (error) {
    alert('Gagal export: ' + error.message);
  } finally {
    exporting.value = false;
  }
};

const getStatusClass = (status) => {
  return status === 'aktif'
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';
};

onMounted(async () => {
  await satkerStore.fetchUnitKerja();
  await pegawaiStore.fetchPegawaiList();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Master Pegawai</h1>
        <p class="text-gray-500">Kelola data pegawai satuan kerja</p>
      </div>
      <div class="flex space-x-3">
        <!-- Hidden file input for import -->
        <input
          ref="importInput"
          type="file"
          accept=".csv"
          class="hidden"
          @change="handleImport"
        />

        <button
          @click="importInput?.click()"
          :disabled="importing"
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          {{ importing ? 'Mengimport...' : 'Import CSV' }}
        </button>

        <button
          @click="handleExport"
          :disabled="exporting"
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          {{ exporting ? 'Mengexport...' : 'Export CSV' }}
        </button>

        <button
          @click="goToAdd"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Tambah Pegawai
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-5 gap-4">
        <!-- Search -->
        <div class="col-span-2">
          <FormInput
            v-model="searchQuery"
            placeholder="Cari nama atau NIP..."
            @input="handleSearch"
          >
            <template #prefix>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </template>
          </FormInput>
        </div>

        <!-- Unit Kerja Filter -->
        <FormSelect
          v-model="pegawaiStore.filters.unit_kerja_id"
          :options="unitKerjaOptions"
          placeholder="Unit Kerja"
          @change="(v) => handleFilterChange('unit_kerja_id', v)"
        />

        <!-- Golongan Filter -->
        <FormSelect
          v-model="pegawaiStore.filters.golongan"
          :options="golonganOptions"
          placeholder="Golongan"
          @change="(v) => handleFilterChange('golongan', v)"
        />

        <!-- Status Filter -->
        <FormSelect
          v-model="pegawaiStore.filters.status"
          :options="statusOptions"
          placeholder="Status"
          @change="(v) => handleFilterChange('status', v)"
        />
      </div>

      <!-- Active Filters Summary -->
      <div v-if="pegawaiStore.filters.search || pegawaiStore.filters.unit_kerja_id || pegawaiStore.filters.golongan || pegawaiStore.filters.status" class="mt-4 flex items-center space-x-2">
        <span class="text-sm text-gray-500">Filter aktif:</span>
        <button
          @click="pegawaiStore.clearFilters"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          Hapus semua filter
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <BaseTable
      :columns="columns"
      :data="pegawaiStore.pegawaiList"
      :loading="pegawaiStore.loading"
      :current-page="pegawaiStore.pagination.page"
      :total-pages="pegawaiStore.pagination.totalPages"
      :total-items="pegawaiStore.pagination.total"
      :items-per-page="pegawaiStore.pagination.limit"
      empty-text="Tidak ada data pegawai"
      @page-change="handlePageChange"
      @row-click="(row) => goToEdit(row.id)"
    >
      <template #cell-nip="{ value }">
        <span class="font-mono text-sm">{{ value || '-' }}</span>
      </template>

      <template #cell-nama="{ row }">
        <div>
          <p class="font-medium text-gray-900">
            {{ row.gelar_depan ? row.gelar_depan + ' ' : '' }}{{ row.nama }}{{ row.gelar_belakang ? ', ' + row.gelar_belakang : '' }}
          </p>
          <p class="text-xs text-gray-500">{{ row.status_pegawai || 'ASN' }}</p>
        </div>
      </template>

      <template #cell-golongan="{ value }">
        <span v-if="value" class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          {{ value }}
        </span>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #cell-nama_jabatan="{ value }">
        {{ value || '-' }}
      </template>

      <template #cell-unit_kerja_nama="{ value }">
        {{ value || '-' }}
      </template>

      <template #cell-status="{ value }">
        <span :class="['px-2 py-1 text-xs font-medium rounded', getStatusClass(value)]">
          {{ value === 'aktif' ? 'Aktif' : 'Non-Aktif' }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex justify-end space-x-2" @click.stop>
          <button
            @click="goToEdit(row.id)"
            class="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            @click="confirmDelete(row)"
            class="text-red-600 hover:text-red-800 text-sm"
          >
            Hapus
          </button>
        </div>
      </template>
    </BaseTable>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Hapus Pegawai"
      :message="`Apakah Anda yakin ingin menghapus pegawai '${deleteTarget.nama}'?`"
      type="danger"
      confirm-text="Hapus"
      :loading="deleting"
      @confirm="executeDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
