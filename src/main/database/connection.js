/**
 * Database Connection Module
 * Handles SQLite database connection and initialization
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { DB_VERSION, SCHEMA_SQL, INDEXES_SQL, TRIGGERS_SQL, SEED_DATA } = require('./schema');

class DatabaseConnection {
  constructor(options = {}) {
    // Database location
    const userDataPath = options.userDataPath || app.getPath('userData');
    this.dbDir = path.join(userDataPath, 'database');
    this.backupDir = path.join(this.dbDir, 'backups');

    // Ensure directories exist
    this._ensureDirectories();

    const dbPath = path.join(this.dbDir, 'ppk.db');
    console.log('Database path:', dbPath);

    // Open database
    this.db = new Database(dbPath);

    // Performance optimizations
    this._configurePragmas();

    // Initialize
    this._initializeSchema();
    this._runMigrations();
    this._createTriggers();
    this._seedInitialData();

    // Setup backup scheduler
    this.backupScheduler = null;
    this._setupBackupScheduler();
  }

  _ensureDirectories() {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  _configurePragmas() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON');
  }

  _initializeSchema() {
    console.log('Initializing database schema...');
    this.db.exec(SCHEMA_SQL);
    this.db.exec(INDEXES_SQL);
    console.log('Schema initialized successfully');
  }

  _runMigrations() {
    const currentVersion = this._getCurrentSchemaVersion();
    console.log(`Current schema version: ${currentVersion}, Target version: ${DB_VERSION}`);

    if (currentVersion >= DB_VERSION) {
      console.log('Schema is up to date');
      return;
    }

    // Load and run migrations
    const migrationsDir = path.join(__dirname, '../migrations');
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

        // Create backup before migration
        this.backup(`pre-migration-v${version}`);

        try {
          const migration = require(path.join(migrationsDir, file));

          this.db.transaction(() => {
            migration.up(this.db);
            this._recordMigration(version, name);
          })();

          console.log(`Migration ${version} completed`);
        } catch (error) {
          console.error(`Migration ${version} failed:`, error);
          throw error;
        }
      }
    }
  }

  _getCurrentSchemaVersion() {
    try {
      const result = this.db.prepare(
        'SELECT MAX(version) as version FROM schema_migrations'
      ).get();
      return result?.version || 0;
    } catch {
      return 0;
    }
  }

  _recordMigration(version, name) {
    this.db.prepare(
      'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
    ).run(version, name);
  }

  _createTriggers() {
    console.log('Creating validation triggers...');
    try {
      this.db.exec(TRIGGERS_SQL);
      console.log('Triggers created successfully');
    } catch (error) {
      console.log('Some triggers already exist or error:', error.message);
    }
  }

  _seedInitialData() {
    // Check if satker data exists
    const satkerCount = this.db.prepare('SELECT COUNT(*) as count FROM satker').get();

    if (satkerCount.count === 0) {
      console.log('Seeding satker data...');

      // Insert Poltek Sorong satker
      const satker = SEED_DATA.satker;
      this.db.prepare(`
        INSERT INTO satker (
          kode_satker, nama, nama_singkat, kode_kl, nama_kl,
          kode_eselon1, nama_eselon1, alamat, kelurahan, kecamatan,
          kota, provinsi, kode_pos, telepon, email, website
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        satker.kode_satker, satker.nama, satker.nama_singkat, satker.kode_kl, satker.nama_kl,
        satker.kode_eselon1, satker.nama_eselon1, satker.alamat, satker.kelurahan, satker.kecamatan,
        satker.kota, satker.provinsi, satker.kode_pos, satker.telepon, satker.email, satker.website
      );

      // Get satker ID for unit_kerja
      const satkerId = this.db.prepare('SELECT id FROM satker WHERE kode_satker = ?').get(satker.kode_satker).id;

      // Insert unit kerja
      const unitStmt = this.db.prepare(`
        INSERT INTO unit_kerja (satker_id, kode, nama)
        VALUES (?, ?, ?)
      `);

      for (const unit of SEED_DATA.unitKerja) {
        unitStmt.run(satkerId, unit.kode, unit.nama);
      }

      console.log('Satker and unit kerja seeded');
    }

    // Check if user data exists
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get();

    if (userCount.count === 0) {
      console.log('Seeding user data...');

      // Create default admin user
      const adminId = uuidv4();
      this.db.prepare(`
        INSERT INTO users (id, email, password, name, role, unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        adminId,
        SEED_DATA.defaultAdmin.email,
        SEED_DATA.defaultAdmin.password,
        SEED_DATA.defaultAdmin.name,
        SEED_DATA.defaultAdmin.role,
        SEED_DATA.defaultAdmin.unit
      );

      // Create sample budget codes
      const budgetStmt = this.db.prepare(`
        INSERT INTO budget_allocation (id, budget_code, budget_name, total_allocation, fiscal_year)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const budget of SEED_DATA.budgetCodes) {
        budgetStmt.run(
          uuidv4(),
          budget.code,
          budget.name,
          budget.amount,
          new Date().getFullYear()
        );
      }

      console.log('User and budget data seeded');
    }
  }

  _setupBackupScheduler() {
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

    setTimeout(() => {
      this._performScheduledBackup();
      this.backupScheduler = setInterval(() => {
        this._performScheduledBackup();
      }, 24 * 60 * 60 * 1000);
    }, msUntil2AM);
  }

  _performScheduledBackup() {
    console.log('Running scheduled backup...');
    try {
      const result = this.backup('scheduled');
      console.log('Scheduled backup completed:', result.path);
      this._cleanupOldBackups(30);
    } catch (error) {
      console.error('Scheduled backup failed:', error);
      this._recordBackupHistory(null, 0, 'scheduled', 'failed', error.message);
    }
  }

  _cleanupOldBackups(daysToKeep) {
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

        this.db.prepare(
          "UPDATE backup_history SET status = 'deleted' WHERE backup_path = ?"
        ).run(filePath);
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old backup(s)`);
    }
  }

  _recordBackupHistory(backupPath, size, type, status, notes = null) {
    this.db.prepare(`
      INSERT INTO backup_history (id, backup_path, backup_size, backup_type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), backupPath || '', size, type, status, notes);
  }

  // Public methods
  prepare(sql) {
    return this.db.prepare(sql);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  transaction(fn) {
    return this.db.transaction(fn);
  }

  backup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(this.backupDir, `ppk-backup-${timestamp}.db`);

    try {
      this.db.backup(backupPath);
      const stats = fs.statSync(backupPath);
      this._recordBackupHistory(backupPath, stats.size, type, 'completed');
      return { success: true, path: backupPath, size: stats.size };
    } catch (error) {
      this._recordBackupHistory(backupPath, 0, type, 'failed', error.message);
      throw error;
    }
  }

  getBackupHistory(limit = 20) {
    return this.db.prepare(`
      SELECT * FROM backup_history
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
  }

  restore(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    this.backup('pre_restore');
    const dbPath = path.join(this.dbDir, 'ppk.db');

    this.db.close();
    fs.copyFileSync(backupPath, dbPath);

    this.db = new Database(dbPath);
    this._configurePragmas();

    return { success: true };
  }

  getCurrentVersion() {
    return this._getCurrentSchemaVersion();
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

module.exports = DatabaseConnection;
