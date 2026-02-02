<script setup>
/**
 * LPStatusProgress Component
 * Visual step indicator for LP status progress
 */
import { computed } from 'vue';
import { LP_STATUS, LP_STATUS_LABEL, LP_STATUS_COLOR } from '../../stores/lembarPermintaanStore';

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => Object.values(LP_STATUS).includes(value)
  },
  compact: {
    type: Boolean,
    default: false
  }
});

// Main workflow steps (excluding BATAL)
const workflowSteps = [
  LP_STATUS.DRAFT,
  LP_STATUS.DIAJUKAN,
  LP_STATUS.DISETUJUI,
  LP_STATUS.PROSES_PENGADAAN,
  LP_STATUS.KONTRAK,
  LP_STATUS.SERAH_TERIMA,
  LP_STATUS.PEMBAYARAN,
  LP_STATUS.SELESAI
];

const currentStepIndex = computed(() => {
  if (props.status === LP_STATUS.BATAL) return -1;
  return workflowSteps.indexOf(props.status);
});

const isCancelled = computed(() => props.status === LP_STATUS.BATAL);

const getStepStatus = (index) => {
  if (isCancelled.value) return 'cancelled';
  if (index < currentStepIndex.value) return 'completed';
  if (index === currentStepIndex.value) return 'current';
  return 'upcoming';
};

const getStepClasses = (index) => {
  const status = getStepStatus(index);
  const baseClasses = 'flex items-center justify-center rounded-full font-medium transition-all';

  const sizeClasses = props.compact
    ? 'w-6 h-6 text-xs'
    : 'w-8 h-8 text-sm';

  const statusClasses = {
    completed: 'bg-green-500 text-white',
    current: 'bg-blue-600 text-white ring-4 ring-blue-100',
    upcoming: 'bg-gray-200 text-gray-500',
    cancelled: 'bg-red-100 text-red-400'
  };

  return [baseClasses, sizeClasses, statusClasses[status]];
};

const getConnectorClasses = (index) => {
  const status = getStepStatus(index);
  const baseClasses = 'flex-1 h-1 mx-1 rounded transition-all';

  if (isCancelled.value) return [baseClasses, 'bg-red-200'];

  const statusClasses = {
    completed: 'bg-green-500',
    current: 'bg-blue-300',
    upcoming: 'bg-gray-200'
  };

  return [baseClasses, statusClasses[status] || 'bg-gray-200'];
};

const getStepIcon = (index) => {
  const status = getStepStatus(index);
  if (status === 'completed') {
    return 'M5 13l4 4L19 7'; // Checkmark
  }
  if (status === 'cancelled') {
    return 'M6 18L18 6M6 6l12 12'; // X mark
  }
  return null;
};
</script>

<template>
  <div class="w-full">
    <!-- Cancelled state banner -->
    <div
      v-if="isCancelled"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
    >
      <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span class="text-red-700 font-medium">Lembar Permintaan ini telah dibatalkan</span>
    </div>

    <!-- Progress steps -->
    <div class="flex items-center">
      <template v-for="(step, index) in workflowSteps" :key="step">
        <!-- Step circle -->
        <div class="flex flex-col items-center">
          <div :class="getStepClasses(index)">
            <svg
              v-if="getStepIcon(index)"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                :d="getStepIcon(index)"
              />
            </svg>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Step label (only if not compact) -->
          <span
            v-if="!compact"
            :class="[
              'mt-2 text-xs text-center max-w-[80px]',
              getStepStatus(index) === 'current' ? 'text-blue-600 font-semibold' : 'text-gray-500'
            ]"
          >
            {{ LP_STATUS_LABEL[step] }}
          </span>
        </div>

        <!-- Connector line (except for last step) -->
        <div
          v-if="index < workflowSteps.length - 1"
          :class="getConnectorClasses(index)"
        />
      </template>
    </div>

    <!-- Compact mode: show current status label below -->
    <div v-if="compact && !isCancelled" class="mt-2 text-center">
      <span class="text-sm font-medium text-gray-700">
        {{ LP_STATUS_LABEL[status] }}
      </span>
    </div>
  </div>
</template>
