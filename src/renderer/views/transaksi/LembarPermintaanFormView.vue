<template>
  <div class="lembar-permintaan-container">
    <!-- Header -->
    <div class="lp-header">
      <div class="header-content">
        <h1>📋 Lembar Permintaan (LP)</h1>
        <p class="subtitle">Ajukan permintaan barang/jasa untuk unit Anda</p>
      </div>
      <div class="header-info">
        <div class="info-badge">
          <span class="label">LP ID:</span>
          <span class="value">{{ lpId }}</span>
        </div>
        <div class="info-badge">
          <span class="label">Status:</span>
          <span class="value badge-draft">Draft</span>
        </div>
      </div>
    </div>

    <!-- Form Section -->
    <form @submit.prevent="submitLP" class="lp-form">
      <!-- Unit & Request Info -->
      <fieldset class="form-section">
        <legend>📍 Informasi Permintaan</legend>

        <div class="form-row">
          <div class="form-group">
            <label for="unit_name">Unit Pengajuan *</label>
            <select v-model="form.unit_name" id="unit_name" class="form-input" required>
              <option value="">-- Pilih Unit --</option>
              <option v-if="satkerList && satkerList.length > 0" 
                      v-for="unit in satkerList" :key="unit.id" 
                      :value="unit.nama || unit.unit_kerja">
                {{ unit.nama || unit.unit_kerja }}
              </option>
              <option v-else disabled>
                Memuat data...
              </option>
            </select>
            <small v-if="!satkerList || satkerList.length === 0" class="text-gray-500">
              Loading data unit...
            </small>
          </div>

          <div class="form-group">
            <label for="request_date">Tanggal Permintaan *</label>
            <input 
              id="request_date"
              v-model="form.request_date"
              type="date"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="responsible_nip">Penanggung Jawab (NIP/Pejabat) *</label>
            <select v-model="form.responsible_nip" id="responsible_nip" class="form-input" required>
              <option value="">-- Pilih Pejabat/Pegawai --</option>
              <optgroup v-if="pejabatList && pejabatList.length > 0" label="Pejabat Struktural">
                <option v-for="pejabat in pejabatList" :key="'pj-' + pejabat.id" 
                        :value="pejabat.nip || ''">
                  {{ pejabat.nama || 'N/A' }} ({{ pejabat.jenis || 'N/A' }}) - {{ pejabat.nip || 'N/A' }}
                </option>
              </optgroup>
              <optgroup v-if="pegawaiList && pegawaiList.length > 0" label="Pegawai">
                <option v-for="pegawai in pegawaiList" :key="'pg-' + pegawai.id" 
                        :value="pegawai.nip || ''">
                  {{ pegawai.nama || 'N/A' }} - {{ pegawai.nip || 'N/A' }}
                </option>
              </optgroup>
              <option v-if="(!pejabatList || pejabatList.length === 0) && (!pegawaiList || pegawaiList.length === 0)" 
                      disabled>
                Memuat data...
              </option>
            </select>
            <small v-if="(!pejabatList || pejabatList.length === 0) && (!pegawaiList || pegawaiList.length === 0)" 
                   class="text-gray-500">
              Loading data pejabat dan pegawai...
            </small>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Deskripsi Permintaan (Tujuan/Alasan)</label>
          <textarea 
            id="description"
            v-model="form.description"
            rows="2"
            placeholder="e.g., Pengadaan untuk meningkatkan konektivitas jaringan di gedung B"
            class="form-input"
          />
        </div>
      </fieldset>

      <!-- Items Table -->
      <fieldset class="form-section">
        <legend>📦 Daftar Barang/Jasa yang Diminta</legend>

        <div class="table-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th width="30px">No</th>
                <th width="35%">Deskripsi Barang/Jasa</th>
                <th width="80px">Qty</th>
                <th width="80px">Unit</th>
                <th width="120px">Est. Harga</th>
                <th width="100px">Total</th>
                <th width="70px">Tier</th>
                <th width="60px">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in form.items" :key="idx" class="item-row">
                <td class="row-number">{{ idx + 1 }}</td>

                <td>
                  <input 
                    v-model="item.description"
                    placeholder="Deskripsi item"
                    class="form-input-table"
                    required
                  />
                </td>

                <td>
                  <input 
                    v-model.number="item.qty"
                    type="number"
                    min="1"
                    placeholder="0"
                    class="form-input-table text-center"
                    @input="updateItemTier(idx)"
                    required
                  />
                </td>

                <td>
                  <input 
                    v-model="item.unit"
                    placeholder="Unit"
                    class="form-input-table"
                    required
                  />
                </td>

                <td>
                  <input 
                    v-model.number="item.estimate_price"
                    type="number"
                    placeholder="0"
                    class="form-input-table text-right"
                    @input="updateItemTier(idx)"
                    required
                  />
                </td>

                <td class="total-cell">
                  <span class="total-amount">
                    Rp {{ (item.qty * item.estimate_price).toLocaleString('id-ID') }}
                  </span>
                </td>

                <td class="tier-cell">
                  <span :class="['tier-badge', getTierClass(item.tier)]">
                    {{ item.tier }}
                  </span>
                </td>

                <td class="action-cell">
                  <button 
                    type="button"
                    @click="removeItem(idx)"
                    class="btn-delete"
                    v-if="form.items.length > 1"
                    title="Hapus item"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-footer">
                <td colspan="5" class="label-cell">Total Permintaan:</td>
                <td class="total-cell">
                  <span class="total-amount grand-total">
                    Rp {{ totalRequest.toLocaleString('id-ID') }}
                  </span>
                </td>
                <td colspan="2"></td>
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

      <!-- Budget Summary -->
      <div class="budget-summary">
        <h3>💰 Ringkasan Anggaran</h3>
        <div class="budget-grid">
          <div class="budget-card">
            <span class="label">Total Tier 1</span>
            <span class="value tier1">Rp {{ tierSummary.tier1.toLocaleString('id-ID') }}</span>
            <p class="detail">< Rp 10 Juta</p>
          </div>
          <div class="budget-card">
            <span class="label">Total Tier 2</span>
            <span class="value tier2">Rp {{ tierSummary.tier2.toLocaleString('id-ID') }}</span>
            <p class="detail">Rp 10-50 Juta</p>
          </div>
          <div class="budget-card">
            <span class="label">Total Tier 3</span>
            <span class="value tier3">Rp {{ tierSummary.tier3.toLocaleString('id-ID') }}</span>
            <p class="detail">> Rp 50 Juta</p>
          </div>
          <div class="budget-card highlight">
            <span class="label">Grand Total</span>
            <span class="value">Rp {{ totalRequest.toLocaleString('id-ID') }}</span>
            <p class="detail">Semua Tier</p>
          </div>
        </div>
      </div>

      <!-- Item Count Info -->
      <div class="info-card">
        <div class="info-row">
          <span>Total Item:</span>
          <strong>{{ form.items.length }} item</strong>
        </div>
        <div class="info-row">
          <span>Tier 1 Items:</span>
          <strong>{{ tier1Items.length }} item</strong>
        </div>
        <div class="info-row">
          <span>Tier 2 Items:</span>
          <strong>{{ tier2Items.length }} item</strong>
        </div>
        <div class="info-row">
          <span>Tier 3 Items:</span>
          <strong>{{ tier3Items.length }} item</strong>
        </div>
      </div>

      <!-- Available Resources Info -->
      <div class="resources-section">
        <div class="resources-grid">
          <div class="resource-card">
            <h4>📚 DIPA Tersedia</h4>
            <div class="resource-count">{{ dipaList.length }}</div>
            <p class="resource-detail">Tahun {{ new Date().getFullYear() }}</p>
          </div>
          <div class="resource-card">
            <h4>🏢 Supplier Terdaftar</h4>
            <div class="resource-count">{{ supplierList.length }}</div>
            <p class="resource-detail">Total supplier</p>
          </div>
          <div class="resource-card">
            <h4>👥 Pejabat Struktural</h4>
            <div class="resource-count">{{ pejabatList.length }}</div>
            <p class="resource-detail">Aktif</p>
          </div>
          <div class="resource-card">
            <h4>👤 Pegawai Terdaftar</h4>
            <div class="resource-count">{{ pegawaiList.length }}</div>
            <p class="resource-detail">Total pegawai</p>
          </div>
        </div>
      </div>

      <!-- Debug Info (Development) -->
      <div v-if="false" style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-size: 12px; border-radius: 4px;">
        <div>satkerList: {{ satkerList ? satkerList.length : 'null' }} items</div>
        <div>pejabatList: {{ pejabatList ? pejabatList.length : 'null' }} items</div>
        <div>pegawaiList: {{ pegawaiList ? pegawaiList.length : 'null' }} items</div>
        <div>dipaList: {{ dipaList ? dipaList.length : 'null' }} items</div>
        <div>supplierList: {{ supplierList ? supplierList.length : 'null' }} items</div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/transaksi" class="btn btn-secondary">
          ← Kembali
        </router-link>
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
          ✓ Ajukan LP
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLembarPermintaanStore } from '../../stores/lembarPermintaanStore';
import { useSatkerStore } from '../../stores/satkerStore';
import { usePegawaiStore } from '../../stores/pegawaiStore';
import { useDipaStore } from '../../stores/dipaStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { convertFormToStoreFormat, saveLPToLocalStorage, formatCurrency } from '../../utils/lpFormIntegration';

