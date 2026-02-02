/**
 * Database Schema Definition
 * Comprehensive schema for PPK Asisten - Politeknik Kelautan dan Perikanan Sorong
 *
 * Tables:
 * - Master Data: satker, pejabat, unit_kerja, pegawai, supplier
 * - DIPA: dipa, dipa_revisi, dipa_item
 * - SBM: sbm_tahun, sbm_uang_harian, sbm_transport, sbm_honorarium
 * - Legacy: users, vendors, procurement_requests, contracts, payments, etc.
 */

// Database version for migrations
const DB_VERSION = 6;

// ==================== MASTER DATA TABLES ====================

const SATKER_TABLE = `
  CREATE TABLE IF NOT EXISTS satker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_satker TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    nama_singkat TEXT,
    kode_kl TEXT,
    nama_kl TEXT,
    kode_eselon1 TEXT,
    nama_eselon1 TEXT,
    alamat TEXT,
    kelurahan TEXT,
    kecamatan TEXT,
    kota TEXT,
    provinsi TEXT,
    kode_pos TEXT,
    telepon TEXT,
    fax TEXT,
    email TEXT,
    website TEXT,
    npwp TEXT,
    nama_wp TEXT,
    bank_pengeluaran TEXT,
    rekening_pengeluaran TEXT,
    nama_rek_pengeluaran TEXT,
    bank_penerimaan TEXT,
    rekening_penerimaan TEXT,
    nama_rek_penerimaan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const PEJABAT_TABLE = `
  CREATE TABLE IF NOT EXISTS pejabat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satker_id INTEGER REFERENCES satker(id) ON DELETE CASCADE,
    jenis TEXT NOT NULL CHECK(jenis IN ('KPA', 'PPK', 'PPSPM', 'BENDAHARA_PENGELUARAN', 'BENDAHARA_PENERIMAAN')),
    nama TEXT NOT NULL,
    nip TEXT,
    nomor_sk TEXT,
    tanggal_sk DATE,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const UNIT_KERJA_TABLE = `
  CREATE TABLE IF NOT EXISTS unit_kerja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satker_id INTEGER REFERENCES satker(id) ON DELETE CASCADE,
    kode TEXT,
    nama TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const PEGAWAI_TABLE = `
  CREATE TABLE IF NOT EXISTS pegawai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nip TEXT UNIQUE,
    nik TEXT,
    nama TEXT NOT NULL,
    gelar_depan TEXT,
    gelar_belakang TEXT,
    tempat_lahir TEXT,
    tanggal_lahir DATE,
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
    alamat TEXT,
    no_hp TEXT,
    email TEXT,
    npwp TEXT,
    status_pegawai TEXT CHECK(status_pegawai IN ('ASN', 'PPPK', 'HONORER')),
    pangkat TEXT,
    golongan TEXT,
    tmt_pangkat DATE,
    jenis_jabatan TEXT,
    nama_jabatan TEXT,
    eselon TEXT,
    unit_kerja_id INTEGER REFERENCES unit_kerja(id) ON DELETE SET NULL,
    nama_bank TEXT,
    nomor_rekening TEXT,
    nama_rekening TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const SUPPLIER_TABLE = `
  CREATE TABLE IF NOT EXISTS supplier (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jenis TEXT NOT NULL CHECK(jenis IN ('BADAN_USAHA', 'PERORANGAN')),
    nama TEXT NOT NULL,
    bentuk_usaha TEXT CHECK(bentuk_usaha IN ('CV', 'PT', 'KOPERASI', 'UD', 'FIRMA', NULL)),
    bidang_usaha TEXT,
    alamat TEXT,
    kota TEXT,
    provinsi TEXT,
    kode_pos TEXT,
    telepon TEXT,
    fax TEXT,
    email TEXT,
    website TEXT,
    nib TEXT,
    npwp TEXT,
    nama_wp TEXT,
    is_pkp INTEGER DEFAULT 0,
    nomor_siup TEXT,
    tanggal_siup DATE,
    masa_berlaku_siup DATE,
    nomor_akta_pendirian TEXT,
    tanggal_akta_pendirian DATE,
    notaris_akta_pendirian TEXT,
    nomor_akta_perubahan TEXT,
    tanggal_akta_perubahan DATE,
    nama_direktur TEXT,
    nik_direktur TEXT,
    jabatan_direktur TEXT,
    hp_direktur TEXT,
    nama_cp TEXT,
    jabatan_cp TEXT,
    hp_cp TEXT,
    email_cp TEXT,
    nama_bank TEXT,
    nomor_rekening TEXT,
    nama_rekening TEXT,
    kualifikasi_usaha TEXT CHECK(kualifikasi_usaha IN ('KECIL', 'NON_KECIL', NULL)),
    bidang_pengadaan TEXT,
    nik TEXT,
    tempat_lahir TEXT,
    tanggal_lahir DATE,
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P', NULL)),
    status_pekerjaan TEXT CHECK(status_pekerjaan IN ('PNS', 'SWASTA', 'WIRASWASTA', 'PROFESIONAL', 'PENSIUNAN', NULL)),
    instansi TEXT,
    jabatan TEXT,
    kota_instansi TEXT,
    pendidikan_terakhir TEXT,
    bidang_keahlian TEXT,
    klasifikasi_honor TEXT,
    total_kontrak INTEGER DEFAULT 0,
    total_nilai REAL DEFAULT 0,
    rating REAL DEFAULT 0,
    status TEXT DEFAULT 'AKTIF' CHECK(status IN ('AKTIF', 'TIDAK_AKTIF', 'BLACKLIST')),
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// ==================== DIPA TABLES ====================

const DIPA_TABLE = `
  CREATE TABLE IF NOT EXISTS dipa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tahun_anggaran INTEGER NOT NULL,
    nomor_dipa TEXT,
    tanggal_dipa DATE,
    kode_satker TEXT,
    total_pagu REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tahun_anggaran, kode_satker)
  );
