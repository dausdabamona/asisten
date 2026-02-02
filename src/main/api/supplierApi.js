/**
 * Supplier API Handler
 * Handles IPC for supplier (vendor) operations with pagination, search, and filtering
 */

const { ipcMain } = require('electron');

class SupplierApi {
  constructor(db) {
    this.db = db;
    this.registerHandlers();
  }

  registerHandlers() {
    ipcMain.handle('supplier:list', (_, params) => this.getSupplierList(params));
    ipcMain.handle('supplier:get', (_, id) => this.getSupplierById(id));
    ipcMain.handle('supplier:create', (_, data) => this.createSupplier(data));
    ipcMain.handle('supplier:update', (_, { id, data }) => this.updateSupplier(id, data));
    ipcMain.handle('supplier:delete', (_, id) => this.deleteSupplier(id));
    ipcMain.handle('supplier:search', (_, params) => this.searchSupplier(params));
  }

  // ==================== List with Pagination ====================

  getSupplierList(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        jenis = '',
        status = '',
        kualifikasi_usaha = '',
        is_narasumber = false
      } = params;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];

      // Search by name, NPWP, or NIK
      if (search) {
        conditions.push('(s.nama LIKE ? OR s.npwp LIKE ? OR s.nik LIKE ?)');
        values.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Filter by jenis
      if (jenis) {
        conditions.push('s.jenis = ?');
        values.push(jenis);
      }

      // Filter by status
      if (status) {
        conditions.push('s.status = ?');
        values.push(status);
      }

      // Filter by kualifikasi_usaha (for BADAN_USAHA)
      if (kualifikasi_usaha) {
        conditions.push('s.kualifikasi_usaha = ?');
        values.push(kualifikasi_usaha);
      }

      // Filter narasumber (PERORANGAN with klasifikasi_honor)
      if (is_narasumber) {
        conditions.push("s.jenis = 'PERORANGAN' AND s.klasifikasi_honor IS NOT NULL AND s.klasifikasi_honor != ''");
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM supplier s ${whereClause}`;
      const totalResult = this.db.prepare(countQuery).get(...values);
      const total = totalResult.total;

      // Get paginated data
      const dataQuery = `
        SELECT s.*
        FROM supplier s
        ${whereClause}
        ORDER BY s.nama
        LIMIT ? OFFSET ?
      `;

      const data = this.db.prepare(dataQuery).all(...values, limit, offset);

      return {
        data,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting supplier list:', error);
      throw error;
    }
  }

  // ==================== Get by ID ====================

  getSupplierById(id) {
    try {
      const supplier = this.db.prepare(`
        SELECT * FROM supplier WHERE id = ?
      `).get(id);

      if (!supplier) {
        throw new Error('Supplier not found');
      }

      return supplier;
    } catch (error) {
      console.error('Error getting supplier:', error);
      throw error;
    }
  }

  // ==================== Create ====================

  createSupplier(data) {
    try {
      // Validate required fields based on jenis
      if (!data.jenis || !data.nama) {
        throw new Error('Jenis dan Nama wajib diisi');
      }

      if (data.jenis === 'BADAN_USAHA' && !data.npwp) {
        throw new Error('NPWP wajib diisi untuk Badan Usaha');
      }

      if (data.jenis === 'PERORANGAN' && !data.nik) {
        throw new Error('NIK wajib diisi untuk Perorangan');
      }

      // Check for duplicate NPWP
      if (data.npwp) {
        const existingNpwp = this.db.prepare('SELECT id FROM supplier WHERE npwp = ?').get(data.npwp);
        if (existingNpwp) {
          throw new Error('NPWP sudah terdaftar');
        }
      }

      // Check for duplicate NIK
      if (data.nik) {
        const existingNik = this.db.prepare('SELECT id FROM supplier WHERE nik = ?').get(data.nik);
        if (existingNik) {
          throw new Error('NIK sudah terdaftar');
        }
      }

      // Build insert query dynamically
      const fields = [];
      const placeholders = [];
      const insertValues = [];

      const allowedFields = [
        'jenis', 'nama', 'bentuk_usaha', 'bidang_usaha',
        'alamat', 'kota', 'provinsi', 'kode_pos',
        'telepon', 'fax', 'email', 'website',
        'nib', 'npwp', 'nama_wp', 'is_pkp',
        'nomor_siup', 'tanggal_siup', 'masa_berlaku_siup',
        'nomor_akta_pendirian', 'tanggal_akta_pendirian', 'notaris_akta_pendirian',
        'nomor_akta_perubahan', 'tanggal_akta_perubahan',
        'nama_direktur', 'nik_direktur', 'jabatan_direktur', 'hp_direktur',
        'nama_cp', 'jabatan_cp', 'hp_cp', 'email_cp',
        'nama_bank', 'nomor_rekening', 'nama_rekening',
        'kualifikasi_usaha', 'bidang_pengadaan',
        'nik', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
        'status_pekerjaan', 'instansi', 'jabatan', 'kota_instansi',
        'pendidikan_terakhir', 'bidang_keahlian', 'klasifikasi_honor',
        'status', 'catatan'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined && data[field] !== '') {
          fields.push(field);
          placeholders.push('?');
          insertValues.push(data[field]);
        }
      }

      const stmt = this.db.prepare(`
        INSERT INTO supplier (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
      `);

      const result = stmt.run(...insertValues);
      return this.getSupplierById(result.lastInsertRowid);
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  // ==================== Update ====================

  updateSupplier(id, data) {
    try {
      const supplier = this.db.prepare('SELECT * FROM supplier WHERE id = ?').get(id);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Check for duplicate NPWP if changing
      if (data.npwp && data.npwp !== supplier.npwp) {
        const existingNpwp = this.db.prepare('SELECT id FROM supplier WHERE npwp = ? AND id != ?').get(data.npwp, id);
        if (existingNpwp) {
          throw new Error('NPWP sudah terdaftar');
        }
      }

      // Check for duplicate NIK if changing
      if (data.nik && data.nik !== supplier.nik) {
        const existingNik = this.db.prepare('SELECT id FROM supplier WHERE nik = ? AND id != ?').get(data.nik, id);
        if (existingNik) {
          throw new Error('NIK sudah terdaftar');
        }
      }

      const fields = [];
      const updateValues = [];

      const allowedFields = [
        'jenis', 'nama', 'bentuk_usaha', 'bidang_usaha',
        'alamat', 'kota', 'provinsi', 'kode_pos',
        'telepon', 'fax', 'email', 'website',
        'nib', 'npwp', 'nama_wp', 'is_pkp',
        'nomor_siup', 'tanggal_siup', 'masa_berlaku_siup',
        'nomor_akta_pendirian', 'tanggal_akta_pendirian', 'notaris_akta_pendirian',
        'nomor_akta_perubahan', 'tanggal_akta_perubahan',
        'nama_direktur', 'nik_direktur', 'jabatan_direktur', 'hp_direktur',
        'nama_cp', 'jabatan_cp', 'hp_cp', 'email_cp',
        'nama_bank', 'nomor_rekening', 'nama_rekening',
        'kualifikasi_usaha', 'bidang_pengadaan',
        'nik', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
        'status_pekerjaan', 'instansi', 'jabatan', 'kota_instansi',
        'pendidikan_terakhir', 'bidang_keahlian', 'klasifikasi_honor',
        'status', 'catatan'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          updateValues.push(data[field] === '' ? null : data[field]);
        }
      }

      if (fields.length === 0) {
        return supplier;
      }

      updateValues.push(id);

      this.db.prepare(`
        UPDATE supplier SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...updateValues);

      return this.getSupplierById(id);
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  // ==================== Delete ====================

  deleteSupplier(id) {
    try {
      const supplier = this.db.prepare('SELECT * FROM supplier WHERE id = ?').get(id);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Check if supplier has contracts
      const contractCount = this.db.prepare(
        'SELECT COUNT(*) as count FROM contracts WHERE vendor_id = ?'
      ).get(id);

      if (contractCount && contractCount.count > 0) {
        throw new Error('Supplier memiliki kontrak terdaftar dan tidak dapat dihapus');
      }

      this.db.prepare('DELETE FROM supplier WHERE id = ?').run(id);
      return { success: true, id };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // ==================== Search (for autocomplete) ====================

  searchSupplier(params = {}) {
    try {
      const { query = '', jenis = null, limit = 20 } = params;

      if (!query || query.length < 2) {
        return [];
      }

      const conditions = ['(s.nama LIKE ? OR s.npwp LIKE ? OR s.nik LIKE ?)'];
      const values = [`%${query}%`, `%${query}%`, `%${query}%`];

      if (jenis) {
        if (jenis === 'NARASUMBER') {
          conditions.push("s.jenis = 'PERORANGAN' AND s.klasifikasi_honor IS NOT NULL");
        } else {
          conditions.push('s.jenis = ?');
          values.push(jenis);
        }
      }

      conditions.push("s.status = 'AKTIF'");

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const data = this.db.prepare(`
        SELECT s.id, s.jenis, s.nama, s.npwp, s.nik, s.kota, s.klasifikasi_honor,
               s.nama_bank, s.nomor_rekening, s.nama_rekening
        FROM supplier s
        ${whereClause}
        ORDER BY s.nama
        LIMIT ?
      `).all(...values, limit);

      return data;
    } catch (error) {
      console.error('Error searching supplier:', error);
      throw error;
    }
  }
}

module.exports = SupplierApi;
