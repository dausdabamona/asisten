/**
 * SBM API Handler
 * Handles IPC for Standar Biaya Masukan (SBM) operations
 * Including uang harian, transport, and honorarium
 */

const { ipcMain } = require('electron');

class SbmApi {
  constructor(db) {
    this.db = db;
    this.registerHandlers();
  }

  registerHandlers() {
    // SBM Tahun CRUD
    ipcMain.handle('sbm:tahun:list', () => this.getSbmTahunList());
    ipcMain.handle('sbm:tahun:get', (_, id) => this.getSbmTahunById(id));
    ipcMain.handle('sbm:tahun:create', (_, data) => this.createSbmTahun(data));
    ipcMain.handle('sbm:tahun:update', (_, { id, data }) => this.updateSbmTahun(id, data));
    ipcMain.handle('sbm:tahun:delete', (_, id) => this.deleteSbmTahun(id));
    ipcMain.handle('sbm:tahun:setActive', (_, id) => this.setActiveSbmTahun(id));

    // Uang Harian CRUD
    ipcMain.handle('sbm:uangHarian:list', (_, sbmTahunId) => this.getUangHarianList(sbmTahunId));
    ipcMain.handle('sbm:uangHarian:create', (_, data) => this.createUangHarian(data));
    ipcMain.handle('sbm:uangHarian:update', (_, { id, data }) => this.updateUangHarian(id, data));
    ipcMain.handle('sbm:uangHarian:delete', (_, id) => this.deleteUangHarian(id));

    // Transport CRUD
    ipcMain.handle('sbm:transport:list', (_, sbmTahunId) => this.getTransportList(sbmTahunId));
    ipcMain.handle('sbm:transport:create', (_, data) => this.createTransport(data));
    ipcMain.handle('sbm:transport:update', (_, { id, data }) => this.updateTransport(id, data));
    ipcMain.handle('sbm:transport:delete', (_, id) => this.deleteTransport(id));

    // Honorarium CRUD
    ipcMain.handle('sbm:honorarium:list', (_, sbmTahunId) => this.getHonorariumList(sbmTahunId));
    ipcMain.handle('sbm:honorarium:create', (_, data) => this.createHonorarium(data));
    ipcMain.handle('sbm:honorarium:update', (_, { id, data }) => this.updateHonorarium(id, data));
    ipcMain.handle('sbm:honorarium:delete', (_, id) => this.deleteHonorarium(id));
    ipcMain.handle('sbm:honorarium:insertDefault', (_, sbmTahunId) => this.insertDefaultHonorarium(sbmTahunId));

    // Lookup handlers (for transaction forms)
    ipcMain.handle('sbm:lookup:uangHarian', (_, params) => this.lookupUangHarian(params));
    ipcMain.handle('sbm:lookup:honorarium', (_, params) => this.lookupHonorarium(params));
    ipcMain.handle('sbm:lookup:transport', (_, params) => this.lookupTransport(params));
  }

  // ==================== SBM TAHUN CRUD ====================

  getSbmTahunList() {
    try {
      const data = this.db.prepare(`
        SELECT st.*,
               (SELECT COUNT(*) FROM sbm_uang_harian WHERE sbm_tahun_id = st.id) as uang_harian_count,
               (SELECT COUNT(*) FROM sbm_transport WHERE sbm_tahun_id = st.id) as transport_count,
               (SELECT COUNT(*) FROM sbm_honorarium WHERE sbm_tahun_id = st.id) as honorarium_count
        FROM sbm_tahun st
        ORDER BY st.tahun DESC
      `).all();

      return { success: true, data };
    } catch (error) {
      console.error('Error getting SBM tahun list:', error);
      return { success: false, error: error.message };
    }
  }

  getSbmTahunById(id) {
    try {
      const sbmTahun = this.db.prepare(`
        SELECT st.*,
               (SELECT COUNT(*) FROM sbm_uang_harian WHERE sbm_tahun_id = st.id) as uang_harian_count,
               (SELECT COUNT(*) FROM sbm_transport WHERE sbm_tahun_id = st.id) as transport_count,
               (SELECT COUNT(*) FROM sbm_honorarium WHERE sbm_tahun_id = st.id) as honorarium_count
        FROM sbm_tahun st
        WHERE st.id = ?
      `).get(id);

      if (!sbmTahun) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      return { success: true, data: sbmTahun };
    } catch (error) {
      console.error('Error getting SBM tahun:', error);
      return { success: false, error: error.message };
    }
  }

