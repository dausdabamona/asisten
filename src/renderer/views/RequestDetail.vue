<template>
  <div class="request-detail">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-left">
        <button @click="$emit('back')" class="btn-back">
          <span class="icon">←</span> Kembali
        </button>
        <div class="header-info">
          <h1 class="request-number">{{ request?.request_number || 'Loading...' }}</h1>
          <div class="request-meta">
            <span :class="['tier-badge', `tier-${request?.tier}`]">
              {{ getTierLabel(request?.tier) }}
            </span>
            <span :class="['status-badge', `status-${request?.status}`]">
              {{ getStatusLabel(request?.status) }}
            </span>
            <span class="meta-date">
              Dibuat: {{ formatDate(request?.created_at) }}
            </span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <!-- Role-based action buttons -->
        <button
          v-if="canEdit"
          @click="openEditModal"
          class="btn btn-secondary"
        >
          Edit
        </button>
        <button
          v-if="canDuplicate"
          @click="duplicateRequest"
          class="btn btn-secondary"
        >
          Duplikat
        </button>
        <button
          @click="showDocumentGenerator = true"
          class="btn btn-secondary"
        >
          Generate Dokumen
        </button>
        <button @click="printRequest" class="btn btn-secondary">
          Cetak
        </button>
        <button @click="exportRequest" class="btn btn-secondary">
          Export
        </button>
        <button
          v-if="canDelete"
          @click="showDeleteModal = true"
          class="btn btn-danger"
        >
          Hapus
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadRequest" class="btn btn-primary">Coba Lagi</button>
    </div>

    <!-- Main Content -->
    <div v-else-if="request" class="detail-content">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          v-for="tab in availableTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.label }}
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-pane">
          <RequestOverview :request="request" />
        </div>

        <!-- Specifications Tab -->
        <div v-else-if="activeTab === 'specifications'" class="tab-pane">
          <RequestSpecifications :request="request" />
        </div>

        <!-- Documents Tab -->
        <div v-else-if="activeTab === 'documents'" class="tab-pane">
          <RequestDocuments
            :request="request"
            :documents="documents"
            :generated-documents="generatedDocuments"
            @upload="handleDocumentUpload"
            @download="handleDocumentDownload"
            @delete="handleDocumentDelete"
            @regenerate="handleDocumentRegenerate"
          />
        </div>

        <!-- Approval History Tab -->
        <div v-else-if="activeTab === 'approval'" class="tab-pane">
          <RequestApprovalHistory
            :request="request"
            :approvals="approvals"
            :can-approve="canApprove"
            @approve="handleApprove"
            @reject="handleReject"
          />
        </div>

        <!-- Contract Tab -->
        <div v-else-if="activeTab === 'contract'" class="tab-pane">
          <RequestContract
            :request="request"
            :contract="contract"
            @create-contract="handleCreateContract"
          />
        </div>

        <!-- Payments Tab -->
        <div v-else-if="activeTab === 'payments'" class="tab-pane">
          <RequestPayments
            :request="request"
            :payments="payments"
            @create-payment="handleCreatePayment"
          />
        </div>

        <!-- Status Timeline Tab -->
        <div v-else-if="activeTab === 'timeline'" class="tab-pane">
          <RequestTimeline
            :request="request"
            :history="statusHistory"
          />
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <EditRequestModal
      v-if="showEditModal"
      :request="request"
      :tier="request?.tier"
      @close="showEditModal = false"
      @save="handleSaveEdit"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-if="showDeleteModal"
      :request="request"
      :is-admin="isAdmin"
      @close="showDeleteModal = false"
      @soft-delete="handleSoftDelete"
      @hard-delete="handleHardDelete"
    />

    <!-- Document Generator Modal -->
    <DocumentGeneratorModal
      v-if="showDocumentGenerator"
      :request="request"
      @close="showDocumentGenerator = false"
      @generate="handleGenerateDocument"
    />

    <!-- Status Change Modal -->
    <StatusChangeModal
      v-if="showStatusModal"
      :request="request"
      :available-statuses="availableStatuses"
      @close="showStatusModal = false"
      @change="handleStatusChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import RequestOverview from '../components/request/RequestOverview.vue'
