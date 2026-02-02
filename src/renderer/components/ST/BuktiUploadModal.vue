<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click.self="$emit('close')">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Upload Bukti Perjalanan Dinas</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Jenis Bukti -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Jenis Bukti <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.jenis_bukti"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Pilih Jenis Bukti</option>
            <option value="BOARDING_PASS">Boarding Pass / Tiket Pesawat</option>
            <option value="BILL_HOTEL">Bill Hotel / Kwitansi Penginapan</option>
            <option value="TRANSPORT_LOKAL">Bukti Transport Lokal (Taksi/Ojek)</option>
            <option value="SPPD_TTD">SPPD yang Ditandatangani</option>
            <option value="FOTO">Foto Dokumentasi Kegiatan</option>
            <option value="DAFTAR_HADIR">Daftar Hadir Peserta</option>
            <option value="SERTIFIKAT">Sertifikat / Piagam Penghargaan</option>
            <option value="LAINNYA">Dokumen Lainnya</option>
          </select>
          <p v-if="errors.jenis_bukti" class="mt-1 text-xs text-red-500">{{ errors.jenis_bukti }}</p>
        </div>

        <!-- File Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Upload File <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              class="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />
            <button
              type="button"
              @click="$refs.fileInput.click()"
              class="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
            >
              <div v-if="!selectedFile" class="space-y-2">
                <svg class="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="text-sm text-gray-600">Klik untuk upload atau drag & drop</p>
                <p class="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG, GIF (max 10MB)</p>
              </div>
              <div v-else class="flex items-center justify-center gap-2">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-green-600">{{ selectedFile.name }}</span>
              </div>
            </button>
          </div>
          <p v-if="errors.file" class="mt-1 text-xs text-red-500">{{ errors.file }}</p>
        </div>

        <!-- Keterangan -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
          <textarea
            v-model="form.keterangan"
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Uraian singkat tentang bukti perjalanan..."
          ></textarea>
        </div>

        <!-- GPS Tagging (untuk foto) -->
        <div v-if="form.jenis_bukti === 'FOTO'" class="space-y-3">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800">Foto dokumentasi akan di-tag dengan GPS lokasi otomatis jika tersedia</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Latitude (Opsional)</label>
              <input
                v-model.number="form.latitude"
                type="number"
                step="0.0001"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="-8.7445"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Longitude (Opsional)</label>
              <input
                v-model.number="form.longitude"
                type="number"
                step="0.0001"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="131.3040"
              />
            </div>
          </div>

          <button
            type="button"
            @click="getCurrentLocation"
            class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Gunakan Lokasi Saat Ini
          </button>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="!selectedFile || !form.jenis_bukti"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close', 'upload']);

const fileInput = ref(null);
const selectedFile = ref(null);

const form = ref({
  jenis_bukti: '',
  keterangan: '',
  latitude: null,
  longitude: null,
  tanggal_foto: new Date().toISOString()
});

const errors = ref({});

const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.value.file = 'Ukuran file terlalu besar (max 10MB)';
      selectedFile.value = null;
      return;
    }
    errors.value.file = '';
    selectedFile.value = file;
  }
};

const getCurrentLocation = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.value.latitude = position.coords.latitude;
        form.value.longitude = position.coords.longitude;
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Tidak dapat mengakses lokasi GPS: ' + error.message);
      }
    );
  } else {
    alert('GPS tidak tersedia di device Anda');
  }
};

const handleSubmit = () => {
  errors.value = {};

  if (!form.value.jenis_bukti) {
    errors.value.jenis_bukti = 'Harus dipilih';
  }
  if (!selectedFile.value) {
    errors.value.file = 'File harus dipilih';
  }

  if (Object.keys(errors.value).length === 0) {
    emit('upload', {
      jenis_bukti: form.value.jenis_bukti,
      nama_file: selectedFile.value.name,
      file_path: URL.createObjectURL(selectedFile.value),
      keterangan: form.value.keterangan,
      latitude: form.value.latitude,
      longitude: form.value.longitude,
      tanggal_foto: form.value.tanggal_foto,
      file: selectedFile.value
    });
  }
};
</script>
