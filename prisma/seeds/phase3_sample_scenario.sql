-- =============================================================================
-- ASISTEN Phase 3: Sample Full Scenario - KAK to SP2D
-- This demonstrates the complete procurement to payment lifecycle
-- =============================================================================

DO $$
DECLARE
    -- User IDs
    v_ppk_user_id UUID;
    v_bendahara_user_id UUID;
    v_verifikator_user_id UUID;
    v_admin_user_id UUID;

    -- Workflow Stage IDs
    v_perencanaan_stage_id UUID;
    v_persiapan_stage_id UUID;
    v_kontrak_stage_id UUID;
    v_pelaksanaan_stage_id UUID;
    v_pembayaran_stage_id UUID;
    v_arsip_stage_id UUID;

    -- Generated IDs for the scenario
    v_kegiatan_id UUID;
    v_paket_id UUID;
    v_workflow_instance_id UUID;
    v_dokumen_kak_id UUID;
    v_dokumen_hps_id UUID;
    v_dokumen_kontrak_id UUID;
    v_dokumen_spmk_id UUID;
    v_dokumen_bast_id UUID;
    v_dokumen_spp_id UUID;
    v_dokumen_spm_id UUID;
    v_dokumen_sp2d_id UUID;
    v_kak_id UUID;
    v_hps_id UUID;
    v_rancangan_kontrak_id UUID;
    v_kontrak_id UUID;
    v_ssuk_id UUID;
    v_sskk_id UUID;
    v_spmk_id UUID;
    v_ba_kemajuan_id UUID;
    v_bahp_id UUID;
    v_bast_id UUID;
    v_spp_id UUID;
    v_spm_id UUID;
    v_sp2d_id UUID;
    v_rekening_id UUID;

