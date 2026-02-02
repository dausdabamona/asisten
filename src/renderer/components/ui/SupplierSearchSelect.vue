<script setup>
/**
 * SupplierSearchSelect Component
 * Autocomplete component for searching and selecting suppliers
 * Used in transaction forms (contracts, payments, etc.)
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useSupplierStore } from '../../stores/supplierStore';

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  label: {
    type: String,
    default: 'Supplier'
  },
  placeholder: {
    type: String,
    default: 'Ketik nama, NPWP, atau NIK...'
  },
  jenis: {
    type: String,
    default: null, // null = all, 'BADAN_USAHA', 'PERORANGAN', 'NARASUMBER'
    validator: (val) => [null, 'BADAN_USAHA', 'PERORANGAN', 'NARASUMBER'].includes(val)
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'select']);

const supplierStore = useSupplierStore();

// Local state
const searchQuery = ref('');
const isOpen = ref(false);
const loading = ref(false);
const searchResults = ref([]);
const selectedSupplier = ref(null);
const highlightedIndex = ref(-1);
const containerRef = ref(null);
const inputRef = ref(null);

// Debounce timer
let searchTimeout = null;

// Computed
const displayValue = computed(() => {
  if (selectedSupplier.value) {
    return selectedSupplier.value.nama;
  }
  return searchQuery.value;
});

const hasSelection = computed(() => !!selectedSupplier.value);

// Methods
const search = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }

  loading.value = true;
  try {
    const results = await supplierStore.searchSupplier(searchQuery.value, props.jenis);
    searchResults.value = results;
    highlightedIndex.value = -1;
  } catch (error) {
    console.error('Search error:', error);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

const handleInput = (e) => {
  searchQuery.value = e.target.value;
  selectedSupplier.value = null;
  emit('update:modelValue', null);
  isOpen.value = true;

  // Debounce search
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(search, 300);
};

const selectSupplier = (supplier) => {
  selectedSupplier.value = supplier;
  searchQuery.value = supplier.nama;
  emit('update:modelValue', supplier.id);
  emit('select', supplier);
  isOpen.value = false;
  searchResults.value = [];
};

const clearSelection = () => {
  selectedSupplier.value = null;
  searchQuery.value = '';
  emit('update:modelValue', null);
  emit('select', null);
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

const handleFocus = () => {
  if (!hasSelection.value && searchQuery.value.length >= 2) {
    isOpen.value = true;
    search();
  }
};

const handleBlur = (e) => {
  // Delay closing to allow click on result
  setTimeout(() => {
    if (!containerRef.value?.contains(document.activeElement)) {
      isOpen.value = false;
    }
  }, 200);
};

const handleKeydown = (e) => {
  if (!isOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      isOpen.value = true;
      if (searchQuery.value.length >= 2) {
        search();
      }
    }
    return;
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        searchResults.value.length - 1
      );
      break;
    case 'ArrowUp':
      e.preventDefault();
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
      break;
    case 'Enter':
      e.preventDefault();
      if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
        selectSupplier(searchResults.value[highlightedIndex.value]);
      }
      break;
    case 'Escape':
      isOpen.value = false;
      break;
  }
};

const formatNpwp = (npwp) => {
  if (!npwp) return '';
  const clean = npwp.replace(/\D/g, '');
  if (clean.length === 15) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 15)}`;
  }
  return npwp;
};

const getSupplierTypeLabel = (supplier) => {
  if (supplier.jenis === 'BADAN_USAHA') {
    return 'Badan Usaha';
  }
  if (supplier.klasifikasi_honor) {
    return 'Narasumber';
  }
  return 'Perorangan';
};

const getSupplierTypeClass = (supplier) => {
  if (supplier.jenis === 'BADAN_USAHA') {
    return 'bg-blue-100 text-blue-800';
  }
  if (supplier.klasifikasi_honor) {
    return 'bg-purple-100 text-purple-800';
  }
  return 'bg-green-100 text-green-800';
};

// Load initial supplier if modelValue is provided
const loadInitialSupplier = async () => {
  if (props.modelValue && !selectedSupplier.value) {
    try {
      const supplier = await supplierStore.fetchSupplierById(props.modelValue);
      if (supplier) {
        selectedSupplier.value = supplier;
        searchQuery.value = supplier.nama;
      }
    } catch (error) {
      console.error('Failed to load supplier:', error);
    }
  }
};

// Handle clicks outside to close dropdown
const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

// Watch for external modelValue changes
watch(() => props.modelValue, (newVal) => {
  if (newVal && (!selectedSupplier.value || selectedSupplier.value.id !== newVal)) {
    loadInitialSupplier();
  } else if (!newVal) {
    selectedSupplier.value = null;
    searchQuery.value = '';
  }
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  loadInitialSupplier();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<template>
  <div ref="containerRef" class="relative">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input Container -->
    <div class="relative">
      <input
        ref="inputRef"
        type="text"
        :value="displayValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
          hasSelection ? 'pr-10' : ''
        ]"
      />

      <!-- Clear button -->
      <button
        v-if="hasSelection && !disabled"
        type="button"
        @click.stop="clearSelection"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Loading indicator -->
      <div
        v-if="loading"
        class="absolute right-2 top-1/2 -translate-y-1/2"
      >
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-500">{{ error }}</p>

    <!-- Selected supplier info -->
    <div v-if="selectedSupplier" class="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
      <div class="flex items-center justify-between">
        <span :class="['px-2 py-0.5 text-xs font-medium rounded', getSupplierTypeClass(selectedSupplier)]">
          {{ getSupplierTypeLabel(selectedSupplier) }}
        </span>
        <span class="text-gray-500">{{ selectedSupplier.kota || '-' }}</span>
      </div>
      <div class="mt-1 font-mono text-xs text-gray-600">
        {{ selectedSupplier.jenis === 'BADAN_USAHA' ? `NPWP: ${formatNpwp(selectedSupplier.npwp)}` : `NIK: ${selectedSupplier.nik}` }}
      </div>
      <div v-if="selectedSupplier.nama_bank" class="mt-1 text-xs text-gray-500">
        {{ selectedSupplier.nama_bank }} - {{ selectedSupplier.nomor_rekening }} ({{ selectedSupplier.nama_rekening }})
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen && searchResults.length > 0"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
    >
      <button
        v-for="(supplier, index) in searchResults"
        :key="supplier.id"
        type="button"
        @click="selectSupplier(supplier)"
        @mouseenter="highlightedIndex = index"
        :class="[
          'w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0',
          highlightedIndex === index ? 'bg-blue-50' : ''
        ]"
      >
        <div class="flex items-center justify-between">
          <span class="font-medium text-gray-900">{{ supplier.nama }}</span>
          <span :class="['px-2 py-0.5 text-xs font-medium rounded', getSupplierTypeClass(supplier)]">
            {{ getSupplierTypeLabel(supplier) }}
          </span>
        </div>
        <div class="mt-1 flex items-center text-sm text-gray-500 space-x-3">
          <span class="font-mono">
            {{ supplier.jenis === 'BADAN_USAHA' ? formatNpwp(supplier.npwp) : supplier.nik }}
          </span>
          <span v-if="supplier.kota">{{ supplier.kota }}</span>
        </div>
      </button>
    </div>

    <!-- No results -->
    <div
      v-if="isOpen && !loading && searchQuery.length >= 2 && searchResults.length === 0"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500"
    >
      Tidak ada supplier ditemukan
    </div>

    <!-- Hint -->
    <div
      v-if="isOpen && searchQuery.length > 0 && searchQuery.length < 2"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500"
    >
      Ketik minimal 2 karakter untuk mencari
    </div>
  </div>
</template>
