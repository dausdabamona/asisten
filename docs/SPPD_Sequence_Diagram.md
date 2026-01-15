# ASISTEN - SPPD Lifecycle Sequence Diagram
## Phase 2: Travel & Treasury Module

```
================================================================================
                     SPPD COMPLETE LIFECYCLE SEQUENCE
               From Draft to Archive with Financial Settlement
================================================================================


ACTORS:
-------
PPTK      = Pejabat Pelaksana Teknis Kegiatan
PPK       = Pejabat Pembuat Komitmen
BENDAHARA = Bendahara Pengeluaran
VERIF     = Verifikator
STAFF     = Staff (Traveler)
SYSTEM    = Application System


================================================================================
                        STAGE 1: PERENCANAAN
================================================================================

PPTK                PPK                 SYSTEM              DATABASE
 |                   |                    |                    |
 |--[1. Create Perjalanan Dinas]--------->|                    |
 |                   |                    |--[INSERT]--------->|
 |                   |                    |<---[perjalanan_id]-|
 |                   |                    |                    |
 |--[2. Add Peserta Perjalanan]---------->|                    |
 |                   |                    |--[INSERT]--------->|
 |                   |                    |                    |
 |--[3. Draft Surat Tugas]--------------->|                    |
 |                   |                    |--[INSERT dokumen]->|
 |                   |                    |--[INSERT surat_tugas]>|
 |                   |                    |--[LOG audit_log]-->|
 |                   |                    |                    |
 |--[4. Submit for Approval]------------->|                    |
 |                   |                    |--[UPDATE status]-->|
 |                   |<--[Notification]---|                    |
 |                   |                    |                    |
 |                   |--[5. Review & Approve]----------------->|
 |                   |                    |--[INSERT approval_log]>|
 |                   |                    |--[TRANSITION]----->|
 |                   |                    |   PERENCANAAN->PERSIAPAN
 |                   |                    |                    |


================================================================================
                        STAGE 2: PERSIAPAN
================================================================================

PPTK                PPK                 BENDAHARA           SYSTEM
 |                   |                    |                    |
 |--[6. Finalize Surat Tugas]-------------|------------------>|
 |                   |                    |                    |
 |                   |--[7. Approve ST]---|------------------>|
 |                   |                    |--[UPDATE ST status=APPROVED]
 |                   |                    |--[LOG audit_log]-->|
 |                   |                    |                    |
 |--[8. Create SPPD]-----------------------|------------------>|
 |                   |                    |   (validates ST approved)
 |                   |                    |--[INSERT dokumen]->|
 |                   |                    |--[INSERT sppd]--->|
 |                   |                    |--[LOG audit_log]-->|
 |                   |                    |                    |
 |                   |--[9. Terbit SPPD]--|------------------>|
 |                   |                    |--[UPDATE sppd status=TERBIT]
 |                   |                    |--[LOG audit_log]-->|
 |                   |                    |                    |
 |--[10. Request Uang Muka]----------------|------------------>|
 |                   |                    |   POST /keuangan/uang-muka
 |                   |                    |   (validates UP balance)
 |                   |                    |--[INSERT dokumen]->|
 |                   |                    |--[INSERT kuitansi tipe=UANG_MUKA]
 |                   |                    |--[LOG audit_log]-->|
 |                   |                    |                    |
 |                   |                    |--[11. Approve UM]->|
 |                   |                    |--[UPDATE kuitansi status]
 |                   |                    |--[UPDATE UP sisa]-|
 |                   |                    |--[LOG audit_log]-->|
 |                   |                    |                    |
 |--[12. Start Perjalanan]-----------------|------------------>|
 |                   |                    |--[UPDATE status=BERLANGSUNG]
 |                   |                    |--[TRANSITION]----->|
 |                   |                    |   PERSIAPAN->PELAKSANAAN


================================================================================
                        STAGE 3: PELAKSANAAN
================================================================================

STAFF               PPTK                SYSTEM              DATABASE
 |                   |                    |                    |
 |--[Travel Execution]                    |                    |
 |   (Physical travel occurs)             |                    |
 |                   |                    |                    |
 |--[13. Record Realisasi]--------------->|                    |
 |   (update biaya per peserta)           |--[UPDATE peserta]->|
 |                   |                    |--[UPDATE perjalanan totals]
 |                   |                    |                    |
 |--[14. Upload Bukti Pendukung]--------->|                    |
 |                   |                    |--[INSERT dokumen_versi]
 |                   |                    |                    |
 |                   |--[15. Create Laporan]----------------->|
 |                   |                    |--[INSERT dokumen tipe=LAPORAN_SPPD]
 |                   |                    |                    |
 |                   |--[16. Complete Travel]---------------->|
 |                   |                    |--[UPDATE status=SELESAI]
 |                   |                    |--[TRANSITION]----->|
 |                   |                    |   PELAKSANAAN->PEMBAYARAN


================================================================================
                        STAGE 4: PEMBAYARAN
================================================================================

PPTK                BENDAHARA           VERIF               PPK
 |                   |                    |                    |
 |--[17. Create Kuitansi Rampung]-------->|                    |
 |   POST /keuangan/rampung              |                    |
 |   (auto-calc selisih from UM)          |                    |
 |   [INSERT dokumen tipe=KUITANSI_RAMPUNG]                   |
 |   [INSERT kuitansi tipe=RAMPUNG]       |                    |
 |   [LOG audit_log]                      |                    |
 |                   |                    |                    |
 |                   |                    |--[18. Verify KR]-->|
 |                   |                    |   [INSERT approval_log]
 |                   |                    |   [UPDATE status=DIVERIFIKASI]
 |                   |                    |                    |
 |                   |--[19. Approve KR]--|------------------>|
 |                   |   [UPDATE status=DIBAYAR]              |
 |                   |   [UPDATE UP sisa (if selisih > 0)]    |
 |                   |   [LOG audit_log]  |                    |
 |                   |                    |                    |
 |                   |--[20. Create SPJ]--|------------------>|
 |                   |   POST /keuangan/spj                   |
 |                   |   (calc totals: UM, realisasi, sisa)   |
 |                   |   [INSERT dokumen tipe=SPJ_UP]         |
 |                   |   [INSERT pertanggungjawaban]          |
 |                   |   [LOG audit_log]  |                    |
 |                   |                    |                    |
 |                   |                    |--[21. Verify SPJ]->|
 |                   |                    |   [UPDATE status=DIVERIFIKASI]
 |                   |                    |   [INSERT approval_log]
 |                   |                    |                    |
 |                   |--[22. Co-sign SPJ]-|------------------>|
 |                   |   [UPDATE tanggal_verifikasi]          |
 |                   |                    |                    |
 |                   |                    |                    |--[23. Final Approve SPJ]
 |                   |                    |                    |   [UPDATE status=DISAHKAN]
 |                   |                    |                    |   [UPDATE pengesah_id]
 |                   |                    |                    |   [INSERT approval_log]
 |                   |                    |                    |   [LOG audit_log]
 |                   |                    |                    |
 |                   |--[24. Complete Pembayaran]------------>|
 |                   |   [TRANSITION: PEMBAYARAN->ARSIP]      |


================================================================================
                        STAGE 5: ARSIP
================================================================================

PPTK                PPK                 SYSTEM              DATABASE
 |                   |                    |                    |
 |--[25. Archive Documents]-------------->|                    |
 |   (validate all SPJ balanced)          |                    |
 |                   |                    |                    |
 |                   |--[26. Finalize]---->                    |
 |                   |                    |--[UPDATE workflow completed_at]
 |                   |                    |--[UPDATE workflow is_active=FALSE]
 |                   |                    |--[LOG audit_log]-->|
 |                   |                    |                    |
                              COMPLETE
                              ========


================================================================================
                      API ENDPOINT MAPPING
================================================================================

Step | Endpoint                    | Method | Description
-----|-----------------------------| -------|----------------------------------
1    | N/A (direct DB)             | -      | Create perjalanan_dinas
3    | POST /sppd/surat-tugas      | POST   | Create Surat Tugas
5    | POST /workflow/approve      | POST   | Approve document
8    | POST /sppd/terbit           | POST   | Issue SPPD
10   | POST /keuangan/uang-muka    | POST   | Create Kuitansi UM
11   | POST /workflow/approve      | POST   | Approve UM
17   | POST /keuangan/rampung      | POST   | Create Kuitansi Rampung
18   | POST /workflow/approve      | POST   | Verify Kuitansi
20   | POST /keuangan/spj          | POST   | Create SPJ
21   | POST /workflow/approve      | POST   | Verify SPJ
23   | POST /workflow/approve      | POST   | Pengesahan SPJ
24   | POST /workflow/transition   | POST   | Transition to ARSIP


================================================================================
                      FINANCIAL FLOW SUMMARY
================================================================================

UP Balance: 50,000,000 (initial)
            ↓
[Kuitansi UM: 7,500,000 disbursed]
            ↓
UP Balance: 42,500,000 (after UM)
            ↓
[Travel executed, actual cost: 7,250,000]
            ↓
[Kuitansi Rampung: selisih = 250,000 (return)]
            ↓
UP Balance: 42,750,000 (after reconciliation)
            ↓
[SPJ created: balanced]
            ↓
                CLOSED


================================================================================
                      DOCUMENT TRAIL
================================================================================

1. Surat Tugas (ST-2026-001)
   ├── dokumen_id → approved via approval_log
   └── status: DRAFT → MENUNGGU_APPROVAL → APPROVED → FINAL

2. SPPD (SPPD-2026-001)
   ├── dokumen_id → approved via approval_log
   └── status: DRAFT → TERBIT → SELESAI

3. Kuitansi Uang Muka (KUM-2026-001)
   ├── dokumen_id → approved via approval_log
   ├── nilai: 7,500,000
   └── status: DRAFT → DIBAYAR

4. Kuitansi Rampung (KR-2026-001)
   ├── dokumen_id → approved via approval_log
   ├── kuitansi_um_id → KUM-2026-001
   ├── nilai_um: 7,500,000
   ├── nilai_realisasi: 7,250,000
   ├── selisih: 250,000 (returned)
   └── status: DRAFT → DIVERIFIKASI → DIBAYAR

5. SPJ (SPJ-UP-2026-001)
   ├── dokumen_id → approved via approval_log
   ├── total_um: 7,500,000
   ├── total_realisasi: 7,250,000
   ├── sisa_lebih: 250,000
   └── status: DRAFT → DIAJUKAN → DIVERIFIKASI → DISAHKAN

================================================================================
```