BEGIN
    -- =============================================================================
    -- GET REFERENCE IDs
    -- =============================================================================

    -- Get user IDs (use existing users or create sample ones)
    SELECT id INTO v_ppk_user_id FROM asisten.users WHERE username = 'ppk_sample' LIMIT 1;
    IF v_ppk_user_id IS NULL THEN
        INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja, is_active)
        VALUES ('ppk_sample', 'ppk@sample.local', 'hashed_password', 'PPK Sample', '199001012020011001', 'Pejabat Pembuat Komitmen', 'Bagian Pengadaan', true)
        RETURNING id INTO v_ppk_user_id;
    END IF;

    SELECT id INTO v_bendahara_user_id FROM asisten.users WHERE username = 'bendahara_sample' LIMIT 1;
    IF v_bendahara_user_id IS NULL THEN
        INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja, is_active)
        VALUES ('bendahara_sample', 'bendahara@sample.local', 'hashed_password', 'Bendahara Sample', '199001012020011002', 'Bendahara Pengeluaran', 'Bagian Keuangan', true)
        RETURNING id INTO v_bendahara_user_id;
    END IF;

    SELECT id INTO v_verifikator_user_id FROM asisten.users WHERE username = 'verifikator_sample' LIMIT 1;
    IF v_verifikator_user_id IS NULL THEN
        INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja, is_active)
        VALUES ('verifikator_sample', 'verifikator@sample.local', 'hashed_password', 'Verifikator Sample', '199001012020011003', 'Verifikator Keuangan', 'Bagian Keuangan', true)
        RETURNING id INTO v_verifikator_user_id;
    END IF;

    SELECT id INTO v_admin_user_id FROM asisten.users WHERE username = 'admin_sample' LIMIT 1;
    IF v_admin_user_id IS NULL THEN
        INSERT INTO asisten.users (username, email, password, nama, nip, jabatan, unit_kerja, is_active)
        VALUES ('admin_sample', 'admin@sample.local', 'hashed_password', 'Admin Sample', '199001012020011004', 'Administrator', 'Bagian Umum', true)
        RETURNING id INTO v_admin_user_id;
    END IF;

    -- Get workflow stage IDs
    SELECT id INTO v_perencanaan_stage_id FROM asisten.workflow_stage WHERE kode = 'PERENCANAAN';
    SELECT id INTO v_persiapan_stage_id FROM asisten.workflow_stage WHERE kode = 'PERSIAPAN';
    SELECT id INTO v_kontrak_stage_id FROM asisten.workflow_stage WHERE kode = 'KONTRAK';
    SELECT id INTO v_pelaksanaan_stage_id FROM asisten.workflow_stage WHERE kode = 'PELAKSANAAN';
    SELECT id INTO v_pembayaran_stage_id FROM asisten.workflow_stage WHERE kode = 'PEMBAYARAN';
    SELECT id INTO v_arsip_stage_id FROM asisten.workflow_stage WHERE kode = 'ARSIP';

    -- =============================================================================
    -- 1. CREATE KEGIATAN & PAKET
    -- =============================================================================

    INSERT INTO asisten.kegiatan (kode, nama, deskripsi, tahun_anggaran, pagu_anggaran, unit_kerja, program, created_by)
    VALUES ('KEG-2026-001', 'Pengembangan Sistem Informasi', 'Kegiatan pengembangan sistem informasi terpadu', 2026, 500000000.00, 'Bagian IT', 'Program Digitalisasi', v_admin_user_id)
    RETURNING id INTO v_kegiatan_id;

    INSERT INTO asisten.paket (kode, nama, deskripsi, tahun_anggaran, nilai_pagu, kegiatan_id, created_by)
    VALUES ('PKT-2026-001', 'Pengadaan Jasa Konsultansi Pengembangan Aplikasi', 'Pengadaan jasa konsultansi untuk pengembangan aplikasi mobile', 2026, 350000000.00, v_kegiatan_id, v_ppk_user_id)
    RETURNING id INTO v_paket_id;

    INSERT INTO asisten.workflow_instance (paket_id, current_stage_id, started_at, is_active, created_by)
    VALUES (v_paket_id, v_perencanaan_stage_id, NOW(), true, v_ppk_user_id)
    RETURNING id INTO v_workflow_instance_id;

    -- =============================================================================
    -- 2. KAK - Kerangka Acuan Kerja
    -- =============================================================================

    -- Create KAK document
    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-KAK-2026-001', 'KAK Pengembangan Aplikasi Mobile', 'KAK', 'Kerangka Acuan Kerja untuk pengembangan aplikasi mobile', v_paket_id, v_perencanaan_stage_id, NOW(), v_ppk_user_id)
    RETURNING id INTO v_dokumen_kak_id;

    INSERT INTO asisten.kak (nomor, paket_id, dokumen_id, judul, latar_belakang, maksud_tujuan, sasaran, ruang_lingkup, keluaran, jangka_waktu, jenis_pengadaan, metode_pengadaan, nilai_pagu, ppk_id, status, tanggal_kak, created_by)
    VALUES (
        'KAK-2026-001',
        v_paket_id,
        v_dokumen_kak_id,
        'KAK Pengembangan Aplikasi Mobile',
        'Dalam rangka meningkatkan layanan kepada masyarakat, diperlukan pengembangan aplikasi mobile yang terintegrasi.',
        'Maksud: Mengembangkan aplikasi mobile. Tujuan: Meningkatkan aksesibilitas layanan.',
        'Tersedianya aplikasi mobile yang dapat digunakan oleh masyarakat untuk mengakses layanan.',
        'Pengembangan frontend mobile (iOS dan Android), backend API, dan integrasi dengan sistem existing.',
        'Aplikasi mobile (iOS dan Android), dokumentasi teknis, source code, dan user manual.',
        180, -- 180 hari
        'JASA_KONSULTANSI',
        'SELEKSI',
        350000000.00,
        v_ppk_user_id,
        'FINAL',
        NOW(),
        v_ppk_user_id
    )
    RETURNING id INTO v_kak_id;

    -- =============================================================================
    -- 3. HPS - Harga Perkiraan Sendiri
    -- =============================================================================

    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-HPS-2026-001', 'HPS Pengembangan Aplikasi Mobile', 'HPS', 'Harga Perkiraan Sendiri untuk pengembangan aplikasi mobile', v_paket_id, v_perencanaan_stage_id, NOW(), v_verifikator_user_id)
    RETURNING id INTO v_dokumen_hps_id;

    INSERT INTO asisten.hps (nomor, paket_id, kak_id, dokumen_id, tanggal_hps, nilai_hps, komponen_biaya, dasar_penyusun, penyusun_id, status, catatan, created_by)
    VALUES (
        'HPS-2026-001',
        v_paket_id,
        v_kak_id,
        v_dokumen_hps_id,
        NOW(),
        340000000.00,
        '{"items": [
            {"uraian": "Biaya Personil", "volume": 1, "satuan": "Paket", "harga_satuan": 250000000, "jumlah": 250000000},
            {"uraian": "Biaya Non-Personil", "volume": 1, "satuan": "Paket", "harga_satuan": 50000000, "jumlah": 50000000},
            {"uraian": "Biaya Overhead", "volume": 1, "satuan": "Paket", "harga_satuan": 40000000, "jumlah": 40000000}
        ], "total": 340000000}'::jsonb,
        'Berdasarkan analisis pasar dan standar biaya tahun 2026',
        v_verifikator_user_id,
        'FINAL',
        'HPS telah diverifikasi dan disetujui',
        v_verifikator_user_id
    )
    RETURNING id INTO v_hps_id;

    -- =============================================================================
    -- 4. RANCANGAN KONTRAK
    -- =============================================================================

    INSERT INTO asisten.rancangan_kontrak (nomor, hps_id, judul, isi_kontrak, nilai_kontrak, jangka_waktu, tanggal_draft, catatan, created_by)
    VALUES (
        'RK-2026-001',
        v_hps_id,
        'Rancangan Kontrak Pengembangan Aplikasi Mobile',
        'Kontrak pengadaan jasa konsultansi pengembangan aplikasi mobile...',
        330000000.00,
        180,
        NOW(),
        'Rancangan kontrak berdasarkan hasil negosiasi',
        v_ppk_user_id
    )
    RETURNING id INTO v_rancangan_kontrak_id;

    -- =============================================================================
    -- 5. KONTRAK (Signed Contract)
    -- =============================================================================

    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-KONTRAK-2026-001', 'Kontrak Pengembangan Aplikasi Mobile', 'KONTRAK', 'Kontrak Pengadaan Jasa Konsultansi', v_paket_id, v_kontrak_stage_id, NOW(), v_ppk_user_id)
    RETURNING id INTO v_dokumen_kontrak_id;

    INSERT INTO asisten.kontrak (nomor, paket_id, rancangan_kontrak_id, dokumen_id, judul, nama_penyedia, alamat_penyedia, npwp_penyedia, nilai_kontrak, nilai_ppn, nilai_pph, tanggal_kontrak, tanggal_mulai, tanggal_selesai, jangka_waktu, ppk_id, status, catatan, created_by)
    VALUES (
        'KONTRAK-2026-001',
        v_paket_id,
        v_rancangan_kontrak_id,
        v_dokumen_kontrak_id,
        'Kontrak Pengadaan Jasa Konsultansi Pengembangan Aplikasi Mobile',
        'PT. Digital Solutions Indonesia',
        'Jl. Teknologi No. 123, Jakarta Selatan',
        '01.234.567.8-901.000',
        330000000.00,
        36300000.00,  -- PPN 11%
        6600000.00,   -- PPh 2%
        NOW(),
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '187 days',
        180,
        v_ppk_user_id,
        'AKTIF',
        'Kontrak telah ditandatangani oleh kedua belah pihak',
        v_ppk_user_id
    )
    RETURNING id INTO v_kontrak_id;

    -- =============================================================================
    -- 6. SSUK & SSKK
    -- =============================================================================

    INSERT INTO asisten.ssuk (kontrak_id, isi_ssuk, file_path, created_by)
    VALUES (v_kontrak_id, 'Syarat-syarat umum kontrak sesuai dengan Perpres No. 12 Tahun 2021...', '/documents/ssuk/SSUK-2026-001.pdf', v_ppk_user_id)
    RETURNING id INTO v_ssuk_id;

    INSERT INTO asisten.sskk (kontrak_id, isi_sskk, file_path, created_by)
    VALUES (v_kontrak_id, 'Syarat-syarat khusus kontrak untuk pengembangan aplikasi mobile...', '/documents/sskk/SSKK-2026-001.pdf', v_ppk_user_id)
    RETURNING id INTO v_sskk_id;

    -- =============================================================================
    -- 7. REKENING PENYEDIA
    -- =============================================================================

    INSERT INTO asisten.rekening_penyedia (kontrak_id, nama_bank, cabang_bank, nomor_rekening, nama_rekening, is_primary, created_by)
    VALUES (v_kontrak_id, 'Bank Mandiri', 'KCP Sudirman', '1234567890123', 'PT. Digital Solutions Indonesia', true, v_ppk_user_id)
    RETURNING id INTO v_rekening_id;

    -- =============================================================================
    -- 8. SPMK - Surat Perintah Mulai Kerja
    -- =============================================================================

    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-SPMK-2026-001', 'SPMK Pengembangan Aplikasi Mobile', 'SPMK', 'Surat Perintah Mulai Kerja', v_paket_id, v_kontrak_stage_id, NOW(), v_ppk_user_id)
    RETURNING id INTO v_dokumen_spmk_id;

    INSERT INTO asisten.spmk (nomor, paket_id, kontrak_id, dokumen_id, tanggal_spmk, tanggal_mulai, tanggal_selesai, ppk_id, status, catatan, created_by)
    VALUES (
        'SPMK-2026-001',
        v_paket_id,
        v_kontrak_id,
        v_dokumen_spmk_id,
        NOW(),
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '187 days',
        v_ppk_user_id,
        'BERLANGSUNG',
        'Pekerjaan dapat dimulai setelah tanggal mulai kerja',
        v_ppk_user_id
    )
    RETURNING id INTO v_spmk_id;

    -- Update workflow to PELAKSANAAN stage
    UPDATE asisten.workflow_instance SET current_stage_id = v_pelaksanaan_stage_id WHERE id = v_workflow_instance_id;

    -- =============================================================================
    -- 9. BA KEMAJUAN - Progress Report (100% completion)
    -- =============================================================================

    INSERT INTO asisten.ba_kemajuan (nomor, kontrak_id, spmk_id, tanggal_ba, periode_dari, periode_sampai, persentase_fisik, persentase_waktu, uraian_kemajuan, kendala, catatan, created_by)
    VALUES (
        'BA-KMJ-2026-001',
        v_kontrak_id,
        v_spmk_id,
        NOW() + INTERVAL '175 days',
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '175 days',
        100.00,
        97.22,
        'Seluruh pekerjaan telah selesai dilaksanakan sesuai dengan kontrak. Aplikasi mobile iOS dan Android telah selesai dikembangkan, diuji, dan siap untuk diserahterimakan.',
        'Tidak ada kendala signifikan selama pelaksanaan',
        'Progress final - pekerjaan 100% selesai',
        v_ppk_user_id
    )
    RETURNING id INTO v_ba_kemajuan_id;

    -- =============================================================================
    -- 10. BAHP - Berita Acara Hasil Pemeriksaan
    -- =============================================================================

    INSERT INTO asisten.bahp (nomor, kontrak_id, tanggal_bahp, hasil_pemeriksaan, rekomendasi, sesuai_kontrak, catatan, created_by)
    VALUES (
        'BAHP-2026-001',
        v_kontrak_id,
        NOW() + INTERVAL '178 days',
        'Hasil pemeriksaan menunjukkan bahwa seluruh pekerjaan telah selesai dilaksanakan sesuai dengan spesifikasi dalam kontrak. Aplikasi mobile berfungsi dengan baik dan telah melewati semua test case.',
        'Pekerjaan dapat diterima dan dilanjutkan dengan proses serah terima',
        true,
        'Pemeriksaan dilakukan oleh Tim Pemeriksa tanggal ' || (NOW() + INTERVAL '178 days')::date,
        v_verifikator_user_id
    )
    RETURNING id INTO v_bahp_id;

    -- =============================================================================
    -- 11. BAST - Berita Acara Serah Terima (FHO)
    -- =============================================================================

    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-BAST-2026-001', 'BAST Pengembangan Aplikasi Mobile', 'BAST', 'Berita Acara Serah Terima Final', v_paket_id, v_pelaksanaan_stage_id, NOW() + INTERVAL '180 days', v_ppk_user_id)
    RETURNING id INTO v_dokumen_bast_id;

    INSERT INTO asisten.bast (nomor, paket_id, kontrak_id, bahp_id, dokumen_id, tanggal_bast, jenis_serah, uraian_pekerjaan, nilai_pekerjaan, ppk_id, penerima_id, status, catatan, created_by)
    VALUES (
        'BAST-2026-001',
        v_paket_id,
        v_kontrak_id,
        v_bahp_id,
        v_dokumen_bast_id,
        NOW() + INTERVAL '180 days',
        'FHO',
        'Serah terima final hasil pekerjaan pengembangan aplikasi mobile iOS dan Android, termasuk source code, dokumentasi teknis, dan user manual.',
        330000000.00,
        v_ppk_user_id,
        v_admin_user_id,
        'DITERIMA',
        'Serah terima final - pekerjaan 100% diterima',
        v_ppk_user_id
    )
    RETURNING id INTO v_bast_id;

    -- Update workflow to PEMBAYARAN stage
    UPDATE asisten.workflow_instance SET current_stage_id = v_pembayaran_stage_id WHERE id = v_workflow_instance_id;

    -- =============================================================================
    -- 12. SPP - Surat Permintaan Pembayaran
    -- =============================================================================

    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-SPP-2026-001', 'SPP Pengembangan Aplikasi Mobile', 'SPP', 'Surat Permintaan Pembayaran', v_paket_id, v_pembayaran_stage_id, NOW() + INTERVAL '182 days', v_bendahara_user_id)
    RETURNING id INTO v_dokumen_spp_id;

    INSERT INTO asisten.spp (nomor, paket_id, kontrak_id, bast_id, dokumen_id, tanggal_spp, jenis_spp, nilai_tagihan, nilai_ppn, nilai_pph, nilai_potongan, nilai_bersih, ppk_id, status, catatan, created_by)
    VALUES (
        'SPP-2026-001',
        v_paket_id,
        v_kontrak_id,
        v_bast_id,
        v_dokumen_spp_id,
        NOW() + INTERVAL '182 days',
        'LS',  -- Langsung (direct payment)
        330000000.00,
        36300000.00,   -- PPN 11%
        6600000.00,    -- PPh 2%
        42900000.00,   -- Total potongan pajak
        287100000.00,  -- Nilai bersih setelah potongan
        v_ppk_user_id,
        'APPROVED',
        'SPP telah diverifikasi dan disetujui',
        v_bendahara_user_id
    )
    RETURNING id INTO v_spp_id;

    -- Add SPP Details
    INSERT INTO asisten.spp_detail (spp_id, urutan, uraian, volume, satuan, harga_satuan, jumlah, created_by)
    VALUES
    (v_spp_id, 1, 'Biaya Personil - Tenaga Ahli dan Asisten', 1, 'Paket', 250000000.00, 250000000.00, v_bendahara_user_id),
    (v_spp_id, 2, 'Biaya Non-Personil - Peralatan dan Software', 1, 'Paket', 50000000.00, 50000000.00, v_bendahara_user_id),
    (v_spp_id, 3, 'Biaya Overhead dan Manajemen', 1, 'Paket', 30000000.00, 30000000.00, v_bendahara_user_id);

    -- Add Tax Deductions
    INSERT INTO asisten.potongan_pajak (spp_id, jenis_pajak, dasar_pajak, tarif, nilai_pajak, npwp, nama_wp, catatan, created_by)
    VALUES
    (v_spp_id, 'PPN', 330000000.00, 11.00, 36300000.00, '01.234.567.8-901.000', 'PT. Digital Solutions Indonesia', 'PPN atas jasa konsultansi', v_verifikator_user_id),
    (v_spp_id, 'PPh23', 330000000.00, 2.00, 6600000.00, '01.234.567.8-901.000', 'PT. Digital Solutions Indonesia', 'PPh Pasal 23 atas jasa konsultansi', v_verifikator_user_id);

    -- =============================================================================
    -- 13. SPM - Surat Perintah Membayar
    -- =============================================================================

    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-SPM-2026-001', 'SPM Pengembangan Aplikasi Mobile', 'SPM', 'Surat Perintah Membayar', v_paket_id, v_pembayaran_stage_id, NOW() + INTERVAL '185 days', v_ppk_user_id)
    RETURNING id INTO v_dokumen_spm_id;

    INSERT INTO asisten.spm (nomor, paket_id, spp_id, dokumen_id, tanggal_spm, jenis_spm, nilai_spm, kuasa_pa_id, status, catatan, created_by)
    VALUES (
        'SPM-2026-001',
        v_paket_id,
        v_spp_id,
        v_dokumen_spm_id,
        NOW() + INTERVAL '185 days',
        'LS',
        287100000.00,
        v_ppk_user_id,
        'DIAJUKAN_SP2D',
        'SPM telah diterbitkan dan diajukan untuk pencairan',
        v_ppk_user_id
    )
    RETURNING id INTO v_spm_id;

    -- Update SPP status to TERBIT_SPM
    UPDATE asisten.spp SET status = 'TERBIT_SPM' WHERE id = v_spp_id;

    -- =============================================================================
    -- 14. SP2D - Surat Perintah Pencairan Dana
    -- =============================================================================

    INSERT INTO asisten.dokumen (nomor, judul, tipe, deskripsi, paket_id, workflow_stage_id, tanggal_dokumen, created_by)
    VALUES ('DOK-SP2D-2026-001', 'SP2D Pengembangan Aplikasi Mobile', 'SP2D', 'Surat Perintah Pencairan Dana', v_paket_id, v_pembayaran_stage_id, NOW() + INTERVAL '187 days', v_bendahara_user_id)
    RETURNING id INTO v_dokumen_sp2d_id;

    INSERT INTO asisten.sp2d (nomor, paket_id, spm_id, dokumen_id, tanggal_sp2d, nilai_sp2d, bank_penerima, rekening_penerima, nama_penerima, kuasa_bud_id, tanggal_cair, status, catatan, created_by)
    VALUES (
        'SP2D-2026-001',
        v_paket_id,
        v_spm_id,
        v_dokumen_sp2d_id,
        NOW() + INTERVAL '187 days',
        287100000.00,
        'Bank Mandiri',
        '1234567890123',
        'PT. Digital Solutions Indonesia',
        v_bendahara_user_id,
        NOW() + INTERVAL '188 days',
        'SELESAI',
        'Dana telah dicairkan ke rekening penyedia',
        v_bendahara_user_id
    )
    RETURNING id INTO v_sp2d_id;

    -- Update SPM status to SELESAI
    UPDATE asisten.spm SET status = 'SELESAI' WHERE id = v_spm_id;

    -- =============================================================================
    -- 15. FINALIZE - Move to ARSIP
    -- =============================================================================

    -- Update workflow to ARSIP stage
    UPDATE asisten.workflow_instance
    SET current_stage_id = v_arsip_stage_id,
        completed_at = NOW() + INTERVAL '190 days',
        is_active = FALSE
    WHERE id = v_workflow_instance_id;

    -- Update paket nilai_kontrak
    UPDATE asisten.paket SET nilai_kontrak = 330000000.00 WHERE id = v_paket_id;

    -- Log completion
    RAISE NOTICE 'Sample scenario created successfully!';
    RAISE NOTICE 'Paket ID: %', v_paket_id;
    RAISE NOTICE 'Kontrak ID: %', v_kontrak_id;
    RAISE NOTICE 'SP2D ID: %', v_sp2d_id;
    RAISE NOTICE 'Total Kontrak: Rp 330,000,000';
    RAISE NOTICE 'Total Dibayar: Rp 287,100,000 (setelah potongan pajak)';

END;
$$;

-- =============================================================================
-- QUERY TO VIEW THE COMPLETE SCENARIO
-- =============================================================================

-- Uncomment to view the scenario after running the seed:
/*
SELECT
    p.kode AS paket_kode,
    p.nama AS paket_nama,
    k.nomor AS kontrak_nomor,
    k.nama_penyedia,
    k.nilai_kontrak,
    s.nomor AS sp2d_nomor,
    s.nilai_sp2d,
    s.tanggal_cair,
    s.status AS sp2d_status,
    ws.kode AS workflow_stage
FROM asisten.paket p
JOIN asisten.kontrak k ON k.paket_id = p.id
JOIN asisten.sp2d s ON s.paket_id = p.id
JOIN asisten.workflow_instance wi ON wi.paket_id = p.id
JOIN asisten.workflow_stage ws ON ws.id = wi.current_stage_id
WHERE p.kode = 'PKT-2026-001';
*/