const router = useRouter();
const lpStore = useLembarPermintaanStore();
const satkerStore = useSatkerStore();
const pegawaiStore = usePegawaiStore();
const dipaStore = useDipaStore();
const supplierStore = useSupplierStore();

// Generate LP ID
const lpId = ref(`LP-${Date.now()}`);

// Data from stores - with proper null checking
const satkerList = computed(() => {
  try {
    return Array.isArray(satkerStore.activeUnitKerja) ? satkerStore.activeUnitKerja : [];
  } catch {
    return [];
  }
});

const pejabatList = computed(() => {
  try {
    return Array.isArray(satkerStore.activePejabat) ? satkerStore.activePejabat : [];
  } catch {
    return [];
  }
});

const pegawaiList = computed(() => {
  try {
    return Array.isArray(pegawaiStore.pegawaiList) ? pegawaiStore.pegawaiList : [];
  } catch {
    return [];
  }
});

const dipaList = computed(() => {
  try {
    return Array.isArray(dipaStore.dipaList) ? dipaStore.dipaList : [];
  } catch {
    return [];
  }
});

const supplierList = computed(() => {
  try {
    return Array.isArray(supplierStore.supplierList) ? supplierStore.supplierList : [];
  } catch {
    return [];
  }
});

const form = ref({
  unit_name: '',
  request_date: new Date().toISOString().split('T')[0],
  responsible_nip: '',
  description: '',
  items: [
    {
      description: '',
      qty: 1,
      unit: 'Unit',
      estimate_price: 0,
      tier: 'Tier 1'
    }
  ]
});