  createSbmTahun(data) {
    try {
      const { tahun, nomor_pmk, tanggal_pmk } = data;

      if (!tahun) {
        return { success: false, error: 'Tahun wajib diisi' };
      }

      // Check for duplicate year
      const existing = this.db.prepare('SELECT id FROM sbm_tahun WHERE tahun = ?').get(tahun);
      if (existing) {
        return { success: false, error: 'SBM untuk tahun ini sudah ada' };
      }

      const stmt = this.db.prepare(`
        INSERT INTO sbm_tahun (tahun, nomor_pmk, tanggal_pmk, is_active)
        VALUES (?, ?, ?, 0)
      `);

      const result = stmt.run(tahun, nomor_pmk || null, tanggal_pmk || null);
      const newSbm = this.db.prepare('SELECT * FROM sbm_tahun WHERE id = ?').get(result.lastInsertRowid);

      return { success: true, data: newSbm };
    } catch (error) {
      console.error('Error creating SBM tahun:', error);
      return { success: false, error: error.message };
    }
  }

  updateSbmTahun(id, data) {
    try {
      const sbmTahun = this.db.prepare('SELECT * FROM sbm_tahun WHERE id = ?').get(id);
      if (!sbmTahun) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      const fields = [];
      const values = [];

      const allowedFields = ['nomor_pmk', 'tanggal_pmk'];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return { success: true, data: sbmTahun };
      }

      values.push(id);

      this.db.prepare(`
        UPDATE sbm_tahun SET ${fields.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = this.db.prepare('SELECT * FROM sbm_tahun WHERE id = ?').get(id);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating SBM tahun:', error);
      return { success: false, error: error.message };
    }
  }

  deleteSbmTahun(id) {
    try {
      const sbmTahun = this.db.prepare('SELECT * FROM sbm_tahun WHERE id = ?').get(id);
      if (!sbmTahun) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      if (sbmTahun.is_active === 1) {
        return { success: false, error: 'Tidak dapat menghapus SBM yang sedang aktif' };
      }

      // Delete all related data first (cascade)
      this.db.prepare('DELETE FROM sbm_uang_harian WHERE sbm_tahun_id = ?').run(id);
      this.db.prepare('DELETE FROM sbm_transport WHERE sbm_tahun_id = ?').run(id);
      this.db.prepare('DELETE FROM sbm_honorarium WHERE sbm_tahun_id = ?').run(id);
      this.db.prepare('DELETE FROM sbm_tahun WHERE id = ?').run(id);

      return { success: true };
    } catch (error) {
      console.error('Error deleting SBM tahun:', error);
      return { success: false, error: error.message };
    }
  }

  setActiveSbmTahun(id) {
    try {
      const sbmTahun = this.db.prepare('SELECT * FROM sbm_tahun WHERE id = ?').get(id);
      if (!sbmTahun) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      const transaction = this.db.transaction(() => {
        // Deactivate all
        this.db.prepare('UPDATE sbm_tahun SET is_active = 0').run();
        // Activate selected
        this.db.prepare('UPDATE sbm_tahun SET is_active = 1 WHERE id = ?').run(id);
      });

      transaction();

      return { success: true };
    } catch (error) {
      console.error('Error setting active SBM tahun:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UANG HARIAN CRUD ====================

  getUangHarianList(sbmTahunId) {
    try {
      const data = this.db.prepare(`
        SELECT * FROM sbm_uang_harian
        WHERE sbm_tahun_id = ?
        ORDER BY provinsi, kota, tingkat
      `).all(sbmTahunId);

      return { success: true, data };
    } catch (error) {
      console.error('Error getting uang harian list:', error);
      return { success: false, error: error.message };
    }
  }

  createUangHarian(data) {
    try {
      const { sbm_tahun_id, provinsi, kota, tingkat, uang_harian, penginapan } = data;

      if (!sbm_tahun_id || !provinsi || !kota) {
        return { success: false, error: 'Data tidak lengkap' };
      }

      const stmt = this.db.prepare(`
        INSERT INTO sbm_uang_harian (sbm_tahun_id, provinsi, kota, tingkat, uang_harian, penginapan)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(sbm_tahun_id, provinsi, kota, tingkat || null, uang_harian || 0, penginapan || 0);
      const newItem = this.db.prepare('SELECT * FROM sbm_uang_harian WHERE id = ?').get(result.lastInsertRowid);

      return { success: true, data: newItem };
    } catch (error) {
      console.error('Error creating uang harian:', error);
      return { success: false, error: error.message };
    }
  }

