/**
 * ASISTEN - API Server with Static File Serving
 * Production-ready server for CRUD operations and frontend serving
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { STORAGE } from './config/storage';
import { getConfig, saveConfig } from './config/appConfig';
import { BUILTIN_ROLES } from './config/permissions';
import crudRoutes from './routes/crud.routes';
import dokumenGeneratorRoutes from './routes/dokumen-generator.routes';
import authRoutes from './routes/auth.routes';
import auditRoutes from './routes/audit.routes';
import hpsRoutes from './routes/hps.routes';
import templateManagerRoutes from './routes/template-manager.routes';
import { verifyToken, requireAdmin } from './middleware/auth.middleware';

const app = express();
const PORT = parseInt(process.env.APP_PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Static files path - frontend dist folder
// In Electron packaged app, use FRONTEND_DIST_PATH env var
const staticPath = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../../frontend/dist');

// Middleware - CORS must be before helmet
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true
}));

// Helmet with relaxed CSP for production static serving
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'SQLite',
    mode: isProduction ? 'production' : 'development'
  });
});

// Storage info endpoint (public - used by frontend settings page)
app.get('/api/v1/storage-info', verifyToken, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      dataPath: STORAGE.DATA_PATH,
      databasePath: STORAGE.DATABASE_PATH,
      uploadPath: STORAGE.UPLOAD_PATH,
    }
  });
});

// Network info endpoint - shows IP addresses for mobile access
app.get('/api/v1/network-info', verifyToken, (_req: Request, res: Response) => {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; ip: string; type: string }[] = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    for (const net of nets) {
      // Skip internal/loopback and IPv6
      if (!net.internal && net.family === 'IPv4') {
        addresses.push({ name, ip: net.address, type: 'IPv4' });
      }
    }
  }

  res.json({
    success: true,
    data: {
      hostname: os.hostname(),
      port: PORT,
      addresses,
      accessUrls: addresses.map(a => `http://${a.ip}:${PORT}`),
    }
  });
});

// App config endpoints (admin only)
app.get('/api/v1/app-config', verifyToken, requireAdmin, (_req: Request, res: Response) => {
  try {
    const config = getConfig();
    res.json({
      success: true,
      data: {
        dataPath: config.dataPath || STORAGE.DATA_PATH,
        currentDataPath: STORAGE.DATA_PATH,
      }
    });
  } catch (error) {
    console.error('[CONFIG] Get config error:', error);
    res.status(500).json({ success: false, error: 'Gagal membaca konfigurasi' });
  }
});

app.put('/api/v1/app-config', verifyToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { dataPath } = req.body;

    if (dataPath) {
      const resolvedPath = path.resolve(dataPath);

      // Auto-create folder if it doesn't exist
      try {
        if (!fs.existsSync(resolvedPath)) {
          fs.mkdirSync(resolvedPath, { recursive: true });
          console.log('[CONFIG] Created directory:', resolvedPath);
        }
      } catch (mkdirErr) {
        return res.status(400).json({ success: false, error: 'Gagal membuat folder: ' + resolvedPath + '. Pastikan drive dan parent folder valid.' });
      }

      // Test writable
      try {
        const testFile = path.join(resolvedPath, '.asisten_test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch {
        return res.status(400).json({ success: false, error: 'Path tidak bisa ditulis (tidak writable)' });
      }

      // Auto-create sub-directories: data (for DB) and uploads
      const dataDir = path.join(resolvedPath, 'data');
      const uploadsDir = path.join(resolvedPath, 'uploads');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const config = getConfig();
      config.dataPath = resolvedPath;
      saveConfig(config);

      res.json({
        success: true,
        message: 'Konfigurasi berhasil disimpan. Restart aplikasi untuk menerapkan perubahan.',
        data: {
          dataPath: resolvedPath,
          dataDir,
          uploadsDir,
        },
      });
    } else {
      // Clear custom dataPath (use default)
      const config = getConfig();
      delete config.dataPath;
      saveConfig(config);

      res.json({
        success: true,
        message: 'Konfigurasi direset ke default. Restart aplikasi untuk menerapkan perubahan.',
      });
    }
  } catch (error) {
    console.error('[CONFIG] Save config error:', error);
    res.status(500).json({ success: false, error: 'Gagal menyimpan konfigurasi' });
  }
});

// Auth routes (PUBLIC - no token required for login)
app.use('/api/v1/auth', authRoutes);

// Protected API routes (require token)
app.use('/api/v1', verifyToken, crudRoutes);
app.use('/api/v1/dokumen-generator', verifyToken, dokumenGeneratorRoutes);
app.use('/api/v1/audit-log', verifyToken, auditRoutes);
app.use('/api/v1/hps', verifyToken, hpsRoutes);
app.use('/api/v1/templates', verifyToken, requireAdmin, templateManagerRoutes);

// Serve static files in production
if (isProduction && fs.existsSync(staticPath)) {
  console.log(`Serving static files from: ${staticPath}`);
  app.use(express.static(staticPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: 'Endpoint not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });
}

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// =============================================================================
// AUTO-INITIALIZATION: Ensure database has roles and admin user on first start
// =============================================================================
async function autoInitDatabase() {
  const prisma = new PrismaClient();
  try {
    // Always ensure all built-in roles exist (upsert)
    const defaultRoles = [
      { kode: 'ADMIN', nama: 'Administrator', deskripsi: 'Full system access', level: 100, permissions: '["*"]' },
      { kode: 'KPA', nama: 'Kuasa Pengguna Anggaran', deskripsi: 'Pejabat pengelola anggaran', level: 90, permissions: '["paket:*","dokumen:*","approval:approve","workflow:transition","keuangan:*","master:read","honorarium:*","sk:*"]' },
      { kode: 'PPK', nama: 'Pejabat Pembuat Komitmen', deskripsi: 'Pejabat pelaksanaan pengadaan', level: 80, permissions: '["paket:*","dokumen:*","approval:approve","workflow:transition","permintaan:*","kepanitiaan:*","hps:*","perjalanan:*","sk:*"]' },
      { kode: 'PPSPM', nama: 'Pejabat Penandatangan SPM', deskripsi: 'Pejabat penandatangan SPM', level: 75, permissions: '["keuangan:*","dokumen:read","paket:read","approval:approve","honorarium:read"]' },
      { kode: 'OPERATOR', nama: 'Operator', deskripsi: 'Operator data entry', level: 20, permissions: '["paket:read","paket:create","paket:update","dokumen:read","dokumen:create","dokumen:update","dokumen:export","permintaan:read","permintaan:create","permintaan:update","perjalanan:read","perjalanan:create","perjalanan:update","master:read","master:create","master:update","hps:read","hps:create","hps:update","kepanitiaan:read","kepanitiaan:create","kepanitiaan:update","honorarium:read","honorarium:create","honorarium:update","sk:read","sk:create","sk:update","keuangan:read","keuangan:create"]' },
    ];

    let rolesCreated = 0;
    for (const role of defaultRoles) {
      const existing = await prisma.roles.findUnique({ where: { kode: role.kode } });
      if (!existing) {
        await prisma.roles.create({ data: role });
        rolesCreated++;
      }
    }
    if (rolesCreated > 0) {
      console.log(`[INIT] Created ${rolesCreated} missing built-in roles`);
    }

    // Check if admin user exists
    const userCount = await prisma.users.count();
    if (userCount === 0) {
      console.log('[INIT] No users found - creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const adminUser = await prisma.users.create({
        data: {
          username: 'admin',
          email: 'admin@asisten.local',
          password: hashedPassword,
          is_active: true,
        },
      });

      const adminRole = await prisma.roles.findUnique({ where: { kode: 'ADMIN' } });
      if (adminRole) {
        await prisma.user_roles.create({
          data: { user_id: adminUser.id, role_id: adminRole.id },
        });
      }
      console.log('[INIT] Admin user created (admin/admin123)');
    }

    // Seed workflow stages if missing
    const stageCount = await prisma.workflow_stage.count();
    if (stageCount === 0) {
      console.log('[INIT] Seeding workflow stages...');
      const stages = [
        { kode: 'PERENCANAAN', nama: 'Perencanaan', deskripsi: 'Tahap perencanaan', urutan: 1, is_initial: true, is_final: false },
        { kode: 'PERSIAPAN', nama: 'Persiapan', deskripsi: 'Tahap persiapan', urutan: 2, is_initial: false, is_final: false },
        { kode: 'KONTRAK', nama: 'Kontrak', deskripsi: 'Tahap kontrak', urutan: 3, is_initial: false, is_final: false },
        { kode: 'PELAKSANAAN', nama: 'Pelaksanaan', deskripsi: 'Tahap pelaksanaan', urutan: 4, is_initial: false, is_final: false },
        { kode: 'PEMBAYARAN', nama: 'Pembayaran', deskripsi: 'Tahap pembayaran', urutan: 5, is_initial: false, is_final: false },
        { kode: 'ARSIP', nama: 'Arsip', deskripsi: 'Tahap pengarsipan', urutan: 6, is_initial: false, is_final: true },
      ];
      for (const stage of stages) {
        await prisma.workflow_stage.upsert({ where: { kode: stage.kode }, update: {}, create: stage });
      }
      console.log(`[INIT] Created ${stages.length} workflow stages`);
    }

    console.log('[INIT] Database initialization complete');
  } catch (error: any) {
    // If tables don't exist yet, Prisma will throw - user needs to run migration
    if (error.code === 'P2021' || error.message?.includes('table') || error.message?.includes('does not exist')) {
      console.error('[INIT] Database tables not found. Running prisma db push...');
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma db push --skip-generate', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
          env: { ...process.env },
        });
        console.log('[INIT] Database schema pushed. Retrying initialization...');
        // Retry initialization after creating tables
        await autoInitDatabase();
      } catch (pushErr) {
        console.error('[INIT] Failed to auto-create database. Please run: npx prisma db push');
      }
    } else {
      console.error('[INIT] Database initialization error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run auto-init before starting server
autoInitDatabase().then(() => {
  startServer();
}).catch(() => {
  startServer();
});

function startServer() {
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ASISTEN Server v2.0.0                                      ║
║   Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}                                        ║
║   Running on http://${HOST}:${PORT}                            ║
║   Storage: ${STORAGE.DATA_PATH}
║                                                              ║
║   Auth: POST /api/v1/auth/login                              ║
║   All other routes require Bearer token                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    if (isProduction) {
      console.log(`\n  Frontend: http://localhost:${PORT}\n`);
    }
  });
}

export default app;
