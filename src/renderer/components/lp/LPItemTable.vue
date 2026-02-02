<script setup>
/**
 * LPItemTable Component
 * Editable table for LP items with auto-calculation
 */
import { ref, computed, watch } from 'vue';
import FormInput from '../ui/FormInput.vue';
import FormSelect from '../ui/FormSelect.vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: false
  },
  jenis: {
    type: String,
    default: 'BARANG',
    validator: (v) => ['BARANG', 'JASA', 'PJLP', 'KEGIATAN'].includes(v)
  }
});

const emit = defineEmits(['update:items', 'add', 'remove', 'update']);

// Local items for editing
const localItems = ref([...props.items]);

// Watch for external changes
watch(() => props.items, (newItems) => {
  localItems.value = [...newItems];
}, { deep: true });

// Satuan options
const satuanOptions = [
  { value: 'unit', label: 'Unit' },
  { value: 'pcs', label: 'Pcs' },
  { value: 'set', label: 'Set' },
  { value: 'buah', label: 'Buah' },
  { value: 'lembar', label: 'Lembar' },
  { value: 'rim', label: 'Rim' },
  { value: 'pak', label: 'Pak' },
  { value: 'box', label: 'Box' },
  { value: 'roll', label: 'Roll' },
  { value: 'meter', label: 'Meter' },
  { value: 'kg', label: 'Kg' },
  { value: 'liter', label: 'Liter' },
  { value: 'jam', label: 'Jam' },
  { value: 'hari', label: 'Hari' },
  { value: 'bulan', label: 'Bulan' },
  { value: 'orang', label: 'Orang' },
  { value: 'paket', label: 'Paket' },
  { value: 'kegiatan', label: 'Kegiatan' }
];

// Format number as Rupiah
const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

// Parse Rupiah string to number
const parseRupiah = (value) => {
  if (!value) return 0;
  return parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
};

// Calculate subtotal for an item
const calculateSubtotal = (item) => {
  const volume = parseFloat(item.volume) || 0;
  const hargaSatuan = parseFloat(item.harga_satuan) || 0;
  return volume * hargaSatuan;
};

// Total of all items
const grandTotal = computed(() => {
  return localItems.value.reduce((sum, item) => sum + calculateSubtotal(item), 0);
});

// Add new item
const addItem = () => {
  const newItem = {
    id: null,
    tempId: Date.now(),
    uraian: '',
    spesifikasi: '',
    volume: 1,
    satuan: 'unit',
    harga_satuan: 0,
    kode_akun: '',
    keterangan: ''
  };
  localItems.value.push(newItem);
  emitUpdate();
  emit('add', newItem);
};

// Remove item
const removeItem = (index) => {
  const removed = localItems.value.splice(index, 1)[0];
  emitUpdate();
  emit('remove', removed);
};

// Update item field
const updateItem = (index, field, value) => {
  if (localItems.value[index]) {
    localItems.value[index][field] = value;
    // Recalculate subtotal
    localItems.value[index].subtotal = calculateSubtotal(localItems.value[index]);
    emitUpdate();
    emit('update', { index, item: localItems.value[index] });
  }
};

// Handle price input (with formatting)
const handlePriceInput = (index, event) => {
  const value = parseRupiah(event.target.value);
  updateItem(index, 'harga_satuan', value);
};

// Emit updated items
const emitUpdate = () => {
  emit('update:items', [...localItems.value]);
};

// Duplicate item
const duplicateItem = (index) => {
  const original = localItems.value[index];
  const duplicate = {
    ...original,
    id: null,
    tempId: Date.now()
  };
  localItems.value.splice(index + 1, 0, duplicate);
  emitUpdate();
};

// Move item up
const moveItemUp = (index) => {
  if (index > 0) {
    const temp = localItems.value[index];
    localItems.value[index] = localItems.value[index - 1];
    localItems.value[index - 1] = temp;
    emitUpdate();
  }
};

