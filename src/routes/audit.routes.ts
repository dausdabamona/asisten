/**
 * ASISTEN - Audit Log Routes
 * GET /audit-log - paginated, filterable (admin only)
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /audit-log
router.get('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.table_name) {
      where.table_name = req.query.table_name as string;
    }

    if (req.query.action) {
      where.action = req.query.action as string;
    }

    if (req.query.actor_id) {
      where.actor_id = req.query.actor_id as string;
    }

    if (req.query.start_date || req.query.end_date) {
      where.created_at = {};
      if (req.query.start_date) {
        where.created_at.gte = new Date(req.query.start_date as string);
      }
      if (req.query.end_date) {
        where.created_at.lte = new Date(req.query.end_date as string);
      }
    }

    const [data, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.audit_log.count({ where }),
    ]);

    // Fetch actor usernames
    const actorIds = [...new Set(data.filter((d) => d.actor_id).map((d) => d.actor_id!))];
    const actors = actorIds.length > 0
      ? await prisma.users.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, username: true },
        })
      : [];
    const actorMap = new Map(actors.map((a) => [a.id, a.username]));

    const enrichedData = data.map((d) => ({
      ...d,
      actor_name: d.actor_id ? actorMap.get(d.actor_id) || 'Unknown' : 'System',
    }));

    res.json({
      success: true,
      data: enrichedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[AUDIT] Get audit log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
