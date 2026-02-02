<template>
  <div class="procurement-timeline-container">
    <!-- Header dengan Info -->
    <div class="timeline-header">
      <div class="header-left">
        <h1>Workflow Pengadaan</h1>
        <p class="lp-info">{{ workflowTitle }}</p>
      </div>
      <div class="header-right">
        <div class="progress-section">
          <div class="step-counter">
            <span class="current">{{ currentStep + 1 }}</span>
            <span class="separator">/</span>
            <span class="total">{{ steps.length }}</span>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <p class="progress-text">{{ progressPercent }}% Selesai</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Stepper -->
    <div class="timeline-stepper">
      <div class="stepper-track">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          class="stepper-item"
          @click="goToStep(index)"
          :class="getStepClass(index)"
        >
          <!-- Circle -->
          <div class="step-circle">
            <span v-if="getStepStatus(index) === 'completed'">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Connector -->
          <div 
            v-if="index < steps.length - 1"
            class="connector"
            :class="{ completed: index < currentStep }"
          />

          <!-- Step Label -->
          <div class="step-label">
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area dengan Dynamic Component -->
    <div class="content-wrapper">
      <div class="content-card">
        <div class="content-header">
          <h2>{{ steps[currentStep].title }}</h2>
          <span :class="['status-badge', getStepStatus(currentStep)]">
            {{ getStatusLabel(currentStep) }}
          </span>
        </div>

        <div class="content-body">
          <!-- Uang Muka Step (Default / Example) -->
          <div v-if="currentStep === 4" class="step-content">
            <UangMukaStep 
              :data="workflowData[4]"
              @next="nextStep"
              @prev="previousStep"
              @update="updateStepData"
            />
          </div>

          <!-- Pertanggungjawaban Step -->
          <div v-if="currentStep === 5" class="step-content">
            <PertanggungjawabanStep 
              :data="workflowData[5]"
              @next="nextStep"
              @prev="previousStep"
              @update="updateStepData"
            />
          </div>

          <!-- Fallback for other steps -->
          <div v-if="currentStep !== 4 && currentStep !== 5" class="step-placeholder">
            <div class="placeholder-icon">📋</div>
            <h3>{{ steps[currentStep].title }}</h3>
            <p>{{ steps[currentStep].description }}</p>
            <p class="status-text">
              Status: <strong>{{ getStatusLabel(currentStep) }}</strong>
            </p>
            <div class="placeholder-actions">
              <button 
                v-if="currentStep > 0"
                @click="previousStep"
                class="btn btn-secondary"
              >
                ← Sebelumnya
              </button>
              <button 
                v-if="currentStep < steps.length - 1"
                @click="nextStep"
                class="btn btn-primary"
                :disabled="!canProceed"
              >
                Selanjutnya →
              </button>
              <button 
                v-if="currentStep === steps.length - 1"
                @click="completeWorkflow"
                class="btn btn-success"
              >
                ✓ Selesaikan & Arsipkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget Dashboard Summary (Optional) -->
    <div class="budget-summary">
      <div class="summary-card">
        <h3>Ringkasan Anggaran</h3>
        <div class="budget-grid">
          <div class="budget-item">
            <span class="label">Pagu Total</span>
            <span class="value">Rp 20.000.000</span>
          </div>
          <div class="budget-item">
            <span class="label">DP Bayar</span>
            <span class="value paid">Rp 6.000.000</span>
          </div>
          <div class="budget-item">
            <span class="label">Sisa Bayar</span>
            <span class="value">Rp 14.000.000</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import UangMukaStep from './steps/UangMukaStep.vue';
import PertanggungjawabanStep from './steps/PertanggungjawabanStep.vue';

const props = defineProps({
  lpId: {
    type: String,
    default: 'LP-001-2026'
  }
});

const currentStep = ref(4); // Default ke Uang Muka (index 4)

const steps = [
  { 
    title: 'Permintaan', 
    description: 'Budget allocation',
    state: 'completed'
  },
  { 
    title: 'Lembar Permintaan', 
    description: 'Purchase request',
    state: 'completed'
  },
  { 
    title: 'Proses Pengadaan', 
    description: 'Tender & vendor selection',
    state: 'completed'
  },
  { 
    title: 'PO & Kontrak', 
    description: 'Purchase order',
    state: 'completed'
  },
  { 
    title: 'Uang Muka (DP)', 
    description: 'Advance payment 30%',
    state: 'in_progress'
  },
  { 
    title: 'Pertanggungjawaban', 
    description: 'Invoice & receipt upload',
    state: 'pending'
  },
  { 
    title: 'Kurang/Lebih', 
    description: 'Over/under calculation',
    state: 'pending'
  },
  { 
    title: 'Pembayaran Sisa', 
    description: 'Final payment settlement',
    state: 'pending'
  },
  { 
    title: 'SPBY', 
    description: 'Accountability letter',
    state: 'pending'
  }
];

const workflowData = ref({
  4: { /* Uang Muka data */ },
  5: { /* Pertanggungjawaban data */ }
});

