<script setup>
/**
 * LPDetailView - Lembar Permintaan Detail View
 * Displays LP details with tabs for items, documents, and timeline
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLembarPermintaanStore, LP_STATUS, LP_STATUS_LABEL, LP_STATUS_TRANSITIONS } from '../../stores/lembarPermintaanStore';
import LPStatusBadge from '../../components/lp/LPStatusBadge.vue';
import LPStatusProgress from '../../components/lp/LPStatusProgress.vue';
import LPItemTable from '../../components/lp/LPItemTable.vue';
import LPTimeline from '../../components/lp/LPTimeline.vue';

const router = useRouter();
const route = useRoute();
const lpStore = useLembarPermintaanStore();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
});

// State
const loading = ref(false);
const error = ref(null);
const activeTab = ref('detail');
const showStatusModal = ref(false);
const statusAction = ref(null);
const statusNote = ref('');
const processingStatus = ref(false);

// Tabs
const tabs = [
  { id: 'detail', label: 'Detail', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'items', label: 'Daftar Item', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { id: 'dokumen', label: 'Dokumen', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'riwayat', label: 'Riwayat', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
];

// Computed
const lp = computed(() => lpStore.currentLP);
const items = computed(() => lpStore.currentLPItems);
const logs = computed(() => lpStore.currentLPLogs);
const dokumen = computed(() => lpStore.currentLPDokumen);

const canEdit = computed(() => lp.value?.status === LP_STATUS.DRAFT);
const canSubmit = computed(() => lp.value?.status === LP_STATUS.DRAFT);
const canApprove = computed(() => lp.value?.status === LP_STATUS.DIAJUKAN);
const canProcess = computed(() => [LP_STATUS.DISETUJUI, LP_STATUS.PROSES_PENGADAAN, LP_STATUS.KONTRAK, LP_STATUS.SERAH_TERIMA, LP_STATUS.PEMBAYARAN].includes(lp.value?.status));
const canCancel = computed(() => ![LP_STATUS.SELESAI, LP_STATUS.BATAL].includes(lp.value?.status));

const availableTransitions = computed(() => {
  if (!lp.value) return [];
  return LP_STATUS_TRANSITIONS[lp.value.status] || [];
});

// Format helpers
const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Methods
const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    await Promise.all([
      lpStore.fetchLPById(props.id),
      lpStore.fetchLPItems(props.id),
      lpStore.fetchLPLogs(props.id),
      lpStore.fetchLPDokumen(props.id)
    ]);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const goToEdit = () => {
  router.push({ name: 'LPEdit', params: { id: props.id } });
};

const goToList = () => {
  router.push({ name: 'LPList' });
};

const goToProcess = () => {
  router.push({ name: 'LPProses', params: { id: props.id } });
};

const openStatusModal = (action) => {
  statusAction.value = action;
  statusNote.value = '';
  showStatusModal.value = true;
};

const handleStatusChange = async () => {
  if (!statusAction.value) return;

  processingStatus.value = true;
  try {
    await lpStore.changeStatus(props.id, statusAction.value, statusNote.value);
    showStatusModal.value = false;
    await fetchData();
  } catch (err) {
    alert('Gagal mengubah status: ' + err.message);
  } finally {
    processingStatus.value = false;
  }
};

const handlePrint = async () => {
  try {
    await lpStore.printLP(props.id);
  } catch (err) {
    alert('Gagal mencetak: ' + err.message);
  }
};

const handleDelete = async () => {
  if (!confirm('Yakin ingin menghapus lembar permintaan ini?')) return;

  try {
    await lpStore.deleteLP(props.id);
    router.push({ name: 'LPList' });
  } catch (err) {
    alert('Gagal menghapus: ' + err.message);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center space-x-3">
          <button
            @click="goToList"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ lp?.nomor || 'Loading...' }}</h1>
            <p class="text-gray-600">{{ lp?.uraian }}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <LPStatusBadge v-if="lp" :status="lp.status" size="lg" show-icon />

        <div class="flex space-x-2">
          <button
            @click="handlePrint"
            class="p-2 text-gray-400 hover:text-gray-600 border rounded-lg"
            title="Cetak"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
          </button>

          <button
            v-if="canEdit"
            @click="goToEdit"
            class="p-2 text-gray-400 hover:text-blue-600 border rounded-lg"
            title="Edit"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>

          <button
            v-if="canEdit"
            @click="handleDelete"
            class="p-2 text-gray-400 hover:text-red-600 border rounded-lg"
            title="Hapus"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
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

    <!-- Content -->
    <template v-else-if="lp">
      <!-- Status Progress -->
      <div class="bg-white rounded-lg shadow p-6">
        <LPStatusProgress :status="lp.status" />
      </div>

      <!-- Action Buttons -->
      <div v-if="availableTransitions.length > 0" class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-3">
          <button
            v-if="canSubmit"
            @click="openStatusModal(LP_STATUS.DIAJUKAN)"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ajukan Permintaan
          </button>

          <button
            v-if="canApprove"
            @click="openStatusModal(LP_STATUS.DISETUJUI)"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Setujui
          </button>

          <button
            v-if="canApprove"
            @click="openStatusModal(LP_STATUS.DRAFT)"
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Kembalikan ke Draft
          </button>

          <button
            v-if="canProcess"
            @click="goToProcess"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Proses Pengadaan
          </button>

          <button
            v-if="canCancel"
            @click="openStatusModal(LP_STATUS.BATAL)"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Batalkan
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow">
        <!-- Tab Headers -->
        <div class="border-b">
          <nav class="flex -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"/>
              </svg>
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Detail Tab -->
          <div v-if="activeTab === 'detail'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left Column -->
              <div class="space-y-4">
                <div>
                  <label class="text-sm text-gray-500">Nomor LP</label>
                  <p class="font-medium text-gray-900">{{ lp.nomor }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Jenis Pengadaan</label>
                  <p class="font-medium text-gray-900">{{ lp.jenis }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Tanggal Pengajuan</label>
                  <p class="font-medium text-gray-900">{{ formatDate(lp.tanggal_pengajuan) }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Pemohon</label>
                  <p class="font-medium text-gray-900">{{ lp.pemohon_nama || '-' }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Unit Kerja</label>
                  <p class="font-medium text-gray-900">{{ lp.unit_kerja || '-' }}</p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="space-y-4">
                <div>
                  <label class="text-sm text-gray-500">Nilai Total</label>
                  <p class="text-xl font-bold text-blue-600">{{ formatRupiah(lp.nilai_total) }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Klasifikasi</label>
                  <span
                    :class="[
                      'inline-flex px-3 py-1 text-sm font-semibold rounded-full',
                      lp.tier === 1 ? 'bg-green-100 text-green-800' :
                      lp.tier === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    ]"
                  >
                    Tier {{ lp.tier }}
                  </span>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Kegiatan</label>
                  <p class="font-medium text-gray-900">{{ lp.kegiatan_nama || '-' }}</p>
                  <p class="text-sm text-gray-500">{{ lp.kegiatan_kode }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Lokasi Pengiriman</label>
                  <p class="font-medium text-gray-900">{{ lp.lokasi_pengiriman || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Catatan -->
            <div v-if="lp.catatan" class="pt-4 border-t">
              <label class="text-sm text-gray-500">Catatan</label>
              <p class="mt-1 text-gray-900 whitespace-pre-wrap">{{ lp.catatan }}</p>
            </div>

            <!-- Supplier Info (if assigned) -->
            <div v-if="lp.supplier_id" class="pt-4 border-t">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Informasi Penyedia</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm text-gray-500">Nama Penyedia</label>
                  <p class="font-medium text-gray-900">{{ lp.supplier_nama }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500">No. Kontrak</label>
                  <p class="font-medium text-gray-900">{{ lp.no_kontrak || '-' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Tab -->
          <div v-if="activeTab === 'items'">
            <LPItemTable :items="items" :editable="false" :jenis="lp.jenis" />
          </div>

          <!-- Dokumen Tab -->
          <div v-if="activeTab === 'dokumen'" class="space-y-4">
            <div v-if="dokumen.length === 0" class="text-center py-12 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <p class="mt-2">Belum ada dokumen</p>
            </div>

            <div v-else class="grid gap-4">
              <div
                v-for="doc in dokumen"
                :key="doc.id"
                class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div class="flex items-center">
                  <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <div>
                    <p class="font-medium text-gray-900">{{ doc.nama }}</p>
                    <p class="text-sm text-gray-500">{{ doc.jenis_dokumen }}</p>
                  </div>
                </div>
                <button class="text-blue-600 hover:text-blue-800">
                  Download
                </button>
              </div>
            </div>
          </div>

          <!-- Riwayat Tab -->
          <div v-if="activeTab === 'riwayat'">
            <LPTimeline :logs="logs" />
          </div>
        </div>
      </div>
    </template>

    <!-- Status Change Modal -->
    <div
      v-if="showStatusModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Ubah Status ke {{ LP_STATUS_LABEL[statusAction] }}
        </h3>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Catatan (opsional)
          </label>
          <textarea
            v-model="statusNote"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tambahkan catatan..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="showStatusModal = false"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            :disabled="processingStatus"
          >
            Batal
          </button>
          <button
            @click="handleStatusChange"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            :disabled="processingStatus"
          >
            {{ processingStatus ? 'Memproses...' : 'Konfirmasi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