  updateUangHarian(id, data) {
    try {
      const item = this.db.prepare('SELECT * FROM sbm_uang_harian WHERE id = ?').get(id);
      if (!item) {
        return { success: false, error: 'Data tidak ditemukan' };
      }

      const fields = [];
      const values = [];

      const allowedFields = ['provinsi', 'kota', 'tingkat', 'uang_harian', 'penginapan'];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return { success: true, data: item };
      }

      values.push(id);

      this.db.prepare(`
        UPDATE sbm_uang_harian SET ${fields.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = this.db.prepare('SELECT * FROM sbm_uang_harian WHERE id = ?').get(id);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating uang harian:', error);
      return { success: false, error: error.message };
    }
  }

  deleteUangHarian(id) {
    try {
      this.db.prepare('DELETE FROM sbm_uang_harian WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting uang harian:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== TRANSPORT CRUD ====================

  getTransportList(sbmTahunId) {
    try {
      const data = this.db.prepare(`
        SELECT * FROM sbm_transport
        WHERE sbm_tahun_id = ?
        ORDER BY moda, asal, tujuan, kelas
      `).all(sbmTahunId);

      return { success: true, data };
    } catch (error) {
      console.error('Error getting transport list:', error);
      return { success: false, error: error.message };
    }
  }

  createTransport(data) {
    try {
      const { sbm_tahun_id, asal, tujuan, moda, kelas, tarif } = data;

      if (!sbm_tahun_id) {
        return { success: false, error: 'SBM tahun ID wajib diisi' };
      }

      const stmt = this.db.prepare(`
        INSERT INTO sbm_transport (sbm_tahun_id, asal, tujuan, moda, kelas, tarif)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(sbm_tahun_id, asal || null, tujuan || null, moda || null, kelas || null, tarif || 0);
      const newItem = this.db.prepare('SELECT * FROM sbm_transport WHERE id = ?').get(result.lastInsertRowid);

      return { success: true, data: newItem };
    } catch (error) {
      console.error('Error creating transport:', error);
      return { success: false, error: error.message };
    }
  }

  updateTransport(id, data) {
    try {
      const item = this.db.prepare('SELECT * FROM sbm_transport WHERE id = ?').get(id);
      if (!item) {
        return { success: false, error: 'Data tidak ditemukan' };
      }

      const fields = [];
      const values = [];

      const allowedFields = ['asal', 'tujuan', 'moda', 'kelas', 'tarif'];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return { success: true, data: item };
      }

      values.push(id);

      this.db.prepare(`
        UPDATE sbm_transport SET ${fields.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = this.db.prepare('SELECT * FROM sbm_transport WHERE id = ?').get(id);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating transport:', error);
      return { success: false, error: error.message };
    }
  }

  deleteTransport(id) {
    try {
      this.db.prepare('DELETE FROM sbm_transport WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting transport:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== HONORARIUM CRUD ====================

  getHonorariumList(sbmTahunId) {
    try {
      const data = this.db.prepare(`
        SELECT * FROM sbm_honorarium
        WHERE sbm_tahun_id = ?
        ORDER BY kategori, kualifikasi
      `).all(sbmTahunId);

      return { success: true, data };
    } catch (error) {
      console.error('Error getting honorarium list:', error);
      return { success: false, error: error.message };
    }
  }

  createHonorarium(data) {
    try {
      const { sbm_tahun_id, kategori, kualifikasi, satuan, tarif } = data;

      if (!sbm_tahun_id || !kategori) {
        return { success: false, error: 'Data tidak lengkap' };
      }

      const stmt = this.db.prepare(`
        INSERT INTO sbm_honorarium (sbm_tahun_id, kategori, kualifikasi, satuan, tarif)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(sbm_tahun_id, kategori, kualifikasi || null, satuan || null, tarif || 0);
      const newItem = this.db.prepare('SELECT * FROM sbm_honorarium WHERE id = ?').get(result.lastInsertRowid);

      return { success: true, data: newItem };
    } catch (error) {
      console.error('Error creating honorarium:', error);
      return { success: false, error: error.message };
    }
  }

