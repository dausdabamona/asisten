<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDipaStore } from '../../stores/dipaStore';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormTextarea from '../../components/ui/FormTextarea.vue';

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
const loading = ref(false);
const parsing = ref(false);
const saving = ref(false);
const dragover = ref(false);

const form = ref({
  tanggal_revisi: new Date().toISOString().split('T')[0],
  jenis_revisi: 'DIPA_AWAL',
  keterangan: ''
});

const csvFile = ref(null);
const csvContent = ref('');
const previewData = ref(null);
const parseError = ref('');

// Options
const jenisRevisiOptions = [
  { value: 'DIPA_AWAL', label: 'DIPA Awal' },
  { value: 'REVISI_POK', label: 'Revisi POK' },
  { value: 'REVISI_ANGGARAN', label: 'Revisi Anggaran' },
  { value: 'REVISI_ADMINISTRASI', label: 'Revisi Administrasi' }
];

// Computed
const dipa = computed(() => dipaStore.currentDipa);
const nextRevisiNumber = computed(() => {
  const revisi = dipaStore.revisiList;
  if (!revisi || revisi.length === 0) return 1;
  return Math.max(...revisi.map(r => r.nomor_revisi)) + 1;
});

const hasPreview = computed(() => previewData.value && previewData.value.totalItems > 0);

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

// Methods
const loadData = async () => {
  loading.value = true;
  try {
    await dipaStore.fetchDipaById(props.id);
    await dipaStore.fetchRevisiList(props.id);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push(`/master/dipa/${props.id}`);
};

const handleDragOver = (e) => {
  e.preventDefault();
  dragover.value = true;
};

const handleDragLeave = () => {
  dragover.value = false;
};

const handleDrop = (e) => {
  e.preventDefault();
  dragover.value = false;

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
};

const handleFileInput = (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
};

const handleFileSelect = async (file) => {
  if (!file.name.endsWith('.csv')) {
    parseError.value = 'File harus berformat CSV';
    return;
  }

  csvFile.value = file;
  parseError.value = '';
  previewData.value = null;

  try {
    parsing.value = true;

    // Read file content
    const content = await readFileAsText(file);
    csvContent.value = content;

    // Parse CSV
    const result = await dipaStore.parseCSVPreview(content);
    previewData.value = result;

    if (result.totalItems === 0) {
      parseError.value = 'Tidak ada data valid dalam file CSV';
    }
  } catch (error) {
    parseError.value = error.message || 'Gagal membaca file CSV';
    previewData.value = null;
  } finally {
    parsing.value = false;
  }
};

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Gagal membaca file'));
    reader.readAsText(file, 'UTF-8');
  });
};

const clearFile = () => {
  csvFile.value = null;
  csvContent.value = '';
  previewData.value = null;
  parseError.value = '';
};

