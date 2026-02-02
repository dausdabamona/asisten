const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

// Database version for migrations
const DB_VERSION = 2;

class PPKDatabase {
  constructor() {
    // Database location
    const userDataPath = app.getPath('userData');
    this.dbDir = path.join(userDataPath, 'database');
    this.backupDir = path.join(this.dbDir, 'backups');

    // Ensure directories exist
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const dbPath = path.join(this.dbDir, 'ppk.db');
    console.log('Database path:', dbPath);

    // Open database
    this.db = new Database(dbPath);

    // Performance optimizations
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints

    // Initialize schema and run migrations
    this.initializeSchema();
    this.runMigrations();
    this.createTriggers();
    this.seedInitialData();

    // Setup backup scheduler
    this.backupScheduler = null;
    this.setupBackupScheduler();
  }

  initializeSchema() {
    console.log('Initializing database schema...');

    const schema = `
      -- Schema version tracking
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now', 'localtime'))
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
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      );

      -- Vendors table
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
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      );

      -- Pegawai table (Employee/Staff data)
      CREATE TABLE IF NOT EXISTS pegawai (
        id TEXT PRIMARY KEY,
        nip TEXT UNIQUE NOT NULL,
        nama TEXT NOT NULL,
        jabatan TEXT,
        golongan TEXT,
        pangkat TEXT,
        rekening TEXT,
        bank TEXT,
        unitKerja TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      );

      -- Satker (Work Unit/Organization) with Officials
      CREATE TABLE IF NOT EXISTS satker (
        id TEXT PRIMARY KEY,
        kode_satker TEXT UNIQUE NOT NULL,
        nama TEXT NOT NULL,
        npwp TEXT UNIQUE,
        alamat TEXT,
        kota TEXT,
        kpa_nip TEXT,
        ppk_nip TEXT,
        ppspm_nip TEXT,
        bendahara_nip TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (kpa_nip) REFERENCES pegawai(nip) ON DELETE SET NULL,
        FOREIGN KEY (ppk_nip) REFERENCES pegawai(nip) ON DELETE SET NULL,
        FOREIGN KEY (ppspm_nip) REFERENCES pegawai(nip) ON DELETE SET NULL,
        FOREIGN KEY (bendahara_nip) REFERENCES pegawai(nip) ON DELETE SET NULL
      );

      -- DIPA (Daftar Isian Pelaksanaan Anggaran)
      CREATE TABLE IF NOT EXISTS dipa (
        id TEXT PRIMARY KEY,
        tahun_anggaran INTEGER NOT NULL,
        nomor_dipa TEXT,
        tanggal_dipa TEXT,
        kdsatker TEXT,
        kode_program TEXT,
        kode_kegiatan TEXT,
        kode_output TEXT,
        kode_suboutput TEXT,
        kode_komponen TEXT,
        kode_subkomponen TEXT,
        kode_akun TEXT,
        uraian_item TEXT,
        volume REAL,
        satuan TEXT,
        harga_satuan REAL,
        total REAL,
        jan REAL DEFAULT 0,
        feb REAL DEFAULT 0,
        mar REAL DEFAULT 0,
        apr REAL DEFAULT 0,
        mei REAL DEFAULT 0,
        jun REAL DEFAULT 0,
        jul REAL DEFAULT 0,
        agt REAL DEFAULT 0,
        sep REAL DEFAULT 0,
        okt REAL DEFAULT 0,
        nov REAL DEFAULT 0,
        des REAL DEFAULT 0,
        realisasi_jan REAL DEFAULT 0,
        realisasi_feb REAL DEFAULT 0,
        realisasi_mar REAL DEFAULT 0,
        realisasi_apr REAL DEFAULT 0,
        realisasi_mei REAL DEFAULT 0,
        realisasi_jun REAL DEFAULT 0,
        realisasi_jul REAL DEFAULT 0,
        realisasi_agt REAL DEFAULT 0,
        realisasi_sep REAL DEFAULT 0,
        realisasi_okt REAL DEFAULT 0,
        realisasi_nov REAL DEFAULT 0,
        realisasi_des REAL DEFAULT 0,
        sisa_pagu REAL,
        catatan TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
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
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
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
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
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
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
        FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(contract_id, payment_number)
      );

      -- Attachments table (replaces documents table with more features)
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
        uploaded_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
        CHECK (
          (request_id IS NOT NULL AND contract_id IS NULL AND payment_id IS NULL) OR
          (request_id IS NULL AND contract_id IS NOT NULL AND payment_id IS NULL) OR
          (request_id IS NULL AND contract_id IS NULL AND payment_id IS NOT NULL)
        )
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
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
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
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
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
        changed_at TEXT DEFAULT (datetime('now', 'localtime')),
        ip_address TEXT
      );

      -- Backup history
      CREATE TABLE IF NOT EXISTS backup_history (
        id TEXT PRIMARY KEY,
        backup_path TEXT NOT NULL,
        backup_size INTEGER,
        backup_type TEXT DEFAULT 'manual' CHECK(backup_type IN ('manual', 'scheduled', 'pre_migration')),
        status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'failed', 'deleted')),
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        notes TEXT
      );

      -- Indexes for performance
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

      CREATE INDEX IF NOT EXISTS idx_approvals_request ON workflow_approvals(request_id);
      CREATE INDEX IF NOT EXISTS idx_budget_code ON budget_allocation(budget_code);
      CREATE INDEX IF NOT EXISTS idx_budget_year ON budget_allocation(fiscal_year);

      CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_id);
      CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(changed_at);
    `;

    this.db.exec(schema);
    console.log('Schema initialized successfully');
  }

