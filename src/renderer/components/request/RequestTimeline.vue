<template>
  <div class="request-timeline">
    <h3 class="section-title">Riwayat Aktivitas</h3>

    <div v-if="history.length === 0" class="no-history">
      <p>Belum ada aktivitas tercatat</p>
    </div>

    <div v-else class="timeline">
      <div
        v-for="(event, index) in history"
        :key="index"
        :class="['timeline-event', getEventClass(event.status)]"
      >
        <div class="event-line">
          <div class="event-dot"></div>
          <div v-if="index < history.length - 1" class="event-connector"></div>
        </div>
        <div class="event-content">
          <div class="event-header">
            <span :class="['event-badge', getEventClass(event.status)]">
              {{ getEventIcon(event.status) }} {{ getEventLabel(event.status) }}
            </span>
            <span class="event-date">{{ formatDate(event.timestamp) }}</span>
          </div>
          <div class="event-body">
            <p class="event-user">{{ event.user }}</p>
            <p v-if="event.notes" class="event-notes">{{ event.notes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Status Flow -->
    <div class="status-flow-section">
      <h4 class="subsection-title">Alur Status</h4>
      <div class="status-flow">
        <div
          v-for="(status, index) in statusFlow"
          :key="status.id"
          :class="['flow-step', { active: isCurrentStatus(status.id), passed: isPastStatus(status.id) }]"
        >
          <div class="flow-icon">{{ status.icon }}</div>
          <div class="flow-label">{{ status.label }}</div>
          <div v-if="index < statusFlow.length - 1" class="flow-arrow">→</div>
        </div>
      </div>
    </div>

    <!-- Key Dates -->
    <div class="key-dates-section">
      <h4 class="subsection-title">Tanggal Penting</h4>
      <div class="key-dates">
        <div class="date-item">
          <span class="date-icon">📅</span>
          <div class="date-info">
            <span class="date-label">Tanggal Dibuat</span>
            <span class="date-value">{{ formatDate(request.created_at) }}</span>
          </div>
        </div>
        <div v-if="request.submitted_at" class="date-item">
          <span class="date-icon">📤</span>
          <div class="date-info">
            <span class="date-label">Tanggal Diajukan</span>
            <span class="date-value">{{ formatDate(request.submitted_at) }}</span>
          </div>
        </div>
        <div v-if="request.approved_at" class="date-item">
          <span class="date-icon">✅</span>
          <div class="date-info">
            <span class="date-label">Tanggal Disetujui</span>
            <span class="date-value">{{ formatDate(request.approved_at) }}</span>
          </div>
        </div>
        <div class="date-item">
          <span class="date-icon">🔄</span>
          <div class="date-info">
            <span class="date-label">Terakhir Diperbarui</span>
            <span class="date-value">{{ formatDate(request.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Duration Stats -->
    <div class="duration-stats">
      <div class="stat-item">
        <span class="stat-value">{{ getDaysSinceCreation() }}</span>
        <span class="stat-label">Hari Sejak Dibuat</span>
      </div>
      <div v-if="request.status !== 'draft'" class="stat-item">
        <span class="stat-value">{{ getProcessingDays() }}</span>
        <span class="stat-label">Hari Proses</span>
      </div>
      <div v-if="request.status === 'completed'" class="stat-item">
        <span class="stat-value">{{ getTotalDays() }}</span>
        <span class="stat-label">Total Hari</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  request: { type: Object, required: true },
  history: { type: Array, default: () => [] }
})

const statusFlow = [
  { id: 'draft', label: 'Draft', icon: '📝' },
  { id: 'pending', label: 'Pending', icon: '⏳' },
  { id: 'approved', label: 'Disetujui', icon: '✅' },
  { id: 'in_progress', label: 'Proses', icon: '🔄' },
  { id: 'completed', label: 'Selesai', icon: '🎉' }
]

const statusOrder = ['draft', 'pending', 'approved', 'in_progress', 'completed']

function getEventClass(status) {
  const classes = {
    created: 'info',
    submitted: 'info',
    pending: 'warning',
    approved: 'success',
    approve: 'success',
    rejected: 'danger',
    reject: 'danger',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'muted'
  }
  return classes[status] || 'info'
}

function getEventIcon(status) {
  const icons = {
    created: '🆕',
    submitted: '📤',
    pending: '⏳',
    approved: '✅',
    approve: '✅',
    rejected: '❌',
    reject: '❌',
    in_progress: '🔄',
    completed: '🎉',
    cancelled: '🚫'
  }
  return icons[status] || '📌'
}

function getEventLabel(status) {
  const labels = {
    created: 'Dibuat',
    submitted: 'Diajukan',
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    approve: 'Disetujui',
    rejected: 'Ditolak',
    reject: 'Ditolak',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  }
  return labels[status] || status
}

function isCurrentStatus(statusId) {
  return props.request.status === statusId
}

function isPastStatus(statusId) {
  const currentIndex = statusOrder.indexOf(props.request.status)
  const statusIndex = statusOrder.indexOf(statusId)
  return statusIndex < currentIndex
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDaysSinceCreation() {
  if (!props.request.created_at) return 0
  const created = new Date(props.request.created_at)
  const now = new Date()
  return Math.floor((now - created) / (1000 * 60 * 60 * 24))
}

function getProcessingDays() {
  if (!props.request.submitted_at) return 0
  const submitted = new Date(props.request.submitted_at)
  const endDate = props.request.completed_at
    ? new Date(props.request.completed_at)
    : new Date()
  return Math.floor((endDate - submitted) / (1000 * 60 * 60 * 24))
}

function getTotalDays() {
  if (!props.request.created_at || !props.request.completed_at) return 0
  const created = new Date(props.request.created_at)
  const completed = new Date(props.request.completed_at)
  return Math.floor((completed - created) / (1000 * 60 * 60 * 24))
}
</script>

<style scoped>
.request-timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.no-history {
  text-align: center;
  padding: 40px;
  background: #f9fafb;
  border-radius: 12px;
  color: #6b7280;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-event {
  display: flex;
  gap: 16px;
}

.event-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24px;
}

.event-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
  flex-shrink: 0;
}

.timeline-event.success .event-dot { background: #10b981; }
.timeline-event.warning .event-dot { background: #f59e0b; }
.timeline-event.danger .event-dot { background: #ef4444; }
.timeline-event.info .event-dot { background: #3b82f6; }
.timeline-event.muted .event-dot { background: #9ca3af; }

.event-connector {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: #e5e7eb;
}

.event-content {
  flex: 1;
  padding-bottom: 24px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.event-badge.success { background: #d1fae5; color: #065f46; }
.event-badge.warning { background: #fef3c7; color: #92400e; }
.event-badge.danger { background: #fee2e2; color: #991b1b; }
.event-badge.info { background: #dbeafe; color: #1e40af; }
.event-badge.muted { background: #f3f4f6; color: #4b5563; }

.event-date {
  font-size: 12px;
  color: #6b7280;
}

.event-user {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.event-notes {
  font-size: 13px;
  color: #6b7280;
  margin: 8px 0 0 0;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-style: italic;
}

/* Status Flow */
.status-flow-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.status-flow {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  opacity: 0.5;
}

.flow-step.passed {
  opacity: 1;
  border-color: #10b981;
  background: #f0fdf4;
}

.flow-step.active {
  opacity: 1;
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.flow-icon {
  font-size: 24px;
}

.flow-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.flow-arrow {
  font-size: 20px;
  color: #9ca3af;
}

/* Key Dates */
.key-dates-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.key-dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.date-icon {
  font-size: 24px;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
}

.date-value {
  font-size: 13px;
  color: #111827;
  font-weight: 500;
}

/* Duration Stats */
.duration-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e40af;
}

.stat-label {
  font-size: 12px;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .status-flow {
    flex-direction: column;
  }

  .flow-arrow {
    transform: rotate(90deg);
  }
}
</style>
