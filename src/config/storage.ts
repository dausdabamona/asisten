/**
 * ASISTEN - Storage Configuration
 * Resolves DATA_PATH from .env, auto-creates directories
 */

import path from 'path';
import fs from 'fs';

// Base data path - configurable via .env
const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.resolve(__dirname, '../..');

export const STORAGE = {
  DATA_PATH,
  DATABASE_PATH: path.join(DATA_PATH, 'prisma', 'database.db'),
  UPLOAD_PATH: path.join(DATA_PATH, process.env.UPLOAD_PATH || 'uploads'),
  DOKUMEN_PAKET_PATH: path.join(DATA_PATH, process.env.UPLOAD_PATH || 'uploads', 'dokumen_paket'),
  TEMPLATE_PATH: process.env.TEMPLATE_PATH || path.join(DATA_PATH, 'templates'),
  TEMPLATE_BACKUP_PATH: process.env.TEMPLATE_BACKUP_PATH || path.join(DATA_PATH, 'templates_backup'),
};

// Auto-create directories
export function ensureStorageDirs() {
  const dirs = [STORAGE.UPLOAD_PATH, STORAGE.DOKUMEN_PAKET_PATH, STORAGE.TEMPLATE_PATH, STORAGE.TEMPLATE_BACKUP_PATH];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Initialize on import
ensureStorageDirs();
