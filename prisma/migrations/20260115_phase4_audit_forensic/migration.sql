-- =============================================================================
-- ASISTEN Phase 4: Audit-Grade Hardening & Forensic Archive
-- Migration Script
-- =============================================================================
--
-- Features:
-- 1. Multi-year architecture (tahun_anggaran isolation)
-- 2. Forensic document archive with hash chain
-- 3. Audit mode & legal timeline view
-- 4. Archive lock (WORM behavior)
-- 5. Disaster recovery & backup metadata
-- 6. Role-based audit access (RLS)
-- =============================================================================

-- =============================================================================
-- NEW ENUMS
-- =============================================================================

-- Document Version Status for forensic immutability
CREATE TYPE "asisten"."DokumenVersiStatus" AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'FINAL'
);

COMMENT ON TYPE "asisten"."DokumenVersiStatus" IS 'FINAL status indicates immutable document version';

-- Backup operation types
CREATE TYPE "asisten"."BackupType" AS ENUM (
    'FULL',
    'INCREMENTAL',
    'DIFFERENTIAL'
);

-- Backup operation status
CREATE TYPE "asisten"."BackupStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'VERIFIED'
);

-- Archive lock reasons
CREATE TYPE "asisten"."ArchiveLockReason" AS ENUM (
    'WORKFLOW_COMPLETED',
    'FISCAL_YEAR_CLOSED',
    'LEGAL_HOLD',
    'AUDIT_REQUIREMENT',
    'ADMIN_LOCK'
);

-- =============================================================================
-- MODIFY dokumen_versi FOR FORENSIC ARCHIVE
-- =============================================================================

-- Add Phase 4 forensic fields to dokumen_versi
ALTER TABLE "asisten"."dokumen_versi"
    ADD COLUMN IF NOT EXISTS "tahun_anggaran" INTEGER,
    ADD COLUMN IF NOT EXISTS "previous_version_hash" VARCHAR(64),
    ADD COLUMN IF NOT EXISTS "version_status" "asisten"."DokumenVersiStatus" DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS "finalized_at" TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "archive_path" VARCHAR(1000);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "dokumen_versi_tahun_anggaran_idx"
    ON "asisten"."dokumen_versi"("tahun_anggaran");
CREATE INDEX IF NOT EXISTS "dokumen_versi_version_status_idx"
    ON "asisten"."dokumen_versi"("version_status");
CREATE INDEX IF NOT EXISTS "dokumen_versi_previous_version_hash_idx"
    ON "asisten"."dokumen_versi"("previous_version_hash");

COMMENT ON COLUMN "asisten"."dokumen_versi"."tahun_anggaran" IS 'Fiscal year for partitioning and multi-year isolation';
COMMENT ON COLUMN "asisten"."dokumen_versi"."previous_version_hash" IS 'SHA-256 hash chain link to previous version';
COMMENT ON COLUMN "asisten"."dokumen_versi"."version_status" IS 'FINAL = immutable, cannot be modified';
COMMENT ON COLUMN "asisten"."dokumen_versi"."finalized_at" IS 'Timestamp when status became FINAL';
COMMENT ON COLUMN "asisten"."dokumen_versi"."archive_path" IS 'WORM archive storage location';

-- =============================================================================
-- TABLE 40: archive_lock_log - WORM Behavior Audit Trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS "asisten"."archive_lock_log" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tahun_anggaran" INTEGER NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "lock_reason" "asisten"."ArchiveLockReason" NOT NULL DEFAULT 'WORKFLOW_COMPLETED',
    "locked_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_by" UUID,
    -- Hash chain for integrity
    "record_hash" VARCHAR(64) NOT NULL,
    "previous_log_hash" VARCHAR(64),
    -- Metadata
    "workflow_state" VARCHAR(50),
    "document_count" INTEGER,
    "total_nilai" DECIMAL(18, 2),
    "catatan" TEXT,
    -- Audit (created_at only - immutable)
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archive_lock_log_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "archive_lock_log_entity_unique" UNIQUE ("entity_type", "entity_id"),
    CONSTRAINT "archive_lock_log_locked_by_fkey" FOREIGN KEY ("locked_by")
        REFERENCES "asisten"."users"("id") ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "archive_lock_log_tahun_anggaran_idx" ON "asisten"."archive_lock_log"("tahun_anggaran");
