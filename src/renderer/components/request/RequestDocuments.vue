<template>
  <div class="request-documents">
    <!-- Document Actions -->
    <div class="documents-header">
      <h3 class="section-title">Dokumen Pengadaan</h3>
      <div class="header-actions">
        <button @click="showUploadDialog" class="btn btn-primary">
          <span class="icon">📤</span> Unggah Dokumen
        </button>
      </div>
    </div>

    <!-- Generated Documents Section -->
    <div class="documents-section">
      <h4 class="subsection-title">Dokumen yang Di-Generate</h4>
      <div v-if="generatedDocuments.length === 0" class="no-documents">
        <p>Belum ada dokumen yang di-generate</p>
        <div class="generate-buttons">
          <button @click="$emit('regenerate', 'kwitansi')" class="btn btn-secondary">
            Generate Kwitansi
          </button>
          <button @click="$emit('regenerate', 'spp')" class="btn btn-secondary">
            Generate SPP
          </button>
          <button @click="$emit('regenerate', 'spm')" class="btn btn-secondary">
            Generate SPM
          </button>
        </div>
      </div>
      <div v-else class="documents-grid">
        <div
          v-for="doc in generatedDocuments"
          :key="doc.id"
          class="document-card generated"
        >
          <div class="doc-icon">📄</div>
          <div class="doc-info">
            <span class="doc-type">{{ getDocTypeLabel(doc.doc_type) }}</span>
            <span class="doc-number">{{ doc.doc_number }}</span>
            <span class="doc-date">{{ formatDate(doc.created_at) }}</span>
            <span v-if="doc.version > 1" class="doc-version">Versi {{ doc.version }}</span>
          </div>
          <div class="doc-actions">
            <button @click="openDocument(doc)" class="btn-icon" title="Buka">
              👁️
            </button>
            <button @click="downloadDocument(doc)" class="btn-icon" title="Unduh">
              📥
            </button>
            <button @click="$emit('regenerate', doc.doc_type)" class="btn-icon" title="Generate Ulang">
              🔄
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Uploaded Documents Section -->
    <div class="documents-section">
      <h4 class="subsection-title">Dokumen Terlampir</h4>
      <div v-if="documents.length === 0" class="no-documents">
        <p>Belum ada dokumen terlampir</p>
      </div>
      <div v-else class="documents-grid">
        <div
          v-for="doc in documents"
          :key="doc.id"
          class="document-card"
        >
          <div class="doc-icon">{{ getFileIcon(doc.mime_type) }}</div>
          <div class="doc-info">
            <span class="doc-name">{{ doc.original_name || doc.file_name }}</span>
            <span class="doc-meta">
              {{ getFileTypeLabel(doc.file_type) }} • {{ formatFileSize(doc.file_size) }}
            </span>
            <span class="doc-date">{{ formatDate(doc.uploaded_at) }}</span>
          </div>
          <div class="doc-actions">
            <button @click="$emit('download', doc)" class="btn-icon" title="Unduh">
              📥
            </button>
            <button @click="$emit('delete', doc.id)" class="btn-icon danger" title="Hapus">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Checklist (Tier 3) -->
    <div v-if="request.tier === 'tier3'" class="documents-section">
      <h4 class="subsection-title">Checklist Kelengkapan Dokumen</h4>
      <div class="checklist">
        <div
          v-for="item in requiredDocuments"
          :key="item.type"
          :class="['checklist-item', { completed: isDocumentUploaded(item.type) }]"
        >
          <span class="check-icon">{{ isDocumentUploaded(item.type) ? '✅' : '⬜' }}</span>
          <span class="check-label">{{ item.label }}</span>
          <span v-if="item.required" class="check-required">Wajib</span>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <div v-if="showUpload" class="modal-overlay" @click.self="showUpload = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Unggah Dokumen</h3>
          <button @click="showUpload = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Jenis Dokumen</label>
            <select v-model="uploadForm.file_type" class="form-control">
              <option value="proposal">Proposal/Penawaran</option>
              <option value="quotation">Penawaran Harga</option>
              <option value="invoice">Invoice/Faktur</option>
              <option value="receipt">Kwitansi</option>
              <option value="contract">Kontrak/SPK</option>
              <option value="report">Laporan</option>
              <option value="photo">Foto Dokumentasi</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <div class="form-group">
            <label>File</label>
            <div
              class="file-dropzone"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleFileDrop"
              :class="{ dragging: isDragging }"
            >
              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                style="display: none"
              />
              <div v-if="!uploadForm.file" class="dropzone-content">
                <span class="dropzone-icon">📁</span>
                <p>Drag & drop file atau <button @click="$refs.fileInput.click()" class="link-button">pilih file</button></p>
                <span class="dropzone-hint">PDF, DOC, XLS, JPG, PNG (max 10MB)</span>
              </div>
              <div v-else class="selected-file">
                <span class="file-icon">{{ getFileIcon(uploadForm.file.type) }}</span>
                <span class="file-name">{{ uploadForm.file.name }}</span>
                <button @click="uploadForm.file = null" class="btn-remove">×</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUpload = false" class="btn btn-secondary">Batal</button>
          <button
            @click="handleUpload"
            :disabled="!uploadForm.file || uploading"
            class="btn btn-primary"
          >
            {{ uploading ? 'Mengunggah...' : 'Unggah' }}
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
  documents: { type: Array, default: () => [] },
  generatedDocuments: { type: Array, default: () => [] }
})

