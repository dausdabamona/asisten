<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Ubah Status</h3>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>

      <div class="modal-body">
        <div class="current-status">
          <span class="label">Status Saat Ini</span>
          <span :class="['status-badge', `status-${request.status}`]">
            {{ getStatusLabel(request.status) }}
          </span>
        </div>

        <div class="status-options">
          <p class="section-label">Pilih Status Baru</p>

          <div v-if="availableStatuses.length === 0" class="no-options">
            <p>Tidak ada perubahan status yang tersedia</p>
          </div>

          <div
            v-for="status in availableStatuses"
            :key="status"
            :class="['status-option', { selected: selectedStatus === status }]"
            @click="selectedStatus = status"
          >
            <div class="option-radio">
              <span v-if="selectedStatus === status" class="radio-checked">●</span>
              <span v-else class="radio-unchecked">○</span>
            </div>
            <div class="option-content">
              <span :class="['status-badge small', `status-${status}`]">
                {{ getStatusLabel(status) }}
              </span>
              <span class="status-desc">{{ getStatusDescription(status) }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedStatus" class="notes-section">
          <label>Catatan / Alasan</label>
          <textarea
            v-model="notes"
            class="form-control"
            rows="3"
            :placeholder="getNotesPlaceholder()"
            :required="requiresNotes"
          ></textarea>
          <span v-if="requiresNotes" class="required-hint">* Wajib diisi</span>
        </div>

        <!-- Warning for certain status changes -->
        <div v-if="showWarning" class="status-warning">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">{{ warningMessage }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Batal</button>
        <button
          @click="handleChange"
          :disabled="!canChange"
          :class="['btn', getButtonClass()]"
        >
          {{ getButtonLabel() }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  request: { type: Object, required: true },
  availableStatuses: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'change'])

const selectedStatus = ref('')
const notes = ref('')

const requiresNotes = computed(() => {
  return ['rejected', 'cancelled'].includes(selectedStatus.value)
})

const canChange = computed(() => {
  if (!selectedStatus.value) return false
  if (requiresNotes.value && !notes.value.trim()) return false
  return true
})

const showWarning = computed(() => {
  return ['rejected', 'cancelled'].includes(selectedStatus.value)
})

const warningMessage = computed(() => {
  if (selectedStatus.value === 'rejected') {
    return 'Pengajuan akan ditolak dan pemohon akan menerima notifikasi.'
  }
  if (selectedStatus.value === 'cancelled') {
    return 'Pengajuan akan dibatalkan dan tidak dapat diproses lebih lanjut.'
  }
  return ''
})

function getStatusLabel(status) {
  const labels = {
    draft: 'Draft',
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  }
  return labels[status] || status
}

function getStatusDescription(status) {
  const descriptions = {
    pending: 'Kirim pengajuan untuk disetujui',
    approved: 'Setujui pengajuan ini',
    rejected: 'Tolak pengajuan dengan alasan',
    in_progress: 'Mulai proses pengadaan',
    completed: 'Tandai pengadaan selesai',
    cancelled: 'Batalkan pengajuan',
    draft: 'Kembalikan ke status draft'
  }
  return descriptions[status] || ''
}

function getNotesPlaceholder() {
  if (selectedStatus.value === 'rejected') {
    return 'Masukkan alasan penolakan...'
  }
  if (selectedStatus.value === 'cancelled') {
    return 'Masukkan alasan pembatalan...'
  }
  return 'Catatan tambahan (opsional)...'
}

function getButtonClass() {
  if (selectedStatus.value === 'rejected') return 'btn-danger'
  if (selectedStatus.value === 'cancelled') return 'btn-warning'
  if (selectedStatus.value === 'approved') return 'btn-success'
  if (selectedStatus.value === 'completed') return 'btn-success'
  return 'btn-primary'
}

function getButtonLabel() {
  if (selectedStatus.value === 'pending') return 'Kirim Pengajuan'
  if (selectedStatus.value === 'approved') return 'Setujui'
  if (selectedStatus.value === 'rejected') return 'Tolak'
  if (selectedStatus.value === 'cancelled') return 'Batalkan'
  if (selectedStatus.value === 'completed') return 'Selesaikan'
  return 'Ubah Status'
}

function handleChange() {
  if (!canChange.value) return
  emit('change', selectedStatus.value, notes.value)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Current Status */
.current-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.current-status .label {
  font-size: 14px;
  color: #6b7280;
}

/* Status Badge */
.status-badge {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.small {
  padding: 4px 12px;
  font-size: 12px;
}

.status-badge.status-draft { background: #f3f4f6; color: #4b5563; }
.status-badge.status-pending { background: #fef3c7; color: #92400e; }
.status-badge.status-approved { background: #d1fae5; color: #065f46; }
.status-badge.status-rejected { background: #fee2e2; color: #991b1b; }
.status-badge.status-in_progress { background: #dbeafe; color: #1e40af; }
.status-badge.status-completed { background: #d1fae5; color: #065f46; }
.status-badge.status-cancelled { background: #f3f4f6; color: #4b5563; }

/* Status Options */
.status-options {
  margin-bottom: 20px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 12px 0;
}

.no-options {
  text-align: center;
  padding: 20px;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 8px;
}

.status-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.status-option:hover {
  border-color: #d1d5db;
}

.status-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.option-radio {
  font-size: 18px;
  color: #d1d5db;
}

.status-option.selected .option-radio {
  color: #2563eb;
}

.option-content {
  flex: 1;
}

.status-desc {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

/* Notes Section */
.notes-section {
  margin-bottom: 16px;
}

.notes-section label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}

.required-hint {
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

/* Status Warning */
.status-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
}

.warning-icon {
  font-size: 20px;
}

.warning-text {
  font-size: 13px;
  color: #92400e;
}

/* Button Styles */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
