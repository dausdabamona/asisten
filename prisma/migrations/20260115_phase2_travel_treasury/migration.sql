-- =============================================================================
-- ASISTEN - Phase 2: Travel & Treasury Module Migration
-- SQL Migration Script for PostgreSQL (Windows Compatible)
-- Run this AFTER Phase 1 migration
-- =============================================================================

-- =============================================================================
-- NEW ENUM TYPES (Phase 2)
-- =============================================================================

-- Surat Tugas Status Enum
CREATE TYPE asisten."SuratTugasStatus" AS ENUM (
    'DRAFT',
    'MENUNGGU_APPROVAL',
    'APPROVED',
    'REJECTED',
    'FINAL'
);

-- SPPD Status Enum
CREATE TYPE asisten."SppdStatus" AS ENUM (
    'DRAFT',
    'MENUNGGU_ST',
    'TERBIT',
    'BERLANGSUNG',
    'SELESAI',
    'DIBATALKAN'
);

-- Treasury Type Enum
CREATE TYPE asisten."TreasuryType" AS ENUM (
    'UP',
    'TUP'
);

-- Kuitansi Type Enum
CREATE TYPE asisten."KuitansiTipe" AS ENUM (
    'UANG_MUKA',
    'RAMPUNG',
    'OPERASIONAL'
);

-- SPJ Status Enum (Enhanced)
CREATE TYPE asisten."SPJStatus" AS ENUM (
    'DRAFT',
    'DIAJUKAN',
    'DIPERIKSA',
    'DIVERIFIKASI',
    'DISAHKAN',
    'DITOLAK',
    'SELESAI'
);

-- =============================================================================
-- EXTEND DokumenTipe ENUM (Phase 2 Document Types)
-- =============================================================================

ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'KUITANSI_UM';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'KUITANSI_RAMPUNG';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'LAPORAN_SPPD';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SPJ_UP';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SPJ_TUP';

-- =============================================================================
-- NEW TABLE: Workflow Action (Phase 2)
-- =============================================================================

CREATE TABLE asisten.workflow_action (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_stage_id UUID NOT NULL,
    action_code VARCHAR(50) NOT NULL,
    action_name VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    required_role_id UUID,
    next_stage_id UUID,
    is_approval BOOLEAN DEFAULT FALSE,
    urutan INTEGER DEFAULT 0,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_workflow_action_stage FOREIGN KEY (workflow_stage_id)
        REFERENCES asisten.workflow_stage(id),
    CONSTRAINT fk_workflow_action_role FOREIGN KEY (required_role_id)
        REFERENCES asisten.roles(id),
    CONSTRAINT uq_workflow_action UNIQUE (workflow_stage_id, action_code)
);

CREATE INDEX idx_workflow_action_stage_id ON asisten.workflow_action(workflow_stage_id);
CREATE INDEX idx_workflow_action_code ON asisten.workflow_action(action_code);
CREATE INDEX idx_workflow_action_is_deleted ON asisten.workflow_action(is_deleted);

-- =============================================================================
-- NEW TABLE: Tambahan Uang Persediaan (TUP) - Phase 2
-- =============================================================================

CREATE TABLE asisten.tambahan_uang_persediaan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    uang_persediaan_id UUID NOT NULL,
    paket_id UUID,
    tanggal TIMESTAMP NOT NULL,
    nilai DECIMAL(18, 2) NOT NULL,
    sisa DECIMAL(18, 2) NOT NULL,
    alasan TEXT NOT NULL,
    bendahara_id UUID,
    keterangan TEXT,
    status asisten."PembayaranStatus" DEFAULT 'DRAFT',
    batas_waktu TIMESTAMP,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_tup_uang_persediaan FOREIGN KEY (uang_persediaan_id)
        REFERENCES asisten.uang_persediaan(id),
    CONSTRAINT fk_tup_paket FOREIGN KEY (paket_id)
        REFERENCES asisten.paket(id),
    CONSTRAINT fk_tup_bendahara FOREIGN KEY (bendahara_id)
        REFERENCES asisten.users(id)
);

CREATE INDEX idx_tup_uang_persediaan_id ON asisten.tambahan_uang_persediaan(uang_persediaan_id);
CREATE INDEX idx_tup_paket_id ON asisten.tambahan_uang_persediaan(paket_id);
CREATE INDEX idx_tup_tanggal ON asisten.tambahan_uang_persediaan(tanggal);
CREATE INDEX idx_tup_status ON asisten.tambahan_uang_persediaan(status);
CREATE INDEX idx_tup_is_deleted ON asisten.tambahan_uang_persediaan(is_deleted);

