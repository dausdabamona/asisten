// =============================================================================
// ASISTEN Phase 3: Pembayaran (Payment) Service
// Handles SPP, SPM, SP2D operations
// =============================================================================

import { PrismaClient, SPPStatus, SPMStatus, SP2DStatus } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// SPP - Surat Permintaan Pembayaran
// =============================================================================

export interface CreateSPPInput {
  nomor: string;
  paket_id: string;
  kontrak_id?: string;
  bast_id?: string;
  tanggal_spp: Date;
  jenis_spp: 'LS' | 'UP' | 'TUP' | 'GUP';
  nilai_tagihan: number;
  nilai_ppn?: number;
  nilai_pph?: number;
  ppk_id?: string;
  catatan?: string;
  details?: SPPDetailInput[];
  created_by: string;
}

export interface SPPDetailInput {
  uraian: string;
  volume?: number;
  satuan?: string;
  harga_satuan?: number;
  jumlah: number;
}

export async function createSPP(input: CreateSPPInput) {
  // For LS (direct payment), verify BAST is accepted
  if (input.jenis_spp === 'LS' && input.bast_id) {
    const bast = await prisma.bast.findUnique({ where: { id: input.bast_id } });
    if (!bast || bast.status !== 'DITERIMA') {
      throw new Error('SPP-LS requires an accepted BAST (status = DITERIMA)');
    }
  }

  // Calculate deductions
  const nilai_potongan = (input.nilai_ppn || 0) + (input.nilai_pph || 0);
  const nilai_bersih = input.nilai_tagihan - nilai_potongan;

  // Create document entry
  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: `SPP ${input.jenis_spp} - ${input.nomor}`,
      tipe: 'SPP',
      deskripsi: `Surat Permintaan Pembayaran ${input.jenis_spp}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('PEMBAYARAN'),
      tanggal_dokumen: input.tanggal_spp,
      created_by: input.created_by,
    },
  });

  // Create SPP
  const spp = await prisma.spp.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      kontrak_id: input.kontrak_id,
      bast_id: input.bast_id,
      dokumen_id: dokumen.id,
      tanggal_spp: input.tanggal_spp,
      jenis_spp: input.jenis_spp,
      nilai_tagihan: input.nilai_tagihan,
      nilai_ppn: input.nilai_ppn,
      nilai_pph: input.nilai_pph,
      nilai_potongan: nilai_potongan,
      nilai_bersih: nilai_bersih,
      ppk_id: input.ppk_id,
      status: 'DRAFT',
      catatan: input.catatan,
      created_by: input.created_by,
    },
  });

  // Create SPP details
  if (input.details && input.details.length > 0) {
    await prisma.spp_detail.createMany({
      data: input.details.map((detail, index) => ({
        spp_id: spp.id,
        urutan: index + 1,
        uraian: detail.uraian,
        volume: detail.volume,
        satuan: detail.satuan,
        harga_satuan: detail.harga_satuan,
        jumlah: detail.jumlah,
        created_by: input.created_by,
      })),
    });
  }

  return prisma.spp.findUnique({
    where: { id: spp.id },
    include: {
      paket: true,
      kontrak: true,
      bast: true,
      dokumen: true,
      spp_detail: true,
      potongan_pajak: true,
    },
  });
}

export async function submitSPP(sppId: string, userId: string) {
  return prisma.spp.update({
    where: { id: sppId },
    data: {
      status: 'DIAJUKAN',
      updated_by: userId,
    },
  });
}

export async function verifySPP(sppId: string, userId: string) {
  return prisma.spp.update({
    where: { id: sppId },
    data: {
      status: 'DIVERIFIKASI',
      updated_by: userId,
    },
  });
}

export async function approveSPP(sppId: string, userId: string) {
  return prisma.spp.update({
    where: { id: sppId },
    data: {
      status: 'APPROVED',
      updated_by: userId,
    },
  });
}

export async function rejectSPP(sppId: string, userId: string, catatan: string) {
  return prisma.spp.update({
    where: { id: sppId },
    data: {
      status: 'REJECTED',
      catatan: catatan,
      updated_by: userId,
    },
  });
}

// =============================================================================
// TAX CALCULATION
// =============================================================================

export interface AddTaxInput {
  spp_id: string;
  jenis_pajak: 'PPN' | 'PPh21' | 'PPh22' | 'PPh23' | 'PPh4(2)';
  dasar_pajak: number;
  tarif: number;
  npwp?: string;
  nama_wp?: string;
  catatan?: string;
  created_by: string;
}

export async function addTaxDeduction(input: AddTaxInput) {
  const nilai_pajak = (input.dasar_pajak * input.tarif) / 100;

  const tax = await prisma.potongan_pajak.create({
    data: {
      spp_id: input.spp_id,
      jenis_pajak: input.jenis_pajak,
      dasar_pajak: input.dasar_pajak,
      tarif: input.tarif,
      nilai_pajak: nilai_pajak,
      npwp: input.npwp,
      nama_wp: input.nama_wp,
      catatan: input.catatan,
      created_by: input.created_by,
    },
  });

  // Update SPP totals
  await recalculateSPPTotals(input.spp_id);

  return tax;
}

async function recalculateSPPTotals(sppId: string) {
  const taxes = await prisma.potongan_pajak.findMany({
    where: { spp_id: sppId, is_deleted: false },
  });

  const spp = await prisma.spp.findUnique({ where: { id: sppId } });
  if (!spp) return;

  const ppnTotal = taxes
    .filter((t) => t.jenis_pajak === 'PPN')
    .reduce((sum, t) => sum + Number(t.nilai_pajak), 0);

  const pphTotal = taxes
    .filter((t) => t.jenis_pajak.startsWith('PPh'))
    .reduce((sum, t) => sum + Number(t.nilai_pajak), 0);

  const nilai_potongan = ppnTotal + pphTotal;
  const nilai_bersih = Number(spp.nilai_tagihan) - nilai_potongan;

  await prisma.spp.update({
    where: { id: sppId },
    data: {
      nilai_ppn: ppnTotal,
      nilai_pph: pphTotal,
      nilai_potongan: nilai_potongan,
      nilai_bersih: nilai_bersih,
    },
  });
}

// =============================================================================
// SPM - Surat Perintah Membayar
// =============================================================================

export interface CreateSPMInput {
  nomor: string;
  paket_id: string;
  spp_id: string;
  tanggal_spm: Date;
  kuasa_pa_id?: string;
  catatan?: string;
  created_by: string;
}

export async function createSPM(input: CreateSPMInput) {
  // Verify SPP is approved
  const spp = await prisma.spp.findUnique({ where: { id: input.spp_id } });
  if (!spp || spp.status !== 'APPROVED') {
    throw new Error('SPM requires an approved SPP');
  }

  // Create document entry
  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: `SPM ${spp.jenis_spp} - ${input.nomor}`,
      tipe: 'SPM',
      deskripsi: `Surat Perintah Membayar untuk SPP ${spp.nomor}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('PEMBAYARAN'),
      tanggal_dokumen: input.tanggal_spm,
      created_by: input.created_by,
    },
  });

  const spm = await prisma.spm.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      spp_id: input.spp_id,
      dokumen_id: dokumen.id,
      tanggal_spm: input.tanggal_spm,
      jenis_spm: spp.jenis_spp,
      nilai_spm: spp.nilai_bersih,
      kuasa_pa_id: input.kuasa_pa_id,
      status: 'DRAFT',
      catatan: input.catatan,
      created_by: input.created_by,
    },
    include: {
      paket: true,
      spp: true,
      dokumen: true,
    },
  });

  return spm;
}

