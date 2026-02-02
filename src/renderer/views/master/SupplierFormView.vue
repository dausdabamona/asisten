<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSupplierStore } from '../../stores/supplierStore';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormTextarea from '../../components/ui/FormTextarea.vue';

const route = useRoute();
const router = useRouter();
const supplierStore = useSupplierStore();

// Local state
const loading = ref(false);
const saving = ref(false);
const errors = ref({});

// Form data
const form = ref({
  // Common
  jenis: 'BADAN_USAHA',
  nama: '',
  alamat: '',
  kota: '',
  provinsi: '',
  kode_pos: '',
  telepon: '',
  fax: '',
  email: '',
  website: '',
  npwp: '',
  nama_wp: '',
  is_pkp: 0,
  status: 'AKTIF',
  catatan: '',

  // Badan Usaha specific
  bentuk_usaha: '',
  bidang_usaha: '',
  nib: '',
  nomor_siup: '',
  tanggal_siup: '',
  masa_berlaku_siup: '',
  nomor_akta_pendirian: '',
  tanggal_akta_pendirian: '',
  notaris_akta_pendirian: '',
  nomor_akta_perubahan: '',
  tanggal_akta_perubahan: '',
  nama_direktur: '',
  nik_direktur: '',
  jabatan_direktur: '',
  hp_direktur: '',
  nama_cp: '',
  jabatan_cp: '',
  hp_cp: '',
  email_cp: '',
  kualifikasi_usaha: '',
  bidang_pengadaan: '',

  // Perorangan specific
  nik: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  status_pekerjaan: '',
  instansi: '',
  jabatan: '',
  kota_instansi: '',
  pendidikan_terakhir: '',
  bidang_keahlian: '',
  klasifikasi_honor: '',

  // Rekening (common)
  nama_bank: '',
  nomor_rekening: '',
  nama_rekening: ''
});

// Computed
const isEditMode = computed(() => !!route.params.id);
const pageTitle = computed(() => isEditMode.value ? 'Edit Supplier' : 'Tambah Supplier');
const isBadanUsaha = computed(() => form.value.jenis === 'BADAN_USAHA');
const isPerorangan = computed(() => form.value.jenis === 'PERORANGAN');

// Options
const jenisOptions = [
  { value: 'BADAN_USAHA', label: 'Badan Usaha' },
  { value: 'PERORANGAN', label: 'Perorangan' }
];

const bentukUsahaOptions = [
  { value: 'CV', label: 'CV' },
  { value: 'PT', label: 'PT' },
  { value: 'KOPERASI', label: 'Koperasi' },
  { value: 'UD', label: 'UD' },
  { value: 'FIRMA', label: 'Firma' }
];

const kualifikasiUsahaOptions = [
  { value: '', label: 'Pilih Kualifikasi...' },
  { value: 'KECIL', label: 'Kecil' },
  { value: 'NON_KECIL', label: 'Non-Kecil' }
];

const jenisKelaminOptions = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' }
];

const statusPekerjaanOptions = [
  { value: '', label: 'Pilih Status...' },
  { value: 'ASN', label: 'ASN/PNS' },
  { value: 'PPPK', label: 'PPPK' },
  { value: 'TNI_POLRI', label: 'TNI/Polri' },
  { value: 'SWASTA', label: 'Karyawan Swasta' },
  { value: 'WIRASWASTA', label: 'Wiraswasta' },
  { value: 'PROFESIONAL', label: 'Profesional' },
  { value: 'PENSIUNAN', label: 'Pensiunan' },
  { value: 'LAINNYA', label: 'Lainnya' }
];

