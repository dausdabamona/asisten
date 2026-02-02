/**
 * Migration 004: Add Generated Documents Table
 *
 * This migration adds a table to track generated PDF documents:
 * - Kwitansi, SPP, SPM, Contracts, BAST
 * - Version control for regenerated documents
 * - File path and metadata storage
 */

module.exports = {
  version: 4,
  name: 'add-generated-documents-table',

  up(db) {
    // Create documents table for generated PDFs
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        request_id TEXT,
        contract_id TEXT,
        payment_id TEXT,
        doc_type TEXT NOT NULL CHECK(doc_type IN ('kwitansi', 'spp', 'spm', 'contract', 'bast', 'request_pdf', 'contract_pdf', 'payment_voucher', 'other')),
        doc_number TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT,
        file_size INTEGER,
        version INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'superseded', 'deleted')),
        generated_by TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE SET NULL,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_documents_request ON documents(request_id);
      CREATE INDEX IF NOT EXISTS idx_documents_contract ON documents(contract_id);
      CREATE INDEX IF NOT EXISTS idx_documents_payment ON documents(payment_id);
      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);
      CREATE INDEX IF NOT EXISTS idx_documents_number ON documents(doc_number);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    `);

    // Create trigger to update version on regeneration
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS documents_version_trigger
      BEFORE INSERT ON documents
      BEGIN
        UPDATE documents
        SET status = 'superseded',
            updated_at = datetime('now', 'localtime')
        WHERE doc_type = NEW.doc_type
          AND status = 'active'
          AND (
            (NEW.request_id IS NOT NULL AND request_id = NEW.request_id) OR
            (NEW.contract_id IS NOT NULL AND contract_id = NEW.contract_id) OR
            (NEW.payment_id IS NOT NULL AND payment_id = NEW.payment_id)
          );
      END;
    `);

    // Create document sequence tracking table
    db.exec(`
      CREATE TABLE IF NOT EXISTS document_sequences (
        id TEXT PRIMARY KEY,
        doc_type TEXT NOT NULL,
        fiscal_year INTEGER NOT NULL,
        last_sequence INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        UNIQUE(doc_type, fiscal_year)
      );
    `);

    console.log('Migration 004: Added generated documents table');
  },

  down(db) {
    db.exec(`
      DROP TRIGGER IF EXISTS documents_version_trigger;
      DROP TABLE IF EXISTS document_sequences;
      DROP TABLE IF EXISTS documents;
    `);

    console.log('Migration 004: Rolled back generated documents table');
  }
};
