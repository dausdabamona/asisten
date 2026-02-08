/**
 * ASISTEN - Auth Routes
 * POST /auth/login, GET /auth/me, PUT /auth/change-password, POST /auth/logout
 * User Management (admin): GET/POST /auth/users, PUT/DELETE /auth/users/:id, GET /auth/roles
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types/auth';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';
import { logAudit } from '../middleware/audit.middleware';
import { BUILTIN_ROLES } from '../config/permissions';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
    }

    const user = await prisma.users.findFirst({
      where: { username, is_deleted: false, is_active: true },
      include: {
        user_roles: {
          where: { is_deleted: false },
          include: { role: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' });
    }

    const roles = user.user_roles.map((ur) => ur.role.kode);

    // Aggregate permissions from all roles
    const allPermissions = new Set<string>();
    for (const ur of user.user_roles) {
      try {
        const perms = JSON.parse(ur.role.permissions || '[]');
        if (Array.isArray(perms)) {
          perms.forEach((p: string) => allPermissions.add(p));
        }
      } catch {
        // ignore parse errors
      }
    }
    const permissions = Array.from(allPermissions);

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      roles,
      permissions,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    // Update last_login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Log audit
    await logAudit({
      req,
      tableName: 'users',
      recordId: user.id,
      action: 'LOGIN',
      newValues: { username: user.username, device: req.headers['user-agent'] },
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roles,
          permissions,
        },
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Login error:', error);
    // Give a meaningful error if database tables don't exist
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return res.status(503).json({
        success: false,
        error: 'Database belum diinisialisasi. Silakan restart server.',
      });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /auth/me - Get current user info
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        email: true,
        last_login: true,
        created_at: true,
        user_roles: {
          where: { is_deleted: false },
          include: { role: { select: { kode: true, nama: true, level: true, permissions: true } } },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    // Aggregate permissions from all roles
    const allPermissions = new Set<string>();
    for (const ur of user.user_roles) {
      try {
        const perms = JSON.parse(ur.role.permissions || '[]');
        if (Array.isArray(perms)) {
          perms.forEach((p: string) => allPermissions.add(p));
        }
      } catch {
        // ignore
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        roles: user.user_roles.map((ur) => ur.role.kode),
        roleNames: user.user_roles.map((ur) => ur.role.nama),
        permissions: Array.from(allPermissions),
      },
    });
  } catch (error) {
    console.error('[AUTH] Get me error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /auth/change-password
router.put('/change-password', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Password lama dan baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.users.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Password lama salah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await logAudit({
      req,
      tableName: 'users',
      recordId: user.id,
      action: 'CHANGE_PASSWORD',
    });

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('[AUTH] Change password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /auth/logout
router.post('/logout', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    await logAudit({
      req,
      tableName: 'users',
      recordId: req.user!.userId,
      action: 'LOGOUT',
    });

    res.json({ success: true, message: 'Berhasil logout' });
  } catch (error) {
    res.json({ success: true, message: 'Berhasil logout' });
  }
});

// ==================== User Management (Admin Only) ====================

// GET /auth/users - List all users with roles
router.get('/users', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.users.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        username: true,
        email: true,
        is_active: true,
        last_login: true,
        created_at: true,
        user_roles: {
          where: { is_deleted: false },
          include: { role: { select: { id: true, kode: true, nama: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = users.map((u) => ({
      ...u,
      roles: u.user_roles.map((ur) => ur.role),
      user_roles: undefined,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AUTH] List users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /auth/users - Create new user
router.post('/users', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, roleIds } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password minimal 6 karakter' });
    }

    // Check duplicate username
    const existing = await prisma.users.findFirst({
      where: { username, is_deleted: false },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        is_active: true,
        is_deleted: false,
        ...(roleIds && roleIds.length > 0
          ? {
              user_roles: {
                create: roleIds.map((roleId: string) => ({
                  role_id: roleId,
                  is_deleted: false,
                })),
              },
            }
          : {}),
      },
      include: {
        user_roles: {
          where: { is_deleted: false },
          include: { role: { select: { id: true, kode: true, nama: true } } },
        },
      },
    });

    await logAudit({
      req,
      tableName: 'users',
      recordId: user.id,
      action: 'INSERT',
      newValues: { username, email, roles: roleIds },
    });

    res.json({
      success: true,
      data: {
        ...user,
        password: undefined,
        roles: user.user_roles.map((ur) => ur.role),
        user_roles: undefined,
      },
    });
  } catch (error) {
    console.error('[AUTH] Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /auth/users/:id - Update user (username, email, is_active, roles)
router.put('/users/:id', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, is_active, roleIds } = req.body;

    const user = await prisma.users.findFirst({
      where: { id, is_deleted: false },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    // Check duplicate username (exclude current user)
    if (username && username !== user.username) {
      const existing = await prisma.users.findFirst({
        where: { username, is_deleted: false, NOT: { id } },
      });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Username sudah digunakan' });
      }
    }

    // Update user
    await prisma.users.update({
      where: { id },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
      },
    });

    // Update roles if provided
    if (roleIds !== undefined) {
      // Soft-delete existing roles
      await prisma.user_roles.updateMany({
        where: { user_id: id, is_deleted: false },
        data: { is_deleted: true },
      });

      // Create new roles
      if (roleIds.length > 0) {
        await prisma.user_roles.createMany({
          data: roleIds.map((roleId: string) => ({
            user_id: id,
            role_id: roleId,
            is_deleted: false,
          })),
        });
      }
    }

    await logAudit({
      req,
      tableName: 'users',
      recordId: id,
      action: 'UPDATE',
      newValues: { username, email, is_active, roleIds },
    });

    // Fetch updated user
    const updated = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        is_active: true,
        last_login: true,
        created_at: true,
        user_roles: {
          where: { is_deleted: false },
          include: { role: { select: { id: true, kode: true, nama: true } } },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        roles: updated?.user_roles.map((ur) => ur.role),
        user_roles: undefined,
      },
    });
  } catch (error) {
    console.error('[AUTH] Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /auth/users/:id/reset-password - Admin reset user password
router.put('/users/:id/reset-password', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.users.findFirst({
      where: { id, is_deleted: false },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await logAudit({
      req,
      tableName: 'users',
      recordId: id,
      action: 'CHANGE_PASSWORD',
    });

    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (error) {
    console.error('[AUTH] Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /auth/users/:id - Soft delete user
router.delete('/users/:id', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user!.userId) {
      return res.status(400).json({ success: false, error: 'Tidak bisa menghapus akun sendiri' });
    }

    const user = await prisma.users.findFirst({
      where: { id, is_deleted: false },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    await prisma.users.update({
      where: { id },
      data: { is_deleted: true, is_active: false },
    });

    await logAudit({
      req,
      tableName: 'users',
      recordId: id,
      action: 'DELETE',
      newValues: { username: user.username },
    });

    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('[AUTH] Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==================== Role List (Built-in roles only) ====================

// GET /auth/roles - List built-in roles for user management
router.get('/roles', verifyToken, async (_req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.roles.findMany({
      where: { is_deleted: false, kode: { in: BUILTIN_ROLES } },
      orderBy: { level: 'desc' },
    });

    const result = roles.map(r => ({
      id: r.id,
      kode: r.kode,
      nama: r.nama,
      deskripsi: r.deskripsi,
      level: r.level,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AUTH] List roles error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
