/**
 * DIPA API Handler
 * Handles IPC for DIPA operations with CSV upload and revision management
 */

const { ipcMain } = require('electron');

class DipaApi {
  constructor(db) {
    this.db = db;
    this.registerHandlers();
  }

  registerHandlers() {
    // DIPA CRUD
    ipcMain.handle('dipa:list', (_, params) => this.getDipaList(params));
    ipcMain.handle('dipa:get', (_, id) => this.getDipaById(id));
    ipcMain.handle('dipa:create', (_, data) => this.createDipa(data));
    ipcMain.handle('dipa:update', (_, { id, data }) => this.updateDipa(id, data));
    ipcMain.handle('dipa:delete', (_, id) => this.deleteDipa(id));
    ipcMain.handle('dipa:import-csv', (_, csvContent) => this.importFromCSV(csvContent));
    ipcMain.handle('dipa:export-csv', (_, filters) => this.exportToCSV(filters));

    // Revisi
    ipcMain.handle('dipa:revisi:list', (_, dipaId) => this.getRevisiList(dipaId));
    ipcMain.handle('dipa:revisi:upload', (_, { dipaId, data }) => this.uploadRevisiCSV(dipaId, data));
    ipcMain.handle('dipa:revisi:set-active', (_, { dipaId, revisiId }) => this.setRevisiActive(dipaId, revisiId));
    ipcMain.handle('dipa:revisi:delete', (_, { dipaId, revisiId }) => this.deleteRevisi(dipaId, revisiId));

    // Items
    ipcMain.handle('dipa:items:list', (_, params) => this.getDipaItems(params));
    ipcMain.handle('dipa:items:hierarki', (_, revisiId) => this.getHierarki(revisiId));
    ipcMain.handle('dipa:items:sisa-pagu', (_, itemId) => this.getSisaPagu(itemId));

    // CSV Parser
    ipcMain.handle('dipa:parse-csv', (_, csvContent) => this.parseCSV(csvContent));
  }

  // ==================== DIPA CRUD ====================

  getDipaList(params = {}) {
    try {
      const { tahun = null } = params;

      let query = `
        SELECT d.*,
               (SELECT COUNT(*) FROM dipa_revisi WHERE dipa_id = d.id) as revisi_count,
               (SELECT MAX(nomor_revisi) FROM dipa_revisi WHERE dipa_id = d.id AND is_active = 1) as active_revisi,
               (SELECT total_pagu FROM dipa_revisi WHERE dipa_id = d.id AND is_active = 1) as pagu_aktif,
               (SELECT SUM(realisasi) FROM dipa_item di
                JOIN dipa_revisi dr ON di.dipa_revisi_id = dr.id
                WHERE dr.dipa_id = d.id AND dr.is_active = 1) as total_realisasi
        FROM dipa d
      `;

      const values = [];
      if (tahun) {
        query += ' WHERE d.tahun_anggaran = ?';
        values.push(tahun);
      }

      query += ' ORDER BY d.tahun_anggaran DESC, d.created_at DESC';

      const data = this.db.prepare(query).all(...values);
      return { data };
    } catch (error) {
      console.error('Error getting DIPA list:', error);
      throw error;
    }
  }

  getDipaById(id) {
    try {
      const dipa = this.db.prepare(`
        SELECT d.*,
               (SELECT COUNT(*) FROM dipa_revisi WHERE dipa_id = d.id) as revisi_count,
               (SELECT MAX(nomor_revisi) FROM dipa_revisi WHERE dipa_id = d.id AND is_active = 1) as active_revisi
        FROM dipa d
        WHERE d.id = ?
      `).get(id);

      if (!dipa) {
        throw new Error('DIPA not found');
      }

      return dipa;
    } catch (error) {
      console.error('Error getting DIPA:', error);
      throw error;
    }
  }

