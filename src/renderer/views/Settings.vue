<script setup>
import { ref } from 'vue';

const backupLoading = ref(false);
const restoreLoading = ref(false);
const lastBackup = ref(localStorage.getItem('ppk_last_backup') || null);

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Backup data
const backupData = async () => {
  backupLoading.value = true;
  try {
    const data = localStorage.getItem('ppk-mock-data');
    if (!data) {
      alert('Tidak ada data untuk di-backup');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    link.download = `ppk-asisten-backup-${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Save last backup time
    localStorage.setItem('ppk_last_backup', now.toISOString());
    lastBackup.value = now.toISOString();

    alert('Backup berhasil! File telah diunduh.');
  } catch (err) {
    console.error('Backup error:', err);
    alert('Gagal melakukan backup: ' + err.message);
  } finally {
    backupLoading.value = false;
  }
};

// Restore data
const restoreData = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    restoreLoading.value = true;
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Format file tidak valid');
      }

      // Confirm restore
      if (!confirm('Restore akan menggantikan semua data yang ada. Lanjutkan?')) {
        restoreLoading.value = false;
        return;
      }

      // Save to localStorage
      localStorage.setItem('ppk-mock-data', JSON.stringify(data));

      alert('Restore berhasil! Halaman akan di-refresh.');
      window.location.reload();
    } catch (err) {
      console.error('Restore error:', err);
      alert('Gagal melakukan restore: ' + err.message);
    } finally {
      restoreLoading.value = false;
    }
  };

  input.click();
};

// Clear all data
const clearAllData = () => {
  if (!confirm('Hapus semua data? Tindakan ini tidak dapat dibatalkan!')) {
    return;
  }
  if (!confirm('Apakah Anda yakin? Semua data pegawai, DIPA, dan pengaturan akan dihapus.')) {
    return;
  }

  localStorage.removeItem('ppk-mock-data');
  localStorage.removeItem('ppk_last_backup');
  alert('Semua data telah dihapus. Halaman akan di-refresh.');
  window.location.reload();
};
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Pengaturan</h1>
    
    <!-- Backup & Restore Section -->
    <div class="bg-white rounded-lg shadow mb-6">
      <div class="p-6 border-b">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
          </svg>
          Backup & Restore Data
        </h2>
        <p class="text-sm text-gray-500 mt-1">Backup dan restore data aplikasi untuk mencegah kehilangan data</p>
      </div>
      
      <div class="p-6 space-y-6">
        <!-- Backup -->
        <div class="flex items-start justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <h3 class="font-medium text-gray-800">Backup Data</h3>
            <p class="text-sm text-gray-600 mt-1">Unduh semua data aplikasi dalam format JSON</p>
            <p v-if="lastBackup" class="text-xs text-gray-500 mt-2">
              Backup terakhir: {{ formatDate(lastBackup) }}
            </p>
          </div>
          <button
            @click="backupData"
            :disabled="backupLoading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <svg v-if="!backupLoading" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ backupLoading ? 'Memproses...' : 'Backup Sekarang' }}
          </button>
        </div>

        <!-- Restore -->
        <div class="flex items-start justify-between p-4 bg-green-50 rounded-lg">
          <div>
            <h3 class="font-medium text-gray-800">Restore Data</h3>
            <p class="text-sm text-gray-600 mt-1">Pulihkan data dari file backup JSON</p>
            <p class="text-xs text-yellow-600 mt-2">⚠️ Data yang ada akan digantikan</p>
          </div>
          <button
            @click="restoreData"
            :disabled="restoreLoading"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            <svg v-if="!restoreLoading" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ restoreLoading ? 'Memproses...' : 'Restore dari File' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Data Management Section -->
    <div class="bg-white rounded-lg shadow mb-6">
      <div class="p-6 border-b">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <svg class="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Manajemen Data
        </h2>
        <p class="text-sm text-gray-500 mt-1">Kelola data aplikasi</p>
      </div>
      
      <div class="p-6">
        <div class="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div>
            <h3 class="font-medium text-red-800">Hapus Semua Data</h3>
            <p class="text-sm text-red-600 mt-1">Menghapus semua data pegawai, DIPA, satker, dan pengaturan</p>
            <p class="text-xs text-red-500 mt-2">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
          </div>
          <button
            @click="clearAllData"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Hapus Semua
          </button>
        </div>
      </div>
    </div>

    <!-- App Info Section -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Informasi Aplikasi
        </h2>
      </div>
      
      <div class="p-6">
        <dl class="grid grid-cols-2 gap-4">
          <div>
            <dt class="text-sm text-gray-500">Nama Aplikasi</dt>
            <dd class="font-medium text-gray-800">PPK Asisten</dd>
          </div>
          <div>
            <dt class="text-sm text-gray-500">Versi</dt>
            <dd class="font-medium text-gray-800">1.0.0</dd>
          </div>
          <div>
            <dt class="text-sm text-gray-500">Mode</dt>
            <dd class="font-medium text-gray-800">{{ typeof window.electronAPI !== 'undefined' ? 'Electron' : 'Browser (Mock)' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-gray-500">Storage</dt>
            <dd class="font-medium text-gray-800">LocalStorage</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
