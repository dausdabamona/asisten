<template>
  <div class="transaksi-list-container">
    <div class="page-header">
      <h1 class="page-title">Semua Transaksi</h1>
      <p class="page-subtitle">Kelola semua jenis transaksi dalam satu tempat</p>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button @click="$router.push('/requests/formulir')" class="action-card formulir-card">
        <div class="card-icon">📄</div>
        <div class="card-content">
          <h3>Formulir Permintaan</h3>
          <p>Buat formulir realisasi kegiatan (DOCX)</p>
        </div>
      </button>
      <button @click="$router.push('/transaksi/st/tambah')" class="action-card st-card">
        <div class="card-icon">✈️</div>
        <div class="card-content">
          <h3>Surat Tugas</h3>
          <p>Buat surat tugas perjalanan dinas</p>
        </div>
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label for="typeFilter">Jenis Transaksi:</label>
        <select id="typeFilter" v-model="filters.type" class="filter-select">
          <option value="">Semua</option>
          <option value="FP">Formulir Permintaan</option>
          <option value="ST">Surat Tugas</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="statusFilter">Status:</label>
        <select id="statusFilter" v-model="filters.status" class="filter-select">
          <option value="">Semua</option>
          <option value="draft">Draft</option>
          <option value="submitted">Diajukan</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="completed">Selesai</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="searchFilter">Cari:</label>
        <input
          id="searchFilter"
          type="text"
          v-model="filters.search"
          placeholder="Cari nomor, nama item, atau deskripsi..."
          class="filter-input"
        />
      </div>
      <button @click="clearFilters" class="btn-clear">Clear</button>
    </div>

    <!-- Statistics Summary -->
    <div class="stats-summary">
      <div class="stat-card">
        <div class="stat-label">Total Transaksi</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Draft</div>
        <div class="stat-value draft">{{ stats.draft }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Diajukan</div>
        <div class="stat-value submitted">{{ stats.submitted }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Disetujui</div>
        <div class="stat-value approved">{{ stats.approved }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Selesai</div>
        <div class="stat-value completed">{{ stats.completed }}</div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="table-container">
      <table class="transaksi-table">
        <thead>
          <tr>
            <th>Jenis</th>
            <th>Nomor/ID</th>
            <th>Nama/Deskripsi</th>
            <th>Tanggal</th>
            <th>Total Anggaran</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredTransactions.length === 0">
            <td colspan="7" class="no-data">Tidak ada transaksi yang ditemukan</td>
          </tr>
          <tr v-for="transaction in filteredTransactions" :key="transaction.id">
            <td>
              <span :class="'type-badge ' + transaction.type.toLowerCase()">
                {{ getTypeLabel(transaction.type) }}
              </span>
            </td>
            <td class="id-cell">{{ transaction.nomor || transaction.id }}</td>
            <td class="name-cell">
              <div class="item-name">{{ transaction.item_name || transaction.description }}</div>
              <div v-if="transaction.unit_name" class="item-detail">{{ transaction.unit_name }}</div>
            </td>
            <td>{{ formatDate(transaction.created_at) }}</td>
            <td class="budget-cell">{{ formatCurrency(transaction.budget_total) }}</td>
            <td>
              <span :class="'status-badge status-' + transaction.status">
                {{ getStatusLabel(transaction.status) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="viewDetail(transaction)" class="btn-view" title="Lihat Detail">
                  👁️
                </button>
                <button 
                  v-if="transaction.status === 'draft'" 
                  @click="editTransaction(transaction)" 
                  class="btn-edit" 
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  v-if="canDelete(transaction)" 
                  @click="deleteTransaction(transaction)" 
                  class="btn-delete" 
                  title="Hapus"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TransaksiListView',
  data() {
    return {
      filters: {
        type: '',
        status: '',
        search: ''
      },
      transactions: [],
      formulirPermintaan: [],
      stTransactions: []
    };
  },
  computed: {
    allTransactions() {
      // Combine all transaction types
      const combined = [];
      
      // Add Formulir Permintaan transactions
      this.formulirPermintaan.forEach(fp => {
        combined.push({
          ...fp,
          type: 'FP',
          nomor: fp.nomor || `FP-${fp.id || Date.now()}`,
          item_name: fp.nama_kegiatan || 'Formulir Permintaan',
          description: `${fp.tier_label || ''} - ${fp.items?.length || 0} item`,
          unit_name: fp.unit_kerja || '',
          created_at: fp.tanggal || fp.created_at,
          budget_total: fp.total || fp.estimated_value || 0,
          status: fp.status || 'draft'
        });
      });
      
      // Add ST transactions
      this.stTransactions.forEach(st => {
        combined.push({
          ...st,
          type: 'ST',
          nomor: st.nomor_st || st.id,
          created_at: st.tanggal || st.created_at,
          budget_total: st.total_biaya || 0
        });
      });
      
      // Sort by date (newest first)
      return combined.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
      });
    },
    filteredTransactions() {
      let result = this.allTransactions;
      
      // Filter by type
      if (this.filters.type) {
        result = result.filter(t => t.type === this.filters.type);
      }
      
      // Filter by status
      if (this.filters.status) {
        result = result.filter(t => t.status === this.filters.status);
      }
      
      // Filter by search
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        result = result.filter(t => {
          return (
            (t.nomor && t.nomor.toLowerCase().includes(search)) ||
            (t.id && String(t.id).toLowerCase().includes(search)) ||
            (t.item_name && t.item_name.toLowerCase().includes(search)) ||
            (t.description && t.description.toLowerCase().includes(search)) ||
            (t.unit_name && t.unit_name.toLowerCase().includes(search))
          );
        });
      }
      
      return result;
    },
    stats() {
      const all = this.allTransactions;
      return {
        total: all.length,
        draft: all.filter(t => t.status === 'draft').length,
        submitted: all.filter(t => t.status === 'submitted').length,
        approved: all.filter(t => t.status === 'approved').length,
        completed: all.filter(t => t.status === 'completed').length
      };
    }
  },
  methods: {
    async loadData() {
      try {
        // Load Formulir Permintaan from database API
        const fpResult = await window.electronAPI?.formulirPermintaan?.list();
        if (fpResult?.success && fpResult.data) {
          this.formulirPermintaan = fpResult.data;
        } else {
          this.formulirPermintaan = [];
        }
        
        // Load ST transactions from localStorage (or API when available)
        const savedST = localStorage.getItem('ppk_st_transactions');
        if (savedST) {
          this.stTransactions = JSON.parse(savedST);
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    },
    getTypeLabel(type) {
      const labels = {
        'FP': 'Formulir',
        'ST': 'ST'
      };
      return labels[type] || type;
    },
    getStatusLabel(status) {
      const labels = {
        'draft': 'Draft',
        'submitted': 'Diajukan',
        'approved': 'Disetujui',
        'rejected': 'Ditolak',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
      };
      return labels[status] || status;
    },
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    formatCurrency(value) {
      if (!value || value === 0) return '-';
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(value);
    },
    clearFilters() {
      this.filters = {
        type: '',
        status: '',
        search: ''
      };
    },
    viewDetail(transaction) {
      if (transaction.type === 'FP') {
        this.$router.push(`/requests/formulir?id=${transaction.id}`);
      } else if (transaction.type === 'ST') {
        this.$router.push(`/transaksi/st/${transaction.id}`);
      } else {
        alert(`Detail untuk ${transaction.type}: ${transaction.item_name}`);
      }
    },
    editTransaction(transaction) {
      if (transaction.type === 'FP') {
        this.$router.push(`/requests/formulir?id=${transaction.id}`);
      } else if (transaction.type === 'ST') {
        this.$router.push(`/transaksi/st/${transaction.id}/edit`);
      }
    },
    canDelete(transaction) {
      return transaction.status === 'draft';
    },
    async deleteTransaction(transaction) {
      if (!confirm(`Hapus transaksi ${transaction.nomor || transaction.id}?`)) return;
      
      try {
        if (transaction.type === 'FP') {
          // Delete from database API
          const result = await window.electronAPI?.formulirPermintaan?.delete(transaction.id);
          if (result?.success) {
            alert('Formulir Permintaan berhasil dihapus');
          } else {
            throw new Error(result?.error || 'Gagal menghapus');
          }
        } else if (transaction.type === 'ST') {
          this.stTransactions = this.stTransactions.filter(t => t.id !== transaction.id);
          localStorage.setItem('ppk_st_transactions', JSON.stringify(this.stTransactions));
          alert('Surat Tugas berhasil dihapus');
        }
        
        this.loadData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Gagal menghapus transaksi: ' + error.message);
      }
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>

<style scoped>
.transaksi-list-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.formulir-card:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.lp-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.st-card:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

.tier-card:hover {
  border-color: #f59e0b;
  background: #fffbeb;
}

.card-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.card-content h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.card-content p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

/* Filters */
.filters-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.filter-select,
.filter-input {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-clear {
  padding: 10px 20px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #e2e8f0;
}

/* Statistics Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
}

.stat-value.draft {
  color: #64748b;
}

.stat-value.submitted {
  color: #3b82f6;
}

.stat-value.approved {
  color: #10b981;
}

.stat-value.completed {
  color: #8b5cf6;
}

/* Table */
.table-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.transaksi-table {
  width: 100%;
  border-collapse: collapse;
}

.transaksi-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.transaksi-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.transaksi-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #334155;
}

.transaksi-table tbody tr:hover {
  background: #f8fafc;
}

.no-data {
  text-align: center;
  color: #94a3b8;
  padding: 48px 16px !important;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.lp {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.st {
  background: #d1fae5;
  color: #065f46;
}

.type-badge.tier1,
.type-badge.tier2,
.type-badge.tier3 {
  background: #fef3c7;
  color: #92400e;
}

.id-cell {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #64748b;
}

.name-cell {
  max-width: 300px;
}

.item-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.item-detail {
  font-size: 12px;
  color: #64748b;
}

.budget-cell {
  font-weight: 500;
  color: #059669;
  text-align: right;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-draft {
  background: #f1f5f9;
  color: #475569;
}

.status-badge.status-submitted {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.status-completed {
  background: #ede9fe;
  color: #5b21b6;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-buttons button:hover {
  background: #f1f5f9;
  transform: scale(1.1);
}

.btn-view:hover {
  border-color: #3b82f6;
}

.btn-edit:hover {
  border-color: #f59e0b;
}

.btn-delete:hover {
  border-color: #ef4444;
}
</style>
