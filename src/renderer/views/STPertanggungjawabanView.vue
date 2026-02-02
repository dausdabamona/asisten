<template>
  <div class="st-pertanggungjawaban-view p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-4">
      <router-link :to="`/transaksi/st/${stId}`" class="text-gray-600 hover:text-gray-900">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Pertanggungjawaban Perjalanan Dinas</h1>
        <p class="text-gray-600">{{ stNomor }} - {{ kotaTujuan }}</p>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Section A: Laporan Perjalanan -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">A</span>
          Laporan Perjalanan Dinas
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Kembali Aktual</label>
            <input
              v-model="formData.tanggal_kembali_aktual"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Lokasi Kembali</label>
            <input
              type="text"
              readonly
              value="Sorong"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Ringkasan Hasil Perjalanan Dinas
            <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="formData.ringkasan_hasil"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ringkaskan hasil perjalanan dinas, kegiatan yang dilakukan, dan pencapaian yang diperoleh..."
            required
          ></textarea>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Hasil yang Dicapai (Detail)</label>
          <textarea
            v-model="formData.hasil_dicapai"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jelaskan secara detail hasil/output yang telah dicapai..."
          ></textarea>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Tindak Lanjut</label>
          <textarea
            v-model="formData.tindak_lanjut"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Rencana tindak lanjut hasil perjalanan dinas..."
          ></textarea>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Upload Laporan Lengkap (PDF/Word)</label>
          <div class="mt-2 flex items-center gap-4">
            <input
              type="file"
              @change="handleReportUpload"
              accept=".pdf,.doc,.docx"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span v-if="formData.file_laporan" class="text-sm text-green-600">
              ✓ {{ formData.file_laporan }}
            </span>
          </div>
        </div>
      </div>

      <!-- Section B: Bukti Perjalanan -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">B</span>
            Bukti Perjalanan Dinas
          </h2>
          <button
            type="button"
            @click="openBuktiModal"
            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Upload Bukti
          </button>
        </div>

        <div class="space-y-4">
          <!-- Bukti Upload Guide -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-2">Jenis Bukti yang Diperlukan:</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>✓ Boarding Pass / Tiket Pesawat</li>
              <li>✓ Bill Hotel / Kwitansi Penginapan</li>
              <li>✓ Bukti Transport Lokal (Taksi/Ojek)</li>
              <li>✓ SPPD yang Ditandatangani</li>
              <li>✓ Foto Dokumentasi Kegiatan (dengan GPS tagging)</li>
              <li>✓ Daftar Hadir Peserta</li>
              <li>✓ Sertifikat/Piagam Penghargaan (jika ada)</li>
              <li>✓ Dokumen Lainnya (Kwitansi, Invoice, dll)</li>
            </ul>
          </div>

          <!-- Daftar Bukti Terupload -->
          <div v-if="buktiList.length > 0" class="border rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Bukti</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama File</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Upload</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GPS (Photo)</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="(bukti, idx) in buktiList" :key="idx">
                  <td class="px-4 py-3 text-sm text-gray-900">
                    <span class="px-2 py-1 bg-gray-100 rounded text-xs">{{ bukti.jenis_bukti }}</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ bukti.nama_file }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(bukti.tanggal_foto) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">
                    <span v-if="bukti.latitude && bukti.longitude" class="text-green-600 text-xs">
                      {{ bukti.latitude.toFixed(4) }}, {{ bukti.longitude.toFixed(4) }}
                    </span>
                    <span v-else class="text-gray-500 text-xs">-</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      type="button"
                      @click="deleteBukti(idx)"
                      class="text-red-600 hover:text-red-900 text-sm"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-6 text-gray-500">
            <p>Belum ada bukti terupload. Upload minimal 1 bukti perjalanan.</p>
          </div>
        </div>
      </div>

      <!-- Section C: Perhitungan Akhir (untuk At Cost) -->
      <div v-if="metode_biaya === 'AT_COST'" class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">C</span>
          Perhitungan Akhir Biaya
        </h2>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div class="space-y-4">
            <div class="flex justify-between text-sm border-b pb-2">
              <span class="text-gray-600">Uang Muka yang Diberikan</span>
              <span class="font-medium">{{ formatRupiah(uang_muka) }}</span>
            </div>

            <div class="flex justify-between text-sm border-b pb-2">
              <span class="text-gray-600">Total Biaya Riil (At Cost)</span>
              <span class="font-medium">{{ formatRupiah(total_biaya) }}</span>
            </div>

            <div class="flex justify-between text-lg font-bold border-t-2 pt-4">
              <span class="text-gray-900">Selisih</span>
              <span :class="[
                'text-lg font-bold',
                selisih_biaya > 0 ? 'text-red-600' : selisih_biaya < 0 ? 'text-blue-600' : 'text-green-600'
              ]">
                {{ status_selisih }}
                {{ formatRupiah(Math.abs(selisih_biaya)) }}
              </span>
            </div>
          </div>

          <div class="mt-4 p-3 bg-white rounded border border-yellow-300">
            <p class="text-sm text-gray-700">
              <strong v-if="status_selisih === 'LEBIH'" class="text-red-600">
                Pelaksana harus mengembalikan: {{ formatRupiah(selisih_biaya) }}
              </strong>
              <strong v-else-if="status_selisih === 'KURANG'" class="text-blue-600">
                Satker harus membayar tambahan: {{ formatRupiah(Math.abs(selisih_biaya)) }}
              </strong>
              <strong v-else class="text-green-600">
                Biaya sudah pas, tidak ada kelebihan atau kekurangan.
              </strong>
            </p>
          </div>

          <!-- Tombol Generate Kwitansi -->
          <div class="mt-6 flex gap-3">
            <button
              v-if="status_selisih === 'LEBIH'"
              type="button"
              @click="generateKwitansiPengembalian"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Kwitansi Pengembalian
            </button>
            <button
              v-else-if="status_selisih === 'KURANG'"
              type="button"
              @click="generateKwitansiTambahan"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate SPP Tambahan
            </button>
            <button
              v-else
              type="button"
              @click="generateKwitansiLengkap"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Kwitansi
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <router-link
          :to="`/transaksi/st/${stId}`"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Batal
        </router-link>
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span v-if="!loading">
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Simpan Pertanggungjawaban
          </span>
          <span v-else>Menyimpan...</span>
        </button>
      </div>
    </form>

    <!-- Bukti Upload Modal -->
    <BuktiUploadModal
      v-if="modals.buktiUpload"
      @close="modals.buktiUpload = false"
      @upload="handleBuktiUpload"
      :jenisOptions="jenisBuktiOptions"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSuratTugasStore } from '../stores/suratTugasStore';
