# ASISTEN Phase 3: ERD - Procurement Contract & Payment Lifecycle

## Overview

Phase 3 extends the ASISTEN system with comprehensive Procurement Contract and Payment modules. This phase adds 17 new tables covering the complete PPK (Pejabat Pembuat Komitmen) end-to-end process from KAK to SP2D.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ASISTEN Phase 3 ERD                                               │
│                        Procurement Contract & Payment Lifecycle                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │    PAKET    │
                                    │  (Phase 1)  │
                                    └──────┬──────┘
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
           ▼                               ▼                               ▼
    ┌─────────────┐                ┌─────────────┐                ┌─────────────┐
    │     KAK     │                │   KONTRAK   │                │     SPP     │
    │ (Table 23)  │                │ (Table 26)  │                │ (Table 34)  │
    └──────┬──────┘                └──────┬──────┘                └──────┬──────┘
           │                               │                               │
           ▼                               │                               │
    ┌─────────────┐                        │                               │
    │     HPS     │                        │                               │
    │ (Table 24)  │                        │                               │
    └──────┬──────┘                        │                               │
           │                               │                               │
           ▼                               │                               │
    ┌─────────────┐                        │                               │
    │  RANCANGAN  │                        │                               │
    │   KONTRAK   │────────────────────────┘                               │
    │ (Table 25)  │                                                        │
    └─────────────┘                                                        │
                                                                           │
                                                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CONTRACT DOCUMENTS                                               │
│                                                                                                  │
│    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐              │
│    │    SSUK     │      │    SSKK     │      │    SPMK     │      │   ADENDUM   │              │
│    │ (Table 27)  │      │ (Table 28)  │      │ (Table 29)  │      │   KONTRAK   │              │
│    │             │      │             │      │             │      │ (Table 30)  │              │
│    └──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘              │
│           │                    │                    │                    │                      │
│           └────────────────────┴────────────────────┴────────────────────┘                      │
│                                         │                                                       │
│                                         ▼                                                       │
│                                  ┌─────────────┐                                               │
│                                  │   KONTRAK   │                                               │
│                                  │ (Table 26)  │                                               │
│                                  └─────────────┘                                               │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  EXECUTION & HANDOVER                                            │
│                                                                                                  │
│    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                                   │
│    │ BA_KEMAJUAN │      │    BAHP     │      │    BAST     │                                   │
│    │ (Table 31)  │ ───► │ (Table 32)  │ ───► │ (Table 33)  │                                   │
│    │             │      │             │      │  PHO/FHO    │                                   │
│    └─────────────┘      └─────────────┘      └──────┬──────┘                                   │
│           ▲                    ▲                    │                                          │
│           │                    │                    │                                          │
│           └────────────────────┴────────────────────┘                                          │
│                                │                                                               │
│                         ┌─────────────┐                                                        │
│                         │   KONTRAK   │                                                        │
│                         │    SPMK     │                                                        │
│                         └─────────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PAYMENT FLOW                                                  │
│                                                                                                  │
│    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                                   │
│    │     SPP     │ ───► │     SPM     │ ───► │    SP2D     │                                   │
│    │ (Table 34)  │      │ (Table 36)  │      │ (Table 37)  │                                   │
│    └──────┬──────┘      └─────────────┘      └─────────────┘                                   │
│           │                                                                                     │
│           ├───────────────────┐                                                                │
│           ▼                   ▼                                                                │
│    ┌─────────────┐      ┌─────────────┐                                                        │
│    │ SPP_DETAIL  │      │  POTONGAN   │                                                        │
│    │ (Table 35)  │      │   PAJAK     │                                                        │
│    └─────────────┘      │ (Table 38)  │                                                        │
│                         └─────────────┘                                                        │
│                                                                                                 │
│    ┌─────────────┐                                                                             │
│    │  REKENING   │                                                                             │
│    │  PENYEDIA   │─────────────── linked to KONTRAK                                            │
│    │ (Table 39)  │                                                                             │
│    └─────────────┘                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Phase 3 Tables Summary

### Contract & Procurement Tables (11 Tables)