const errors = computed(() => {
  const errorList = [];
  
  if (!form.value.unit_name) {
    errorList.push('Unit pengajuan harus dipilih');
  }
  
  if (!form.value.request_date) {
    errorList.push('Tanggal permintaan harus diisi');
  }
  
  if (!form.value.responsible_nip) {
    errorList.push('NIP penanggung jawab harus diisi');
  }
  
  form.value.items.forEach((item, idx) => {
    if (!item.description) {
      errorList.push(`Item ${idx + 1}: Deskripsi harus diisi`);
    }
    if (!item.qty || item.qty < 1) {
      errorList.push(`Item ${idx + 1}: Qty harus minimal 1`);
    }
    if (!item.unit) {
      errorList.push(`Item ${idx + 1}: Unit harus diisi`);
    }
    if (!item.estimate_price || item.estimate_price <= 0) {
      errorList.push(`Item ${idx + 1}: Harga harus diisi`);
    }
  });
  
  return errorList;
});

const isFormValid = computed(() => {
  return errors.value.length === 0 && form.value.items.length > 0;
});

const totalRequest = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.qty * item.estimate_price), 0);
});

const getTierForAmount = (amount) => {
  if (amount < 10000000) return 'Tier 1';
  if (amount < 50000000) return 'Tier 2';
  return 'Tier 3';
};

const getTierClass = (tier) => {
  return tier.toLowerCase().replace(' ', '-');
};

