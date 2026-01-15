# ASISTEN - Audit Trail Example
## Phase 2: Complete Audit Trail from Draft to Archive

This document shows a complete audit trail for Perjalanan Dinas PD-2026-001
following the SPPD lifecycle from creation to archive.

---

## API Endpoint to Retrieve Audit Trail

```bash
GET /api/v1/audit/perjalanan/{perjalananId}
```

---

## Sample Audit Trail Response

```json
{
  "success": true,
  "data": {
    "perjalanan": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nomor": "PD-2026-001",
      "status": "SELESAI"
    },

    "workflowTransitions": [
      {
        "id": "t001",
        "from_stage": { "kode": "PERENCANAAN", "nama": "Perencanaan" },
        "to_stage": { "kode": "PERSIAPAN", "nama": "Persiapan" },
        "transitioned_at": "2026-01-10T09:00:00.000Z",
        "catatan": "Perencanaan disetujui, lanjut ke persiapan"
      },
      {
        "id": "t002",
        "from_stage": { "kode": "PERSIAPAN", "nama": "Persiapan" },
        "to_stage": { "kode": "PELAKSANAAN", "nama": "Pelaksanaan" },
        "transitioned_at": "2026-01-15T06:00:00.000Z",
        "catatan": "Perjalanan dimulai"
      },
      {
        "id": "t003",
        "from_stage": { "kode": "PELAKSANAAN", "nama": "Pelaksanaan" },
        "to_stage": { "kode": "PEMBAYARAN", "nama": "Pembayaran" },
        "transitioned_at": "2026-01-18T10:00:00.000Z",
        "catatan": "Perjalanan selesai, lanjut ke pertanggungjawaban"
      },
      {
        "id": "t004",
        "from_stage": { "kode": "PEMBAYARAN", "nama": "Pembayaran" },
        "to_stage": { "kode": "ARSIP", "nama": "Arsip" },
        "transitioned_at": "2026-01-25T10:00:00.000Z",
        "catatan": "SPJ disahkan, workflow selesai"
      }
    ],

    "auditTrail": [
      {
        "id": "audit001",
        "table_name": "perjalanan_dinas",
        "record_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "action": "INSERT",
        "old_values": null,
        "new_values": {
          "nomor": "PD-2026-001",
          "maksud_perjalanan": "Koordinasi teknis...",
          "status": "DRAFT"
        },
        "actor": { "username": "pptk_sample", "nama": "Siti Aminah" },
        "created_at": "2026-01-08T10:00:00.000Z"
      },
      {
        "id": "audit002",
        "table_name": "surat_tugas",
        "record_id": "st001",
        "action": "INSERT",
        "old_values": null,
        "new_values": {
          "nomor": "ST-2026-001",
          "perihal": "Penugasan Perjalanan Dinas",
          "status": "DRAFT"
        },
        "actor": { "username": "pptk_sample", "nama": "Siti Aminah" },
        "created_at": "2026-01-10T08:00:00.000Z"
      },
      {
        "id": "audit003",
        "table_name": "surat_tugas",
        "record_id": "st001",
        "action": "UPDATE",
        "old_values": { "status": "DRAFT" },
        "new_values": { "status": "APPROVED" },
        "actor": { "username": "ppk_sample", "nama": "Budi Santoso" },
        "created_at": "2026-01-10T10:00:00.000Z"
      },
      {
        "id": "audit004",
        "table_name": "sppd",
        "record_id": "sppd001",
        "action": "INSERT",
        "old_values": null,
        "new_values": {
          "nomor": "SPPD-2026-001",
          "status": "TERBIT"
        },
        "actor": { "username": "pptk_sample", "nama": "Siti Aminah" },
        "created_at": "2026-01-10T11:00:00.000Z"
      },
      {
        "id": "audit005",
        "table_name": "kuitansi",
        "record_id": "kum001",
        "action": "INSERT",
        "old_values": null,
        "new_values": {
          "nomor": "KUM-2026-001",
          "tipe": "UANG_MUKA",
          "nilai": 7500000,
          "status": "DRAFT"
        },
        "actor": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "created_at": "2026-01-12T08:00:00.000Z"
      },
      {
        "id": "audit006",
        "table_name": "kuitansi",
        "record_id": "kum001",
        "action": "UPDATE",
        "old_values": { "status": "DRAFT" },
        "new_values": { "status": "DIBAYAR" },
        "actor": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "created_at": "2026-01-12T09:00:00.000Z"
      },
      {
        "id": "audit007",
        "table_name": "uang_persediaan",
        "record_id": "up001",
        "action": "UPDATE",
        "old_values": { "sisa": 50000000 },
        "new_values": { "sisa": 42500000 },
        "actor": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "created_at": "2026-01-12T09:00:01.000Z"
      },
      {
        "id": "audit008",
        "table_name": "kuitansi",
        "record_id": "kr001",
        "action": "INSERT",
        "old_values": null,
        "new_values": {
          "nomor": "KR-2026-001",
          "tipe": "RAMPUNG",
          "nilai_um": 7500000,
          "nilai_realisasi": 7250000,
          "selisih": 250000,
          "status": "DRAFT"
        },
        "actor": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "created_at": "2026-01-20T14:00:00.000Z"
      },
      {
        "id": "audit009",
        "table_name": "kuitansi",
        "record_id": "kr001",
        "action": "UPDATE",
        "old_values": { "status": "DRAFT" },
        "new_values": { "status": "DIBAYAR" },
        "actor": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "created_at": "2026-01-20T15:00:00.000Z"
      },
      {
        "id": "audit010",
        "table_name": "uang_persediaan",
        "record_id": "up001",
        "action": "UPDATE",
        "old_values": { "sisa": 42500000 },
        "new_values": { "sisa": 42750000 },
        "actor": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "created_at": "2026-01-20T15:00:01.000Z"
      },
      {
        "id": "audit011",
        "table_name": "pertanggungjawaban",
        "record_id": "spj001",
        "action": "INSERT",
        "old_values": null,
        "new_values": {
          "nomor": "SPJ-UP-2026-001",
          "jenis": "SPJ_UP",
          "total_um": 7500000,
          "total_realisasi": 7250000,
          "sisa_lebih": 250000,
          "status": "DRAFT"
        },
        "actor": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "created_at": "2026-01-22T10:00:00.000Z"
      },
      {
        "id": "audit012",
        "table_name": "pertanggungjawaban",
        "record_id": "spj001",
        "action": "UPDATE",
        "old_values": { "status": "DRAFT" },
        "new_values": { "status": "DISAHKAN", "pengesah_id": "ppk001" },
        "actor": { "username": "ppk_sample", "nama": "Budi Santoso" },
        "created_at": "2026-01-23T10:00:00.000Z"
      }
    ],

    "approvalHistory": [
      {
        "id": "appr001",
        "dokumen": { "nomor": "ST-2026-001", "tipe": "SURAT_TUGAS" },
        "role": { "kode": "PPK", "nama": "Pejabat Pembuat Komitmen" },
        "approver": { "username": "ppk_sample", "nama": "Budi Santoso" },
        "status": "APPROVED",
        "catatan": "Disetujui untuk pelaksanaan perjalanan dinas",
        "approved_at": "2026-01-10T10:00:00.000Z"
      },
      {
        "id": "appr002",
        "dokumen": { "nomor": "SPPD-2026-001", "tipe": "SPPD" },
        "role": { "kode": "PPK", "nama": "Pejabat Pembuat Komitmen" },
        "approver": { "username": "ppk_sample", "nama": "Budi Santoso" },
        "status": "APPROVED",
        "catatan": "SPPD diterbitkan",
        "approved_at": "2026-01-10T11:00:00.000Z"
      },
      {
        "id": "appr003",
        "dokumen": { "nomor": "KUM-2026-001", "tipe": "KUITANSI_UM" },
        "role": { "kode": "BENDAHARA", "nama": "Bendahara" },
        "approver": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "status": "APPROVED",
        "catatan": "Uang muka dicairkan",
        "approved_at": "2026-01-12T09:00:00.000Z"
      },
      {
        "id": "appr004",
        "dokumen": { "nomor": "KR-2026-001", "tipe": "KUITANSI_RAMPUNG" },
        "role": { "kode": "BENDAHARA", "nama": "Bendahara" },
        "approver": { "username": "bendahara_sample", "nama": "Ahmad Yani" },
        "status": "APPROVED",
        "catatan": "Pertanggungjawaban diterima, selisih Rp 250.000 dikembalikan ke UP",
        "approved_at": "2026-01-20T14:00:00.000Z"
      },
      {
        "id": "appr005",
        "dokumen": { "nomor": "SPJ-UP-2026-001", "tipe": "SPJ_UP" },
        "role": { "kode": "PPK", "nama": "Pejabat Pembuat Komitmen" },
        "approver": { "username": "ppk_sample", "nama": "Budi Santoso" },
        "status": "APPROVED",
        "catatan": "SPJ disahkan, perjalanan dinas selesai",
        "approved_at": "2026-01-23T10:00:00.000Z"
      }
    ],

    "timeline": [
      {
        "timestamp": "2026-01-08T10:00:00.000Z",
        "type": "AUDIT",
        "action": "INSERT",
        "table": "perjalanan_dinas",
        "actor": "Siti Aminah",
        "details": "INSERT on perjalanan_dinas"
      },
      {
        "timestamp": "2026-01-10T08:00:00.000Z",
        "type": "AUDIT",
        "action": "INSERT",
        "table": "surat_tugas",
        "actor": "Siti Aminah",
        "details": "INSERT on surat_tugas"
      },
      {
        "timestamp": "2026-01-10T09:00:00.000Z",
        "type": "WORKFLOW",
        "action": "TRANSITION",
        "table": "workflow_transition",
        "actor": "System",
        "details": "PERENCANAAN -> PERSIAPAN: Perencanaan disetujui"
      },
      {
        "timestamp": "2026-01-10T10:00:00.000Z",
        "type": "APPROVAL",
        "action": "APPROVED",
        "table": "approval_log",
        "actor": "Budi Santoso",
        "details": "APPROVED by Pejabat Pembuat Komitmen: Disetujui"
      },
      {
        "timestamp": "2026-01-10T11:00:00.000Z",
        "type": "AUDIT",
        "action": "INSERT",
        "table": "sppd",
        "actor": "Siti Aminah",
        "details": "INSERT on sppd"
      },
      {
        "timestamp": "2026-01-12T08:00:00.000Z",
        "type": "AUDIT",
        "action": "INSERT",
        "table": "kuitansi",
        "actor": "Ahmad Yani",
        "details": "INSERT on kuitansi (UANG_MUKA)"
      },
      {
        "timestamp": "2026-01-12T09:00:00.000Z",
        "type": "APPROVAL",
        "action": "APPROVED",
        "table": "approval_log",
        "actor": "Ahmad Yani",
        "details": "APPROVED by Bendahara: Uang muka dicairkan"
      },
      {
        "timestamp": "2026-01-12T09:00:01.000Z",
        "type": "AUDIT",
        "action": "UPDATE",
        "table": "uang_persediaan",
        "actor": "Ahmad Yani",
        "details": "UPDATE on uang_persediaan (sisa: 50000000 -> 42500000)"
      },
      {
        "timestamp": "2026-01-15T06:00:00.000Z",
        "type": "WORKFLOW",
        "action": "TRANSITION",
        "table": "workflow_transition",
        "actor": "System",
        "details": "PERSIAPAN -> PELAKSANAAN: Perjalanan dimulai"
      },
      {
        "timestamp": "2026-01-18T10:00:00.000Z",
        "type": "WORKFLOW",
        "action": "TRANSITION",
        "table": "workflow_transition",
        "actor": "System",
        "details": "PELAKSANAAN -> PEMBAYARAN: Perjalanan selesai"
      },
      {
        "timestamp": "2026-01-20T14:00:00.000Z",
        "type": "AUDIT",
        "action": "INSERT",
        "table": "kuitansi",
        "actor": "Ahmad Yani",
        "details": "INSERT on kuitansi (RAMPUNG)"
      },
      {
        "timestamp": "2026-01-20T15:00:00.000Z",
        "type": "APPROVAL",
        "action": "APPROVED",
        "table": "approval_log",
        "actor": "Ahmad Yani",
        "details": "APPROVED by Bendahara: selisih Rp 250.000 dikembalikan"
      },
      {
        "timestamp": "2026-01-20T15:00:01.000Z",
        "type": "AUDIT",
        "action": "UPDATE",
        "table": "uang_persediaan",
        "actor": "Ahmad Yani",
        "details": "UPDATE on uang_persediaan (sisa: 42500000 -> 42750000)"
      },
      {
        "timestamp": "2026-01-22T10:00:00.000Z",
        "type": "AUDIT",
        "action": "INSERT",
        "table": "pertanggungjawaban",
        "actor": "Ahmad Yani",
        "details": "INSERT on pertanggungjawaban (SPJ)"
      },
      {
        "timestamp": "2026-01-23T10:00:00.000Z",
        "type": "APPROVAL",
        "action": "APPROVED",
        "table": "approval_log",
        "actor": "Budi Santoso",
        "details": "APPROVED by PPK: SPJ disahkan"
      },
      {
        "timestamp": "2026-01-25T10:00:00.000Z",
        "type": "WORKFLOW",
        "action": "TRANSITION",
        "table": "workflow_transition",
        "actor": "System",
        "details": "PEMBAYARAN -> ARSIP: Workflow completed"
      }
    ]
  }
}
```

