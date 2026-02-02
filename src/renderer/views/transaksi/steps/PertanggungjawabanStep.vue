<template>
  <div class="pertanggungjawaban-step">
    <!-- Context Information -->
    <div class="context-info">
      <div class="info-card">
        <span class="label">📋 LP Number:</span>
        <span class="value">LP-001-2026</span>
      </div>
      <div class="info-card">
        <span class="label">💰 Invoice Total:</span>
        <span class="value">Rp 20.000.000</span>
      </div>
      <div class="info-card">
        <span class="label">💳 DP Paid:</span>
        <span class="value">Rp 6.000.000</span>
      </div>
      <div class="info-card highlight">
        <span class="label">💵 Sisa Bayar:</span>
        <span class="value">Rp 14.000.000</span>
      </div>
    </div>

    <!-- Form Section -->
    <form @submit.prevent="submitPertanggungjawaban" class="pertanggungjawaban-form">
      <!-- Invoice Details -->
      <fieldset class="form-section">
        <legend>📄 Detail Nota Belanja</legend>

        <div class="form-row">
          <div class="form-group">
            <label for="invoice_number">Nomor Nota Belanja *</label>
            <input 
              id="invoice_number"
              v-model="form.invoice_number"
              type="text"
              placeholder="e.g., INV-202602-001"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="invoice_date">Tanggal Nota Belanja *</label>
            <input 
              id="invoice_date"
              v-model="form.invoice_date"
              type="date"
              class="form-input"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="vendor_name">Nama Vendor/Supplier *</label>
          <input 
            id="vendor_name"
            v-model="form.vendor_name"
            type="text"
            placeholder="e.g., PT ABC Supplier"
            class="form-input"
            required
          />
        </div>

        <!-- Upload Nota Belanja -->
        <div class="upload-field">
          <label for="invoice_file">Scan Nota Belanja (PDF/Image) *</label>
          <p class="help-text">Format: PDF, JPG, PNG (Max 5MB) - Pilih dokumen asli nota/invoice dari vendor</p>
          <div class="file-input-wrapper">
            <input 
              id="invoice_file"
              type="file"
              @change="onFileSelected('invoice')"
              accept=".pdf,.jpg,.jpeg,.png"
              class="file-input"
              required
            />
            <div class="file-display">
              <span v-if="!form.invoice_file" class="placeholder">
                📎 Klik untuk upload Nota Belanja
              </span>
              <span v-else class="file-selected">
                ✓ {{ form.invoice_file.name }}
              </span>
            </div>
          </div>
        </div>
      </fieldset>

      <!-- Invoice Items Table -->
      <fieldset class="form-section">
        <legend>📦 Detail Item Pembelian</legend>

        <div class="table-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Deskripsi Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Harga/Unit</th>
                <th>Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in form.items" :key="idx" class="item-row">
                <td class="text-center">{{ idx + 1 }}</td>
                <td>
                  <input 
                    v-model="item.description"
                    placeholder="Deskripsi item"
                    class="form-input-small"
                  />
                </td>
                <td>
                  <input 
                    v-model.number="item.qty"
                    type="number"
                    min="1"
                    placeholder="0"
                    class="form-input-small text-right"
                  />
                </td>
                <td>
                  <input 
                    v-model="item.unit"
                    placeholder="Unit"
                    class="form-input-small"
                  />
                </td>
                <td>
                  <input 
                    v-model.number="item.price"
                    type="number"
                    placeholder="0"
                    class="form-input-small text-right"
                    @input="updateItemTotal(idx)"
                  />
                </td>
                <td class="text-right total">
                  Rp {{ (item.qty * item.price).toLocaleString('id-ID') }}
                </td>
                <td class="text-center">
                  <button 
                    type="button"
                    @click="removeItem(idx)"
                    class="btn-delete"
                    v-if="form.items.length > 1"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5" class="text-right label">Total Pembelian:</td>
                <td class="text-right total-amount">
                  Rp {{ invoiceTotal.toLocaleString('id-ID') }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button 
          type="button"
          @click="addItemRow"
          class="btn btn-add-item"
        >
          + Tambah Item
        </button>
      </fieldset>

      <!-- Goods Receipt -->
      <fieldset class="form-section">
        <legend>✓ Bukti Terima Barang</legend>

        <div class="form-row">
          <div class="form-group">
            <label for="receipt_date">Tanggal Penerimaan Barang *</label>
            <input 
              id="receipt_date"
              v-model="form.receipt_date"
              type="date"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="received_by">Diterima oleh (Nama & NIP) *</label>
            <input 
              id="received_by"
              v-model="form.received_by"
              type="text"
              placeholder="e.g., Budi Santoso / 197805101999031001"
              class="form-input"
              required
            />
          </div>
        </div>

        <!-- Upload Bukti Terima -->
        <div class="upload-field">
          <label for="receipt_file">Scan Berita Acara Penerimaan Barang (Signed/TTD) *</label>
          <p class="help-text">Format: PDF, JPG, PNG (Max 5MB) - Dokumen harus sudah ditandatangani penerima</p>
          <div class="file-input-wrapper">
            <input 
              id="receipt_file"
              type="file"
              @change="onFileSelected('receipt')"
              accept=".pdf,.jpg,.jpeg,.png"
              class="file-input"
              required
            />
            <div class="file-display">
              <span v-if="!form.receipt_file" class="placeholder">
                📎 Klik untuk upload Berita Acara Penerimaan
              </span>
              <span v-else class="file-selected">
                ✓ {{ form.receipt_file.name }}
              </span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="receipt_notes">Catatan Penerimaan (Kondisi, Kekurangan, dll)</label>
          <textarea 
            id="receipt_notes"
            v-model="form.receipt_notes"
            rows="3"
            placeholder="e.g., Semua barang dalam kondisi baik, tidak ada kerusakan"
            class="form-input"
          />
        </div>
      </fieldset>

      <!-- Verification & Reconciliation -->
      <fieldset class="form-section">
        <legend>🔍 Verifikasi & Rekonsiliasi</legend>

        <div class="verification-checklist">
          <label class="checkbox-item">
            <input 
              v-model="form.verified_goods"
              type="checkbox"
            />
            <span>Barang sudah diterima sesuai spesifikasi & kondisi baik</span>
          </label>
          <label class="checkbox-item">
            <input 
              v-model="form.verified_invoice"
              type="checkbox"
            />
            <span>Invoice sudah diverifikasi dan sesuai dengan PO</span>
          </label>
          <label class="checkbox-item">
            <input 
              v-model="form.verified_amount"
              type="checkbox"
            />
            <span>Total invoice Rp {{ invoiceTotal.toLocaleString('id-ID') }} sudah sesuai</span>
          </label>
        </div>

        <div class="form-group">
          <label for="verified_by">Diverifikasi oleh (Nama & Jabatan) *</label>
          <input 
            id="verified_by"
            v-model="form.verified_by"
            type="text"
            placeholder="e.g., Rina Hartono / Kepala Bagian Administrasi"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="verification_date">Tanggal Verifikasi *</label>
          <input 
            id="verification_date"
            v-model="form.verification_date"
            type="date"
            class="form-input"
            required
          />
        </div>
      </fieldset>

      <!-- Summary & Status -->
      <div class="summary-section">
        <h3>📊 Ringkasan Pertanggungjawaban</h3>
        <div class="summary-grid">
          <div class="summary-row">
            <span class="label">Nomor Nota:</span>
            <span class="value">{{ form.invoice_number || '-' }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Total Invoice:</span>
            <span class="value">Rp {{ invoiceTotal.toLocaleString('id-ID') }}</span>
          </div>
          <div class="summary-row">
            <span class="label">DP Telah Dibayar:</span>
            <span class="value">Rp 6.000.000</span>
          </div>
          <div class="summary-row highlight">
            <span class="label">Sisa Pembayaran:</span>
            <span class="value">Rp {{ remainingPayment.toLocaleString('id-ID') }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Dokumen Lengkap:</span>
            <span class="value" :class="docsComplete ? 'success' : 'warning'">
              {{ docsComplete ? '✓ Ya' : '✗ Belum' }}
            </span>
          </div>
        </div>

        <div v-if="discrepancies.length > 0" class="discrepancy-warning">
          <h4>⚠️ Perbedaan Ditemukan:</h4>
          <ul>
            <li v-for="(disc, idx) in discrepancies" :key="idx">{{ disc }}</li>
          </ul>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button 
          type="button"
          @click="$emit('prev')" 
          class="btn btn-secondary"
        >
          ← Sebelumnya
        </button>
        <button 
          type="button"
          @click="saveDraft" 
          class="btn btn-outline"
        >
          💾 Simpan Draft
        </button>
        <button 
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid"
        >
          ✓ Verifikasi & Lanjut Ke Perhitungan Kurang/Lebih
        </button>
      </div>

      <!-- Validation Errors -->
      <div v-if="errors.length > 0" class="error-section">
        <h4>⚠️ Periksa Data Berikut:</h4>
        <ul>
          <li v-for="(error, idx) in errors" :key="idx">{{ error }}</li>
        </ul>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['next', 'prev', 'update']);

const form = ref({
  invoice_number: 'INV-202602-001',
  invoice_date: new Date().toISOString().split('T')[0],
  vendor_name: 'PT ABC Supplier',
  invoice_file: null,
  receipt_date: new Date().toISOString().split('T')[0],
  received_by: '',
  receipt_file: null,
  receipt_notes: '',
  verified_goods: false,
  verified_invoice: false,
  verified_amount: false,
  verified_by: '',
  verification_date: new Date().toISOString().split('T')[0],
  items: [
    { description: 'Network Switch Managed 24 Port', qty: 1, unit: 'Unit', price: 5000000 },
    { description: 'Kabel Network Cat 6A (100m)', qty: 3, unit: 'Roll', price: 1000000 },
    { description: 'Connector RJ45 UTP', qty: 100, unit: 'Pcs', price: 30000 },
    { description: 'Instalasi & Konfigurasi', qty: 1, unit: 'Paket', price: 8000000 }
  ]
});

const invoiceTotal = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
});

