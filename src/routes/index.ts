/**
 * ASISTEN - Phase 2: API Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SppdService } from '../services/sppd.service';
import { KeuanganService } from '../services/keuangan.service';
import { WorkflowService } from '../services/workflow.service';
import { AuditService } from '../services/audit.service';
import { ApiResponse, RequestContext } from '../types';

const router = Router();

// Helper to extract context from request
function getContext(req: Request): RequestContext {
  return {
    userId: (req as any).userId || req.headers['x-user-id'] as string || '',
    userRoles: (req as any).userRoles || [],
    ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent']
  };
}

// Helper to send response
function sendResponse<T>(res: Response, data: T, message?: string) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  res.json(response);
}

// Helper to send error
function sendError(res: Response, error: Error, status = 400) {
  const response: ApiResponse = {
    success: false,
    error: error.message
  };
  res.status(status).json(response);
}

// =============================================================================
// SPPD Routes
// =============================================================================

/**
 * POST /sppd/surat-tugas
 * Create Surat Tugas for a Perjalanan Dinas
 */
router.post('/sppd/surat-tugas', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await SppdService.createSuratTugas(req.body, ctx);
    sendResponse(res, result, 'Surat Tugas created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * POST /sppd/terbit
 * Issue SPPD for a Perjalanan Dinas
 */
router.post('/sppd/terbit', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await SppdService.terbitSppd(req.body, ctx);
    sendResponse(res, result, 'SPPD issued successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * GET /sppd/status/:perjalananId
 * Get complete SPPD status
 */
router.get('/sppd/status/:perjalananId', async (req: Request, res: Response) => {
  try {
    const result = await SppdService.getSppdStatus(req.params.perjalananId);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// Keuangan Routes
// =============================================================================

/**
 * POST /keuangan/uang-muka
 * Create Kuitansi Uang Muka
 */
router.post('/keuangan/uang-muka', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await KeuanganService.createUangMuka(req.body, ctx);
    sendResponse(res, result, 'Kuitansi Uang Muka created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * POST /keuangan/rampung
 * Create Kuitansi Rampung (Settlement)
 */
router.post('/keuangan/rampung', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await KeuanganService.createRampung(req.body, ctx);
    sendResponse(res, result, 'Kuitansi Rampung created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * POST /keuangan/spj
 * Create SPJ (Surat Pertanggungjawaban)
 */
router.post('/keuangan/spj', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await KeuanganService.createSPJ(req.body, ctx);
    sendResponse(res, result, 'SPJ created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * GET /keuangan/treasury-balance
 * Get treasury balance summary
 */
router.get('/keuangan/treasury-balance', async (req: Request, res: Response) => {
  try {
    const paketId = req.query.paketId as string | undefined;
    const result = await KeuanganService.getTreasuryBalance(paketId);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// Workflow Routes
// =============================================================================

/**
 * POST /workflow/approve
 * Approve a document
 */
router.post('/workflow/approve', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await WorkflowService.approve(req.body, ctx);
    sendResponse(res, result, 'Approval recorded successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * POST /workflow/transition
 * Transition workflow to next stage
 */
router.post('/workflow/transition', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await WorkflowService.transitionWorkflow(req.body, ctx);
    sendResponse(res, result, 'Workflow transitioned successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * GET /workflow/actions/:workflowInstanceId
 * Get available actions for workflow
 */
router.get('/workflow/actions/:workflowInstanceId', async (req: Request, res: Response) => {
  try {
    const ctx = getContext(req);
    const result = await WorkflowService.getAvailableActions(
      req.params.workflowInstanceId,
      ctx.userId
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// Audit Routes
// =============================================================================

/**
 * GET /audit/trail/:tableName/:recordId
 * Get audit trail for a record
 */
router.get('/audit/trail/:tableName/:recordId', async (req: Request, res: Response) => {
  try {
    const result = await AuditService.getAuditTrail(
      req.params.tableName,
      req.params.recordId
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error as Error);
  }
});

/**
 * GET /audit/perjalanan/:perjalananId
 * Get complete audit trail for a Perjalanan Dinas
 */
router.get('/audit/perjalanan/:perjalananId', async (req: Request, res: Response) => {
  try {
    const result = await AuditService.getPerjalananAuditTrail(req.params.perjalananId);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error as Error);
  }
});

export default router;
