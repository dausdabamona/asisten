/**
 * Surat Tugas API - Handle all surat tugas related IPC calls
 */

const { ipcMain } = require('electron');
const { getDatabase } = require('../database');
const { errorResponse, successResponse } = require('./validator');
const { logError } = require('../logger');

/**
 * Generate nomor surat tugas
 */
function generateNomorST(jenis, tahun, counter) {
  const prefix = {
    'DALAM_KOTA': 'ST-PDK',
    'LUAR_KOTA': 'ST-PLK',
    'LUAR_PROVINSI': 'ST-PLP'
  };
  
  const nomorPrefix = prefix[jenis] || 'ST-PLK';
  const nomorCounter = String(counter).padStart(3, '0');
  
  return `${nomorPrefix}/${tahun}/${nomorCounter}`;
}

/**
 * Get next counter for nomor ST
 */
async function getNextCounter(db, jenis, tahun) {
  const prefix = {
    'DALAM_KOTA': 'ST-PDK',
    'LUAR_KOTA': 'ST-PLK',
    'LUAR_PROVINSI': 'ST-PLP'
  };
  
  const nomorPrefix = prefix[jenis] || 'ST-PLK';
  const pattern = `${nomorPrefix}/${tahun}/%`;
  
  const result = await db.get(
    `SELECT COUNT(*) as count FROM surat_tugas WHERE nomor LIKE ?`,
    [pattern]
  );
  
  return (result?.count || 0) + 1;
}

/**
 * Calculate biaya from SBM
 */
function hitungBiayaSBM(pelaksana, suratTugas, sbmData = {}) {
  const hari = suratTugas.lama_hari || 1;
  const malam = Math.max(0, hari - 1);
  const gol = pelaksana.golongan || 'III';
  
  // Default SBM (should be from master data)
  const defaultSBM = {
    uang_harian: { 'I': 530000, 'II': 530000, 'III': 450000, 'IV': 420000 },
    penginapan: { 'I': 1200000, 'II': 1000000, 'III': 850000, 'IV': 750000 },
    transport_lokal: 150000,
    representasi: { 'I': 250000, 'II': 200000, 'III': 150000, 'IV': 100000 }
  };
  
  const golRoman = gol.match(/^[IV]+/)?.[0] || 'III';
  
  const biaya = {
    uang_harian: (defaultSBM.uang_harian[golRoman] || 450000) * hari,
    penginapan: (defaultSBM.penginapan[golRoman] || 850000) * malam,
    transport: 0, // Should calculate based on origin-destination
    transport_lokal: defaultSBM.transport_lokal * hari,
    representasi: 0
  };
  
  // Add representasi for eselon
  if (pelaksana.eselon && defaultSBM.representasi[pelaksana.eselon]) {
    biaya.representasi = defaultSBM.representasi[pelaksana.eselon] * hari;
  }
  
  biaya.total = Object.values(biaya).reduce((sum, val) => sum + val, 0);
  
  return biaya;
}

/**
 * Create audit log
 */
