# ASISTEN - Entity Relationship Diagram (ERD)
## Phase 1 Core System

```
================================================================================
                        ASISTEN DATABASE SCHEMA ERD
                              Schema: asisten
================================================================================

+-----------------------------------------------------------------------------------+
|                              SECURITY DOMAIN                                       |
+-----------------------------------------------------------------------------------+

    +-------------------+          +-------------------+
    |      users        |          |      roles        |
    +-------------------+          +-------------------+
    | PK id: UUID       |          | PK id: UUID       |
    |    username       |          |    kode           |
    |    email          |          |    nama           |
    |    password       |          |    deskripsi      |
    |    nama           |          |    level          |
    |    nip            |          |    permissions    |
    |    jabatan        |          |    created_at     |
    |    unit_kerja     |          |    created_by     |
    |    is_active      |          |    updated_at     |
    |    last_login     |          |    updated_by     |
    |    created_at     |          |    is_deleted     |
    |    created_by     |          +-------------------+
    |    updated_at     |                   |
    |    updated_by     |                   |
    |    is_deleted     |                   |
    +-------------------+                   |
            |                               |
            |         +-------------------+ |
            +-------->|   user_roles      |<+
                      +-------------------+
                      | PK id: UUID       |
                      | FK user_id        |-----> users.id
                      | FK role_id        |-----> roles.id
                      |    created_at     |
                      |    created_by     |
                      |    updated_at     |
                      |    updated_by     |
                      |    is_deleted     |
                      +-------------------+


+-----------------------------------------------------------------------------------+
|                           BUSINESS OBJECT DOMAIN                                   |
+-----------------------------------------------------------------------------------+

    +-------------------+          +-------------------+
    |    kegiatan       |<---------|      paket        |
    +-------------------+   1:N    +-------------------+
    | PK id: UUID       |          | PK id: UUID       |
    |    kode           |          |    kode           |
    |    nama           |          |    nama           |
    |    deskripsi      |          |    deskripsi      |
    |    tahun_anggaran |          |    tahun_anggaran |
    |    pagu_anggaran  |          |    nilai_pagu     |
    |    unit_kerja     |          |    nilai_kontrak  |
    |    program        |          |    tanggal_mulai  |
    |    created_at     |          |    tanggal_selesai|
    |    created_by     |          |    lokasi         |
    |    updated_at     |          | FK kegiatan_id    |-----> kegiatan.id
    |    updated_by     |          |    created_at     |
    |    is_deleted     |          |    created_by     |
    +-------------------+          |    updated_at     |
                                   |    updated_by     |
                                   |    is_deleted     |
                                   +-------------------+
                                            |
                                            | 1:1
                                            v
+-----------------------------------------------------------------------------------+
|                           WORKFLOW ENGINE DOMAIN                                   |
+-----------------------------------------------------------------------------------+

    +---------------------+
    |  workflow_stage     |
    +---------------------+
    | PK id: UUID         |
    |    kode: ENUM       |  <-- WorkflowState
    |    nama             |
    |    deskripsi        |
    |    urutan           |
    |    is_initial       |
    |    is_final         |
    |    color            |
    |    created_at       |
    |    created_by       |
    |    updated_at       |
    |    updated_by       |
    |    is_deleted       |
    +---------------------+
            ^       ^
            |       |
      from  |       | to
            |       |
    +---------------------+        +---------------------+
    |workflow_transition  |------->| workflow_instance   |
    +---------------------+  N:1   +---------------------+
    | PK id: UUID         |        | PK id: UUID         |
    | FK workflow_inst_id |------->| FK paket_id (UNIQUE)|-----> paket.id
    | FK from_stage_id    |        | FK current_stage_id |-----> workflow_stage.id
    | FK to_stage_id      |        |    started_at       |
    |    transitioned_at  |        |    completed_at     |
    |    transitioned_by  |        |    is_active        |
    |    catatan          |        |    metadata         |
    |    metadata         |        |    created_at       |
    |    created_at       |        |    created_by       |
    |    created_by       |        |    updated_at       |
    |    updated_at       |        |    updated_by       |
    |    updated_by       |        |    is_deleted       |
    |    is_deleted       |        +---------------------+
    +---------------------+


+-----------------------------------------------------------------------------------+
|                           DOCUMENT ENGINE DOMAIN                                   |
+-----------------------------------------------------------------------------------+

    +-------------------+          +-------------------+
    |     dokumen       |--------->|  dokumen_versi    |
    +-------------------+   1:N    +-------------------+
    | PK id: UUID       |          | PK id: UUID       |
    |    nomor          |          | FK dokumen_id     |-----> dokumen.id
    |    judul          |          |    versi          |
    |    tipe: ENUM     |          |    file_path      |
    |    deskripsi      |          |    file_name      |
    | FK paket_id       |-----> paket.id               |
    | FK workflow_stg_id|-----> workflow_stage.id      |
    |    tanggal_dokumen|          |    file_size      |
    |    current_version|          |    mime_type      |
    |    metadata       |          |    checksum       |
    |    created_at     |          |    catatan        |
    |    created_by     |          |    is_current     |
    |    updated_at     |          |    created_at     |
    |    updated_by     |          |    created_by     |
    |    is_deleted     |          |    updated_at     |
    +-------------------+          |    updated_by     |
            |                      |    is_deleted     |
            |                      +-------------------+
            |
            |  Self-referencing (Adendum/Revision chain)
            v
    +---------------------+
    |  dokumen_relasi     |
    +---------------------+
    | PK id: UUID         |
    | FK parent_dokumen_id|-----> dokumen.id (parent)
    | FK child_dokumen_id |-----> dokumen.id (child)
    |    tipe_relasi: ENUM|  <-- ADENDUM, REVISI, LAMPIRAN, REFERENSI
    |    catatan          |
    |    urutan           |
    |    created_at       |
    |    created_by       |
    |    updated_at       |
    |    updated_by       |
    |    is_deleted       |
    +---------------------+


+-----------------------------------------------------------------------------------+
|                        APPROVAL & AUDIT DOMAIN                                     |
+-----------------------------------------------------------------------------------+

    +-------------------+          +-------------------+
    |   approval_log    |          |    audit_log      |
    +-------------------+          +-------------------+
    | PK id: UUID       |          | PK id: UUID       |
    | FK dokumen_id     |-----> dokumen.id             |
    | FK role_id        |-----> roles.id               |
    | FK approver_id    |-----> users.id               |
    |    status: ENUM   |          |    table_name     |
    |    catatan        |          |    record_id      |
    |    approved_at    |          |    action         |
    |    metadata       |          |    old_values     |
    |    created_at     |          |    new_values     |
    |    created_by     |          | FK actor_id       |-----> users.id
    |    updated_at     |          |    ip_address     |
    |    updated_by     |          |    user_agent     |
    |    is_deleted     |          |    created_at     |
    +-------------------+          |    created_by     |
                                   +-------------------+
                                   * IMMUTABLE (INSERT only)


+-----------------------------------------------------------------------------------+
|                              SPPD CORE DOMAIN                                      |
+-----------------------------------------------------------------------------------+

                        +---------------------+
                        |  perjalanan_dinas   |
                        +---------------------+
                        | PK id: UUID         |
                        |    nomor            |
                        | FK paket_id         |-----> paket.id
                        |    maksud_perjalanan|
                        |    kota_asal        |
                        |    kota_tujuan      |
                        |    tanggal_berangkat|
                        |    tanggal_kembali  |
                        |    lama_hari        |
                        |    status: ENUM     |
                        |    catatan          |
                        |    created_at       |
                        |    created_by       |
                        |    updated_at       |
                        |    updated_by       |
                        |    is_deleted       |
                        +---------------------+
                           |       |        |
            +--------------+       |        +--------------+
            |                      |                       |
            v                      v                       v
    +-------------------+  +-------------------+  +-------------------+
    |peserta_perjalanan |  |   surat_tugas     |  |       sppd        |
    +-------------------+  +-------------------+  +-------------------+
    | PK id: UUID       |  | PK id: UUID       |  | PK id: UUID       |
    | FK perjalanan_id  |  | FK perjalanan_id  |  | FK perjalanan_id  |
    | FK user_id        |  |    nomor          |  |    nomor          |
    |    tingkat_biaya  |  |    tanggal_surat  |  |    tanggal_sppd   |
    |    golongan       |  |    perihal        |  | FK pejabat_id     |
    |    jabatan_perjln |  |    dasar          |  |    jabatan_pemberi|
    |    is_ketua       |  | FK penanda_tgn_id |  |    instansi       |
    |    catatan        |  |    jabatan_penanda|  |    mata_anggaran  |
    |    created_at     |  |    file_path      |  |    keterangan     |
    |    created_by     |  |    created_at     |  |    file_path      |
    |    updated_at     |  |    created_by     |  |    created_at     |
    |    updated_by     |  |    updated_at     |  |    created_by     |
    |    is_deleted     |  |    updated_by     |  |    updated_at     |
    +-------------------+  |    is_deleted     |  |    updated_by     |
            |              +-------------------+  |    is_deleted     |
            v                                    +-------------------+
        users.id


+-----------------------------------------------------------------------------------+
|                            FINANCE CORE DOMAIN                                     |
+-----------------------------------------------------------------------------------+

    +-------------------+
    | uang_persediaan   |
    +-------------------+
    | PK id: UUID       |
    |    nomor          |
    | FK paket_id       |-----> paket.id
    |    tanggal        |
    |    nilai          |
    |    sisa           |
    | FK bendahara_id   |-----> users.id
    |    keterangan     |
    |    status: ENUM   |
    |    created_at     |
    |    created_by     |
    |    updated_at     |
    |    updated_by     |
    |    is_deleted     |
    +-------------------+
            |
            | 1:N
            v
    +-------------------+        +---------------------+
    |     kuitansi      |------->| pertanggungjawaban  |
    +-------------------+  N:1   +---------------------+
    | PK id: UUID       |        | PK id: UUID         |
    |    nomor          |        |    nomor            |
    | FK uang_persdn_id |        | FK uang_persdn_id   |-----> uang_persediaan.id
    |    tanggal        |        | FK perjalanan_id    |-----> perjalanan_dinas.id
    |    uraian         |        | FK kuitansi_id      |-----> kuitansi.id
    |    nilai          |        |    tanggal          |
    |    penerima       |        |    jenis            |
    |    jenis_belanja  |        |    total_nilai      |
    |    bukti_pendukung|        |    status: ENUM     |
    |    status: ENUM   |        | FK verifikator_id   |-----> users.id
    |    created_at     |        |    tanggal_verif    |
    |    created_by     |        |    catatan_verif    |
    |    updated_at     |        |    created_at       |
    |    updated_by     |        |    created_by       |
    |    is_deleted     |        |    updated_at       |
    +-------------------+        |    updated_by       |
                                 |    is_deleted       |
                                 +---------------------+


================================================================================
                              ENUM DEFINITIONS
================================================================================

WorkflowState:
    - PERENCANAAN
    - PERSIAPAN
    - KONTRAK
    - PELAKSANAAN
    - PEMBAYARAN
    - ARSIP

ApprovalStatus:
    - PENDING
    - APPROVED
    - REJECTED
    - REVISION_REQUESTED

DokumenTipe:
    - KONTRAK
    - ADENDUM
    - SURAT_TUGAS
    - SPPD
    - KUITANSI
    - LAPORAN
    - BERITA_ACARA
    - LAINNYA

DokumenRelasiTipe:
    - ADENDUM
    - REVISI
    - LAMPIRAN
    - REFERENSI

PerjalananStatus:
    - DRAFT
    - DIAJUKAN
    - DISETUJUI
    - BERLANGSUNG
    - SELESAI
    - DIBATALKAN

PembayaranStatus:
    - DRAFT
    - DIAJUKAN
    - DIVERIFIKASI
    - DIBAYAR
    - DITOLAK


================================================================================
                          RELATIONSHIP SUMMARY
================================================================================

KEY RELATIONSHIPS:
------------------
1. users <-->> user_roles <<--> roles       (Many-to-Many)
2. kegiatan <-- paket                       (One-to-Many)
3. paket <--> workflow_instance             (One-to-One, UNIQUE constraint)
4. workflow_instance --> workflow_stage     (Many-to-One, current_stage)
5. workflow_transition --> workflow_stage   (Many-to-One, from/to stages)
6. paket <-- dokumen                        (One-to-Many)
7. dokumen --> workflow_stage               (Many-to-One)
8. dokumen <-- dokumen_versi                (One-to-Many)
9. dokumen <-- dokumen_relasi --> dokumen   (Self-referencing, adendum/revision)
10. dokumen <-- approval_log                (One-to-Many)
11. approval_log --> roles                  (Many-to-One)
12. paket <-- perjalanan_dinas              (One-to-Many, optional)
13. perjalanan_dinas <-- peserta_perjalanan (One-to-Many)
14. perjalanan_dinas <-- surat_tugas        (One-to-Many)
15. perjalanan_dinas <-- sppd               (One-to-Many)
16. paket <-- uang_persediaan               (One-to-Many, optional)
17. uang_persediaan <-- kuitansi            (One-to-Many)
18. pertanggungjawaban --> uang_persediaan  (Many-to-One, optional)
19. pertanggungjawaban --> perjalanan_dinas (Many-to-One, optional)
20. pertanggungjawaban --> kuitansi         (Many-to-One, optional)


CASCADE DELETE RULES:
---------------------
- users deletion: CASCADES to user_roles
- paket deletion: CASCADES to workflow_instance, dokumen
- workflow_instance deletion: CASCADES to workflow_transition
- dokumen deletion: CASCADES to dokumen_versi, dokumen_relasi, approval_log
- perjalanan_dinas deletion: CASCADES to peserta_perjalanan, surat_tugas, sppd


IMMUTABLE TABLE:
----------------
- audit_log: INSERT only, UPDATE/DELETE blocked via PostgreSQL rules


================================================================================
                              TABLE COUNT: 20
================================================================================

Security (3):        users, roles, user_roles
Business (2):        paket, kegiatan
Workflow (3):        workflow_stage, workflow_instance, workflow_transition
Document (3):        dokumen, dokumen_versi, dokumen_relasi
Approval/Audit (2):  approval_log, audit_log
SPPD (4):            perjalanan_dinas, peserta_perjalanan, surat_tugas, sppd
Finance (3):         uang_persediaan, kuitansi, pertanggungjawaban

================================================================================
```