`;

const DIPA_REVISI_TABLE = `
  CREATE TABLE IF NOT EXISTS dipa_revisi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dipa_id INTEGER REFERENCES dipa(id) ON DELETE CASCADE,
    nomor_revisi INTEGER NOT NULL,
    tanggal_revisi DATE,
    jenis_revisi TEXT CHECK(jenis_revisi IN ('DIPA_AWAL', 'REVISI_POK', 'REVISI_ANGGARAN', 'REVISI_ADMINISTRASI')),
    keterangan TEXT,
    total_pagu REAL DEFAULT 0,
    total_item INTEGER DEFAULT 0,
    file_csv TEXT,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dipa_id, nomor_revisi)
  );
`;

const DIPA_ITEM_TABLE = `
  CREATE TABLE IF NOT EXISTS dipa_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dipa_revisi_id INTEGER REFERENCES dipa_revisi(id) ON DELETE CASCADE,
    kode_program TEXT,
    kode_kegiatan TEXT,
    kode_output TEXT,
    kode_suboutput TEXT,
    volume_output INTEGER,
    volume_suboutput INTEGER,
    kode_komponen TEXT,
    kode_subkomponen TEXT,
    uraian_subkomponen TEXT,
    kode_akun TEXT NOT NULL,
    kode_item TEXT,
    nomor_item INTEGER,
    uraian_item TEXT,
    volume REAL,
    satuan TEXT,
    harga_satuan REAL,
    total REAL,
    kode_blokir TEXT,
    nilai_blokir REAL DEFAULT 0,
    pok_1 REAL DEFAULT 0,
    pok_2 REAL DEFAULT 0,
    pok_3 REAL DEFAULT 0,
    pok_4 REAL DEFAULT 0,
    pok_5 REAL DEFAULT 0,
    pok_6 REAL DEFAULT 0,
    pok_7 REAL DEFAULT 0,
    pok_8 REAL DEFAULT 0,
    pok_9 REAL DEFAULT 0,
    pok_10 REAL DEFAULT 0,
    pok_11 REAL DEFAULT 0,
    pok_12 REAL DEFAULT 0,
    realisasi REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// ==================== SBM TABLES ====================

