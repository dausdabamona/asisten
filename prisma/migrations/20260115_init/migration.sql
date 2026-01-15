-- =============================================================================
-- ASISTEN - Phase 1 Core System
-- SQL Migration Script for PostgreSQL
-- Schema Name: asisten
-- Generated: 2026-01-15
-- =============================================================================

-- =============================================================================
-- SCHEMA & EXTENSIONS
-- =============================================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS asisten;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Workflow State Enum
CREATE TYPE asisten."WorkflowState" AS ENUM (
    'PERENCANAAN',
    'PERSIAPAN',
    'KONTRAK',
    'PELAKSANAAN',
    'PEMBAYARAN',
    'ARSIP'
);

-- Approval Status Enum
CREATE TYPE asisten."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REVISION_REQUESTED'
);

-- Document Type Enum
CREATE TYPE asisten."DokumenTipe" AS ENUM (
    'KONTRAK',
    'ADENDUM',
    'SURAT_TUGAS',
    'SPPD',
    'KUITANSI',
    'LAPORAN',
    'BERITA_ACARA',
    'LAINNYA'
);

-- Document Relation Type Enum
CREATE TYPE asisten."DokumenRelasiTipe" AS ENUM (
    'ADENDUM',
    'REVISI',
    'LAMPIRAN',
    'REFERENSI'
);

-- Travel Status Enum
CREATE TYPE asisten."PerjalananStatus" AS ENUM (
    'DRAFT',
    'DIAJUKAN',
    'DISETUJUI',
    'BERLANGSUNG',
    'SELESAI',
    'DIBATALKAN'
);

-- Payment Status Enum
CREATE TYPE asisten."PembayaranStatus" AS ENUM (
    'DRAFT',
    'DIAJUKAN',
    'DIVERIFIKASI',
    'DIBAYAR',
    'DITOLAK'
);

-- =============================================================================
-- SECURITY TABLES (1-3)
-- =============================================================================

-- Table 1: Users
CREATE TABLE asisten.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(50),
    jabatan VARCHAR(255),
    unit_kerja VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_users_username ON asisten.users(username);
CREATE INDEX idx_users_email ON asisten.users(email);
CREATE INDEX idx_users_is_deleted ON asisten.users(is_deleted);

-- Table 2: Roles
CREATE TABLE asisten.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    level INTEGER DEFAULT 0,
    permissions JSONB,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_roles_kode ON asisten.roles(kode);
CREATE INDEX idx_roles_is_deleted ON asisten.roles(is_deleted);

