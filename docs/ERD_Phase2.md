# ASISTEN - Entity Relationship Diagram (ERD)
## Phase 1 + Phase 2: Travel & Treasury Module

```
================================================================================
                    ASISTEN DATABASE SCHEMA ERD - PHASE 2
                              Schema: asisten
================================================================================

+-----------------------------------------------------------------------------------+
|                         PHASE 2: TRAVEL & TREASURY DOMAIN                          |
+-----------------------------------------------------------------------------------+

                              SPPD LIFECYCLE FLOW
                              ===================

    +-------------------+          +-------------------+
    | workflow_instance |--------->|   workflow_stage  |
    +-------------------+   N:1    +-------------------+
    | PK id: UUID       |          | PK id: UUID       |
    | FK paket_id       |          |    kode: ENUM     |
    | FK current_stage  |          |    nama           |
    |    started_at     |          |    urutan         |
    |    completed_at   |          |    is_initial     |
    |    is_active      |          |    is_final       |
    +-------------------+          +-------------------+
            |                               |
            | 1:N                           | 1:N
            v                               v
    +-------------------+          +-------------------+
    | perjalanan_dinas  |          | workflow_action   |  <-- NEW Phase 2
    +-------------------+          +-------------------+
    | PK id: UUID       |          | PK id: UUID       |
    |    nomor          |          | FK workflow_stage |
    | FK paket_id       |          |    action_code    |
    | FK workflow_inst  |<-- NEW   |    action_name    |
    |    maksud         |          | FK required_role  |
    |    kota_asal      |          |    is_approval    |
    |    kota_tujuan    |          +-------------------+
    |    tgl_berangkat  |
    |    tgl_kembali    |
    |    lama_hari      |
    |    status: ENUM   |
    |    total_estimasi |<-- NEW
    |    total_realisasi|<-- NEW
    +-------------------+
         |         |
         |         +------------------+
         |                            |
    1:1  |                       1:N  |
         v                            v
    +-------------------+     +-------------------+
    |   surat_tugas     |     |       sppd        |
    +-------------------+     +-------------------+
    | PK id: UUID       |     | PK id: UUID       |
    |    nomor          |     |    nomor          |
    | FK perjalanan_id  |UNIQUE FK perjalanan_id |
    | FK dokumen_id     |<-- NEW FK dokumen_id   |<-- NEW
    |    tanggal_surat  |     |    tanggal_sppd   |
    |    perihal        |     |    pejabat_id     |
    |    dasar          |     |    jabatan        |
    |    penanda_tgn_id |     |    mata_anggaran  |
    |    status: ENUM   |<-- NEW status: ENUM    |<-- NEW
    +-------------------+     +-------------------+


                           TREASURY FLOW (UP/TUP)
                           ======================

    +---------------------+          +------------------------+
    |  uang_persediaan    |--------->| tambahan_uang_persediaan|  <-- NEW
    +---------------------+   1:N    +------------------------+
    | PK id: UUID         |          | PK id: UUID            |
    |    nomor            |          |    nomor               |
    | FK paket_id         |          | FK uang_persediaan_id  |
    |    tanggal          |          | FK paket_id            |
    |    nilai            |          |    tanggal             |
    |    sisa             |          |    nilai               |
    | FK bendahara_id     |          |    sisa                |
    |    status: ENUM     |          |    alasan              |
    |    treasury_type    |<-- NEW   |    batas_waktu         |
    +---------------------+          |    status: ENUM        |
            |                        +------------------------+
            |                                 |
            | 1:N                             | 1:N
            v                                 v
    +--------------------------------------------------+
    |                    kuitansi                       |
    +--------------------------------------------------+
    | PK id: UUID                                       |
    |    nomor                                          |
    | FK uang_persediaan_id                             |
    | FK tup_id                       <-- NEW           |
    | FK perjalanan_dinas_id          <-- NEW           |
    | FK dokumen_id                   <-- NEW           |
    | FK kuitansi_um_id               <-- NEW (self-ref)|
    |    tanggal                                        |
    |    tipe: ENUM                   <-- NEW (UANG_MUKA|RAMPUNG|OPERASIONAL)
    |    uraian                                         |
    |    nilai                                          |
    |    nilai_um                     <-- NEW           |
    |    nilai_realisasi              <-- NEW           |
    |    selisih                      <-- NEW           |
    |    penerima                                       |
    |    status: ENUM                                   |
    +--------------------------------------------------+
            |
            | Reconciliation
            v
    +--------------------------------------------------+
    |              pertanggungjawaban (SPJ)             |
    +--------------------------------------------------+
    | PK id: UUID                                       |
    |    nomor                                          |
    | FK uang_persediaan_id                             |
    | FK tup_id                       <-- NEW           |
    | FK perjalanan_dinas_id                            |
    | FK kuitansi_id                                    |
    | FK workflow_instance_id         <-- NEW           |
    |    tanggal                                        |
    |    jenis                                          |
    |    total_nilai                                    |
    |    total_um                     <-- NEW           |
    |    total_realisasi              <-- NEW           |
    |    sisa_lebih                   <-- NEW           |
    |    sisa_kurang                  <-- NEW           |
    |    status: SPJStatus            <-- NEW ENUM      |
    | FK verifikator_id                                 |
    |    tanggal_verifikasi                             |
    | FK pengesah_id                  <-- NEW           |
    |    tanggal_pengesahan           <-- NEW           |
    +--------------------------------------------------+


                    DOCUMENT ENGINE INTEGRATION
                    ===========================

    +-------------------+
    |     dokumen       |
    +-------------------+
    | PK id: UUID       |
    |    nomor          |
    |    judul          |
    |    tipe: ENUM     |<-- Extended with new types
    | FK paket_id       |
    | FK workflow_stage |
    |    tanggal        |
    +-------------------+
            |
            |  Referenced by (Phase 2):
            |
            +----> surat_tugas.dokumen_id
            +----> sppd.dokumen_id
            +----> kuitansi.dokumen_id
            |
            +----> approval_log.dokumen_id
                   (tracks all approvals)


================================================================================
                         NEW ENUMS (PHASE 2)
================================================================================

SuratTugasStatus:
    - DRAFT
    - MENUNGGU_APPROVAL
    - APPROVED
    - REJECTED
    - FINAL

SppdStatus:
    - DRAFT
    - MENUNGGU_ST      (waiting for Surat Tugas)
    - TERBIT
    - BERLANGSUNG
    - SELESAI
    - DIBATALKAN

TreasuryType:
    - UP               (Uang Persediaan)
    - TUP              (Tambahan Uang Persediaan)

KuitansiTipe:
    - UANG_MUKA        (Advance payment)
    - RAMPUNG          (Settlement)
    - OPERASIONAL      (General operational)

SPJStatus:
    - DRAFT
    - DIAJUKAN
    - DIPERIKSA
    - DIVERIFIKASI
    - DISAHKAN
    - DITOLAK
    - SELESAI

DokumenTipe (Extended):
    - KUITANSI_UM      (Kuitansi Uang Muka)
    - KUITANSI_RAMPUNG (Kuitansi Rampung)
    - LAPORAN_SPPD     (Laporan Perjalanan)
    - SPJ_UP           (SPJ Uang Persediaan)
    - SPJ_TUP          (SPJ Tambahan UP)


================================================================================
                    PHASE 2 RELATIONSHIP SUMMARY
================================================================================

NEW RELATIONSHIPS:
------------------
1. perjalanan_dinas --> workflow_instance   (Many-to-One, optional)
2. surat_tugas --> dokumen                  (Many-to-One, optional)
3. surat_tugas.perjalanan_dinas_id          (UNIQUE - one-to-one enforced)
4. sppd --> dokumen                         (Many-to-One, optional)
5. kuitansi --> tambahan_uang_persediaan    (Many-to-One, optional)
6. kuitansi --> perjalanan_dinas            (Many-to-One, optional)
7. kuitansi --> dokumen                     (Many-to-One, optional)
8. kuitansi --> kuitansi (self-reference)   (RAMPUNG -> UANG_MUKA)
9. pertanggungjawaban --> tup               (Many-to-One, optional)
10. pertanggungjawaban --> workflow_instance (Many-to-One, optional)
11. workflow_action --> workflow_stage      (Many-to-One)
12. workflow_action --> roles               (Many-to-One, required_role)

BUSINESS RULE CONSTRAINTS:
--------------------------
1. SPPD cannot be TERBIT if Surat Tugas not APPROVED
2. Kuitansi UANG_MUKA requires UP/TUP allocation with sufficient balance
3. Kuitansi RAMPUNG must reference a Kuitansi UANG_MUKA
4. Workflow cannot close (ARSIP) if SPJ not DISAHKAN/SELESAI
5. All financial mutations logged to audit_log


================================================================================
                         TABLE COUNT SUMMARY
================================================================================

Phase 1 Tables:     20
Phase 2 New Tables:  2 (workflow_action, tambahan_uang_persediaan)
Total Tables:       22

Security (3):           users, roles, user_roles
Business (2):           paket, kegiatan
Workflow (4):           workflow_stage, workflow_instance, workflow_transition,
                        workflow_action [NEW]
Document (3):           dokumen, dokumen_versi, dokumen_relasi
Approval/Audit (2):     approval_log, audit_log
SPPD (4):               perjalanan_dinas, peserta_perjalanan, surat_tugas, sppd
Finance (4):            uang_persediaan, tambahan_uang_persediaan [NEW],
                        kuitansi, pertanggungjawaban

================================================================================
```
