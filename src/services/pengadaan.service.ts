// =============================================================================
// ASISTEN Phase 3: Pengadaan (Procurement) Service
// Handles KAK, HPS, Kontrak, SPMK operations
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { KAKStatus, HPSStatus, KontrakStatus, SPMKStatus } from '../types';

const prisma = new PrismaClient();

// =============================================================================
// KAK - Kerangka Acuan Kerja
// =============================================================================

export interface CreateKAKInput {
  nomor: string;
  paket_id: string;
  judul: string;
  latar_belakang?: string;
  maksud_tujuan?: string;
  sasaran?: string;
  ruang_lingkup?: string;
  keluaran?: string;
  jangka_waktu?: number;
  spesifikasi?: any;
  jenis_pengadaan?: 'BARANG' | 'JASA_KONSULTANSI' | 'JASA_LAINNYA' | 'PEKERJAAN_KONSTRUKSI';
  metode_pengadaan?: 'PENGADAAN_LANGSUNG' | 'PENUNJUKAN_LANGSUNG' | 'TENDER' | 'SELEKSI' | 'E_PURCHASING';
  nilai_pagu: number;
  ppk_id?: string;
  tanggal_kak: Date;
  created_by: string;
}

export async function createKAK(input: CreateKAKInput) {
  // Create document entry
  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: input.judul,
      tipe: 'KAK',
      deskripsi: `Kerangka Acuan Kerja: ${input.judul}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('PERENCANAAN'),
      tanggal_dokumen: input.tanggal_kak,
      created_by: input.created_by,
    },
  });

  const kak = await prisma.kak.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      dokumen_id: dokumen.id,
      judul: input.judul,
      latar_belakang: input.latar_belakang,
      maksud_tujuan: input.maksud_tujuan,
      sasaran: input.sasaran,
      ruang_lingkup: input.ruang_lingkup,
      keluaran: input.keluaran,
      jangka_waktu: input.jangka_waktu,
      spesifikasi: input.spesifikasi,
      jenis_pengadaan: input.jenis_pengadaan,
      metode_pengadaan: input.metode_pengadaan,
      nilai_pagu: input.nilai_pagu,
      ppk_id: input.ppk_id,
      status: 'DRAFT',
      tanggal_kak: input.tanggal_kak,
      created_by: input.created_by,
    },
    include: {
      paket: true,
      dokumen: true,
      ppk: { select: { id: true, nama: true, jabatan: true } },
    },
  });

  return kak;
}

export async function submitKAK(kakId: string, userId: string) {
  return prisma.kak.update({
    where: { id: kakId },
    data: {
      status: 'MENUNGGU_APPROVAL',
      updated_by: userId,
    },
  });
}

export async function approveKAK(kakId: string, userId: string) {
  return prisma.kak.update({
    where: { id: kakId },
    data: {
      status: 'APPROVED',
      updated_by: userId,
    },
  });
}

export async function finalizeKAK(kakId: string, userId: string) {
  return prisma.kak.update({
    where: { id: kakId },
    data: {
      status: 'FINAL',
      updated_by: userId,
    },
  });
}

export async function getKAK(kakId: string) {
  return prisma.kak.findUnique({
    where: { id: kakId },
    include: {
      paket: true,
      dokumen: { include: { versi: true } },
      ppk: { select: { id: true, nama: true, jabatan: true } },
      hps: true,
    },
  });
}

// =============================================================================
// HPS - Harga Perkiraan Sendiri
// =============================================================================

export interface CreateHPSInput {
  nomor: string;
  paket_id: string;
  kak_id: string;
  tanggal_hps: Date;
  nilai_hps: number;
  komponen_biaya?: any;
  dasar_penyusun?: string;
  penyusun_id?: string;
  catatan?: string;
  created_by: string;
}

export async function createHPS(input: CreateHPSInput) {
  // Verify KAK is approved/final
  const kak = await prisma.kak.findUnique({ where: { id: input.kak_id } });
  if (!kak || !['APPROVED', 'FINAL'].includes(kak.status)) {
    throw new Error('HPS requires an approved KAK');
  }

  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: `HPS - ${kak.judul}`,
      tipe: 'HPS',
      deskripsi: `Harga Perkiraan Sendiri untuk ${kak.judul}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('PERENCANAAN'),
      tanggal_dokumen: input.tanggal_hps,
      created_by: input.created_by,
    },
  });

  return prisma.hps.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      kak_id: input.kak_id,
      dokumen_id: dokumen.id,
      tanggal_hps: input.tanggal_hps,
      nilai_hps: input.nilai_hps,
      komponen_biaya: input.komponen_biaya,
      dasar_penyusun: input.dasar_penyusun,
      penyusun_id: input.penyusun_id,
      status: 'DRAFT',
      catatan: input.catatan,
      created_by: input.created_by,
    },
    include: {
      paket: true,
      kak: true,
      dokumen: true,
      penyusun: { select: { id: true, nama: true, jabatan: true } },
    },
  });
}