  // Migration system
  runMigrations() {
    const currentVersion = this.getCurrentSchemaVersion();
    console.log(`Current schema version: ${currentVersion}, Target version: ${DB_VERSION}`);

    if (currentVersion >= DB_VERSION) {
      console.log('Schema is up to date');
      return;
    }

    // Load and run migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      const match = file.match(/^(\d+)[-_](.+)\.js$/);
      if (!match) continue;

      const version = parseInt(match[1], 10);
      const name = match[2];

      if (version > currentVersion && version <= DB_VERSION) {
        console.log(`Running migration ${version}: ${name}`);

        // Skip backup during initial migration to avoid errors
        // this.backup('pre_migration');

        try {
          const migration = require(path.join(migrationsDir, file));

          this.db.transaction(() => {
            migration.up(this.db);
            this.recordMigration(version, name);
          })();

          console.log(`Migration ${version} completed`);
        } catch (error) {
          console.error(`Migration ${version} failed:`, error);
          throw error;
        }
      }
    }
  }

  getCurrentSchemaVersion() {
    try {
      const result = this.db.prepare(
        'SELECT MAX(version) as version FROM schema_migrations'
      ).get();
      return result?.version || 0;
    } catch {
      return 0;
    }
  }

  recordMigration(version, name) {
    this.db.prepare(
      'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
    ).run(version, name);
  }

  // Data validation triggers
  createTriggers() {
    console.log('Creating validation triggers...');

    const triggers = `
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

      -- Trigger: Update tier1 validation on update
      CREATE TRIGGER IF NOT EXISTS validate_tier1_value_update
      BEFORE UPDATE ON procurement_requests
      WHEN NEW.tier = 'tier1' AND NEW.estimated_value >= 10000000
      BEGIN
        SELECT RAISE(ABORT, 'Tier 1 requests must have estimated_value < 10,000,000');
      END;

      -- Trigger: Validate contract dates
      CREATE TRIGGER IF NOT EXISTS validate_contract_dates
      BEFORE INSERT ON contracts
      WHEN NEW.end_date < NEW.start_date
      BEGIN
        SELECT RAISE(ABORT, 'Contract end_date must be after start_date');
      END;

      -- Trigger: Validate contract dates on update
      CREATE TRIGGER IF NOT EXISTS validate_contract_dates_update
      BEFORE UPDATE ON contracts
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

      -- Trigger: Update request status when all approvals complete
      CREATE TRIGGER IF NOT EXISTS update_request_on_approval
      AFTER UPDATE ON workflow_approvals
      WHEN NEW.action = 'approve'
      BEGIN
        UPDATE procurement_requests
        SET status = 'approved',
            updated_at = datetime('now', 'localtime')
        WHERE id = NEW.request_id
        AND NOT EXISTS (
          SELECT 1 FROM workflow_approvals
          WHERE request_id = NEW.request_id
          AND (action IS NULL OR action = 'pending')
        );
      END;

      -- Trigger: Update request status on rejection
      CREATE TRIGGER IF NOT EXISTS update_request_on_rejection
      AFTER UPDATE ON workflow_approvals
      WHEN NEW.action = 'reject'
      BEGIN
        UPDATE procurement_requests
        SET status = 'rejected',
            updated_at = datetime('now', 'localtime')
        WHERE id = NEW.request_id;
      END;

      -- Trigger: Auto-update updated_at timestamp for requests
      CREATE TRIGGER IF NOT EXISTS update_request_timestamp
      AFTER UPDATE ON procurement_requests
      BEGIN
        UPDATE procurement_requests
        SET updated_at = datetime('now', 'localtime')
        WHERE id = NEW.id AND updated_at = OLD.updated_at;
      END;

      -- Trigger: Auto-update updated_at timestamp for vendors
      CREATE TRIGGER IF NOT EXISTS update_vendor_timestamp
      AFTER UPDATE ON vendors
      BEGIN
        UPDATE vendors
        SET updated_at = datetime('now', 'localtime')
        WHERE id = NEW.id AND updated_at = OLD.updated_at;
      END;

      -- Trigger: Auto-update updated_at timestamp for contracts
      CREATE TRIGGER IF NOT EXISTS update_contract_timestamp
      AFTER UPDATE ON contracts
      BEGIN
        UPDATE contracts
        SET updated_at = datetime('now', 'localtime')
        WHERE id = NEW.id AND updated_at = OLD.updated_at;
      END;

      -- Trigger: Validate vendor rating range
      CREATE TRIGGER IF NOT EXISTS validate_vendor_rating
      BEFORE UPDATE ON vendors
      WHEN NEW.performance_rating < 0 OR NEW.performance_rating > 5
      BEGIN
        SELECT RAISE(ABORT, 'Vendor performance_rating must be between 0 and 5');
      END;

      -- Trigger: Prevent deletion of vendors with active contracts
      CREATE TRIGGER IF NOT EXISTS prevent_vendor_delete
      BEFORE DELETE ON vendors
      WHEN EXISTS (SELECT 1 FROM contracts WHERE vendor_id = OLD.id AND status IN ('draft', 'active'))
      BEGIN
        SELECT RAISE(ABORT, 'Cannot delete vendor with active or draft contracts');
      END;

      -- Trigger: Validate NPWP format (15 digits)
      CREATE TRIGGER IF NOT EXISTS validate_npwp_format
      BEFORE INSERT ON vendors
      WHEN NEW.npwp IS NOT NULL AND LENGTH(REPLACE(REPLACE(NEW.npwp, '.', ''), '-', '')) != 15
      BEGIN
        SELECT RAISE(ABORT, 'NPWP must be 15 digits');
      END;
    `;

    try {
      this.db.exec(triggers);
      console.log('Triggers created successfully');
    } catch (error) {
      // Triggers might already exist
      console.log('Some triggers already exist or error:', error.message);
    }
  }

  // Backup scheduler
  setupBackupScheduler() {
    // Clear any existing scheduler
    if (this.backupScheduler) {
      clearInterval(this.backupScheduler);
    }

    // Calculate time until next 2 AM
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);

    if (now >= next2AM) {
      next2AM.setDate(next2AM.getDate() + 1);
    }

    const msUntil2AM = next2AM.getTime() - now.getTime();

    console.log(`Backup scheduler: Next backup at ${next2AM.toISOString()}`);

    // Schedule first backup
    setTimeout(() => {
      this.performScheduledBackup();

      // Then run daily
      this.backupScheduler = setInterval(() => {
        this.performScheduledBackup();
      }, 24 * 60 * 60 * 1000); // 24 hours

    }, msUntil2AM);
  }

  performScheduledBackup() {
    console.log('Running scheduled backup...');
    try {
      const result = this.backup('scheduled');
      console.log('Scheduled backup completed:', result.path);

      // Cleanup old backups (keep last 30 days)
      this.cleanupOldBackups(30);
    } catch (error) {
      console.error('Scheduled backup failed:', error);
      this.recordBackupHistory(null, 0, 'scheduled', 'failed', error.message);
    }
  }

  cleanupOldBackups(daysToKeep) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const files = fs.readdirSync(this.backupDir);
    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('ppk-backup-')) continue;

      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;

        // Update backup history
        this.db.prepare(
          "UPDATE backup_history SET status = 'deleted' WHERE backup_path = ?"
        ).run(filePath);
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old backup(s)`);
    }
  }

  seedInitialData() {
    try {
      // Check if data exists
      const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get();

      if (userCount.count === 0) {
        console.log('Seeding initial data...');

        // Create default admin user
        const adminId = uuidv4();
        this.db.prepare(`
          INSERT INTO users (id, email, password, name, role, unit)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          adminId,
          'admin@pkpsorong.ac.id',
          'admin123', // In production, use bcrypt hash
          'Administrator',
          'admin',
          'TU'
        );

        // Create sample budget codes
        const budgetCodes = [
          { code: '5211', name: 'Belanja Barang Operasional', amount: 500000000 },
          { code: '5212', name: 'Belanja Barang Non Operasional', amount: 300000000 },
          { code: '5221', name: 'Belanja Jasa', amount: 200000000 },
          { code: '5231', name: 'Belanja Pemeliharaan', amount: 150000000 },
          { code: '5311', name: 'Belanja Modal Peralatan', amount: 400000000 }
        ];

        const budgetStmt = this.db.prepare(`
          INSERT INTO budget_allocation (id, budget_code, budget_name, total_allocation, fiscal_year)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const budget of budgetCodes) {
          budgetStmt.run(
            uuidv4(),
            budget.code,
            budget.name,
            budget.amount,
            new Date().getFullYear()
          );
        }

        console.log('Initial user and budget data seeded');
      }

      // Seed pegawai data (separate from user seed)
      try {
        const pegawaiCount = this.db.prepare('SELECT COUNT(*) as count FROM pegawai').get();
        
        if (pegawaiCount.count === 0) {
          console.log('Seeding pegawai data...');
          const pegawaiSeed = require('./database/seeds/pegawai.seed.js');
          
          const pegawaiStmt = this.db.prepare(`
            INSERT INTO pegawai (id, nip, nama, jabatan, golongan, pangkat, rekening, bank, unitKerja)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const pegawai of pegawaiSeed) {
            pegawaiStmt.run(
              uuidv4(),
              pegawai.nip,
              pegawai.nama,
              pegawai.jabatan,
              pegawai.golongan,
              pegawai.pangkat,
              pegawai.rekening,
              pegawai.bank,
              pegawai.unitKerja
            );
          }

          console.log(`Seeded ${pegawaiSeed.length} pegawai records`);
        }
      } catch (err) {
        console.warn('Pegawai table might not exist or seed failed:', err.message);
      }
    } catch (err) {
      console.error('Error during data seeding:', err);
    }
  }

  // ==================== CRUD Operations ====================

  // Request operations
  createRequest(data) {
    const stmt = this.db.prepare(`
      INSERT INTO procurement_requests (
        id, request_number, tier, requester_id, unit, item_name,
        description, specifications, quantity, estimated_value, budget_code,
        budget_source, status, urgency, target_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const requestNumber = data.request_number || this.generateRequestNumber(data.tier);

    const result = stmt.run(
      id,
      requestNumber,
      data.tier,
      data.requester_id,
      data.unit,
      data.item_name,
      data.description || null,
      data.specifications || null,
      data.quantity || 1,
      data.estimated_value,
      data.budget_code,
      data.budget_source || null,
      data.status || 'draft',
      data.urgency || 'normal',
      data.target_date || null
    );

    return { id, request_number: requestNumber, changes: result.changes };
  }

  getRequests(filters = {}) {
    let query = 'SELECT * FROM procurement_requests WHERE 1=1';
    const params = [];

    if (filters.tier) {
      query += ' AND tier = ?';
      params.push(filters.tier);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.unit) {
      query += ' AND unit = ?';
      params.push(filters.unit);
    }

    if (filters.requester_id) {
      query += ' AND requester_id = ?';
      params.push(filters.requester_id);
    }

    if (filters.from_date) {
      query += ' AND created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ' AND created_at <= ?';
      params.push(filters.to_date);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  getRequestById(id) {
    const stmt = this.db.prepare('SELECT * FROM procurement_requests WHERE id = ?');
    return stmt.get(id);
  }

  getRequestWithDetails(id) {
    const request = this.getRequestById(id);
    if (!request) return null;

    request.approvals = this.db.prepare(
      'SELECT * FROM workflow_approvals WHERE request_id = ? ORDER BY step_number'
    ).all(id);

    request.attachments = this.db.prepare(
      'SELECT * FROM attachments WHERE request_id = ? ORDER BY uploaded_at DESC'
    ).all(id);

    request.contracts = this.db.prepare(
      'SELECT * FROM contracts WHERE request_id = ? ORDER BY created_at DESC'
    ).all(id);

    return request;
  }

  updateRequest(id, updates) {
    const allowedFields = [
      'item_name', 'description', 'specifications', 'quantity',
      'estimated_value', 'budget_code', 'budget_source', 'status',
      'urgency', 'target_date', 'rejection_reason', 'current_step'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE procurement_requests
      SET ${setClause}, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    const result = stmt.run(...values, id);
    return { changes: result.changes };
  }

  deleteRequest(id) {
    const stmt = this.db.prepare('DELETE FROM procurement_requests WHERE id = ?');
    return stmt.run(id);
  }

  // Vendor operations
  createVendor(data) {
    const stmt = this.db.prepare(`
      INSERT INTO vendors (
        id, name, npwp, address, phone, email,
        bank_name, bank_account, bank_account_name, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();

    const result = stmt.run(
      id,
      data.name,
      data.npwp || null,
      data.address || null,
      data.phone || null,
      data.email || null,
      data.bank_name || null,
      data.bank_account || null,
      data.bank_account_name || null,
      data.notes || null
    );

    return { id, changes: result.changes };
  }

  getVendors(filters = {}) {
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR npwp LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.min_rating) {
      query += ' AND performance_rating >= ?';
      params.push(filters.min_rating);
    }

    query += ' ORDER BY name ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  getVendorById(id) {
    return this.db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  }

  updateVendor(id, updates) {
    const allowedFields = [
      'name', 'npwp', 'address', 'phone', 'email',
      'bank_name', 'bank_account', 'bank_account_name',
      'performance_rating', 'is_active', 'notes'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE vendors SET ${setClause} WHERE id = ?
    `);

    return { changes: stmt.run(...values, id).changes };
  }

  deleteVendor(id) {
    return this.db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
  }

  // Contract operations
  createContract(data) {
    const stmt = this.db.prepare(`
      INSERT INTO contracts (
        id, request_id, contract_number, vendor_id, contract_value,
        start_date, end_date, payment_method, payment_terms, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const contractNumber = data.contract_number || this.generateContractNumber();

    const result = stmt.run(
      id,
      data.request_id,
      contractNumber,
      data.vendor_id,
      data.contract_value,
      data.start_date,
      data.end_date,
      data.payment_method,
      data.payment_terms || null,
      data.status || 'draft',
      data.notes || null
    );

    // Update request status to in_progress
    this.updateRequest(data.request_id, { status: 'in_progress' });

    return { id, contract_number: contractNumber, changes: result.changes };
  }

  generateContractNumber() {
    const year = new Date().getFullYear();
    const count = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM contracts
      WHERE strftime('%Y', created_at) = ?
    `).get(year.toString());

    const sequence = String(count.count + 1).padStart(4, '0');
    return `SPK/${year}/${sequence}`;
  }

  getContracts(filters = {}) {
    let query = `
      SELECT c.*, v.name as vendor_name, pr.item_name, pr.request_number
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      LEFT JOIN procurement_requests pr ON c.request_id = pr.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.vendor_id) {
      query += ' AND c.vendor_id = ?';
      params.push(filters.vendor_id);
    }

    if (filters.request_id) {
      query += ' AND c.request_id = ?';
      params.push(filters.request_id);
    }

    query += ' ORDER BY c.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  getContractById(id) {
    return this.db.prepare(`
      SELECT c.*, v.name as vendor_name, v.npwp as vendor_npwp,
             pr.item_name, pr.request_number
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      LEFT JOIN procurement_requests pr ON c.request_id = pr.id
      WHERE c.id = ?
    `).get(id);
  }

  updateContract(id, updates) {
    const allowedFields = [
      'contract_value', 'start_date', 'end_date', 'payment_method',
      'payment_terms', 'status', 'signed_date', 'signed_by', 'notes'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE contracts SET ${setClause} WHERE id = ?
    `);

    return { changes: stmt.run(...values, id).changes };
  }

  // Payment operations
  createPayment(data) {
    const stmt = this.db.prepare(`
      INSERT INTO payments (
        id, contract_id, payment_number, amount, due_date,
        payment_method, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const paymentNumber = data.payment_number || this.generatePaymentNumber(data.contract_id);

    const result = stmt.run(
      id,
      data.contract_id,
      paymentNumber,
      data.amount,
      data.due_date || null,
      data.payment_method || null,
      data.status || 'pending',
      data.notes || null
    );

    return { id, payment_number: paymentNumber, changes: result.changes };
  }

  generatePaymentNumber(contractId) {
    const count = this.db.prepare(
      'SELECT COUNT(*) as count FROM payments WHERE contract_id = ?'
    ).get(contractId);

    return `PAY-${String(count.count + 1).padStart(2, '0')}`;
  }

  getPayments(filters = {}) {
    let query = `
      SELECT p.*, c.contract_number, c.contract_value
      FROM payments p
      LEFT JOIN contracts c ON p.contract_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.contract_id) {
      query += ' AND p.contract_id = ?';
      params.push(filters.contract_id);
    }

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY p.created_at DESC';

    return this.db.prepare(query).all(...params);
  }

  getPaymentById(id) {
    return this.db.prepare(`
      SELECT p.*, c.contract_number, c.contract_value, c.vendor_id
      FROM payments p
      LEFT JOIN contracts c ON p.contract_id = c.id
      WHERE p.id = ?
    `).get(id);
  }

  updatePayment(id, updates) {
    const allowedFields = [
      'amount', 'payment_date', 'due_date', 'status',
      'payment_method', 'reference_number', 'processed_by', 'notes'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE payments SET ${setClause} WHERE id = ?
    `);

    return { changes: stmt.run(...values, id).changes };
  }

  // Attachment operations
  createAttachment(data) {
    const stmt = this.db.prepare(`
      INSERT INTO attachments (
        id, request_id, contract_id, payment_id, file_type,
        file_name, original_name, file_path, file_size, mime_type, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const fileName = data.file_name || `${id}-${data.original_name}`;

    const result = stmt.run(
      id,
      data.request_id || null,
      data.contract_id || null,
      data.payment_id || null,
      data.file_type,
      fileName,
      data.original_name,
      data.file_path,
      data.file_size || null,
      data.mime_type || null,
      data.uploaded_by
    );

    return { id, file_name: fileName, changes: result.changes };
  }

  getAttachments(filters = {}) {
    let query = `
      SELECT a.*, u.name as uploader_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.request_id) {
      query += ' AND a.request_id = ?';
      params.push(filters.request_id);
    }

    if (filters.contract_id) {
      query += ' AND a.contract_id = ?';
      params.push(filters.contract_id);
    }

    if (filters.payment_id) {
      query += ' AND a.payment_id = ?';
      params.push(filters.payment_id);
    }

    if (filters.file_type) {
      query += ' AND a.file_type = ?';
      params.push(filters.file_type);
    }

    query += ' ORDER BY a.uploaded_at DESC';

    return this.db.prepare(query).all(...params);
  }

  deleteAttachment(id) {
    const attachment = this.db.prepare('SELECT file_path FROM attachments WHERE id = ?').get(id);

    if (attachment && fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    return this.db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
  }

  // Helper methods
  generateRequestNumber(tier) {
    const year = new Date().getFullYear();
    const prefix = tier.toUpperCase().replace('TIER', 'T');

    const count = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM procurement_requests
      WHERE tier = ? AND strftime('%Y', created_at) = ?
    `).get(tier, year.toString());

    const sequence = String(count.count + 1).padStart(3, '0');
    return `${prefix}/${year}/${sequence}`;
  }

  // Statistics
  getStats() {
    const stats = this.db.prepare(`
      SELECT
        tier,
        status,
        COUNT(*) as count,
        SUM(estimated_value) as total_value
      FROM procurement_requests
      GROUP BY tier, status
    `).all();

    return stats;
  }

  getDashboardStats() {
    const requestStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(estimated_value) as total_value
      FROM procurement_requests
    `).get();

    const contractStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_contracts,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_contracts,
        SUM(contract_value) as total_contract_value
      FROM contracts
    `).get();

    const paymentStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments
      FROM payments
    `).get();

    const vendorStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_vendors,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_vendors,
        AVG(performance_rating) as avg_rating
      FROM vendors
    `).get();

    return {
      requests: requestStats,
      contracts: contractStats,
      payments: paymentStats,
      vendors: vendorStats
    };
  }

  // Backup
  backup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(this.backupDir, `ppk-backup-${timestamp}.db`);

    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      this.db.backup(backupPath);

      const stats = fs.statSync(backupPath);
      this.recordBackupHistory(backupPath, stats.size, type, 'completed');

      return { success: true, path: backupPath, size: stats.size };
    } catch (error) {
      this.recordBackupHistory(backupPath, 0, type, 'failed', error.message);
      throw error;
    }
  }

  recordBackupHistory(backupPath, size, type, status, notes = null) {
    this.db.prepare(`
      INSERT INTO backup_history (id, backup_path, backup_size, backup_type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), backupPath || '', size, type, status, notes);
  }

  getBackupHistory(limit = 20) {
    return this.db.prepare(`
      SELECT * FROM backup_history
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
  }

  // Restore from backup
  restore(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    // Create a backup of current database first
    this.backup('pre_restore');

    const dbPath = path.join(this.dbDir, 'ppk.db');

    // Close current connection
    this.db.close();

    // Copy backup file
    fs.copyFileSync(backupPath, dbPath);

    // Reopen database
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    return { success: true };
  }

  close() {
    if (this.backupScheduler) {
      clearInterval(this.backupScheduler);
    }

    if (this.db) {
      this.db.close();
      console.log('Database closed');
    }
  }
}

module.exports = PPKDatabase;
