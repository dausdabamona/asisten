// =============================================================================
// ASISTEN Phase 4: Audit & Forensic Archive Routes
// =============================================================================

import { Router, Request, Response } from 'express';
import * as auditService from '../services/audit.service';

const router = Router();

// =============================================================================
// Archive Lock Routes (WORM Behavior)
// =============================================================================

/**
 * Create archive lock for an entity
 * POST /api/v1/phase4/archive/lock
 */
router.post('/archive/lock', async (req: Request, res: Response) => {
  try {
    const lock = await auditService.createArchiveLock(req.body);
    res.status(201).json({ success: true, data: lock });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Check if entity is locked
 * GET /api/v1/phase4/archive/lock/:entity_type/:entity_id
 */
router.get('/archive/lock/:entity_type/:entity_id', async (req: Request, res: Response) => {
  try {
    const lock = await auditService.getArchiveLock(req.params.entity_type, req.params.entity_id);
    const isLocked = await auditService.isEntityLocked(req.params.entity_type, req.params.entity_id);
    res.json({
      success: true,
      data: {
        is_locked: isLocked,
        lock_details: lock,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Get all archive locks for a fiscal year
 * GET /api/v1/phase4/archive/locks/:tahun_anggaran
 */
router.get('/archive/locks/:tahun_anggaran', async (req: Request, res: Response) => {
  try {
    const locks = await auditService.getArchiveLocksByYear(parseInt(req.params.tahun_anggaran));
    res.json({ success: true, data: locks });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Document Version Routes (Hash Chain)
// =============================================================================

/**
 * Finalize a document version (mark as FINAL - immutable)
 * POST /api/v1/phase4/document-version/:id/finalize
 */
router.post('/document-version/:id/finalize', async (req: Request, res: Response) => {
  try {
    const version = await auditService.finalizeDocumentVersion(req.params.id);
    res.json({ success: true, data: version });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Get document version with hash chain verification
 * GET /api/v1/phase4/document-version/:id/chain
 */
router.get('/document-version/:id/chain', async (req: Request, res: Response) => {
  try {
    const result = await auditService.getDocumentVersionWithChain(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Document version not found' });
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Verify hash chain for a document
 * GET /api/v1/phase4/document/:dokumen_id/verify-chain
 */
router.get('/document/:dokumen_id/verify-chain', async (req: Request, res: Response) => {
  try {
    const result = await auditService.verifyDocumentVersionChain(req.params.dokumen_id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Legal Timeline Routes
// =============================================================================

/**
 * Get legal timeline events
 * GET /api/v1/phase4/timeline
 * Query params: tahun_anggaran, paket_id, event_type, actor_id, from_date, to_date, limit, offset
 */
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const filter = {
      tahun_anggaran: req.query.tahun_anggaran ? parseInt(req.query.tahun_anggaran as string) : undefined,
      paket_id: req.query.paket_id as string | undefined,
      event_type: req.query.event_type as string | undefined,
      actor_id: req.query.actor_id as string | undefined,
      from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
      to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    const events = await auditService.getLegalTimeline(filter);
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Refresh legal timeline materialized view
 * POST /api/v1/phase4/timeline/refresh
 */
router.post('/timeline/refresh', async (req: Request, res: Response) => {
  try {
    const result = await auditService.refreshLegalTimeline();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Hash Chain Verification Routes
// =============================================================================

/**
 * Verify archive lock hash chain for a fiscal year
 * GET /api/v1/phase4/verify/archive-chain/:tahun_anggaran
 */
router.get('/verify/archive-chain/:tahun_anggaran', async (req: Request, res: Response) => {
  try {
    const result = await auditService.verifyArchiveLockChain(parseInt(req.params.tahun_anggaran));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Backup Catalog Routes
// =============================================================================

/**
 * Register a new backup
 * POST /api/v1/phase4/backup
 */
router.post('/backup', async (req: Request, res: Response) => {
  try {
    const backup = await auditService.registerBackup(req.body);
    res.status(201).json({ success: true, data: backup });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Get backup catalog
 * GET /api/v1/phase4/backup
 * Query params: tahun_anggaran, status, backup_type
 */
router.get('/backup', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.tahun_anggaran) filter.tahun_anggaran = parseInt(req.query.tahun_anggaran as string);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.backup_type) filter.backup_type = req.query.backup_type;

    const backups = await auditService.getBackupCatalog(filter);
    res.json({ success: true, data: backups });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Get a specific backup
 * GET /api/v1/phase4/backup/:id
 */
router.get('/backup/:id', async (req: Request, res: Response) => {
  try {
    const backup = await auditService.getBackup(req.params.id);
    if (!backup) {
      return res.status(404).json({ success: false, error: 'Backup not found' });
    }
    res.json({ success: true, data: backup });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Update backup status
 * PATCH /api/v1/phase4/backup/:id/status
 */
router.patch('/backup/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, ...additional } = req.body;
    const backup = await auditService.updateBackupStatus(req.params.id, status, additional);
    res.json({ success: true, data: backup });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Mark backup as verified
 * POST /api/v1/phase4/backup/:id/verify
 */
router.post('/backup/:id/verify', async (req: Request, res: Response) => {
  try {
    const backup = await auditService.verifyBackup(req.params.id, req.body.verified_by);
    res.json({ success: true, data: backup });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Audit Statistics Routes
// =============================================================================

/**
 * Get audit statistics for a fiscal year
 * GET /api/v1/phase4/statistics/:tahun_anggaran
 */
router.get('/statistics/:tahun_anggaran', async (req: Request, res: Response) => {
  try {
    const stats = await auditService.getAuditStatistics(parseInt(req.params.tahun_anggaran));
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Fiscal Year Operations Routes
// =============================================================================

/**
 * Close a fiscal year (archive all pakets)
 * POST /api/v1/phase4/fiscal-year/:tahun_anggaran/close
 */
router.post('/fiscal-year/:tahun_anggaran/close', async (req: Request, res: Response) => {
  try {
    const result = await auditService.closeFiscalYear(
      parseInt(req.params.tahun_anggaran),
      req.body.user_id
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
