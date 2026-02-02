<script setup>
/**
 * LPFormView - Create/Edit Lembar Permintaan
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLembarPermintaanStore, LP_JENIS, calculateTier } from '../../stores/lembarPermintaanStore';
import { useDipaStore } from '../../stores/dipaStore';
import { usePegawaiStore } from '../../stores/pegawaiStore';
import LPItemTable from '../../components/lp/LPItemTable.vue';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormTextarea from '../../components/ui/FormTextarea.vue';

const router = useRouter();
const route = useRoute();
const lpStore = useLembarPermintaanStore();
const dipaStore = useDipaStore();
const pegawaiStore = usePegawaiStore();

// Props from router
const props = defineProps({
  id: {
    type: [String, Number],
    default: null
  },
  jenis: {
    type: String,
    default: 'BARANG'
  }
});

// State
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const isEdit = computed(() => !!props.id);

// Form data
const form = ref({
  jenis: props.jenis || 'BARANG',
  uraian: '',
  kegiatan_kode: '',
  kegiatan_nama: '',
  output_kode: '',
  output_nama: '',
  komponen_kode: '',
  komponen_nama: '',
  akun_kode: '',
  akun_nama: '',
  pagu_tersedia: 0,
  pemohon_id: null,
  pemohon_nama: '',
  unit_kerja: '',
  lokasi_pengiriman: '',
  catatan: ''
});

const items = ref([]);

// Computed
const jenisOptions = [
  { value: LP_JENIS.BARANG, label: 'Barang' },
  { value: LP_JENIS.JASA, label: 'Jasa' },
  { value: LP_JENIS.PJLP, label: 'PJLP' },
  { value: LP_JENIS.KEGIATAN, label: 'Kegiatan' }
];

const pegawaiOptions = computed(() =>
  pegawaiStore.pegawaiList.map(p => ({
    value: p.id,
    label: `${p.nama} - ${p.jabatan || ''}`
  }))
);

const nilaiTotal = computed(() =>
  items.value.reduce((sum, item) => {
    const volume = parseFloat(item.volume) || 0;
    const harga = parseFloat(item.harga_satuan) || 0;
    return sum + (volume * harga);
  }, 0)
);

const tier = computed(() => calculateTier(nilaiTotal.value));

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const pageTitle = computed(() => {
  if (isEdit.value) return 'Edit Lembar Permintaan';
  return `Tambah LP ${form.value.jenis === 'BARANG' ? 'Barang' : 'Jasa'}`;
});

// Methods
const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Fetch pegawai for dropdown
    await pegawaiStore.fetchPegawaiList();

    // If editing, fetch existing LP
    if (isEdit.value) {
      await lpStore.fetchLPById(props.id);
      const lp = lpStore.currentLP;
      if (lp) {
        form.value = {
          jenis: lp.jenis,
          uraian: lp.uraian,
          kegiatan_kode: lp.kegiatan_kode || '',
          kegiatan_nama: lp.kegiatan_nama || '',
          output_kode: lp.output_kode || '',
          output_nama: lp.output_nama || '',
          komponen_kode: lp.komponen_kode || '',
          komponen_nama: lp.komponen_nama || '',
          akun_kode: lp.akun_kode || '',
          akun_nama: lp.akun_nama || '',
          pagu_tersedia: lp.pagu_tersedia || 0,
          pemohon_id: lp.pemohon_id,
          pemohon_nama: lp.pemohon_nama || '',
          unit_kerja: lp.unit_kerja || '',
          lokasi_pengiriman: lp.lokasi_pengiriman || '',
          catatan: lp.catatan || ''
        };

        // Fetch items
        await lpStore.fetchLPItems(props.id);
        items.value = lpStore.currentLPItems || [];
      }
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handlePemohonChange = (pemohonId) => {
  const pegawai = pegawaiStore.pegawaiList.find(p => p.id === pemohonId);
  if (pegawai) {
    form.value.pemohon_nama = pegawai.nama;
    form.value.unit_kerja = pegawai.unit_kerja || '';
  }
};

const selectDipaItem = async () => {
  // This would open a DIPA browser modal
  // For now, we'll use a simple implementation
  try {
    const activeDipa = await dipaStore.fetchActiveDipa();
    if (activeDipa) {
      // Navigate to DIPA browser
      router.push({
        name: 'DipaBrowse',
        params: { id: activeDipa.id },
        query: { returnTo: route.fullPath }
      });
    }
  } catch (err) {
    console.error('Failed to select DIPA item:', err);
  }
};

const validateForm = () => {
  const errors = [];

  if (!form.value.uraian.trim()) {
    errors.push('Uraian wajib diisi');
  }
  if (!form.value.pemohon_id) {
    errors.push('Pemohon wajib dipilih');
  }
  if (items.value.length === 0) {
    errors.push('Minimal harus ada 1 item');
  }

  // Check items have required fields
  items.value.forEach((item, index) => {
    if (!item.uraian?.trim()) {
      errors.push(`Item ${index + 1}: Uraian wajib diisi`);
    }
    if (!item.volume || item.volume <= 0) {
      errors.push(`Item ${index + 1}: Volume harus lebih dari 0`);
    }
    if (!item.harga_satuan || item.harga_satuan <= 0) {
      errors.push(`Item ${index + 1}: Harga satuan harus lebih dari 0`);
    }
  });

  return errors;
};

const handleSave = async (submitAfterSave = false) => {
  const errors = validateForm();
  if (errors.length > 0) {
    alert('Validasi gagal:\n' + errors.join('\n'));
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const data = {
      ...form.value,
      nilai_total: nilaiTotal.value,
      tier: tier.value,
      items: items.value
    };

    let lpId;
    if (isEdit.value) {
      await lpStore.updateLP(props.id, data);
      lpId = props.id;
    } else {
      const result = await lpStore.createLP(data);
      lpId = result.id;
    }

    // Submit if requested
    if (submitAfterSave) {
      await lpStore.submitLP(lpId);
    }

    router.push({ name: 'LPDetail', params: { id: lpId } });
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  if (isEdit.value) {
    router.push({ name: 'LPDetail', params: { id: props.id } });
  } else {
    router.push({ name: 'LPList' });
  }
};

// Watch for pemohon change
watch(() => form.value.pemohon_id, (newVal) => {
  if (newVal) handlePemohonChange(newVal);
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <p class="text-gray-600">
          {{ isEdit ? 'Perbarui data lembar permintaan' : 'Buat lembar permintaan baru' }}
        </p>
      </div>
      <button
        @click="handleCancel"
        class="text-gray-500 hover:text-gray-700"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Form -->
    <form v-if="!loading" @submit.prevent="handleSave(false)" class="space-y-6">
      <!-- Basic Info Card -->
      <div class="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Dasar</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-model="form.jenis"
            label="Jenis Pengadaan"
            :options="jenisOptions"
            required
            :disabled="isEdit"
          />

          <FormSelect
            v-model="form.pemohon_id"
            label="Pemohon"
            :options="pegawaiOptions"
            placeholder="Pilih pemohon..."
            required
          />
        </div>

        <FormTextarea
          v-model="form.uraian"
          label="Uraian Pengadaan"
          placeholder="Jelaskan keperluan pengadaan..."
          rows="3"
          required
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.unit_kerja"
            label="Unit Kerja"
            placeholder="Unit kerja pemohon"
          />

          <FormInput
            v-model="form.lokasi_pengiriman"
            label="Lokasi Pengiriman"
            placeholder="Alamat pengiriman barang"
          />
        </div>
      </div>

      <!-- DIPA Info Card -->
      <div class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="flex items-center justify-between border-b pb-2">
          <h2 class="text-lg font-semibold text-gray-900">Informasi Anggaran</h2>
          <button
            type="button"
            @click="selectDipaItem"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            Pilih dari DIPA
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.kegiatan_kode"
            label="Kode Kegiatan"
            placeholder="XX.XX.XX"
          />
          <FormInput
            v-model="form.kegiatan_nama"
            label="Nama Kegiatan"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.output_kode"
            label="Kode Output"
          />
          <FormInput
            v-model="form.output_nama"
            label="Nama Output"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.komponen_kode"
            label="Kode Komponen"
          />
          <FormInput
            v-model="form.komponen_nama"
            label="Nama Komponen"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.akun_kode"
            label="Kode Akun"
          />
          <FormInput
            v-model="form.akun_nama"
            label="Nama Akun"
          />
        </div>

        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-sm text-blue-700">Pagu Tersedia:</span>
            <span class="font-semibold text-blue-900">{{ formatRupiah(form.pagu_tersedia) }}</span>
          </div>
        </div>
      </div>

      <!-- Items Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <LPItemTable
          v-model:items="items"
          :editable="true"
          :jenis="form.jenis"
        />
      </div>

      <!-- Summary Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Total Nilai Pengadaan</p>
            <p class="text-2xl font-bold text-blue-600">{{ formatRupiah(nilaiTotal) }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">Klasifikasi</p>
            <span
              :class="[
                'inline-flex px-3 py-1 text-sm font-semibold rounded-full',
                tier === 1 ? 'bg-green-100 text-green-800' :
                tier === 2 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              ]"
            >
              Tier {{ tier }}
            </span>
          </div>
        </div>
      </div>

      <!-- Notes Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <FormTextarea
          v-model="form.catatan"
          label="Catatan Tambahan"
          placeholder="Catatan atau instruksi khusus..."
          rows="2"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end space-x-4 pb-8">
        <button
          type="button"
          @click="handleCancel"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          :disabled="saving"
        >
          Batal
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          :disabled="saving"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan Draft' }}
        </button>
        <button
          type="button"
          @click="handleSave(true)"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          :disabled="saving"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan & Ajukan' }}
        </button>
      </div>
    </form>
  </div>
</template>
