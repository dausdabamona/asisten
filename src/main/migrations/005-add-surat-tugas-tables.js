/**
 * Migration 005: Add Surat Tugas (Perjalanan Dinas) Tables
 * 
 * Tables:
 * - surat_tugas: Main surat tugas table
 * - surat_tugas_pelaksana: Pelaksana/pegawai in surat tugas
 * - surat_tugas_rute: Multi-destination routes
 * - surat_tugas_biaya: Detailed biaya breakdown
 * - surat_tugas_bukti: Evidence/proof documents
 * - surat_tugas_log: Audit log
 * - surat_tugas_dokumen: Generated documents
 */

module.exports = {
  up: async (db) => {
    // Main surat_tugas table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS surat_tugas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nomor TEXT UNIQUE NOT NULL,
        jenis TEXT NOT NULL CHECK(jenis IN ('DALAM_KOTA', 'LUAR_KOTA', 'LUAR_PROVINSI')),
        tanggal_dibuat DATE NOT NULL,
        dibuat_oleh_id INTEGER REFERENCES pegawai(id),
        
        -- Dasar Perjalanan
        jenis_dasar TEXT CHECK(jenis_dasar IN ('UNDANGAN', 'DISPOSISI', 'NOTA_DINAS', 'PROGRAM_KERJA', 'LAINNYA')),
        nomor_dasar TEXT,
        tanggal_dasar DATE,
        perihal_dasar TEXT,
        file_dasar TEXT,
        
        -- Maksud & Tujuan
        maksud_tujuan TEXT NOT NULL,
        kategori_tujuan TEXT CHECK(kategori_tujuan IN ('RAPAT', 'BIMTEK', 'WORKSHOP', 'MONEV', 'KONSULTASI', 'PENGAWASAN', 'LAINNYA')),
        hasil_diharapkan TEXT,
        
        -- Rincian Perjalanan
        kota_asal TEXT DEFAULT 'Sorong',
        kota_tujuan TEXT NOT NULL,
        provinsi_tujuan TEXT,
        tingkat_kota TEXT CHECK(tingkat_kota IN ('A', 'B', 'C')),
        tanggal_berangkat DATE NOT NULL,
        tanggal_kembali DATE NOT NULL,
        lama_hari INTEGER,
        
        -- Anggaran
        dipa_item_id INTEGER REFERENCES dipa_item(id),
        metode_biaya TEXT DEFAULT 'LUMPSUM' CHECK(metode_biaya IN ('LUMPSUM', 'AT_COST')),
        total_biaya REAL DEFAULT 0,
        uang_muka REAL DEFAULT 0,
        
        -- Status & Link
        status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'DISETUJUI', 'SPPD_TERBIT', 'BERANGKAT', 'KEMBALI', 'PEMBAYARAN', 'SELESAI', 'BATAL')),
        link_lp_id INTEGER REFERENCES lembar_permintaan(id),
        
        -- Pertanggungjawaban
        tanggal_kembali_aktual DATE,
        ringkasan_hasil TEXT,
        tindak_lanjut TEXT,
        file_laporan TEXT,
        
        -- Settlement
        selisih_biaya REAL DEFAULT 0,
        status_selisih TEXT CHECK(status_selisih IN ('PAS', 'LEBIH', 'KURANG')),
        
        -- Pembayaran
        nomor_kwitansi TEXT,
        nomor_spp TEXT,
        nomor_spm TEXT,
        tanggal_bayar DATE,
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Pelaksana table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS surat_tugas_pelaksana (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surat_tugas_id INTEGER NOT NULL REFERENCES surat_tugas(id) ON DELETE CASCADE,
        pegawai_id INTEGER NOT NULL REFERENCES pegawai(id),
        urutan INTEGER,
        is_ketua BOOLEAN DEFAULT 0,
        
        -- Biaya per pelaksana
        uang_harian REAL DEFAULT 0,
        penginapan REAL DEFAULT 0,
        transport REAL DEFAULT 0,
        transport_lokal REAL DEFAULT 0,
        representasi REAL DEFAULT 0,
        total_biaya REAL DEFAULT 0,
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(surat_tugas_id, pegawai_id)
      );
    `);

    // Rute table (multi-destinasi)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS surat_tugas_rute (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surat_tugas_id INTEGER NOT NULL REFERENCES surat_tugas(id) ON DELETE CASCADE,
        urutan INTEGER,
        dari_kota TEXT NOT NULL,
        ke_kota TEXT NOT NULL,
        tanggal DATE,
        moda_transport TEXT,
        kelas TEXT,
        estimasi_biaya REAL DEFAULT 0,
        biaya_aktual REAL DEFAULT 0,
        file_tiket TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Biaya detail table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS surat_tugas_biaya (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surat_tugas_id INTEGER NOT NULL REFERENCES surat_tugas(id) ON DELETE CASCADE,
        pelaksana_id INTEGER REFERENCES surat_tugas_pelaksana(id) ON DELETE CASCADE,
        jenis_biaya TEXT CHECK(jenis_biaya IN ('UANG_HARIAN', 'PENGINAPAN', 'TRANSPORT', 'TRANSPORT_LOKAL', 'REPRESENTASI')),
        uraian TEXT,
        tarif_sbm REAL,
        volume REAL,
        satuan TEXT,
        estimasi REAL,
        aktual REAL DEFAULT 0,
        file_bukti TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Bukti perjalanan table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS surat_tugas_bukti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surat_tugas_id INTEGER NOT NULL REFERENCES surat_tugas(id) ON DELETE CASCADE,
        jenis_bukti TEXT CHECK(jenis_bukti IN ('BOARDING_PASS', 'BILL_HOTEL', 'TRANSPORT_LOKAL', 'SPPD_TTD', 'FOTO', 'DAFTAR_HADIR', 'SERTIFIKAT', 'LAINNYA')),
        nama_file TEXT,
        file_path TEXT,
        keterangan TEXT,
        latitude REAL,
        longitude REAL,
        tanggal_foto DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Log table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS surat_tugas_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surat_tugas_id INTEGER NOT NULL REFERENCES surat_tugas(id) ON DELETE CASCADE,
        versi TEXT,
        tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES pegawai(id),
        user_nama TEXT,
        jenis_perubahan TEXT,
        keterangan TEXT,
        data_sebelum TEXT,
        data_sesudah TEXT
      );
    `);

    // Dokumen table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS surat_tugas_dokumen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surat_tugas_id INTEGER NOT NULL REFERENCES surat_tugas(id) ON DELETE CASCADE,
        jenis_dokumen TEXT,
        nomor_dokumen TEXT,
        tanggal_dokumen DATE,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_nomor ON surat_tugas(nomor);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_status ON surat_tugas(status);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_jenis ON surat_tugas(jenis);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_tanggal ON surat_tugas(tanggal_berangkat, tanggal_kembali);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_pelaksana_st ON surat_tugas_pelaksana(surat_tugas_id);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_pelaksana_pegawai ON surat_tugas_pelaksana(pegawai_id);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_rute_st ON surat_tugas_rute(surat_tugas_id);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_biaya_st ON surat_tugas_biaya(surat_tugas_id);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_bukti_st ON surat_tugas_bukti(surat_tugas_id);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_log_st ON surat_tugas_log(surat_tugas_id);
      CREATE INDEX IF NOT EXISTS idx_surat_tugas_dokumen_st ON surat_tugas_dokumen(surat_tugas_id);
    `);

    console.log('Migration 005: Surat Tugas tables created successfully');
  },

  down: async (db) => {
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_dokumen_st');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_log_st');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_bukti_st');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_biaya_st');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_rute_st');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_pelaksana_pegawai');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_pelaksana_st');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_tanggal');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_jenis');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_status');
    await db.exec('DROP INDEX IF EXISTS idx_surat_tugas_nomor');
    
    await db.exec('DROP TABLE IF EXISTS surat_tugas_dokumen');
    await db.exec('DROP TABLE IF EXISTS surat_tugas_log');
    await db.exec('DROP TABLE IF EXISTS surat_tugas_bukti');
    await db.exec('DROP TABLE IF EXISTS surat_tugas_biaya');
    await db.exec('DROP TABLE IF EXISTS surat_tugas_rute');
    await db.exec('DROP TABLE IF EXISTS surat_tugas_pelaksana');
    await db.exec('DROP TABLE IF EXISTS surat_tugas');

    console.log('Migration 005: Surat Tugas tables dropped successfully');
  }
};
