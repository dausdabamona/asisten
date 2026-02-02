<template>
  <div class="st-detail-view p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-4">
      <router-link to="/transaksi/st" class="text-gray-600 hover:text-gray-900">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-800">{{ st.nomor || 'Loading...' }}</h1>
        <p class="text-gray-600">Perjalanan Dinas - {{ st.kota_tujuan }}</p>
      </div>
      <div class="flex gap-2">
        <router-link
          v-if="st.status === 'DRAFT'"
          :to="`/transaksi/st/${st.id}/edit`"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </router-link>
        <button
          @click="showPrintMenu = !showPrintMenu"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 relative"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2h-2m-4-4V9m0 4v6m4-10V9m0 4v6" />
          </svg>
          Cetak
          <svg v-if="showPrintMenu" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Print Menu Dropdown -->
        <div v-if="showPrintMenu" class="absolute right-0 mt-12 w-48 bg-white rounded-lg shadow-lg z-50">
          <button
            @click="printSuratTugas"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 border-b"
          >
            Print Surat Tugas
          </button>
          <button
            @click="printSPPD"
            v-if="st.status !== 'DRAFT'"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 border-b"
          >
            Print SPPD
          </button>
          <button
            @click="printRincianBiaya"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
          >
            Print Rincian Biaya
          </button>
        </div>
      </div>
    </div>

    <!-- Status Progress -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-700">Status: <strong>{{ st.status }}</strong></p>
        <p class="text-sm text-gray-600">Progress {{ progressPercentage }}%</p>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          :style="{ width: progressPercentage + '%' }"
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
        ></div>
      </div>
      <div class="flex justify-between text-xs text-gray-500 mt-2">
        <span v-for="s in statusFlow" :key="s" :class="['px-2', getStatusFlowClass(s)]">
          {{ s }}
        </span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="border-b border-gray-200 px-6">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Tab 1: Informasi -->
        <div v-if="activeTab === 'informasi'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Identitas -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Identitas</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Nomor ST:</span>
                  <span class="font-medium">{{ st.nomor }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Jenis Perjalanan:</span>
                  <span class="font-medium">{{ jenisLabel(st.jenis) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tanggal Dibuat:</span>
                  <span class="font-medium">{{ formatDate(st.tanggal_dibuat) }}</span>
                </div>
              </div>
            </div>

            <!-- Dasar Perjalanan -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Dasar Perjalanan</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Jenis Dasar:</span>
                  <span class="font-medium">{{ st.jenis_dasar || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Nomor Dasar:</span>
                  <span class="font-medium">{{ st.nomor_dasar || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tanggal Dasar:</span>
                  <span class="font-medium">{{ formatDate(st.tanggal_dasar) || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Maksud Tujuan -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Maksud dan Tujuan</h3>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ st.maksud_tujuan }}</p>
          </div>

          <!-- Rincian Perjalanan -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Lokasi</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Asal:</span>
                  <span class="font-medium">{{ st.kota_asal }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tujuan:</span>
                  <span class="font-medium">{{ st.kota_tujuan }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Provinsi:</span>
                  <span class="font-medium">{{ st.provinsi_tujuan || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tingkat Kota:</span>
                  <span class="font-medium">{{ st.tingkat_kota }}</span>
                </div>
              </div>
            </div>

            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Jadwal</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Berangkat:</span>
                  <span class="font-medium">{{ formatDate(st.tanggal_berangkat) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Kembali:</span>
                  <span class="font-medium">{{ formatDate(st.tanggal_kembali) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Lama:</span>
                  <span class="font-medium">{{ st.lama_hari }} hari</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Anggaran -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-3">Sumber Anggaran</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">DIPA Item:</span>
                <span class="font-medium">{{ st.dipa_kode || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Metode Biaya:</span>
                <span class="font-medium">{{ st.metode_biaya }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Biaya:</span>
                <span class="font-medium text-blue-600">{{ formatRupiah(st.total_biaya) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Uang Muka:</span>
                <span class="font-medium">{{ formatRupiah(st.uang_muka) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Pelaksana & Biaya -->
        <div v-if="activeTab === 'pelaksana'" class="space-y-6">
          <div v-if="pelaksanaList.length === 0" class="text-center py-8 text-gray-500">
            <p>Belum ada data pelaksana</p>
            <router-link
              v-if="st.status === 'DRAFT'"
              :to="`/transaksi/st/${st.id}/pelaksana`"
              class="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tambah Pelaksana
            </router-link>
          </div>

          <div v-else class="space-y-6">
            <div v-for="(p, idx) in pelaksanaList" :key="idx" class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h4 class="font-semibold text-gray-900">{{ p.nama }}</h4>
                  <p class="text-sm text-gray-600">
                    {{ p.nip }} - {{ p.jabatan }}
                    <span v-if="p.is_ketua" class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Ketua Rombongan
                    </span>
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p class="text-gray-600">Golongan</p>
                  <p class="font-medium">{{ p.golongan }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Uang Harian</p>
                  <p class="font-medium">{{ formatRupiah(p.uang_harian) }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Penginapan</p>
                  <p class="font-medium">{{ formatRupiah(p.penginapan) }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Transport</p>
                  <p class="font-medium">{{ formatRupiah(p.transport) }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Total</p>
                  <p class="font-medium text-blue-600">{{ formatRupiah(p.total_biaya) }}</p>
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex justify-between text-sm">
                <span class="font-medium text-gray-900">Total Biaya Semua Pelaksana:</span>
                <span class="font-bold text-blue-600 text-lg">{{ formatRupiah(totalBiayaPelaksana) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Riwayat -->
        <div v-if="activeTab === 'riwayat'" class="space-y-4">
          <div v-if="logs.length === 0" class="text-center py-8 text-gray-500">
            Belum ada riwayat perubahan
          </div>

          <div v-else class="relative">
            <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div v-for="(log, idx) in logs" :key="idx" class="ml-12 pb-8 relative">
              <div class="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-blue-600 rounded-full"></div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <p class="font-semibold text-gray-900">{{ log.jenis_perubahan }}</p>
                    <p class="text-xs text-gray-600">oleh {{ log.user_nama }}</p>
                  </div>
                  <span class="text-xs text-gray-500">{{ formatDateTime(log.tanggal) }}</span>
                </div>
                <p class="text-sm text-gray-700">{{ log.keterangan }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Dokumen -->
        <div v-if="activeTab === 'dokumen'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              @click="generateSTDocument"
              v-if="st.status !== 'DRAFT'"
              class="p-4 border rounded-lg hover:bg-gray-50 text-left transition"
            >
              <p class="font-semibold text-gray-900">Surat Tugas</p>
              <p class="text-xs text-gray-600 mt-1">Generate & Download</p>
            </button>

            <button
              @click="generateSPPDDocument"
              v-if="st.status === 'DISETUJUI' || st.status === 'SPPD_TERBIT'"
              class="p-4 border rounded-lg hover:bg-gray-50 text-left transition"
            >
              <p class="font-semibold text-gray-900">SPPD</p>
              <p class="text-xs text-gray-600 mt-1">Generate & Download</p>
            </button>

            <button
              @click="generateRincianBiaya"
              class="p-4 border rounded-lg hover:bg-gray-50 text-left transition"
            >
              <p class="font-semibold text-gray-900">Rincian Biaya</p>
              <p class="text-xs text-gray-600 mt-1">Generate & Download</p>
            </button>

            <button
              @click="generateKwitansi"
              v-if="st.status === 'PEMBAYARAN' || st.status === 'SELESAI'"
              class="p-4 border rounded-lg hover:bg-gray-50 text-left transition"
            >
              <p class="font-semibold text-gray-900">Kwitansi</p>
              <p class="text-xs text-gray-600 mt-1">Generate & Download</p>
            </button>
          </div>

          <div v-if="dokumenList.length > 0" class="mt-6">
            <h3 class="font-semibold text-gray-900 mb-3">Dokumen Tersimpan</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="doc in dokumenList" :key="doc.id">
                    <td class="px-4 py-3 text-sm text-gray-900">{{ doc.jenis_dokumen }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">{{ doc.nomor_dokumen }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(doc.tanggal_dokumen) }}</td>
                    <td class="px-4 py-3 text-center">
                      <a :href="doc.file_path" target="_blank" class="text-blue-600 hover:text-blue-900 text-sm">
                        Download
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 5: Pertanggungjawaban -->
        <div v-if="activeTab === 'pertanggungjawaban'" class="space-y-6">
          <div v-if="st.status === 'DRAFT' || st.status === 'DISETUJUI' || st.status === 'SPPD_TERBIT' || st.status === 'BERANGKAT'" class="text-center py-8 text-gray-500">
            <p>Pertanggungjawaban tersedia setelah status "Kembali"</p>
          </div>

          <div v-else class="space-y-6">
            <!-- Laporan Perjalanan -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Laporan Perjalanan</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-600">Tanggal Kembali Aktual</p>
                  <p class="font-medium">{{ formatDate(st.tanggal_kembali_aktual) || '-' }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Ringkasan Hasil</p>
                  <p class="font-medium text-sm">{{ st.ringkasan_hasil || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Bukti Perjalanan -->
            <div v-if="buktiList.length > 0" class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Bukti Perjalanan</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="(bukti, idx) in buktiList" :key="idx" class="border rounded p-3">
                  <p class="text-xs text-gray-600">{{ bukti.jenis_bukti }}</p>
                  <p class="text-sm font-medium text-gray-900">{{ bukti.nama_file }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(bukti.tanggal_foto) }}</p>
                </div>
              </div>
            </div>

            <!-- Perhitungan Akhir -->
            <div v-if="st.metode_biaya === 'AT_COST'" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Perhitungan Akhir</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Uang Muka:</span>
                  <span class="font-medium">{{ formatRupiah(st.uang_muka) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Total Biaya Riil:</span>
                  <span class="font-medium">{{ formatRupiah(st.total_biaya) }}</span>
                </div>
                <div class="border-t pt-2 flex justify-between font-semibold">
                  <span>Selisih:</span>
                  <span :class="['text-lg', st.status_selisih === 'LEBIH' ? 'text-red-600' : st.status_selisih === 'KURANG' ? 'text-blue-600' : 'text-green-600']">
                    {{ st.status_selisih }} {{ formatRupiah(Math.abs(st.selisih_biaya)) }}
                  </span>
                </div>
              </div>
              <p class="text-xs text-gray-600 mt-3">
                <span v-if="st.status_selisih === 'LEBIH'">Pelaksana harus mengembalikan kelebihan biaya.</span>
                <span v-else-if="st.status_selisih === 'KURANG'">Satker harus membayar kekurangan biaya.</span>
                <span v-else>Biaya sudah pas, tidak ada kelebihan atau kekurangan.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSuratTugasStore } from '../stores/suratTugasStore';

const route = useRoute();
const store = useSuratTugasStore();

const st = ref({});
const activeTab = ref('informasi');
const showPrintMenu = ref(false);
const pelaksanaList = ref([]);
const logs = ref([]);
const dokumenList = ref([]);
const buktiList = ref([]);

const tabs = [
  { id: 'informasi', label: 'Informasi' },
  { id: 'pelaksana', label: 'Pelaksana & Biaya' },
  { id: 'riwayat', label: 'Riwayat' },
  { id: 'dokumen', label: 'Dokumen' },
  { id: 'pertanggungjawaban', label: 'Pertanggungjawaban' }
];

const statusFlow = ['DRAFT', 'DISETUJUI', 'SPPD_TERBIT', 'BERANGKAT', 'KEMBALI', 'PEMBAYARAN', 'SELESAI'];

const progressPercentage = computed(() => {
  const statusIndex = statusFlow.indexOf(st.value.status || 'DRAFT');
  return Math.round(((statusIndex + 1) / statusFlow.length) * 100);
});

const totalBiayaPelaksana = computed(() => {
  return pelaksanaList.value.reduce((sum, p) => sum + (p.total_biaya || 0), 0);
});

const jenisLabel = (jenis) => {
  const labels = {
    DALAM_KOTA: 'Dalam Kota',
    LUAR_KOTA: 'Luar Kota',
    LUAR_PROVINSI: 'Luar Provinsi'
  };
  return labels[jenis] || jenis;
};

const getStatusFlowClass = (status) => {
  const statusIndex = statusFlow.indexOf(status);
  const currentIndex = statusFlow.indexOf(st.value.status || 'DRAFT');
  if (statusIndex <= currentIndex) {
    return 'text-green-600';
  }
  return 'text-gray-400';
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (datetime) => {
  if (!datetime) return '-';
  return new Date(datetime).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

const printSuratTugas = () => {
  window.print();
  showPrintMenu.value = false;
};

const printSPPD = () => {
  console.log('Print SPPD');
  showPrintMenu.value = false;
};

const printRincianBiaya = () => {
  console.log('Print Rincian Biaya');
  showPrintMenu.value = false;
};

const generateSTDocument = async () => {
  console.log('Generate ST Document');
};

const generateSPPDDocument = async () => {
  console.log('Generate SPPD Document');
};

const generateRincianBiaya = async () => {
  console.log('Generate Rincian Biaya');
};

const generateKwitansi = async () => {
  console.log('Generate Kwitansi');
};

const loadData = async () => {
  await store.fetchSTById(route.params.id);
  st.value = store.currentST || {};
  pelaksanaList.value = store.pelaksanaList || [];
  logs.value = store.logs || [];
  dokumenList.value = store.dokumen || [];
  buktiList.value = store.buktiList || [];
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.st-detail-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