CREATE INDEX IF NOT EXISTS "archive_lock_log_entity_type_idx" ON "asisten"."archive_lock_log"("entity_type");
CREATE INDEX IF NOT EXISTS "archive_lock_log_entity_id_idx" ON "asisten"."archive_lock_log"("entity_id");
CREATE INDEX IF NOT EXISTS "archive_lock_log_lock_reason_idx" ON "asisten"."archive_lock_log"("lock_reason");
CREATE INDEX IF NOT EXISTS "archive_lock_log_locked_at_idx" ON "asisten"."archive_lock_log"("locked_at");
CREATE INDEX IF NOT EXISTS "archive_lock_log_record_hash_idx" ON "asisten"."archive_lock_log"("record_hash");
CREATE INDEX IF NOT EXISTS "archive_lock_log_previous_log_hash_idx" ON "asisten"."archive_lock_log"("previous_log_hash");

COMMENT ON TABLE "asisten"."archive_lock_log" IS 'WORM behavior audit trail - records when entities are locked for archival';

-- =============================================================================
-- TABLE 41: backup_catalog - Disaster Recovery Metadata
-- =============================================================================

CREATE TABLE IF NOT EXISTS "asisten"."backup_catalog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tahun_anggaran" INTEGER NOT NULL,
    "backup_type" "asisten"."BackupType" NOT NULL DEFAULT 'FULL',
    "backup_name" VARCHAR(255) NOT NULL,
    "backup_path" VARCHAR(1000) NOT NULL,
    "backup_size" BIGINT,
    -- Integrity verification
    "backup_hash" VARCHAR(64) NOT NULL,
    "manifest_hash" VARCHAR(64),
    -- Status tracking
    "status" "asisten"."BackupStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP,
    "verified_at" TIMESTAMP,
    "verified_by" UUID,
    -- Statistics
    "table_count" INTEGER,
    "record_count" INTEGER,
    "document_count" INTEGER,
    -- Error handling
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    -- Retention (~7 years for government compliance)
    "retention_days" INTEGER NOT NULL DEFAULT 2555,
    "expires_at" TIMESTAMP,
    -- Audit fields
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_catalog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "backup_catalog_created_by_fkey" FOREIGN KEY ("created_by")
        REFERENCES "asisten"."users"("id") ON DELETE SET NULL,
    CONSTRAINT "backup_catalog_verified_by_fkey" FOREIGN KEY ("verified_by")
        REFERENCES "asisten"."users"("id") ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "backup_catalog_tahun_anggaran_idx" ON "asisten"."backup_catalog"("tahun_anggaran");
CREATE INDEX IF NOT EXISTS "backup_catalog_backup_type_idx" ON "asisten"."backup_catalog"("backup_type");
CREATE INDEX IF NOT EXISTS "backup_catalog_status_idx" ON "asisten"."backup_catalog"("status");
CREATE INDEX IF NOT EXISTS "backup_catalog_started_at_idx" ON "asisten"."backup_catalog"("started_at");
CREATE INDEX IF NOT EXISTS "backup_catalog_completed_at_idx" ON "asisten"."backup_catalog"("completed_at");
CREATE INDEX IF NOT EXISTS "backup_catalog_backup_hash_idx" ON "asisten"."backup_catalog"("backup_hash");
CREATE INDEX IF NOT EXISTS "backup_catalog_expires_at_idx" ON "asisten"."backup_catalog"("expires_at");

COMMENT ON TABLE "asisten"."backup_catalog" IS 'Disaster recovery backup metadata catalog';

