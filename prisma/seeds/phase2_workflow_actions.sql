-- =============================================================================
-- ASISTEN - Phase 2: Workflow Actions Seed Data
-- SPPD Workflow Actions per Stage
-- =============================================================================

-- Get stage IDs for reference
DO $$
DECLARE
    v_stage_perencanaan UUID;
    v_stage_persiapan UUID;
    v_stage_kontrak UUID;
    v_stage_pelaksanaan UUID;
    v_stage_pembayaran UUID;
    v_stage_arsip UUID;
    v_role_ppk UUID;
    v_role_pptk UUID;
    v_role_bendahara UUID;
    v_role_verifikator UUID;
BEGIN
    -- Get stage IDs
    SELECT id INTO v_stage_perencanaan FROM asisten.workflow_stage WHERE kode = 'PERENCANAAN';
    SELECT id INTO v_stage_persiapan FROM asisten.workflow_stage WHERE kode = 'PERSIAPAN';
    SELECT id INTO v_stage_kontrak FROM asisten.workflow_stage WHERE kode = 'KONTRAK';
    SELECT id INTO v_stage_pelaksanaan FROM asisten.workflow_stage WHERE kode = 'PELAKSANAAN';
    SELECT id INTO v_stage_pembayaran FROM asisten.workflow_stage WHERE kode = 'PEMBAYARAN';
    SELECT id INTO v_stage_arsip FROM asisten.workflow_stage WHERE kode = 'ARSIP';

    -- Get role IDs
    SELECT id INTO v_role_ppk FROM asisten.roles WHERE kode = 'PPK';
    SELECT id INTO v_role_pptk FROM asisten.roles WHERE kode = 'PPTK';
    SELECT id INTO v_role_bendahara FROM asisten.roles WHERE kode = 'BENDAHARA';
    SELECT id INTO v_role_verifikator FROM asisten.roles WHERE kode = 'VERIFIKATOR';

    -- ==========================================================================
    -- PERENCANAAN Stage Actions
    -- ==========================================================================

    INSERT INTO asisten.workflow_action (
        workflow_stage_id, action_code, action_name, deskripsi,
        required_role_id, next_stage_id, is_approval, urutan
    ) VALUES
    (v_stage_perencanaan, 'CREATE_PERJALANAN', 'Buat Perjalanan Dinas',
     'Membuat draft perjalanan dinas baru', v_role_pptk, NULL, FALSE, 1),
    (v_stage_perencanaan, 'DRAFT_SURAT_TUGAS', 'Draft Surat Tugas',
     'Membuat draft surat tugas untuk perjalanan', v_role_pptk, NULL, FALSE, 2),
    (v_stage_perencanaan, 'SUBMIT_PERENCANAAN', 'Ajukan Perencanaan',
     'Mengajukan perencanaan perjalanan untuk persetujuan', v_role_pptk, v_stage_persiapan, FALSE, 3),
    (v_stage_perencanaan, 'APPROVE_PERENCANAAN', 'Setujui Perencanaan',
     'Menyetujui perencanaan perjalanan dinas', v_role_ppk, v_stage_persiapan, TRUE, 4)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi,
        required_role_id = EXCLUDED.required_role_id,
        next_stage_id = EXCLUDED.next_stage_id,
        is_approval = EXCLUDED.is_approval,
        urutan = EXCLUDED.urutan,
        updated_at = CURRENT_TIMESTAMP;

    -- ==========================================================================
    -- PERSIAPAN Stage Actions
    -- ==========================================================================

    INSERT INTO asisten.workflow_action (
        workflow_stage_id, action_code, action_name, deskripsi,
        required_role_id, next_stage_id, is_approval, urutan
    ) VALUES
    (v_stage_persiapan, 'FINALIZE_SURAT_TUGAS', 'Finalisasi Surat Tugas',
     'Menyelesaikan dan menerbitkan surat tugas', v_role_pptk, NULL, FALSE, 1),
    (v_stage_persiapan, 'APPROVE_SURAT_TUGAS', 'Approve Surat Tugas',
     'Menyetujui surat tugas', v_role_ppk, NULL, TRUE, 2),
    (v_stage_persiapan, 'CREATE_SPPD', 'Buat SPPD',
     'Membuat SPPD setelah surat tugas disetujui', v_role_pptk, NULL, FALSE, 3),
    (v_stage_persiapan, 'TERBIT_SPPD', 'Terbitkan SPPD',
     'Menerbitkan SPPD resmi', v_role_ppk, NULL, TRUE, 4),
    (v_stage_persiapan, 'REQUEST_UANG_MUKA', 'Ajukan Uang Muka',
     'Mengajukan kuitansi uang muka perjalanan', v_role_pptk, NULL, FALSE, 5),
    (v_stage_persiapan, 'APPROVE_UANG_MUKA', 'Setujui Uang Muka',
     'Menyetujui pencairan uang muka', v_role_bendahara, NULL, TRUE, 6),
    (v_stage_persiapan, 'START_PERJALANAN', 'Mulai Perjalanan',
     'Memulai pelaksanaan perjalanan dinas', v_role_pptk, v_stage_pelaksanaan, FALSE, 7)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi,
        required_role_id = EXCLUDED.required_role_id,
        next_stage_id = EXCLUDED.next_stage_id,
        is_approval = EXCLUDED.is_approval,
        urutan = EXCLUDED.urutan,
        updated_at = CURRENT_TIMESTAMP;

    -- ==========================================================================
    -- PELAKSANAAN Stage Actions
    -- ==========================================================================

    INSERT INTO asisten.workflow_action (
        workflow_stage_id, action_code, action_name, deskripsi,
        required_role_id, next_stage_id, is_approval, urutan
    ) VALUES
    (v_stage_pelaksanaan, 'UPDATE_REALISASI', 'Update Realisasi',
     'Mencatat realisasi biaya perjalanan', v_role_pptk, NULL, FALSE, 1),
    (v_stage_pelaksanaan, 'UPLOAD_BUKTI', 'Upload Bukti Pendukung',
     'Mengunggah bukti-bukti pendukung perjalanan', v_role_pptk, NULL, FALSE, 2),
    (v_stage_pelaksanaan, 'CREATE_LAPORAN', 'Buat Laporan Perjalanan',
     'Membuat laporan hasil perjalanan dinas', v_role_pptk, NULL, FALSE, 3),
    (v_stage_pelaksanaan, 'COMPLETE_PERJALANAN', 'Selesai Perjalanan',
     'Menandai perjalanan selesai dilaksanakan', v_role_pptk, v_stage_pembayaran, FALSE, 4)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi,
        required_role_id = EXCLUDED.required_role_id,
        next_stage_id = EXCLUDED.next_stage_id,
        is_approval = EXCLUDED.is_approval,
        urutan = EXCLUDED.urutan,
        updated_at = CURRENT_TIMESTAMP;

    -- ==========================================================================
    -- PEMBAYARAN Stage Actions
    -- ==========================================================================

    INSERT INTO asisten.workflow_action (
        workflow_stage_id, action_code, action_name, deskripsi,
        required_role_id, next_stage_id, is_approval, urutan
    ) VALUES
    (v_stage_pembayaran, 'CREATE_KUITANSI_RAMPUNG', 'Buat Kuitansi Rampung',
     'Membuat kuitansi rampung/settlement', v_role_pptk, NULL, FALSE, 1),
    (v_stage_pembayaran, 'VERIFY_KUITANSI', 'Verifikasi Kuitansi',
     'Verifikasi kuitansi rampung oleh verifikator', v_role_verifikator, NULL, TRUE, 2),
    (v_stage_pembayaran, 'APPROVE_KUITANSI', 'Setujui Kuitansi',
     'Menyetujui kuitansi rampung', v_role_bendahara, NULL, TRUE, 3),
    (v_stage_pembayaran, 'CREATE_SPJ', 'Buat SPJ',
     'Membuat Surat Pertanggungjawaban', v_role_bendahara, NULL, FALSE, 4),
    (v_stage_pembayaran, 'VERIFY_SPJ', 'Verifikasi SPJ',
     'Verifikasi SPJ oleh verifikator', v_role_verifikator, NULL, TRUE, 5),
    (v_stage_pembayaran, 'APPROVE_SPJ', 'Pengesahan SPJ',
     'Pengesahan SPJ oleh PPK dan Bendahara', v_role_ppk, NULL, TRUE, 6),
    (v_stage_pembayaran, 'COMPLETE_PEMBAYARAN', 'Selesai Pembayaran',
     'Menandai proses pembayaran selesai', v_role_bendahara, v_stage_arsip, FALSE, 7)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi,
        required_role_id = EXCLUDED.required_role_id,
        next_stage_id = EXCLUDED.next_stage_id,
        is_approval = EXCLUDED.is_approval,
        urutan = EXCLUDED.urutan,
        updated_at = CURRENT_TIMESTAMP;

    -- ==========================================================================
    -- ARSIP Stage Actions
    -- ==========================================================================

    INSERT INTO asisten.workflow_action (
        workflow_stage_id, action_code, action_name, deskripsi,
        required_role_id, next_stage_id, is_approval, urutan
    ) VALUES
    (v_stage_arsip, 'ARCHIVE_DOKUMEN', 'Arsipkan Dokumen',
     'Mengarsipkan seluruh dokumen perjalanan', v_role_pptk, NULL, FALSE, 1),
    (v_stage_arsip, 'FINALIZE_ARSIP', 'Finalisasi Arsip',
     'Menyelesaikan proses pengarsipan', v_role_ppk, NULL, TRUE, 2),
    (v_stage_arsip, 'CLOSE_WORKFLOW', 'Tutup Workflow',
     'Menutup workflow perjalanan dinas', v_role_ppk, NULL, FALSE, 3)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi,
        required_role_id = EXCLUDED.required_role_id,
        next_stage_id = EXCLUDED.next_stage_id,
        is_approval = EXCLUDED.is_approval,
        urutan = EXCLUDED.urutan,
        updated_at = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Workflow actions seeded successfully';
END $$;

-- =============================================================================
-- Verify workflow actions
-- =============================================================================

SELECT
    ws.kode AS stage,
    wa.action_code,
    wa.action_name,
    r.kode AS required_role,
    wa.is_approval,
    wa.urutan
FROM asisten.workflow_action wa
JOIN asisten.workflow_stage ws ON ws.id = wa.workflow_stage_id
LEFT JOIN asisten.roles r ON r.id = wa.required_role_id
WHERE wa.is_deleted = FALSE
ORDER BY ws.urutan, wa.urutan;
