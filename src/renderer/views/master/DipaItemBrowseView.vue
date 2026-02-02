<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDipaStore } from '../../stores/dipaStore';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormInput from '../../components/ui/FormInput.vue';
import DipaTreeView from '../../components/ui/DipaTreeView.vue';
import BaseModal from '../../components/ui/BaseModal.vue';

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
const loadingTree = ref(false);
const selectedRevisiId = ref(null);
const searchQuery = ref('');
const searchTimeout = ref(null);

// Filter state
const filterProgram = ref('');
const filterKegiatan = ref('');
const filterAkun = ref('');

// Item detail modal
const showItemModal = ref(false);
const selectedItem = ref(null);
const loadingItems = ref(false);
const itemDetails = ref([]);

// Computed
const dipa = computed(() => dipaStore.currentDipa);
const revisiList = computed(() => dipaStore.revisiList);
const hierarki = computed(() => dipaStore.hierarki);
const activeRevisi = computed(() => dipaStore.activeRevisi);

const revisiOptions = computed(() => {
  return revisiList.value.map(r => ({
    value: r.id,
    label: `Revisi ${r.nomor_revisi}${r.is_active ? ' (Aktif)' : ''} - ${formatShortDate(r.tanggal_revisi)}`
  }));
});

const filteredHierarki = computed(() => {
  if (!hierarki.value) return {};

  let filtered = { ...hierarki.value };

  // Filter by program
  if (filterProgram.value) {
    const newFiltered = {};
    if (filtered[filterProgram.value]) {
      newFiltered[filterProgram.value] = filtered[filterProgram.value];
    }
    filtered = newFiltered;
  }

  return filtered;
});

const programOptions = computed(() => {
  const programs = Object.keys(hierarki.value || {});
  return [
    { value: '', label: 'Semua Program' },
    ...programs.map(p => ({ value: p, label: p }))
  ];
});

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatShortDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID');
};

// Methods
const loadData = async () => {
  loading.value = true;
  try {
    await dipaStore.fetchDipaById(props.id);
    await dipaStore.fetchRevisiList(props.id);

    // Select active revisi by default
    if (activeRevisi.value) {
      selectedRevisiId.value = activeRevisi.value.id;
      await loadHierarki();
    } else if (revisiList.value.length > 0) {
      selectedRevisiId.value = revisiList.value[0].id;
      await loadHierarki();
    }
  } finally {
    loading.value = false;
  }
};

const loadHierarki = async () => {
  if (!selectedRevisiId.value) return;

  loadingTree.value = true;
  try {
    await dipaStore.getHierarki(selectedRevisiId.value);
  } finally {
    loadingTree.value = false;
  }
};

const goBack = () => {
  router.push(`/master/dipa/${props.id}`);
};

const handleRevisiChange = async () => {
  await loadHierarki();
  filterProgram.value = '';
  filterKegiatan.value = '';
  filterAkun.value = '';
};

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    // Search logic here
  }, 300);
};

const handleNodeSelect = async (node) => {
  if (node.type === 'akun') {
    selectedItem.value = node;
    showItemModal.value = true;
    await loadItemDetails(node);
  }
};

const loadItemDetails = async (node) => {
  if (!selectedRevisiId.value) return;

  loadingItems.value = true;
  try {
    // Get items for this akun
    const result = await dipaStore.fetchDipaItems(selectedRevisiId.value, {
      kode_akun: node.kode,
      limit: 100
    });
    itemDetails.value = result?.data || [];
  } finally {
    loadingItems.value = false;
  }
};

const getTotalStats = () => {
  let totalPagu = 0;
  let totalRealisasi = 0;
  let totalBlokir = 0;

  Object.values(hierarki.value || {}).forEach(program => {
    totalPagu += program.total_pagu || 0;
    totalRealisasi += program.total_realisasi || 0;
    totalBlokir += program.total_blokir || 0;
  });

  return { totalPagu, totalRealisasi, totalBlokir };
};

