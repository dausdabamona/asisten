/**
 * ASISTEN - Phase 2: Type Definitions
 * Enum types defined as string literals for SQLite compatibility
 */

import { Decimal } from '@prisma/client/runtime/library';

// =============================================================================
// ENUM TYPES (SQLite uses strings, so we define as string literal types)
// =============================================================================

// Workflow Enums
export const WorkflowState = {
  PERENCANAAN: 'PERENCANAAN',
  PERSIAPAN: 'PERSIAPAN',
  KONTRAK: 'KONTRAK',
  PELAKSANAAN: 'PELAKSANAAN',
  PEMBAYARAN: 'PEMBAYARAN',
  ARSIP: 'ARSIP',
} as const;
export type WorkflowState = typeof WorkflowState[keyof typeof WorkflowState];

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
} as const;
export type ApprovalStatus = typeof ApprovalStatus[keyof typeof ApprovalStatus];

// Document Enums
export const DokumenTipe = {
  KONTRAK: 'KONTRAK',
  ADENDUM: 'ADENDUM',
  SURAT_TUGAS: 'SURAT_TUGAS',
  SPPD: 'SPPD',
  KUITANSI: 'KUITANSI',
  LAPORAN: 'LAPORAN',
  BERITA_ACARA: 'BERITA_ACARA',
  LAINNYA: 'LAINNYA',
  KUITANSI_UM: 'KUITANSI_UM',
  KUITANSI_RAMPUNG: 'KUITANSI_RAMPUNG',
  LAPORAN_SPPD: 'LAPORAN_SPPD',
  SPJ_UP: 'SPJ_UP',
  SPJ_TUP: 'SPJ_TUP',
  KAK: 'KAK',
  HPS: 'HPS',
  RANCANGAN_KONTRAK: 'RANCANGAN_KONTRAK',
  SSUK: 'SSUK',
  SSKK: 'SSKK',
  SPMK: 'SPMK',
  ADENDUM_KONTRAK: 'ADENDUM_KONTRAK',
  BA_KEMAJUAN: 'BA_KEMAJUAN',
  BAHP: 'BAHP',
  BAST: 'BAST',
  SPP: 'SPP',
  SPM: 'SPM',
  SP2D: 'SP2D',
} as const;
export type DokumenTipe = typeof DokumenTipe[keyof typeof DokumenTipe];

export const DokumenRelasiTipe = {
  ADENDUM: 'ADENDUM',
  REVISI: 'REVISI',
  LAMPIRAN: 'LAMPIRAN',
  REFERENSI: 'REFERENSI',
} as const;
export type DokumenRelasiTipe = typeof DokumenRelasiTipe[keyof typeof DokumenRelasiTipe];

export const DokumenVersiStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  FINAL: 'FINAL',
} as const;
export type DokumenVersiStatus = typeof DokumenVersiStatus[keyof typeof DokumenVersiStatus];

// Travel Enums
export const PerjalananStatus = {
  DRAFT: 'DRAFT',
  DIAJUKAN: 'DIAJUKAN',
  DISETUJUI: 'DISETUJUI',
  BERLANGSUNG: 'BERLANGSUNG',
  SELESAI: 'SELESAI',
  DIBATALKAN: 'DIBATALKAN',
} as const;
export type PerjalananStatus = typeof PerjalananStatus[keyof typeof PerjalananStatus];

export const SuratTugasStatus = {
  DRAFT: 'DRAFT',
  MENUNGGU_APPROVAL: 'MENUNGGU_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FINAL: 'FINAL',
} as const;
export type SuratTugasStatus = typeof SuratTugasStatus[keyof typeof SuratTugasStatus];

export const SppdStatus = {
  DRAFT: 'DRAFT',
  MENUNGGU_ST: 'MENUNGGU_ST',
  TERBIT: 'TERBIT',
  BERLANGSUNG: 'BERLANGSUNG',
  SELESAI: 'SELESAI',
  DIBATALKAN: 'DIBATALKAN',
} as const;
export type SppdStatus = typeof SppdStatus[keyof typeof SppdStatus];

