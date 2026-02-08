/**
 * ASISTEN - CRUD Routes for Base Entities
 * Pegawai, Satker, Anggaran, Paket, Dokumen, Permintaan, Perjalanan, Transaksi
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { STORAGE } from '../config/storage';
import { AuthRequest } from '../types/auth';
import { logAudit } from '../middleware/audit.middleware';
import * as XLSX from 'xlsx';

const router = Router();
const prisma = new PrismaClient();

// File upload configuration - uses configurable storage path
const UPLOAD_DIR = STORAGE.DOKUMEN_PAKET_PATH;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `dok-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF dan Word yang diizinkan'));
    }
  }
});

// Helper to send response
function sendResponse<T>(res: Response, data: T, message?: string) {
  res.json({ success: true, data, message });
}

function sendError(res: Response, error: Error, status = 400) {
  console.error('[ERROR]', error.message);
  console.error('[ERROR Stack]', error.stack);
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

router.post('/satker', async (req: AuthRequest, res: Response) => {
  try {
    const satker = await prisma.satker.create({ data: req.body });
    logAudit({ req, tableName: 'satker', recordId: satker.id, action: 'INSERT', newValues: req.body });
    sendResponse(res, satker, 'Satker created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/satker/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.satker.findUnique({ where: { id: req.params.id } });
    const satker = await prisma.satker.update({
      where: { id: req.params.id },
      data: req.body
    });
    logAudit({ req, tableName: 'satker', recordId: req.params.id, action: 'UPDATE', oldValues: old, newValues: req.body });
    sendResponse(res, satker, 'Satker updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/satker/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.satker.findUnique({ where: { id: req.params.id } });
    await prisma.satker.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    logAudit({ req, tableName: 'satker', recordId: req.params.id, action: 'DELETE', oldValues: old });
    sendResponse(res, null, 'Satker deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// ANGGARAN Routes
// =============================================================================

router.get('/anggaran', async (req: Request, res: Response) => {
  try {
    const { tahun } = req.query;
    const where: any = { is_deleted: false };
    if (tahun) where.tahun = Number(tahun);

    const anggaran = await prisma.anggaran.findMany({
      where,
      include: { satker: true, paket: true },
      orderBy: { kode_akun: 'asc' }
    });
    sendResponse(res, anggaran);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/anggaran', async (req: Request, res: Response) => {
  try {
    const anggaran = await prisma.anggaran.create({ data: req.body });
    sendResponse(res, anggaran, 'Anggaran created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/anggaran/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) return sendError(res, new Error('Data must be an array'));

    let successCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.anggaran.create({ data: item });
        successCount++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          errors.push(`Duplicate kode_akun/tahun: ${item.kode_akun}`);
        } else {
          errors.push(err.message);
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
      data: req.body
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

router.delete('/anggaran', async (req: Request, res: Response) => {
  try {
    const { tahun } = req.query;
    const where: any = {};
    if (tahun) where.tahun = Number(tahun);
    await prisma.anggaran.deleteMany({ where });
    sendResponse(res, null, 'Anggaran deleted successfully');
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

router.post('/pegawai', async (req: AuthRequest, res: Response) => {
  try {
    const pegawai = await prisma.pegawai.create({
      data: req.body,
      include: { satker: true }
    });
    logAudit({ req, tableName: 'pegawai', recordId: pegawai.id, action: 'INSERT', newValues: req.body });
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

    // Upsert one by one: create if new, update if NIP exists
    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        const existing = await prisma.pegawai.findUnique({ where: { nip: item.nip } });
        if (existing) {
          // Update existing record
          const { nip, ...updateData } = item;
          await prisma.pegawai.update({
            where: { nip },
            data: updateData,
          });
          updatedCount++;
        } else {
          // Create new record (requires nama)
          await prisma.pegawai.create({ data: item });
          createdCount++;
        }
      } catch (err: any) {
        errors.push(`Error for ${item.nip}: ${err.message}`);
      }
    }

    sendResponse(res, { count: createdCount + updatedCount, created: createdCount, updated: updatedCount, errors }, `${createdCount} created, ${updatedCount} updated`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/pegawai/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.pegawai.findUnique({ where: { id: req.params.id } });
    const pegawai = await prisma.pegawai.update({
      where: { id: req.params.id },
      data: req.body,
      include: { satker: true }
    });
    logAudit({ req, tableName: 'pegawai', recordId: req.params.id, action: 'UPDATE', oldValues: old, newValues: req.body });
    sendResponse(res, pegawai, 'Pegawai updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/pegawai/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.pegawai.findUnique({ where: { id: req.params.id } });
    await prisma.pegawai.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    logAudit({ req, tableName: 'pegawai', recordId: req.params.id, action: 'DELETE', oldValues: old });
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

    console.log(`[BULK INSERT] Starting bulk insert for ${data.length} records`);

    // Process in batches to avoid memory/timeout issues
    const BATCH_SIZE = 50;
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(`[BULK INSERT] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)`);

      for (const item of batch) {
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
    }

    console.log(`[BULK INSERT] Completed: ${successCount} success, ${errors.length} errors`);
    sendResponse(res, { count: successCount, errors }, `${successCount} anggaran imported successfully`);
  } catch (error) {
    console.error('[BULK INSERT] Error:', error);
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
// REALISASI IMPORT Routes (FA Detail 16 Segmen)
// =============================================================================

// Multer for realisasi import
const realisasiUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// POST /anggaran/import-realisasi - Parse FA Detail Excel & update realisasi per MAK
router.post('/anggaran/import-realisasi', realisasiUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, new Error('File tidak ditemukan'));
    }

    const { tahun } = req.body;
    const tahunAnggaran = tahun ? parseInt(tahun) : new Date().getFullYear();

    // Parse Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // Extract periode from metadata (row 3, usually "Periode Februari 2026")
    let periode = '';
    for (let i = 0; i < Math.min(8, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      for (const cell of row) {
        const cellStr = String(cell || '');
        if (cellStr.includes('Periode')) {
          periode = cellStr.replace('Periode', '').trim();
          break;
        }
      }
      if (periode) break;
    }

    // Track hierarchy context as we iterate
    let currentProgram = '';
    let currentKegiatan = '';
    let currentOutput = '';
    let currentSubOutput = '';

    // Extract MAK rows (Col 7 non-empty = leaf data row)
    const makRows: {
      kode_akun: string;
      nama_akun: string;
      kode_program: string;
      kode_kegiatan: string;
      kode_output: string;
      kode_subkomponen: string;
      pagu_revisi: number;
      realisasi_lalu: number;
      realisasi_ini: number;
      realisasi_sd: number;
      sisa: number;
    }[] = [];

    for (let i = 8; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      // Skip note rows
      const col1 = String(row[1] || '').trim();
      if (col1.startsWith('*')) continue;

      // Update hierarchy context
      if (row[1] && !row[7]) {
        const prog = String(row[1]).trim();
        if (prog && prog.length <= 10) currentProgram = prog;
      }
      if (row[2] && !row[7]) {
        const keg = String(row[2]).trim();
        if (keg && keg.length <= 15) currentKegiatan = keg;
      }
      if (row[4] && !row[7]) {
        const out = String(row[4]).trim();
        if (out) currentOutput = out;
      }
      if (row[5] && !row[7]) {
        const sub = String(row[5]).trim();
        if (sub) currentSubOutput = sub;
      }

      // Check if this is a MAK row (Col 7 non-empty)
      const makCode = String(row[7] || '').trim();
      if (!makCode || !/^\d{6}$/.test(makCode)) continue;

      const parseNum = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
      };

      // Column mapping for FA Detail 16 Segmen:
      // Col 16: Pagu Revisi, Col 22: Real Lalu, Col 23: Real Ini,
      // Col 25: Real SD (s.d. Periode), Col 30: Sisa
      const realLalu = parseNum(row[22]);
      const realIni = parseNum(row[23]);
      const realSD = parseNum(row[25]) || (realLalu + realIni);

      makRows.push({
        kode_akun: makCode,
        nama_akun: String(row[12] || '').trim(),
        kode_program: currentProgram,
        kode_kegiatan: currentKegiatan,
        kode_output: currentOutput,
        kode_subkomponen: currentSubOutput,
        pagu_revisi: parseNum(row[16]),
        realisasi_lalu: realLalu,
        realisasi_ini: realIni,
        realisasi_sd: realSD,
        sisa: parseNum(row[30]),
      });
    }

    if (makRows.length === 0) {
      return sendError(res, new Error('Tidak ada data MAK yang ditemukan dalam file'));
    }

    // Get existing anggaran records for matching
    const existingAnggaran = await prisma.anggaran.findMany({
      where: { tahun: tahunAnggaran, is_deleted: false },
      select: { id: true, kode_akun: true, kode_program: true, kode_kegiatan: true, kode_output: true, kode_subkomponen: true },
    });

    // Match and update
    let matched = 0;
    let unmatched = 0;
    let totalPagu = 0;
    let totalRealisasi = 0;
    const unmatchedList: string[] = [];

    for (const mak of makRows) {
      totalPagu += mak.pagu_revisi;
      totalRealisasi += mak.realisasi_sd;

      // Find matching anggaran records by kode_akun
      // Multiple records can have the same MAK (different items under same account)
      const matches = existingAnggaran.filter(a => a.kode_akun === mak.kode_akun);

      if (matches.length > 0) {
        // Update all matching records - distribute realisasi proportionally or update the header
        // For simplicity, update all records with same MAK
        for (const match of matches) {
          await prisma.anggaran.update({
            where: { id: match.id },
            data: {
              realisasi: mak.realisasi_sd,
              sisa: mak.sisa,
            },
          });
        }
        matched++;
      } else {
        unmatched++;
        if (unmatchedList.length < 20) {
          unmatchedList.push(`${mak.kode_akun} - ${mak.nama_akun}`);
        }
      }
    }

    // Save import history
    await prisma.realisasi_import.create({
      data: {
        tahun: tahunAnggaran,
        periode: periode || `Import ${new Date().toLocaleDateString('id-ID')}`,
        nama_file: req.file.originalname,
        jumlah_mak: makRows.length,
        matched,
        unmatched,
        total_pagu: totalPagu,
        total_realisasi: totalRealisasi,
      },
    });

    sendResponse(res, {
      jumlah_mak: makRows.length,
      matched,
      unmatched,
      unmatchedList,
      totalPagu,
      totalRealisasi,
      periode,
    }, `${matched} MAK diupdate, ${unmatched} tidak ditemukan`);
  } catch (error: any) {
    console.error('[REALISASI IMPORT]', error);
    sendError(res, error);
  }
});

// POST /anggaran/preview-realisasi - Preview FA Detail without saving
router.post('/anggaran/preview-realisasi', realisasiUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, new Error('File tidak ditemukan'));
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // Extract periode
    let periode = '';
    for (let i = 0; i < Math.min(8, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      for (const cell of row) {
        const cellStr = String(cell || '');
        if (cellStr.includes('Periode')) {
          periode = cellStr.replace('Periode', '').trim();
          break;
        }
      }
      if (periode) break;
    }

    // Track hierarchy and extract MAK rows
    let currentProgram = '';
    let currentKegiatan = '';
    const makRows: any[] = [];

    for (let i = 8; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const col1 = String(row[1] || '').trim();
      if (col1.startsWith('*')) continue;

      if (row[1] && !row[7]) {
        const prog = String(row[1]).trim();
        if (prog && prog.length <= 10) currentProgram = prog;
      }
      if (row[2] && !row[7]) {
        const keg = String(row[2]).trim();
        if (keg && keg.length <= 15) currentKegiatan = keg;
      }

      const makCode = String(row[7] || '').trim();
      if (!makCode || !/^\d{6}$/.test(makCode)) continue;

      const parseNum = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
      };

      // Column mapping: Col 22: Real Lalu, Col 23: Real Ini, Col 25: Real SD, Col 30: Sisa
      const realLalu = parseNum(row[22]);
      const realIni = parseNum(row[23]);
      const realSD = parseNum(row[25]) || (realLalu + realIni);

      makRows.push({
        kode_akun: makCode,
        nama_akun: String(row[12] || '').trim(),
        kode_kegiatan: currentKegiatan,
        pagu_revisi: parseNum(row[16]),
        realisasi_lalu: realLalu,
        realisasi_ini: realIni,
        realisasi_sd: realSD,
        sisa: parseNum(row[30]),
      });
    }

    const totalPagu = makRows.reduce((s: number, r: any) => s + r.pagu_revisi, 0);
    const totalRealisasi = makRows.reduce((s: number, r: any) => s + r.realisasi_sd, 0);
    const totalSisa = makRows.reduce((s: number, r: any) => s + r.sisa, 0);

    sendResponse(res, {
      periode,
      jumlah_mak: makRows.length,
      totalPagu,
      totalRealisasi,
      totalSisa,
      persen: totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(2) : '0.00',
      preview: makRows.slice(0, 50),
    });
  } catch (error: any) {
    console.error('[REALISASI PREVIEW]', error);
    sendError(res, error);
  }
});

// GET /anggaran/realisasi-history - Import history
router.get('/anggaran/realisasi-history', async (_req: Request, res: Response) => {
  try {
    const history = await prisma.realisasi_import.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    sendResponse(res, history);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// PAKET Routes
// =============================================================================

router.get('/paket', async (req: Request, res: Response) => {
  try {
    const { satker_id, tahun, status, jenis_pengadaan } = req.query;
    const where: any = { is_deleted: false };
    if (satker_id) where.satker_id = satker_id;
    if (tahun) where.tahun = parseInt(tahun as string);
    if (status) where.status = status;
    if (jenis_pengadaan) where.jenis_pengadaan = jenis_pengadaan;

    const paket = await prisma.paket.findMany({
      where,
      include: {
        satker: true,
        anggaran: true,
        penyedia: true,
        permintaan: { where: { is_deleted: false } },
        dokumen_paket: { where: { is_deleted: false } },
        _count: {
          select: {
            permintaan: { where: { is_deleted: false } },
            dokumen_paket: { where: { is_deleted: false } },
            termin: { where: { is_deleted: false } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    sendResponse(res, paket);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Create paket from permintaan (Tier 2/3 yang DISETUJUI)
// NOTE: This route MUST be before /paket/:id to avoid matching :id = "from-permintaan"
router.post('/paket/from-permintaan', async (req: Request, res: Response) => {
  try {
    const { permintaan_id, satker_id } = req.body;

    // Get permintaan data
    const permintaan = await prisma.permintaan.findUnique({
      where: { id: permintaan_id },
      include: { items: { where: { is_deleted: false } } }
    });

    if (!permintaan) {
      return sendError(res, new Error('Permintaan not found'), 404);
    }

    // Check if permintaan is DISETUJUI
    if (permintaan.status !== 'DISETUJUI') {
      return sendError(res, new Error('Permintaan harus berstatus DISETUJUI'), 400);
    }

    // Check if permintaan already linked to a paket
    if (permintaan.paket_id) {
      return sendError(res, new Error('Permintaan sudah terhubung dengan paket lain'), 400);
    }

    // Get total value
    const totalValue = Number(permintaan.total_final || 0);

    // Check tier (must be >= 50 million for Tier 2/3)
    if (totalValue < 50000000) {
      return sendError(res, new Error('Nilai permintaan harus di atas 50 juta untuk diproses ke Paket Pekerjaan'), 400);
    }

    // Determine jenis_pengadaan from items
    const jenisMap: Record<string, string> = {
      'BARANG': 'BARANG',
      'JASA': 'JASA_LAINNYA',
      'KONSULTAN': 'JASA_KONSULTANSI',
      'SWAKELOLA': 'JASA_LAINNYA'
    };
    const firstItemJenis = permintaan.items[0]?.jenis || 'BARANG';
    const jenisPengadaan = jenisMap[firstItemJenis] || 'BARANG';

    // Determine metode based on tier
    // Tier 2 (50jt - 1M): PENUNJUKAN
    // Tier 3 (> 1M): TENDER
    const metodePengadaan = totalValue >= 1000000000 ? 'TENDER' : 'PENUNJUKAN';

    // Generate kode paket
    const tahun = new Date().getFullYear();
    const count = await prisma.paket.count({
      where: { tahun }
    });
    const kode = `PKT/${String(count + 1).padStart(4, '0')}/${tahun}`;

    // Create paket
    const paket = await prisma.paket.create({
      data: {
        kode,
        nama: permintaan.perihal,
        tahun,
        satker_id: satker_id || null,
        pagu: totalValue,
        jenis_pengadaan: jenisPengadaan,
        metode_pengadaan: metodePengadaan,
        status: 'PERENCANAAN'
      },
      include: { satker: true, anggaran: true }
    });

    // Link permintaan to paket
    await prisma.permintaan.update({
      where: { id: permintaan_id },
      data: {
        paket_id: paket.id,
        status: 'PROSES' // Update status permintaan ke PROSES
      }
    });

    // Return paket with linked permintaan
    const result = await prisma.paket.findUnique({
      where: { id: paket.id },
      include: { satker: true, anggaran: true, permintaan: true }
    });

    sendResponse(res, result, 'Paket berhasil dibuat dari permintaan');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update paket status (workflow transition)
// NOTE: This route MUST be before /paket/:id to avoid matching :id first
router.put('/paket/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    // Valid status transitions
    const validStatuses = [
      'PERENCANAAN',
      'PERSIAPAN',
      'PEMILIHAN',
      'KONTRAK',
      'PELAKSANAAN',
      'SERAH_TERIMA',
      'PEMBAYARAN',
      'SELESAI'
    ];

    if (!validStatuses.includes(status)) {
      return sendError(res, new Error(`Status tidak valid. Status yang valid: ${validStatuses.join(', ')}`), 400);
    }

    const paket = await prisma.paket.findUnique({
      where: { id: req.params.id }
    });

    if (!paket) {
      return sendError(res, new Error('Paket not found'), 404);
    }

    // Check valid transition (must be sequential)
    const currentIndex = validStatuses.indexOf(paket.status);
    const newIndex = validStatuses.indexOf(status);

    // Allow moving forward by 1 step or backward
    if (newIndex > currentIndex + 1) {
      return sendError(res, new Error('Status hanya dapat diubah ke tahap berikutnya'), 400);
    }

    const updated = await prisma.paket.update({
      where: { id: req.params.id },
      data: { status },
      include: { satker: true, anggaran: true, permintaan: true }
    });

    // If paket status is SELESAI, update linked permintaan status
    if (status === 'SELESAI') {
      await prisma.permintaan.updateMany({
        where: { paket_id: req.params.id },
        data: { status: 'SELESAI' }
      });
    }

    sendResponse(res, updated, `Status paket berhasil diubah ke ${status}`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/paket/:id', async (req: Request, res: Response) => {
  try {
    const paket = await prisma.paket.findUnique({
      where: { id: req.params.id },
      include: {
        satker: true,
        anggaran: true,
        dokumen: true,
        permintaan: { where: { is_deleted: false } },
        penyedia: true,
        dokumen_paket: { where: { is_deleted: false }, orderBy: [{ tahap: 'asc' }, { created_at: 'desc' }] },
        termin: { where: { is_deleted: false }, orderBy: { termin_ke: 'asc' } }
      }
    });
    if (!paket) return sendError(res, new Error('Paket not found'), 404);
    sendResponse(res, paket);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/paket', async (req: AuthRequest, res: Response) => {
  try {
    const paket = await prisma.paket.create({
      data: req.body,
      include: { satker: true, anggaran: true }
    });
    logAudit({ req, tableName: 'paket', recordId: paket.id, action: 'INSERT', newValues: req.body });
    sendResponse(res, paket, 'Paket created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/paket/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.paket.findUnique({ where: { id: req.params.id } });
    const paket = await prisma.paket.update({
      where: { id: req.params.id },
      data: req.body,
      include: { satker: true, anggaran: true }
    });
    logAudit({ req, tableName: 'paket', recordId: req.params.id, action: 'UPDATE', oldValues: old, newValues: req.body });
    sendResponse(res, paket, 'Paket updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/paket/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.paket.findUnique({ where: { id: req.params.id } });
    await prisma.paket.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    logAudit({ req, tableName: 'paket', recordId: req.params.id, action: 'DELETE', oldValues: old });
    sendResponse(res, null, 'Paket deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// PENYEDIA Routes (Vendor/Supplier)
// =============================================================================

router.get('/penyedia', async (req: Request, res: Response) => {
  try {
    const { search, kota, is_active } = req.query;
    const where: any = { is_deleted: false };

    if (search) {
      where.OR = [
        { nama: { contains: search as string } },
        { npwp: { contains: search as string } }
      ];
    }
    if (kota) where.kota = { contains: kota as string };
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const penyedia = await prisma.penyedia.findMany({
      where,
      orderBy: { nama: 'asc' }
    });
    sendResponse(res, penyedia);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/penyedia/:id', async (req: Request, res: Response) => {
  try {
    const penyedia = await prisma.penyedia.findUnique({
      where: { id: req.params.id },
      include: { paket: { where: { is_deleted: false } } }
    });
    if (!penyedia) return sendError(res, new Error('Penyedia not found'), 404);
    sendResponse(res, penyedia);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/penyedia', async (req: Request, res: Response) => {
  try {
    const penyedia = await prisma.penyedia.create({ data: req.body });
    sendResponse(res, penyedia, 'Penyedia created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/penyedia/:id', async (req: Request, res: Response) => {
  try {
    const penyedia = await prisma.penyedia.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, penyedia, 'Penyedia updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/penyedia/:id', async (req: Request, res: Response) => {
  try {
    await prisma.penyedia.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Penyedia deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// DOKUMEN PAKET Routes (Dokumen pengadaan per tahap)
// =============================================================================

router.get('/dokumen-paket', async (req: Request, res: Response) => {
  try {
    const { paket_id, tahap, jenis, status } = req.query;
    const where: any = { is_deleted: false };
    if (paket_id) where.paket_id = paket_id;
    if (tahap) where.tahap = tahap;
    if (jenis) where.jenis = jenis;
    if (status) where.status = status;

    const dokumen = await prisma.dokumen_paket.findMany({
      where,
      include: { paket: true },
      orderBy: [{ tahap: 'asc' }, { created_at: 'desc' }]
    });
    sendResponse(res, dokumen);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/dokumen-paket/:id', async (req: Request, res: Response) => {
  try {
    const dokumen = await prisma.dokumen_paket.findUnique({
      where: { id: req.params.id },
      include: { paket: true }
    });
    if (!dokumen) return sendError(res, new Error('Dokumen not found'), 404);
    sendResponse(res, dokumen);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Upload dokumen paket
router.post('/dokumen-paket/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, new Error('File harus diupload'), 400);
    }

    const { paket_id, tahap, jenis, nama, nomor, tanggal, termin_ke, keterangan } = req.body;

    if (!paket_id || !tahap || !jenis || !nama) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return sendError(res, new Error('paket_id, tahap, jenis, dan nama wajib diisi'), 400);
    }

    const dokumen = await prisma.dokumen_paket.create({
      data: {
        paket_id,
        tahap,
        jenis,
        nama,
        nomor: nomor || null,
        tanggal: tanggal ? new Date(tanggal) : null,
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        termin_ke: termin_ke ? parseInt(termin_ke) : null,
        keterangan: keterangan || null,
        status: 'DRAFT'
      },
      include: { paket: true }
    });

    sendResponse(res, dokumen, 'Dokumen berhasil diupload');
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    sendError(res, error as Error);
  }
});

// Download dokumen paket
router.get('/dokumen-paket/:id/download', async (req: Request, res: Response) => {
  try {
    const dokumen = await prisma.dokumen_paket.findUnique({
      where: { id: req.params.id }
    });

    if (!dokumen || !dokumen.file_path) {
      return sendError(res, new Error('Dokumen not found'), 404);
    }

    if (!fs.existsSync(dokumen.file_path)) {
      return sendError(res, new Error('File tidak ditemukan di server'), 404);
    }

    res.download(dokumen.file_path, dokumen.file_name || 'dokumen');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update dokumen paket (metadata only, not file)
router.put('/dokumen-paket/:id', async (req: Request, res: Response) => {
  try {
    const { file_path, file_name, file_size, file_type, ...updateData } = req.body;

    const dokumen = await prisma.dokumen_paket.update({
      where: { id: req.params.id },
      data: updateData,
      include: { paket: true }
    });
    sendResponse(res, dokumen, 'Dokumen updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update status dokumen
router.put('/dokumen-paket/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'FINAL', 'APPROVED'];

    if (!validStatuses.includes(status)) {
      return sendError(res, new Error(`Status tidak valid. Status yang valid: ${validStatuses.join(', ')}`), 400);
    }

    const dokumen = await prisma.dokumen_paket.update({
      where: { id: req.params.id },
      data: { status },
      include: { paket: true }
    });
    sendResponse(res, dokumen, `Status dokumen berhasil diubah ke ${status}`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/dokumen-paket/:id', async (req: Request, res: Response) => {
  try {
    const dokumen = await prisma.dokumen_paket.findUnique({
      where: { id: req.params.id }
    });

    if (dokumen?.file_path && fs.existsSync(dokumen.file_path)) {
      fs.unlinkSync(dokumen.file_path);
    }

    await prisma.dokumen_paket.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Dokumen deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Export all documents for a phase as ZIP
router.get('/dokumen-paket/export-zip/:paketId/:tahap', async (req: Request, res: Response) => {
  try {
    const { paketId, tahap } = req.params;

    // Get paket info
    const paket = await prisma.paket.findUnique({
      where: { id: paketId },
      select: { id: true, kode: true, nama: true }
    });

    if (!paket) {
      return res.status(404).json({ success: false, error: 'Paket tidak ditemukan' });
    }

    // Get all documents for this phase
    const dokumen = await prisma.dokumen_paket.findMany({
      where: {
        paket_id: paketId,
        tahap: tahap,
        is_deleted: false,
      },
      orderBy: { created_at: 'asc' }
    });

    if (dokumen.length === 0) {
      return res.status(404).json({ success: false, error: 'Tidak ada dokumen untuk di-export' });
    }

    // Create ZIP using archiver
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Set response headers
    const safeKode = paket.kode.replace(/[\/\\:*?"<>|]/g, '-');
    const filename = `Dokumen_${tahap}_${safeKode}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe archive to response
    archive.pipe(res);

    // Add each document to the archive
    for (const doc of dokumen) {
      if (doc.file_path && fs.existsSync(doc.file_path)) {
        // Create organized folder structure: TAHAP/JENIS/filename
        const folderName = doc.jenis || 'LAINNYA';
        const arcName = `${tahap}/${folderName}/${doc.file_name}`;
        archive.file(doc.file_path, { name: arcName });
      }
    }

    // Add a summary file (CSV format)
    const summaryLines = [
      'No,Jenis,Nama,File,Tanggal Upload',
      ...dokumen.map((d, i) =>
        `${i + 1},"${d.jenis}","${d.nama}","${d.file_name}","${d.created_at?.toISOString().split('T')[0] || '-'}"`
      )
    ];
    archive.append(summaryLines.join('\n'), { name: `${tahap}/DAFTAR_DOKUMEN.csv` });

    // Add paket info file
    const infoContent = `PAKET PEKERJAAN\n${'='.repeat(50)}\nKode: ${paket.kode}\nNama: ${paket.nama}\nTahap: ${tahap}\nJumlah Dokumen: ${dokumen.length}\nTanggal Export: ${new Date().toISOString()}\n`;
    archive.append(infoContent, { name: `${tahap}/INFO_PAKET.txt` });

    // Finalize archive
    await archive.finalize();

  } catch (error: any) {
    console.error('[ZIP EXPORT ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// TERMIN PEMBAYARAN Routes
// =============================================================================

router.get('/termin', async (req: Request, res: Response) => {
  try {
    const { paket_id, status } = req.query;
    const where: any = { is_deleted: false };
    if (paket_id) where.paket_id = paket_id;
    if (status) where.status = status;

    const termin = await prisma.termin_pembayaran.findMany({
      where,
      include: { paket: true },
      orderBy: { termin_ke: 'asc' }
    });
    sendResponse(res, termin);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/termin/:id', async (req: Request, res: Response) => {
  try {
    const termin = await prisma.termin_pembayaran.findUnique({
      where: { id: req.params.id },
      include: { paket: true }
    });
    if (!termin) return sendError(res, new Error('Termin not found'), 404);
    sendResponse(res, termin);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Create termin (manual percentage)
router.post('/termin', async (req: Request, res: Response) => {
  try {
    const { paket_id, termin_ke, persentase, keterangan } = req.body;

    // Get paket to calculate nilai
    const paket = await prisma.paket.findUnique({
      where: { id: paket_id }
    });

    if (!paket) {
      return sendError(res, new Error('Paket not found'), 404);
    }

    // Calculate nilai based on percentage
    const nilaiKontrak = Number(paket.nilai_kontrak || paket.pagu || 0);
    const nilai = (persentase / 100) * nilaiKontrak;

    const termin = await prisma.termin_pembayaran.create({
      data: {
        paket_id,
        termin_ke,
        persentase,
        nilai,
        keterangan: keterangan || null,
        status: 'BELUM_BAYAR'
      },
      include: { paket: true }
    });

    sendResponse(res, termin, 'Termin pembayaran berhasil dibuat');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Bulk create termin (for skema pembayaran)
router.post('/termin/bulk', async (req: Request, res: Response) => {
  try {
    const { paket_id, termins } = req.body;

    // Get paket to calculate nilai
    const paket = await prisma.paket.findUnique({
      where: { id: paket_id }
    });

    if (!paket) {
      return sendError(res, new Error('Paket not found'), 404);
    }

    // Delete existing termin for this paket
    await prisma.termin_pembayaran.deleteMany({
      where: { paket_id }
    });

    const nilaiKontrak = Number(paket.nilai_kontrak || paket.pagu || 0);

    const terminData = termins.map((t: any) => ({
      paket_id,
      termin_ke: t.termin_ke,
      persentase: t.persentase,
      nilai: (t.persentase / 100) * nilaiKontrak,
      keterangan: t.keterangan || null,
      status: 'BELUM_BAYAR'
    }));

    await prisma.termin_pembayaran.createMany({
      data: terminData
    });

    // Update paket with jumlah_termin
    await prisma.paket.update({
      where: { id: paket_id },
      data: { jumlah_termin: termins.length }
    });

    const result = await prisma.termin_pembayaran.findMany({
      where: { paket_id },
      include: { paket: true },
      orderBy: { termin_ke: 'asc' }
    });

    sendResponse(res, result, `${termins.length} termin pembayaran berhasil dibuat`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/termin/:id', async (req: Request, res: Response) => {
  try {
    const { persentase, ...data } = req.body;

    // If percentage changed, recalculate nilai
    if (persentase !== undefined) {
      const existing = await prisma.termin_pembayaran.findUnique({
        where: { id: req.params.id },
        include: { paket: true }
      });

      if (existing) {
        const nilaiKontrak = Number(existing.paket.nilai_kontrak || existing.paket.pagu || 0);
        data.persentase = persentase;
        data.nilai = (persentase / 100) * nilaiKontrak;
      }
    }

    const termin = await prisma.termin_pembayaran.update({
      where: { id: req.params.id },
      data,
      include: { paket: true }
    });
    sendResponse(res, termin, 'Termin pembayaran updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update termin status (bayar)
router.put('/termin/:id/bayar', async (req: Request, res: Response) => {
  try {
    const { tanggal_bayar } = req.body;

    const termin = await prisma.termin_pembayaran.update({
      where: { id: req.params.id },
      data: {
        status: 'LUNAS',
        tanggal_bayar: tanggal_bayar ? new Date(tanggal_bayar) : new Date()
      },
      include: { paket: true }
    });
    sendResponse(res, termin, 'Termin pembayaran berhasil dibayar');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/termin/:id', async (req: Request, res: Response) => {
  try {
    await prisma.termin_pembayaran.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Termin deleted successfully');
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
    const { paket_id, status, kepanitiaan_id } = req.query;
    const where: any = { is_deleted: false };
    if (paket_id) where.paket_id = paket_id;
    if (status) where.status = status;
    if (kepanitiaan_id) where.kepanitiaan_id = kepanitiaan_id;

    const permintaan = await prisma.permintaan.findMany({
      where,
      include: {
        paket: true,
        kepanitiaan: true,
        items: { where: { is_deleted: false } }
      },
      orderBy: { tanggal: 'desc' }
    });
    sendResponse(res, permintaan);
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
        peserta: {
          where: { is_deleted: false },
          include: { pegawai: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Hitung ringkasan
    const mapped = perjalanan.map((p) => {
      const total_transport = p.peserta.reduce((sum, it) => sum + Number(it.transport || 0), 0);
      const total_hotel = p.peserta.reduce((sum, it) => sum + Number(it.penginapan || 0), 0);
      const total_uang_harian = p.peserta.reduce((sum, it) => sum + Number(it.uang_harian || 0), 0);
      const total_lainnya = p.peserta.reduce((sum, it) => sum + Number(it.lainnya || 0), 0);
      return {
        ...p,
        total_transport,
        total_hotel,
        total_uang_harian,
        total_lainnya,
        grand_total: total_transport + total_hotel + total_uang_harian + total_lainnya,
      };
    });

    // Debug: Log first record's surat tugas fields
    if (mapped.length > 0) {
      console.log('[GET /perjalanan] First record surat tugas:', {
        nomor_surat_tugas: mapped[0].nomor_surat_tugas,
        tanggal_surat_tugas: mapped[0].tanggal_surat_tugas
      });
    }

    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/perjalanan', async (req: Request, res: Response) => {
  try {
    const { peserta = [], ...data } = req.body;

    // Convert tanggal_surat_tugas to ISO DateTime format if provided
    if (data.tanggal_surat_tugas) {
      if (data.tanggal_surat_tugas.length === 10) {
        data.tanggal_surat_tugas = new Date(data.tanggal_surat_tugas + 'T00:00:00.000Z').toISOString();
      }
    }

    const perjalanan = await prisma.perjalanan_dinas.create({
      data: {
        ...data,
        peserta: peserta && Array.isArray(peserta)
          ? {
              create: peserta.map((it: any) => {
                const transport_udara = it.transport_udara || it.transport_lokal || 0;
                const transport_darat = it.transport_darat || it.transport || 0;
                const transport_total = Number(transport_udara) + Number(transport_darat);

                return {
                  pegawai_id: it.pegawai_id,
                  tingkat_biaya: it.tingkat_biaya,
                  is_ketua: Boolean(it.is_ketua),
                  uang_harian: it.uang_harian || 0,
                  transport: transport_total,
                  transport_udara: transport_udara,
                  transport_darat: transport_darat,
                  penginapan: it.uang_hotel || it.penginapan || 0,
                  lainnya: it.lainnya || 0,
                  catatan: it.catatan,
                };
              }),
            }
          : undefined,
      },
      include: { peserta: { include: { pegawai: true } } },
    });

    sendResponse(res, perjalanan, 'Perjalanan dinas created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/perjalanan/:id', async (req: Request, res: Response) => {
  try {
    console.log('[PUT /perjalanan/:id] Request ID:', req.params.id);
    console.log('[PUT /perjalanan/:id] Request body:', JSON.stringify(req.body, null, 2));

    // Check if peserta was explicitly provided in the request
    const hasPesertaField = 'peserta' in req.body;
    const { peserta, ...data } = req.body;

    console.log('[PUT /perjalanan/:id] Has peserta field in request:', hasPesertaField);

    // Convert all date fields to ISO DateTime format if they're date-only strings
    const convertDateToISO = (dateStr: string, endOfDay = false) => {
      if (dateStr && dateStr.length === 10) {
        const time = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
        return new Date(dateStr + time).toISOString();
      }
      return dateStr;
    };

    if (data.tanggal_surat_tugas) {
      data.tanggal_surat_tugas = convertDateToISO(data.tanggal_surat_tugas);
    }
    if (data.tanggal_pergi) {
      data.tanggal_pergi = convertDateToISO(data.tanggal_pergi);
    }
    if (data.tanggal_pulang) {
      data.tanggal_pulang = convertDateToISO(data.tanggal_pulang, true); // end of day
    }

    console.log('[PUT /perjalanan/:id] Data to update (without peserta):', JSON.stringify(data, null, 2));

    // Update perjalanan
    const perjalanan = await prisma.perjalanan_dinas.update({
      where: { id: req.params.id },
      data,
    });

    console.log('[PUT /perjalanan/:id] Perjalanan updated successfully:', perjalanan.id);

    // Only handle peserta if it was explicitly provided in the request
    // This prevents deleting peserta when only changing status
    if (hasPesertaField) {
      console.log('[PUT /perjalanan/:id] Peserta field provided, updating peserta list');
      console.log('[PUT /perjalanan/:id] Peserta array length:', Array.isArray(peserta) ? peserta.length : 0);

      // Delete old peserta records
      const deleteResult = await prisma.peserta_dinas.deleteMany({
        where: { perjalanan_id: req.params.id },
      });

      console.log('[PUT /perjalanan/:id] Deleted old peserta count:', deleteResult.count);

      if (Array.isArray(peserta) && peserta.length > 0) {
        const pesertaData = peserta.map((it: any) => {
          // Handle different field name mappings from frontend
          const transport_udara = it.transport_udara || it.transport_lokal || 0;
          const transport_darat = it.transport_darat || it.transport || 0;
          const transport_total = Number(transport_udara) + Number(transport_darat);

          return {
            perjalanan_id: req.params.id,
            pegawai_id: it.pegawai_id,
            tingkat_biaya: it.tingkat_biaya,
            is_ketua: Boolean(it.is_ketua),
            uang_harian: it.uang_harian || 0,
            transport: transport_total,
            transport_udara: transport_udara,
            transport_darat: transport_darat,
            penginapan: it.uang_hotel || it.penginapan || 0,
            lainnya: it.lainnya || 0,
            catatan: it.catatan,
          };
        });

        console.log('[PUT /perjalanan/:id] Creating peserta:', JSON.stringify(pesertaData, null, 2));

        await prisma.peserta_dinas.createMany({
          data: pesertaData,
        });

        console.log('[PUT /perjalanan/:id] Created', pesertaData.length, 'peserta records');
      }
    } else {
      console.log('[PUT /perjalanan/:id] No peserta field in request, keeping existing peserta');
    }

    const updated = await prisma.perjalanan_dinas.findUnique({
      where: { id: req.params.id },
      include: { peserta: { where: { is_deleted: false }, include: { pegawai: true } } },
    });

    console.log('[PUT /perjalanan/:id] Final result - peserta count:', updated?.peserta?.length || 0);
    console.log('[PUT /perjalanan/:id] Update completed successfully');

    sendResponse(res, updated, 'Perjalanan dinas updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/perjalanan/:id', async (req: Request, res: Response) => {
  try {
    await prisma.perjalanan_dinas.update({
      where: { id: req.params.id },
      data: { is_deleted: true },
    });
    await prisma.peserta_dinas.updateMany({
      where: { perjalanan_id: req.params.id },
      data: { is_deleted: true },
    });
    sendResponse(res, null, 'Perjalanan dinas deleted successfully');
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

router.post('/permintaan', async (req: AuthRequest, res: Response) => {
  try {
    const { items, ...data } = req.body;
    const permintaan = await prisma.permintaan.create({
      data: {
        ...data,
        items: items ? { create: items } : undefined
      },
      include: { paket: true, items: true }
    });
    logAudit({ req, tableName: 'permintaan', recordId: permintaan.id, action: 'INSERT', newValues: req.body });
    sendResponse(res, permintaan, 'Permintaan created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/permintaan/:id', async (req: Request, res: Response) => {
  try {
    const { items, ...data } = req.body;

    // Update permintaan data first
    const permintaan = await prisma.permintaan.update({
      where: { id: req.params.id },
      data: data,
      include: { paket: true, items: true }
    });

    // Handle items separately if provided
    if (items) {
      // Delete existing items
      await prisma.item_permintaan.deleteMany({
        where: { permintaan_id: req.params.id }
      });

      // Create new items
      await prisma.item_permintaan.createMany({
        data: items.map((item: any) => ({
          ...item,
          permintaan_id: req.params.id
        }))
      });

      // Fetch updated permintaan with new items
      const updatedPermintaan = await prisma.permintaan.findUnique({
        where: { id: req.params.id },
        include: { paket: true, items: true }
      });

      sendResponse(res, updatedPermintaan, 'Permintaan updated successfully');
    } else {
      sendResponse(res, permintaan, 'Permintaan updated successfully');
    }
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/permintaan/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.permintaan.findUnique({ where: { id: req.params.id } });
    await prisma.permintaan.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    logAudit({ req, tableName: 'permintaan', recordId: req.params.id, action: 'DELETE', oldValues: old });
    sendResponse(res, null, 'Permintaan deleted successfully');
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

router.post('/transaksi', async (req: AuthRequest, res: Response) => {
  try {
    const transaksi = await prisma.transaksi_keuangan.create({
      data: req.body,
      include: { paket: true }
    });
    logAudit({ req, tableName: 'transaksi_keuangan', recordId: transaksi.id, action: 'INSERT', newValues: req.body });
    sendResponse(res, transaksi, 'Transaksi created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/transaksi/:id', async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.transaksi_keuangan.findUnique({ where: { id: req.params.id } });
    const transaksi = await prisma.transaksi_keuangan.update({
      where: { id: req.params.id },
      data: req.body,
      include: { paket: true }
    });
    logAudit({ req, tableName: 'transaksi_keuangan', recordId: req.params.id, action: 'UPDATE', oldValues: old, newValues: req.body });
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

// =============================================================================
// SBM UANG HARIAN Routes
// =============================================================================

router.get('/sbm/uang-harian', async (req: Request, res: Response) => {
  try {
    const { tahun, provinsi } = req.query;
    const where: any = { is_deleted: false };
    if (tahun) where.tahun = parseInt(tahun as string);
    if (provinsi) where.provinsi = { contains: provinsi as string };

    const data = await prisma.sbm_uang_harian.findMany({
      where,
      orderBy: [{ tahun: 'desc' }, { provinsi: 'asc' }]
    });
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/uang-harian', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_uang_harian.create({ data: req.body });
    sendResponse(res, data, 'SBM Uang Harian created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/uang-harian/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    let count = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.sbm_uang_harian.upsert({
          where: {
            tahun_provinsi: { tahun: item.tahun, provinsi: item.provinsi }
          },
          create: item,
          update: item
        });
        count++;
      } catch (err: any) {
        errors.push(`Error for ${item.provinsi}: ${err.message}`);
      }
    }

    sendResponse(res, { count, errors }, `${count} SBM Uang Harian imported successfully`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/sbm/uang-harian/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_uang_harian.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, data, 'SBM Uang Harian updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/sbm/uang-harian/:id', async (req: Request, res: Response) => {
  try {
    await prisma.sbm_uang_harian.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'SBM Uang Harian deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// SBM PENGINAPAN Routes
// =============================================================================

router.get('/sbm/penginapan', async (req: Request, res: Response) => {
  try {
    const { tahun, provinsi } = req.query;
    const where: any = { is_deleted: false };
    if (tahun) where.tahun = parseInt(tahun as string);
    if (provinsi) where.provinsi = { contains: provinsi as string };

    const data = await prisma.sbm_penginapan.findMany({
      where,
      orderBy: [{ tahun: 'desc' }, { provinsi: 'asc' }]
    });
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/penginapan', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_penginapan.create({ data: req.body });
    sendResponse(res, data, 'SBM Penginapan created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/penginapan/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    let count = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.sbm_penginapan.upsert({
          where: {
            tahun_provinsi: { tahun: item.tahun, provinsi: item.provinsi }
          },
          create: item,
          update: item
        });
        count++;
      } catch (err: any) {
        errors.push(`Error for ${item.provinsi}: ${err.message}`);
      }
    }

    sendResponse(res, { count, errors }, `${count} SBM Penginapan imported successfully`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/sbm/penginapan/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_penginapan.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, data, 'SBM Penginapan updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/sbm/penginapan/:id', async (req: Request, res: Response) => {
  try {
    await prisma.sbm_penginapan.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'SBM Penginapan deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// SBM HONOR Routes
// =============================================================================

router.get('/sbm/honor', async (req: Request, res: Response) => {
  try {
    const { tahun, kategori, kode } = req.query;
    const where: any = { is_deleted: false };
    if (tahun) where.tahun = parseInt(tahun as string);
    if (kategori) where.kategori = kategori as string;
    if (kode) where.kode = kode as string;

    const data = await prisma.sbm_honor.findMany({
      where,
      orderBy: [{ tahun: 'desc' }, { kategori: 'asc' }, { nama: 'asc' }]
    });
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/honor', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_honor.create({ data: req.body });
    sendResponse(res, data, 'SBM Honor created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/honor/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    let count = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.sbm_honor.upsert({
          where: {
            tahun_kode: { tahun: item.tahun, kode: item.kode }
          },
          create: item,
          update: item
        });
        count++;
      } catch (err: any) {
        errors.push(`Error for ${item.kode}: ${err.message}`);
      }
    }

    sendResponse(res, { count, errors }, `${count} SBM Honor imported successfully`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/sbm/honor/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_honor.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, data, 'SBM Honor updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/sbm/honor/:id', async (req: Request, res: Response) => {
  try {
    await prisma.sbm_honor.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'SBM Honor deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// SBM TRANSPORT Routes
// =============================================================================

router.get('/sbm/transport', async (req: Request, res: Response) => {
  try {
    const { tahun, asal, tujuan, jenis } = req.query;
    const where: any = { is_deleted: false };
    if (tahun) where.tahun = parseInt(tahun as string);
    if (asal) where.asal = { contains: asal as string };
    if (tujuan) where.tujuan = { contains: tujuan as string };
    if (jenis) where.jenis = jenis as string;

    const data = await prisma.sbm_transport.findMany({
      where,
      orderBy: [{ tahun: 'desc' }, { asal: 'asc' }, { tujuan: 'asc' }]
    });
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/transport', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_transport.create({ data: req.body });
    sendResponse(res, data, 'SBM Transport created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/sbm/transport/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    let count = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await prisma.sbm_transport.upsert({
          where: {
            tahun_asal_tujuan_jenis: {
              tahun: item.tahun,
              asal: item.asal,
              tujuan: item.tujuan,
              jenis: item.jenis
            }
          },
          create: item,
          update: item
        });
        count++;
      } catch (err: any) {
        errors.push(`Error for ${item.asal}-${item.tujuan}: ${err.message}`);
      }
    }

    sendResponse(res, { count, errors }, `${count} SBM Transport imported successfully`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/sbm/transport/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.sbm_transport.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, data, 'SBM Transport updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/sbm/transport/:id', async (req: Request, res: Response) => {
  try {
    await prisma.sbm_transport.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'SBM Transport deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// SURVEY HARGA Routes (CSV Import/Export)
// =============================================================================

// Download CSV template for survey harga
router.get('/permintaan/:id/survey-template', async (req: Request, res: Response) => {
  try {
    const permintaan = await prisma.permintaan.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          where: { is_deleted: false },
          orderBy: { urut: 'asc' }
        }
      }
    });

    if (!permintaan) {
      return sendError(res, new Error('Permintaan not found'), 404);
    }

    if (!permintaan.items || permintaan.items.length === 0) {
      return sendError(res, new Error('Permintaan tidak memiliki item'), 400);
    }

    // Generate CSV with 3 default survey source columns
    const headers = [
      'no',
      'nama_barang',
      'spesifikasi',
      'satuan',
      'volume',
      'Sumber 1|Alamat/URL Sumber 1',
      'Sumber 2|Alamat/URL Sumber 2',
      'Sumber 3|Alamat/URL Sumber 3'
    ];

    const rows = permintaan.items.map((item, index) => [
      index + 1,
      `"${(item.nama || '').replace(/"/g, '""')}"`,
      `"${(item.spesifikasi || '').replace(/"/g, '""')}"`,
      item.satuan || 'Unit',
      Number(item.volume || 1),
      '', // Sumber 1 price
      '', // Sumber 2 price
      ''  // Sumber 3 price
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="survey_harga_${permintaan.nomor.replace(/\//g, '-')}.csv"`);
    res.send(csvWithBom);

  } catch (error) {
    sendError(res, error as Error);
  }
});

// Upload CSV survey harga
router.post('/permintaan/:id/survey-upload', async (req: Request, res: Response) => {
  try {
    const { csv_data } = req.body;

    if (!csv_data) {
      return sendError(res, new Error('CSV data is required'), 400);
    }

    const permintaan = await prisma.permintaan.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          where: { is_deleted: false },
          orderBy: { urut: 'asc' }
        }
      }
    });

    if (!permintaan) {
      return sendError(res, new Error('Permintaan not found'), 404);
    }

    // Parse CSV
    const lines = csv_data.trim().split('\n');
    if (lines.length < 2) {
      return sendError(res, new Error('CSV harus memiliki header dan minimal 1 baris data'), 400);
    }

    // Parse header to get survey sources
    const header = lines[0].split(',').map((h: string) => h.trim());
    const surveyColumns: { index: number; nama: string; alamat: string }[] = [];

    for (let i = 5; i < header.length; i++) {
      const colName = header[i];
      if (colName && colName.includes('|')) {
        const [nama, alamat] = colName.split('|').map((s: string) => s.trim());
        surveyColumns.push({ index: i, nama, alamat });
      } else if (colName) {
        surveyColumns.push({ index: i, nama: colName, alamat: '' });
      }
    }

    if (surveyColumns.length < 3) {
      return sendError(res, new Error('CSV harus memiliki minimal 3 kolom sumber survey'), 400);
    }

    // Parse data rows
    const surveyData: { itemNo: number; surveys: { nama: string; alamat: string; harga: number }[] }[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle quoted values)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const itemNo = parseInt(values[0]);
      if (isNaN(itemNo) || itemNo < 1 || itemNo > permintaan.items.length) {
        errors.push(`Baris ${i + 1}: Nomor item tidak valid (${values[0]})`);
        continue;
      }

      const surveys: { nama: string; alamat: string; harga: number }[] = [];

      for (const col of surveyColumns) {
        const priceStr = values[col.index];
        if (priceStr && priceStr.trim()) {
          const price = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
          if (!isNaN(price) && price > 0) {
            surveys.push({
              nama: col.nama,
              alamat: col.alamat,
              harga: price
            });
          }
        }
      }

      if (surveys.length > 0) {
        surveyData.push({ itemNo, surveys });
      }
    }

    if (surveyData.length === 0) {
      return sendError(res, new Error('Tidak ada data survey yang valid dalam CSV'), 400);
    }

    // Delete existing survey data for this permintaan's items
    const itemIds = permintaan.items.map(item => item.id);
    await prisma.survey_harga.deleteMany({
      where: { item_id: { in: itemIds } }
    });

    // Insert new survey data and calculate averages
    let totalInserted = 0;
    const itemsWithoutMinSurvey: number[] = [];

    for (const data of surveyData) {
      const item = permintaan.items[data.itemNo - 1];
      if (!item) continue;

      // Insert survey records
      for (let j = 0; j < data.surveys.length; j++) {
        const survey = data.surveys[j];
        await prisma.survey_harga.create({
          data: {
            item_id: item.id,
            urut: j + 1,
            nama_sumber: survey.nama,
            alamat: survey.alamat,
            harga: survey.harga,
            is_valid: true
          }
        });
        totalInserted++;
      }

      // Check if item has minimum 3 surveys
      if (data.surveys.length < 3) {
        itemsWithoutMinSurvey.push(data.itemNo);
      }

      // Calculate average price for HPS
      const avgPrice = Math.round(
        data.surveys.reduce((sum, s) => sum + s.harga, 0) / data.surveys.length
      );

      // Update item with HPS price
      await prisma.item_permintaan.update({
        where: { id: item.id },
        data: { harga_hps: avgPrice }
      });
    }

    // Calculate total HPS for permintaan
    const updatedItems = await prisma.item_permintaan.findMany({
      where: { permintaan_id: req.params.id, is_deleted: false }
    });

    const totalHps = updatedItems.reduce((sum, item) => {
      return sum + (Number(item.harga_hps || 0) * Number(item.volume || 1));
    }, 0);

    await prisma.permintaan.update({
      where: { id: req.params.id },
      data: { total_hps: totalHps }
    });

    // Build response
    const response: any = {
      inserted: totalInserted,
      items_updated: surveyData.length,
      total_hps: totalHps,
      errors: errors
    };

    if (itemsWithoutMinSurvey.length > 0) {
      response.warning = `Item nomor ${itemsWithoutMinSurvey.join(', ')} memiliki kurang dari 3 sumber survey`;
    }

    sendResponse(res, response, `${totalInserted} data survey berhasil diimport`);

  } catch (error) {
    sendError(res, error as Error);
  }
});

// Get survey summary for permintaan
router.get('/permintaan/:id/survey-summary', async (req: Request, res: Response) => {
  try {
    const permintaan = await prisma.permintaan.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          where: { is_deleted: false },
          orderBy: { urut: 'asc' },
          include: {
            survey_harga: {
              where: { is_deleted: false },
              orderBy: { urut: 'asc' }
            }
          }
        }
      }
    });

    if (!permintaan) {
      return sendError(res, new Error('Permintaan not found'), 404);
    }

    // Build summary
    const summary = permintaan.items.map((item, index) => {
      const surveys = item.survey_harga || [];
      const prices = surveys.map(s => Number(s.harga));
      const avgPrice = prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0;

      return {
        id: item.id,
        no: index + 1,
        nama: item.nama,
        spesifikasi: item.spesifikasi,
        satuan: item.satuan,
        volume: Number(item.volume),
        survey_count: surveys.length,
        surveys: surveys.map(s => ({
          sumber_nama: s.nama_sumber,
          sumber_alamat: s.alamat,
          harga: Number(s.harga)
        })),
        harga_rata: avgPrice,
        harga_hps: Number(item.harga_hps || 0),
        total_hps: Number(item.harga_hps || 0) * Number(item.volume || 1),
        has_minimum_survey: surveys.length >= 3
      };
    });

    const totalWithSurvey = summary.filter(s => s.survey_count > 0).length;
    const totalWithMinSurvey = summary.filter(s => s.has_minimum_survey).length;
    const grandTotalHps = summary.reduce((sum, s) => sum + s.total_hps, 0);

    sendResponse(res, {
      items: summary,
      statistics: {
        total_items: summary.length,
        items_with_survey: totalWithSurvey,
        items_with_min_survey: totalWithMinSurvey,
        items_without_survey: summary.length - totalWithSurvey,
        grand_total_hps: grandTotalHps,
        is_complete: totalWithMinSurvey === summary.length
      }
    });

  } catch (error) {
    sendError(res, error as Error);
  }
});

// Direct survey input for a specific item
router.post('/permintaan/:id/survey-input', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { item_id, surveys } = req.body;

    if (!item_id || !surveys || !Array.isArray(surveys) || surveys.length === 0) {
      return res.status(400).json({ success: false, error: 'Data item_id dan surveys diperlukan' });
    }

    // Verify permintaan and item exist
    const permintaan = await prisma.permintaan.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!permintaan) {
      return res.status(404).json({ success: false, error: 'Permintaan tidak ditemukan' });
    }

    const item = permintaan.items.find(i => i.id === item_id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item tidak ditemukan' });
    }

    // Delete existing survey data for this item
    await prisma.survey_harga.deleteMany({
      where: { item_id: item_id }
    });

    // Insert new survey data
    const createdSurveys: any[] = [];
    let urut = 1;
    for (const survey of surveys) {
      if (survey.sumber_nama && survey.harga) {
        const created = await prisma.survey_harga.create({
          data: {
            urut: urut++,
            nama_sumber: survey.sumber_nama,
            alamat: survey.sumber_alamat || '',
            harga: survey.harga,
            item: { connect: { id: item_id } },
          }
        });
        createdSurveys.push(created);
      }
    }

    // Calculate average and update item HPS
    if (createdSurveys.length > 0) {
      const avgHarga = Math.round(
        createdSurveys.reduce((sum, s) => sum + Number(s.harga), 0) / createdSurveys.length
      );

      await prisma.item_permintaan.update({
        where: { id: item_id },
        data: { harga_hps: avgHarga }
      });
    }

    sendResponse(res, {
      item_id,
      surveys_created: createdSurveys.length
    }, 'Data survey berhasil disimpan');

  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// MONITORING SP2D Routes
// =============================================================================

// Get all monitoring SP2D
router.get('/monitoring-sp2d', async (req: Request, res: Response) => {
  try {
    const { status_spp_spm, status_sp2d, jenis_spp_spm } = req.query;
    const where: any = { is_deleted: false };

    if (status_spp_spm) where.status_spp_spm = status_spp_spm as string;
    if (status_sp2d) where.status_sp2d = status_sp2d as string;
    if (jenis_spp_spm) where.jenis_spp_spm = { contains: jenis_spp_spm as string };

    const data = await prisma.monitoring_sp2d.findMany({
      where,
      orderBy: [{ tanggal_spp: 'desc' }, { no_spp_spm: 'desc' }]
    });
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Get monitoring SP2D by ID
router.get('/monitoring-sp2d/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.monitoring_sp2d.findUnique({
      where: { id: req.params.id }
    });
    if (!data) return sendError(res, new Error('Data not found'), 404);
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Get monitoring SP2D summary/statistics
router.get('/monitoring-sp2d-summary', async (req: Request, res: Response) => {
  try {
    const allData = await prisma.monitoring_sp2d.findMany({
      where: { is_deleted: false }
    });

    // Calculate statistics
    const totalRecords = allData.length;
    const totalPengeluaran = allData.reduce((sum, d) => sum + Number(d.jumlah_pengeluaran || 0), 0);
    const totalPotongan = allData.reduce((sum, d) => sum + Number(d.jumlah_potongan || 0), 0);
    const totalPembayaran = allData.reduce((sum, d) => sum + Number(d.jumlah_pembayaran || 0), 0);

    // Group by status SPP/SPM
    const byStatusSppSpm: Record<string, { count: number; total: number }> = {};
    allData.forEach(d => {
      const status = d.status_spp_spm || 'Unknown';
      if (!byStatusSppSpm[status]) byStatusSppSpm[status] = { count: 0, total: 0 };
      byStatusSppSpm[status].count++;
      byStatusSppSpm[status].total += Number(d.jumlah_pembayaran || 0);
    });

    // Group by status SP2D
    const byStatusSp2d: Record<string, { count: number; total: number }> = {};
    allData.forEach(d => {
      const status = d.status_sp2d || 'Belum Terbit';
      if (!byStatusSp2d[status]) byStatusSp2d[status] = { count: 0, total: 0 };
      byStatusSp2d[status].count++;
      byStatusSp2d[status].total += Number(d.jumlah_pembayaran || 0);
    });

    // Group by jenis SPP/SPM
    const byJenisSppSpm: Record<string, { count: number; total: number }> = {};
    allData.forEach(d => {
      const jenis = d.jenis_spp_spm || 'Unknown';
      if (!byJenisSppSpm[jenis]) byJenisSppSpm[jenis] = { count: 0, total: 0 };
      byJenisSppSpm[jenis].count++;
      byJenisSppSpm[jenis].total += Number(d.jumlah_pembayaran || 0);
    });

    // Pending items (belum ada SP2D)
    const pendingItems = allData.filter(d => !d.no_sp2d || d.no_sp2d === '-');

    sendResponse(res, {
      total_records: totalRecords,
      total_pengeluaran: totalPengeluaran,
      total_potongan: totalPotongan,
      total_pembayaran: totalPembayaran,
      by_status_spp_spm: byStatusSppSpm,
      by_status_sp2d: byStatusSp2d,
      by_jenis_spp_spm: byJenisSppSpm,
      pending_count: pendingItems.length,
      pending_total: pendingItems.reduce((sum, d) => sum + Number(d.jumlah_pembayaran || 0), 0)
    });
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Create single monitoring SP2D
router.post('/monitoring-sp2d', async (req: Request, res: Response) => {
  try {
    const data = await prisma.monitoring_sp2d.create({ data: req.body });
    sendResponse(res, data, 'Data monitoring berhasil ditambahkan');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Bulk import monitoring SP2D (only insert new data based on no_spp_spm)
router.post('/monitoring-sp2d/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    // Get existing no_spp_spm to check for duplicates
    const existingRecords = await prisma.monitoring_sp2d.findMany({
      where: { is_deleted: false },
      select: { no_spp_spm: true }
    });
    const existingNoSppSpm = new Set(existingRecords.map(r => r.no_spp_spm));

    let insertedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // Check if already exists
        if (item.no_spp_spm && existingNoSppSpm.has(item.no_spp_spm)) {
          // Update existing record with new data (in case status changed)
          const existing = await prisma.monitoring_sp2d.findFirst({
            where: { no_spp_spm: item.no_spp_spm, is_deleted: false }
          });
          if (existing) {
            await prisma.monitoring_sp2d.update({
              where: { id: existing.id },
              data: item
            });
            updatedCount++;
          }
        } else {
          // Insert new record
          await prisma.monitoring_sp2d.create({ data: item });
          insertedCount++;
          if (item.no_spp_spm) existingNoSppSpm.add(item.no_spp_spm);
        }
      } catch (err: any) {
        errors.push(`Error for ${item.no_spp_spm}: ${err.message}`);
      }
    }

    sendResponse(res, {
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors
    }, `${insertedCount} data baru ditambahkan, ${updatedCount} data diupdate`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update monitoring SP2D
router.put('/monitoring-sp2d/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.monitoring_sp2d.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, data, 'Data monitoring berhasil diupdate');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Delete monitoring SP2D
router.delete('/monitoring-sp2d/:id', async (req: Request, res: Response) => {
  try {
    await prisma.monitoring_sp2d.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Data monitoring berhasil dihapus');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Clear all monitoring SP2D data
router.delete('/monitoring-sp2d-clear', async (req: Request, res: Response) => {
  try {
    await prisma.monitoring_sp2d.updateMany({
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Semua data monitoring berhasil dihapus');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// KEPANITIAAN Routes
// =============================================================================

// Get all kepanitiaan
router.get('/kepanitiaan', async (req: Request, res: Response) => {
  try {
    const { status, jenis_panitia } = req.query;
    const where: any = { is_deleted: false };

    if (status) where.status = status as string;
    if (jenis_panitia) where.jenis_panitia = jenis_panitia as string;

    const data = await prisma.kepanitiaan.findMany({
      where,
      include: {
        anggota: {
          where: { is_deleted: false },
          orderBy: { urutan: 'asc' }
        },
        permintaan: {
          where: { is_deleted: false },
          orderBy: { tanggal: 'desc' }
        }
      },
      orderBy: { tanggal_sk: 'desc' }
    });
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Get kepanitiaan by ID
router.get('/kepanitiaan/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.kepanitiaan.findUnique({
      where: { id: req.params.id },
      include: {
        anggota: {
          where: { is_deleted: false },
          orderBy: { urutan: 'asc' }
        },
        permintaan: {
          where: { is_deleted: false },
          include: { items: { where: { is_deleted: false } } },
          orderBy: { tanggal: 'desc' }
        }
      }
    });
    if (!data) return sendError(res, new Error('Kepanitiaan not found'), 404);
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Create kepanitiaan
router.post('/kepanitiaan', async (req: Request, res: Response) => {
  try {
    const { anggota, ...kepanitiaanData } = req.body;

    // Create kepanitiaan with anggota
    const data = await prisma.kepanitiaan.create({
      data: {
        ...kepanitiaanData,
        anggota: anggota && anggota.length > 0 ? {
          create: anggota.map((a: any, index: number) => ({
            nama: a.nama,
            nip: a.nip || null,
            jabatan: a.jabatan || null,
            golongan: a.golongan || null,
            peran: a.peran || 'ANGGOTA',
            urutan: a.urutan ?? index,
            honor_per_kegiatan: a.honor_per_kegiatan || 0,
            jumlah_kegiatan: a.jumlah_kegiatan || 1,
            total_honor: a.total_honor || (a.honor_per_kegiatan || 0) * (a.jumlah_kegiatan || 1),
            pegawai_id: a.pegawai_id || null,
            keterangan: a.keterangan || null
          }))
        } : undefined
      },
      include: {
        anggota: {
          where: { is_deleted: false },
          orderBy: { urutan: 'asc' }
        }
      }
    });

    // Calculate total honor
    const totalHonor = data.anggota.reduce((sum, a) => sum + Number(a.total_honor || 0), 0);
    await prisma.kepanitiaan.update({
      where: { id: data.id },
      data: { total_honor: totalHonor }
    });

    sendResponse(res, { ...data, total_honor: totalHonor }, 'Kepanitiaan created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update kepanitiaan
router.put('/kepanitiaan/:id', async (req: Request, res: Response) => {
  try {
    const { anggota, ...kepanitiaanData } = req.body;

    // Update kepanitiaan data
    const data = await prisma.kepanitiaan.update({
      where: { id: req.params.id },
      data: kepanitiaanData
    });

    // If anggota is provided, update them
    if (anggota && Array.isArray(anggota)) {
      // Delete existing anggota
      await prisma.anggota_panitia.deleteMany({
        where: { kepanitiaan_id: req.params.id }
      });

      // Create new anggota
      for (let i = 0; i < anggota.length; i++) {
        const a = anggota[i];
        await prisma.anggota_panitia.create({
          data: {
            kepanitiaan_id: req.params.id,
            nama: a.nama,
            nip: a.nip || null,
            jabatan: a.jabatan || null,
            golongan: a.golongan || null,
            peran: a.peran || 'ANGGOTA',
            urutan: a.urutan ?? i,
            honor_per_kegiatan: a.honor_per_kegiatan || 0,
            jumlah_kegiatan: a.jumlah_kegiatan || 1,
            total_honor: a.total_honor || (a.honor_per_kegiatan || 0) * (a.jumlah_kegiatan || 1),
            pegawai_id: a.pegawai_id || null,
            keterangan: a.keterangan || null
          }
        });
      }

      // Calculate total honor
      const totalHonor = anggota.reduce((sum: number, a: any) => {
        const honor = a.total_honor || (a.honor_per_kegiatan || 0) * (a.jumlah_kegiatan || 1);
        return sum + honor;
      }, 0);

      await prisma.kepanitiaan.update({
        where: { id: req.params.id },
        data: { total_honor: totalHonor }
      });
    }

    // Fetch updated data
    const updatedData = await prisma.kepanitiaan.findUnique({
      where: { id: req.params.id },
      include: {
        anggota: {
          where: { is_deleted: false },
          orderBy: { urutan: 'asc' }
        }
      }
    });

    sendResponse(res, updatedData, 'Kepanitiaan updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Delete kepanitiaan (soft delete)
router.delete('/kepanitiaan/:id', async (req: Request, res: Response) => {
  try {
    await prisma.kepanitiaan.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Kepanitiaan deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Add anggota to kepanitiaan
router.post('/kepanitiaan/:id/anggota', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const anggotaData = req.body;

    // Get current max urutan
    const maxUrutan = await prisma.anggota_panitia.aggregate({
      where: { kepanitiaan_id: id, is_deleted: false },
      _max: { urutan: true }
    });

    const anggota = await prisma.anggota_panitia.create({
      data: {
        kepanitiaan_id: id,
        nama: anggotaData.nama,
        nip: anggotaData.nip || null,
        jabatan: anggotaData.jabatan || null,
        golongan: anggotaData.golongan || null,
        peran: anggotaData.peran || 'ANGGOTA',
        urutan: anggotaData.urutan ?? ((maxUrutan._max.urutan || 0) + 1),
        honor_per_kegiatan: anggotaData.honor_per_kegiatan || 0,
        jumlah_kegiatan: anggotaData.jumlah_kegiatan || 1,
        total_honor: anggotaData.total_honor || (anggotaData.honor_per_kegiatan || 0) * (anggotaData.jumlah_kegiatan || 1),
        pegawai_id: anggotaData.pegawai_id || null,
        keterangan: anggotaData.keterangan || null
      }
    });

    // Update total honor kepanitiaan
    const allAnggota = await prisma.anggota_panitia.findMany({
      where: { kepanitiaan_id: id, is_deleted: false }
    });
    const totalHonor = allAnggota.reduce((sum, a) => sum + Number(a.total_honor || 0), 0);
    await prisma.kepanitiaan.update({
      where: { id },
      data: { total_honor: totalHonor }
    });

    sendResponse(res, anggota, 'Anggota added successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update anggota
router.put('/kepanitiaan/:id/anggota/:anggotaId', async (req: Request, res: Response) => {
  try {
    const { anggotaId } = req.params;
    const anggotaData = req.body;

    const anggota = await prisma.anggota_panitia.update({
      where: { id: anggotaId },
      data: {
        nama: anggotaData.nama,
        nip: anggotaData.nip || null,
        jabatan: anggotaData.jabatan || null,
        golongan: anggotaData.golongan || null,
        peran: anggotaData.peran,
        urutan: anggotaData.urutan,
        honor_per_kegiatan: anggotaData.honor_per_kegiatan || 0,
        jumlah_kegiatan: anggotaData.jumlah_kegiatan || 1,
        total_honor: anggotaData.total_honor || (anggotaData.honor_per_kegiatan || 0) * (anggotaData.jumlah_kegiatan || 1),
        pegawai_id: anggotaData.pegawai_id || null,
        keterangan: anggotaData.keterangan || null
      }
    });

    // Update total honor kepanitiaan
    const kepanitiaan = await prisma.anggota_panitia.findUnique({ where: { id: anggotaId } });
    if (kepanitiaan) {
      const allAnggota = await prisma.anggota_panitia.findMany({
        where: { kepanitiaan_id: kepanitiaan.kepanitiaan_id, is_deleted: false }
      });
      const totalHonor = allAnggota.reduce((sum, a) => sum + Number(a.total_honor || 0), 0);
      await prisma.kepanitiaan.update({
        where: { id: kepanitiaan.kepanitiaan_id },
        data: { total_honor: totalHonor }
      });
    }

    sendResponse(res, anggota, 'Anggota updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Delete anggota
router.delete('/kepanitiaan/:id/anggota/:anggotaId', async (req: Request, res: Response) => {
  try {
    const { id, anggotaId } = req.params;

    await prisma.anggota_panitia.update({
      where: { id: anggotaId },
      data: { is_deleted: true }
    });

    // Update total honor kepanitiaan
    const allAnggota = await prisma.anggota_panitia.findMany({
      where: { kepanitiaan_id: id, is_deleted: false }
    });
    const totalHonor = allAnggota.reduce((sum, a) => sum + Number(a.total_honor || 0), 0);
    await prisma.kepanitiaan.update({
      where: { id },
      data: { total_honor: totalHonor }
    });

    sendResponse(res, null, 'Anggota deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// HONORARIUM Routes
// =============================================================================

// Get all honorarium
router.get('/honorarium', async (req: Request, res: Response) => {
  try {
    const { bulan, tahun, status, jenis } = req.query;
    const where: any = { is_deleted: false };

    if (bulan) where.bulan = Number(bulan);
    if (tahun) where.tahun = Number(tahun);
    if (status) where.status = status as string;
    if (jenis) where.jenis = jenis as string;

    const data = await prisma.honorarium.findMany({
      where,
      include: {
        details: {
          where: { is_deleted: false },
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }]
    });
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Get honorarium by ID
router.get('/honorarium/:id', async (req: Request, res: Response) => {
  try {
    const data = await prisma.honorarium.findUnique({
      where: { id: req.params.id },
      include: {
        details: {
          where: { is_deleted: false },
          orderBy: { created_at: 'asc' }
        }
      }
    });
    if (!data) return sendError(res, new Error('Honorarium not found'), 404);
    sendResponse(res, data);
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Create honorarium
router.post('/honorarium', async (req: Request, res: Response) => {
  try {
    const { details, ...honorariumData } = req.body;

    const data = await prisma.honorarium.create({
      data: {
        ...honorariumData,
        details: details && details.length > 0 ? {
          create: details.map((d: any) => ({
            nama: d.nama,
            nip: d.nip || null,
            jabatan: d.jabatan || null,
            golongan: d.golongan || null,
            jenis_honor: d.jenis_honor,
            tarif: d.tarif || 0,
            volume: d.volume || 1,
            satuan: d.satuan || 'OK',
            jumlah_kotor: d.jumlah_kotor || 0,
            pph21: d.pph21 || 0,
            jumlah_bersih: d.jumlah_bersih || 0,
            pegawai_id: d.pegawai_id || null,
            keterangan: d.keterangan || null
          }))
        } : undefined
      },
      include: {
        details: { where: { is_deleted: false } }
      }
    });

    sendResponse(res, data, 'Honorarium created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Update honorarium
router.put('/honorarium/:id', async (req: Request, res: Response) => {
  try {
    const { details, ...honorariumData } = req.body;

    // Update honorarium data
    await prisma.honorarium.update({
      where: { id: req.params.id },
      data: honorariumData
    });

    // If details provided, replace them
    if (details && Array.isArray(details)) {
      // Delete existing details
      await prisma.detail_honorarium.deleteMany({
        where: { honorarium_id: req.params.id }
      });

      // Create new details
      for (const d of details) {
        await prisma.detail_honorarium.create({
          data: {
            honorarium_id: req.params.id,
            nama: d.nama,
            nip: d.nip || null,
            jabatan: d.jabatan || null,
            golongan: d.golongan || null,
            jenis_honor: d.jenis_honor,
            tarif: d.tarif || 0,
            volume: d.volume || 1,
            satuan: d.satuan || 'OK',
            jumlah_kotor: d.jumlah_kotor || 0,
            pph21: d.pph21 || 0,
            jumlah_bersih: d.jumlah_bersih || 0,
            pegawai_id: d.pegawai_id || null,
            keterangan: d.keterangan || null
          }
        });
      }
    }

    // Fetch updated data
    const updatedData = await prisma.honorarium.findUnique({
      where: { id: req.params.id },
      include: {
        details: { where: { is_deleted: false } }
      }
    });

    sendResponse(res, updatedData, 'Honorarium updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Delete honorarium
router.delete('/honorarium/:id', async (req: Request, res: Response) => {
  try {
    await prisma.honorarium.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Honorarium deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// TARUNA Routes
// =============================================================================

router.get('/taruna', async (req: Request, res: Response) => {
  try {
    const { program_studi, angkatan, status, search } = req.query;
    const where: any = { is_deleted: false };
    if (program_studi) where.program_studi = program_studi;
    if (angkatan) where.angkatan = parseInt(angkatan as string);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nama: { contains: search as string } },
        { nim: { contains: search as string } },
        { nit: { contains: search as string } },
      ];
    }

    const taruna = await prisma.taruna.findMany({
      where,
      orderBy: { nama: 'asc' }
    });
    sendResponse(res, taruna);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/taruna/:id', async (req: Request, res: Response) => {
  try {
    const taruna = await prisma.taruna.findUnique({
      where: { id: req.params.id }
    });
    if (!taruna) return sendError(res, new Error('Taruna not found'), 404);
    sendResponse(res, taruna);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/taruna', async (req: Request, res: Response) => {
  try {
    const taruna = await prisma.taruna.create({ data: req.body });
    sendResponse(res, taruna, 'Taruna created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/taruna/bulk', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return sendError(res, new Error('Data must be an array'));
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // Try to find existing taruna by NIT or NIM
        let existing = null;
        if (item.nit) {
          existing = await prisma.taruna.findFirst({ where: { nit: item.nit, is_deleted: false } });
        }
        if (!existing && item.nim) {
          existing = await prisma.taruna.findUnique({ where: { nim: item.nim } });
        }

        if (existing) {
          // Update existing taruna
          const { nim, ...updateData } = item;
          await prisma.taruna.update({
            where: { id: existing.id },
            data: updateData,
          });
          updatedCount++;
        } else {
          // Create new taruna - auto-generate NIM if not provided
          if (!item.nim) {
            const count = await prisma.taruna.count();
            item.nim = `AUTO-${String(count + 1).padStart(6, '0')}`;
          }
          await prisma.taruna.create({ data: item });
          createdCount++;
        }
      } catch (err: any) {
        errors.push(`Error for ${item.nit || item.nim}: ${err.message}`);
      }
    }

    sendResponse(res, { count: createdCount + updatedCount, created: createdCount, updated: updatedCount, errors }, `${createdCount} created, ${updatedCount} updated`);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/taruna/:id', async (req: Request, res: Response) => {
  try {
    const taruna = await prisma.taruna.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, taruna, 'Taruna updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/taruna/:id', async (req: Request, res: Response) => {
  try {
    await prisma.taruna.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Taruna deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// =============================================================================
// SURAT KEPUTUSAN Routes
// =============================================================================

router.get('/surat-keputusan', async (req: Request, res: Response) => {
  try {
    const { jenis, tahun, status, search } = req.query;
    const where: any = { is_deleted: false };
    if (jenis) where.jenis = jenis;
    if (tahun) where.tahun = parseInt(tahun as string);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nomor_sk: { contains: search as string } },
        { judul: { contains: search as string } },
      ];
    }

    const sk = await prisma.surat_keputusan.findMany({
      where,
      include: {
        anggaran: true,
        details: {
          where: { is_deleted: false },
          include: { pegawai: true, taruna: true },
          orderBy: { urutan: 'asc' }
        },
        _count: {
          select: { details: { where: { is_deleted: false } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    sendResponse(res, sk);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.get('/surat-keputusan/:id', async (req: Request, res: Response) => {
  try {
    const sk = await prisma.surat_keputusan.findUnique({
      where: { id: req.params.id },
      include: {
        anggaran: true,
        details: {
          where: { is_deleted: false },
          include: { pegawai: true, taruna: true },
          orderBy: { urutan: 'asc' }
        }
      }
    });
    if (!sk) return sendError(res, new Error('Surat Keputusan not found'), 404);
    sendResponse(res, sk);
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.post('/surat-keputusan', async (req: Request, res: Response) => {
  try {
    const { details, ...skData } = req.body;

    const sk = await prisma.surat_keputusan.create({
      data: {
        ...skData,
        details: details && details.length > 0 ? {
          create: details.map((d: any, i: number) => ({
            ...d,
            urutan: d.urutan ?? i + 1,
          }))
        } : undefined
      },
      include: {
        anggaran: true,
        details: {
          where: { is_deleted: false },
          include: { pegawai: true, taruna: true },
          orderBy: { urutan: 'asc' }
        }
      }
    });
    sendResponse(res, sk, 'Surat Keputusan created successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/surat-keputusan/:id', async (req: Request, res: Response) => {
  try {
    const { details, ...skData } = req.body;

    // Update SK header
    const sk = await prisma.surat_keputusan.update({
      where: { id: req.params.id },
      data: skData,
      include: {
        anggaran: true,
        details: {
          where: { is_deleted: false },
          include: { pegawai: true, taruna: true },
          orderBy: { urutan: 'asc' }
        }
      }
    });

    // If details provided, replace all details
    if (details) {
      // Soft delete old details
      await prisma.detail_sk.updateMany({
        where: { sk_id: req.params.id },
        data: { is_deleted: true }
      });

      // Create new details
      for (let i = 0; i < details.length; i++) {
        const d = details[i];
        await prisma.detail_sk.create({
          data: {
            ...d,
            sk_id: req.params.id,
            urutan: d.urutan ?? i + 1,
          }
        });
      }

      // Refetch with new details
      const updated = await prisma.surat_keputusan.findUnique({
        where: { id: req.params.id },
        include: {
          anggaran: true,
          details: {
            where: { is_deleted: false },
            include: { pegawai: true, taruna: true },
            orderBy: { urutan: 'asc' }
          }
        }
      });
      return sendResponse(res, updated, 'Surat Keputusan updated successfully');
    }

    sendResponse(res, sk, 'Surat Keputusan updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/surat-keputusan/:id', async (req: Request, res: Response) => {
  try {
    await prisma.surat_keputusan.update({
      where: { id: req.params.id },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Surat Keputusan deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

// Detail SK sub-routes
router.post('/surat-keputusan/:id/detail', async (req: Request, res: Response) => {
  try {
    const detail = await prisma.detail_sk.create({
      data: {
        ...req.body,
        sk_id: req.params.id,
      },
      include: { pegawai: true, taruna: true }
    });
    sendResponse(res, detail, 'Detail SK added successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.put('/surat-keputusan/:id/detail/:detailId', async (req: Request, res: Response) => {
  try {
    const detail = await prisma.detail_sk.update({
      where: { id: req.params.detailId },
      data: req.body,
      include: { pegawai: true, taruna: true }
    });
    sendResponse(res, detail, 'Detail SK updated successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

router.delete('/surat-keputusan/:id/detail/:detailId', async (req: Request, res: Response) => {
  try {
    await prisma.detail_sk.update({
      where: { id: req.params.detailId },
      data: { is_deleted: true }
    });
    sendResponse(res, null, 'Detail SK deleted successfully');
  } catch (error) {
    sendError(res, error as Error);
  }
});

export default router;
