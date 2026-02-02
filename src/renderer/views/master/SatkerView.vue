<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useSatkerStore } from '../../stores/satkerStore';
import { usePegawaiStore } from '../../stores/pegawaiStore';
import BaseModal from '../../components/ui/BaseModal.vue';
import FormInput from '../../components/ui/FormInput.vue';
import FormSelect from '../../components/ui/FormSelect.vue';
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue';

const satkerStore = useSatkerStore();
const pegawaiStore = usePegawaiStore();

// Local state
const editMode = ref(false);
const showPejabatModal = ref(false);
const showUnitModal = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref({ type: '', id: null, name: '' });
const saving = ref(false);
const activeTab = ref('identitas');

// Form states
const satkerForm = ref({});
const pejabatForm = ref({
  id: null,
  jenis: '',
  nama: '',
  nip: '',
  pangkat: '',
  golongan: '',
  jabatan: '',
  no_sk: '',
  tanggal_sk: '',
  tmt_sk: '',
  sampai_dengan: '',
  status: 'aktif'
});
const unitForm = ref({
  id: null,
  nama: '',
  penanggung_jawab: '',
  status: 'aktif'
});

// Selected penanggung jawab for unit form
const selectedPenanggungJawab = ref(null);

// Options
const jenisPejabatOptions = [
  { value: 'KPA', label: 'Kuasa Pengguna Anggaran (KPA)' },
  { value: 'PPK', label: 'Pejabat Pembuat Komitmen (PPK)' },
  { value: 'PPSPM', label: 'Pejabat Penanda Tangan SPM (PPSPM)' },
  { value: 'BP', label: 'Bendahara Pengeluaran (BP)' }
];

const statusOptions = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Non-Aktif' }
];

const golonganOptions = [
  'I/a', 'I/b', 'I/c', 'I/d',
  'II/a', 'II/b', 'II/c', 'II/d',
  'III/a', 'III/b', 'III/c', 'III/d',
  'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'
].map(g => ({ value: g, label: g }));

// Pegawai options for dropdown
const pegawaiOptions = computed(() => {
  return pegawaiStore.pegawaiList.map(p => ({
    value: p.id,
    label: `${p.nama}${p.nip ? ' (' + p.nip + ')' : ''}`
  }));
});

// Selected pegawai id for form
const selectedPegawaiId = ref(null);

// Watch untuk auto-fill data pegawai saat dipilih
watch(selectedPegawaiId, (newId) => {
  if (newId) {
    const pegawai = pegawaiStore.pegawaiList.find(p => p.id === newId);
    console.log('Selected pegawai:', pegawai);
    if (pegawai) {
      pejabatForm.value.nama = pegawai.nama || pegawai.nama_lengkap || '';
      pejabatForm.value.nip = pegawai.nip || pegawai.NIP || '';
      pejabatForm.value.pangkat = pegawai.pangkat || pegawai.PANGKAT || '';
      pejabatForm.value.golongan = pegawai.golongan || pegawai.GOLONGAN || pegawai.gol || '';
      pejabatForm.value.jabatan = pegawai.jabatan || pegawai.JABATAN || '';
    }
  }
});

// Computed
const isEditing = computed(() => editMode.value);
const pejabatModalTitle = computed(() => pejabatForm.value.id ? 'Edit Pejabat' : 'Tambah Pejabat');
const unitModalTitle = computed(() => unitForm.value.id ? 'Edit Unit Kerja' : 'Tambah Unit Kerja');

// Methods
const initializeForms = () => {
  if (satkerStore.satker) {
    satkerForm.value = { ...satkerStore.satker };
  }
};

const toggleEdit = () => {
  if (editMode.value) {
    // Cancel - restore original
    initializeForms();
  }
  editMode.value = !editMode.value;
};

const saveSatker = async () => {
  saving.value = true;
  try {
    await satkerStore.updateSatker(satkerForm.value);
    editMode.value = false;
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message);
  } finally {
    saving.value = false;
  }
};

// Pejabat methods
const openPejabatModal = (pejabat = null) => {
  if (pejabat) {
    pejabatForm.value = { ...pejabat };
    // Cari pegawai berdasarkan nama/nip untuk set selected
    const found = pegawaiStore.pegawaiList.find(p => p.nama === pejabat.nama || p.nip === pejabat.nip);
    selectedPegawaiId.value = found?.id || null;
  } else {
    pejabatForm.value = {
      id: null,
      jenis: '',
      nama: '',
      nip: '',
      pangkat: '',
      golongan: '',
      jabatan: '',
      no_sk: '',
      tanggal_sk: '',
      tmt_sk: '',
      sampai_dengan: '',
      status: 'aktif'
    };
    selectedPegawaiId.value = null;
  }
  showPejabatModal.value = true;
};

const savePejabat = async () => {
  if (!pejabatForm.value.jenis || !pejabatForm.value.nama) {
    alert('Jenis dan Nama wajib diisi');
    return;
  }

  saving.value = true;
  try {
    if (pejabatForm.value.id) {
      await satkerStore.updatePejabat(pejabatForm.value.id, pejabatForm.value);
    } else {
      await satkerStore.addPejabat(pejabatForm.value);
    }
    showPejabatModal.value = false;
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message);
  } finally {
    saving.value = false;
  }
};

