<script setup>
/**
 * SBM Detail View
 * View SBM tahun details with tabs for Uang Harian, Transport, and Honorarium
 */
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSbmStore } from '../../stores/sbmStore';
import BaseModal from '../../components/ui/BaseModal.vue';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';

const router = useRouter();
const route = useRoute();
const sbmStore = useSbmStore();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  activeTab: {
    type: String,
    default: 'uang-harian'
  }
});

// Local state
const loading = ref(false);
const currentTab = ref(props.activeTab || 'uang-harian');

// Modal states
const showUangHarianModal = ref(false);
const showTransportModal = ref(false);
const showHonorariumModal = ref(false);
const showDeleteModal = ref(false);

const editingItem = ref(null);
const deleteItem = ref(null);
const deleteType = ref('');

// Form data
const uangHarianForm = ref({
  provinsi: '',
  kota: '',
  tingkat: '',
  uang_harian: 0,
  penginapan: 0
});

const transportForm = ref({
  asal: '',
  tujuan: '',
  moda: '',
  kelas: '',
  tarif: 0
});

const honorariumForm = ref({
  kategori: '',
  kualifikasi: '',
  satuan: '',
  tarif: 0
});

const formErrors = ref({});

// Computed
const sbmTahun = computed(() => sbmStore.currentSbmTahun);
const uangHarianList = computed(() => sbmStore.uangHarianList);
const transportList = computed(() => sbmStore.transportList);
const honorariumList = computed(() => sbmStore.honorariumList);
const honorariumByKategori = computed(() => sbmStore.honorariumByKategori);

const tingkatOptions = [
  { value: '', label: 'Pilih Tingkat...' },
  { value: 'A', label: 'Tingkat A (Tinggi)' },
  { value: 'B', label: 'Tingkat B (Sedang)' },
  { value: 'C', label: 'Tingkat C (Rendah)' }
];

const modaOptions = [
  { value: '', label: 'Pilih Moda...' },
  { value: 'PESAWAT', label: 'Pesawat' },
  { value: 'KAPAL', label: 'Kapal Laut' },
  { value: 'KERETA', label: 'Kereta Api' },
  { value: 'BUS', label: 'Bus' },
  { value: 'MOBIL', label: 'Mobil/Taksi' }
];

const kategoriOptions = [
  { value: '', label: 'Pilih Kategori...' },
  { value: 'NARASUMBER', label: 'Narasumber' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'PJLP', label: 'PJLP' }
];

const tabs = [
  { id: 'uang-harian', label: 'Uang Harian', icon: 'cash' },
  { id: 'transport', label: 'Transport', icon: 'plane' },
  { id: 'honorarium', label: 'Honorarium', icon: 'user' }
];