-- Table 3: User Roles
CREATE TABLE asisten.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES asisten.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
        REFERENCES asisten.roles(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON asisten.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON asisten.user_roles(role_id);
CREATE INDEX idx_user_roles_is_deleted ON asisten.user_roles(is_deleted);

-- =============================================================================
-- BUSINESS OBJECT TABLES (4-5)
-- =============================================================================

-- Table 5: Kegiatan (created first due to FK dependency)
CREATE TABLE asisten.kegiatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(500) NOT NULL,
    deskripsi TEXT,
    tahun_anggaran INTEGER NOT NULL,
    pagu_anggaran DECIMAL(18, 2) NOT NULL,
    unit_kerja VARCHAR(255),
    program VARCHAR(500),

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kegiatan_kode ON asisten.kegiatan(kode);
CREATE INDEX idx_kegiatan_tahun_anggaran ON asisten.kegiatan(tahun_anggaran);
CREATE INDEX idx_kegiatan_is_deleted ON asisten.kegiatan(is_deleted);

-- Table 4: Paket
CREATE TABLE asisten.paket (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(500) NOT NULL,
    deskripsi TEXT,
    tahun_anggaran INTEGER NOT NULL,
    nilai_pagu DECIMAL(18, 2) NOT NULL,
    nilai_kontrak DECIMAL(18, 2),
    tanggal_mulai TIMESTAMP,
    tanggal_selesai TIMESTAMP,
    lokasi VARCHAR(500),
    kegiatan_id UUID,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_paket_kegiatan FOREIGN KEY (kegiatan_id)
        REFERENCES asisten.kegiatan(id)
);

CREATE INDEX idx_paket_kode ON asisten.paket(kode);
CREATE INDEX idx_paket_tahun_anggaran ON asisten.paket(tahun_anggaran);
CREATE INDEX idx_paket_kegiatan_id ON asisten.paket(kegiatan_id);
CREATE INDEX idx_paket_is_deleted ON asisten.paket(is_deleted);

-- =============================================================================
-- WORKFLOW ENGINE TABLES (6-8)
-- =============================================================================

-- Table 6: Workflow Stage
CREATE TABLE asisten.workflow_stage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode asisten."WorkflowState" NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    urutan INTEGER NOT NULL,
    is_initial BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    color VARCHAR(20),

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_workflow_stage_kode ON asisten.workflow_stage(kode);
CREATE INDEX idx_workflow_stage_urutan ON asisten.workflow_stage(urutan);
CREATE INDEX idx_workflow_stage_is_deleted ON asisten.workflow_stage(is_deleted);

-- Table 7: Workflow Instance
CREATE TABLE asisten.workflow_instance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paket_id UUID NOT NULL UNIQUE,
    current_stage_id UUID NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_workflow_instance_paket FOREIGN KEY (paket_id)
        REFERENCES asisten.paket(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_instance_stage FOREIGN KEY (current_stage_id)
        REFERENCES asisten.workflow_stage(id)
);

CREATE INDEX idx_workflow_instance_paket_id ON asisten.workflow_instance(paket_id);
CREATE INDEX idx_workflow_instance_current_stage_id ON asisten.workflow_instance(current_stage_id);
CREATE INDEX idx_workflow_instance_is_active ON asisten.workflow_instance(is_active);
CREATE INDEX idx_workflow_instance_is_deleted ON asisten.workflow_instance(is_deleted);

-- Table 8: Workflow Transition
CREATE TABLE asisten.workflow_transition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id UUID NOT NULL,
    from_stage_id UUID NOT NULL,
    to_stage_id UUID NOT NULL,
    transitioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transitioned_by UUID,
    catatan TEXT,
    metadata JSONB,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_workflow_transition_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES asisten.workflow_instance(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_transition_from_stage FOREIGN KEY (from_stage_id)
        REFERENCES asisten.workflow_stage(id),
    CONSTRAINT fk_workflow_transition_to_stage FOREIGN KEY (to_stage_id)
        REFERENCES asisten.workflow_stage(id)
);

CREATE INDEX idx_workflow_transition_workflow_instance_id ON asisten.workflow_transition(workflow_instance_id);
CREATE INDEX idx_workflow_transition_from_stage_id ON asisten.workflow_transition(from_stage_id);
CREATE INDEX idx_workflow_transition_to_stage_id ON asisten.workflow_transition(to_stage_id);
CREATE INDEX idx_workflow_transition_transitioned_at ON asisten.workflow_transition(transitioned_at);
CREATE INDEX idx_workflow_transition_is_deleted ON asisten.workflow_transition(is_deleted);

-- =============================================================================
-- DOCUMENT ENGINE TABLES (9-11)
-- =============================================================================

-- Table 9: Dokumen
CREATE TABLE asisten.dokumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL,
    judul VARCHAR(500) NOT NULL,
    tipe asisten."DokumenTipe" NOT NULL,
    deskripsi TEXT,
    paket_id UUID NOT NULL,
    workflow_stage_id UUID NOT NULL,
    tanggal_dokumen TIMESTAMP NOT NULL,
    current_version INTEGER DEFAULT 1,
    metadata JSONB,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_dokumen_paket FOREIGN KEY (paket_id)
        REFERENCES asisten.paket(id) ON DELETE CASCADE,
    CONSTRAINT fk_dokumen_workflow_stage FOREIGN KEY (workflow_stage_id)
        REFERENCES asisten.workflow_stage(id),
    CONSTRAINT uq_dokumen_nomor_paket UNIQUE (nomor, paket_id)
);