-- =============================================================================
-- TRIGGERS FOR IMMUTABILITY (WORM BEHAVIOR)
-- =============================================================================

-- Trigger: Prevent modification of FINAL dokumen_versi
CREATE OR REPLACE FUNCTION "asisten".prevent_final_dokumen_versi_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if trying to modify a FINAL version
    IF OLD.version_status = 'FINAL' THEN
        -- Allow soft delete only
        IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
            RAISE EXCEPTION 'Cannot soft delete FINAL document version. Archive lock required.';
        END IF;
        RAISE EXCEPTION 'Cannot modify document version with FINAL status. Version % of document % is immutable.',
            OLD.versi, OLD.dokumen_id;
    END IF;

    -- If transitioning to FINAL, set finalized_at
    IF NEW.version_status = 'FINAL' AND OLD.version_status != 'FINAL' THEN
        NEW.finalized_at = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_final_dokumen_versi_modification ON "asisten"."dokumen_versi";
CREATE TRIGGER trg_prevent_final_dokumen_versi_modification
    BEFORE UPDATE ON "asisten"."dokumen_versi"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".prevent_final_dokumen_versi_modification();

-- Trigger: Prevent deletion of FINAL dokumen_versi
CREATE OR REPLACE FUNCTION "asisten".prevent_final_dokumen_versi_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.version_status = 'FINAL' THEN
        RAISE EXCEPTION 'Cannot delete document version with FINAL status. Version % of document % is immutable.',
            OLD.versi, OLD.dokumen_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_final_dokumen_versi_deletion ON "asisten"."dokumen_versi";
CREATE TRIGGER trg_prevent_final_dokumen_versi_deletion
    BEFORE DELETE ON "asisten"."dokumen_versi"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".prevent_final_dokumen_versi_deletion();

-- Trigger: Prevent modification of archive_lock_log (immutable by design)
CREATE OR REPLACE FUNCTION "asisten".prevent_archive_lock_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'archive_lock_log records are immutable. Cannot modify lock for % id %.',
        OLD.entity_type, OLD.entity_id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_archive_lock_modification ON "asisten"."archive_lock_log";
CREATE TRIGGER trg_prevent_archive_lock_modification
    BEFORE UPDATE ON "asisten"."archive_lock_log"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".prevent_archive_lock_modification();

DROP TRIGGER IF EXISTS trg_prevent_archive_lock_deletion ON "asisten"."archive_lock_log";
CREATE TRIGGER trg_prevent_archive_lock_deletion
    BEFORE DELETE ON "asisten"."archive_lock_log"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".prevent_archive_lock_modification();

-- =============================================================================
-- TRIGGERS FOR HASH CHAIN INTEGRITY
-- =============================================================================

-- Trigger: Auto-populate previous_version_hash when creating new dokumen_versi
CREATE OR REPLACE FUNCTION "asisten".dokumen_versi_hash_chain()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash VARCHAR(64);
BEGIN
    -- Get the checksum of the previous version for this document
    SELECT checksum INTO prev_hash
    FROM "asisten"."dokumen_versi"
    WHERE dokumen_id = NEW.dokumen_id
      AND versi = NEW.versi - 1
      AND is_deleted = FALSE;

    -- Set the previous_version_hash
    IF prev_hash IS NOT NULL THEN
        NEW.previous_version_hash = prev_hash;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dokumen_versi_hash_chain ON "asisten"."dokumen_versi";
CREATE TRIGGER trg_dokumen_versi_hash_chain
    BEFORE INSERT ON "asisten"."dokumen_versi"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".dokumen_versi_hash_chain();

-- Trigger: Auto-populate previous_log_hash when creating archive_lock_log
CREATE OR REPLACE FUNCTION "asisten".archive_lock_hash_chain()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash VARCHAR(64);
BEGIN
    -- Get the record_hash of the most recent lock in this fiscal year
    SELECT record_hash INTO prev_hash
    FROM "asisten"."archive_lock_log"
    WHERE tahun_anggaran = NEW.tahun_anggaran
    ORDER BY created_at DESC
    LIMIT 1;

    -- Set the previous_log_hash
    IF prev_hash IS NOT NULL THEN
        NEW.previous_log_hash = prev_hash;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_archive_lock_hash_chain ON "asisten"."archive_lock_log";
