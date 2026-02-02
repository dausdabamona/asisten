# FASE 10H IMPLEMENTATION GUIDE - PROCUREMENT TIMELINE COMPONENT

## 🎯 RECOMMENDED APPROACH: Timeline-Based Stepper

Alasan:
1. ✅ Clear visual progression
2. ✅ Prevents workflow violations
3. ✅ Easy to understand untuk end-users
4. ✅ Scalable untuk workflows kompleks
5. ✅ Matches procurement requirements

---

## 📦 COMPONENT ARCHITECTURE

### ProcurementTimeline.vue (Main Container)

```vue
<template>
  <div class="procurement-container">
    <!-- Header -->
    <div class="header">
      <h1>Workflow Pengadaan: {{ workflow.lp_id }}</h1>
      <div class="progress-info">
        <span class="step-indicator">Step {{ currentStep }} of {{ totalSteps }}</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Timeline/Stepper -->
    <div class="timeline">
      <div v-for="(step, index) in steps" :key="index" class="timeline-item">
        <!-- Step Circle -->
        <div 
          :class="['step-circle', getStepStatus(index)]"
          @click="goToStep(index)"
        >
          <span v-if="getStepStatus(index) === 'completed'">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>

        <!-- Connector Line -->
        <div 
          v-if="index < steps.length - 1" 
          :class="['connector', { completed: index < currentStep }]"
        />

        <!-- Step Info -->
        <div class="step-info">
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-description">{{ step.description }}</p>
          <div class="step-status" :class="getStepStatus(index)">
            {{ getStepStatusLabel(index) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <component 
        :is="currentStepComponent"
        :data="workflows[currentStep]"
        @update="onStepUpdate"
        @next="nextStep"
        @prev="previousStep"
      />
    </div>

    <!-- Buttons -->
    <div class="button-group">
      <button 
        v-if="currentStep > 0" 
        @click="previousStep"
        class="btn btn-secondary"
      >
        ← Sebelumnya
      </button>
      <button 
        v-if="currentStep < totalSteps - 1" 
        @click="nextStep"
        class="btn btn-primary"
        :disabled="!canProceed"
      >
        Selanjutnya →
      </button>
      <button 
        v-if="currentStep === totalSteps - 1" 
        @click="completeWorkflow"
        class="btn btn-success"
      >
        Selesai & Arsipkan
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import PermintaanStep from './steps/PermintaanStep.vue';
import LPStep from './steps/LPStep.vue';
import PengadaanStep from './steps/PengadaanStep.vue';
import POStep from './steps/POStep.vue';
import UangMukaStep from './steps/UangMukaStep.vue';
import PertanggungjawabanStep from './steps/PertanggungjawabanStep.vue';
import KurangLebihStep from './steps/KurangLebihStep.vue';
import PembayaranSisaStep from './steps/PembayaranSisaStep.vue';
import SPBYStep from './steps/SPBYStep.vue';

const currentStep = ref(4); // Start at Uang Muka (0-indexed)

const steps = [
  { 
    title: 'Permintaan', 
    description: 'Budget allocation & request',
    component: 'PermintaanStep',
    state: 'approved'
  },
  { 
    title: 'Lembar Permintaan', 
    description: 'Purchase request form',
    component: 'LPStep',
    state: 'approved'
  },
  { 
    title: 'Proses Pengadaan', 
    description: 'Tender & vendor selection',
    component: 'PengadaanStep',
    state: 'completed'
  },
  { 
    title: 'PO & Kontrak', 
    description: 'Purchase order & contract',
    component: 'POStep',
    state: 'signed'
  },
  { 
    title: 'Uang Muka (DP)', 
    description: 'Advance payment (30%)',
    component: 'UangMukaStep',
    state: 'in_progress'
  },
  { 
    title: 'Pertanggungjawaban', 
    description: 'Invoice & receipt upload',
    component: 'PertanggungjawabanStep',
    state: 'pending'
  },
  { 
    title: 'Kurang/Lebih', 
    description: 'Over/under calculation',
    component: 'KurangLebihStep',
    state: 'pending'
  },
  { 
    title: 'Pembayaran Sisa', 
    description: 'Final payment settlement',
    component: 'PembayaranSisaStep',
    state: 'pending'
  },
  { 
    title: 'SPBY', 
    description: 'Accountability letter',
    component: 'SPBYStep',
    state: 'pending'
  }
];

const totalSteps = steps.length;

const progressPercent = computed(() => {
  return Math.round(((currentStep.value + 1) / totalSteps) * 100);
});

const currentStepComponent = computed(() => {
  return steps[currentStep.value]?.component;
});

const canProceed = computed(() => {
  // Check if current step is complete
  return steps[currentStep.value]?.state !== 'pending';
});

const getStepStatus = (index) => {
  if (index < currentStep.value) return 'completed';
  if (index === currentStep.value) return 'active';
  return 'pending';
};

const getStepStatusLabel = (index) => {
  const status = getStepStatus(index);
  if (status === 'completed') return '✓ Selesai';
  if (status === 'active') return '🔄 Sedang Proses';
  return '⏳ Menunggu';
};

const nextStep = async () => {
  if (canProceed.value && currentStep.value < totalSteps - 1) {
    currentStep.value += 1;
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
  }
};

const goToStep = (index) => {
  // Only allow going back to completed steps
  if (index <= currentStep.value) {
    currentStep.value = index;
  }
};

const onStepUpdate = (data) => {
  // Update step data
  steps[currentStep.value].state = 'completed';
};

const completeWorkflow = () => {
  alert('Workflow selesai dan akan diarsipkan');
  // Archive workflow
};
</script>

<style scoped>
.procurement-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
}

.header {
  margin-bottom: 40px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 15px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.step-indicator {
  font-weight: 600;
  color: #666;
}

.progress-bar {
  width: 300px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.timeline {
  display: flex;
  position: relative;
  margin-bottom: 50px;
  overflow-x: auto;
  padding: 20px 0;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  position: relative;
}

.step-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid #e0e0e0;
  background: white;
  margin-bottom: 10px;
}

.step-circle.completed {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.step-circle.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.step-circle.pending {
  background: #f3f4f6;
  color: #999;
  border-color: #d1d5db;
}

.connector {
  position: absolute;
  top: 25px;
  left: 60px;
  width: 60px;
  height: 2px;
  background: #d1d5db;
}

.connector.completed {
  background: #10b981;
}

.step-info {
  text-align: center;
  min-width: 100px;
  margin-top: 20px;
}

.step-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin: 0;
  white-space: nowrap;
}

.step-description {
  font-size: 10px;
  color: #999;
  margin: 3px 0 0 0;
  white-space: nowrap;
}

.step-status {
  font-size: 11px;
  font-weight: 500;
  margin-top: 5px;
  padding: 3px 8px;
  border-radius: 3px;
  background: #f3f4f6;
  color: #666;
}

.step-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.step-status.active {
  background: #dbeafe;
  color: #1e40af;
}

.content-area {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 30px;
  min-height: 400px;
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}
</style>
```

