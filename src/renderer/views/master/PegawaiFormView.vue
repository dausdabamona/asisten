<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePegawaiStore } from '../../stores/pegawaiStore';
import { useSatkerStore } from '../../stores/satkerStore';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormTextarea from '../../components/ui/FormTextarea.vue';

const route = useRoute();
const router = useRouter();
const pegawaiStore = usePegawaiStore();
const satkerStore = useSatkerStore();

// Local state
const loading = ref(false);
const saving = ref(false);
const errors = ref({});

// Form data
const form = ref({
  // Data Pribadi
  nip: '',
  nik: '',
  nama: '',
  gelar_depan: '',
  gelar_belakang: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  alamat: '',
  no_hp: '',
  email: '',
  npwp: '',
  // Data Kepegawaian
  status_pegawai: 'ASN',
  pangkat: '',
  golongan: '',
  tmt_pangkat: '',
  jenis_jabatan: '',
  nama_jabatan: '',
  eselon: '',
  unit_kerja_id: '',
  // Data Rekening
  nama_bank: '',
  no_rekening: '',
  atas_nama_rekening: '',
  // Status
  status: 'aktif'
});

// Computed
const isEditMode = computed(() => !!route.params.id);
const pageTitle = computed(() => isEditMode.value ? 'Edit Pegawai' : 'Tambah Pegawai');

const unitKerjaOptions = computed(() =>
  satkerStore.unitKerja.map(u => ({ value: u.id, label: u.nama }))
);

// Options
const jenisKelaminOptions = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' }
];

const statusPegawaiOptions = [
  { value: 'ASN', label: 'ASN (PNS)' },
  { value: 'PPPK', label: 'PPPK' },
  { value: 'HONORER', label: 'Honorer' }
];

const golonganOptions = [
  'I/a', 'I/b', 'I/c', 'I/d',
  'II/a', 'II/b', 'II/c', 'II/d',
  'III/a', 'III/b', 'III/c', 'III/d',
  'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'
].map(g => ({ value: g, label: g }));

const jenisJabatanOptions = [
  { value: 'STRUKTURAL', label: 'Struktural' },
  { value: 'FUNGSIONAL', label: 'Fungsional' },
  { value: 'PELAKSANA', label: 'Pelaksana' }
];

const eselonOptions = [
  { value: 'I.a', label: 'Eselon I.a' },
  { value: 'I.b', label: 'Eselon I.b' },
  { value: 'II.a', label: 'Eselon II.a' },
  { value: 'II.b', label: 'Eselon II.b' },
  { value: 'III.a', label: 'Eselon III.a' },
  { value: 'III.b', label: 'Eselon III.b' },
  { value: 'IV.a', label: 'Eselon IV.a' },
  { value: 'IV.b', label: 'Eselon IV.b' }
];

const statusOptions = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Non-Aktif' }
];

const bankOptions = [
  'BRI', 'BNI', 'Mandiri', 'BTN', 'Bank Papua', 'Bank Lainnya'
].map(b => ({ value: b, label: b }));

// Methods
const loadPegawai = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const pegawai = await pegawaiStore.fetchPegawaiById(route.params.id);
    if (pegawai) {
      // Map pegawai data to form
      Object.keys(form.value).forEach(key => {
        if (pegawai[key] !== undefined) {
          form.value[key] = pegawai[key] || '';
        }
      });
    }
  } catch (error) {
    alert('Gagal memuat data pegawai: ' + error.message);
    router.push('/master/pegawai');
  } finally {
    loading.value = false;
  }
};

const validate = () => {
  errors.value = {};

  if (!form.value.nip) {
    errors.value.nip = 'NIP wajib diisi';
  } else if (!/^\d{18}$/.test(form.value.nip)) {
    errors.value.nip = 'NIP harus 18 digit';
  }

  if (!form.value.nama) {
    errors.value.nama = 'Nama wajib diisi';
  }

  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format email tidak valid';
  }

  return Object.keys(errors.value).length === 0;
};

const save = async () => {
  if (!validate()) {
    return;
  }

  saving.value = true;
  try {
    if (isEditMode.value) {
      await pegawaiStore.updatePegawai(route.params.id, form.value);
    } else {
      await pegawaiStore.createPegawai(form.value);
    }
    router.push('/master/pegawai');
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message);
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  router.push('/master/pegawai');
};