CREATE TRIGGER trg_archive_lock_hash_chain
    BEFORE INSERT ON "asisten"."archive_lock_log"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".archive_lock_hash_chain();

-- =============================================================================
-- TRIGGERS FOR ARCHIVE ENFORCEMENT
-- =============================================================================

-- Trigger: Prevent modification of archived paket
CREATE OR REPLACE FUNCTION "asisten".prevent_archived_paket_modification()
RETURNS TRIGGER AS $$
DECLARE
    is_locked BOOLEAN;
BEGIN
    -- Check if this paket is archived
    SELECT EXISTS(
        SELECT 1 FROM "asisten"."archive_lock_log"
        WHERE entity_type = 'paket' AND entity_id = OLD.id
    ) INTO is_locked;

    IF is_locked THEN
        RAISE EXCEPTION 'Cannot modify archived paket %. The record is locked for compliance.', OLD.kode;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_archived_paket_modification ON "asisten"."paket";
CREATE TRIGGER trg_prevent_archived_paket_modification
    BEFORE UPDATE OR DELETE ON "asisten"."paket"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".prevent_archived_paket_modification();

-- Trigger: Prevent modification of archived workflow_instance
CREATE OR REPLACE FUNCTION "asisten".prevent_archived_workflow_modification()
RETURNS TRIGGER AS $$
DECLARE
    is_locked BOOLEAN;
BEGIN
    -- Check if this workflow is archived
    SELECT EXISTS(
        SELECT 1 FROM "asisten"."archive_lock_log"
        WHERE entity_type = 'workflow_instance' AND entity_id = OLD.id
    ) INTO is_locked;

    IF is_locked THEN
        RAISE EXCEPTION 'Cannot modify archived workflow_instance %. The record is locked for compliance.', OLD.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_archived_workflow_modification ON "asisten"."workflow_instance";
CREATE TRIGGER trg_prevent_archived_workflow_modification
    BEFORE UPDATE OR DELETE ON "asisten"."workflow_instance"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".prevent_archived_workflow_modification();

-- =============================================================================
-- AUTO-ARCHIVE TRIGGER (When workflow reaches ARSIP)
-- =============================================================================

CREATE OR REPLACE FUNCTION "asisten".auto_archive_on_workflow_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_paket_id UUID;
    v_tahun_anggaran INT;
    v_doc_count INT;
    v_total_nilai DECIMAL(18,2);
    v_record_hash VARCHAR(64);
    v_stage_kode VARCHAR(50);