// Move item down
const moveItemDown = (index) => {
  if (index < localItems.value.length - 1) {
    const temp = localItems.value[index];
    localItems.value[index] = localItems.value[index + 1];
    localItems.value[index + 1] = temp;
    emitUpdate();
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Table Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-800">
        Daftar Item {{ jenis === 'BARANG' ? 'Barang' : 'Jasa' }}
      </h3>
      <button
        v-if="editable"
        @click="addItem"
        type="button"
        class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Tambah Item
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="localItems.length === 0"
      class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
    >
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada item</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ editable ? 'Klik tombol "Tambah Item" untuk menambahkan item baru.' : 'Tidak ada item dalam daftar.' }}
      </p>
    </div>

    <!-- Items Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
              No
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
              Uraian
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
              Spesifikasi
            </th>
            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              Volume
            </th>
            <th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
              Satuan
            </th>
            <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
              Harga Satuan
            </th>
            <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
              Subtotal
            </th>
            <th v-if="editable" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(item, index) in localItems"
            :key="item.id || item.tempId"
            class="hover:bg-gray-50"
          >
            <!-- No -->
            <td class="px-3 py-3 text-sm text-gray-500 text-center">
              {{ index + 1 }}
            </td>

            <!-- Uraian -->
            <td class="px-3 py-3">
              <input
                v-if="editable"
                type="text"
                :value="item.uraian"
                @input="updateItem(index, 'uraian', $event.target.value)"
                placeholder="Nama item..."
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span v-else class="text-sm text-gray-900">{{ item.uraian || '-' }}</span>
            </td>

            <!-- Spesifikasi -->
            <td class="px-3 py-3">
              <input
                v-if="editable"
                type="text"
                :value="item.spesifikasi"
                @input="updateItem(index, 'spesifikasi', $event.target.value)"
                placeholder="Spesifikasi..."
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span v-else class="text-sm text-gray-500">{{ item.spesifikasi || '-' }}</span>
            </td>

            <!-- Volume -->
            <td class="px-3 py-3">
              <input
                v-if="editable"
                type="number"
                min="0"
                step="0.01"
                :value="item.volume"
                @input="updateItem(index, 'volume', parseFloat($event.target.value) || 0)"
                class="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span v-else class="text-sm text-gray-900 text-center block">{{ item.volume }}</span>
            </td>

            <!-- Satuan -->
            <td class="px-3 py-3">
              <select
                v-if="editable"
                :value="item.satuan"
                @change="updateItem(index, 'satuan', $event.target.value)"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option v-for="opt in satuanOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <span v-else class="text-sm text-gray-900 text-center block">{{ item.satuan }}</span>
            </td>

            <!-- Harga Satuan -->
            <td class="px-3 py-3">
              <input
                v-if="editable"
                type="text"
                :value="formatRupiah(item.harga_satuan).replace('Rp ', '')"
                @input="handlePriceInput(index, $event)"
                @blur="$event.target.value = formatRupiah(item.harga_satuan).replace('Rp ', '')"
                class="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span v-else class="text-sm text-gray-900 text-right block">{{ formatRupiah(item.harga_satuan) }}</span>
            </td>

            <!-- Subtotal -->
            <td class="px-3 py-3 text-right">
              <span class="text-sm font-medium text-gray-900">
                {{ formatRupiah(calculateSubtotal(item)) }}
              </span>
            </td>

            <!-- Actions -->
            <td v-if="editable" class="px-3 py-3">
              <div class="flex items-center justify-center space-x-1">
                <!-- Move up -->
                <button
                  @click="moveItemUp(index)"
                  :disabled="index === 0"
                  type="button"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Pindah ke atas"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>

                <!-- Move down -->
                <button
                  @click="moveItemDown(index)"
                  :disabled="index === localItems.length - 1"
                  type="button"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Pindah ke bawah"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                <!-- Duplicate -->
                <button
                  @click="duplicateItem(index)"
                  type="button"
                  class="p-1 text-gray-400 hover:text-blue-600"
                  title="Duplikasi"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>

                <!-- Delete -->
                <button
                  @click="removeItem(index)"
                  type="button"
                  class="p-1 text-gray-400 hover:text-red-600"
                  title="Hapus"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Footer with total -->
        <tfoot class="bg-gray-50">
          <tr>
            <td :colspan="editable ? 6 : 6" class="px-3 py-3 text-right text-sm font-semibold text-gray-700">
              Total
            </td>
            <td class="px-3 py-3 text-right">
              <span class="text-base font-bold text-blue-600">
                {{ formatRupiah(grandTotal) }}
              </span>
            </td>
            <td v-if="editable"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Item count summary -->
    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ localItems.length }} item</span>
      <span v-if="editable" class="text-xs">
        Tekan Tab untuk berpindah antar field
      </span>
    </div>
  </div>
</template>
