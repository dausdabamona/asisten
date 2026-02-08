/**
 * ASISTEN - Permissions & Role Configuration
 * Defines built-in roles and permission groups for role management
 */

export const BUILTIN_ROLES = ['ADMIN', 'KPA', 'PPK', 'PPSPM', 'OPERATOR'];

export const PERMISSION_GROUPS: Record<string, string[]> = {
  'Paket Pekerjaan': ['paket:read', 'paket:create', 'paket:update', 'paket:delete'],
  'Dokumen': ['dokumen:read', 'dokumen:create', 'dokumen:update', 'dokumen:delete', 'dokumen:export'],
  'Permintaan': ['permintaan:read', 'permintaan:create', 'permintaan:update', 'permintaan:delete'],
  'Perjalanan Dinas': ['perjalanan:read', 'perjalanan:create', 'perjalanan:update', 'perjalanan:delete'],
  'Keuangan': ['keuangan:read', 'keuangan:create', 'keuangan:update'],
  'Kepanitiaan': ['kepanitiaan:read', 'kepanitiaan:create', 'kepanitiaan:update'],
  'Honorarium': ['honorarium:read', 'honorarium:create', 'honorarium:update'],
  'SK': ['sk:read', 'sk:create', 'sk:update'],
  'Master Data': ['master:read', 'master:create', 'master:update', 'master:delete'],
  'HPS': ['hps:read', 'hps:create', 'hps:update', 'hps:delete'],
  'Approval': ['approval:approve', 'workflow:transition'],
  'Administrasi': ['user:manage', 'role:manage', 'template:manage', 'audit:read', 'settings:manage'],
};

// Human-readable labels for permissions
export const PERMISSION_LABELS: Record<string, string> = {
  'paket:read': 'Lihat',
  'paket:create': 'Buat',
  'paket:update': 'Edit',
  'paket:delete': 'Hapus',
  'dokumen:read': 'Lihat',
  'dokumen:create': 'Buat',
  'dokumen:update': 'Edit',
  'dokumen:delete': 'Hapus',
  'dokumen:export': 'Ekspor',
  'permintaan:read': 'Lihat',
  'permintaan:create': 'Buat',
  'permintaan:update': 'Edit',
  'permintaan:delete': 'Hapus',
  'perjalanan:read': 'Lihat',
  'perjalanan:create': 'Buat',
  'perjalanan:update': 'Edit',
  'perjalanan:delete': 'Hapus',
  'keuangan:read': 'Lihat',
  'keuangan:create': 'Buat',
  'keuangan:update': 'Edit',
  'kepanitiaan:read': 'Lihat',
  'kepanitiaan:create': 'Buat',
  'kepanitiaan:update': 'Edit',
  'honorarium:read': 'Lihat',
  'honorarium:create': 'Buat',
  'honorarium:update': 'Edit',
  'sk:read': 'Lihat',
  'sk:create': 'Buat',
  'sk:update': 'Edit',
  'master:read': 'Lihat',
  'master:create': 'Buat',
  'master:update': 'Edit',
  'master:delete': 'Hapus',
  'hps:read': 'Lihat',
  'hps:create': 'Buat',
  'hps:update': 'Edit',
  'hps:delete': 'Hapus',
  'approval:approve': 'Approve',
  'workflow:transition': 'Transisi Workflow',
  'user:manage': 'Kelola User',
  'role:manage': 'Kelola Role',
  'template:manage': 'Kelola Template',
  'audit:read': 'Lihat Audit Log',
  'settings:manage': 'Kelola Pengaturan',
};

// All permissions flat list
export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat();
