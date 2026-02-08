/**
 * ASISTEN - Auth Middleware
 * JWT verification and role-based access control
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token tidak valid atau kadaluarsa' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Tidak terautentikasi' });
  }

  if (!req.user.roles.includes('ADMIN')) {
    return res.status(403).json({ success: false, error: 'Akses ditolak - hanya admin' });
  }

  next();
}

/**
 * Middleware factory: require one or more permissions.
 * Admin role always has all permissions.
 */
export function requirePermission(...requiredPerms: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Tidak terautentikasi' });
    }

    // Admin has all permissions
    if (req.user.roles.includes('ADMIN')) {
      return next();
    }

    const userPerms = req.user.permissions || [];
    // Check if user has wildcard
    if (userPerms.includes('*')) {
      return next();
    }

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPerms.some(perm => {
      if (userPerms.includes(perm)) return true;
      // Check wildcard per resource: "paket:*" matches "paket:read"
      const [resource] = perm.split(':');
      return userPerms.includes(`${resource}:*`);
    });

    if (!hasPermission) {
      return res.status(403).json({ success: false, error: 'Akses ditolak - permission tidak cukup' });
    }

    next();
  };
}
