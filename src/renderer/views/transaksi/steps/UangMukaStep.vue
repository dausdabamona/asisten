<template>
  <div class="uang-muka-step">
    <!-- Context Information -->
    <div class="context-info">
      <div class="info-card">
        <span class="label">📋 PO Number:</span>
        <span class="value">PO-001-2026</span>
      </div>
      <div class="info-card">
        <span class="label">💰 Total PO:</span>
        <span class="value">Rp 20.000.000</span>
      </div>
      <div class="info-card highlight">
        <span class="label">💳 DP Amount (30%):</span>
        <span class="value">Rp 6.000.000</span>
      </div>
      <div class="info-card">
        <span class="label">📅 Due Payment:</span>
        <span class="value">7 Feb 2026</span>
      </div>
    </div>

    <!-- Form Section -->
    <form @submit.prevent="submitPayment" class="payment-form">
      <!-- Payment Information -->
      <fieldset class="form-section">
        <legend>💳 Informasi Pembayaran</legend>

        <div class="form-row">
          <div class="form-group">
            <label for="payment_date">Tanggal Pembayaran *</label>
            <input 
              id="payment_date"
              v-model="form.payment_date" 
              type="date"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="payment_method">Metode Pembayaran *</label>
            <select v-model="form.payment_method" id="payment_method" class="form-input" required>
              <option value="">-- Pilih --</option>
              <option value="transfer">Transfer Bank</option>
              <option value="cheque">Cek/Cheque</option>
              <option value="cash">Tunai</option>
              <option value="giro">Giro</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="reference_number">Nomor Referensi (No. Transaksi/Cek) *</label>
          <input 
            id="reference_number"
            v-model="form.reference_number"
            type="text"
            placeholder="e.g., TRF-20260207-001 atau Cek #12345"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="payment_account">Dari Rekening/Nomor Cek (Optional)</label>
          <input 
            id="payment_account"
            v-model="form.payment_account"
            type="text"
            placeholder="e.g., 1234567890 (BCA) atau Nomor Cek"
            class="form-input"
          />
        </div>
      </fieldset>

      <!-- Payment Proof Upload -->
      <fieldset class="form-section">
        <legend>📄 Bukti Pembayaran</legend>

        <div class="upload-area">
          <div class="upload-field">
            <label for="proof_file">Scan Bukti Pembayaran (Transfer/Cheque/Giro) *</label>
            <p class="help-text">Format: PDF, JPG, PNG (Max 5MB)</p>
            <div class="file-input-wrapper">
              <input 
                id="proof_file"
                type="file"
                @change="onFileSelected('proof')"
                accept=".pdf,.jpg,.jpeg,.png"
                class="file-input"
                required
              />
              <div class="file-display">
                <span v-if="!form.proof_file" class="placeholder">
                  📎 Klik untuk upload bukti pembayaran
                </span>
                <span v-else class="file-selected">
                  ✓ {{ form.proof_file.name }}
                </span>
              </div>
            </div>
          </div>

          <div class="upload-field">
            <label for="receipt_file">Kwitansi dari Vendor (Optional)</label>
            <p class="help-text">Format: PDF, JPG, PNG (Max 5MB)</p>
            <div class="file-input-wrapper">
              <input 
                id="receipt_file"
                type="file"
                @change="onFileSelected('receipt')"
                accept=".pdf,.jpg,.jpeg,.png"
                class="file-input"
              />
              <div class="file-display">
                <span v-if="!form.receipt_file" class="placeholder">
                  📎 Klik untuk upload kwitansi
                </span>
                <span v-else class="file-selected">
                  ✓ {{ form.receipt_file.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <!-- Payment Verification -->
      <fieldset class="form-section">
        <legend>✓ Verifikasi Pembayaran</legend>

        <div class="verification-checklist">
          <label class="checkbox-item">
            <input 
              v-model="form.verified_amount"
              type="checkbox"
            />
            <span>Jumlah pembayaran sudah sesuai: Rp 6.000.000</span>
          </label>
          <label class="checkbox-item">
            <input 
              v-model="form.verified_beneficiary"
              type="checkbox"
            />
            <span>Pembayaran ke rekening/nama penerima yang benar</span>
          </label>
          <label class="checkbox-item">
            <input 
              v-model="form.verified_documents"
              type="checkbox"
            />
            <span>Bukti pembayaran lengkap dan jelas</span>
          </label>
        </div>

        <div class="form-group">
          <label for="verified_by">Diverifikasi oleh *</label>
          <input 
            id="verified_by"
            v-model="form.verified_by"
            type="text"
            placeholder="Nama pejabat yang memverifikasi"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="notes">Catatan Pembayaran (Optional)</label>
          <textarea 
            id="notes"
            v-model="form.notes"
            rows="3"
            placeholder="e.g., Pembayaran DP melalui transfer BCA atas nama PT ABC Supplier"
            class="form-input"
          />
        </div>
      </fieldset>

      <!-- Summary & Confirmation -->
      <div class="summary-section">
        <h3>📊 Ringkasan Pembayaran</h3>
        <div class="summary-grid">
          <div class="summary-row">
            <span class="label">Tanggal:</span>
            <span class="value">{{ form.payment_date || '-' }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Metode:</span>
            <span class="value">{{ getPaymentMethodLabel() }}</span>
          </div>
          <div class="summary-row">
            <span class="label">No. Referensi:</span>
            <span class="value">{{ form.reference_number || '-' }}</span>
          </div>
          <div class="summary-row highlight">
            <span class="label">Jumlah DP:</span>
            <span class="value">Rp 6.000.000</span>
          </div>
          <div class="summary-row">
            <span class="label">Bukti Upload:</span>
            <span class="value" :class="form.proof_file ? 'success' : 'warning'">
              {{ form.proof_file ? '✓ Sudah' : '✗ Belum' }}
            </span>
          </div>
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
          ✓ Konfirmasi Pembayaran
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
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'transfer',
  reference_number: '',
  payment_account: '',
  proof_file: null,
  receipt_file: null,
  verified_amount: false,
  verified_beneficiary: false,
  verified_documents: false,
  verified_by: '',
  notes: ''
});

const errors = computed(() => {
  const errorList = [];
  if (!form.value.payment_date) errorList.push('Tanggal pembayaran harus diisi');
  if (!form.value.payment_method) errorList.push('Metode pembayaran harus dipilih');
  if (!form.value.reference_number) errorList.push('Nomor referensi harus diisi');
  if (!form.value.proof_file) errorList.push('Bukti pembayaran harus di-upload');
  if (!form.value.verified_by) errorList.push('Nama pejabat yang memverifikasi harus diisi');
  if (!form.value.verified_amount) errorList.push('Verifikasi jumlah pembayaran diperlukan');
  if (!form.value.verified_beneficiary) errorList.push('Verifikasi penerima pembayaran diperlukan');
  if (!form.value.verified_documents) errorList.push('Verifikasi dokumen pembayaran diperlukan');
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
      if (type === 'proof') {
        form.value.proof_file = file;
      } else if (type === 'receipt') {
        form.value.receipt_file = file;
      }
    }
  };
};