-- =============================================================================
-- ALTER TABLE: perjalanan_dinas (Phase 2 Enhancements)
-- =============================================================================

-- Add workflow_instance_id column
ALTER TABLE asisten.perjalanan_dinas
ADD COLUMN IF NOT EXISTS workflow_instance_id UUID;

-- Add financial summary columns
ALTER TABLE asisten.perjalanan_dinas
ADD COLUMN IF NOT EXISTS total_biaya_estimasi DECIMAL(18, 2);

ALTER TABLE asisten.perjalanan_dinas
ADD COLUMN IF NOT EXISTS total_biaya_realisasi DECIMAL(18, 2);

-- Add foreign key constraint
ALTER TABLE asisten.perjalanan_dinas
ADD CONSTRAINT fk_perjalanan_workflow_instance
FOREIGN KEY (workflow_instance_id) REFERENCES asisten.workflow_instance(id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_perjalanan_dinas_workflow_instance_id
ON asisten.perjalanan_dinas(workflow_instance_id);

-- =============================================================================
-- ALTER TABLE: peserta_perjalanan (Phase 2 Enhancements)
-- =============================================================================

-- Add individual cost tracking columns
ALTER TABLE asisten.peserta_perjalanan
ADD COLUMN IF NOT EXISTS uang_harian DECIMAL(18, 2);

ALTER TABLE asisten.peserta_perjalanan
ADD COLUMN IF NOT EXISTS biaya_transport DECIMAL(18, 2);

ALTER TABLE asisten.peserta_perjalanan
ADD COLUMN IF NOT EXISTS biaya_penginapan DECIMAL(18, 2);

ALTER TABLE asisten.peserta_perjalanan
ADD COLUMN IF NOT EXISTS biaya_lainnya DECIMAL(18, 2);

-- =============================================================================
-- ALTER TABLE: surat_tugas (Phase 2 Enhancements)
-- =============================================================================

-- Add dokumen_id column for document engine linkage
ALTER TABLE asisten.surat_tugas
ADD COLUMN IF NOT EXISTS dokumen_id UUID;

-- Add status column
ALTER TABLE asisten.surat_tugas
ADD COLUMN IF NOT EXISTS status asisten."SuratTugasStatus" DEFAULT 'DRAFT';

-- Make perjalanan_dinas_id UNIQUE (one perjalanan has exactly one surat_tugas)
-- First, check and drop existing constraint if not unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'surat_tugas_perjalanan_dinas_id_key'
    ) THEN
        ALTER TABLE asisten.surat_tugas
        ADD CONSTRAINT surat_tugas_perjalanan_dinas_id_key
        UNIQUE (perjalanan_dinas_id);
    END IF;
END $$;

