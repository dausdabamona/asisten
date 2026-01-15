/**
 * ASISTEN - Phase 2: Audit Service
 * Immutable audit trail logging
 */

import { PrismaClient } from '@prisma/client';
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