---

## SQL Query to Generate Audit Trail

```sql
-- Get complete audit trail for a perjalanan dinas
WITH perjalanan AS (
    SELECT * FROM asisten.perjalanan_dinas WHERE nomor = 'PD-2026-001'
),
related_records AS (
    SELECT 'perjalanan_dinas' as tbl, id FROM perjalanan
    UNION ALL
    SELECT 'surat_tugas', st.id FROM asisten.surat_tugas st
    JOIN perjalanan p ON st.perjalanan_dinas_id = p.id
    UNION ALL
    SELECT 'sppd', sp.id FROM asisten.sppd sp
    JOIN perjalanan p ON sp.perjalanan_dinas_id = p.id
    UNION ALL
    SELECT 'kuitansi', k.id FROM asisten.kuitansi k
    JOIN perjalanan p ON k.perjalanan_dinas_id = p.id
    UNION ALL
    SELECT 'pertanggungjawaban', spj.id FROM asisten.pertanggungjawaban spj
    JOIN perjalanan p ON spj.perjalanan_dinas_id = p.id
)
SELECT
    al.created_at,
    al.table_name,
    al.action,
    u.nama as actor_name,
    al.old_values,
    al.new_values
FROM asisten.audit_log al
JOIN related_records rr ON al.table_name = rr.tbl AND al.record_id = rr.id
LEFT JOIN asisten.users u ON al.actor_id = u.id
ORDER BY al.created_at;
```