-- Add foreign key constraint for dokumen
ALTER TABLE asisten.surat_tugas
ADD CONSTRAINT fk_surat_tugas_dokumen
FOREIGN KEY (dokumen_id) REFERENCES asisten.dokumen(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_surat_tugas_dokumen_id
ON asisten.surat_tugas(dokumen_id);

CREATE INDEX IF NOT EXISTS idx_surat_tugas_status
ON asisten.surat_tugas(status);

-- =============================================================================
-- ALTER TABLE: sppd (Phase 2 Enhancements)
-- =============================================================================

-- Add dokumen_id column for document engine linkage
ALTER TABLE asisten.sppd
ADD COLUMN IF NOT EXISTS dokumen_id UUID;

-- Add status column
ALTER TABLE asisten.sppd
ADD COLUMN IF NOT EXISTS status asisten."SppdStatus" DEFAULT 'DRAFT';

-- Add foreign key constraint for dokumen
ALTER TABLE asisten.sppd
ADD CONSTRAINT fk_sppd_dokumen
FOREIGN KEY (dokumen_id) REFERENCES asisten.dokumen(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sppd_dokumen_id
ON asisten.sppd(dokumen_id);

CREATE INDEX IF NOT EXISTS idx_sppd_status
ON asisten.sppd(status);

-- =============================================================================
-- ALTER TABLE: uang_persediaan (Phase 2 Enhancements)
-- =============================================================================

-- Add treasury_type column
ALTER TABLE asisten.uang_persediaan
ADD COLUMN IF NOT EXISTS treasury_type asisten."TreasuryType" DEFAULT 'UP';

-- Add index
CREATE INDEX IF NOT EXISTS idx_uang_persediaan_treasury_type
ON asisten.uang_persediaan(treasury_type);

-- =============================================================================
-- ALTER TABLE: kuitansi (Phase 2 Enhancements)
-- =============================================================================

-- Add TUP reference
ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS tup_id UUID;

-- Add perjalanan_dinas reference
ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS perjalanan_dinas_id UUID;

-- Add dokumen_id column for document engine linkage
ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS dokumen_id UUID;

-- Add kuitansi_um_id for RAMPUNG to reference UANG_MUKA
ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS kuitansi_um_id UUID;

-- Add tipe column
ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS tipe asisten."KuitansiTipe" DEFAULT 'OPERASIONAL';

-- Add reconciliation columns
ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS nilai_um DECIMAL(18, 2);

ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS nilai_realisasi DECIMAL(18, 2);

ALTER TABLE asisten.kuitansi
ADD COLUMN IF NOT EXISTS selisih DECIMAL(18, 2);

-- Add foreign key constraints
ALTER TABLE asisten.kuitansi
ADD CONSTRAINT fk_kuitansi_tup
FOREIGN KEY (tup_id) REFERENCES asisten.tambahan_uang_persediaan(id);

ALTER TABLE asisten.kuitansi
ADD CONSTRAINT fk_kuitansi_perjalanan
FOREIGN KEY (perjalanan_dinas_id) REFERENCES asisten.perjalanan_dinas(id);

ALTER TABLE asisten.kuitansi
ADD CONSTRAINT fk_kuitansi_dokumen
FOREIGN KEY (dokumen_id) REFERENCES asisten.dokumen(id);

ALTER TABLE asisten.kuitansi
ADD CONSTRAINT fk_kuitansi_um
FOREIGN KEY (kuitansi_um_id) REFERENCES asisten.kuitansi(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_kuitansi_tup_id
ON asisten.kuitansi(tup_id);

CREATE INDEX IF NOT EXISTS idx_kuitansi_perjalanan_dinas_id
ON asisten.kuitansi(perjalanan_dinas_id);

CREATE INDEX IF NOT EXISTS idx_kuitansi_dokumen_id
ON asisten.kuitansi(dokumen_id);

CREATE INDEX IF NOT EXISTS idx_kuitansi_um_id
ON asisten.kuitansi(kuitansi_um_id);

CREATE INDEX IF NOT EXISTS idx_kuitansi_tipe
ON asisten.kuitansi(tipe);

-- =============================================================================
-- ALTER TABLE: pertanggungjawaban (Phase 2 Enhancements)
-- =============================================================================

-- Add TUP reference
ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS tup_id UUID;

-- Add workflow_instance reference
ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS workflow_instance_id UUID;

-- Add reconciliation columns
ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS total_um DECIMAL(18, 2);

ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS total_realisasi DECIMAL(18, 2);

ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS sisa_lebih DECIMAL(18, 2);

ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS sisa_kurang DECIMAL(18, 2);

-- Add pengesah columns
ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS pengesah_id UUID;

ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS tanggal_pengesahan TIMESTAMP;

-- Change status column type to new SPJStatus enum
-- First, create a new column, migrate data, then drop old and rename
ALTER TABLE asisten.pertanggungjawaban
ADD COLUMN IF NOT EXISTS status_new asisten."SPJStatus" DEFAULT 'DRAFT';

-- Migrate existing status values
UPDATE asisten.pertanggungjawaban
SET status_new = CASE
    WHEN status::text = 'DRAFT' THEN 'DRAFT'::asisten."SPJStatus"
    WHEN status::text = 'DIAJUKAN' THEN 'DIAJUKAN'::asisten."SPJStatus"
    WHEN status::text = 'DIVERIFIKASI' THEN 'DIVERIFIKASI'::asisten."SPJStatus"
    WHEN status::text = 'DIBAYAR' THEN 'SELESAI'::asisten."SPJStatus"
    WHEN status::text = 'DITOLAK' THEN 'DITOLAK'::asisten."SPJStatus"
    ELSE 'DRAFT'::asisten."SPJStatus"
END
WHERE status_new IS NULL OR status_new = 'DRAFT';

-- Drop old status column and rename new one (only if status is PembayaranStatus type)
DO $$
BEGIN
    -- Check if status column is PembayaranStatus type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'asisten'
        AND table_name = 'pertanggungjawaban'
        AND column_name = 'status'
        AND udt_name = 'PembayaranStatus'
    ) THEN
        ALTER TABLE asisten.pertanggungjawaban DROP COLUMN status;
        ALTER TABLE asisten.pertanggungjawaban RENAME COLUMN status_new TO status;
    ELSE
        -- If it's already the right type, just drop the temporary column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'asisten'
            AND table_name = 'pertanggungjawaban'
            AND column_name = 'status_new'
        ) THEN
            ALTER TABLE asisten.pertanggungjawaban DROP COLUMN status_new;
        END IF;
    END IF;
END $$;

-- Add foreign key constraints
ALTER TABLE asisten.pertanggungjawaban
ADD CONSTRAINT fk_spj_tup
FOREIGN KEY (tup_id) REFERENCES asisten.tambahan_uang_persediaan(id);

ALTER TABLE asisten.pertanggungjawaban
ADD CONSTRAINT fk_spj_workflow_instance
FOREIGN KEY (workflow_instance_id) REFERENCES asisten.workflow_instance(id);

ALTER TABLE asisten.pertanggungjawaban
ADD CONSTRAINT fk_spj_pengesah
FOREIGN KEY (pengesah_id) REFERENCES asisten.users(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pertanggungjawaban_tup_id
ON asisten.pertanggungjawaban(tup_id);

CREATE INDEX IF NOT EXISTS idx_pertanggungjawaban_workflow_instance_id
ON asisten.pertanggungjawaban(workflow_instance_id);

-- =============================================================================
-- TRIGGERS FOR updated_at ON NEW TABLES
-- =============================================================================

CREATE TRIGGER update_workflow_action_updated_at
BEFORE UPDATE ON asisten.workflow_action
FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_tambahan_uang_persediaan_updated_at
BEFORE UPDATE ON asisten.tambahan_uang_persediaan
FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

-- =============================================================================
-- BUSINESS RULE FUNCTIONS (Phase 2)
-- =============================================================================

-- Function: Check if Surat Tugas is approved before SPPD can be finalized
CREATE OR REPLACE FUNCTION asisten.check_surat_tugas_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check when status is changing to TERBIT
    IF NEW.status = 'TERBIT' AND (OLD.status IS NULL OR OLD.status != 'TERBIT') THEN
        -- Check if the related Surat Tugas is approved
        IF NOT EXISTS (
            SELECT 1 FROM asisten.surat_tugas st
            WHERE st.perjalanan_dinas_id = NEW.perjalanan_dinas_id
            AND st.status = 'APPROVED'
            AND st.is_deleted = FALSE
        ) THEN
            RAISE EXCEPTION 'SPPD cannot be finalized: Surat Tugas must be approved first';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_surat_tugas_before_sppd
BEFORE UPDATE ON asisten.sppd
FOR EACH ROW EXECUTE FUNCTION asisten.check_surat_tugas_approved();

-- Function: Check UP/TUP allocation before Kuitansi UM
CREATE OR REPLACE FUNCTION asisten.check_up_allocation_for_kuitansi_um()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check for UANG_MUKA type kuitansi
    IF NEW.tipe = 'UANG_MUKA' THEN
        -- Must have either UP or TUP allocation
        IF NEW.uang_persediaan_id IS NULL AND NEW.tup_id IS NULL THEN
            RAISE EXCEPTION 'Kuitansi Uang Muka requires UP or TUP allocation';
        END IF;

        -- Check if UP/TUP has sufficient balance
        IF NEW.uang_persediaan_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM asisten.uang_persediaan up
                WHERE up.id = NEW.uang_persediaan_id
                AND up.sisa >= NEW.nilai
                AND up.is_deleted = FALSE
            ) THEN
                RAISE EXCEPTION 'Insufficient UP balance for Kuitansi Uang Muka';
            END IF;
        END IF;

        IF NEW.tup_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM asisten.tambahan_uang_persediaan tup
                WHERE tup.id = NEW.tup_id
                AND tup.sisa >= NEW.nilai
                AND tup.is_deleted = FALSE
            ) THEN
                RAISE EXCEPTION 'Insufficient TUP balance for Kuitansi Uang Muka';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_up_allocation_kuitansi