CREATE INDEX idx_dokumen_paket_id ON asisten.dokumen(paket_id);
CREATE INDEX idx_dokumen_workflow_stage_id ON asisten.dokumen(workflow_stage_id);
CREATE INDEX idx_dokumen_tipe ON asisten.dokumen(tipe);
CREATE INDEX idx_dokumen_tanggal_dokumen ON asisten.dokumen(tanggal_dokumen);
CREATE INDEX idx_dokumen_is_deleted ON asisten.dokumen(is_deleted);

-- Table 10: Dokumen Versi
CREATE TABLE asisten.dokumen_versi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dokumen_id UUID NOT NULL,
    versi INTEGER NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    checksum VARCHAR(64),
    catatan TEXT,
    is_current BOOLEAN DEFAULT FALSE,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_dokumen_versi_dokumen FOREIGN KEY (dokumen_id)
        REFERENCES asisten.dokumen(id) ON DELETE CASCADE,
    CONSTRAINT uq_dokumen_versi UNIQUE (dokumen_id, versi)
);

CREATE INDEX idx_dokumen_versi_dokumen_id ON asisten.dokumen_versi(dokumen_id);
CREATE INDEX idx_dokumen_versi_is_current ON asisten.dokumen_versi(is_current);
CREATE INDEX idx_dokumen_versi_is_deleted ON asisten.dokumen_versi(is_deleted);

-- Table 11: Dokumen Relasi
CREATE TABLE asisten.dokumen_relasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_dokumen_id UUID NOT NULL,
    child_dokumen_id UUID NOT NULL,
    tipe_relasi asisten."DokumenRelasiTipe" NOT NULL,
    catatan TEXT,
    urutan INTEGER,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_dokumen_relasi_parent FOREIGN KEY (parent_dokumen_id)
        REFERENCES asisten.dokumen(id) ON DELETE CASCADE,
    CONSTRAINT fk_dokumen_relasi_child FOREIGN KEY (child_dokumen_id)
        REFERENCES asisten.dokumen(id) ON DELETE CASCADE,
    CONSTRAINT uq_dokumen_relasi UNIQUE (parent_dokumen_id, child_dokumen_id, tipe_relasi)
);

CREATE INDEX idx_dokumen_relasi_parent_dokumen_id ON asisten.dokumen_relasi(parent_dokumen_id);
CREATE INDEX idx_dokumen_relasi_child_dokumen_id ON asisten.dokumen_relasi(child_dokumen_id);
CREATE INDEX idx_dokumen_relasi_tipe_relasi ON asisten.dokumen_relasi(tipe_relasi);
CREATE INDEX idx_dokumen_relasi_is_deleted ON asisten.dokumen_relasi(is_deleted);

-- =============================================================================
-- APPROVAL & AUDIT TABLES (12-13)
-- =============================================================================

-- Table 12: Approval Log
CREATE TABLE asisten.approval_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dokumen_id UUID NOT NULL,
    role_id UUID NOT NULL,
    approver_id UUID NOT NULL,
    status asisten."ApprovalStatus" NOT NULL,
    catatan TEXT,
    approved_at TIMESTAMP,
    metadata JSONB,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_approval_log_dokumen FOREIGN KEY (dokumen_id)
        REFERENCES asisten.dokumen(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_log_role FOREIGN KEY (role_id)
        REFERENCES asisten.roles(id),
    CONSTRAINT fk_approval_log_approver FOREIGN KEY (approver_id)
        REFERENCES asisten.users(id)
);