  createDipa(data) {
    try {
      const { tahun_anggaran, nomor_dipa, tanggal_dipa, kode_satker } = data;

      if (!tahun_anggaran) {
        throw new Error('Tahun anggaran wajib diisi');
      }

      // Check for duplicate
      const existing = this.db.prepare(
        'SELECT id FROM dipa WHERE tahun_anggaran = ? AND kode_satker = ?'
      ).get(tahun_anggaran, kode_satker || '');

      if (existing) {
        throw new Error('DIPA untuk tahun anggaran ini sudah ada');
      }

      const stmt = this.db.prepare(`
        INSERT INTO dipa (tahun_anggaran, nomor_dipa, tanggal_dipa, kode_satker, is_active)
        VALUES (?, ?, ?, ?, 1)
      `);

      const result = stmt.run(tahun_anggaran, nomor_dipa || null, tanggal_dipa || null, kode_satker || '');
      return this.getDipaById(result.lastInsertRowid);
    } catch (error) {
      console.error('Error creating DIPA:', error);
      throw error;
    }
  }

  updateDipa(id, data) {
    try {
      const dipa = this.db.prepare('SELECT * FROM dipa WHERE id = ?').get(id);
      if (!dipa) {
        throw new Error('DIPA not found');
      }

      const fields = [];
      const values = [];

      const allowedFields = ['nomor_dipa', 'tanggal_dipa', 'kode_satker', 'is_active'];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return dipa;
      }

      values.push(id);

      this.db.prepare(`
        UPDATE dipa SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values);

      return this.getDipaById(id);
    } catch (error) {
      console.error('Error updating DIPA:', error);
      throw error;
    }
  }

  deleteDipa(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM dipa WHERE id = ?');
      stmt.run(id);
      return { success: true, message: 'DIPA deleted' };
    } catch (error) {
      console.error('Error deleting DIPA:', error);
      throw error;
    }
  }

  importFromCSV(csvContent) {
    try {
      // Parse CSV content
      const rows = this.parseCSV(csvContent);
      
      if (!rows || rows.length === 0) {
        return { success: true, data: [], message: 'Tidak ada data untuk di-import' };
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [],
        inserted: []
      };

      // Use transaction for batch insert
      const insertStmt = this.db.prepare(`
        INSERT OR IGNORE INTO dipa (
          id, tahun_anggaran, nomor_dipa, tanggal_dipa,
          kdsatker, kode_program, kode_kegiatan, kode_output,
          kode_suboutput, kode_komponen, kode_subkomponen,
          kode_akun, uraian_item, volume, satuan, 
          harga_satuan, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = this.db.transaction((rows) => {
        for (const row of rows) {
          try {
            const { v4: uuidv4 } = require('uuid');
            insertStmt.run(
              uuidv4(),
              row.tahun_anggaran || new Date().getFullYear(),
              row.nomor_dipa || null,
              row.tanggal_dipa || null,
              row.kdsatker || row.kode_satker || null,
              row.kode_program || null,
              row.kode_kegiatan || null,
              row.kode_output || null,
              row.kode_suboutput || null,
              row.kode_komponen || null,
              row.kode_subkomponen || null,
              row.kode_akun || null,
              row.uraian_item || null,
              parseFloat(row.volume) || 0,
              row.satuan || null,
              parseFloat(row.harga_satuan) || 0,
              parseFloat(row.total) || 0
            );
            results.success++;
            results.inserted.push(row);
          } catch (error) {
            results.failed++;
            results.errors.push(`Row error: ${error.message}`);
          }
        }
      });

      transaction(rows);

      console.log(`DIPA CSV Import: ${results.success} inserted, ${results.failed} failed`);
      return { success: true, data: results };
    } catch (error) {
      console.error('Error importing DIPA CSV:', error);
      return { success: false, error: error.message };
    }
  }

  exportToCSV(filters = {}) {
    try {
      const result = this.getDipaList(filters);
      
      if (!result.success || !result.data || result.data.length === 0) {
        return { success: true, data: '' };
      }

      const rows = result.data;
      // Simple CSV export with basic columns
      const headers = [
        'tahun_anggaran', 'nomor_dipa', 'kdsatker', 
        'kode_program', 'kode_kegiatan', 'uraian_item', 
        'volume', 'satuan', 'harga_satuan', 'total'
      ];

      const csvLines = [headers.map(h => `"${h}"`).join(',')];

      for (const row of rows) {
        const line = headers.map(h => {
          const value = row[h];
          if (value === null || value === undefined) return '""';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
        csvLines.push(line);
      }

      return { success: true, data: csvLines.join('\n') };
    } catch (error) {
      console.error('Error exporting DIPA CSV:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== REVISI ====================

  getRevisiList(dipaId) {
    try {
      const data = this.db.prepare(`
        SELECT dr.*,
               (SELECT COUNT(*) FROM dipa_item WHERE dipa_revisi_id = dr.id) as item_count,
               (SELECT SUM(total) FROM dipa_item WHERE dipa_revisi_id = dr.id) as calculated_pagu,
               (SELECT SUM(realisasi) FROM dipa_item WHERE dipa_revisi_id = dr.id) as total_realisasi
        FROM dipa_revisi dr
        WHERE dr.dipa_id = ?
        ORDER BY dr.nomor_revisi DESC
      `).all(dipaId);

      return { data };
    } catch (error) {
      console.error('Error getting revisi list:', error);
      throw error;
    }
  }

  uploadRevisiCSV(dipaId, data) {
    try {
      const { csvContent, tanggal_revisi, jenis_revisi, keterangan } = data;

      // Validate DIPA exists
      const dipa = this.db.prepare('SELECT * FROM dipa WHERE id = ?').get(dipaId);
      if (!dipa) {
        throw new Error('DIPA not found');
      }

      // Parse CSV
      const parsedData = this.parseCSV(csvContent);
      if (!parsedData.items || parsedData.items.length === 0) {
        throw new Error('Tidak ada data valid dalam CSV');
      }

      // Get next revision number
      const lastRevisi = this.db.prepare(
        'SELECT MAX(nomor_revisi) as max_rev FROM dipa_revisi WHERE dipa_id = ?'
      ).get(dipaId);
      const nomor_revisi = (lastRevisi?.max_rev || 0) + 1;

      // Start transaction
      const insertRevisi = this.db.prepare(`
        INSERT INTO dipa_revisi (dipa_id, nomor_revisi, tanggal_revisi, jenis_revisi, keterangan, total_pagu, total_item, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `);

      const insertItem = this.db.prepare(`
        INSERT INTO dipa_item (
          dipa_revisi_id, kode_program, kode_kegiatan, kode_output, kode_suboutput,
          volume_output, volume_suboutput, kode_komponen, kode_subkomponen, uraian_subkomponen,
          kode_akun, kode_item, nomor_item, uraian_item, volume, satuan, harga_satuan, total,
          kode_blokir, nilai_blokir,
          pok_1, pok_2, pok_3, pok_4, pok_5, pok_6, pok_7, pok_8, pok_9, pok_10, pok_11, pok_12
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      const transaction = this.db.transaction(() => {
        // Insert revisi
        const revisiResult = insertRevisi.run(
          dipaId,
          nomor_revisi,
          tanggal_revisi || null,
          jenis_revisi || 'DIPA_AWAL',
          keterangan || null,
          parsedData.totalPagu,
          parsedData.items.length
        );

        const revisiId = revisiResult.lastInsertRowid;

        // Insert items
        for (const item of parsedData.items) {
          insertItem.run(
            revisiId,
            item.kode_program || null,
            item.kode_kegiatan || null,
            item.kode_output || null,
            item.kode_suboutput || null,
            item.volume_output || null,
            item.volume_suboutput || null,
            item.kode_komponen || null,
            item.kode_subkomponen || null,
            item.uraian_subkomponen || null,
            item.kode_akun || null,
            item.kode_item || null,
            item.nomor_item || null,
            item.uraian_item || null,
            item.volume || null,
            item.satuan || null,
            item.harga_satuan || null,
            item.total || 0,
            item.kode_blokir || null,
            item.nilai_blokir || 0,
            item.pok_1 || 0,
            item.pok_2 || 0,
            item.pok_3 || 0,
            item.pok_4 || 0,
            item.pok_5 || 0,
            item.pok_6 || 0,
            item.pok_7 || 0,
            item.pok_8 || 0,
            item.pok_9 || 0,
            item.pok_10 || 0,
            item.pok_11 || 0,
            item.pok_12 || 0
          );
        }

        // Update DIPA total_pagu
        this.db.prepare('UPDATE dipa SET total_pagu = ? WHERE id = ?').run(parsedData.totalPagu, dipaId);

        return revisiId;
      });

      const revisiId = transaction();

      return {
        success: true,
        revisiId,
        nomor_revisi,
        totalItems: parsedData.items.length,
        totalPagu: parsedData.totalPagu
      };
    } catch (error) {
      console.error('Error uploading revisi CSV:', error);
      throw error;
    }
  }

  setRevisiActive(dipaId, revisiId) {
    try {
      const revisi = this.db.prepare(
        'SELECT * FROM dipa_revisi WHERE id = ? AND dipa_id = ?'
      ).get(revisiId, dipaId);

      if (!revisi) {
        throw new Error('Revisi not found');
      }

      const transaction = this.db.transaction(() => {
        // Deactivate all revisions for this DIPA
        this.db.prepare('UPDATE dipa_revisi SET is_active = 0 WHERE dipa_id = ?').run(dipaId);

        // Activate selected revision
        this.db.prepare('UPDATE dipa_revisi SET is_active = 1 WHERE id = ?').run(revisiId);

        // Update DIPA total_pagu from active revision
        this.db.prepare('UPDATE dipa SET total_pagu = ? WHERE id = ?').run(revisi.total_pagu, dipaId);
      });

      transaction();

      return { success: true };
    } catch (error) {
      console.error('Error setting revisi active:', error);
      throw error;
    }
  }

  deleteRevisi(dipaId, revisiId) {
    try {
      const revisi = this.db.prepare(
        'SELECT * FROM dipa_revisi WHERE id = ? AND dipa_id = ?'
      ).get(revisiId, dipaId);

      if (!revisi) {
        throw new Error('Revisi not found');
      }

      if (revisi.is_active === 1) {
        throw new Error('Tidak dapat menghapus revisi yang sedang aktif');
      }

      // Check if there are realisasi on this revision
      const hasRealisasi = this.db.prepare(`
        SELECT SUM(realisasi) as total FROM dipa_item WHERE dipa_revisi_id = ? AND realisasi > 0
      `).get(revisiId);

      if (hasRealisasi && hasRealisasi.total > 0) {
        throw new Error('Tidak dapat menghapus revisi yang sudah memiliki realisasi');
      }

      // Delete items first (cascade), then revisi
      this.db.prepare('DELETE FROM dipa_item WHERE dipa_revisi_id = ?').run(revisiId);
      this.db.prepare('DELETE FROM dipa_revisi WHERE id = ?').run(revisiId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting revisi:', error);
      throw error;
    }
  }

  // ==================== ITEMS ====================

  getDipaItems(params = {}) {
    try {
      const {
        revisi_id,
        page = 1,
        limit = 50,
        search = '',
        kode_program = '',
        kode_kegiatan = '',
        kode_akun = ''
      } = params;

      if (!revisi_id) {
        throw new Error('revisi_id is required');
      }

      const offset = (page - 1) * limit;
      const conditions = ['dipa_revisi_id = ?'];
      const values = [revisi_id];

      if (search) {
        conditions.push('(uraian_item LIKE ? OR uraian_subkomponen LIKE ? OR kode_akun LIKE ?)');
        values.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (kode_program) {
        conditions.push('kode_program = ?');
        values.push(kode_program);
      }

      if (kode_kegiatan) {
        conditions.push('kode_kegiatan = ?');
        values.push(kode_kegiatan);
      }

      if (kode_akun) {
        conditions.push('kode_akun LIKE ?');
        values.push(`${kode_akun}%`);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      // Get total count
      const countResult = this.db.prepare(
        `SELECT COUNT(*) as total FROM dipa_item ${whereClause}`
      ).get(...values);

      // Get data
      const data = this.db.prepare(`
        SELECT * FROM dipa_item
        ${whereClause}
        ORDER BY kode_program, kode_kegiatan, kode_output, kode_komponen, kode_subkomponen, kode_akun, nomor_item
        LIMIT ? OFFSET ?
      `).all(...values, limit, offset);

      return {
        data,
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      };
    } catch (error) {
      console.error('Error getting DIPA items:', error);
      throw error;
    }
  }

  getHierarki(revisiId) {
    try {
      // Get all items for the revision
      const items = this.db.prepare(`
        SELECT
          kode_program, kode_kegiatan, kode_output, kode_suboutput,
          kode_komponen, kode_subkomponen, uraian_subkomponen,
          kode_akun,
          SUM(total) as total_pagu,
          SUM(realisasi) as total_realisasi,
          SUM(nilai_blokir) as total_blokir,
          COUNT(*) as item_count
        FROM dipa_item
        WHERE dipa_revisi_id = ?
        GROUP BY kode_program, kode_kegiatan, kode_output, kode_suboutput,
                 kode_komponen, kode_subkomponen, kode_akun
        ORDER BY kode_program, kode_kegiatan, kode_output, kode_komponen, kode_subkomponen, kode_akun
      `).all(revisiId);

      // Build hierarchy tree
      const tree = {};

      items.forEach(item => {
        const programKey = item.kode_program || 'UNKNOWN';
        const kegiatanKey = item.kode_kegiatan || 'UNKNOWN';
        const outputKey = item.kode_output || 'UNKNOWN';
        const komponenKey = item.kode_komponen || 'UNKNOWN';
        const subkomponenKey = item.kode_subkomponen || 'UNKNOWN';
        const akunKey = item.kode_akun || 'UNKNOWN';

        // Initialize program
        if (!tree[programKey]) {
          tree[programKey] = {
            kode: programKey,
            type: 'program',
            children: {},
            total_pagu: 0,
            total_realisasi: 0,
            total_blokir: 0
          };
        }

        // Initialize kegiatan
        if (!tree[programKey].children[kegiatanKey]) {
          tree[programKey].children[kegiatanKey] = {
            kode: kegiatanKey,
            type: 'kegiatan',
            children: {},
            total_pagu: 0,
            total_realisasi: 0,
            total_blokir: 0
          };
        }

        // Initialize output
        if (!tree[programKey].children[kegiatanKey].children[outputKey]) {
          tree[programKey].children[kegiatanKey].children[outputKey] = {
            kode: outputKey,
            type: 'output',
            children: {},
            total_pagu: 0,
            total_realisasi: 0,
            total_blokir: 0
          };
        }

        // Initialize komponen
        if (!tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey]) {
          tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey] = {
            kode: komponenKey,
            type: 'komponen',
            children: {},
            total_pagu: 0,
            total_realisasi: 0,
            total_blokir: 0
          };
        }

        // Initialize subkomponen
        if (!tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].children[subkomponenKey]) {
          tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].children[subkomponenKey] = {
            kode: subkomponenKey,
            uraian: item.uraian_subkomponen,
            type: 'subkomponen',
            children: {},
            total_pagu: 0,
            total_realisasi: 0,
            total_blokir: 0
          };
        }

        // Add akun as leaf
        tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].children[subkomponenKey].children[akunKey] = {
          kode: akunKey,
          type: 'akun',
          total_pagu: item.total_pagu || 0,
          total_realisasi: item.total_realisasi || 0,
          total_blokir: item.total_blokir || 0,
          item_count: item.item_count
        };

        // Update parent totals
        tree[programKey].total_pagu += item.total_pagu || 0;
        tree[programKey].total_realisasi += item.total_realisasi || 0;
        tree[programKey].total_blokir += item.total_blokir || 0;

        tree[programKey].children[kegiatanKey].total_pagu += item.total_pagu || 0;
        tree[programKey].children[kegiatanKey].total_realisasi += item.total_realisasi || 0;
        tree[programKey].children[kegiatanKey].total_blokir += item.total_blokir || 0;

        tree[programKey].children[kegiatanKey].children[outputKey].total_pagu += item.total_pagu || 0;
        tree[programKey].children[kegiatanKey].children[outputKey].total_realisasi += item.total_realisasi || 0;
        tree[programKey].children[kegiatanKey].children[outputKey].total_blokir += item.total_blokir || 0;

        tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].total_pagu += item.total_pagu || 0;
        tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].total_realisasi += item.total_realisasi || 0;
        tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].total_blokir += item.total_blokir || 0;

        tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].children[subkomponenKey].total_pagu += item.total_pagu || 0;
        tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].children[subkomponenKey].total_realisasi += item.total_realisasi || 0;
        tree[programKey].children[kegiatanKey].children[outputKey].children[komponenKey].children[subkomponenKey].total_blokir += item.total_blokir || 0;
      });

      return tree;
    } catch (error) {
      console.error('Error getting hierarki:', error);
      throw error;
    }
  }

  getSisaPagu(itemId) {
    try {
      const item = this.db.prepare(`
        SELECT total, nilai_blokir, realisasi FROM dipa_item WHERE id = ?
      `).get(itemId);

      if (!item) {
        throw new Error('Item not found');
      }

      const sisaPagu = (item.total || 0) - (item.nilai_blokir || 0) - (item.realisasi || 0);

      return {
        total: item.total || 0,
        nilai_blokir: item.nilai_blokir || 0,
        realisasi: item.realisasi || 0,
        sisa_pagu: sisaPagu
      };
    } catch (error) {
      console.error('Error getting sisa pagu:', error);
      throw error;
    }
  }

  // ==================== CSV PARSER ====================

  parseCSV(csvContent) {
    try {
      // Handle different line endings
      const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

      if (lines.length < 2) {
        throw new Error('CSV tidak memiliki data');
      }

      // Parse header
      const headerLine = lines[0];
      const headers = this.parseCSVLine(headerLine);

      // Map SAKTI column names to our field names
      const columnMap = {
        'KDSATKER': 'kode_satker',
        'KODE_SATKER': 'kode_satker',
        'KODE_PROGRAM': 'kode_program',
        'KDPROGRAM': 'kode_program',
        'KODE_KEGIATAN': 'kode_kegiatan',
        'KDGIAT': 'kode_kegiatan',
        'KODE_OUTPUT': 'kode_output',
        'KDOUTPUT': 'kode_output',
        'KODE_SUBOUTPUT': 'kode_suboutput',
        'KDSUBOUTPUT': 'kode_suboutput',
        'VOLUME_OUTPUT': 'volume_output',
        'VOLOUTPUT': 'volume_output',
        'VOLUME_SUBOUTPUT': 'volume_suboutput',
        'VOLSUBOUTPUT': 'volume_suboutput',
        'KODE_KOMPONEN': 'kode_komponen',
        'KDKMPNEN': 'kode_komponen',
        'KODE_SUBKOMPONEN': 'kode_subkomponen',
        'KDSUBKMPNEN': 'kode_subkomponen',
        'URAIAN_SUBKOMPONEN': 'uraian_subkomponen',
        'NMSUBKMPNEN': 'uraian_subkomponen',
        'KODE_AKUN': 'kode_akun',
        'KDAKUN': 'kode_akun',
        'KODE_ITEM': 'kode_item',
        'KDITEM': 'kode_item',
        'NOMOR_ITEM': 'nomor_item',
        'NOITEM': 'nomor_item',
        'URAIAN_ITEM': 'uraian_item',
        'NMITEM': 'uraian_item',
        'VOLKEG': 'volume',
        'VOLUME': 'volume',
        'SATKEG': 'satuan',
        'SATUAN': 'satuan',
        'HARGASAT': 'harga_satuan',
        'HARGA_SATUAN': 'harga_satuan',
        'TOTAL': 'total',
        'JUMLAH': 'total',
        'KODE_BLOKIR': 'kode_blokir',
        'KDBLOKIR': 'kode_blokir',
        'NILAI_BLOKIR': 'nilai_blokir',
        'NILAIBLOKIR': 'nilai_blokir',
        'POK_NILAI_1': 'pok_1',
        'POK_1': 'pok_1',
        'POKJAN': 'pok_1',
        'POK_NILAI_2': 'pok_2',
        'POK_2': 'pok_2',
        'POKFEB': 'pok_2',
        'POK_NILAI_3': 'pok_3',
        'POK_3': 'pok_3',
        'POKMAR': 'pok_3',
        'POK_NILAI_4': 'pok_4',
        'POK_4': 'pok_4',
        'POKAPR': 'pok_4',
        'POK_NILAI_5': 'pok_5',
        'POK_5': 'pok_5',
        'POKMEI': 'pok_5',
        'POK_NILAI_6': 'pok_6',
        'POK_6': 'pok_6',
        'POKJUN': 'pok_6',
        'POK_NILAI_7': 'pok_7',
        'POK_7': 'pok_7',
        'POKJUL': 'pok_7',
        'POK_NILAI_8': 'pok_8',
        'POK_8': 'pok_8',
        'POKAGS': 'pok_8',
        'POK_NILAI_9': 'pok_9',
        'POK_9': 'pok_9',
        'POKSEP': 'pok_9',
        'POK_NILAI_10': 'pok_10',
        'POK_10': 'pok_10',
        'POKOKT': 'pok_10',
        'POK_NILAI_11': 'pok_11',
        'POK_11': 'pok_11',
        'POKNOV': 'pok_11',
        'POK_NILAI_12': 'pok_12',
        'POK_12': 'pok_12',
        'POKDES': 'pok_12'
      };

      // Map header indices to our field names
      const headerMap = {};
      headers.forEach((header, index) => {
        const normalizedHeader = header.trim().toUpperCase().replace(/['"]/g, '');
        if (columnMap[normalizedHeader]) {
          headerMap[index] = columnMap[normalizedHeader];
        }
      });

      // Parse data rows
      const items = [];
      let totalPagu = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        const item = {};

        values.forEach((value, index) => {
          const fieldName = headerMap[index];
          if (fieldName) {
            // Clean and convert value
            let cleanValue = value.trim().replace(/['"]/g, '');

            // Handle numeric fields
            if (['volume', 'harga_satuan', 'total', 'nilai_blokir',
                 'pok_1', 'pok_2', 'pok_3', 'pok_4', 'pok_5', 'pok_6',
                 'pok_7', 'pok_8', 'pok_9', 'pok_10', 'pok_11', 'pok_12',
                 'volume_output', 'volume_suboutput', 'nomor_item'].includes(fieldName)) {
              // Remove thousand separators and convert to number
              cleanValue = cleanValue.replace(/\./g, '').replace(/,/g, '.');
              cleanValue = parseFloat(cleanValue) || 0;
            }

            item[fieldName] = cleanValue;
          }
        });

        // Only add if has kode_akun (required field)
        if (item.kode_akun) {
          items.push(item);
          totalPagu += item.total || 0;
        }
      }

      // Generate summary by program
      const programSummary = {};
      items.forEach(item => {
        const program = item.kode_program || 'UNKNOWN';
        if (!programSummary[program]) {
          programSummary[program] = { count: 0, total: 0 };
        }
        programSummary[program].count++;
        programSummary[program].total += item.total || 0;
      });

      // Generate summary by akun
      const akunSummary = {};
      items.forEach(item => {
        const akun = item.kode_akun?.substring(0, 2) || 'XX';
        if (!akunSummary[akun]) {
          akunSummary[akun] = { count: 0, total: 0 };
        }
        akunSummary[akun].count++;
        akunSummary[akun].total += item.total || 0;
      });

      return {
        items,
        totalPagu,
        totalItems: items.length,
        programSummary,
        akunSummary,
        headers: Object.values(headerMap)
      };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw new Error('Gagal mem-parse CSV: ' + error.message);
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  // ==================== UTILITY METHODS ====================

  getDistinctPrograms(revisiId) {
    return this.db.prepare(`
      SELECT DISTINCT kode_program FROM dipa_item WHERE dipa_revisi_id = ? ORDER BY kode_program
    `).all(revisiId);
  }

  getDistinctKegiatan(revisiId, kodeProgram = null) {
    if (kodeProgram) {
      return this.db.prepare(`
        SELECT DISTINCT kode_kegiatan FROM dipa_item
        WHERE dipa_revisi_id = ? AND kode_program = ? ORDER BY kode_kegiatan
      `).all(revisiId, kodeProgram);
    }
    return this.db.prepare(`
      SELECT DISTINCT kode_kegiatan FROM dipa_item WHERE dipa_revisi_id = ? ORDER BY kode_kegiatan
    `).all(revisiId);
  }

  getDistinctAkun(revisiId) {
    return this.db.prepare(`
      SELECT DISTINCT kode_akun FROM dipa_item WHERE dipa_revisi_id = ? ORDER BY kode_akun
    `).all(revisiId);
  }
}

module.exports = DipaApi;