BEFORE INSERT OR UPDATE ON asisten.kuitansi
FOR EACH ROW EXECUTE FUNCTION asisten.check_up_allocation_for_kuitansi_um();

-- Function: Validate Kuitansi Rampung reconciliation
CREATE OR REPLACE FUNCTION asisten.validate_kuitansi_rampung()
RETURNS TRIGGER AS $$
DECLARE
    v_nilai_um DECIMAL(18, 2);
BEGIN
    -- Only check for RAMPUNG type kuitansi
    IF NEW.tipe = 'RAMPUNG' THEN
        -- Must reference a UANG_MUKA kuitansi
        IF NEW.kuitansi_um_id IS NULL THEN
            RAISE EXCEPTION 'Kuitansi Rampung must reference a Kuitansi Uang Muka';
        END IF;

        -- Get the UANG_MUKA amount
        SELECT k.nilai INTO v_nilai_um
        FROM asisten.kuitansi k
        WHERE k.id = NEW.kuitansi_um_id
        AND k.tipe = 'UANG_MUKA'
        AND k.is_deleted = FALSE;

        IF v_nilai_um IS NULL THEN
            RAISE EXCEPTION 'Referenced Kuitansi Uang Muka not found or invalid';
        END IF;

        -- Auto-calculate selisih
        NEW.nilai_um := v_nilai_um;
        NEW.selisih := v_nilai_um - COALESCE(NEW.nilai_realisasi, NEW.nilai);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_kuitansi_rampung