---

## 🎒 Individual Step Components

### UangMukaStep.vue (Example - Most Important Next Step)

```vue
<template>
  <div class="uang-muka-step">
    <h2>Step 5: Uang Muka (DP) - Advance Payment</h2>

    <!-- Current Status -->
    <div class="status-card">
      <div class="status-row">
        <span class="label">PO Number:</span>
        <span class="value">PO-001-2026</span>
      </div>
      <div class="status-row">
        <span class="label">Total PO:</span>
        <span class="value">Rp 20.000.000</span>
      </div>
      <div class="status-row">
        <span class="label">DP Persen:</span>
        <span class="value">30%</span>
      </div>
      <div class="status-row highlight">
        <span class="label">DP Amount:</span>
        <span class="value">Rp 6.000.000</span>
      </div>
    </div>

    <!-- Form -->
    <div class="form-section">
      <h3>Payment Information</h3>

      <div class="form-group">
        <label>Payment Date *</label>
        <input 
          v-model="form.payment_date" 
          type="date"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label>Payment Method *</label>
        <select v-model="form.payment_method" class="form-input">
          <option value="">-- Select --</option>
          <option value="transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label>Payment Reference/Receipt Number *</label>
        <input 
          v-model="form.reference_number"
          type="text"
          placeholder="e.g., TRF202602001 or Cheque #12345"
          class="form-input"
        />
      </div>

      <!-- File Upload Section -->
      <div class="upload-section">
        <h4>Upload Payment Proof</h4>

        <div class="upload-area">
          <div class="upload-item">
            <label>Bukti Transfer/Cheque *</label>
            <div class="file-input-wrapper">
              <input 
                type="file"
                @change="onFileSelected('proof')"
                accept=".pdf,.jpg,.jpeg,.png"
                class="file-input"
              />
              <div class="file-display">
                <span v-if="!form.proof_file">Choose file (PDF, JPG, PNG)</span>
                <span v-else class="file-selected">✓ {{ form.proof_file.name }}</span>
              </div>
            </div>
          </div>

          <div class="upload-item">
            <label>Kwitansi/Invoice *</label>
            <div class="file-input-wrapper">
              <input 
                type="file"
                @change="onFileSelected('receipt')"
                accept=".pdf,.jpg,.jpeg,.png"
                class="file-input"
              />
              <div class="file-display">
                <span v-if="!form.receipt_file">Choose file (PDF, JPG, PNG)</span>
                <span v-else class="file-selected">✓ {{ form.receipt_file.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label>Catatan (Optional)</label>
        <textarea 
          v-model="form.notes"
          rows="3"
          placeholder="e.g., Paid to PT ABC Supplier via BCA account"
          class="form-input"
        />
      </div>
    </div>

    <!-- Preview -->
    <div class="preview-section">
      <h3>Payment Summary</h3>
      <div class="summary">
        <div class="summary-row">
          <span>Amount:</span>
          <span class="bold">Rp 6.000.000</span>
        </div>
        <div class="summary-row">
          <span>Date:</span>
          <span class="bold">{{ form.payment_date || '-' }}</span>
        </div>
        <div class="summary-row">
          <span>Method:</span>
          <span class="bold">{{ form.payment_method || '-' }}</span>
        </div>
        <div class="summary-row">
          <span>Reference:</span>
          <span class="bold">{{ form.reference_number || '-' }}</span>
        </div>
        <div class="summary-row">
          <span>Proof Uploaded:</span>
          <span class="bold">{{ form.proof_file ? '✓ Yes' : '✗ No' }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="action-buttons">
      <button @click="$emit('prev')" class="btn btn-outline">
        ← Kembali
      </button>
      <button @click="saveDraft" class="btn btn-secondary">
        💾 Simpan Draft
      </button>
      <button @click="submitPayment" class="btn btn-primary" :disabled="!isFormValid">
        ✓ Konfirmasi & Lanjut →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['next', 'prev', 'update']);

const form = ref({
  payment_date: '2026-02-07',
  payment_method: 'transfer',
  reference_number: '',
  proof_file: null,
  receipt_file: null,
  notes: ''
});

const isFormValid = computed(() => {
  return (
    form.value.payment_date &&
    form.value.payment_method &&
    form.value.reference_number &&
    form.value.proof_file &&
    form.value.receipt_file
  );
});

const onFileSelected = (type, event) => {
  const file = event.target.files[0];
  if (type === 'proof') {
    form.value.proof_file = file;
  } else if (type === 'receipt') {
    form.value.receipt_file = file;
  }
};

const saveDraft = () => {
  alert('Draft saved');
  emit('update', form.value);
};

const submitPayment = async () => {
  // Save to database/localStorage
  const paymentData = {
    ...form.value,
    status: 'dibayar',
    timestamp: new Date().toISOString()
  };

  console.log('Payment submitted:', paymentData);
  
  // Emit next to proceed to Pertanggungjawaban step
  emit('next');
};
</script>

<style scoped>
.uang-muka-step {
  max-width: 800px;
  margin: 0 auto;
}

.uang-muka-step h2 {
  color: #1e293b;
  margin-bottom: 30px;
}

.status-card {
  background: #f0f9ff;
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #dbeafe;
}

.status-row:last-child {
  border-bottom: none;
}

.status-row.highlight {
  background: #dbeafe;
  padding: 12px;
  margin: 0 -8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 16px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #1e293b;
  font-weight: 600;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  color: #1e293b;
  margin-bottom: 20px;
  font-size: 18px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.upload-section {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.upload-section h4 {
  margin-bottom: 15px;
}

.upload-area {
  display: grid;
  gap: 15px;
}

.upload-item {
  display: flex;
  flex-direction: column;
}

.upload-item label {
  font-weight: 500;
  margin-bottom: 8px;
}

.file-input-wrapper {
  position: relative;
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
  color: #999;
  transition: all 0.3s;
}

.file-input:hover ~ .file-display {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.file-selected {
  color: #10b981;
  font-weight: 600;
}

.preview-section {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.preview-section h3 {
  margin-bottom: 15px;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.summary-row .bold {
  font-weight: 600;
  color: #1e293b;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: #f3f4f6;
  color: #333;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-outline {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
}
</style>
```

