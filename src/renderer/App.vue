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
            <button 
              @click="showDebug"
              title="Open Debug Panel"
              class="hover:text-primary-100 transition-colors text-xs opacity-75"
            >
              🔧 Debug
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Router view for transaction routes and ALL routed views -->
      <router-view v-if="$route.path !== '/'" />
      
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
              </div>
            </div>

            <!-- Transaksi Section -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Transaksi</h3>
              <div class="space-y-1">
                <router-link
                  to="/transaksi"
                  :class="['block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           $route.path === '/transaksi' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  📊 Semua Transaksi
                </router-link>
                <router-link
                  to="/transaksi/lp"
                  :class="['block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           $route.path.startsWith('/transaksi/lp') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  📋 Lembar Permintaan
                </router-link>
                <router-link
                  to="/transaksi/st"
                  :class="['block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           $route.path.startsWith('/transaksi/st') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  ✈️ Surat Tugas
                </router-link>
              </div>
            </div>

            <!-- Permintaan Tier Section -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Permintaan</h3>
              <div class="space-y-1">
                <router-link
                  to="/transaksi/tier1/tambah"
                  :class="['block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           $route.path.includes('tier1') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Tier 1
                </router-link>
                <router-link
                  to="/transaksi/tier2/tambah"
                  :class="['block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           $route.path.includes('tier2') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Tier 2
                </router-link>
                <router-link
                  to="/transaksi/tier3/tambah"
                  :class="['block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', 
                           $route.path.includes('tier3') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50']"
                >
                  Tier 3
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
        <section class="flex-1">
          <!-- Dashboard View -->
          <div v-if="currentView === 'dashboard'" class="space-y-6">
            <h2 class="text-3xl font-bold">Dashboard</h2>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <router-link to="/transaksi/lp/barang/tambah" class="quick-action-card lp-card">
                <div class="icon">📋</div>
                <h3 class="title">Lembar Permintaan</h3>
                <p class="desc">Buat permintaan pengadaan barang/jasa</p>
              </router-link>
              <router-link to="/transaksi/st/tambah" class="quick-action-card st-card">
                <div class="icon">✈️</div>
                <h3 class="title">Surat Tugas</h3>
                <p class="desc">Buat surat tugas perjalanan dinas</p>
              </router-link>
              <router-link to="/transaksi/tier1/tambah" class="quick-action-card tier-card">
                <div class="icon">📝</div>
                <h3 class="title">Permintaan Tier</h3>
                <p class="desc">Ajukan permintaan Tier 1/2/3</p>
              </router-link>
            </div>
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-700">Total Requests</h3>
            <p class="text-4xl font-bold text-primary-600 mt-2">
              {{ stats.total }}
            </p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-700">Pending</h3>
            <p class="text-4xl font-bold text-yellow-600 mt-2">
              {{ stats.pending }}
            </p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-700">Completed</h3>
            <p class="text-4xl font-bold text-green-600 mt-2">
              {{ stats.completed }}
            </p>
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
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Request #
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="request in requests" :key="request.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ request.id }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ request.item_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatCurrency(request.budget_total || request.estimated_value || 0) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getStatusClass(request.status)">
                      {{ request.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(request.created_at) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tier 1 View -->
      <div v-else-if="currentView === 'tier1'" class="space-y-6">
        <h2 class="text-3xl font-bold">Tier 1: Pengadaan < Rp 10 Juta</h2>
        
        <div class="card max-w-2xl">
          <form @submit.prevent="submitTier1" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nama Barang/Jasa *
              </label>
              <input 
                v-model="tier1Form.item_name"
                type="text"
                required
                maxlength="200"
                class="input-field"
                placeholder="Contoh: ATK untuk kegiatan workshop"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea 
                v-model="tier1Form.description"
                rows="3"
                class="input-field"
                placeholder="Deskripsi singkat kebutuhan"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Item DIPA (Kode Anggaran) *
              </label>
              <input
                v-model="tier1DipaSearch"
                type="text"
                class="input-field mb-2"
                placeholder="Cari kode akun/uraian item..."
              />
              <div class="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                <div v-if="filteredDipaItems.length === 0" class="text-gray-500 text-sm">
                  Belum ada item DIPA. Import DIPA terlebih dahulu.
                </div>
                <label v-for="item in filteredDipaItems" :key="item.id" class="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    :value="item.id"
                    v-model="tier1Form.budget_item_ids"
                    class="mt-1"
                  />
                  <div class="flex-1">
                    <div class="font-mono text-xs text-gray-500">{{ item.kode_akun || '-' }}</div>
                    <div class="text-gray-900">{{ item.uraian_item || '-' }}</div>
                  </div>
                  <div class="text-right text-gray-700 whitespace-nowrap">
                    {{ formatCurrency(item.total || 0) }}
                  </div>
                </label>
              </div>
              <div class="text-sm text-gray-600 mt-2">
                Total terpilih: <strong>{{ formatCurrency(tier1BudgetTotal) }}</strong>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <div class="flex gap-2 mb-2">
                <input
                  v-model="tier1Form.unit_name"
                  list="unit-options"
                  required
                  class="input-field"
                  placeholder="Masukkan unit"
                />
                <button type="button" @click="addTier1Unit" class="btn-secondary">Tambah</button>
              </div>
              <datalist id="unit-options">
                <option v-for="unit in tier1Units" :key="unit" :value="unit"></option>
              </datalist>
              <div class="flex flex-wrap gap-2">
                <span v-for="unit in tier1Units" :key="unit" class="px-2 py-1 bg-gray-100 rounded text-xs">
                  {{ unit }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Penanggung Jawab Unit
              </label>
              <select v-model="tier1Form.unit_responsible_nip" required class="input-field">
                <option value="">Pilih Pegawai</option>
                <option v-for="pegawai in availablePegawai" :key="pegawai.nip" :value="pegawai.nip">
                  {{ pegawai.nama }} ({{ pegawai.nip }})
                </option>
              </select>
            </div>

            <div class="flex space-x-4">
              <button 
                type="submit"
                :disabled="submitting || tier1Form.budget_item_ids.length === 0"
                class="btn-primary flex-1"
              >
                {{ submitting ? 'Processing...' : 'Submit Request' }}
              </button>
              <button 
                type="button"
                @click="resetTier1Form"
                class="btn-secondary"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tier 2 View (placeholder) -->
      <div v-else-if="currentView === 'tier2'" class="space-y-6">
        <h2 class="text-3xl font-bold">Tier 2: Pengadaan Rp 10-50 Juta</h2>
        <div class="card">
          <p class="text-gray-500">Coming soon...</p>
        </div>
      </div>

      <!-- Tier 3 View -->
      <div v-else-if="currentView === 'tier3'">
        <Tier3Form
          @submit="handleTier3Submit"
          @save-draft="handleTier3SaveDraft"
          @cancel="currentView = 'dashboard'"
        />
      </div>

      <!-- Master Data: Satker -->
      <div v-else-if="currentView === 'master-satker'" class="space-y-6">
        <h2 class="text-3xl font-bold">Master Data Satker</h2>
        
        <!-- Form Tambah/Edit Satker -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">{{ editingSatkerId ? 'Edit Satker' : 'Tambah Satker Baru' }}</h3>
          <form @submit.prevent="saveSatker" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Kode Satker *</label>
                <input v-model="satkerForm.kode_satker" type="text" class="w-full px-3 py-2 border rounded-lg" required :disabled="editingSatkerId">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">NPWP</label>
                <input v-model="satkerForm.npwp" type="text" class="w-full px-3 py-2 border rounded-lg" placeholder="15 digit NPWP">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium mb-1">Nama Satker *</label>
                <input v-model="satkerForm.nama" type="text" class="w-full px-3 py-2 border rounded-lg" required>
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium mb-1">Alamat</label>
                <textarea v-model="satkerForm.alamat" class="w-full px-3 py-2 border rounded-lg" rows="2"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Kota</label>
                <input v-model="satkerForm.kota" type="text" class="w-full px-3 py-2 border rounded-lg">
              </div>
            </div>

            <!-- Officials Section -->
            <div class="border-t pt-4">
              <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold text-gray-700">Pejabat Satker</h4>
                <button 
                  type="button" 
                  @click="loadAvailablePegawai" 
                  class="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  🔄 Reload Pegawai ({{ availablePegawai.length }})
                </button>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">KPA (Kuasa Pengguna Anggaran)</label>
                  <select v-model="satkerForm.kpa_nip" class="w-full px-3 py-2 border rounded-lg">
                    <option value="">{{ availablePegawai.length === 0 ? 'Loading pegawai...' : '-- Pilih Pegawai --' }}</option>
                    <option v-for="pegawai in availablePegawai" :key="pegawai.nip" :value="pegawai.nip">
                      {{ pegawai.nama }} ({{ pegawai.nip }})
                    </option>
                  </select>
                  <p v-if="availablePegawai.length > 0" class="text-xs text-gray-500 mt-1">{{ availablePegawai.length }} pegawai tersedia</p>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">PPK (Pejabat Pembuat Komitmen)</label>
                  <select v-model="satkerForm.ppk_nip" class="w-full px-3 py-2 border rounded-lg">
                    <option value="">{{ availablePegawai.length === 0 ? 'Loading pegawai...' : '-- Pilih Pegawai --' }}</option>
                    <option v-for="pegawai in availablePegawai" :key="pegawai.nip" :value="pegawai.nip">
                      {{ pegawai.nama }} ({{ pegawai.nip }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">PPSPM (Pengesahan SPM)</label>
                  <select v-model="satkerForm.ppspm_nip" class="w-full px-3 py-2 border rounded-lg">
                    <option value="">{{ availablePegawai.length === 0 ? 'Loading pegawai...' : '-- Pilih Pegawai --' }}</option>
                    <option v-for="pegawai in availablePegawai" :key="pegawai.nip" :value="pegawai.nip">
                      {{ pegawai.nama }} ({{ pegawai.nip }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Bendahara</label>
                  <select v-model="satkerForm.bendahara_nip" class="w-full px-3 py-2 border rounded-lg">
                    <option value="">{{ availablePegawai.length === 0 ? 'Loading pegawai...' : '-- Pilih Pegawai --' }}</option>
                    <option v-for="pegawai in availablePegawai" :key="pegawai.nip" :value="pegawai.nip">
                      {{ pegawai.nama }} ({{ pegawai.nip }})
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <button type="submit" class="btn-primary">{{ editingSatkerId ? 'Update Satker' : 'Simpan Satker' }}</button>
              <button v-if="editingSatkerId" type="button" @click="cancelEditSatker" class="btn-secondary">Batal</button>
              <span v-if="satkerSaved" class="text-green-600 flex items-center">✓ Tersimpan</span>
            </div>
          </form>
        </div>

        <!-- Daftar Satker -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Daftar Satker ({{ satkerList.length }})</h3>
          <div v-if="satkerList.length === 0" class="text-gray-500 text-center py-8">
            Belum ada satker. Tambahkan satker baru di form atas.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">Kode</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">Nama Satker</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">KPA</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">PPK</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">PPSPM</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">Bendahara</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="satker in satkerList" :key="satker.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium">{{ satker.kode_satker }}</td>
                  <td class="px-4 py-3">
                    <div class="font-medium">{{ satker.nama }}</div>
                    <div v-if="satker.kota" class="text-xs text-gray-500">{{ satker.kota }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div v-if="satker.kpa_nama" class="font-medium">{{ satker.kpa_nama }}</div>
                    <div v-else class="text-gray-400">-</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div v-if="satker.ppk_nama" class="font-medium">{{ satker.ppk_nama }}</div>
                    <div v-else class="text-gray-400">-</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div v-if="satker.ppspm_nama" class="font-medium">{{ satker.ppspm_nama }}</div>
                    <div v-else class="text-gray-400">-</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div v-if="satker.bendahara_nama" class="font-medium">{{ satker.bendahara_nama }}</div>
                    <div v-else class="text-gray-400">-</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div class="flex gap-2">
                      <button @click="editSatker(satker)" class="text-blue-600 hover:text-blue-800">Edit</button>
                      <button @click="deleteSatker(satker.id)" class="text-red-600 hover:text-red-800">Hapus</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Master Data: Pegawai -->
      <div v-else-if="currentView === 'master-pegawai'" class="space-y-6">
        <h2 class="text-3xl font-bold">Master Data Pegawai</h2>
        
        <!-- Tab Navigation -->
        <div class="flex gap-2 border-b border-gray-200">
          <button 
            @click="pegawaiTab = 'manual'"
            :class="['px-4 py-2 font-medium border-b-2', pegawaiTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800']"
          >
            Input Manual
          </button>
          <button 
            @click="pegawaiTab = 'import'"
            :class="['px-4 py-2 font-medium border-b-2', pegawaiTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800']"
          >
            Import CSV
          </button>
        </div>

        <!-- Tab: Input Manual -->
        <div v-if="pegawaiTab === 'manual'" class="space-y-6">
          <!-- Form Tambah Pegawai -->
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
        </div>

        <!-- Tab: Import CSV -->
        <div v-if="pegawaiTab === 'import'" class="space-y-6">
          <!-- Upload CSV -->
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">📥 Upload File CSV</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Pilih File CSV</label>
                <div class="flex items-center gap-4">
                  <input 
                    type="file" 
                    ref="csvFileInput"
                    accept=".csv"
                    @change="handleCsvFileSelect"
                    class="flex-1 px-3 py-2 border rounded-lg text-sm"
                  >
                  <button type="button" @click="csvFileInput?.click()" class="btn-secondary">Browse</button>
                </div>
              </div>
              
              <!-- Format Help -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p class="font-medium text-blue-900 mb-2">📋 Format CSV yang didukung:</p>
                <code class="text-blue-800 whitespace-pre-wrap">NIP,Nama,Jabatan
19850315123456,Budi Santoso,Kepala Bidang
19880620234567,Siti Nurhaliza,Staf Administrasi</code>
              </div>

              <p class="text-sm text-gray-600">
                ✓ Kolom minimum: <strong>NIP, Nama, Jabatan</strong><br>
                ✓ Format file: <strong>.csv (comma-separated)</strong><br>
                ✓ Encoding: <strong>UTF-8</strong>
              </p>
            </div>
          </div>

          <!-- Preview Data -->
          <div v-if="csvPreviewData.length > 0" class="card">
            <h3 class="text-lg font-semibold mb-4">👁️ Preview Data ({{ csvPreviewData.length }} baris)</h3>
            
            <!-- Error/Warning Messages -->
            <div v-if="csvErrors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p class="font-medium text-red-900 mb-2">⚠️ Ditemukan {{ csvErrors.length }} error:</p>
              <ul class="text-sm text-red-800 space-y-1">
                <li v-for="(error, idx) in csvErrors" :key="idx" class="flex gap-2">
                  <span class="font-medium">Baris {{ error.row }}:</span>
                  <span>{{ error.message }}</span>
                </li>
              </ul>
            </div>

            <!-- Preview Table -->
            <div class="overflow-x-auto mb-4">
              <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-gray-700 w-12">#</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">NIP</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">Nama</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">Jabatan</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(row, idx) in csvPreviewData" :key="idx" :class="row.valid ? 'hover:bg-green-50' : 'bg-red-50'">
                    <td class="px-3 py-2 text-gray-600">{{ idx + 1 }}</td>
                    <td class="px-3 py-2 font-mono text-gray-900">{{ row.nip }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.nama }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.jabatan }}</td>
                    <td class="px-3 py-2">
                      <span v-if="row.valid" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Valid</span>
                      <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Invalid</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Import Button -->
            <div class="flex gap-2">
              <button 
                @click="importCsvData"
                data-action="import-csv"
                :disabled="csvErrors.length > 0"
                :class="['btn-primary', csvErrors.length > 0 ? 'opacity-50 cursor-not-allowed' : '']"
              >
                ✓ Import {{ csvPreviewData.filter(r => r.valid).length }} Data Valid
              </button>
              <button @click="resetCsvImport" class="btn-secondary">❌ Batal</button>
            </div>
          </div>
        </div>

        <!-- Daftar Pegawai -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Daftar Pegawai ({{ pegawaiList.length }})</h3>
          <div v-if="pegawaiList.length === 0" class="text-gray-500 text-center py-8">
            Belum ada pegawai. Tambahkan pegawai baru atau import dari CSV.
          </div>
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
                    <button @click="deletePegawai(pegawai.id)" class="text-red-600 hover:text-red-800 text-sm">Hapus</button>
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

        <div class="space-y-6">
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">Tambah DIPA</h3>
            <form @submit.prevent="addDipa" class="space-y-4">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Tahun Anggaran</label>
                  <input v-model.number="dipaForm.tahun_anggaran" type="number" min="2020" max="2030" class="w-full px-3 py-2 border rounded-lg" required>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Nomor DIPA</label>
                  <input v-model="dipaForm.nomor_dipa" type="text" class="w-full px-3 py-2 border rounded-lg" required>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Tanggal DIPA</label>
                  <input v-model="dipaForm.tanggal_dipa" type="date" class="w-full px-3 py-2 border rounded-lg" required>
                </div>
              </div>
              <button type="submit" class="btn-primary">Tambah DIPA</button>
            </form>
          </div>
        </div>

        <!-- Daftar DIPA -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Daftar DIPA ({{ dipaList.length }})</h3>
          <div v-if="dipaList.length === 0" class="text-gray-500 text-center py-8">
            Belum ada DIPA. Tambahkan DIPA baru di form atas.
          </div>
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
                  <td class="px-4 py-3">{{ dipa.tahun_anggaran }}</td>
                  <td class="px-4 py-3">{{ dipa.nomor_dipa }}</td>
                  <td class="px-4 py-3">{{ dipa.tanggal_dipa ? new Date(dipa.tanggal_dipa).toLocaleDateString('id-ID') : '-' }}</td>
                  <td class="px-4 py-3 space-x-2">
                    <button @click="openDipaDetail(dipa.id)" class="text-blue-600 hover:text-blue-800 text-sm">📋 Detail</button>
                    <button @click="deleteDipa(dipa.id)" class="text-red-600 hover:text-red-800 text-sm">🗑️ Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- CSV Import Section (shown when Detail button clicked) -->
        <div v-if="selectedDipaForImport" data-section="import-dipa-csv" class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">📥 Import CSV untuk DIPA {{ selectedDipaForImport?.nomor_dipa }}</h3>
            <button @click="selectedDipaForImport = null" class="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Pilih File CSV</label>
              <div class="flex items-center gap-4">
                <input 
                  type="file" 
                  ref="dipaCsvInput"
                  accept=".csv"
                  @change="handleDipaCsvFileSelect"
                  class="flex-1 px-3 py-2 border rounded-lg text-sm"
                >
                <button type="button" @click="dipaCsvInput?.click()" class="btn-secondary">Browse</button>
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p class="font-medium text-blue-900 mb-2">📋 Header CSV wajib:</p>
              <code class="text-blue-800 whitespace-pre-wrap text-xs">KDSATKER,KODE_PROGRAM,KODE_KEGIATAN,KODE_OUTPUT,KDIB,VOLUME_OUTPUT,KODE_SUBOUTPUT,VOLUME_SUBOUTPUT,KODE_KOMPONEN,KODE_SUBKOMPONEN,URAIAN_SUBKOMPONEN,KODE_AKUN,KODE_JENIS_BEBAN,KODE_CARA_TARIK,KODE_JENIS_BANTUAN,KODE_REGISTER,HEADER1,HEADER2,KODE_ITEM,NOMOR_ITEM,CONS_ITEM,URAIAN_ITEM,SUMBER_DANA,VOL_KEG_1,SAT_KEG_1,VOL_KEG_2,SAT_KEG_2,VOL_KEG_3,SAT_KEG_3,VOL_KEG_4,SAT_KEG_4,VOLKEG,SATKEG,HARGASAT,TOTAL,KODE_BLOKIR,NILAI_BLOKIR,KODE_STS_HISTORY,POK_NILAI_1,POK_NILAI_2,POK_NILAI_3,POK_NILAI_4,POK_NILAI_5,POK_NILAI_6,POK_NILAI_7,POK_NILAI_8,POK_NILAI_9,POK_NILAI_10,POK_NILAI_11,POK_NILAI_12</code>
            </div>

            <p class="text-sm text-gray-600">
              ✓ Format file: <strong>.csv (comma-separated)</strong><br>
              ✓ Encoding: <strong>UTF-8</strong>
            </p>
          </div>

          <!-- Preview DIPA CSV -->
          <div v-if="dipaCsvPreview.length > 0" class="mt-6 pt-6 border-t">
            <h4 class="text-lg font-semibold mb-4">👁️ Preview Data ({{ dipaCsvPreview.length }} baris)</h4>

            <div v-if="dipaCsvErrors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p class="font-medium text-red-900 mb-2">⚠️ Ditemukan {{ dipaCsvErrors.length }} error:</p>
              <ul class="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                <li v-for="(error, idx) in dipaCsvErrors" :key="idx" class="flex gap-2">
                  <span class="font-medium">Baris {{ error.row }}:</span>
                  <span>{{ error.message }}</span>
                </li>
              </ul>
            </div>

            <div class="overflow-x-auto mb-4">
              <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KDSATKER</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KODE_PROGRAM</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KODE_KEGIATAN</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KODE_OUTPUT</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KODE_SUBOUTPUT</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KODE_KOMPONEN</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KODE_SUBKOMPONEN</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">KODE_AKUN</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">URAIAN_ITEM</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-700">TOTAL</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(row, idx) in dipaCsvPreview" :key="idx" :class="row.valid ? 'hover:bg-green-50' : 'bg-red-50'">
                    <td class="px-3 py-2 text-gray-900">{{ row.KDSATKER }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.KODE_PROGRAM }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.KODE_KEGIATAN }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.KODE_OUTPUT }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.KODE_SUBOUTPUT }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.KODE_KOMPONEN }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.KODE_SUBKOMPONEN }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.KODE_AKUN }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.URAIAN_ITEM }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ row.TOTAL }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex gap-2">
              <button 
                @click="importDipaCsvData"
                data-action="import-dipa-csv"
                :disabled="dipaCsvErrors.length > 0"
                :class="['btn-primary', dipaCsvErrors.length > 0 ? 'opacity-50 cursor-not-allowed' : '']"
              >
                ✓ Import {{ dipaCsvPreview.filter(r => r.valid).length }} Data Valid
              </button>
              <button @click="resetDipaCsvImport" class="btn-secondary">❌ Batal</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Item DIPA ({{ dipaItems.length }})</h3>
            <button @click="cleanupDipaItems" class="btn-secondary text-sm">🧹 Hapus Item Kosong</button>
          </div>
          <div v-if="dipaItems.length === 0" class="text-gray-500 text-center py-8">
            Belum ada item DIPA. Import dari CSV untuk menambahkan data.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Kode Program</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Kode Kegiatan</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Kode Output</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Kode Akun</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Uraian Item</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Volume</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700">Satuan</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in dipaItems" :key="item.id">
                  <td class="px-3 py-2">{{ item.kode_program }}</td>
                  <td class="px-3 py-2">{{ item.kode_kegiatan }}</td>
                  <td class="px-3 py-2">{{ item.kode_output }}</td>
                  <td class="px-3 py-2">{{ item.kode_akun }}</td>
                  <td class="px-3 py-2">{{ item.uraian_item }}</td>
                  <td class="px-3 py-2 text-center">{{ item.volume }} {{ item.satuan }}</td>
                  <td class="px-3 py-2">{{ item.satuan }}</td>
                  <td class="px-3 py-2 text-right">{{ item.total?.toLocaleString('id-ID') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </section>
      </div>
    </main>
    
    <!-- Debug Panel (dev mode only) -->
    <DebugPanel />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Tier3Form from './components/Tier3Form.vue'
import DebugPanel from './components/DebugPanel.vue'

const route = useRoute()

// Initialize electronAPI if not available (fallback for dev mode)
function initializeElectronAPI() {
  if (typeof window.electronAPI !== 'undefined') {
    console.log('✅ electronAPI already available')
    return
  }
  
  console.warn('⚠️ electronAPI not available, attempting fallback initialization...')
  
  try {
    // Try to access ipcRenderer directly (works in dev mode with contextIsolation: false)
    const { ipcRenderer } = require('electron')
    
    console.log('✅ ipcRenderer accessible, creating fallback electronAPI')
    
    window.electronAPI = {
      pegawai: {
        list: (options) => ipcRenderer.invoke('pegawai:list', options),
        get: (id) => ipcRenderer.invoke('pegawai:get', id),
        getByNip: (nip) => ipcRenderer.invoke('pegawai:get-by-nip', nip),
        create: (data) => ipcRenderer.invoke('pegawai:create', data),
        update: (id, data) => ipcRenderer.invoke('pegawai:update', { id, data }),
        delete: (id) => ipcRenderer.invoke('pegawai:delete', id),
        search: (query) => ipcRenderer.invoke('pegawai:search', query),
        importCsv: (csvData) => ipcRenderer.invoke('pegawai:import-csv', csvData),
        exportCsv: () => ipcRenderer.invoke('pegawai:export-csv')
      },
      satker: {
        list: (options) => ipcRenderer.invoke('satker:list', options),
        get: (id) => ipcRenderer.invoke('satker:get', id),
        create: (data) => ipcRenderer.invoke('satker:create', data),
        update: (id, data) => ipcRenderer.invoke('satker:update', { id, data }),
        delete: (id) => ipcRenderer.invoke('satker:delete', id)
      },
      dipa: {
        list: (options) => ipcRenderer.invoke('dipa:list', options),
        get: (id) => ipcRenderer.invoke('dipa:get', id),
        getSummary: (tahun) => ipcRenderer.invoke('dipa:get-summary', tahun),
        create: (data) => ipcRenderer.invoke('dipa:create', data),
        update: (id, data) => ipcRenderer.invoke('dipa:update', { id, data }),
        delete: (id) => ipcRenderer.invoke('dipa:delete', id),
        importCsv: (csvData) => ipcRenderer.invoke('dipa:import-csv', csvData),
        exportCsv: (filters) => ipcRenderer.invoke('dipa:export-csv', filters)
      }
    }
    
    console.log('✅ Fallback electronAPI created with APIs:', Object.keys(window.electronAPI))
  } catch (err) {
    console.error('❌ Failed to create fallback API:', err.message)
    console.error('This typically means contextIsolation is enabled in production.')
  }
}

const appVersion = ref('1.0.0')
const currentView = ref('dashboard')
const loading = ref(false)
const submitting = ref(false)
const requests = ref([])

const tier1Form = ref({
  item_name: '',
  description: '',
  budget_item_ids: [],
  unit_name: '',
  unit_responsible_nip: '',
  tier: 'tier1',
  requester_id: 'admin-id', // TODO: Get from auth
  status: 'draft'
})
const tier1Units = ref(['Tata Usaha', 'Akademik', 'Laboratorium', 'Perpustakaan'])
const tier1DipaSearch = ref('')

// Master data states
const satkerForm = ref({
  kode_satker: '',
  nama: '',
  npwp: '',
  kota: '',
  alamat: '',
  kpa_nip: '',
  ppk_nip: '',
  ppspm_nip: '',
  bendahara_nip: ''
})
const satkerList = ref([])
const satkerSaved = ref(false)
const editingSatkerId = ref(null)
const availablePegawai = ref([])
const loadingSatker = ref(false)

const pegawaiForm = ref({ nama: '', nip: '', jabatan: '' })
const pegawaiList = ref([])
const pegawaiTab = ref('manual')
const csvFileInput = ref(null)
const csvPreviewData = ref([])
const csvErrors = ref([])

const dipaForm = ref({ 
  tahun_anggaran: new Date().getFullYear(), 
  nomor_dipa: '', 
  tanggal_dipa: '',
  kode_program: '',
  kode_kegiatan: '',
  kode_output: '',
  kode_akun: '',
  uraian_item: '',
  total: 0
})
const dipaList = ref([])
const dipaTab = ref('manual')
const dipaCsvInput = ref(null)
const dipaCsvPreview = ref([])
const dipaCsvErrors = ref([])
const dipaItems = ref([])
const selectedDipaForImport = ref(null)
const loadingDipa = ref(false)

// Computed
const stats = computed(() => {
  return {
    total: requests.value.length,
    pending: requests.value.filter(r => r.status === 'pending').length,
    completed: requests.value.filter(r => r.status === 'completed').length
  }
})

const tier1BudgetTotal = computed(() => {
  const selected = new Set(tier1Form.value.budget_item_ids || [])
  return dipaItems.value
    .filter(item => selected.has(item.id))
    .reduce((sum, item) => sum + (Number(item.total) || 0), 0)
})

const filteredDipaItems = computed(() => {
  const query = tier1DipaSearch.value.trim().toLowerCase()
  if (!query) return dipaItems.value
  return dipaItems.value.filter(item => {
    const kode = String(item.kode_akun || '').toLowerCase()
    const uraian = String(item.uraian_item || '').toLowerCase()
    return kode.includes(query) || uraian.includes(query)
  })
})

// Methods
async function loadRequests() {
  loading.value = true
  try {
    const stored = localStorage.getItem('ppk-requests')
    requests.value = stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load requests:', error)
  } finally {
    loading.value = false
  }
}

async function submitTier1() {
  submitting.value = true
  try {
    const payload = {
      id: `req-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...tier1Form.value,
      budget_total: tier1BudgetTotal.value
    }

    const updated = [payload, ...(requests.value || [])]
    requests.value = updated
    localStorage.setItem('ppk-requests', JSON.stringify(updated))

    resetTier1Form()
    alert('✅ Request berhasil disimpan')
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
    budget_item_ids: [],
    unit_name: '',
    unit_responsible_nip: '',
    tier: 'tier1',
    requester_id: 'admin-id',
    status: 'draft'
  }
  tier1DipaSearch.value = ''
}

function addTier1Unit() {
  const name = tier1Form.value.unit_name?.trim()
  if (!name) return
  if (!tier1Units.value.includes(name)) {
    tier1Units.value.push(name)
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

function normalizeHeader(value) {
  return String(value || '').trim().toUpperCase()
}

function parseCsv(text) {
  const rows = []
  const cleaned = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i]
    const next = cleaned[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n' && !inQuotes) {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const trimmed = rows.filter(r => r.some(v => String(v || '').trim() !== ''))
  const header = trimmed.shift() || []
  return { header, rows: trimmed }
}

// Tier 3 handlers
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

function handleCsvFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const { header, rows } = parseCsv(reader.result)
    const headerMap = header.map(normalizeHeader)
    const required = ['NIP', 'NAMA', 'JABATAN']
    const missing = required.filter(h => !headerMap.includes(h))

    csvErrors.value = []
    csvPreviewData.value = []

    if (missing.length > 0) {
      csvErrors.value = [{ row: 1, message: `Header CSV wajib: ${required.join(', ')}` }]
      return
    }

    const nipIdx = headerMap.indexOf('NIP')
    const namaIdx = headerMap.indexOf('NAMA')
    const jabatanIdx = headerMap.indexOf('JABATAN')

    rows.forEach((row, index) => {
      const nip = String(row[nipIdx] || '').trim()
      const nama = String(row[namaIdx] || '').trim()
      const jabatan = String(row[jabatanIdx] || '').trim()
      const valid = Boolean(nip && nama)

      if (!valid) {
        csvErrors.value.push({ row: index + 2, message: 'NIP dan Nama wajib diisi.' })
      }

      csvPreviewData.value.push({ nip, nama, jabatan, valid })
    })
  }

  reader.readAsText(file)
}

async function importCsvData() {
  try {
    // Prepare data for import
    const dataToImport = csvPreviewData.value.filter(row => row.valid)
    
    if (dataToImport.length === 0) {
      alert('Tidak ada data valid untuk diimpor')
      return
    }
    
    if (!window.electronAPI?.pegawai?.importCsv) {
      alert('❌ Pegawai API tidak tersedia')
      return
    }
    
    // Show loading
    const importBtn = document.querySelector('[data-action="import-csv"]')
    if (importBtn) importBtn.disabled = true
    
    console.log('📤 Importing', dataToImport.length, 'pegawai records...')
    
    // Call IPC to import data
    const result = await window.electronAPI.pegawai.importCsv(dataToImport)
    
    console.log('Import result:', result)
    
    if (result.success) {
      alert(`✅ Berhasil! ${result.imported} pegawai diimpor, ${result.skipped} dilewati`)
      
      // Refresh the list from database
      await loadAvailablePegawai()
      
      // Reset form
      resetCsvImport()
    } else {
      alert(`❌ Gagal: ${result.error}`)
    }
  } catch (err) {
    console.error('CSV import error:', err)
    alert(`❌ Error: ${err.message}`)
  } finally {
    const importBtn = document.querySelector('[data-action="import-csv"]')
    if (importBtn) importBtn.disabled = false
  }
}

function resetCsvImport() {
  csvPreviewData.value = []
  csvErrors.value = []
  if (csvFileInput.value) {
    csvFileInput.value.value = ''
  }
}

function handleDipaCsvFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const { header, rows } = parseCsv(reader.result)
    const headerMap = header.map(normalizeHeader)
    const required = [
      'KDSATKER', 'KODE_PROGRAM', 'KODE_KEGIATAN', 'KODE_OUTPUT', 'KDIB',
      'VOLUME_OUTPUT', 'KODE_SUBOUTPUT', 'VOLUME_SUBOUTPUT', 'KODE_KOMPONEN',
      'KODE_SUBKOMPONEN', 'URAIAN_SUBKOMPONEN', 'KODE_AKUN', 'KODE_JENIS_BEBAN',
      'KODE_CARA_TARIK', 'KODE_JENIS_BANTUAN', 'KODE_REGISTER', 'HEADER1',
      'HEADER2', 'KODE_ITEM', 'NOMOR_ITEM', 'CONS_ITEM', 'URAIAN_ITEM',
      'SUMBER_DANA', 'VOL_KEG_1', 'SAT_KEG_1', 'VOL_KEG_2', 'SAT_KEG_2',
      'VOL_KEG_3', 'SAT_KEG_3', 'VOL_KEG_4', 'SAT_KEG_4', 'VOLKEG',
      'SATKEG', 'HARGASAT', 'TOTAL', 'KODE_BLOKIR', 'NILAI_BLOKIR',
      'KODE_STS_HISTORY', 'POK_NILAI_1', 'POK_NILAI_2', 'POK_NILAI_3',
      'POK_NILAI_4', 'POK_NILAI_5', 'POK_NILAI_6', 'POK_NILAI_7',
      'POK_NILAI_8', 'POK_NILAI_9', 'POK_NILAI_10', 'POK_NILAI_11', 'POK_NILAI_12'
    ]

    dipaCsvErrors.value = []
    dipaCsvPreview.value = []

    const missing = required.filter(h => !headerMap.includes(h))
    if (missing.length > 0) {
      dipaCsvErrors.value = [{ row: 1, message: `Header CSV tidak lengkap. Wajib: ${required.join(', ')}` }]
      return
    }

    const fieldIdx = required.reduce((acc, key) => {
      acc[key] = headerMap.indexOf(key)
      return acc
    }, {})

    rows.forEach((row, index) => {
      const item = required.reduce((acc, key) => {
        acc[key] = String(row[fieldIdx[key]] || '').trim()
        return acc
      }, {})

      const valid = Boolean(
        item.KDSATKER && item.KODE_PROGRAM && item.KODE_KEGIATAN && item.KODE_OUTPUT &&
        item.KODE_SUBOUTPUT && item.KODE_KOMPONEN && item.KODE_SUBKOMPONEN &&
        item.KODE_AKUN && item.URAIAN_ITEM && item.TOTAL
      )

      if (!valid) {
        dipaCsvErrors.value.push({ row: index + 2, message: 'Kolom wajib belum lengkap.' })
      }

      dipaCsvPreview.value.push({ ...item, valid })
    })
  }

  reader.readAsText(file)
}

async function importDipaCsvData() {
  try {
    // Prepare data for import
    const dataToImport = dipaCsvPreview.value.filter(row => row.valid)
    
    if (dataToImport.length === 0) {
      alert('Tidak ada data DIPA valid untuk diimpor')
      return
    }
    
    if (!window.electronAPI?.dipa?.importCsv) {
      alert('❌ DIPA API tidak tersedia')
      return
    }
    
    // Show loading
    const importBtn = document.querySelector('[data-action="import-dipa-csv"]')
    if (importBtn) importBtn.disabled = true
    
    console.log('📤 Importing', dataToImport.length, 'DIPA records...')

    const normalizedData = dataToImport.map(row => ({
      kdsatker: row.KDSATKER || null,
      kode_program: row.KODE_PROGRAM || null,
      kode_kegiatan: row.KODE_KEGIATAN || null,
      kode_output: row.KODE_OUTPUT || null,
      kode_suboutput: row.KODE_SUBOUTPUT || null,
      kode_komponen: row.KODE_KOMPONEN || null,
      kode_subkomponen: row.KODE_SUBKOMPONEN || null,
      kode_akun: row.KODE_AKUN || null,
      uraian_item: row.URAIAN_ITEM || null,
      volume: row.VOLKEG || row.VOL_KEG_1 || null,
      satuan: row.SATKEG || row.SAT_KEG_1 || null,
      harga_satuan: row.HARGASAT || null,
      total: row.TOTAL || null
    }))
    
    // Call IPC to import data
    const result = await window.electronAPI.dipa.importCsv(normalizedData)
    
    console.log('DIPA import result:', result)
    
    if (result.success) {
      alert(`✅ Berhasil! ${result.imported} DIPA diimpor, ${result.skipped} dilewati`)
      
      // Refresh the list from database
      await loadDipaList()
      
      // Load items from the imported revision
      if (result.data?.revisi_id) {
        await loadDipaItems(result.data.revisi_id)
      }
      
      // Reset form
      resetDipaCsvImport()
    } else {
      alert(`❌ Gagal: ${result.error}`)
    }
  } catch (err) {
    console.error('DIPA CSV import error:', err)
    alert(`❌ Error: ${err.message}`)
  } finally {
    const importBtn = document.querySelector('[data-action="import-dipa-csv"]')
    if (importBtn) importBtn.disabled = false
  }
}

function resetDipaCsvImport() {
  dipaCsvPreview.value = []
  dipaCsvErrors.value = []
  if (dipaCsvInput.value) {
    dipaCsvInput.value.value = ''
  }
}

// Master Data handlers
// Satker Management Functions
async function loadAvailablePegawai() {
  try {
    console.log('=== loadAvailablePegawai START ===')
    console.log('Loading pegawai list...')
    console.log('electronAPI:', typeof window.electronAPI)
    console.log('electronAPI.pegawai:', typeof window.electronAPI?.pegawai)
    console.log('electronAPI.pegawai.list:', typeof window.electronAPI?.pegawai?.list)
    
    if (!window.electronAPI?.pegawai?.list) {
      const error = 'Pegawai API not available'
      console.error(error)
      alert(error)
      return
    }
    
    console.log('Calling pegawai.list({ limit: 1000 })...')
    const result = await window.electronAPI.pegawai.list({ limit: 1000 })
    console.log('Pegawai API response:', result)
    
    if (result.success) {
      availablePegawai.value = result.data || []
      pegawaiList.value = result.data || []  // Sync with table list
      console.log('✅ Loaded pegawai:', availablePegawai.value.length, 'records')
      if (availablePegawai.value.length > 0) {
        console.log('Sample pegawai:', availablePegawai.value.slice(0, 3))
      } else {
        console.warn('⚠️ No pegawai data returned from API')
      }
    } else {
      console.error('❌ Failed to load pegawai:', result.error)
      alert('Failed to load pegawai: ' + result.error)
    }
    console.log('=== loadAvailablePegawai END ===')
  } catch (error) {
    console.error('💥 Exception in loadAvailablePegawai:', error)
    alert('Error loading pegawai: ' + error.message)
  }
}

async function loadSatkerList() {
  loadingSatker.value = true
  try {
    if (availablePegawai.value.length === 0) {
      await loadAvailablePegawai()
    }

    const pegawaiMap = new Map(
      (availablePegawai.value || []).map(p => [p.nip, p.nama])
    )

    const result = await window.electronAPI.satker.list({ limit: 100 })
    if (result.success) {
      satkerList.value = (result.data || []).map(satker => ({
        ...satker,
        kpa_nama: satker.kpa_nama || pegawaiMap.get(satker.kpa_nip) || null,
        ppk_nama: satker.ppk_nama || pegawaiMap.get(satker.ppk_nip) || null,
        ppspm_nama: satker.ppspm_nama || pegawaiMap.get(satker.ppspm_nip) || null,
        bendahara_nama: satker.bendahara_nama || pegawaiMap.get(satker.bendahara_nip) || null
      }))
    }
  } catch (error) {
    console.error('Failed to load satker:', error)
    satkerList.value = []
  } finally {
    loadingSatker.value = false
  }
}

async function saveSatker() {
  try {
    console.log('Saving satker with form data:', satkerForm.value)
    
    const data = {
      kode_satker: satkerForm.value.kode_satker.trim(),
      nama: satkerForm.value.nama.trim(),
      npwp: satkerForm.value.npwp?.trim() || null,
      alamat: satkerForm.value.alamat?.trim() || null,
      kota: satkerForm.value.kota?.trim() || null,
      kpa_nip: satkerForm.value.kpa_nip || null,
      ppk_nip: satkerForm.value.ppk_nip || null,
      ppspm_nip: satkerForm.value.ppspm_nip || null,
      bendahara_nip: satkerForm.value.bendahara_nip || null
    }

    console.log('Prepared data to send:', data)

    let result
    if (editingSatkerId.value) {
      console.log('Updating satker:', editingSatkerId.value)
      result = await window.electronAPI.satker.update(editingSatkerId.value, data)
    } else {
      console.log('Creating new satker')
      result = await window.electronAPI.satker.create(data)
    }

    console.log('API Response:', result)

    if (result.success) {
      satkerSaved.value = true
      setTimeout(() => satkerSaved.value = false, 3000)
      resetSatkerForm()
      await loadSatkerList()
    } else {
      console.error('API returned error:', result.error)
      alert('Error: ' + result.error)
    }
  } catch (error) {
    console.error('Error saving satker:', error)
    alert('Gagal menyimpan satker: ' + error.message)
  }
}

function editSatker(satker) {
  editingSatkerId.value = satker.id
  satkerForm.value = {
    kode_satker: satker.kode_satker,
    nama: satker.nama,
    npwp: satker.npwp || '',
    alamat: satker.alamat || '',
    kota: satker.kota || '',
    kpa_nip: satker.kpa_nip || '',
    ppk_nip: satker.ppk_nip || '',
    ppspm_nip: satker.ppspm_nip || '',
    bendahara_nip: satker.bendahara_nip || ''
  }
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEditSatker() {
  editingSatkerId.value = null
  resetSatkerForm()
}

function resetSatkerForm() {
  satkerForm.value = {
    kode_satker: '',
    nama: '',
    npwp: '',
    kota: '',
    alamat: '',
    kpa_nip: '',
    ppk_nip: '',
    ppspm_nip: '',
    bendahara_nip: ''
  }
  editingSatkerId.value = null
}

async function deleteSatker(id) {
  if (confirm('Apakah Anda yakin ingin menghapus satker ini?')) {
    try {
      const result = await window.electronAPI.satker.delete(id)
      if (result.success) {
        await loadSatkerList()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting satker:', error)
      alert('Gagal menghapus satker: ' + error.message)
    }
  }
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

// DIPA Management Functions
async function loadDipaList() {
  loadingDipa.value = true
  try {
    // Check if electronAPI is available
    if (!window.electronAPI?.dipa?.list) {
      console.error('❌ DIPA API not available')
      console.warn('⚠️ window.electronAPI:', typeof window.electronAPI)
      console.warn('⚠️ window.electronAPI.dipa:', typeof window.electronAPI?.dipa)
      
      // Show error to user
      alert('❌ ERROR: DIPA API tidak tersedia.\n\nPreload script tidak terload.\n\nSolusi: Restart aplikasi atau gunakan production build.')
      dipaList.value = []
      return
    }
    
    const result = await window.electronAPI.dipa.list({ 
      limit: 100,
      tahun_anggaran: new Date().getFullYear()
    })
    if (result.success) {
      dipaList.value = result.data || []
      console.log('✅ Loaded', dipaList.value.length, 'DIPA records')
    }
  } catch (error) {
    console.error('Failed to load DIPA:', error)
    dipaList.value = []
  } finally {
    loadingDipa.value = false
  }
}

async function loadDipaItems(revisiId = null) {
  try {
    if (!window.electronAPI?.dipa?.itemsList) {
      console.error('❌ DIPA items API not available')
      return
    }
    
    // If no revisiId specified, try to get from active revision
    if (!revisiId && dipaList.value.length > 0) {
      // Get first DIPA and its active revision
      const firstDipa = dipaList.value[0]
      const revisions = await window.electronAPI.dipa.revisiList(firstDipa.id)
      if (revisions.success && revisions.data.length > 0) {
        const activeRevision = revisions.data.find(r => r.is_active) || revisions.data[0]
        revisiId = activeRevision.id
      }
    }
    
    if (!revisiId) {
      console.warn('⚠️ No revisi ID available to load items')
      dipaItems.value = []
      return
    }
    
    console.log('📥 Loading DIPA items for revisi:', revisiId)
    const result = await window.electronAPI.dipa.itemsList({ revisiId })
    
    if (result.success) {
      dipaItems.value = result.data || []
      console.log('✅ Loaded', dipaItems.value.length, 'DIPA items')
    } else {
      console.error('❌ Failed to load DIPA items:', result.error)
      dipaItems.value = []
    }
  } catch (error) {
    console.error('Failed to load DIPA items:', error)
    dipaItems.value = []
  }
}

async function addDipa() {
  try {
    const data = {
      tahun_anggaran: dipaForm.value.tahun_anggaran,
      nomor_dipa: dipaForm.value.nomor_dipa?.trim() || null,
      tanggal_dipa: dipaForm.value.tanggal_dipa || null,
      kode_program: dipaForm.value.kode_program?.trim() || null,
      kode_kegiatan: dipaForm.value.kode_kegiatan?.trim() || null,
      kode_output: dipaForm.value.kode_output?.trim() || null,
      kode_akun: dipaForm.value.kode_akun?.trim() || null,
      uraian_item: dipaForm.value.uraian_item?.trim() || null,
      total: dipaForm.value.total || 0
    }

    const result = await window.electronAPI.dipa.create(data)
    if (result.success) {
      dipaForm.value = {
        tahun_anggaran: new Date().getFullYear(),
        nomor_dipa: '',
        tanggal_dipa: '',
        kode_program: '',
        kode_kegiatan: '',
        kode_output: '',
        kode_akun: '',
        uraian_item: '',
        total: 0
      }
      await loadDipaList()
    } else {
      alert('Error: ' + result.error)
    }
  } catch (error) {
    console.error('Error adding DIPA:', error)
    alert('Gagal menambah DIPA: ' + error.message)
  }
}

async function deleteDipa(id) {
  if (confirm('Hapus DIPA ini?')) {
    try {
      const result = await window.electronAPI.dipa.delete(id)
      if (result.success) {
        await loadDipaList()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting DIPA:', error)
      alert('Gagal menghapus DIPA: ' + error.message)
    }
  }
}

async function cleanupDipaItems() {
  try {
    if (!window.electronAPI?.dipa?.cleanupItems) {
      alert('❌ Fitur bersih item belum tersedia')
      return
    }

    const revisiId = dipaItems.value[0]?.revisi_id || null
    const result = await window.electronAPI.dipa.cleanupItems({ revisiId })

    if (result.success) {
      await loadDipaItems(revisiId)
      alert(`✅ ${result.removed} item kosong dihapus`) 
    } else {
      alert(`❌ Gagal: ${result.error}`)
    }
  } catch (error) {
    console.error('Error cleaning DIPA items:', error)
    alert('Gagal menghapus item kosong')
  }
}

function openDipaDetail(dipaId) {
  console.log('Opening DIPA detail:', dipaId)
  // Find the DIPA from the list
  const dipa = dipaList.value.find(d => d.id === dipaId)
  if (dipa) {
    selectedDipaForImport.value = dipa
    // Scroll to import section
    setTimeout(() => {
      const section = document.querySelector('[data-section="import-dipa-csv"]')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }
}

// Debug handler
function showDebug() {
  if (window.__DEBUG_PANEL) {
    window.__DEBUG_PANEL.show()
  } else {
    console.log('Debug panel not initialized yet. Try again in a moment.')
  }
}

// Lifecycle
onMounted(async () => {
  console.log('=== APP MOUNTED ===')
  
  // Try to initialize electronAPI first
  initializeElectronAPI()
  
  console.log('window.electronAPI:', typeof window.electronAPI)
  
  if (!window.electronAPI) {
    alert('❌ CRITICAL: window.electronAPI is undefined! Preload script did not load.')
    console.error('electronAPI is undefined - preload script failed to load')
    return
  }
  
  console.log('electronAPI keys:', Object.keys(window.electronAPI))
  console.log('electronAPI.pegawai:', typeof window.electronAPI.pegawai)
  
  if (!window.electronAPI.pegawai) {
    alert('❌ CRITICAL: window.electronAPI.pegawai is undefined!')
    console.error('pegawai API is undefined in electronAPI')
  }

  // Load requests
  try {
    await loadRequests()
  } catch (error) {
    console.error('Failed to load requests:', error)
  }

  // Load master data for satker officials
  try {
    console.log('onMounted: Loading pegawai data...')
    await loadAvailablePegawai()
    console.log('onMounted: Pegawai loaded, count:', availablePegawai.value.length)
  } catch (error) {
    console.error('Failed to load pegawai:', error)
  }
  
  try {
    await loadSatkerList()
  } catch (error) {
    console.error('Failed to load satker:', error)
  }
  
  try {
    await loadDipaList()
  } catch (error) {
    console.error('Failed to load dipa:', error)
  }
})


// Watch currentView to reload pegawai when Satker view is opened
watch(currentView, async (newView, oldView) => {
  console.log('View changed:', oldView, '->', newView)
  
  if (newView === 'master-satker') {
    console.log('Satker view opened! Current pegawai count:', availablePegawai.value.length)
    if (availablePegawai.value.length === 0) {
      console.log('No pegawai loaded, loading now...')
      await loadAvailablePegawai()
    } else {
      console.log('Pegawai already loaded:', availablePegawai.value.length, 'records')
    }
  }
  
  if (newView === 'master-dipa') {
    console.log('DIPA view opened! Current items count:', dipaItems.value.length)
    if (dipaItems.value.length === 0) {
      console.log('No DIPA items loaded, loading now...')
      await loadDipaItems()
    } else {
      console.log('DIPA items already loaded:', dipaItems.value.length, 'items')
    }
  }

  if (newView === 'tier1') {
    if (availablePegawai.value.length === 0) {
      await loadAvailablePegawai()
    }
    if (dipaItems.value.length === 0) {
      await loadDipaItems()
    }
  }
})
</script>

<style scoped>
.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
}

.quick-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.quick-action-card.lp-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.quick-action-card.st-card:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

.quick-action-card.tier-card:hover {
  border-color: #f59e0b;
  background: #fffbeb;
}

.quick-action-card .icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.quick-action-card .title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.quick-action-card .desc {
  font-size: 13px;
  color: #64748b;
  text-align: center;
  margin: 0;
}
</style>
