<script setup>
/**
 * SbmLookup Component
 * Lookup component for SBM tariff in transaction forms
 * Supports Uang Harian, Transport, and Honorarium lookups
 */
import { ref, computed, watch, onMounted } from 'vue';
import { useSbmStore } from '../../stores/sbmStore';
import FormSelect from './FormSelect.vue';
import FormInput from './FormInput.vue';

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['uang-harian', 'transport', 'honorarium'].includes(value)
  },
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  tahun: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'select']);

const sbmStore = useSbmStore();

// Local state
const loading = ref(false);
const searchQuery = ref('');
const selectedValue = ref(props.modelValue);
const showDropdown = ref(false);
const lookupResults = ref([]);

// For uang harian
const selectedProvinsi = ref('');
const selectedKota = ref('');

// For transport
const selectedAsal = ref('');
const selectedTujuan = ref('');
const selectedModa = ref('');

// For honorarium
const selectedKategori = ref('');
const selectedKualifikasi = ref('');

// Computed
const computedLabel = computed(() => {
  if (props.label) return props.label;
  switch (props.type) {
    case 'uang-harian': return 'Tarif Uang Harian';
    case 'transport': return 'Tarif Transport';
    case 'honorarium': return 'Tarif Honorarium';
    default: return 'Tarif SBM';
  }
});

const kategoriOptions = [
  { value: '', label: 'Semua Kategori' },
  { value: 'NARASUMBER', label: 'Narasumber' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'PJLP', label: 'PJLP' }
];

const modaOptions = [
  { value: '', label: 'Semua Moda' },
  { value: 'PESAWAT', label: 'Pesawat' },
  { value: 'KAPAL', label: 'Kapal Laut' },
  { value: 'KERETA', label: 'Kereta Api' },
  { value: 'BUS', label: 'Bus' },
  { value: 'MOBIL', label: 'Mobil/Taksi' }
];

const selectedItem = computed(() => {
  if (!selectedValue.value) return null;
  return lookupResults.value.find(item => {
    if (props.type === 'uang-harian') {
      return item.id === selectedValue.value;
    } else if (props.type === 'transport') {
      return item.id === selectedValue.value;
    } else {
      return item.id === selectedValue.value;
    }
  });
});

// Methods
const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const doLookup = async () => {
  loading.value = true;
  try {
    switch (props.type) {
      case 'uang-harian':
        const uhResult = await sbmStore.lookupUangHarian(
          props.tahun,
          selectedProvinsi.value,
          selectedKota.value
        );
        lookupResults.value = uhResult ? [uhResult] : [];
        break;

      case 'transport':
        const trResult = await sbmStore.lookupTransport(
          props.tahun,
          selectedAsal.value,
          selectedTujuan.value,
          selectedModa.value
        );
        lookupResults.value = Array.isArray(trResult) ? trResult : [];
        break;

      case 'honorarium':
        const hrResult = await sbmStore.lookupHonorarium(
          props.tahun,
          selectedKategori.value,
          selectedKualifikasi.value
        );
        lookupResults.value = Array.isArray(hrResult) ? hrResult : [];
        break;
    }
  } catch (error) {
    console.error('Lookup failed:', error);
    lookupResults.value = [];
  } finally {
    loading.value = false;
  }
};

const loadInitialData = async () => {
  loading.value = true;
  try {
    // Fetch active SBM tahun data
    await sbmStore.fetchSbmTahunList();
    const activeSbm = sbmStore.activeSbmTahun;

    if (activeSbm) {
      switch (props.type) {
        case 'uang-harian':
          await sbmStore.fetchUangHarianList(activeSbm.id);
          lookupResults.value = sbmStore.uangHarianList;
          break;
        case 'transport':
          await sbmStore.fetchTransportList(activeSbm.id);
          lookupResults.value = sbmStore.transportList;
          break;
        case 'honorarium':
          await sbmStore.fetchHonorariumList(activeSbm.id);
          lookupResults.value = sbmStore.honorariumList;
          break;
      }
    }
  } catch (error) {
    console.error('Failed to load initial data:', error);
  } finally {
    loading.value = false;
  }
};

const handleSelect = (item) => {
  selectedValue.value = item.id;

  let tarif = 0;
  switch (props.type) {
    case 'uang-harian':
      tarif = item.uang_harian || 0;
      break;
    case 'transport':
      tarif = item.tarif || 0;
      break;
    case 'honorarium':
      tarif = item.tarif || 0;
      break;
  }

  emit('update:modelValue', tarif);
  emit('select', {
    item,
    tarif,
    type: props.type
  });
  showDropdown.value = false;
};

const clearSelection = () => {
  selectedValue.value = null;
  selectedProvinsi.value = '';
  selectedKota.value = '';
  selectedAsal.value = '';
  selectedTujuan.value = '';
  selectedModa.value = '';
  selectedKategori.value = '';
  selectedKualifikasi.value = '';
  emit('update:modelValue', null);
  emit('select', null);
};

// Watchers
watch([selectedProvinsi, selectedKota], () => {
  if (props.type === 'uang-harian' && (selectedProvinsi.value || selectedKota.value)) {
    doLookup();
  }
});

