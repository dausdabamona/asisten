# ASISTEN Phase 4: ERD - Audit-Grade Hardening & Forensic Archive

## Overview

Phase 4 hardens the ASISTEN system for audit compliance and legal requirements. This phase adds 2 new tables and modifies existing tables to support:

1. **Multi-year Architecture** - `tahun_anggaran` field isolation
2. **Forensic Document Archive** - Hash chain integrity (no PKI/digital signature)
3. **Audit Mode & Legal Timeline** - Materialized view for compliance reporting
4. **Archive Lock (WORM Behavior)** - Write Once Read Many protection
5. **Disaster Recovery** - Backup catalog and scripts
6. **Role-based Audit Access** - Row Level Security policies

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ASISTEN Phase 4 ERD                                               │
│                           Audit-Grade Hardening & Forensic Archive                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────────────────┐
                                    │         PAKET               │
                                    │     (tahun_anggaran)        │
                                    └──────────────┬──────────────┘
                                                   │
               ┌───────────────────────────────────┼───────────────────────────────────┐
               │                                   │                                   │
               ▼                                   ▼                                   ▼
    ┌─────────────────────┐            ┌─────────────────────┐            ┌─────────────────────┐
    │      DOKUMEN        │            │  WORKFLOW_INSTANCE  │            │    KONTRAK, SPP,    │
    │                     │            │                     │            │    SPM, SP2D, etc.  │
    └──────────┬──────────┘            └──────────┬──────────┘            └─────────────────────┘
               │                                   │
               ▼                                   │
    ┌─────────────────────┐                        │
    │   DOKUMEN_VERSI     │◄───────────────────────┘
    │                     │
    │ + tahun_anggaran    │        ┌──────────────────────────────────────────┐
    │ + previous_version_ │        │              HASH CHAIN                   │
    │   hash              │◄───────│  SHA-256 links between versions          │
    │ + version_status    │        │  FINAL = immutable                       │
    │ + finalized_at      │        └──────────────────────────────────────────┘
    │ + archive_path      │
    └──────────┬──────────┘
               │
               │ When FINAL
               ▼
    ┌─────────────────────┐
    │ ARCHIVE_LOCK_LOG    │◄────────────────────┐
    │    (Table 40)       │                     │
    │                     │        ┌────────────┴────────────┐
    │ + tahun_anggaran    │        │     WORM BEHAVIOR       │
    │ + entity_type       │        │                         │
    │ + entity_id         │        │  • Immutable records    │
    │ + lock_reason       │        │  • Hash chain integrity │
    │ + record_hash       │        │  • No UPDATE/DELETE     │
    │ + previous_log_hash │        │  • RLS protected        │
    └──────────┬──────────┘        └─────────────────────────┘
               │
               │ Chain Link
               ▼
    ┌─────────────────────┐
    │  BACKUP_CATALOG     │
    │    (Table 41)       │        ┌─────────────────────────┐
    │                     │        │   DISASTER RECOVERY     │
    │ + tahun_anggaran    │        │                         │
    │ + backup_type       │        │  • FULL/INCREMENTAL     │
    │ + backup_hash       │        │  • Hash verification    │
    │ + manifest_hash     │        │  • 7-year retention     │
    │ + status            │        │  • WORM archive copy    │
    │ + retention_days    │        └─────────────────────────┘
    └─────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    LEGAL TIMELINE VIEW                                               │
