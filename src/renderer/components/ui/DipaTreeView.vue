<script setup>
/**
 * DipaTreeView Component
 * Recursive tree component for displaying DIPA budget hierarchy
 */
import { ref, computed } from 'vue';

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 0
  },
  expandedByDefault: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select']);

const isExpanded = ref(props.expandedByDefault || props.level < 2);

const hasChildren = computed(() => {
  return props.node.children && Object.keys(props.node.children).length > 0;
});

const childrenArray = computed(() => {
  if (!props.node.children) return [];
  return Object.entries(props.node.children).map(([key, value]) => ({
    key,
    ...value
  }));
});

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const getPercentage = () => {
  const pagu = props.node.total_pagu || 0;
  const realisasi = props.node.total_realisasi || 0;
  if (pagu === 0) return 0;
  return Math.min(100, (realisasi / pagu) * 100);
};

const getTypeIcon = () => {
  switch (props.node.type) {
    case 'program': return '📁';
    case 'kegiatan': return '📋';
    case 'output': return '📦';
    case 'komponen': return '🔧';
    case 'subkomponen': return '📝';
    case 'akun': return '💰';
    default: return '📄';
  }
};

const getTypeLabel = () => {
  switch (props.node.type) {
    case 'program': return 'Program';
    case 'kegiatan': return 'Kegiatan';
    case 'output': return 'Output';
    case 'komponen': return 'Komponen';
    case 'subkomponen': return 'Sub Komponen';
    case 'akun': return 'Akun/MAK';
    default: return '';
  }
};

const toggle = () => {
  if (hasChildren.value) {
    isExpanded.value = !isExpanded.value;
  }
};

const selectNode = () => {
  emit('select', props.node);
};
</script>

<template>
  <div class="select-none">
    <!-- Node Header -->
    <div
      :class="[
        'flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer group',
        level === 0 ? 'bg-gray-50' : ''
      ]"
      :style="{ paddingLeft: `${level * 16 + 12}px` }"
      @click="toggle"
    >
      <!-- Expand/Collapse Icon -->
      <span class="w-5 h-5 flex items-center justify-center mr-1">
        <svg
          v-if="hasChildren"
          :class="['w-4 h-4 text-gray-400 transition-transform', isExpanded ? 'rotate-90' : '']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </span>

      <!-- Type Icon -->
      <span class="text-sm mr-2">{{ getTypeIcon() }}</span>

      <!-- Node Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center">
          <span class="font-mono text-sm text-gray-600 mr-2">{{ node.kode || label }}</span>
          <span v-if="node.uraian" class="text-sm text-gray-800 truncate">{{ node.uraian }}</span>
          <span v-if="node.type === 'akun'" class="ml-2 text-xs text-gray-400">({{ node.item_count || 0 }} item)</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex items-center space-x-4 text-sm">
        <!-- Progress Bar Mini -->
        <div class="w-20 hidden md:block">
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div
              class="bg-green-500 h-1.5 rounded-full transition-all"
              :style="{ width: `${getPercentage()}%` }"
            ></div>
          </div>
        </div>

        <!-- Pagu -->
        <div class="text-right min-w-[120px]">
          <span class="font-medium text-gray-800">{{ formatRupiah(node.total_pagu) }}</span>
        </div>

        <!-- Realisasi -->
        <div class="text-right min-w-[100px] hidden lg:block">
          <span class="text-green-600">{{ formatRupiah(node.total_realisasi) }}</span>
        </div>

        <!-- Sisa -->
        <div class="text-right min-w-[100px] hidden xl:block">
          <span class="text-blue-600">{{ formatRupiah((node.total_pagu || 0) - (node.total_realisasi || 0) - (node.total_blokir || 0)) }}</span>
        </div>

        <!-- Detail Button -->
        <button
          v-if="node.type === 'akun'"
          @click.stop="selectNode"
          class="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Detail
        </button>
      </div>
    </div>

    <!-- Children -->
    <div v-if="hasChildren && isExpanded" class="border-l border-gray-200 ml-6">
      <DipaTreeView
        v-for="child in childrenArray"
        :key="child.key"
        :node="child"
        :label="child.key"
        :level="level + 1"
        @select="(n) => emit('select', n)"
      />
    </div>
  </div>
</template>
