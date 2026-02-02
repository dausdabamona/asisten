<template>
  <div class="lp-card">
    <!-- Header -->
    <div class="lp-card-header">
      <div class="lp-info">
        <h3 class="lp-nomor">{{ lp.nomor || lp.id }}</h3>
        <p class="lp-unit">{{ lp.unit_pengajuan }}</p>
      </div>
      <div class="lp-status">
        <span :class="['status-badge', getStatusClass(lp.status)]">
          {{ getStatusLabel(lp.status) }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="lp-card-body">
      <!-- Metrics Row -->
      <div class="metrics">
        <div class="metric">
          <span class="metric-label">Nilai</span>
          <span class="metric-value">{{ formatCurrency(lp.total_nilai) }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Tier</span>
          <span :class="['metric-value', 'tier-' + lp.tier.toLowerCase()]">
            {{ lp.tier }}
          </span>
        </div>
        <div class="metric">
          <span class="metric-label">Items</span>
          <span class="metric-value">{{ lp.items_count || lp.table_items?.length || 0 }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Tanggal</span>
          <span class="metric-value">{{ formatDate(lp.tanggal_pengajuan || lp.request_date) }}</span>
        </div>
      </div>

      <!-- Description -->
      <div v-if="lp.uraian || lp.description" class="lp-description">
        <p>{{ lp.uraian || lp.description }}</p>
      </div>

      <!-- Items Preview -->
      <div v-if="lp.table_items && lp.table_items.length > 0" class="items-preview">
        <span class="preview-label">Items:</span>
        <ul class="items-list">
          <li v-for="(item, idx) in lp.table_items.slice(0, 3)" :key="idx">
            {{ item.qty }} {{ item.unit }} {{ item.description }}
          </li>
          <li v-if="lp.table_items.length > 3" class="more-items">
            +{{ lp.table_items.length - 3 }} item lainnya
          </li>
        </ul>
      </div>

      <!-- Tier Breakdown (if available) -->
      <div v-if="lp.tier_summary" class="tier-breakdown">
        <div v-if="lp.tier_summary.tier1 > 0" class="tier-item tier1">
          <span>Tier 1:</span>
          <span>{{ formatCurrency(lp.tier_summary.tier1) }}</span>
        </div>
        <div v-if="lp.tier_summary.tier2 > 0" class="tier-item tier2">
          <span>Tier 2:</span>
          <span>{{ formatCurrency(lp.tier_summary.tier2) }}</span>
        </div>
        <div v-if="lp.tier_summary.tier3 > 0" class="tier-item tier3">
          <span>Tier 3:</span>
          <span>{{ formatCurrency(lp.tier_summary.tier3) }}</span>
        </div>
      </div>
    </div>

    <!-- Footer / Actions -->
    <div class="lp-card-footer">
      <button @click="$emit('view')" class="btn btn-sm btn-primary">
        👁️ Lihat Detail
      </button>
      <button 
        v-if="lp.status === 'DRAFT'" 
        @click="$emit('edit')" 
        class="btn btn-sm btn-outline"
      >
        ✏️ Edit
      </button>
      <button 
        v-if="canSubmit" 
        @click="$emit('submit')" 
        class="btn btn-sm btn-success"
      >
        ✓ Lanjutkan
      </button>
      <button @click="$emit('delete')" class="btn btn-sm btn-danger-outline">
        🗑️ Hapus
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getStatusLabel, getStatusColor, formatCurrency, formatDate } from '../../utils/lpFormIntegration';

const props = defineProps({
  lp: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view', 'edit', 'submit', 'delete']);

const canSubmit = computed(() => {
  return props.lp.status === 'DRAFT' || props.lp.status === 'submitted';
});

const getStatusClass = (status) => {
  const colors = {
    DRAFT: 'status-draft',
    submitted: 'status-diajukan',
    DIAJUKAN: 'status-diajukan',
    DISETUJUI: 'status-disetujui',
    PROSES_PENGADAAN: 'status-proses',
    KONTRAK: 'status-kontrak',
    SERAH_TERIMA: 'status-serah',
    PEMBAYARAN: 'status-bayar',
    SELESAI: 'status-selesai',
    BATAL: 'status-batal'
  };
  return colors[status] || 'status-draft';
};
</script>

<style scoped>
.lp-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.lp-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.lp-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  background: #fafbfc;
}

.lp-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.lp-info p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

.lp-status {
  display: flex;
  gap: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-draft {
  background: #f3f4f6;
  color: #6b7280;
}

.status-diajukan {
  background: #fef3c7;
  color: #92400e;
}

.status-disetujui {
  background: #dbeafe;
  color: #1e40af;
}

.status-proses {
  background: #fed7aa;
  color: #9a3412;
}

.status-kontrak {
  background: #e9d5ff;
  color: #6b21a8;
}

.status-serah {
  background: #cffafe;
  color: #164e63;
}

.status-bayar {
  background: #fbcfe8;
  color: #831843;
}

.status-selesai {
  background: #dcfce7;
  color: #166534;
}

.status-batal {
  background: #fee2e2;
  color: #991b1b;
}

.lp-card-body {
  padding: 16px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric {
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.metric-value.tier-tier1 {
  color: #1e40af;
}

.metric-value.tier-tier2 {
  color: #92400e;
}

.metric-value.tier-tier3 {
  color: #991b1b;
}

.lp-description {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.lp-description p {
  margin: 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

.items-preview {
  margin-bottom: 12px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  display: block;
  margin-bottom: 6px;
}

.items-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  color: #374151;
}

.items-list li {
  padding: 4px 0;
  border-bottom: 1px solid #e5e7eb;
}

.items-list li:last-child {
  border-bottom: none;
}

.more-items {
  font-style: italic;
  color: #9ca3af;
  padding-top: 6px;
}

.tier-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.tier-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.tier-item.tier1 {
  background: #dbeafe;
  color: #1e40af;
}

.tier-item.tier2 {
  background: #fef3c7;
  color: #92400e;
}

.tier-item.tier3 {
  background: #fee2e2;
  color: #991b1b;
}

.lp-card-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-outline {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-success {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger-outline {
  background: white;
  color: #dc2626;
  border-color: #fee2e2;
}

.btn-danger-outline:hover {
  background: #fee2e2;
  border-color: #dc2626;
}

@media (max-width: 768px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .lp-card-footer {
    flex-direction: column;
  }

  .btn {
    flex: 1;
    text-align: center;
  }
}
</style>