export async function issueSPM(spmId: string, userId: string) {
  const spm = await prisma.spm.update({
    where: { id: spmId },
    data: {
      status: 'TERBIT',
      updated_by: userId,
    },
  });

  // Update SPP status
  await prisma.spp.update({
    where: { id: spm.spp_id },
    data: {
      status: 'TERBIT_SPM',
      updated_by: userId,
    },
  });

  return spm;
}

export async function submitSPMForSP2D(spmId: string, userId: string) {
  return prisma.spm.update({
    where: { id: spmId },
    data: {
      status: 'DIAJUKAN_SP2D',
      updated_by: userId,
    },
  });
}

// =============================================================================
// SP2D - Surat Perintah Pencairan Dana
// =============================================================================

export interface CreateSP2DInput {
  nomor: string;
  paket_id: string;
  spm_id: string;
  tanggal_sp2d: Date;
  bank_penerima?: string;
  rekening_penerima?: string;
  nama_penerima?: string;
  kuasa_bud_id?: string;
  catatan?: string;
  created_by: string;
}

export async function createSP2D(input: CreateSP2DInput) {
  // Verify SPM is issued or submitted for SP2D
  const spm = await prisma.spm.findUnique({ where: { id: input.spm_id } });
  if (!spm || !['TERBIT', 'DIAJUKAN_SP2D'].includes(spm.status)) {
    throw new Error('SP2D requires a valid SPM (status = TERBIT or DIAJUKAN_SP2D)');
  }

  // Get rekening penyedia if kontrak exists
  let rekeningInfo = {
    bank_penerima: input.bank_penerima,
    rekening_penerima: input.rekening_penerima,
    nama_penerima: input.nama_penerima,
  };

  if (!rekeningInfo.rekening_penerima) {
    const spp = await prisma.spp.findUnique({
      where: { id: spm.spp_id },
      include: { kontrak: true },
    });

    if (spp?.kontrak_id) {
      const rekening = await prisma.rekening_penyedia.findFirst({
        where: { kontrak_id: spp.kontrak_id, is_primary: true, is_deleted: false },
      });

      if (rekening) {
        rekeningInfo = {
          bank_penerima: rekening.nama_bank,
          rekening_penerima: rekening.nomor_rekening,
          nama_penerima: rekening.nama_rekening,
        };
      }
    }
  }

  // Create document entry
  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: `SP2D - ${input.nomor}`,
      tipe: 'SP2D',
      deskripsi: `Surat Perintah Pencairan Dana untuk SPM ${spm.nomor}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('PEMBAYARAN'),
      tanggal_dokumen: input.tanggal_sp2d,
      created_by: input.created_by,
    },
  });

  return prisma.sp2d.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      spm_id: input.spm_id,
      dokumen_id: dokumen.id,
      tanggal_sp2d: input.tanggal_sp2d,
      nilai_sp2d: spm.nilai_spm,
      bank_penerima: rekeningInfo.bank_penerima,
      rekening_penerima: rekeningInfo.rekening_penerima,
      nama_penerima: rekeningInfo.nama_penerima,
      kuasa_bud_id: input.kuasa_bud_id,
      status: 'DRAFT',
      catatan: input.catatan,
      created_by: input.created_by,
    },
    include: {
      paket: true,
      spm: { include: { spp: true } },
      dokumen: true,
    },
  });
}

export async function issueSP2D(sp2dId: string, userId: string) {
  return prisma.sp2d.update({
    where: { id: sp2dId },
    data: {
      status: 'TERBIT',
      updated_by: userId,
    },
  });
}

export async function disburseSP2D(sp2dId: string, tanggal_cair: Date, userId: string) {
  const sp2d = await prisma.sp2d.update({
    where: { id: sp2dId },
    data: {
      status: 'DICAIRKAN',
      tanggal_cair: tanggal_cair,
      updated_by: userId,
    },
  });

  return sp2d;
}

export async function completeSP2D(sp2dId: string, userId: string) {
  const sp2d = await prisma.sp2d.update({
    where: { id: sp2dId },
    data: {
      status: 'SELESAI',
      updated_by: userId,
    },
  });

  // Update SPM status
  await prisma.spm.update({
    where: { id: sp2d.spm_id },
    data: {
      status: 'SELESAI',
      updated_by: userId,
    },
  });

  return sp2d;
}

// =============================================================================
// Payment Status & Summary
// =============================================================================

export async function getPaymentStatus(paketId: string) {
  const [spp, spm, sp2d] = await Promise.all([
    prisma.spp.findFirst({
      where: { paket_id: paketId, is_deleted: false },
      orderBy: { created_at: 'desc' },
    }),
    prisma.spm.findFirst({
      where: { paket_id: paketId, is_deleted: false },
      orderBy: { created_at: 'desc' },
    }),
    prisma.sp2d.findFirst({
      where: { paket_id: paketId, is_deleted: false },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  return {
    spp: spp
      ? {
          id: spp.id,
          nomor: spp.nomor,
          status: spp.status,
          nilai_tagihan: spp.nilai_tagihan,
          nilai_bersih: spp.nilai_bersih,
        }
      : null,
    spm: spm
      ? {
          id: spm.id,
          nomor: spm.nomor,
          status: spm.status,
          nilai_spm: spm.nilai_spm,
        }
      : null,
    sp2d: sp2d
      ? {
          id: sp2d.id,
          nomor: sp2d.nomor,
          status: sp2d.status,
          nilai_sp2d: sp2d.nilai_sp2d,
          tanggal_cair: sp2d.tanggal_cair,
        }
      : null,
  };
}

export async function getPaymentSummary(paketId: string) {
  const kontrak = await prisma.kontrak.findFirst({
    where: { paket_id: paketId, is_deleted: false },
  });

  const sp2dList = await prisma.sp2d.findMany({
    where: { paket_id: paketId, status: 'SELESAI', is_deleted: false },
  });

  const totalDisbursed = sp2dList.reduce((sum, s) => sum + Number(s.nilai_sp2d), 0);
  const nilaiKontrak = kontrak ? Number(kontrak.nilai_kontrak) : 0;
  const sisaKontrak = nilaiKontrak - totalDisbursed;

  return {
    nilai_kontrak: nilaiKontrak,
    total_disbursed: totalDisbursed,
    sisa_kontrak: sisaKontrak,
    jumlah_sp2d: sp2dList.length,
    persentase_pembayaran: nilaiKontrak > 0 ? (totalDisbursed / nilaiKontrak) * 100 : 0,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

async function getStageId(kode: string): Promise<string> {
  const stage = await prisma.workflow_stage.findFirst({
    where: { kode: kode as any },
  });
  if (!stage) {
    throw new Error(`Workflow stage ${kode} not found`);
  }
  return stage.id;
}