onMounted(async () => {
  await satkerStore.fetchUnitKerja();
  await loadPegawai();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center space-x-4">
      <button
        @click="cancel"
        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{{ pageTitle }}</h1>
        <p class="text-gray-500">{{ isEditMode ? 'Ubah data pegawai' : 'Tambah pegawai baru ke sistem' }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="save" class="space-y-6">
      <!-- Section 1: Data Pribadi -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold text-gray-800">Data Pribadi</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <FormInput
              v-model="form.nip"
              label="NIP"
              required
              placeholder="18 digit NIP"
              maxlength="18"
              :error="errors.nip"
            />
            <FormInput
              v-model="form.nik"
              label="NIK"
              placeholder="16 digit NIK"
              maxlength="16"
            />
          </div>

          <div class="grid grid-cols-4 gap-4">
            <FormInput
              v-model="form.gelar_depan"
              label="Gelar Depan"
              placeholder="Dr., Ir., dll"
            />
            <div class="col-span-2">
              <FormInput
                v-model="form.nama"
                label="Nama Lengkap"
                required
                :error="errors.nama"
              />
            </div>
            <FormInput
              v-model="form.gelar_belakang"
              label="Gelar Belakang"
              placeholder="S.T., M.Sc., dll"
            />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <FormInput
              v-model="form.tempat_lahir"
              label="Tempat Lahir"
            />
            <FormInput
              v-model="form.tanggal_lahir"
              label="Tanggal Lahir"
              type="date"
            />
            <FormSelect
              v-model="form.jenis_kelamin"
              label="Jenis Kelamin"
              :options="jenisKelaminOptions"
              placeholder="Pilih..."
            />
          </div>

          <FormTextarea
            v-model="form.alamat"
            label="Alamat"
            rows="2"
          />

          <div class="grid grid-cols-3 gap-4">
            <FormInput
              v-model="form.no_hp"
              label="No. HP"
              type="tel"
              placeholder="08xxxxxxxxxx"
            />
            <FormInput
              v-model="form.email"
              label="Email"
              type="email"
              :error="errors.email"
            />
            <FormInput
              v-model="form.npwp"
              label="NPWP"
              placeholder="XX.XXX.XXX.X-XXX.XXX"
            />
          </div>
        </div>
      </div>

      <!-- Section 2: Data Kepegawaian -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold text-gray-800">Data Kepegawaian</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-4 gap-4">
            <FormSelect
              v-model="form.status_pegawai"
              label="Status Pegawai"
              :options="statusPegawaiOptions"
            />
            <FormInput
              v-model="form.pangkat"
              label="Pangkat"
              placeholder="Contoh: Penata Muda"
            />
            <FormSelect
              v-model="form.golongan"
              label="Golongan"
              :options="golonganOptions"
              placeholder="Pilih..."
            />
            <FormInput
              v-model="form.tmt_pangkat"
              label="TMT Pangkat"
              type="date"
            />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <FormSelect
              v-model="form.jenis_jabatan"
              label="Jenis Jabatan"
              :options="jenisJabatanOptions"
              placeholder="Pilih..."
            />
            <FormInput
              v-model="form.nama_jabatan"
              label="Nama Jabatan"
            />
            <FormSelect
              v-model="form.eselon"
              label="Eselon"
              :options="eselonOptions"
              placeholder="Pilih..."
            />
          </div>

          <FormSelect
            v-model="form.unit_kerja_id"
            label="Unit Kerja"
            :options="unitKerjaOptions"
            placeholder="Pilih Unit Kerja..."
          />
        </div>
      </div>

      <!-- Section 3: Data Rekening -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold text-gray-800">Data Rekening</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <FormSelect
              v-model="form.nama_bank"
              label="Nama Bank"
              :options="bankOptions"
              placeholder="Pilih Bank..."
            />
            <FormInput
              v-model="form.no_rekening"
              label="Nomor Rekening"
            />
            <FormInput
              v-model="form.atas_nama_rekening"
              label="Atas Nama"
            />
          </div>
        </div>
      </div>

      <!-- Section 4: Status -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold text-gray-800">Status</h2>
        </div>
        <div class="p-6">
          <div class="flex items-center space-x-6">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="form.status"
                value="aktif"
                class="w-4 h-4 text-blue-600"
              />
              <span class="ml-2 text-gray-700">Aktif</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="form.status"
                value="nonaktif"
                class="w-4 h-4 text-blue-600"
              />
              <span class="ml-2 text-gray-700">Non-Aktif</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          @click="cancel"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </form>
  </div>
</template>