import RequestSpecifications from '../components/request/RequestSpecifications.vue'
import RequestDocuments from '../components/request/RequestDocuments.vue'
import RequestApprovalHistory from '../components/request/RequestApprovalHistory.vue'
import RequestContract from '../components/request/RequestContract.vue'
import RequestPayments from '../components/request/RequestPayments.vue'
import RequestTimeline from '../components/request/RequestTimeline.vue'
import EditRequestModal from '../components/request/EditRequestModal.vue'
import DeleteConfirmModal from '../components/request/DeleteConfirmModal.vue'
import DocumentGeneratorModal from '../components/request/DocumentGeneratorModal.vue'
import StatusChangeModal from '../components/request/StatusChangeModal.vue'

// Props
const props = defineProps({
  requestId: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'user'
  },
  userId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['back', 'updated', 'deleted'])

// State
const loading = ref(true)
const error = ref(null)
const request = ref(null)
const documents = ref([])
const generatedDocuments = ref([])
const approvals = ref([])
const contract = ref(null)
const payments = ref([])
const statusHistory = ref([])

const activeTab = ref('overview')
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showDocumentGenerator = ref(false)
const showStatusModal = ref(false)

// Computed
const isAdmin = computed(() => props.userRole === 'admin')
const isOwner = computed(() => request.value?.requester_id === props.userId)
const isDraft = computed(() => request.value?.status === 'draft')

const canEdit = computed(() => {
  if (!request.value) return false
  // Can edit if draft or if admin
  return isDraft.value || isAdmin.value
})

const canDelete = computed(() => {
  if (!request.value) return false
  // Can delete if draft and (owner or admin)
  return isDraft.value && (isOwner.value || isAdmin.value)
})

const canDuplicate = computed(() => {
  return !!request.value
})

const canApprove = computed(() => {
  if (!request.value) return false
  // Check if user has approval role for current step
  const currentStep = approvals.value.find(a => a.action === 'pending')
  if (!currentStep) return false
  // Add role checking logic here
  return props.userRole === 'ppk' || props.userRole === 'ppspm' || isAdmin.value
})

const availableTabs = computed(() => {
  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: '📋' },
    { id: 'specifications', label: 'Spesifikasi', icon: '📝' },
    { id: 'documents', label: 'Dokumen', icon: '📁', badge: documents.value.length + generatedDocuments.value.length },
    { id: 'approval', label: 'Persetujuan', icon: '✅', badge: getPendingApprovals() },
    { id: 'timeline', label: 'Timeline', icon: '📅' }
  ]

  // Add contract tab if applicable (tier 2 and 3)
  if (request.value?.tier !== 'tier1') {
    tabs.push({ id: 'contract', label: 'Kontrak', icon: '📄' })
  }

  // Add payments tab if contract exists
  if (contract.value) {
    tabs.push({ id: 'payments', label: 'Pembayaran', icon: '💰', badge: payments.value.length })
  }

  return tabs
})

const availableStatuses = computed(() => {
  const currentStatus = request.value?.status
  const statusFlow = {
    draft: ['pending', 'cancelled'],
    pending: ['approved', 'rejected', 'cancelled'],
    approved: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    rejected: ['draft'],
    cancelled: ['draft'],
    completed: []
  }
  return statusFlow[currentStatus] || []
})

// Methods
function getPendingApprovals() {
  return approvals.value.filter(a => a.action === 'pending').length
}

function getTierLabel(tier) {
  const labels = {
    tier1: 'Tier 1 (< 10 Juta)',
    tier2: 'Tier 2 (10-50 Juta)',
    tier3: 'Tier 3 (> 50 Juta)'
  }
  return labels[tier] || tier
}

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

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0)
}

