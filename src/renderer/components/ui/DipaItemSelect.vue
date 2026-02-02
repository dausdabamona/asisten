<script setup>
/**
 * DipaItemSelect Component
 * Cascading dropdown for selecting DIPA budget items
 * Used in transaction forms to select budget allocation
 */
import { ref, computed, watch, onMounted } from 'vue';
import { useDipaStore } from '../../stores/dipaStore';
import FormSelect from './FormSelect.vue';

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  tahunAnggaran: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  label: {
    type: String,
    default: 'Pilih Item Anggaran'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'select']);

const dipaStore = useDipaStore();

// Local state
const loading = ref(false);
const hierarki = ref({});
const selectedProgram = ref('');
const selectedKegiatan = ref('');
const selectedOutput = ref('');
const selectedKomponen = ref('');
const selectedSubkomponen = ref('');
const selectedAkun = ref('');
const selectedItem = ref(null);

// Computed options
const programOptions = computed(() => {
  const programs = Object.keys(hierarki.value);
  return [
    { value: '', label: 'Pilih Program...' },
    ...programs.map(p => ({ value: p, label: `Program ${p}` }))
  ];
});

const kegiatanOptions = computed(() => {
  if (!selectedProgram.value || !hierarki.value[selectedProgram.value]) {
    return [{ value: '', label: 'Pilih Kegiatan...' }];
  }
  const kegiatans = Object.keys(hierarki.value[selectedProgram.value].children || {});
  return [
    { value: '', label: 'Pilih Kegiatan...' },
    ...kegiatans.map(k => ({ value: k, label: `Kegiatan ${k}` }))
  ];
});

const outputOptions = computed(() => {
  if (!selectedProgram.value || !selectedKegiatan.value) {
    return [{ value: '', label: 'Pilih Output...' }];
  }
  const program = hierarki.value[selectedProgram.value];
  const kegiatan = program?.children?.[selectedKegiatan.value];
  const outputs = Object.keys(kegiatan?.children || {});
  return [
    { value: '', label: 'Pilih Output...' },
    ...outputs.map(o => ({ value: o, label: `Output ${o}` }))
  ];
});

const komponenOptions = computed(() => {
  if (!selectedProgram.value || !selectedKegiatan.value || !selectedOutput.value) {
    return [{ value: '', label: 'Pilih Komponen...' }];
  }
  const program = hierarki.value[selectedProgram.value];
  const kegiatan = program?.children?.[selectedKegiatan.value];
  const output = kegiatan?.children?.[selectedOutput.value];
  const komponens = Object.keys(output?.children || {});
  return [
    { value: '', label: 'Pilih Komponen...' },
    ...komponens.map(k => ({ value: k, label: `Komponen ${k}` }))
  ];
});

const subkomponenOptions = computed(() => {
  if (!selectedProgram.value || !selectedKegiatan.value || !selectedOutput.value || !selectedKomponen.value) {
    return [{ value: '', label: 'Pilih Sub Komponen...' }];
  }
  const program = hierarki.value[selectedProgram.value];
  const kegiatan = program?.children?.[selectedKegiatan.value];
  const output = kegiatan?.children?.[selectedOutput.value];
  const komponen = output?.children?.[selectedKomponen.value];
  const subkomponens = Object.entries(komponen?.children || {});
  return [
    { value: '', label: 'Pilih Sub Komponen...' },
    ...subkomponens.map(([k, v]) => ({
      value: k,
      label: `${k} - ${v.uraian || 'Sub Komponen'}`
    }))
  ];
});

const akunOptions = computed(() => {
  if (!selectedProgram.value || !selectedKegiatan.value || !selectedOutput.value ||
      !selectedKomponen.value || !selectedSubkomponen.value) {
    return [{ value: '', label: 'Pilih Akun/MAK...' }];
  }
  const program = hierarki.value[selectedProgram.value];
  const kegiatan = program?.children?.[selectedKegiatan.value];
  const output = kegiatan?.children?.[selectedOutput.value];
  const komponen = output?.children?.[selectedKomponen.value];
  const subkomponen = komponen?.children?.[selectedSubkomponen.value];
  const akuns = Object.entries(subkomponen?.children || {});
  return [
    { value: '', label: 'Pilih Akun/MAK...' },
    ...akuns.map(([k, v]) => ({
      value: k,
      label: `${k} - ${formatRupiah(v.total_pagu)} (Sisa: ${formatRupiah((v.total_pagu || 0) - (v.total_realisasi || 0))})`
    }))
  ];
});

const selectedAkunData = computed(() => {
  if (!selectedProgram.value || !selectedKegiatan.value || !selectedOutput.value ||
      !selectedKomponen.value || !selectedSubkomponen.value || !selectedAkun.value) {
    return null;
  }
  const program = hierarki.value[selectedProgram.value];
  const kegiatan = program?.children?.[selectedKegiatan.value];
  const output = kegiatan?.children?.[selectedOutput.value];
  const komponen = output?.children?.[selectedKomponen.value];
  const subkomponen = komponen?.children?.[selectedSubkomponen.value];
  return subkomponen?.children?.[selectedAkun.value] || null;
});