// Unit Kerja methods
const openUnitModal = (unit = null) => {
  if (unit) {
    unitForm.value = { ...unit };
    // Find pegawai by name for penanggung jawab
    const found = pegawaiStore.pegawaiList.find(p => p.nama === unit.penanggung_jawab);
    selectedPenanggungJawab.value = found?.id || null;
  } else {
    unitForm.value = {
      id: null,
      nama: '',
      penanggung_jawab: '',
      status: 'aktif'
    };
    selectedPenanggungJawab.value = null;
  }
  showUnitModal.value = true;
};

const saveUnit = async () => {
  if (!unitForm.value.nama) {
    alert('Nama Unit wajib diisi');
    return;
  }

  // Set penanggung_jawab from selected pegawai
  if (selectedPenanggungJawab.value) {
    const pegawai = pegawaiStore.pegawaiList.find(p => p.id === selectedPenanggungJawab.value);
    unitForm.value.penanggung_jawab = pegawai?.nama || '';
  }

  saving.value = true;
  try {
    if (unitForm.value.id) {
      await satkerStore.updateUnitKerja(unitForm.value.id, unitForm.value);
    } else {
      await satkerStore.addUnitKerja(unitForm.value);
    }
    showUnitModal.value = false;
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message);
  } finally {
    saving.value = false;
  }
};

