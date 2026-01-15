// =============================================================================
// ASISTEN Phase 3: Procurement & Payment Routes
// =============================================================================

import { Router, Request, Response } from 'express';
import * as pengadaanService from '../services/pengadaan.service';
import * as pembayaranService from '../services/pembayaran.service';

const router = Router();

// =============================================================================
// KAK Routes
// =============================================================================

router.post('/kak', async (req: Request, res: Response) => {
  try {
    const kak = await pengadaanService.createKAK(req.body);
    res.status(201).json({ success: true, data: kak });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/kak/:id/submit', async (req: Request, res: Response) => {
  try {
    const kak = await pengadaanService.submitKAK(req.params.id, req.body.user_id);
    res.json({ success: true, data: kak });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/kak/:id/approve', async (req: Request, res: Response) => {
  try {
    const kak = await pengadaanService.approveKAK(req.params.id, req.body.user_id);
    res.json({ success: true, data: kak });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/kak/:id/finalize', async (req: Request, res: Response) => {
  try {
    const kak = await pengadaanService.finalizeKAK(req.params.id, req.body.user_id);
    res.json({ success: true, data: kak });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/kak/:id', async (req: Request, res: Response) => {
  try {
    const kak = await pengadaanService.getKAK(req.params.id);
    if (!kak) {
      return res.status(404).json({ success: false, error: 'KAK not found' });
    }
    res.json({ success: true, data: kak });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// HPS Routes
// =============================================================================

router.post('/hps', async (req: Request, res: Response) => {
  try {
    const hps = await pengadaanService.createHPS(req.body);
    res.status(201).json({ success: true, data: hps });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/hps/:id/approve', async (req: Request, res: Response) => {
  try {
    const hps = await pengadaanService.approveHPS(req.params.id, req.body.user_id);
    res.json({ success: true, data: hps });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Kontrak Routes
// =============================================================================

router.post('/kontrak', async (req: Request, res: Response) => {
  try {
    const kontrak = await pengadaanService.createKontrak(req.body);
    res.status(201).json({ success: true, data: kontrak });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/kontrak/:id/activate', async (req: Request, res: Response) => {
  try {
    const kontrak = await pengadaanService.activateKontrak(req.params.id, req.body.user_id);
    res.json({ success: true, data: kontrak });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/kontrak/:id/upload-signed', async (req: Request, res: Response) => {
  try {
    const version = await pengadaanService.uploadSignedKontrak(
      req.params.id,
      req.body.version_data,
      req.body.user_id
    );
    res.json({ success: true, data: version });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// SPMK Routes
// =============================================================================

router.post('/spmk', async (req: Request, res: Response) => {
  try {
    const spmk = await pengadaanService.createSPMK(req.body);
    res.status(201).json({ success: true, data: spmk });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spmk/:id/issue', async (req: Request, res: Response) => {
  try {
    const spmk = await pengadaanService.issueSPMK(req.params.id, req.body.user_id);
    res.json({ success: true, data: spmk });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// BAST Routes
// =============================================================================

router.post('/bast', async (req: Request, res: Response) => {
  try {
    const bast = await pengadaanService.createBAST(req.body);
    res.status(201).json({ success: true, data: bast });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/bast/:id/accept', async (req: Request, res: Response) => {
  try {
    const bast = await pengadaanService.acceptBAST(req.params.id, req.body.user_id);
    res.json({ success: true, data: bast });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// SPP Routes
// =============================================================================

router.post('/spp', async (req: Request, res: Response) => {
  try {
    const spp = await pembayaranService.createSPP(req.body);
    res.status(201).json({ success: true, data: spp });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spp/:id/submit', async (req: Request, res: Response) => {
  try {
    const spp = await pembayaranService.submitSPP(req.params.id, req.body.user_id);
    res.json({ success: true, data: spp });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spp/:id/verify', async (req: Request, res: Response) => {
  try {
    const spp = await pembayaranService.verifySPP(req.params.id, req.body.user_id);
    res.json({ success: true, data: spp });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spp/:id/approve', async (req: Request, res: Response) => {
  try {
    const spp = await pembayaranService.approveSPP(req.params.id, req.body.user_id);
    res.json({ success: true, data: spp });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spp/:id/reject', async (req: Request, res: Response) => {
  try {
    const spp = await pembayaranService.rejectSPP(req.params.id, req.body.user_id, req.body.catatan);
    res.json({ success: true, data: spp });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spp/:id/add-tax', async (req: Request, res: Response) => {
  try {
    const tax = await pembayaranService.addTaxDeduction({
      spp_id: req.params.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: tax });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// SPM Routes
// =============================================================================

router.post('/spm', async (req: Request, res: Response) => {
  try {
    const spm = await pembayaranService.createSPM(req.body);
    res.status(201).json({ success: true, data: spm });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spm/:id/issue', async (req: Request, res: Response) => {
  try {
    const spm = await pembayaranService.issueSPM(req.params.id, req.body.user_id);
    res.json({ success: true, data: spm });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/spm/:id/submit-sp2d', async (req: Request, res: Response) => {
  try {
    const spm = await pembayaranService.submitSPMForSP2D(req.params.id, req.body.user_id);
    res.json({ success: true, data: spm });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// SP2D Routes
// =============================================================================

router.post('/sp2d', async (req: Request, res: Response) => {
  try {
    const sp2d = await pembayaranService.createSP2D(req.body);
    res.status(201).json({ success: true, data: sp2d });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sp2d/:id/issue', async (req: Request, res: Response) => {
  try {
    const sp2d = await pembayaranService.issueSP2D(req.params.id, req.body.user_id);
    res.json({ success: true, data: sp2d });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sp2d/:id/disburse', async (req: Request, res: Response) => {
  try {
    const sp2d = await pembayaranService.disburseSP2D(
      req.params.id,
      new Date(req.body.tanggal_cair),
      req.body.user_id
    );
    res.json({ success: true, data: sp2d });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sp2d/:id/complete', async (req: Request, res: Response) => {
  try {
    const sp2d = await pembayaranService.completeSP2D(req.params.id, req.body.user_id);
    res.json({ success: true, data: sp2d });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================================================
// Status & Summary Routes
// =============================================================================

router.get('/paket/:id/procurement-status', async (req: Request, res: Response) => {
  try {
    const status = await pengadaanService.getProcurementStatus(req.params.id);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/paket/:id/payment-status', async (req: Request, res: Response) => {
  try {
    const status = await pembayaranService.getPaymentStatus(req.params.id);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/paket/:id/payment-summary', async (req: Request, res: Response) => {
  try {
    const summary = await pembayaranService.getPaymentSummary(req.params.id);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