const saveRevisi = async () => {
  if (!csvContent.value) {
    alert('Pilih file CSV terlebih dahulu');
    return;
  }

  if (!hasPreview.value) {
    alert('File CSV tidak valid atau tidak memiliki data');
    return;
  }

  saving.value = true;
  try {
    await dipaStore.uploadRevisiCSV(props.id, {
      csvContent: csvContent.value,
      nomor_revisi: nextRevisiNumber.value,
      tanggal_revisi: form.value.tanggal_revisi,
      jenis_revisi: form.value.jenis_revisi,
      keterangan: form.value.keterangan,
      // Tambahkan data items untuk dihitung total_pagu
      items: previewData.value?.items || [],
      total_pagu: previewData.value?.totalPagu || 0,
      total_item: previewData.value?.totalItems || 0
    });

    router.push(`/master/dipa/${props.id}`);
  } catch (error) {
    alert('Gagal menyimpan revisi: ' + error.message);
  } finally {
    saving.value = false;
  }
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
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Upload Revisi DIPA</h1>
        <p class="text-gray-500">DIPA Tahun {{ dipa?.tahun_anggaran }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-6">
        <!-- Left Column: Form -->
        <div class="col-span-2 space-y-6">
          <!-- Revisi Info -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold text-gray-800">Informasi Revisi</h2>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Revisi</label>
                  <input
                    type="text"
                    :value="nextRevisiNumber"
                    disabled
                    class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium"
                  />
                  <p class="mt-1 text-xs text-gray-500">Nomor otomatis</p>
                </div>
                <FormInput
                  v-model="form.tanggal_revisi"
                  label="Tanggal Revisi"
                  type="date"
                  required
                />
              </div>

              <FormSelect
                v-model="form.jenis_revisi"
                label="Jenis Revisi"
                :options="jenisRevisiOptions"
                required
              />

              <FormTextarea
                v-model="form.keterangan"
                label="Keterangan"
                rows="2"
                placeholder="Catatan atau keterangan revisi (opsional)"
              />
            </div>
          </div>

          <!-- File Upload -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold text-gray-800">Upload File CSV</h2>
            </div>
            <div class="p-6">
              <div
                v-if="!csvFile"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @drop="handleDrop"
                :class="[
                  'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
                  dragover ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                ]"
              >
                <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                </div>
                <p class="text-gray-600 mb-2">Drag & drop file CSV di sini</p>
                <p class="text-gray-400 text-sm mb-4">atau</p>
                <label class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  Pilih File
                  <input
                    type="file"
                    accept=".csv"
                    class="hidden"
                    @change="handleFileInput"
                  />
                </label>
                <p class="mt-4 text-xs text-gray-400">Format: CSV dari SAKTI (UTF-8)</p>
              </div>

              <div v-else class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-800">{{ csvFile.name }}</p>
                      <p class="text-sm text-gray-500">{{ (csvFile.size / 1024).toFixed(1) }} KB</p>
                    </div>
                  </div>
                  <button
                    @click="clearFile"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <!-- Parsing State -->
                <div v-if="parsing" class="flex items-center justify-center py-8">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span class="text-gray-600">Membaca file...</span>
                </div>

                <!-- Parse Error -->
                <div v-if="parseError" class="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div class="flex items-center text-red-700">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ parseError }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="hasPreview" class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold text-gray-800">Preview Data</h2>
            </div>
            <div class="p-6">
              <!-- Summary Stats -->
              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                  <p class="text-2xl font-bold text-blue-600">{{ previewData.totalItems }}</p>
                  <p class="text-sm text-gray-600">Jumlah Baris</p>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                  <p class="text-xl font-bold text-green-600">{{ formatRupiah(previewData.totalPagu) }}</p>
                  <p class="text-sm text-gray-600">Total Pagu</p>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                  <p class="text-2xl font-bold text-purple-600">{{ Object.keys(previewData.programSummary || {}).length }}</p>
                  <p class="text-sm text-gray-600">Program</p>
                </div>
              </div>

              <!-- Program Summary -->
              <div class="mb-6">
                <h3 class="text-sm font-medium text-gray-700 mb-2">Ringkasan per Program</h3>
                <div class="space-y-2">
                  <div
                    v-for="(data, program) in previewData.programSummary"
                    :key="program"
                    class="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <span class="font-mono text-sm">{{ program }}</span>
                    <div class="text-right">
                      <span class="font-medium">{{ formatRupiah(data.total) }}</span>
                      <span class="text-gray-500 text-sm ml-2">({{ data.count }} item)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Akun Summary -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Ringkasan per Akun (2 digit)</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="(data, akun) in previewData.akunSummary"
                    :key="akun"
                    class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                  >
                    <span class="font-mono">{{ akun }}xxxx</span>
                    <span class="font-medium">{{ formatRupiah(data.total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Info -->
        <div class="space-y-6">
          <!-- Current DIPA Info -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">DIPA {{ dipa?.tahun_anggaran }}</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">Nomor DIPA</dt>
                <dd class="font-medium">{{ dipa?.nomor_dipa || '-' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Total Revisi</dt>
                <dd class="font-medium">{{ dipaStore.revisiList.length }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Pagu Terakhir</dt>
                <dd class="font-medium text-blue-600">{{ formatRupiah(dipa?.total_pagu) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Instructions -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-yellow-800 mb-2">Petunjuk Upload</h3>
            <ul class="text-sm text-yellow-700 space-y-1">
              <li>1. Ekspor data dari SAKTI dalam format CSV</li>
              <li>2. Pastikan file menggunakan encoding UTF-8</li>
              <li>3. Kolom wajib: KODE_AKUN, TOTAL</li>
              <li>4. Preview data sebelum menyimpan</li>
            </ul>
          </div>

          <!-- Format Info -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Kolom yang Didukung</h3>
            <div class="text-xs text-gray-600 font-mono space-y-1">
              <p>KDSATKER, KODE_PROGRAM</p>
              <p>KODE_KEGIATAN, KODE_OUTPUT</p>
              <p>KODE_KOMPONEN, KODE_AKUN</p>
              <p>URAIAN_ITEM, VOLKEG, SATKEG</p>
              <p>HARGASAT, TOTAL</p>
              <p>POK_NILAI_1 - POK_NILAI_12</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-4">
        <button
          @click="goBack"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          @click="saveRevisi"
          :disabled="saving || !hasPreview"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan Revisi' }}
        </button>
      </div>
    </template>
  </div>
</template>
