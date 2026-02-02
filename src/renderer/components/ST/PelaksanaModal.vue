<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click.self="$emit('close')">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Tambah Pelaksana Perjalanan Dinas</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search & Filter -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama pegawai, NIP..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="filterPegawai"
        />
      </div>

      <!-- Daftar Pegawai -->
      <div class="max-h-96 overflow-y-auto border rounded-lg">
        <div v-if="filteredPegawai.length === 0" class="p-4 text-center text-gray-500">
          Tidak ada pegawai yang tersedia
        </div>

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Golongan</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pilih</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="pegawai in filteredPegawai" :key="pegawai.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ pegawai.nama }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ pegawai.nip }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ pegawai.golongan }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ pegawai.jabatan }}</td>
              <td class="px-4 py-3 text-center">
                <button
                  @click="selectPegawai(pegawai)"
                  :disabled="isPelaksanaExist(pegawai.id)"
                  class="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {{ isPelaksanaExist(pegawai.id) ? 'Sudah' : 'Pilih' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Actions -->
      <div class="mt-4 flex justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  existingPelaksana: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'select']);

const searchQuery = ref('');

// Dummy data - dalam implementasi real akan diambil dari store
const pegawaiList = ref([
  { id: 1, nama: 'Andi Pratama', nip: '197503121999031001', golongan: 'III/d', jabatan: 'Kepala Seksi' },
  { id: 2, nama: 'Budi Santoso', nip: '198001152005011001', golongan: 'III/c', jabatan: 'Staf Ahli' },
  { id: 3, nama: 'Citra Dewi', nip: '198512062008012001', golongan: 'III/b', jabatan: 'Analis Kebijakan' },
  { id: 4, nama: 'Dedi Hermawan', nip: '199001011996031003', golongan: 'II/d', jabatan: 'Kepala Bidang' },
  { id: 5, nama: 'Eka Putri', nip: '199505141992032001', golongan: 'III/a', jabatan: 'Staf Fungsional' }
]);

const filteredPegawai = computed(() => {
  if (!searchQuery.value) {
    return pegawaiList.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return pegawaiList.value.filter(p =>
    p.nama.toLowerCase().includes(query) ||
    p.nip.includes(query)
  );
});

const isPelaksanaExist = (pegawaiId) => {
  return props.existingPelaksana.some(p => p.pegawai_id === pegawaiId || p.id === pegawaiId);
};

const filterPegawai = () => {
  // Filter logic handled by computed property
};

const selectPegawai = (pegawai) => {
  if (!isPelaksanaExist(pegawai.id)) {
    emit('select', {
      pegawai_id: pegawai.id,
      nama: pegawai.nama,
      nip: pegawai.nip,
      golongan: pegawai.golongan,
      jabatan: pegawai.jabatan
    });
  }
};
</script>

<style scoped>
.max-h-96 {
  max-height: 384px;
}
</style>
