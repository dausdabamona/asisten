<script setup>
import { ref, onMounted, computed } from 'vue';

const requests = ref([]);
const loading = ref(true);
const filter = ref({ tier: '', status: '' });

const filteredRequests = computed(() => {
  return requests.value.filter(r => {
    if (filter.value.tier && r.tier !== filter.value.tier) return false;
    if (filter.value.status && r.status !== filter.value.status) return false;
    return true;
  });
});

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-500'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getTierClass = (tier) => {
  const classes = {
    tier1: 'bg-blue-100 text-blue-800',
    tier2: 'bg-green-100 text-green-800',
    tier3: 'bg-purple-100 text-purple-800'
  };
  return classes[tier] || 'bg-gray-100 text-gray-800';
};

onMounted(async () => {
  try {
    if (window.electronAPI?.request?.getAll) {
      requests.value = await window.electronAPI.request.getAll({});
    }
  } catch (error) {
    console.error('Failed to load requests:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Daftar Permintaan Pengadaan</h1>
      <router-link
        to="/requests/create"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Buat Permintaan
      </router-link>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex space-x-4">
        <select v-model="filter.tier" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Tier</option>
          <option value="tier1">Tier 1 (&lt; Rp 10 Juta)</option>
          <option value="tier2">Tier 2 (Rp 10-50 Juta)</option>
          <option value="tier3">Tier 3 (&gt; Rp 50 Juta)</option>
        </select>
        <select v-model="filter.status" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>

    <!-- Request List -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading">
            <td colspan="7" class="px-6 py-12 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-500">Memuat data...</p>
            </td>
          </tr>
          <tr v-else-if="filteredRequests.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-gray-500">
              Tidak ada data permintaan
            </td>
          </tr>
          <tr v-for="request in filteredRequests" :key="request.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ request.request_number }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ request.item_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['px-2 py-1 text-xs rounded-full font-medium', getTierClass(request.tier)]">
                {{ request.tier?.replace('tier', 'Tier ') }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatRupiah(request.estimated_value) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['px-2 py-1 text-xs rounded-full font-medium capitalize', getStatusClass(request.status)]">
                {{ request.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(request.created_at).toLocaleDateString('id-ID') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <router-link :to="`/requests/${request.id}`" class="text-blue-600 hover:text-blue-900">
                Detail
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