| # | Table | Description | Key Relations |
|---|-------|-------------|---------------|
| 23 | `kak` | Kerangka Acuan Kerja (Terms of Reference) | paket, dokumen, users(ppk) |
| 24 | `hps` | Harga Perkiraan Sendiri (Owner's Estimate) | paket, kak, dokumen, users(penyusun) |
| 25 | `rancangan_kontrak` | Draft Contract | hps, dokumen |
| 26 | `kontrak` | Final Contract | paket, rancangan_kontrak, dokumen, users(ppk) |
| 27 | `ssuk` | Syarat-Syarat Umum Kontrak | kontrak, dokumen |
| 28 | `sskk` | Syarat-Syarat Khusus Kontrak | kontrak, dokumen |
| 29 | `spmk` | Surat Perintah Mulai Kerja | paket, kontrak, dokumen, users(ppk) |
| 30 | `adendum_kontrak` | Contract Amendments | kontrak, dokumen |
| 31 | `ba_kemajuan` | Progress Report | kontrak, spmk, dokumen |
| 32 | `bahp` | Inspection Report | kontrak, dokumen |
| 33 | `bast` | Handover Report (PHO/FHO) | paket, kontrak, bahp, dokumen, users(ppk, penerima) |

### Payment Tables (6 Tables)

| # | Table | Description | Key Relations |
|---|-------|-------------|---------------|
| 34 | `spp` | Surat Permintaan Pembayaran | paket, kontrak, bast, dokumen, users(ppk) |
| 35 | `spp_detail` | SPP Line Items | spp |
| 36 | `spm` | Surat Perintah Membayar | paket, spp, dokumen, users(kuasa_pa) |
| 37 | `sp2d` | Surat Perintah Pencairan Dana | paket, spm, dokumen, users(kuasa_bud) |
| 38 | `potongan_pajak` | Tax Deductions | spp |
| 39 | `rekening_penyedia` | Vendor Bank Account | kontrak |

## New Enums (Phase 3)

### Procurement Status Enums
- `KAKStatus`: DRAFT, MENUNGGU_APPROVAL, APPROVED, REJECTED, FINAL
- `HPSStatus`: DRAFT, MENUNGGU_APPROVAL, APPROVED, REJECTED, FINAL
- `KontrakStatus`: DRAFT, NEGOSIASI, MENUNGGU_TTD, AKTIF, SELESAI, DIBATALKAN, DIPUTUS
- `SPMKStatus`: DRAFT, TERBIT, BERLANGSUNG, SELESAI, DIBATALKAN
- `BASTStatus`: DRAFT, DIAJUKAN, DIPERIKSA, DIVERIFIKASI, DITERIMA, DITOLAK

### Payment Status Enums
- `SPPStatus`: DRAFT, DIAJUKAN, DIVERIFIKASI, APPROVED, REJECTED, TERBIT_SPM
- `SPMStatus`: DRAFT, TERBIT, DIAJUKAN_SP2D, SELESAI
- `SP2DStatus`: DRAFT, TERBIT, DICAIRKAN, SELESAI

### Procurement Type Enums
- `JenisPengadaan`: BARANG, JASA_KONSULTANSI, JASA_LAINNYA, PEKERJAAN_KONSTRUKSI
- `MetodePengadaan`: PENGADAAN_LANGSUNG, PENUNJUKAN_LANGSUNG, TENDER, SELEKSI, E_PURCHASING

### Document Signing
- `SignedMethod`: MANUAL_SCAN

## Business Rules (Enforced via Triggers)

1. **HPS requires approved KAK**: Cannot create HPS unless KAK status is APPROVED or FINAL
2. **SPMK requires active Kontrak**: Cannot create SPMK unless Kontrak status is AKTIF (signed)
3. **BAST requires approved BAHP**: Cannot create BAST unless BAHP.sesuai_kontrak = TRUE
4. **SPP-LS requires accepted BAST**: Direct payment SPP requires BAST status = DITERIMA
5. **SPM requires approved SPP**: Cannot create SPM unless SPP status is APPROVED
6. **SP2D requires valid SPM**: Cannot create SP2D unless SPM status is TERBIT or DIAJUKAN_SP2D
7. **Workflow ARSIP requires completed SP2D**: Workflow cannot transition to ARSIP unless SP2D status = SELESAI

## Document Versioning with Manual Signing

Phase 3 introduces support for manual document signing through the `dokumen_versi` table:

```sql
-- New fields in dokumen_versi
signed_by_name   VARCHAR(255)    -- Name of the signer
signed_by_role   VARCHAR(255)    -- Role/position of signer
signed_date      TIMESTAMP       -- Date document was signed
signed_method    SignedMethod    -- MANUAL_SCAN
signed_file_path VARCHAR(1000)   -- Path to scanned signed document
signed_file_hash VARCHAR(64)     -- SHA-256 hash for integrity
```

## Complete Workflow Flow

```
PERENCANAAN ──► PERSIAPAN ──► KONTRAK ──► PELAKSANAAN ──► PEMBAYARAN ──► ARSIP
    │               │            │              │              │            │
    │               │            │              │              │            │
   KAK          Rancangan     Kontrak      BA Kemajuan       SPP        Archive
    │           Kontrak         │              │              │
   HPS            SSUK        SPMK           BAHP            SPM
                  SSKK                       BAST           SP2D
```

## Table Statistics

| Phase | Tables | Enums | Relations |
|-------|--------|-------|-----------|
| Phase 1 | 14 | 4 | ~30 |
| Phase 2 | 8 | 7 | ~20 |
| **Phase 3** | **17** | **11** | **~45** |
| **Total** | **39** | **22** | **~95** |
