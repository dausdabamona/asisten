-- =============================================================================
-- ASISTEN - Phase 2: Sample Data Seed
-- Complete SPPD Flow Example
-- =============================================================================

DO $$
DECLARE
    -- User IDs
    v_user_ppk UUID;
    v_user_pptk UUID;
    v_user_bendahara UUID;
    v_user_staff UUID;

    -- Role IDs
    v_role_ppk UUID;
    v_role_pptk UUID;
    v_role_bendahara UUID;
    v_role_staff UUID;

    -- Stage IDs
    v_stage_perencanaan UUID;
    v_stage_persiapan UUID;
    v_stage_pembayaran UUID;

    -- Entity IDs
    v_kegiatan_id UUID;
    v_paket_id UUID;
    v_workflow_instance_id UUID;
    v_perjalanan_id UUID;
    v_surat_tugas_id UUID;
    v_sppd_id UUID;
    v_dokumen_st_id UUID;
    v_dokumen_sppd_id UUID;
    v_dokumen_kuitansi_um_id UUID;
    v_dokumen_kuitansi_rampung_id UUID;
    v_dokumen_spj_id UUID;
    v_up_id UUID;
    v_kuitansi_um_id UUID;
    v_kuitansi_rampung_id UUID;
    v_spj_id UUID;
