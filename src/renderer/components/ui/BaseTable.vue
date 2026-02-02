<script setup>
import { computed } from 'vue';

const props = defineProps({
  columns: {
    type: Array,
    required: true
    // Each column: { key: string, label: string, width?: string, align?: string, sortable?: boolean }
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: 'Tidak ada data'
  },
  striped: {
    type: Boolean,
    default: true
  },
  hoverable: {
    type: Boolean,
    default: true
  },
  // Pagination props
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  totalItems: {
    type: Number,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  showPagination: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['page-change', 'row-click', 'sort']);

const paginationInfo = computed(() => {
  const start = (props.currentPage - 1) * props.itemsPerPage + 1;
  const end = Math.min(props.currentPage * props.itemsPerPage, props.totalItems);
  return `Menampilkan ${start}-${end} dari ${props.totalItems} data`;
});

const pageNumbers = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, props.currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(props.totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page);
  }
};

const handleRowClick = (row, index) => {
  emit('row-click', row, index);
};

const handleSort = (column) => {
  if (column.sortable) {
    emit('sort', column.key);
  }
};

const getCellAlign = (align) => {
  switch (align) {
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    default: return 'text-left';
  }
};
</script>

<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                getCellAlign(column.align),
                column.sortable ? 'cursor-pointer hover:bg-gray-100' : '',
                column.width ? '' : ''
              ]"
              :style="column.width ? { width: column.width } : {}"
              @click="handleSort(column)"
            >
              <div class="flex items-center" :class="column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''">
                {{ column.label }}
                <svg v-if="column.sortable" class="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="mt-2 text-gray-500">Memuat data...</p>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length" class="px-6 py-12 text-center text-gray-500">
              {{ emptyText }}
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-else
            v-for="(row, rowIndex) in data"
            :key="row.id || rowIndex"
            :class="[
              striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white',
              hoverable ? 'hover:bg-blue-50 cursor-pointer' : ''
            ]"
            @click="handleRowClick(row, rowIndex)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="['px-6 py-4 whitespace-nowrap text-sm', getCellAlign(column.align)]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="rowIndex">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination && totalPages > 1" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          {{ paginationInfo }}
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &laquo;
          </button>
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lsaquo;
          </button>

          <button
            v-for="page in pageNumbers"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-1 text-sm border rounded',
              page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &rsaquo;
          </button>
          <button
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
