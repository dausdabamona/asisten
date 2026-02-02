<template>
  <div class="tier1-form-container">
    <div class="page-header">
      <h1 class="page-title">Permintaan Tier 1</h1>
      <p class="page-subtitle">Form permintaan untuk kebutuhan yang sudah ada item di DIPA</p>
    </div>

    <form @submit.prevent="submitForm" class="form-card">
      <div class="form-group">
        <label class="form-label required">Nama Barang/Jasa</label>
        <input 
          v-model="form.item_name"
          type="text"
          required
          maxlength="200"
          class="form-input"
          placeholder="Contoh: ATK untuk kegiatan workshop"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea 
          v-model="form.description"
          rows="3"
          class="form-input"
          placeholder="Deskripsi singkat kebutuhan"
        />
      </div>

      <div class="form-group">
        <label class="form-label required">Item DIPA (Kode Anggaran)</label>
        <input
          v-model="dipaSearch"
          type="text"
          class="form-input search-input"
          placeholder="Cari kode akun/uraian item..."
        />
        <div class="dipa-items-list">
          <div v-if="filteredDipaItems.length === 0" class="no-items">
            Belum ada item DIPA. Import DIPA terlebih dahulu.
          </div>
          <label v-for="item in filteredDipaItems" :key="item.id" class="dipa-item">
            <input
              type="checkbox"
              :value="item.id"
              v-model="form.budget_item_ids"
              class="item-checkbox"
            />
            <div class="item-content">
              <div class="item-code">{{ item.kode_akun || '-' }}</div>
              <div class="item-description">{{ item.uraian_item || '-' }}</div>
            </div>
            <div class="item-amount">
              {{ formatCurrency(item.total || 0) }}
            </div>
          </label>
        </div>
        <div class="total-selected">
          Total terpilih: <strong>{{ formatCurrency(budgetTotal) }}</strong>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label required">Unit</label>
        <div class="unit-input-group">
          <input
            v-model="form.unit_name"
            list="unit-options"
            required
            class="form-input"
            placeholder="Masukkan unit"
          />
          <button type="button" @click="addUnit" class="btn-add-unit">Tambah</button>
        </div>
        <datalist id="unit-options">
          <option v-for="unit in units" :key="unit" :value="unit"></option>
        </datalist>
        <div class="unit-tags">
          <span v-for="unit in units" :key="unit" class="unit-tag">
            {{ unit }}
          </span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label required">Penanggung Jawab Unit</label>
        <select v-model="form.unit_responsible_nip" required class="form-input">
          <option value="">Pilih Pegawai</option>
          <option v-for="pegawai in pegawaiList" :key="pegawai.nip" :value="pegawai.nip">
            {{ pegawai.nama }} ({{ pegawai.nip }})
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button type="button" @click="$router.back()" class="btn-cancel">
          Batal
        </button>
        <button type="submit" class="btn-submit">
          Simpan Permintaan
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Tier1FormView',
  data() {
    return {
      form: {
        item_name: '',
        description: '',
        budget_item_ids: [],
        unit_name: '',
        unit_responsible_nip: '',
        tier: 'tier1',
        requester_id: 'admin-id',
        status: 'draft'
      },
      dipaSearch: '',
      dipaItems: [],
      pegawaiList: [],
      units: ['Bagian Umum', 'Bagian Keuangan', 'Bagian Perencanaan', 'Bagian SDM']
    };
  },
  computed: {
    filteredDipaItems() {
      if (!this.dipaSearch) return this.dipaItems;
      
      const search = this.dipaSearch.toLowerCase();
      return this.dipaItems.filter(item => {
        return (
          (item.kode_akun && item.kode_akun.toLowerCase().includes(search)) ||
          (item.uraian_item && item.uraian_item.toLowerCase().includes(search))
        );
      });
    },
    budgetTotal() {
      return this.form.budget_item_ids.reduce((total, itemId) => {
        const item = this.dipaItems.find(d => d.id === itemId);
        return total + (item?.total || 0);
      }, 0);
    }
  },
  methods: {
    async loadData() {
      try {
        // Load DIPA items
        if (window.electronAPI) {
          const dipaData = await window.electronAPI.itemsList();
          this.dipaItems = dipaData || [];
        } else {
          const mockData = JSON.parse(localStorage.getItem('ppk_mock_data') || '{}');
          this.dipaItems = mockData.dipa?.items || [];
        }

        // Load pegawai
        if (window.electronAPI) {
          const pegawaiData = await window.electronAPI.pegawaiList();
          this.pegawaiList = pegawaiData || [];
        } else {
          const mockData = JSON.parse(localStorage.getItem('ppk_mock_data') || '{}');
          this.pegawaiList = mockData.pegawai || [];
        }

        // Load existing data if editing
        const id = this.$route.query.id;
        if (id) {
          const savedRequests = JSON.parse(localStorage.getItem('ppk_requests') || '[]');
          const existing = savedRequests.find(r => r.id === id);
          if (existing) {
            this.form = { ...existing };
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    },
    formatCurrency(value) {
      if (!value || value === 0) return 'Rp 0';
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(value);
    },
    addUnit() {
      const unit = this.form.unit_name?.trim();
      if (!unit) {
        alert('Masukkan nama unit terlebih dahulu');
        return;
      }
      
      if (!this.units.includes(unit)) {
        this.units.push(unit);
        alert(`Unit "${unit}" berhasil ditambahkan`);
      } else {
        alert('Unit sudah ada dalam daftar');
      }
    },
    submitForm() {
      if (this.form.budget_item_ids.length === 0) {
        alert('Pilih minimal satu item DIPA');
        return;
      }

      try {
        // Prepare request data
        const request = {
          ...this.form,
          budget_total: this.budgetTotal,
          created_at: new Date().toISOString()
        };

        // Check if editing
        const id = this.$route.query.id;
        if (id) {
          request.id = id;
          request.updated_at = new Date().toISOString();
        } else {
          request.id = 'req-' + Date.now();
        }

        // Save to localStorage
        const savedRequests = JSON.parse(localStorage.getItem('ppk_requests') || '[]');
        
        if (id) {
          const index = savedRequests.findIndex(r => r.id === id);
          if (index >= 0) {
            savedRequests[index] = request;
          }
        } else {
          savedRequests.push(request);
        }

        localStorage.setItem('ppk_requests', JSON.stringify(savedRequests));

        alert('Permintaan Tier 1 berhasil disimpan!');
        this.$router.push('/transaksi');
      } catch (error) {
        console.error('Error saving request:', error);
        alert('Gagal menyimpan permintaan');
      }
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>

<style scoped>
.tier1-form-container {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.form-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input {
  margin-bottom: 12px;
}

.dipa-items-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  max-height: 320px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.no-items {
  color: #94a3b8;
  text-align: center;
  padding: 24px;
  font-size: 14px;
}

.dipa-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.dipa-item:hover {
  background: #f8fafc;
}

.item-checkbox {
  margin-top: 4px;
  cursor: pointer;
}

.item-content {
  flex: 1;
}

.item-code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.item-description {
  font-size: 14px;
  color: #1e293b;
}

.item-amount {
  font-weight: 500;
  color: #059669;
  white-space: nowrap;
  font-size: 14px;
}

.total-selected {
  font-size: 14px;
  color: #475569;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 6px;
}

.total-selected strong {
  color: #059669;
  font-size: 16px;
}

.unit-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.btn-add-unit {
  padding: 10px 16px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-add-unit:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.unit-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.unit-tag {
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 10px 24px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.btn-submit {
  padding: 10px 24px;
  background: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: #2563eb;
  border-color: #2563eb;
}
</style>