// Delete methods
const confirmDelete = (type, id, name) => {
  deleteTarget.value = { type, id, name };
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  saving.value = true;
  try {
    if (deleteTarget.value.type === 'pejabat') {
      await satkerStore.deletePejabat(deleteTarget.value.id);
    } else if (deleteTarget.value.type === 'unit') {
      await satkerStore.deleteUnitKerja(deleteTarget.value.id);
    }
    showDeleteConfirm.value = false;
  } catch (error) {
    alert('Gagal menghapus: ' + error.message);
  } finally {
    saving.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID');
};

const getJenisLabel = (jenis) => {
  const found = jenisPejabatOptions.find(o => o.value === jenis);
  return found ? found.label : jenis;
};

onMounted(async () => {
  await satkerStore.initialize();
  // Load semua pegawai untuk dropdown
  await pegawaiStore.fetchPegawaiList({ limit: 1000 });
  initializeForms();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Master Satker</h1>
        <p class="text-gray-500">Kelola data satuan kerja, pejabat, dan unit kerja</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="satkerStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'identitas'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'identitas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Identitas Satker
          </button>
          <button
            @click="activeTab = 'pejabat'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'pejabat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Pejabat Perbendaharaan
            <span class="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-full">
              {{ satkerStore.pejabat.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'unit'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'unit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Unit Kerja
            <span class="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-full">
              {{ satkerStore.unitKerja.length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content: Identitas Satker -->
      <div v-if="activeTab === 'identitas'" class="bg-white rounded-lg shadow p-6 mt-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold text-gray-800">Identitas Satker</h2>
          <button
            @click="toggleEdit"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium',
              isEditing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            ]"
          >
            {{ isEditing ? 'Batal' : 'Edit' }}
          </button>
        </div>

        <form @submit.prevent="saveSatker" class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <FormInput
              v-model="satkerForm.kode_satker"
              label="Kode Satker"
              :disabled="!isEditing"
              required
            />
            <FormInput
              v-model="satkerForm.nama_singkat"
              label="Nama Singkat"
              :disabled="!isEditing"
            />
          </div>

          <FormInput
            v-model="satkerForm.nama"
            label="Nama Lengkap Satker"
            :disabled="!isEditing"
            required
          />

          <div class="grid grid-cols-2 gap-6">
            <FormInput
              v-model="satkerForm.kode_kl"
              label="Kode K/L"
              :disabled="!isEditing"
            />
            <FormInput
              v-model="satkerForm.nama_kl"
              label="Nama K/L"
              :disabled="!isEditing"
            />
          </div>

          <div class="grid grid-cols-2 gap-6">
            <FormInput
              v-model="satkerForm.kode_eselon1"
              label="Kode Eselon 1"
              :disabled="!isEditing"
            />
            <FormInput
              v-model="satkerForm.nama_eselon1"
              label="Nama Eselon 1"
              :disabled="!isEditing"
            />
          </div>

          <FormInput
            v-model="satkerForm.alamat"
            label="Alamat"
            :disabled="!isEditing"
          />

          <div class="grid grid-cols-2 gap-6">
            <FormInput
              v-model="satkerForm.kelurahan"
              label="Kelurahan"
              :disabled="!isEditing"
            />
            <FormInput
              v-model="satkerForm.kecamatan"
              label="Kecamatan"
              :disabled="!isEditing"
            />
          </div>

          <div class="grid grid-cols-3 gap-6">
            <FormInput
              v-model="satkerForm.kota"
              label="Kota/Kabupaten"
              :disabled="!isEditing"
            />
            <FormInput
              v-model="satkerForm.provinsi"
              label="Provinsi"
              :disabled="!isEditing"
            />
            <FormInput
              v-model="satkerForm.kode_pos"
              label="Kode Pos"
              :disabled="!isEditing"
            />
          </div>

          <div class="grid grid-cols-3 gap-6">
            <FormInput
              v-model="satkerForm.telepon"
              label="Telepon"
              type="tel"
              :disabled="!isEditing"
            />
            <FormInput
              v-model="satkerForm.email"
              label="Email"
              type="email"
              :disabled="!isEditing"
            />
            <FormInput
              v-model="satkerForm.website"
              label="Website"
              :disabled="!isEditing"
            />
          </div>

          <div v-if="isEditing" class="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              @click="toggleEdit"
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

      <!-- Tab Content: Pejabat -->
      <div v-if="activeTab === 'pejabat'" class="bg-white rounded-lg shadow mt-6">
        <div class="p-6 border-b flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Pejabat Perbendaharaan</h2>
          <button
            @click="openPejabatModal()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Tambah Pejabat
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Pejabat</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No SK</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="satkerStore.pejabat.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                  Belum ada data pejabat
                </td>
              </tr>
              <tr v-for="p in satkerStore.pejabat" :key="p.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {{ p.jenis }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{{ p.nama }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ p.nip || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ p.no_sk || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'px-2 py-1 text-xs font-medium rounded',
                    p.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  ]">
                    {{ p.status === 'aktif' ? 'Aktif' : 'Non-Aktif' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button @click="openPejabatModal(p)" class="text-blue-600 hover:text-blue-800">Edit</button>
                  <button @click="confirmDelete('pejabat', p.id, p.nama)" class="text-red-600 hover:text-red-800">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Content: Unit Kerja -->
      <div v-if="activeTab === 'unit'" class="bg-white rounded-lg shadow mt-6">
        <div class="p-6 border-b flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Unit Kerja</h2>
          <button
            @click="openUnitModal()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Tambah Unit
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Unit</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penanggung Jawab</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="satkerStore.unitKerja.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                  Belum ada data unit kerja
                </td>
              </tr>
              <tr v-for="u in satkerStore.unitKerja" :key="u.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{{ u.nama }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-700">{{ u.penanggung_jawab || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'px-2 py-1 text-xs font-medium rounded',
                    u.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  ]">
                    {{ u.status === 'aktif' ? 'Aktif' : 'Non-Aktif' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button @click="openUnitModal(u)" class="text-blue-600 hover:text-blue-800">Edit</button>
                  <button @click="confirmDelete('unit', u.id, u.nama)" class="text-red-600 hover:text-red-800">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pejabat Modal -->
    <BaseModal :show="showPejabatModal" :title="pejabatModalTitle" size="lg" @close="showPejabatModal = false">
      <form @submit.prevent="savePejabat" class="space-y-4">
        <FormSelect
          v-model="pejabatForm.jenis"
          label="Jenis Pejabat"
          :options="jenisPejabatOptions"
          required
        />

        <div class="grid grid-cols-2 gap-4">
          <FormSelect 
            v-model="selectedPegawaiId" 
            label="Pilih Pegawai" 
            :options="pegawaiOptions"
            placeholder="Pilih pegawai..."
            required
          />
          <FormInput v-model="pejabatForm.nip" label="NIP" readonly />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="pejabatForm.nama" label="Nama Lengkap" readonly />
          <FormInput v-model="pejabatForm.jabatan" label="Jabatan" readonly />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="pejabatForm.pangkat" label="Pangkat" readonly />
          <FormInput v-model="pejabatForm.golongan" label="Golongan" readonly />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="pejabatForm.no_sk" label="Nomor SK" />
          <FormInput v-model="pejabatForm.tanggal_sk" label="Tanggal SK" type="date" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="pejabatForm.tmt_sk" label="TMT" type="date" />
          <FormInput v-model="pejabatForm.sampai_dengan" label="Sampai Dengan" type="date" />
        </div>

        <FormSelect v-model="pejabatForm.status" label="Status" :options="statusOptions" />
      </form>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showPejabatModal = false"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="savePejabat"
            :disabled="saving"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Unit Kerja Modal -->
    <BaseModal :show="showUnitModal" :title="unitModalTitle" size="md" @close="showUnitModal = false">
      <form @submit.prevent="saveUnit" class="space-y-4">
        <FormInput v-model="unitForm.nama" label="Nama Unit" required />
        <FormSelect 
          v-model="selectedPenanggungJawab" 
          label="Penanggung Jawab" 
          :options="pegawaiOptions"
          placeholder="Pilih penanggung jawab..."
        />
        <FormSelect v-model="unitForm.status" label="Status" :options="statusOptions" />
      </form>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showUnitModal = false"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="saveUnit"
            :disabled="saving"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Hapus Data"
      :message="`Apakah Anda yakin ingin menghapus ${deleteTarget.type === 'pejabat' ? 'pejabat' : 'unit kerja'} '${deleteTarget.name}'?`"
      type="danger"
      confirm-text="Hapus"
      :loading="saving"
      @confirm="executeDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