---

## Key Audit Points

| Timestamp | Event | Actor | Impact |
|-----------|-------|-------|--------|
| 2026-01-08 | Perjalanan Created | PPTK | New record |
| 2026-01-10 | Surat Tugas Approved | PPK | Enables SPPD |
| 2026-01-10 | SPPD Issued | PPTK | Travel authorized |
| 2026-01-12 | UM Disbursed | Bendahara | UP -7.5M |
| 2026-01-15 | Travel Started | System | Stage transition |
| 2026-01-18 | Travel Completed | System | Stage transition |
| 2026-01-20 | Rampung Approved | Bendahara | UP +250K return |
| 2026-01-23 | SPJ Approved | PPK | Balanced |
| 2026-01-25 | Workflow Closed | System | Archive |

---

## Immutability Guarantee

The `audit_log` table is protected by PostgreSQL rules:

```sql
-- Prevents any UPDATE on audit_log
CREATE RULE audit_log_no_update AS ON UPDATE TO asisten.audit_log
    DO INSTEAD NOTHING;

-- Prevents any DELETE on audit_log
CREATE RULE audit_log_no_delete AS ON DELETE TO asisten.audit_log
    DO INSTEAD NOTHING;
```

This ensures complete audit integrity - once a record is logged, it cannot be modified or deleted.
