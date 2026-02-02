<template>
  <div class="request-payments">
    <!-- Payment Summary -->
    <div class="payment-summary">
      <div class="summary-card">
        <span class="summary-label">Total Nilai Kontrak</span>
        <span class="summary-value">{{ formatCurrency(contractValue) }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Total Dibayar</span>
        <span class="summary-value paid">{{ formatCurrency(totalPaid) }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Sisa Pembayaran</span>
        <span class="summary-value remaining">{{ formatCurrency(remainingAmount) }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Progress</span>
        <span class="summary-value">{{ progressPercentage }}%</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="payments-header">
      <h3 class="section-title">Daftar Pembayaran</h3>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + Tambah Pembayaran
      </button>
    </div>

    <!-- Payments List -->
    <div v-if="payments.length === 0" class="no-payments">
      <p>Belum ada pembayaran</p>
    </div>

    <div v-else class="payments-list">
      <div
        v-for="payment in sortedPayments"
        :key="payment.id"
        :class="['payment-card', `status-${payment.status}`]"
      >
        <div class="payment-header">
          <div class="payment-info">
            <span class="payment-number">{{ payment.payment_number }}</span>
            <span :class="['status-badge', `status-${payment.status}`]">
              {{ getStatusLabel(payment.status) }}
            </span>
          </div>
          <span class="payment-amount">{{ formatCurrency(payment.amount) }}</span>
        </div>

        <div class="payment-details">
          <div class="detail-item">
            <span class="detail-label">Jatuh Tempo</span>
            <span class="detail-value">{{ formatDate(payment.due_date) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Tanggal Bayar</span>
            <span class="detail-value">{{ formatDate(payment.payment_date) || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Metode</span>
            <span class="detail-value">{{ payment.payment_method || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">No. Referensi</span>
            <span class="detail-value">{{ payment.reference_number || '-' }}</span>
          </div>
        </div>

        <div v-if="payment.notes" class="payment-notes">
          <span class="notes-label">Catatan:</span>
          {{ payment.notes }}
        </div>

        <div class="payment-actions">
          <button
            v-if="payment.status === 'pending'"
            @click="processPayment(payment)"
            class="btn btn-sm btn-secondary"
          >
            Proses
          </button>
          <button
            v-if="payment.status === 'processing'"
            @click="showCompleteModal(payment)"
            class="btn btn-sm btn-success"
          >
            Selesaikan
          </button>
          <button
            v-if="payment.status === 'paid'"
            @click="generateVoucher(payment)"
            class="btn btn-sm btn-secondary"
          >
            Cetak Voucher
          </button>
        </div>
      </div>
    </div>

    <!-- Create Payment Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Tambah Pembayaran</h3>
          <button @click="showCreateModal = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nomor Pembayaran *</label>
            <input
              v-model="paymentForm.payment_number"
              type="text"
              class="form-control"
              :placeholder="`Termin ${payments.length + 1}`"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Jumlah *</label>
              <input
                v-model.number="paymentForm.amount"
                type="number"
                class="form-control"
                :max="remainingAmount"
                required
              />
              <span class="form-hint">Maksimal: {{ formatCurrency(remainingAmount) }}</span>
            </div>
            <div class="form-group">
              <label>Jatuh Tempo *</label>
              <input
                v-model="paymentForm.due_date"
                type="date"
                class="form-control"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>Metode Pembayaran</label>
            <select v-model="paymentForm.payment_method" class="form-control">
              <option value="">Pilih Metode</option>
              <option value="transfer">Transfer Bank</option>
              <option value="cash">Tunai</option>
              <option value="cheque">Cek</option>
            </select>
          </div>

          <div class="form-group">
            <label>Catatan</label>
            <textarea
              v-model="paymentForm.notes"
              class="form-control"
              rows="2"
              placeholder="Catatan pembayaran"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn btn-secondary">Batal</button>
          <button
            @click="createPayment"
            :disabled="!isFormValid"
            class="btn btn-primary"
          >
            Tambah
          </button>
        </div>
      </div>
    </div>

    <!-- Complete Payment Modal -->
    <div v-if="showComplete" class="modal-overlay" @click.self="showComplete = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Selesaikan Pembayaran</h3>
          <button @click="showComplete = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <p>
            <strong>{{ selectedPayment?.payment_number }}</strong><br>
            Jumlah: {{ formatCurrency(selectedPayment?.amount) }}
          </p>

          <div class="form-group">
            <label>Tanggal Pembayaran *</label>
            <input
              v-model="completeForm.payment_date"
              type="date"
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label>Nomor Referensi *</label>
            <input
              v-model="completeForm.reference_number"
              type="text"
              class="form-control"
              placeholder="Contoh: TRF-2024-001"
              required
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showComplete = false" class="btn btn-secondary">Batal</button>
          <button
            @click="completePayment"
            :disabled="!completeForm.payment_date || !completeForm.reference_number"
            class="btn btn-success"
          >
            Selesaikan
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
  payments: { type: Array, default: () => [] }
})

const emit = defineEmits(['create-payment'])

const showCreateModal = ref(false)
const showComplete = ref(false)
const selectedPayment = ref(null)

const paymentForm = ref({
  payment_number: '',
  amount: 0,
  due_date: '',
  payment_method: '',
  notes: ''
})

const completeForm = ref({
  payment_date: '',
  reference_number: ''
})

const contractValue = computed(() => {
  return props.request.estimated_value || 0
})

const totalPaid = computed(() => {
  return props.payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
})

const remainingAmount = computed(() => {
  return contractValue.value - totalPaid.value
})

const progressPercentage = computed(() => {
  if (contractValue.value === 0) return 0
  return Math.round((totalPaid.value / contractValue.value) * 100)
})

const sortedPayments = computed(() => {
  return [...props.payments].sort((a, b) => {
    // Sort by due_date, then by payment_number
    if (a.due_date && b.due_date) {
      return new Date(a.due_date) - new Date(b.due_date)
    }
    return (a.payment_number || '').localeCompare(b.payment_number || '')
  })
})

const isFormValid = computed(() => {
  return paymentForm.value.payment_number &&
         paymentForm.value.amount > 0 &&
         paymentForm.value.amount <= remainingAmount.value &&
         paymentForm.value.due_date
})

function getStatusLabel(status) {
  const labels = {
    pending: 'Menunggu',
    processing: 'Diproses',
    paid: 'Dibayar',
    failed: 'Gagal',
    cancelled: 'Dibatalkan'
  }
  return labels[status] || status
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0)
}

function formatDate(dateString) {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function createPayment() {
  if (!isFormValid.value) return

  emit('create-payment', {
    ...paymentForm.value,
    status: 'pending'
  })

  showCreateModal.value = false
  paymentForm.value = {
    payment_number: '',
    amount: 0,
    due_date: '',
    payment_method: '',
    notes: ''
  }
}

async function processPayment(payment) {
  try {
    const result = await window.electronAPI.payment.process(payment.id, null)
    if (result.success) {
      alert('Pembayaran sedang diproses')
      // Reload data
    } else {
      alert('Gagal memproses: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error processing payment:', err)
    alert('Gagal memproses: ' + err.message)
  }
}

function showCompleteModal(payment) {
  selectedPayment.value = payment
  completeForm.value = {
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: ''
  }
  showComplete.value = true
}

async function completePayment() {
  if (!selectedPayment.value) return

  try {
    const result = await window.electronAPI.payment.complete(
      selectedPayment.value.id,
      completeForm.value.reference_number,
      completeForm.value.payment_date
    )

    if (result.success) {
      alert('Pembayaran berhasil diselesaikan!')
      showComplete.value = false
      // Reload data
    } else {
      alert('Gagal menyelesaikan: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error completing payment:', err)
    alert('Gagal menyelesaikan: ' + err.message)
  }
}

async function generateVoucher(payment) {
  try {
    const result = await window.electronAPI.document.generatePaymentVoucherPdf(payment.id)
    if (result.success) {
      alert('Voucher berhasil di-generate!')
    } else {
      alert('Gagal generate voucher: ' + (result.error?.message || result.error))
    }
  } catch (err) {
    console.error('Error generating voucher:', err)
    alert('Gagal generate voucher: ' + err.message)
  }
}
</script>

<style scoped>
.request-payments {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Payment Summary */
.payment-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.summary-card {
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
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.summary-value.paid {
  color: #10b981;
}

.summary-value.remaining {
  color: #f59e0b;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  transition: width 0.3s;
}

/* Payments Header */
.payments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

/* No Payments */
.no-payments {
  text-align: center;
  padding: 40px;
  background: #f9fafb;
  border-radius: 12px;
  color: #6b7280;
}

/* Payments List */
.payments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-card {
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.payment-card.status-paid {
  border-color: #86efac;
  background: #f0fdf4;
}

.payment-card.status-processing {
  border-color: #93c5fd;
  background: #eff6ff;
}

.payment-card.status-failed {
  border-color: #fca5a5;
  background: #fef2f2;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.payment-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-number {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-pending { background: #fef3c7; color: #92400e; }
.status-badge.status-processing { background: #dbeafe; color: #1e40af; }
.status-badge.status-paid { background: #d1fae5; color: #065f46; }
.status-badge.status-failed { background: #fee2e2; color: #991b1b; }
.status-badge.status-cancelled { background: #f3f4f6; color: #4b5563; }

.payment-amount {
  font-size: 18px;
  font-weight: 600;
  color: #2563eb;
}

.payment-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
}

.detail-value {
  font-size: 13px;
  color: #111827;
}

.payment-notes {
  font-size: 13px;
  color: #6b7280;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.notes-label {
  font-weight: 500;
  color: #374151;
}

.payment-actions {
  display: flex;
  gap: 8px;
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

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
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
  max-width: 500px;
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

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .payment-details {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
