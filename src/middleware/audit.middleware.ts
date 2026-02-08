/**
 * ASISTEN - Audit Logging Utility
 * Logs data changes to audit_log table
 */

import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';

const prisma = new PrismaClient();

interface AuditParams {
  req: AuthRequest;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CHANGE_PASSWORD';
  oldValues?: any;
  newValues?: any;
}

export async function logAudit({ req, tableName, recordId, action, oldValues, newValues }: AuditParams) {
  try {
    await prisma.audit_log.create({
      data: {
        table_name: tableName,
        record_id: recordId,
        action,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        actor_id: req.user?.userId || null,
        ip_address: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
      },
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log:', error);
  }
}
