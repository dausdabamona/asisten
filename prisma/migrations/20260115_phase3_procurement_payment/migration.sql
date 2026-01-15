-- =============================================================================
-- ASISTEN Phase 3: Procurement Contract & Payment Lifecycle Migration
-- PostgreSQL Database Migration
-- Schema Name: asisten
-- =============================================================================

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- NEW ENUMS FOR PHASE 3
-- =============================================================================

-- Procurement Status Enums
CREATE TYPE asisten."KAKStatus" AS ENUM ('DRAFT', 'MENUNGGU_APPROVAL', 'APPROVED', 'REJECTED', 'FINAL');
CREATE TYPE asisten."HPSStatus" AS ENUM ('DRAFT', 'MENUNGGU_APPROVAL', 'APPROVED', 'REJECTED', 'FINAL');
CREATE TYPE asisten."KontrakStatus" AS ENUM ('DRAFT', 'NEGOSIASI', 'MENUNGGU_TTD', 'AKTIF', 'SELESAI', 'DIBATALKAN', 'DIPUTUS');
CREATE TYPE asisten."SPMKStatus" AS ENUM ('DRAFT', 'TERBIT', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN');
CREATE TYPE asisten."BASTStatus" AS ENUM ('DRAFT', 'DIAJUKAN', 'DIPERIKSA', 'DIVERIFIKASI', 'DITERIMA', 'DITOLAK');

-- Payment Status Enums
CREATE TYPE asisten."SPPStatus" AS ENUM ('DRAFT', 'DIAJUKAN', 'DIVERIFIKASI', 'APPROVED', 'REJECTED', 'TERBIT_SPM');
CREATE TYPE asisten."SPMStatus" AS ENUM ('DRAFT', 'TERBIT', 'DIAJUKAN_SP2D', 'SELESAI');
CREATE TYPE asisten."SP2DStatus" AS ENUM ('DRAFT', 'TERBIT', 'DICAIRKAN', 'SELESAI');

-- Procurement Type Enums
CREATE TYPE asisten."JenisPengadaan" AS ENUM ('BARANG', 'JASA_KONSULTANSI', 'JASA_LAINNYA', 'PEKERJAAN_KONSTRUKSI');
CREATE TYPE asisten."MetodePengadaan" AS ENUM ('PENGADAAN_LANGSUNG', 'PENUNJUKAN_LANGSUNG', 'TENDER', 'SELEKSI', 'E_PURCHASING');

-- Document Signing Enum
CREATE TYPE asisten."SignedMethod" AS ENUM ('MANUAL_SCAN');

-- =============================================================================
-- ALTER EXISTING TABLES FOR PHASE 3
-- =============================================================================

-- Add new document types to DokumenTipe enum
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'KAK';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'HPS';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'RANCANGAN_KONTRAK';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SSUK';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SSKK';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SPMK';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'ADENDUM_KONTRAK';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'BA_KEMAJUAN';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'BAHP';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'BAST';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SPP';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SPM';
ALTER TYPE asisten."DokumenTipe" ADD VALUE IF NOT EXISTS 'SP2D';

-- Add signed document fields to dokumen_versi
ALTER TABLE asisten.dokumen_versi
ADD COLUMN IF NOT EXISTS signed_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS signed_by_role VARCHAR(255),
ADD COLUMN IF NOT EXISTS signed_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS signed_method asisten."SignedMethod",
ADD COLUMN IF NOT EXISTS signed_file_path VARCHAR(1000),
ADD COLUMN IF NOT EXISTS signed_file_hash VARCHAR(64);

-- Add index for signed_file_hash
CREATE INDEX IF NOT EXISTS idx_dokumen_versi_signed_file_hash ON asisten.dokumen_versi(signed_file_hash);

-- Add dokumen_versi_id to approval_log
ALTER TABLE asisten.approval_log
ADD COLUMN IF NOT EXISTS dokumen_versi_id UUID REFERENCES asisten.dokumen_versi(id);

CREATE INDEX IF NOT EXISTS idx_approval_log_dokumen_versi_id ON asisten.approval_log(dokumen_versi_id);

-- =============================================================================
-- PHASE 3: PROCUREMENT CONTRACT TABLES (23-33)
-- =============================================================================

-- Table 23: KAK - Kerangka Acuan Kerja (Terms of Reference)
CREATE TABLE asisten.kak (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    judul VARCHAR(500) NOT NULL,
    latar_belakang TEXT,
    maksud_tujuan TEXT,
    sasaran TEXT,
    ruang_lingkup TEXT,
    keluaran TEXT,
    jangka_waktu INTEGER,
    spesifikasi JSONB,
    jenis_pengadaan asisten."JenisPengadaan",
    metode_pengadaan asisten."MetodePengadaan",
    nilai_pagu DECIMAL(18,2) NOT NULL,
    ppk_id UUID REFERENCES asisten.users(id),
    status asisten."KAKStatus" NOT NULL DEFAULT 'DRAFT',
    tanggal_kak TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kak_paket_id ON asisten.kak(paket_id);
CREATE INDEX idx_kak_dokumen_id ON asisten.kak(dokumen_id);
CREATE INDEX idx_kak_status ON asisten.kak(status);
CREATE INDEX idx_kak_tanggal_kak ON asisten.kak(tanggal_kak);
CREATE INDEX idx_kak_is_deleted ON asisten.kak(is_deleted);

-- Table 24: HPS - Harga Perkiraan Sendiri (Owner's Estimate)
CREATE TABLE asisten.hps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    kak_id UUID NOT NULL REFERENCES asisten.kak(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_hps TIMESTAMP NOT NULL,
    nilai_hps DECIMAL(18,2) NOT NULL,
    komponen_biaya JSONB,
    dasar_penyusun TEXT,
    penyusun_id UUID REFERENCES asisten.users(id),
    status asisten."HPSStatus" NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_hps_paket_id ON asisten.hps(paket_id);
CREATE INDEX idx_hps_kak_id ON asisten.hps(kak_id);
CREATE INDEX idx_hps_dokumen_id ON asisten.hps(dokumen_id);
CREATE INDEX idx_hps_status ON asisten.hps(status);
CREATE INDEX idx_hps_tanggal_hps ON asisten.hps(tanggal_hps);
CREATE INDEX idx_hps_is_deleted ON asisten.hps(is_deleted);

-- Table 25: Rancangan Kontrak - Draft Contract
CREATE TABLE asisten.rancangan_kontrak (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    hps_id UUID NOT NULL REFERENCES asisten.hps(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    judul VARCHAR(500) NOT NULL,
    isi_kontrak TEXT,
    nilai_kontrak DECIMAL(18,2) NOT NULL,
    jangka_waktu INTEGER,
    tanggal_draft TIMESTAMP NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_rancangan_kontrak_hps_id ON asisten.rancangan_kontrak(hps_id);
CREATE INDEX idx_rancangan_kontrak_dokumen_id ON asisten.rancangan_kontrak(dokumen_id);
CREATE INDEX idx_rancangan_kontrak_tanggal_draft ON asisten.rancangan_kontrak(tanggal_draft);
CREATE INDEX idx_rancangan_kontrak_is_deleted ON asisten.rancangan_kontrak(is_deleted);

-- Table 26: Kontrak - Contract
CREATE TABLE asisten.kontrak (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    rancangan_kontrak_id UUID REFERENCES asisten.rancangan_kontrak(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    judul VARCHAR(500) NOT NULL,
    nama_penyedia VARCHAR(255) NOT NULL,
    alamat_penyedia TEXT,
    npwp_penyedia VARCHAR(30),
    nilai_kontrak DECIMAL(18,2) NOT NULL,
    nilai_ppn DECIMAL(18,2),
    nilai_pph DECIMAL(18,2),
    tanggal_kontrak TIMESTAMP NOT NULL,
    tanggal_mulai TIMESTAMP,
    tanggal_selesai TIMESTAMP,
    jangka_waktu INTEGER,
    ppk_id UUID REFERENCES asisten.users(id),
    status asisten."KontrakStatus" NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kontrak_paket_id ON asisten.kontrak(paket_id);
CREATE INDEX idx_kontrak_rancangan_kontrak_id ON asisten.kontrak(rancangan_kontrak_id);
CREATE INDEX idx_kontrak_dokumen_id ON asisten.kontrak(dokumen_id);
CREATE INDEX idx_kontrak_status ON asisten.kontrak(status);
CREATE INDEX idx_kontrak_tanggal_kontrak ON asisten.kontrak(tanggal_kontrak);
CREATE INDEX idx_kontrak_is_deleted ON asisten.kontrak(is_deleted);

-- Table 27: SSUK - Syarat-Syarat Umum Kontrak
CREATE TABLE asisten.ssuk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id) ON DELETE CASCADE,
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    isi_ssuk TEXT,
    file_path VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ssuk_kontrak_id ON asisten.ssuk(kontrak_id);
CREATE INDEX idx_ssuk_dokumen_id ON asisten.ssuk(dokumen_id);
CREATE INDEX idx_ssuk_is_deleted ON asisten.ssuk(is_deleted);

-- Table 28: SSKK - Syarat-Syarat Khusus Kontrak
CREATE TABLE asisten.sskk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id) ON DELETE CASCADE,
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    isi_sskk TEXT,
    file_path VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sskk_kontrak_id ON asisten.sskk(kontrak_id);
CREATE INDEX idx_sskk_dokumen_id ON asisten.sskk(dokumen_id);
CREATE INDEX idx_sskk_is_deleted ON asisten.sskk(is_deleted);

-- Table 29: SPMK - Surat Perintah Mulai Kerja
CREATE TABLE asisten.spmk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_spmk TIMESTAMP NOT NULL,
    tanggal_mulai TIMESTAMP NOT NULL,
    tanggal_selesai TIMESTAMP NOT NULL,
    ppk_id UUID REFERENCES asisten.users(id),
    status asisten."SPMKStatus" NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_spmk_paket_id ON asisten.spmk(paket_id);
CREATE INDEX idx_spmk_kontrak_id ON asisten.spmk(kontrak_id);
CREATE INDEX idx_spmk_dokumen_id ON asisten.spmk(dokumen_id);
CREATE INDEX idx_spmk_status ON asisten.spmk(status);
CREATE INDEX idx_spmk_tanggal_spmk ON asisten.spmk(tanggal_spmk);
CREATE INDEX idx_spmk_is_deleted ON asisten.spmk(is_deleted);

-- Table 30: Adendum Kontrak - Contract Amendment
CREATE TABLE asisten.adendum_kontrak (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id) ON DELETE CASCADE,
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    nomor_adendum INTEGER NOT NULL,
    tanggal_adendum TIMESTAMP NOT NULL,
    perihal VARCHAR(500) NOT NULL,
    perubahan TEXT,
    nilai_sebelum DECIMAL(18,2),
    nilai_sesudah DECIMAL(18,2),
    waktu_sebelum INTEGER,
    waktu_sesudah INTEGER,
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_adendum_kontrak_kontrak_id ON asisten.adendum_kontrak(kontrak_id);
CREATE INDEX idx_adendum_kontrak_dokumen_id ON asisten.adendum_kontrak(dokumen_id);
CREATE INDEX idx_adendum_kontrak_tanggal_adendum ON asisten.adendum_kontrak(tanggal_adendum);
CREATE INDEX idx_adendum_kontrak_is_deleted ON asisten.adendum_kontrak(is_deleted);

-- Table 31: BA Kemajuan - Berita Acara Kemajuan (Progress Report)
CREATE TABLE asisten.ba_kemajuan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id) ON DELETE CASCADE,
    spmk_id UUID REFERENCES asisten.spmk(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_ba TIMESTAMP NOT NULL,
    periode_dari TIMESTAMP NOT NULL,
    periode_sampai TIMESTAMP NOT NULL,
    persentase_fisik DECIMAL(5,2) NOT NULL,
    persentase_waktu DECIMAL(5,2) NOT NULL,
    uraian_kemajuan TEXT,
    kendala TEXT,
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ba_kemajuan_kontrak_id ON asisten.ba_kemajuan(kontrak_id);
CREATE INDEX idx_ba_kemajuan_spmk_id ON asisten.ba_kemajuan(spmk_id);
CREATE INDEX idx_ba_kemajuan_dokumen_id ON asisten.ba_kemajuan(dokumen_id);
CREATE INDEX idx_ba_kemajuan_tanggal_ba ON asisten.ba_kemajuan(tanggal_ba);
CREATE INDEX idx_ba_kemajuan_is_deleted ON asisten.ba_kemajuan(is_deleted);

-- Table 32: BAHP - Berita Acara Hasil Pemeriksaan (Inspection Report)
CREATE TABLE asisten.bahp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id) ON DELETE CASCADE,
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_bahp TIMESTAMP NOT NULL,
    hasil_pemeriksaan TEXT,
    rekomendasi TEXT,
    sesuai_kontrak BOOLEAN NOT NULL DEFAULT FALSE,
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bahp_kontrak_id ON asisten.bahp(kontrak_id);
CREATE INDEX idx_bahp_dokumen_id ON asisten.bahp(dokumen_id);
CREATE INDEX idx_bahp_tanggal_bahp ON asisten.bahp(tanggal_bahp);
CREATE INDEX idx_bahp_is_deleted ON asisten.bahp(is_deleted);

-- Table 33: BAST - Berita Acara Serah Terima (Handover Report)
CREATE TABLE asisten.bast (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id),
    bahp_id UUID REFERENCES asisten.bahp(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_bast TIMESTAMP NOT NULL,
    jenis_serah VARCHAR(50) NOT NULL,
    uraian_pekerjaan TEXT,
    nilai_pekerjaan DECIMAL(18,2) NOT NULL,
    ppk_id UUID REFERENCES asisten.users(id),
    penerima_id UUID REFERENCES asisten.users(id),
    status asisten."BASTStatus" NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bast_paket_id ON asisten.bast(paket_id);
CREATE INDEX idx_bast_kontrak_id ON asisten.bast(kontrak_id);
CREATE INDEX idx_bast_bahp_id ON asisten.bast(bahp_id);
CREATE INDEX idx_bast_dokumen_id ON asisten.bast(dokumen_id);
CREATE INDEX idx_bast_status ON asisten.bast(status);
CREATE INDEX idx_bast_tanggal_bast ON asisten.bast(tanggal_bast);
CREATE INDEX idx_bast_is_deleted ON asisten.bast(is_deleted);

-- =============================================================================
-- PHASE 3: PAYMENT TABLES (34-39)
-- =============================================================================

-- Table 34: SPP - Surat Permintaan Pembayaran (Payment Request)
CREATE TABLE asisten.spp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    kontrak_id UUID REFERENCES asisten.kontrak(id),
    bast_id UUID REFERENCES asisten.bast(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_spp TIMESTAMP NOT NULL,
    jenis_spp VARCHAR(50) NOT NULL,
    nilai_tagihan DECIMAL(18,2) NOT NULL,
    nilai_ppn DECIMAL(18,2),
    nilai_pph DECIMAL(18,2),
    nilai_potongan DECIMAL(18,2),
    nilai_bersih DECIMAL(18,2) NOT NULL,
    ppk_id UUID REFERENCES asisten.users(id),
    status asisten."SPPStatus" NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_spp_paket_id ON asisten.spp(paket_id);
CREATE INDEX idx_spp_kontrak_id ON asisten.spp(kontrak_id);
CREATE INDEX idx_spp_bast_id ON asisten.spp(bast_id);
CREATE INDEX idx_spp_dokumen_id ON asisten.spp(dokumen_id);
CREATE INDEX idx_spp_status ON asisten.spp(status);
CREATE INDEX idx_spp_tanggal_spp ON asisten.spp(tanggal_spp);
CREATE INDEX idx_spp_is_deleted ON asisten.spp(is_deleted);

-- Table 35: SPP Detail - Payment Request Line Items
CREATE TABLE asisten.spp_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spp_id UUID NOT NULL REFERENCES asisten.spp(id) ON DELETE CASCADE,
    urutan INTEGER NOT NULL,
    uraian TEXT NOT NULL,
    volume DECIMAL(18,4),
    satuan VARCHAR(50),
    harga_satuan DECIMAL(18,2),
    jumlah DECIMAL(18,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_spp_detail_spp_id ON asisten.spp_detail(spp_id);
CREATE INDEX idx_spp_detail_is_deleted ON asisten.spp_detail(is_deleted);

-- Table 36: SPM - Surat Perintah Membayar (Payment Order)
CREATE TABLE asisten.spm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    spp_id UUID NOT NULL REFERENCES asisten.spp(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_spm TIMESTAMP NOT NULL,
    jenis_spm VARCHAR(50) NOT NULL,
    nilai_spm DECIMAL(18,2) NOT NULL,
    kuasa_pa_id UUID REFERENCES asisten.users(id),
    status asisten."SPMStatus" NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_spm_paket_id ON asisten.spm(paket_id);
CREATE INDEX idx_spm_spp_id ON asisten.spm(spp_id);
CREATE INDEX idx_spm_dokumen_id ON asisten.spm(dokumen_id);
CREATE INDEX idx_spm_status ON asisten.spm(status);
CREATE INDEX idx_spm_tanggal_spm ON asisten.spm(tanggal_spm);
CREATE INDEX idx_spm_is_deleted ON asisten.spm(is_deleted);

-- Table 37: SP2D - Surat Perintah Pencairan Dana (Disbursement Order)
CREATE TABLE asisten.sp2d (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(100) NOT NULL UNIQUE,
    paket_id UUID NOT NULL REFERENCES asisten.paket(id) ON DELETE CASCADE,
    spm_id UUID NOT NULL REFERENCES asisten.spm(id),
    dokumen_id UUID REFERENCES asisten.dokumen(id),
    tanggal_sp2d TIMESTAMP NOT NULL,
    nilai_sp2d DECIMAL(18,2) NOT NULL,
    bank_penerima VARCHAR(100),
    rekening_penerima VARCHAR(50),
    nama_penerima VARCHAR(255),
    kuasa_bud_id UUID REFERENCES asisten.users(id),
    tanggal_cair TIMESTAMP,
    status asisten."SP2DStatus" NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sp2d_paket_id ON asisten.sp2d(paket_id);
CREATE INDEX idx_sp2d_spm_id ON asisten.sp2d(spm_id);
CREATE INDEX idx_sp2d_dokumen_id ON asisten.sp2d(dokumen_id);
CREATE INDEX idx_sp2d_status ON asisten.sp2d(status);
CREATE INDEX idx_sp2d_tanggal_sp2d ON asisten.sp2d(tanggal_sp2d);
CREATE INDEX idx_sp2d_is_deleted ON asisten.sp2d(is_deleted);

-- Table 38: Potongan Pajak - Tax Deductions
CREATE TABLE asisten.potongan_pajak (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spp_id UUID NOT NULL REFERENCES asisten.spp(id) ON DELETE CASCADE,
    jenis_pajak VARCHAR(50) NOT NULL,
    dasar_pajak DECIMAL(18,2) NOT NULL,
    tarif DECIMAL(5,2) NOT NULL,
    nilai_pajak DECIMAL(18,2) NOT NULL,
    npwp VARCHAR(30),
    nama_wp VARCHAR(255),
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_potongan_pajak_spp_id ON asisten.potongan_pajak(spp_id);
CREATE INDEX idx_potongan_pajak_jenis_pajak ON asisten.potongan_pajak(jenis_pajak);
CREATE INDEX idx_potongan_pajak_is_deleted ON asisten.potongan_pajak(is_deleted);

-- Table 39: Rekening Penyedia - Vendor Bank Account
CREATE TABLE asisten.rekening_penyedia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kontrak_id UUID NOT NULL REFERENCES asisten.kontrak(id) ON DELETE CASCADE,
    nama_bank VARCHAR(100) NOT NULL,
    cabang_bank VARCHAR(100),
    nomor_rekening VARCHAR(50) NOT NULL,
    nama_rekening VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES asisten.users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES asisten.users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_rekening_penyedia_kontrak_id ON asisten.rekening_penyedia(kontrak_id);
CREATE INDEX idx_rekening_penyedia_is_deleted ON asisten.rekening_penyedia(is_deleted);

-- =============================================================================
-- BUSINESS RULE TRIGGERS FOR PHASE 3
-- =============================================================================

-- Trigger: SPMK requires approved KAK, HPS, and signed Kontrak
CREATE OR REPLACE FUNCTION asisten.check_spmk_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if kontrak exists and is active (signed)
    IF NOT EXISTS (
        SELECT 1 FROM asisten.kontrak k
        WHERE k.id = NEW.kontrak_id
        AND k.status = 'AKTIF'
        AND k.is_deleted = FALSE
    ) THEN
        RAISE EXCEPTION 'SPMK requires an active (signed) contract';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_spmk_prerequisites
    BEFORE INSERT OR UPDATE ON asisten.spmk
    FOR EACH ROW
    EXECUTE FUNCTION asisten.check_spmk_prerequisites();

-- Trigger: BAST requires approved BAHP
CREATE OR REPLACE FUNCTION asisten.check_bast_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
    -- If bahp_id is provided, check if it's a valid inspection with positive result
    IF NEW.bahp_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM asisten.bahp b
            WHERE b.id = NEW.bahp_id
            AND b.sesuai_kontrak = TRUE
            AND b.is_deleted = FALSE
        ) THEN
            RAISE EXCEPTION 'BAST requires an approved BAHP (inspection report with sesuai_kontrak = TRUE)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_bast_prerequisites
    BEFORE INSERT OR UPDATE ON asisten.bast
    FOR EACH ROW
    EXECUTE FUNCTION asisten.check_bast_prerequisites();

-- Trigger: SPP requires final BAST for LS (direct payment)
CREATE OR REPLACE FUNCTION asisten.check_spp_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
    -- For direct payment (LS), BAST is required
    IF NEW.jenis_spp = 'LS' AND NEW.bast_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM asisten.bast b
            WHERE b.id = NEW.bast_id
            AND b.status = 'DITERIMA'
            AND b.is_deleted = FALSE
        ) THEN
            RAISE EXCEPTION 'SPP-LS requires an accepted BAST (status = DITERIMA)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_spp_prerequisites
    BEFORE INSERT OR UPDATE ON asisten.spp
    FOR EACH ROW
    EXECUTE FUNCTION asisten.check_spp_prerequisites();

-- Trigger: SPM requires approved SPP
CREATE OR REPLACE FUNCTION asisten.check_spm_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM asisten.spp s
        WHERE s.id = NEW.spp_id
        AND s.status = 'APPROVED'
        AND s.is_deleted = FALSE
    ) THEN
        RAISE EXCEPTION 'SPM requires an approved SPP';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_spm_prerequisites
    BEFORE INSERT OR UPDATE ON asisten.spm
    FOR EACH ROW
    EXECUTE FUNCTION asisten.check_spm_prerequisites();

-- Trigger: SP2D requires SPM
CREATE OR REPLACE FUNCTION asisten.check_sp2d_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM asisten.spm s
        WHERE s.id = NEW.spm_id
        AND s.status IN ('TERBIT', 'DIAJUKAN_SP2D')
        AND s.is_deleted = FALSE
    ) THEN
        RAISE EXCEPTION 'SP2D requires a valid SPM (status = TERBIT or DIAJUKAN_SP2D)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_sp2d_prerequisites
    BEFORE INSERT OR UPDATE ON asisten.sp2d
    FOR EACH ROW
    EXECUTE FUNCTION asisten.check_sp2d_prerequisites();

-- Trigger: HPS requires approved KAK
CREATE OR REPLACE FUNCTION asisten.check_hps_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM asisten.kak k
        WHERE k.id = NEW.kak_id
        AND k.status IN ('APPROVED', 'FINAL')
        AND k.is_deleted = FALSE
    ) THEN
        RAISE EXCEPTION 'HPS requires an approved KAK';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_hps_prerequisites
    BEFORE INSERT OR UPDATE ON asisten.hps
    FOR EACH ROW
    EXECUTE FUNCTION asisten.check_hps_prerequisites();

-- Trigger: Workflow cannot move to ARSIP unless SP2D issued
CREATE OR REPLACE FUNCTION asisten.check_arsip_sp2d_required()
RETURNS TRIGGER AS $$
DECLARE
    v_arsip_stage_id UUID;
    v_paket_id UUID;
BEGIN
    -- Get the ARSIP stage ID
    SELECT id INTO v_arsip_stage_id FROM asisten.workflow_stage WHERE kode = 'ARSIP';

    -- Only check when transitioning TO ARSIP
    IF NEW.current_stage_id = v_arsip_stage_id AND OLD.current_stage_id != v_arsip_stage_id THEN
        -- Get the paket_id for this workflow
        v_paket_id := NEW.paket_id;

        -- Check if there's at least one SP2D with status SELESAI for this paket
        IF NOT EXISTS (
            SELECT 1 FROM asisten.sp2d s
            WHERE s.paket_id = v_paket_id
            AND s.status = 'SELESAI'
            AND s.is_deleted = FALSE
        ) THEN
            RAISE EXCEPTION 'Workflow cannot move to ARSIP until SP2D is completed (status = SELESAI)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_arsip_sp2d_required
    BEFORE UPDATE ON asisten.workflow_instance
    FOR EACH ROW
    EXECUTE FUNCTION asisten.check_arsip_sp2d_required();

-- =============================================================================
-- AUDIT TRIGGERS FOR PHASE 3 TABLES
-- =============================================================================

-- Generic audit function for Phase 3 tables
CREATE OR REPLACE FUNCTION asisten.audit_phase3_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO asisten.audit_log (table_name, record_id, action, new_values, actor_id, created_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), NEW.created_by, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO asisten.audit_log (table_name, record_id, action, old_values, new_values, actor_id, created_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.updated_by, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO asisten.audit_log (table_name, record_id, action, old_values, actor_id, created_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), OLD.updated_by, NOW());
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all Phase 3 tables
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY['kak', 'hps', 'rancangan_kontrak', 'kontrak', 'ssuk', 'sskk',
                           'spmk', 'adendum_kontrak', 'ba_kemajuan', 'bahp', 'bast',
                           'spp', 'spp_detail', 'spm', 'sp2d', 'potongan_pajak', 'rekening_penyedia'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('
            CREATE TRIGGER trg_audit_%s
            AFTER INSERT OR UPDATE OR DELETE ON asisten.%s
            FOR EACH ROW
            EXECUTE FUNCTION asisten.audit_phase3_changes();
        ', tbl, tbl);
    END LOOP;
END;
$$;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE asisten.kak IS 'Kerangka Acuan Kerja - Terms of Reference for procurement';
COMMENT ON TABLE asisten.hps IS 'Harga Perkiraan Sendiri - Owner''s estimate for procurement';
COMMENT ON TABLE asisten.rancangan_kontrak IS 'Draft contract document';
COMMENT ON TABLE asisten.kontrak IS 'Final signed contract with vendor';
COMMENT ON TABLE asisten.ssuk IS 'Syarat-Syarat Umum Kontrak - General contract terms';
COMMENT ON TABLE asisten.sskk IS 'Syarat-Syarat Khusus Kontrak - Special contract terms';
COMMENT ON TABLE asisten.spmk IS 'Surat Perintah Mulai Kerja - Work commencement order';
COMMENT ON TABLE asisten.adendum_kontrak IS 'Contract amendments';
COMMENT ON TABLE asisten.ba_kemajuan IS 'Berita Acara Kemajuan - Progress reports';
COMMENT ON TABLE asisten.bahp IS 'Berita Acara Hasil Pemeriksaan - Inspection reports';
COMMENT ON TABLE asisten.bast IS 'Berita Acara Serah Terima - Handover reports (PHO/FHO)';
COMMENT ON TABLE asisten.spp IS 'Surat Permintaan Pembayaran - Payment request';
COMMENT ON TABLE asisten.spp_detail IS 'SPP line items and details';
COMMENT ON TABLE asisten.spm IS 'Surat Perintah Membayar - Payment order';
COMMENT ON TABLE asisten.sp2d IS 'Surat Perintah Pencairan Dana - Disbursement order';
COMMENT ON TABLE asisten.potongan_pajak IS 'Tax deductions (PPh21, PPh22, PPh23, PPN)';
COMMENT ON TABLE asisten.rekening_penyedia IS 'Vendor bank account information';
