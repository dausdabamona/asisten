<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSupplierStore } from '../../stores/supplierStore';
import BaseTable from '../../components/ui/BaseTable.vue';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue';

const router = useRouter();
const supplierStore = useSupplierStore();

// Local state
const activeTab = ref('semua');
const showDeleteConfirm = ref(false);
const deleteTarget = ref({ id: null, nama: '' });
const deleting = ref(false);

// Filter state
const searchQuery = ref('');
const searchTimeout = ref(null);

// Tabs
const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'badan_usaha', label: 'Badan Usaha' },
  { key: 'perorangan', label: 'Perorangan' },
  { key: 'narasumber', label: 'Narasumber' }
];

// Table columns for Badan Usaha
const badanUsahaColumns = [
  { key: 'nama', label: 'Nama Perusahaan' },
  { key: 'bentuk_usaha', label: 'Bentuk', width: '80px', align: 'center' },
  { key: 'npwp', label: 'NPWP', width: '160px' },
  { key: 'kota', label: 'Kota' },
  { key: 'kualifikasi_usaha', label: 'Kualifikasi', width: '100px', align: 'center' },
  { key: 'status', label: 'Status', width: '100px', align: 'center' },
  { key: 'actions', label: 'Aksi', width: '120px', align: 'right' }
];

// Table columns for Perorangan/Narasumber
const peroranganColumns = [
  { key: 'nama', label: 'Nama' },
  { key: 'nik', label: 'NIK', width: '160px' },
  { key: 'instansi', label: 'Instansi' },
  { key: 'bidang_keahlian', label: 'Bidang Keahlian' },
  { key: 'klasifikasi_honor', label: 'Klasifikasi', width: '120px' },
  { key: 'status', label: 'Status', width: '100px', align: 'center' },
  { key: 'actions', label: 'Aksi', width: '120px', align: 'right' }
];

// All columns (mixed)
const allColumns = [
  { key: 'nama', label: 'Nama' },
  { key: 'jenis', label: 'Jenis', width: '100px', align: 'center' },
  { key: 'npwp_nik', label: 'NPWP/NIK', width: '160px' },
  { key: 'kota', label: 'Kota' },
  { key: 'status', label: 'Status', width: '100px', align: 'center' },
  { key: 'actions', label: 'Aksi', width: '120px', align: 'right' }
];

// Options
const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'TIDAK_AKTIF', label: 'Tidak Aktif' },
  { value: 'BLACKLIST', label: 'Blacklist' }
];

const kualifikasiOptions = [
  { value: '', label: 'Semua Kualifikasi' },
  { value: 'KECIL', label: 'Kecil' },
  { value: 'NON_KECIL', label: 'Non-Kecil' }
];

// Computed
const currentColumns = computed(() => {
  if (activeTab.value === 'badan_usaha') {
    return badanUsahaColumns;
  } else if (activeTab.value === 'perorangan' || activeTab.value === 'narasumber') {
    return peroranganColumns;
  }
  return allColumns;
});

const showKualifikasiFilter = computed(() => {
  return activeTab.value === 'badan_usaha';
});

// Methods
const handleTabChange = (tab) => {
  activeTab.value = tab;

  let jenis = '';
  let is_narasumber = false;

  if (tab === 'badan_usaha') {
    jenis = 'BADAN_USAHA';
  } else if (tab === 'perorangan') {
    jenis = 'PERORANGAN';
  } else if (tab === 'narasumber') {
    is_narasumber = true;
  }

  supplierStore.setFilters({ jenis, is_narasumber, kualifikasi_usaha: '' });
};

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    supplierStore.setFilter('search', searchQuery.value);
  }, 300);
};

const handleFilterChange = (key, value) => {
  supplierStore.setFilter(key, value);
};

const handlePageChange = (page) => {
  supplierStore.setPage(page);
};

const goToAdd = () => {
  router.push('/master/supplier/tambah');
};

const goToEdit = (id) => {
  router.push(`/master/supplier/${id}`);
};

const confirmDelete = (supplier) => {
  deleteTarget.value = { id: supplier.id, nama: supplier.nama };
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  deleting.value = true;
  try {
    await supplierStore.deleteSupplier(deleteTarget.value.id);
    showDeleteConfirm.value = false;
  } catch (error) {
    alert('Gagal menghapus: ' + error.message);
  } finally {
    deleting.value = false;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'AKTIF': return 'bg-green-100 text-green-800';
    case 'TIDAK_AKTIF': return 'bg-gray-100 text-gray-800';
    case 'BLACKLIST': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'AKTIF': return 'Aktif';
    case 'TIDAK_AKTIF': return 'Non-Aktif';
    case 'BLACKLIST': return 'Blacklist';
    default: return status;
  }
};

const getJenisLabel = (jenis) => {
  return jenis === 'BADAN_USAHA' ? 'Badan Usaha' : 'Perorangan';
};

const getJenisClass = (jenis) => {
  return jenis === 'BADAN_USAHA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
};

