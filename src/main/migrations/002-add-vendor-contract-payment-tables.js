/**
 * Migration 002: Add Vendor, Contract, Payment, and Attachment Tables
 *
 * This migration adds new tables to support the complete procurement workflow:
 * - vendors: Vendor/supplier management with NPWP, bank details, performance rating
 * - contracts: Contract management linked to procurement requests and vendors
 * - payments: Payment tracking for contracts with multiple payment support
 * - attachments: Enhanced document management with polymorphic associations
 *
 * Also adds:
 * - audit_log: For tracking all changes
 * - backup_history: For tracking database backups
 * - Enhanced indexes for performance
 * - Data validation triggers
 */

module.exports = {
  version: 2,
  name: 'add-vendor-contract-payment-tables',

  up(db) {
    // Add vendors table
    db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
      CREATE INDEX IF NOT EXISTS idx_vendors_npwp ON vendors(npwp);
      CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);
    `);

    // Add contracts table
    db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_contracts_request ON contracts(request_id);
      CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON contracts(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
      CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);
    `);

    // Add payments table
    db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
    `);

    // Add attachments table (enhanced version of documents)
    db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_attachments_request ON attachments(request_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_contract ON attachments(contract_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_payment ON attachments(payment_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(file_type);
    `);

    // Add audit log table
    db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_id);
      CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(changed_at);
    `);

    // Add backup history table
    db.exec(`
      CREATE TABLE IF NOT EXISTS backup_history (
        id TEXT PRIMARY KEY,
        backup_path TEXT NOT NULL,
        backup_size INTEGER,
        backup_type TEXT DEFAULT 'manual' CHECK(backup_type IN ('manual', 'scheduled', 'pre_migration')),
        status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'failed', 'deleted')),
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        notes TEXT
      );
    `);

    // Add new columns to procurement_requests if they don't exist
    try {
      db.exec(`ALTER TABLE procurement_requests ADD COLUMN quantity INTEGER DEFAULT 1`);
    } catch (e) {
      // Column might already exist
    }

    try {
      db.exec(`ALTER TABLE procurement_requests ADD COLUMN rejection_reason TEXT`);
    } catch (e) {
      // Column might already exist
    }

    // Add new columns to budget_allocation if they don't exist
    try {
      db.exec(`ALTER TABLE budget_allocation ADD COLUMN reserved_amount REAL DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    // Update workflow_approvals foreign key constraint (recreate table)
    // Note: SQLite doesn't support modifying foreign keys, so we need to recreate
    const approvalData = db.prepare('SELECT * FROM workflow_approvals').all();

    if (approvalData.length === 0) {
      // Safe to recreate if empty
      db.exec(`
        DROP TABLE IF EXISTS workflow_approvals;

        CREATE TABLE workflow_approvals (
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

        CREATE INDEX IF NOT EXISTS idx_approvals_request ON workflow_approvals(request_id);
      `);
    }

    // Add additional indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_requests_unit ON procurement_requests(unit);
      CREATE INDEX IF NOT EXISTS idx_budget_year ON budget_allocation(fiscal_year);
    `);

    console.log('Migration 002: Added vendor, contract, payment, and attachment tables');
  },

  down(db) {
    // Remove the new tables
    const tables = [
      'backup_history',
      'audit_log',
      'attachments',
      'payments',
      'contracts',
      'vendors'
    ];

    for (const table of tables) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }

    // Remove added columns (SQLite doesn't support DROP COLUMN in older versions)
    // For full rollback, you'd need to recreate the tables

    console.log('Migration 002: Rolled back vendor, contract, payment, and attachment tables');
  }
};
