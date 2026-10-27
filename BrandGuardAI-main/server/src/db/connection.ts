import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import type { Brand, BrandGuidelines, Audit, ApprovalEvent } from '../types.js';
import {
  SEED_BRANDS,
  SEED_GUIDELINES,
  SEED_AUDITS,
  SEED_APPROVAL_EVENTS,
} from './seedData.js';

let pool: mysql.Pool | null = null;
let dbConnected = false;

// Fallback in-memory store initialized with seed data
export const memoryStore = {
  brands: structuredClone(SEED_BRANDS),
  guidelines: structuredClone(SEED_GUIDELINES),
  audits: structuredClone(SEED_AUDITS),
  approvalEvents: structuredClone(SEED_APPROVAL_EVENTS),
};

export function getPool(): mysql.Pool | null {
  if (!pool) {
    try {
      // Determine SSL configuration for remote production databases
      let sslOptions: mysql.SslOptions | undefined = undefined;
      const isLocal = env.MYSQL_HOST === 'localhost' || env.MYSQL_HOST === '127.0.0.1';
      const sslRequested = env.MYSQL_SSL === 'true' || (env.NODE_ENV === 'production' && !isLocal && env.MYSQL_SSL !== 'false');

      if (sslRequested) {
        let caCert: string | undefined = undefined;
        if (env.MYSQL_SSL_CA) {
          caCert = env.MYSQL_SSL_CA;
        } else if (env.MYSQL_SSL_CA_PATH) {
          try {
            caCert = fs.readFileSync(env.MYSQL_SSL_CA_PATH, 'utf8');
          } catch (readErr: any) {
            console.warn(`[DB] Warning: Could not read CA cert from ${env.MYSQL_SSL_CA_PATH}:`, readErr.message);
          }
        }

        sslOptions = {
          rejectUnauthorized: env.MYSQL_SSL_REJECT_UNAUTHORIZED,
          ...(caCert ? { ca: caCert } : {}),
        };
        console.log(`  🔒 MySQL SSL: Enabled (rejectUnauthorized=${env.MYSQL_SSL_REJECT_UNAUTHORIZED}, caProvided=${Boolean(caCert)})`);
      }

      pool = mysql.createPool({
        host: env.MYSQL_HOST,
        port: env.MYSQL_PORT,
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ...(sslOptions ? { ssl: sslOptions } : {}),
      });
    } catch (err: any) {
      console.warn('[DB] Could not initialize MySQL pool:', err?.message || err);
      pool = null;
    }
  }
  return pool;
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    const p = getPool();
    if (!p) {
      dbConnected = false;
      return false;
    }
    const [rows] = await p.query('SELECT 1 as val');
    dbConnected = Array.isArray(rows) && rows.length > 0;
    return dbConnected;
  } catch (err: any) {
    dbConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return dbConnected;
}