const getKualifikasiLabel = (kualifikasi) => {
  switch (kualifikasi) {
    case 'KECIL': return 'Kecil';
    case 'NON_KECIL': return 'Non-Kecil';
    default: return '-';
  }
};

const formatNpwp = (npwp) => {
  if (!npwp) return '-';
  const clean = npwp.replace(/\D/g, '');
  if (clean.length === 15) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 15)}`;
  }
  return npwp;
};

const getKlasifikasiLabel = (klasifikasi) => {
  const labels = {
    'MENTERI': 'Menteri/Setingkat',
    'ESELON_I': 'Es. I / Guru Besar',
    'ESELON_II': 'Es. II / Doktor',
    'ESELON_III': 'Es. III / Magister',
    'ESELON_IV': 'Es. IV / Sarjana',
    'PRAKTISI': 'Praktisi',
    'LAINNYA': 'Lainnya'
  };
  return labels[klasifikasi] || klasifikasi || '-';
};

onMounted(async () => {
  await supplierStore.fetchSupplierList();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Master Supplier</h1>
        <p class="text-gray-500">Kelola data penyedia barang/jasa dan narasumber</p>
      </div>
      <button
        @click="goToAdd"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Tambah Supplier
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="handleTabChange(tab.key)"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
            activeTab === tab.key
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-4 gap-4">
        <!-- Search -->
        <div class="col-span-2">
          <FormInput
            v-model="searchQuery"
            placeholder="Cari nama, NPWP, atau NIK..."
            @input="handleSearch"
          />
        </div>

        <!-- Status Filter -->
        <FormSelect
          v-model="supplierStore.filters.status"
          :options="statusOptions"
          placeholder="Status"
          @change="(v) => handleFilterChange('status', v)"
        />

        <!-- Kualifikasi Filter (only for Badan Usaha) -->
        <FormSelect
          v-if="showKualifikasiFilter"
          v-model="supplierStore.filters.kualifikasi_usaha"
          :options="kualifikasiOptions"
          placeholder="Kualifikasi"
          @change="(v) => handleFilterChange('kualifikasi_usaha', v)"
        />
        <div v-else></div>
      </div>
    </div>

    <!-- Data Table -->
    <BaseTable
      :columns="currentColumns"
      :data="supplierStore.supplierList"
      :loading="supplierStore.loading"
      :current-page="supplierStore.pagination.page"
      :total-pages="supplierStore.pagination.totalPages"
      :total-items="supplierStore.pagination.total"
      :items-per-page="supplierStore.pagination.limit"
      empty-text="Tidak ada data supplier"
      @page-change="handlePageChange"
      @row-click="(row) => goToEdit(row.id)"
    >
      <!-- Nama column -->
      <template #cell-nama="{ row }">
        <div>
          <p class="font-medium text-gray-900">{{ row.nama }}</p>
          <p v-if="row.jenis === 'BADAN_USAHA' && row.bidang_usaha" class="text-xs text-gray-500">{{ row.bidang_usaha }}</p>
          <p v-if="row.jenis === 'PERORANGAN' && row.jabatan" class="text-xs text-gray-500">{{ row.jabatan }}</p>
        </div>
      </template>

      <!-- Jenis column (for all tab) -->
      <template #cell-jenis="{ value }">
        <span :class="['px-2 py-1 text-xs font-medium rounded', getJenisClass(value)]">
          {{ getJenisLabel(value) }}
        </span>
      </template>

      <!-- NPWP/NIK column (for all tab) -->
      <template #cell-npwp_nik="{ row }">
        <span class="font-mono text-sm">
          {{ row.jenis === 'BADAN_USAHA' ? formatNpwp(row.npwp) : (row.nik || '-') }}
        </span>
      </template>

      <template #cell-bentuk_usaha="{ value }">
        <span v-if="value" class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          {{ value }}
        </span>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #cell-npwp="{ value }">
        <span class="font-mono text-sm">{{ formatNpwp(value) }}</span>
      </template>

      <template #cell-nik="{ value }">
        <span class="font-mono text-sm">{{ value || '-' }}</span>
      </template>

      <template #cell-kota="{ value }">
        {{ value || '-' }}
      </template>

      <template #cell-instansi="{ value }">
        {{ value || '-' }}
      </template>

      <template #cell-bidang_keahlian="{ value }">
        {{ value || '-' }}
      </template>

      <template #cell-kualifikasi_usaha="{ value }">
        <span v-if="value" :class="[
          'px-2 py-1 text-xs font-medium rounded',
          value === 'KECIL' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
        ]">
          {{ getKualifikasiLabel(value) }}
        </span>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #cell-klasifikasi_honor="{ value }">
        <span v-if="value" class="text-xs">{{ getKlasifikasiLabel(value) }}</span>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #cell-status="{ value }">
        <span :class="['px-2 py-1 text-xs font-medium rounded', getStatusClass(value)]">
          {{ getStatusLabel(value) }}
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
      title="Hapus Supplier"
      :message="`Apakah Anda yakin ingin menghapus supplier '${deleteTarget.nama}'?`"
      type="danger"
      confirm-text="Hapus"
      :loading="deleting"
      @confirm="executeDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