// Treasury Enums
export const TreasuryType = {
  UP: 'UP',
  TUP: 'TUP',
} as const;
export type TreasuryType = typeof TreasuryType[keyof typeof TreasuryType];

export const KuitansiTipe = {
  UANG_MUKA: 'UANG_MUKA',
  RAMPUNG: 'RAMPUNG',
  OPERASIONAL: 'OPERASIONAL',
} as const;
export type KuitansiTipe = typeof KuitansiTipe[keyof typeof KuitansiTipe];

export const PembayaranStatus = {
  DRAFT: 'DRAFT',
  DIAJUKAN: 'DIAJUKAN',
  DIVERIFIKASI: 'DIVERIFIKASI',
  DIBAYAR: 'DIBAYAR',
  DITOLAK: 'DITOLAK',
} as const;
export type PembayaranStatus = typeof PembayaranStatus[keyof typeof PembayaranStatus];

export const SPJStatus = {
  DRAFT: 'DRAFT',
  DIAJUKAN: 'DIAJUKAN',
  DIPERIKSA: 'DIPERIKSA',
  DIVERIFIKASI: 'DIVERIFIKASI',
  DISAHKAN: 'DISAHKAN',
  DITOLAK: 'DITOLAK',
  SELESAI: 'SELESAI',
} as const;
export type SPJStatus = typeof SPJStatus[keyof typeof SPJStatus];

// Procurement Enums
export const KAKStatus = {
  DRAFT: 'DRAFT',
  MENUNGGU_APPROVAL: 'MENUNGGU_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FINAL: 'FINAL',
} as const;
export type KAKStatus = typeof KAKStatus[keyof typeof KAKStatus];

export const HPSStatus = {
  DRAFT: 'DRAFT',
  MENUNGGU_APPROVAL: 'MENUNGGU_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FINAL: 'FINAL',
} as const;
export type HPSStatus = typeof HPSStatus[keyof typeof HPSStatus];

export const KontrakStatus = {
  DRAFT: 'DRAFT',
  NEGOSIASI: 'NEGOSIASI',
  MENUNGGU_TTD: 'MENUNGGU_TTD',
  AKTIF: 'AKTIF',
  SELESAI: 'SELESAI',
  DIBATALKAN: 'DIBATALKAN',
  DIPUTUS: 'DIPUTUS',
} as const;
export type KontrakStatus = typeof KontrakStatus[keyof typeof KontrakStatus];

export const SPMKStatus = {
  DRAFT: 'DRAFT',
  TERBIT: 'TERBIT',
  BERLANGSUNG: 'BERLANGSUNG',
  SELESAI: 'SELESAI',
  DIBATALKAN: 'DIBATALKAN',
} as const;
export type SPMKStatus = typeof SPMKStatus[keyof typeof SPMKStatus];

export const BASTStatus = {
  DRAFT: 'DRAFT',
  DIAJUKAN: 'DIAJUKAN',
  DIPERIKSA: 'DIPERIKSA',
  DIVERIFIKASI: 'DIVERIFIKASI',
  DITERIMA: 'DITERIMA',
  DITOLAK: 'DITOLAK',
} as const;
export type BASTStatus = typeof BASTStatus[keyof typeof BASTStatus];

// Payment Enums
export const SPPStatus = {
  DRAFT: 'DRAFT',
  DIAJUKAN: 'DIAJUKAN',
  DIVERIFIKASI: 'DIVERIFIKASI',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  TERBIT_SPM: 'TERBIT_SPM',
} as const;
export type SPPStatus = typeof SPPStatus[keyof typeof SPPStatus];

export const SPMStatus = {
  DRAFT: 'DRAFT',
  TERBIT: 'TERBIT',
  DIAJUKAN_SP2D: 'DIAJUKAN_SP2D',
  SELESAI: 'SELESAI',
} as const;
export type SPMStatus = typeof SPMStatus[keyof typeof SPMStatus];