const sisaPagu = computed(() => {
  if (!selectedAkunData.value) return 0;
  return (selectedAkunData.value.total_pagu || 0) -
         (selectedAkunData.value.total_realisasi || 0) -
         (selectedAkunData.value.total_blokir || 0);
});

// Methods
const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const loadHierarki = async () => {
  loading.value = true;
  try {
    // Get DIPA for current year
    await dipaStore.fetchDipaList(props.tahunAnggaran);
    const dipa = dipaStore.dipaList.find(d => d.tahun_anggaran === props.tahunAnggaran);

    if (dipa) {
      await dipaStore.fetchRevisiList(dipa.id);
      const activeRevisi = dipaStore.activeRevisi;

      if (activeRevisi) {
        hierarki.value = await dipaStore.getHierarki(activeRevisi.id);
      }
    }
  } catch (error) {
    console.error('Failed to load hierarki:', error);
  } finally {
    loading.value = false;
  }
};

const resetSelections = (from = 'program') => {
  const levels = ['program', 'kegiatan', 'output', 'komponen', 'subkomponen', 'akun'];
  const startIndex = levels.indexOf(from) + 1;

  if (startIndex <= 1) selectedKegiatan.value = '';
  if (startIndex <= 2) selectedOutput.value = '';
  if (startIndex <= 3) selectedKomponen.value = '';
  if (startIndex <= 4) selectedSubkomponen.value = '';
  if (startIndex <= 5) selectedAkun.value = '';

  selectedItem.value = null;
  emit('update:modelValue', null);
  emit('select', null);
};

const handleAkunSelect = () => {
  if (!selectedAkun.value || !selectedAkunData.value) {
    selectedItem.value = null;
    emit('update:modelValue', null);
    emit('select', null);
    return;
  }

  const itemData = {
    kode_program: selectedProgram.value,
    kode_kegiatan: selectedKegiatan.value,
    kode_output: selectedOutput.value,
    kode_komponen: selectedKomponen.value,
    kode_subkomponen: selectedSubkomponen.value,
    kode_akun: selectedAkun.value,
    total_pagu: selectedAkunData.value.total_pagu,
    total_realisasi: selectedAkunData.value.total_realisasi,
    sisa_pagu: sisaPagu.value
  };

  selectedItem.value = itemData;
  emit('update:modelValue', selectedAkun.value);
  emit('select', itemData);
};

// Watch for cascading resets
watch(selectedProgram, () => resetSelections('program'));
watch(selectedKegiatan, () => resetSelections('kegiatan'));
watch(selectedOutput, () => resetSelections('output'));
watch(selectedKomponen, () => resetSelections('komponen'));
watch(selectedSubkomponen, () => resetSelections('subkomponen'));
watch(selectedAkun, handleAkunSelect);

// Watch for tahunAnggaran changes
watch(() => props.tahunAnggaran, () => {
  resetSelections('program');
  selectedProgram.value = '';
  loadHierarki();
});

onMounted(() => {
  loadHierarki();
});
</script>

<template>
  <div class="space-y-4">
    <label v-if="label" class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center text-gray-500">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
      Memuat data anggaran...
    </div>

    <!-- Cascading Dropdowns -->
    <div v-else class="grid grid-cols-2 gap-4">
      <FormSelect
        v-model="selectedProgram"
        :options="programOptions"
        placeholder="Pilih Program"
        :disabled="disabled"
      />

      <FormSelect
        v-model="selectedKegiatan"
        :options="kegiatanOptions"
        placeholder="Pilih Kegiatan"
        :disabled="disabled || !selectedProgram"
      />

      <FormSelect
        v-model="selectedOutput"
        :options="outputOptions"
        placeholder="Pilih Output"
        :disabled="disabled || !selectedKegiatan"
      />

      <FormSelect
        v-model="selectedKomponen"
        :options="komponenOptions"
        placeholder="Pilih Komponen"
        :disabled="disabled || !selectedOutput"
      />

      <FormSelect
        v-model="selectedSubkomponen"
        :options="subkomponenOptions"
        placeholder="Pilih Sub Komponen"
        :disabled="disabled || !selectedKomponen"
      />

      <FormSelect
        v-model="selectedAkun"
        :options="akunOptions"
        placeholder="Pilih Akun/MAK"
        :disabled="disabled || !selectedSubkomponen"
      />
    </div>

    <!-- Selected Info -->
    <div v-if="selectedAkunData" class="p-4 bg-blue-50 rounded-lg">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-sm text-gray-600">Kode Anggaran:</p>
          <p class="font-mono text-sm font-medium text-gray-800">
            {{ selectedProgram }}.{{ selectedKegiatan }}.{{ selectedOutput }}.{{ selectedKomponen }}.{{ selectedSubkomponen }}.{{ selectedAkun }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-600">Sisa Pagu Tersedia:</p>
          <p :class="['text-lg font-bold', sisaPagu > 0 ? 'text-green-600' : 'text-red-600']">
            {{ formatRupiah(sisaPagu) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
  </div>
</template>
