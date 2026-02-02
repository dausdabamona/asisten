<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-primary-600 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold">PPK Assistant</h1>
            <span class="text-sm text-primary-100">v{{ appVersion }}</span>
          </div>
          <nav class="flex space-x-6">
            <button 
              @click="currentView = 'dashboard'"
              :class="['hover:text-primary-100 transition-colors', 
                       currentView === 'dashboard' ? 'font-bold' : '']"
            >
              Dashboard
            </button>
            <button 
              @click="currentView = 'tier1'"
              :class="['hover:text-primary-100 transition-colors',
                       currentView === 'tier1' ? 'font-bold' : '']"
            >
              Tier 1
            </button>
            <button
              @click="currentView = 'tier2'"
              :class="['hover:text-primary-100 transition-colors',
                       currentView === 'tier2' ? 'font-bold' : '']"
            >
              Tier 2
            </button>
            <button
              @click="currentView = 'tier3'"
              :class="['hover:text-primary-100 transition-colors',
                       currentView === 'tier3' ? 'font-bold' : '']"
            >
              Tier 3
            </button>
            <router-link 
              to="/transaksi/st"
              :class="['hover:text-primary-100 transition-colors',
                       $route.path.startsWith('/transaksi') ? 'font-bold' : '']"
            >
              Transaksi
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Router view for transaction routes -->
      <router-view v-if="$route.path.startsWith('/transaksi')" />
      
      <!-- Main dashboard/app views with sidebar -->
      <div v-else class="flex gap-6">
        <!-- Sidebar - Always visible -->
        <aside class="w-64 shrink-0">
          <div class="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <!-- Menu Section -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Menu</h3>
              <div class="space-y-1">
                <button
                  @click="currentView = 'dashboard'"
                  :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Dashboard
                </button>
                <button
                  @click="currentView = 'tier1'"
                  :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           currentView === 'tier1' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Tier 1 (< Rp 10 Juta)
                </button>
                <button
                  @click="currentView = 'tier2'"
                  :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           currentView === 'tier2' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Tier 2 (Rp 10-50 Juta)
                </button>
                <button
                  @click="currentView = 'tier3'"
                  :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           currentView === 'tier3' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Tier 3 (> Rp 50 Juta)
                </button>
                <router-link
                  to="/transaksi/st"
                  :class="['block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           $route.path.startsWith('/transaksi') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Transaksi
                </router-link>
              </div>
            </div>

            <!-- Master Data Section -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Master Data</h3>
              <div class="space-y-1">
                <button
                  @click="currentView = 'master-satker'"
                  :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           currentView === 'master-satker' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Satker
                </button>
                <button
                  @click="currentView = 'master-pegawai'"
                  :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           currentView === 'master-pegawai' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Pegawai
                </button>
                <button
                  @click="currentView = 'master-dipa'"
                  :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           currentView === 'master-dipa' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  DIPA
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Content Area -->
        <div class="flex-1">
          <!-- Dashboard View -->
          <div v-if="currentView === 'dashboard'" class="space-y-6">
            <h2 class="text-3xl font-bold">Dashboard</h2>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="card">
                <h3 class="text-lg font-semibold text-gray-700">Total Requests</h3>
                <p class="text-4xl font-bold text-primary-600 mt-2">{{ stats.total }}</p>
              </div>
              <div class="card">
                <h3 class="text-lg font-semibold text-gray-700">Pending</h3>
                <p class="text-4xl font-bold text-yellow-600 mt-2">{{ stats.pending }}</p>
              </div>
              <div class="card">
                <h3 class="text-lg font-semibold text-gray-700">Completed</h3>
                <p class="text-4xl font-bold text-green-600 mt-2">{{ stats.completed }}</p>
              </div>
            </div>

            <!-- Recent Requests -->
            <div class="card">
              <h3 class="text-xl font-bold mb-4">Recent Requests</h3>
              
              <div v-if="loading" class="text-center py-8">
                <p class="text-gray-500">Loading...</p>
              </div>

              <div v-else-if="requests.length === 0" class="text-center py-8">
                <p class="text-gray-500">No requests yet</p>
              </div>

              <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="request in requests" :key="request.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ request.request_number }}</td>
                      <td class="px-6 py-4 text-sm text-gray-900">{{ request.item_name }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatCurrency(request.estimated_value) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap"><span :class="getStatusClass(request.status)">{{ request.status }}</span></td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(request.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Tier 1 View -->
          <div v-else-if="currentView === 'tier1'" class="space-y-6">
            <h2 class="text-3xl font-bold">Tier 1: Pengadaan &lt; Rp 10 Juta</h2>
            
            <div class="card max-w-2xl">
              <form @submit.prevent="submitTier1" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nama Barang/Jasa *</label>
                  <input v-model="tier1Form.item_name" type="text" required maxlength="200" class="input-field" placeholder="Contoh: ATK untuk kegiatan workshop" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                  <textarea v-model="tier1Form.description" rows="3" class="input-field" placeholder="Deskripsi singkat kebutuhan" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Perkiraan Nilai *</label>
                  <input v-model.number="tier1Form.estimated_value" type="number" required min="1" max="10000000" class="input-field" placeholder="5000000" />
                  <p v-if="tier1Form.estimated_value > 10000000" class="text-red-500 text-sm mt-1">⚠️ Nilai melebihi Rp 10 juta. Gunakan Tier 2.</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Kode Anggaran *</label>
                  <input v-model="tier1Form.budget_code" type="text" required class="input-field" placeholder="5211" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select v-model="tier1Form.unit" required class="input-field">
                    <option value="">Pilih Unit</option>
                    <option value="TU">Tata Usaha</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Lab">Laboratorium</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                  </select>
                </div>
                <div class="flex space-x-4">
                  <button type="submit" :disabled="submitting || tier1Form.estimated_value > 10000000" class="btn-primary flex-1">{{ submitting ? 'Processing...' : 'Submit Request' }}</button>
                  <button type="button" @click="resetTier1Form" class="btn-secondary">Reset</button>
                </div>
              </form>
            </div>
          </div>

          <!-- Tier 2 View -->
          <div v-else-if="currentView === 'tier2'" class="space-y-6">
            <h2 class="text-3xl font-bold">Tier 2: Pengadaan Rp 10-50 Juta</h2>
            <div class="card">
              <p class="text-gray-500">Coming soon...</p>
            </div>
          </div>

          <!-- Tier 3 View -->
          <div v-else-if="currentView === 'tier3'">
            <Tier3Form @submit="handleTier3Submit" @save-draft="handleTier3SaveDraft" @cancel="currentView = 'dashboard'" />
          </div>

          <!-- Master Data: Satker -->
          <div v-else-if="currentView === 'master-satker'" class="space-y-6">
            <h2 class="text-3xl font-bold">Master Data Satker</h2>
            <div class="card">
              <form @submit.prevent="saveSatker" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Kode Satker</label>
                    <input v-model="satkerForm.kode_satker" type="text" class="w-full px-3 py-2 border rounded-lg" required>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">NPWP</label>
                    <input v-model="satkerForm.npwp" type="text" class="w-full px-3 py-2 border rounded-lg">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Nama Satker</label>
                    <input v-model="satkerForm.nama" type="text" class="w-full px-3 py-2 border rounded-lg" required>
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Alamat</label>
                    <textarea v-model="satkerForm.alamat" class="w-full px-3 py-2 border rounded-lg" rows="3"></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Kota</label>
                    <input v-model="satkerForm.kota" type="text" class="w-full px-3 py-2 border rounded-lg">
                  </div>
                </div>
                <div class="flex gap-2">
                  <button type="submit" class="btn-primary">Simpan Satker</button>
                  <span v-if="satkerSaved" class="text-green-600 flex items-center">✓ Tersimpan</span>
                </div>
              </form>
            </div>
          </div>

          <!-- Master Data: Pegawai -->
          <div v-else-if="currentView === 'master-pegawai'" class="space-y-6">
            <h2 class="text-3xl font-bold">Master Data Pegawai</h2>
            <div class="card">
              <h3 class="text-lg font-semibold mb-4">Tambah Pegawai</h3>
              <form @submit.prevent="addPegawai" class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Nama</label>
                    <input v-model="pegawaiForm.nama" type="text" class="w-full px-3 py-2 border rounded-lg" required>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">NIP</label>
                    <input v-model="pegawaiForm.nip" type="text" class="w-full px-3 py-2 border rounded-lg" required>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Jabatan</label>
                    <input v-model="pegawaiForm.jabatan" type="text" class="w-full px-3 py-2 border rounded-lg">
                  </div>
                </div>
                <button type="submit" class="btn-primary">Tambah Pegawai</button>
              </form>
            </div>
            <div class="card">
              <h3 class="text-lg font-semibold mb-4">Daftar Pegawai ({{ pegawaiList.length }})</h3>
              <div v-if="pegawaiList.length === 0" class="text-gray-500 text-center py-8">Belum ada pegawai. Tambahkan pegawai baru di form atas.</div>
              <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="pegawai in pegawaiList" :key="pegawai.id">
                      <td class="px-4 py-3">{{ pegawai.nama }}</td>
                      <td class="px-4 py-3">{{ pegawai.nip }}</td>
                      <td class="px-4 py-3">{{ pegawai.jabatan }}</td>
                      <td class="px-4 py-3">
                        <button @click="deletePegawai(pegawai.id)" class="text-red-600 hover:text-red-800">Hapus</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Master Data: DIPA -->
          <div v-else-if="currentView === 'master-dipa'" class="space-y-6">
            <h2 class="text-3xl font-bold">Master Data DIPA</h2>
            <div class="card">
              <h3 class="text-lg font-semibold mb-4">Tambah DIPA</h3>
              <form @submit.prevent="addDipa" class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Tahun Anggaran</label>
                    <input v-model.number="dipaForm.tahun" type="number" min="2020" max="2030" class="w-full px-3 py-2 border rounded-lg" required>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Nomor DIPA</label>
                    <input v-model="dipaForm.nomor" type="text" class="w-full px-3 py-2 border rounded-lg" required>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Tanggal DIPA</label>
                    <input v-model="dipaForm.tanggal" type="date" class="w-full px-3 py-2 border rounded-lg" required>
                  </div>
                </div>
                <button type="submit" class="btn-primary">Tambah DIPA</button>
              </form>
            </div>
            <div class="card">
              <h3 class="text-lg font-semibold mb-4">Daftar DIPA ({{ dipaList.length }})</h3>
              <div v-if="dipaList.length === 0" class="text-gray-500 text-center py-8">Belum ada DIPA. Tambahkan DIPA baru di form atas.</div>
              <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor DIPA</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="dipa in dipaList" :key="dipa.id">
                      <td class="px-4 py-3">{{ dipa.tahun }}</td>
                      <td class="px-4 py-3">{{ dipa.nomor }}</td>
                      <td class="px-4 py-3">{{ dipa.tanggal }}</td>
                      <td class="px-4 py-3">
                        <button @click="deleteDipa(dipa.id)" class="text-red-600 hover:text-red-800">Hapus</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Tier3Form from './components/Tier3Form.vue'

const route = useRoute()

const appVersion = ref('1.0.0')
const currentView = ref('dashboard')
const loading = ref(false)
const submitting = ref(false)
const requests = ref([])

const tier1Form = ref({
  item_name: '',
  description: '',
  estimated_value: 0,
  budget_code: '',
  unit: '',
  tier: 'tier1',
  requester_id: 'admin-id',
  status: 'draft'
})

const satkerForm = ref({
  kode_satker: '',
  nama: '',
  npwp: '',
  kota: '',
  alamat: ''
})
const satkerSaved = ref(false)

const pegawaiForm = ref({ nama: '', nip: '', jabatan: '' })
const pegawaiList = ref([])

const dipaForm = ref({ tahun: new Date().getFullYear(), nomor: '', tanggal: '' })
const dipaList = ref([])

const stats = computed(() => {
  return {
    total: requests.value.length,
    pending: requests.value.filter(r => r.status === 'pending').length,
    completed: requests.value.filter(r => r.status === 'completed').length
  }
})

async function loadRequests() {
  loading.value = true
  try {
    const result = await window.electronAPI.db.getRequests({})
    if (result.success) {
      requests.value = result.data
    }
  } catch (error) {
    console.error('Failed to load requests:', error)
  } finally {
    loading.value = false
  }
}

async function submitTier1() {
  submitting.value = true
  try {
    const result = await window.electronAPI.db.createRequest(tier1Form.value)
    if (result.success) {
      alert(`Request created successfully!\nRequest #: ${result.data.request_number}`)
      resetTier1Form()
      await loadRequests()
      currentView.value = 'dashboard'
    } else {
      alert('Error: ' + result.error)
    }
  } catch (error) {
    alert('Error: ' + error.message)
  } finally {
    submitting.value = false
  }
}

function resetTier1Form() {
  tier1Form.value = {
    item_name: '',
    description: '',
    estimated_value: 0,
    budget_code: '',
    unit: '',
    tier: 'tier1',
    requester_id: 'admin-id',
    status: 'draft'
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getStatusClass(status) {
  const classes = {
    draft: 'px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800',
    pending: 'px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800',
    approved: 'px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
    rejected: 'px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800',
    completed: 'px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'
  }
  return classes[status] || classes.draft
}

async function handleTier3Submit(formData) {
  try {
    const result = await window.electronAPI.request.create({
      ...formData,
      tier: 'tier3',
      status: 'pending'
    })
    if (result.success) {
      alert(`Pengajuan Tier 3 berhasil dibuat!\nNomor: ${result.data.request_number}`)
      await loadRequests()
      currentView.value = 'dashboard'
    } else {
      alert('Error: ' + (result.error?.message || result.error))
    }
  } catch (error) {
    console.error('Tier 3 submit error:', error)
    alert('Gagal menyimpan pengajuan: ' + error.message)
  }
}

async function handleTier3SaveDraft(formData) {
  try {
    const result = await window.electronAPI.request.create({
      ...formData,
      tier: 'tier3',
      status: 'draft'
    })
    if (result.success) {
      alert('Draft tersimpan!')
    } else {
      alert('Error: ' + (result.error?.message || result.error))
    }
  } catch (error) {
    console.error('Tier 3 save draft error:', error)
    alert('Gagal menyimpan draft: ' + error.message)
  }
}

function saveSatker() {
  console.log('Saving satker:', satkerForm.value)
  satkerSaved.value = true
  setTimeout(() => satkerSaved.value = false, 3000)
  alert('Data Satker disimpan!')
}

function addPegawai() {
  if (pegawaiForm.value.nama && pegawaiForm.value.nip) {
    pegawaiList.value.push({ 
      ...pegawaiForm.value, 
      id: Date.now() 
    })
    pegawaiForm.value = { nama: '', nip: '', jabatan: '' }
  }
}

function deletePegawai(id) {
  if (confirm('Hapus pegawai ini?')) {
    pegawaiList.value = pegawaiList.value.filter(p => p.id !== id)
  }
}

function addDipa() {
  if (dipaForm.value.nomor && dipaForm.value.tanggal) {
    dipaList.value.push({ 
      ...dipaForm.value, 
      id: Date.now() 
    })
    dipaForm.value = { 
      tahun: new Date().getFullYear(), 
      nomor: '', 
      tanggal: '' 
    }
  }
}

function deleteDipa(id) {
  if (confirm('Hapus DIPA ini?')) {
    dipaList.value = dipaList.value.filter(d => d.id !== id)
  }
}

onMounted(async () => {
  console.log('App mounted')
  try {
    appVersion.value = await window.electronAPI.app.getVersion()
  } catch (error) {
    console.error('Failed to get version:', error)
  }
  await loadRequests()
})
</script>