const SBM_TAHUN_TABLE = `
  CREATE TABLE IF NOT EXISTS sbm_tahun (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tahun INTEGER UNIQUE NOT NULL,
    nomor_pmk TEXT,
    tanggal_pmk DATE,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const SBM_UANG_HARIAN_TABLE = `
  CREATE TABLE IF NOT EXISTS sbm_uang_harian (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sbm_tahun_id INTEGER REFERENCES sbm_tahun(id) ON DELETE CASCADE,
    provinsi TEXT NOT NULL,
    kota TEXT NOT NULL,
    tingkat TEXT CHECK(tingkat IN ('A', 'B', 'C')),
    uang_harian REAL,
    penginapan REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const SBM_TRANSPORT_TABLE = `
  CREATE TABLE IF NOT EXISTS sbm_transport (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sbm_tahun_id INTEGER REFERENCES sbm_tahun(id) ON DELETE CASCADE,
    asal TEXT,
    tujuan TEXT,
    moda TEXT,
    kelas TEXT,
    tarif REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const SBM_HONORARIUM_TABLE = `
  CREATE TABLE IF NOT EXISTS sbm_honorarium (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sbm_tahun_id INTEGER REFERENCES sbm_tahun(id) ON DELETE CASCADE,
    kategori TEXT CHECK(kategori IN ('NARASUMBER', 'MODERATOR', 'PJLP')),
    kualifikasi TEXT,
    satuan TEXT,
    tarif REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// ==================== LEMBAR PERMINTAAN TABLES ====================

const LEMBAR_PERMINTAAN_TABLE = `
  CREATE TABLE IF NOT EXISTS lembar_permintaan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomor TEXT UNIQUE NOT NULL,
    jenis TEXT NOT NULL CHECK(jenis IN ('BARANG', 'JASA', 'PJLP', 'KEGIATAN')),
    tanggal_dibuat DATE NOT NULL,
    dibuat_oleh_id INTEGER REFERENCES pegawai(id),
    unit_pengusul_id INTEGER REFERENCES unit_kerja(id),
    nama_pengadaan TEXT NOT NULL,
    uraian TEXT,
    justifikasi TEXT,
    lokasi_pelaksanaan TEXT,
    target_waktu_mulai DATE,
    target_waktu_selesai DATE,
    dipa_item_id INTEGER REFERENCES dipa_item(id),
    total_nilai REAL DEFAULT 0,
    kategori_tier TEXT CHECK(kategori_tier IN ('TIER1', 'TIER2', 'TIER3')),
    metode_pengadaan TEXT,
    status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'DIAJUKAN', 'DISETUJUI', 'PROSES_PENGADAAN', 'KONTRAK', 'SERAH_TERIMA', 'PEMBAYARAN', 'SELESAI', 'BATAL')),
    supplier_id INTEGER REFERENCES supplier(id),
    nomor_kontrak TEXT,
    tanggal_kontrak DATE,
    jangka_waktu_kontrak INTEGER,
    tanggal_mulai_kontrak DATE,
    tanggal_selesai_kontrak DATE,
    nilai_kontrak REAL,
    tanggal_serah_terima DATE,
    nomor_bast TEXT,
    kondisi_serah_terima TEXT CHECK(kondisi_serah_terima IN ('BAIK', 'ADA_CATATAN', NULL)),
    catatan_serah_terima TEXT,
    nilai_tagihan REAL,
    nilai_ppn REAL DEFAULT 0,
    nilai_pph22 REAL DEFAULT 0,
    nilai_pph21 REAL DEFAULT 0,
    nilai_bersih REAL,
    nomor_kwitansi TEXT,
    nomor_spp TEXT,
    nomor_spm TEXT,
    tanggal_bayar DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const LEMBAR_PERMINTAAN_ITEM_TABLE = `
  CREATE TABLE IF NOT EXISTS lembar_permintaan_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lembar_permintaan_id INTEGER REFERENCES lembar_permintaan(id) ON DELETE CASCADE,
    urutan INTEGER,
    uraian TEXT NOT NULL,
    spesifikasi TEXT,
    volume REAL NOT NULL,
    satuan TEXT NOT NULL,
    harga_satuan REAL NOT NULL,
    jumlah REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const LEMBAR_PERMINTAAN_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS lembar_permintaan_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lembar_permintaan_id INTEGER REFERENCES lembar_permintaan(id) ON DELETE CASCADE,
    versi TEXT,
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES pegawai(id),
    user_nama TEXT,
    jenis_perubahan TEXT CHECK(jenis_perubahan IN ('DIBUAT', 'STATUS_BERUBAH', 'DATA_BERUBAH', 'ITEM_DITAMBAH', 'ITEM_DIHAPUS', 'DOKUMEN_DIGENERATE', 'LAMPIRAN_DITAMBAH', 'LAMPIRAN_DIHAPUS')),
    keterangan TEXT,
    data_sebelum TEXT,
    data_sesudah TEXT
  );
`;

const LEMBAR_PERMINTAAN_DOKUMEN_TABLE = `
  CREATE TABLE IF NOT EXISTS lembar_permintaan_dokumen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lembar_permintaan_id INTEGER REFERENCES lembar_permintaan(id) ON DELETE CASCADE,
    jenis_dokumen TEXT NOT NULL,
    nomor_dokumen TEXT,
    tanggal_dokumen DATE,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const LEMBAR_PERMINTAAN_LAMPIRAN_TABLE = `
  CREATE TABLE IF NOT EXISTS lembar_permintaan_lampiran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lembar_permintaan_id INTEGER REFERENCES lembar_permintaan(id) ON DELETE CASCADE,
    nama_file TEXT NOT NULL,
    jenis_lampiran TEXT CHECK(jenis_lampiran IN ('NOTA_DINAS', 'SPESIFIKASI_TEKNIS', 'RAB', 'PENAWARAN', 'KONTRAK', 'BAST', 'FOTO', 'LAINNYA')),
    file_path TEXT NOT NULL,
    ukuran INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// ==================== LEGACY TABLES (from previous schema) ====================

const LEGACY_TABLES = `
  -- Schema version tracking
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'ppk', 'ppspm', 'unit_head', 'operator')),
    unit TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Vendors table (kept for backward compatibility)
  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    npwp TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_account_name TEXT,
    performance_rating REAL DEFAULT 0 CHECK(performance_rating >= 0 AND performance_rating <= 5),
    is_active INTEGER DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Procurement requests
  CREATE TABLE IF NOT EXISTS procurement_requests (
    id TEXT PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL CHECK(tier IN ('tier1', 'tier2', 'tier3')),
    requester_id TEXT NOT NULL,
    unit TEXT NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    specifications TEXT,
    quantity INTEGER DEFAULT 1,
    estimated_value REAL NOT NULL CHECK(estimated_value > 0),
    budget_code TEXT NOT NULL,
    budget_source TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
    current_step INTEGER DEFAULT 0,
    urgency TEXT DEFAULT 'normal' CHECK(urgency IN ('normal', 'urgent', 'very_urgent')),
    target_date TEXT,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE RESTRICT
  );

  -- Contracts table
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    contract_number TEXT UNIQUE NOT NULL,
    vendor_id TEXT NOT NULL,
    contract_value REAL NOT NULL CHECK(contract_value > 0),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'cheque', 'termin')),
    payment_terms TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'terminated', 'expired')),
    signed_date TEXT,
    signed_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
    FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Payments table
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    payment_number TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    payment_date TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    payment_method TEXT,
    reference_number TEXT,
    processed_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(contract_id, payment_number)
  );

  -- Attachments table
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    request_id TEXT,
    contract_id TEXT,
    payment_id TEXT,
    file_type TEXT NOT NULL CHECK(file_type IN ('proposal', 'quotation', 'invoice', 'receipt', 'contract', 'report', 'photo', 'other')),
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
  );

  -- Generated documents table
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    request_id TEXT,
    contract_id TEXT,
    doc_type TEXT NOT NULL,
    doc_number TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
  );

  -- Workflow approvals
  CREATE TABLE IF NOT EXISTS workflow_approvals (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    approver_role TEXT NOT NULL,
    approver_id TEXT,
    action TEXT CHECK(action IN ('approve', 'reject', 'revise', 'pending')),
    comments TEXT,
    approved_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(request_id, step_number)
  );

  -- Budget tracking
  CREATE TABLE IF NOT EXISTS budget_allocation (
    id TEXT PRIMARY KEY,
    budget_code TEXT UNIQUE NOT NULL,
    budget_name TEXT NOT NULL,
    total_allocation REAL NOT NULL CHECK(total_allocation >= 0),
    used_amount REAL DEFAULT 0 CHECK(used_amount >= 0),
    reserved_amount REAL DEFAULT 0 CHECK(reserved_amount >= 0),
    fiscal_year INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK(used_amount + reserved_amount <= total_allocation)
  );

  -- Audit log table
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT,
    new_values TEXT,
    changed_by TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
  );

  -- Backup history
  CREATE TABLE IF NOT EXISTS backup_history (
    id TEXT PRIMARY KEY,
    backup_path TEXT NOT NULL,
    backup_size INTEGER,
    backup_type TEXT DEFAULT 'manual' CHECK(backup_type IN ('manual', 'scheduled', 'pre_migration')),
    status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'failed', 'deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  );
`;

// ==================== INDEXES ====================

const INDEXES_SQL = `
  -- Master data indexes
  CREATE INDEX IF NOT EXISTS idx_pejabat_satker ON pejabat(satker_id);
  CREATE INDEX IF NOT EXISTS idx_pejabat_jenis ON pejabat(jenis);
  CREATE INDEX IF NOT EXISTS idx_unit_kerja_satker ON unit_kerja(satker_id);
  CREATE INDEX IF NOT EXISTS idx_pegawai_unit ON pegawai(unit_kerja_id);
  CREATE INDEX IF NOT EXISTS idx_pegawai_nip ON pegawai(nip);
  CREATE INDEX IF NOT EXISTS idx_supplier_jenis ON supplier(jenis);
  CREATE INDEX IF NOT EXISTS idx_supplier_status ON supplier(status);
  CREATE INDEX IF NOT EXISTS idx_supplier_npwp ON supplier(npwp);

  -- DIPA indexes
  CREATE INDEX IF NOT EXISTS idx_dipa_tahun ON dipa(tahun_anggaran);
  CREATE INDEX IF NOT EXISTS idx_dipa_revisi_dipa ON dipa_revisi(dipa_id);
  CREATE INDEX IF NOT EXISTS idx_dipa_item_revisi ON dipa_item(dipa_revisi_id);
  CREATE INDEX IF NOT EXISTS idx_dipa_item_akun ON dipa_item(kode_akun);
  CREATE INDEX IF NOT EXISTS idx_dipa_item_program ON dipa_item(kode_program, kode_kegiatan, kode_output);

  -- SBM indexes
  CREATE INDEX IF NOT EXISTS idx_sbm_uang_harian_tahun ON sbm_uang_harian(sbm_tahun_id);
  CREATE INDEX IF NOT EXISTS idx_sbm_transport_tahun ON sbm_transport(sbm_tahun_id);
  CREATE INDEX IF NOT EXISTS idx_sbm_honorarium_tahun ON sbm_honorarium(sbm_tahun_id);

  -- Lembar Permintaan indexes
  CREATE INDEX IF NOT EXISTS idx_lp_nomor ON lembar_permintaan(nomor);
  CREATE INDEX IF NOT EXISTS idx_lp_jenis ON lembar_permintaan(jenis);
  CREATE INDEX IF NOT EXISTS idx_lp_status ON lembar_permintaan(status);
  CREATE INDEX IF NOT EXISTS idx_lp_tanggal ON lembar_permintaan(tanggal_dibuat);
  CREATE INDEX IF NOT EXISTS idx_lp_unit ON lembar_permintaan(unit_pengusul_id);
  CREATE INDEX IF NOT EXISTS idx_lp_supplier ON lembar_permintaan(supplier_id);
  CREATE INDEX IF NOT EXISTS idx_lp_dipa_item ON lembar_permintaan(dipa_item_id);
  CREATE INDEX IF NOT EXISTS idx_lp_item_lp ON lembar_permintaan_item(lembar_permintaan_id);
  CREATE INDEX IF NOT EXISTS idx_lp_log_lp ON lembar_permintaan_log(lembar_permintaan_id);
  CREATE INDEX IF NOT EXISTS idx_lp_dokumen_lp ON lembar_permintaan_dokumen(lembar_permintaan_id);
  CREATE INDEX IF NOT EXISTS idx_lp_lampiran_lp ON lembar_permintaan_lampiran(lembar_permintaan_id);

  -- Legacy indexes
  CREATE INDEX IF NOT EXISTS idx_requests_status ON procurement_requests(status);
  CREATE INDEX IF NOT EXISTS idx_requests_tier ON procurement_requests(tier);
  CREATE INDEX IF NOT EXISTS idx_requests_requester ON procurement_requests(requester_id);
  CREATE INDEX IF NOT EXISTS idx_requests_date ON procurement_requests(created_at);
  CREATE INDEX IF NOT EXISTS idx_requests_unit ON procurement_requests(unit);

  CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
  CREATE INDEX IF NOT EXISTS idx_vendors_npwp ON vendors(npwp);
  CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);

  CREATE INDEX IF NOT EXISTS idx_contracts_request ON contracts(request_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON contracts(vendor_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
  CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);

  CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

  CREATE INDEX IF NOT EXISTS idx_attachments_request ON attachments(request_id);
  CREATE INDEX IF NOT EXISTS idx_attachments_contract ON attachments(contract_id);
  CREATE INDEX IF NOT EXISTS idx_attachments_payment ON attachments(payment_id);
  CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(file_type);

  CREATE INDEX IF NOT EXISTS idx_documents_request ON documents(request_id);
  CREATE INDEX IF NOT EXISTS idx_documents_contract ON documents(contract_id);
  CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);

  CREATE INDEX IF NOT EXISTS idx_approvals_request ON workflow_approvals(request_id);
  CREATE INDEX IF NOT EXISTS idx_budget_code ON budget_allocation(budget_code);
  CREATE INDEX IF NOT EXISTS idx_budget_year ON budget_allocation(fiscal_year);

  CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
  CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_id);
  CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(changed_at);
