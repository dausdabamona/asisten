/**
 * Satker API Handler
 * Handles IPC for satker, pejabat, and unit kerja operations
 */

const { ipcMain } = require('electron');

class SatkerApi {
  constructor(db) {
    this.db = db;
    this.registerHandlers();
  }

  registerHandlers() {
    // Satker handlers
    ipcMain.handle('satker:get', () => this.getSatker());
    ipcMain.handle('satker:update', (_, data) => this.updateSatker(data));

    // Pejabat handlers
    ipcMain.handle('pejabat:list', () => this.getPejabatList());
    ipcMain.handle('pejabat:create', (_, data) => this.createPejabat(data));
    ipcMain.handle('pejabat:update', (_, { id, data }) => this.updatePejabat(id, data));
    ipcMain.handle('pejabat:delete', (_, id) => this.deletePejabat(id));

    // Unit Kerja handlers
    ipcMain.handle('unit-kerja:list', () => this.getUnitKerjaList());
    ipcMain.handle('unit-kerja:create', (_, data) => this.createUnitKerja(data));
    ipcMain.handle('unit-kerja:update', (_, { id, data }) => this.updateUnitKerja(id, data));
    ipcMain.handle('unit-kerja:delete', (_, id) => this.deleteUnitKerja(id));
  }

  // ==================== Satker Methods ====================

  getSatker() {
    try {
      const satker = this.db.prepare(`
        SELECT * FROM satker LIMIT 1
      `).get();

      return satker || null;
    } catch (error) {
      console.error('Error getting satker:', error);
      throw error;
    }
  }