export async function approveHPS(hpsId: string, userId: string) {
  return prisma.hps.update({
    where: { id: hpsId },
    data: {
      status: 'APPROVED',
      updated_by: userId,
    },
  });
}

// =============================================================================
// KONTRAK
// =============================================================================

export interface CreateKontrakInput {
  nomor: string;
  paket_id: string;
  rancangan_kontrak_id?: string;
  judul: string;
  nama_penyedia: string;
  alamat_penyedia?: string;
  npwp_penyedia?: string;
  nilai_kontrak: number;
  nilai_ppn?: number;
  nilai_pph?: number;
  tanggal_kontrak: Date;
  tanggal_mulai?: Date;
  tanggal_selesai?: Date;
  jangka_waktu?: number;
  ppk_id?: string;
  catatan?: string;
  created_by: string;
}

export async function createKontrak(input: CreateKontrakInput) {
  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: input.judul,
      tipe: 'KONTRAK',
      deskripsi: `Kontrak dengan ${input.nama_penyedia}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('KONTRAK'),
      tanggal_dokumen: input.tanggal_kontrak,
      created_by: input.created_by,
    },
  });

  return prisma.kontrak.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      rancangan_kontrak_id: input.rancangan_kontrak_id,
      dokumen_id: dokumen.id,
      judul: input.judul,
      nama_penyedia: input.nama_penyedia,
      alamat_penyedia: input.alamat_penyedia,
      npwp_penyedia: input.npwp_penyedia,
      nilai_kontrak: input.nilai_kontrak,
      nilai_ppn: input.nilai_ppn,
      nilai_pph: input.nilai_pph,
      tanggal_kontrak: input.tanggal_kontrak,
      tanggal_mulai: input.tanggal_mulai,
      tanggal_selesai: input.tanggal_selesai,
      jangka_waktu: input.jangka_waktu,
      ppk_id: input.ppk_id,
      status: 'DRAFT',
      catatan: input.catatan,
      created_by: input.created_by,
    },
    include: {
      paket: true,
      dokumen: true,
      ppk: { select: { id: true, nama: true, jabatan: true } },
    },
  });
}

export async function activateKontrak(kontrakId: string, userId: string) {
  return prisma.kontrak.update({
    where: { id: kontrakId },
    data: {
      status: 'AKTIF',
      updated_by: userId,
    },
  });
}

export async function uploadSignedKontrak(
  kontrakId: string,
  versionData: {
    file_path: string;
    file_name: string;
    signed_by_name: string;
    signed_by_role: string;
    signed_date: Date;
    signed_file_path: string;
    signed_file_hash: string;
  },
  userId: string
) {
  const kontrak = await prisma.kontrak.findUnique({
    where: { id: kontrakId },
    include: { dokumen: true },
  });

  if (!kontrak || !kontrak.dokumen_id) {
    throw new Error('Kontrak or dokumen not found');
  }

  // Create new document version with signed info
  const currentVersion = await prisma.dokumen_versi.count({
    where: { dokumen_id: kontrak.dokumen_id },
  });

  await prisma.dokumen_versi.updateMany({
    where: { dokumen_id: kontrak.dokumen_id },
    data: { is_current: false },
  });

  const newVersion = await prisma.dokumen_versi.create({
    data: {
      dokumen_id: kontrak.dokumen_id,
      versi: currentVersion + 1,
      file_path: versionData.file_path,
      file_name: versionData.file_name,
      is_current: true,
      signed_by_name: versionData.signed_by_name,
      signed_by_role: versionData.signed_by_role,
      signed_date: versionData.signed_date,
      signed_method: 'MANUAL_SCAN',
      signed_file_path: versionData.signed_file_path,
      signed_file_hash: versionData.signed_file_hash,
      created_by: userId,
    },
  });

  // Update kontrak status
  await prisma.kontrak.update({
    where: { id: kontrakId },
    data: {
      status: 'MENUNGGU_TTD',
      updated_by: userId,
    },
  });

  return newVersion;
}

// =============================================================================
// SPMK - Surat Perintah Mulai Kerja
// =============================================================================

export interface CreateSPMKInput {
  nomor: string;
  paket_id: string;
  kontrak_id: string;
  tanggal_spmk: Date;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  ppk_id?: string;
  catatan?: string;
  created_by: string;
}

export async function createSPMK(input: CreateSPMKInput) {
  // Verify kontrak is active
  const kontrak = await prisma.kontrak.findUnique({ where: { id: input.kontrak_id } });
  if (!kontrak || kontrak.status !== 'AKTIF') {
    throw new Error('SPMK requires an active (signed) contract');
  }

  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: `SPMK - ${kontrak.judul}`,
      tipe: 'SPMK',
      deskripsi: `Surat Perintah Mulai Kerja untuk ${kontrak.judul}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('KONTRAK'),
      tanggal_dokumen: input.tanggal_spmk,
      created_by: input.created_by,
    },
  });

  return prisma.spmk.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      kontrak_id: input.kontrak_id,
      dokumen_id: dokumen.id,
      tanggal_spmk: input.tanggal_spmk,
      tanggal_mulai: input.tanggal_mulai,
      tanggal_selesai: input.tanggal_selesai,
      ppk_id: input.ppk_id,
      status: 'DRAFT',
      catatan: input.catatan,
      created_by: input.created_by,
    },
    include: {
      paket: true,
      kontrak: true,
      dokumen: true,
      ppk: { select: { id: true, nama: true, jabatan: true } },
    },
  });
}