`;

// ==================== TRIGGERS ====================

const TRIGGERS_SQL = `
  -- Auto-update updated_at for satker
  CREATE TRIGGER IF NOT EXISTS update_satker_timestamp
  AFTER UPDATE ON satker
  BEGIN
    UPDATE satker SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  -- Auto-update updated_at for pejabat
  CREATE TRIGGER IF NOT EXISTS update_pejabat_timestamp
  AFTER UPDATE ON pejabat
  BEGIN
    UPDATE pejabat SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  -- Auto-update updated_at for pegawai
  CREATE TRIGGER IF NOT EXISTS update_pegawai_timestamp
  AFTER UPDATE ON pegawai
  BEGIN
    UPDATE pegawai SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  -- Auto-update updated_at for supplier
  CREATE TRIGGER IF NOT EXISTS update_supplier_timestamp
  AFTER UPDATE ON supplier
  BEGIN
    UPDATE supplier SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  -- Auto-update updated_at for dipa
  CREATE TRIGGER IF NOT EXISTS update_dipa_timestamp
  AFTER UPDATE ON dipa
  BEGIN
    UPDATE dipa SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  -- Auto-update updated_at for lembar_permintaan
  CREATE TRIGGER IF NOT EXISTS update_lembar_permintaan_timestamp
  AFTER UPDATE ON lembar_permintaan
  BEGIN
    UPDATE lembar_permintaan SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  -- Trigger: Validate tier1 request value (< 10 million)
  CREATE TRIGGER IF NOT EXISTS validate_tier1_value
  BEFORE INSERT ON procurement_requests
  WHEN NEW.tier = 'tier1' AND NEW.estimated_value >= 10000000
  BEGIN
    SELECT RAISE(ABORT, 'Tier 1 requests must have estimated_value < 10,000,000');
  END;

  -- Trigger: Validate tier2 request value (10-50 million)
  CREATE TRIGGER IF NOT EXISTS validate_tier2_value
  BEFORE INSERT ON procurement_requests
  WHEN NEW.tier = 'tier2' AND (NEW.estimated_value < 10000000 OR NEW.estimated_value >= 50000000)
  BEGIN
    SELECT RAISE(ABORT, 'Tier 2 requests must have estimated_value between 10,000,000 and 50,000,000');
  END;

  -- Trigger: Validate tier3 request value (>= 50 million)
  CREATE TRIGGER IF NOT EXISTS validate_tier3_value
  BEFORE INSERT ON procurement_requests
  WHEN NEW.tier = 'tier3' AND NEW.estimated_value < 50000000
  BEGIN
    SELECT RAISE(ABORT, 'Tier 3 requests must have estimated_value >= 50,000,000');
  END;

  -- Trigger: Validate contract dates
  CREATE TRIGGER IF NOT EXISTS validate_contract_dates
  BEFORE INSERT ON contracts
  WHEN NEW.end_date < NEW.start_date
  BEGIN
    SELECT RAISE(ABORT, 'Contract end_date must be after start_date');
  END;

  -- Trigger: Validate total payments don't exceed contract value
  CREATE TRIGGER IF NOT EXISTS validate_payment_total
  BEFORE INSERT ON payments
  BEGIN
    SELECT CASE
      WHEN (
        SELECT COALESCE(SUM(amount), 0) + NEW.amount
        FROM payments
        WHERE contract_id = NEW.contract_id AND status != 'cancelled'
      ) > (
        SELECT contract_value FROM contracts WHERE id = NEW.contract_id
      )
      THEN RAISE(ABORT, 'Total payments cannot exceed contract value')
    END;
  END;
