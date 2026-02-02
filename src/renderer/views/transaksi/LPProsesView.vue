<script setup>
/**
 * LPProsesView - Process Pengadaan View
 * Step-based UI for processing LP through stages
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLembarPermintaanStore, LP_STATUS, LP_STATUS_LABEL } from '../../stores/lembarPermintaanStore';
import { useSupplierStore } from '../../stores/supplierStore';
import LPStatusBadge from '../../components/lp/LPStatusBadge.vue';
import LPStatusProgress from '../../components/lp/LPStatusProgress.vue';
import LPItemTable from '../../components/lp/LPItemTable.vue';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormTextarea from '../../components/ui/FormTextarea.vue';

const router = useRouter();
const route = useRoute();
const lpStore = useLembarPermintaanStore();
const supplierStore = useSupplierStore();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  step: {
    type: String,
    default: 'penyedia'
  }
});

// State
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const activeStep = ref(props.step);

// Process steps
const steps = [
  { id: 'penyedia', label: 'Pilih Penyedia', status: LP_STATUS.PROSES_PENGADAAN },
  { id: 'kontrak', label: 'Input Kontrak', status: LP_STATUS.KONTRAK },
  { id: 'serah-terima', label: 'Serah Terima', status: LP_STATUS.SERAH_TERIMA },
  { id: 'pembayaran', label: 'Pembayaran', status: LP_STATUS.PEMBAYARAN }
];

// Form data for each step
const penyediaForm = ref({
  supplier_id: null,
  metode_pengadaan: '',
  catatan_pengadaan: ''
});

const kontrakForm = ref({
  no_kontrak: '',
  tanggal_kontrak: '',
  nilai_kontrak: 0,
  ppn: 0,
  pph: 0,
  nilai_kontrak_netto: 0
});

const serahTerimaForm = ref({
  tanggal_bast: '',
  no_bast: '',
  catatan_bast: ''
});

const pembayaranForm = ref({
  no_spm: '',
  tanggal_spm: '',
  no_sp2d: '',
  tanggal_sp2d: '',
  nilai_pembayaran: 0
});

// Computed
const lp = computed(() => lpStore.currentLP);
const items = computed(() => lpStore.currentLPItems);

const supplierOptions = computed(() =>
  supplierStore.supplierList.map(s => ({
    value: s.id,
    label: `${s.nama} - ${s.npwp || 'No NPWP'}`
  }))
);

const metodeOptions = [
  { value: 'PENGADAAN_LANGSUNG', label: 'Pengadaan Langsung' },
  { value: 'PENUNJUKAN_LANGSUNG', label: 'Penunjukan Langsung' },
  { value: 'TENDER', label: 'Tender' },
  { value: 'SELEKSI', label: 'Seleksi' },
  { value: 'E_PURCHASING', label: 'E-Purchasing' }
];

const currentStepIndex = computed(() =>
  steps.findIndex(s => s.id === activeStep.value)
);

const isStepEnabled = (stepId) => {
  const stepIndex = steps.findIndex(s => s.id === stepId);
  const currentStatus = lp.value?.status;

  // Map status to step
  const statusToStep = {
    [LP_STATUS.PROSES_PENGADAAN]: 0,
    [LP_STATUS.KONTRAK]: 1,
    [LP_STATUS.SERAH_TERIMA]: 2,
    [LP_STATUS.PEMBAYARAN]: 3,
    [LP_STATUS.SELESAI]: 4
  };

  const currentStepForStatus = statusToStep[currentStatus] ?? -1;
  return stepIndex <= currentStepForStatus;
};

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Methods
const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    await Promise.all([
      lpStore.fetchLPById(props.id),
      lpStore.fetchLPItems(props.id),
      supplierStore.fetchSupplierList()
    ]);

    // Populate forms with existing data
    if (lp.value) {
      penyediaForm.value = {
        supplier_id: lp.value.supplier_id,
        metode_pengadaan: lp.value.metode_pengadaan || '',
        catatan_pengadaan: lp.value.catatan_pengadaan || ''
      };

      kontrakForm.value = {
        no_kontrak: lp.value.no_kontrak || '',
        tanggal_kontrak: lp.value.tanggal_kontrak || '',
        nilai_kontrak: lp.value.nilai_kontrak || lp.value.nilai_total || 0,
        ppn: lp.value.ppn || 0,
        pph: lp.value.pph || 0,
        nilai_kontrak_netto: lp.value.nilai_kontrak_netto || 0
      };

      serahTerimaForm.value = {
        tanggal_bast: lp.value.tanggal_bast || '',
        no_bast: lp.value.no_bast || '',
        catatan_bast: lp.value.catatan_bast || ''
      };

      pembayaranForm.value = {
        no_spm: lp.value.no_spm || '',
        tanggal_spm: lp.value.tanggal_spm || '',
        no_sp2d: lp.value.no_sp2d || '',
        tanggal_sp2d: lp.value.tanggal_sp2d || '',
        nilai_pembayaran: lp.value.nilai_pembayaran || lp.value.nilai_kontrak_netto || 0
      };
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const calculateNetto = () => {
  const nilai = parseFloat(kontrakForm.value.nilai_kontrak) || 0;
  const ppn = parseFloat(kontrakForm.value.ppn) || 0;
  const pph = parseFloat(kontrakForm.value.pph) || 0;
  kontrakForm.value.nilai_kontrak_netto = nilai + ppn - pph;
};

const goToDetail = () => {
  router.push({ name: 'LPDetail', params: { id: props.id } });
};

const handleSavePenyedia = async () => {
  if (!penyediaForm.value.supplier_id) {
    alert('Pilih penyedia terlebih dahulu');
    return;
  }

  saving.value = true;
  try {
    await lpStore.updateLP(props.id, {
      supplier_id: penyediaForm.value.supplier_id,
      metode_pengadaan: penyediaForm.value.metode_pengadaan,
      catatan_pengadaan: penyediaForm.value.catatan_pengadaan
    });

    // Change status if not already in PROSES_PENGADAAN
    if (lp.value.status === LP_STATUS.DISETUJUI) {
      await lpStore.changeStatus(props.id, LP_STATUS.PROSES_PENGADAAN, 'Memulai proses pengadaan');
    }

    await fetchData();
    activeStep.value = 'kontrak';
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    saving.value = false;
  }
};

const handleSaveKontrak = async () => {
  if (!kontrakForm.value.no_kontrak) {
    alert('Nomor kontrak wajib diisi');
    return;
  }

  saving.value = true;
  try {
    await lpStore.updateLP(props.id, kontrakForm.value);

    // Change status to KONTRAK
    if (lp.value.status === LP_STATUS.PROSES_PENGADAAN) {
      await lpStore.changeStatus(props.id, LP_STATUS.KONTRAK, 'Kontrak telah dibuat');
    }

    await fetchData();
    activeStep.value = 'serah-terima';
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    saving.value = false;
  }
};

const handleSaveSerahTerima = async () => {
  if (!serahTerimaForm.value.tanggal_bast) {
    alert('Tanggal BAST wajib diisi');
    return;
  }

  saving.value = true;
  try {
    await lpStore.updateLP(props.id, serahTerimaForm.value);

    // Change status to SERAH_TERIMA
    if (lp.value.status === LP_STATUS.KONTRAK) {
      await lpStore.changeStatus(props.id, LP_STATUS.SERAH_TERIMA, 'Serah terima barang/jasa');
    }

    await fetchData();
    activeStep.value = 'pembayaran';
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    saving.value = false;
  }
};

const handleSavePembayaran = async () => {
  saving.value = true;
  try {
    await lpStore.updateLP(props.id, pembayaranForm.value);

    // Change status to PEMBAYARAN if SPM is filled
    if (pembayaranForm.value.no_spm && lp.value.status === LP_STATUS.SERAH_TERIMA) {
      await lpStore.changeStatus(props.id, LP_STATUS.PEMBAYARAN, 'SPM telah diterbitkan');
    }

    // If SP2D is filled, mark as SELESAI
    if (pembayaranForm.value.no_sp2d) {
      await lpStore.changeStatus(props.id, LP_STATUS.SELESAI, 'Pembayaran selesai');
      router.push({ name: 'LPDetail', params: { id: props.id } });
      return;
    }

    await fetchData();
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    saving.value = false;
  }
};

// Watch for kontrak value changes to recalculate netto
watch(() => [kontrakForm.value.nilai_kontrak, kontrakForm.value.ppn, kontrakForm.value.pph], () => {
  calculateNetto();
});

// Watch for step prop changes
watch(() => props.step, (newStep) => {
  activeStep.value = newStep;
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center space-x-3">
        <button
          @click="goToDetail"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Proses Pengadaan</h1>
          <p class="text-gray-600">{{ lp?.nomor }} - {{ lp?.uraian }}</p>
        </div>
      </div>
      <LPStatusBadge v-if="lp" :status="lp.status" size="lg" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Content -->
    <template v-else-if="lp">
      <!-- Status Progress -->
      <div class="bg-white rounded-lg shadow p-6">
        <LPStatusProgress :status="lp.status" />
      </div>

      <!-- Process Steps Navigation -->
      <div class="bg-white rounded-lg shadow">
        <div class="border-b px-6 py-4">
          <nav class="flex space-x-8">
            <button
              v-for="(step, index) in steps"
              :key="step.id"
              @click="isStepEnabled(step.id) && (activeStep = step.id)"
              :disabled="!isStepEnabled(step.id)"
              :class="[
                'pb-4 text-sm font-medium border-b-2 transition-colors',
                activeStep === step.id
                  ? 'border-blue-500 text-blue-600'
                  : isStepEnabled(step.id)
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
              ]"
            >
              {{ index + 1 }}. {{ step.label }}
            </button>
          </nav>
        </div>

        <!-- Step Content -->
        <div class="p-6">
          <!-- Step 1: Pilih Penyedia -->
          <div v-if="activeStep === 'penyedia'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900">Pilih Penyedia</h3>

            <!-- LP Summary -->
            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Nilai Total:</span>
                <span class="font-semibold text-blue-600">{{ formatRupiah(lp.nilai_total) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Jenis:</span>
                <span>{{ lp.jenis }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Tier:</span>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs rounded-full',
                    lp.tier === 1 ? 'bg-green-100 text-green-800' :
                    lp.tier === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]"
                >
                  Tier {{ lp.tier }}
                </span>
              </div>
            </div>

            <FormSelect
              v-model="penyediaForm.supplier_id"
              label="Penyedia"
              :options="supplierOptions"
              placeholder="Pilih penyedia..."
              required
            />

            <FormSelect
              v-model="penyediaForm.metode_pengadaan"
              label="Metode Pengadaan"
              :options="metodeOptions"
              placeholder="Pilih metode..."
            />

            <FormTextarea
              v-model="penyediaForm.catatan_pengadaan"
              label="Catatan Pengadaan"
              rows="3"
            />

            <div class="flex justify-end">
              <button
                @click="handleSavePenyedia"
                :disabled="saving"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan & Lanjutkan' }}
              </button>
            </div>
          </div>

          <!-- Step 2: Input Kontrak -->
          <div v-if="activeStep === 'kontrak'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900">Data Kontrak</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                v-model="kontrakForm.no_kontrak"
                label="Nomor Kontrak"
                required
              />
              <FormInput
                v-model="kontrakForm.tanggal_kontrak"
                label="Tanggal Kontrak"
                type="date"
                required
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                v-model.number="kontrakForm.nilai_kontrak"
                label="Nilai Kontrak"
                type="number"
              />
              <FormInput
                v-model.number="kontrakForm.ppn"
                label="PPN"
                type="number"
              />
              <FormInput
                v-model.number="kontrakForm.pph"
                label="PPh"
                type="number"
              />
            </div>

            <div class="p-4 bg-blue-50 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-blue-700">Nilai Kontrak Netto:</span>
                <span class="text-xl font-bold text-blue-900">{{ formatRupiah(kontrakForm.nilai_kontrak_netto) }}</span>
              </div>
            </div>

            <div class="flex justify-between">
              <button
                @click="activeStep = 'penyedia'"
                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                @click="handleSaveKontrak"
                :disabled="saving"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan & Lanjutkan' }}
              </button>
            </div>
          </div>

          <!-- Step 3: Serah Terima -->
          <div v-if="activeStep === 'serah-terima'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900">Serah Terima Barang/Jasa</h3>

            <!-- Items -->
            <LPItemTable :items="items" :editable="false" :jenis="lp.jenis" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                v-model="serahTerimaForm.no_bast"
                label="Nomor BAST"
              />
              <FormInput
                v-model="serahTerimaForm.tanggal_bast"
                label="Tanggal BAST"
                type="date"
                required
              />
            </div>

            <FormTextarea
              v-model="serahTerimaForm.catatan_bast"
              label="Catatan Serah Terima"
              rows="3"
            />

            <div class="flex justify-between">
              <button
                @click="activeStep = 'kontrak'"
                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                @click="handleSaveSerahTerima"
                :disabled="saving"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan & Lanjutkan' }}
              </button>
            </div>
          </div>

          <!-- Step 4: Pembayaran -->
          <div v-if="activeStep === 'pembayaran'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900">Pembayaran</h3>

            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Nilai Kontrak Netto:</span>
                <span class="font-semibold">{{ formatRupiah(lp.nilai_kontrak_netto || lp.nilai_total) }}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                v-model="pembayaranForm.no_spm"
                label="Nomor SPM"
              />
              <FormInput
                v-model="pembayaranForm.tanggal_spm"
                label="Tanggal SPM"
                type="date"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                v-model="pembayaranForm.no_sp2d"
                label="Nomor SP2D"
              />
              <FormInput
                v-model="pembayaranForm.tanggal_sp2d"
                label="Tanggal SP2D"
                type="date"
              />
            </div>

            <FormInput
              v-model.number="pembayaranForm.nilai_pembayaran"
              label="Nilai Pembayaran"
              type="number"
            />

            <div class="flex justify-between">
              <button
                @click="activeStep = 'serah-terima'"
                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                @click="handleSavePembayaran"
                :disabled="saving"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : pembayaranForm.no_sp2d ? 'Selesai' : 'Simpan' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
