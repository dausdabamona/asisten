/**
 * Surat Tugas Store - Manage surat tugas state
 */

import { defineStore } from 'pinia';

export const useSuratTugasStore = defineStore('suratTugas', {
  state: () => ({
    stList: [],
    currentST: null,
    pelaksanaList: [],
    ruteList: [],
    biayaList: [],
    buktiList: [],
    dokumenList: [],
    logs: [],
    
    // Filters & Pagination
    filters: {
      jenis: null,
      status: null,
      search: '',
      tanggal_dari: null,
      tanggal_sampai: null
    },
    
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    },
    
    loading: false,
    error: null
  }),

  getters: {
    stByStatus: (state) => (status) => {
      return state.stList.filter(st => st.status === status);
    },
    
    stByJenis: (state) => (jenis) => {
      return state.stList.filter(st => st.jenis === jenis);
    },
    
    totalBiaya: (state) => {
      return state.pelaksanaList.reduce((sum, p) => sum + (p.total_biaya || 0), 0);
    },
    
    totalPages: (state) => {
      return Math.ceil(state.pagination.total / state.pagination.limit);
    },
    
    statusColor: () => (status) => {
      const colors = {
        DRAFT: 'gray',
        DISETUJUI: 'blue',
        SPPD_TERBIT: 'cyan',
        BERANGKAT: 'purple',
        KEMBALI: 'orange',
        PEMBAYARAN: 'yellow',
        SELESAI: 'green',
        BATAL: 'red'
      };
      return colors[status] || 'gray';
    },
    
    jenisLabel: () => (jenis) => {
      const labels = {
        DALAM_KOTA: 'Dalam Kota',
        LUAR_KOTA: 'Luar Kota',
        LUAR_PROVINSI: 'Luar Provinsi'
      };
      return labels[jenis] || jenis;
    }
  },

  actions: {
    // === SURAT TUGAS ACTIONS ===
    
    async fetchSTList(filters = {}) {
      this.loading = true;
      this.error = null;
      
      try {
        const params = {
          ...this.filters,
          ...filters,
          limit: this.pagination.limit,
          offset: (this.pagination.page - 1) * this.pagination.limit
        };
        
        const result = await window.api.invoke('st:list', params);
        
        if (result.success) {
          this.stList = result.data.items;
          this.pagination.total = result.data.total;
        } else {
          this.error = result.error;
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching ST list:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async fetchSTById(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:get', id);
        
        if (result.success) {
          this.currentST = result.data;
          
          // Also fetch related data
          await Promise.all([
            this.fetchPelaksanaList(id),
            this.fetchRuteList(id),
            this.fetchBuktiList(id)
          ]);
        } else {
          this.error = result.error;
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching ST:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async generateNomor(jenis, tahun) {
      try {
        const result = await window.api.invoke('st:nomor:generate', { jenis, tahun });
        
        if (result.success) {
          return result.data.nomor;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error generating nomor ST:', error);
        throw error;
      }
    },
    
    async createST(data) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:create', data);
        
        if (result.success) {
          await this.fetchSTList();
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error creating ST:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async updateST(id, data, userId, userName) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:update', { id, data, userId, userName });
        
        if (result.success) {
          await this.fetchSTById(id);
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error updating ST:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async deleteST(id, userId, userName) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:delete', { id, userId, userName });
        
        if (result.success) {
          await this.fetchSTList();
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error deleting ST:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // === PELAKSANA ACTIONS ===
    
    async fetchPelaksanaList(suratTugasId) {
      try {
        const result = await window.api.invoke('st:pelaksana:list', suratTugasId);
        
        if (result.success) {
          this.pelaksanaList = result.data;
        } else {
          this.error = result.error;
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching pelaksana list:', error);
      }
    },
    
    async addPelaksana(data) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:pelaksana:add', data);
        
        if (result.success) {
          await this.fetchPelaksanaList(data.surat_tugas_id);
          await this.fetchSTById(data.surat_tugas_id);
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error adding pelaksana:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async updatePelaksana(id, data) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:pelaksana:update', { id, data });
        
        if (result.success) {
          const pelaksana = this.pelaksanaList.find(p => p.id === id);
          if (pelaksana) {
            await this.fetchPelaksanaList(pelaksana.surat_tugas_id);
            await this.fetchSTById(pelaksana.surat_tugas_id);
          }
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error updating pelaksana:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async deletePelaksana(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const pelaksana = this.pelaksanaList.find(p => p.id === id);
        
        const result = await window.api.invoke('st:pelaksana:delete', id);
        
        if (result.success) {
          if (pelaksana) {
            await this.fetchPelaksanaList(pelaksana.surat_tugas_id);
            await this.fetchSTById(pelaksana.surat_tugas_id);
          }
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error deleting pelaksana:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // === RUTE ACTIONS ===
    
    async fetchRuteList(suratTugasId) {
      try {
        const result = await window.api.invoke('st:rute:list', suratTugasId);
        
        if (result.success) {
          this.ruteList = result.data;
        } else {
          this.error = result.error;
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching rute list:', error);
      }
    },
    
    async addRute(data) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:rute:add', data);
        
        if (result.success) {
          await this.fetchRuteList(data.surat_tugas_id);
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error adding rute:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async updateRute(id, data) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:rute:update', { id, data });
        
        if (result.success) {
          const rute = this.ruteList.find(r => r.id === id);
          if (rute) {
            await this.fetchRuteList(rute.surat_tugas_id);
          }
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error updating rute:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async deleteRute(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const rute = this.ruteList.find(r => r.id === id);
        
        const result = await window.api.invoke('st:rute:delete', id);
        
        if (result.success) {
          if (rute) {
            await this.fetchRuteList(rute.surat_tugas_id);
          }
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error deleting rute:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // === BIAYA ACTIONS ===
    
    async calculateBiaya(suratTugasId) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:biaya:calculate', { suratTugasId });
        
        if (result.success) {
          await this.fetchPelaksanaList(suratTugasId);
          await this.fetchSTById(suratTugasId);
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error calculating biaya:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async updateBiaya(pelaksanaId, biaya) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:biaya:update', { pelaksanaId, biaya });
        
        if (result.success) {
          const pelaksana = this.pelaksanaList.find(p => p.id === pelaksanaId);
          if (pelaksana) {
            await this.fetchPelaksanaList(pelaksana.surat_tugas_id);
            await this.fetchSTById(pelaksana.surat_tugas_id);
          }
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error updating biaya:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // === BUKTI ACTIONS ===
    
    async fetchBuktiList(suratTugasId) {
      try {
        const result = await window.api.invoke('st:bukti:list', suratTugasId);
        
        if (result.success) {
          this.buktiList = result.data;
        } else {
          this.error = result.error;
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching bukti list:', error);
      }
    },
    
    async addBukti(data) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:bukti:add', data);
        
        if (result.success) {
          await this.fetchBuktiList(data.surat_tugas_id);
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error adding bukti:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async deleteBukti(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const bukti = this.buktiList.find(b => b.id === id);
        
        const result = await window.api.invoke('st:bukti:delete', id);
        
        if (result.success) {
          if (bukti) {
            await this.fetchBuktiList(bukti.surat_tugas_id);
          }
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error deleting bukti:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // === PERTANGGUNGJAWABAN ACTIONS ===
    
    async updatePertanggungjawaban(id, data, userId, userName) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:pertanggungjawaban:update', { id, data, userId, userName });
        
        if (result.success) {
          await this.fetchSTById(id);
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error updating pertanggungjawaban:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // === DOKUMEN ACTIONS ===
    
    async generateDokumen(suratTugasId, jenisDokumen) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await window.api.invoke('st:dokumen:generate', { suratTugasId, jenisDokumen });
        
        if (result.success) {
          return result.data;
        } else {
          this.error = result.error;
          throw new Error(result.error);
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error generating dokumen:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // === FILTER & PAGINATION ===
    
    setFilter(key, value) {
      this.filters[key] = value;
    },
    
    clearFilters() {
      this.filters = {
        jenis: null,
        status: null,
        search: '',
        tanggal_dari: null,
        tanggal_sampai: null
      };
    },
    
    setPage(page) {
      this.pagination.page = page;
    },
    
    nextPage() {
      if (this.pagination.page < this.totalPages) {
        this.pagination.page++;
      }
    },
    
    prevPage() {
      if (this.pagination.page > 1) {
        this.pagination.page--;
      }
    },
    
    // === HELPERS ===
    
    hitungSelisih(biayaAktual, uangMuka) {
      const selisih = biayaAktual - uangMuka;
      
      let statusSelisih = 'PAS';
      if (Math.abs(selisih) >= 1000) {
        statusSelisih = selisih > 0 ? 'KURANG' : 'LEBIH';
      }
      
      return { selisih, statusSelisih };
    },
    
    formatRupiah(amount) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount || 0);
    },
    
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
  }
});
