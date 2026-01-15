/**
 * ASISTEN - Phase 2: Keuangan Service
 * Business logic for UP, TUP, Kuitansi, and SPJ operations
 */

import { PrismaClient, KuitansiTipe, PembayaranStatus, SPJStatus, DokumenTipe } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateUangMukaDTO, CreateRampungDTO, CreateSPJDTO, RequestContext } from '../types';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class KeuanganService {
  /**
   * Create Kuitansi Uang Muka
   * Business Rules:
   * - Must have UP or TUP allocation
   * - UP/TUP must have sufficient balance
   * - Creates linked document
   */
  static async createUangMuka(
    dto: CreateUangMukaDTO,
    ctx: RequestContext
  ): Promise<any> {
    // Validate perjalanan
    const perjalanan = await prisma.perjalanan_dinas.findUnique({
      where: { id: dto.perjalananDinasId },
      include: { paket: true }
    });

    if (!perjalanan) {
      throw new Error('Perjalanan Dinas not found');
    }

    if (!perjalanan.paket_id) {
      throw new Error('Perjalanan Dinas must be linked to a Paket');
    }

    // Validate UP or TUP allocation
    if (!dto.uangPersediaanId && !dto.tupId) {
      throw new Error('Must specify either UP or TUP allocation');
    }

    // Check balance
    if (dto.uangPersediaanId) {
      const up = await prisma.uang_persediaan.findUnique({
        where: { id: dto.uangPersediaanId }
      });
      if (!up) {
        throw new Error('Uang Persediaan not found');
      }
      if (Number(up.sisa) < dto.nilai) {
        throw new Error(`Insufficient UP balance. Available: ${up.sisa}, Requested: ${dto.nilai}`);
      }
    }

    if (dto.tupId) {
      const tup = await prisma.tambahan_uang_persediaan.findUnique({
        where: { id: dto.tupId }
      });
      if (!tup) {
        throw new Error('TUP not found');
      }
      if (Number(tup.sisa) < dto.nilai) {
        throw new Error(`Insufficient TUP balance. Available: ${tup.sisa}, Requested: ${dto.nilai}`);
      }
    }

    // Get workflow stage
    const stage = await prisma.workflow_stage.findFirst({
      where: { kode: 'PERSIAPAN' }
    });

    if (!stage) {
      throw new Error('Workflow stage PERSIAPAN not found');
    }

    // Generate nomor
    const year = new Date().getFullYear();
    const count = await prisma.kuitansi.count({
      where: { nomor: { startsWith: `KUM-${year}` } }
    });
    const nomor = `KUM-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create dokumen
      const dokumen = await tx.dokumen.create({
        data: {
          nomor,
          judul: `Kuitansi Uang Muka - ${dto.uraian.substring(0, 100)}`,
          tipe: DokumenTipe.KUITANSI_UM,
          deskripsi: dto.uraian,
          paket_id: perjalanan.paket_id!,
          workflow_stage_id: stage.id,
          tanggal_dokumen: new Date(),
          created_by: ctx.userId
        }
      });

      // Create kuitansi
      const kuitansi = await tx.kuitansi.create({
        data: {
          nomor,
          uang_persediaan_id: dto.uangPersediaanId,
          tup_id: dto.tupId,
          perjalanan_dinas_id: dto.perjalananDinasId,
          dokumen_id: dokumen.id,
          tanggal: new Date(),
          tipe: KuitansiTipe.UANG_MUKA,
          uraian: dto.uraian,
          nilai: dto.nilai,
          penerima: dto.penerima,
          jenis_belanja: dto.jenisbelanja || 'Perjalanan Dinas',
          status: PembayaranStatus.DRAFT,
          created_by: ctx.userId
        }
      });

      return { kuitansi, dokumen };
    });

    // Log audit
    await AuditService.log({
      tableName: 'kuitansi',
      recordId: result.kuitansi.id,
      action: 'INSERT',
      newValues: result.kuitansi,
      ctx
    });

    return result;
  }

  /**
   * Create Kuitansi Rampung (Settlement)
   * Business Rules:
   * - Must reference a Kuitansi Uang Muka
   * - Auto-calculate selisih (difference)
   * - Creates linked document
   */
  static async createRampung(
    dto: CreateRampungDTO,
    ctx: RequestContext
  ): Promise<any> {
    // Validate perjalanan
    const perjalanan = await prisma.perjalanan_dinas.findUnique({
      where: { id: dto.perjalananDinasId },
      include: { paket: true }
    });

    if (!perjalanan) {
      throw new Error('Perjalanan Dinas not found');
    }

    if (!perjalanan.paket_id) {
      throw new Error('Perjalanan Dinas must be linked to a Paket');
    }

    // Validate Kuitansi Uang Muka
    const kuitansiUm = await prisma.kuitansi.findUnique({
      where: { id: dto.kuitansiUmId }
    });

    if (!kuitansiUm) {
      throw new Error('Kuitansi Uang Muka not found');
    }

    if (kuitansiUm.tipe !== KuitansiTipe.UANG_MUKA) {
      throw new Error('Referenced kuitansi is not an Uang Muka type');
    }

    if (kuitansiUm.perjalanan_dinas_id !== dto.perjalananDinasId) {
      throw new Error('Kuitansi Uang Muka does not belong to this Perjalanan Dinas');
    }

    // Check if rampung already exists for this UM
    const existingRampung = await prisma.kuitansi.findFirst({
      where: {
        kuitansi_um_id: dto.kuitansiUmId,
        tipe: KuitansiTipe.RAMPUNG,
        is_deleted: false
      }
    });

    if (existingRampung) {
      throw new Error('Kuitansi Rampung already exists for this Uang Muka');
    }

    // Calculate selisih
    const nilaiUm = Number(kuitansiUm.nilai);
    const selisih = nilaiUm - dto.nilaiRealisasi;

    // Get workflow stage
    const stage = await prisma.workflow_stage.findFirst({
      where: { kode: 'PEMBAYARAN' }
    });

    if (!stage) {
      throw new Error('Workflow stage PEMBAYARAN not found');
    }

    // Generate nomor
    const year = new Date().getFullYear();
    const count = await prisma.kuitansi.count({
      where: { nomor: { startsWith: `KR-${year}` } }
    });
    const nomor = `KR-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create dokumen
      const dokumen = await tx.dokumen.create({
        data: {
          nomor,
          judul: `Kuitansi Rampung - ${dto.uraian.substring(0, 100)}`,
          tipe: DokumenTipe.KUITANSI_RAMPUNG,
          deskripsi: dto.uraian,
          paket_id: perjalanan.paket_id!,
          workflow_stage_id: stage.id,
          tanggal_dokumen: new Date(),
          created_by: ctx.userId
        }
      });

      // Create kuitansi rampung
      const kuitansi = await tx.kuitansi.create({
        data: {
          nomor,
          uang_persediaan_id: kuitansiUm.uang_persediaan_id,
          tup_id: kuitansiUm.tup_id,
          perjalanan_dinas_id: dto.perjalananDinasId,
          dokumen_id: dokumen.id,
          kuitansi_um_id: dto.kuitansiUmId,
          tanggal: new Date(),
          tipe: KuitansiTipe.RAMPUNG,
          uraian: dto.uraian,
          nilai: dto.nilaiRealisasi,
          nilai_um: nilaiUm,
          nilai_realisasi: dto.nilaiRealisasi,
          selisih: selisih,
          penerima: kuitansiUm.penerima,
          jenis_belanja: kuitansiUm.jenis_belanja,
          bukti_pendukung: dto.buktiPendukung,
          status: PembayaranStatus.DRAFT,
          created_by: ctx.userId
        }
      });

      return { kuitansi, dokumen, selisih };
    });

    // Log audit
    await AuditService.log({
      tableName: 'kuitansi',
      recordId: result.kuitansi.id,
      action: 'INSERT',
      newValues: result.kuitansi,
      ctx
    });

    return result;
  }

  /**
   * Create SPJ (Surat Pertanggungjawaban)
   * Business Rules:
   * - Calculate total UM, realisasi, and balance
   * - Link to workflow instance
   * - Creates linked document
   */
  static async createSPJ(
    dto: CreateSPJDTO,
    ctx: RequestContext
  ): Promise<any> {
    let paketId: string | null = null;
    let workflowInstanceId: string | null = null;
    let totalUm = 0;
    let totalRealisasi = 0;

    // Get data based on jenis
    if (dto.perjalananDinasId) {
      const perjalanan = await prisma.perjalanan_dinas.findUnique({
        where: { id: dto.perjalananDinasId },
        include: {
          paket: true,
          workflow_instance: true,
          kuitansi: {
            where: { is_deleted: false }
          }
        }
      });

      if (!perjalanan) {
        throw new Error('Perjalanan Dinas not found');
      }

      paketId = perjalanan.paket_id;
      workflowInstanceId = perjalanan.workflow_instance_id;

      // Calculate totals from kuitansi
      for (const k of perjalanan.kuitansi) {
        if (k.tipe === KuitansiTipe.UANG_MUKA) {
          totalUm += Number(k.nilai);
        }
        if (k.tipe === KuitansiTipe.RAMPUNG) {
          totalRealisasi += Number(k.nilai_realisasi || k.nilai);
        }
      }
    }

    if (dto.uangPersediaanId) {
      const up = await prisma.uang_persediaan.findUnique({
        where: { id: dto.uangPersediaanId },
        include: { paket: true }
      });

      if (!up) {
        throw new Error('Uang Persediaan not found');
      }

      paketId = paketId || up.paket_id;
      totalUm = Number(up.nilai);
      totalRealisasi = Number(up.nilai) - Number(up.sisa);
    }

    if (!paketId) {
      throw new Error('Cannot determine Paket for SPJ');
    }

    // Get workflow stage
    const stage = await prisma.workflow_stage.findFirst({
      where: { kode: 'PEMBAYARAN' }
    });

    if (!stage) {
      throw new Error('Workflow stage PEMBAYARAN not found');
    }

    // Calculate balance
    const sisaLebih = totalUm > totalRealisasi ? totalUm - totalRealisasi : 0;
    const sisaKurang = totalRealisasi > totalUm ? totalRealisasi - totalUm : 0;

    // Determine document type
    const dokumenTipe = dto.jenis === 'SPJ_TUP' ? DokumenTipe.SPJ_TUP : DokumenTipe.SPJ_UP;

    // Generate nomor
    const year = new Date().getFullYear();
    const prefix = dto.jenis === 'SPJ_TUP' ? 'SPJ-TUP' : 'SPJ-UP';
    const count = await prisma.pertanggungjawaban.count({
      where: { nomor: { startsWith: `${prefix}-${year}` } }
    });
    const nomor = `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create dokumen
      const dokumen = await tx.dokumen.create({
        data: {
          nomor,
          judul: `${dto.jenis} - ${nomor}`,
          tipe: dokumenTipe,
          deskripsi: `Surat Pertanggungjawaban ${dto.jenis}`,
          paket_id: paketId!,
          workflow_stage_id: stage.id,
          tanggal_dokumen: new Date(),
          created_by: ctx.userId
        }
      });

      // Create SPJ
      const spj = await tx.pertanggungjawaban.create({
        data: {
          nomor,
          uang_persediaan_id: dto.uangPersediaanId,
          tup_id: dto.tupId,
          perjalanan_dinas_id: dto.perjalananDinasId,
          kuitansi_id: dto.kuitansiId,
          workflow_instance_id: workflowInstanceId,
          tanggal: new Date(),
          jenis: dto.jenis,
          total_nilai: totalUm,
          total_um: totalUm,
          total_realisasi: totalRealisasi,
          sisa_lebih: sisaLebih,
          sisa_kurang: sisaKurang,
          status: SPJStatus.DRAFT,
          created_by: ctx.userId
        }
      });

      return { spj, dokumen };
    });

    // Log audit
    await AuditService.log({
      tableName: 'pertanggungjawaban',
      recordId: result.spj.id,
      action: 'INSERT',
      newValues: result.spj,
      ctx
    });

    return result;
  }

  /**
   * Get Treasury Balance Summary
   */
  static async getTreasuryBalance(paketId?: string): Promise<any> {
    const where = paketId ? { paket_id: paketId, is_deleted: false } : { is_deleted: false };

    const upList = await prisma.uang_persediaan.findMany({
      where,
      include: {
        tambahan_up: {
          where: { is_deleted: false }
        },
        paket: true
      }
    });

    return upList.map(up => ({
      id: up.id,
      nomor: up.nomor,
      treasury_type: up.treasury_type,
      nilai_awal: up.nilai,
      saldo_up: up.sisa,
      total_tup: up.tambahan_up.reduce((sum, t) => sum + Number(t.nilai), 0),
      saldo_tup: up.tambahan_up.reduce((sum, t) => sum + Number(t.sisa), 0),
      total_saldo: Number(up.sisa) + up.tambahan_up.reduce((sum, t) => sum + Number(t.sisa), 0),
      status: up.status,
      paket_kode: up.paket?.kode,
      paket_nama: up.paket?.nama
    }));
  }
}