const pendidikanOptions = [
  { value: '', label: 'Pilih Pendidikan...' },
  { value: 'SD', label: 'SD' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA/SMK' },
  { value: 'D1', label: 'D1' },
  { value: 'D2', label: 'D2' },
  { value: 'D3', label: 'D3' },
  { value: 'D4', label: 'D4' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'S3', label: 'S3' }
];

const klasifikasiHonorOptions = [
  { value: '', label: 'Bukan Narasumber' },
  { value: 'MENTERI', label: 'Menteri/Pejabat Setingkat Menteri' },
  { value: 'ESELON_I', label: 'Pejabat Eselon I / Guru Besar' },
  { value: 'ESELON_II', label: 'Pejabat Eselon II / Doktor' },
  { value: 'ESELON_III', label: 'Pejabat Eselon III / S2 (Magister)' },
  { value: 'ESELON_IV', label: 'Pejabat Eselon IV / S1 (Sarjana)' },
  { value: 'PRAKTISI', label: 'Praktisi' },
  { value: 'LAINNYA', label: 'Lainnya' }
];

const statusOptions = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'TIDAK_AKTIF', label: 'Tidak Aktif' },
  { value: 'BLACKLIST', label: 'Blacklist' }
];

const bankOptions = [
  { value: '', label: 'Pilih Bank...' },
  { value: 'BRI', label: 'Bank BRI' },
  { value: 'BNI', label: 'Bank BNI' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BTN', label: 'Bank BTN' },
  { value: 'BSI', label: 'Bank BSI' },
  { value: 'BCA', label: 'Bank BCA' },
  { value: 'CIMB', label: 'Bank CIMB Niaga' },
  { value: 'Danamon', label: 'Bank Danamon' },
  { value: 'Permata', label: 'Bank Permata' },
  { value: 'Bank Papua', label: 'Bank Papua' },
  { value: 'Lainnya', label: 'Bank Lainnya' }
];

const isPkpOptions = [
  { value: 0, label: 'Tidak' },
  { value: 1, label: 'Ya (PKP)' }
];

// Methods
const loadSupplier = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const supplier = await supplierStore.fetchSupplierById(route.params.id);
    if (supplier) {
      Object.keys(form.value).forEach(key => {
        if (supplier[key] !== undefined && supplier[key] !== null) {
          form.value[key] = supplier[key];
        }
      });
    }
  } catch (error) {
    alert('Gagal memuat data supplier: ' + error.message);
    router.push('/master/supplier');
  } finally {
    loading.value = false;
  }
};

const formatNpwp = (value) => {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 9) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8)}`;
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 15)}`;
};

const handleNpwpInput = (e) => {
  const formatted = formatNpwp(e.target.value);
  form.value.npwp = formatted;
};

const validate = () => {
  errors.value = {};

  if (!form.value.nama) {
    errors.value.nama = 'Nama wajib diisi';
  }

  if (isBadanUsaha.value) {
    if (!form.value.npwp) {
      errors.value.npwp = 'NPWP wajib diisi untuk Badan Usaha';
    } else {
      const cleanNpwp = form.value.npwp.replace(/\D/g, '');
      if (cleanNpwp.length !== 15) {
        errors.value.npwp = 'NPWP harus 15 digit';
      }
    }
    if (!form.value.bentuk_usaha) {
      errors.value.bentuk_usaha = 'Bentuk usaha wajib dipilih';
    }
  }

  if (isPerorangan.value) {
    if (!form.value.nik) {
      errors.value.nik = 'NIK wajib diisi untuk Perorangan';
    } else if (!/^\d{16}$/.test(form.value.nik)) {
      errors.value.nik = 'NIK harus 16 digit';
    }
  }

  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format email tidak valid';
  }

  return Object.keys(errors.value).length === 0;
};

