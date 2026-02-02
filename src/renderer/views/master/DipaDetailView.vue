<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDipaStore } from '../../stores/dipaStore';
import FormInput from '../../components/ui/FormInput.vue';
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue';

const route = useRoute();
const router = useRouter();
const dipaStore = useDipaStore();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
});

// Local state
const activeTab = ref('info');
const editing = ref(false);
const saving = ref(false);
const editForm = ref({
  nomor_dipa: '',
  tanggal_dipa: ''
});

// Delete confirmation
const showDeleteConfirm = ref(false);
const deleteTarget = ref({ id: null, nomor: '' });
const deleting = ref(false);

// Set active confirmation
const showActivateConfirm = ref(false);
const activateTarget = ref({ id: null, nomor: '' });
const activating = ref(false);

// Tabs
const tabs = [
  { key: 'info', label: 'Informasi DIPA' },
  { key: 'revisi', label: 'Riwayat Revisi' },
  { key: 'browse', label: 'Browse Anggaran' }
];

// Computed
const dipa = computed(() => dipaStore.currentDipa);
const revisiList = computed(() => dipaStore.revisiList);
const activeRevisi = computed(() => dipaStore.activeRevisi);

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

const formatShortDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getJenisRevisiLabel = (jenis) => {
  const labels = {
    'DIPA_AWAL': 'DIPA Awal',
    'REVISI_POK': 'Revisi POK',
    'REVISI_ANGGARAN': 'Revisi Anggaran',
    'REVISI_ADMINISTRASI': 'Revisi Administrasi'
  };
  return labels[jenis] || jenis;
};

const getJenisRevisiClass = (jenis) => {
  const classes = {
    'DIPA_AWAL': 'bg-blue-100 text-blue-800',
    'REVISI_POK': 'bg-purple-100 text-purple-800',
    'REVISI_ANGGARAN': 'bg-orange-100 text-orange-800',
    'REVISI_ADMINISTRASI': 'bg-gray-100 text-gray-800'
  };
  return classes[jenis] || 'bg-gray-100 text-gray-800';
};

// Methods
const loadData = async () => {
  await dipaStore.fetchDipaById(props.id);
  await dipaStore.fetchRevisiList(props.id);
};

const goBack = () => {
  router.push('/master/dipa');
};

const goToUpload = () => {
  router.push(`/master/dipa/${props.id}/upload`);
};

const goToBrowse = () => {
  router.push(`/master/dipa/${props.id}/browse`);
};

const startEdit = () => {
  editForm.value = {
    nomor_dipa: dipa.value?.nomor_dipa || '',
    tanggal_dipa: dipa.value?.tanggal_dipa || ''
  };
  editing.value = true;
};

const cancelEdit = () => {
  editing.value = false;
};

const saveEdit = async () => {
  saving.value = true;
  try {
    await dipaStore.updateDipa(props.id, editForm.value);
    editing.value = false;
    await loadData();
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message);
  } finally {
    saving.value = false;
  }
};

const confirmActivate = (revisi) => {
  activateTarget.value = { id: revisi.id, nomor: revisi.nomor_revisi };
  showActivateConfirm.value = true;
};

const executeActivate = async () => {
  activating.value = true;
  try {
    await dipaStore.setRevisiActive(props.id, activateTarget.value.id);
    showActivateConfirm.value = false;
  } catch (error) {
    alert('Gagal mengaktifkan revisi: ' + error.message);
  } finally {
    activating.value = false;
  }
};

const confirmDelete = (revisi) => {
  deleteTarget.value = { id: revisi.id, nomor: revisi.nomor_revisi };
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  deleting.value = true;
  try {
    await dipaStore.deleteRevisi(props.id, deleteTarget.value.id);
    showDeleteConfirm.value = false;
  } catch (error) {
    alert('Gagal menghapus revisi: ' + error.message);
  } finally {
    deleting.value = false;
  }
};

const viewRevisiDetail = (revisi) => {
  dipaStore.setCurrentRevisi(revisi);
  activeTab.value = 'browse';
};

