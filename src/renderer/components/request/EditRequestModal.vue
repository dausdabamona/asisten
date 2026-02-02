<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content large">
      <div class="modal-header">
        <h3>Edit Pengajuan</h3>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>

      <div class="modal-body">
        <!-- Basic Info Section -->
        <div class="form-section">
          <h4 class="section-title">Informasi Dasar</h4>

          <div class="form-group">
            <label>Nama Barang/Jasa *</label>
            <input
              v-model="form.item_name"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label>Deskripsi</label>
            <textarea
              v-model="form.description"
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Estimasi Nilai *</label>
              <input
                v-model.number="form.estimated_value"
                type="number"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label>Jumlah</label>
              <input
                v-model.number="form.quantity"
                type="number"
                class="form-control"
                min="1"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Unit *</label>
              <select v-model="form.unit" class="form-control" required>
                <option value="">Pilih Unit</option>
                <option value="TU">Tata Usaha</option>
                <option value="Akademik">Akademik</option>
                <option value="Lab">Laboratorium</option>
                <option value="Perpustakaan">Perpustakaan</option>
              </select>
            </div>
            <div class="form-group">
              <label>Kode Anggaran *</label>
              <input
                v-model="form.budget_code"
                type="text"
                class="form-control"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>Urgensi</label>
            <select v-model="form.urgency" class="form-control">
              <option value="low">Rendah</option>
              <option value="normal">Normal</option>
              <option value="high">Tinggi</option>
              <option value="urgent">Mendesak</option>
            </select>
          </div>
        </div>

        <!-- Specifications Section -->
        <div class="form-section">
          <h4 class="section-title">Spesifikasi</h4>

          <div class="form-group">
            <label>Spesifikasi Teknis</label>
            <textarea
              v-model="form.specifications"
              class="form-control"
              rows="4"
              placeholder="Detail spesifikasi teknis..."
            ></textarea>
          </div>
        </div>

        <!-- Tier 3 Additional Fields -->
        <div v-if="tier === 'tier3'" class="form-section">
          <h4 class="section-title">Informasi Tier 3</h4>

          <div class="form-group">
            <label>Latar Belakang</label>
            <textarea
              v-model="form.background"
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Tujuan</label>
            <textarea
              v-model="form.objectives"
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Ruang Lingkup</label>
            <textarea
              v-model="form.scope_of_work"
              class="form-control"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Change Tracking -->
        <div v-if="hasChanges" class="changes-summary">
          <h4>Ringkasan Perubahan</h4>
          <ul>
            <li v-for="change in changedFields" :key="change.field">
              <strong>{{ change.label }}:</strong>
              <span class="old-value">{{ formatValue(change.oldValue) }}</span>
              <span class="arrow">→</span>
              <span class="new-value">{{ formatValue(change.newValue) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Batal</button>
        <button
          @click="handleSave"
          :disabled="!hasChanges || saving"
          class="btn btn-primary"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  request: { type: Object, required: true },
  tier: { type: String, default: 'tier1' }
})

const emit = defineEmits(['close', 'save'])

const saving = ref(false)
const originalData = ref({})

const form = ref({
  item_name: '',
  description: '',
  estimated_value: 0,
  quantity: 1,
  unit: '',
  budget_code: '',
  urgency: 'normal',
  specifications: '',
  background: '',
  objectives: '',
  scope_of_work: ''
})

const fieldLabels = {
  item_name: 'Nama Barang/Jasa',
  description: 'Deskripsi',
  estimated_value: 'Estimasi Nilai',
  quantity: 'Jumlah',
  unit: 'Unit',
  budget_code: 'Kode Anggaran',
  urgency: 'Urgensi',
  specifications: 'Spesifikasi',
  background: 'Latar Belakang',
  objectives: 'Tujuan',
  scope_of_work: 'Ruang Lingkup'
}

const changedFields = computed(() => {
  const changes = []
  for (const field of Object.keys(form.value)) {
    if (form.value[field] !== originalData.value[field]) {
      changes.push({
        field,
        label: fieldLabels[field] || field,
        oldValue: originalData.value[field],
        newValue: form.value[field]
      })
    }
  }
  return changes
})

const hasChanges = computed(() => changedFields.value.length > 0)

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '(kosong)'
  if (typeof value === 'number') {
    return new Intl.NumberFormat('id-ID').format(value)
  }
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...'
  }
  return value
}

function handleSave() {
  if (!hasChanges.value) return

  saving.value = true

  // Only send changed fields
  const updates = {}
  for (const change of changedFields.value) {
    updates[change.field] = change.newValue
  }

  emit('save', updates)
  saving.value = false
}

onMounted(() => {
  // Initialize form with request data
  form.value = {
    item_name: props.request.item_name || '',
    description: props.request.description || '',
    estimated_value: props.request.estimated_value || 0,
    quantity: props.request.quantity || 1,
    unit: props.request.unit || '',
    budget_code: props.request.budget_code || '',
    urgency: props.request.urgency || 'normal',
    specifications: props.request.specifications || '',
    background: props.request.background || '',
    objectives: props.request.objectives || '',
    scope_of_work: props.request.scope_of_work || ''
  }

  // Store original data for comparison
  originalData.value = { ...form.value }
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
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content.large {
  max-width: 800px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Form Sections */
.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
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

/* Changes Summary */
.changes-summary {
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
}

.changes-summary h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
}

.changes-summary ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.changes-summary li {
  font-size: 13px;
  color: #374151;
  padding: 4px 0;
}

.old-value {
  color: #dc2626;
  text-decoration: line-through;
}

.arrow {
  margin: 0 8px;
  color: #6b7280;
}

.new-value {
  color: #059669;
  font-weight: 500;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