const getPaymentMethodLabel = () => {
  const methods = {
    'transfer': 'Transfer Bank',
    'cheque': 'Cek/Cheque',
    'cash': 'Tunai',
    'giro': 'Giro'
  };
  return methods[form.value.payment_method] || '-';
};

const saveDraft = () => {
  const draftData = {
    ...form.value,
    status: 'draft',
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('ppk_uang_muka_draft', JSON.stringify(draftData));
  alert('✓ Draft disimpan');
  emit('update', draftData);
};

const submitPayment = async () => {
  if (!isFormValid.value) {
    alert('Harap lengkapi semua data yang diperlukan');
    return;
  }

  const paymentData = {
    ...form.value,
    status: 'dibayar',
    amount: 6000000,
    lp_id: 'LP-001-2026',
    po_id: 'PO-001-2026',
    step: 'uang_muka',
    timestamp: new Date().toISOString()
  };

  // Save to localStorage (akan diintegrasikan dengan API nanti)
  localStorage.setItem('ppk_uang_muka_current', JSON.stringify(paymentData));
  
  // Update workflow progress
  emit('update', paymentData);

  alert('✓ Pembayaran DP dikonfirmasi!\n\nLanjut ke step Pertanggungjawaban untuk upload Nota Belanja dan Bukti Terima Barang');
  
  // Emit next to go to Pertanggungjawaban
  emit('next');
};
</script>

<style scoped>
.uang-muka-step {
  max-width: 900px;
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
.payment-form {
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
.file-input {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Upload Area */
.upload-area {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.upload-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

/* Verification Checklist */
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

/* Summary Section */
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

  .upload-area {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