CREATE INDEX idx_approval_log_dokumen_id ON asisten.approval_log(dokumen_id);
CREATE INDEX idx_approval_log_role_id ON asisten.approval_log(role_id);
CREATE INDEX idx_approval_log_approver_id ON asisten.approval_log(approver_id);
CREATE INDEX idx_approval_log_status ON asisten.approval_log(status);
CREATE INDEX idx_approval_log_approved_at ON asisten.approval_log(approved_at);
CREATE INDEX idx_approval_log_is_deleted ON asisten.approval_log(is_deleted);

-- Table 13: Audit Log (IMMUTABLE - only INSERT allowed)
CREATE TABLE asisten.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    actor_id UUID REFERENCES asisten.users(id),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    -- Standard audit fields (note: updated_at/updated_by won't be used)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_audit_log_table_name ON asisten.audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON asisten.audit_log(record_id);
CREATE INDEX idx_audit_log_action ON asisten.audit_log(action);
CREATE INDEX idx_audit_log_actor_id ON asisten.audit_log(actor_id);
CREATE INDEX idx_audit_log_created_at ON asisten.audit_log(created_at);

-- Create rule to prevent UPDATE on audit_log
CREATE RULE audit_log_no_update AS ON UPDATE TO asisten.audit_log
    DO INSTEAD NOTHING;

-- Create rule to prevent DELETE on audit_log
CREATE RULE audit_log_no_delete AS ON DELETE TO asisten.audit_log
    DO INSTEAD NOTHING;

-- =============================================================================
-- SPPD CORE TABLES (14-17)
-- =============================================================================

-- Table 14: Perjalanan Dinas
CREATE TABLE asisten.perjalanan_dinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID,
    maksud_perjalanan TEXT NOT NULL,
    kota_asal VARCHAR(255) NOT NULL,
    kota_tujuan VARCHAR(255) NOT NULL,
    tanggal_berangkat TIMESTAMP NOT NULL,
    tanggal_kembali TIMESTAMP NOT NULL,
    lama_hari INTEGER NOT NULL,
    status asisten."PerjalananStatus" DEFAULT 'DRAFT',
    catatan TEXT,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_perjalanan_dinas_paket FOREIGN KEY (paket_id)
        REFERENCES asisten.paket(id)
);

CREATE INDEX idx_perjalanan_dinas_paket_id ON asisten.perjalanan_dinas(paket_id);
CREATE INDEX idx_perjalanan_dinas_tanggal_berangkat ON asisten.perjalanan_dinas(tanggal_berangkat);
CREATE INDEX idx_perjalanan_dinas_tanggal_kembali ON asisten.perjalanan_dinas(tanggal_kembali);
CREATE INDEX idx_perjalanan_dinas_status ON asisten.perjalanan_dinas(status);
CREATE INDEX idx_perjalanan_dinas_is_deleted ON asisten.perjalanan_dinas(is_deleted);

-- Table 15: Peserta Perjalanan
CREATE TABLE asisten.peserta_perjalanan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perjalanan_dinas_id UUID NOT NULL,
    user_id UUID NOT NULL,
    tingkat_biaya VARCHAR(50),
    golongan VARCHAR(20),
    jabatan_perjalanan VARCHAR(255),
    is_ketua BOOLEAN DEFAULT FALSE,
    catatan TEXT,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_peserta_perjalanan_perjalanan FOREIGN KEY (perjalanan_dinas_id)
        REFERENCES asisten.perjalanan_dinas(id) ON DELETE CASCADE,
    CONSTRAINT fk_peserta_perjalanan_user FOREIGN KEY (user_id)
        REFERENCES asisten.users(id),
    CONSTRAINT uq_peserta_perjalanan UNIQUE (perjalanan_dinas_id, user_id)
);

CREATE INDEX idx_peserta_perjalanan_perjalanan_dinas_id ON asisten.peserta_perjalanan(perjalanan_dinas_id);
CREATE INDEX idx_peserta_perjalanan_user_id ON asisten.peserta_perjalanan(user_id);
CREATE INDEX idx_peserta_perjalanan_is_deleted ON asisten.peserta_perjalanan(is_deleted);

