-- =============================================================================
-- ASISTEN Phase 3: Procurement Workflow Actions Seed
-- =============================================================================

-- Get role IDs for reference
DO $$
DECLARE
    v_ppk_role_id UUID;
    v_bendahara_role_id UUID;
    v_verifikator_role_id UUID;
    v_admin_role_id UUID;
    v_perencanaan_stage_id UUID;
    v_persiapan_stage_id UUID;
    v_kontrak_stage_id UUID;
    v_pelaksanaan_stage_id UUID;
    v_pembayaran_stage_id UUID;
    v_arsip_stage_id UUID;
BEGIN
    -- Get role IDs (assuming they exist from Phase 1)
    SELECT id INTO v_ppk_role_id FROM asisten.roles WHERE kode = 'PPK';
    SELECT id INTO v_bendahara_role_id FROM asisten.roles WHERE kode = 'BENDAHARA';
    SELECT id INTO v_verifikator_role_id FROM asisten.roles WHERE kode = 'VERIFIKATOR';
    SELECT id INTO v_admin_role_id FROM asisten.roles WHERE kode = 'ADMIN';

    -- Get workflow stage IDs
    SELECT id INTO v_perencanaan_stage_id FROM asisten.workflow_stage WHERE kode = 'PERENCANAAN';
    SELECT id INTO v_persiapan_stage_id FROM asisten.workflow_stage WHERE kode = 'PERSIAPAN';
    SELECT id INTO v_kontrak_stage_id FROM asisten.workflow_stage WHERE kode = 'KONTRAK';
    SELECT id INTO v_pelaksanaan_stage_id FROM asisten.workflow_stage WHERE kode = 'PELAKSANAAN';
    SELECT id INTO v_pembayaran_stage_id FROM asisten.workflow_stage WHERE kode = 'PEMBAYARAN';
    SELECT id INTO v_arsip_stage_id FROM asisten.workflow_stage WHERE kode = 'ARSIP';

    -- =============================================================================
    -- PERENCANAAN Stage Actions (KAK & HPS)
    -- =============================================================================

    INSERT INTO asisten.workflow_action (workflow_stage_id, action_code, action_name, deskripsi, required_role_id, next_stage_id, is_approval, urutan)
    VALUES
    (v_perencanaan_stage_id, 'DRAFT_KAK', 'Draft KAK', 'Membuat draft Kerangka Acuan Kerja', v_ppk_role_id, NULL, false, 10),
    (v_perencanaan_stage_id, 'SUBMIT_KAK', 'Submit KAK', 'Mengajukan KAK untuk approval', v_ppk_role_id, NULL, false, 20),
    (v_perencanaan_stage_id, 'APPROVE_KAK', 'Approve KAK', 'Menyetujui Kerangka Acuan Kerja', v_ppk_role_id, NULL, true, 30),
    (v_perencanaan_stage_id, 'REJECT_KAK', 'Reject KAK', 'Menolak KAK dan meminta revisi', v_ppk_role_id, NULL, true, 31),
    (v_perencanaan_stage_id, 'DRAFT_HPS', 'Draft HPS', 'Membuat draft Harga Perkiraan Sendiri', v_verifikator_role_id, NULL, false, 40),
    (v_perencanaan_stage_id, 'SUBMIT_HPS', 'Submit HPS', 'Mengajukan HPS untuk approval', v_verifikator_role_id, NULL, false, 50),
    (v_perencanaan_stage_id, 'APPROVE_HPS', 'Approve HPS', 'Menyetujui Harga Perkiraan Sendiri', v_ppk_role_id, NULL, true, 60),
    (v_perencanaan_stage_id, 'REJECT_HPS', 'Reject HPS', 'Menolak HPS dan meminta revisi', v_ppk_role_id, NULL, true, 61),
    (v_perencanaan_stage_id, 'FINALIZE_PLANNING', 'Finalize Planning', 'Menyelesaikan tahap perencanaan', v_ppk_role_id, v_persiapan_stage_id, false, 70)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi;

    -- =============================================================================
    -- PERSIAPAN Stage Actions (Contract Preparation)
    -- =============================================================================

    INSERT INTO asisten.workflow_action (workflow_stage_id, action_code, action_name, deskripsi, required_role_id, next_stage_id, is_approval, urutan)
    VALUES
    (v_persiapan_stage_id, 'DRAFT_RANCANGAN_KONTRAK', 'Draft Rancangan Kontrak', 'Membuat draft rancangan kontrak', v_ppk_role_id, NULL, false, 10),
    (v_persiapan_stage_id, 'DRAFT_SSUK', 'Draft SSUK', 'Membuat Syarat-Syarat Umum Kontrak', v_ppk_role_id, NULL, false, 20),
    (v_persiapan_stage_id, 'DRAFT_SSKK', 'Draft SSKK', 'Membuat Syarat-Syarat Khusus Kontrak', v_ppk_role_id, NULL, false, 30),
    (v_persiapan_stage_id, 'FINALIZE_PREPARATION', 'Finalize Preparation', 'Menyelesaikan tahap persiapan kontrak', v_ppk_role_id, v_kontrak_stage_id, false, 40)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi;

    -- =============================================================================
    -- KONTRAK Stage Actions (Contract Signing)
    -- =============================================================================

    INSERT INTO asisten.workflow_action (workflow_stage_id, action_code, action_name, deskripsi, required_role_id, next_stage_id, is_approval, urutan)
    VALUES
    (v_kontrak_stage_id, 'DRAFT_KONTRAK', 'Draft Kontrak', 'Membuat draft kontrak final', v_ppk_role_id, NULL, false, 10),
    (v_kontrak_stage_id, 'UPLOAD_SIGNED_KONTRAK', 'Upload Signed Kontrak', 'Upload dokumen kontrak yang sudah ditandatangani', v_ppk_role_id, NULL, false, 20),
    (v_kontrak_stage_id, 'ACTIVATE_KONTRAK', 'Activate Kontrak', 'Mengaktifkan kontrak setelah ditandatangani', v_ppk_role_id, NULL, false, 30),
    (v_kontrak_stage_id, 'ISSUE_SPMK', 'Issue SPMK', 'Menerbitkan Surat Perintah Mulai Kerja', v_ppk_role_id, v_pelaksanaan_stage_id, false, 40)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi;

    -- =============================================================================
    -- PELAKSANAAN Stage Actions (Execution & Handover)
    -- =============================================================================

    INSERT INTO asisten.workflow_action (workflow_stage_id, action_code, action_name, deskripsi, required_role_id, next_stage_id, is_approval, urutan)
    VALUES
    (v_pelaksanaan_stage_id, 'RECORD_PROGRESS', 'Record Progress', 'Mencatat kemajuan pekerjaan (BA Kemajuan)', v_ppk_role_id, NULL, false, 10),
    (v_pelaksanaan_stage_id, 'CREATE_ADENDUM', 'Create Adendum', 'Membuat adendum kontrak jika diperlukan', v_ppk_role_id, NULL, false, 20),
    (v_pelaksanaan_stage_id, 'CONDUCT_INSPECTION', 'Conduct Inspection', 'Melakukan pemeriksaan hasil pekerjaan (BAHP)', v_verifikator_role_id, NULL, false, 30),
    (v_pelaksanaan_stage_id, 'APPROVE_BAHP', 'Approve BAHP', 'Menyetujui hasil pemeriksaan', v_ppk_role_id, NULL, true, 40),
    (v_pelaksanaan_stage_id, 'DRAFT_BAST_PHO', 'Draft BAST PHO', 'Membuat BAST Provisional Handover', v_ppk_role_id, NULL, false, 50),
    (v_pelaksanaan_stage_id, 'DRAFT_BAST_FHO', 'Draft BAST FHO', 'Membuat BAST Final Handover', v_ppk_role_id, NULL, false, 60),
    (v_pelaksanaan_stage_id, 'APPROVE_BAST', 'Approve BAST', 'Menyetujui serah terima pekerjaan', v_ppk_role_id, NULL, true, 70),
    (v_pelaksanaan_stage_id, 'FINALIZE_EXECUTION', 'Finalize Execution', 'Menyelesaikan tahap pelaksanaan', v_ppk_role_id, v_pembayaran_stage_id, false, 80)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi;

    -- =============================================================================
    -- PEMBAYARAN Stage Actions (Payment Process)
    -- =============================================================================

    INSERT INTO asisten.workflow_action (workflow_stage_id, action_code, action_name, deskripsi, required_role_id, next_stage_id, is_approval, urutan)
    VALUES
    (v_pembayaran_stage_id, 'DRAFT_SPP', 'Draft SPP', 'Membuat Surat Permintaan Pembayaran', v_bendahara_role_id, NULL, false, 10),
    (v_pembayaran_stage_id, 'SUBMIT_SPP', 'Submit SPP', 'Mengajukan SPP untuk verifikasi', v_bendahara_role_id, NULL, false, 20),
    (v_pembayaran_stage_id, 'VERIFY_SPP', 'Verify SPP', 'Memverifikasi SPP dan kelengkapan dokumen', v_verifikator_role_id, NULL, false, 30),
    (v_pembayaran_stage_id, 'APPROVE_SPP', 'Approve SPP', 'Menyetujui Surat Permintaan Pembayaran', v_ppk_role_id, NULL, true, 40),
    (v_pembayaran_stage_id, 'REJECT_SPP', 'Reject SPP', 'Menolak SPP dan meminta revisi', v_ppk_role_id, NULL, true, 41),
    (v_pembayaran_stage_id, 'CALCULATE_TAX', 'Calculate Tax', 'Menghitung potongan pajak (PPh/PPN)', v_verifikator_role_id, NULL, false, 50),
    (v_pembayaran_stage_id, 'ISSUE_SPM', 'Issue SPM', 'Menerbitkan Surat Perintah Membayar', v_ppk_role_id, NULL, false, 60),
    (v_pembayaran_stage_id, 'SUBMIT_SPM', 'Submit SPM', 'Mengajukan SPM untuk pencairan', v_bendahara_role_id, NULL, false, 70),
    (v_pembayaran_stage_id, 'ISSUE_SP2D', 'Issue SP2D', 'Menerbitkan Surat Perintah Pencairan Dana', v_bendahara_role_id, NULL, false, 80),
    (v_pembayaran_stage_id, 'DISBURSE_SP2D', 'Disburse SP2D', 'Mencairkan dana SP2D', v_bendahara_role_id, NULL, false, 90),
    (v_pembayaran_stage_id, 'COMPLETE_PAYMENT', 'Complete Payment', 'Menyelesaikan proses pembayaran', v_bendahara_role_id, v_arsip_stage_id, false, 100)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi;

    -- =============================================================================
    -- ARSIP Stage Actions
    -- =============================================================================

    INSERT INTO asisten.workflow_action (workflow_stage_id, action_code, action_name, deskripsi, required_role_id, next_stage_id, is_approval, urutan)
    VALUES
    (v_arsip_stage_id, 'ARCHIVE_DOCUMENTS', 'Archive Documents', 'Mengarsipkan semua dokumen paket', v_admin_role_id, NULL, false, 10),
    (v_arsip_stage_id, 'CLOSE_WORKFLOW', 'Close Workflow', 'Menutup workflow paket', v_admin_role_id, NULL, false, 20)
    ON CONFLICT (workflow_stage_id, action_code) DO UPDATE SET
        action_name = EXCLUDED.action_name,
        deskripsi = EXCLUDED.deskripsi;

END;
$$;

-- Log the seed completion
INSERT INTO asisten.audit_log (table_name, record_id, action, new_values, created_at)
VALUES ('workflow_action', uuid_generate_v4(), 'SEED', '{"description": "Phase 3 workflow actions seeded"}', NOW());