export async function issueSPMK(spmkId: string, userId: string) {
  return prisma.spmk.update({
    where: { id: spmkId },
    data: {
      status: 'TERBIT',
      updated_by: userId,
    },
  });
}

// =============================================================================
// BAST - Berita Acara Serah Terima
// =============================================================================

export interface CreateBASTInput {
  nomor: string;
  paket_id: string;
  kontrak_id: string;
  bahp_id?: string;
  tanggal_bast: Date;
  jenis_serah: 'PHO' | 'FHO';
  uraian_pekerjaan?: string;
  nilai_pekerjaan: number;
  ppk_id?: string;
  penerima_id?: string;
  catatan?: string;
  created_by: string;
}

export async function createBAST(input: CreateBASTInput) {
  // If BAHP is provided, verify it's valid
  if (input.bahp_id) {
    const bahp = await prisma.bahp.findUnique({ where: { id: input.bahp_id } });
    if (!bahp || !bahp.sesuai_kontrak) {
      throw new Error('BAST requires an approved BAHP (sesuai_kontrak = true)');
    }
  }

  const dokumen = await prisma.dokumen.create({
    data: {
      nomor: `DOK-${input.nomor}`,
      judul: `BAST ${input.jenis_serah} - Kontrak ${input.kontrak_id}`,
      tipe: 'BAST',
      deskripsi: `Berita Acara Serah Terima ${input.jenis_serah}`,
      paket_id: input.paket_id,
      workflow_stage_id: await getStageId('PELAKSANAAN'),
      tanggal_dokumen: input.tanggal_bast,
      created_by: input.created_by,
    },
  });

  return prisma.bast.create({
    data: {
      nomor: input.nomor,
      paket_id: input.paket_id,
      kontrak_id: input.kontrak_id,
      bahp_id: input.bahp_id,
      dokumen_id: dokumen.id,
      tanggal_bast: input.tanggal_bast,
      jenis_serah: input.jenis_serah,
      uraian_pekerjaan: input.uraian_pekerjaan,
      nilai_pekerjaan: input.nilai_pekerjaan,
      ppk_id: input.ppk_id,
      penerima_id: input.penerima_id,
      status: 'DRAFT',
      catatan: input.catatan,
      created_by: input.created_by,
    },
    include: {
      paket: true,
      kontrak: true,
      bahp: true,
      dokumen: true,
    },
  });
}

export async function acceptBAST(bastId: string, userId: string) {
  return prisma.bast.update({
    where: { id: bastId },
    data: {
      status: 'DITERIMA',
      updated_by: userId,
    },
  });
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

export async function getProcurementStatus(paketId: string) {
  const [kak, hps, kontrak, spmk, bast] = await Promise.all([
    prisma.kak.findFirst({ where: { paket_id: paketId, is_deleted: false } }),
    prisma.hps.findFirst({ where: { paket_id: paketId, is_deleted: false } }),
    prisma.kontrak.findFirst({ where: { paket_id: paketId, is_deleted: false } }),
    prisma.spmk.findFirst({ where: { paket_id: paketId, is_deleted: false } }),
    prisma.bast.findFirst({ where: { paket_id: paketId, is_deleted: false } }),
  ]);

  return {
    kak: kak ? { id: kak.id, nomor: kak.nomor, status: kak.status } : null,
    hps: hps ? { id: hps.id, nomor: hps.nomor, status: hps.status } : null,
    kontrak: kontrak ? { id: kontrak.id, nomor: kontrak.nomor, status: kontrak.status } : null,
    spmk: spmk ? { id: spmk.id, nomor: spmk.nomor, status: spmk.status } : null,
    bast: bast ? { id: bast.id, nomor: bast.nomor, status: bast.status } : null,
  };
}
