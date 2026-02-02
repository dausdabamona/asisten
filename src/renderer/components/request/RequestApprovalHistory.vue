<template>
  <div class="approval-history">
    <!-- Approval Actions -->
    <div v-if="canApprove && pendingApproval" class="approval-actions-panel">
      <h3 class="panel-title">Aksi Persetujuan</h3>
      <p class="panel-description">
        Anda dapat menyetujui atau menolak pengajuan ini sebagai
        <strong>{{ pendingApproval.approver_role }}</strong>
      </p>

      <div class="action-buttons">
        <button @click="showApproveDialog = true" class="btn btn-success">
          ✓ Setujui
        </button>
        <button @click="showRejectDialog = true" class="btn btn-danger">
          ✗ Tolak
        </button>
      </div>
    </div>

    <!-- Approval Timeline -->
    <div class="approval-timeline">
      <h3 class="section-title">Riwayat Persetujuan</h3>

      <div v-if="approvals.length === 0" class="no-approvals">
        <p>Belum ada riwayat persetujuan</p>
      </div>

      <div v-else class="timeline">
        <div
          v-for="(approval, index) in sortedApprovals"
          :key="approval.id || index"
          :class="['timeline-item', getApprovalClass(approval)]"
        >
          <div class="timeline-marker">
            <span class="marker-icon">{{ getApprovalIcon(approval.action) }}</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="step-number">Step {{ approval.step_number }}</span>
              <span :class="['action-badge', `action-${approval.action}`]">
                {{ getActionLabel(approval.action) }}
              </span>
            </div>
            <div class="timeline-body">
              <p class="approver-role">{{ approval.approver_role }}</p>
              <p v-if="approval.approver_name" class="approver-name">
                {{ approval.approver_name }}
              </p>
              <p v-if="approval.comments" class="approval-comments">
                "{{ approval.comments }}"
              </p>
            </div>
            <div v-if="approval.approved_at" class="timeline-footer">
              <span class="approval-date">{{ formatDate(approval.approved_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approval Workflow Diagram -->
    <div class="workflow-diagram">
      <h3 class="section-title">Alur Persetujuan</h3>
      <div class="workflow-steps">
        <div
          v-for="(step, index) in workflowSteps"
          :key="index"
          :class="['workflow-step', step.status]"
        >
          <div class="step-circle">
            <span v-if="step.status === 'completed'" class="step-icon">✓</span>
            <span v-else-if="step.status === 'rejected'" class="step-icon">✗</span>
            <span v-else-if="step.status === 'current'" class="step-icon">●</span>
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <div class="step-info">
            <span class="step-role">{{ step.role }}</span>
            <span class="step-status">{{ step.statusLabel }}</span>
          </div>
          <div v-if="index < workflowSteps.length - 1" class="step-connector"></div>
        </div>
      </div>
    </div>

    <!-- Approve Dialog -->
    <div v-if="showApproveDialog" class="modal-overlay" @click.self="showApproveDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Setujui Pengajuan</h3>
          <button @click="showApproveDialog = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <p>Anda akan menyetujui pengajuan ini. Tambahkan komentar jika diperlukan:</p>
          <textarea
            v-model="approveComments"
            class="form-control"
            rows="3"
            placeholder="Komentar (opsional)"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showApproveDialog = false" class="btn btn-secondary">Batal</button>
          <button @click="handleApprove" class="btn btn-success">Setujui</button>
        </div>
      </div>
    </div>

    <!-- Reject Dialog -->
    <div v-if="showRejectDialog" class="modal-overlay" @click.self="showRejectDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Tolak Pengajuan</h3>
          <button @click="showRejectDialog = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <p>Anda akan menolak pengajuan ini. Berikan alasan penolakan:</p>
          <textarea
            v-model="rejectReason"
            class="form-control"
            rows="3"
            placeholder="Alasan penolakan (wajib)"
            required
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showRejectDialog = false" class="btn btn-secondary">Batal</button>
          <button
            @click="handleReject"
            :disabled="!rejectReason.trim()"
            class="btn btn-danger"
          >
            Tolak
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  request: { type: Object, required: true },
  approvals: { type: Array, default: () => [] },
  canApprove: { type: Boolean, default: false }
})

const emit = defineEmits(['approve', 'reject'])

const showApproveDialog = ref(false)
const showRejectDialog = ref(false)
const approveComments = ref('')
const rejectReason = ref('')

const sortedApprovals = computed(() => {
  return [...props.approvals].sort((a, b) => a.step_number - b.step_number)
})

const pendingApproval = computed(() => {
  return props.approvals.find(a => a.action === 'pending')
})

const workflowSteps = computed(() => {
  const tierSteps = {
    tier1: [
      { role: 'PPK', step: 1 }
    ],
    tier2: [
      { role: 'Kepala Unit', step: 1 },
      { role: 'PPK', step: 2 },
      { role: 'PPSPM', step: 3 }
    ],
    tier3: [
      { role: 'Kepala Unit', step: 1 },
      { role: 'PPK', step: 2 },
      { role: 'PPSPM', step: 3 },
      { role: 'Panitia Pengadaan', step: 4 },
      { role: 'Direktur', step: 5 }
    ]
  }

  const steps = tierSteps[props.request.tier] || tierSteps.tier2

  return steps.map(step => {
    const approval = props.approvals.find(a => a.step_number === step.step)

    let status = 'pending'
    let statusLabel = 'Menunggu'

    if (approval) {
      if (approval.action === 'approve') {
        status = 'completed'
        statusLabel = 'Disetujui'
      } else if (approval.action === 'reject') {
        status = 'rejected'
        statusLabel = 'Ditolak'
      } else if (approval.action === 'pending') {
        const previousCompleted = steps
          .filter(s => s.step < step.step)
          .every(s => {
            const prevApproval = props.approvals.find(a => a.step_number === s.step)
            return prevApproval && prevApproval.action === 'approve'
          })

        if (previousCompleted) {
          status = 'current'
          statusLabel = 'Aktif'
        }
      }
    }

    return { ...step, status, statusLabel }
  })
})

function getApprovalClass(approval) {
  switch (approval.action) {
    case 'approve': return 'approved'
    case 'reject': return 'rejected'
    case 'revise': return 'revised'
    default: return 'pending'
  }
}

function getApprovalIcon(action) {
  switch (action) {
    case 'approve': return '✓'
    case 'reject': return '✗'
    case 'revise': return '↻'
    default: return '○'
  }
}

function getActionLabel(action) {
  switch (action) {
    case 'approve': return 'Disetujui'
    case 'reject': return 'Ditolak'
    case 'revise': return 'Diminta Revisi'
    case 'pending': return 'Menunggu'
    default: return action
  }
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

function handleApprove() {
  emit('approve', approveComments.value)
  showApproveDialog.value = false
  approveComments.value = ''
}

function handleReject() {
  if (!rejectReason.value.trim()) return
  emit('reject', rejectReason.value)
  showRejectDialog.value = false
  rejectReason.value = ''
}
</script>

<style scoped>
.approval-history {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Approval Actions Panel */
.approval-actions-panel {
  padding: 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 12px;
  border: 1px solid #93c5fd;
}

.panel-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
}

.panel-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #3b82f6;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* Section Title */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

/* Approval Timeline */
.approval-timeline {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.no-approvals {
  text-align: center;
  padding: 32px;
  color: #6b7280;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
}

.timeline-item.approved {
  border-left-color: #10b981;
}

.timeline-item.rejected {
  border-left-color: #ef4444;
}

.timeline-item.pending {
  border-left-color: #f59e0b;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex-shrink: 0;
}

.timeline-item.approved .timeline-marker {
  background: #d1fae5;
  color: #065f46;
}

.timeline-item.rejected .timeline-marker {
  background: #fee2e2;
  color: #991b1b;
}

.timeline-item.pending .timeline-marker {
  background: #fef3c7;
  color: #92400e;
}

.marker-icon {
  font-size: 18px;
  font-weight: bold;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.step-number {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.action-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.action-badge.action-approve {
  background: #d1fae5;
  color: #065f46;
}

.action-badge.action-reject {
  background: #fee2e2;
  color: #991b1b;
}

.action-badge.action-pending {
  background: #fef3c7;
  color: #92400e;
}

.approver-role {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.approver-name {
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.approval-comments {
  font-size: 13px;
  color: #374151;
  font-style: italic;
  margin: 8px 0 0 0;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.approval-date {
  font-size: 12px;
  color: #9ca3af;
}

/* Workflow Diagram */
.workflow-diagram {
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

.step-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  background: #e5e7eb;
  color: #6b7280;
  margin-bottom: 8px;
  z-index: 1;
}

.workflow-step.completed .step-circle {
  background: #10b981;
  color: white;
}

.workflow-step.current .step-circle {
  background: #2563eb;
  color: white;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}

.workflow-step.rejected .step-circle {
  background: #ef4444;
  color: white;
}

.step-info {
  text-align: center;
}

.step-role {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  display: block;
}

.step-status {
  font-size: 11px;
  color: #6b7280;
  display: block;
  margin-top: 4px;
}

.step-connector {
  position: absolute;
  top: 24px;
  left: calc(50% + 24px);
  width: calc(100% - 48px);
  height: 2px;
  background: #e5e7eb;
}

.workflow-step.completed + .workflow-step .step-connector,
.workflow-step.completed .step-connector {
  background: #10b981;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
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

.modal-body p {
  margin: 0 0 16px 0;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .workflow-steps {
    flex-direction: column;
    gap: 16px;
  }

  .step-connector {
    display: none;
  }
}
</style>