BEFORE INSERT OR UPDATE ON asisten.kuitansi
FOR EACH ROW EXECUTE FUNCTION asisten.validate_kuitansi_rampung();

-- Function: Update UP/TUP balance on kuitansi UANG_MUKA
CREATE OR REPLACE FUNCTION asisten.update_up_balance_on_kuitansi()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when kuitansi status changes to DIBAYAR
    IF NEW.status = 'DIBAYAR' AND (OLD.status IS NULL OR OLD.status != 'DIBAYAR') THEN
        -- Update UP balance for UANG_MUKA
        IF NEW.tipe = 'UANG_MUKA' THEN
            IF NEW.uang_persediaan_id IS NOT NULL THEN
                UPDATE asisten.uang_persediaan
                SET sisa = sisa - NEW.nilai,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.uang_persediaan_id;
            END IF;

            IF NEW.tup_id IS NOT NULL THEN
                UPDATE asisten.tambahan_uang_persediaan
                SET sisa = sisa - NEW.nilai,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.tup_id;
            END IF;
        END IF;

        -- Handle RAMPUNG reconciliation
        IF NEW.tipe = 'RAMPUNG' AND NEW.selisih > 0 THEN
            -- Return excess to UP/TUP
            IF NEW.uang_persediaan_id IS NOT NULL THEN
                UPDATE asisten.uang_persediaan
                SET sisa = sisa + NEW.selisih,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.uang_persediaan_id;
            END IF;

            IF NEW.tup_id IS NOT NULL THEN
                UPDATE asisten.tambahan_uang_persediaan
                SET sisa = sisa + NEW.selisih,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.tup_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_up_balance
AFTER UPDATE ON asisten.kuitansi
FOR EACH ROW EXECUTE FUNCTION asisten.update_up_balance_on_kuitansi();

-- Function: Check SPJ balance before workflow can close
CREATE OR REPLACE FUNCTION asisten.check_spj_balance_before_workflow_close()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check when workflow is being completed (moving to ARSIP)
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        -- Check if all linked SPJ are balanced/completed
        IF EXISTS (
            SELECT 1 FROM asisten.pertanggungjawaban spj
            WHERE spj.workflow_instance_id = NEW.id
            AND spj.status NOT IN ('DISAHKAN', 'SELESAI')
            AND spj.is_deleted = FALSE
        ) THEN
            RAISE EXCEPTION 'Workflow cannot be closed: SPJ not yet balanced/completed';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_spj_before_workflow_close
BEFORE UPDATE ON asisten.workflow_instance
FOR EACH ROW EXECUTE FUNCTION asisten.check_spj_balance_before_workflow_close();