│                              (Materialized View for Audit)                                           │
│                                                                                                      │
│    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                   │
│    │ dokumen_    │      │ approval_   │      │ workflow_   │      │ archive_    │                   │
│    │ versi       │      │ log         │      │ history     │      │ lock_log    │                   │
│    └──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘                   │
│           │                    │                    │                    │                           │
│           └────────────────────┴────────────────────┴────────────────────┘                           │
│                                         │                                                            │
│                                         ▼                                                            │
│                            ┌───────────────────────────┐                                             │
│                            │   LEGAL_TIMELINE_VIEW     │                                             │
│                            │                           │                                             │
│                            │ • entity_type             │                                             │
│                            │ • entity_id               │                                             │
│                            │ • paket_id                │                                             │
│                            │ • tahun_anggaran          │                                             │
│                            │ • event_timestamp         │                                             │
│                            │ • event_type              │                                             │
│                            │ • actor_id                │                                             │
│                            │ • hash_chain_link         │                                             │
│                            │ • is_immutable            │                                             │
│                            └───────────────────────────┘                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Phase 4 Tables Summary

### New Tables (2 Tables)

| # | Table | Description | Key Fields |
|---|-------|-------------|------------|
| 40 | `archive_lock_log` | WORM behavior audit trail | entity_type, entity_id, record_hash, previous_log_hash |
| 41 | `backup_catalog` | Disaster recovery metadata | backup_type, backup_hash, status, retention_days |

### Modified Tables

| Table | New Fields | Purpose |
|-------|------------|---------|
| `dokumen_versi` | tahun_anggaran, previous_version_hash, version_status, finalized_at, archive_path | Hash chain, immutability |

## New Enums (Phase 4)

### DokumenVersiStatus
```
DRAFT           - Can be modified
PENDING_APPROVAL - Under review
APPROVED        - Approved but can still be revised
FINAL           - IMMUTABLE - cannot be modified or deleted
```

### BackupType
```
FULL            - Complete database backup
INCREMENTAL     - Changes since last backup
DIFFERENTIAL    - Changes since last full backup
```

### BackupStatus
```
PENDING         - Scheduled but not started
IN_PROGRESS     - Currently running
COMPLETED       - Successfully finished
FAILED          - Backup failed
VERIFIED        - Integrity verified
```

### ArchiveLockReason
```
WORKFLOW_COMPLETED  - Workflow reached ARSIP stage
FISCAL_YEAR_CLOSED  - Year-end closure
LEGAL_HOLD          - Legal/compliance requirement
AUDIT_REQUIREMENT   - External audit request
ADMIN_LOCK          - Administrative action
```

## Hash Chain Structure

### Document Version Chain
```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Version 1   │     │   Version 2   │     │   Version 3   │
│               │     │               │     │               │
│ checksum: A1  │────►│ prev_hash: A1 │────►│ prev_hash: B2 │
│               │     │ checksum: B2  │     │ checksum: C3  │
│ status: FINAL │     │ status: FINAL │     │ status: FINAL │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Archive Lock Chain
```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Lock 1      │     │   Lock 2      │     │   Lock 3      │
│  (paket A)    │     │  (paket B)    │     │  (workflow X) │
│               │     │               │     │               │
│ record_hash:  │────►│ prev_log_hash:│────►│ prev_log_hash:│
│    X1         │     │    X1         │     │    Y2         │
│               │     │ record_hash:  │     │ record_hash:  │
│               │     │    Y2         │     │    Z3         │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Row Level Security (RLS) Policies

### archive_lock_log
| Policy | Action | Condition |
|--------|--------|-----------|
| Read | SELECT | AUDITOR, ADMIN, SUPER_ADMIN, KUASA_BUD roles OR locked_by = current_user |
| Insert | INSERT | ADMIN, SUPER_ADMIN, PPK, KUASA_PA roles |
| Update/Delete | - | **BLOCKED** (immutable) |

### backup_catalog
| Policy | Action | Condition |
|--------|--------|-----------|
| Full Access | ALL | ADMIN, SUPER_ADMIN, BACKUP_ADMIN roles |
| Read Only | SELECT | AUDITOR, KUASA_BUD roles |

### audit_log
| Policy | Action | Condition |
|--------|--------|-----------|
| Read Only | SELECT | AUDITOR, ADMIN, SUPER_ADMIN, KUASA_BUD, KUASA_PA roles |
| Write | INSERT/UPDATE/DELETE | **BLOCKED** (immutable) |

