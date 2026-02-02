/**
 * ASISTEN - Simple API Server
 * For CRUD operations on base entities
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crudRoutes from './routes/crud.routes';

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware - CORS must be before helmet
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' }
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
    database: 'SQLite'
  });
});

// API routes
app.use('/api/v1', crudRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ASISTEN API Server                                         ║
║   Running on http://localhost:${PORT}                          ║
║                                                              ║
║   Endpoints:                                                 ║
║   - GET/POST     /api/v1/pegawai                            ║
║   - POST         /api/v1/pegawai/bulk                       ║
║   - GET/POST     /api/v1/anggaran                           ║
║   - POST         /api/v1/anggaran/bulk                      ║
║   - GET/POST     /api/v1/satker                             ║
║   - GET/POST     /api/v1/perjalanan                         ║
║   - GET/POST     /api/v1/permintaan                         ║
║   - GET/POST     /api/v1/transaksi                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