BEGIN
    -- Get the stage code
    SELECT kode INTO v_stage_kode
    FROM "asisten"."workflow_stage"
    WHERE id = NEW.current_stage_id;

    -- Only proceed if workflow reached ARSIP and is being deactivated
    IF v_stage_kode = 'ARSIP' AND NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        -- Get paket details
        SELECT id, tahun_anggaran, COALESCE(nilai_kontrak, nilai_pagu)
        INTO v_paket_id, v_tahun_anggaran, v_total_nilai
        FROM "asisten"."paket"
        WHERE id = NEW.paket_id;

        -- Count documents
        SELECT COUNT(*) INTO v_doc_count
        FROM "asisten"."dokumen"
        WHERE paket_id = v_paket_id AND is_deleted = FALSE;

        -- Generate record hash (SHA-256 of paket data)
        v_record_hash = encode(
            sha256(
                (v_paket_id::text || v_tahun_anggaran::text || COALESCE(v_total_nilai::text, '') || NOW()::text)::bytea
            ),
            'hex'
        );

        -- Create archive lock for paket
        INSERT INTO "asisten"."archive_lock_log" (
            tahun_anggaran, entity_type, entity_id, lock_reason,
            locked_by, record_hash, workflow_state, document_count, total_nilai
        ) VALUES (
            v_tahun_anggaran, 'paket', v_paket_id, 'WORKFLOW_COMPLETED',
            NEW.updated_by, v_record_hash, 'ARSIP', v_doc_count, v_total_nilai
        ) ON CONFLICT (entity_type, entity_id) DO NOTHING;

        -- Create archive lock for workflow_instance
        INSERT INTO "asisten"."archive_lock_log" (
            tahun_anggaran, entity_type, entity_id, lock_reason,
            locked_by, record_hash, workflow_state
        ) VALUES (
            v_tahun_anggaran, 'workflow_instance', NEW.id, 'WORKFLOW_COMPLETED',
            NEW.updated_by,
            encode(sha256((NEW.id::text || NOW()::text)::bytea), 'hex'),
            'ARSIP'
        ) ON CONFLICT (entity_type, entity_id) DO NOTHING;

        -- Mark all document versions as FINAL
        UPDATE "asisten"."dokumen_versi" dv
        SET version_status = 'FINAL',
            finalized_at = CURRENT_TIMESTAMP
        FROM "asisten"."dokumen" d
        WHERE dv.dokumen_id = d.id
          AND d.paket_id = v_paket_id
          AND dv.version_status != 'FINAL'
          AND dv.is_deleted = FALSE;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_archive_on_workflow_complete ON "asisten"."workflow_instance";
CREATE TRIGGER trg_auto_archive_on_workflow_complete
    AFTER UPDATE ON "asisten"."workflow_instance"
    FOR EACH ROW
    EXECUTE FUNCTION "asisten".auto_archive_on_workflow_complete();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE "asisten"."archive_lock_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "asisten"."backup_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "asisten"."audit_log" ENABLE ROW LEVEL SECURITY;

-- Policy: archive_lock_log - Read access for auditors and admins
CREATE POLICY archive_lock_read_policy ON "asisten"."archive_lock_log"
    FOR SELECT
    USING (
        -- Check if current user has auditor or admin role
        -- This uses a session variable 'app.current_user_id'
        EXISTS (
            SELECT 1 FROM "asisten"."user_roles" ur
            JOIN "asisten"."roles" r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id', true)::uuid
              AND r.kode IN ('AUDITOR', 'ADMIN', 'SUPER_ADMIN', 'KUASA_BUD')
              AND ur.is_deleted = FALSE
        )
        OR
        -- Or if the user locked this record
        locked_by = current_setting('app.current_user_id', true)::uuid
    );

-- Policy: archive_lock_log - Insert only for authorized roles
CREATE POLICY archive_lock_insert_policy ON "asisten"."archive_lock_log"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "asisten"."user_roles" ur
            JOIN "asisten"."roles" r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id', true)::uuid
              AND r.kode IN ('ADMIN', 'SUPER_ADMIN', 'PPK', 'KUASA_PA')
              AND ur.is_deleted = FALSE
        )
    );

-- Policy: backup_catalog - Full access for backup admins
CREATE POLICY backup_catalog_admin_policy ON "asisten"."backup_catalog"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "asisten"."user_roles" ur
            JOIN "asisten"."roles" r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id', true)::uuid
              AND r.kode IN ('ADMIN', 'SUPER_ADMIN', 'BACKUP_ADMIN')
              AND ur.is_deleted = FALSE
        )
    );

-- Policy: backup_catalog - Read access for auditors
CREATE POLICY backup_catalog_read_policy ON "asisten"."backup_catalog"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "asisten"."user_roles" ur
            JOIN "asisten"."roles" r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id', true)::uuid
              AND r.kode IN ('AUDITOR', 'KUASA_BUD')
              AND ur.is_deleted = FALSE
        )
    );