// Methods
const loadData = async () => {
  loading.value = true;
  try {
    await sbmStore.fetchSbmTahunById(props.id);
    await Promise.all([
      sbmStore.fetchUangHarianList(props.id),
      sbmStore.fetchTransportList(props.id),
      sbmStore.fetchHonorariumList(props.id)
    ]);
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

const goBack = () => {
  router.push('/master/sbm');
};

const setTab = (tabId) => {
  currentTab.value = tabId;
};

// Uang Harian methods
const openUangHarianModal = (item = null) => {
  editingItem.value = item;
  if (item) {
    uangHarianForm.value = { ...item };
  } else {
    uangHarianForm.value = {
      provinsi: '',
      kota: '',
      tingkat: '',
      uang_harian: 0,
      penginapan: 0
    };
  }
  formErrors.value = {};
  showUangHarianModal.value = true;
};

const handleSaveUangHarian = async () => {
  if (!uangHarianForm.value.provinsi || !uangHarianForm.value.kota) {
    formErrors.value = { general: 'Provinsi dan Kota wajib diisi' };
    return;
  }

  try {
    loading.value = true;
    if (editingItem.value) {
      await sbmStore.updateUangHarian(editingItem.value.id, uangHarianForm.value);
    } else {
      await sbmStore.createUangHarian({
        ...uangHarianForm.value,
        sbm_tahun_id: props.id
      });
    }
    showUangHarianModal.value = false;
    await sbmStore.fetchUangHarianList(props.id);
  } catch (error) {
    formErrors.value = { general: error.message };
  } finally {
    loading.value = false;
  }
};

// Transport methods
const openTransportModal = (item = null) => {
  editingItem.value = item;
  if (item) {
    transportForm.value = { ...item };
  } else {
    transportForm.value = {
      asal: '',
      tujuan: '',
      moda: '',
      kelas: '',
      tarif: 0
    };
  }
  formErrors.value = {};
  showTransportModal.value = true;
};

const handleSaveTransport = async () => {
  try {
    loading.value = true;
    if (editingItem.value) {
      await sbmStore.updateTransport(editingItem.value.id, transportForm.value);
    } else {
      await sbmStore.createTransport({
        ...transportForm.value,
        sbm_tahun_id: props.id
      });
    }
    showTransportModal.value = false;
    await sbmStore.fetchTransportList(props.id);
  } catch (error) {
    formErrors.value = { general: error.message };
  } finally {
    loading.value = false;
  }
};

// Honorarium methods
const openHonorariumModal = (item = null) => {
  editingItem.value = item;
  if (item) {
    honorariumForm.value = { ...item };
  } else {
    honorariumForm.value = {
      kategori: '',
      kualifikasi: '',
      satuan: '',
      tarif: 0
    };
  }
  formErrors.value = {};
  showHonorariumModal.value = true;
};

const handleSaveHonorarium = async () => {
  if (!honorariumForm.value.kategori) {
    formErrors.value = { general: 'Kategori wajib diisi' };
    return;
  }

  try {
    loading.value = true;
    if (editingItem.value) {
      await sbmStore.updateHonorarium(editingItem.value.id, honorariumForm.value);
    } else {
      await sbmStore.createHonorarium({
        ...honorariumForm.value,
        sbm_tahun_id: props.id
      });
    }
    showHonorariumModal.value = false;
    await sbmStore.fetchHonorariumList(props.id);
  } catch (error) {
    formErrors.value = { general: error.message };
  } finally {
    loading.value = false;
  }
};

const handleInsertDefaultHonorarium = async () => {
  try {
    loading.value = true;
    await sbmStore.insertDefaultHonorarium(props.id);
  } catch (error) {
    console.error('Failed to insert default:', error);
  } finally {
    loading.value = false;
  }
};

// Delete methods
const confirmDelete = (item, type) => {
  deleteItem.value = item;
  deleteType.value = type;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!deleteItem.value) return;

  try {
    loading.value = true;
    switch (deleteType.value) {
      case 'uang_harian':
        await sbmStore.deleteUangHarian(deleteItem.value.id);
        await sbmStore.fetchUangHarianList(props.id);
        break;
      case 'transport':
        await sbmStore.deleteTransport(deleteItem.value.id);
        await sbmStore.fetchTransportList(props.id);
        break;
      case 'honorarium':
        await sbmStore.deleteHonorarium(deleteItem.value.id);
        await sbmStore.fetchHonorariumList(props.id);
        break;
    }
    showDeleteModal.value = false;
    deleteItem.value = null;
    deleteType.value = '';
  } catch (error) {
    console.error('Failed to delete:', error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.activeTab, (newTab) => {
  if (newTab) {
    currentTab.value = newTab;
  }
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center space-x-4">
      <button
        @click="goBack"
        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-800">SBM Tahun {{ sbmTahun?.tahun }}</h1>
        <p v-if="sbmTahun?.nomor_pmk" class="text-gray-500">
          PMK {{ sbmTahun.nomor_pmk }}
          <span v-if="sbmTahun.tanggal_pmk"> - {{ formatDate(sbmTahun.tanggal_pmk) }}</span>
        </p>
      </div>
      <span v-if="sbmTahun?.is_active" class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
        Aktif
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !sbmTahun" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setTab(tab.id)"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              currentTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content: Uang Harian -->
      <div v-if="currentTab === 'uang-harian'" class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Tarif Uang Harian</h2>
          <button
            @click="openUangHarianModal()"
            class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Tambah
          </button>
        </div>

        <div v-if="uangHarianList.length === 0" class="p-12 text-center text-gray-500">
          Belum ada data uang harian
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provinsi</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kota</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tingkat</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Uang Harian</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Penginapan</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in uangHarianList" :key="item.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{{ item.provinsi }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{{ item.kota }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ item.tingkat || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right">{{ formatRupiah(item.uang_harian) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right">{{ formatRupiah(item.penginapan) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button @click="openUangHarianModal(item)" class="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button @click="confirmDelete(item, 'uang_harian')" class="text-red-600 hover:text-red-800">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Content: Transport -->
      <div v-if="currentTab === 'transport'" class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Tarif Transport</h2>
          <button
            @click="openTransportModal()"
            class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Tambah
          </button>
        </div>

        <div v-if="transportList.length === 0" class="p-12 text-center text-gray-500">
          Belum ada data transport
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asal</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moda</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tarif</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in transportList" :key="item.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{{ item.asal || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{{ item.tujuan || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ item.moda || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ item.kelas || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right">{{ formatRupiah(item.tarif) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button @click="openTransportModal(item)" class="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button @click="confirmDelete(item, 'transport')" class="text-red-600 hover:text-red-800">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Content: Honorarium -->
      <div v-if="currentTab === 'honorarium'" class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Tarif Honorarium</h2>
          <div class="flex space-x-2">
            <button
              @click="handleInsertDefaultHonorarium"
              class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              Insert Default
            </button>
            <button
              @click="openHonorariumModal()"
              class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              + Tambah
            </button>
          </div>
        </div>

        <div v-if="honorariumList.length === 0" class="p-12 text-center text-gray-500">
          <p class="mb-4">Belum ada data honorarium</p>
          <button
            @click="handleInsertDefaultHonorarium"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Insert Tarif Default
          </button>
        </div>

        <div v-else>
          <!-- Group by kategori -->
          <div v-for="(items, kategori) in honorariumByKategori" :key="kategori" class="border-b last:border-b-0">
            <div class="px-6 py-3 bg-gray-50 font-medium text-gray-700">
              {{ kategori }}
            </div>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kualifikasi</th>
                  <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
                  <th class="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tarif</th>
                  <th class="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
                  <td class="px-6 py-3 text-sm text-gray-800">{{ item.kualifikasi || '-' }}</td>
                  <td class="px-6 py-3 text-sm text-gray-600">{{ item.satuan || '-' }}</td>
                  <td class="px-6 py-3 text-sm text-gray-800 text-right font-medium">{{ formatRupiah(item.tarif) }}</td>
                  <td class="px-6 py-3 text-right text-sm">
                    <button @click="openHonorariumModal(item)" class="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button @click="confirmDelete(item, 'honorarium')" class="text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Uang Harian Modal -->
    <BaseModal
      :show="showUangHarianModal"
      :title="editingItem ? 'Edit Uang Harian' : 'Tambah Uang Harian'"
      @close="showUangHarianModal = false"
    >
      <form @submit.prevent="handleSaveUangHarian" class="space-y-4">
        <div v-if="formErrors.general" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ formErrors.general }}
        </div>

        <FormInput
          v-model="uangHarianForm.provinsi"
          label="Provinsi"
          placeholder="Contoh: Papua Barat Daya"
          required
        />

        <FormInput
          v-model="uangHarianForm.kota"
          label="Kota"
          placeholder="Contoh: Kota Sorong"
          required
        />

        <FormSelect
          v-model="uangHarianForm.tingkat"
          label="Tingkat"
          :options="tingkatOptions"
        />

        <FormInput
          v-model.number="uangHarianForm.uang_harian"
          label="Uang Harian (Rp)"
          type="number"
          :min="0"
        />

        <FormInput
          v-model.number="uangHarianForm.penginapan"
          label="Penginapan (Rp)"
          type="number"
          :min="0"
        />
      </form>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showUangHarianModal = false"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Batal
          </button>
          <button
            @click="handleSaveUangHarian"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Transport Modal -->
    <BaseModal
      :show="showTransportModal"
      :title="editingItem ? 'Edit Transport' : 'Tambah Transport'"
      @close="showTransportModal = false"
    >
      <form @submit.prevent="handleSaveTransport" class="space-y-4">
        <div v-if="formErrors.general" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ formErrors.general }}
        </div>

        <FormInput
          v-model="transportForm.asal"
          label="Asal"
          placeholder="Contoh: Sorong"
        />

        <FormInput
          v-model="transportForm.tujuan"
          label="Tujuan"
          placeholder="Contoh: Jakarta"
        />

        <FormSelect
          v-model="transportForm.moda"
          label="Moda Transportasi"
          :options="modaOptions"
        />

        <FormInput
          v-model="transportForm.kelas"
          label="Kelas"
          placeholder="Contoh: Ekonomi, Bisnis"
        />

        <FormInput
          v-model.number="transportForm.tarif"
          label="Tarif (Rp)"
          type="number"
          :min="0"
        />
      </form>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showTransportModal = false"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Batal
          </button>
          <button
            @click="handleSaveTransport"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Honorarium Modal -->
    <BaseModal
      :show="showHonorariumModal"
      :title="editingItem ? 'Edit Honorarium' : 'Tambah Honorarium'"
      @close="showHonorariumModal = false"
    >
      <form @submit.prevent="handleSaveHonorarium" class="space-y-4">
        <div v-if="formErrors.general" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ formErrors.general }}
        </div>

        <FormSelect
          v-model="honorariumForm.kategori"
          label="Kategori"
          :options="kategoriOptions"
          required
        />

        <FormInput
          v-model="honorariumForm.kualifikasi"
          label="Kualifikasi"
          placeholder="Contoh: Pejabat Eselon II"
        />

        <FormInput
          v-model="honorariumForm.satuan"
          label="Satuan"
          placeholder="Contoh: OJ, OK, OB"
        />

        <FormInput
          v-model.number="honorariumForm.tarif"
          label="Tarif (Rp)"
          type="number"
          :min="0"
        />
      </form>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showHonorariumModal = false"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Batal
          </button>
          <button
            @click="handleSaveHonorarium"
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
      title="Konfirmasi Hapus"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600">
        Apakah Anda yakin ingin menghapus data ini?
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