async function createLog(db, suratTugasId, userId, userName, jenisPerubahan, keterangan, dataBefore = null, dataAfter = null) {
  await db.run(
    `INSERT INTO surat_tugas_log (surat_tugas_id, user_id, user_nama, jenis_perubahan, keterangan, data_sebelum, data_sesudah)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      suratTugasId,
      userId,
      userName,
      jenisPerubahan,
      keterangan,
      dataBefore ? JSON.stringify(dataBefore) : null,
      dataAfter ? JSON.stringify(dataAfter) : null
    ]
  );
}

/**
 * Register all IPC handlers for Surat Tugas
 */
function registerSuratTugasHandlers() {
  
  // Generate nomor ST
  ipcMain.handle('st:nomor:generate', async (event, { jenis, tahun }) => {
    try {
      const db = await getDatabase();
      const counter = await getNextCounter(db, jenis, tahun || new Date().getFullYear());
      const nomor = generateNomorST(jenis, tahun || new Date().getFullYear(), counter);
      
      return successResponse({ nomor, counter });
    } catch (error) {
      logError('st:nomor:generate', error);
      return errorResponse(error.message);
    }
  });

  // List surat tugas
  ipcMain.handle('st:list', async (event, filters = {}) => {
    try {
      const db = await getDatabase();
      
      let query = `
        SELECT 
          st.*,
          GROUP_CONCAT(DISTINCT p.nama) as pelaksana_names,
          COUNT(DISTINCT stp.id) as jumlah_pelaksana,
          di.kode_mak,
          di.uraian as mak_uraian
        FROM surat_tugas st
        LEFT JOIN surat_tugas_pelaksana stp ON st.id = stp.surat_tugas_id
        LEFT JOIN pegawai p ON stp.pegawai_id = p.id
        LEFT JOIN dipa_item di ON st.dipa_item_id = di.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filters.jenis) {
        query += ` AND st.jenis = ?`;
        params.push(filters.jenis);
      }
      
      if (filters.status) {
        query += ` AND st.status = ?`;
        params.push(filters.status);
      }
      
      if (filters.search) {
        query += ` AND (st.nomor LIKE ? OR st.kota_tujuan LIKE ? OR p.nama LIKE ?)`;
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      
      if (filters.tanggal_dari) {
        query += ` AND st.tanggal_berangkat >= ?`;
        params.push(filters.tanggal_dari);
      }
      
      if (filters.tanggal_sampai) {
        query += ` AND st.tanggal_kembali <= ?`;
        params.push(filters.tanggal_sampai);
      }
      
      query += ` GROUP BY st.id ORDER BY st.created_at DESC`;
      
      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(filters.limit);
        
        if (filters.offset) {
          query += ` OFFSET ?`;
          params.push(filters.offset);
        }
      }
      
      const rows = await db.all(query, params);
      
      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT st.id) as total FROM surat_tugas st`;
      if (filters.jenis || filters.status || filters.search) {
        countQuery += ` LEFT JOIN surat_tugas_pelaksana stp ON st.id = stp.surat_tugas_id`;
        countQuery += ` LEFT JOIN pegawai p ON stp.pegawai_id = p.id WHERE 1=1`;
        
        const countParams = [];
        if (filters.jenis) {
          countQuery += ` AND st.jenis = ?`;
          countParams.push(filters.jenis);
        }
        if (filters.status) {
          countQuery += ` AND st.status = ?`;
          countParams.push(filters.status);
        }
        if (filters.search) {
          countQuery += ` AND (st.nomor LIKE ? OR st.kota_tujuan LIKE ? OR p.nama LIKE ?)`;
          const searchPattern = `%${filters.search}%`;
          countParams.push(searchPattern, searchPattern, searchPattern);
        }
        
        const countResult = await db.get(countQuery, countParams);
        
        return successResponse({
          items: rows,
          total: countResult?.total || 0
        });
      }
      
      const countResult = await db.get(countQuery);
      
      return successResponse({
        items: rows,
        total: countResult?.total || 0
      });
    } catch (error) {
      logError('st:list', error);
      return errorResponse(error.message);
    }
  });

  // Get surat tugas by ID
  ipcMain.handle('st:get', async (event, id) => {
    try {
      const db = await getDatabase();
      
      const st = await db.get(
        `SELECT st.*, 
                p.nama as dibuat_oleh_nama,
                di.kode_mak,
                di.uraian as mak_uraian,
                di.pagu,
                di.realisasi
         FROM surat_tugas st
         LEFT JOIN pegawai p ON st.dibuat_oleh_id = p.id
         LEFT JOIN dipa_item di ON st.dipa_item_id = di.id
         WHERE st.id = ?`,
        [id]
      );
      
      if (!st) {
        return errorResponse('Surat tugas tidak ditemukan');
      }
      
      return successResponse(st);
    } catch (error) {
      logError('st:get', error);
      return errorResponse(error.message);
    }
  });

  // Create surat tugas
  ipcMain.handle('st:create', async (event, data) => {
    try {
      const db = await getDatabase();
      
      // Generate nomor if not provided
      if (!data.nomor) {
        const tahun = new Date(data.tanggal_dibuat).getFullYear();
        const counter = await getNextCounter(db, data.jenis, tahun);
        data.nomor = generateNomorST(data.jenis, tahun, counter);
      }
      
      // Calculate lama_hari
      if (data.tanggal_berangkat && data.tanggal_kembali) {
        const start = new Date(data.tanggal_berangkat);
        const end = new Date(data.tanggal_kembali);
        data.lama_hari = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      const result = await db.run(
        `INSERT INTO surat_tugas (
          nomor, jenis, tanggal_dibuat, dibuat_oleh_id,
          jenis_dasar, nomor_dasar, tanggal_dasar, perihal_dasar, file_dasar,
          maksud_tujuan, kategori_tujuan, hasil_diharapkan,
          kota_asal, kota_tujuan, provinsi_tujuan, tingkat_kota,
          tanggal_berangkat, tanggal_kembali, lama_hari,
          dipa_item_id, metode_biaya, total_biaya, uang_muka,
          status, link_lp_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.nomor, data.jenis, data.tanggal_dibuat, data.dibuat_oleh_id,
          data.jenis_dasar, data.nomor_dasar, data.tanggal_dasar, data.perihal_dasar, data.file_dasar,
          data.maksud_tujuan, data.kategori_tujuan, data.hasil_diharapkan,
          data.kota_asal || 'Sorong', data.kota_tujuan, data.provinsi_tujuan, data.tingkat_kota,
          data.tanggal_berangkat, data.tanggal_kembali, data.lama_hari,
          data.dipa_item_id, data.metode_biaya || 'LUMPSUM', data.total_biaya || 0, data.uang_muka || 0,
          data.status || 'DRAFT', data.link_lp_id
        ]
      );
      
      const stId = result.lastID;
      
      // Create log
      await createLog(db, stId, data.dibuat_oleh_id, data.dibuat_oleh_nama || 'System', 'CREATE', 'Surat tugas dibuat', null, data);
      
      return successResponse({ id: stId, nomor: data.nomor });
    } catch (error) {
      logError('st:create', error);
      return errorResponse(error.message);
    }
  });

  // Update surat tugas
  ipcMain.handle('st:update', async (event, { id, data, userId, userName }) => {
    try {
      const db = await getDatabase();
      
      // Get old data for log
      const oldData = await db.get('SELECT * FROM surat_tugas WHERE id = ?', [id]);
      
      if (!oldData) {
        return errorResponse('Surat tugas tidak ditemukan');
      }
      
      // Calculate lama_hari if dates changed
      if (data.tanggal_berangkat && data.tanggal_kembali) {
        const start = new Date(data.tanggal_berangkat);
        const end = new Date(data.tanggal_kembali);
        data.lama_hari = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      const fields = [];
      const values = [];
      
      Object.keys(data).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      await db.run(
        `UPDATE surat_tugas SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      // Create log
      await createLog(db, id, userId, userName, 'UPDATE', 'Surat tugas diubah', oldData, data);
      
      return successResponse({ id });
    } catch (error) {
      logError('st:update', error);
      return errorResponse(error.message);
    }
  });

  // Delete surat tugas
  ipcMain.handle('st:delete', async (event, { id, userId, userName }) => {
    try {
      const db = await getDatabase();
      
      const st = await db.get('SELECT * FROM surat_tugas WHERE id = ?', [id]);
      
      if (!st) {
        return errorResponse('Surat tugas tidak ditemukan');
      }
      
      if (st.status !== 'DRAFT') {
        return errorResponse('Hanya surat tugas dengan status DRAFT yang dapat dihapus');
      }
      
      await db.run('DELETE FROM surat_tugas WHERE id = ?', [id]);
      
      return successResponse({ id });
    } catch (error) {
      logError('st:delete', error);
      return errorResponse(error.message);
    }
  });

  // === PELAKSANA HANDLERS ===

  // List pelaksana
  ipcMain.handle('st:pelaksana:list', async (event, suratTugasId) => {
    try {
      const db = await getDatabase();
      
      const rows = await db.all(
        `SELECT stp.*, p.nama, p.nip, p.golongan, p.jabatan, p.eselon
         FROM surat_tugas_pelaksana stp
         LEFT JOIN pegawai p ON stp.pegawai_id = p.id
         WHERE stp.surat_tugas_id = ?
         ORDER BY stp.is_ketua DESC, stp.urutan ASC`,
        [suratTugasId]
      );
      
      return successResponse(rows);
    } catch (error) {
      logError('st:pelaksana:list', error);
      return errorResponse(error.message);
    }
  });

  // Add pelaksana
  ipcMain.handle('st:pelaksana:add', async (event, data) => {
    try {
      const db = await getDatabase();
      
      // Get pegawai info
      const pegawai = await db.get('SELECT * FROM pegawai WHERE id = ?', [data.pegawai_id]);
      
      if (!pegawai) {
        return errorResponse('Pegawai tidak ditemukan');
      }
      
      // Get surat tugas info for biaya calculation
      const st = await db.get('SELECT * FROM surat_tugas WHERE id = ?', [data.surat_tugas_id]);
      
      // Calculate biaya
      const biaya = hitungBiayaSBM(pegawai, st);
      
      const result = await db.run(
        `INSERT INTO surat_tugas_pelaksana (
          surat_tugas_id, pegawai_id, urutan, is_ketua,
          uang_harian, penginapan, transport, transport_lokal, representasi, total_biaya
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.surat_tugas_id,
          data.pegawai_id,
          data.urutan || 1,
          data.is_ketua || 0,
          biaya.uang_harian,
          biaya.penginapan,
          biaya.transport,
          biaya.transport_lokal,
          biaya.representasi,
          biaya.total
        ]
      );
      
      // Update total biaya surat tugas
      await db.run(
        `UPDATE surat_tugas 
         SET total_biaya = (SELECT SUM(total_biaya) FROM surat_tugas_pelaksana WHERE surat_tugas_id = ?)
         WHERE id = ?`,
        [data.surat_tugas_id, data.surat_tugas_id]
      );
      
      return successResponse({ id: result.lastID, biaya });
    } catch (error) {
      logError('st:pelaksana:add', error);
      return errorResponse(error.message);
    }
  });

  // Update pelaksana
  ipcMain.handle('st:pelaksana:update', async (event, { id, data }) => {
    try {
      const db = await getDatabase();
      
      const fields = [];
      const values = [];
      
      Object.keys(data).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });
      
      values.push(id);
      
      await db.run(
        `UPDATE surat_tugas_pelaksana SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      // Get surat_tugas_id to update total
      const pelaksana = await db.get('SELECT surat_tugas_id FROM surat_tugas_pelaksana WHERE id = ?', [id]);
      
      // Update total biaya surat tugas
      await db.run(
        `UPDATE surat_tugas 
         SET total_biaya = (SELECT SUM(total_biaya) FROM surat_tugas_pelaksana WHERE surat_tugas_id = ?)
         WHERE id = ?`,
        [pelaksana.surat_tugas_id, pelaksana.surat_tugas_id]
      );
      
      return successResponse({ id });
    } catch (error) {
      logError('st:pelaksana:update', error);
      return errorResponse(error.message);
    }
  });

  // Delete pelaksana
  ipcMain.handle('st:pelaksana:delete', async (event, id) => {
    try {
      const db = await getDatabase();
      
      const pelaksana = await db.get('SELECT surat_tugas_id FROM surat_tugas_pelaksana WHERE id = ?', [id]);
      
      if (!pelaksana) {
        return errorResponse('Pelaksana tidak ditemukan');
      }
      
      await db.run('DELETE FROM surat_tugas_pelaksana WHERE id = ?', [id]);
      
      // Update total biaya surat tugas
      await db.run(
        `UPDATE surat_tugas 
         SET total_biaya = (SELECT COALESCE(SUM(total_biaya), 0) FROM surat_tugas_pelaksana WHERE surat_tugas_id = ?)
         WHERE id = ?`,
        [pelaksana.surat_tugas_id, pelaksana.surat_tugas_id]
      );
      
      return successResponse({ id });
    } catch (error) {
      logError('st:pelaksana:delete', error);
      return errorResponse(error.message);
    }
  });

  // === RUTE HANDLERS ===

  // List rute
  ipcMain.handle('st:rute:list', async (event, suratTugasId) => {
    try {
      const db = await getDatabase();
      
      const rows = await db.all(
        `SELECT * FROM surat_tugas_rute 
         WHERE surat_tugas_id = ? 
         ORDER BY urutan ASC`,
        [suratTugasId]
      );
      
      return successResponse(rows);
    } catch (error) {
      logError('st:rute:list', error);
      return errorResponse(error.message);
    }
  });

  // Add rute
  ipcMain.handle('st:rute:add', async (event, data) => {
    try {
      const db = await getDatabase();
      
      const result = await db.run(
        `INSERT INTO surat_tugas_rute (
          surat_tugas_id, urutan, dari_kota, ke_kota, tanggal,
          moda_transport, kelas, estimasi_biaya
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.surat_tugas_id,
          data.urutan || 1,
          data.dari_kota,
          data.ke_kota,
          data.tanggal,
          data.moda_transport,
          data.kelas,
          data.estimasi_biaya || 0
        ]
      );
      
      return successResponse({ id: result.lastID });
    } catch (error) {
      logError('st:rute:add', error);
      return errorResponse(error.message);
    }
  });

  // Update rute
  ipcMain.handle('st:rute:update', async (event, { id, data }) => {
    try {
      const db = await getDatabase();
      
      const fields = [];
      const values = [];
      
      Object.keys(data).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });
      
      values.push(id);
      
      await db.run(
        `UPDATE surat_tugas_rute SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return successResponse({ id });
    } catch (error) {
      logError('st:rute:update', error);
      return errorResponse(error.message);
    }
  });

  // Delete rute
  ipcMain.handle('st:rute:delete', async (event, id) => {
    try {
      const db = await getDatabase();
      
      await db.run('DELETE FROM surat_tugas_rute WHERE id = ?', [id]);
      
      return successResponse({ id });
    } catch (error) {
      logError('st:rute:delete', error);
      return errorResponse(error.message);
    }
  });

  // === BIAYA HANDLERS ===

  // Calculate biaya from SBM
  ipcMain.handle('st:biaya:calculate', async (event, { suratTugasId }) => {
    try {
      const db = await getDatabase();
      
      // Get surat tugas
      const st = await db.get('SELECT * FROM surat_tugas WHERE id = ?', [suratTugasId]);
      
      if (!st) {
        return errorResponse('Surat tugas tidak ditemukan');
      }
      
      // Get all pelaksana
      const pelaksanaList = await db.all(
        `SELECT stp.*, p.golongan, p.eselon
         FROM surat_tugas_pelaksana stp
         LEFT JOIN pegawai p ON stp.pegawai_id = p.id
         WHERE stp.surat_tugas_id = ?`,
        [suratTugasId]
      );
      
      // Calculate biaya for each pelaksana
      for (const pelaksana of pelaksanaList) {
        const biaya = hitungBiayaSBM(pelaksana, st);
        
        await db.run(
          `UPDATE surat_tugas_pelaksana 
           SET uang_harian = ?, penginapan = ?, transport = ?, transport_lokal = ?, representasi = ?, total_biaya = ?
           WHERE id = ?`,
          [biaya.uang_harian, biaya.penginapan, biaya.transport, biaya.transport_lokal, biaya.representasi, biaya.total, pelaksana.id]
        );
      }
      
      // Update total biaya surat tugas
      await db.run(
        `UPDATE surat_tugas 
         SET total_biaya = (SELECT SUM(total_biaya) FROM surat_tugas_pelaksana WHERE surat_tugas_id = ?)
         WHERE id = ?`,
        [suratTugasId, suratTugasId]
      );
      
      return successResponse({ message: 'Biaya berhasil dihitung dari SBM' });
    } catch (error) {
      logError('st:biaya:calculate', error);
      return errorResponse(error.message);
    }
  });

  // Update biaya
  ipcMain.handle('st:biaya:update', async (event, { pelaksanaId, biaya }) => {
    try {
      const db = await getDatabase();
      
      const total = (biaya.uang_harian || 0) + (biaya.penginapan || 0) + (biaya.transport || 0) + 
                    (biaya.transport_lokal || 0) + (biaya.representasi || 0);
      
      await db.run(
        `UPDATE surat_tugas_pelaksana 
         SET uang_harian = ?, penginapan = ?, transport = ?, transport_lokal = ?, representasi = ?, total_biaya = ?
         WHERE id = ?`,
        [biaya.uang_harian, biaya.penginapan, biaya.transport, biaya.transport_lokal, biaya.representasi, total, pelaksanaId]
      );
      
      // Get surat_tugas_id to update total
      const pelaksana = await db.get('SELECT surat_tugas_id FROM surat_tugas_pelaksana WHERE id = ?', [pelaksanaId]);
      
      // Update total biaya surat tugas
      await db.run(
        `UPDATE surat_tugas 
         SET total_biaya = (SELECT SUM(total_biaya) FROM surat_tugas_pelaksana WHERE surat_tugas_id = ?)
         WHERE id = ?`,
        [pelaksana.surat_tugas_id, pelaksana.surat_tugas_id]
      );
      
      return successResponse({ pelaksanaId, total });
    } catch (error) {
      logError('st:biaya:update', error);
      return errorResponse(error.message);
    }
  });

  // === BUKTI HANDLERS ===

  // List bukti
  ipcMain.handle('st:bukti:list', async (event, suratTugasId) => {
    try {
      const db = await getDatabase();
      
      const rows = await db.all(
        `SELECT * FROM surat_tugas_bukti 
         WHERE surat_tugas_id = ? 
         ORDER BY created_at DESC`,
        [suratTugasId]
      );
      
      return successResponse(rows);
    } catch (error) {
      logError('st:bukti:list', error);
      return errorResponse(error.message);
    }
  });

  // Add bukti
  ipcMain.handle('st:bukti:add', async (event, data) => {
    try {
      const db = await getDatabase();
      
      const result = await db.run(
        `INSERT INTO surat_tugas_bukti (
          surat_tugas_id, jenis_bukti, nama_file, file_path, keterangan,
          latitude, longitude, tanggal_foto
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.surat_tugas_id,
          data.jenis_bukti,
          data.nama_file,
          data.file_path,
          data.keterangan,
          data.latitude,
          data.longitude,
          data.tanggal_foto
        ]
      );
      
      return successResponse({ id: result.lastID });
    } catch (error) {
      logError('st:bukti:add', error);
      return errorResponse(error.message);
    }
  });

  // Delete bukti
  ipcMain.handle('st:bukti:delete', async (event, id) => {
    try {
      const db = await getDatabase();
      
      await db.run('DELETE FROM surat_tugas_bukti WHERE id = ?', [id]);
      
      return successResponse({ id });
    } catch (error) {
      logError('st:bukti:delete', error);
      return errorResponse(error.message);
    }
  });

  // === PERTANGGUNGJAWABAN HANDLER ===

  // Update pertanggungjawaban
  ipcMain.handle('st:pertanggungjawaban:update', async (event, { id, data, userId, userName }) => {
    try {
      const db = await getDatabase();
      
      // Calculate selisih if metode AT_COST
      const st = await db.get('SELECT * FROM surat_tugas WHERE id = ?', [id]);
      
      if (st.metode_biaya === 'AT_COST') {
        const biayaAktual = data.biaya_aktual || 0;
        const uangMuka = st.uang_muka || 0;
        const selisih = biayaAktual - uangMuka;
        
        data.selisih_biaya = selisih;
        
        if (Math.abs(selisih) < 1000) {
          data.status_selisih = 'PAS';
        } else if (selisih > 0) {
          data.status_selisih = 'KURANG';
        } else {
          data.status_selisih = 'LEBIH';
        }
      }
      
      const fields = [];
      const values = [];
      
      Object.keys(data).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });
      
      fields.push('status = ?');
      values.push('PEMBAYARAN');
      
      values.push(id);
      
      await db.run(
        `UPDATE surat_tugas SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      // Create log
      await createLog(db, id, userId, userName, 'PERTANGGUNGJAWABAN', 'Input pertanggungjawaban', null, data);
      
      return successResponse({ id, selisih: data.selisih_biaya, status_selisih: data.status_selisih });
    } catch (error) {
      logError('st:pertanggungjawaban:update', error);
      return errorResponse(error.message);
    }
  });

  // === DOKUMEN HANDLER ===

  // Generate dokumen
  ipcMain.handle('st:dokumen:generate', async (event, { suratTugasId, jenisDokumen }) => {
    try {
      const db = await getDatabase();
      
      // This would call documentGenerator service
      // For now, just create a record
      
      const nomor = `${jenisDokumen}/${new Date().getFullYear()}/001`;
      
      const result = await db.run(
        `INSERT INTO surat_tugas_dokumen (surat_tugas_id, jenis_dokumen, nomor_dokumen, tanggal_dokumen)
         VALUES (?, ?, ?, ?)`,
        [suratTugasId, jenisDokumen, nomor, new Date().toISOString().split('T')[0]]
      );
      
      return successResponse({ id: result.lastID, nomor });
    } catch (error) {
      logError('st:dokumen:generate', error);
      return errorResponse(error.message);
    }
  });

  console.log('Surat Tugas IPC handlers registered');
}

module.exports = {
  registerSuratTugasHandlers
};