-- Policy: audit_log - Read access for auditors, write prevented for all
CREATE POLICY audit_log_read_policy ON "asisten"."audit_log"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "asisten"."user_roles" ur
            JOIN "asisten"."roles" r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id', true)::uuid
              AND r.kode IN ('AUDITOR', 'ADMIN', 'SUPER_ADMIN', 'KUASA_BUD', 'KUASA_PA')
              AND ur.is_deleted = FALSE
        )
    );

-- =============================================================================
-- MATERIALIZED VIEW: legal_timeline_view
-- Forensic timeline for audit/legal purposes
-- =============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS "asisten"."legal_timeline_view" AS
SELECT
    -- Common fields
    'dokumen_versi' AS entity_type,
    dv.id AS entity_id,
    d.paket_id,
    p.tahun_anggaran,
    p.kode AS paket_kode,
    p.nama AS paket_nama,
    -- Timeline data
    dv.created_at AS event_timestamp,
    'DOCUMENT_VERSION_CREATED' AS event_type,
    dv.version_status::text AS status,
    dv.versi AS version_number,
    dv.file_name AS detail_1,
    dv.checksum AS detail_2,
    dv.previous_version_hash AS hash_chain_link,
    dv.created_by AS actor_id,
    u.nama AS actor_nama,
    -- Integrity
    dv.finalized_at,
    CASE WHEN dv.version_status = 'FINAL' THEN TRUE ELSE FALSE END AS is_immutable
FROM "asisten"."dokumen_versi" dv
JOIN "asisten"."dokumen" d ON dv.dokumen_id = d.id
JOIN "asisten"."paket" p ON d.paket_id = p.id
LEFT JOIN "asisten"."users" u ON dv.created_by = u.id
WHERE dv.is_deleted = FALSE

UNION ALL

SELECT
    'approval_log' AS entity_type,
    al.id AS entity_id,
    wi.paket_id,
    p.tahun_anggaran,
    p.kode AS paket_kode,
    p.nama AS paket_nama,
    al.created_at AS event_timestamp,
    'APPROVAL_' || al.aksi::text AS event_type,
    al.aksi::text AS status,
    NULL AS version_number,
    al.catatan AS detail_1,
    NULL AS detail_2,
    NULL AS hash_chain_link,
    al.approver_id AS actor_id,
    u.nama AS actor_nama,
    NULL AS finalized_at,
    FALSE AS is_immutable
FROM "asisten"."approval_log" al
JOIN "asisten"."workflow_instance" wi ON al.workflow_instance_id = wi.id
JOIN "asisten"."paket" p ON wi.paket_id = p.id
LEFT JOIN "asisten"."users" u ON al.approver_id = u.id
WHERE al.is_deleted = FALSE

UNION ALL

SELECT
    'workflow_history' AS entity_type,
    wh.id AS entity_id,
    wi.paket_id,
    p.tahun_anggaran,
    p.kode AS paket_kode,
    p.nama AS paket_nama,
    wh.transitioned_at AS event_timestamp,
    'WORKFLOW_TRANSITION' AS event_type,
    ts.kode::text AS status,
    NULL AS version_number,
    fs.kode::text AS detail_1,
    wh.catatan AS detail_2,
    NULL AS hash_chain_link,
    wh.transitioned_by AS actor_id,
    u.nama AS actor_nama,
    NULL AS finalized_at,
    CASE WHEN ts.kode = 'ARSIP' THEN TRUE ELSE FALSE END AS is_immutable
FROM "asisten"."workflow_history" wh
JOIN "asisten"."workflow_instance" wi ON wh.workflow_instance_id = wi.id
JOIN "asisten"."paket" p ON wi.paket_id = p.id
JOIN "asisten"."workflow_stage" fs ON wh.from_stage_id = fs.id
JOIN "asisten"."workflow_stage" ts ON wh.to_stage_id = ts.id
LEFT JOIN "asisten"."users" u ON wh.transitioned_by = u.id
WHERE wh.is_deleted = FALSE

UNION ALL