const remainingPayment = computed(() => {
  return invoiceTotal.value - 6000000;
});

const docsComplete = computed(() => {
  return form.value.invoice_file && form.value.receipt_file;
});

const discrepancies = computed(() => {
  const discs = [];
  if (invoiceTotal.value !== 20000000) {
    discs.push(`Total invoice (Rp ${invoiceTotal.value.toLocaleString('id-ID')}) berbeda dari PO (Rp 20.000.000)`);
  }
  return discs;
});

const errors = computed(() => {
  const errorList = [];
  if (!form.value.invoice_number) errorList.push('Nomor nota belanja harus diisi');
  if (!form.value.invoice_date) errorList.push('Tanggal nota belanja harus diisi');
  if (!form.value.vendor_name) errorList.push('Nama vendor harus diisi');
  if (!form.value.invoice_file) errorList.push('Nota belanja harus di-upload');
  if (!form.value.receipt_date) errorList.push('Tanggal penerimaan harus diisi');
  if (!form.value.received_by) errorList.push('Nama penerima harus diisi');
  if (!form.value.receipt_file) errorList.push('Bukti terima barang harus di-upload');
  if (!form.value.verified_goods) errorList.push('Verifikasi kondisi barang diperlukan');
  if (!form.value.verified_invoice) errorList.push('Verifikasi invoice diperlukan');
  if (!form.value.verified_amount) errorList.push('Verifikasi jumlah diperlukan');
  if (!form.value.verified_by) errorList.push('Nama pejabat verifikasi harus diisi');
  if (!form.value.verification_date) errorList.push('Tanggal verifikasi harus diisi');
  return errorList;
});

