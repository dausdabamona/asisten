/**
 * ASISTEN - HPS Konstruksi Routes
 * Master Harga Satuan, Analisa Harga Satuan, BOQ, Rekapitulasi, Export Excel
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { AuthRequest } from '../types/auth';
import { logAudit } from '../middleware/audit.middleware';

const router = Router();
const prisma = new PrismaClient();

// Helper to send response
function sendResponse<T>(res: Response, data: T, message?: string) {
  res.json({ success: true, data, message });
}

function sendError(res: Response, error: any, status = 400) {
  console.error('[HPS ERROR]', error.message || error);
  res.status(status).json({ success: false, error: error.message || 'Terjadi kesalahan' });
}

// Helper: terbilang (angka ke kata)
function terbilang(angka: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (angka < 12) return bilangan[angka];
  if (angka < 20) return terbilang(angka - 10) + ' Belas';
  if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh' + (angka % 10 > 0 ? ' ' + terbilang(angka % 10) : '');
  if (angka < 200) return 'Seratus' + (angka % 100 > 0 ? ' ' + terbilang(angka % 100) : '');
  if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus' + (angka % 100 > 0 ? ' ' + terbilang(angka % 100) : '');
  if (angka < 2000) return 'Seribu' + (angka % 1000 > 0 ? ' ' + terbilang(angka % 1000) : '');
  if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' Ribu' + (angka % 1000 > 0 ? ' ' + terbilang(angka % 1000) : '');
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' Juta' + (angka % 1000000 > 0 ? ' ' + terbilang(angka % 1000000) : '');
  if (angka < 1000000000000) return terbilang(Math.floor(angka / 1000000000)) + ' Miliar' + (angka % 1000000000 > 0 ? ' ' + terbilang(angka % 1000000000) : '');
  return terbilang(Math.floor(angka / 1000000000000)) + ' Triliun' + (angka % 1000000000000 > 0 ? ' ' + terbilang(angka % 1000000000000) : '');
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// Helper: recalculate analisa totals from details
async function recalculateAnalisa(analisaId: string) {
  const details = await prisma.analisa_detail.findMany({
    where: { analisa_id: analisaId, is_deleted: false },
  });

  let totalTenaga = new Prisma.Decimal(0);
  let totalBahan = new Prisma.Decimal(0);
  let totalAlat = new Prisma.Decimal(0);

  for (const d of details) {
    const jumlah = d.koefisien.mul(d.harga);
    // Update jumlah_harga on detail
    await prisma.analisa_detail.update({
      where: { id: d.id },
      data: { jumlah_harga: jumlah },
    });

    if (d.kelompok === 'TENAGA_KERJA') totalTenaga = totalTenaga.add(jumlah);
    else if (d.kelompok === 'BAHAN') totalBahan = totalBahan.add(jumlah);
    else if (d.kelompok === 'PERALATAN') totalAlat = totalAlat.add(jumlah);
  }

  const totalDasar = totalTenaga.add(totalBahan).add(totalAlat);
  const analisa = await prisma.analisa_harga_satuan.findUnique({ where: { id: analisaId } });
  const overheadPersen = analisa?.overhead_persen || new Prisma.Decimal(10);
  const totalOverhead = totalDasar.mul(overheadPersen).div(100);
  const hargaSatuan = totalDasar.add(totalOverhead);

  await prisma.analisa_harga_satuan.update({
    where: { id: analisaId },
    data: {
      total_tenaga: totalTenaga,
      total_bahan: totalBahan,
      total_alat: totalAlat,
      total_dasar: totalDasar,
      total_overhead: totalOverhead,
      harga_satuan: hargaSatuan,
    },
  });

  return { totalTenaga, totalBahan, totalAlat, totalDasar, totalOverhead, hargaSatuan };
}

// ==================== MASTER HARGA SATUAN ====================

// GET /hps/harga-satuan/template - download Excel import template
router.get('/harga-satuan/template', async (_req: Request, res: Response) => {
  try {
    const wb = new ExcelJS.Workbook();

    // Sheet BAHAN
    const shBahan = wb.addWorksheet('BAHAN');
    shBahan.columns = [
      { header: 'Kode', key: 'kode', width: 15 },
      { header: 'Uraian', key: 'uraian', width: 40 },
      { header: 'Satuan', key: 'satuan', width: 12 },
      { header: 'Harga', key: 'harga', width: 18 },
      { header: 'Tahun', key: 'tahun', width: 10 },
      { header: 'Sumber', key: 'sumber', width: 30 },
    ];
    const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1890FF' } }, alignment: { horizontal: 'center' as const } };
    shBahan.getRow(1).eachCell(c => { c.font = headerStyle.font; c.fill = headerStyle.fill; c.alignment = headerStyle.alignment; });
    // Sample data
    const bahanSamples = [
      { kode: 'BH-001', uraian: 'Semen Portland 50 Kg', satuan: 'Zak', harga: 95000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
      { kode: 'BH-002', uraian: 'Pasir Pasang', satuan: 'M3', harga: 450000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
      { kode: 'BH-003', uraian: 'Cat Tembok 5 Kg', satuan: 'Kaleng', harga: 1296000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
      { kode: 'BH-004', uraian: 'Keramik Polos 30x30', satuan: 'Dos', harga: 90000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
      { kode: 'BH-005', uraian: 'Paku Biasa', satuan: 'Kg', harga: 35000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
    ];
    bahanSamples.forEach(r => shBahan.addRow(r));

    // Sheet UPAH
    const shUpah = wb.addWorksheet('UPAH');
    shUpah.columns = shBahan.columns;
    shUpah.getRow(1).eachCell(c => { c.font = headerStyle.font; c.fill = headerStyle.fill; c.alignment = headerStyle.alignment; });
    const upahSamples = [
      { kode: 'TK-001', uraian: 'Pekerja', satuan: 'OH', harga: 190000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
      { kode: 'TK-002', uraian: 'Tukang Batu', satuan: 'OH', harga: 220000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
      { kode: 'TK-003', uraian: 'Mandor / Pengawas', satuan: 'OH', harga: 210000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
    ];
    upahSamples.forEach(r => shUpah.addRow(r));

    // Sheet ALAT
    const shAlat = wb.addWorksheet('ALAT');
    shAlat.columns = shBahan.columns;
    shAlat.getRow(1).eachCell(c => { c.font = headerStyle.font; c.fill = headerStyle.fill; c.alignment = headerStyle.alignment; });
    const alatSamples = [
      { kode: 'AL-001', uraian: 'Concrete Vibrator', satuan: 'Jam', harga: 50000, tahun: 2025, sumber: 'Perwali Sorong No.15/2024' },
    ];
    alatSamples.forEach(r => shAlat.addRow(r));

    // Sheet PETUNJUK
    const shPetunjuk = wb.addWorksheet('PETUNJUK');
    shPetunjuk.columns = [{ header: '', key: 'info', width: 80 }];
    const petunjukRows = [
      'PETUNJUK PENGISIAN TEMPLATE IMPORT HARGA SATUAN',
      '',
      'Format file: Excel (.xlsx)',
      '',
      'Kolom yang wajib diisi:',
      '  1. Kode    - Kode unik harga satuan (misal: BH-001, TK-001, AL-001)',
      '  2. Uraian  - Nama/deskripsi bahan, upah, atau alat',
      '  3. Satuan  - Unit satuan (Kg, M3, OH, Lembar, Buah, dll)',
      '  4. Harga   - Harga satuan dalam Rupiah (angka saja, tanpa titik/koma)',
      '',
      'Kolom opsional:',
      '  5. Tahun   - Tahun berlaku (default: tahun saat import)',
      '  6. Sumber  - Sumber referensi harga (misal: Perwali Kota Sorong)',
      '',
      'Sheet yang tersedia:',
      '  - BAHAN: Material/bahan bangunan',
      '  - UPAH: Upah tenaga kerja (per Orang Hari = OH)',
      '  - ALAT: Sewa peralatan',
      '',
      'Cara import:',
      '  1. Isi data di sheet sesuai jenis (BAHAN/UPAH/ALAT)',
      '  2. Hapus contoh data yang sudah ada',
      '  3. Di aplikasi, buka menu Harga Satuan',
      '  4. Pilih tab sesuai jenis, lalu klik tombol Import',
      '  5. Copy-paste data dari Excel ke area import',
      '  6. Format paste: Kode [TAB] Uraian [TAB] Satuan [TAB] Harga',
      '',
      'Atau gunakan tombol "Upload Excel" untuk import langsung dari file ini.',
    ];
    petunjukRows.forEach(r => shPetunjuk.addRow({ info: r }));
    shPetunjuk.getRow(1).font = { bold: true, size: 14 };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_Harga_Satuan.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (error: any) {
    sendError(res, error, 500);
  }
});

// GET /hps/harga-satuan - list with filter
router.get('/harga-satuan', async (req: Request, res: Response) => {
  try {
    const { jenis, tahun, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { is_deleted: false };
    if (jenis) where.jenis = jenis;
    if (tahun) where.tahun = parseInt(tahun as string, 10);
    if (search) {
      where.OR = [
        { kode: { contains: search as string } },
        { uraian: { contains: search as string } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.harga_satuan.findMany({
        where,
        orderBy: [{ jenis: 'asc' }, { kode: 'asc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.harga_satuan.count({ where }),
    ]);

    sendResponse(res, { items: data, total, page: pageNum, limit: limitNum });
  } catch (error: any) {
    sendError(res, error, 500);
  }
});

// POST /hps/harga-satuan - create one
router.post('/harga-satuan', async (req: Request, res: Response) => {
  try {
    const { kode, uraian, jenis, satuan, harga, tahun, sumber } = req.body;
    const item = await prisma.harga_satuan.create({
      data: { kode, uraian, jenis, satuan, harga: harga || 0, tahun: parseInt(tahun, 10), sumber },
    });
    await logAudit({ req: req as AuthRequest, tableName: 'harga_satuan', recordId: item.id, action: 'INSERT', newValues: item });
    sendResponse(res, item, 'Harga satuan berhasil ditambahkan');
  } catch (error: any) {
    sendError(res, error);
  }
});

// POST /hps/harga-satuan/bulk - bulk import
router.post('/harga-satuan/bulk', async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { kode, uraian, jenis, satuan, harga, tahun, sumber }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Data items harus berupa array yang tidak kosong' });
    }

    const data = items.map((item: any) => ({
      kode: item.kode || '',
      uraian: item.uraian || '',
      jenis: item.jenis || 'BAHAN',
      satuan: item.satuan || '',
      harga: item.harga || 0,
      tahun: parseInt(item.tahun, 10) || new Date().getFullYear(),
      sumber: item.sumber || null,
    }));

    const result = await prisma.harga_satuan.createMany({ data });
    await logAudit({ req: req as AuthRequest, tableName: 'harga_satuan', recordId: 'bulk', action: 'INSERT', newValues: { count: result.count } });
    sendResponse(res, { count: result.count }, `${result.count} harga satuan berhasil diimport`);
  } catch (error: any) {
    sendError(res, error);
  }
});

// PUT /hps/harga-satuan/:id - update
router.put('/harga-satuan/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { kode, uraian, jenis, satuan, harga, tahun, sumber } = req.body;
    const old = await prisma.harga_satuan.findUnique({ where: { id } });
    const item = await prisma.harga_satuan.update({
      where: { id },
      data: {
        ...(kode !== undefined && { kode }),
        ...(uraian !== undefined && { uraian }),
        ...(jenis !== undefined && { jenis }),
        ...(satuan !== undefined && { satuan }),
        ...(harga !== undefined && { harga }),
        ...(tahun !== undefined && { tahun: parseInt(tahun, 10) }),
        ...(sumber !== undefined && { sumber }),
      },
    });
    await logAudit({ req: req as AuthRequest, tableName: 'harga_satuan', recordId: id, action: 'UPDATE', oldValues: old, newValues: item });
    sendResponse(res, item, 'Harga satuan berhasil diupdate');
  } catch (error: any) {
    sendError(res, error);
  }
});

// DELETE /hps/harga-satuan/:id - soft delete
router.delete('/harga-satuan/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.harga_satuan.update({ where: { id }, data: { is_deleted: true } });
    await logAudit({ req: req as AuthRequest, tableName: 'harga_satuan', recordId: id, action: 'DELETE' });
    sendResponse(res, { id }, 'Harga satuan berhasil dihapus');
  } catch (error: any) {
    sendError(res, error);
  }
});

// ==================== ANALISA HARGA SATUAN ====================

// GET /hps/analisa?paket_id=xxx - list per paket
router.get('/analisa', async (req: Request, res: Response) => {
  try {
    const { paket_id } = req.query;
    if (!paket_id) return res.status(400).json({ success: false, error: 'paket_id diperlukan' });

    const data = await prisma.analisa_harga_satuan.findMany({
      where: { paket_id: paket_id as string, is_deleted: false },
      include: {
        details: { where: { is_deleted: false }, orderBy: { kelompok: 'asc' } },
      },
      orderBy: { kode_analisa: 'asc' },
    });
    sendResponse(res, data);
  } catch (error: any) {
    sendError(res, error, 500);
  }
});

// GET /hps/analisa/:id - detail analisa + details
router.get('/analisa/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await prisma.analisa_harga_satuan.findUnique({
      where: { id },
      include: {
        details: {
          where: { is_deleted: false },
          orderBy: { kelompok: 'asc' },
          include: { master_harga: true },
        },
      },
    });
    if (!data || data.is_deleted) return res.status(404).json({ success: false, error: 'Analisa tidak ditemukan' });
    sendResponse(res, data);
  } catch (error: any) {
    sendError(res, error, 500);
  }
});

// POST /hps/analisa - create analisa + details
router.post('/analisa', async (req: Request, res: Response) => {
  try {
    const { paket_id, kode_analisa, nama_pekerjaan, satuan, overhead_persen, details } = req.body;

    const analisa = await prisma.analisa_harga_satuan.create({
      data: {
        paket_id,
        kode_analisa,
        nama_pekerjaan,
        satuan,
        overhead_persen: overhead_persen || 10,
      },
    });

    // Create details if provided
    if (details && Array.isArray(details) && details.length > 0) {
      for (const d of details) {
        await prisma.analisa_detail.create({
          data: {
            analisa_id: analisa.id,
            kelompok: d.kelompok,
            harga_satuan_id: d.harga_satuan_id || null,
            uraian: d.uraian,
            kode: d.kode || null,
            satuan: d.satuan,
            koefisien: d.koefisien || 0,
            harga: d.harga || 0,
            jumlah_harga: (d.koefisien || 0) * (d.harga || 0),
          },
        });
      }
      // Recalculate totals
      await recalculateAnalisa(analisa.id);
    }

    const result = await prisma.analisa_harga_satuan.findUnique({
      where: { id: analisa.id },
      include: { details: { where: { is_deleted: false } } },
    });

    await logAudit({ req: req as AuthRequest, tableName: 'analisa_harga_satuan', recordId: analisa.id, action: 'INSERT', newValues: result });
    sendResponse(res, result, 'Analisa harga satuan berhasil dibuat');
  } catch (error: any) {
    sendError(res, error);
  }
});

// PUT /hps/analisa/:id - update analisa + details (replace details)
router.put('/analisa/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { kode_analisa, nama_pekerjaan, satuan, overhead_persen, details } = req.body;

    // Update analisa header
    await prisma.analisa_harga_satuan.update({
      where: { id },
      data: {
        ...(kode_analisa !== undefined && { kode_analisa }),
        ...(nama_pekerjaan !== undefined && { nama_pekerjaan }),
        ...(satuan !== undefined && { satuan }),
        ...(overhead_persen !== undefined && { overhead_persen }),
      },
    });

    // Replace details if provided
    if (details && Array.isArray(details)) {
      // Soft delete old details
      await prisma.analisa_detail.updateMany({
        where: { analisa_id: id },
        data: { is_deleted: true },
      });

      // Create new details
      for (const d of details) {
        await prisma.analisa_detail.create({
          data: {
            analisa_id: id,
            kelompok: d.kelompok,
            harga_satuan_id: d.harga_satuan_id || null,
            uraian: d.uraian,
            kode: d.kode || null,
            satuan: d.satuan,
            koefisien: d.koefisien || 0,
            harga: d.harga || 0,
            jumlah_harga: (d.koefisien || 0) * (d.harga || 0),
          },
        });
      }

      // Recalculate
      await recalculateAnalisa(id);
    }

    const result = await prisma.analisa_harga_satuan.findUnique({
      where: { id },
      include: { details: { where: { is_deleted: false } } },
    });

    await logAudit({ req: req as AuthRequest, tableName: 'analisa_harga_satuan', recordId: id, action: 'UPDATE', newValues: result });
    sendResponse(res, result, 'Analisa harga satuan berhasil diupdate');
  } catch (error: any) {
    sendError(res, error);
  }
});

// DELETE /hps/analisa/:id - soft delete
router.delete('/analisa/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.analisa_harga_satuan.update({ where: { id }, data: { is_deleted: true } });
    await logAudit({ req: req as AuthRequest, tableName: 'analisa_harga_satuan', recordId: id, action: 'DELETE' });
    sendResponse(res, { id }, 'Analisa berhasil dihapus');
  } catch (error: any) {
    sendError(res, error);
  }
});

// ==================== BOQ (Bill of Quantities) ====================

// GET /hps/boq?paket_id=xxx
router.get('/boq', async (req: Request, res: Response) => {
  try {
    const { paket_id } = req.query;
    if (!paket_id) return res.status(400).json({ success: false, error: 'paket_id diperlukan' });

    const data = await prisma.boq_item.findMany({
      where: { paket_id: paket_id as string, is_deleted: false },
      include: { analisa: true },
      orderBy: [{ kelompok: 'asc' }, { nomor: 'asc' }],
    });
    sendResponse(res, data);
  } catch (error: any) {
    sendError(res, error, 500);
  }
});

// POST /hps/boq - create item
router.post('/boq', async (req: Request, res: Response) => {
  try {
    const { paket_id, nomor, kelompok, uraian_pekerjaan, kode_analisa, analisa_id, volume, satuan, harga_satuan } = req.body;

    // If linked to analisa, get harga_satuan from analisa
    let finalHargaSatuan = harga_satuan || 0;
    if (analisa_id) {
      const analisa = await prisma.analisa_harga_satuan.findUnique({ where: { id: analisa_id } });
      if (analisa) {
        finalHargaSatuan = Number(analisa.harga_satuan);
      }
    }

    const jumlahHarga = (volume || 0) * finalHargaSatuan;

    const item = await prisma.boq_item.create({
      data: {
        paket_id,
        nomor: nomor || 1,
        kelompok: kelompok || 'A',
        uraian_pekerjaan,
        kode_analisa: kode_analisa || null,
        analisa_id: analisa_id || null,
        volume: volume || 0,
        satuan,
        harga_satuan: finalHargaSatuan,
        jumlah_harga: jumlahHarga,
      },
    });

    await logAudit({ req: req as AuthRequest, tableName: 'boq_item', recordId: item.id, action: 'INSERT', newValues: item });
    sendResponse(res, item, 'Item BOQ berhasil ditambahkan');
  } catch (error: any) {
    sendError(res, error);
  }
});

// PUT /hps/boq/:id - update item
router.put('/boq/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nomor, kelompok, uraian_pekerjaan, kode_analisa, analisa_id, volume, satuan, harga_satuan } = req.body;

    // Calculate jumlah_harga if volume or harga_satuan provided
    let finalHargaSatuan = harga_satuan;
    if (analisa_id) {
      const analisa = await prisma.analisa_harga_satuan.findUnique({ where: { id: analisa_id } });
      if (analisa) finalHargaSatuan = Number(analisa.harga_satuan);
    }

    const existing = await prisma.boq_item.findUnique({ where: { id } });
    const vol = volume !== undefined ? volume : Number(existing?.volume || 0);
    const hs = finalHargaSatuan !== undefined ? finalHargaSatuan : Number(existing?.harga_satuan || 0);
    const jumlahHarga = vol * hs;

    const item = await prisma.boq_item.update({
      where: { id },
      data: {
        ...(nomor !== undefined && { nomor }),
        ...(kelompok !== undefined && { kelompok }),
        ...(uraian_pekerjaan !== undefined && { uraian_pekerjaan }),
        ...(kode_analisa !== undefined && { kode_analisa }),
        ...(analisa_id !== undefined && { analisa_id }),
        ...(volume !== undefined && { volume }),
        ...(satuan !== undefined && { satuan }),
        ...(finalHargaSatuan !== undefined && { harga_satuan: finalHargaSatuan }),
        jumlah_harga: jumlahHarga,
      },
    });

    await logAudit({ req: req as AuthRequest, tableName: 'boq_item', recordId: id, action: 'UPDATE', newValues: item });
    sendResponse(res, item, 'Item BOQ berhasil diupdate');
  } catch (error: any) {
    sendError(res, error);
  }
});

// PUT /hps/boq/reorder - reorder items
router.put('/boq-reorder', async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { id, nomor, kelompok? }
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items harus berupa array' });

    for (const item of items) {
      await prisma.boq_item.update({
        where: { id: item.id },
        data: {
          nomor: item.nomor,
          ...(item.kelompok && { kelompok: item.kelompok }),
        },
      });
    }

    sendResponse(res, { count: items.length }, 'Urutan BOQ berhasil diupdate');
  } catch (error: any) {
    sendError(res, error);
  }
});

// DELETE /hps/boq/:id - soft delete
router.delete('/boq/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.boq_item.update({ where: { id }, data: { is_deleted: true } });
    await logAudit({ req: req as AuthRequest, tableName: 'boq_item', recordId: id, action: 'DELETE' });
    sendResponse(res, { id }, 'Item BOQ berhasil dihapus');
  } catch (error: any) {
    sendError(res, error);
  }
});

// ==================== REKAPITULASI ====================

// GET /hps/rekap/:paketId - calculate recap
router.get('/rekap/:paketId', async (req: Request, res: Response) => {
  try {
    const { paketId } = req.params;

    const paket = await prisma.paket.findUnique({ where: { id: paketId } });
    if (!paket) return res.status(404).json({ success: false, error: 'Paket tidak ditemukan' });

    const boqItems = await prisma.boq_item.findMany({
      where: { paket_id: paketId, is_deleted: false },
      include: { analisa: true },
      orderBy: [{ kelompok: 'asc' }, { nomor: 'asc' }],
    });

    // Calculate totals
    let subtotal = 0;
    const itemsByKelompok: Record<string, typeof boqItems> = {};

    for (const item of boqItems) {
      subtotal += Number(item.jumlah_harga);
      if (!itemsByKelompok[item.kelompok]) itemsByKelompok[item.kelompok] = [];
      itemsByKelompok[item.kelompok].push(item);
    }

    const ppn = subtotal * 0.11; // PPN 11%
    const totalSebelumPembulatan = subtotal + ppn;
    const dibulatkan = Math.round(totalSebelumPembulatan / 1000) * 1000; // Pembulatan ke ribuan
    const terbilangText = terbilang(dibulatkan) + ' Rupiah';

    sendResponse(res, {
      paket: {
        id: paket.id,
        nama: paket.nama,
        pagu: Number(paket.pagu),
      },
      items: boqItems,
      itemsByKelompok,
      subtotal,
      subtotal_fmt: formatRupiah(subtotal),
      ppn,
      ppn_fmt: formatRupiah(ppn),
      total_sebelum_pembulatan: totalSebelumPembulatan,
      dibulatkan,
      dibulatkan_fmt: formatRupiah(dibulatkan),
      terbilang: terbilangText,
    });
  } catch (error: any) {
    sendError(res, error, 500);
  }
});

// ==================== EXPORT EXCEL ====================

// GET /hps/export/:paketId - export all HPS to Excel
router.get('/export/:paketId', async (req: Request, res: Response) => {
  try {
    const { paketId } = req.params;

    const paket = await prisma.paket.findUnique({ where: { id: paketId } });
    if (!paket) return res.status(404).json({ success: false, error: 'Paket tidak ditemukan' });

    // Fetch all data
    const analisaList = await prisma.analisa_harga_satuan.findMany({
      where: { paket_id: paketId, is_deleted: false },
      include: {
        details: { where: { is_deleted: false }, orderBy: { kelompok: 'asc' } },
      },
      orderBy: { kode_analisa: 'asc' },
    });

    const boqItems = await prisma.boq_item.findMany({
      where: { paket_id: paketId, is_deleted: false },
      include: { analisa: true },
      orderBy: [{ kelompok: 'asc' }, { nomor: 'asc' }],
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ASISTEN';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 11 },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
    };

    const cellBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // ===== Sheet 1: BOQ =====
    const sheetBoq = workbook.addWorksheet('BOQ');
    sheetBoq.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Uraian Pekerjaan', key: 'uraian', width: 40 },
      { header: 'Kode Analisa', key: 'kode', width: 15 },
      { header: 'Volume', key: 'volume', width: 12 },
      { header: 'Satuan', key: 'satuan', width: 10 },
      { header: 'Harga Satuan (Rp)', key: 'harga_satuan', width: 18 },
      { header: 'Jumlah Harga (Rp)', key: 'jumlah_harga', width: 18 },
    ];

    // Title
    sheetBoq.insertRow(1, [`BILL OF QUANTITIES (BOQ) - ${paket.nama}`]);
    sheetBoq.mergeCells('A1:G1');
    sheetBoq.getRow(1).font = { bold: true, size: 14 };
    sheetBoq.getRow(1).alignment = { horizontal: 'center' };
    sheetBoq.insertRow(2, []);

    // Header row (row 3)
    const boqHeaderRow = sheetBoq.getRow(3);
    ['No', 'Uraian Pekerjaan', 'Kode Analisa', 'Volume', 'Satuan', 'Harga Satuan (Rp)', 'Jumlah Harga (Rp)'].forEach((h, i) => {
      const cell = boqHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.style = headerStyle as ExcelJS.Style;
    });

    let boqRow = 4;
    let subtotalBoq = 0;
    for (const item of boqItems) {
      const row = sheetBoq.getRow(boqRow);
      row.getCell(1).value = item.nomor;
      row.getCell(2).value = item.uraian_pekerjaan;
      row.getCell(3).value = item.kode_analisa || '';
      row.getCell(4).value = Number(item.volume);
      row.getCell(5).value = item.satuan;
      row.getCell(6).value = Number(item.harga_satuan);
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(7).value = Number(item.jumlah_harga);
      row.getCell(7).numFmt = '#,##0.00';
      for (let c = 1; c <= 7; c++) row.getCell(c).border = cellBorder;
      subtotalBoq += Number(item.jumlah_harga);
      boqRow++;
    }

    // Subtotal, PPN, Total
    const ppnBoq = subtotalBoq * 0.11;
    const totalBoq = subtotalBoq + ppnBoq;
    const dibulatkanBoq = Math.round(totalBoq / 1000) * 1000;

    const addSummaryRow = (label: string, value: number) => {
      const row = sheetBoq.getRow(boqRow);
      sheetBoq.mergeCells(`A${boqRow}:F${boqRow}`);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = { horizontal: 'right' };
      row.getCell(7).value = value;
      row.getCell(7).numFmt = '#,##0.00';
      row.getCell(7).font = { bold: true };
      for (let c = 1; c <= 7; c++) row.getCell(c).border = cellBorder;
      boqRow++;
    };

    addSummaryRow('Jumlah Harga Pekerjaan', subtotalBoq);
    addSummaryRow('PPN 11%', ppnBoq);
    addSummaryRow('Total', totalBoq);
    addSummaryRow('Dibulatkan', dibulatkanBoq);

    const terbilangRow = sheetBoq.getRow(boqRow);
    sheetBoq.mergeCells(`A${boqRow}:G${boqRow}`);
    terbilangRow.getCell(1).value = `Terbilang: ${terbilang(dibulatkanBoq)} Rupiah`;
    terbilangRow.getCell(1).font = { bold: true, italic: true };

    // ===== Sheet 2: Analisa Harga Satuan =====
    for (let i = 0; i < analisaList.length; i++) {
      const a = analisaList[i];
      const sheetName = `Analisa ${i + 1}`;
      const sheet = workbook.addWorksheet(sheetName.substring(0, 31)); // Excel sheet name max 31 chars

      // Title
      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = `ANALISA HARGA SATUAN`;
      sheet.getCell('A1').font = { bold: true, size: 13 };
      sheet.getCell('A1').alignment = { horizontal: 'center' };

      sheet.mergeCells('A2:F2');
      sheet.getCell('A2').value = `${a.kode_analisa || ''} - ${a.nama_pekerjaan}`;
      sheet.getCell('A2').font = { bold: true, size: 11 };
      sheet.getCell('A2').alignment = { horizontal: 'center' };

      sheet.getCell('A3').value = `Satuan: ${a.satuan}`;

      // Headers
      const hdrRow = sheet.getRow(5);
      ['No', 'Uraian', 'Kode', 'Satuan', 'Koefisien', 'Harga Satuan', 'Jumlah Harga'].forEach((h, idx) => {
        const cell = hdrRow.getCell(idx + 1);
        cell.value = h;
        cell.style = headerStyle as ExcelJS.Style;
      });
      sheet.columns = [
        { width: 6 }, { width: 35 }, { width: 15 }, { width: 10 }, { width: 12 }, { width: 18 }, { width: 18 },
      ];

      let row = 6;
      const groups = [
        { label: 'A. TENAGA KERJA', key: 'TENAGA_KERJA' },
        { label: 'B. BAHAN', key: 'BAHAN' },
        { label: 'C. PERALATAN', key: 'PERALATAN' },
      ];

      for (const group of groups) {
        const gRow = sheet.getRow(row);
        sheet.mergeCells(`A${row}:G${row}`);
        gRow.getCell(1).value = group.label;
        gRow.getCell(1).font = { bold: true };
        for (let c = 1; c <= 7; c++) gRow.getCell(c).border = cellBorder;
        row++;

        const items = a.details.filter(d => d.kelompok === group.key);
        items.forEach((d, idx) => {
          const r = sheet.getRow(row);
          r.getCell(1).value = idx + 1;
          r.getCell(2).value = d.uraian;
          r.getCell(3).value = d.kode || '';
          r.getCell(4).value = d.satuan;
          r.getCell(5).value = Number(d.koefisien);
          r.getCell(5).numFmt = '#,##0.0000';
          r.getCell(6).value = Number(d.harga);
          r.getCell(6).numFmt = '#,##0.00';
          r.getCell(7).value = Number(d.jumlah_harga);
          r.getCell(7).numFmt = '#,##0.00';
          for (let c = 1; c <= 7; c++) r.getCell(c).border = cellBorder;
          row++;
        });
      }

      // Totals
      row++;
      const addTotal = (label: string, value: number | Prisma.Decimal) => {
        const r = sheet.getRow(row);
        sheet.mergeCells(`A${row}:F${row}`);
        r.getCell(1).value = label;
        r.getCell(1).font = { bold: true };
        r.getCell(1).alignment = { horizontal: 'right' };
        r.getCell(7).value = Number(value);
        r.getCell(7).numFmt = '#,##0.00';
        r.getCell(7).font = { bold: true };
        for (let c = 1; c <= 7; c++) r.getCell(c).border = cellBorder;
        row++;
      };

      addTotal('A. Total Tenaga Kerja', a.total_tenaga);
      addTotal('B. Total Bahan', a.total_bahan);
      addTotal('C. Total Peralatan', a.total_alat);
      addTotal('D. Jumlah (A+B+C)', a.total_dasar);
      addTotal(`E. Overhead & Profit (${Number(a.overhead_persen)}%)`, a.total_overhead);
      addTotal('F. Harga Satuan Pekerjaan (D+E)', a.harga_satuan);
    }

    // ===== Sheet: Rekapitulasi =====
    const sheetRekap = workbook.addWorksheet('Rekapitulasi');
    sheetRekap.columns = [
      { width: 6 }, { width: 40 }, { width: 18 },
    ];

    sheetRekap.mergeCells('A1:C1');
    sheetRekap.getCell('A1').value = `REKAPITULASI HPS - ${paket.nama}`;
    sheetRekap.getCell('A1').font = { bold: true, size: 14 };
    sheetRekap.getCell('A1').alignment = { horizontal: 'center' };

    const rekapHdr = sheetRekap.getRow(3);
    ['No', 'Uraian Pekerjaan', 'Jumlah Harga (Rp)'].forEach((h, i) => {
      const cell = rekapHdr.getCell(i + 1);
      cell.value = h;
      cell.style = headerStyle as ExcelJS.Style;
    });

    let rekapRow = 4;
    boqItems.forEach((item, idx) => {
      const r = sheetRekap.getRow(rekapRow);
      r.getCell(1).value = idx + 1;
      r.getCell(2).value = item.uraian_pekerjaan;
      r.getCell(3).value = Number(item.jumlah_harga);
      r.getCell(3).numFmt = '#,##0.00';
      for (let c = 1; c <= 3; c++) r.getCell(c).border = cellBorder;
      rekapRow++;
    });

    // Summary
    const addRekapSummary = (label: string, value: number, bold = true) => {
      const r = sheetRekap.getRow(rekapRow);
      sheetRekap.mergeCells(`A${rekapRow}:B${rekapRow}`);
      r.getCell(1).value = label;
      r.getCell(1).font = { bold };
      r.getCell(1).alignment = { horizontal: 'right' };
      r.getCell(3).value = value;
      r.getCell(3).numFmt = '#,##0.00';
      r.getCell(3).font = { bold };
      for (let c = 1; c <= 3; c++) r.getCell(c).border = cellBorder;
      rekapRow++;
    };

    addRekapSummary('(A) Jumlah Harga Pekerjaan', subtotalBoq);
    addRekapSummary('(B) PPN 11%', ppnBoq);
    addRekapSummary('(C) Total (A+B)', totalBoq);
    addRekapSummary('(D) Dibulatkan', dibulatkanBoq);

    const tRow = sheetRekap.getRow(rekapRow);
    sheetRekap.mergeCells(`A${rekapRow}:C${rekapRow}`);
    tRow.getCell(1).value = `Terbilang: ${terbilang(dibulatkanBoq)} Rupiah`;
    tRow.getCell(1).font = { bold: true, italic: true };

    // Write to response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.document');
    res.setHeader('Content-Disposition', `attachment; filename="HPS_${paket.nama.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    sendError(res, error, 500);
  }
});

export default router;
