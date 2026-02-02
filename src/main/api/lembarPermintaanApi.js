/**
 * Lembar Permintaan API Handler
 * Handles IPC for Lembar Permintaan (LP) operations
 * Full procurement lifecycle: Draft -> Selesai
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Valid status transitions
const STATUS_TRANSITIONS = {
  DRAFT: ['DIAJUKAN', 'BATAL'],
  DIAJUKAN: ['DISETUJUI', 'DRAFT', 'BATAL'],
  DISETUJUI: ['PROSES_PENGADAAN', 'BATAL'],
  PROSES_PENGADAAN: ['KONTRAK', 'BATAL'],
  KONTRAK: ['SERAH_TERIMA'],
  SERAH_TERIMA: ['PEMBAYARAN'],
  PEMBAYARAN: ['SELESAI'],
  SELESAI: [],
  BATAL: []
};

class LembarPermintaanApi {
  constructor(db) {
    this.db = db;
    this.registerHandlers();
  }

  registerHandlers() {
    // LP CRUD
    ipcMain.handle('lp:list', (_, params) => this.getLPList(params));
    ipcMain.handle('lp:get', (_, id) => this.getLPById(id));
    ipcMain.handle('lp:create', (_, data) => this.createLP(data));
    ipcMain.handle('lp:update', (_, { id, data }) => this.updateLP(id, data));
    ipcMain.handle('lp:delete', (_, id) => this.deleteLP(id));
    ipcMain.handle('lp:updateStatus', (_, { id, status, keterangan }) => this.updateStatus(id, status, keterangan));

    // Items
    ipcMain.handle('lp:item:list', (_, lpId) => this.getItems(lpId));
    ipcMain.handle('lp:item:add', (_, { lpId, data }) => this.addItem(lpId, data));
    ipcMain.handle('lp:item:update', (_, { id, data }) => this.updateItem(id, data));
    ipcMain.handle('lp:item:delete', (_, id) => this.deleteItem(id));

    // Logs
    ipcMain.handle('lp:log:list', (_, lpId) => this.getLogs(lpId));

    // Dokumen
    ipcMain.handle('lp:dokumen:list', (_, lpId) => this.getDokumen(lpId));
    ipcMain.handle('lp:dokumen:generate', (_, { lpId, jenisDokumen }) => this.generateDokumen(lpId, jenisDokumen));

    // Lampiran
    ipcMain.handle('lp:lampiran:list', (_, lpId) => this.getLampiran(lpId));
    ipcMain.handle('lp:lampiran:add', (_, { lpId, data }) => this.addLampiran(lpId, data));
    ipcMain.handle('lp:lampiran:delete', (_, id) => this.deleteLampiran(id));

    // Utility
    ipcMain.handle('lp:nomor:generate', (_, jenis) => this.generateNomor(jenis));
  }

  // ==================== LP CRUD ====================

  getLPList(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        jenis = '',
        status = '',
        search = '',
        tanggalMulai = '',
        tanggalSelesai = '',
        unitPengusulId = ''
      } = params;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];

      if (jenis) {
        conditions.push('lp.jenis = ?');
        values.push(jenis);
      }

      if (status) {
        conditions.push('lp.status = ?');
        values.push(status);
      }

      if (search) {
        conditions.push('(lp.nomor LIKE ? OR lp.nama_pengadaan LIKE ?)');
        values.push(`%${search}%`, `%${search}%`);
      }

      if (tanggalMulai) {
        conditions.push('lp.tanggal_dibuat >= ?');
        values.push(tanggalMulai);
      }

      if (tanggalSelesai) {
        conditions.push('lp.tanggal_dibuat <= ?');
        values.push(tanggalSelesai);
      }

      if (unitPengusulId) {
        conditions.push('lp.unit_pengusul_id = ?');
        values.push(unitPengusulId);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM lembar_permintaan lp ${whereClause}`;
      const countResult = this.db.prepare(countQuery).get(...values);

      // Get data with joins
      const query = `
        SELECT lp.*,
               p.nama as dibuat_oleh_nama,
               uk.nama as unit_pengusul_nama,
               s.nama as supplier_nama,
               (SELECT COUNT(*) FROM lembar_permintaan_item WHERE lembar_permintaan_id = lp.id) as item_count
        FROM lembar_permintaan lp
        LEFT JOIN pegawai p ON lp.dibuat_oleh_id = p.id
        LEFT JOIN unit_kerja uk ON lp.unit_pengusul_id = uk.id
        LEFT JOIN supplier s ON lp.supplier_id = s.id
        ${whereClause}
        ORDER BY lp.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const data = this.db.prepare(query).all(...values, limit, offset);

      return {
        success: true,
        data,
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      };
    } catch (error) {
      console.error('Error getting LP list:', error);
      return { success: false, error: error.message };
    }
  }

  getLPById(id) {
    try {
      const lp = this.db.prepare(`
        SELECT lp.*,
               p.nama as dibuat_oleh_nama,
               p.nip as dibuat_oleh_nip,
               uk.nama as unit_pengusul_nama,
               uk.kode as unit_pengusul_kode,
               s.nama as supplier_nama,
               s.npwp as supplier_npwp,
               s.is_pkp as supplier_is_pkp,
               s.jenis as supplier_jenis,
               di.kode_program, di.kode_kegiatan, di.kode_output, di.kode_komponen,
               di.kode_subkomponen, di.kode_akun, di.uraian_item as dipa_uraian,
               di.total as dipa_pagu
        FROM lembar_permintaan lp
        LEFT JOIN pegawai p ON lp.dibuat_oleh_id = p.id
        LEFT JOIN unit_kerja uk ON lp.unit_pengusul_id = uk.id
        LEFT JOIN supplier s ON lp.supplier_id = s.id
        LEFT JOIN dipa_item di ON lp.dipa_item_id = di.id
        WHERE lp.id = ?
      `).get(id);

      if (!lp) {
        return { success: false, error: 'Lembar Permintaan tidak ditemukan' };
      }

      return { success: true, data: lp };
    } catch (error) {
      console.error('Error getting LP:', error);
      return { success: false, error: error.message };
    }
  }

  createLP(data) {
    try {
      const {
        jenis,
        tanggal_dibuat,
        dibuat_oleh_id,
        unit_pengusul_id,
        nama_pengadaan,
        uraian,
        justifikasi,
        lokasi_pelaksanaan,
        target_waktu_mulai,
        target_waktu_selesai,
        dipa_item_id,
        total_nilai,
        kategori_tier,
        metode_pengadaan
      } = data;

      if (!jenis || !nama_pengadaan) {
        return { success: false, error: 'Jenis dan Nama Pengadaan wajib diisi' };
      }

      // Generate nomor
      const nomor = this.generateNomorInternal(jenis);

      const stmt = this.db.prepare(`
        INSERT INTO lembar_permintaan (
          nomor, jenis, tanggal_dibuat, dibuat_oleh_id, unit_pengusul_id,
          nama_pengadaan, uraian, justifikasi, lokasi_pelaksanaan,
          target_waktu_mulai, target_waktu_selesai, dipa_item_id,
          total_nilai, kategori_tier, metode_pengadaan, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
      `);

      const result = stmt.run(
        nomor,
        jenis,
        tanggal_dibuat || new Date().toISOString().split('T')[0],
        dibuat_oleh_id || null,
        unit_pengusul_id || null,
        nama_pengadaan,
        uraian || null,
        justifikasi || null,
        lokasi_pelaksanaan || null,
        target_waktu_mulai || null,
        target_waktu_selesai || null,
        dipa_item_id || null,
        total_nilai || 0,
        kategori_tier || 'TIER1',
        metode_pengadaan || 'Pembelian Langsung'
      );

      const lpId = result.lastInsertRowid;

      // Add log
      this.addLog(lpId, null, null, 'DIBUAT', `Lembar Permintaan ${nomor} dibuat`);

      const newLP = this.db.prepare('SELECT * FROM lembar_permintaan WHERE id = ?').get(lpId);
      return { success: true, data: newLP };
    } catch (error) {
      console.error('Error creating LP:', error);
      return { success: false, error: error.message };
    }
  }

  updateLP(id, data) {
    try {
      const lp = this.db.prepare('SELECT * FROM lembar_permintaan WHERE id = ?').get(id);
      if (!lp) {
        return { success: false, error: 'Lembar Permintaan tidak ditemukan' };
      }

      // Only allow edit if DRAFT
      if (lp.status !== 'DRAFT') {
        return { success: false, error: 'Hanya LP dengan status DRAFT yang dapat diedit' };
      }

      const allowedFields = [
        'nama_pengadaan', 'uraian', 'justifikasi', 'lokasi_pelaksanaan',
        'target_waktu_mulai', 'target_waktu_selesai', 'dipa_item_id',
        'total_nilai', 'kategori_tier', 'metode_pengadaan', 'unit_pengusul_id',
        'supplier_id', 'nomor_kontrak', 'tanggal_kontrak', 'jangka_waktu_kontrak',
        'tanggal_mulai_kontrak', 'tanggal_selesai_kontrak', 'nilai_kontrak',
        'tanggal_serah_terima', 'nomor_bast', 'kondisi_serah_terima', 'catatan_serah_terima',
        'nilai_tagihan', 'nilai_ppn', 'nilai_pph22', 'nilai_pph21', 'nilai_bersih',
        'nomor_kwitansi', 'nomor_spp', 'nomor_spm', 'tanggal_bayar'
      ];

      const fields = [];
      const values = [];
      const oldData = {};
      const newData = {};

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
          oldData[field] = lp[field];
          newData[field] = data[field];
        }
      }

      if (fields.length === 0) {
        return { success: true, data: lp };
      }

      values.push(id);

      this.db.prepare(`
        UPDATE lembar_permintaan SET ${fields.join(', ')}
        WHERE id = ?
      `).run(...values);

      // Add log
      this.addLog(id, null, null, 'DATA_BERUBAH', 'Data LP diubah', JSON.stringify(oldData), JSON.stringify(newData));

      const updated = this.db.prepare('SELECT * FROM lembar_permintaan WHERE id = ?').get(id);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating LP:', error);
      return { success: false, error: error.message };
    }
  }

  deleteLP(id) {
    try {
      const lp = this.db.prepare('SELECT * FROM lembar_permintaan WHERE id = ?').get(id);
      if (!lp) {
        return { success: false, error: 'Lembar Permintaan tidak ditemukan' };
      }

      if (lp.status !== 'DRAFT') {
        return { success: false, error: 'Hanya LP dengan status DRAFT yang dapat dihapus' };
      }

      // Delete related records first (cascade should handle this, but just to be safe)
      this.db.prepare('DELETE FROM lembar_permintaan_item WHERE lembar_permintaan_id = ?').run(id);
      this.db.prepare('DELETE FROM lembar_permintaan_log WHERE lembar_permintaan_id = ?').run(id);
      this.db.prepare('DELETE FROM lembar_permintaan_dokumen WHERE lembar_permintaan_id = ?').run(id);
      this.db.prepare('DELETE FROM lembar_permintaan_lampiran WHERE lembar_permintaan_id = ?').run(id);
      this.db.prepare('DELETE FROM lembar_permintaan WHERE id = ?').run(id);

      return { success: true };
    } catch (error) {
      console.error('Error deleting LP:', error);
      return { success: false, error: error.message };
    }
  }

  updateStatus(id, newStatus, keterangan = '') {
    try {
      const lp = this.db.prepare('SELECT * FROM lembar_permintaan WHERE id = ?').get(id);
      if (!lp) {
        return { success: false, error: 'Lembar Permintaan tidak ditemukan' };
      }

      // Validate transition
      const validTargets = STATUS_TRANSITIONS[lp.status] || [];
      if (!validTargets.includes(newStatus)) {
        return { success: false, error: `Tidak dapat mengubah status dari ${lp.status} ke ${newStatus}` };
      }

      const oldStatus = lp.status;

      this.db.prepare('UPDATE lembar_permintaan SET status = ? WHERE id = ?').run(newStatus, id);

      // Add log
      this.addLog(id, null, null, 'STATUS_BERUBAH',
        keterangan || `Status berubah dari ${oldStatus} ke ${newStatus}`,
        JSON.stringify({ status: oldStatus }),
        JSON.stringify({ status: newStatus })
      );

      // If status becomes SELESAI, update DIPA realisasi
      if (newStatus === 'SELESAI' && lp.dipa_item_id) {
        this.updateDipaRealisasi(lp.dipa_item_id, lp.total_nilai || 0);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error: error.message };
    }
  }

  updateDipaRealisasi(dipaItemId, nilai) {
    try {
      const item = this.db.prepare('SELECT realisasi FROM dipa_item WHERE id = ?').get(dipaItemId);
      if (item) {
        const newRealisasi = (item.realisasi || 0) + nilai;
        this.db.prepare('UPDATE dipa_item SET realisasi = ? WHERE id = ?').run(newRealisasi, dipaItemId);
      }
    } catch (error) {
      console.error('Error updating DIPA realisasi:', error);
    }
  }

  // ==================== ITEMS ====================

  getItems(lpId) {
    try {
      const data = this.db.prepare(`
        SELECT * FROM lembar_permintaan_item
        WHERE lembar_permintaan_id = ?
        ORDER BY urutan, id
      `).all(lpId);

      return { success: true, data };
    } catch (error) {
      console.error('Error getting items:', error);
      return { success: false, error: error.message };
    }
  }

  addItem(lpId, data) {
    try {
      const { uraian, spesifikasi, volume, satuan, harga_satuan } = data;

      if (!uraian || !volume || !satuan || !harga_satuan) {
        return { success: false, error: 'Data item tidak lengkap' };
      }

      const jumlah = volume * harga_satuan;

      // Get next urutan
      const lastItem = this.db.prepare(`
        SELECT MAX(urutan) as max_urutan FROM lembar_permintaan_item WHERE lembar_permintaan_id = ?
      `).get(lpId);
      const urutan = (lastItem?.max_urutan || 0) + 1;

      const stmt = this.db.prepare(`
        INSERT INTO lembar_permintaan_item (lembar_permintaan_id, urutan, uraian, spesifikasi, volume, satuan, harga_satuan, jumlah)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(lpId, urutan, uraian, spesifikasi || null, volume, satuan, harga_satuan, jumlah);

      // Update LP total
      this.recalculateLPTotal(lpId);

      // Add log
      this.addLog(lpId, null, null, 'ITEM_DITAMBAH', `Item "${uraian}" ditambahkan`);

      const newItem = this.db.prepare('SELECT * FROM lembar_permintaan_item WHERE id = ?').get(result.lastInsertRowid);
      return { success: true, data: newItem };
    } catch (error) {
      console.error('Error adding item:', error);
      return { success: false, error: error.message };
    }
  }

  updateItem(id, data) {
    try {
      const item = this.db.prepare('SELECT * FROM lembar_permintaan_item WHERE id = ?').get(id);
      if (!item) {
        return { success: false, error: 'Item tidak ditemukan' };
      }

      const allowedFields = ['uraian', 'spesifikasi', 'volume', 'satuan', 'harga_satuan', 'urutan'];
      const fields = [];
      const values = [];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      // Recalculate jumlah
      const volume = data.volume !== undefined ? data.volume : item.volume;
      const harga_satuan = data.harga_satuan !== undefined ? data.harga_satuan : item.harga_satuan;
      const jumlah = volume * harga_satuan;
      fields.push('jumlah = ?');
      values.push(jumlah);

      values.push(id);

      this.db.prepare(`
        UPDATE lembar_permintaan_item SET ${fields.join(', ')}
        WHERE id = ?
      `).run(...values);

      // Update LP total
      this.recalculateLPTotal(item.lembar_permintaan_id);

      const updated = this.db.prepare('SELECT * FROM lembar_permintaan_item WHERE id = ?').get(id);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating item:', error);
      return { success: false, error: error.message };
    }
  }

  deleteItem(id) {
    try {
      const item = this.db.prepare('SELECT * FROM lembar_permintaan_item WHERE id = ?').get(id);
      if (!item) {
        return { success: false, error: 'Item tidak ditemukan' };
      }

      this.db.prepare('DELETE FROM lembar_permintaan_item WHERE id = ?').run(id);

      // Update LP total
      this.recalculateLPTotal(item.lembar_permintaan_id);

      // Add log
      this.addLog(item.lembar_permintaan_id, null, null, 'ITEM_DIHAPUS', `Item "${item.uraian}" dihapus`);

      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, error: error.message };
    }
  }

  recalculateLPTotal(lpId) {
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(jumlah), 0) as total FROM lembar_permintaan_item WHERE lembar_permintaan_id = ?
    `).get(lpId);

    const total = result?.total || 0;

    // Recalculate tier
    let tier = 'TIER1';
    if (total > 50000000) {
      tier = 'TIER3';
    } else if (total > 10000000) {
      tier = 'TIER2';
    }

    let metodePengadaan = 'Pembelian Langsung';
    if (tier === 'TIER2') {
      metodePengadaan = 'Pengadaan Langsung';
    } else if (tier === 'TIER3') {
      metodePengadaan = 'Tender/Seleksi';
    }

    this.db.prepare(`
      UPDATE lembar_permintaan SET total_nilai = ?, kategori_tier = ?, metode_pengadaan = ?
      WHERE id = ?
    `).run(total, tier, metodePengadaan, lpId);

    return total;
  }

  // ==================== LOGS ====================

  getLogs(lpId) {
    try {
      const data = this.db.prepare(`
        SELECT * FROM lembar_permintaan_log
        WHERE lembar_permintaan_id = ?
        ORDER BY tanggal DESC
      `).all(lpId);

      return { success: true, data };
    } catch (error) {
      console.error('Error getting logs:', error);
      return { success: false, error: error.message };
    }
  }

  addLog(lpId, userId, userNama, jenisPerubahan, keterangan, dataSebelum = null, dataSesudah = null) {
    try {
      this.db.prepare(`
        INSERT INTO lembar_permintaan_log (lembar_permintaan_id, user_id, user_nama, jenis_perubahan, keterangan, data_sebelum, data_sesudah)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(lpId, userId, userNama, jenisPerubahan, keterangan, dataSebelum, dataSesudah);
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }

  // ==================== DOKUMEN ====================

  getDokumen(lpId) {
    try {
      const data = this.db.prepare(`
        SELECT * FROM lembar_permintaan_dokumen
        WHERE lembar_permintaan_id = ?
        ORDER BY created_at DESC
      `).all(lpId);

      return { success: true, data };
    } catch (error) {
      console.error('Error getting dokumen:', error);
      return { success: false, error: error.message };
    }
  }

  generateDokumen(lpId, jenisDokumen) {
    try {
      // This is a placeholder - actual document generation would be more complex
      const lp = this.db.prepare('SELECT * FROM lembar_permintaan WHERE id = ?').get(lpId);
      if (!lp) {
        return { success: false, error: 'LP tidak ditemukan' };
      }

      const tanggalDokumen = new Date().toISOString().split('T')[0];
      const nomorDokumen = `${jenisDokumen}/${lp.nomor}`;

      // Insert dokumen record
      const stmt = this.db.prepare(`
        INSERT INTO lembar_permintaan_dokumen (lembar_permintaan_id, jenis_dokumen, nomor_dokumen, tanggal_dokumen)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(lpId, jenisDokumen, nomorDokumen, tanggalDokumen);

      // Add log
      this.addLog(lpId, null, null, 'DOKUMEN_DIGENERATE', `Dokumen ${jenisDokumen} di-generate`);

      const newDokumen = this.db.prepare('SELECT * FROM lembar_permintaan_dokumen WHERE id = ?').get(result.lastInsertRowid);
      return { success: true, data: newDokumen };
    } catch (error) {
      console.error('Error generating dokumen:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== LAMPIRAN ====================

  getLampiran(lpId) {
    try {
      const data = this.db.prepare(`
        SELECT * FROM lembar_permintaan_lampiran
        WHERE lembar_permintaan_id = ?
        ORDER BY created_at DESC
      `).all(lpId);

      return { success: true, data };
    } catch (error) {
      console.error('Error getting lampiran:', error);
      return { success: false, error: error.message };
    }
  }

  addLampiran(lpId, data) {
    try {
      const { nama_file, jenis_lampiran, file_path, ukuran } = data;

      if (!nama_file || !file_path) {
        return { success: false, error: 'Data lampiran tidak lengkap' };
      }

      const stmt = this.db.prepare(`
        INSERT INTO lembar_permintaan_lampiran (lembar_permintaan_id, nama_file, jenis_lampiran, file_path, ukuran)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(lpId, nama_file, jenis_lampiran || 'LAINNYA', file_path, ukuran || 0);

      // Add log
      this.addLog(lpId, null, null, 'LAMPIRAN_DITAMBAH', `Lampiran "${nama_file}" ditambahkan`);

      const newLampiran = this.db.prepare('SELECT * FROM lembar_permintaan_lampiran WHERE id = ?').get(result.lastInsertRowid);
      return { success: true, data: newLampiran };
    } catch (error) {
      console.error('Error adding lampiran:', error);
      return { success: false, error: error.message };
    }
  }

  deleteLampiran(id) {
    try {
      const lampiran = this.db.prepare('SELECT * FROM lembar_permintaan_lampiran WHERE id = ?').get(id);
      if (!lampiran) {
        return { success: false, error: 'Lampiran tidak ditemukan' };
      }

      this.db.prepare('DELETE FROM lembar_permintaan_lampiran WHERE id = ?').run(id);

      // Add log
      this.addLog(lampiran.lembar_permintaan_id, null, null, 'LAMPIRAN_DIHAPUS', `Lampiran "${lampiran.nama_file}" dihapus`);

      return { success: true };
    } catch (error) {
      console.error('Error deleting lampiran:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY ====================

  generateNomor(jenis) {
    try {
      const nomor = this.generateNomorInternal(jenis);
      return { success: true, data: nomor };
    } catch (error) {
      console.error('Error generating nomor:', error);
      return { success: false, error: error.message };
    }
  }

  generateNomorInternal(jenis) {
    const year = new Date().getFullYear();
    const prefix = jenis === 'BARANG' ? 'LP-BRG' :
                   jenis === 'JASA' ? 'LP-JAS' :
                   jenis === 'PJLP' ? 'LP-PJLP' :
                   jenis === 'KEGIATAN' ? 'LP-KEG' : 'LP';

    // Get the last number for this year and prefix
    const lastLP = this.db.prepare(`
      SELECT nomor FROM lembar_permintaan
      WHERE nomor LIKE ?
      ORDER BY id DESC LIMIT 1
    `).get(`${prefix}/${year}/%`);

    let nextNumber = 1;
    if (lastLP) {
      const parts = lastLP.nomor.split('/');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `${prefix}/${year}/${String(nextNumber).padStart(3, '0')}`;
  }

  // Calculate pajak
  calculatePajak(lp, supplier) {
    const nilai = lp.nilai_tagihan || lp.total_nilai || 0;
    let ppn = 0, pph22 = 0, pph21 = 0;

    // PPN 11% jika supplier PKP
    if (supplier?.is_pkp) {
      ppn = nilai * 0.11;
    }

    // PPh 22 untuk pengadaan barang
    if (lp.jenis === 'BARANG' && nilai > 2000000) {
      if (supplier?.npwp) {
        pph22 = nilai * 0.015; // 1.5%
      } else {
        pph22 = nilai * 0.03; // 3% tanpa NPWP
      }
    }

    // PPh 21 untuk jasa perorangan
    if (lp.jenis === 'JASA' && supplier?.jenis === 'PERORANGAN') {
      if (supplier?.npwp) {
        pph21 = nilai * 0.025; // 2.5%
      } else {
        pph21 = nilai * 0.03; // 3%
      }
    }

    const nilai_bersih = nilai + ppn - pph22 - pph21;

    return { ppn, pph22, pph21, nilai_bersih };
  }
}

module.exports = LembarPermintaanApi;
