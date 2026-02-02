/**
 * ASISTEN - Phase 2: SPPD Service
 * Business logic for Surat Tugas and SPPD operations
 */

import { PrismaClient } from '@prisma/client';
import { SuratTugasStatus, SppdStatus, DokumenTipe } from '../types';
import { CreateSuratTugasDTO, TerbitSppdDTO, RequestContext } from '../types';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class SppdService {
  /**
   * Create Surat Tugas for a Perjalanan Dinas
   * Business Rules:
   * - One perjalanan can only have one surat tugas
   * - Creates linked document in dokumen table
   */
  static async createSuratTugas(
    dto: CreateSuratTugasDTO,
    ctx: RequestContext
  ): Promise<any> {
    // Check if perjalanan exists
    const perjalanan = await prisma.perjalanan_dinas.findUnique({
      where: { id: dto.perjalananDinasId },
      include: { paket: true, surat_tugas: true }
    });

    if (!perjalanan) {
      throw new Error('Perjalanan Dinas not found');
    }

    if (perjalanan.surat_tugas) {
      throw new Error('Surat Tugas already exists for this Perjalanan Dinas');
    }

    if (!perjalanan.paket_id) {
      throw new Error('Perjalanan Dinas must be linked to a Paket');
    }

    // Get PERSIAPAN stage for document
    const stage = await prisma.workflow_stage.findFirst({
      where: { kode: 'PERSIAPAN' }
    });

    if (!stage) {
      throw new Error('Workflow stage PERSIAPAN not found');
    }

    // Generate nomor
    const year = new Date().getFullYear();
    const count = await prisma.surat_tugas.count({
      where: { nomor: { startsWith: `ST-${year}` } }
    });
    const nomor = `ST-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create document and surat tugas in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create dokumen
      const dokumen = await tx.dokumen.create({
        data: {
          nomor,
          judul: `Surat Tugas - ${perjalanan.maksud_perjalanan.substring(0, 100)}`,
          tipe: DokumenTipe.SURAT_TUGAS,
          deskripsi: dto.perihal,
          paket_id: perjalanan.paket_id!,
          workflow_stage_id: stage.id,
          tanggal_dokumen: dto.tanggalSurat || new Date(),
          created_by: ctx.userId
        }
      });

      // Create surat tugas
      const suratTugas = await tx.surat_tugas.create({
        data: {
          nomor,
          perjalanan_dinas_id: dto.perjalananDinasId,
          dokumen_id: dokumen.id,
          tanggal_surat: dto.tanggalSurat || new Date(),
          perihal: dto.perihal,
          dasar: dto.dasar,
          penanda_tangan_id: dto.penandaTanganId,
          jabatan_penanda: dto.jabatanPenanda,
          status: SuratTugasStatus.DRAFT,
          created_by: ctx.userId
        }
      });

      return { suratTugas, dokumen };
    });

    // Log audit
    await AuditService.log({
      tableName: 'surat_tugas',
      recordId: result.suratTugas.id,
      action: 'INSERT',
      newValues: result.suratTugas,
      ctx
    });

    return result;
  }

  /**
   * Terbitkan SPPD
   * Business Rules:
   * - Surat Tugas must be approved first
   * - Creates linked document in dokumen table
   */
  static async terbitSppd(
    dto: TerbitSppdDTO,
    ctx: RequestContext
  ): Promise<any> {
    // Check if perjalanan and surat tugas exist
    const perjalanan = await prisma.perjalanan_dinas.findUnique({
      where: { id: dto.perjalananDinasId },
      include: {
        paket: true,
        surat_tugas: true,
        sppd: true
      }
    });

    if (!perjalanan) {
      throw new Error('Perjalanan Dinas not found');
    }

    if (!perjalanan.surat_tugas) {
      throw new Error('Surat Tugas must be created first');
    }

    if (perjalanan.surat_tugas.status !== SuratTugasStatus.APPROVED &&
        perjalanan.surat_tugas.status !== SuratTugasStatus.FINAL) {
      throw new Error('Surat Tugas must be approved before SPPD can be issued');
    }

    if (perjalanan.sppd && perjalanan.sppd.length > 0) {
      const existingSppd = perjalanan.sppd.find(s => !s.is_deleted);
      if (existingSppd) {
        throw new Error('SPPD already exists for this Perjalanan Dinas');
      }
    }

    if (!perjalanan.paket_id) {
      throw new Error('Perjalanan Dinas must be linked to a Paket');
    }

    // Get PERSIAPAN stage
    const stage = await prisma.workflow_stage.findFirst({
      where: { kode: 'PERSIAPAN' }
    });

    if (!stage) {
      throw new Error('Workflow stage PERSIAPAN not found');
    }

    // Generate nomor
    const year = new Date().getFullYear();
    const count = await prisma.sppd.count({
      where: { nomor: { startsWith: `SPPD-${year}` } }
    });
    const nomor = `SPPD-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create document and SPPD in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create dokumen
      const dokumen = await tx.dokumen.create({
        data: {
          nomor,
          judul: `SPPD - ${perjalanan.maksud_perjalanan.substring(0, 100)}`,
          tipe: DokumenTipe.SPPD,
          deskripsi: `Perjalanan ${perjalanan.kota_asal} - ${perjalanan.kota_tujuan}`,
          paket_id: perjalanan.paket_id!,
          workflow_stage_id: stage.id,
          tanggal_dokumen: new Date(),
          created_by: ctx.userId
        }
      });

      // Create SPPD
      const sppd = await tx.sppd.create({
        data: {
          nomor,
          perjalanan_dinas_id: dto.perjalananDinasId,
          dokumen_id: dokumen.id,
          tanggal_sppd: new Date(),
          pejabat_pemberi_id: dto.pejabatPemberiId,
          jabatan_pemberi: dto.jabatanPemberi,
          instansi: dto.instansi,
          mata_anggaran: dto.mataAnggaran,
          keterangan: dto.keterangan,
          status: SppdStatus.TERBIT,
          created_by: ctx.userId
        }
      });

      // Update surat tugas status to FINAL
      await tx.surat_tugas.update({
        where: { id: perjalanan.surat_tugas!.id },
        data: {
          status: SuratTugasStatus.FINAL,
          updated_by: ctx.userId
        }
      });

      return { sppd, dokumen };
    });

    // Log audit
    await AuditService.log({
      tableName: 'sppd',
      recordId: result.sppd.id,
      action: 'INSERT',
      newValues: result.sppd,
      ctx
    });

    return result;
  }

  /**
   * Get SPPD complete status
   */
  static async getSppdStatus(perjalananId: string): Promise<any> {
    const perjalanan = await prisma.perjalanan_dinas.findUnique({
      where: { id: perjalananId },
      include: {
        paket: true,
        workflow_instance: {
          include: { current_stage: true }
        },
        surat_tugas: {
          include: { dokumen: true }
        },
        sppd: {
          include: { dokumen: true }
        },
        kuitansi: {
          include: { dokumen: true }
        },
        pertanggungjawaban: true,
        peserta: {
          include: { user: true }
        }
      }
    });

    if (!perjalanan) {
      throw new Error('Perjalanan Dinas not found');
    }

    return perjalanan;
  }
}