onMounted(async () => {
  await loadData();
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
        <h1 class="text-2xl font-bold text-gray-800">Detail DIPA {{ dipa?.tahun_anggaran }}</h1>
        <p class="text-gray-500">{{ dipa?.nomor_dipa || 'Nomor DIPA belum diisi' }}</p>
      </div>
      <button
        @click="goToUpload"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        Upload Revisi Baru
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="dipaStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <template v-else-if="dipa">
      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
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

      <!-- Tab Content -->
      <div class="mt-6">
        <!-- Tab 1: Informasi DIPA -->
        <div v-if="activeTab === 'info'" class="space-y-6">
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b flex justify-between items-center">
              <h2 class="text-lg font-semibold text-gray-800">Informasi DIPA</h2>
              <button
                v-if="!editing"
                @click="startEdit"
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
            </div>
            <div class="p-6">
              <template v-if="editing">
                <div class="space-y-4">
                  <FormInput
                    v-model="editForm.nomor_dipa"
                    label="Nomor DIPA"
                    placeholder="Contoh: DIPA-032.11.1.660521/2025"
                  />
                  <FormInput
                    v-model="editForm.tanggal_dipa"
                    label="Tanggal DIPA"
                    type="date"
                  />
                  <div class="flex justify-end space-x-3 pt-4">
                    <button
                      @click="cancelEdit"
                      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      @click="saveEdit"
                      :disabled="saving"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {{ saving ? 'Menyimpan...' : 'Simpan' }}
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <dl class="grid grid-cols-2 gap-6">
                  <div>
                    <dt class="text-sm text-gray-500">Tahun Anggaran</dt>
                    <dd class="mt-1 text-lg font-medium text-gray-900">{{ dipa.tahun_anggaran }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500">Nomor DIPA</dt>
                    <dd class="mt-1 text-lg font-medium text-gray-900">{{ dipa.nomor_dipa || '-' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500">Tanggal DIPA</dt>
                    <dd class="mt-1 text-lg font-medium text-gray-900">{{ formatDate(dipa.tanggal_dipa) }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500">Kode Satker</dt>
                    <dd class="mt-1 text-lg font-medium text-gray-900">{{ dipa.kode_satker || '-' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500">Revisi Aktif</dt>
                    <dd class="mt-1 text-lg font-medium text-gray-900">
                      <span v-if="activeRevisi" class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        Revisi ke-{{ activeRevisi.nomor_revisi }}
                      </span>
                      <span v-else class="text-gray-500">Belum ada revisi aktif</span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500">Total Pagu</dt>
                    <dd class="mt-1 text-lg font-bold text-blue-600">{{ formatRupiah(dipa.total_pagu) }}</dd>
                  </div>
                </dl>
              </template>
            </div>
          </div>

          <!-- Summary by Program -->
          <div v-if="activeRevisi" class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold text-gray-800">Ringkasan per Program</h2>
            </div>
            <div class="p-6">
              <p class="text-gray-500 text-center py-8">
                Ringkasan akan ditampilkan setelah data item dimuat
              </p>
            </div>
          </div>
        </div>

        <!-- Tab 2: Riwayat Revisi -->
        <div v-if="activeTab === 'revisi'" class="space-y-6">
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="px-6 py-4 border-b flex justify-between items-center">
              <h2 class="text-lg font-semibold text-gray-800">Riwayat Revisi</h2>
              <button
                @click="goToUpload"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Upload Revisi Baru
              </button>
            </div>

            <div v-if="revisiList.length === 0" class="p-12 text-center">
              <p class="text-gray-500">Belum ada revisi untuk DIPA ini</p>
              <button
                @click="goToUpload"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload Revisi Pertama
              </button>
            </div>

            <table v-else class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rev</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Pagu</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jumlah Item</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="revisi in revisiList"
                  :key="revisi.id"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-medium text-gray-900">{{ revisi.nomor_revisi }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatShortDate(revisi.tanggal_revisi) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="['px-2 py-1 text-xs font-medium rounded', getJenisRevisiClass(revisi.jenis_revisi)]">
                      {{ getJenisRevisiLabel(revisi.jenis_revisi) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {{ formatRupiah(revisi.total_pagu) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {{ revisi.item_count || revisi.total_item || 0 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded',
                        revisi.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      ]"
                    >
                      {{ revisi.is_active ? 'Aktif' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div class="flex justify-end space-x-2">
                      <button
                        @click="viewRevisiDetail(revisi)"
                        class="text-blue-600 hover:text-blue-800"
                      >
                        Lihat
                      </button>
                      <button
                        v-if="!revisi.is_active"
                        @click="confirmActivate(revisi)"
                        class="text-green-600 hover:text-green-800"
                      >
                        Aktifkan
                      </button>
                      <button
                        v-if="!revisi.is_active"
                        @click="confirmDelete(revisi)"
                        class="text-red-600 hover:text-red-800"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab 3: Browse Anggaran -->
        <div v-if="activeTab === 'browse'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-800">Browse Anggaran</h2>
              <button
                @click="goToBrowse"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Buka Full View
              </button>
            </div>
            <p class="text-gray-500 text-center py-8">
              Klik "Buka Full View" untuk melihat struktur anggaran secara lengkap
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Activate Confirmation -->
    <ConfirmDialog
      :show="showActivateConfirm"
      title="Aktifkan Revisi"
      :message="`Apakah Anda yakin ingin mengaktifkan Revisi ke-${activateTarget.nomor}? Revisi lain akan dinonaktifkan.`"
      type="warning"
      confirm-text="Aktifkan"
      :loading="activating"
      @confirm="executeActivate"
      @cancel="showActivateConfirm = false"
    />

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Hapus Revisi"
      :message="`Apakah Anda yakin ingin menghapus Revisi ke-${deleteTarget.nomor}? Semua item anggaran dalam revisi ini akan dihapus.`"
      type="danger"
      confirm-text="Hapus"
      :loading="deleting"
      @confirm="executeDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
