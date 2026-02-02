<script setup>
/**
 * LPTimeline Component
 * Timeline display for LP activity logs
 */
import { computed } from 'vue';
import { LP_STATUS_LABEL } from '../../stores/lembarPermintaanStore';

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  maxItems: {
    type: Number,
    default: 0 // 0 = show all
  }
});

// Sort logs by date descending (newest first)
const sortedLogs = computed(() => {
  const sorted = [...props.logs].sort((a, b) =>
    new Date(b.tanggal) - new Date(a.tanggal)
  );
  if (props.maxItems > 0) {
    return sorted.slice(0, props.maxItems);
  }
  return sorted;
});

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get relative time
const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(dateStr);
};

// Get action icon and color
const getActionStyle = (aksi) => {
  const styles = {
    'CREATE': { icon: 'M12 4v16m8-8H4', color: 'blue' },
    'UPDATE': { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'yellow' },
    'STATUS_CHANGE': { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'green' },
    'APPROVE': { icon: 'M5 13l4 4L19 7', color: 'green' },
    'REJECT': { icon: 'M6 18L18 6M6 6l12 12', color: 'red' },
    'CANCEL': { icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', color: 'red' },
    'UPLOAD': { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', color: 'purple' },
    'DELETE': { icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'red' },
    'PRINT': { icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z', color: 'gray' }
  };
  return styles[aksi] || { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'gray' };
};

const getIconClasses = (color) => {
  const classes = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600'
  };
  return classes[color] || classes.gray;
};

// Format action label
const formatAction = (log) => {
  const actionLabels = {
    'CREATE': 'Membuat lembar permintaan',
    'UPDATE': 'Memperbarui data',
    'STATUS_CHANGE': `Mengubah status ke ${LP_STATUS_LABEL[log.status_baru] || log.status_baru}`,
    'APPROVE': 'Menyetujui permintaan',
    'REJECT': 'Menolak permintaan',
    'CANCEL': 'Membatalkan permintaan',
    'UPLOAD': 'Mengunggah dokumen',
    'DELETE': 'Menghapus item',
    'PRINT': 'Mencetak dokumen'
  };
  return actionLabels[log.aksi] || log.aksi;
};
</script>

<template>
  <div class="flow-root">
    <!-- Empty state -->
    <div
      v-if="sortedLogs.length === 0"
      class="text-center py-8 text-gray-500"
    >
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="mt-2 text-sm">Belum ada riwayat aktivitas</p>
    </div>

    <!-- Timeline -->
    <ul v-else role="list" class="-mb-8">
      <li v-for="(log, index) in sortedLogs" :key="log.id">
        <div class="relative pb-8">
          <!-- Connecting line -->
          <span
            v-if="index !== sortedLogs.length - 1"
            class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />

          <div class="relative flex items-start space-x-3">
            <!-- Icon -->
            <div>
              <span
                :class="[
                  'h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white',
                  getIconClasses(getActionStyle(log.aksi).color)
                ]"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="getActionStyle(log.aksi).icon"
                  />
                </svg>
              </span>
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <div>
                <div class="text-sm">
                  <span class="font-medium text-gray-900">
                    {{ log.user_nama || 'Sistem' }}
                  </span>
                </div>
                <p class="mt-0.5 text-sm text-gray-500">
                  {{ formatAction(log) }}
                </p>
              </div>

              <!-- Status change details -->
              <div
                v-if="log.aksi === 'STATUS_CHANGE' && log.status_lama"
                class="mt-2 flex items-center text-sm"
              >
                <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                  {{ LP_STATUS_LABEL[log.status_lama] || log.status_lama }}
                </span>
                <svg class="mx-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
                <span class="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-600">
                  {{ LP_STATUS_LABEL[log.status_baru] || log.status_baru }}
                </span>
              </div>

              <!-- Keterangan -->
              <div
                v-if="log.keterangan"
                class="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3"
              >
                {{ log.keterangan }}
              </div>

              <!-- Timestamp -->
              <div class="mt-2 text-xs text-gray-400 flex items-center">
                <svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span :title="formatDate(log.tanggal) + ' ' + formatTime(log.tanggal)">
                  {{ getRelativeTime(log.tanggal) }}
                </span>
                <span class="mx-1">·</span>
                <span>{{ formatTime(log.tanggal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <!-- Show more indicator -->
    <div
      v-if="maxItems > 0 && logs.length > maxItems"
      class="text-center pt-4"
    >
      <span class="text-sm text-gray-500">
        Menampilkan {{ maxItems }} dari {{ logs.length }} aktivitas
      </span>
    </div>
  </div>
</template>
