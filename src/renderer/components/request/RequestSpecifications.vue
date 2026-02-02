<template>
  <div class="request-specifications">
    <!-- Technical Specifications -->
    <div class="spec-section">
      <h3 class="section-title">Spesifikasi Teknis</h3>
      <div v-if="request.specifications || request.technical_specs" class="spec-content">
        <pre class="spec-text">{{ request.technical_specs || request.specifications }}</pre>
      </div>
      <p v-else class="no-data">Tidak ada spesifikasi teknis</p>
    </div>

    <!-- Output Specifications (Tier 3) -->
    <div v-if="request.tier === 'tier3'" class="spec-section">
      <h3 class="section-title">Spesifikasi Output</h3>
      <div v-if="request.output_specs" class="spec-content">
        <pre class="spec-text">{{ request.output_specs }}</pre>
      </div>
      <p v-else class="no-data">Tidak ada spesifikasi output</p>
    </div>

    <!-- Quality Requirements (Tier 3) -->
    <div v-if="request.tier === 'tier3'" class="spec-section">
      <h3 class="section-title">Persyaratan Kualitas</h3>
      <div v-if="request.quality_requirements" class="spec-content">
        <pre class="spec-text">{{ request.quality_requirements }}</pre>
      </div>
      <p v-else class="no-data">Tidak ada persyaratan kualitas</p>
    </div>

    <!-- Performance Indicators (Tier 3) -->
    <div v-if="request.tier === 'tier3'" class="spec-section">
      <h3 class="section-title">Indikator Kinerja</h3>
      <div v-if="request.performance_indicators" class="spec-content">
        <pre class="spec-text">{{ request.performance_indicators }}</pre>
      </div>
      <p v-else class="no-data">Tidak ada indikator kinerja</p>
    </div>

    <!-- HPS Information (Tier 2 & 3) -->
    <div v-if="request.tier !== 'tier1'" class="spec-section">
      <h3 class="section-title">Harga Perkiraan Sendiri (HPS)</h3>
      <div class="hps-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Total HPS</span>
            <span class="info-value highlight">{{ formatCurrency(request.hps_total || request.estimated_value) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tanggal HPS</span>
            <span class="info-value">{{ formatDate(request.hps_date) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Disusun Oleh</span>
            <span class="info-value">{{ request.hps_prepared_by || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Metodologi</span>
            <span class="info-value">{{ request.hps_methodology || '-' }}</span>
          </div>
        </div>

        <!-- HPS Line Items -->
        <div v-if="hpsItems.length > 0" class="hps-items">
          <h4 class="subsection-title">Rincian RAB</h4>
          <table class="items-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Uraian</th>
                <th>Satuan</th>
                <th class="text-right">Vol</th>
                <th class="text-right">Harga Satuan</th>
                <th class="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in hpsItems" :key="item.id || index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.description }}</td>
                <td>{{ item.unit }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ formatCurrency(item.unit_price) }}</td>
                <td class="text-right">{{ formatCurrency(item.total_price || item.quantity * item.unit_price) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right"><strong>Total</strong></td>
                <td class="text-right"><strong>{{ formatCurrency(calculateTotal()) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Procurement Method (Tier 3) -->
    <div v-if="request.tier === 'tier3'" class="spec-section">
      <h3 class="section-title">Metode Pengadaan</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Metode Pengadaan</span>
          <span class="info-value">{{ getProcurementMethodLabel(request.procurement_method) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Metode Pemilihan</span>
          <span class="info-value">{{ request.provider_selection_method || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Estimasi Waktu</span>
          <span class="info-value">{{ request.estimated_timeline_days || '-' }} hari</span>
        </div>
      </div>
    </div>

    <!-- Timeline (Tier 3) -->
    <div v-if="request.tier === 'tier3' && hasTimeline" class="spec-section">
      <h3 class="section-title">Jadwal Pelaksanaan</h3>
      <div class="timeline-grid">
        <div class="timeline-item">
          <span class="timeline-label">Rencana Mulai</span>
          <span class="timeline-value">{{ formatDate(request.planned_start_date) }}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Rencana Selesai</span>
          <span class="timeline-value">{{ formatDate(request.planned_end_date) }}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Pengumuman</span>
          <span class="timeline-value">{{ formatDate(request.announcement_start) }} - {{ formatDate(request.announcement_end) }}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Pendaftaran</span>
          <span class="timeline-value">{{ formatDate(request.registration_start) }} - {{ formatDate(request.registration_end) }}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Evaluasi</span>
          <span class="timeline-value">{{ formatDate(request.evaluation_start) }} - {{ formatDate(request.evaluation_end) }}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Penetapan Pemenang</span>
          <span class="timeline-value">{{ formatDate(request.award_date) }}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Penandatanganan Kontrak</span>
          <span class="timeline-value">{{ formatDate(request.contract_signing_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Sustainability (Tier 3) -->
    <div v-if="request.tier === 'tier3' && request.sustainability_considerations" class="spec-section">
      <h3 class="section-title">Pertimbangan Keberlanjutan</h3>
      <div class="spec-content">
        <pre class="spec-text">{{ request.sustainability_considerations }}</pre>
      </div>
      <div class="info-grid" style="margin-top: 16px;">
        <div class="info-item">
          <span class="info-label">TKDN Minimum</span>
          <span class="info-value">{{ request.local_content_requirement || 0 }}%</span>
        </div>
        <div class="info-item">
          <span class="info-label">Preferensi UKM</span>
          <span class="info-value">{{ request.sme_preference ? 'Ya' : 'Tidak' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  request: {
    type: Object,
    required: true
  }
})

const hpsItems = ref([])

const hasTimeline = computed(() => {
  return props.request.planned_start_date ||
         props.request.planned_end_date ||
         props.request.announcement_start
})

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getProcurementMethodLabel(method) {
  const labels = {
    'e-purchasing': 'E-Purchasing',
    'pengadaan_langsung': 'Pengadaan Langsung',
    'penunjukan_langsung': 'Penunjukan Langsung',
    'tender_cepat': 'Tender Cepat',
    'tender': 'Tender',
    'seleksi': 'Seleksi',
    'sayembara': 'Sayembara',
    'kontes': 'Kontes'
  }
  return labels[method] || method || '-'
}

function calculateTotal() {
  return hpsItems.value.reduce((sum, item) => {
    return sum + (item.total_price || item.quantity * item.unit_price)
  }, 0)
}

async function loadHpsItems() {
  if (props.request.tier === 'tier1') return

  try {
    // Try to parse from draft_data if available
    if (props.request.draft_data) {
      const draftData = JSON.parse(props.request.draft_data)
      if (draftData.hps?.lineItems) {
        hpsItems.value = draftData.hps.lineItems
        return
      }
    }

    // Otherwise try to load from database
    // This would need an API endpoint
  } catch (err) {
    console.error('Error loading HPS items:', err)
  }
}

onMounted(() => {
  loadHpsItems()
})
</script>

<style scoped>
.request-specifications {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.spec-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 16px 0 12px 0;
}

.spec-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.spec-text {
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-data {
  color: #6b7280;
  font-style: italic;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 14px;
  color: #111827;
}

.info-value.highlight {
  font-size: 18px;
  font-weight: 600;
  color: #2563eb;
}

/* HPS Items Table */
.hps-items {
  margin-top: 16px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.items-table th,
.items-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.items-table th {
  background: #f3f4f6;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.items-table td {
  font-size: 14px;
  color: #374151;
}

.items-table tfoot td {
  background: #f9fafb;
  font-weight: 600;
}

.text-right {
  text-align: right;
}

/* Timeline Grid */
.timeline-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.timeline-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

@media (max-width: 768px) {
  .info-grid,
  .timeline-grid {
    grid-template-columns: 1fr;
  }

  .items-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