SELECT
    'archive_lock_log' AS entity_type,
    all2.id AS entity_id,
    CASE WHEN all2.entity_type = 'paket' THEN all2.entity_id ELSE NULL END AS paket_id,
    all2.tahun_anggaran,
    p.kode AS paket_kode,
    p.nama AS paket_nama,
    all2.locked_at AS event_timestamp,
    'ARCHIVE_LOCKED' AS event_type,
    all2.lock_reason::text AS status,
    NULL AS version_number,
    all2.entity_type AS detail_1,
    all2.workflow_state AS detail_2,
    all2.previous_log_hash AS hash_chain_link,
    all2.locked_by AS actor_id,
    u.nama AS actor_nama,
    all2.locked_at AS finalized_at,
    TRUE AS is_immutable
FROM "asisten"."archive_lock_log" all2
LEFT JOIN "asisten"."paket" p ON all2.entity_type = 'paket' AND all2.entity_id = p.id
LEFT JOIN "asisten"."users" u ON all2.locked_by = u.id

ORDER BY event_timestamp DESC;

-- Create indexes on materialized view for performance
CREATE UNIQUE INDEX IF NOT EXISTS "legal_timeline_view_id_idx"
    ON "asisten"."legal_timeline_view"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS "legal_timeline_view_paket_idx"
    ON "asisten"."legal_timeline_view"(paket_id);
CREATE INDEX IF NOT EXISTS "legal_timeline_view_tahun_idx"
    ON "asisten"."legal_timeline_view"(tahun_anggaran);