const tier1Items = computed(() => {
  return form.value.items.filter(item => item.tier === 'Tier 1');
});

const tier2Items = computed(() => {
  return form.value.items.filter(item => item.tier === 'Tier 2');
});

const tier3Items = computed(() => {
  return form.value.items.filter(item => item.tier === 'Tier 3');
});

const tierSummary = computed(() => {
  return {
    tier1: tier1Items.value.reduce((sum, item) => sum + (item.qty * item.estimate_price), 0),
    tier2: tier2Items.value.reduce((sum, item) => sum + (item.qty * item.estimate_price), 0),
    tier3: tier3Items.value.reduce((sum, item) => sum + (item.qty * item.estimate_price), 0)
  };
});

const updateItemTier = (idx) => {
  const item = form.value.items[idx];
  const total = item.qty * item.estimate_price;
  item.tier = getTierForAmount(total);
};

const addItemRow = () => {
  form.value.items.push({
    description: '',
    qty: 1,
    unit: 'Unit',
    estimate_price: 0,
    tier: 'Tier 1'
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
    lp_id: lpId.value,
    status: 'draft',
    savedAt: new Date().toISOString()
  };
  
  localStorage.setItem(`ppk_lp_draft_${lpId.value}`, JSON.stringify(draftData));
  alert('✓ Draft LP disimpan');
};

const submitLP = async () => {
  if (!isFormValid.value) {
    alert('Harap lengkapi semua data yang diperlukan');
    return;
  }

  try {
    // Prepare LP data
    const lpData = {
      lp_id: lpId.value,
      unit_name: form.value.unit_name,
      request_date: form.value.request_date,
      responsible_nip: form.value.responsible_nip,
      description: form.value.description,
      items: form.value.items,
      total_request: totalRequest.value,
      tier_summary: tierSummary.value,
      status: 'submitted',
      created_at: new Date().toISOString()
    };

    // Convert to store format
    const storeLP = convertFormToStoreFormat(lpData);

    // Save to localStorage
    saveLPToLocalStorage(storeLP);

    // Also add to Pinia store if available
    if (lpStore && typeof lpStore.addLP === 'function') {
      await lpStore.addLP(storeLP);
    }

    alert(`✓ Lembar Permintaan ${lpId.value} berhasil diajukan!\n\nTotal: Rp ${totalRequest.value.toLocaleString('id-ID')}\n\nTier 1: Rp ${tierSummary.value.tier1.toLocaleString('id-ID')}\nTier 2: Rp ${tierSummary.value.tier2.toLocaleString('id-ID')}\nTier 3: Rp ${tierSummary.value.tier3.toLocaleString('id-ID')}`);

    // Redirect to transaksi list
    router.push('/transaksi');
  } catch (err) {
    console.error('Error submitting LP:', err);
    alert('Error: Gagal menyimpan LP - ' + err.message);
  }
};

onMounted(async () => {
  // Load data from stores with better error handling
  try {
    // Load satker data
    if (satkerStore && typeof satkerStore.fetchSatker === 'function') {
      await satkerStore.fetchSatker().catch(() => {});
    }
    if (satkerStore && typeof satkerStore.fetchPejabat === 'function') {
      await satkerStore.fetchPejabat().catch(() => {});
    }
    if (satkerStore && typeof satkerStore.fetchUnitKerja === 'function') {
      await satkerStore.fetchUnitKerja().catch(() => {});
    }
  } catch (err) {
    console.warn('Satker store error:', err);
  }

  try {
    // Load pegawai data
    if (pegawaiStore && typeof pegawaiStore.fetchPegawaiList === 'function') {
      await pegawaiStore.fetchPegawaiList({ limit: 999 }).catch(() => {});
    }
  } catch (err) {
    console.warn('Pegawai store error:', err);
  }

  try {
    // Load DIPA
    if (dipaStore && typeof dipaStore.fetchDipaList === 'function') {
      const tahunAnggaran = new Date().getFullYear();
      await dipaStore.fetchDipaList(tahunAnggaran).catch(() => {});
    }
  } catch (err) {
    console.warn('DIPA store error:', err);
  }

  try {
    // Load suppliers
    if (supplierStore && typeof supplierStore.fetchSupplierList === 'function') {
      await supplierStore.fetchSupplierList().catch(() => {});
    }
  } catch (err) {
    console.warn('Supplier store error:', err);
  }

  // Load draft if exists
  try {
    const draftData = localStorage.getItem(`ppk_lp_draft_${lpId.value}`);
    if (draftData) {
      const draft = JSON.parse(draftData);
      form.value = draft;
    }
  } catch (err) {
    console.warn('Draft load error:', err);
  }
});
</script>

<style scoped>
.lembar-permintaan-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.lp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  padding: 30px;
  border-radius: 12px;
  color: white;
}

