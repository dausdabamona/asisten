<template>
  <div class="request-overview">
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon value">💰</div>
        <div class="card-content">
          <span class="card-label">Estimasi Nilai</span>
          <span class="card-value">{{ formatCurrency(request.estimated_value) }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon unit">🏢</div>
        <div class="card-content">
          <span class="card-label">Unit Pengusul</span>
          <span class="card-value">{{ request.unit || '-' }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon budget">📊</div>
        <div class="card-content">
          <span class="card-label">Kode Anggaran</span>
          <span class="card-value">{{ request.budget_code || '-' }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon urgency" :class="request.urgency">
          {{ getUrgencyIcon(request.urgency) }}
        </div>
        <div class="card-content">
          <span class="card-label">Urgensi</span>
          <span class="card-value">{{ getUrgencyLabel(request.urgency) }}</span>
        </div>
      </div>
    </div>

    <!-- Main Information -->
    <div class="info-sections">
      <div class="info-section">
        <h3 class="section-title">Informasi Pengadaan</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nama Barang/Jasa</span>
            <span class="info-value">{{ request.item_name }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">Deskripsi</span>
            <span class="info-value">{{ request.description || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Jumlah</span>
            <span class="info-value">{{ request.quantity || 1 }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Kategori</span>
            <span class="info-value">{{ request.category || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3 class="section-title">Informasi Pemohon</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nama Pemohon</span>
            <span class="info-value">{{ request.requester_name || request.requester_id || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">{{ request.requester_email || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tanggal Pengajuan</span>
            <span class="info-value">{{ formatDate(request.created_at) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Terakhir Diperbarui</span>
            <span class="info-value">{{ formatDate(request.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Tier 3 specific sections -->
      <div v-if="request.tier === 'tier3' && request.background" class="info-section">
        <h3 class="section-title">Latar Belakang</h3>
        <p class="info-text">{{ request.background }}</p>
      </div>

      <div v-if="request.tier === 'tier3' && request.objectives" class="info-section">
        <h3 class="section-title">Tujuan</h3>
        <p class="info-text">{{ request.objectives }}</p>
      </div>

      <div v-if="request.tier === 'tier3' && request.scope_of_work" class="info-section">
        <h3 class="section-title">Ruang Lingkup Pekerjaan</h3>
        <p class="info-text">{{ request.scope_of_work }}</p>
      </div>
    </div>

    <!-- Status Workflow -->
    <div class="workflow-section">
      <h3 class="section-title">Status Workflow</h3>
      <div class="workflow-steps">
        <div
          v-for="(step, index) in workflowSteps"
          :key="step.status"
          :class="['workflow-step', getStepClass(step.status)]"
        >
          <div class="step-indicator">
            <span v-if="isStepCompleted(step.status)" class="step-check">✓</span>
            <span v-else-if="isCurrentStep(step.status)" class="step-current">●</span>
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <div class="step-content">
            <span class="step-label">{{ step.label }}</span>
            <span v-if="step.date" class="step-date">{{ formatDate(step.date) }}</span>
          </div>
          <div v-if="index < workflowSteps.length - 1" class="step-connector"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  request: {
    type: Object,
    required: true
  }
})

const workflowSteps = computed(() => {
  const steps = [
    { status: 'draft', label: 'Draft', date: props.request.created_at },
    { status: 'pending', label: 'Menunggu Persetujuan', date: null },
    { status: 'approved', label: 'Disetujui', date: null },
    { status: 'in_progress', label: 'Dalam Proses', date: null },
    { status: 'completed', label: 'Selesai', date: null }
  ]

  // Add dates based on current status
  const statusOrder = ['draft', 'pending', 'approved', 'in_progress', 'completed']
  const currentIndex = statusOrder.indexOf(props.request.status)

  return steps.map((step, index) => ({
    ...step,
    date: index <= currentIndex ? step.date || props.request.updated_at : null
  }))
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

function getUrgencyIcon(urgency) {
  const icons = {
    low: '🟢',
    normal: '🟡',
    high: '🟠',
    urgent: '🔴'
  }
  return icons[urgency] || '🟡'
}

function getUrgencyLabel(urgency) {
  const labels = {
    low: 'Rendah',
    normal: 'Normal',
    high: 'Tinggi',
    urgent: 'Mendesak'
  }
  return labels[urgency] || 'Normal'
}

function getStepClass(stepStatus) {
  const currentStatus = props.request.status
  const statusOrder = ['draft', 'pending', 'approved', 'in_progress', 'completed']
  const stepIndex = statusOrder.indexOf(stepStatus)
  const currentIndex = statusOrder.indexOf(currentStatus)

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}

function isStepCompleted(stepStatus) {
  return getStepClass(stepStatus) === 'completed'
}

function isCurrentStep(stepStatus) {
  return getStepClass(stepStatus) === 'current'
}
</script>

<style scoped>
.request-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.card-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

/* Info Sections */
.info-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
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

.info-item.full-width {
  grid-column: span 2;
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

.info-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* Workflow Section */
.workflow-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.workflow-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.workflow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  background: #e5e7eb;
  color: #6b7280;
  margin-bottom: 8px;
  z-index: 1;
}

.workflow-step.completed .step-indicator {
  background: #10b981;
  color: white;
}

.workflow-step.current .step-indicator {
  background: #2563eb;
  color: white;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}

.step-content {
  text-align: center;
}

.step-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  display: block;
}

.step-date {
  font-size: 11px;
  color: #6b7280;
  display: block;
  margin-top: 4px;
}

.step-connector {
  position: absolute;
  top: 20px;
  left: calc(50% + 20px);
  width: calc(100% - 40px);
  height: 2px;
  background: #e5e7eb;
}

.workflow-step.completed + .workflow-step .step-connector,
.workflow-step.completed .step-connector {
  background: #10b981;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: span 1;
  }

  .workflow-steps {
    flex-direction: column;
    gap: 20px;
  }

  .step-connector {
    display: none;
  }
}
</style>