CREATE INDEX IF NOT EXISTS "legal_timeline_view_timestamp_idx"
    ON "asisten"."legal_timeline_view"(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS "legal_timeline_view_event_type_idx"
    ON "asisten"."legal_timeline_view"(event_type);
CREATE INDEX IF NOT EXISTS "legal_timeline_view_actor_idx"
    ON "asisten"."legal_timeline_view"(actor_id);

COMMENT ON MATERIALIZED VIEW "asisten"."legal_timeline_view" IS
'Forensic timeline view for audit/legal purposes. Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY asisten.legal_timeline_view;';

-- =============================================================================
-- HELPER FUNCTIONS FOR FORENSIC OPERATIONS
-- =============================================================================

-- Function: Calculate record hash for archive
CREATE OR REPLACE FUNCTION "asisten".calculate_record_hash(
    p_entity_type TEXT,
    p_entity_id UUID
) RETURNS VARCHAR(64) AS $$
DECLARE
    v_data TEXT;
    v_hash VARCHAR(64);
BEGIN
    -- Build hash based on entity type
    CASE p_entity_type
        WHEN 'paket' THEN
            SELECT kode || nama || tahun_anggaran::text || COALESCE(nilai_kontrak::text, nilai_pagu::text)
            INTO v_data
            FROM "asisten"."paket" WHERE id = p_entity_id;
        WHEN 'workflow_instance' THEN
            SELECT paket_id::text || current_stage_id::text || started_at::text
            INTO v_data
            FROM "asisten"."workflow_instance" WHERE id = p_entity_id;
        WHEN 'dokumen_versi' THEN
            SELECT dokumen_id::text || versi::text || COALESCE(checksum, '') || file_path
            INTO v_data
            FROM "asisten"."dokumen_versi" WHERE id = p_entity_id;
        ELSE
            v_data = p_entity_id::text;
    END CASE;

    -- Calculate SHA-256 hash
    v_hash = encode(sha256((v_data || NOW()::text)::bytea), 'hex');

    RETURN v_hash;
END;
$$ LANGUAGE plpgsql;

-- Function: Verify hash chain integrity
CREATE OR REPLACE FUNCTION "asisten".verify_hash_chain(
    p_tahun_anggaran INT
) RETURNS TABLE(
    entity_type TEXT,
    entity_id UUID,
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    rec RECORD;
    prev_hash VARCHAR(64) := NULL;
BEGIN
    FOR rec IN
        SELECT all2.id, all2.entity_type, all2.entity_id,
               all2.record_hash, all2.previous_log_hash
        FROM "asisten"."archive_lock_log" all2
        WHERE all2.tahun_anggaran = p_tahun_anggaran
        ORDER BY all2.created_at ASC
    LOOP
        -- Check if previous_log_hash matches expected
        IF rec.previous_log_hash IS NULL AND prev_hash IS NOT NULL THEN
            RETURN QUERY SELECT rec.entity_type, rec.entity_id, FALSE,
                'Missing previous_log_hash, expected: ' || prev_hash;
        ELSIF rec.previous_log_hash IS NOT NULL AND rec.previous_log_hash != prev_hash THEN
            RETURN QUERY SELECT rec.entity_type, rec.entity_id, FALSE,
                'Hash chain broken. Expected: ' || COALESCE(prev_hash, 'NULL') ||
                ', Got: ' || rec.previous_log_hash;
        ELSE
            RETURN QUERY SELECT rec.entity_type, rec.entity_id, TRUE, NULL::TEXT;
        END IF;

        prev_hash = rec.record_hash;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Archive a paket manually (for admin use)
CREATE OR REPLACE FUNCTION "asisten".archive_paket(
    p_paket_id UUID,
    p_user_id UUID,
    p_reason "asisten"."ArchiveLockReason" DEFAULT 'ADMIN_LOCK',
    p_catatan TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_lock_id UUID;
    v_tahun_anggaran INT;
    v_doc_count INT;
    v_total_nilai DECIMAL(18,2);
    v_record_hash VARCHAR(64);
BEGIN
    -- Get paket details
    SELECT tahun_anggaran, COALESCE(nilai_kontrak, nilai_pagu)
    INTO v_tahun_anggaran, v_total_nilai
    FROM "asisten"."paket"
    WHERE id = p_paket_id AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Paket not found: %', p_paket_id;
    END IF;

    -- Count documents
    SELECT COUNT(*) INTO v_doc_count
    FROM "asisten"."dokumen"
    WHERE paket_id = p_paket_id AND is_deleted = FALSE;

    -- Calculate hash
    v_record_hash = "asisten".calculate_record_hash('paket', p_paket_id);

    -- Create archive lock
    INSERT INTO "asisten"."archive_lock_log" (
        tahun_anggaran, entity_type, entity_id, lock_reason,
        locked_by, record_hash, document_count, total_nilai, catatan
    ) VALUES (
        v_tahun_anggaran, 'paket', p_paket_id, p_reason,
        p_user_id, v_record_hash, v_doc_count, v_total_nilai, p_catatan
    )
    RETURNING id INTO v_lock_id;

    -- Mark all document versions as FINAL
    UPDATE "asisten"."dokumen_versi" dv
    SET version_status = 'FINAL',
        finalized_at = CURRENT_TIMESTAMP
    FROM "asisten"."dokumen" d
    WHERE dv.dokumen_id = d.id
      AND d.paket_id = p_paket_id
      AND dv.version_status != 'FINAL'
      AND dv.is_deleted = FALSE;

    RETURN v_lock_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Refresh legal timeline view
CREATE OR REPLACE FUNCTION "asisten".refresh_legal_timeline()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY "asisten"."legal_timeline_view";
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA "asisten" TO PUBLIC;

-- Grant select on materialized view to all authenticated users
GRANT SELECT ON "asisten"."legal_timeline_view" TO PUBLIC;

-- Note: RLS policies control actual access

COMMENT ON FUNCTION "asisten".calculate_record_hash IS 'Calculate SHA-256 hash for entity archival';
COMMENT ON FUNCTION "asisten".verify_hash_chain IS 'Verify integrity of archive hash chain for a fiscal year';
COMMENT ON FUNCTION "asisten".archive_paket IS 'Manually archive a paket with all its documents';
COMMENT ON FUNCTION "asisten".refresh_legal_timeline IS 'Refresh the legal timeline materialized view';
