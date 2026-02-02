<script setup>
/**
 * LPStatusBadge Component
 * Displays status badge with color based on LP status
 */
import { computed } from 'vue';
import { LP_STATUS, LP_STATUS_LABEL, LP_STATUS_COLOR } from '../../stores/lembarPermintaanStore';

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => Object.values(LP_STATUS).includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  showIcon: {
    type: Boolean,
    default: false
  }
});

const statusLabel = computed(() => LP_STATUS_LABEL[props.status] || props.status);

const statusColor = computed(() => LP_STATUS_COLOR[props.status] || 'gray');

const badgeClasses = computed(() => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return [
    'inline-flex items-center font-medium rounded-full border',
    colorClasses[statusColor.value] || colorClasses.gray,
    sizeClasses[props.size]
  ];
});

const iconPath = computed(() => {
  const icons = {
    [LP_STATUS.DRAFT]: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    [LP_STATUS.DIAJUKAN]: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    [LP_STATUS.DISETUJUI]: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    [LP_STATUS.PROSES_PENGADAAN]: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    [LP_STATUS.KONTRAK]: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    [LP_STATUS.SERAH_TERIMA]: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    [LP_STATUS.PEMBAYARAN]: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    [LP_STATUS.SELESAI]: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    [LP_STATUS.BATAL]: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
  };
  return icons[props.status] || icons[LP_STATUS.DRAFT];
});
</script>

<template>
  <span :class="badgeClasses">
    <svg
      v-if="showIcon"
      class="w-4 h-4 mr-1.5 -ml-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        :d="iconPath"
      />
    </svg>
    {{ statusLabel }}
  </span>
</template>
