/**
 * ASISTEN - Phase 2: Workflow Service
 * Business logic for workflow transitions and approvals
 */

import { PrismaClient } from '@prisma/client';
import { ApprovalStatus, SPJStatus } from '../types';
import { ApproveDTO, TransitionWorkflowDTO, RequestContext } from '../types';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class WorkflowService {
  /**
   * Approve a document
   * Business Rules:
   * - User must have required role
   * - Document must exist and be in approvable state
   * - Creates approval_log entry
   */
  static async approve(
    dto: ApproveDTO,
    ctx: RequestContext
  ): Promise<any> {
    // Get document
    const dokumen = await prisma.dokumen.findUnique({
      where: { id: dto.dokumenId },
      include: {
        paket: true,
        workflow_stage: true,
        surat_tugas: true,
        sppd: true,
        kuitansi: true
      }
    });

    if (!dokumen) {
      throw new Error('Document not found');
    }

    // Get user's roles
    const userRoles = await prisma.user_roles.findMany({
      where: {
        user_id: ctx.userId,
        is_deleted: false
      },
      include: { role: true }
    });

    if (userRoles.length === 0) {
      throw new Error('User has no roles assigned');
    }

    // Get the first applicable role for this approval
    const roleId = userRoles[0].role_id;

    // Create approval log
    const approvalLog = await prisma.approval_log.create({
      data: {
        dokumen_id: dto.dokumenId,
        role_id: roleId,
        approver_id: ctx.userId,
        status: dto.status as ApprovalStatus,
        catatan: dto.catatan,
        approved_at: dto.status === 'APPROVED' ? new Date() : null,
        created_by: ctx.userId
      }
    });

    // Update related entity status based on document type
    await prisma.$transaction(async (tx) => {
      // Update Surat Tugas status
      if (dokumen.surat_tugas && dokumen.surat_tugas.length > 0) {
        const st = dokumen.surat_tugas[0];
        const newStatus = dto.status === 'APPROVED' ? 'APPROVED' :
                         dto.status === 'REJECTED' ? 'REJECTED' : 'MENUNGGU_APPROVAL';
        await tx.surat_tugas.update({
          where: { id: st.id },
          data: {
            status: newStatus as any,
            updated_by: ctx.userId
          }
        });
      }

      // Update SPPD status
      if (dokumen.sppd && dokumen.sppd.length > 0) {
        const sppd = dokumen.sppd[0];
        if (dto.status === 'APPROVED' && sppd.status === 'DRAFT') {
          await tx.sppd.update({
            where: { id: sppd.id },
            data: {
              status: 'TERBIT',
              updated_by: ctx.userId
            }
          });
        }
      }

      // Update Kuitansi status
      if (dokumen.kuitansi && dokumen.kuitansi.length > 0) {
        const kuitansi = dokumen.kuitansi[0];
        const newStatus = dto.status === 'APPROVED' ? 'DIVERIFIKASI' :
                         dto.status === 'REJECTED' ? 'DITOLAK' : 'DIAJUKAN';
        await tx.kuitansi.update({
          where: { id: kuitansi.id },
          data: {
            status: newStatus as any,
            updated_by: ctx.userId
          }
        });
      }
    });

    // Log audit
    await AuditService.log({
      tableName: 'approval_log',
      recordId: approvalLog.id,
      action: 'INSERT',
      newValues: approvalLog,
      ctx
    });

    return approvalLog;
  }

  /**
   * Transition workflow to next stage
   * Business Rules:
   * - Check if transition is allowed
   * - Check if SPJ is balanced before closing workflow
   * - Create transition log
   */
  static async transitionWorkflow(
    dto: TransitionWorkflowDTO,
    ctx: RequestContext
  ): Promise<any> {
    // Get workflow instance
    const workflowInstance = await prisma.workflow_instance.findUnique({
      where: { id: dto.workflowInstanceId },
      include: {
        current_stage: true,
        paket: true,
        pertanggungjawaban: {
          where: { is_deleted: false }
        }
      }
    });

    if (!workflowInstance) {
      throw new Error('Workflow instance not found');
    }

    if (!workflowInstance.is_active) {
      throw new Error('Workflow is not active');
    }

    // Get target stage
    const toStage = await prisma.workflow_stage.findFirst({
      where: { kode: dto.toStageCode as any }
    });

    if (!toStage) {
      throw new Error(`Target stage ${dto.toStageCode} not found`);
    }

    // Check if this is closing the workflow (moving to ARSIP)
    if (toStage.is_final) {
      // Check if all SPJ are balanced
      const unbalancedSpj = workflowInstance.pertanggungjawaban.filter(
        spj => spj.status !== SPJStatus.DISAHKAN && spj.status !== SPJStatus.SELESAI
      );

      if (unbalancedSpj.length > 0) {
        throw new Error(`Cannot close workflow: ${unbalancedSpj.length} SPJ not yet balanced/approved`);
      }
    }

    // Check if transition is allowed (validate stage order)
    if (toStage.urutan < workflowInstance.current_stage.urutan) {
      // Allow backward transitions with proper authorization
      const userRoles = await prisma.user_roles.findMany({
        where: { user_id: ctx.userId, is_deleted: false },
        include: { role: true }
      });

      const hasAdminOrPPK = userRoles.some(
        ur => ur.role.kode === 'ADMIN' || ur.role.kode === 'PPK'
      );

      if (!hasAdminOrPPK) {
        throw new Error('Only Admin or PPK can transition to a previous stage');
      }
    }

    // Create transition and update workflow
    const result = await prisma.$transaction(async (tx) => {
      // Create transition log
      const transition = await tx.workflow_transition.create({
        data: {
          workflow_instance_id: dto.workflowInstanceId,
          from_stage_id: workflowInstance.current_stage_id,
          to_stage_id: toStage.id,
          transitioned_by: ctx.userId,
          catatan: dto.catatan,
          created_by: ctx.userId
        }
      });

      // Update workflow instance
      const updatedWorkflow = await tx.workflow_instance.update({
        where: { id: dto.workflowInstanceId },
        data: {
          current_stage_id: toStage.id,
          completed_at: toStage.is_final ? new Date() : null,
          is_active: !toStage.is_final,
          updated_by: ctx.userId
        }
      });

      return { transition, updatedWorkflow };
    });

    // Log audit
    await AuditService.log({
      tableName: 'workflow_transition',
      recordId: result.transition.id,
      action: 'INSERT',
      newValues: result.transition,
      ctx
    });

    return result;
  }

  /**
   * Get available actions for current stage
   */
  static async getAvailableActions(
    workflowInstanceId: string,
    userId: string
  ): Promise<any> {
    const workflowInstance = await prisma.workflow_instance.findUnique({
      where: { id: workflowInstanceId },
      include: { current_stage: true }
    });

    if (!workflowInstance) {
      throw new Error('Workflow instance not found');
    }

    // Get user roles
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: userId, is_deleted: false },
      select: { role_id: true }
    });

    const roleIds = userRoles.map(ur => ur.role_id);

    // Get available actions for this stage that user can perform
    const actions = await prisma.workflow_action.findMany({
      where: {
        workflow_stage_id: workflowInstance.current_stage_id,
        is_deleted: false,
        OR: [
          { required_role_id: null },
          { required_role_id: { in: roleIds } }
        ]
      },
      include: { required_role: true },
      orderBy: { urutan: 'asc' }
    });

    return {
      currentStage: workflowInstance.current_stage,
      availableActions: actions
    };
  }
}
