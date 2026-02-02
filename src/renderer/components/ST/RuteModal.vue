<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click.self="$emit('close')">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Tambah Rute Perjalanan</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Dari Kota -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Dari Kota <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.dari_kota"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih Kota</option>
              <option value="Sorong">Sorong</option>
              <option value="Jakarta">Jakarta</option>
              <option value="Bandung">Bandung</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Medan">Medan</option>
              <option value="Palembang">Palembang</option>
              <option value="Yogyakarta">Yogyakarta</option>
              <option value="Semarang">Semarang</option>
              <option value="Makassar">Makassar</option>
              <option value="Manado">Manado</option>
              <option value="Pontianak">Pontianak</option>
              <option value="Banjarmasin">Banjarmasin</option>
            </select>
            <p v-if="errors.dari_kota" class="mt-1 text-xs text-red-500">{{ errors.dari_kota }}</p>
          </div>

          <!-- Ke Kota -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ke Kota <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.ke_kota"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih Kota</option>
              <option value="Sorong">Sorong</option>
              <option value="Jakarta">Jakarta</option>
              <option value="Bandung">Bandung</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Medan">Medan</option>
              <option value="Palembang">Palembang</option>
              <option value="Yogyakarta">Yogyakarta</option>
              <option value="Semarang">Semarang</option>
              <option value="Makassar">Makassar</option>
              <option value="Manado">Manado</option>
              <option value="Pontianak">Pontianak</option>
              <option value="Banjarmasin">Banjarmasin</option>
            </select>
            <p v-if="errors.ke_kota" class="mt-1 text-xs text-red-500">{{ errors.ke_kota }}</p>
          </div>

          <!-- Tanggal -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Perjalanan <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.tanggal"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p v-if="errors.tanggal" class="mt-1 text-xs text-red-500">{{ errors.tanggal }}</p>
          </div>

          <!-- Moda Transport -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Moda Transport <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.moda_transport"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih Moda</option>
              <option value="PESAWAT">Pesawat</option>
              <option value="MOBIL">Mobil</option>
              <option value="KERETA">Kereta Api</option>
              <option value="KAPAL">Kapal</option>
              <option value="BUS">Bus</option>
            </select>
            <p v-if="errors.moda_transport" class="mt-1 text-xs text-red-500">{{ errors.moda_transport }}</p>
          </div>

          <!-- Kelas -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kelas/Tipe</label>
            <select
              v-model="form.kelas"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-</option>
              <option value="EKONOMI">Ekonomi</option>
              <option value="BISNIS">Bisnis</option>
              <option value="FIRST">First Class</option>
              <option value="EXECUTIVE">Executive</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          <!-- Estimasi Biaya -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estimasi Biaya</label>
            <input
              v-model.number="form.estimasi_biaya"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
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
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Rute
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  kotaAsal: String,
  kotaTujuan: String
});

const emit = defineEmits(['close', 'add']);

const form = ref({
  dari_kota: props.kotaAsal || '',
  ke_kota: props.kotaTujuan || '',
  tanggal: '',
  moda_transport: '',
  kelas: '',
  estimasi_biaya: 0
});

const errors = ref({});

const handleSubmit = () => {
  errors.value = {};

  if (!form.value.dari_kota) {
    errors.value.dari_kota = 'Harus dipilih';
  }
  if (!form.value.ke_kota) {
    errors.value.ke_kota = 'Harus dipilih';
  }
  if (!form.value.tanggal) {
    errors.value.tanggal = 'Harus diisi';
  }
  if (!form.value.moda_transport) {
    errors.value.moda_transport = 'Harus dipilih';
  }

  if (Object.keys(errors.value).length === 0) {
    emit('add', {
      urutan: 1, // Will be set by parent
      ...form.value
    });
  }
};
</script>
