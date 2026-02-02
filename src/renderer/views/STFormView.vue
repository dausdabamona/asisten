<template>
  <div class="st-form-view p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-2">
        <router-link to="/transaksi/st" class="text-gray-600 hover:text-gray-900">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            {{ isEdit ? 'Edit Surat Tugas' : 'Tambah Surat Tugas Baru' }}
          </h1>
          <p class="text-gray-600">{{ formData.nomor || 'Nomor akan digenerate otomatis' }}</p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      
      <!-- Section A: Identitas -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">A</span>
          Identitas Surat Tugas
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Jenis Perjalanan <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-4">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="formData.jenis"
                  type="radio"
                  value="DALAM_KOTA"
                  class="mr-2"
                  required
                />
                <span>Dalam Kota</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="formData.jenis"
                  type="radio"
                  value="LUAR_KOTA"
                  class="mr-2"
                />
                <span>Luar Kota</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="formData.jenis"
                  type="radio"
                  value="LUAR_PROVINSI"
                  class="mr-2"
                />
                <span>Luar Provinsi</span>
              </label>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Dibuat</label>
            <input
              v-model="formData.tanggal_dibuat"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </div>

      <!-- Section B: Dasar Perjalanan -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">B</span>
          Dasar Perjalanan
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Jenis Dasar <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.jenis_dasar"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih Jenis Dasar</option>
              <option value="UNDANGAN">Undangan</option>
              <option value="DISPOSISI">Disposisi</option>
              <option value="NOTA_DINAS">Nota Dinas</option>
              <option value="PROGRAM_KERJA">Program Kerja</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Surat/Dokumen</label>
            <input
              v-model="formData.nomor_dasar"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Surat</label>
            <input
              v-model="formData.tanggal_dasar"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kategori Tujuan</label>
            <select
              v-model="formData.kategori_tujuan"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Kategori</option>
              <option value="RAPAT">Rapat</option>
              <option value="BIMTEK">Bimbingan Teknis</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="MONEV">Monitoring & Evaluasi</option>
              <option value="KONSULTASI">Konsultasi</option>
              <option value="PENGAWASAN">Pengawasan</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>
        </div>
        
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Perihal/Dasar Surat</label>
          <input
            v-model="formData.perihal_dasar"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Maksud/Tujuan Perjalanan <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="formData.maksud_tujuan"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jelaskan maksud dan tujuan perjalanan dinas..."
            required
          ></textarea>
        </div>
        
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Hasil yang Diharapkan</label>
          <textarea
            v-model="formData.hasil_diharapkan"
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Target/output yang diharapkan dari perjalanan dinas..."
          ></textarea>
        </div>
      </div>

      <!-- Section C: Pelaksana (Simplified - will be added after ST created) -->
      <div v-if="isEdit" class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">C</span>
            Pelaksana
          </h2>
          <router-link
            :to="`/transaksi/st/${$route.params.id}/pelaksana`"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Kelola Pelaksana
          </router-link>
        </div>
        <p class="text-sm text-gray-600">Kelola pelaksana setelah surat tugas disimpan</p>
      </div>

      <!-- Section D: Rincian Perjalanan -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">D</span>
          Rincian Perjalanan
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kota Asal</label>
            <input
              v-model="formData.kota_asal"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Kota Tujuan <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.kota_tujuan"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Provinsi Tujuan</label>
            <input
              v-model="formData.provinsi_tujuan"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tingkat Kota (SBM)</label>
            <select
              v-model="formData.tingkat_kota"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tingkat</option>
              <option value="A">A (Kota Besar)</option>
              <option value="B">B (Kota Sedang)</option>
              <option value="C">C (Kota Kecil)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Berangkat <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.tanggal_berangkat"
              type="date"
              @change="calculateLamaHari"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Kembali <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.tanggal_kembali"
              type="date"
              @change="calculateLamaHari"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div v-if="formData.lama_hari" class="mt-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            <strong>Lama Perjalanan:</strong> {{ formData.lama_hari }} hari
          </p>
        </div>
      </div>

      <!-- Section E: Sumber Anggaran -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">E</span>
          Sumber Anggaran
        </h2>
        
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">MAK (524xxx - Perjalanan Dinas)</label>
            <select
              v-model="formData.dipa_item_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih MAK</option>
              <!-- Options will be loaded from DIPA -->
            </select>
            <p class="text-xs text-gray-500 mt-1">Sisa pagu akan ditampilkan setelah memilih MAK</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Metode Biaya</label>
            <div class="flex gap-4">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="formData.metode_biaya"
                  type="radio"
                  value="LUMPSUM"
                  class="mr-2"
                />
                <span>Lumpsum (SBM)</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="formData.metode_biaya"
                  type="radio"
                  value="AT_COST"
                  class="mr-2"
                />
                <span>At Cost (Riil)</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-1">Uang harian tetap menggunakan SBM meski metode At Cost</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <router-link
          to="/transaksi/st"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Batal
        </router-link>
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Menyimpan...' : (isEdit ? 'Update' : 'Simpan') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSuratTugasStore } from '../stores/suratTugasStore';

const route = useRoute();
const router = useRouter();
const store = useSuratTugasStore();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const error = ref(null);

const formData = ref({
  nomor: '',
  jenis: 'LUAR_KOTA',
  tanggal_dibuat: new Date().toISOString().split('T')[0],
  dibuat_oleh_id: 1, // TODO: Get from auth
  jenis_dasar: '',
  nomor_dasar: '',
  tanggal_dasar: '',
  perihal_dasar: '',
  file_dasar: '',
  maksud_tujuan: '',
  kategori_tujuan: '',
  hasil_diharapkan: '',
  kota_asal: 'Sorong',
  kota_tujuan: '',
  provinsi_tujuan: '',
  tingkat_kota: '',
  tanggal_berangkat: '',
  tanggal_kembali: '',
  lama_hari: 0,
  dipa_item_id: null,
  metode_biaya: 'LUMPSUM',
  total_biaya: 0,
  uang_muka: 0,
  status: 'DRAFT',
  link_lp_id: null
});

const calculateLamaHari = () => {
  if (formData.value.tanggal_berangkat && formData.value.tanggal_kembali) {
    const start = new Date(formData.value.tanggal_berangkat);
    const end = new Date(formData.value.tanggal_kembali);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    formData.value.lama_hari = diff + 1;
  }
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    if (isEdit.value) {
      await store.updateST(route.params.id, formData.value, 1, 'Admin'); // TODO: Get user from auth
      router.push(`/transaksi/st/${route.params.id}`);
    } else {
      const result = await store.createST(formData.value);
      router.push(`/transaksi/st/${result.id}`);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  if (isEdit.value) {
    await store.fetchSTById(route.params.id);
    if (store.currentST) {
      formData.value = { ...store.currentST };
    }
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.st-form-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