const prepareDataForSave = () => {
  const data = { ...form.value };

  // Clean NPWP format for storage
  if (data.npwp) {
    data.npwp = data.npwp.replace(/\D/g, '');
  }

  // Clear irrelevant fields based on jenis
  if (data.jenis === 'BADAN_USAHA') {
    // Clear perorangan fields
    data.nik = '';
    data.tempat_lahir = '';
    data.tanggal_lahir = '';
    data.jenis_kelamin = '';
    data.status_pekerjaan = '';
    data.instansi = '';
    data.jabatan = '';
    data.kota_instansi = '';
    data.pendidikan_terakhir = '';
    data.bidang_keahlian = '';
    data.klasifikasi_honor = '';
  } else {
    // Clear badan usaha fields
    data.bentuk_usaha = '';
    data.bidang_usaha = '';
    data.nib = '';
    data.nomor_siup = '';
    data.tanggal_siup = '';
    data.masa_berlaku_siup = '';
    data.nomor_akta_pendirian = '';
    data.tanggal_akta_pendirian = '';
    data.notaris_akta_pendirian = '';
    data.nomor_akta_perubahan = '';
    data.tanggal_akta_perubahan = '';
    data.nama_direktur = '';
    data.nik_direktur = '';
    data.jabatan_direktur = '';
    data.hp_direktur = '';
    data.nama_cp = '';
    data.jabatan_cp = '';
    data.hp_cp = '';
    data.email_cp = '';
    data.kualifikasi_usaha = '';
    data.bidang_pengadaan = '';
  }

  return data;
};

const save = async () => {
  if (!validate()) {
    return;
  }

  saving.value = true;
  try {
    const data = prepareDataForSave();

    if (isEditMode.value) {
      await supplierStore.updateSupplier(route.params.id, data);
    } else {
      await supplierStore.createSupplier(data);
    }
    router.push('/master/supplier');
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message);
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  router.push('/master/supplier');
};

// Watch jenis changes to clear errors
watch(() => form.value.jenis, () => {
  errors.value = {};
});