const workflowTitle = computed(() => {
  return `${props.lpId} - Rp 20.000.000`;
});

const progressPercent = computed(() => {
  return Math.round(((currentStep.value + 1) / steps.length) * 100);
});

const canProceed = computed(() => {
  return steps[currentStep.value]?.state !== 'pending';
});

const getStepStatus = (index) => {
  if (index < currentStep.value) return 'completed';
  if (index === currentStep.value) return 'active';
  return 'pending';
};

const getStepClass = (index) => {
  const status = getStepStatus(index);
  return {
    [status]: true,
    'clickable': index <= currentStep.value
  };
};

const getStatusLabel = (index) => {
  const status = getStepStatus(index);
  if (status === 'completed') return '✓ Selesai';
  if (status === 'active') return '🔄 Sedang Proses';
  return '⏳ Menunggu';
};

const goToStep = (index) => {
  if (index <= currentStep.value) {
    currentStep.value = index;
  }
};

const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length - 1) {
    steps[currentStep.value].state = 'completed';
    currentStep.value += 1;
    // Save progress to localStorage
    saveProgress();
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
  }
};

const updateStepData = (data) => {
  workflowData.value[currentStep.value] = data;
  saveProgress();
};

const completeWorkflow = () => {
  if (confirm('Workflow akan diselesaikan dan diarsipkan. Lanjutkan?')) {
    steps[currentStep.value].state = 'completed';
    saveProgress();
    alert('✓ Workflow selesai dan telah diarsipkan');
    // Redirect atau refresh
  }
};

const saveProgress = () => {
  const workflow = {
    lpId: props.lpId,
    currentStep: currentStep.value,
    steps: steps,
    data: workflowData.value,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(`ppk_workflow_${props.lpId}`, JSON.stringify(workflow));
};

const loadProgress = () => {
  const saved = localStorage.getItem(`ppk_workflow_${props.lpId}`);
  if (saved) {
    const workflow = JSON.parse(saved);
    currentStep.value = workflow.currentStep;
    workflowData.value = workflow.data;
  }
};

onMounted(() => {
  loadProgress();
});
</script>

<style scoped>
.procurement-timeline-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 12px;
  color: white;
}

.header-left h1 {
  font-size: 32px;
  margin: 0 0 8px 0;
}

.lp-info {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.header-right {
  text-align: right;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.step-counter {
  font-size: 24px;
  font-weight: 700;
}

.separator {
  opacity: 0.7;
  margin: 0 4px;
}

.progress-bar-wrapper {
  min-width: 200px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  margin: 0;
  opacity: 0.9;
}

/* Timeline Stepper */
.timeline-stepper {
  margin-bottom: 40px;
  overflow-x: auto;
  padding: 20px 0;
}

.stepper-track {
  display: flex;
  gap: 0;
  min-width: min-content;
}

.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 110px;
  position: relative;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.stepper-item.completed,
.stepper-item.active {
  opacity: 1;
}

.stepper-item.clickable {
  cursor: pointer;
}

.step-circle {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 8px;
  border: 2px solid #e5e7eb;
  background: white;
  transition: all 0.3s ease;
  z-index: 10;
}

.stepper-item.completed .step-circle {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.stepper-item.active .step-circle {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.connector {
  position: absolute;
  top: 22px;
  left: 55px;
  width: 55px;
  height: 2px;
  background: #d1d5db;
  transition: background 0.3s ease;
}

.connector.completed {
  background: #10b981;
}

.step-label {
  text-align: center;
  margin-top: 12px;
}

.step-label h4 {
  font-size: 12px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
  white-space: nowrap;
}

.step-label p {
  font-size: 10px;
  color: #9ca3af;
  margin: 2px 0 0 0;
  white-space: nowrap;
}

/* Content Area */
.content-wrapper {
  margin-bottom: 40px;
}

.content-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.content-header h2 {
  margin: 0;
  font-size: 22px;
  color: #1f2937;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.content-body {
  padding: 24px;
  min-height: 300px;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.step-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.placeholder-icon + h3 {
  font-size: 18px;
  margin: 0 0 10px 0;
  color: #1f2937;
}

.placeholder-icon + h3 + p {
  margin: 0 0 20px 0;
}

.status-text {
  margin-bottom: 30px;
  color: #1f2937;
}

.placeholder-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
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
  opacity: 0.6;
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

/* Budget Summary */
.budget-summary {
  margin-top: 40px;
}

.summary-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 20px;
}

.summary-card h3 {
  margin: 0 0 16px 0;
  color: #065f46;
  font-size: 16px;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 3px solid #10b981;
}

.budget-item .label {
  color: #666;
  font-weight: 500;
  font-size: 12px;
}

.budget-item .value {
  color: #1f2937;
  font-weight: 700;
  font-size: 16px;
}

.budget-item .value.paid {
  color: #10b981;
}

/* Responsive */
@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
  }

  .header-right {
    margin-top: 20px;
    text-align: left;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-badge {
    margin-top: 10px;
  }
}
</style>
