import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { verifyFirebaseIdToken, isFirebaseConfigured } from './firebase.js';
import type { AuthUser, AuthTokenPayload, UserRole } from './types.js';

const ISSUER = 'brandguard-ai';
const AUDIENCE = 'brandguard-api';

/**
 * Generate a cryptographically signed JWT for a given user.
 */
export function generateAuthToken(user: AuthUser, expiresIn: string = '24h'): string {
  const payload: AuthTokenPayload = {
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, env.AUTH_SECRET, {
    expiresIn: expiresIn as any,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

/**
 * Verify a token (Firebase ID token or cryptographically signed JWT).
 * Throws an error if invalid, forged, or expired.
 */
export async function verifyAuthToken(token: string): Promise<AuthUser> {
  if (!token || typeof token !== 'string') {
    throw new Error('No token provided.');
  }

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();

  // 1. If Firebase Admin is configured, attempt Firebase token verification
  if (isFirebaseConfigured()) {
    const firebaseUser = await verifyFirebaseIdToken(cleanToken);
    if (firebaseUser) {
      return firebaseUser;
    }
  }

  // 2. Cryptographic JWT verification using server secret
  try {
    const decoded = jwt.verify(cleanToken, env.AUTH_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as AuthTokenPayload;

    if (!decoded.uid || !decoded.role) {
      throw new Error('Token payload missing mandatory claims (uid, role).');
    }

    const validRoles: UserRole[] = ['Content Creator', 'Reviewer', 'Administrator'];
    if (!validRoles.includes(decoded.role)) {
      throw new Error(`Invalid role claim '${decoded.role}' in token payload.`);
    }

    return {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@brandguard.ai`,
      name: decoded.name || 'User',
      role: decoded.role,
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired.');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Invalid cryptographic token signature.');
    }
    throw new Error(err.message || 'Token verification failed.');
  }
}
