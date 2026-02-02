<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Generate Dokumen</h3>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Pilih jenis dokumen yang ingin di-generate untuk pengajuan
          <strong>{{ request.request_number }}</strong>
        </p>

        <!-- Document Type Selection -->
        <div class="document-types">
          <div
            v-for="docType in availableDocTypes"
            :key="docType.id"
            :class="['doc-type-card', { selected: selectedType === docType.id }]"
            @click="selectDocType(docType.id)"
          >
            <span class="doc-icon">{{ docType.icon }}</span>
            <div class="doc-info">
              <span class="doc-name">{{ docType.name }}</span>
              <span class="doc-desc">{{ docType.description }}</span>
            </div>
            <span v-if="selectedType === docType.id" class="check-icon">✓</span>
          </div>
        </div>

        <!-- Additional Options -->
        <div v-if="selectedType" class="generation-options">
          <h4>Opsi Tambahan</h4>

          <!-- Signer Information -->
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label>Nama PPK</label>
                <input
                  v-model="options.ppk_name"
                  type="text"
                  class="form-control"
                  placeholder="Nama lengkap PPK"
                />
              </div>
              <div class="form-group">
                <label>NIP PPK</label>
                <input
                  v-model="options.ppk_nip"
                  type="text"
                  class="form-control"
                  placeholder="NIP"
                />
              </div>
            </div>
          </div>

          <!-- Tax Options (for Kwitansi) -->
          <div v-if="selectedType === 'kwitansi'" class="form-section">
            <h5>Pengaturan Pajak</h5>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" v-model="options.include_pph" />
                <span>Sertakan PPh 22 (1.5%)</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="options.include_ppn" />
                <span>Sertakan PPN (11%)</span>
              </label>
            </div>
          </div>

          <!-- SPM Options -->
          <div v-if="selectedType === 'spm'" class="form-section">
            <h5>Informasi Pembayaran</h5>
            <div class="form-row">
              <div class="form-group">
                <label>Nama Bank</label>
                <input
                  v-model="options.bank_name"
                  type="text"
                  class="form-control"
                  placeholder="Nama bank"
                />
              </div>
              <div class="form-group">
                <label>No. Rekening</label>
                <input
                  v-model="options.bank_account"
                  type="text"
                  class="form-control"
                  placeholder="Nomor rekening"
                />
              </div>
            </div>
            <div class="form-group">
              <label>Nama Pemilik Rekening</label>
              <input
                v-model="options.bank_account_name"
                type="text"
                class="form-control"
                placeholder="Nama pemilik rekening"
              />
            </div>
          </div>
        </div>

        <!-- Preview Info -->
        <div v-if="selectedType" class="preview-info">
          <div class="preview-item">
            <span class="preview-label">Nomor Pengajuan</span>
            <span class="preview-value">{{ request.request_number }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Nama Barang/Jasa</span>
            <span class="preview-value">{{ request.item_name }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Nilai</span>
            <span class="preview-value">{{ formatCurrency(request.estimated_value) }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Batal</button>
        <button
          @click="handleGenerate"
          :disabled="!selectedType || generating"
          class="btn btn-primary"
        >
          {{ generating ? 'Generating...' : 'Generate Dokumen' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  request: { type: Object, required: true }
})

const emit = defineEmits(['close', 'generate'])

const selectedType = ref('')
const generating = ref(false)

const options = ref({
  ppk_name: '',
  ppk_nip: '',
  include_pph: true,
  include_ppn: true,
  bank_name: '',
  bank_account: '',
  bank_account_name: ''
})

const availableDocTypes = computed(() => {
  const types = [
    {
      id: 'kwitansi',
      name: 'Kwitansi',
      description: 'Bukti penerimaan pembayaran',
      icon: '🧾'
    },
    {
      id: 'spp',
      name: 'SPP',
      description: 'Surat Permintaan Pembayaran',
      icon: '📋'
    },
    {
      id: 'spm',
      name: 'SPM',
      description: 'Surat Perintah Membayar',
      icon: '💳'
    }
  ]

  return types
})

function selectDocType(typeId) {
  selectedType.value = typeId
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0)
}

async function handleGenerate() {
  if (!selectedType.value) return

  generating.value = true

  try {
    emit('generate', selectedType.value, { ...options.value })
  } finally {
    generating.value = false
  }
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
  flex: 1;
}

.modal-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Document Types */
.document-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.doc-type-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.doc-type-card:hover {
  border-color: #d1d5db;
}

.doc-type-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.doc-icon {
  font-size: 32px;
}

.doc-info {
  flex: 1;
}

.doc-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.doc-desc {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.check-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  font-size: 14px;
}

/* Generation Options */
.generation-options {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 20px;
}

.generation-options h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.generation-options h5 {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin: 16px 0 12px 0;
}

.form-section {
  margin-bottom: 16px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
}

/* Preview Info */
.preview-info {
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #bbf7d0;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-label {
  font-size: 13px;
  color: #6b7280;
}

.preview-value {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
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

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
