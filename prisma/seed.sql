-- =============================================================================
-- ASISTEN - Phase 1 Core System
-- SQL Seed Script for PostgreSQL (Windows Compatible)
-- Run this after migration.sql
-- =============================================================================

-- =============================================================================
-- SEED WORKFLOW STAGES
-- =============================================================================

INSERT INTO asisten.workflow_stage (id, kode, nama, deskripsi, urutan, is_initial, is_final, color, created_at, updated_at, is_deleted)
VALUES
    (uuid_generate_v4(), 'PERENCANAAN', 'Perencanaan', 'Tahap perencanaan dan penyusunan kegiatan', 1, TRUE, FALSE, '#3B82F6', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'PERSIAPAN', 'Persiapan', 'Tahap persiapan pengadaan dan dokumen', 2, FALSE, FALSE, '#8B5CF6', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'KONTRAK', 'Kontrak', 'Tahap penandatanganan dan pengelolaan kontrak', 3, FALSE, FALSE, '#F59E0B', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'PELAKSANAAN', 'Pelaksanaan', 'Tahap pelaksanaan pekerjaan', 4, FALSE, FALSE, '#10B981', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'PEMBAYARAN', 'Pembayaran', 'Tahap proses pembayaran dan pencairan dana', 5, FALSE, FALSE, '#EF4444', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'ARSIP', 'Arsip', 'Tahap pengarsipan dokumen dan penutupan', 6, FALSE, TRUE, '#6B7280', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE)
ON CONFLICT (kode) DO UPDATE SET
    nama = EXCLUDED.nama,
    deskripsi = EXCLUDED.deskripsi,
    urutan = EXCLUDED.urutan,
    is_initial = EXCLUDED.is_initial,
    is_final = EXCLUDED.is_final,
    color = EXCLUDED.color,
    updated_at = CURRENT_TIMESTAMP;

-- =============================================================================
-- SEED DEFAULT ROLES
-- =============================================================================

INSERT INTO asisten.roles (id, kode, nama, deskripsi, level, permissions, created_at, updated_at, is_deleted)
VALUES
    (uuid_generate_v4(), 'ADMIN', 'Administrator', 'Full system access', 100, '["*"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'PPK', 'Pejabat Pembuat Komitmen', 'Pejabat yang bertanggung jawab atas pelaksanaan pengadaan', 80, '["paket:*", "dokumen:*", "approval:create", "workflow:transition"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'PPTK', 'Pejabat Pelaksana Teknis Kegiatan', 'Pejabat yang membantu PPK dalam pelaksanaan kegiatan', 70, '["paket:read", "dokumen:*", "perjalanan:*"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'BENDAHARA', 'Bendahara', 'Pengelola keuangan dan pembayaran', 60, '["uang_persediaan:*", "kuitansi:*", "pertanggungjawaban:*"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'VERIFIKATOR', 'Verifikator', 'Verifikasi dokumen dan pembayaran', 50, '["dokumen:read", "approval:create", "pertanggungjawaban:verify"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
    (uuid_generate_v4(), 'STAFF', 'Staff', 'Staff pelaksana umum', 10, '["paket:read", "dokumen:read", "perjalanan:read"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE)
ON CONFLICT (kode) DO UPDATE SET
    nama = EXCLUDED.nama,
    deskripsi = EXCLUDED.deskripsi,
    level = EXCLUDED.level,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- =============================================================================
-- SEED ADMIN USER
-- =============================================================================

-- Insert admin user (password should be replaced with proper bcrypt hash in production)
INSERT INTO asisten.users (id, username, email, password, nama, is_active, created_at, updated_at, is_deleted)
VALUES (
    uuid_generate_v4(),
    'admin',
    'admin@asisten.local',
    '$2b$10$placeholder_hash_replace_in_production',
    'System Administrator',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE
)
ON CONFLICT (username) DO NOTHING;

-- Assign ADMIN role to admin user
INSERT INTO asisten.user_roles (id, user_id, role_id, created_at, updated_at, is_deleted)
SELECT
    uuid_generate_v4(),
    u.id,
    r.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE
FROM asisten.users u
CROSS JOIN asisten.roles r
WHERE u.username = 'admin' AND r.kode = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify workflow stages
SELECT kode, nama, urutan, is_initial, is_final, color
FROM asisten.workflow_stage
ORDER BY urutan;

-- Verify roles
SELECT kode, nama, level
FROM asisten.roles
ORDER BY level DESC;

-- Verify admin user with role
SELECT u.username, u.nama, u.email, r.kode as role_kode, r.nama as role_nama
FROM asisten.users u
JOIN asisten.user_roles ur ON u.id = ur.user_id
JOIN asisten.roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

-- =============================================================================
-- END OF SEED
-- =============================================================================