watch(selectedRevisiId, handleRevisiChange);

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
        <h1 class="text-2xl font-bold text-gray-800">Browse Anggaran</h1>
        <p class="text-gray-500">DIPA Tahun {{ dipa?.tahun_anggaran }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <template v-else>
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-4 gap-4">
          <FormSelect
            v-model="selectedRevisiId"
            :options="revisiOptions"
            label="Pilih Revisi"
            placeholder="Pilih revisi..."
          />

          <FormSelect
            v-model="filterProgram"
            :options="programOptions"
            label="Filter Program"
          />

          <FormInput
            v-model="searchQuery"
            label="Cari"
            placeholder="Cari uraian, kode akun..."
            @input="handleSearch"
          />

          <div class="flex items-end">
            <button
              @click="loadHierarki"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total Pagu</p>
          <p class="text-xl font-bold text-gray-800">{{ formatRupiah(getTotalStats().totalPagu) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total Realisasi</p>
          <p class="text-xl font-bold text-green-600">{{ formatRupiah(getTotalStats().totalRealisasi) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total Blokir</p>
          <p class="text-xl font-bold text-red-600">{{ formatRupiah(getTotalStats().totalBlokir) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Sisa Tersedia</p>
          <p class="text-xl font-bold text-blue-600">
            {{ formatRupiah(getTotalStats().totalPagu - getTotalStats().totalRealisasi - getTotalStats().totalBlokir) }}
          </p>
        </div>
      </div>

      <!-- Tree View -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Struktur Anggaran</h2>
          <div class="text-sm text-gray-500 hidden lg:flex items-center space-x-6">
            <span class="w-28 text-right">Pagu</span>
            <span class="w-24 text-right">Realisasi</span>
            <span class="w-24 text-right">Sisa</span>
            <span class="w-16"></span>
          </div>
        </div>

        <div class="p-4">
          <!-- Loading Tree -->
          <div v-if="loadingTree" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- No Data -->
          <div v-else-if="!hierarki || Object.keys(hierarki).length === 0" class="text-center py-12">
            <p class="text-gray-500">Tidak ada data untuk revisi ini</p>
          </div>

          <!-- Tree -->
          <div v-else class="space-y-1">
            <DipaTreeView
              v-for="(program, kode) in filteredHierarki"
              :key="kode"
              :node="program"
              :label="kode"
              :level="0"
              :expanded-by-default="Object.keys(filteredHierarki).length === 1"
              @select="handleNodeSelect"
            />
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="bg-gray-50 rounded-lg p-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Legenda:</p>
        <div class="flex flex-wrap gap-4 text-sm">
          <span class="flex items-center"><span class="mr-1">📁</span> Program</span>
          <span class="flex items-center"><span class="mr-1">📋</span> Kegiatan</span>
          <span class="flex items-center"><span class="mr-1">📦</span> Output</span>
          <span class="flex items-center"><span class="mr-1">🔧</span> Komponen</span>
          <span class="flex items-center"><span class="mr-1">📝</span> Sub Komponen</span>
          <span class="flex items-center"><span class="mr-1">💰</span> Akun/MAK</span>
        </div>
      </div>
    </template>

    <!-- Item Detail Modal -->
    <BaseModal
      :show="showItemModal"
      :title="`Detail Akun ${selectedItem?.kode || ''}`"
      size="lg"
      @close="showItemModal = false"
    >
      <div v-if="loadingItems" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <template v-else>
        <!-- Akun Summary -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500">Pagu</p>
            <p class="font-bold text-gray-800">{{ formatRupiah(selectedItem?.total_pagu) }}</p>
          </div>
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <p class="text-sm text-gray-500">Realisasi</p>
            <p class="font-bold text-green-600">{{ formatRupiah(selectedItem?.total_realisasi) }}</p>
          </div>
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-gray-500">Sisa</p>
            <p class="font-bold text-blue-600">
              {{ formatRupiah((selectedItem?.total_pagu || 0) - (selectedItem?.total_realisasi || 0) - (selectedItem?.total_blokir || 0)) }}
            </p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Uraian</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Vol</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Sat</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Harga</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, index) in itemDetails" :key="item.id">
                <td class="px-3 py-2 text-gray-500">{{ index + 1 }}</td>
                <td class="px-3 py-2 text-gray-800 max-w-xs truncate">{{ item.uraian_item }}</td>
                <td class="px-3 py-2 text-right text-gray-600">{{ item.volume }}</td>
                <td class="px-3 py-2 text-gray-600">{{ item.satuan }}</td>
                <td class="px-3 py-2 text-right text-gray-600">{{ formatRupiah(item.harga_satuan) }}</td>
                <td class="px-3 py-2 text-right font-medium text-gray-800">{{ formatRupiah(item.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="itemDetails.length === 0" class="text-center py-8 text-gray-500">
          Tidak ada item detail
        </p>
      </template>

      <template #footer>
        <button
          @click="showItemModal = false"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Tutup
        </button>
      </template>
    </BaseModal>
  </div>
</template>
