# ASISTEN Phase 4: Audit & Forensic Archive Sequence Diagram

## Complete Flow: Document Creation → Archival → Audit Access

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│   PPK   │ │ Auditor │ │ Admin   │ │ System  │ │ Backup  │ │  Legal  │
│         │ │         │ │         │ │         │ │  Job    │ │ Counsel │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │           │           │
     │ ═══════════════════════════════════════════════════════════════
     │                    DOCUMENT VERSION LIFECYCLE
     │ ═══════════════════════════════════════════════════════════════
     │           │           │           │           │           │
     │ [1] Upload Document Version       │           │           │
     │───────────────────────────────────────────────►│           │
     │           │           │  Create dokumen_versi │           │
     │           │           │  status: DRAFT        │           │
     │           │           │  Calculate checksum   │           │
     │◄──────────────────────────────────────────────│           │
     │           │           │           │           │           │
     │ [2] Upload New Version            │           │           │
     │───────────────────────────────────────────────►│           │
     │           │           │  Trigger: hash_chain  │           │
     │           │           │  Set previous_version_│           │
     │           │           │  hash = prev checksum │           │
     │◄──────────────────────────────────────────────│           │
     │           │           │           │           │           │
     │ [3] Approve & Finalize            │           │           │
     │───────────────────────────────────────────────►│           │
     │           │           │  Set status: FINAL    │           │
     │           │           │  Set finalized_at     │           │
     │           │           │  IMMUTABLE from here  │           │
     │◄──────────────────────────────────────────────│           │
     │           │           │           │           │           │
     │ ═══════════════════════════════════════════════════════════════
     │                    WORKFLOW TO ARCHIVE
     │ ═══════════════════════════════════════════════════════════════
     │           │           │           │           │           │
     │ [4] Complete Workflow (to ARSIP)  │           │           │
     │───────────────────────────────────────────────►│           │
     │           │           │  Trigger: auto_archive│           │
     │           │           │  ├─ Create archive_   │           │
     │           │           │  │  lock_log (paket)  │           │
     │           │           │  ├─ Create archive_   │           │
     │           │           │  │  lock_log (workflow)│          │
     │           │           │  ├─ Mark all doc      │           │
     │           │           │  │  versions FINAL    │           │
     │           │           │  └─ Calculate & chain │           │
     │           │           │     record_hash       │           │
     │◄──────────────────────────────────────────────│           │
     │           │           │           │           │           │
     │ [5] Attempt to modify archived paket          │           │
     │───────────────────────────────────────────────►│           │
     │           │           │  Trigger: prevent_    │           │
     │           │           │  archived_modification│           │
     │  ✗ ERROR: Record is locked for compliance     │           │
     │◄──────────────────────────────────────────────│           │
     │           │           │           │           │           │
     │ ═══════════════════════════════════════════════════════════════
     │                    BACKUP & DISASTER RECOVERY
     │ ═══════════════════════════════════════════════════════════════
     │           │           │           │           │           │
     │           │           │           │           │ [6] Run   │
     │           │           │           │           │ Backup    │
     │           │           │           │           │──────────►│
     │           │           │           │  Register backup_catalog│
     │           │           │           │  status: PENDING      │
     │           │           │           │◄─────────────────────│
     │           │           │           │           │           │
     │           │           │           │           │ [7] Dump  │
     │           │           │           │           │ Database  │
     │           │           │           │           │──────────►│
     │           │           │           │  pg_dump schema       │
     │           │           │           │  Calculate SHA-256    │
     │           │           │           │  Copy to WORM archive │
     │           │           │           │◄─────────────────────│
     │           │           │           │           │           │
     │           │           │           │           │ [8] Update│
     │           │           │           │           │ Catalog   │
     │           │           │           │           │──────────►│
     │           │           │           │  status: COMPLETED    │
     │           │           │           │  Set backup_hash      │
     │           │           │           │  Set backup_size      │
     │           │           │           │◄─────────────────────│
     │           │           │           │           │           │
     │           │ [9] Verify Backup     │           │           │
     │           │───────────────────────────────────►│           │
     │           │           │  Compare SHA-256      │           │
     │           │           │  status: VERIFIED     │           │
     │           │◄──────────────────────────────────│           │
     │           │           │           │           │           │
     │ ═══════════════════════════════════════════════════════════════
     │                    AUDIT ACCESS & LEGAL TIMELINE
     │ ═══════════════════════════════════════════════════════════════
     │           │           │           │           │           │
     │           │ [10] Query Legal Timeline         │           │
     │           │───────────────────────────────────►│           │
     │           │           │  RLS check: AUDITOR   │           │
     │           │           │  Query materialized   │           │
     │           │           │  view                 │           │
     │           │◄──────────────────────────────────│           │
     │           │           │           │           │           │
     │           │ [11] Verify Hash Chain            │           │
     │           │───────────────────────────────────►│           │
     │           │           │  verify_hash_chain()  │           │
     │           │           │  Check all links      │           │
     │           │  chain_intact: TRUE/FALSE         │           │
     │           │◄──────────────────────────────────│           │
     │           │           │           │           │           │
     │           │           │           │           │           │ [12]
     │           │           │           │           │           │ Request
     │           │           │           │           │           │ Timeline
     │           │           │           │           │           │────────►│
     │           │           │           │  RLS check for LEGAL  │         │
     │           │           │           │  Return filtered view │         │
     │           │           │           │◄───────────────────────────────│
     │           │           │           │           │           │
     │ ═══════════════════════════════════════════════════════════════
     │                    FISCAL YEAR CLOSURE
     │ ═══════════════════════════════════════════════════════════════
     │           │           │           │           │           │
     │           │           │ [13] Close Fiscal Year│           │
     │           │           │───────────────────────►│           │
     │           │           │  For each unarchived  │           │
     │           │           │  paket:               │           │
     │           │           │  ├─ Create archive_   │           │
     │           │           │  │  lock_log          │           │
     │           │           │  ├─ Finalize all docs │           │
     │           │           │  └─ Chain hash links  │           │
     │           │           │◄──────────────────────│           │
     │           │           │           │           │           │
     │           │ [14] Generate Audit Report        │           │
     │           │───────────────────────────────────►│           │
     │           │           │  Get statistics       │           │
     │           │           │  Query timeline       │           │
     │           │           │  Verify all chains    │           │
     │           │◄──────────────────────────────────│           │
     │           │           │           │           │           │
     ▼           ▼           ▼           ▼           ▼           ▼