## Triggers for Data Integrity

### Immutability Triggers
1. `trg_prevent_final_dokumen_versi_modification` - Blocks UPDATE on FINAL versions
2. `trg_prevent_final_dokumen_versi_deletion` - Blocks DELETE on FINAL versions
3. `trg_prevent_archive_lock_modification` - Blocks UPDATE on archive_lock_log
4. `trg_prevent_archive_lock_deletion` - Blocks DELETE on archive_lock_log
5. `trg_prevent_archived_paket_modification` - Blocks changes to archived pakets
6. `trg_prevent_archived_workflow_modification` - Blocks changes to archived workflows

### Hash Chain Triggers
1. `trg_dokumen_versi_hash_chain` - Auto-populates previous_version_hash on INSERT
2. `trg_archive_lock_hash_chain` - Auto-populates previous_log_hash on INSERT

### Auto-Archive Trigger
1. `trg_auto_archive_on_workflow_complete` - Creates archive locks when workflow reaches ARSIP

## Helper Functions

| Function | Purpose |
|----------|---------|
| `calculate_record_hash(entity_type, entity_id)` | Generate SHA-256 hash for archival |
| `verify_hash_chain(tahun_anggaran)` | Verify integrity of archive lock chain |
| `archive_paket(paket_id, user_id, reason, catatan)` | Manually archive a paket |
| `refresh_legal_timeline()` | Refresh materialized view |

## REST API Endpoints

### Archive Lock
- `POST /api/v1/phase4/archive/lock` - Create archive lock
- `GET /api/v1/phase4/archive/lock/:entity_type/:entity_id` - Check lock status
- `GET /api/v1/phase4/archive/locks/:tahun_anggaran` - List locks by year

### Document Version
- `POST /api/v1/phase4/document-version/:id/finalize` - Mark as FINAL
- `GET /api/v1/phase4/document-version/:id/chain` - Get with chain verification
- `GET /api/v1/phase4/document/:dokumen_id/verify-chain` - Verify document chain

### Legal Timeline
- `GET /api/v1/phase4/timeline` - Query timeline events
- `POST /api/v1/phase4/timeline/refresh` - Refresh materialized view

### Hash Chain Verification
- `GET /api/v1/phase4/verify/archive-chain/:tahun_anggaran` - Verify archive chain

### Backup Catalog
- `POST /api/v1/phase4/backup` - Register backup
- `GET /api/v1/phase4/backup` - List backups
- `GET /api/v1/phase4/backup/:id` - Get backup details
- `PATCH /api/v1/phase4/backup/:id/status` - Update status
- `POST /api/v1/phase4/backup/:id/verify` - Mark as verified

### Statistics & Operations
- `GET /api/v1/phase4/statistics/:tahun_anggaran` - Audit statistics
- `POST /api/v1/phase4/fiscal-year/:tahun_anggaran/close` - Close fiscal year

## Table Statistics (Cumulative)

| Phase | Tables | Enums | Triggers | Views |
|-------|--------|-------|----------|-------|
| Phase 1 | 14 | 4 | 2 | 0 |
| Phase 2 | 8 | 7 | 3 | 0 |
| Phase 3 | 17 | 11 | 7 | 0 |
| **Phase 4** | **2** | **4** | **8** | **1** |
| **Total** | **41** | **26** | **20** | **1** |

## Compliance Features

### Government Audit Requirements
- 7-year document retention (configurable)
- Immutable audit trail
- Hash chain verification
- Legal timeline for court proceedings
- Multi-year data isolation

### Security Controls
- Row Level Security (RLS)
- Role-based access control
- Immutable records (WORM)
- Tamper-evident hash chains
- No digital signatures (wet ink scan only)

### Disaster Recovery
- Automated backup scripts
- WORM archive copies
- Hash verification on restore
- Retention policy enforcement
- Backup catalog with full metadata