  updateSatker(data) {
    try {
      const satker = this.getSatker();
      if (!satker) {
        throw new Error('Satker not found');
      }

      const fields = [];
      const values = [];

      const allowedFields = [
        'kode_satker', 'nama', 'nama_singkat', 'kode_kl', 'nama_kl',
        'kode_eselon1', 'nama_eselon1', 'alamat', 'kelurahan', 'kecamatan',
        'kota', 'provinsi', 'kode_pos', 'telepon', 'email', 'website'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return satker;
      }

      values.push(satker.id);

      this.db.prepare(`
        UPDATE satker SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values);

      return this.getSatker();
    } catch (error) {
      console.error('Error updating satker:', error);
      throw error;
    }
  }

  // ==================== Pejabat Methods ====================

  getPejabatList() {
    try {
      const pejabat = this.db.prepare(`
        SELECT p.*, s.nama as satker_nama
        FROM pejabat p
        LEFT JOIN satker s ON p.satker_id = s.id
        ORDER BY
          CASE p.jenis
            WHEN 'KPA' THEN 1
            WHEN 'PPK' THEN 2
            WHEN 'PPSPM' THEN 3
            WHEN 'BP' THEN 4
          END,
          p.nama
      `).all();

      return pejabat;
    } catch (error) {
      console.error('Error getting pejabat list:', error);
      throw error;
    }
  }

  createPejabat(data) {
    try {
      // Get satker ID
      const satker = this.getSatker();
      if (!satker) {
        throw new Error('Satker not found');
      }

      const stmt = this.db.prepare(`
        INSERT INTO pejabat (
          satker_id, jenis, nama, nip, pangkat, golongan, jabatan,
          no_sk, tanggal_sk, tmt_sk, sampai_dengan, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        satker.id,
        data.jenis,
        data.nama,
        data.nip || null,
        data.pangkat || null,
        data.golongan || null,
        data.jabatan || null,
        data.no_sk || null,
        data.tanggal_sk || null,
        data.tmt_sk || null,
        data.sampai_dengan || null,
        data.status || 'aktif'
      );

      return this.db.prepare('SELECT * FROM pejabat WHERE id = ?').get(result.lastInsertRowid);
    } catch (error) {
      console.error('Error creating pejabat:', error);
      throw error;
    }
  }

  updatePejabat(id, data) {
    try {
      const fields = [];
      const values = [];

      const allowedFields = [
        'jenis', 'nama', 'nip', 'pangkat', 'golongan', 'jabatan',
        'no_sk', 'tanggal_sk', 'tmt_sk', 'sampai_dengan', 'status'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return this.db.prepare('SELECT * FROM pejabat WHERE id = ?').get(id);
      }

      values.push(id);

      this.db.prepare(`
        UPDATE pejabat SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values);

      return this.db.prepare('SELECT * FROM pejabat WHERE id = ?').get(id);
    } catch (error) {
      console.error('Error updating pejabat:', error);
      throw error;
    }
  }

  deletePejabat(id) {
    try {
      const pejabat = this.db.prepare('SELECT * FROM pejabat WHERE id = ?').get(id);
      if (!pejabat) {
        throw new Error('Pejabat not found');
      }

      this.db.prepare('DELETE FROM pejabat WHERE id = ?').run(id);
      return { success: true, id };
    } catch (error) {
      console.error('Error deleting pejabat:', error);
      throw error;
    }
  }

  // ==================== Unit Kerja Methods ====================

  getUnitKerjaList() {
    try {
      const unitKerja = this.db.prepare(`
        SELECT uk.*, s.nama as satker_nama,
          (SELECT COUNT(*) FROM pegawai WHERE unit_kerja_id = uk.id) as jumlah_pegawai
        FROM unit_kerja uk
        LEFT JOIN satker s ON uk.satker_id = s.id
        ORDER BY uk.kode
      `).all();

      return unitKerja;
    } catch (error) {
      console.error('Error getting unit kerja list:', error);
      throw error;
    }
  }

  createUnitKerja(data) {
    try {
      // Get satker ID
      const satker = this.getSatker();
      if (!satker) {
        throw new Error('Satker not found');
      }

      // Check for duplicate kode
      const existing = this.db.prepare(
        'SELECT id FROM unit_kerja WHERE kode = ? AND satker_id = ?'
      ).get(data.kode, satker.id);

      if (existing) {
        throw new Error('Kode unit kerja sudah digunakan');
      }

      const stmt = this.db.prepare(`
        INSERT INTO unit_kerja (satker_id, kode, nama, status)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        satker.id,
        data.kode,
        data.nama,
        data.status || 'aktif'
      );

      return this.db.prepare('SELECT * FROM unit_kerja WHERE id = ?').get(result.lastInsertRowid);
    } catch (error) {
      console.error('Error creating unit kerja:', error);
      throw error;
    }
  }

  updateUnitKerja(id, data) {
    try {
      const unitKerja = this.db.prepare('SELECT * FROM unit_kerja WHERE id = ?').get(id);
      if (!unitKerja) {
        throw new Error('Unit kerja not found');
      }

      // Check for duplicate kode if changing
      if (data.kode && data.kode !== unitKerja.kode) {
        const existing = this.db.prepare(
          'SELECT id FROM unit_kerja WHERE kode = ? AND satker_id = ? AND id != ?'
        ).get(data.kode, unitKerja.satker_id, id);

        if (existing) {
          throw new Error('Kode unit kerja sudah digunakan');
        }
      }

      const fields = [];
      const values = [];

      const allowedFields = ['kode', 'nama', 'status'];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return unitKerja;
      }

      values.push(id);

      this.db.prepare(`
        UPDATE unit_kerja SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values);

      return this.db.prepare('SELECT * FROM unit_kerja WHERE id = ?').get(id);
    } catch (error) {
      console.error('Error updating unit kerja:', error);
      throw error;
    }
  }

  deleteUnitKerja(id) {
    try {
      const unitKerja = this.db.prepare('SELECT * FROM unit_kerja WHERE id = ?').get(id);
      if (!unitKerja) {
        throw new Error('Unit kerja not found');
      }

      // Check if unit kerja has pegawai
      const pegawaiCount = this.db.prepare(
        'SELECT COUNT(*) as count FROM pegawai WHERE unit_kerja_id = ?'
      ).get(id);

      if (pegawaiCount.count > 0) {
        throw new Error('Unit kerja masih memiliki pegawai terdaftar');
      }

      this.db.prepare('DELETE FROM unit_kerja WHERE id = ?').run(id);
      return { success: true, id };
    } catch (error) {
      console.error('Error deleting unit kerja:', error);
      throw error;
    }
  }
}

module.exports = SatkerApi;