```

## Hash Chain Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HASH CHAIN VERIFICATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

                    Document Version Chain
                    ─────────────────────

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Version 1   │    │  Version 2   │    │  Version 3   │    │  Version 4   │
│              │    │              │    │              │    │              │
│ checksum:    │───►│ prev_hash:   │───►│ prev_hash:   │───►│ prev_hash:   │
│   abc123     │    │   abc123     │    │   def456     │    │   ghi789     │
│              │    │ checksum:    │    │ checksum:    │    │ checksum:    │
│ status:FINAL │    │   def456     │    │   ghi789     │    │   jkl012     │
│              │    │ status:FINAL │    │ status:FINAL │    │ status:FINAL │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
   [VERIFY]           [VERIFY]            [VERIFY]            [VERIFY]
  prev=NULL?       prev=abc123?        prev=def456?        prev=ghi789?
      ✓                 ✓                   ✓                   ✓
                                                                 │
                                                                 ▼
                                                      ┌──────────────────┐
                                                      │  CHAIN INTACT    │
                                                      │      TRUE        │
                                                      └──────────────────┘


                    Archive Lock Chain
                    ──────────────────

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Lock 1     │    │   Lock 2     │    │   Lock 3     │
│ entity:paket │    │ entity:paket │    │ entity:      │
│ id: AAA      │    │ id: BBB      │    │ workflow CCC │
│              │    │              │    │              │
│ record_hash: │───►│ prev_log:    │───►│ prev_log:    │
│   hash_1     │    │   hash_1     │    │   hash_2     │
│              │    │ record_hash: │    │ record_hash: │
│ prev_log:    │    │   hash_2     │    │   hash_3     │
│   NULL       │    │              │    │              │
│              │    │ reason:      │    │ reason:      │
│ reason:      │    │ WORKFLOW_    │    │ FISCAL_YEAR_ │
│ WORKFLOW_    │    │ COMPLETED    │    │ CLOSED       │
│ COMPLETED    │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## WORM Behavior Enforcement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORM BEHAVIOR (Write Once Read Many)                │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         dokumen_versi               │
                    │      status = 'FINAL'               │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│    UPDATE     │           │    DELETE     │           │    SELECT     │
│               │           │               │           │               │
│ trg_prevent_  │           │ trg_prevent_  │           │   ALLOWED     │
│ final_modif   │           │ final_delete  │           │   (RLS check) │
│               │           │               │           │               │
│   ✗ BLOCKED   │           │   ✗ BLOCKED   │           │   ✓ OK        │
│               │           │               │           │               │
│ ERROR:        │           │ ERROR:        │           │               │
│ "Cannot       │           │ "Cannot       │           │               │
│  modify       │           │  delete       │           │               │
│  FINAL        │           │  FINAL        │           │               │
│  version"     │           │  version"     │           │               │
└───────────────┘           └───────────────┘           └───────────────┘


                    ┌─────────────────────────────────────┐
                    │        archive_lock_log             │
                    │       (Always Immutable)            │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│    INSERT     │           │    UPDATE     │           │    DELETE     │
│               │           │               │           │               │
│   ALLOWED     │           │   ✗ BLOCKED   │           │   ✗ BLOCKED   │
│ (RLS check)   │           │   ALWAYS      │           │   ALWAYS      │
│               │           │               │           │               │
│ • PPK         │           │ trg_prevent_  │           │ trg_prevent_  │
│ • ADMIN       │           │ archive_lock_ │           │ archive_lock_ │
│ • KUASA_PA    │           │ modification  │           │ deletion      │
└───────────────┘           └───────────────┘           └───────────────┘
```

