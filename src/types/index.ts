/**
 * ASISTEN - Phase 2: Type Definitions
 */

import { Decimal } from '@prisma/client/runtime/library';

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
