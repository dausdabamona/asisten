<template>
  <div class="request-contract">
    <!-- No Contract State -->
    <div v-if="!contract" class="no-contract">
      <div class="empty-state">
        <span class="empty-icon">📄</span>
        <h3>Belum Ada Kontrak</h3>
        <p>Buat kontrak untuk pengajuan ini setelah disetujui</p>
        <button
          v-if="canCreateContract"
          @click="showCreateModal = true"
          class="btn btn-primary"
        >
          Buat Kontrak
        </button>
      </div>
    </div>

    <!-- Contract Details -->
    <div v-else class="contract-details">
      <!-- Contract Header -->
      <div class="contract-header">
        <div class="contract-info">
          <h3 class="contract-number">{{ contract.contract_number }}</h3>
          <span :class="['status-badge', `status-${contract.status}`]">
            {{ getStatusLabel(contract.status) }}
          </span>
        </div>
        <div class="contract-actions">
          <button @click="generateContractPdf" class="btn btn-secondary">
            Generate PDF
          </button>
          <button v-if="contract.status === 'draft'" @click="activateContract" class="btn btn-primary">
            Aktifkan Kontrak
          </button>
        </div>
      </div>

      <!-- Contract Summary -->
      <div class="contract-summary">
        <div class="summary-item">
          <span class="summary-label">Nilai Kontrak</span>
          <span class="summary-value highlight">{{ formatCurrency(contract.contract_value) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Vendor</span>
          <span class="summary-value">{{ vendor?.name || contract.vendor_id }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Periode</span>
          <span class="summary-value">
            {{ formatDate(contract.start_date) }} - {{ formatDate(contract.end_date) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Metode Pembayaran</span>
          <span class="summary-value">{{ getPaymentMethodLabel(contract.payment_method) }}</span>
        </div>
      </div>

      <!-- Contract Details Grid -->
      <div class="details-section">
        <h4 class="section-title">Detail Kontrak</h4>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Tanggal Ditandatangani</span>
            <span class="detail-value">{{ formatDate(contract.signed_date) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Ditandatangani Oleh</span>
            <span class="detail-value">{{ contract.signed_by || '-' }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Ketentuan Pembayaran</span>
            <span class="detail-value">{{ contract.payment_terms || '-' }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Catatan</span>
            <span class="detail-value">{{ contract.notes || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Vendor Information -->
      <div v-if="vendor" class="details-section">
        <h4 class="section-title">Informasi Vendor</h4>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Nama Vendor</span>
            <span class="detail-value">{{ vendor.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">NPWP</span>
            <span class="detail-value">{{ vendor.npwp || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Alamat</span>
            <span class="detail-value">{{ vendor.address || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Telepon</span>
            <span class="detail-value">{{ vendor.phone || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ vendor.email || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Rating</span>
            <span class="detail-value">
              <span class="rating-stars">{{ getRatingStars(vendor.performance_rating) }}</span>
              ({{ vendor.performance_rating?.toFixed(1) || '0.0' }})
            </span>
          </div>
        </div>
      </div>

      <!-- Contract Timeline -->
      <div class="details-section">
        <h4 class="section-title">Timeline Kontrak</h4>
        <div class="timeline-bar">
          <div class="timeline-track">
            <div
              class="timeline-progress"
              :style="{ width: getProgressPercentage() + '%' }"
            ></div>
          </div>
          <div class="timeline-labels">
            <span>{{ formatDate(contract.start_date) }}</span>
            <span class="timeline-remaining">
              {{ getRemainingDays() }}
            </span>
            <span>{{ formatDate(contract.end_date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Contract Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Buat Kontrak Baru</h3>
          <button @click="showCreateModal = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Vendor *</label>
            <select v-model="contractForm.vendor_id" class="form-control" required>
              <option value="">Pilih Vendor</option>
              <option v-for="v in vendors" :key="v.id" :value="v.id">
                {{ v.name }} ({{ v.npwp || 'No NPWP' }})
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Nilai Kontrak *</label>
              <input
                v-model.number="contractForm.contract_value"
                type="number"
                class="form-control"
                :placeholder="request.estimated_value"
                required
              />
            </div>
            <div class="form-group">
              <label>Metode Pembayaran *</label>
              <select v-model="contractForm.payment_method" class="form-control" required>
                <option value="transfer">Transfer Bank</option>
                <option value="cash">Tunai</option>
                <option value="cheque">Cek</option>
                <option value="termin">Termin</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tanggal Mulai *</label>
              <input
                v-model="contractForm.start_date"
                type="date"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label>Tanggal Selesai *</label>
              <input
                v-model="contractForm.end_date"
                type="date"
                class="form-control"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>Ketentuan Pembayaran</label>
            <textarea
              v-model="contractForm.payment_terms"
              class="form-control"
              rows="3"
              placeholder="Contoh: Pembayaran 100% setelah pekerjaan selesai"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Catatan</label>
            <textarea
              v-model="contractForm.notes"
              class="form-control"
              rows="2"
              placeholder="Catatan tambahan"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn btn-secondary">Batal</button>
          <button
            @click="createContract"
            :disabled="!isFormValid"
            class="btn btn-primary"
          >
            Buat Kontrak
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  request: { type: Object, required: true },
  contract: { type: Object, default: null }
})

const emit = defineEmits(['create-contract'])

const showCreateModal = ref(false)
const vendors = ref([])
const vendor = ref(null)

const contractForm = ref({
  vendor_id: '',
  contract_value: 0,
  payment_method: 'transfer',
  start_date: '',
  end_date: '',
  payment_terms: '',
  notes: ''
})

const canCreateContract = computed(() => {
  return props.request.status === 'approved' || props.request.status === 'in_progress'
})

const isFormValid = computed(() => {
  return contractForm.value.vendor_id &&
         contractForm.value.contract_value > 0 &&
         contractForm.value.start_date &&
         contractForm.value.end_date
})

function getStatusLabel(status) {
  const labels = {
    draft: 'Draft',
    active: 'Aktif',
    completed: 'Selesai',
    terminated: 'Dibatalkan',
    expired: 'Kadaluarsa'
  }
  return labels[status] || status
}

function getPaymentMethodLabel(method) {
  const labels = {
    transfer: 'Transfer Bank',
    cash: 'Tunai',
    cheque: 'Cek',
    termin: 'Termin'
  }
  return labels[method] || method
}

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

function getRatingStars(rating) {
  const filled = Math.round(rating || 0)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

function getProgressPercentage() {
  if (!props.contract) return 0

  const start = new Date(props.contract.start_date).getTime()
  const end = new Date(props.contract.end_date).getTime()
  const now = Date.now()

  if (now < start) return 0
  if (now > end) return 100

  return Math.round(((now - start) / (end - start)) * 100)
}

function getRemainingDays() {
  if (!props.contract) return ''

  const end = new Date(props.contract.end_date).getTime()
  const now = Date.now()
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24))

  if (days < 0) return 'Sudah berakhir'
  if (days === 0) return 'Berakhir hari ini'
  return `${days} hari tersisa`
}

async function loadVendors() {
  try {
    const result = await window.electronAPI.vendor.getActive()
    if (result.success) {
      vendors.value = result.data || []
    }
  } catch (err) {
    console.error('Error loading vendors:', err)
  }
}

async function loadVendorDetails() {
  if (!props.contract?.vendor_id) return

  try {
    const result = await window.electronAPI.vendor.getById(props.contract.vendor_id)
    if (result.success) {
      vendor.value = result.data
    }
  } catch (err) {
    console.error('Error loading vendor:', err)
  }
}

function createContract() {
  if (!isFormValid.value) return

  emit('create-contract', {
    ...contractForm.value,
    request_id: props.request.id
  })

  showCreateModal.value = false
}

async function generateContractPdf() {
  try {
    const result = await window.electronAPI.document.generateContractDoc(props.contract.id)
    if (result.success) {
      alert('PDF kontrak berhasil di-generate!')
    } else {
      alert('Gagal generate PDF: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error generating contract PDF:', err)
    alert('Gagal generate PDF: ' + err.message)
  }
}

async function activateContract() {
  try {
    const result = await window.electronAPI.contract.activate(
      props.contract.id,
      null, // signedBy
      new Date().toISOString()
    )
    if (result.success) {
      alert('Kontrak berhasil diaktifkan!')
      // Reload data
    } else {
      alert('Gagal mengaktifkan kontrak: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error activating contract:', err)
    alert('Gagal mengaktifkan kontrak: ' + err.message)
  }
}

onMounted(() => {
  loadVendors()
  if (props.contract) {
    loadVendorDetails()
  }

  // Initialize form with request data
  contractForm.value.contract_value = props.request.estimated_value
  contractForm.value.start_date = new Date().toISOString().split('T')[0]
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30)
  contractForm.value.end_date = endDate.toISOString().split('T')[0]
})
</script>

<style scoped>
.request-contract {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Empty State */
.no-contract {
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: #f9fafb;
  border-radius: 12px;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #374151;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
}

/* Contract Header */
.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 12px;
}

.contract-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.contract-number {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e40af;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.status-draft { background: #f3f4f6; color: #4b5563; }
.status-badge.status-active { background: #d1fae5; color: #065f46; }
.status-badge.status-completed { background: #dbeafe; color: #1e40af; }
.status-badge.status-terminated { background: #fee2e2; color: #991b1b; }
.status-badge.status-expired { background: #fef3c7; color: #92400e; }

.contract-actions {
  display: flex;
  gap: 8px;
}

/* Contract Summary */
.contract-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.summary-value.highlight {
  font-size: 20px;
  color: #2563eb;
}

/* Details Section */
.details-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
}

.detail-value {
  font-size: 14px;
  color: #111827;
}

.rating-stars {
  color: #f59e0b;
}

/* Timeline Bar */
.timeline-bar {
  padding: 16px 0;
}

.timeline-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.timeline-progress {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  border-radius: 4px;
  transition: width 0.3s;
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.timeline-remaining {
  font-weight: 500;
  color: #374151;
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
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Form */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

textarea.form-control {
  resize: vertical;
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }

  .detail-item.full-width {
    grid-column: span 1;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