`;

// ==================== SEED DATA ====================

const SEED_DATA = {
  // Politeknik Kelautan dan Perikanan Sorong
  satker: {
    kode_satker: '660521',
    nama: 'Politeknik Kelautan dan Perikanan Sorong',
    nama_singkat: 'PKP Sorong',
    kode_kl: '032',
    nama_kl: 'Kementerian Kelautan dan Perikanan',
    kode_eselon1: '11',
    nama_eselon1: 'Badan Riset dan Sumber Daya Manusia Kelautan dan Perikanan',
    alamat: 'Jl. Kapitan Pattimura, Tanjung Kasuari',
    kelurahan: 'Tanjung Kasuari',
    kecamatan: 'Sorong Manoi',
    kota: 'Kota Sorong',
    provinsi: 'Papua Barat Daya',
    kode_pos: '98417',
    telepon: '(0951) 321234',
    email: 'poltek.sorong@kkp.go.id',
    website: 'https://polsorong.ac.id'
  },

  // Unit kerja
  unitKerja: [
    { kode: 'TU', nama: 'Bagian Tata Usaha' },
    { kode: 'AK', nama: 'Bagian Akademik' },
    { kode: 'KM', nama: 'Bagian Kemahasiswaan' },
    { kode: 'KU', nama: 'Bagian Keuangan' },
    { kode: 'UM', nama: 'Bagian Umum' },
    { kode: 'PRODI-TPI', nama: 'Program Studi Teknologi Penangkapan Ikan' },
    { kode: 'PRODI-THP', nama: 'Program Studi Teknologi Hasil Perikanan' },
    { kode: 'PRODI-TBP', nama: 'Program Studi Teknologi Budidaya Perikanan' }
  ],

  // Default admin user
  defaultAdmin: {
    email: 'admin@pkpsorong.ac.id',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin',
    unit: 'TU'
  },

  // Budget codes
  budgetCodes: [
    { code: '5211', name: 'Belanja Barang Operasional', amount: 500000000 },
    { code: '5212', name: 'Belanja Barang Non Operasional', amount: 300000000 },
    { code: '5221', name: 'Belanja Jasa', amount: 200000000 },
    { code: '5231', name: 'Belanja Pemeliharaan', amount: 150000000 },
    { code: '5311', name: 'Belanja Modal Peralatan', amount: 400000000 }
  ]
};

// Combine all schema SQL
const SCHEMA_SQL = [
  SATKER_TABLE,
  PEJABAT_TABLE,
  UNIT_KERJA_TABLE,
  PEGAWAI_TABLE,
  SUPPLIER_TABLE,
  DIPA_TABLE,
  DIPA_REVISI_TABLE,
  DIPA_ITEM_TABLE,
  SBM_TAHUN_TABLE,
  SBM_UANG_HARIAN_TABLE,
  SBM_TRANSPORT_TABLE,
  SBM_HONORARIUM_TABLE,
  LEMBAR_PERMINTAAN_TABLE,
  LEMBAR_PERMINTAAN_ITEM_TABLE,
  LEMBAR_PERMINTAAN_LOG_TABLE,
  LEMBAR_PERMINTAAN_DOKUMEN_TABLE,
  LEMBAR_PERMINTAAN_LAMPIRAN_TABLE,
  LEGACY_TABLES
].join('\n');

module.exports = {
  DB_VERSION,
  SCHEMA_SQL,
  INDEXES_SQL,
  TRIGGERS_SQL,
  SEED_DATA,
  // Export individual table definitions for reference
  tables: {
    SATKER_TABLE,
    PEJABAT_TABLE,
    UNIT_KERJA_TABLE,
    PEGAWAI_TABLE,
    SUPPLIER_TABLE,
    DIPA_TABLE,
    DIPA_REVISI_TABLE,
    DIPA_ITEM_TABLE,
    SBM_TAHUN_TABLE,
    SBM_UANG_HARIAN_TABLE,
    SBM_TRANSPORT_TABLE,
    SBM_HONORARIUM_TABLE,
    LEMBAR_PERMINTAAN_TABLE,
    LEMBAR_PERMINTAAN_ITEM_TABLE,
    LEMBAR_PERMINTAAN_LOG_TABLE,
    LEMBAR_PERMINTAAN_DOKUMEN_TABLE,
    LEMBAR_PERMINTAAN_LAMPIRAN_TABLE
  }
};
