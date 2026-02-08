/**
 * ASISTEN - Auth Types
 */

import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
