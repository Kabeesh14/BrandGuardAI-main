import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';
import { env } from '../config/env.js';
import type { AuthUser, UserRole } from './types.js';

let firebaseInitialized = false;

export function initializeFirebase(): boolean {
  if (firebaseInitialized) return true;

  try {
    if (getApps().length > 0) {
      firebaseInitialized = true;
      return true;
    }

    // Option 1: Service Account JSON path
    if (env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      const serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      });
      firebaseInitialized = true;
      console.log('  🔥 Firebase Auth Admin initialized with Service Account JSON file');
      return true;
    }

    // Option 2: Individual env credentials
    if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
      firebaseInitialized = true;
      console.log('  🔥 Firebase Auth Admin initialized with environment credentials');
      return true;
    }

    // Option 3: Default application credentials or project ID only
    if (env.FIREBASE_PROJECT_ID) {
      initializeApp({
        projectId: env.FIREBASE_PROJECT_ID,
      });
      firebaseInitialized = true;
      console.log(`  🔥 Firebase Auth Admin initialized with Project ID: ${env.FIREBASE_PROJECT_ID}`);
      return true;
    }

    return false;
  } catch (err: any) {
    console.warn('  ⚠️ Firebase Admin initialization failed:', err?.message || err);
    return false;
  }
}

export function isFirebaseConfigured(): boolean {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return firebaseInitialized;
}

/**
 * Verify a Firebase ID token. Returns user profile with verified role.
 */
export async function verifyFirebaseIdToken(token: string): Promise<AuthUser | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Map custom claims or determine role
    const rawRole = (decodedToken.role || decodedToken.user_role) as string;
    let role: UserRole = 'Content Creator';

    if (rawRole === 'Administrator' || rawRole === 'admin') {
      role = 'Administrator';
    } else if (rawRole === 'Reviewer' || rawRole === 'compliance') {
      role = 'Reviewer';
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || `${decodedToken.uid}@brandguard.ai`,
      name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Firebase User'),
      role,
    };
  } catch (err) {
    return null;
  }
}
