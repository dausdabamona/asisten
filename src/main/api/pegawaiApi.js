/**
 * Pegawai API Handler
 * Handles IPC for pegawai (employee) operations with pagination, search, and CSV import/export
 */

const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class PegawaiApi {
  constructor(db) {
    this.db = db;
    this.registerHandlers();
  }

  registerHandlers() {
    ipcMain.handle('pegawai:list', (_, params) => this.getPegawaiList(params));
    ipcMain.handle('pegawai:get', (_, id) => this.getPegawaiById(id));
    ipcMain.handle('pegawai:create', (_, data) => this.createPegawai(data));
    ipcMain.handle('pegawai:update', (_, { id, data }) => this.updatePegawai(id, data));
    ipcMain.handle('pegawai:delete', (_, id) => this.deletePegawai(id));
    ipcMain.handle('pegawai:import-csv', (_, content) => this.importFromCSV(content));
    ipcMain.handle('pegawai:export-csv', (_, filters) => this.exportToCSV(filters));
  }

  // ==================== List with Pagination ====================

  getPegawaiList(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        unit_kerja_id = '',
        status = '',
        golongan = '',
        status_pegawai = ''
      } = params;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];

      // Search by name or NIP
      if (search) {
        conditions.push('(p.nama LIKE ? OR p.nip LIKE ?)');
        values.push(`%${search}%`, `%${search}%`);
      }

      // Filter by unit kerja
      if (unit_kerja_id) {
        conditions.push('p.unit_kerja_id = ?');
        values.push(unit_kerja_id);
      }

      // Filter by status (active/inactive)
      if (status) {
        conditions.push('p.status = ?');
        values.push(status);
      }

      // Filter by golongan
      if (golongan) {
        conditions.push('p.golongan = ?');
        values.push(golongan);
      }

      // Filter by status pegawai (ASN/PPPK/Honorer)
      if (status_pegawai) {
        conditions.push('p.status_pegawai = ?');
        values.push(status_pegawai);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total FROM pegawai p ${whereClause}
      `;
      const totalResult = this.db.prepare(countQuery).get(...values);
      const total = totalResult.total;

      // Get paginated data
      const dataQuery = `
        SELECT p.*, uk.nama as unit_kerja_nama, uk.kode as unit_kerja_kode
        FROM pegawai p
        LEFT JOIN unit_kerja uk ON p.unit_kerja_id = uk.id
        ${whereClause}
        ORDER BY p.nama
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
      console.error('Error getting pegawai list:', error);
      throw error;
    }
  }

  // ==================== Get by ID ====================

  getPegawaiById(id) {
    try {
      const pegawai = this.db.prepare(`
        SELECT p.*, uk.nama as unit_kerja_nama, uk.kode as unit_kerja_kode
        FROM pegawai p
        LEFT JOIN unit_kerja uk ON p.unit_kerja_id = uk.id
        WHERE p.id = ?
      `).get(id);

      if (!pegawai) {
        throw new Error('Pegawai not found');
      }

      return pegawai;
    } catch (error) {
      console.error('Error getting pegawai:', error);
      throw error;
    }
  }

  // ==================== Create ====================

  createPegawai(data) {
    try {
      // Validate required fields
      if (!data.nip || !data.nama) {
        throw new Error('NIP dan Nama wajib diisi');
      }

      // Check for duplicate NIP
      const existing = this.db.prepare('SELECT id FROM pegawai WHERE nip = ?').get(data.nip);
      if (existing) {
        throw new Error('NIP sudah terdaftar');
      }

      const id = uuidv4();

      const stmt = this.db.prepare(`
        INSERT INTO pegawai (
          id, nip, nik, nama, gelar_depan, gelar_belakang,
          tempat_lahir, tanggal_lahir, jenis_kelamin,
          alamat, no_hp, email, npwp,
          status_pegawai, pangkat, golongan, tmt_pangkat,
          jenis_jabatan, nama_jabatan, eselon, unit_kerja_id,
          nama_bank, no_rekening, atas_nama_rekening,
          status
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?
        )
      `);

      stmt.run(
        id,
        data.nip,
        data.nik || null,
        data.nama,
        data.gelar_depan || null,
        data.gelar_belakang || null,
        data.tempat_lahir || null,
        data.tanggal_lahir || null,
        data.jenis_kelamin || null,
        data.alamat || null,
        data.no_hp || null,
        data.email || null,
        data.npwp || null,
        data.status_pegawai || 'ASN',
        data.pangkat || null,
        data.golongan || null,
        data.tmt_pangkat || null,
        data.jenis_jabatan || null,
        data.nama_jabatan || null,
        data.eselon || null,
        data.unit_kerja_id || null,
        data.nama_bank || null,
        data.no_rekening || null,
        data.atas_nama_rekening || null,
        data.status || 'aktif'
      );

      return this.getPegawaiById(id);
    } catch (error) {
      console.error('Error creating pegawai:', error);
      throw error;
    }
  }

  // ==================== Update ====================

  updatePegawai(id, data) {
    try {
      const pegawai = this.db.prepare('SELECT * FROM pegawai WHERE id = ?').get(id);
      if (!pegawai) {
        throw new Error('Pegawai not found');
      }

      // Check for duplicate NIP if changing
      if (data.nip && data.nip !== pegawai.nip) {
        const existing = this.db.prepare('SELECT id FROM pegawai WHERE nip = ? AND id != ?').get(data.nip, id);
        if (existing) {
          throw new Error('NIP sudah terdaftar');
        }
      }

      const fields = [];
      const values = [];

      const allowedFields = [
        'nip', 'nik', 'nama', 'gelar_depan', 'gelar_belakang',
        'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
        'alamat', 'no_hp', 'email', 'npwp',
        'status_pegawai', 'pangkat', 'golongan', 'tmt_pangkat',
        'jenis_jabatan', 'nama_jabatan', 'eselon', 'unit_kerja_id',
        'nama_bank', 'no_rekening', 'atas_nama_rekening',
        'status'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return pegawai;
      }

      values.push(id);

      this.db.prepare(`
        UPDATE pegawai SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values);

      return this.getPegawaiById(id);
    } catch (error) {
      console.error('Error updating pegawai:', error);
      throw error;
    }
  }

  // ==================== Delete ====================

  deletePegawai(id) {
    try {
      const pegawai = this.db.prepare('SELECT * FROM pegawai WHERE id = ?').get(id);
      if (!pegawai) {
        throw new Error('Pegawai not found');
      }

      this.db.prepare('DELETE FROM pegawai WHERE id = ?').run(id);
      return { success: true, id };
    } catch (error) {
      console.error('Error deleting pegawai:', error);
      throw error;
    }
  }

  // ==================== Import CSV ====================

  importFromCSV(content) {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('File CSV kosong atau tidak valid');
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredFields = ['nip', 'nama'];
      for (const field of requiredFields) {
        if (!header.includes(field)) {
          throw new Error(`Field wajib tidak ditemukan: ${field}`);
        }
      }

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Process rows
      const insertStmt = this.db.prepare(`
        INSERT OR IGNORE INTO pegawai (
          id, nip, nama, status_pegawai, golongan, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};

        header.forEach((h, index) => {
          row[h] = values[index] || null;
        });

        if (!row.nip || !row.nama) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: NIP atau Nama kosong`);
          continue;
        }

        try {
          insertStmt.run(
            uuidv4(),
            row.nip,
            row.nama,
            row.status_pegawai || 'ASN',
            row.golongan || null,
            'aktif'
          );
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: ${err.message}`);
        }
      }

      return {
        success: true,
        imported: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10) // Limit errors shown
      };
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw error;
    }
  }

  // ==================== Export CSV ====================

  exportToCSV(filters = {}) {
    try {
      // Get all pegawai with filters
      const result = this.getPegawaiList({
        ...filters,
        page: 1,
        limit: 10000 // Get all
      });

      if (result.data.length === 0) {
        throw new Error('Tidak ada data untuk diexport');
      }

      // CSV header
      const headers = [
        'NIP', 'NIK', 'Nama', 'Gelar Depan', 'Gelar Belakang',
        'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin',
        'Alamat', 'No HP', 'Email', 'NPWP',
        'Status Pegawai', 'Pangkat', 'Golongan', 'TMT Pangkat',
        'Jenis Jabatan', 'Nama Jabatan', 'Eselon', 'Unit Kerja',
        'Nama Bank', 'No Rekening', 'Atas Nama Rekening',
        'Status'
      ];

      let csv = headers.join(',') + '\n';

      // Add rows
      for (const row of result.data) {
        const values = [
          row.nip || '',
          row.nik || '',
          row.nama || '',
          row.gelar_depan || '',
          row.gelar_belakang || '',
          row.tempat_lahir || '',
          row.tanggal_lahir || '',
          row.jenis_kelamin || '',
          (row.alamat || '').replace(/,/g, ';'),
          row.no_hp || '',
          row.email || '',
          row.npwp || '',
          row.status_pegawai || '',
          row.pangkat || '',
          row.golongan || '',
          row.tmt_pangkat || '',
          row.jenis_jabatan || '',
          row.nama_jabatan || '',
          row.eselon || '',
          row.unit_kerja_nama || '',
          row.nama_bank || '',
          row.no_rekening || '',
          row.atas_nama_rekening || '',
          row.status || ''
        ];

        csv += values.map(v => `"${v}"`).join(',') + '\n';
      }

      // Save to file
      const exportDir = path.join(app.getPath('userData'), 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `pegawai_export_${timestamp}.csv`;
      const filepath = path.join(exportDir, filename);

      fs.writeFileSync(filepath, csv, 'utf-8');

      return {
        success: true,
        path: filepath,
        filename,
        count: result.data.length
      };
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }
}

module.exports = PegawaiApi;