## Backup & Restore Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKUP PROCESS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  backup_asisten.sh
        │
        ▼
┌───────────────┐
│ 1. Register   │──► INSERT into backup_catalog
│    Backup     │    status: PENDING
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 2. pg_dump    │──► Dump schema "asisten"
│    Schema     │    Compress with gzip
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 3. Calculate  │──► SHA-256 of backup file
│    Hash       │    SHA-256 of manifest
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 4. Copy to    │──► /archive/asisten/{year}/
│    WORM       │    Set immutable flag (chattr +i)
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 5. Update     │──► UPDATE backup_catalog
│    Catalog    │    status: COMPLETED
│               │    backup_hash, backup_size
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 6. Verify     │──► Compare hashes
│    (Optional) │    status: VERIFIED
└───────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESTORE PROCESS                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  restore_asisten.sh
        │
        ▼
┌───────────────┐
│ 1. Verify     │──► Compare SHA-256 with manifest
│    Backup     │    Abort if mismatch
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 2. Prepare    │──► CREATE SCHEMA target_schema
│    Schema     │    (NOT production by default)
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 3. Extract &  │──► gunzip backup
│    Transform  │    Replace schema name
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 4. Restore    │──► psql -f transformed.sql
│    Data       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 5. Verify     │──► Count tables, records
│    Restore    │    Compare with manifest
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 6. Manual     │──► RENAME SCHEMA (if needed)
│    Promotion  │    Requires explicit action
└───────────────┘
```

## Actors and Responsibilities

| Actor | Indonesian Term | Phase 4 Responsibilities |
|-------|-----------------|--------------------------|
| PPK | Pejabat Pembuat Komitmen | Document finalization, archive lock creation |
| Auditor | Auditor | Legal timeline access, hash chain verification, statistics |
| Admin | Administrator Sistem | Backup management, fiscal year closure |
| Backup Job | Scheduled Task | Automated backups, catalog updates |
| Legal Counsel | Penasehat Hukum | Read-only timeline access for legal proceedings |
| Kuasa BUD | Kuasa Bendahara Umum Daerah | Audit access, backup verification |
