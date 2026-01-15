/**
 * ASISTEN - Phase 2 & 4: Audit & Forensic Archive Service
 * Immutable audit trail logging with forensic archive capabilities
 */

import { PrismaClient, ArchiveLockReason, DokumenVersiStatus, BackupStatus, BackupType } from '@prisma/client';
import { createHash } from 'crypto';
import { RequestContext } from '../types';

const prisma = new PrismaClient();

interface AuditLogParams {
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValues?: any;
  newValues?: any;
  ctx: RequestContext;
}

export class AuditService {
  /**
   * Log an audit entry
   * Note: This table is immutable - only INSERT is allowed
   */
  static async log(params: AuditLogParams): Promise<void> {
    try {
      await prisma.audit_log.create({
        data: {
          table_name: params.tableName,
          record_id: params.recordId,
          action: params.action,
          old_values: params.oldValues || null,
          new_values: params.newValues || null,
          actor_id: params.ctx.userId,
          ip_address: params.ctx.ipAddress,
          user_agent: params.ctx.userAgent,
          created_by: params.ctx.userId
        }
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit trail for a specific record
   */
  static async getAuditTrail(
    tableName: string,
    recordId: string
  ): Promise<any[]> {
    return prisma.audit_log.findMany({
      where: {
        table_name: tableName,
        record_id: recordId
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            nama: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });
  }

  /**
   * Get complete audit trail for a Perjalanan Dinas
   * Traces from draft to arsip
   */
  static async getPerjalananAuditTrail(perjalananId: string): Promise<any> {
    // Get perjalanan with all related entities
    const perjalanan = await prisma.perjalanan_dinas.findUnique({
      where: { id: perjalananId },
      include: {
        surat_tugas: true,
        sppd: true,
        kuitansi: true,
        pertanggungjawaban: true,
        workflow_instance: {
          include: {
            transitions: {
              include: {
                from_stage: true,
                to_stage: true
              },
              orderBy: { transitioned_at: 'asc' }
            }
          }
        }
      }
    });

    if (!perjalanan) {
      throw new Error('Perjalanan Dinas not found');
    }

    // Collect all record IDs for audit lookup
    const recordIds: { table: string; id: string }[] = [
      { table: 'perjalanan_dinas', id: perjalananId }
    ];

    if (perjalanan.surat_tugas) {
      recordIds.push({ table: 'surat_tugas', id: perjalanan.surat_tugas.id });
    }

    perjalanan.sppd.forEach(s => {
      recordIds.push({ table: 'sppd', id: s.id });
    });

    perjalanan.kuitansi.forEach(k => {
      recordIds.push({ table: 'kuitansi', id: k.id });
    });

    perjalanan.pertanggungjawaban.forEach(p => {
      recordIds.push({ table: 'pertanggungjawaban', id: p.id });
    });

    // Get all audit logs
    const auditLogs = await prisma.audit_log.findMany({
      where: {
        OR: recordIds.map(r => ({
          table_name: r.table,
          record_id: r.id
        }))
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            nama: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    // Get approval logs
    const dokumenIds = [
      perjalanan.surat_tugas?.dokumen_id,
      ...perjalanan.sppd.map(s => s.dokumen_id),
      ...perjalanan.kuitansi.map(k => k.dokumen_id)
    ].filter(Boolean) as string[];

    const approvalLogs = await prisma.approval_log.findMany({
      where: {
        dokumen_id: { in: dokumenIds },
        is_deleted: false
      },
      include: {
        dokumen: true,
        role: true,
        approver: {
          select: {
            id: true,
            username: true,
            nama: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    return {
      perjalanan: {
        id: perjalanan.id,
        nomor: perjalanan.nomor,
        status: perjalanan.status
      },
      workflowTransitions: perjalanan.workflow_instance?.transitions || [],
      auditTrail: auditLogs,
      approvalHistory: approvalLogs,
      timeline: buildTimeline(auditLogs, approvalLogs, perjalanan.workflow_instance?.transitions || [])
    };
  }
}

/**
 * Build a unified timeline from all events
 */
function buildTimeline(
  auditLogs: any[],
  approvalLogs: any[],
  transitions: any[]
): any[] {
  const timeline: any[] = [];

  // Add audit logs
  auditLogs.forEach(log => {
    timeline.push({
      timestamp: log.created_at,
      type: 'AUDIT',
      action: log.action,
      table: log.table_name,
      actor: log.actor?.nama || 'System',
      details: `${log.action} on ${log.table_name}`
    });
  });

  // Add approval logs
  approvalLogs.forEach(log => {
    timeline.push({
      timestamp: log.created_at,
      type: 'APPROVAL',
      action: log.status,
      table: 'approval_log',
      actor: log.approver?.nama || 'Unknown',
      details: `${log.status} by ${log.role?.nama}: ${log.catatan || '-'}`
    });
  });

  // Add workflow transitions
  transitions.forEach(t => {
    timeline.push({
      timestamp: t.transitioned_at,
      type: 'WORKFLOW',
      action: 'TRANSITION',
      table: 'workflow_transition',
      actor: 'System',
      details: `${t.from_stage?.kode} -> ${t.to_stage?.kode}: ${t.catatan || '-'}`
    });
  });

  // Sort by timestamp
  return timeline.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// =============================================================================
// PHASE 4: FORENSIC ARCHIVE & AUDIT-GRADE HARDENING
// =============================================================================

// =============================================================================
// Types
// =============================================================================

interface ArchiveLockInput {
  entity_type: string;
  entity_id: string;
  tahun_anggaran: number;
  lock_reason?: ArchiveLockReason;
  locked_by?: string;
  catatan?: string;
}

interface TimelineFilter {
  tahun_anggaran?: number;
  paket_id?: string;
  event_type?: string;
  actor_id?: string;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}

interface BackupInput {
  tahun_anggaran: number;
  backup_type: BackupType;
  backup_name: string;
  backup_path: string;
  backup_hash: string;
  created_by?: string;
}

// =============================================================================
// Archive Lock Operations (WORM Behavior)
// =============================================================================

/**
 * Create an archive lock for an entity (WORM behavior)
 */
export async function createArchiveLock(input: ArchiveLockInput) {
  // Calculate record hash
  const recordData = `${input.entity_type}:${input.entity_id}:${Date.now()}`;
  const record_hash = createHash('sha256').update(recordData).digest('hex');

  // Get previous log hash for chain integrity
  const previousLock = await prisma.archive_lock_log.findFirst({
    where: { tahun_anggaran: input.tahun_anggaran },
    orderBy: { created_at: 'desc' },
    select: { record_hash: true },
  });

  // Get document count and total value for metadata
  let document_count: number | null = null;
  let total_nilai: number | null = null;
  let workflow_state: string | null = null;

  if (input.entity_type === 'paket') {
    const paket = await prisma.paket.findUnique({
      where: { id: input.entity_id },
      include: {
        dokumen: { where: { is_deleted: false } },
        workflow_instance: {
          include: { current_stage: true },
        },
      },
    });

    if (paket) {
      document_count = paket.dokumen.length;
      total_nilai = Number(paket.nilai_kontrak || paket.nilai_pagu);
      workflow_state = paket.workflow_instance?.current_stage?.kode || null;
    }
  }

  const lock = await prisma.archive_lock_log.create({
    data: {
      tahun_anggaran: input.tahun_anggaran,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      lock_reason: input.lock_reason || 'WORKFLOW_COMPLETED',
      locked_by: input.locked_by,
      record_hash,
      previous_log_hash: previousLock?.record_hash || null,
      workflow_state,
      document_count,
      total_nilai,
      catatan: input.catatan,
    },
  });

  // If locking a paket, also finalize all document versions
  if (input.entity_type === 'paket') {
    await finalizePaketDocuments(input.entity_id);
  }

  return lock;
}

/**
 * Check if an entity is archived/locked
 */
export async function isEntityLocked(entity_type: string, entity_id: string): Promise<boolean> {
  const lock = await prisma.archive_lock_log.findUnique({
    where: {
      entity_type_entity_id: { entity_type, entity_id },
    },
  });
  return !!lock;
}

/**
 * Get archive lock details for an entity
 */
export async function getArchiveLock(entity_type: string, entity_id: string) {
  return prisma.archive_lock_log.findUnique({
    where: {
      entity_type_entity_id: { entity_type, entity_id },
    },
    include: {
      locker: { select: { id: true, nama: true, email: true } },
    },
  });
}

/**
 * Get all archive locks for a fiscal year
 */
export async function getArchiveLocksByYear(tahun_anggaran: number) {
  return prisma.archive_lock_log.findMany({
    where: { tahun_anggaran },
    include: {
      locker: { select: { id: true, nama: true } },
    },
    orderBy: { locked_at: 'desc' },
  });
}

// =============================================================================
// Document Version Operations
// =============================================================================

/**
 * Finalize all document versions for a paket (mark as FINAL)
 */
export async function finalizePaketDocuments(paket_id: string) {
  const documents = await prisma.dokumen.findMany({
    where: { paket_id, is_deleted: false },
    select: { id: true },
  });

  const documentIds = documents.map((d) => d.id);

  const result = await prisma.dokumen_versi.updateMany({
    where: {
      dokumen_id: { in: documentIds },
      version_status: { not: 'FINAL' },
      is_deleted: false,
    },
    data: {
      version_status: 'FINAL',
      finalized_at: new Date(),
    },
  });

  return result.count;
}

/**
 * Finalize a specific document version
 */
export async function finalizeDocumentVersion(version_id: string) {
  return prisma.dokumen_versi.update({
    where: { id: version_id },
    data: {
      version_status: 'FINAL',
      finalized_at: new Date(),
    },
  });
}

/**
 * Get document version with hash chain info
 */
export async function getDocumentVersionWithChain(version_id: string) {
  const version = await prisma.dokumen_versi.findUnique({
    where: { id: version_id },
    include: {
      dokumen: {
        include: { paket: { select: { id: true, kode: true, nama: true } } },
      },
      creator: { select: { id: true, nama: true } },
    },
  });

  if (!version) return null;

  const previousVersion = await prisma.dokumen_versi.findFirst({
    where: {
      dokumen_id: version.dokumen_id,
      versi: version.versi - 1,
      is_deleted: false,
    },
    select: { checksum: true, id: true },
  });

  return {
    ...version,
    chain_valid: previousVersion ? previousVersion.checksum === version.previous_version_hash : true,
    previous_version: previousVersion,
  };
}

// =============================================================================
// Legal Timeline Operations
// =============================================================================

/**
 * Get legal timeline events with filters
 */
export async function getLegalTimeline(filter: TimelineFilter) {
  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filter.tahun_anggaran) {
    conditions.push(`tahun_anggaran = $${paramIndex++}`);
    params.push(filter.tahun_anggaran);
  }

  if (filter.paket_id) {
    conditions.push(`paket_id = $${paramIndex++}`);
    params.push(filter.paket_id);
  }

  if (filter.event_type) {
    conditions.push(`event_type = $${paramIndex++}`);
    params.push(filter.event_type);
  }

  if (filter.actor_id) {
    conditions.push(`actor_id = $${paramIndex++}`);
    params.push(filter.actor_id);
  }

  if (filter.from_date) {
    conditions.push(`event_timestamp >= $${paramIndex++}`);
    params.push(filter.from_date);
  }

  if (filter.to_date) {
    conditions.push(`event_timestamp <= $${paramIndex++}`);
    params.push(filter.to_date);
  }

  const limit = filter.limit || 100;
  const offset = filter.offset || 0;

  const query = `
    SELECT *
    FROM asisten.legal_timeline_view
    WHERE ${conditions.join(' AND ')}
    ORDER BY event_timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const results = await prisma.$queryRawUnsafe(query, ...params);
  return results;
}

/**
 * Refresh the legal timeline materialized view
 */
export async function refreshLegalTimeline() {
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY asisten.legal_timeline_view`;
  return { success: true, message: 'Legal timeline view refreshed' };
}

// =============================================================================
// Hash Chain Verification
// =============================================================================

/**
 * Verify hash chain integrity for archive locks
 */
export async function verifyArchiveLockChain(tahun_anggaran: number) {
  const locks = await prisma.archive_lock_log.findMany({
    where: { tahun_anggaran },
    orderBy: { created_at: 'asc' },
  });

  const results: Array<{
    entity_type: string;
    entity_id: string;
    is_valid: boolean;
    error?: string;
  }> = [];

  let previousHash: string | null = null;

  for (const lock of locks) {
    const isValid =
      (lock.previous_log_hash === null && previousHash === null) ||
      lock.previous_log_hash === previousHash;

    results.push({
      entity_type: lock.entity_type,
      entity_id: lock.entity_id,
      is_valid: isValid,
      error: isValid
        ? undefined
        : `Chain broken. Expected: ${previousHash || 'NULL'}, Got: ${lock.previous_log_hash || 'NULL'}`,
    });

    previousHash = lock.record_hash;
  }

  return {
    tahun_anggaran,
    total_locks: locks.length,
    valid_count: results.filter((r) => r.is_valid).length,
    invalid_count: results.filter((r) => !r.is_valid).length,
    chain_intact: results.every((r) => r.is_valid),
    details: results,
  };
}

/**
 * Verify hash chain for document versions
 */
export async function verifyDocumentVersionChain(dokumen_id: string) {
  const versions = await prisma.dokumen_versi.findMany({
    where: { dokumen_id, is_deleted: false },
    orderBy: { versi: 'asc' },
  });

  const results: Array<{
    version: number;
    is_valid: boolean;
    error?: string;
  }> = [];

  let previousChecksum: string | null = null;

  for (const ver of versions) {
    const isValid =
      ver.versi === 1 ||
      (ver.previous_version_hash === null && previousChecksum === null) ||
      ver.previous_version_hash === previousChecksum;

    results.push({
      version: ver.versi,
      is_valid: isValid,
      error: isValid
        ? undefined
        : `Chain broken at version ${ver.versi}`,
    });

    previousChecksum = ver.checksum;
  }

  return {
    dokumen_id,
    total_versions: versions.length,
    chain_intact: results.every((r) => r.is_valid),
    details: results,
  };
}

// =============================================================================
// Backup Catalog Operations
// =============================================================================

/**
 * Register a new backup in the catalog
 */
export async function registerBackup(input: BackupInput) {
  return prisma.backup_catalog.create({
    data: {
      tahun_anggaran: input.tahun_anggaran,
      backup_type: input.backup_type,
      backup_name: input.backup_name,
      backup_path: input.backup_path,
      backup_hash: input.backup_hash,
      status: 'PENDING',
      created_by: input.created_by,
    },
  });
}

/**
 * Update backup status
 */
export async function updateBackupStatus(
  backup_id: string,
  status: BackupStatus,
  additional?: {
    backup_size?: bigint;
    table_count?: number;
    record_count?: number;
    document_count?: number;
    error_message?: string;
    manifest_hash?: string;
  }
) {
  return prisma.backup_catalog.update({
    where: { id: backup_id },
    data: {
      status,
      ...additional,
      completed_at: ['COMPLETED', 'FAILED'].includes(status) ? new Date() : undefined,
    },
  });
}

/**
 * Mark backup as verified
 */
export async function verifyBackup(backup_id: string, verified_by: string) {
  return prisma.backup_catalog.update({
    where: { id: backup_id },
    data: {
      status: 'VERIFIED',
      verified_at: new Date(),
      verified_by,
    },
  });
}

/**
 * Get backup catalog with filters
 */
export async function getBackupCatalog(filter?: {
  tahun_anggaran?: number;
  status?: BackupStatus;
  backup_type?: BackupType;
}) {
  return prisma.backup_catalog.findMany({
    where: filter,
    include: {
      creator: { select: { id: true, nama: true } },
      verifier: { select: { id: true, nama: true } },
    },
    orderBy: { started_at: 'desc' },
  });
}

/**
 * Get a specific backup by ID
 */
export async function getBackup(backup_id: string) {
  return prisma.backup_catalog.findUnique({
    where: { id: backup_id },
    include: {
      creator: { select: { id: true, nama: true } },
      verifier: { select: { id: true, nama: true } },
    },
  });
}

// =============================================================================
// Audit Statistics
// =============================================================================

/**
 * Get audit statistics for a fiscal year
 */
export async function getAuditStatistics(tahun_anggaran: number) {
  const paketCount = await prisma.paket.count({
    where: { tahun_anggaran, is_deleted: false },
  });

  const archivedCount = await prisma.archive_lock_log.count({
    where: {
      tahun_anggaran,
      entity_type: 'paket',
    },
  });

  const documentCount = await prisma.dokumen.count({
    where: {
      paket: { tahun_anggaran },
      is_deleted: false,
    },
  });

  const finalizedVersions = await prisma.dokumen_versi.count({
    where: {
      version_status: 'FINAL',
      is_deleted: false,
      dokumen: {
        paket: { tahun_anggaran },
      },
    },
  });

  const backupStats = await prisma.backup_catalog.groupBy({
    by: ['status'],
    where: { tahun_anggaran },
    _count: true,
  });

  const totalValue = await prisma.paket.aggregate({
    where: { tahun_anggaran, is_deleted: false },
    _sum: { nilai_kontrak: true, nilai_pagu: true },
  });

  return {
    tahun_anggaran,
    paket: {
      total: paketCount,
      archived: archivedCount,
      active: paketCount - archivedCount,
    },
    documents: {
      total: documentCount,
      finalized_versions: finalizedVersions,
    },
    backups: backupStats.reduce(
      (acc, b) => {
        acc[b.status.toLowerCase()] = b._count;
        return acc;
      },
      {} as Record<string, number>
    ),
    financial: {
      total_nilai_kontrak: totalValue._sum.nilai_kontrak,
      total_nilai_pagu: totalValue._sum.nilai_pagu,
    },
  };
}

// =============================================================================
// Fiscal Year Operations
// =============================================================================

/**
 * Close a fiscal year (archive all remaining pakets)
 */
export async function closeFiscalYear(tahun_anggaran: number, user_id: string) {
  const unarchivedPakets = await prisma.paket.findMany({
    where: {
      tahun_anggaran,
      is_deleted: false,
    },
    select: { id: true },
  });

  const results: Array<{ paket_id: string; success: boolean; error?: string }> = [];

  for (const paket of unarchivedPakets) {
    const isLocked = await isEntityLocked('paket', paket.id);
    if (isLocked) {
      results.push({ paket_id: paket.id, success: true });
      continue;
    }

    try {
      await createArchiveLock({
        entity_type: 'paket',
        entity_id: paket.id,
        tahun_anggaran,
        lock_reason: 'FISCAL_YEAR_CLOSED',
        locked_by: user_id,
        catatan: `Auto-archived on fiscal year ${tahun_anggaran} closure`,
      });
      results.push({ paket_id: paket.id, success: true });
    } catch (error: any) {
      results.push({ paket_id: paket.id, success: false, error: error.message });
    }
  }

  return {
    tahun_anggaran,
    total_pakets: unarchivedPakets.length,
    archived: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results,
  };
}
