/**
 * ASISTEN - CRUD Routes for Base Entities
 * Pegawai, Satker, Anggaran, Paket, Dokumen, Permintaan, Perjalanan, Transaksi
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to send response
function sendResponse<T>(res: Response, data: T, message?: string) {
  res.json({ success: true, data, message });
}

function sendError(res: Response, error: Error, status = 400) {
  res.status(status).json({ success: false, error: error.message });
}

// =============================================================================
// SATKER Routes
// =============================================================================

router.get('/satker', async (req: Request, res: Response) => {
  try {
    const satker = await prisma.satker.findMany({
      where: { is_deleted: false },
      orderBy: { nama: 'asc' }
    });
    sendResponse(res, satker);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/satker/:id', async (req: Request, res: Response) => {
  try {
    const satker = await prisma.satker.findUnique({
      where: { id: req.params.id },
      include: { pegawai: { where: { is_deleted: false } } }
    });
    if (!satker) return sendError(res, new Error('Satker not found'), 404);
    sendResponse(res, satker);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/satker', async (req: Request, res: Response) => {
  try {
    const satker = await prisma.satker.create({ data: req.body });
    sendResponse(res, satker, 'Satker created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/satker/:id', async (req: Request, res: Response) => {
  try {
    const satker = await prisma.satker.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, satker, 'Satker updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/satker/:id', async (req: Request, res: Response) => {
  try {
    await prisma.satker.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Satker deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// PEGAWAI Routes
// =============================================================================

router.get('/pegawai', async (req: Request, res: Response) => {
  try {
    const { satker_id, status, jabatan } = req.query;
    const where: any = { is_deleted: false };
    if (satker_id) where.satker_id = satker_id;
    if (status) where.status = status;
    if (jabatan) where.jabatan = { contains: jabatan as string };

    const pegawai = await prisma.pegawai.findMany({
      where,
      include: { satker: true },
      orderBy: { nama: 'asc' }
    });
    sendResponse(res, pegawai);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/pegawai/:id', async (req: Request, res: Response) => {
  try {
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: req.params.id },
      include: { satker: true }
    });
    if (!pegawai) return sendError(res, new Error('Pegawai not found'), 404);
    sendResponse(res, pegawai);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/pegawai', async (req: Request, res: Response) => {
  try {
    const pegawai = await prisma.pegawai.create({
      data: req.body,
      include: { satker: true }
    });
    sendResponse(res, pegawai, 'Pegawai created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/pegawai/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    // Insert one by one to avoid SQLite limitations
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.pegawai.create({ data: item });
        successCount++;
      } catch (err: any) {
        // Skip duplicates (unique constraint violations)
        if (err.code === 'P2002') {
          errors.push(`Duplicate NIP: ${item.nip}`);
        } else {
          errors.push(`Error for ${item.nip}: ${err.message}`);
        }
      }
    }

    sendResponse(res, { count: successCount, errors }, `${successCount} pegawai imported successfully`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/pegawai/:id', async (req: Request, res: Response) => {
  try {
    const pegawai = await prisma.pegawai.update({
      where: { id: req.params.id },
      data: req.body,
      include: { satker: true }
    });
    sendResponse(res, pegawai, 'Pegawai updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/pegawai/:id', async (req: Request, res: Response) => {
  try {
    await prisma.pegawai.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Pegawai deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// ANGGARAN Routes
// =============================================================================

router.get('/anggaran', async (req: Request, res: Response) => {
  try {
    const { satker_id, tahun, kode_akun } = req.query;
    const where: any = { is_deleted: false };
    if (satker_id) where.satker_id = satker_id;
    if (tahun) where.tahun = parseInt(tahun as string);
    if (kode_akun) where.kode_akun = { contains: kode_akun as string };

    const anggaran = await prisma.anggaran.findMany({
      where,
      include: { satker: true },
      orderBy: [{ kode_program: 'asc' }, { kode_kegiatan: 'asc' }, { kode_akun: 'asc' }]
    });
    sendResponse(res, anggaran);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/anggaran/:id', async (req: Request, res: Response) => {
  try {
    const anggaran = await prisma.anggaran.findUnique({
      where: { id: req.params.id },
      include: { satker: true, paket: true }
    });
    if (!anggaran) return sendError(res, new Error('Anggaran not found'), 404);
    sendResponse(res, anggaran);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/anggaran', async (req: Request, res: Response) => {
  try {
    const anggaran = await prisma.anggaran.create({
      data: req.body,
      include: { satker: true }
    });
    sendResponse(res, anggaran, 'Anggaran created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/anggaran/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    // Insert one by one to avoid SQLite limitations
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.anggaran.create({ data: item });
        successCount++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          errors.push(`Duplicate: ${item.kode_akun}`);
        } else {
          errors.push(`Error for ${item.kode_akun}: ${err.message}`);
        }
      }
    }

    sendResponse(res, { count: successCount, errors }, `${successCount} anggaran imported successfully`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/anggaran/:id', async (req: Request, res: Response) => {
  try {
    const anggaran = await prisma.anggaran.update({
      where: { id: req.params.id },
      data: req.body,
      include: { satker: true }
    });
    sendResponse(res, anggaran, 'Anggaran updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/anggaran/:id', async (req: Request, res: Response) => {
  try {
    await prisma.anggaran.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Anggaran deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// PAKET Routes
// =============================================================================

router.get('/paket', async (req: Request, res: Response) => {
  try {
    const { satker_id, tahun, status } = req.query;
    const where: any = { is_deleted: false };
    if (satker_id) where.satker_id = satker_id;
    if (tahun) where.tahun = parseInt(tahun as string);
    if (status) where.status = status;

    const paket = await prisma.paket.findMany({
      where,
      include: { satker: true, anggaran: true },
      orderBy: { created_at: 'desc' }
    });
    sendResponse(res, paket);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/paket/:id', async (req: Request, res: Response) => {
  try {
    const paket = await prisma.paket.findUnique({
      where: { id: req.params.id },
      include: { satker: true, anggaran: true, dokumen: true, permintaan: true }
    });
    if (!paket) return sendError(res, new Error('Paket not found'), 404);
    sendResponse(res, paket);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/paket', async (req: Request, res: Response) => {
  try {
    const paket = await prisma.paket.create({
      data: req.body,
      include: { satker: true, anggaran: true }
    });
    sendResponse(res, paket, 'Paket created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/paket/:id', async (req: Request, res: Response) => {
  try {
    const paket = await prisma.paket.update({
      where: { id: req.params.id },
      data: req.body,
      include: { satker: true, anggaran: true }
    });
    sendResponse(res, paket, 'Paket updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/paket/:id', async (req: Request, res: Response) => {
  try {
    await prisma.paket.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Paket deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// DOKUMEN Routes
// =============================================================================

router.get('/dokumen', async (req: Request, res: Response) => {
  try {
    const { paket_id, tipe, status } = req.query;
    const where: any = { is_deleted: false };
    if (paket_id) where.paket_id = paket_id;
    if (tipe) where.tipe = tipe;
    if (status) where.status = status;

    const dokumen = await prisma.dokumen.findMany({
      where,
      include: { paket: true, versi: { where: { is_current: true } } },
      orderBy: { tanggal: 'desc' }
    });
    sendResponse(res, dokumen);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/dokumen/:id', async (req: Request, res: Response) => {
  try {
    const dokumen = await prisma.dokumen.findUnique({
      where: { id: req.params.id },
      include: { paket: true, versi: true, pihak: { include: { pegawai: true } } }
    });
    if (!dokumen) return sendError(res, new Error('Dokumen not found'), 404);
    sendResponse(res, dokumen);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/dokumen', async (req: Request, res: Response) => {
  try {
    const dokumen = await prisma.dokumen.create({
      data: req.body,
      include: { paket: true }
    });
    sendResponse(res, dokumen, 'Dokumen created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/dokumen/:id', async (req: Request, res: Response) => {
  try {
    const dokumen = await prisma.dokumen.update({
      where: { id: req.params.id },
      data: req.body,
      include: { paket: true }
    });
    sendResponse(res, dokumen, 'Dokumen updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/dokumen/:id', async (req: Request, res: Response) => {
  try {
    await prisma.dokumen.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Dokumen deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// PERMINTAAN Routes
// =============================================================================

router.get('/permintaan', async (req: Request, res: Response) => {
  try {
    const { paket_id, status } = req.query;
    const where: any = { is_deleted: false };
    if (paket_id) where.paket_id = paket_id;
    if (status) where.status = status;

    const permintaan = await prisma.permintaan.findMany({
      where,
      include: { paket: true, items: { where: { is_deleted: false } } },
      orderBy: { tanggal: 'desc' }
    });
    sendResponse(res, permintaan);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/permintaan/:id', async (req: Request, res: Response) => {
  try {
    const permintaan = await prisma.permintaan.findUnique({
      where: { id: req.params.id },
      include: {
        paket: true,
        items: {
          where: { is_deleted: false },
          include: { survey_harga: { where: { is_deleted: false } } }
        }
      }
    });
    if (!permintaan) return sendError(res, new Error('Permintaan not found'), 404);
    sendResponse(res, permintaan);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/permintaan', async (req: Request, res: Response) => {
  try {
    const { items, ...data } = req.body;
    const permintaan = await prisma.permintaan.create({
      data: {
        ...data,
        items: items ? { create: items } : undefined
      },
      include: { paket: true, items: true }
    });
    sendResponse(res, permintaan, 'Permintaan created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/permintaan/:id', async (req: Request, res: Response) => {
  try {
    const permintaan = await prisma.permintaan.update({
      where: { id: req.params.id },
      data: req.body,
      include: { paket: true, items: true }
    });
    sendResponse(res, permintaan, 'Permintaan updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/permintaan/:id', async (req: Request, res: Response) => {
  try {
    await prisma.permintaan.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Permintaan deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// PERJALANAN DINAS Routes
// =============================================================================

router.get('/perjalanan', async (req: Request, res: Response) => {
  try {
    const { paket_id, status } = req.query;
    const where: any = { is_deleted: false };
    if (paket_id) where.paket_id = paket_id;
    if (status) where.status = status;

    const perjalanan = await prisma.perjalanan_dinas.findMany({
      where,
      include: {
        paket: true,
        peserta: { where: { is_deleted: false }, include: { pegawai: true } }
      },
      orderBy: { tanggal_pergi: 'desc' }
    });
    sendResponse(res, perjalanan);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/perjalanan/:id', async (req: Request, res: Response) => {
  try {
    const perjalanan = await prisma.perjalanan_dinas.findUnique({
      where: { id: req.params.id },
      include: {
        paket: true,
        peserta: { where: { is_deleted: false }, include: { pegawai: true } },
        dokumen: { where: { is_deleted: false } }
      }
    });
    if (!perjalanan) return sendError(res, new Error('Perjalanan not found'), 404);
    sendResponse(res, perjalanan);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/perjalanan', async (req: Request, res: Response) => {
  try {
    const { peserta, ...data } = req.body;
    const perjalanan = await prisma.perjalanan_dinas.create({
      data: {
        ...data,
        peserta: peserta ? { create: peserta } : undefined
      },
      include: { paket: true, peserta: { include: { pegawai: true } } }
    });
    sendResponse(res, perjalanan, 'Perjalanan Dinas created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/perjalanan/:id', async (req: Request, res: Response) => {
  try {
    const perjalanan = await prisma.perjalanan_dinas.update({
      where: { id: req.params.id },
      data: req.body,
      include: { paket: true, peserta: { include: { pegawai: true } } }
    });
    sendResponse(res, perjalanan, 'Perjalanan Dinas updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/perjalanan/:id', async (req: Request, res: Response) => {
  try {
    await prisma.perjalanan_dinas.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Perjalanan Dinas deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// TRANSAKSI KEUANGAN Routes
// =============================================================================

router.get('/transaksi', async (req: Request, res: Response) => {
  try {
    const { paket_id, tipe, status } = req.query;
    const where: any = { is_deleted: false };
    if (paket_id) where.paket_id = paket_id;
    if (tipe) where.tipe = tipe;
    if (status) where.status = status;

    const transaksi = await prisma.transaksi_keuangan.findMany({
      where,
      include: { paket: true },
      orderBy: { tanggal: 'desc' }
    });
    sendResponse(res, transaksi);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/transaksi/:id', async (req: Request, res: Response) => {
  try {
    const transaksi = await prisma.transaksi_keuangan.findUnique({
      where: { id: req.params.id },
      include: { paket: true, referensi: true }
    });
    if (!transaksi) return sendError(res, new Error('Transaksi not found'), 404);
    sendResponse(res, transaksi);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/transaksi', async (req: Request, res: Response) => {
  try {
    const transaksi = await prisma.transaksi_keuangan.create({
      data: req.body,
      include: { paket: true }
    });
    sendResponse(res, transaksi, 'Transaksi created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/transaksi/:id', async (req: Request, res: Response) => {
  try {
    const transaksi = await prisma.transaksi_keuangan.update({
      where: { id: req.params.id },
      data: req.body,
      include: { paket: true }
    });
    sendResponse(res, transaksi, 'Transaksi updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/transaksi/:id', async (req: Request, res: Response) => {
  try {
    await prisma.transaksi_keuangan.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Transaksi deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

export default router;
