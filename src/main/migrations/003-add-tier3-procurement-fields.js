/**
 * Migration 003: Add Tier 3 Procurement Fields
 *
 * This migration adds new fields to support Tier 3 (>50 million IDR) procurement:
 * - Extended procurement_requests fields for technical specs, HPS, risk analysis
 * - HPS line items table for detailed cost breakdown
 * - Risk register table for risk analysis
 * - Provider qualifications table
 * - Draft data storage for multi-step form
 */

module.exports = {
  version: 3,
  name: 'add-tier3-procurement-fields',

  up(db) {
    // Add new columns to procurement_requests for Tier 3
    const newColumns = [
      { name: 'category', type: 'TEXT' },
      { name: 'background', type: 'TEXT' },
      { name: 'objectives', type: 'TEXT' },
      { name: 'scope_of_work', type: 'TEXT' },
      { name: 'technical_specs', type: 'TEXT' },
      { name: 'output_specs', type: 'TEXT' },
      { name: 'quality_requirements', type: 'TEXT' },
      { name: 'performance_indicators', type: 'TEXT' },
      { name: 'hps_methodology', type: 'TEXT' },
      { name: 'hps_total', type: 'REAL DEFAULT 0' },
      { name: 'hps_date', type: 'TEXT' },
      { name: 'hps_prepared_by', type: 'TEXT' },
      { name: 'procurement_method', type: 'TEXT' },
      { name: 'provider_selection_method', type: 'TEXT' },
      { name: 'estimated_timeline_days', type: 'INTEGER' },
      { name: 'planned_start_date', type: 'TEXT' },
      { name: 'planned_end_date', type: 'TEXT' },
      { name: 'announcement_start', type: 'TEXT' },
      { name: 'announcement_end', type: 'TEXT' },
      { name: 'registration_start', type: 'TEXT' },
      { name: 'registration_end', type: 'TEXT' },
      { name: 'evaluation_start', type: 'TEXT' },
      { name: 'evaluation_end', type: 'TEXT' },
      { name: 'award_date', type: 'TEXT' },
      { name: 'contract_signing_date', type: 'TEXT' },
      { name: 'risk_mitigation_plan', type: 'TEXT' },
      { name: 'sustainability_considerations', type: 'TEXT' },
      { name: 'local_content_requirement', type: 'REAL' },
      { name: 'sme_preference', type: 'INTEGER DEFAULT 0' },
      { name: 'draft_data', type: 'TEXT' },
      { name: 'draft_saved_at', type: 'TEXT' },
      { name: 'submitted_at', type: 'TEXT' }
    ];

    for (const col of newColumns) {
      try {
        db.exec(`ALTER TABLE procurement_requests ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        // Column might already exist
        console.log(`Column ${col.name} might already exist`);
      }
    }

    // Create HPS line items table
    db.exec(`
      CREATE TABLE IF NOT EXISTS hps_line_items (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        item_number INTEGER NOT NULL,
        description TEXT NOT NULL,
        unit TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit_price REAL NOT NULL CHECK(unit_price >= 0),
        total_price REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
        price_source TEXT,
        price_reference TEXT,
        price_reference_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
        UNIQUE(request_id, item_number)
      );

      CREATE INDEX IF NOT EXISTS idx_hps_items_request ON hps_line_items(request_id);
    `);

    // Create risk register table
    db.exec(`
      CREATE TABLE IF NOT EXISTS risk_register (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        risk_category TEXT NOT NULL CHECK(risk_category IN ('technical', 'financial', 'schedule', 'legal', 'operational', 'external')),
        risk_description TEXT NOT NULL,
        probability TEXT NOT NULL CHECK(probability IN ('low', 'medium', 'high')),
        impact TEXT NOT NULL CHECK(impact IN ('low', 'medium', 'high')),
        risk_score INTEGER GENERATED ALWAYS AS (
          CASE probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END *
          CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END
        ) STORED,
        mitigation_strategy TEXT,
        contingency_plan TEXT,
        risk_owner TEXT,
        status TEXT DEFAULT 'identified' CHECK(status IN ('identified', 'mitigating', 'resolved', 'occurred')),
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_risks_request ON risk_register(request_id);
      CREATE INDEX IF NOT EXISTS idx_risks_category ON risk_register(risk_category);
      CREATE INDEX IF NOT EXISTS idx_risks_status ON risk_register(status);
    `);

    // Create provider qualifications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS provider_qualifications (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        qualification_type TEXT NOT NULL CHECK(qualification_type IN (
          'business_license', 'tax_registration', 'technical_capability',
          'financial_capability', 'experience', 'certification', 'equipment', 'personnel'
        )),
        requirement_description TEXT NOT NULL,
        is_mandatory INTEGER DEFAULT 1,
        verification_method TEXT,
        minimum_score INTEGER,
        weight REAL DEFAULT 1.0,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_qualifications_request ON provider_qualifications(request_id);
    `);

    // Create procurement documents checklist table
    db.exec(`
      CREATE TABLE IF NOT EXISTS procurement_documents_checklist (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        document_name TEXT NOT NULL,
        is_required INTEGER DEFAULT 1,
        is_uploaded INTEGER DEFAULT 0,
        attachment_id TEXT,
        verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
        verified_by TEXT,
        verified_at TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL,
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_doc_checklist_request ON procurement_documents_checklist(request_id);
      CREATE INDEX IF NOT EXISTS idx_doc_checklist_status ON procurement_documents_checklist(verification_status);
    `);

    // Create price references table for HPS
    db.exec(`
      CREATE TABLE IF NOT EXISTS price_references (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL CHECK(price >= 0),
        source TEXT NOT NULL CHECK(source IN ('e_katalog', 'market_survey', 'historical', 'vendor_quote', 'official_price', 'other')),
        source_detail TEXT,
        reference_date TEXT NOT NULL,
        validity_days INTEGER DEFAULT 30,
        category TEXT,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_price_ref_category ON price_references(category);
      CREATE INDEX IF NOT EXISTS idx_price_ref_source ON price_references(source);
      CREATE INDEX IF NOT EXISTS idx_price_ref_active ON price_references(is_active);
    `);

    // Create evaluation criteria table
    db.exec(`
      CREATE TABLE IF NOT EXISTS evaluation_criteria (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        criteria_type TEXT NOT NULL CHECK(criteria_type IN ('administrative', 'technical', 'price', 'qualification')),
        criteria_name TEXT NOT NULL,
        description TEXT,
        weight REAL DEFAULT 1.0 CHECK(weight >= 0 AND weight <= 100),
        passing_score REAL,
        max_score REAL DEFAULT 100,
        evaluation_method TEXT,
        order_number INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_eval_criteria_request ON evaluation_criteria(request_id);
      CREATE INDEX IF NOT EXISTS idx_eval_criteria_type ON evaluation_criteria(criteria_type);
    `);

    // Add Tier 3 specific workflow approval steps
    // First, update CHECK constraint for approver_role if possible
    try {
      // Add new approval roles for Tier 3
      db.exec(`
        CREATE TABLE IF NOT EXISTS approval_workflow_templates (
          id TEXT PRIMARY KEY,
          tier TEXT NOT NULL CHECK(tier IN ('tier1', 'tier2', 'tier3')),
          step_number INTEGER NOT NULL,
          role_code TEXT NOT NULL,
          role_name TEXT NOT NULL,
          is_mandatory INTEGER DEFAULT 1,
          sla_days INTEGER DEFAULT 3,
          can_delegate INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now', 'localtime')),
          UNIQUE(tier, step_number)
        );
      `);

      // Insert Tier 3 approval workflow template
      const tier3Steps = [
        { step: 1, code: 'unit_head', name: 'Kepala Unit Kerja', sla: 2 },
        { step: 2, code: 'ppk', name: 'Pejabat Pembuat Komitmen (PPK)', sla: 3 },
        { step: 3, code: 'ppspm', name: 'Pejabat Penandatangan SPM (PPSPM)', sla: 2 },
        { step: 4, code: 'procurement_committee', name: 'Panitia Pengadaan', sla: 5 },
        { step: 5, code: 'director', name: 'Direktur', sla: 3 }
      ];

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO approval_workflow_templates (id, tier, step_number, role_code, role_name, sla_days)
        VALUES (?, 'tier3', ?, ?, ?, ?)
      `);

      for (const step of tier3Steps) {
        insertStmt.run(
          `tier3-step-${step.step}`,
          step.step,
          step.code,
          step.name,
          step.sla
        );
      }

      // Also add Tier 1 and Tier 2 templates
      const tier1Steps = [
        { step: 1, code: 'ppk', name: 'PPK', sla: 1 }
      ];

      const tier2Steps = [
        { step: 1, code: 'unit_head', name: 'Kepala Unit Kerja', sla: 2 },
        { step: 2, code: 'ppk', name: 'PPK', sla: 2 },
        { step: 3, code: 'ppspm', name: 'PPSPM', sla: 2 }
      ];

      for (const step of tier1Steps) {
        db.prepare(`
          INSERT OR IGNORE INTO approval_workflow_templates (id, tier, step_number, role_code, role_name, sla_days)
          VALUES (?, 'tier1', ?, ?, ?, ?)
        `).run(`tier1-step-${step.step}`, step.step, step.code, step.name, step.sla);
      }

      for (const step of tier2Steps) {
        db.prepare(`
          INSERT OR IGNORE INTO approval_workflow_templates (id, tier, step_number, role_code, role_name, sla_days)
          VALUES (?, 'tier2', ?, ?, ?, ?)
        `).run(`tier2-step-${step.step}`, step.step, step.code, step.name, step.sla);
      }
    } catch (e) {
      console.log('Error creating approval workflow templates:', e.message);
    }

    console.log('Migration 003: Added Tier 3 procurement fields and supporting tables');
  },

  down(db) {
    // Drop new tables
    const tables = [
      'evaluation_criteria',
      'price_references',
      'procurement_documents_checklist',
      'provider_qualifications',
      'risk_register',
      'hps_line_items',
      'approval_workflow_templates'
    ];

    for (const table of tables) {
      try {
        db.exec(`DROP TABLE IF EXISTS ${table}`);
      } catch (e) {
        console.log(`Error dropping table ${table}:`, e.message);
      }
    }

    // Note: Dropping columns from procurement_requests would require table recreation
    // which is not done here to preserve data integrity

    console.log('Migration 003: Rolled back Tier 3 tables (columns preserved)');
  }
};
