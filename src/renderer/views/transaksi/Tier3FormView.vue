<template>
  <div class="tier3-form-container">
    <div class="page-header">
      <h1 class="page-title">Permintaan Tier 3</h1>
      <p class="page-subtitle">Form permintaan untuk kebutuhan yang belum terdapat di DIPA dan di luar MAK</p>
    </div>

    <form @submit.prevent="submitForm" class="form-card">
      <div class="form-group">
        <label class="form-label required">Nama Barang/Jasa</label>
        <input 
          v-model="form.item_name"
          type="text"
          required
          class="form-input"
          placeholder="Contoh: Kendaraan dinas operasional"
        />
      </div>

      <div class="form-group">
        <label class="form-label required">Deskripsi & Justifikasi</label>
        <textarea 
          v-model="form.description"
          rows="5"
          required
          class="form-input"
          placeholder="Jelaskan kebutuhan, alasan permintaan, dan justifikasi kenapa diperlukan"
        />
      </div>

      <div class="form-group">
        <label class="form-label required">Perkiraan Nilai</label>
        <input 
          v-model.number="form.estimated_value"
          type="number"
          required
          min="0"
          class="form-input"
          placeholder="0"
        />
        <div class="help-text">
          Perkiraan: {{ formatCurrency(form.estimated_value) }}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label required">Usulan Sumber Dana</label>
        <select v-model="form.funding_source" required class="form-input">
          <option value="">Pilih Sumber Dana</option>
          <option value="revisi_dipa">Revisi DIPA</option>
          <option value="pnbp">PNBP</option>
          <option value="hibah">Hibah</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label required">Unit</label>
        <input 
          v-model="form.unit_name"
          type="text"
          required
          class="form-input"
          placeholder="Nama unit"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Catatan Tambahan</label>
        <textarea 
          v-model="form.notes"
          rows="3"
          class="form-input"
          placeholder="Catatan atau informasi tambahan"
        />
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
  name: 'Tier3FormView',
  data() {
    return {
      form: {
        item_name: '',
        description: '',
        estimated_value: 0,
        funding_source: '',
        unit_name: '',
        notes: '',
        tier: 'tier3',
        requester_id: 'admin-id',
        status: 'draft'
      }
    };
  },
  methods: {
    formatCurrency(value) {
      if (!value || value === 0) return 'Rp 0';
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(value);
    },
    submitForm() {
      try {
        const request = {
          ...this.form,
          budget_total: this.form.estimated_value,
          id: 'req-' + Date.now(),
          created_at: new Date().toISOString()
        };

        const savedRequests = JSON.parse(localStorage.getItem('ppk_requests') || '[]');
        savedRequests.push(request);
        localStorage.setItem('ppk_requests', JSON.stringify(savedRequests));

        alert('Permintaan Tier 3 berhasil disimpan!');
        this.$router.push('/transaksi');
      } catch (error) {
        console.error('Error saving request:', error);
        alert('Gagal menyimpan permintaan');
      }
    }
  }
};
</script>

<style scoped>
.tier3-form-container {
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

.help-text {
  margin-top: 6px;
  font-size: 13px;
  color: #059669;
  font-weight: 500;
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
