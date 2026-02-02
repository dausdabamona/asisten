<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDipaStore } from '../../stores/dipaStore';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormInput from '../../components/ui/FormInput.vue';
import BaseModal from '../../components/ui/BaseModal.vue';

const router = useRouter();
const dipaStore = useDipaStore();

// Local state
const selectedYear = ref(new Date().getFullYear());
const showAddModal = ref(false);
const newDipaForm = ref({
  tahun_anggaran: new Date().getFullYear(),
  nomor_dipa: '',
  tanggal_dipa: ''
});
const saving = ref(false);

// Computed
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set();
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    yearsSet.add(y);
  }
  dipaStore.dipaList.forEach(d => {
    if (d?.tahun_anggaran) yearsSet.add(Number(d.tahun_anggaran));
  });
  return Array.from(yearsSet)
    .sort((a, b) => b - a)
    .map(y => ({ value: y, label: `Tahun Anggaran ${y}` }));
});

const currentYearDipa = computed(() => {
  return dipaStore.dipaList.find(d => d.tahun_anggaran === selectedYear.value);
});

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getRealisasiPercentage = (dipa) => {
  const pagu = dipa.pagu_aktif || dipa.total_pagu || 0;
  const realisasi = dipa.total_realisasi || 0;
  if (pagu === 0) return 0;
  return Math.min(100, (realisasi / pagu) * 100);
};

// Methods
const loadData = async () => {
  await dipaStore.fetchDipaList();
};

const openAddModal = () => {
  newDipaForm.value = {
    tahun_anggaran: selectedYear.value,
    nomor_dipa: '',
    tanggal_dipa: ''
  };
  showAddModal.value = true;
};

const saveNewDipa = async () => {
  if (!newDipaForm.value.tahun_anggaran) {
    alert('Tahun anggaran wajib diisi');
    return;
  }

  saving.value = true;
  try {
    const result = await dipaStore.createDipa(newDipaForm.value);
    showAddModal.value = false;
    if (result) {
      selectedYear.value = newDipaForm.value.tahun_anggaran;
    }
  } catch (error) {
    alert('Gagal membuat DIPA: ' + error.message);
  } finally {
    saving.value = false;
  }
};

const goToDetail = (dipa) => {
  router.push(`/master/dipa/${dipa.id}`);
};

const goToUpload = (dipa) => {
  router.push(`/master/dipa/${dipa.id}/upload`);
};

const goToBrowse = (dipa) => {
  router.push(`/master/dipa/${dipa.id}/browse`);
};

watch(selectedYear, () => {
  // Year changed, reload if needed
});