export const SP2DStatus = {
  DRAFT: 'DRAFT',
  TERBIT: 'TERBIT',
  DICAIRKAN: 'DICAIRKAN',
  SELESAI: 'SELESAI',
} as const;
export type SP2DStatus = typeof SP2DStatus[keyof typeof SP2DStatus];

export const JenisPengadaan = {
  BARANG: 'BARANG',
  JASA_KONSULTANSI: 'JASA_KONSULTANSI',
  JASA_LAINNYA: 'JASA_LAINNYA',
  PEKERJAAN_KONSTRUKSI: 'PEKERJAAN_KONSTRUKSI',
} as const;
export type JenisPengadaan = typeof JenisPengadaan[keyof typeof JenisPengadaan];

export const MetodePengadaan = {
  PENGADAAN_LANGSUNG: 'PENGADAAN_LANGSUNG',
  PENUNJUKAN_LANGSUNG: 'PENUNJUKAN_LANGSUNG',
  TENDER: 'TENDER',
  SELEKSI: 'SELEKSI',
  E_PURCHASING: 'E_PURCHASING',
} as const;
export type MetodePengadaan = typeof MetodePengadaan[keyof typeof MetodePengadaan];

export const SignedMethod = {
  BASAH_SCAN: 'BASAH_SCAN',
} as const;
export type SignedMethod = typeof SignedMethod[keyof typeof SignedMethod];

// Archive & Backup Enums
export const ArchiveLockReason = {
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  FISCAL_YEAR_CLOSED: 'FISCAL_YEAR_CLOSED',
  LEGAL_HOLD: 'LEGAL_HOLD',
  AUDIT_REQUIREMENT: 'AUDIT_REQUIREMENT',
  ADMIN_LOCK: 'ADMIN_LOCK',
} as const;
export type ArchiveLockReason = typeof ArchiveLockReason[keyof typeof ArchiveLockReason];

export const BackupType = {
  FULL: 'FULL',
  INCREMENTAL: 'INCREMENTAL',
  DIFFERENTIAL: 'DIFFERENTIAL',
} as const;
export type BackupType = typeof BackupType[keyof typeof BackupType];

export const BackupStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  VERIFIED: 'VERIFIED',
} as const;
export type BackupStatus = typeof BackupStatus[keyof typeof BackupStatus];

// Request/Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// SPPD Types

export interface CreateSuratTugasDTO {
  perjalananDinasId: string;
  perihal: string;
  dasar?: string;
  penandaTanganId?: string;
  jabatanPenanda?: string;
  tanggalSurat?: Date;
}

export interface TerbitSppdDTO {
  perjalananDinasId: string;
  pejabatPemberiId?: string;
  jabatanPemberi?: string;
  instansi?: string;
  mataAnggaran?: string;
  keterangan?: string;
}

// Keuangan Types

export interface CreateUangMukaDTO {
  perjalananDinasId: string;
  uangPersediaanId?: string;
  tupId?: string;
  nilai: number;
  uraian: string;
  penerima: string;
  jenisbelanja?: string;
}

export interface CreateRampungDTO {
  perjalananDinasId: string;
  kuitansiUmId: string;
  nilaiRealisasi: number;
  uraian: string;
  buktiPendukung?: string;
}

export interface CreateSPJDTO {
  perjalananDinasId?: string;
  uangPersediaanId?: string;
  tupId?: string;
  kuitansiId?: string;
  jenis: 'SPJ_UP' | 'SPJ_TUP' | 'SPJ_PERDIN';
}

// Workflow Types

export interface ApproveDTO {
  dokumenId: string;
  status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  catatan?: string;
}

export interface TransitionWorkflowDTO {
  workflowInstanceId: string;
  toStageCode: string;
  catatan?: string;
}

// Context Types

export interface RequestContext {
  userId: string;
  userRoles: string[];
  ipAddress?: string;
  userAgent?: string;
}