onMounted(async () => {
  await loadSupplier();
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
        <p class="text-gray-500">{{ isEditMode ? 'Ubah data supplier' : 'Tambah supplier baru ke sistem' }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="save" class="space-y-6">
      <!-- Jenis Supplier Selection -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold text-gray-800">Jenis Supplier</h2>
        </div>
        <div class="p-6">
          <div class="flex items-center space-x-8">
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="form.jenis"
                value="BADAN_USAHA"
                :disabled="isEditMode"
                class="w-5 h-5 text-blue-600"
              />
              <span class="ml-3">
                <span class="block font-medium text-gray-900">Badan Usaha</span>
                <span class="block text-sm text-gray-500">CV, PT, Koperasi, UD, Firma</span>
              </span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="form.jenis"
                value="PERORANGAN"
                :disabled="isEditMode"
                class="w-5 h-5 text-blue-600"
              />
              <span class="ml-3">
                <span class="block font-medium text-gray-900">Perorangan</span>
                <span class="block text-sm text-gray-500">Individu / Narasumber</span>
              </span>
            </label>
          </div>
          <p v-if="isEditMode" class="mt-2 text-sm text-gray-500">
            Jenis supplier tidak dapat diubah setelah data dibuat.
          </p>
        </div>
      </div>

      <!-- ==================== BADAN USAHA SECTIONS ==================== -->
      <template v-if="isBadanUsaha">
        <!-- Section 1: Identitas Perusahaan -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Identitas Perusahaan</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-2">
                <FormInput
                  v-model="form.nama"
                  label="Nama Perusahaan"
                  required
                  placeholder="Nama perusahaan tanpa bentuk usaha"
                  :error="errors.nama"
                />
              </div>
              <FormSelect
                v-model="form.bentuk_usaha"
                label="Bentuk Usaha"
                required
                :options="bentukUsahaOptions"
                placeholder="Pilih..."
                :error="errors.bentuk_usaha"
              />
            </div>

            <FormInput
              v-model="form.bidang_usaha"
              label="Bidang Usaha"
              placeholder="Contoh: Perdagangan Umum, Jasa Konstruksi, dll"
            />

            <FormTextarea
              v-model="form.alamat"
              label="Alamat"
              rows="2"
              placeholder="Alamat lengkap kantor"
            />

            <div class="grid grid-cols-3 gap-4">
              <FormInput
                v-model="form.kota"
                label="Kota/Kabupaten"
              />
              <FormInput
                v-model="form.provinsi"
                label="Provinsi"
              />
              <FormInput
                v-model="form.kode_pos"
                label="Kode Pos"
                maxlength="5"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.telepon"
                label="Telepon"
                type="tel"
                placeholder="021-xxxxxxx"
              />
              <FormInput
                v-model="form.fax"
                label="Fax"
                type="tel"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.email"
                label="Email"
                type="email"
                :error="errors.email"
              />
              <FormInput
                v-model="form.website"
                label="Website"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Legalitas -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Legalitas</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.nib"
                label="NIB (Nomor Induk Berusaha)"
                placeholder="13 digit NIB"
              />
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  NPWP <span class="text-red-500">*</span>
                </label>
                <input
                  :value="form.npwp"
                  @input="handleNpwpInput"
                  type="text"
                  maxlength="20"
                  placeholder="XX.XXX.XXX.X-XXX.XXX"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  :class="errors.npwp ? 'border-red-500' : 'border-gray-300'"
                />
                <p v-if="errors.npwp" class="mt-1 text-sm text-red-500">{{ errors.npwp }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.nama_wp"
                label="Nama Wajib Pajak"
                placeholder="Nama sesuai NPWP"
              />
              <FormSelect
                v-model="form.is_pkp"
                label="PKP (Pengusaha Kena Pajak)"
                :options="isPkpOptions"
              />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <FormInput
                v-model="form.nomor_siup"
                label="Nomor SIUP/NIB Izin Usaha"
              />
              <FormInput
                v-model="form.tanggal_siup"
                label="Tanggal SIUP"
                type="date"
              />
              <FormInput
                v-model="form.masa_berlaku_siup"
                label="Masa Berlaku SIUP"
                type="date"
              />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <FormInput
                v-model="form.nomor_akta_pendirian"
                label="Nomor Akta Pendirian"
              />
              <FormInput
                v-model="form.tanggal_akta_pendirian"
                label="Tanggal Akta Pendirian"
                type="date"
              />
              <FormInput
                v-model="form.notaris_akta_pendirian"
                label="Notaris Akta Pendirian"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.nomor_akta_perubahan"
                label="Nomor Akta Perubahan Terakhir"
              />
              <FormInput
                v-model="form.tanggal_akta_perubahan"
                label="Tanggal Akta Perubahan"
                type="date"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Pengurus -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Pengurus / Penanggung Jawab</h2>
          </div>
          <div class="p-6 space-y-6">
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-3">Direktur/Pemilik</h3>
              <div class="grid grid-cols-2 gap-4">
                <FormInput
                  v-model="form.nama_direktur"
                  label="Nama Direktur"
                />
                <FormInput
                  v-model="form.nik_direktur"
                  label="NIK Direktur"
                  maxlength="16"
                />
              </div>
              <div class="grid grid-cols-2 gap-4 mt-4">
                <FormInput
                  v-model="form.jabatan_direktur"
                  label="Jabatan"
                  placeholder="Direktur Utama"
                />
                <FormInput
                  v-model="form.hp_direktur"
                  label="No. HP"
                  type="tel"
                />
              </div>
            </div>

            <div class="border-t pt-6">
              <h3 class="text-sm font-medium text-gray-700 mb-3">Contact Person</h3>
              <div class="grid grid-cols-2 gap-4">
                <FormInput
                  v-model="form.nama_cp"
                  label="Nama CP"
                />
                <FormInput
                  v-model="form.jabatan_cp"
                  label="Jabatan CP"
                />
              </div>
              <div class="grid grid-cols-2 gap-4 mt-4">
                <FormInput
                  v-model="form.hp_cp"
                  label="No. HP CP"
                  type="tel"
                />
                <FormInput
                  v-model="form.email_cp"
                  label="Email CP"
                  type="email"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Rekening -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Data Rekening</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-3 gap-4">
              <FormSelect
                v-model="form.nama_bank"
                label="Nama Bank"
                :options="bankOptions"
              />
              <FormInput
                v-model="form.nomor_rekening"
                label="Nomor Rekening"
              />
              <FormInput
                v-model="form.nama_rekening"
                label="Nama Pemilik Rekening"
              />
            </div>
          </div>
        </div>

        <!-- Section 5: Kualifikasi -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Kualifikasi Usaha</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <FormSelect
                v-model="form.kualifikasi_usaha"
                label="Kualifikasi Usaha"
                :options="kualifikasiUsahaOptions"
              />
              <FormInput
                v-model="form.bidang_pengadaan"
                label="Bidang Pengadaan"
                placeholder="Barang, Jasa Konsultansi, dll"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- ==================== PERORANGAN SECTIONS ==================== -->
      <template v-if="isPerorangan">
        <!-- Section 1: Identitas Pribadi -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Identitas Pribadi</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.nama"
                label="Nama Lengkap"
                required
                :error="errors.nama"
              />
              <FormInput
                v-model="form.nik"
                label="NIK"
                required
                maxlength="16"
                placeholder="16 digit NIK"
                :error="errors.nik"
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
                v-model="form.kota"
                label="Kota/Kabupaten"
              />
              <FormInput
                v-model="form.provinsi"
                label="Provinsi"
              />
              <FormInput
                v-model="form.telepon"
                label="No. HP"
                type="tel"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.email"
                label="Email"
                type="email"
                :error="errors.email"
              />
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
                <input
                  :value="form.npwp"
                  @input="handleNpwpInput"
                  type="text"
                  maxlength="20"
                  placeholder="XX.XXX.XXX.X-XXX.XXX"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <FormInput
              v-model="form.nama_wp"
              label="Nama Wajib Pajak (sesuai NPWP)"
            />
          </div>
        </div>

        <!-- Section 2: Pekerjaan/Profesi -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Pekerjaan / Profesi</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <FormSelect
                v-model="form.status_pekerjaan"
                label="Status Pekerjaan"
                :options="statusPekerjaanOptions"
              />
              <FormSelect
                v-model="form.pendidikan_terakhir"
                label="Pendidikan Terakhir"
                :options="pendidikanOptions"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.instansi"
                label="Nama Instansi/Perusahaan"
                placeholder="Tempat bekerja saat ini"
              />
              <FormInput
                v-model="form.jabatan"
                label="Jabatan"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput
                v-model="form.kota_instansi"
                label="Kota Instansi"
              />
              <FormInput
                v-model="form.bidang_keahlian"
                label="Bidang Keahlian"
                placeholder="Contoh: Teknik Informatika, Akuntansi"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Kualifikasi Narasumber (Optional) -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Kualifikasi Narasumber</h2>
            <p class="text-sm text-gray-500 mt-1">Isi jika akan dijadikan narasumber/pemateri</p>
          </div>
          <div class="p-6">
            <FormSelect
              v-model="form.klasifikasi_honor"
              label="Klasifikasi Honor Narasumber"
              :options="klasifikasiHonorOptions"
            />
            <p class="mt-2 text-sm text-gray-500">
              Klasifikasi ini menentukan besaran honor narasumber sesuai SBM yang berlaku.
            </p>
          </div>
        </div>

        <!-- Section 4: Rekening -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Data Rekening</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-3 gap-4">
              <FormSelect
                v-model="form.nama_bank"
                label="Nama Bank"
                :options="bankOptions"
              />
              <FormInput
                v-model="form.nomor_rekening"
                label="Nomor Rekening"
              />
              <FormInput
                v-model="form.nama_rekening"
                label="Nama Pemilik Rekening"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- ==================== COMMON SECTIONS ==================== -->
      <!-- Status & Catatan -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold text-gray-800">Status & Catatan</h2>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div class="flex items-center space-x-6">
              <label v-for="opt in statusOptions" :key="opt.value" class="flex items-center">
                <input
                  type="radio"
                  v-model="form.status"
                  :value="opt.value"
                  class="w-4 h-4 text-blue-600"
                />
                <span class="ml-2 text-gray-700">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <FormTextarea
            v-model="form.catatan"
            label="Catatan"
            rows="3"
            placeholder="Catatan tambahan (opsional)"
          />
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