-- Function: Log all financial mutations to audit_log
CREATE OR REPLACE FUNCTION asisten.audit_financial_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit log for financial tables
    INSERT INTO asisten.audit_log (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        actor_id,
        created_at,
        updated_at
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to financial tables
CREATE TRIGGER trg_audit_uang_persediaan
AFTER INSERT OR UPDATE OR DELETE ON asisten.uang_persediaan
FOR EACH ROW EXECUTE FUNCTION asisten.audit_financial_mutation();

CREATE TRIGGER trg_audit_tambahan_uang_persediaan
AFTER INSERT OR UPDATE OR DELETE ON asisten.tambahan_uang_persediaan
FOR EACH ROW EXECUTE FUNCTION asisten.audit_financial_mutation();

CREATE TRIGGER trg_audit_kuitansi
AFTER INSERT OR UPDATE OR DELETE ON asisten.kuitansi
FOR EACH ROW EXECUTE FUNCTION asisten.audit_financial_mutation();

CREATE TRIGGER trg_audit_pertanggungjawaban
AFTER INSERT OR UPDATE OR DELETE ON asisten.pertanggungjawaban
FOR EACH ROW EXECUTE FUNCTION asisten.audit_financial_mutation();

-- =============================================================================
-- VIEW: SPPD Complete Status (for reporting)
-- =============================================================================

CREATE OR REPLACE VIEW asisten.v_sppd_status AS
SELECT
    pd.id AS perjalanan_dinas_id,
    pd.nomor AS nomor_perjalanan,
    pd.status AS status_perjalanan,
    st.id AS surat_tugas_id,
    st.nomor AS nomor_surat_tugas,
    st.status AS status_surat_tugas,
    sp.id AS sppd_id,
    sp.nomor AS nomor_sppd,
    sp.status AS status_sppd,
    kum.id AS kuitansi_um_id,
    kum.nomor AS nomor_kuitansi_um,
    kum.nilai AS nilai_um,
    kum.status AS status_kuitansi_um,
    kr.id AS kuitansi_rampung_id,
    kr.nomor AS nomor_kuitansi_rampung,
    kr.nilai_realisasi,
    kr.selisih,
    kr.status AS status_kuitansi_rampung,
    spj.id AS spj_id,
    spj.nomor AS nomor_spj,
    spj.status AS status_spj,
    pd.total_biaya_estimasi,
    pd.total_biaya_realisasi,
    wi.current_stage_id,
    ws.kode AS workflow_stage
FROM asisten.perjalanan_dinas pd
LEFT JOIN asisten.surat_tugas st ON st.perjalanan_dinas_id = pd.id AND st.is_deleted = FALSE
LEFT JOIN asisten.sppd sp ON sp.perjalanan_dinas_id = pd.id AND sp.is_deleted = FALSE
LEFT JOIN asisten.kuitansi kum ON kum.perjalanan_dinas_id = pd.id AND kum.tipe = 'UANG_MUKA' AND kum.is_deleted = FALSE
LEFT JOIN asisten.kuitansi kr ON kr.perjalanan_dinas_id = pd.id AND kr.tipe = 'RAMPUNG' AND kr.is_deleted = FALSE
LEFT JOIN asisten.pertanggungjawaban spj ON spj.perjalanan_dinas_id = pd.id AND spj.is_deleted = FALSE
LEFT JOIN asisten.workflow_instance wi ON wi.id = pd.workflow_instance_id AND wi.is_deleted = FALSE
LEFT JOIN asisten.workflow_stage ws ON ws.id = wi.current_stage_id AND ws.is_deleted = FALSE
WHERE pd.is_deleted = FALSE;

-- =============================================================================
-- VIEW: Treasury Balance Summary
-- =============================================================================

CREATE OR REPLACE VIEW asisten.v_treasury_balance AS
SELECT
    up.id,
    up.nomor,
    up.treasury_type,
    up.nilai AS nilai_awal,
    up.sisa AS saldo_up,
    COALESCE(SUM(tup.nilai), 0) AS total_tup,
    COALESCE(SUM(tup.sisa), 0) AS saldo_tup,
    up.sisa + COALESCE(SUM(tup.sisa), 0) AS total_saldo,
    up.status,
    p.kode AS paket_kode,
    p.nama AS paket_nama
FROM asisten.uang_persediaan up
LEFT JOIN asisten.tambahan_uang_persediaan tup ON tup.uang_persediaan_id = up.id AND tup.is_deleted = FALSE
LEFT JOIN asisten.paket p ON p.id = up.paket_id AND p.is_deleted = FALSE
WHERE up.is_deleted = FALSE
GROUP BY up.id, up.nomor, up.treasury_type, up.nilai, up.sisa, up.status, p.kode, p.nama;

-- =============================================================================
-- END OF PHASE 2 MIGRATION
-- =============================================================================