-- Table 16: Surat Tugas
CREATE TABLE asisten.surat_tugas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    perjalanan_dinas_id UUID NOT NULL,
    tanggal_surat TIMESTAMP NOT NULL,
    perihal TEXT NOT NULL,
    dasar TEXT,
    penanda_tangan_id UUID REFERENCES asisten.users(id),
    jabatan_penanda VARCHAR(255),
    file_path VARCHAR(1000),

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_surat_tugas_perjalanan FOREIGN KEY (perjalanan_dinas_id)
        REFERENCES asisten.perjalanan_dinas(id) ON DELETE CASCADE
);

CREATE INDEX idx_surat_tugas_perjalanan_dinas_id ON asisten.surat_tugas(perjalanan_dinas_id);
CREATE INDEX idx_surat_tugas_tanggal_surat ON asisten.surat_tugas(tanggal_surat);
CREATE INDEX idx_surat_tugas_is_deleted ON asisten.surat_tugas(is_deleted);

-- Table 17: SPPD
CREATE TABLE asisten.sppd (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    perjalanan_dinas_id UUID NOT NULL,
    tanggal_sppd TIMESTAMP NOT NULL,
    pejabat_pemberi_id UUID REFERENCES asisten.users(id),
    jabatan_pemberi VARCHAR(255),
    instansi VARCHAR(255),
    mata_anggaran VARCHAR(100),
    keterangan TEXT,
    file_path VARCHAR(1000),

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_sppd_perjalanan FOREIGN KEY (perjalanan_dinas_id)
        REFERENCES asisten.perjalanan_dinas(id) ON DELETE CASCADE
);

CREATE INDEX idx_sppd_perjalanan_dinas_id ON asisten.sppd(perjalanan_dinas_id);
CREATE INDEX idx_sppd_tanggal_sppd ON asisten.sppd(tanggal_sppd);
CREATE INDEX idx_sppd_is_deleted ON asisten.sppd(is_deleted);

-- =============================================================================
-- FINANCE CORE TABLES (18-20)
-- =============================================================================

-- Table 18: Uang Persediaan
CREATE TABLE asisten.uang_persediaan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID,
    tanggal TIMESTAMP NOT NULL,
    nilai DECIMAL(18, 2) NOT NULL,
    sisa DECIMAL(18, 2) NOT NULL,
    bendahara_id UUID REFERENCES asisten.users(id),
    keterangan TEXT,
    status asisten."PembayaranStatus" DEFAULT 'DRAFT',

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_uang_persediaan_paket FOREIGN KEY (paket_id)
        REFERENCES asisten.paket(id)
);

CREATE INDEX idx_uang_persediaan_paket_id ON asisten.uang_persediaan(paket_id);
CREATE INDEX idx_uang_persediaan_tanggal ON asisten.uang_persediaan(tanggal);
CREATE INDEX idx_uang_persediaan_status ON asisten.uang_persediaan(status);
CREATE INDEX idx_uang_persediaan_is_deleted ON asisten.uang_persediaan(is_deleted);

-- Table 19: Kuitansi
CREATE TABLE asisten.kuitansi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    uang_persediaan_id UUID,
    tanggal TIMESTAMP NOT NULL,
    uraian TEXT NOT NULL,
    nilai DECIMAL(18, 2) NOT NULL,
    penerima VARCHAR(255) NOT NULL,
    jenis_belanja VARCHAR(100),
    bukti_pendukung VARCHAR(1000),
    status asisten."PembayaranStatus" DEFAULT 'DRAFT',

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_kuitansi_uang_persediaan FOREIGN KEY (uang_persediaan_id)
        REFERENCES asisten.uang_persediaan(id)
);