.header-content h1 {
  font-size: 32px;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.header-info {
  display: flex;
  gap: 16px;
}

.info-badge {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px 16px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.info-badge .label {
  font-size: 12px;
  opacity: 0.8;
}

.info-badge .value {
  font-size: 16px;
  font-weight: 700;
}

.badge-draft {
  background: #fde047;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

/* Form */
.lp-form {
  background: white;
  border-radius: 8px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  background: #fafafa;
}

.form-section legend {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  padding: 0 8px;
  margin-bottom: 16px;
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

.form-input {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  padding: 12px 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.item-row:hover {
  background: #f9fafb;
}

.row-number {
  text-align: center;
  color: #999;
  font-weight: 600;
}

.form-input-table {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}

.form-input-table:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1);
}

.text-center {
  text-align: center !important;
}

.text-right {
  text-align: right !important;
}

.total-cell {
  text-align: right;
  font-weight: 600;
  color: #1f2937;
}

.total-amount {
  display: inline-block;
  background: #f0fdf4;
  padding: 4px 8px;
  border-radius: 4px;
  color: #065f46;
}

.grand-total {
  font-size: 14px;
  background: #dbeafe;
  color: #1e40af;
}

.tier-cell {
  text-align: center;
}

.tier-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
}

.tier-badge.tier-1 {
  background: #dbeafe;
  color: #1e40af;
}

.tier-badge.tier-2 {
  background: #fef3c7;
  color: #92400e;
}

.tier-badge.tier-3 {
  background: #fee2e2;
  color: #991b1b;
}

.action-cell {
  text-align: center;
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

.total-footer {
  background: #f3f4f6;
  font-weight: 600;
}

.label-cell {
  text-align: right;
  color: #666;
  padding-right: 16px;
}

.btn-add-item {
  background: #f0fdf4;
  border: 1px dashed #bbf7d0;
  padding: 10px 16px;
  border-radius: 6px;
  color: #065f46;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #e0f2fe;
  border-color: #059669;
}

/* Budget Summary */
.budget-summary {
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.budget-summary h3 {
  margin: 0 0 16px 0;
  color: #065f46;
  font-size: 16px;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.budget-card {
  background: white;
  border: 1px solid #bbf7d0;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-card.highlight {
  border-left-color: #3b82f6;
  background: #dbeafe;
}

.budget-card .label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.budget-card .value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.budget-card .value.tier1 {
  color: #1e40af;
}

.budget-card .value.tier2 {
  color: #92400e;
}

.budget-card .value.tier3 {
  color: #991b1b;
}

.budget-card .detail {
  font-size: 11px;
  color: #999;
  margin: 0;
}

/* Info Card */
.info-card {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #dbeafe;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  color: #1e40af;
  font-weight: 700;
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
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #059669);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
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
@media (max-width: 1024px) {
  .lp-header {
    flex-direction: column;
  }

  .header-info {
    margin-top: 16px;
  }

  .items-table th,
  .items-table td {
    padding: 8px 4px;
    font-size: 12px;
  }

  .budget-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .resources-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Resources Section */
.resources-section {
  background: #f5f3ff;
  border: 1px solid #e9d5ff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.resource-card {
  background: white;
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-card h4 {
  margin: 0;
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.resource-count {
  font-size: 28px;
  font-weight: 700;
  color: #6b21a8;
}

.resource-detail {
  margin: 0;
  font-size: 11px;
  color: #999;
}

@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
  }

  .items-table {
    min-width: 800px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .budget-grid {
    grid-template-columns: 1fr;
  }

  .resources-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