  updateHonorarium(id, data) {
    try {
      const item = this.db.prepare('SELECT * FROM sbm_honorarium WHERE id = ?').get(id);
      if (!item) {
        return { success: false, error: 'Data tidak ditemukan' };
      }

      const fields = [];
      const values = [];

      const allowedFields = ['kategori', 'kualifikasi', 'satuan', 'tarif'];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return { success: true, data: item };
      }

      values.push(id);

      this.db.prepare(`
        UPDATE sbm_honorarium SET ${fields.join(', ')}
        WHERE id = ?
      `).run(...values);

      const updated = this.db.prepare('SELECT * FROM sbm_honorarium WHERE id = ?').get(id);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating honorarium:', error);
      return { success: false, error: error.message };
    }
  }

  deleteHonorarium(id) {
    try {
      this.db.prepare('DELETE FROM sbm_honorarium WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting honorarium:', error);
      return { success: false, error: error.message };
    }
  }

  insertDefaultHonorarium(sbmTahunId) {
    try {
      const sbmTahun = this.db.prepare('SELECT * FROM sbm_tahun WHERE id = ?').get(sbmTahunId);
      if (!sbmTahun) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      // Default honorarium data based on typical PMK SBM
      const defaultHonorarium = [
        // Narasumber
        { kategori: 'NARASUMBER', kualifikasi: 'Menteri/Pejabat Setingkat', satuan: 'OJ', tarif: 1700000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Pejabat Eselon I/Setingkat', satuan: 'OJ', tarif: 1400000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Pejabat Eselon II/Setingkat', satuan: 'OJ', tarif: 1000000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Pejabat Eselon III/Setingkat', satuan: 'OJ', tarif: 750000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Pejabat Eselon IV/Setingkat', satuan: 'OJ', tarif: 600000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Profesor/Guru Besar', satuan: 'OJ', tarif: 1400000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Doktor (S3)', satuan: 'OJ', tarif: 1000000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Magister (S2)', satuan: 'OJ', tarif: 750000 },
        { kategori: 'NARASUMBER', kualifikasi: 'Sarjana (S1)', satuan: 'OJ', tarif: 600000 },

        // Moderator
        { kategori: 'MODERATOR', kualifikasi: 'Pejabat Eselon II ke atas', satuan: 'OK', tarif: 700000 },
        { kategori: 'MODERATOR', kualifikasi: 'Pejabat Eselon III', satuan: 'OK', tarif: 600000 },
        { kategori: 'MODERATOR', kualifikasi: 'Pejabat Eselon IV/Praktisi', satuan: 'OK', tarif: 500000 },

        // PJLP (Penyedia Jasa Lainnya Perorangan)
        { kategori: 'PJLP', kualifikasi: 'Golongan I', satuan: 'OB', tarif: 3000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan II', satuan: 'OB', tarif: 3500000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan III', satuan: 'OB', tarif: 4000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan IV', satuan: 'OB', tarif: 4500000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan V', satuan: 'OB', tarif: 5000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan VI', satuan: 'OB', tarif: 5500000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan VII', satuan: 'OB', tarif: 6000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan VIII', satuan: 'OB', tarif: 7000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan IX', satuan: 'OB', tarif: 8000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan X', satuan: 'OB', tarif: 10000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan XI', satuan: 'OB', tarif: 12000000 },
        { kategori: 'PJLP', kualifikasi: 'Golongan XII', satuan: 'OB', tarif: 15000000 }
      ];

      const stmt = this.db.prepare(`
        INSERT INTO sbm_honorarium (sbm_tahun_id, kategori, kualifikasi, satuan, tarif)
        VALUES (?, ?, ?, ?, ?)
      `);

      const transaction = this.db.transaction(() => {
        let inserted = 0;
        for (const item of defaultHonorarium) {
          // Check if already exists
          const existing = this.db.prepare(`
            SELECT id FROM sbm_honorarium
            WHERE sbm_tahun_id = ? AND kategori = ? AND kualifikasi = ?
          `).get(sbmTahunId, item.kategori, item.kualifikasi);

          if (!existing) {
            stmt.run(sbmTahunId, item.kategori, item.kualifikasi, item.satuan, item.tarif);
            inserted++;
          }
        }
        return inserted;
      });

      const insertedCount = transaction();

      return {
        success: true,
        data: { insertedCount, totalItems: defaultHonorarium.length }
      };
    } catch (error) {
      console.error('Error inserting default honorarium:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== LOOKUP METHODS ====================

  lookupUangHarian(params) {
    try {
      const { tahun, provinsi, kota } = params;

      // Find the SBM tahun
      let sbmTahunId;
      if (tahun) {
        const sbmTahun = this.db.prepare('SELECT id FROM sbm_tahun WHERE tahun = ?').get(tahun);
        sbmTahunId = sbmTahun?.id;
      } else {
        // Use active SBM tahun
        const activeSbm = this.db.prepare('SELECT id FROM sbm_tahun WHERE is_active = 1').get();
        sbmTahunId = activeSbm?.id;
      }

      if (!sbmTahunId) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      // Find matching uang harian
      let query = 'SELECT * FROM sbm_uang_harian WHERE sbm_tahun_id = ?';
      const values = [sbmTahunId];

      if (provinsi) {
        query += ' AND provinsi LIKE ?';
        values.push(`%${provinsi}%`);
      }

      if (kota) {
        query += ' AND kota LIKE ?';
        values.push(`%${kota}%`);
      }

      query += ' LIMIT 1';

      const result = this.db.prepare(query).get(...values);

      return { success: true, data: result || null };
    } catch (error) {
      console.error('Error looking up uang harian:', error);
      return { success: false, error: error.message };
    }
  }

  lookupHonorarium(params) {
    try {
      const { tahun, kategori, kualifikasi } = params;

      // Find the SBM tahun
      let sbmTahunId;
      if (tahun) {
        const sbmTahun = this.db.prepare('SELECT id FROM sbm_tahun WHERE tahun = ?').get(tahun);
        sbmTahunId = sbmTahun?.id;
      } else {
        const activeSbm = this.db.prepare('SELECT id FROM sbm_tahun WHERE is_active = 1').get();
        sbmTahunId = activeSbm?.id;
      }

      if (!sbmTahunId) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      // Find matching honorarium
      let query = 'SELECT * FROM sbm_honorarium WHERE sbm_tahun_id = ?';
      const values = [sbmTahunId];

      if (kategori) {
        query += ' AND kategori = ?';
        values.push(kategori);
      }

      if (kualifikasi) {
        query += ' AND kualifikasi LIKE ?';
        values.push(`%${kualifikasi}%`);
      }

      const result = this.db.prepare(query).all(...values);

      return { success: true, data: result };
    } catch (error) {
      console.error('Error looking up honorarium:', error);
      return { success: false, error: error.message };
    }
  }

  lookupTransport(params) {
    try {
      const { tahun, asal, tujuan, moda } = params;

      // Find the SBM tahun
      let sbmTahunId;
      if (tahun) {
        const sbmTahun = this.db.prepare('SELECT id FROM sbm_tahun WHERE tahun = ?').get(tahun);
        sbmTahunId = sbmTahun?.id;
      } else {
        const activeSbm = this.db.prepare('SELECT id FROM sbm_tahun WHERE is_active = 1').get();
        sbmTahunId = activeSbm?.id;
      }

      if (!sbmTahunId) {
        return { success: false, error: 'SBM tahun tidak ditemukan' };
      }

      // Find matching transport
      let query = 'SELECT * FROM sbm_transport WHERE sbm_tahun_id = ?';
      const values = [sbmTahunId];

      if (asal) {
        query += ' AND asal LIKE ?';
        values.push(`%${asal}%`);
      }

      if (tujuan) {
        query += ' AND tujuan LIKE ?';
        values.push(`%${tujuan}%`);
      }

      if (moda) {
        query += ' AND moda = ?';
        values.push(moda);
      }

      const result = this.db.prepare(query).all(...values);

      return { success: true, data: result };
    } catch (error) {
      console.error('Error looking up transport:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================

  getDistinctProvinsi(sbmTahunId) {
    return this.db.prepare(`
      SELECT DISTINCT provinsi FROM sbm_uang_harian WHERE sbm_tahun_id = ? ORDER BY provinsi
    `).all(sbmTahunId);
  }

  getDistinctKota(sbmTahunId, provinsi = null) {
    if (provinsi) {
      return this.db.prepare(`
        SELECT DISTINCT kota FROM sbm_uang_harian
        WHERE sbm_tahun_id = ? AND provinsi = ? ORDER BY kota
      `).all(sbmTahunId, provinsi);
    }
    return this.db.prepare(`
      SELECT DISTINCT kota FROM sbm_uang_harian WHERE sbm_tahun_id = ? ORDER BY kota
    `).all(sbmTahunId);
  }

  getDistinctModa(sbmTahunId) {
    return this.db.prepare(`
      SELECT DISTINCT moda FROM sbm_transport WHERE sbm_tahun_id = ? ORDER BY moda
    `).all(sbmTahunId);
  }
}

module.exports = SbmApi;