---

## 📋 NEXT STEP FORMS (Template)

### PertanggungjawabanStep.vue (Template)

```vue
<template>
  <div class="pertanggungjawaban-step">
    <h2>Step 6: Pertanggungjawaban - Receipt & Invoice Upload</h2>

    <!-- Timeline Context -->
    <div class="context-card">
      <p>📍 Previous Payment: Rp 6.000.000 (DP) - Paid on 7 Feb 2026</p>
      <p>📋 Now: Upload invoice details & proof of goods receipt</p>
      <p>💰 Remaining Payment: Rp 14.000.000 (to be calculated after verification)</p>
    </div>

    <!-- Invoice Upload -->
    <div class="form-section">
      <h3>Invoice & Receipt Details</h3>

      <div class="upload-group">
        <h4>Nota Belanja (Invoice)</h4>
        <p class="help-text">Upload scanned invoice from vendor showing purchased items</p>
        <FileUpload @file-selected="handleInvoiceUpload" accept=".pdf,.jpg,.png" />
      </div>

      <div class="invoice-items">
        <h4>Item Details</h4>
        <table class="items-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Price/Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in form.items" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td><input v-model="item.description" class="form-input-small" /></td>
              <td><input v-model.number="item.qty" type="number" class="form-input-small" /></td>
              <td><input v-model="item.unit" class="form-input-small" /></td>
              <td><input v-model.number="item.price" type="number" class="form-input-small" /></td>
              <td class="total">{{ (item.qty * item.price).toLocaleString('id-ID') }}</td>
            </tr>
          </tbody>
        </table>
        <button @click="addItemRow" class="btn-add">+ Tambah Item</button>
      </div>

      <div class="form-group">
        <label>Bukti Terima Barang (Proof of Receipt) *</label>
        <p class="help-text">Upload signed goods receipt / receiving report</p>
        <FileUpload @file-selected="handleReceiptUpload" accept=".pdf,.jpg,.png" />
      </div>

      <div class="form-group">
        <label>Tanggal Penerimaan *</label>
        <input v-model="form.receipt_date" type="date" class="form-input" />
      </div>

      <div class="form-group">
        <label>Catatan Penerima</label>
        <textarea v-model="form.receiver_notes" rows="3" class="form-input"></textarea>
      </div>
    </div>

    <!-- Total Summary -->
    <div class="summary-card">
      <div class="summary-item">
        <span>Invoice Total:</span>
        <span class="bold">Rp {{ invoiceTotal.toLocaleString('id-ID') }}</span>
      </div>
      <div class="summary-item">
        <span>DP Paid:</span>
        <span>Rp 6.000.000</span>
      </div>
      <div class="summary-item highlight">
        <span>Remaining Payment:</span>
        <span class="bold">Rp {{ remainingPayment.toLocaleString('id-ID') }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="action-buttons">
      <button @click="$emit('prev')" class="btn btn-outline">← Kembali</button>
      <button @click="submitPertanggungjawaban" class="btn btn-primary">
        ✓ Verifikasi & Lanjut →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FileUpload from '../components/FileUpload.vue';

const emit = defineEmits(['next', 'prev']);

const form = ref({
  invoice_file: null,
  receipt_file: null,
  receipt_date: '2026-02-10',
  receiver_notes: '',
  items: [
    { description: '', qty: 0, unit: '', price: 0 }
  ]
});

const invoiceTotal = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
});

const remainingPayment = computed(() => {
  return invoiceTotal.value - 6000000;
});

const handleInvoiceUpload = (file) => {
  form.value.invoice_file = file;
};

const handleReceiptUpload = (file) => {
  form.value.receipt_file = file;
};

const addItemRow = () => {
  form.value.items.push({
    description: '',
    qty: 0,
    unit: '',
    price: 0
  });
};

const submitPertanggungjawaban = () => {
  console.log('Pertanggungjawaban submitted:', form.value);
  emit('next');
};
</script>

<style scoped>
/* Similar styles as UangMukaStep.vue */
</style>
```

