<script setup>
import { ref, onMounted } from 'vue';

const stats = ref({
  requests: { total_requests: 0, pending: 0, approved: 0, completed: 0, rejected: 0, total_value: 0 },
  contracts: { total_contracts: 0, active_contracts: 0, total_contract_value: 0 },
  payments: { total_payments: 0, total_paid: 0, pending_payments: 0 },
  vendors: { total_vendors: 0, active_vendors: 0, avg_rating: 0 }
});

const loading = ref(true);

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

onMounted(async () => {
  try {
    if (window.electronAPI?.db?.getDashboardStats) {
      stats.value = await window.electronAPI.db.getDashboardStats();
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p class="text-gray-500">Ringkasan aktivitas pengadaan</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Requests -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-full">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Permintaan</p>
            <p class="text-2xl font-semibold text-gray-800">{{ stats.requests.total_requests }}</p>
          </div>
        </div>
        <div class="mt-4 flex space-x-4 text-sm">
          <span class="text-yellow-600">{{ stats.requests.pending }} Pending</span>
          <span class="text-green-600">{{ stats.requests.approved }} Approved</span>
        </div>
      </div>

      <!-- Total Value -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-full">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Nilai</p>
            <p class="text-xl font-semibold text-gray-800">{{ formatRupiah(stats.requests.total_value) }}</p>
          </div>
        </div>
      </div>

      <!-- Contracts -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-full">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Kontrak Aktif</p>
            <p class="text-2xl font-semibold text-gray-800">{{ stats.contracts.active_contracts }}</p>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-500">
          Total: {{ stats.contracts.total_contracts }} kontrak
        </div>
      </div>

      <!-- Vendors -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-orange-100 rounded-full">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Vendor Aktif</p>
            <p class="text-2xl font-semibold text-gray-800">{{ stats.vendors.active_vendors }}</p>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-500">
          Rating: {{ stats.vendors.avg_rating?.toFixed(1) || '0.0' }} / 5.0
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <router-link to="/requests/create/tier1" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
          <span class="text-blue-600 font-medium">Tier 1</span>
          <span class="text-xs text-gray-500 mt-1">&lt; Rp 10 Juta</span>
        </router-link>
        <router-link to="/requests/create/tier2" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
          <span class="text-green-600 font-medium">Tier 2</span>
          <span class="text-xs text-gray-500 mt-1">Rp 10-50 Juta</span>
        </router-link>
        <router-link to="/requests/create/tier3" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
          <span class="text-purple-600 font-medium">Tier 3</span>
          <span class="text-xs text-gray-500 mt-1">&gt; Rp 50 Juta</span>
        </router-link>
        <router-link to="/reports" class="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
          <span class="text-orange-600 font-medium">Laporan</span>
          <span class="text-xs text-gray-500 mt-1">Lihat Laporan</span>
        </router-link>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Memuat data...</p>
      </div>
    </div>
  </div>
</template>
