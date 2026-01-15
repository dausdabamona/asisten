/**
 * ASISTEN - Phase 2: Main Application Entry Point
 * Travel & Treasury Module API Server
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.APP_PORT || 3000;

// =============================================================================
// Middleware
// =============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Simple auth middleware (extract user from header for demo)
app.use((req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    (req as any).userId = userId;
  }
  next();
});

// =============================================================================
// Routes
// =============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    module: 'Travel & Treasury'
  });
});

// API routes
app.use('/api/v1', routes);

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// =============================================================================
// Server Startup
// =============================================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ASISTEN - Phase 2: Travel & Treasury Module                ║
║                                                              ║
║   Server running on port ${PORT}                               ║
║                                                              ║
║   Endpoints:                                                 ║
║   - POST /api/v1/sppd/surat-tugas                           ║
║   - POST /api/v1/sppd/terbit                                ║
║   - POST /api/v1/keuangan/uang-muka                         ║
║   - POST /api/v1/keuangan/rampung                           ║
║   - POST /api/v1/keuangan/spj                               ║
║   - POST /api/v1/workflow/approve                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