---

## 🚀 IMPLEMENTATION PRIORITY

**Week 1:**
- [ ] Create ProcurementTimeline.vue component
- [ ] Create UangMukaStep.vue (most critical next step)
- [ ] Integrate with existing data model
- [ ] Add file upload system

**Week 2:**
- [ ] Create PertanggungjawabanStep.vue
- [ ] Create KurangLebihStep.vue
- [ ] Test with sample data

**Week 3:**
- [ ] Create PembayaranSisaStep.vue
- [ ] Create SPBYStep.vue
- [ ] End-to-end workflow testing

**Week 4:**
- [ ] Add budget dashboard with sisa_pagu
- [ ] Create reporting views
- [ ] Performance optimization

---

## 📊 DATA FLOW

```
User Creates Tier 1 Request
         ↓
User Creates LP with DIPA items
         ↓
Procurement Process (Tender)
         ↓
User Creates PO (linked to LP)
         ↓
[TIMELINE BEGINS]
         ↓
User pays DP (30%) → Upload proof → Step 4 Complete
         ↓
User uploads Invoice + Receipt → Verify → Step 5 Complete
         ↓
System calculates Kurang/Lebih → Action needed → Step 6 Complete
         ↓
User pays Sisa (70%) → Upload proof → Step 7 Complete
         ↓
Generate SPBY → Sign → Complete & Archive
         ↓
Procurement Workflow FINISHED
```

---

## 💾 DATA STORAGE (localStorage structure)

```javascript
localStorage['ppk_procurement_workflows'] = [
  {
    id: 'wf-LP-001-2026',
    lp_id: 'LP-001-2026',
    steps: [
      { step: 1, name: 'permintaan', status: 'completed', data: {...} },
      { step: 2, name: 'lp', status: 'completed', data: {...} },
      { step: 3, name: 'pengadaan', status: 'completed', data: {...} },
      { step: 4, name: 'po', status: 'completed', data: {...} },
      { step: 5, name: 'uang_muka', status: 'completed', data: {...} },
      { step: 6, name: 'pertanggungjawaban', status: 'in_progress', data: {...} },
      { step: 7, name: 'kurang_lebih', status: 'pending', data: null },
      { step: 8, name: 'pembayaran_sisa', status: 'pending', data: null },
      { step: 9, name: 'spby', status: 'pending', data: null }
    ]
  }
]
```

---

**READY TO IMPLEMENT? Which component should we start with?**