watch(
  () => dipaStore.dipaList,
  (list) => {
    if (!list || list.length === 0) return;
    const years = list.map(d => Number(d.tahun_anggaran)).filter(Boolean);
    const latest = Math.max(...years);
    if (!years.includes(selectedYear.value)) {
      selectedYear.value = latest;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await loadData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Master DIPA</h1>
        <p class="text-gray-500">Kelola Daftar Isian Pelaksanaan Anggaran</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Tambah Tahun Baru
      </button>
    </div>

    <!-- Year Selection -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="w-64">
        <FormSelect
          v-model="selectedYear"
          :options="yearOptions"
          label="Pilih Tahun Anggaran"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="dipaStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- DIPA Card -->
    <div v-else-if="currentYearDipa" class="space-y-6">
      <!-- Info Card -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-xl font-semibold">DIPA Tahun {{ currentYearDipa.tahun_anggaran }}</h2>
              <p class="text-blue-100 mt-1">{{ currentYearDipa.nomor_dipa || 'Nomor DIPA belum diisi' }}</p>
              <p class="text-blue-200 text-sm mt-1">{{ formatDate(currentYearDipa.tanggal_dipa) }}</p>
            </div>
            <div class="text-right">
              <span
                v-if="currentYearDipa.active_revisi !== null"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20"
              >
                Revisi ke-{{ currentYearDipa.active_revisi }}
              </span>
              <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/30">
                Belum ada revisi aktif
              </span>
            </div>
          </div>
        </div>

        <div class="p-6">
          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-6 mb-6">
            <div class="text-center">
              <p class="text-sm text-gray-500 mb-1">Total Pagu</p>
              <p class="text-2xl font-bold text-gray-800">{{ formatRupiah(currentYearDipa.pagu_aktif || currentYearDipa.total_pagu) }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-500 mb-1">Realisasi</p>
              <p class="text-2xl font-bold text-green-600">{{ formatRupiah(currentYearDipa.total_realisasi) }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-500 mb-1">Sisa Pagu</p>
              <p class="text-2xl font-bold text-blue-600">
                {{ formatRupiah((currentYearDipa.pagu_aktif || currentYearDipa.total_pagu || 0) - (currentYearDipa.total_realisasi || 0)) }}
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600">Progress Realisasi</span>
              <span class="font-medium">{{ getRealisasiPercentage(currentYearDipa).toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div
                class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                :style="{ width: `${getRealisasiPercentage(currentYearDipa)}%` }"
              ></div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3">
            <button
              @click="goToBrowse(currentYearDipa)"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              Browse Anggaran
            </button>
            <button
              @click="goToUpload(currentYearDipa)"
              class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Upload Revisi Baru
            </button>
            <button
              @click="goToDetail(currentYearDipa)"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              Lihat Detail
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Informasi DIPA</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-gray-500">Kode Satker</dt>
              <dd class="font-medium">{{ currentYearDipa.kode_satker || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Jumlah Revisi</dt>
              <dd class="font-medium">{{ currentYearDipa.revisi_count || 0 }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Status</dt>
              <dd>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded',
                    currentYearDipa.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ currentYearDipa.is_active ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
          <div class="space-y-3">
            <button
              @click="goToDetail(currentYearDipa)"
              class="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between group"
            >
              <span class="text-gray-700">Lihat Riwayat Revisi</span>
              <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <button
              @click="goToBrowse(currentYearDipa)"
              class="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between group"
            >
              <span class="text-gray-700">Browse Struktur Anggaran</span>
              <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No DIPA for selected year -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-700 mb-2">Belum Ada DIPA</h3>
      <p class="text-gray-500 mb-6">
        DIPA untuk tahun anggaran {{ selectedYear }} belum tersedia.
      </p>
      <button
        @click="openAddModal"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Buat DIPA {{ selectedYear }}
      </button>
    </div>

    <!-- All Years List -->
    <div v-if="dipaStore.dipaList.length > 1" class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold text-gray-800">Semua Tahun Anggaran</h2>
      </div>
      <div class="divide-y">
        <div
          v-for="dipa in dipaStore.dipaList"
          :key="dipa.id"
          class="px-6 py-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
          @click="selectedYear = dipa.tahun_anggaran"
        >
          <div class="flex items-center space-x-4">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                dipa.tahun_anggaran === selectedYear
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ String(dipa.tahun_anggaran).slice(-2) }}
            </div>
            <div>
              <p class="font-medium text-gray-800">DIPA Tahun {{ dipa.tahun_anggaran }}</p>
              <p class="text-sm text-gray-500">{{ dipa.nomor_dipa || 'Nomor belum diisi' }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-medium text-gray-800">{{ formatRupiah(dipa.pagu_aktif || dipa.total_pagu) }}</p>
            <p class="text-sm text-gray-500">{{ dipa.revisi_count || 0 }} revisi</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add DIPA Modal -->
    <BaseModal
      :show="showAddModal"
      title="Tambah DIPA Baru"
      @close="showAddModal = false"
    >
      <div class="space-y-4">
        <FormSelect
          v-model="newDipaForm.tahun_anggaran"
          :options="yearOptions"
          label="Tahun Anggaran"
          required
        />

        <FormInput
          v-model="newDipaForm.nomor_dipa"
          label="Nomor DIPA"
          placeholder="Contoh: DIPA-032.11.1.660521/2025"
        />

        <FormInput
          v-model="newDipaForm.tanggal_dipa"
          label="Tanggal DIPA"
          type="date"
        />
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showAddModal = false"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="saveNewDipa"
            :disabled="saving"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