BEGIN
    -- ==========================================================================
    -- Get/Create Users
    -- ==========================================================================

    -- Get role IDs
    SELECT id INTO v_role_ppk FROM asisten.roles WHERE kode = 'PPK';
    SELECT id INTO v_role_pptk FROM asisten.roles WHERE kode = 'PPTK';
    SELECT id INTO v_role_bendahara FROM asisten.roles WHERE kode = 'BENDAHARA';
    SELECT id INTO v_role_staff FROM asisten.roles WHERE kode = 'STAFF';

    -- Create PPK user
    INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja)
    VALUES ('ppk_sample', 'ppk@asisten.local', '$2b$10$sample_hash', 'Budi Santoso', '198501012010011001', 'Pejabat Pembuat Komitmen', 'Bagian Pengadaan')
    ON CONFLICT (username) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_ppk;

    -- Create PPTK user
    INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja)
    VALUES ('pptk_sample', 'pptk@asisten.local', '$2b$10$sample_hash', 'Siti Aminah', '199001012015012001', 'Pelaksana Teknis Kegiatan', 'Bagian Pengadaan')
    ON CONFLICT (username) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_pptk;

    -- Create Bendahara user
    INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja)
    VALUES ('bendahara_sample', 'bendahara@asisten.local', '$2b$10$sample_hash', 'Ahmad Yani', '198801012012011001', 'Bendahara Pengeluaran', 'Bagian Keuangan')
    ON CONFLICT (username) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_bendahara;

    -- Create Staff user (traveler)
    INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja)
    VALUES ('staff_sample', 'staff@asisten.local', '$2b$10$sample_hash', 'Dewi Kartika', '199501012020012001', 'Analis', 'Bagian Pengadaan')
    ON CONFLICT (username) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_staff;

    -- Assign roles
    INSERT INTO asisten.user_roles (user_id, role_id, created_by)
    VALUES
        (v_user_ppk, v_role_ppk, v_user_ppk),
        (v_user_pptk, v_role_pptk, v_user_ppk),
        (v_user_bendahara, v_role_bendahara, v_user_ppk),
        (v_user_staff, v_role_staff, v_user_ppk)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- ==========================================================================
    -- Get Stage IDs
    -- ==========================================================================

    SELECT id INTO v_stage_perencanaan FROM asisten.workflow_stage WHERE kode = 'PERENCANAAN';
    SELECT id INTO v_stage_persiapan FROM asisten.workflow_stage WHERE kode = 'PERSIAPAN';
    SELECT id INTO v_stage_pembayaran FROM asisten.workflow_stage WHERE kode = 'PEMBAYARAN';

    -- ==========================================================================
    -- Create Kegiatan
    -- ==========================================================================

    INSERT INTO asisten.kegiatan (kode, nama, deskripsi, tahun_anggaran, pagu_anggaran, unit_kerja, program, created_by)
    VALUES (
        'KEG-2026-001',
        'Kegiatan Pengembangan Sistem Informasi',
        'Pengembangan dan implementasi sistem informasi terpadu',
        2026,
        500000000.00,
        'Bagian IT',
        'Program Digitalisasi',
        v_user_ppk
    )
    ON CONFLICT (kode) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_kegiatan_id;

    -- ==========================================================================
    -- Create Paket
    -- ==========================================================================

    INSERT INTO asisten.paket (kode, nama, deskripsi, tahun_anggaran, nilai_pagu, kegiatan_id, lokasi, created_by)
    VALUES (
        'PKT-2026-001',
        'Paket Pengadaan Jasa Konsultansi IT',
        'Jasa konsultansi untuk pengembangan sistem',
        2026,
        150000000.00,
        v_kegiatan_id,
        'Jakarta',
        v_user_ppk
    )
    ON CONFLICT (kode) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_paket_id;

    -- ==========================================================================
    -- Create Workflow Instance
    -- ==========================================================================

    INSERT INTO asisten.workflow_instance (paket_id, current_stage_id, is_active, created_by)
    VALUES (v_paket_id, v_stage_pembayaran, TRUE, v_user_ppk)
    ON CONFLICT (paket_id) DO UPDATE SET
        current_stage_id = v_stage_pembayaran,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_workflow_instance_id;

    -- ==========================================================================
    -- Create Uang Persediaan (UP)
    -- ==========================================================================

    INSERT INTO asisten.uang_persediaan (
        nomor, paket_id, tanggal, nilai, sisa, bendahara_id,
        keterangan, status, treasury_type, created_by
    )
    VALUES (
        'UP-2026-001',
        v_paket_id,
        '2026-01-02',
        50000000.00,
        42500000.00,  -- After UM disbursement
        v_user_bendahara,
        'Uang Persediaan untuk kegiatan perjalanan dinas',
        'DIBAYAR',
        'UP',
        v_user_bendahara
    )
    ON CONFLICT (nomor) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_up_id;

    -- ==========================================================================
    -- Create Perjalanan Dinas
    -- ==========================================================================

    INSERT INTO asisten.perjalanan_dinas (
        nomor, paket_id, workflow_instance_id, maksud_perjalanan,
        kota_asal, kota_tujuan, tanggal_berangkat, tanggal_kembali,
        lama_hari, status, total_biaya_estimasi, total_biaya_realisasi, created_by
    )
    VALUES (
        'PD-2026-001',
        v_paket_id,
        v_workflow_instance_id,
        'Koordinasi dan konsultasi teknis pengembangan sistem informasi dengan vendor di Surabaya',
        'Jakarta',
        'Surabaya',
        '2026-01-15',
        '2026-01-17',
        3,
        'SELESAI',
        7500000.00,
        7250000.00,
        v_user_pptk
    )
    ON CONFLICT (nomor) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_perjalanan_id;

    -- ==========================================================================
    -- Create Peserta Perjalanan
    -- ==========================================================================

    INSERT INTO asisten.peserta_perjalanan (
        perjalanan_dinas_id, user_id, tingkat_biaya, golongan,
        jabatan_perjalanan, is_ketua, uang_harian, biaya_transport,
        biaya_penginapan, biaya_lainnya, created_by
    )
    VALUES (
        v_perjalanan_id,
        v_user_staff,
        'B',
        'III/c',
        'Ketua Tim',
        TRUE,
        1500000.00,  -- 500k x 3 hari
        4000000.00,  -- Tiket pesawat PP
        1500000.00,  -- Hotel 2 malam
        250000.00,   -- Transport lokal
        v_user_pptk
    )
    ON CONFLICT (perjalanan_dinas_id, user_id) DO UPDATE SET
        uang_harian = 1500000.00,
        biaya_transport = 4000000.00,
        biaya_penginapan = 1500000.00,
        biaya_lainnya = 250000.00,
        updated_at = CURRENT_TIMESTAMP;

    -- ==========================================================================
    -- Create Dokumen: Surat Tugas
    -- ==========================================================================

    INSERT INTO asisten.dokumen (
        nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id,
        tanggal_dokumen, current_version, created_by
    )
    VALUES (
        'ST-2026-001',
        'Surat Tugas Perjalanan Dinas ke Surabaya',
        'SURAT_TUGAS',
        'Surat tugas untuk koordinasi teknis dengan vendor',
        v_paket_id,
        v_stage_persiapan,
        '2026-01-10',
        1,
        v_user_pptk
    )
    ON CONFLICT (nomor, paket_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_dokumen_st_id;

    -- ==========================================================================
    -- Create Surat Tugas
    -- ==========================================================================

    INSERT INTO asisten.surat_tugas (
        nomor, perjalanan_dinas_id, dokumen_id, tanggal_surat,
        perihal, dasar, penanda_tangan_id, jabatan_penanda, status, created_by
    )
    VALUES (
        'ST-2026-001',
        v_perjalanan_id,
        v_dokumen_st_id,
        '2026-01-10',
        'Penugasan Perjalanan Dinas dalam rangka Koordinasi Teknis',
        'Surat Perintah Kepala Bagian Nomor XX/2026',
        v_user_ppk,
        'Pejabat Pembuat Komitmen',
        'FINAL',
        v_user_pptk
    )
    ON CONFLICT (nomor) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_surat_tugas_id;

    -- ==========================================================================
    -- Create Dokumen: SPPD
    -- ==========================================================================

    INSERT INTO asisten.dokumen (
        nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id,
        tanggal_dokumen, current_version, created_by
    )
    VALUES (
        'SPPD-2026-001',
        'SPPD Perjalanan Dinas ke Surabaya',
        'SPPD',
        'Surat Perintah Perjalanan Dinas',
        v_paket_id,
        v_stage_persiapan,
        '2026-01-10',
        1,
        v_user_pptk
    )
    ON CONFLICT (nomor, paket_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_dokumen_sppd_id;

    -- ==========================================================================
    -- Create SPPD
    -- ==========================================================================

    INSERT INTO asisten.sppd (
        nomor, perjalanan_dinas_id, dokumen_id, tanggal_sppd,
        pejabat_pemberi_id, jabatan_pemberi, instansi, mata_anggaran, status, created_by
    )
    VALUES (
        'SPPD-2026-001',
        v_perjalanan_id,
        v_dokumen_sppd_id,
        '2026-01-10',
        v_user_ppk,
        'Pejabat Pembuat Komitmen',
        'Kementerian XYZ',
        '5212.001',
        'SELESAI',
        v_user_pptk
    )
    ON CONFLICT (nomor) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_sppd_id;

    -- ==========================================================================
    -- Create Dokumen: Kuitansi Uang Muka
    -- ==========================================================================

    INSERT INTO asisten.dokumen (
        nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id,
        tanggal_dokumen, current_version, created_by
    )
    VALUES (
        'KUM-2026-001',
        'Kuitansi Uang Muka Perjalanan Dinas Surabaya',
        'KUITANSI_UM',
        'Kuitansi uang muka untuk perjalanan dinas',
        v_paket_id,
        v_stage_persiapan,
        '2026-01-12',
        1,
        v_user_bendahara
    )
    ON CONFLICT (nomor, paket_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_dokumen_kuitansi_um_id;

    -- ==========================================================================
    -- Create Kuitansi Uang Muka
    -- ==========================================================================

    INSERT INTO asisten.kuitansi (
        nomor, uang_persediaan_id, perjalanan_dinas_id, dokumen_id,
        tanggal, tipe, uraian, nilai, penerima, jenis_belanja, status, created_by
    )
    VALUES (
        'KUM-2026-001',
        v_up_id,
        v_perjalanan_id,
        v_dokumen_kuitansi_um_id,
        '2026-01-12',
        'UANG_MUKA',
        'Uang muka perjalanan dinas ke Surabaya untuk koordinasi teknis',
        7500000.00,
        'Dewi Kartika',
        'Perjalanan Dinas',
        'DIBAYAR',
        v_user_bendahara
    )
    ON CONFLICT (nomor) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_kuitansi_um_id;

    -- ==========================================================================
    -- Create Dokumen: Kuitansi Rampung
    -- ==========================================================================

    INSERT INTO asisten.dokumen (
        nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id,
        tanggal_dokumen, current_version, created_by
    )
    VALUES (
        'KR-2026-001',
        'Kuitansi Rampung Perjalanan Dinas Surabaya',
        'KUITANSI_RAMPUNG',
        'Kuitansi rampung/settlement perjalanan dinas',
        v_paket_id,
        v_stage_pembayaran,
        '2026-01-20',
        1,
        v_user_bendahara
    )
    ON CONFLICT (nomor, paket_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_dokumen_kuitansi_rampung_id;

    -- ==========================================================================
    -- Create Kuitansi Rampung
    -- ==========================================================================

    INSERT INTO asisten.kuitansi (
        nomor, uang_persediaan_id, perjalanan_dinas_id, dokumen_id,
        kuitansi_um_id, tanggal, tipe, uraian, nilai, nilai_um,
        nilai_realisasi, selisih, penerima, jenis_belanja, status, created_by
    )
    VALUES (
        'KR-2026-001',
        v_up_id,
        v_perjalanan_id,
        v_dokumen_kuitansi_rampung_id,
        v_kuitansi_um_id,
        '2026-01-20',
        'RAMPUNG',
        'Pertanggungjawaban perjalanan dinas ke Surabaya',
        7250000.00,
        7500000.00,   -- Nilai UM
        7250000.00,   -- Realisasi
        250000.00,    -- Selisih (dikembalikan)
        'Dewi Kartika',
        'Perjalanan Dinas',
        'DIBAYAR',
        v_user_bendahara
    )
    ON CONFLICT (nomor) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_kuitansi_rampung_id;

    -- ==========================================================================
    -- Create Dokumen: SPJ
    -- ==========================================================================

    INSERT INTO asisten.dokumen (
        nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id,
        tanggal_dokumen, current_version, created_by
    )
    VALUES (
        'SPJ-UP-2026-001',
        'SPJ Uang Persediaan - Perjalanan Dinas Surabaya',
        'SPJ_UP',
        'Surat Pertanggungjawaban penggunaan UP untuk perjalanan dinas',
        v_paket_id,
        v_stage_pembayaran,
        '2026-01-22',
        1,
        v_user_bendahara
    )
    ON CONFLICT (nomor, paket_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_dokumen_spj_id;

    -- ==========================================================================
    -- Create Pertanggungjawaban (SPJ)
    -- ==========================================================================

    INSERT INTO asisten.pertanggungjawaban (
        nomor, uang_persediaan_id, perjalanan_dinas_id, kuitansi_id,
        workflow_instance_id, tanggal, jenis, total_nilai, total_um,
        total_realisasi, sisa_lebih, status, verifikator_id,
        tanggal_verifikasi, pengesah_id, tanggal_pengesahan, created_by
    )
    VALUES (
        'SPJ-UP-2026-001',
        v_up_id,
        v_perjalanan_id,
        v_kuitansi_rampung_id,
        v_workflow_instance_id,
        '2026-01-22',
        'SPJ_UP',
        7500000.00,
        7500000.00,
        7250000.00,
        250000.00,
        'DISAHKAN',
        v_user_bendahara,
        '2026-01-22',
        v_user_ppk,
        '2026-01-23',
        v_user_bendahara
    )
    ON CONFLICT (nomor) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_spj_id;

    -- ==========================================================================
    -- Create Approval Logs
    -- ==========================================================================

    -- Approval: Surat Tugas
    INSERT INTO asisten.approval_log (
        dokumen_id, role_id, approver_id, status, catatan, approved_at, created_by
    )
    VALUES (
        v_dokumen_st_id, v_role_ppk, v_user_ppk, 'APPROVED',
        'Disetujui untuk pelaksanaan perjalanan dinas', '2026-01-10 10:00:00', v_user_ppk
    );

    -- Approval: SPPD
    INSERT INTO asisten.approval_log (
        dokumen_id, role_id, approver_id, status, catatan, approved_at, created_by
    )
    VALUES (
        v_dokumen_sppd_id, v_role_ppk, v_user_ppk, 'APPROVED',
        'SPPD diterbitkan', '2026-01-10 11:00:00', v_user_ppk
    );

    -- Approval: Kuitansi Uang Muka
    INSERT INTO asisten.approval_log (
        dokumen_id, role_id, approver_id, status, catatan, approved_at, created_by
    )
    VALUES (
        v_dokumen_kuitansi_um_id, v_role_bendahara, v_user_bendahara, 'APPROVED',
        'Uang muka dicairkan', '2026-01-12 09:00:00', v_user_bendahara
    );

    -- Approval: Kuitansi Rampung
    INSERT INTO asisten.approval_log (
        dokumen_id, role_id, approver_id, status, catatan, approved_at, created_by
    )
    VALUES (
        v_dokumen_kuitansi_rampung_id, v_role_bendahara, v_user_bendahara, 'APPROVED',
        'Pertanggungjawaban diterima, selisih Rp 250.000 dikembalikan ke UP', '2026-01-20 14:00:00', v_user_bendahara
    );

    -- Approval: SPJ
    INSERT INTO asisten.approval_log (
        dokumen_id, role_id, approver_id, status, catatan, approved_at, created_by
    )
    VALUES (
        v_dokumen_spj_id, v_role_ppk, v_user_ppk, 'APPROVED',
        'SPJ disahkan, perjalanan dinas selesai', '2026-01-23 10:00:00', v_user_ppk
    );

    -- ==========================================================================
    -- Create Workflow Transitions
    -- ==========================================================================

    -- Transition 1: PERENCANAAN -> PERSIAPAN
    INSERT INTO asisten.workflow_transition (
        workflow_instance_id, from_stage_id, to_stage_id,
        transitioned_at, transitioned_by, catatan, created_by
    )
    SELECT
        v_workflow_instance_id,
        (SELECT id FROM asisten.workflow_stage WHERE kode = 'PERENCANAAN'),
        (SELECT id FROM asisten.workflow_stage WHERE kode = 'PERSIAPAN'),
        '2026-01-10 09:00:00',
        v_user_ppk,
        'Perencanaan disetujui, lanjut ke persiapan',
        v_user_ppk;

    -- Transition 2: PERSIAPAN -> PELAKSANAAN
    INSERT INTO asisten.workflow_transition (
        workflow_instance_id, from_stage_id, to_stage_id,
        transitioned_at, transitioned_by, catatan, created_by
    )
    SELECT
        v_workflow_instance_id,
        (SELECT id FROM asisten.workflow_stage WHERE kode = 'PERSIAPAN'),
        (SELECT id FROM asisten.workflow_stage WHERE kode = 'PELAKSANAAN'),
        '2026-01-15 06:00:00',
        v_user_pptk,
        'Perjalanan dimulai',
        v_user_pptk;

    -- Transition 3: PELAKSANAAN -> PEMBAYARAN
    INSERT INTO asisten.workflow_transition (
        workflow_instance_id, from_stage_id, to_stage_id,
        transitioned_at, transitioned_by, catatan, created_by
    )
    SELECT
        v_workflow_instance_id,
        (SELECT id FROM asisten.workflow_stage WHERE kode = 'PELAKSANAAN'),
        (SELECT id FROM asisten.workflow_stage WHERE kode = 'PEMBAYARAN'),
        '2026-01-18 10:00:00',
        v_user_pptk,
        'Perjalanan selesai, lanjut ke pertanggungjawaban',
        v_user_pptk;

    RAISE NOTICE 'Sample data seeded successfully';
    RAISE NOTICE 'Perjalanan Dinas ID: %', v_perjalanan_id;
    RAISE NOTICE 'Surat Tugas ID: %', v_surat_tugas_id;
    RAISE NOTICE 'SPPD ID: %', v_sppd_id;
    RAISE NOTICE 'Kuitansi UM ID: %', v_kuitansi_um_id;
    RAISE NOTICE 'Kuitansi Rampung ID: %', v_kuitansi_rampung_id;
    RAISE NOTICE 'SPJ ID: %', v_spj_id;
END $$;

-- =============================================================================
-- Verify Sample Data
-- =============================================================================

-- View complete SPPD status
SELECT * FROM asisten.v_sppd_status WHERE nomor_perjalanan = 'PD-2026-001';

-- View treasury balance
SELECT * FROM asisten.v_treasury_balance WHERE nomor = 'UP-2026-001';
