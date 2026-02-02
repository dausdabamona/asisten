<script setup>
/**
 * SBM List View
 * Main view for managing Standar Biaya Masukan tahun
 */
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSbmStore } from '../../stores/sbmStore';
import BaseModal from '../../components/ui/BaseModal.vue';
import FormInput from '../../components/ui/FormInput.vue';

const router = useRouter();
const sbmStore = useSbmStore();

// Local state
const loading = ref(false);
const showAddModal = ref(false);
const showDeleteModal = ref(false);
const selectedSbm = ref(null);

// Form state
const formData = ref({
  tahun: new Date().getFullYear(),
  nomor_pmk: '',
  tanggal_pmk: ''
});
const formErrors = ref({});

// Computed
const sbmTahunList = computed(() => sbmStore.sbmTahunList);
const activeSbm = computed(() => sbmStore.activeSbmTahun);

// Methods
const loadData = async () => {
  loading.value = true;
  try {
    await sbmStore.fetchSbmTahunList();
  } finally {
    loading.value = false;
  }
};

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const openAddModal = () => {
  formData.value = {
    tahun: new Date().getFullYear(),
    nomor_pmk: '',
    tanggal_pmk: ''
  };
  formErrors.value = {};
  showAddModal.value = true;
};

const validateForm = () => {
  const errors = {};
  if (!formData.value.tahun) {
    errors.tahun = 'Tahun wajib diisi';
  }
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleAddSbm = async () => {
  if (!validateForm()) return;

  try {
    loading.value = true;
    const result = await sbmStore.createSbmTahun(formData.value);
    if (result) {
      showAddModal.value = false;
      // Navigate to detail to add tariffs
      router.push(`/master/sbm/${result.id}`);
    }
  } catch (error) {
    console.error('Failed to create SBM:', error);
    formErrors.value.general = error.message || 'Gagal membuat SBM';
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (sbm) => {
  selectedSbm.value = sbm;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!selectedSbm.value) return;

  try {
    loading.value = true;
    await sbmStore.deleteSbmTahun(selectedSbm.value.id);
    showDeleteModal.value = false;
    selectedSbm.value = null;
  } catch (error) {
    console.error('Failed to delete SBM:', error);
  } finally {
    loading.value = false;
  }
};

const handleSetActive = async (sbm) => {
  try {
    loading.value = true;
    await sbmStore.setActiveSbmTahun(sbm.id);
  } catch (error) {
    console.error('Failed to set active:', error);
  } finally {
    loading.value = false;
  }
};

const goToDetail = (sbm) => {
  router.push(`/master/sbm/${sbm.id}`);
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Master SBM</h1>
        <p class="text-gray-500">Kelola data Standar Biaya Masukan</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Tambah Tahun SBM
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && sbmTahunList.length === 0" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="sbmTahunList.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-700 mb-2">Belum Ada Data SBM</h3>
      <p class="text-gray-500 mb-6">Tambahkan data Standar Biaya Masukan untuk tahun anggaran.</p>
      <button
        @click="openAddModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Tambah Tahun SBM
      </button>
    </div>

    <!-- SBM List -->
    <div v-else class="grid gap-4">
      <div
        v-for="sbm in sbmTahunList"
        :key="sbm.id"
        class="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="goToDetail(sbm)"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <!-- Left side -->
            <div class="flex items-center space-x-4">
              <div :class="[
                'w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold',
                sbm.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              ]">
                {{ sbm.tahun }}
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="text-lg font-semibold text-gray-800">SBM Tahun {{ sbm.tahun }}</h3>
                  <span v-if="sbm.is_active" class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    Aktif
                  </span>
                </div>
                <p v-if="sbm.nomor_pmk" class="text-sm text-gray-500">
                  PMK {{ sbm.nomor_pmk }}
                  <span v-if="sbm.tanggal_pmk"> - {{ formatDate(sbm.tanggal_pmk) }}</span>
                </p>
                <p v-else class="text-sm text-gray-400 italic">Nomor PMK belum diisi</p>
              </div>
            </div>

            <!-- Right side - Stats -->
            <div class="flex items-center space-x-6 text-sm">
              <div class="text-center">
                <p class="text-gray-500">Uang Harian</p>
                <p class="text-lg font-semibold text-gray-800">{{ sbm.uang_harian_count || 0 }}</p>
              </div>
              <div class="text-center">
                <p class="text-gray-500">Transport</p>
                <p class="text-lg font-semibold text-gray-800">{{ sbm.transport_count || 0 }}</p>
              </div>
              <div class="text-center">
                <p class="text-gray-500">Honorarium</p>
                <p class="text-lg font-semibold text-gray-800">{{ sbm.honorarium_count || 0 }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-2" @click.stop>
                <button
                  v-if="!sbm.is_active"
                  @click.stop="handleSetActive(sbm)"
                  class="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title="Set Aktif"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </button>
                <button
                  v-if="!sbm.is_active"
                  @click.stop="confirmDelete(sbm)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Hapus"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
                <button
                  @click.stop="goToDetail(sbm)"
                  class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Detail"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add SBM Modal -->
    <BaseModal
      :show="showAddModal"
      title="Tambah Tahun SBM"
      @close="showAddModal = false"
    >
      <form @submit.prevent="handleAddSbm" class="space-y-4">
        <div v-if="formErrors.general" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ formErrors.general }}
        </div>

        <FormInput
          v-model.number="formData.tahun"
          label="Tahun"
          type="number"
          :min="2020"
          :max="2099"
          required
          :error="formErrors.tahun"
        />

        <FormInput
          v-model="formData.nomor_pmk"
          label="Nomor PMK"
          placeholder="Contoh: PMK-XXXX/PMK.02/2024"
        />

        <FormInput
          v-model="formData.tanggal_pmk"
          label="Tanggal PMK"
          type="date"
        />
      </form>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showAddModal = false"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Batal
          </button>
          <button
            @click="handleAddSbm"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :show="showDeleteModal"
      title="Hapus SBM"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600">
        Apakah Anda yakin ingin menghapus SBM Tahun <strong>{{ selectedSbm?.tahun }}</strong>?
        Semua data tarif yang terkait juga akan dihapus.
      </p>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="loading"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {{ loading ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