const isFormValid = computed(() => {
  return errors.value.length === 0;
});

const onFileSelected = (type) => {
  return (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar (max 5MB)');
        return;
      }
      if (type === 'invoice') {
        form.value.invoice_file = file;
      } else if (type === 'receipt') {
        form.value.receipt_file = file;
      }
    }
  };
};

const updateItemTotal = (idx) => {
  // Just for triggering reactivity
};

const addItemRow = () => {
  form.value.items.push({
    description: '',
    qty: 0,
    unit: '',
    price: 0
  });
};

const removeItem = (idx) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(idx, 1);
  }
};

const saveDraft = () => {
  const draftData = {
    ...form.value,
    status: 'draft',
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('ppk_pertanggungjawaban_draft', JSON.stringify(draftData));
  alert('✓ Draft disimpan');
  emit('update', draftData);
};

const submitPertanggungjawaban = async () => {
  if (!isFormValid.value) {
    alert('Harap lengkapi semua data yang diperlukan');
    return;
  }

  const pertanggungjawabanData = {
    ...form.value,
    status: 'diverifikasi',
    invoice_total: invoiceTotal.value,
    remaining_payment: remainingPayment.value,
    lp_id: 'LP-001-2026',
    po_id: 'PO-001-2026',
    step: 'pertanggungjawaban',
    timestamp: new Date().toISOString()
  };

  localStorage.setItem('ppk_pertanggungjawaban_current', JSON.stringify(pertanggungjawabanData));
  emit('update', pertanggungjawabanData);

  alert(`✓ Pertanggungjawaban berhasil diverifikasi!\n\nTotal Pembelian: Rp ${invoiceTotal.value.toLocaleString('id-ID')}\nSisa Pembayaran: Rp ${remainingPayment.value.toLocaleString('id-ID')}\n\nLanjut ke Perhitungan Kurang/Lebih`);
  
  emit('next');
};
</script>

<style scoped>
.pertanggungjawaban-step {
  max-width: 1000px;
  margin: 0 auto;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Context Info */
.context-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 30px;
}

.info-card {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-card.highlight {
  background: #fef08a;
  border-color: #fde047;
}

.info-card .label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.info-card .value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

/* Form */
.pertanggungjawaban-form {
  background: white;
  border-radius: 8px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fafafa;
}

.form-section legend {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  padding: 0 8px;
  margin-bottom: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-input,
.form-input-small,
.file-input {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus,
.form-input-small:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input-small {
  font-size: 13px;
  padding: 8px 10px;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.items-table thead {
  background: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
}

.items-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #1f2937;
}

.items-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.item-row:hover {
  background: #f9fafb;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.total {
  font-weight: 600;
  color: #1f2937;
}

.total-row {
  background: #f3f4f6;
  font-weight: 600;
}

.total-row .label {
  color: #666;
}

.total-amount {
  font-size: 14px;
  color: #3b82f6;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: #fee2e2;
}

.btn-add-item {
  background: #f0f9ff;
  border: 1px dashed #bfdbfe;
  padding: 10px 16px;
  border-radius: 6px;
  color: #1e40af;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #e0f2fe;
  border-color: #3b82f6;
}

/* Upload */
.upload-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.upload-field label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.help-text {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.file-input-wrapper {
  position: relative;
  overflow: hidden;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  top: 0;
  left: 0;
}

.file-display {
  border: 2px dashed #cbd5e1;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.file-input-wrapper:hover .file-display {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.file-display .placeholder {
  color: #999;
  display: block;
}

.file-display .file-selected {
  color: #10b981;
  font-weight: 600;
  display: block;
}

/* Verification */
.verification-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
}

.checkbox-item input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.checkbox-item span {
  font-size: 14px;
  color: #333;
}

.checkbox-item input[type="checkbox"]:checked + span {
  color: #10b981;
  font-weight: 600;
}

/* Summary */
.summary-section {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.summary-section h3 {
  margin: 0 0 16px 0;
  color: #065f46;
  font-size: 16px;
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #d1d5db;
}

.summary-row.highlight {
  background: #dbeafe;
  border-left-color: #3b82f6;
  font-weight: 600;
}

.summary-row .label {
  color: #666;
  font-size: 13px;
}

.summary-row .value {
  color: #1f2937;
  font-weight: 600;
}

.summary-row .value.success {
  color: #10b981;
}

.summary-row .value.warning {
  color: #ef4444;
}

.discrepancy-warning {
  background: #fef3c7;
  border: 1px solid #fde047;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.discrepancy-warning h4 {
  margin: 0 0 8px 0;
  color: #92400e;
  font-size: 13px;
}

.discrepancy-warning ul {
  margin: 0;
  padding-left: 20px;
  color: #78350f;
  font-size: 12px;
}

/* Actions */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 11px 22px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-outline {
  background: white;
  color: #333;
  border: 1px solid #cbd5e1;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Errors */
.error-section {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.error-section h4 {
  margin: 0 0 10px 0;
  color: #991b1b;
  font-size: 14px;
}

.error-section ul {
  margin: 0;
  padding-left: 20px;
  color: #7f1d1d;
  font-size: 13px;
}

.error-section li {
  margin-bottom: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .context-info {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .table-wrapper {
    font-size: 12px;
  }

  .items-table th,
  .items-table td {
    padding: 6px 4px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