watch([selectedAsal, selectedTujuan, selectedModa], () => {
  if (props.type === 'transport') {
    doLookup();
  }
});

watch([selectedKategori, selectedKualifikasi], () => {
  if (props.type === 'honorarium') {
    doLookup();
  }
});

onMounted(() => {
  loadInitialData();
});
</script>

<template>
  <div class="space-y-3">
    <label v-if="computedLabel" class="block text-sm font-medium text-gray-700">
      {{ computedLabel }}
    </label>

    <!-- Uang Harian Lookup -->
    <template v-if="type === 'uang-harian'">
      <div class="grid grid-cols-2 gap-3">
        <FormInput
          v-model="selectedProvinsi"
          placeholder="Provinsi"
          :disabled="disabled"
        />
        <FormInput
          v-model="selectedKota"
          placeholder="Kota"
          :disabled="disabled"
        />
      </div>

      <!-- Results -->
      <div v-if="loading" class="flex items-center text-gray-500 text-sm">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        Mencari...
      </div>

      <div v-else-if="lookupResults.length > 0" class="space-y-2">
        <div
          v-for="item in lookupResults"
          :key="item.id"
          @click="handleSelect(item)"
          :class="[
            'p-3 border rounded-lg cursor-pointer transition-colors',
            selectedValue === item.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="font-medium text-gray-800">{{ item.kota }}, {{ item.provinsi }}</p>
              <p v-if="item.tingkat" class="text-sm text-gray-500">Tingkat {{ item.tingkat }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-blue-600">{{ formatRupiah(item.uang_harian) }}</p>
              <p class="text-xs text-gray-500">Penginapan: {{ formatRupiah(item.penginapan) }}</p>
            </div>
          </div>
        </div>
      </div>

      <p v-else-if="selectedProvinsi || selectedKota" class="text-sm text-gray-500">
        Tidak ditemukan tarif yang sesuai
      </p>
    </template>

    <!-- Transport Lookup -->
    <template v-if="type === 'transport'">
      <div class="grid grid-cols-3 gap-3">
        <FormInput
          v-model="selectedAsal"
          placeholder="Asal"
          :disabled="disabled"
        />
        <FormInput
          v-model="selectedTujuan"
          placeholder="Tujuan"
          :disabled="disabled"
        />
        <FormSelect
          v-model="selectedModa"
          :options="modaOptions"
          :disabled="disabled"
        />
      </div>

      <!-- Results -->
      <div v-if="loading" class="flex items-center text-gray-500 text-sm">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        Mencari...
      </div>

      <div v-else-if="lookupResults.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
        <div
          v-for="item in lookupResults"
          :key="item.id"
          @click="handleSelect(item)"
          :class="[
            'p-3 border rounded-lg cursor-pointer transition-colors',
            selectedValue === item.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="font-medium text-gray-800">{{ item.asal }} - {{ item.tujuan }}</p>
              <p class="text-sm text-gray-500">{{ item.moda }} {{ item.kelas ? `(${item.kelas})` : '' }}</p>
            </div>
            <p class="font-semibold text-blue-600">{{ formatRupiah(item.tarif) }}</p>
          </div>
        </div>
      </div>

      <p v-else-if="selectedAsal || selectedTujuan" class="text-sm text-gray-500">
        Tidak ditemukan tarif yang sesuai
      </p>
    </template>

    <!-- Honorarium Lookup -->
    <template v-if="type === 'honorarium'">
      <div class="grid grid-cols-2 gap-3">
        <FormSelect
          v-model="selectedKategori"
          :options="kategoriOptions"
          :disabled="disabled"
        />
        <FormInput
          v-model="selectedKualifikasi"
          placeholder="Cari kualifikasi..."
          :disabled="disabled"
        />
      </div>

      <!-- Results -->
      <div v-if="loading" class="flex items-center text-gray-500 text-sm">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        Mencari...
      </div>

      <div v-else-if="lookupResults.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="item in lookupResults"
          :key="item.id"
          @click="handleSelect(item)"
          :class="[
            'p-3 border rounded-lg cursor-pointer transition-colors',
            selectedValue === item.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="font-medium text-gray-800">{{ item.kualifikasi || '-' }}</p>
              <p class="text-sm text-gray-500">
                <span class="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs mr-2">
                  {{ item.kategori }}
                </span>
                {{ item.satuan || '-' }}
              </p>
            </div>
            <p class="font-semibold text-blue-600">{{ formatRupiah(item.tarif) }}</p>
          </div>
        </div>
      </div>

      <p v-else-if="selectedKategori" class="text-sm text-gray-500">
        Tidak ditemukan tarif yang sesuai
      </p>
    </template>

    <!-- Selected Value Display -->
    <div v-if="selectedItem" class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
      <div class="text-sm">
        <p class="text-gray-600">Tarif terpilih:</p>
        <p class="font-semibold text-blue-700">
          {{ type === 'uang-harian' ? formatRupiah(selectedItem.uang_harian) : formatRupiah(selectedItem.tarif) }}
        </p>
      </div>
      <button
        @click="clearSelection"
        class="text-gray-400 hover:text-gray-600"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>