const emit = defineEmits(['upload', 'download', 'delete', 'regenerate'])

const showUpload = ref(false)
const isDragging = ref(false)
const uploading = ref(false)
const fileInput = ref(null)

const uploadForm = ref({
  file_type: 'other',
  file: null
})

const requiredDocuments = [
  { type: 'kak', label: 'Kerangka Acuan Kerja (KAK)', required: true },
  { type: 'hps', label: 'Harga Perkiraan Sendiri (HPS)', required: true },
  { type: 'rab', label: 'Rincian Anggaran Biaya (RAB)', required: true },
  { type: 'specification', label: 'Spesifikasi Teknis', required: true },
  { type: 'qualification', label: 'Persyaratan Kualifikasi', required: true },
  { type: 'evaluation', label: 'Kriteria Evaluasi', required: true },
  { type: 'drawing', label: 'Gambar Teknis', required: false },
  { type: 'schedule', label: 'Jadwal Pelaksanaan', required: true },
  { type: 'risk', label: 'Analisis Risiko', required: false },
  { type: 'sustainability', label: 'Dokumen Keberlanjutan', required: false }
]

function getDocTypeLabel(type) {
  const labels = {
    kwitansi: 'Kwitansi',
    spp: 'SPP',
    spm: 'SPM',
    contract: 'Kontrak',
    bast: 'BAST',
    request_pdf: 'Nota Dinas',
    contract_pdf: 'SPK',
    payment_voucher: 'Voucher Pembayaran'
  }
  return labels[type] || type
}

function getFileTypeLabel(type) {
  const labels = {
    proposal: 'Proposal',
    quotation: 'Penawaran Harga',
    invoice: 'Invoice',
    receipt: 'Kwitansi',
    contract: 'Kontrak',
    report: 'Laporan',
    photo: 'Foto',
    other: 'Lainnya'
  }
  return labels[type] || type
}

function getFileIcon(mimeType) {
  if (!mimeType) return '📄'
  if (mimeType.includes('pdf')) return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📘'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗'
  if (mimeType.includes('image')) return '🖼️'
  return '📄'
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '-'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function isDocumentUploaded(type) {
  return props.documents.some(doc => doc.file_type === type)
}

function showUploadDialog() {
  uploadForm.value = { file_type: 'other', file: null }
  showUpload.value = true
}

function handleFileDrop(event) {
  isDragging.value = false
  const files = event.dataTransfer.files
  if (files.length > 0) {
    uploadForm.value.file = files[0]
  }
}

function handleFileSelect(event) {
  const files = event.target.files
  if (files.length > 0) {
    uploadForm.value.file = files[0]
  }
}

async function handleUpload() {
  if (!uploadForm.value.file) return

  uploading.value = true

  try {
    const reader = new FileReader()
    reader.onload = async () => {
      emit('upload', {
        data: reader.result,
        name: uploadForm.value.file.name,
        type: uploadForm.value.file_type,
        mimeType: uploadForm.value.file.type,
        size: uploadForm.value.file.size
      })
      showUpload.value = false
      uploadForm.value = { file_type: 'other', file: null }
    }
    reader.readAsDataURL(uploadForm.value.file)
  } catch (err) {
    console.error('Upload error:', err)
    alert('Gagal mengunggah file: ' + err.message)
  } finally {
    uploading.value = false
  }
}

async function openDocument(doc) {
  try {
    const { shell } = require('electron')
    shell.openPath(doc.file_path)
  } catch (err) {
    console.error('Error opening document:', err)
    alert('Gagal membuka dokumen')
  }
}

async function downloadDocument(doc) {
  emit('download', doc)
}
</script>

<style scoped>
.request-documents {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.documents-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.document-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.document-card.generated {
  border-color: #93c5fd;
  background: #eff6ff;
}

.doc-icon {
  font-size: 32px;
}

.doc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.doc-type {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.doc-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-number,
.doc-meta {
  font-size: 12px;
  color: #6b7280;
}

.doc-date {
  font-size: 11px;
  color: #9ca3af;
}

.doc-version {
  font-size: 11px;
  color: #2563eb;
  font-weight: 500;
}

.doc-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background: #e5e7eb;
}

.btn-icon.danger:hover {
  background: #fee2e2;
}

.no-documents {
  text-align: center;
  padding: 32px;
  color: #6b7280;
}

.generate-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}

/* Checklist */
.checklist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.checklist-item.completed {
  border-color: #86efac;
  background: #f0fdf4;
}

.check-icon {
  font-size: 18px;
}

.check-label {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.check-required {
  font-size: 11px;
  color: #dc2626;
  font-weight: 500;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.file-dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s;
}

.file-dropzone.dragging {
  border-color: #2563eb;
  background: #eff6ff;
}

.dropzone-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.dropzone-hint {
  font-size: 12px;
  color: #9ca3af;
}

.link-button {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 32px;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  cursor: pointer;
}
</style>