async function loadRequest() {
  loading.value = true
  error.value = null

  try {
    // Load main request data
    const result = await window.electronAPI.request.getWithDetails(props.requestId)
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load request')
    }
    request.value = result.data

    // Load related data in parallel
    await Promise.all([
      loadDocuments(),
      loadGeneratedDocuments(),
      loadApprovals(),
      loadContract(),
      loadStatusHistory()
    ])
  } catch (err) {
    console.error('Error loading request:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadDocuments() {
  try {
    const result = await window.electronAPI.document.getByRequest(props.requestId)
    if (result.success) {
      documents.value = result.data || []
    }
  } catch (err) {
    console.error('Error loading documents:', err)
  }
}

async function loadGeneratedDocuments() {
  try {
    const result = await window.electronAPI.document.getGeneratedDocuments(props.requestId)
    if (result.success) {
      generatedDocuments.value = result.data || []
    }
  } catch (err) {
    console.error('Error loading generated documents:', err)
  }
}

async function loadApprovals() {
  if (request.value?.approvals) {
    approvals.value = request.value.approvals
  }
}

async function loadContract() {
  try {
    const result = await window.electronAPI.contract.getByRequest(props.requestId)
    if (result.success && result.data?.length > 0) {
      contract.value = result.data[0]
      await loadPayments()
    }
  } catch (err) {
    console.error('Error loading contract:', err)
  }
}

async function loadPayments() {
  if (!contract.value) return

  try {
    const result = await window.electronAPI.payment.getByContract(contract.value.id)
    if (result.success) {
      payments.value = result.data || []
    }
  } catch (err) {
    console.error('Error loading payments:', err)
  }
}

async function loadStatusHistory() {
  // Build status history from audit log or approvals
  const history = []

  // Add creation event
  history.push({
    status: 'created',
    timestamp: request.value?.created_at,
    user: request.value?.requester_name || 'System',
    notes: 'Pengajuan dibuat'
  })

  // Add approval events
  for (const approval of approvals.value) {
    if (approval.action && approval.action !== 'pending') {
      history.push({
        status: approval.action,
        timestamp: approval.approved_at,
        user: approval.approver_name || approval.approver_role,
        notes: approval.comments
      })
    }
  }

  // Sort by timestamp
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  statusHistory.value = history
}

function openEditModal() {
  showEditModal.value = true
}

async function handleSaveEdit(updatedData) {
  try {
    const result = await window.electronAPI.request.update(props.requestId, updatedData)
    if (result.success) {
      await loadRequest()
      showEditModal.value = false
      emit('updated', request.value)
    } else {
      alert('Gagal menyimpan perubahan: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error saving edit:', err)
    alert('Gagal menyimpan perubahan: ' + err.message)
  }
}

async function duplicateRequest() {
  if (!confirm('Buat pengajuan baru berdasarkan data ini?')) return

  try {
    const duplicateData = {
      ...request.value,
      id: undefined,
      request_number: undefined,
      status: 'draft',
      created_at: undefined,
      updated_at: undefined
    }

    const result = await window.electronAPI.request.create(duplicateData)
    if (result.success) {
      alert(`Pengajuan berhasil diduplikasi!\nNomor baru: ${result.data.request_number}`)
      emit('updated', result.data)
    } else {
      alert('Gagal menduplikasi: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error duplicating request:', err)
    alert('Gagal menduplikasi: ' + err.message)
  }
}

async function handleSoftDelete() {
  try {
    const result = await window.electronAPI.request.update(props.requestId, {
      status: 'deleted',
      deleted_at: new Date().toISOString()
    })

    if (result.success) {
      showDeleteModal.value = false
      emit('deleted', props.requestId)
    } else {
      alert('Gagal menghapus: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error soft deleting:', err)
    alert('Gagal menghapus: ' + err.message)
  }
}

async function handleHardDelete() {
  try {
    const result = await window.electronAPI.request.delete(props.requestId)

    if (result.success) {
      showDeleteModal.value = false
      emit('deleted', props.requestId)
    } else {
      alert('Gagal menghapus permanen: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error hard deleting:', err)
    alert('Gagal menghapus permanen: ' + err.message)
  }
}

async function handleApprove(comments) {
  try {
    const result = await window.electronAPI.request.approve(
      props.requestId,
      props.userId,
      comments
    )

    if (result.success) {
      await loadRequest()
      emit('updated', request.value)
    } else {
      alert('Gagal menyetujui: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error approving:', err)
    alert('Gagal menyetujui: ' + err.message)
  }
}

async function handleReject(reason) {
  try {
    const result = await window.electronAPI.request.reject(
      props.requestId,
      props.userId,
      reason
    )

    if (result.success) {
      await loadRequest()
      emit('updated', request.value)
    } else {
      alert('Gagal menolak: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error rejecting:', err)
    alert('Gagal menolak: ' + err.message)
  }
}

async function handleDocumentUpload(file) {
  try {
    const result = await window.electronAPI.document.saveFile(
      file.data,
      file.name,
      { subFolder: props.requestId }
    )

    if (result.success) {
      await window.electronAPI.document.create({
        request_id: props.requestId,
        file_type: file.type,
        file_name: result.fileName,
        original_name: file.name,
        file_path: result.filePath,
        file_size: result.fileSize,
        uploaded_by: props.userId
      })
      await loadDocuments()
    }
  } catch (err) {
    console.error('Error uploading document:', err)
    alert('Gagal mengunggah dokumen: ' + err.message)
  }
}

async function handleDocumentDownload(document) {
  try {
    const result = await window.electronAPI.dialog.showSaveDialog({
      defaultPath: document.original_name || document.file_name,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    })

    if (!result.canceled && result.filePath) {
      // Copy file to selected location
      const fs = require('fs')
      fs.copyFileSync(document.file_path, result.filePath)
      alert('Dokumen berhasil diunduh!')
    }
  } catch (err) {
    console.error('Error downloading document:', err)
    alert('Gagal mengunduh dokumen: ' + err.message)
  }
}

async function handleDocumentDelete(documentId) {
  if (!confirm('Hapus dokumen ini?')) return

  try {
    const result = await window.electronAPI.document.delete(documentId)
    if (result.success) {
      await loadDocuments()
    } else {
      alert('Gagal menghapus dokumen: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error deleting document:', err)
    alert('Gagal menghapus dokumen: ' + err.message)
  }
}

async function handleDocumentRegenerate(docType) {
  try {
    let result

    switch (docType) {
      case 'kwitansi':
        result = await window.electronAPI.document.generateKwitansi(props.requestId)
        break
      case 'spp':
        result = await window.electronAPI.document.generateSPP(props.requestId)
        break
      case 'spm':
        result = await window.electronAPI.document.generateSPM(props.requestId)
        break
      default:
        throw new Error(`Unknown document type: ${docType}`)
    }

    if (result.success) {
      await loadGeneratedDocuments()
      alert('Dokumen berhasil di-generate ulang!')
    } else {
      alert('Gagal generate dokumen: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error regenerating document:', err)
    alert('Gagal generate dokumen: ' + err.message)
  }
}

async function handleGenerateDocument(docType, options) {
  try {
    let result

    switch (docType) {
      case 'kwitansi':
        result = await window.electronAPI.document.generateKwitansi(props.requestId, options)
        break
      case 'spp':
        result = await window.electronAPI.document.generateSPP(props.requestId, options)
        break
      case 'spm':
        result = await window.electronAPI.document.generateSPM(props.requestId, options)
        break
      default:
        throw new Error(`Unknown document type: ${docType}`)
    }

    if (result.success) {
      await loadGeneratedDocuments()
      showDocumentGenerator.value = false
      alert(`Dokumen ${docType.toUpperCase()} berhasil di-generate!`)
    } else {
      alert('Gagal generate dokumen: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error generating document:', err)
    alert('Gagal generate dokumen: ' + err.message)
  }
}

async function handleCreateContract(contractData) {
  try {
    const result = await window.electronAPI.contract.create({
      ...contractData,
      request_id: props.requestId
    })

    if (result.success) {
      await loadContract()
      alert('Kontrak berhasil dibuat!')
    } else {
      alert('Gagal membuat kontrak: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error creating contract:', err)
    alert('Gagal membuat kontrak: ' + err.message)
  }
}

async function handleCreatePayment(paymentData) {
  try {
    const result = await window.electronAPI.payment.create({
      ...paymentData,
      contract_id: contract.value.id
    })

    if (result.success) {
      await loadPayments()
      alert('Pembayaran berhasil ditambahkan!')
    } else {
      alert('Gagal menambah pembayaran: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error creating payment:', err)
    alert('Gagal menambah pembayaran: ' + err.message)
  }
}

async function handleStatusChange(newStatus, notes) {
  try {
    let result

    switch (newStatus) {
      case 'pending':
        result = await window.electronAPI.request.submit(props.requestId)
        break
      case 'approved':
        result = await window.electronAPI.request.approve(props.requestId, props.userId, notes)
        break
      case 'rejected':
        result = await window.electronAPI.request.reject(props.requestId, props.userId, notes)
        break
      case 'cancelled':
        result = await window.electronAPI.request.cancel(props.requestId, notes)
        break
      case 'completed':
        result = await window.electronAPI.request.complete(props.requestId)
        break
      default:
        result = await window.electronAPI.request.update(props.requestId, { status: newStatus })
    }

    if (result.success) {
      await loadRequest()
      showStatusModal.value = false
      emit('updated', request.value)
    } else {
      alert('Gagal mengubah status: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error changing status:', err)
    alert('Gagal mengubah status: ' + err.message)
  }
}

function printRequest() {
  window.print()
}

async function exportRequest() {
  try {
    const result = await window.electronAPI.dialog.showSaveDialog({
      defaultPath: `${request.value.request_number.replace(/\//g, '-')}.json`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] }
      ]
    })

    if (!result.canceled && result.filePath) {
      const exportData = {
        request: request.value,
        documents: documents.value,
        approvals: approvals.value,
        contract: contract.value,
        payments: payments.value,
        exportedAt: new Date().toISOString()
      }

      const fs = require('fs')
      fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2))
      alert('Data berhasil diekspor!')
    }
  } catch (err) {
    console.error('Error exporting:', err)
    alert('Gagal mengekspor: ' + err.message)
  }
}

// Watch for requestId changes
watch(() => props.requestId, () => {
  loadRequest()
})

// Lifecycle
onMounted(() => {
  loadRequest()
})
</script>

<style scoped>
.request-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header Styles */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.2s;
}

.btn-back:hover {
  background: #e5e7eb;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-number {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.request-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tier-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.tier-badge.tier-tier1 { background: #dbeafe; color: #1e40af; }
.tier-badge.tier-tier2 { background: #fef3c7; color: #92400e; }
.tier-badge.tier-tier3 { background: #fce7f3; color: #9d174d; }

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.status-draft { background: #f3f4f6; color: #4b5563; }
.status-badge.status-pending { background: #fef3c7; color: #92400e; }
.status-badge.status-approved { background: #d1fae5; color: #065f46; }
.status-badge.status-rejected { background: #fee2e2; color: #991b1b; }
.status-badge.status-in_progress { background: #dbeafe; color: #1e40af; }
.status-badge.status-completed { background: #d1fae5; color: #065f46; }
.status-badge.status-cancelled { background: #f3f4f6; color: #4b5563; }

.meta-date {
  font-size: 14px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Button Styles */
.btn {
  padding: 8px 16px;
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

.btn-danger {
  background: #fee2e2;
  color: #991b1b;
}

.btn-danger:hover {
  background: #fecaca;
}

/* Loading State */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #991b1b;
  margin-bottom: 16px;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.tab-button.active .tab-badge {
  background: #dbeafe;
  color: #1e40af;
}

/* Tab Content */
.tab-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-pane {
  padding: 24px;
}

/* Print Styles */
@media print {
  .header-actions,
  .btn-back,
  .tab-navigation {
    display: none !important;
  }

  .tab-content {
    box-shadow: none;
  }
}
</style>