import BuktiUploadModal from '../components/ST/BuktiUploadModal.vue';

const route = useRoute();
const router = useRouter();
const store = useSuratTugasStore();

const stId = route.params.id;
const stNomor = ref('');
const kotaTujuan = ref('');
const metode_biaya = ref('LUMPSUM');
const total_biaya = ref(0);
const uang_muka = ref(0);
const selisih_biaya = ref(0);
const status_selisih = ref('PAS');

const loading = ref(false);
const error = ref(null);

const formData = ref({
  tanggal_kembali_aktual: '',
  ringkasan_hasil: '',
  hasil_dicapai: '',
  tindak_lanjut: '',
  file_laporan: ''
});

const buktiList = ref([]);
const modals = ref({
  buktiUpload: false
});

const jenisBuktiOptions = [
  'BOARDING_PASS',
  'BILL_HOTEL',
  'TRANSPORT_LOKAL',
  'SPPD_TTD',
  'FOTO',
  'DAFTAR_HADIR',
  'SERTIFIKAT',
  'LAINNYA'
];

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

const openBuktiModal = () => {
  modals.value.buktiUpload = true;
};

const handleBuktiUpload = (buktiData) => {
  buktiList.value.push(buktiData);
  modals.value.buktiUpload = false;
};

const deleteBukti = (idx) => {
  buktiList.value.splice(idx, 1);
};

const handleReportUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.value.file_laporan = file.name;
  }
};

const generateKwitansiPengembalian = () => {
  console.log('Generate Kwitansi Pengembalian');
};

const generateKwitansiTambahan = () => {
  console.log('Generate SPP Tambahan');
};

const generateKwitansiLengkap = () => {
  console.log('Generate Kwitansi Lengkap');
};

const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = null;

    if (!formData.value.ringkasan_hasil) {
      error.value = 'Ringkasan hasil harus diisi';
      return;
    }

    if (buktiList.value.length === 0) {
      error.value = 'Minimal harus ada 1 bukti perjalanan';
      return;
    }

    // Submit to store
    await store.updatePertanggungjawaban(stId, {
      ...formData.value,
      bukti: buktiList.value
    });

    router.push(`/transaksi/st/${stId}`);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  try {
    await store.fetchSTById(stId);
    const st = store.currentST || {};
    
    stNomor.value = st.nomor;
    kotaTujuan.value = st.kota_tujuan;
    metode_biaya.value = st.metode_biaya;
    total_biaya.value = st.total_biaya;
    uang_muka.value = st.uang_muka;
    selisih_biaya.value = st.selisih_biaya;
    status_selisih.value = st.status_selisih;
    
    buktiList.value = store.buktiList || [];
  } catch (err) {
    error.value = 'Gagal memuat data surat tugas';
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.st-pertanggungjawaban-view {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