CREATE INDEX idx_kuitansi_uang_persediaan_id ON asisten.kuitansi(uang_persediaan_id);
CREATE INDEX idx_kuitansi_tanggal ON asisten.kuitansi(tanggal);
CREATE INDEX idx_kuitansi_status ON asisten.kuitansi(status);
CREATE INDEX idx_kuitansi_is_deleted ON asisten.kuitansi(is_deleted);

-- Table 20: Pertanggungjawaban
CREATE TABLE asisten.pertanggungjawaban (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    uang_persediaan_id UUID,
    perjalanan_dinas_id UUID,
    kuitansi_id UUID,
    tanggal TIMESTAMP NOT NULL,
    jenis VARCHAR(100) NOT NULL,
    total_nilai DECIMAL(18, 2) NOT NULL,
    status asisten."PembayaranStatus" DEFAULT 'DRAFT',
    verifikator_id UUID REFERENCES asisten.users(id),
    tanggal_verifikasi TIMESTAMP,
    catatan_verifikasi TEXT,

    -- Standard audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_pertanggungjawaban_uang_persediaan FOREIGN KEY (uang_persediaan_id)
        REFERENCES asisten.uang_persediaan(id),
    CONSTRAINT fk_pertanggungjawaban_perjalanan FOREIGN KEY (perjalanan_dinas_id)
        REFERENCES asisten.perjalanan_dinas(id),
    CONSTRAINT fk_pertanggungjawaban_kuitansi FOREIGN KEY (kuitansi_id)
        REFERENCES asisten.kuitansi(id)
);

CREATE INDEX idx_pertanggungjawaban_uang_persediaan_id ON asisten.pertanggungjawaban(uang_persediaan_id);
CREATE INDEX idx_pertanggungjawaban_perjalanan_dinas_id ON asisten.pertanggungjawaban(perjalanan_dinas_id);
CREATE INDEX idx_pertanggungjawaban_kuitansi_id ON asisten.pertanggungjawaban(kuitansi_id);
CREATE INDEX idx_pertanggungjawaban_tanggal ON asisten.pertanggungjawaban(tanggal);
CREATE INDEX idx_pertanggungjawaban_status ON asisten.pertanggungjawaban(status);
CREATE INDEX idx_pertanggungjawaban_is_deleted ON asisten.pertanggungjawaban(is_deleted);

-- =============================================================================
-- TRIGGER FUNCTION FOR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION asisten.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables except audit_log
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON asisten.users
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON asisten.roles
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON asisten.user_roles
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_kegiatan_updated_at BEFORE UPDATE ON asisten.kegiatan
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_paket_updated_at BEFORE UPDATE ON asisten.paket
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_workflow_stage_updated_at BEFORE UPDATE ON asisten.workflow_stage
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_workflow_instance_updated_at BEFORE UPDATE ON asisten.workflow_instance
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_workflow_transition_updated_at BEFORE UPDATE ON asisten.workflow_transition
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_dokumen_updated_at BEFORE UPDATE ON asisten.dokumen
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_dokumen_versi_updated_at BEFORE UPDATE ON asisten.dokumen_versi
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_dokumen_relasi_updated_at BEFORE UPDATE ON asisten.dokumen_relasi
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_approval_log_updated_at BEFORE UPDATE ON asisten.approval_log
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_perjalanan_dinas_updated_at BEFORE UPDATE ON asisten.perjalanan_dinas
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_peserta_perjalanan_updated_at BEFORE UPDATE ON asisten.peserta_perjalanan
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_surat_tugas_updated_at BEFORE UPDATE ON asisten.surat_tugas
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_sppd_updated_at BEFORE UPDATE ON asisten.sppd
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_uang_persediaan_updated_at BEFORE UPDATE ON asisten.uang_persediaan
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_kuitansi_updated_at BEFORE UPDATE ON asisten.kuitansi
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

CREATE TRIGGER update_pertanggungjawaban_updated_at BEFORE UPDATE ON asisten.pertanggungjawaban
    FOR EACH ROW EXECUTE FUNCTION asisten.update_updated_at_column();

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
