<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header danger">
        <h3>Hapus Pengajuan</h3>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>

      <div class="modal-body">
        <div class="warning-icon">⚠️</div>

        <div class="delete-info">
          <p class="request-number">{{ request.request_number }}</p>
          <p class="item-name">{{ request.item_name }}</p>
          <p class="value">{{ formatCurrency(request.estimated_value) }}</p>
        </div>

        <div class="delete-options">
          <!-- Soft Delete Option -->
          <div class="delete-option" @click="deleteType = 'soft'">
            <input
              type="radio"
              v-model="deleteType"
              value="soft"
              id="soft-delete"
            />
            <label for="soft-delete">
              <span class="option-title">Arsipkan (Soft Delete)</span>
              <span class="option-desc">
                Data tidak akan ditampilkan tetapi masih tersimpan di database.
                Dapat dipulihkan oleh administrator.
              </span>
            </label>
          </div>

          <!-- Hard Delete Option (Admin Only) -->
          <div
            v-if="isAdmin"
            class="delete-option"
            @click="deleteType = 'hard'"
          >
            <input
              type="radio"
              v-model="deleteType"
              value="hard"
              id="hard-delete"
            />
            <label for="hard-delete">
              <span class="option-title">Hapus Permanen (Hard Delete)</span>
              <span class="option-desc danger-text">
                Data akan dihapus secara permanen dan tidak dapat dipulihkan.
                Semua dokumen terkait juga akan dihapus.
              </span>
            </label>
          </div>
        </div>

        <!-- Confirmation Input for Hard Delete -->
        <div v-if="deleteType === 'hard'" class="confirm-input">
          <p class="confirm-instruction">
            Ketik <strong>{{ request.request_number }}</strong> untuk konfirmasi penghapusan permanen:
          </p>
          <input
            v-model="confirmText"
            type="text"
            class="form-control"
            :placeholder="request.request_number"
          />
        </div>

        <!-- Dependencies Warning -->
        <div v-if="hasDependencies" class="dependencies-warning">
          <span class="warning-icon">⚠️</span>
          <div class="warning-content">
            <strong>Perhatian!</strong>
            <p>Pengajuan ini memiliki data terkait yang juga akan dihapus:</p>
            <ul>
              <li v-if="dependencyCount.documents > 0">
                {{ dependencyCount.documents }} dokumen
              </li>
              <li v-if="dependencyCount.approvals > 0">
                {{ dependencyCount.approvals }} riwayat persetujuan
              </li>
              <li v-if="dependencyCount.contract">
                1 kontrak aktif
              </li>
              <li v-if="dependencyCount.payments > 0">
                {{ dependencyCount.payments }} pembayaran
              </li>
            </ul>
          </div>
        </div>

        <!-- Reason Input -->
        <div class="form-group">
          <label>Alasan Penghapusan</label>
          <textarea
            v-model="deleteReason"
            class="form-control"
            rows="2"
            placeholder="Berikan alasan penghapusan (opsional)"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Batal</button>
        <button
          @click="handleDelete"
          :disabled="!canDelete"
          class="btn btn-danger"
        >
          {{ deleteType === 'hard' ? 'Hapus Permanen' : 'Arsipkan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  request: { type: Object, required: true },
  isAdmin: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'soft-delete', 'hard-delete'])

const deleteType = ref('soft')
const confirmText = ref('')
const deleteReason = ref('')
const dependencyCount = ref({
  documents: 0,
  approvals: 0,
  contract: false,
  payments: 0
})

const hasDependencies = computed(() => {
  return dependencyCount.value.documents > 0 ||
         dependencyCount.value.approvals > 0 ||
         dependencyCount.value.contract ||
         dependencyCount.value.payments > 0
})

const canDelete = computed(() => {
  if (deleteType.value === 'hard') {
    return confirmText.value === props.request.request_number
  }
  return true
})

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0)
}

function handleDelete() {
  if (!canDelete.value) return

  if (deleteType.value === 'hard') {
    emit('hard-delete', deleteReason.value)
  } else {
    emit('soft-delete', deleteReason.value)
  }
}

async function loadDependencies() {
  try {
    // Load documents
    const docsResult = await window.electronAPI.document.getByRequest(props.request.id)
    if (docsResult.success) {
      dependencyCount.value.documents = docsResult.data?.length || 0
    }

    // Load approvals from request
    if (props.request.approvals) {
      dependencyCount.value.approvals = props.request.approvals.length
    }

    // Load contract
    const contractResult = await window.electronAPI.contract.getByRequest(props.request.id)
    if (contractResult.success && contractResult.data?.length > 0) {
      dependencyCount.value.contract = true

      // Load payments
      const paymentsResult = await window.electronAPI.payment.getByContract(contractResult.data[0].id)
      if (paymentsResult.success) {
        dependencyCount.value.payments = paymentsResult.data?.length || 0
      }
    }
  } catch (err) {
    console.error('Error loading dependencies:', err)
  }
}

onMounted(() => {
  loadDependencies()
})
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

.modal-header.danger {
  background: #fef2f2;
  border-bottom-color: #fecaca;
}

.modal-header.danger h3 {
  color: #991b1b;
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

.warning-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.delete-info {
  text-align: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.request-number {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.item-name {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.value {
  font-size: 18px;
  font-weight: 600;
  color: #2563eb;
  margin: 0;
}

/* Delete Options */
.delete-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.delete-option {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-option:hover {
  border-color: #d1d5db;
}

.delete-option input[type="radio"] {
  margin-top: 4px;
}

.delete-option label {
  flex: 1;
  cursor: pointer;
}

.option-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.option-desc {
  display: block;
  font-size: 13px;
  color: #6b7280;
}

.option-desc.danger-text {
  color: #dc2626;
}

/* Confirm Input */
.confirm-input {
  margin-bottom: 20px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
}

.confirm-instruction {
  font-size: 14px;
  color: #991b1b;
  margin: 0 0 12px 0;
}

/* Dependencies Warning */
.dependencies-warning {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  margin-bottom: 20px;
}

.warning-content {
  flex: 1;
}

.warning-content strong {
  color: #92400e;
}

.warning-content p {
  font-size: 13px;
  color: #374151;
  margin: 4px 0 8px 0;
}

.warning-content ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #6b7280;
}

/* Form */
.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
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

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
