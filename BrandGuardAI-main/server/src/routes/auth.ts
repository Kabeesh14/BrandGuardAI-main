import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';
import { generateAuthToken } from '../auth/tokenService.js';
import { isFirebaseConfigured } from '../auth/firebase.js';
import { env } from '../config/env.js';
import type { AuthUser, UserRole } from '../auth/types.js';

export const authRouter = Router();

const tokenRequestSchema = z.object({
  role: z.enum(['Content Creator', 'Reviewer', 'Administrator']),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

// GET /api/auth/status
authRouter.get('/auth/status', (_req, res) => {
  const firebaseActive = isFirebaseConfigured();
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    firebaseConfigured: firebaseActive,
    primaryProvider: firebaseActive ? 'Firebase Authentication' : 'Cryptographic JWT Token Engine',
    rolesSupported: ['Content Creator', 'Reviewer', 'Administrator'],
  });
});

// GET /api/auth/me - Verify current session from Bearer token
authRouter.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    user: req.user,
  });
});

// POST /api/auth/token - Obtain signed JWT for authenticated sessions / dev switching
authRouter.post('/auth/token', (req, res) => {
  // In production with Firebase configured, direct token issuance can be restricted
  if (env.NODE_ENV === 'production' && isFirebaseConfigured()) {
    return res.status(403).json({
      error: 'Direct token minting is disabled in production. Authenticate via Firebase Client SDK.',
    });
  }

  const parsed = tokenRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid role payload' });
  }

  const { role, email, name } = parsed.data;
  const defaultNames: Record<UserRole, string> = {
    'Content Creator': 'Alex Chen',
    'Reviewer': 'Jordan Patel',
    'Administrator': 'Morgan Taylor',
  };

  const user: AuthUser = {
    uid: `user-${role.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
    email: email || `${role.toLowerCase().replace(/\s+/g, '.')}@brandguard.ai`,
    name: name || defaultNames[role],
    role: role as UserRole,
  };

  const token = generateAuthToken(user, '24h');

  res.json({
    token,
    user,
    expiresIn: '24h',
  });
});
